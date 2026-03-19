import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCount } from '../../context/NotificationCountContext';
import IncomingInviteToast from '../cineMatch/IncomingInviteToast';
import { playHapticClick } from '../../utils/hapticSound';
import { apiRoutes } from '../../api/client';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function RealtimeCineMatchBridge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUnreadCount, setUnreadCount } = useNotificationCount();
  const [inviteToast, setInviteToast] = useState(null);

  const dismissInviteToast = useCallback(() => {
    setInviteToast(null);
  }, []);

  const handleJoinFromToast = useCallback(async () => {
    if (!inviteToast?.fromUserId) {
      dismissInviteToast();
      return;
    }
    try {
      await apiRoutes.cineMatch.acceptInvite(inviteToast.fromUserId);
      if (inviteToast.notificationId) {
        await apiRoutes.users.markNotificationRead(inviteToast.notificationId);
      }
      refreshUnreadCount();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
    dismissInviteToast();
  }, [inviteToast, dismissInviteToast, refreshUnreadCount, navigate]);

  /** Dismiss toast only — keep invite unread so bell + dropdown still show Join. */
  const handleLater = useCallback(() => {
    dismissInviteToast();
  }, [dismissInviteToast]);

  useEffect(() => {
    if (!user) {
      setInviteToast(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(BASE, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      refreshUnreadCount();
    });

    socket.on('notification:new', (payload) => {
      playHapticClick();
      const n = payload?.notification;
      const count = payload?.unreadCount;
      if (typeof count === 'number') setUnreadCount(count);
      else refreshUnreadCount();

      if (n?.type === 'CINE_MATCH_INVITE') {
        setInviteToast({
          notificationId: n.id,
          fromUserId: n.fromUserId,
          fromUser: n.fromUser,
          message: n.message,
        });
      }
    });

    socket.on('notifications:refresh', (payload) => {
      if (typeof payload?.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      } else {
        refreshUnreadCount();
      }
    });

    socket.on('cine_match:partner_joined', (payload) => {
      refreshUnreadCount();
      window.dispatchEvent(
        new CustomEvent('cine_match:partner_joined', { detail: payload })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user, refreshUnreadCount, setUnreadCount]);

  /** If WebSocket misses an event, bell still updates within ~30s */
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => refreshUnreadCount(), 30000);
    return () => clearInterval(t);
  }, [user, refreshUnreadCount]);

  return (
    <IncomingInviteToast
      open={!!inviteToast}
      notification={inviteToast}
      onJoin={handleJoinFromToast}
      onLater={handleLater}
    />
  );
}

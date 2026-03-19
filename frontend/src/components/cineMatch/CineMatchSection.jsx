import { useState, useEffect, useCallback } from 'react';
import CineMatchStack from './CineMatchStack';
import FriendSelector from './FriendSelector';
import { apiRoutes } from '../../api/client';
import { useToast } from '../ui/ToastProvider';
import './CineMatch.css';

const PARTNER_POLL_INTERVAL = 3000;

export default function CineMatchSection() {
  const { showToast } = useToast();
  const [friends, setFriends] = useState([]);
  const [friendId, setFriendId] = useState(null);
  const [soloMode, setSoloMode] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState(null); // 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  const [sessionId, setSessionId] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  const selectedFriend = friends.find(
    (f) => Number(f.id) === Number(friendId)
  );

  const fetchFriends = useCallback(() => {
    apiRoutes.cineMatch
      .friends()
      .then((res) => setFriends(res.data ?? []))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  const fetchPendingInvites = useCallback(() => {
    apiRoutes.cineMatch
      .invitesPending()
      .then((res) => setPendingInvites(res.data ?? []))
      .catch(() => setPendingInvites([]));
  }, []);

  const fetchPartnerStatus = useCallback((fid) => {
    if (!fid) {
      setPartnerStatus(null);
      setSessionId(null);
      return;
    }
    apiRoutes.cineMatch
      .partnerStatus(fid)
      .then((res) => {
        const st = res.status ?? 'none';
        setPartnerStatus(st);
        setSessionId(st === 'accepted' ? res.sessionId ?? null : null);
      })
      .catch(() => {
        setPartnerStatus('none');
        setSessionId(null);
      });
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchPendingInvites();
  }, [fetchFriends, fetchPendingInvites]);

  /** Recipient: show pending invite banner even if realtime missed */
  useEffect(() => {
    const t = setInterval(fetchPendingInvites, 20000);
    return () => clearInterval(t);
  }, [fetchPendingInvites]);

  /** Restore active session after refresh (same session_id for both users). */
  useEffect(() => {
    apiRoutes.cineMatch
      .activeSession()
      .then((r) => {
        const s = r.session;
        if (!s?.id) return;
        setSessionId(s.id);
        setSoloMode(false);
        if (s.partnerId) setFriendId(s.partnerId);
        setPartnerStatus('accepted');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (soloMode || !friendId) {
      setPartnerStatus(null);
      return;
    }
    fetchPartnerStatus(friendId);
  }, [friendId, soloMode, fetchPartnerStatus]);

  // Poll partner status when waiting for them to join
  useEffect(() => {
    if (partnerStatus !== 'pending_sent' || !friendId) return;
    const t = setInterval(() => fetchPartnerStatus(friendId), PARTNER_POLL_INTERVAL);
    return () => clearInterval(t);
  }, [partnerStatus, friendId, fetchPartnerStatus]);

  /** Inviter: partner accepted — socket updates UI immediately (same session_id). */
  useEffect(() => {
    const onJoined = (e) => {
      const { partnerId, sessionId: sid } = e.detail || {};
      if (friendId && partnerId === friendId) {
        setPartnerStatus('accepted');
        if (sid) setSessionId(sid);
      }
    };
    window.addEventListener('cine_match:partner_joined', onJoined);
    return () => window.removeEventListener('cine_match:partner_joined', onJoined);
  }, [friendId]);

  const handleSendInvite = async (toUserId) => {
    const id = Number(toUserId);
    if (Number.isNaN(id)) {
      showToast('Invalid friend selected.', 'error');
      return;
    }
    setSendingInvite(true);
    try {
      await apiRoutes.cineMatch.invite(id);
      setPartnerStatus('pending_sent');
      fetchPartnerStatus(id);
      const name =
        friends.find((f) => Number(f.id) === id)?.name || 'Your friend';
      showToast(`Invite sent! ${name} will get a notification.`);
    } catch (err) {
      console.error('Invite failed', err);
      const msg =
        err?.message ||
        'Could not send invite. You must have an accepted follow with them (either direction).';
      showToast(msg, 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (fromUserId) => {
    try {
      const res = await apiRoutes.cineMatch.acceptInvite(fromUserId);
      setPendingInvites((prev) => prev.filter((i) => i.fromUserId !== fromUserId));
      setFriendId(fromUserId);
      setSoloMode(false);
      setPartnerStatus('accepted');
      setSessionId(res.sessionId ?? null);
    } catch (err) {
      console.error('Accept failed', err);
    }
  };

  const matchWithLabel = soloMode
    ? 'Solo Mode'
    : loadingFriends
      ? 'Loading connections…'
      : !friends.length
        ? 'Add connections via Discover to invite someone'
        : selectedFriend && (partnerStatus === 'accepted' || partnerStatus === 'pending_sent')
          ? `Matching with ${selectedFriend.name}`
          : selectedFriend
            ? partnerStatus === 'pending_received'
              ? `${selectedFriend.name} invited you — tap Join above`
              : 'Tap Send Invite to notify them'
            : 'Select a partner';

  return (
    <section className="cine-match-section">
      <div className="cine-match-header">
        <h2 className="cine-match-heading">Cine-Match</h2>
        <p className="cine-match-desc">Swipe to find a movie to watch together with a friend.</p>

        <FriendSelector
          friends={friends}
          loadingFriends={loadingFriends}
          selectedFriendId={soloMode ? null : friendId}
          onSelectFriend={setFriendId}
          soloMode={soloMode}
          onSoloModeChange={setSoloMode}
          partnerStatus={partnerStatus}
          onSendInvite={handleSendInvite}
          sendingInvite={sendingInvite}
          pendingInvites={pendingInvites}
          onAcceptInvite={handleAcceptInvite}
        />

        <p className="cine-match-matching-label">{matchWithLabel}</p>
      </div>

      <CineMatchStack
        friendId={soloMode ? null : friendId}
        friends={friends}
        selectedFriend={selectedFriend}
        partnerStatus={partnerStatus}
        sessionId={sessionId}
      />
    </section>
  );
}

import { useState, useEffect, useCallback } from 'react';
import CineMatchStack from './CineMatchStack';
import FriendSelector from './FriendSelector';
import { apiRoutes } from '../../api/client';
import './CineMatch.css';

const PARTNER_POLL_INTERVAL = 3000;

export default function CineMatchSection() {
  const [friends, setFriends] = useState([]);
  const [friendId, setFriendId] = useState(null);
  const [soloMode, setSoloMode] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState(null); // 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  const selectedFriend = friends.find((f) => f.id === friendId);

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

  const fetchPartnerStatus = useCallback(
    (fid) => {
      if (!fid) {
        setPartnerStatus(null);
        return;
      }
      apiRoutes.cineMatch
        .partnerStatus(fid)
        .then((res) => setPartnerStatus(res.status ?? 'none'))
        .catch(() => setPartnerStatus('none'));
    },
    []
  );

  useEffect(() => {
    fetchFriends();
    fetchPendingInvites();
  }, [fetchFriends, fetchPendingInvites]);

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

  const handleSendInvite = async (toUserId) => {
    setSendingInvite(true);
    try {
      await apiRoutes.cineMatch.invite(toUserId);
      setPartnerStatus('pending_sent');
    } catch (err) {
      console.error('Invite failed', err);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (fromUserId) => {
    try {
      await apiRoutes.cineMatch.acceptInvite(fromUserId);
      setPendingInvites((prev) => prev.filter((i) => i.fromUserId !== fromUserId));
      setFriendId(fromUserId);
      setSoloMode(false);
      setPartnerStatus('accepted');
    } catch (err) {
      console.error('Accept failed', err);
    }
  };

  const matchWithLabel = soloMode
    ? 'Solo Mode'
    : selectedFriend && (partnerStatus === 'accepted' || partnerStatus === 'pending_sent')
      ? `Matching with ${selectedFriend.name}`
      : selectedFriend
        ? 'Select partner & send invite'
        : 'Select a partner';

  return (
    <section className="cine-match-section">
      <div className="cine-match-header">
        <h2 className="cine-match-heading">Cine-Match</h2>
        <p className="cine-match-desc">Swipe to find a movie to watch together with a friend.</p>

        <FriendSelector
          friends={friends}
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
      />
    </section>
  );
}

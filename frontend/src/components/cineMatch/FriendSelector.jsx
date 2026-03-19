import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, UserPlusIcon } from 'lucide-react';

export default function FriendSelector({
  friends,
  selectedFriendId,
  onSelectFriend,
  soloMode,
  onSoloModeChange,
  partnerStatus,
  onSendInvite,
  sendingInvite,
  pendingInvites,
  onAcceptInvite,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);
  const filteredFriends = search.trim()
    ? friends.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : friends;

  return (
    <div className="cine-match-selector">
      <div className="cine-match-selector-row">
        {/* Solo Mode toggle */}
        <button
          type="button"
          className={`cine-match-selector-item cine-match-solo-toggle ${soloMode ? 'active' : ''}`}
          onClick={() => onSoloModeChange(!soloMode)}
          title="Solo Mode"
        >
          <span className="cine-match-solo-label">Solo</span>
        </button>

        {/* Scrollable avatars */}
        <div className="cine-match-selector-avatars">
          {friends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              className={`cine-match-selector-avatar ${selectedFriendId === friend.id && !soloMode ? 'active' : ''}`}
              onClick={() => {
                onSoloModeChange(false);
                onSelectFriend(friend.id);
                setDropdownOpen(false);
              }}
              title={friend.name}
            >
              {friend.avatarUrl ? (
                <img src={friend.avatarUrl} alt={friend.name} />
              ) : (
                <span>{friend.name?.slice(0, 2)?.toUpperCase() ?? '?'}</span>
              )}
            </button>
          ))}
        </div>

        {/* Plus: open dropdown to search/select friend */}
        <div className="cine-match-selector-plus-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="cine-match-selector-plus"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Find or select friend"
          >
            <PlusIcon size={22} />
          </button>
          {dropdownOpen && (
            <div className="cine-match-selector-dropdown">
              <input
                type="text"
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cine-match-selector-search"
              />
              <div className="cine-match-selector-dropdown-list">
                {filteredFriends.length === 0 ? (
                  <p className="cine-match-selector-dropdown-empty">No friends found</p>
                ) : (
                  filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      className="cine-match-selector-dropdown-item"
                      onClick={() => {
                        onSoloModeChange(false);
                        onSelectFriend(friend.id);
                        setDropdownOpen(false);
                        setSearch('');
                      }}
                    >
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt="" />
                      ) : (
                        <span>{friend.name?.slice(0, 2)?.toUpperCase()}</span>
                      )}
                      <span>{friend.name}</span>
                    </button>
                  ))
                )}
              </div>
              <Link
                to="/discover"
                className="cine-match-selector-find-more"
                onClick={() => setDropdownOpen(false)}
              >
                <UserPlusIcon size={16} />
                Find more friends
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pending invites I received: accept prompt */}
      {pendingInvites.length > 0 && (
        <div className="cine-match-pending-received">
          {pendingInvites.map((inv) => (
            <div key={inv.fromUserId} className="cine-match-invite-banner">
              <span>{inv.user?.name} wants to Cine-Match with you.</span>
              <button
                type="button"
                className="cine-match-invite-accept-btn"
                onClick={() => onAcceptInvite(inv.fromUserId)}
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Invite when friend selected and status is 'none' */}
      {selectedFriendId && !soloMode && partnerStatus === 'none' && selectedFriend && (
        <div className="cine-match-send-invite-wrap">
          <button
            type="button"
            className="cine-match-send-invite-btn"
            onClick={() => onSendInvite(selectedFriendId)}
            disabled={sendingInvite}
          >
            {sendingInvite ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      )}
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';

/**
 * Top-right glassmorphic toast for incoming Cine-Match invites (real-time).
 */
export default function IncomingInviteToast({ open, notification, onJoin, onLater }) {
  if (!open || !notification) return null;

  const name = notification.fromUser?.name || 'Someone';

  const handleJoin = () => {
    onJoin?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="incoming-invite-toast-wrap"
          initial={{ opacity: 0, x: 80, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        >
          <div className="incoming-invite-toast">
            <div className="incoming-invite-toast-glow" aria-hidden />
            <SparklesIcon className="incoming-invite-toast-icon" size={18} />
            <p className="incoming-invite-toast-title">Incoming Match Invite</p>
            <p className="incoming-invite-toast-body">
              <span className="font-bold text-white">{name}</span> wants to match movies with you!
            </p>
            <div className="incoming-invite-toast-actions">
              <button type="button" className="incoming-invite-btn primary" onClick={handleJoin}>
                Join Now
              </button>
              <button type="button" className="incoming-invite-btn ghost" onClick={onLater}>
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

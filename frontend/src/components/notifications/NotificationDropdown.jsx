import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon, BellIcon, UserIcon, HeartIcon, MessageCircleIcon } from 'lucide-react';
import { apiRoutes } from '../../api/client';
import { useToast } from '../ui/ToastProvider';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      const res = await apiRoutes.users.getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleAction = async (id, action, requesterId) => {
    try {
      await apiRoutes.users.followAction(requesterId, action);
      showToast(action === 'accept' ? 'Follow request accepted!' : 'Follow request declined.');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      showToast('Failed to process request.', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await apiRoutes.users.markNotificationsRead();
      setNotifications([]);
      showToast('All notifications cleared.');
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-2 w-80 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[1000] overflow-hidden"
    >
      <div className="p-4 border-bottom border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BellIcon size={16} className="text-blue-400" />
          Notifications
        </h3>
        {notifications.length > 0 && (
          <button 
            onClick={markAllRead}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-height-[400px] overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellIcon size={20} className="text-slate-500" />
              </div>
              <p className="text-xs text-slate-400">All caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 border-bottom border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                    {n.fromUser?.avatarUrl ? (
                      <img src={n.fromUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-bold text-white">{n.fromUser?.name || 'Someone'}</span> {n.message.replace(n.fromUser?.name || '', '').trim()}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                    
                    {n.type === 'FOLLOW_REQUEST' && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => handleAction(n.id, 'accept', n.fromUserId)}
                          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-lg shadow-blue-900/20"
                        >
                          <CheckIcon size={12} /> Accept
                        </button>
                        <button 
                          onClick={() => handleAction(n.id, 'decline', n.fromUserId)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <XIcon size={12} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {notifications.length > 5 && (
        <div className="p-3 text-center border-t border-white/5 bg-white/[0.01]">
          <button className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
            View All Activity
          </button>
        </div>
      )}
    </motion.div>
  );
}

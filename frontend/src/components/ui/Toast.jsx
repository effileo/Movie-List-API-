import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, XIcon } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  const icon = type === 'success' ? 
    <CheckCircleIcon className="text-emerald-400" size={20} /> : 
    <XCircleIcon className="text-rose-400" size={20} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] min-w-[300px] pointer-events-auto"
    >
      <div className="flex-shrink-0">{icon}</div>
      <p className="flex-grow text-sm font-medium text-slate-100">{message}</p>
      <button 
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
      >
        <XIcon size={16} />
      </button>
    </motion.div>
  );
}

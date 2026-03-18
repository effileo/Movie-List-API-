import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, XIcon } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  const icon = type === 'success' ? 
    <CheckCircleIcon className="text-emerald-400" size={20} /> : 
    <XCircleIcon className="text-rose-400" size={20} />;

  const glowClass = type === 'success' ? 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'shadow-[0_0_20px_rgba(244,63,94,0.2)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 ${glowClass} min-w-[300px] pointer-events-auto`}
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

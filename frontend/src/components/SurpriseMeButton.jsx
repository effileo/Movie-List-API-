import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DicesIcon, SparklesIcon } from 'lucide-react';
import { apiRoutes } from '../api/client';

export default function SurpriseMeButton({ onSurpriseResult }) {
  const [isRolling, setIsRolling] = useState(false);

  const handleSurprise = async () => {
    setIsRolling(true);
    try {
      // Artificial delay for the 'slot machine' suspense effect
      const [res] = await Promise.all([
        apiRoutes.users.surpriseMe(),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      onSurpriseResult(res);
    } catch (err) {
      console.error("Surprise failed:", err);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSurprise}
      disabled={isRolling}
      className={`
        relative px-6 py-3 rounded-full font-bold tracking-wide flex items-center gap-2 overflow-hidden
        bg-white/5 border border-white/10 hover:bg-white/10 transition-colors
        ${isRolling ? 'cursor-wait' : 'cursor-pointer'}
      `}
    >
      {/* Background gradient sweep effect */}
      <motion.div
        animate={isRolling ? { x: ["-100%", "200%"] } : { x: "-100%" }}
        transition={isRolling ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent z-0"
      />
      
      <div className="relative z-10 flex items-center gap-2 text-[#e2e8f0]">
        <motion.div
          animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
          transition={isRolling ? { repeat: Infinity, duration: 0.4, ease: "linear" } : { duration: 0.3 }}
        >
          {isRolling ? <SparklesIcon className="w-5 h-5 text-purple-400" /> : <DicesIcon className="w-5 h-5 text-purple-400" />}
        </motion.div>
        {isRolling ? "Rolling..." : "Surprise Me"}
      </div>
    </motion.button>
  );
}

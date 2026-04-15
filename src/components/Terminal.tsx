import React from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, Layers, Activity, Cpu, Type } from 'lucide-react';
import { AnalysisResult } from '../types';

interface TerminalProps {
  data: AnalysisResult | null;
  isLoading: boolean;
  onActionChange: (newAction: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ data, isLoading, onActionChange }) => {
  if (isLoading) {
    return (
      <div className="analysis-card min-h-[200px] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="font-mono text-[10px] text-accent animate-pulse">DECODING NEURAL STREAM...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analysis-card min-h-[200px] flex flex-col items-center justify-center text-text-dim border-dashed">
        <TerminalIcon size={24} className="mb-2 opacity-20" />
        <div className="font-mono text-[10px] uppercase tracking-widest">Awaiting Input Stream</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="analysis-card"
      >
        <div className="text-[10px] text-accent uppercase mb-2 font-bold flex items-center gap-2">
          <Layers size={12} />
          Environment Identity
        </div>
        <div className="text-[13px] leading-relaxed text-text-main">
          {data.scene}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="analysis-card"
      >
        <div className="text-[10px] text-accent uppercase mb-2 font-bold flex items-center gap-2">
          <Activity size={12} />
          Physical Mechanics
        </div>
        <textarea 
          value={data.action}
          onChange={(e) => onActionChange(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-[13px] leading-relaxed italic text-zinc-400 resize-none p-0 h-20"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="analysis-card"
      >
        <div className="text-[10px] text-accent uppercase mb-2 font-bold flex items-center gap-2">
          <Cpu size={12} />
          Style Transfer Parameters
        </div>
        <div className="text-[13px] leading-relaxed text-text-main">
          {data.style}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="analysis-card"
      >
        <div className="text-[10px] text-accent uppercase mb-2 font-bold flex items-center gap-2">
          <Type size={12} />
          Character Identity
        </div>
        <div className="text-[13px] leading-relaxed text-text-main">
          {data.characterDescription}
        </div>
      </motion.div>
    </div>
  );
};

export default Terminal;

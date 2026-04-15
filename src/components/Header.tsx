import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="px-10 py-6 border-b border-border flex justify-between items-center shrink-0 bg-bg">
      <div className="font-mono font-black text-xl tracking-tighter uppercase text-accent">
        STAR LABS // STUDIO v2.5
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] px-3 py-1 border border-accent rounded-full text-accent flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
        Neural Pipeline Active
      </div>
    </header>
  );
};

export default Header;

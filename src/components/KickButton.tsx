import React, { useState } from 'react';

interface KickButtonProps {
  onKickChange: (isKicking: boolean) => void;
  keyboardActive?: boolean;
}

export const KickButton: React.FC<KickButtonProps> = ({ onKickChange, keyboardActive }) => {
  const [isPressed, setIsPressed] = useState(false);

  const activeState = isPressed || keyboardActive;

  const handleStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onKickChange(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Safe
      }
    }
  };

  const handleEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsPressed(false);
    onKickChange(false);
  };

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-auto">
      <button
        type="button"
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-100 touch-none active:scale-95 shadow-xl border-4 ${
          activeState
            ? 'scale-95 bg-gradient-to-b from-amber-400 via-red-500 to-rose-700 border-white text-white shadow-[0_0_35px_rgba(239,68,68,0.8)]'
            : 'bg-gradient-to-b from-red-600 via-rose-700 to-red-900 border-red-400/80 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:brightness-110'
        }`}
      >
        {/* Pulsing Kick Wave on active */}
        {activeState && (
          <span className="absolute -inset-2 rounded-full border-2 border-amber-300 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Soccer icon */}
        <span className="text-2xl drop-shadow-md">⚽</span>

        <span className="font-extrabold text-sm tracking-wider uppercase drop-shadow font-sans">
          CHUTE
        </span>

        <span className="text-[9px] font-mono opacity-80 mt-0.5 tracking-tight">
          ESPAÇO / X
        </span>
      </button>

      <span className="mt-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
        Botão de Chute
      </span>
    </div>
  );
};

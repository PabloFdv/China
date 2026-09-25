import React, { useState, useEffect, useRef } from 'react';

export type KickColor = 'red' | 'gold' | 'blue' | 'green';

interface SimpleKickButtonProps {
  onKickChange: (isKicking: boolean) => void;
  keyboardActive?: boolean;
  size?: number;
  opacity?: number;
  color?: KickColor;
  vibration?: boolean;
}

export const SimpleKickButton: React.FC<SimpleKickButtonProps> = ({
  onKickChange,
  keyboardActive = false,
  size = 82,
  opacity = 1,
  color = 'red',
  vibration = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const onKickChangeRef = useRef(onKickChange);
  onKickChangeRef.current = onKickChange;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(true);
    activePointerId.current = e.pointerId;
    onKickChangeRef.current(true);

    if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  useEffect(() => {
    const onWindowPointerUp = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      e.preventDefault();
      activePointerId.current = null;
      setIsPressed(false);
      onKickChangeRef.current(false);
    };

    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, []);

  const active = isPressed || keyboardActive;

  const getColorClasses = () => {
    switch (color) {
      case 'gold':
        return active
          ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-white shadow-yellow-500/80 ring-4 ring-yellow-400/50 brightness-125'
          : 'bg-gradient-to-br from-amber-500 to-yellow-700 border-amber-300/80 shadow-black/70 hover:brightness-110';
      case 'blue':
        return active
          ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border-white shadow-cyan-500/80 ring-4 ring-cyan-400/50 brightness-125'
          : 'bg-gradient-to-br from-blue-600 to-indigo-800 border-cyan-300/80 shadow-black/70 hover:brightness-110';
      case 'green':
        return active
          ? 'bg-gradient-to-tr from-emerald-400 to-green-500 border-white shadow-emerald-500/80 ring-4 ring-emerald-400/50 brightness-125'
          : 'bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-300/80 shadow-black/70 hover:brightness-110';
      case 'red':
      default:
        return active
          ? 'bg-gradient-to-tr from-rose-500 to-red-500 border-white shadow-rose-500/80 ring-4 ring-rose-400/50 brightness-125'
          : 'bg-gradient-to-br from-rose-600 to-red-900 border-rose-300/80 shadow-black/70 hover:brightness-110';
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      className={`rounded-full border-4 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-transform duration-75 select-none touch-none ${
        active ? 'scale-92 active:scale-90' : 'active:scale-95'
      } ${getColorClasses()}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        touchAction: 'none',
      }}
    >
      <span
        className="font-black tracking-wider text-white drop-shadow-md pointer-events-none"
        style={{ fontSize: `${Math.max(12, Math.round(size * 0.18))}px` }}
      >
        CHUTE
      </span>
      <span
        className="font-mono text-white/70 -mt-0.5 tracking-tight pointer-events-none"
        style={{ fontSize: `${Math.max(9, Math.round(size * 0.11))}px` }}
      >
        [ESPAÇO]
      </span>
    </button>
  );
};

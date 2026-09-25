import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  keyboardVector?: { x: number; y: number };
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, keyboardVector }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 55; // Max travel radius for knob

  // If keyboard input is active, update visual knob to reflect direction
  useEffect(() => {
    if (!active && keyboardVector && (keyboardVector.x !== 0 || keyboardVector.y !== 0)) {
      const len = Math.hypot(keyboardVector.x, keyboardVector.y) || 1;
      const nx = keyboardVector.x / len;
      const ny = keyboardVector.y / len;
      setPosition({ x: nx * RADIUS * 0.8, y: ny * RADIUS * 0.8 });
    } else if (!active) {
      setPosition({ x: 0, y: 0 });
    }
  }, [keyboardVector, active]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(distance, RADIUS);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setPosition({ x: knobX, y: knobY });

    const normalizedX = knobX / RADIUS;
    const normalizedY = knobY / RADIUS;
    onMove(normalizedX, normalizedY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
    handlePointer(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        handlePointer(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  // Mouse fallback for desktop mouse dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setActive(true);
    handlePointer(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handlePointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      setActive(false);
      setPosition({ x: 0, y: 0 });
      onMove(0, 0);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-auto">
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className={`relative w-36 h-36 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-colors duration-200 border-2 ${
          active
            ? 'bg-slate-900/80 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
            : 'bg-slate-950/60 border-slate-700/80 backdrop-blur-md shadow-lg'
        }`}
      >
        {/* Crosshair guidelines */}
        <div className="absolute w-full h-[1px] bg-slate-700/40 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-slate-700/40 pointer-events-none" />
        <div className="absolute w-20 h-20 rounded-full border border-dashed border-slate-700/30 pointer-events-none" />

        {/* Outer directional chevrons */}
        <span className="absolute top-2 text-[10px] font-bold text-slate-500 pointer-events-none">▲</span>
        <span className="absolute bottom-2 text-[10px] font-bold text-slate-500 pointer-events-none">▼</span>
        <span className="absolute left-2 text-[10px] font-bold text-slate-500 pointer-events-none">◀</span>
        <span className="absolute right-2 text-[10px] font-bold text-slate-500 pointer-events-none">▶</span>

        {/* Joystick Thumb Knob */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform duration-75 border-2 ${
            active
              ? 'bg-gradient-to-br from-red-500 to-rose-700 border-white text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500 text-slate-300'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>
      <span className="mt-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
        Analógico
      </span>
    </div>
  );
};

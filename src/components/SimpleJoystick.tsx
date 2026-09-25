import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SimpleJoystickProps {
  onMove: (x: number, y: number) => void;
  keyboardVector?: { x: number; y: number };
  size?: number;
  opacity?: number;
  mode?: 'fixed' | 'floating';
}

export const SimpleJoystick: React.FC<SimpleJoystickProps> = ({
  onMove,
  keyboardVector = { x: 0, y: 0 },
  size = 130,
  opacity = 1,
  mode = 'fixed',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [floatingCenter, setFloatingCenter] = useState<{ x: number; y: number } | null>(null);
  const [isActive, setIsActive] = useState(false);

  const activePointerId = useRef<number | null>(null);
  const baseCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const radius = (size / 2) - 10;
  const knobSize = Math.round(size * 0.42);

  const applyKnobTransform = useCallback((kx: number, ky: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${kx}px, ${ky}px, 0)`;
    }
  }, []);

  const processVector = useCallback((clientX: number, clientY: number) => {
    const center = baseCenterRef.current;
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const dist = Math.hypot(dx, dy);

    let normX = 0;
    let normY = 0;
    let kx = 0;
    let ky = 0;

    const deadzone = 2.5;
    if (dist > deadzone) {
      const clampedDist = Math.min(dist, radius);
      const angle = Math.atan2(dy, dx);
      kx = Math.cos(angle) * clampedDist;
      ky = Math.sin(angle) * clampedDist;

      // Resposta natural e linear com sensibilidade perfeitamente proporcional ao toque
      const ratio = Math.min(1.0, (clampedDist - deadzone) / (radius - deadzone));
      const intensity = Math.pow(ratio, 1.15);

      normX = Math.cos(angle) * intensity;
      normY = Math.sin(angle) * intensity;
    }

    applyKnobTransform(kx, ky);
    onMoveRef.current(normX, normY);
  }, [radius, applyKnobTransform]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    activePointerId.current = e.pointerId;
    setIsActive(true);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(6);
      }
    } catch {}

    if (mode === 'floating' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      setFloatingCenter({ x: relativeX, y: relativeY });
      baseCenterRef.current = { x: e.clientX, y: e.clientY };
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      baseCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    processVector(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      e.preventDefault();
      processVector(e.clientX, e.clientY);
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      e.preventDefault();
      activePointerId.current = null;
      setIsActive(false);
      applyKnobTransform(0, 0);
      setFloatingCenter(null);
      onMoveRef.current(0, 0);
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: false });
    window.addEventListener('pointercancel', onWindowPointerUp, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [processVector, applyKnobTransform]);

  // Sincronização direta de feedback para teclado via hardware transform
  useEffect(() => {
    if (activePointerId.current !== null) return;
    const { x, y } = keyboardVector;
    const targetX = x === 0 ? 0 : x * (radius * 0.75);
    const targetY = y === 0 ? 0 : y * (radius * 0.75);
    applyKnobTransform(targetX, targetY);
  }, [keyboardVector.x, keyboardVector.y, radius, applyKnobTransform]);

  // Se modo flutuante estiver ativado, renderiza uma zona de toque confortável
  if (mode === 'floating') {
    return (
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="w-44 h-44 sm:w-52 sm:h-52 relative flex items-center justify-center touch-none select-none"
        style={{ touchAction: 'none' }}
      >
        {floatingCenter ? (
          <div
            className="absolute rounded-full bg-black/55 border-2 border-yellow-400/50 backdrop-blur-md flex items-center justify-center pointer-events-none shadow-2xl transition-transform"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${floatingCenter.x - size / 2}px`,
              top: `${floatingCenter.y - size / 2}px`,
              opacity,
            }}
          >
            <div
              className="absolute bg-white/15 rounded-full"
              style={{ width: `${size * 0.65}px`, height: '2px' }}
            />
            <div
              className="absolute bg-white/15 rounded-full"
              style={{ height: `${size * 0.65}px`, width: '2px' }}
            />
            <div
              ref={knobRef}
              className="rounded-full bg-gradient-to-b from-yellow-300/40 to-yellow-500/20 border-2 border-yellow-300/90 shadow-xl flex items-center justify-center will-change-transform"
              style={{
                width: `${knobSize}px`,
                height: `${knobSize}px`,
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              <div
                className="rounded-full bg-yellow-200 shadow-inner"
                style={{ width: `${knobSize * 0.32}px`, height: `${knobSize * 0.32}px` }}
              />
            </div>
          </div>
        ) : (
          <div
            className="rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            style={{ width: `${size}px`, height: `${size}px`, opacity: opacity * 0.7 }}
          >
            <span className="text-[11px] font-bold text-white/60 tracking-wider">TOQUE AQUI</span>
          </div>
        )}
      </div>
    );
  }

  // Modo Fixo Clássico
  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`relative rounded-full bg-black/50 border-2 backdrop-blur-md flex items-center justify-center touch-none select-none shadow-2xl transition-all ${
        isActive ? 'border-yellow-400/70 scale-102 ring-2 ring-yellow-400/20' : 'border-white/30'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        touchAction: 'none',
      }}
    >
      <div
        className="absolute bg-white/15 rounded-full pointer-events-none"
        style={{ width: `${size * 0.7}px`, height: '2px' }}
      />
      <div
        className="absolute bg-white/15 rounded-full pointer-events-none"
        style={{ height: `${size * 0.7}px`, width: '2px' }}
      />
      <div
        className="absolute rounded-full border border-white/15 pointer-events-none"
        style={{ width: `${size * 0.44}px`, height: `${size * 0.44}px` }}
      />

      {/* Knob com aceleração de hardware GPU */}
      <div
        ref={knobRef}
        className={`rounded-full border-2 shadow-xl flex items-center justify-center pointer-events-none transition-colors will-change-transform ${
          isActive
            ? 'bg-gradient-to-b from-yellow-300/50 to-yellow-500/30 border-yellow-300'
            : 'bg-gradient-to-b from-white/40 to-white/15 border-white/80'
        }`}
        style={{
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <div
          className={`rounded-full shadow-inner ${isActive ? 'bg-yellow-300' : 'bg-white/80'}`}
          style={{ width: `${knobSize * 0.32}px`, height: `${knobSize * 0.32}px` }}
        />
      </div>
    </div>
  );
};

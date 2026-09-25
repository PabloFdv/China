import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from './audio/soundManager';
import { SimpleJoystick } from './components/SimpleJoystick';
import { SimpleKickButton } from './components/SimpleKickButton';
import { HudSettingsModal, HudConfig, DEFAULT_HUD_CONFIG } from './components/HudSettingsModal';
import { GameMenuModal, PlayerProfile, RoomInfo } from './components/GameMenuModal';
import { ChinaBallEngine } from './game/chinaEngine';
import { HAXBALL, MapSize, MAP_DIMENSIONS } from './game/physicsConfig';
import { PitchRenderer } from './game/pitchRenderer';
import { RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Settings, Users, Eye, Sparkles, Activity, Menu, Smartphone, Globe, User } from 'lucide-react';
import { toggleFullscreen, isFullscreenActive } from './utils/fullscreen';

const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Pablo',
  number: '10',
  color: '#f4d025',
  accentColor: '#ffffff',
  goals: 12,
  kicks: 48,
  matchesPlayed: 8,
  wins: 6,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ChinaBallEngine>(new ChinaBallEngine());
  const rendererRef = useRef<PitchRenderer | null>(null);

  // Input refs
  const inputVecRef = useRef({ x: 0, y: 0 });
  const kickStateRef = useRef(false);

  // HUD Config
  const [hudConfig, setHudConfig] = useState<HudConfig>(() => {
    try {
      const saved = localStorage.getItem('futzin_hud_config');
      return saved ? { ...DEFAULT_HUD_CONFIG, ...JSON.parse(saved) } : DEFAULT_HUD_CONFIG;
    } catch {
      return DEFAULT_HUD_CONFIG;
    }
  });
  const hudConfigRef = useRef(hudConfig);
  hudConfigRef.current = hudConfig;

  const [isHudModalOpen, setIsHudModalOpen] = useState(false);
  // O MENU DEVE SER A PRIMEIRA COISA QUE APARECE NO JOGO
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(true);
  const [menuInitialTab, setMenuInitialTab] = useState<'training' | 'hud' | 'rooms' | 'profile'>('training');

  // Detecção de Orientação Mobile (Landscape vs Portrait) e Dimensões Lógicas
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
    }
    return 'landscape';
  });
  const viewportSizeRef = useRef({
    w: typeof window !== 'undefined' ? window.innerWidth : 840,
    h: typeof window !== 'undefined' ? window.innerHeight : 420,
  });

  // Perfil do Jogador com Persistência
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('chinaball_profile');
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const handleProfileChange = useCallback((newProfile: PlayerProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('chinaball_profile', JSON.stringify(newProfile));
    } catch {}
  }, []);

  // Sala Ativa
  const [activeRoomName, setActiveRoomName] = useState('🇧🇷 Brasil 1v1 Arena');

  // Modo Paisagem Forçado no Preview Mobile
  const [isLandscapeForced, setIsLandscapeForced] = useState(false);

  // Estado do Bot 1v1
  const [botMode, setBotMode] = useState<'solo' | 'easy' | 'medium' | 'hard'>('medium');

  // UI state estilo Futzin
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(72);
  const [scoreYellow, setScoreYellow] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [kickReady, setKickReady] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [telemetry, setTelemetry] = useState({
    ballSpeed: 0,
    playerSpeed: 0,
    lastContactType: 'none',
    lastNormalComponent: 0,
    lastTangentialComponent: 0,
    lastWallEnergyLoss: 0,
  });

  const handleToggleOrientation = useCallback(() => {
    setIsLandscapeForced((prev) => {
      const next = !prev;
      if (typeof screen !== 'undefined' && 'orientation' in screen && screen.orientation) {
        if (next) {
          screen.orientation.lock?.('landscape').catch(() => {});
        } else {
          screen.orientation.unlock?.();
        }
      }
      return next;
    });
  }, []);

  const [teamSize, setTeamSize] = useState<1 | 2 | 3 | 4>(1);
  const [mapSize, setMapSize] = useState<MapSize>('1v1');
  const wsRef = useRef<WebSocket | null>(null);

  // Sessão Online Ativa
  const [onlineSession, setOnlineSession] = useState<{
    roomId: string;
    roomName: string;
    isHost: boolean;
    team: 'red' | 'blue';
    slot: number;
    playerCount: number;
  } | null>(null);
  const onlineSessionRef = useRef(onlineSession);
  onlineSessionRef.current = onlineSession;

  const handleSelectMatchFormat = useCallback((newTeamSize: 1 | 2 | 3 | 4, newMapSize: MapSize) => {
    setTeamSize(newTeamSize);
    setMapSize(newMapSize);
    const engine = engineRef.current;
    engine.setMatchFormat(newTeamSize, newMapSize, botMode === 'solo');
    setScoreYellow(0);
    setScoreBlue(0);
  }, [botMode]);

  const handleSelectBotMode = useCallback((mode: 'solo' | 'easy' | 'medium' | 'hard') => {
    setBotMode(mode);
    const engine = engineRef.current;
    if (mode === 'solo') {
      engine.setMatchFormat(1, mapSize, true);
      setScoreYellow(0);
      setScoreBlue(0);
    } else {
      engine.setMatchFormat(teamSize, mapSize, false);
      engine.botActive = true;
      engine.botDifficulty = mode;
      engine.resetToKickoff();
      setScoreYellow(0);
      setScoreBlue(0);
    }
  }, [teamSize, mapSize]);

  const handleJoinRoom = useCallback((room: RoomInfo) => {
    setActiveRoomName(room.name);
    setScoreYellow(0);
    setScoreBlue(0);

    const targetTeamSize = (room.teamSize || (room.mapSize === '4v4' ? 4 : room.mapSize === '3v3' ? 3 : room.mapSize === '2v2' ? 2 : 1)) as 1 | 2 | 3 | 4;
    const targetMapSize = room.mapSize || '1v1';
    setTeamSize(targetTeamSize);
    setMapSize(targetMapSize);
    setBotMode('medium');

    const engine = engineRef.current;
    engine.setMatchFormat(targetTeamSize, targetMapSize, false);
    engine.resetMatch();

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'join_room',
            roomId: room.id,
            name: profileRef.current.name,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'room_joined') {
            setOnlineSession({
              roomId: data.roomId,
              roomName: data.roomName,
              isHost: data.player.isHost,
              team: data.player.team,
              slot: data.player.slot || 0,
              playerCount: data.players?.length || 1,
            });
            if (!data.player.isHost) {
              engine.botActive = false;
            }
          }

          if (data.type === 'player_joined') {
            setOnlineSession((prev) => (prev ? { ...prev, playerCount: prev.playerCount + 1 } : null));
          }

          if (data.type === 'player_left') {
            setOnlineSession((prev) => (prev ? { ...prev, playerCount: Math.max(1, prev.playerCount - 1) } : null));
          }

          if (data.type === 'host_transferred') {
            setOnlineSession((prev) => (prev ? { ...prev, isHost: true } : null));
          }

          if (data.type === 'peer_player_sync') {
            const peer = engine.players.find(
              (p) => p.team === data.team && (p.id.endsWith(String(data.slot)) || p.isBot)
            );
            if (peer) {
              peer.x = data.x;
              peer.y = data.y;
              peer.vx = data.vx;
              peer.vy = data.vy;
              peer.isKicking = data.isKicking;
              if (data.isKicking) {
                engine.executeKick(peer, 0, 0, 1.0);
              }
            }
          }

          if (data.type === 'peer_ball_sync') {
            engine.ball.x = data.x;
            engine.ball.y = data.y;
            engine.ball.vx = data.vx;
            engine.ball.vy = data.vy;
            if (data.angle !== undefined) engine.ballAngle = data.angle;
            if (typeof data.scoreYellow === 'number') setScoreYellow(data.scoreYellow);
            if (typeof data.scoreBlue === 'number') setScoreBlue(data.scoreBlue);
          }

          if (data.type === 'peer_goal') {
            if (typeof data.scoreYellow === 'number') setScoreYellow(data.scoreYellow);
            if (typeof data.scoreBlue === 'number') setScoreBlue(data.scoreBlue);
            engine.triggerGoal(data.message);
          }

          if (data.type === 'peer_reset') {
            engine.resetToKickoff();
          }
        } catch {}
      };
    } catch {}
  }, []);

  const handleCreateRoom = useCallback((name: string, newMapSize: MapSize, newTeamSize: 1 | 2 | 3 | 4, _limit: number) => {
    setActiveRoomName(name);
    setTeamSize(newTeamSize);
    setMapSize(newMapSize);
    setBotMode('medium');
    const engine = engineRef.current;
    engine.setMatchFormat(newTeamSize, newMapSize, false);
    engine.resetMatch();
  }, []);

  // Master Toggle: Modo Puro (Desliga todos os efeitos em 1 clique)
  const isPureMode =
    !hudConfig.showVisualEffects &&
    !hudConfig.showBallTrail &&
    !hudConfig.enableScreenShake &&
    !hudConfig.showAimLaser &&
    !hudConfig.enableSlowMo &&
    hudConfig.cameraFollow === 'fixed';

  const handleTogglePureMode = useCallback(() => {
    if (!isPureMode) {
      const next: HudConfig = {
        ...hudConfig,
        showVisualEffects: false,
        showBallTrail: false,
        enableScreenShake: false,
        showAimLaser: false,
        enableSlowMo: false,
        cameraFollow: 'fixed',
      };
      setHudConfig(next);
      engineRef.current.enableSlowMo = false;
      engineRef.current.enableEffects = false;
      try {
        localStorage.setItem('futzin_hud_config', JSON.stringify(next));
      } catch {}
    } else {
      const next: HudConfig = {
        ...hudConfig,
        showVisualEffects: true,
        showBallTrail: true,
        enableScreenShake: true,
        showAimLaser: true,
        enableSlowMo: true,
        cameraFollow: 'broadcast',
      };
      setHudConfig(next);
      engineRef.current.enableSlowMo = true;
      engineRef.current.enableEffects = true;
      try {
        localStorage.setItem('futzin_hud_config', JSON.stringify(next));
      } catch {}
    }
  }, [isPureMode, hudConfig]);

  useEffect(() => {
    engineRef.current.debug.enabled = hudConfig.showDebugPhysics;
    engineRef.current.enableSlowMo = hudConfig.enableSlowMo;
    engineRef.current.enableEffects = hudConfig.showVisualEffects;
  }, [hudConfig.showDebugPhysics, hudConfig.enableSlowMo, hudConfig.showVisualEffects]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  // Teclado (valores primários estáveis)
  const [keyboardVector, setKeyboardVector] = useState({ x: 0, y: 0 });
  const [keyboardKick, setKeyboardKick] = useState(false);

  const handleHudChange = useCallback((newConfig: HudConfig) => {
    setHudConfig(newConfig);
    engineRef.current.debug.enabled = newConfig.showDebugPhysics;
    engineRef.current.enableSlowMo = newConfig.enableSlowMo;
    engineRef.current.enableEffects = newConfig.showVisualEffects;
    try {
      localStorage.setItem('futzin_hud_config', JSON.stringify(newConfig));
    } catch {}
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    inputVecRef.current = { x, y };
  }, []);

  const handleKickChange = useCallback((isKicking: boolean) => {
    kickStateRef.current = isKicking;
    if (isKicking) {
      setProfile((prev) => {
        const next = { ...prev, kicks: prev.kicks + 1 };
        try {
          localStorage.setItem('chinaball_profile', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, []);

  const handleCycleBot = () => {
    const engine = engineRef.current;
    if (botMode === 'medium') {
      setBotMode('hard');
      engine.botActive = true;
      engine.botDifficulty = 'hard';
    } else if (botMode === 'hard') {
      setBotMode('solo');
      engine.botActive = false;
    } else if (botMode === 'solo') {
      setBotMode('easy');
      engine.botActive = true;
      engine.botDifficulty = 'easy';
    } else {
      setBotMode('medium');
      engine.botActive = true;
      engine.botDifficulty = 'medium';
    }
  };

  const handleCycleCamera = () => {
    const current = hudConfig.cameraZoom;
    const next = current === 'auto' ? 'wide' : current === 'wide' ? 'close' : 'auto';
    handleHudChange({ ...hudConfig, cameraZoom: next });
  };

  // LOOP DE FÍSICA E RENDERIZAÇÃO ESTÁVEL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new PitchRenderer(ctx);
    const engine = engineRef.current;

    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_TIME = 1000 / 60;
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      let delta = now - lastTime;
      lastTime = now;
      if (delta > 100) delta = 100;

      accumulator += delta;

      let steps = 0;
      while (accumulator >= TICK_TIME) {
        engine.tick(inputVecRef.current.x, inputVecRef.current.y, kickStateRef.current, 1 / 60);
        accumulator -= TICK_TIME;
        steps++;
        if (steps > 5) {
          accumulator = 0;
          break;
        }
      }

      // Sincronização Multiplayer em Tempo Real (~30Hz)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && onlineSessionRef.current) {
        if (frameCount % 2 === 0) {
          const sess = onlineSessionRef.current;
          wsRef.current.send(
            JSON.stringify({
              type: 'sync_player',
              x: engine.player.x,
              y: engine.player.y,
              vx: engine.player.vx,
              vy: engine.player.vy,
              isKicking: kickStateRef.current,
            })
          );

          if (sess.isHost) {
            wsRef.current.send(
              JSON.stringify({
                type: 'sync_ball',
                x: engine.ball.x,
                y: engine.ball.y,
                vx: engine.ball.vx,
                vy: engine.ball.vy,
                angle: engine.ballAngle,
                scoreYellow: engine.scoreYellow,
                scoreBlue: engine.scoreBlue,
              })
            );
          }
        }
      }

      const alpha = Math.min(1, Math.max(0, accumulator / TICK_TIME));

      if (rendererRef.current && canvas) {
        rendererRef.current.render(
          engine,
          viewportSizeRef.current.w,
          viewportSizeRef.current.h,
          alpha,
          hudConfigRef.current,
          profileRef.current,
          inputVecRef.current.x,
          inputVecRef.current.y
        );
      }

      frameCount++;
      if (now - lastFpsTime >= 600) {
        const measuredFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        setFps((prev) => (Math.abs(prev - measuredFps) >= 2 ? measuredFps : prev));
        frameCount = 0;
        lastFpsTime = now;

        if (engine.scoreYellow > scoreYellow) {
          setProfile((prev) => {
            const next = { ...prev, goals: prev.goals + (engine.scoreYellow - scoreYellow) };
            try {
              localStorage.setItem('chinaball_profile', JSON.stringify(next));
            } catch {}
            return next;
          });
        }

        setScoreYellow((prev) => (prev !== engine.scoreYellow ? engine.scoreYellow : prev));
        setScoreBlue((prev) => (prev !== engine.scoreBlue ? engine.scoreBlue : prev));

        const d = Math.hypot(engine.ball.x - engine.player.x, engine.ball.y - engine.player.y);
        const reach = HAXBALL.player.radius + HAXBALL.ball.radius + HAXBALL.kick.reachMargin;
        const canKick = d <= reach && engine.kickCooldown === 0;
        setKickReady((prev) => (prev !== canKick ? canKick : prev));

        if (hudConfigRef.current.showDebugPhysics) {
          setTelemetry({
            ballSpeed: engine.debug.ballSpeed,
            playerSpeed: engine.debug.playerSpeed,
            lastContactType: engine.debug.lastContactType,
            lastNormalComponent: engine.debug.lastNormalComponent,
            lastTangentialComponent: engine.debug.lastTangentialComponent,
            lastWallEnergyLoss: engine.debug.lastWallEnergyLoss,
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Redimensionamento responsivo de alta precisão com suporte fluido a Landscape e Portrait
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      viewportSizeRef.current = { w, h };
      setOrientation(w >= h ? 'landscape' : 'portrait');

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rendererRef.current = new PitchRenderer(ctx);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (typeof screen !== 'undefined' && 'orientation' in screen && screen.orientation) {
      screen.orientation.addEventListener?.('change', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (typeof screen !== 'undefined' && 'orientation' in screen && screen.orientation) {
        screen.orientation.removeEventListener?.('change', handleResize);
      }
    };
  }, []);

  // Teclado (WASD / Setas / Espaço / X / R)
  useEffect(() => {
    const keysDown = new Set<string>();

    const updateKeyboard = () => {
      let mx = 0;
      let my = 0;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;
      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) my -= 1;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) my += 1;

      if (mx !== 0 && my !== 0) {
        mx *= 0.7071;
        my *= 0.7071;
      }

      setKeyboardVector((prev) => {
        if (Math.abs(prev.x - mx) < 0.001 && Math.abs(prev.y - my) < 0.001) {
          return prev;
        }
        return { x: mx, y: my };
      });

      const isKick = keysDown.has('Space') || keysDown.has('KeyX');
      setKeyboardKick((prev) => (prev !== isKick ? isKick : prev));

      inputVecRef.current = { x: mx, y: my };
      kickStateRef.current = isKick;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyR' && !e.repeat) {
        engineRef.current.resetBallToPlayer();
      }
      if ((e.code === 'KeyM' || e.code === 'Escape') && !e.repeat) {
        setIsGameMenuOpen((prev) => !prev);
      }
      if (e.code === 'KeyB' && !e.repeat) {
        handleHudChange({
          ...hudConfigRef.current,
          showDebugPhysics: !hudConfigRef.current.showDebugPhysics,
        });
      }
      if (!keysDown.has(e.code)) {
        keysDown.add(e.code);
        updateKeyboard();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysDown.has(e.code)) {
        keysDown.delete(e.code);
        updateKeyboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleToggleMute = () => {
    const isNowMuted = sounds.toggleMute();
    setIsMuted(isNowMuted);
  };

  const handleToggleFullscreen = () => {
    toggleFullscreen()
      .then((active) => {
        setIsFullscreen(active);
      })
      .catch(() => {});
  };

  const getMarginClass = () => {
    switch (hudConfig.verticalMargin) {
      case 'low':
        return 'pb-2 sm:pb-3 px-3 sm:px-5';
      case 'high':
        return 'pb-8 sm:pb-12 px-5 sm:px-10';
      case 'medium':
      default:
        return 'pb-4 sm:pb-6 px-4 sm:px-8';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#17361f] text-slate-100 select-none touch-none">
      {/* Canvas Principal */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* PLACAR / STATUS (AMARELO VS AZUL OU TREINO SOLO LIVRE OU SALA ONLINE) */}
      {botMode === 'solo' ? (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#151a21]/90 backdrop-blur-md border border-amber-400/50 rounded-full px-3.5 py-1 shadow-2xl pointer-events-none select-none">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="font-mono text-xs font-black tracking-wider text-yellow-300">
            TREINO SOLO
          </span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-xs font-bold text-white">
            GOLS: <strong className="text-yellow-400">{scoreYellow}</strong>
          </span>
          {engineRef.current.soloStreak > 1 && (
            <>
              <span className="text-white/20">|</span>
              <span className="font-mono text-[11px] font-black text-amber-400">
                🔥 STREAK: {engineRef.current.soloStreak}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none select-none">
          <div className="flex items-center bg-[#151a21] border border-black/40 rounded-sm shadow-2xl overflow-hidden">
            <div className="flex h-7 w-7">
              <div className="w-1/2 h-full bg-[#eab308]" />
              <div className="w-1/2 h-full bg-black" />
            </div>

            <div className="px-3.5 py-0.5 font-mono text-base font-black tracking-widest text-white flex items-center gap-1.5">
              <span>{scoreYellow}</span>
              <span className="text-slate-400 font-bold">:</span>
              <span>{scoreBlue}</span>
            </div>

            <div className="flex h-7 w-7">
              <div className="w-1/2 h-full bg-[#1e5cd8]" />
              <div className="w-1/2 h-full bg-white" />
            </div>
          </div>

          {onlineSession && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineSession.roomName} ({onlineSession.playerCount}P)</span>
              <span className="text-emerald-500 font-bold">{onlineSession.isHost ? '[HOST]' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* PING */}
      <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-white font-mono text-xs font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {ping}ms
      </div>

      {/* Botão de Ação Rápida no Mobile para Reset da Bola em Treino Solo */}
      {botMode === 'solo' && (
        <div className="fixed bottom-2.5 left-2.5 sm:left-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => engineRef.current.resetBallToPlayer()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-amber-400/50 text-amber-300 text-xs font-bold shadow-lg backdrop-blur-md cursor-pointer active:scale-95 transition-all"
            title="Trazer a bola para os pés do jogador (R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
            <span>Chamar Bola (R)</span>
          </button>
        </div>
      )}

      {/* Indicadores de FPS e Alcance */}
      <div className="fixed top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 bg-black/65 backdrop-blur-md rounded-lg px-2.5 py-1 text-[11px] font-mono shadow pointer-events-none select-none flex items-center gap-2 border border-white/10">
        <span className="text-emerald-400 font-bold">{fps} FPS</span>
        <span className="text-white/20">|</span>
        <span className={kickReady ? 'text-yellow-300 font-bold' : 'text-slate-400'}>
          {kickReady ? 'CHUTE PRONTO' : 'FORA DE ALCANCE'}
        </span>
      </div>

      {/* SENSOR DE TELEMETRIA FÍSICA (QUANDO ATIVADO) */}
      {hudConfig.showDebugPhysics && (
        <div className="fixed top-11 left-2.5 sm:top-12 sm:left-3 z-20 bg-slate-950/85 backdrop-blur-md rounded-xl p-2.5 border border-cyan-500/40 font-mono text-[10px] text-slate-200 shadow-2xl flex flex-col gap-1 pointer-events-none max-w-[240px]">
          <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-cyan-500/20 pb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>TELEMETRIA FÍSICA</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              {telemetry.lastContactType}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
            <div>Bola: <span className="text-rose-400 font-bold">{telemetry.ballSpeed.toFixed(2)}</span></div>
            <div>Jogador: <span className="text-sky-400 font-bold">{telemetry.playerSpeed.toFixed(2)}</span></div>
            <div>V. Normal: <span className="text-amber-400 font-bold">{telemetry.lastNormalComponent.toFixed(2)}</span></div>
            <div>V. Tangente: <span className="text-emerald-400 font-bold">{telemetry.lastTangentialComponent.toFixed(2)}</span></div>
            <div className="col-span-2">Perda Parede: <span className="text-purple-400 font-bold">-{telemetry.lastWallEnergyLoss.toFixed(2)}</span></div>
          </div>
        </div>
      )}

      {/* Dicas Rápidas de Jogabilidade no Mobile */}
      {showTips && (
        <div
          onClick={() => setShowTips(false)}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/15 px-3.5 py-1 rounded-full text-[11px] font-semibold text-slate-200 shadow-lg cursor-pointer active:scale-95 transition-transform max-w-[92vw] truncate"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="truncate">
            {botMode === 'solo'
              ? 'Condução suave: empurre o analógico na direção da bola para conduzir colado!'
              : 'Duelo 1v1 ativo: chute potente com o botão e conduza com o analógico!'}
          </span>
          <span className="text-white/40 text-[10px] ml-1 shrink-0">✕</span>
        </div>
      )}

      {/* Controles do topo direito (MENU, Modo Puro, Reset Bola, 1v1 Bot, HUD, Câmera, Som, Fullscreen) */}
      <div className="fixed top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
        {/* BOTÃO PRINCIPAL: MENU DE JOGO (Treino, HUD, Salas, Perfil) */}
        <button
          type="button"
          onClick={() => {
            setMenuInitialTab('play');
            setIsGameMenuOpen(true);
          }}
          title="Abrir Menu do Jogo (Tecla M ou Esc)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg active:scale-95 transition-all ring-1 ring-yellow-300"
        >
          <Menu className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>MENU</span>
        </button>

        {/* BOTÃO MESTRE: MODO PURO / SEM EFEITOS (TIRAR TUDO EM 1 TOQUE) */}
        <button
          type="button"
          onClick={handleTogglePureMode}
          title={isPureMode ? 'Modo Puro Ativado (Sem efeitos). Clique para reativar efeitos' : 'Tirar todos os efeitos visuais (Modo Puro / Máxima Leveza)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-black cursor-pointer backdrop-blur-md shadow-md active:scale-95 transition-all ${
            isPureMode
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
              : 'bg-black/65 hover:bg-black/85 border-white/15 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">{isPureMode ? 'MODO PURO ✨' : 'EFEITOS: ON'}</span>
        </button>

        {/* Girar Tela / Modo Deitado (Landscape) */}
        <button
          type="button"
          onClick={handleToggleOrientation}
          title={isLandscapeForced ? 'Modo Normal (Em Pé)' : 'Modo Deitado (Paisagem)'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer backdrop-blur-md shadow-md active:scale-95 transition-all ${
            isLandscapeForced
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'bg-black/65 hover:bg-black/85 border-white/15 text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isLandscapeForced ? 'Deitado' : 'Girar Tela'}</span>
        </button>

        {/* Reset Bola */}
        <button
          type="button"
          onClick={() => {
            engineRef.current.resetBallToPlayer();
          }}
          title="Trazer bola ao jogador (R)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/65 hover:bg-black/85 border border-white/15 text-xs font-bold text-slate-200 cursor-pointer backdrop-blur-md shadow-md active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden xs:inline">Reset Bola</span>
        </button>

        {/* 1v1 Bot Selector */}
        <button
          type="button"
          onClick={handleCycleBot}
          title="Alternar Adversário 1v1 (Solo / Bot Fácil / Médio / Craque)"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer backdrop-blur-md shadow-md active:scale-95 transition-colors ${
            botMode === 'solo'
              ? 'bg-black/65 border-white/15 text-slate-300'
              : botMode === 'easy'
              ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-300'
              : botMode === 'hard'
              ? 'bg-rose-950/60 border-rose-400/40 text-rose-300 font-black'
              : 'bg-blue-950/60 border-blue-400/40 text-blue-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>
            {botMode === 'solo'
              ? 'Solo'
              : botMode === 'easy'
              ? 'Bot Fácil'
              : botMode === 'hard'
              ? 'Bot Craque'
              : 'Bot 1v1'}
          </span>
        </button>

        {/* Zoom Câmera */}
        <button
          type="button"
          onClick={handleCycleCamera}
          title={`Zoom do Campo: ${hudConfig.cameraZoom}`}
          className="p-1.5 rounded-lg bg-black/65 hover:bg-black/85 border border-white/15 text-slate-300 cursor-pointer backdrop-blur-md shadow-md"
        >
          <Eye className="w-4 h-4 text-cyan-300" />
        </button>

        {/* Sensor de Debug da Física */}
        <button
          type="button"
          onClick={() =>
            handleHudChange({
              ...hudConfig,
              showDebugPhysics: !hudConfig.showDebugPhysics,
            })
          }
          title={hudConfig.showDebugPhysics ? 'Ocultar Vetores de Física (B)' : 'Mostrar Vetores de Física (B)'}
          className={`p-1.5 rounded-lg border cursor-pointer backdrop-blur-md shadow-md transition-colors ${
            hudConfig.showDebugPhysics
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'bg-black/65 hover:bg-black/85 border-white/15 text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Configurações HUD */}
        <button
          type="button"
          onClick={() => {
            setMenuInitialTab('hud');
            setIsGameMenuOpen(true);
          }}
          title="Personalizar HUD (Tamanho, Modo Flutuante, Posição, Opacidade)"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/40 text-xs font-black text-yellow-300 cursor-pointer backdrop-blur-md shadow-md active:scale-95"
        >
          <Settings className="w-3.5 h-3.5 text-yellow-400" />
          <span>HUD</span>
        </button>

        {/* Som */}
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? 'Ativar som' : 'Silenciar som'}
          className="p-1.5 rounded-lg bg-black/65 hover:bg-black/85 border border-white/15 text-slate-300 cursor-pointer backdrop-blur-md shadow-md"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Tela Cheia Segura */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          className="p-1.5 rounded-lg bg-black/65 hover:bg-black/85 border border-white/15 text-slate-300 cursor-pointer backdrop-blur-md shadow-md"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-yellow-300" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Controles Mobile (Posições X/Y Livres com Adaptação Ergonômica Landscape/Portrait) */}
      <div className="fixed inset-0 pointer-events-none z-30">
        {/* Analógico */}
        <div
          className="pointer-events-auto absolute transition-all duration-200"
          style={{
            [hudConfig.layout === 'inverted' ? 'right' : 'left']:
              orientation === 'landscape'
                ? `${Math.max(16, hudConfig.joystickOffsetX || 24)}px`
                : `${hudConfig.joystickOffsetX || 24}px`,
            bottom:
              orientation === 'landscape'
                ? `${Math.min(hudConfig.joystickOffsetY || 24, 38)}px`
                : `${hudConfig.joystickOffsetY || 24}px`,
          }}
        >
          <SimpleJoystick
            onMove={handleJoystickMove}
            keyboardVector={keyboardVector}
            size={orientation === 'landscape' ? Math.min(hudConfig.joystickSize, 140) : hudConfig.joystickSize}
            opacity={hudConfig.opacity}
            mode={hudConfig.joystickMode}
          />
        </div>

        {/* Botão de Chute */}
        <div
          className="pointer-events-auto absolute flex items-end transition-all duration-200"
          style={{
            [hudConfig.layout === 'inverted' ? 'left' : 'right']:
              orientation === 'landscape'
                ? `${Math.max(16, hudConfig.kickOffsetX || 24)}px`
                : `${hudConfig.kickOffsetX || 24}px`,
            bottom:
              orientation === 'landscape'
                ? `${Math.min(hudConfig.kickOffsetY || 24, 38)}px`
                : `${hudConfig.kickOffsetY || 24}px`,
          }}
        >
          <SimpleKickButton
            onKickChange={handleKickChange}
            keyboardActive={keyboardKick}
            size={orientation === 'landscape' ? Math.min(hudConfig.kickSize, 90) : hudConfig.kickSize}
            opacity={hudConfig.opacity}
            color={hudConfig.kickColor}
            vibration={hudConfig.vibration}
          />
        </div>
      </div>

      {/* Menu Principal Completo (Treino Solo/1v1 a 4v4, HUD, Salas Online, Perfil) */}
      <GameMenuModal
        isOpen={isGameMenuOpen}
        onClose={() => setIsGameMenuOpen(false)}
        initialTab={menuInitialTab}
        botMode={botMode}
        onSelectBotMode={handleSelectBotMode}
        teamSize={teamSize}
        mapSize={mapSize}
        onSelectMatchFormat={handleSelectMatchFormat}
        hudConfig={hudConfig}
        onHudChange={handleHudChange}
        profile={profile}
        onProfileChange={handleProfileChange}
        activeRoomName={activeRoomName}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onToggleOrientation={handleToggleOrientation}
        isLandscapeForced={isLandscapeForced}
      />

      {/* Modal Específico do HUD */}
      <HudSettingsModal
        isOpen={isHudModalOpen}
        onClose={() => setIsHudModalOpen(false)}
        config={hudConfig}
        onChange={handleHudChange}
      />
    </div>
  );
}

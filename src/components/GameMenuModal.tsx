import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Trophy,
  Users,
  Palette,
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  Activity,
  PlusCircle,
  LogIn,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Flame,
  Check,
  Ban,
  Maximize,
} from 'lucide-react';
import { HudConfig } from './HudSettingsModal';
import { PlayerProfile } from './CustomizerModal';
import { MapSize, MAP_DIMENSIONS } from '../game/physicsConfig';

export interface RoomInfo {
  id: string;
  name: string;
  mapSize: MapSize;
  teamSize?: number;
  mode: string;
  players: number;
  maxPlayers: number;
  goalLimit: number;
  ping: number;
  region: string;
}

export type MenuTab = 'play' | 'hud' | 'rooms' | 'settings' | 'profile';

interface GameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'training' | 'hud' | 'rooms' | 'profile' | 'play' | 'settings';
  botMode: 'solo' | 'easy' | 'medium' | 'hard';
  onSelectBotMode: (mode: 'solo' | 'easy' | 'medium' | 'hard') => void;
  teamSize: 1 | 2 | 3 | 4;
  mapSize: MapSize;
  onSelectMatchFormat: (teamSize: 1 | 2 | 3 | 4, mapSize: MapSize) => void;
  hudConfig: HudConfig;
  onHudChange: (newConfig: HudConfig) => void;
  profile: PlayerProfile;
  onProfileChange: (newProfile: PlayerProfile) => void;
  activeRoomName: string;
  onJoinRoom: (room: RoomInfo) => void;
  onCreateRoom: (roomName: string, mapSize: MapSize, teamSize: 1 | 2 | 3 | 4, goalLimit: number) => void;
  onToggleOrientation: () => void;
  isLandscapeForced: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Amarelo Ouro', color: '#f4d025', accent: '#ffffff' },
  { name: 'China Red', color: '#ef4444', accent: '#ffffff' },
  { name: 'Azul Celeste', color: '#1e5cd8', accent: '#ffffff' },
  { name: 'Brasil Verde', color: '#16a34a', accent: '#ffffff' },
  { name: 'Dourado Craque', color: '#eab308', accent: '#000000' },
  { name: 'Roxo Imperial', color: '#9333ea', accent: '#ffffff' },
  { name: 'Preto Carbono', color: '#1e293b', accent: '#38bdf8' },
  { name: 'Branco Neve', color: '#f8fafc', accent: '#0f172a' },
];

export const GameMenuModal: React.FC<GameMenuModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'play',
  botMode,
  onSelectBotMode,
  teamSize,
  mapSize,
  onSelectMatchFormat,
  hudConfig,
  onHudChange,
  profile,
  onProfileChange,
  activeRoomName,
  onJoinRoom,
  onCreateRoom,
  onToggleOrientation,
  isLandscapeForced,
}) => {
  const normalizeTab = (t: string): MenuTab => {
    if (t === 'training' || t === 'play') return 'play';
    if (t === 'hud') return 'hud';
    if (t === 'rooms') return 'rooms';
    if (t === 'settings') return 'settings';
    if (t === 'profile') return 'profile';
    return 'play';
  };

  const [activeTab, setActiveTab] = useState<MenuTab>(normalizeTab(initialTab));

  useEffect(() => {
    if (isOpen) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [isOpen, initialTab]);

  // Lista de Salas Online Reais (da API backend)
  const [onlineRooms, setOnlineRooms] = useState<RoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        if (data.rooms) {
          setOnlineRooms(data.rooms);
        }
      }
    } catch {
      // Fallback padrão se offline
      setOnlineRooms([
        { id: 'sala-brasil-1v1', name: '🇧🇷 Brasil Oficial 1v1', mapSize: '1v1', teamSize: 1, mode: '1v1', players: 1, maxPlayers: 2, goalLimit: 3, ping: 38, region: 'BR' },
        { id: 'sala-duplas-2v2', name: '⚡ Duplas Rápidas 2v2', mapSize: '2v2', teamSize: 2, mode: '2v2', players: 2, maxPlayers: 4, goalLimit: 5, ping: 42, region: 'BR' },
        { id: 'sala-arena-3v3', name: '🏆 Copa América 3v3', mapSize: '3v3', teamSize: 3, mode: '3v3', players: 3, maxPlayers: 6, goalLimit: 5, ping: 46, region: 'BR' },
        { id: 'sala-maracana-4v4', name: '🏟️ Maracanã 4v4 Clássico', mapSize: '4v4', teamSize: 4, mode: '4v4', players: 4, maxPlayers: 8, goalLimit: 7, ping: 48, region: 'BR' },
      ]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'rooms') {
      fetchRooms();
    }
  }, [isOpen, activeTab]);

  // Criar sala state
  const [newRoomName, setNewRoomName] = useState('Arena dos Craques');
  const [newRoomMapSize, setNewRoomMapSize] = useState<MapSize>('1v1');
  const [newRoomTeamSize, setNewRoomTeamSize] = useState<1 | 2 | 3 | 4>(1);
  const [newGoalLimit, setNewGoalLimit] = useState(5);
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [roomNotification, setRoomNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Master Toggle: Modo Puro (Desliga Tudo)
  const isPureMode =
    !hudConfig.showVisualEffects &&
    !hudConfig.showBallTrail &&
    !hudConfig.enableScreenShake &&
    !hudConfig.showAimLaser &&
    !hudConfig.enableSlowMo &&
    hudConfig.cameraFollow === 'fixed';

  const togglePureMode = () => {
    if (!isPureMode) {
      // Ativa Modo Puro: desativa todos os efeitos para máxima leveza
      onHudChange({
        ...hudConfig,
        showVisualEffects: false,
        showBallTrail: false,
        enableScreenShake: false,
        showAimLaser: false,
        enableSlowMo: false,
        cameraFollow: 'fixed',
      });
      setRoomNotification('✨ Modo Puro Ativado: todos os efeitos visuais foram desligados!');
    } else {
      // Restaura efeitos completos
      onHudChange({
        ...hudConfig,
        showVisualEffects: true,
        showBallTrail: true,
        enableScreenShake: true,
        showAimLaser: true,
        enableSlowMo: true,
        cameraFollow: 'broadcast',
      });
      setRoomNotification('🌟 Efeitos Visuais Ativados!');
    }
    setTimeout(() => setRoomNotification(null), 1800);
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim() || 'Minha Sala',
          mapSize: newRoomMapSize,
          teamSize: newRoomTeamSize,
          goalLimit: newGoalLimit,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreateRoom(data.room.name, data.room.mapSize, data.room.teamSize, data.room.goalLimit);
        setRoomNotification(`Sala "${data.room.name}" criada com sucesso no servidor!`);
        setTimeout(() => {
          setRoomNotification(null);
          onClose();
        }, 1200);
        return;
      }
    } catch {}

    onCreateRoom(newRoomName.trim() || 'Minha Sala', newRoomMapSize, newRoomTeamSize, newGoalLimit);
    setRoomNotification(`Sala "${newRoomName}" aberta!`);
    setTimeout(() => {
      setRoomNotification(null);
      onClose();
    }, 1200);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoomCode.trim()) return;
    const found = onlineRooms.find((r) => r.id.toLowerCase() === customRoomCode.trim().toLowerCase()) || {
      id: customRoomCode.trim().toUpperCase(),
      name: `Sala ${customRoomCode.trim().toUpperCase()}`,
      mapSize: '1v1' as MapSize,
      teamSize: 1,
      mode: '1v1',
      players: 1,
      maxPlayers: 2,
      goalLimit: 5,
      ping: 45,
      region: 'BR',
    };
    onJoinRoom(found);
    setRoomNotification(`Conectado à sala ${found.name}!`);
    setTimeout(() => {
      setRoomNotification(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[94vh] max-h-[820px] bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col md:flex-row overflow-hidden text-slate-100 backdrop-blur-xl">
        {/* Sidebar Lateral */}
        <aside className="w-full md:w-64 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col justify-between shrink-0 p-3 md:p-4">
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-yellow-300/60 font-black">
                <span className="text-xl">⚽</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 uppercase font-mono">
                    CHINABALL
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">1v1 a 4v4 Online & Bots</p>
              </div>
            </div>

            {/* Navegação de Abas */}
            <nav className="flex md:flex-col gap-1 sm:gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab('play')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'play'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>PARTIDA & BOTS</span>
              </button>

              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'rooms'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span>SALAS ONLINE</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('hud')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'hud'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>CONTROLES HUD</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>GRÁFICOS & EFEITOS</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-rose-400 to-red-500 text-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span>UNIFORME & CAMISA</span>
              </button>
            </nav>
          </div>

          {/* BOTÃO MESTRE: DESATIVAR TODOS OS EFEITOS */}
          <div className="hidden md:block pt-3 border-t border-white/10">
            <button
              onClick={togglePureMode}
              className={`w-full py-2.5 px-3 rounded-xl border font-black text-[11px] cursor-pointer transition-all flex items-center justify-between ${
                isPureMode
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-white/15 text-slate-300 hover:border-yellow-400/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MODO ULTRA LEVE</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${isPureMode ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {isPureMode ? 'ATIVADO' : 'OFF'}
              </span>
            </button>
          </div>
        </aside>

        {/* Área Central de Conteúdo */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Header Superior */}
          <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                {activeTab === 'play' && 'Configuração de Partida & Bots'}
                {activeTab === 'rooms' && 'Salas Online Multiplayer'}
                {activeTab === 'hud' && 'Personalizar HUD & Toque'}
                {activeTab === 'settings' && 'Gráficos, Câmera & Efeitos'}
                {activeTab === 'profile' && 'Perfil do Jogador & Uniforme'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão Rápido de Efeitos */}
              <button
                onClick={togglePureMode}
                title="Ativar/Desativar todos os efeitos visuais (Modo Puro)"
                className={`px-2.5 py-1 rounded-lg border text-xs font-black cursor-pointer flex items-center gap-1 transition-all ${
                  isPureMode
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isPureMode ? 'Modo Puro (Sem Efeitos)' : 'Efeitos: Ligados'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Notificação Temporária */}
          {roomNotification && (
            <div className="bg-emerald-600/90 text-white text-xs font-bold py-1.5 px-4 text-center border-b border-emerald-400/40 animate-in fade-in">
              {roomNotification}
            </div>
          )}

          {/* Conteúdo da Aba */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* ========================================================================= */}
            {/* ABA 1: PARTIDA & BOTS (ESCOLHA DE 1v1 ATÉ 4v4 + MAPAS REAIS)              */}
            {/* ========================================================================= */}
            {activeTab === 'play' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Banner de Boas-Vindas */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-amber-500/40 p-4 sm:p-5 shadow-2xl">
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white shadow flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>Futebol 2D Fluido</span>
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        {teamSize}v{teamSize} no {MAP_DIMENSIONS[mapSize]?.name}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight">
                      Arena de Futebol com Bots & Solo
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Jogue partidas completas de 1x1 até 4x4. Cada formato possui um mapa proporcional com espaço amplo para arrancadas, tabelas e fintas!
                    </p>
                  </div>
                </div>

                {/* SELETOR DE FORMATO DE JOGO (1x1 até 4x4) */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>Formato de Partida & Tamanho do Campo</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Dimensões: {MAP_DIMENSIONS[mapSize]?.width} x {MAP_DIMENSIONS[mapSize]?.height}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { size: 1, map: '1v1' as MapSize, title: '1 vs 1', label: 'Campo Clássico', desc: 'Duelo rápido e técnico' },
                        { size: 2, map: '2v2' as MapSize, title: '2 vs 2', label: 'Campo Médio', desc: 'Tabelas e passes rápidos' },
                        { size: 3, map: '3v3' as MapSize, title: '3 vs 3', label: 'Campo Grande', desc: 'Tática, espaço e cobertura' },
                        { size: 4, map: '4v4' as MapSize, title: '4 vs 4', label: 'Estádio Monumental', desc: 'Oficial com amplitude total' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.size}
                        type="button"
                        onClick={() => onSelectMatchFormat(f.size, f.map)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                          teamSize === f.size
                            ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-yellow-400'
                            : 'bg-slate-800/80 border-white/10 hover:border-yellow-400/40 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">{f.title}</span>
                          {teamSize === f.size && <Check className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <span className="text-xs font-bold text-amber-300">{f.label}</span>
                        <p className="text-[10px] text-slate-400 leading-tight">{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELETOR DE MODO / DIFICULDADE DOS BOTS */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Modo de Jogo & Dificuldade dos Bots</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectBotMode('solo')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        botMode === 'solo'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-800/80 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black block">Treino Solo (Sem Bots)</span>
                      <span className="text-[10px] text-slate-400">Você sozinho com a bola</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectBotMode('easy')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        botMode === 'easy'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-800/80 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black block">Bots Fáceis</span>
                      <span className="text-[10px] text-slate-400">Ritmo calmo para aprender</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectBotMode('medium')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        botMode === 'medium'
                          ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-1 ring-blue-400'
                          : 'bg-slate-800/80 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black block">Bots Médios (Equilibrado)</span>
                      <span className="text-[10px] text-slate-400">Boa cobertura e chutes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectBotMode('hard')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        botMode === 'hard'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400'
                          : 'bg-slate-800/80 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black block">Bots Craques / Hard</span>
                      <span className="text-[10px] text-slate-400">Chutes potentes nos cantos</span>
                    </button>
                  </div>
                </div>

                {/* Botão de Entrar em Campo */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>ENTRAR EM CAMPO ({teamSize}v{teamSize} - {MAP_DIMENSIONS[mapSize]?.name})</span>
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ABA 2: SALAS ONLINE REAIS MULTIPLAYER (COM SELETOR DE MAPA 1v1 a 4v4)     */}
            {/* ========================================================================= */}
            {activeTab === 'rooms' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header de Salas */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>Salas Multiplayer no Servidor</span>
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Sala atual: <strong className="text-yellow-400">{activeRoomName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={fetchRooms}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      {isLoadingRooms ? 'Atualizando...' : 'Atualizar'}
                    </button>

                    <form onSubmit={handleJoinByCode} className="flex gap-1.5 flex-1 sm:flex-initial">
                      <input
                        type="text"
                        placeholder="Código da Sala"
                        value={customRoomCode}
                        onChange={(e) => setCustomRoomCode(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white uppercase font-mono w-32 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow shrink-0"
                      >
                        Entrar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Lista de Salas Online Reais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onlineRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-400/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                            {room.id}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {room.ping}ms ({room.region})
                          </span>
                        </div>

                        <h4 className="font-black text-sm text-white">{room.name}</h4>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                            {room.mapSize} ({MAP_DIMENSIONS[room.mapSize]?.name})
                          </span>
                          <span>Meta: <strong className="text-slate-200">{room.goalLimit} Gols</strong></span>
                          <span>Vagas: <strong className="text-yellow-400">{room.players}/{room.maxPlayers}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onJoinRoom(room);
                          onClose();
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>ENTRAR NESTA SALA ONLINE</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Criar Nova Sala Online */}
                <form
                  onSubmit={handleCreateRoomSubmit}
                  className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3"
                >
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>Criar Sala Online com Tamanho de Mapa Personalizado</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Nome da Sala</label>
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-yellow-400"
                        placeholder="Ex: Sala dos Amigos"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Formato & Tamanho do Mapa</label>
                      <select
                        value={newRoomMapSize}
                        onChange={(e) => {
                          const size = e.target.value as MapSize;
                          setNewRoomMapSize(size);
                          if (size === '1v1') setNewRoomTeamSize(1);
                          if (size === '2v2') setNewRoomTeamSize(2);
                          if (size === '3v3') setNewRoomTeamSize(3);
                          if (size === '4v4') setNewRoomTeamSize(4);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-yellow-400 cursor-pointer"
                      >
                        <option value="1v1">1v1 - Campo Clássico (860 x 430)</option>
                        <option value="2v2">2v2 - Campo Médio (1140 x 570)</option>
                        <option value="3v3">3v3 - Campo Grande (1400 x 700)</option>
                        <option value="4v4">4v4 - Estádio Monumental (1680 x 840)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Meta de Gols</label>
                      <select
                        value={newGoalLimit}
                        onChange={(e) => setNewGoalLimit(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-yellow-400 cursor-pointer"
                      >
                        <option value={3}>3 Gols (Partida Rápida)</option>
                        <option value={5}>5 Gols (Tempo Normal)</option>
                        <option value={7}>7 Gols (Duelo Livre)</option>
                        <option value={10}>10 Gols (Maratona)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase cursor-pointer shadow transition-all"
                  >
                    CRIAR E ABRIR SALA ONLINE
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ABA 3: CONTROLES HUD                                                      */}
            {/* ========================================================================= */}
            {activeTab === 'hud' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                    Presets de Controles
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        onHudChange({
                          ...hudConfig,
                          joystickMode: 'fixed',
                          joystickSize: 130,
                          kickSize: 84,
                          opacity: 0.9,
                        })
                      }
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-center cursor-pointer"
                    >
                      Padrão Fixo
                    </button>
                    <button
                      onClick={() =>
                        onHudChange({
                          ...hudConfig,
                          joystickMode: 'floating',
                          joystickSize: 140,
                          kickSize: 90,
                          opacity: 0.9,
                        })
                      }
                      className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold text-center cursor-pointer"
                    >
                      Pro Flutuante
                    </button>
                    <button
                      onClick={togglePureMode}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                        isPureMode
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-800 border-white/10 text-slate-300'
                      }`}
                    >
                      {isPureMode ? 'Puro Ativado ✨' : 'Ativar Modo Puro'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">Tamanho Analógico</span>
                      <span className="text-yellow-400">{hudConfig.joystickSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={90}
                      max={180}
                      step={5}
                      value={hudConfig.joystickSize}
                      onChange={(e) => onHudChange({ ...hudConfig, joystickSize: Number(e.target.value) })}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">Tamanho do Chute</span>
                      <span className="text-rose-400">{hudConfig.kickSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={64}
                      max={120}
                      step={4}
                      value={hudConfig.kickSize}
                      onChange={(e) => onHudChange({ ...hudConfig, kickSize: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ABA 4: GRÁFICOS & EFEITOS (COM BOTÃO MESTRE "TIRAR TUDO")                 */}
            {/* ========================================================================= */}
            {activeTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* BANNER MESTRE: TIRAR TODOS OS EFEITOS */}
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm sm:text-base font-black uppercase text-white">
                        Função: Desativar Todos os Efeitos (Modo Puro)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg">
                      Desativa de uma vez partículas, confetes, rastro da bola, tremor de tela, câmera lenta e mira laser. Deixa o jogo 100% focado na física pura, leveza e alta taxa de quadros.
                    </p>
                  </div>

                  <button
                    onClick={togglePureMode}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow transition-all shrink-0 ${
                      isPureMode
                        ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {isPureMode ? 'EFEITOS DESLIGADOS (PURO)' : 'DESLIGAR TODOS OS EFEITOS'}
                  </button>
                </div>

                {/* Controles Individuais */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                    Ajustes Individuais de Gráficos
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, showVisualEffects: !hudConfig.showVisualEffects })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Partículas & Faíscas</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.showVisualEffects ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                        {hudConfig.showVisualEffects ? 'LIGADO' : 'DESLIGADO'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, showBallTrail: !hudConfig.showBallTrail })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Rastro da Bola (Blur)</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.showBallTrail ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                        {hudConfig.showBallTrail ? 'LIGADO' : 'DESLIGADO'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, enableScreenShake: !hudConfig.enableScreenShake })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Tremor de Tela (Shake)</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.enableScreenShake ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                        {hudConfig.enableScreenShake ? 'LIGADO' : 'DESLIGADO'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, showAimLaser: !hudConfig.showAimLaser })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Linha de Mira do Chute</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.showAimLaser ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                        {hudConfig.showAimLaser ? 'LIGADO' : 'DESLIGADO'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, enableSlowMo: !hudConfig.enableSlowMo })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Câmera Lenta no Gol</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.enableSlowMo ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                        {hudConfig.enableSlowMo ? 'LIGADO' : 'DESLIGADO'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onHudChange({ ...hudConfig, cameraFollow: hudConfig.cameraFollow === 'broadcast' ? 'fixed' : 'broadcast' })}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-white/5 cursor-pointer hover:bg-slate-800"
                    >
                      <span className="font-bold text-slate-200">Câmera de Transmissão</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${hudConfig.cameraFollow === 'broadcast' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                        {hudConfig.cameraFollow === 'broadcast' ? 'SUAVE' : 'FIXA'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ABA 5: PERFIL & UNIFORME                                                  */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                    Uniforme & Cor do Disco
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => onProfileChange({ ...profile, color: c.color, accentColor: c.accent })}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          profile.color === c.color ? 'border-yellow-400 bg-white/10' : 'border-white/10 bg-slate-800/60'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-black/40" style={{ backgroundColor: c.color }} />
                        <span className="text-xs font-bold text-slate-200">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                    Número da Camisa
                  </span>
                  <div className="flex gap-2">
                    {['7', '9', '10', '11'].map((num) => (
                      <button
                        key={num}
                        onClick={() => onProfileChange({ ...profile, number: num })}
                        className={`w-12 h-12 rounded-xl border font-black text-sm cursor-pointer transition-all ${
                          profile.number === num ? 'border-yellow-400 bg-yellow-400 text-slate-950' : 'border-white/10 bg-slate-800 text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

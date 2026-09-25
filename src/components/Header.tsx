import React from 'react';
import { GameMode, MatchScore, PitchTheme } from '../game/types';
import { Volume2, VolumeX, Maximize2, HelpCircle, Trophy, Settings } from 'lucide-react';
import { toggleFullscreen } from '../utils/fullscreen';

interface HeaderProps {
  mode: GameMode;
  theme: PitchTheme;
  score: MatchScore;
  matchTime: number;
  matchDuration: number;
  scoreLimit: number;
  botDifficulty: 'easy' | 'medium' | 'hard';
  isMuted: boolean;
  onSelectMode: (mode: GameMode) => void;
  onSelectTheme: (theme: PitchTheme) => void;
  onSelectBotDifficulty: (diff: 'easy' | 'medium' | 'hard') => void;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  onOpenCustomizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  theme,
  score,
  matchTime,
  matchDuration,
  botDifficulty,
  isMuted,
  onSelectMode,
  onSelectTheme,
  onSelectBotDifficulty,
  onToggleMute,
  onOpenHelp,
  onOpenCustomizer,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    toggleFullscreen().catch(() => {});
  };

  return (
    <header className="w-full bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-3 py-2 z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-amber-300/40">
              <span className="text-base">⚽</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">CHINA</span>
                <span className="text-amber-400">BALL</span>
              </h1>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Estilo HaxBall & MamoBall
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
            <button
              type="button"
              onClick={() => onSelectMode('TRAINING')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'TRAINING'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Treino
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('VS_BOT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'VS_BOT'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              vs Bot
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('LOCAL_2P')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'LOCAL_2P'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1v1 Local
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('PENALTIES')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'PENALTIES'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pênaltis
            </button>
          </div>
        </div>

        {/* Center: Scoreboard (for Matches and Shootouts) */}
        {mode !== 'TRAINING' ? (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-1 rounded-xl shadow-lg">
            {/* Red Team */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white/60 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              <span className="text-xs font-bold text-red-400 tracking-wider">VERMELHO</span>
              <span className="font-mono text-xl font-black text-white">{score.red}</span>
            </div>

            {/* Timer & Divider */}
            <div className="flex flex-col items-center px-2 border-x border-slate-700/80">
              <span className="font-mono text-xs font-bold text-amber-400">
                {formatTime(matchTime)}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {matchDuration > 0 ? `Max: ${formatTime(matchDuration)}` : 'Livre'}
              </span>
            </div>

            {/* Blue Team */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-white">{score.blue}</span>
              <span className="text-xs font-bold text-blue-400 tracking-wider">AZUL</span>
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white/60 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Treinamento Livre: Controle o analógico e chute a bola na rede!</span>
          </div>
        )}

        {/* Right Action Tools: Pitch Themes, Difficulty, Sound, Help */}
        <div className="flex items-center gap-2">
          {/* Pitch Theme Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              title="Gramado Clássico Haxball"
              onClick={() => onSelectTheme('classic')}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                theme === 'classic' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌱 Campo
            </button>
            <button
              type="button"
              title="Arena China Red"
              onClick={() => onSelectTheme('chinared')}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                theme === 'chinared' ? 'bg-red-800 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏮 China
            </button>
            <button
              type="button"
              title="Quadra de Futsal"
              onClick={() => onSelectTheme('futsal')}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                theme === 'futsal' ? 'bg-sky-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏟️ Futsal
            </button>
          </div>

          {/* Bot Difficulty if in VS_BOT */}
          {mode === 'VS_BOT' && (
            <select
              value={botDifficulty}
              onChange={(e) => onSelectBotDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 px-2 py-1 cursor-pointer outline-none"
            >
              <option value="easy">IA Fácil</option>
              <option value="medium">IA Médio</option>
              <option value="hard">IA Lenda</option>
            </select>
          )}

          {/* Player Customizer Button */}
          <button
            type="button"
            onClick={onOpenCustomizer}
            title="Personalizar Camisa e Número"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Ativar Sons' : 'Silenciar Sons'}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleFullscreen}
            title="Tela Cheia"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Help Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            title="Como Jogar & Controles"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { TrainingStats } from '../game/types';
import { RotateCcw, Target, Shield, Compass, Zap, Flame } from 'lucide-react';

interface TrainingPanelProps {
  stats: TrainingStats;
  currentSpeed: number;
  showCones: boolean;
  showTargets: boolean;
  showKeeper: boolean;
  onResetBallToPlayer: () => void;
  onResetBallToCenter: () => void;
  onToggleCones: () => void;
  onToggleTargets: () => void;
  onToggleKeeper: () => void;
  onResetPositions: () => void;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({
  stats,
  currentSpeed,
  showCones,
  showTargets,
  showKeeper,
  onResetBallToPlayer,
  onResetBallToCenter,
  onToggleCones,
  onToggleTargets,
  onToggleKeeper,
  onResetPositions,
}) => {
  return (
    <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-xl p-3 md:p-4 backdrop-blur-md shadow-2xl flex flex-col gap-3">
      {/* Header and Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm md:text-base font-bold text-white tracking-wide uppercase font-sans flex items-center gap-1.5">
            <span>⚽ Modo Treino</span>
            <span className="text-xs font-normal text-slate-400">| Prática Livre</span>
          </h2>
        </div>

        {/* Speedometer & Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Current Shot Speed */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Velocidade:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{currentSpeed} km/h</span>
          </div>

          {/* Top Speed */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Recorde:</span>
            <span className="font-mono font-bold text-red-300 text-sm">{stats.topSpeedKmh} km/h</span>
          </div>

          {/* Goals count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400">Gols:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{stats.goalsScored}</span>
          </div>

          {/* Shots Total */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400">Chutes:</span>
            <span className="font-mono font-bold text-slate-200 text-sm">{stats.shotsTotal}</span>
          </div>

          {/* Targets hit */}
          {showTargets && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Alvos:</span>
              <span className="font-mono font-bold text-yellow-400 text-sm">{stats.targetsHit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Drill Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Ball Reset */}
          <button
            type="button"
            onClick={onResetBallToPlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trazer Bola ao Jogador</span>
          </button>

          <button
            type="button"
            onClick={onResetBallToCenter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span>Bola ao Meio</span>
          </button>

          <button
            type="button"
            onClick={onResetPositions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span>Reiniciar Posições</span>
          </button>
        </div>

        {/* Drill Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleCones}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showCones
                ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Cones Slalom</span>
          </button>

          <button
            type="button"
            onClick={onToggleTargets}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showTargets
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alvos na Trave</span>
          </button>

          <button
            type="button"
            onClick={onToggleKeeper}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showKeeper
                ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Goleiro Robô</span>
          </button>
        </div>
      </div>
    </div>
  );
};

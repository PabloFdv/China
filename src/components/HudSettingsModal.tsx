import React from 'react';
import { X, Check, RotateCcw, Eye, Vibrate, Activity, Sparkles, Wand2, Video } from 'lucide-react';
import { KickColor } from './SimpleKickButton';

export interface HudConfig {
  layout: 'default' | 'inverted';
  joystickMode: 'fixed' | 'floating';
  joystickSize: number;
  kickSize: number;
  opacity: number;
  verticalMargin: 'low' | 'medium' | 'high';
  joystickOffsetX: number;
  joystickOffsetY: number;
  kickOffsetX: number;
  kickOffsetY: number;
  kickColor: KickColor;
  cameraZoom: 'auto' | 'wide' | 'close';
  vibration: boolean;
  showDebugPhysics: boolean;
  orientationMode: 'auto' | 'landscape' | 'portrait';

  // Configurações de Gráficos & Efeitos Visuais
  showVisualEffects: boolean;     // Partículas de grama, faíscas da trave, confetes
  showBallTrail: boolean;         // Rastro da bola em velocidade (motion blur)
  enableScreenShake: boolean;     // Tremor de tela nos impactos fortes
  showAimLaser: boolean;          // Guia laser pontilhado de mira do chute
  enableSlowMo: boolean;          // Câmera lenta dramática no momento do gol
  cameraFollow: 'broadcast' | 'fixed'; // Câmera de transmissão suave ou fixa no meio
}

export const DEFAULT_HUD_CONFIG: HudConfig = {
  layout: 'default',
  joystickMode: 'fixed',
  joystickSize: 130,
  kickSize: 84,
  opacity: 0.90,
  verticalMargin: 'medium',
  joystickOffsetX: 24,
  joystickOffsetY: 24,
  kickOffsetX: 24,
  kickOffsetY: 24,
  kickColor: 'red',
  cameraZoom: 'auto',
  vibration: true,
  showDebugPhysics: false,
  orientationMode: 'auto',
  showVisualEffects: true,
  showBallTrail: true,
  enableScreenShake: true,
  showAimLaser: true,
  enableSlowMo: true,
  cameraFollow: 'broadcast',
};

interface HudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HudConfig;
  onChange: (newConfig: HudConfig) => void;
}

export const HudSettingsModal: React.FC<HudSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  const applyPreset = (preset: 'default' | 'pro' | 'clean') => {
    if (preset === 'default') {
      onChange({ ...DEFAULT_HUD_CONFIG });
    } else if (preset === 'pro') {
      onChange({
        ...config,
        joystickMode: 'floating',
        joystickSize: 140,
        kickSize: 90,
        opacity: 0.85,
        cameraZoom: 'auto',
        showVisualEffects: true,
        showBallTrail: true,
        enableScreenShake: true,
        showAimLaser: true,
        enableSlowMo: true,
        cameraFollow: 'broadcast',
      });
    } else if (preset === 'clean') {
      // Modo Puro & Limpo: zero efeitos visuais, física 100% autêntica e tranquila
      onChange({
        ...config,
        showVisualEffects: false,
        showBallTrail: false,
        enableScreenShake: false,
        showAimLaser: false,
        enableSlowMo: false,
        cameraFollow: 'fixed',
        showDebugPhysics: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 shadow-2xl text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase">Ajustes & Gráficos</h2>
              <p className="text-[11px] text-slate-400">Personalize controles e ative ou desative efeitos visuais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Estilos Rápidos</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => applyPreset('default')}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-200 cursor-pointer text-center"
            >
              Completo
            </button>
            <button
              onClick={() => applyPreset('pro')}
              className="py-1.5 px-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/40 text-xs font-bold text-yellow-300 cursor-pointer text-center"
            >
              Pro Flutuante
            </button>
            <button
              onClick={() => applyPreset('clean')}
              className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-300 cursor-pointer text-center"
            >
              Puro & Limpo ✨
            </button>
          </div>
        </div>

        {/* SEÇÃO: GRÁFICOS & EFEITOS (LIGAR / DESLIGAR) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-yellow-400 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Efeitos Visuais & Gráficos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Partículas e Confetes */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <span className="text-xs font-bold text-slate-200">Partículas & Confetes</span>
              <button
                onClick={() => onChange({ ...config, showVisualEffects: !config.showVisualEffects })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.showVisualEffects ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.showVisualEffects ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>

            {/* Rastro da Bola */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <span className="text-xs font-bold text-slate-200">Rastro da Bola (Blur)</span>
              <button
                onClick={() => onChange({ ...config, showBallTrail: !config.showBallTrail })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.showBallTrail ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.showBallTrail ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>

            {/* Tremor de Tela */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <span className="text-xs font-bold text-slate-200">Tremor de Tela (Shake)</span>
              <button
                onClick={() => onChange({ ...config, enableScreenShake: !config.enableScreenShake })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.enableScreenShake ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.enableScreenShake ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>

            {/* Guia Laser de Mira */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <span className="text-xs font-bold text-slate-200">Linha de Mira do Chute</span>
              <button
                onClick={() => onChange({ ...config, showAimLaser: !config.showAimLaser })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.showAimLaser ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.showAimLaser ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>

            {/* Slow-mo no Gol */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <span className="text-xs font-bold text-slate-200">Câmera Lenta no Gol</span>
              <button
                onClick={() => onChange({ ...config, enableSlowMo: !config.enableSlowMo })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.enableSlowMo ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.enableSlowMo ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>

            {/* Câmera Suave vs Fixa */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Câmera de Transmissão</span>
              </div>
              <button
                onClick={() => onChange({ ...config, cameraFollow: config.cameraFollow === 'broadcast' ? 'fixed' : 'broadcast' })}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                  config.cameraFollow === 'broadcast' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {config.cameraFollow === 'broadcast' ? 'SUAVE' : 'FIXA'}
              </button>
            </div>
          </div>
        </div>

        {/* Posição dos Controles */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-slate-300">Posição dos Controles</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...config, layout: 'default' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                config.layout === 'default'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/10 bg-slate-800/80 text-slate-300'
              }`}
            >
              {config.layout === 'default' && <Check className="w-3.5 h-3.5" />}
              <span>Esquerda: Analógico | Direita: Chute</span>
            </button>

            <button
              onClick={() => onChange({ ...config, layout: 'inverted' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                config.layout === 'inverted'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/10 bg-slate-800/80 text-slate-300'
              }`}
            >
              {config.layout === 'inverted' && <Check className="w-3.5 h-3.5" />}
              <span>Invertido (Canhoto)</span>
            </button>
          </div>
        </div>

        {/* Modo do Analógico: Flutuante vs Fixo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300">Comportamento do Analógico</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...config, joystickMode: 'fixed' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                config.joystickMode === 'fixed'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/10 bg-slate-800/80 text-slate-300'
              }`}
            >
              {config.joystickMode === 'fixed' && <Check className="w-3.5 h-3.5" />}
              <span>Analógico Fixo</span>
            </button>

            <button
              onClick={() => onChange({ ...config, joystickMode: 'floating' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                config.joystickMode === 'floating'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/10 bg-slate-800/80 text-slate-300'
              }`}
            >
              {config.joystickMode === 'floating' && <Check className="w-3.5 h-3.5" />}
              <span>Dinâmico / Flutuante ⭐</span>
            </button>
          </div>
        </div>

        {/* Câmera / Zoom do Campo */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Eye className="w-3.5 h-3.5 text-yellow-400" />
            <span>Câmera / Zoom do Campo</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'wide', 'close'] as const).map((z) => (
              <button
                key={z}
                onClick={() => onChange({ ...config, cameraZoom: z })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-bold cursor-pointer ${
                  config.cameraZoom === z
                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                    : 'border-white/10 bg-slate-800/80 text-slate-300'
                }`}
              >
                {z === 'auto' ? 'Automático' : z === 'wide' ? 'Visão Ampla' : 'Visão Próxima'}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders de Tamanho dos Controles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Tamanho Analógico</span>
              <span className="text-yellow-400">{config.joystickSize}px</span>
            </div>
            <input
              type="range"
              min="90"
              max="170"
              step="4"
              value={config.joystickSize}
              onChange={(e) =>
                onChange({ ...config, joystickSize: Number(e.target.value) })
              }
              className="accent-yellow-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Tamanho Chute</span>
              <span className="text-rose-400">{config.kickSize}px</span>
            </div>
            <input
              type="range"
              min="64"
              max="120"
              step="4"
              value={config.kickSize}
              onChange={(e) =>
                onChange({ ...config, kickSize: Number(e.target.value) })
              }
              className="accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Opacidade e Cor do Botão */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Opacidade HUD</span>
              <span className="text-cyan-400">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="1"
              step="0.05"
              value={config.opacity}
              onChange={(e) =>
                onChange({ ...config, opacity: Number(e.target.value) })
              }
              className="accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-300">Cor do Chute</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {(
                [
                  { id: 'red', color: 'bg-red-500', name: 'Vermelho' },
                  { id: 'gold', color: 'bg-yellow-400', name: 'Ouro' },
                  { id: 'blue', color: 'bg-blue-500', name: 'Azul' },
                  { id: 'green', color: 'bg-emerald-500', name: 'Verde' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onChange({ ...config, kickColor: c.id })}
                  title={c.name}
                  className={`w-7 h-7 rounded-full ${c.color} border-2 cursor-pointer transition-transform ${
                    config.kickColor === c.id ? 'border-white scale-110 shadow-lg' : 'border-black/50 opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Vibração Tátil */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Vibração Tátil no Chute (Celular)</span>
          </div>
          <button
            onClick={() => onChange({ ...config, vibration: !config.vibration })}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              config.vibration ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {config.vibration ? 'ATIVADA' : 'DESATIVADA'}
          </button>
        </div>

        {/* Sensores de Debug da Física (Vetores & Normais) */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Sensor de Física & Vetores</span>
              <span className="text-[10px] text-slate-400">Mostra vetores de velocidade, normal de contato e energia</span>
            </div>
          </div>
          <button
            onClick={() => onChange({ ...config, showDebugPhysics: !config.showDebugPhysics })}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              config.showDebugPhysics ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {config.showDebugPhysics ? 'ATIVADO' : 'DESLIGADO'}
          </button>
        </div>

        {/* Botão Concluído */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onChange({ ...DEFAULT_HUD_CONFIG })}
            title="Restaurar padrão"
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black tracking-wide text-sm transition-transform active:scale-98 shadow-lg cursor-pointer text-center"
          >
            CONCLUIR & JOGAR
          </button>
        </div>
      </div>
    </div>
  );
};

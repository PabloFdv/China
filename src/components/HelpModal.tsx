import React from 'react';
import { X, Gamepad2, Play, Flame, Target } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Como Jogar China Ball</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs md:text-sm leading-relaxed">
          {/* Controls highlight */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h3 className="font-bold text-amber-400 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>Controles na Tela (Mobile & Desktop)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-white block mb-1">🕹️ Analógico Virtual</span>
                <p className="text-slate-400 text-xs">
                  Arraste o analógico no canto inferior esquerdo para correr em qualquer ângulo (360°).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-white block mb-1">🔴 Botão de Chute</span>
                <p className="text-slate-400 text-xs">
                  Toque no grande botão vermelho no canto direito para chutar com potência ao se aproximar da bola.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block mb-1">⌨️ Teclas de Teclado (PC)</span>
              <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
                <li><strong className="text-slate-200">W, A, S, D</strong> ou <strong className="text-slate-200">Setas</strong>: Movimentação</li>
                <li><strong className="text-slate-200">Barra de Espaço</strong> ou <strong className="text-slate-200">Tecla X</strong>: Chute</li>
                <li>Player 2 (Modo 1v1): Setas + Tecla Enter / M</li>
              </ul>
            </div>
          </div>

          {/* Game Modes */}
          <div className="space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Modos de Jogo Completos</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <strong className="text-emerald-400">Modo Treino Livre:</strong> Campo aberto somente para você e a bola. Use o velocímetro, ative cones de slalom, alvos na trave (+50 pts) e teste chutes contra o goleiro robô!
              </li>
              <li className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <strong className="text-blue-400">vs Bot Inteligente:</strong> Enfrente a inteligência artificial com 3 dificuldades (Fácil, Médio e Lenda).
              </li>
              <li className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <strong className="text-red-400">1v1 Local:</strong> Desafie um amigo no mesmo dispositivo com 2 jogadores simultâneos!
              </li>
              <li className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <strong className="text-amber-400">Desafio de Pênaltis:</strong> Cobranças diretas mano a mano contra o paredão!
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-slate-300 flex items-start gap-2">
            <Target className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>Dica de Mestre:</strong> Mantenha o botão de chute pressionado logo antes do impacto com a bola para disparar bombas indefensáveis no ângulo!
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
          >
            Bora Jogar! ⚽
          </button>
        </div>
      </div>
    </div>
  );
};

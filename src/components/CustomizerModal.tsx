import React, { useState } from 'react';
import { Player } from '../game/types';
import { X, Check } from 'lucide-react';

interface CustomizerModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: { name: string; number: string; color: string; accentColor: string }) => void;
}

const COLOR_PRESETS = [
  { name: 'China Red', color: '#ef4444', accent: '#fca5a5' },
  { name: 'Dragão Dourado', color: '#eab308', accent: '#fef08a' },
  { name: 'Azul Celeste', color: '#0284c7', accent: '#7dd3fc' },
  { name: 'Brasil Verde', color: '#16a34a', accent: '#86efac' },
  { name: 'Roxo Imperial', color: '#9333ea', accent: '#d8b4fe' },
  { name: 'Preto & Branco', color: '#1e293b', accent: '#f8fafc' },
];

export const CustomizerModal: React.FC<CustomizerModalProps> = ({ player, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number);
  const [selectedColor, setSelectedColor] = useState({
    color: player.color,
    accent: player.accentColor,
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Jogador',
      number: number.trim().slice(0, 3) || '7',
      color: selectedColor.color,
      accentColor: selectedColor.accent,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👕 Personalizar Jogador</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview of the Player Avatar */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-950/80 border border-slate-800 shadow-inner">
            <div
              style={{
                backgroundColor: selectedColor.color,
                borderColor: selectedColor.accent,
              }}
              className="w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg text-white font-extrabold text-xl font-mono"
            >
              {number || '7'}
            </div>
          </div>
          <span className="mt-2 text-sm font-bold text-slate-200">{name || 'Jogador'}</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Jogador</label>
            <input
              type="text"
              maxLength={14}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Número da Camisa</label>
            <input
              type="text"
              maxLength={2}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Cor do Uniforme</label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setSelectedColor({ color: preset.color, accent: preset.accent })}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    selectedColor.color === preset.color
                      ? 'border-white bg-slate-800 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    style={{ backgroundColor: preset.color }}
                    className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                  />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

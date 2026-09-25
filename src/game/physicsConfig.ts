// ============================================================================
// CONSTANTES FÍSICAS CENTRAIS - PADRÃO HAXBALL / MAMOBALL COMPETITIVO & FLUIDO
// ============================================================================

export type MapSize = '1v1' | '2v2' | '3v3' | '4v4';

export interface FieldDimensions {
  id: MapSize;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  wallThick: number;
  goalWidth: number;
  goalDepth: number;
  postRadius: number;
  borderMargin: number;
  penaltyBoxW: number;
  penaltyBoxH: number;
  goalBoxW: number;
  goalBoxH: number;
  centerCircleR: number;
  numStripes: number;
}

export const MAP_DIMENSIONS: Record<MapSize, FieldDimensions> = {
  '1v1': {
    id: '1v1',
    name: '1v1 Clássico',
    subtitle: 'Duelo rápido e técnico',
    width: 860,
    height: 430,
    wallThick: 14,
    goalWidth: 140,
    goalDepth: 55,
    postRadius: 7.0,
    borderMargin: 40,
    penaltyBoxW: 90,
    penaltyBoxH: 220,
    goalBoxW: 35,
    goalBoxH: 130,
    centerCircleR: 70,
    numStripes: 14,
  },
  '2v2': {
    id: '2v2',
    name: '2v2 Médio',
    subtitle: 'Tabelas e passes rápidos',
    width: 1140,
    height: 570,
    wallThick: 14,
    goalWidth: 165,
    goalDepth: 65,
    postRadius: 7.5,
    borderMargin: 40,
    penaltyBoxW: 115,
    penaltyBoxH: 280,
    goalBoxW: 44,
    goalBoxH: 160,
    centerCircleR: 85,
    numStripes: 16,
  },
  '3v3': {
    id: '3v3',
    name: '3v3 Grande',
    subtitle: 'Tática, espaço e cobertura',
    width: 1400,
    height: 700,
    wallThick: 14,
    goalWidth: 190,
    goalDepth: 75,
    postRadius: 8.0,
    borderMargin: 40,
    penaltyBoxW: 140,
    penaltyBoxH: 340,
    goalBoxW: 52,
    goalBoxH: 190,
    centerCircleR: 100,
    numStripes: 18,
  },
  '4v4': {
    id: '4v4',
    name: '4v4 Monumental',
    subtitle: 'Estádio oficial com amplitude total',
    width: 1680,
    height: 840,
    wallThick: 14,
    goalWidth: 215,
    goalDepth: 85,
    postRadius: 8.5,
    borderMargin: 40,
    penaltyBoxW: 165,
    penaltyBoxH: 400,
    goalBoxW: 60,
    goalBoxH: 220,
    centerCircleR: 115,
    numStripes: 20,
  },
};

export const HAXBALL = {
  // Dimensões padrão iniciais (1v1)
  field: MAP_DIMENSIONS['1v1'],

  // --- FÍSICA DO JOGADOR (LEVE, ÁGIL, CONTROLE SUAVE E ZERO DESLIZE) ---
  player: {
    radius: 16.0,                 // Raio do disco do jogador
    mass: 2.0,                    // Massa normalizada
    invMass: 0.5,                 // 1 / 2.0
    bCoef: 0.50,                  // Coeficiente elástico base entre jogadores
    maxSpeed: 2.85,               // Velocidade equilibrada e controlada
    acceleration: 0.28,           // Arrancada imediata, leve e ágil ao menor toque
    kickingAcceleration: 0.18,    // Aceleração mantida durante o chute
    damping: 0.960,               // Amortecimento suave durante corrida ativa
    brakeDamping: 0.875,          // Tração firme imediata ao soltar o analógico (elimina deslize)
    counterBrakeFactor: 0.90,     // Freio dinâmico na mudança de sentido (cortes precisos)
    minSpeedThreshold: 0.015,     // Limite mínimo para parar com firmeza absoluta
  },

  // --- FÍSICA DA BOLA (MOVIMENTO NATURAL, ROLAMENTO PURO E TRANQUILO DE JOGAR) ---
  ball: {
    radius: 10.0,                 // Raio da bola
    mass: 1.0,                    // Massa da bola
    invMass: 1.0,                 // 1 / 1.0
    bCoef: 0.50,                  // Coeficiente elástico genuíno do Haxball
    damping: 0.985,               // Atrito contínuo e sedoso do gramado (rola limpa e suave)
    maxSpeed: 7.20,               // Velocidade máxima agradável e limpa
    minSpeedThreshold: 0.018,     // Limite mínimo para parar naturalmente
  },

  // --- SISTEMA DE CHUTE (PUNCHY, PRECISO, EQUILIBRADO E COM GOSTO DE JOGAR) ---
  kick: {
    basePower: 5.3,               // Força de chute firme e nítida
    playerSpeedBonus: 0.35,       // Bônus moderado do momentum da corrida do jogador
    reachMargin: 7.5,             // Alcance generoso e confortável do chute além do raio
    cooldownTicks: 7,             // Cooldown entre chutes
    analogAimWeight: 0.60,        // Peso da mira do analógico
    contactNormalWeight: 0.40,    // Peso da normal geométrica
  },

  // --- TABELAS E PAREDES ---
  wallBounce: {
    speedRetention: 0.95,         // 95% de retenção nas tabelas
    playerWallRestitution: 0.20,  // Jogador não quica na parede
  },

  // --- POSTES ---
  post: {
    radius: 7.0,
    bCoef: 0.55,
  },
} as const;

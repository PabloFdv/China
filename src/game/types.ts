export type GameMode = 'TRAINING' | 'VS_BOT' | 'LOCAL_2P' | 'PENALTIES';

export type PitchTheme = 'classic' | 'futsal' | 'chinared' | 'street';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  team: 'red' | 'blue' | 'neutral';
  color: string;
  accentColor: string;
  number: string;
  isKicking: boolean;
  kickCooldown: number;
  isBot?: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  lastTouchTeam?: 'red' | 'blue';
  lastTouchPlayer?: string;
  speedKmh: number;
  maxSpeedKmh: number;
}

export interface GoalPost {
  x: number;
  y: number;
  radius: number;
  team: 'red' | 'blue';
}

export interface Cone {
  x: number;
  y: number;
  radius: number;
}

export interface GoalTarget {
  x: number;
  y: number;
  radius: number;
  hit: boolean;
  score: number;
}

export interface MatchScore {
  red: number;
  blue: number;
}

export interface TrainingStats {
  shotsTotal: number;
  shotsOnTarget: number;
  goalsScored: number;
  targetsHit: number;
  topSpeedKmh: number;
}

// ============================================================================
// CHINABALL ENGINE - MOTOR FÍSICO 2D PROFISSIONAL & FLUIDO (HAXBALL / MAMOBALL)
// ============================================================================

import { HAXBALL, MapSize, MAP_DIMENSIONS, FieldDimensions } from './physicsConfig';
import { sounds } from '../audio/soundManager';

export interface Disc {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  invMass: number;
  bCoef: number;
}

export interface PlayerDisc extends Disc {
  id: string;
  name: string;
  team: 'red' | 'blue';
  role: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
  isBot: boolean;
  number?: string;
  color?: string;
  accentColor?: string;
  isKicking?: boolean;
  kickCooldown?: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bCoef: number;
  isGoalNet?: boolean;
}

export interface Post {
  x: number;
  y: number;
  r: number;
  bCoef: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface BallTrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface PhysicsDebugData {
  enabled: boolean;
  lastCollisionNormal: { x: number; y: number };
  lastRelativeVelocity: number;
  lastNormalComponent: number;
  lastTangentialComponent: number;
  lastContactType: 'kick' | 'dribble' | 'frontal' | 'glance' | 'none';
  lastWallEnergyLoss: number;
  ballSpeed: number;
  playerSpeed: number;
  kineticEnergyTotal: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class ChinaBallEngine {
  // Configurações do Formato de Jogo e Mapa
  public mapSize: MapSize = '1v1';
  public teamSize: 1 | 2 | 3 | 4 = 1;
  public field: FieldDimensions = MAP_DIMENSIONS['1v1'];

  // Lista unificada de todos os jogadores em campo
  public players: PlayerDisc[] = [];

  // Atalhos diretos para compatibilidade com interface existente
  public player!: PlayerDisc;
  public bot!: PlayerDisc;

  public botActive = true;
  public botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  public botIsKicking = false;
  public botKickCooldown = 0;

  // Bola Oficial
  public ball: Disc = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: HAXBALL.ball.radius,
    mass: HAXBALL.ball.mass,
    invMass: HAXBALL.ball.invMass,
    bCoef: HAXBALL.ball.bCoef,
  };

  // Rotação visual e spin da bola
  public ballAngle = 0;
  public prevBallAngle = 0;
  public ballAngularVelocity = 0;

  public walls: Segment[] = [];
  public posts: Post[] = [];

  public scoreYellow = 0;
  public scoreBlue = 0;
  public goalMessage = '';
  public goalCooldownTicks = 0;
  public slowMoTicks = 0;

  public isKicking = false;
  public kickCooldown = 0;

  // Efeitos visuais táteis (Juice do jogo)
  public enableEffects = true;
  public enableSlowMo = true;
  public particles: Particle[] = [];
  public shockwaves: Shockwave[] = [];
  public ballTrail: BallTrailPoint[] = [];
  public screenShake = 0;

  // Telemetria de debug opcional
  public debug: PhysicsDebugData = {
    enabled: false,
    lastCollisionNormal: { x: 0, y: 0 },
    lastRelativeVelocity: 0,
    lastNormalComponent: 0,
    lastTangentialComponent: 0,
    lastContactType: 'none',
    lastWallEnergyLoss: 0,
    ballSpeed: 0,
    playerSpeed: 0,
    kineticEnergyTotal: 0,
  };

  // Modo Treino Solo Aprimorado
  public isSoloMode = false;
  public soloGoals = 0;
  public soloStreak = 0;
  public fastestShot = 0;

  constructor() {
    this.setMatchFormat(1, '1v1', false);
  }

  /**
   * Configura o formato do jogo (1v1 até 4v4) e o mapa correspondente
   */
  public setMatchFormat(teamSize: 1 | 2 | 3 | 4, mapSize?: MapSize, isSolo = false) {
    this.teamSize = teamSize;
    this.isSoloMode = isSolo;
    if (mapSize) {
      this.mapSize = mapSize;
    } else {
      this.mapSize = `${teamSize}v${teamSize}` as MapSize;
    }
    this.field = MAP_DIMENSIONS[this.mapSize] || MAP_DIMENSIONS['1v1'];

    this.buildStadium();
    this.setupPlayers();
    this.resetToKickoff();
  }

  /**
   * Invoca a bola imediatamente aos pés do jogador (Modo Solo ou Treino Rápido)
   */
  public recallBallToPlayer() {
    const hw = this.field.width / 2;
    const forwardX = this.player.x > hw * 0.3 ? -1 : 1;
    this.ball.x = this.player.x + forwardX * 32;
    this.ball.y = this.player.y;
    this.ball.prevX = this.ball.x;
    this.ball.prevY = this.ball.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ballAngularVelocity = 0;
    this.ballTrail = [];
  }

  public resetBallToPlayer() {
    this.recallBallToPlayer();
  }

  /**
   * Instancia os jogadores dos dois times de acordo com o tamanho do time (1x1 até 4x4)
   * Se for Modo Solo, deixa o campo 100% limpo com apenas o jogador para treino livre
   */
  private setupPlayers() {
    this.players = [];

    // Nomes e números para ambientação autêntica de futebol
    const redSquad = [
      { name: 'Você (P1)', number: '10', role: 'striker' as const },
      { name: 'Neymar', number: '11', role: 'striker' as const },
      { name: 'Casemiro', number: '5', role: 'defender' as const },
      { name: 'Alisson', number: '1', role: 'goalkeeper' as const },
    ];

    const blueSquad = [
      { name: 'Mbappé', number: '7', role: 'striker' as const },
      { name: 'Haaland', number: '9', role: 'striker' as const },
      { name: 'Van Dijk', number: '4', role: 'defender' as const },
      { name: 'Courtois', number: '1', role: 'goalkeeper' as const },
    ];

    // Se estiver em MODO SOLO: somente o jogador humano no campo!
    if (this.isSoloMode) {
      this.botActive = false;
      const p: PlayerDisc = {
        id: 'red-0',
        name: 'Você (Solo)',
        team: 'red',
        role: 'striker',
        isBot: false,
        number: '10',
        color: '#f4d025',
        accentColor: '#1e293b',
        x: -120,
        y: 0,
        prevX: -120,
        prevY: 0,
        vx: 0,
        vy: 0,
        radius: HAXBALL.player.radius,
        mass: HAXBALL.player.mass,
        invMass: HAXBALL.player.invMass,
        bCoef: HAXBALL.player.bCoef,
        kickCooldown: 0,
        isKicking: false,
      };
      this.players.push(p);
      this.player = p;
      return;
    }

    // Modo Normal / Bots: Cria jogadores do Time Amarelo/Vermelho (Casa)
    for (let i = 0; i < this.teamSize; i++) {
      const info = redSquad[i] || { name: `Red ${i + 1}`, number: `${i + 1}`, role: 'midfielder' as const };
      const isHuman = i === 0;
      const p: PlayerDisc = {
        id: `red-${i}`,
        name: isHuman ? 'Você' : info.name,
        team: 'red',
        role: info.role,
        isBot: !isHuman,
        number: info.number,
        color: '#f4d025',
        accentColor: '#1e293b',
        x: -120,
        y: 0,
        prevX: -120,
        prevY: 0,
        vx: 0,
        vy: 0,
        radius: HAXBALL.player.radius,
        mass: HAXBALL.player.mass,
        invMass: HAXBALL.player.invMass,
        bCoef: HAXBALL.player.bCoef,
        kickCooldown: 0,
        isKicking: false,
      };
      this.players.push(p);
    }

    // Cria jogadores do Time Azul (Visitante)
    for (let i = 0; i < this.teamSize; i++) {
      const info = blueSquad[i] || { name: `Blue ${i + 1}`, number: `${i + 1}`, role: 'midfielder' as const };
      const p: PlayerDisc = {
        id: `blue-${i}`,
        name: info.name,
        team: 'blue',
        role: info.role,
        isBot: true,
        number: info.number,
        color: '#1e5cd8',
        accentColor: '#ffffff',
        x: 120,
        y: 0,
        prevX: 120,
        prevY: 0,
        vx: 0,
        vy: 0,
        radius: HAXBALL.player.radius,
        mass: HAXBALL.player.mass,
        invMass: HAXBALL.player.invMass,
        bCoef: HAXBALL.player.bCoef,
        kickCooldown: 0,
        isKicking: false,
      };
      this.players.push(p);
    }

    this.player = this.players[0];
    this.bot = this.players.find((p) => p.team === 'blue') || this.players[1];
    this.botActive = true;
  }

  /**
   * Geometria padrão do estádio baseada no mapa selecionado (1x1 até 4x4)
   */
  public buildStadium() {
    this.walls = [];
    this.posts = [];

    const hw = this.field.width / 2;
    const hh = this.field.height / 2;
    const gw = this.field.goalWidth / 2;
    const gd = this.field.goalDepth;

    // Paredes do perímetro de jogo (tabelas)
    // Linha superior
    this.walls.push({ x1: -hw, y1: -hh, x2: hw, y2: -hh, bCoef: HAXBALL.wallBounce.speedRetention });
    // Linha inferior
    this.walls.push({ x1: -hw, y1: hh, x2: hw, y2: hh, bCoef: HAXBALL.wallBounce.speedRetention });

    // Fundo esquerdo (acima e abaixo da trave esquerda)
    this.walls.push({ x1: -hw, y1: -hh, x2: -hw, y2: -gw, bCoef: HAXBALL.wallBounce.speedRetention });
    this.walls.push({ x1: -hw, y1: gw, x2: -hw, y2: hh, bCoef: HAXBALL.wallBounce.speedRetention });

    // Fundo direito (acima e abaixo da trave direita)
    this.walls.push({ x1: hw, y1: -hh, x2: hw, y2: -gw, bCoef: HAXBALL.wallBounce.speedRetention });
    this.walls.push({ x1: hw, y1: gw, x2: hw, y2: hh, bCoef: HAXBALL.wallBounce.speedRetention });

    // Redes da baliza esquerda (amortecem a bola suavemente)
    this.walls.push({ x1: -hw - gd, y1: -gw, x2: -hw - gd, y2: gw, bCoef: 0.18, isGoalNet: true });
    this.walls.push({ x1: -hw, y1: -gw, x2: -hw - gd, y2: -gw, bCoef: 0.18, isGoalNet: true });
    this.walls.push({ x1: -hw, y1: gw, x2: -hw - gd, y2: gw, bCoef: 0.18, isGoalNet: true });

    // Redes da baliza direita
    this.walls.push({ x1: hw + gd, y1: -gw, x2: hw + gd, y2: gw, bCoef: 0.18, isGoalNet: true });
    this.walls.push({ x1: hw, y1: -gw, x2: hw + gd, y2: -gw, bCoef: 0.18, isGoalNet: true });
    this.walls.push({ x1: hw, y1: gw, x2: hw + gd, y2: gw, bCoef: 0.18, isGoalNet: true });

    // Postes físicos metálicos circulares (4 traves)
    const postR = this.field.postRadius;
    const postBcoef = HAXBALL.post.bCoef;

    this.posts.push({ x: -hw, y: -gw, r: postR, bCoef: postBcoef, color: '#ffffff' });
    this.posts.push({ x: -hw, y: gw, r: postR, bCoef: postBcoef, color: '#ffffff' });
    this.posts.push({ x: hw, y: -gw, r: postR, bCoef: postBcoef, color: '#ffffff' });
    this.posts.push({ x: hw, y: gw, r: postR, bCoef: postBcoef, color: '#ffffff' });
  }

  /**
   * REINÍCIO OFICIAL DE PARTIDA (KICKOFF FORMATION BALANCEADO)
   */
  public resetToKickoff() {
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.prevX = 0;
    this.ball.prevY = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ballAngularVelocity = 0;

    const hw = this.field.width / 2;
    const hh = this.field.height / 2;

    const redPlayers = this.players.filter((p) => p.team === 'red');
    const bluePlayers = this.players.filter((p) => p.team === 'blue');

    // Posicionamento tático para time da casa (Red)
    if (redPlayers.length === 1) {
      redPlayers[0].x = -hw * 0.35;
      redPlayers[0].y = 0;
    } else if (redPlayers.length === 2) {
      redPlayers[0].x = -hw * 0.22;
      redPlayers[0].y = -hh * 0.25;
      redPlayers[1].x = -hw * 0.55;
      redPlayers[1].y = 0;
    } else if (redPlayers.length === 3) {
      redPlayers[0].x = -hw * 0.22;
      redPlayers[0].y = 0;
      redPlayers[1].x = -hw * 0.38;
      redPlayers[1].y = -hh * 0.35;
      redPlayers[2].x = -hw * 0.65;
      redPlayers[2].y = 0;
    } else {
      redPlayers[0].x = -hw * 0.20;
      redPlayers[0].y = -hh * 0.22;
      redPlayers[1].x = -hw * 0.20;
      redPlayers[1].y = hh * 0.22;
      redPlayers[2].x = -hw * 0.48;
      redPlayers[2].y = 0;
      redPlayers[3].x = -hw * 0.75;
      redPlayers[3].y = 0;
    }

    // Posicionamento espelhado para time visitante (Blue)
    if (bluePlayers.length === 1) {
      bluePlayers[0].x = hw * 0.35;
      bluePlayers[0].y = 0;
    } else if (bluePlayers.length === 2) {
      bluePlayers[0].x = hw * 0.22;
      bluePlayers[0].y = hh * 0.25;
      bluePlayers[1].x = hw * 0.55;
      bluePlayers[1].y = 0;
    } else if (bluePlayers.length === 3) {
      bluePlayers[0].x = hw * 0.22;
      bluePlayers[0].y = 0;
      bluePlayers[1].x = hw * 0.38;
      bluePlayers[1].y = hh * 0.35;
      bluePlayers[2].x = hw * 0.65;
      bluePlayers[2].y = 0;
    } else {
      bluePlayers[0].x = hw * 0.20;
      bluePlayers[0].y = hh * 0.22;
      bluePlayers[1].x = hw * 0.20;
      bluePlayers[1].y = -hh * 0.22;
      bluePlayers[2].x = hw * 0.48;
      bluePlayers[2].y = 0;
      bluePlayers[3].x = hw * 0.75;
      bluePlayers[3].y = 0;
    }

    for (const p of this.players) {
      p.prevX = p.x;
      p.prevY = p.y;
      p.vx = 0;
      p.vy = 0;
      p.isKicking = false;
      p.kickCooldown = 0;
    }

    this.shockwaves = [];
    this.particles = [];
    this.ballTrail = [];
    this.screenShake = 0;
  }

  public resetMatch() {
    this.scoreYellow = 0;
    this.scoreBlue = 0;
    this.goalMessage = '';
    this.goalCooldownTicks = 0;
    this.slowMoTicks = 0;
    this.resetToKickoff();
  }

  /**
   * Posicionamento interpolado suave da bola
   */
  public getRenderBall(alpha: number) {
    return {
      x: this.ball.prevX + (this.ball.x - this.ball.prevX) * alpha,
      y: this.ball.prevY + (this.ball.y - this.ball.prevY) * alpha,
    };
  }

  /**
   * Rotação interpolada da bola
   */
  public getRenderBallRotation(alpha: number) {
    return this.prevBallAngle + (this.ballAngle - this.prevBallAngle) * alpha;
  }

  /**
   * Posicionamento interpolado de todos os jogadores em campo
   */
  public getRenderPlayers(alpha: number) {
    return this.players.map((p) => ({
      ...p,
      renderX: p.prevX + (p.x - p.prevX) * alpha,
      renderY: p.prevY + (p.y - p.prevY) * alpha,
    }));
  }

  // Compatibilidade com renderer anterior
  public getRenderPlayer(alpha: number) {
    return {
      x: this.player.prevX + (this.player.x - this.player.prevX) * alpha,
      y: this.player.prevY + (this.player.y - this.player.prevY) * alpha,
    };
  }

  public getRenderBot(alpha: number) {
    return {
      x: this.bot.prevX + (this.bot.x - this.bot.prevX) * alpha,
      y: this.bot.prevY + (this.bot.y - this.bot.prevY) * alpha,
    };
  }

  /**
   * IA TÁTICA DOS BOTS (1x1 até 4x4): POSICIONAMENTO INTELIGENTE, COBERTURA E CHUTES NOS CANTOS
   */
  public updateAllBotsAI(dtRatio: number) {
    if (!this.botActive) return;

    let botMaxSpd = HAXBALL.player.maxSpeed * 0.94;
    let botAcc = HAXBALL.player.acceleration * 0.92;

    if (this.botDifficulty === 'easy') {
      botMaxSpd = HAXBALL.player.maxSpeed * 0.75;
      botAcc = HAXBALL.player.acceleration * 0.70;
    } else if (this.botDifficulty === 'hard') {
      botMaxSpd = HAXBALL.player.maxSpeed * 1.0;
      botAcc = HAXBALL.player.acceleration * 1.0;
    }

    const hw = this.field.width / 2;
    const hh = this.field.height / 2;
    const gw = this.field.goalWidth / 2;

    for (const b of this.players) {
      if (!b.isBot) continue;

      if (b.kickCooldown && b.kickCooldown > 0) {
        b.kickCooldown--;
      }

      const isBlue = b.team === 'blue';
      const ownGoalX = isBlue ? hw : -hw;
      const targetGoalX = isBlue ? -hw : hw;

      // 1. Predição Balística do Trajeto da Bola (Interceptação Inteligente)
      const distToBall = Math.hypot(this.ball.x - b.x, this.ball.y - b.y);
      const leadFrames = Math.min(18, distToBall / (botMaxSpd * 1.3));
      const predBallX = clamp(this.ball.x + this.ball.vx * leadFrames, -hw + 25, hw - 25);
      const predBallY = clamp(this.ball.y + this.ball.vy * leadFrames, -hh + 25, hh - 25);

      // Canto do gol mais desprotegido (mira apurada nos cantos)
      const topCornerY = -gw * 0.72;
      const btmCornerY = gw * 0.72;
      const targetCornerY = this.ball.y > 0 ? topCornerY : btmCornerY;

      let targetX = 0;
      let targetY = 0;

      // Aliado do Jogador Humano (Time Vermelho em 2v2 a 4v4): Cooperação e Passes
      if (!isBlue) {
        const humanDistToBall = Math.hypot(this.ball.x - this.player.x, this.ball.y - this.player.y);
        // Se o humano estiver conduzindo ou disputando a bola, o bot aliado dá apoio e não atrapalha
        if (humanDistToBall < 95 && b.role !== 'goalkeeper') {
          targetX = Math.min(hw * 0.4, this.player.x + 90);
          targetY = clamp(this.player.y + (b.id.endsWith('1') ? -65 : 65), -hh * 0.75, hh * 0.75);
        } else if (b.role === 'goalkeeper') {
          targetX = ownGoalX * 0.88;
          targetY = clamp(predBallY * 0.70, -gw * 0.75, gw * 0.75);
          if (this.ball.x < -hw + this.field.penaltyBoxW && distToBall < 110) {
            targetX = predBallX;
            targetY = predBallY;
          }
        } else if (b.role === 'defender') {
          targetX = -hw * 0.40 + (predBallX - (-hw * 0.40)) * 0.35;
          targetY = clamp(predBallY * 0.80, -hh * 0.60, hh * 0.60);
          if (distToBall < 120) {
            targetX = predBallX;
            targetY = predBallY;
          }
        } else {
          // Atacante / Meia aliado: busca a bola e finaliza ou toca para o humano
          const toGoalX = targetGoalX - predBallX;
          const toGoalY = targetCornerY - predBallY;
          const toGoalDist = Math.hypot(toGoalX, toGoalY);
          const dirGX = toGoalDist > 0 ? toGoalX / toGoalDist : 1;
          const dirGY = toGoalDist > 0 ? toGoalY / toGoalDist : 0;

          targetX = predBallX - dirGX * 22;
          targetY = predBallY - dirGY * 22;
        }
      } else {
        // Papel Tático dos Bots Adversários (Time Azul)
        if (b.role === 'goalkeeper') {
          // Goleiro: espelha a trajetória da bola na linha da baliza
          targetX = ownGoalX * 0.88;
          targetY = clamp(predBallY * 0.70, -gw * 0.75, gw * 0.75);

          const ballInArea = this.ball.x > hw - this.field.penaltyBoxW;
          if (ballInArea && distToBall < 110) {
            targetX = predBallX;
            targetY = predBallY;
          }
        } else if (b.role === 'defender') {
          // Zagueiro: fica na cobertura entre a bola e a própria baliza
          const baseDefX = hw * 0.45;
          targetX = baseDefX + (predBallX - baseDefX) * 0.35;
          targetY = clamp(predBallY * 0.85, -hh * 0.60, hh * 0.60);

          if (distToBall < 125) {
            targetX = predBallX;
            targetY = predBallY;
          }
        } else if (b.role === 'midfielder') {
          // Meia: combate na intermediária e avança se o time estiver no ataque
          const baseMidX = hw * 0.15;
          targetX = baseMidX + (predBallX - baseMidX) * 0.55;
          targetY = clamp(predBallY + (b.id.endsWith('1') ? -45 : 45), -hh * 0.70, hh * 0.70);

          if (distToBall < 140) {
            targetX = predBallX;
            targetY = predBallY;
          }
        } else {
          // Atacante / 1v1: posiciona-se atrás da bola com ângulo para o gol adversário
          const toGoalX = targetGoalX - predBallX;
          const toGoalY = targetCornerY - predBallY;
          const toGoalDist = Math.hypot(toGoalX, toGoalY);
          const dirGX = toGoalDist > 0 ? toGoalX / toGoalDist : -1;
          const dirGY = toGoalDist > 0 ? toGoalY / toGoalDist : 0;

          targetX = predBallX - dirGX * 22;
          targetY = predBallY - dirGY * 22;

          // Se a bola passou para trás do atacante, recua para recompôr
          const ballBehind = this.ball.x > b.x;
          if (ballBehind && Math.abs(this.ball.x) > hw * 0.3) {
            targetX = ownGoalX * 0.5;
            targetY = clamp(this.ball.y, -gw, gw);
          }
        }
      }

      // Anti-aglomeração: afasta-se suavemente de colegas do mesmo time
      for (const mate of this.players) {
        if (mate === b || mate.team !== b.team) continue;
        const mdx = b.x - mate.x;
        const mdy = b.y - mate.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 38 && mdist > 1e-3) {
          targetX += (mdx / mdist) * 18;
          targetY += (mdy / mdist) * 18;
        }
      }

      // Movimentação Fluida do Bot
      const dx = targetX - b.x;
      const dy = targetY - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3) {
        const inX = dx / dist;
        const inY = dy / dist;

        b.vx += inX * botAcc * dtRatio;
        b.vy += inY * botAcc * dtRatio;

        const damp = Math.pow(HAXBALL.player.damping, dtRatio);
        b.vx *= damp;
        b.vy *= damp;
      } else {
        const bDamp = Math.pow(HAXBALL.player.brakeDamping, dtRatio);
        b.vx *= bDamp;
        b.vy *= bDamp;
      }

      const bSpeed = Math.hypot(b.vx, b.vy);
      if (bSpeed > botMaxSpd) {
        b.vx = (b.vx / bSpeed) * botMaxSpd;
        b.vy = (b.vy / bSpeed) * botMaxSpd;
      }

      // Chute Inteligente do Bot: Mira nos Cantos Opostos da Baliza
      const currentDistToBall = Math.hypot(this.ball.x - b.x, this.ball.y - b.y);
      const reach = b.radius + this.ball.radius + HAXBALL.kick.reachMargin;

      if (currentDistToBall <= reach && (!b.kickCooldown || b.kickCooldown === 0)) {
        b.isKicking = true;
        // Se for bot aliado no meio/defesa e humano estiver livre à frente, passa para o humano!
        let kickTargetX = targetGoalX;
        let kickTargetY = targetCornerY;

        if (!isBlue && b !== this.player && this.player.x > b.x + 30 && Math.abs(this.player.y) < hh * 0.7) {
          kickTargetX = this.player.x + this.player.vx * 8;
          kickTargetY = this.player.y + this.player.vy * 8;
        }

        const kickDirX = kickTargetX - b.x;
        const kickDirY = kickTargetY - b.y;
        this.executeKick(b, kickDirX, kickDirY, 0.96);
        b.kickCooldown = 12;
        if (b === this.bot) {
          this.botIsKicking = true;
        }
      } else {
        b.isKicking = false;
        if (b === this.bot) {
          this.botIsKicking = false;
        }
      }
    }
  }

  /**
   * DISPARO E CHUTE POTENTE (HAXBALL AUTHENTIC KICK COM JUICE VISUAL)
   */
  public executeKick(kicker: PlayerDisc, analogX: number, analogY: number, powerMultiplier = 1.0): boolean {
    const dx = this.ball.x - kicker.x;
    const dy = this.ball.y - kicker.y;
    const dist = Math.hypot(dx, dy);
    const reach = kicker.radius + this.ball.radius + HAXBALL.kick.reachMargin;
    if (dist > reach || dist < 1e-4) return false;

    const nx = dx / dist;
    const ny = dy / dist;

    // Determina a direção do chute
    const analogLen = Math.hypot(analogX, analogY);
    let kickDirX = nx;
    let kickDirY = ny;

    if (analogLen > 0.08) {
      const ax = analogX / analogLen;
      const ay = analogY / analogLen;
      const blendX = nx * HAXBALL.kick.contactNormalWeight + ax * HAXBALL.kick.analogAimWeight;
      const blendY = ny * HAXBALL.kick.contactNormalWeight + ay * HAXBALL.kick.analogAimWeight;
      const bLen = Math.hypot(blendX, blendY);
      if (bLen > 1e-4) {
        kickDirX = blendX / bLen;
        kickDirY = blendY / bLen;
      }
    }

    // Cálculo da potência
    const kickerSpeed = Math.hypot(kicker.vx, kicker.vy);
    const forwardKinetic = Math.max(0, kicker.vx * kickDirX + kicker.vy * kickDirY);
    const kineticBonus = forwardKinetic * HAXBALL.kick.playerSpeedBonus;

    const basePwr = HAXBALL.kick.basePower * powerMultiplier;
    const finalPower = Math.min(HAXBALL.ball.maxSpeed, basePwr + kineticBonus);

    // Efeito de corte tangencial (Spin na bola)
    const tx = -kickDirY;
    const ty = kickDirX;
    const sliceVt = (kicker.vx - this.ball.vx) * tx + (kicker.vy - this.ball.vy) * ty;

    this.ball.vx = kickDirX * finalPower + tx * (sliceVt * 0.16);
    this.ball.vy = kickDirY * finalPower + ty * (sliceVt * 0.16);

    const bSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    if (bSpeed > HAXBALL.ball.maxSpeed) {
      this.ball.vx = (this.ball.vx / bSpeed) * HAXBALL.ball.maxSpeed;
      this.ball.vy = (this.ball.vy / bSpeed) * HAXBALL.ball.maxSpeed;
    }

    this.ballAngularVelocity = sliceVt * 2.2;

    // Efeitos visuais táteis (Shockwave anelar e faíscas de grama)
    if (this.enableEffects) {
      const midX = (kicker.x + this.ball.x) * 0.5;
      const midY = (kicker.y + this.ball.y) * 0.5;

      this.shockwaves.push({
        x: midX,
        y: midY,
        radius: 4,
        maxRadius: 26,
        color: kicker.team === 'red' ? '#fbbf24' : '#60a5fa',
        alpha: 0.85,
      });

      for (let p = 0; p < 7; p++) {
        const spread = (Math.random() - 0.5) * 1.2;
        const spd = 1.6 + Math.random() * 3.0;
        const px = kickDirX * Math.cos(spread) - kickDirY * Math.sin(spread);
        const py = kickDirX * Math.sin(spread) + kickDirY * Math.cos(spread);
        this.particles.push({
          x: midX + (Math.random() - 0.5) * 4,
          y: midY + (Math.random() - 0.5) * 4,
          vx: px * spd,
          vy: py * spd,
          life: 16 + Math.floor(Math.random() * 12),
          maxLife: 28,
          color: Math.random() > 0.4 ? '#4ade80' : '#ffffff',
          size: 1.6 + Math.random() * 1.4,
          alpha: 0.9,
        });
      }
    }

    if (kicker === this.player) {
      this.screenShake = Math.max(this.screenShake, Math.min(4.5, finalPower * 0.65));
      this.kickCooldown = HAXBALL.kick.cooldownTicks;
    }

    sounds.playKick();

    // Telemetria do chute
    if (this.debug.enabled) {
      this.debug.lastCollisionNormal = { x: kickDirX, y: kickDirY };
      this.debug.lastRelativeVelocity = finalPower;
      this.debug.lastNormalComponent = finalPower;
      this.debug.lastTangentialComponent = sliceVt;
      this.debug.lastContactType = 'kick';
    }

    return true;
  }

  /**
   * Cálculo vetorial da mira de chute para feedback visual imediato ao jogador
   */
  public getKickAimVector(inputX: number, inputY: number): { x: number; y: number; active: boolean } {
    const dx = this.ball.x - this.player.x;
    const dy = this.ball.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const reach = this.player.radius + this.ball.radius + HAXBALL.kick.reachMargin;
    if (dist > reach || dist < 1e-4) return { x: 0, y: 0, active: false };

    const nx = dx / dist;
    const ny = dy / dist;
    const analogLen = Math.hypot(inputX, inputY);
    let kickDirX = nx;
    let kickDirY = ny;

    if (analogLen > 0.08) {
      const ax = inputX / analogLen;
      const ay = inputY / analogLen;
      const blendX = nx * HAXBALL.kick.contactNormalWeight + ax * HAXBALL.kick.analogAimWeight;
      const blendY = ny * HAXBALL.kick.contactNormalWeight + ay * HAXBALL.kick.analogAimWeight;
      const bLen = Math.hypot(blendX, blendY);
      if (bLen > 1e-4) {
        kickDirX = blendX / bLen;
        kickDirY = blendY / bLen;
      }
    }

    return { x: kickDirX, y: kickDirY, active: true };
  }

  /**
   * COLISÃO JOGADOR X BOLA: FÍSICA PURA DE DISCO (SEM GRUDAR OU MAGNETIZAR)
   */
  private resolvePlayerBall(player: PlayerDisc, ball: Disc): boolean {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.hypot(dx, dy);
    const minDist = player.radius + ball.radius;
    if (dist >= minDist || dist < 1e-4) return false;

    const nx = dx / dist;
    const ny = dy / dist;

    // Resolução posicional baseada na proporção exata de massas (2/3 bola, 1/3 jogador)
    const pen = minDist - dist;
    const totalInvMass = player.invMass + ball.invMass;
    player.x -= nx * pen * (player.invMass / totalInvMass);
    player.y -= ny * pen * (player.invMass / totalInvMass);
    ball.x += nx * pen * (ball.invMass / totalInvMass);
    ball.y += ny * pen * (ball.invMass / totalInvMass);

    const vn = (player.vx - ball.vx) * nx + (player.vy - ball.vy) * ny;

    if (vn > 0) {
      // Coeficiente elástico limpo (0.50): a bola ganha impulso e rola livre à frente
      const bCoef = HAXBALL.ball.bCoef;
      const impulse = (vn * (1 + bCoef)) / totalInvMass;

      player.vx -= nx * (impulse * player.invMass);
      player.vy -= ny * (impulse * player.invMass);
      ball.vx += nx * (impulse * ball.invMass);
      ball.vy += ny * (impulse * ball.invMass);

      // Deslizamento tangencial suave ao raspar na borda do disco
      const tx = -ny;
      const ty = nx;
      const vt = (player.vx - ball.vx) * tx + (player.vy - ball.vy) * ty;
      ball.vx += tx * (vt * 0.08);
      ball.vy += ty * (vt * 0.08);

      this.ballAngularVelocity += vt * 0.12;

      // Telemetria
      if (this.debug.enabled && player === this.player) {
        this.debug.lastCollisionNormal = { x: nx, y: ny };
        this.debug.lastRelativeVelocity = vn;
        this.debug.lastNormalComponent = impulse;
        this.debug.lastTangentialComponent = vt;
        this.debug.lastContactType = 'dribble';
      }
    }

    return true;
  }

  /**
   * Colisão entre dois jogadores
   */
  private resolveDiscDisc(d1: Disc, d2: Disc): boolean {
    const dx = d2.x - d1.x;
    const dy = d2.y - d1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = d1.radius + d2.radius;
    if (dist >= minDist || dist < 1e-4) return false;

    const nx = dx / dist;
    const ny = dy / dist;
    const pen = minDist - dist;

    d1.x -= nx * (pen * 0.5);
    d1.y -= ny * (pen * 0.5);
    d2.x += nx * (pen * 0.5);
    d2.y += ny * (pen * 0.5);

    const vn = (d1.vx - d2.vx) * nx + (d1.vy - d2.vy) * ny;
    if (vn > 0) {
      const e = 0.50;
      const impulse = (vn * (1 + e)) / (d1.invMass + d2.invMass);
      d1.vx -= nx * (impulse * d1.invMass);
      d1.vy -= ny * (impulse * d1.invMass);
      d2.vx += nx * (impulse * d2.invMass);
      d2.vy += ny * (impulse * d2.invMass);
    }

    return true;
  }

  /**
   * Colisão com paredes do campo e redes do gol
   */
  private resolveDiscSegment(disc: Disc, seg: Segment, onImpact?: () => void, isBall = false): boolean {
    const vx = seg.x2 - seg.x1;
    const vy = seg.y2 - seg.y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq < 1e-6) return false;

    const t = clamp(((disc.x - seg.x1) * vx + (disc.y - seg.y1) * vy) / lenSq, 0, 1);
    const cx = seg.x1 + t * vx;
    const cy = seg.y1 + t * vy;

    const dx = disc.x - cx;
    const dy = disc.y - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < disc.radius && dist > 1e-5) {
      const nx = dx / dist;
      const ny = dy / dist;
      const pen = disc.radius - dist;

      disc.x += nx * pen;
      disc.y += ny * pen;

      const vn = disc.vx * nx + disc.vy * ny;
      if (vn < 0) {
        const bounce = isBall ? seg.bCoef : HAXBALL.wallBounce.playerWallRestitution;
        disc.vx -= (1 + bounce) * vn * nx;
        disc.vy -= (1 + bounce) * vn * ny;

        if (onImpact) onImpact();
        if (isBall && !seg.isGoalNet) {
          this.screenShake = Math.max(this.screenShake, Math.min(2.5, Math.abs(vn) * 0.4));
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Colisão com os postes físicos das traves
   */
  private resolveDiscPost(disc: Disc, post: Post, onImpact?: () => void, isBall = false): boolean {
    const dx = disc.x - post.x;
    const dy = disc.y - post.y;
    const dist = Math.hypot(dx, dy);
    const minDist = disc.radius + post.r;

    if (dist < minDist && dist > 1e-5) {
      const nx = dx / dist;
      const ny = dy / dist;
      const pen = minDist - dist;

      disc.x += nx * pen;
      disc.y += ny * pen;

      const vn = disc.vx * nx + disc.vy * ny;
      if (vn < 0) {
        const bounce = isBall ? post.bCoef : 0.20;
        disc.vx -= (1 + bounce) * vn * nx;
        disc.vy -= (1 + bounce) * vn * ny;

        if (onImpact) onImpact();
        if (isBall) {
          this.screenShake = Math.max(this.screenShake, 3.8);
          if (this.enableEffects) {
            for (let i = 0; i < 6; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 2.0 + Math.random() * 3.5;
              this.particles.push({
                x: post.x,
                y: post.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 14 + Math.floor(Math.random() * 10),
                maxLife: 24,
                color: Math.random() > 0.5 ? '#ffffff' : '#facc15',
                size: 2.0,
                alpha: 1.0,
              });
            }
          }
        }
      }
      return true;
    }
    return false;
  }

  /**
   * LOOP PRINCIPAL DE FÍSICA A 60HZ COM ESTABILIDADE ATÔMICA
   */
  public tick(inputX: number, inputY: number, kickPressed: boolean, dtSec = 1 / 60) {
    // Guarda posições anteriores para interpolação limpa
    for (const p of this.players) {
      p.prevX = p.x;
      p.prevY = p.y;
    }

    this.ball.prevX = this.ball.x;
    this.ball.prevY = this.ball.y;
    this.prevBallAngle = this.ballAngle;

    const referenceDt = 1 / 60;
    let effDtSec = dtSec;
    if (this.enableSlowMo && this.slowMoTicks > 0) {
      this.slowMoTicks--;
      effDtSec = dtSec * 0.40;
    }
    const dtRatio = clamp(effDtSec / referenceDt, 0.2, 2.0);

    // Comemoração de gol e retenção da bola dentro da rede
    if (this.goalCooldownTicks > 0) {
      this.goalCooldownTicks--;
      this.ball.vx *= Math.pow(0.85, dtRatio);
      this.ball.vy *= Math.pow(0.85, dtRatio);
      this.ball.x += this.ball.vx * dtRatio;
      this.ball.y += this.ball.vy * dtRatio;

      const hw = this.field.width / 2;
      const gw2 = this.field.goalWidth / 2 - this.ball.radius - 2;
      const maxDepth = this.field.goalDepth - this.ball.radius - 2;

      if (this.ball.x < -hw) {
        this.ball.x = clamp(this.ball.x, -hw - maxDepth, -hw - 2);
        this.ball.y = clamp(this.ball.y, -gw2, gw2);
      } else if (this.ball.x > hw) {
        this.ball.x = clamp(this.ball.x, hw + 2, hw + maxDepth);
        this.ball.y = clamp(this.ball.y, -gw2, gw2);
      }

      if (this.goalCooldownTicks === 0) {
        this.goalMessage = '';
        if (this.isSoloMode) {
          this.recallBallToPlayer();
        } else {
          this.resetToKickoff();
        }
      }
      this.updateVisualEffects(dtRatio);
      return;
    }

    if (this.kickCooldown > 0) {
      this.kickCooldown--;
    }

    this.isKicking = kickPressed;

    // 1. Movimentação do jogador usuário com tração firme e ágil
    const inLen = Math.hypot(inputX, inputY);
    if (inLen > 0.05) {
      const intensity = Math.min(1.0, inLen);
      const inDirX = inputX / inLen;
      const inDirY = inputY / inLen;

      const pSpeed = Math.hypot(this.player.vx, this.player.vy);
      let counterBrake = 1.0;
      if (pSpeed > 0.1) {
        const dot = (this.player.vx / pSpeed) * inDirX + (this.player.vy / pSpeed) * inDirY;
        if (dot < 0) {
          counterBrake = 1.0 + Math.abs(dot) * HAXBALL.player.counterBrakeFactor;
        }
      }

      const activeDamp = Math.pow(HAXBALL.player.damping, dtRatio * counterBrake);
      this.player.vx *= activeDamp;
      this.player.vy *= activeDamp;

      const acc = kickPressed ? HAXBALL.player.kickingAcceleration : HAXBALL.player.acceleration;
      this.player.vx += inDirX * (acc * intensity * dtRatio);
      this.player.vy += inDirY * (acc * intensity * dtRatio);

      const newSpeed = Math.hypot(this.player.vx, this.player.vy);
      if (newSpeed > HAXBALL.player.maxSpeed) {
        this.player.vx = (this.player.vx / newSpeed) * HAXBALL.player.maxSpeed;
        this.player.vy = (this.player.vy / newSpeed) * HAXBALL.player.maxSpeed;
      }
    } else {
      const brakeDamp = Math.pow(HAXBALL.player.brakeDamping, dtRatio);
      this.player.vx *= brakeDamp;
      this.player.vy *= brakeDamp;

      if (Math.hypot(this.player.vx, this.player.vy) < HAXBALL.player.minSpeedThreshold) {
        this.player.vx = 0;
        this.player.vy = 0;
      }
    }

    // 2. IA Tática de todos os Bots em campo (1x1 até 4x4)
    this.updateAllBotsAI(dtRatio);

    // 3. Processamento do chute do jogador humano
    if (kickPressed && this.kickCooldown === 0) {
      this.executeKick(this.player, inputX, inputY, 1.0);
    }

    // 4. Integração sub-step (3 sub-steps garantem estabilidade de discos)
    const SUBSTEPS = 3;
    const subDt = dtRatio / SUBSTEPS;

    for (let s = 0; s < SUBSTEPS; s++) {
      // Avanço dos jogadores
      for (const p of this.players) {
        p.x += p.vx * subDt;
        p.y += p.vy * subDt;
      }

      // Avanço da bola
      this.ball.x += this.ball.vx * subDt;
      this.ball.y += this.ball.vy * subDt;

      // Colisões Jogador x Bola
      for (const p of this.players) {
        this.resolvePlayerBall(p, this.ball);
      }

      // Colisões Jogador x Jogador
      for (let i = 0; i < this.players.length; i++) {
        for (let j = i + 1; j < this.players.length; j++) {
          this.resolveDiscDisc(this.players[i], this.players[j]);
        }
      }

      // Colisões de paredes
      for (const seg of this.walls) {
        for (const p of this.players) {
          this.resolveDiscSegment(p, seg, undefined, false);
        }
        this.resolveDiscSegment(this.ball, seg, () => sounds.playWallBounce(), true);
      }

      // Colisões com os postes
      for (const post of this.posts) {
        for (const p of this.players) {
          this.resolveDiscPost(p, post, undefined, false);
        }
        this.resolveDiscPost(this.ball, post, () => sounds.playPostHit(), true);
      }
    }

    // 5. Atrito e rolamento suave da bola no gramado
    const ballFriction = Math.pow(HAXBALL.ball.damping, dtRatio);
    this.ball.vx *= ballFriction;
    this.ball.vy *= ballFriction;

    if (Math.hypot(this.ball.vx, this.ball.vy) < HAXBALL.ball.minSpeedThreshold) {
      this.ball.vx = 0;
      this.ball.vy = 0;
    }

    // 6. Rotação visual da bola
    const bSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    const naturalSpin = (bSpeed / this.ball.radius) * Math.sign(this.ball.vx || 1);
    this.ballAngle += (naturalSpin * 0.65 + this.ballAngularVelocity) * dtRatio;
    this.ballAngularVelocity *= Math.pow(0.92, dtRatio);

    // 7. Checagem de gol
    this.checkGoal();

    // 8. Atualização de telemetria
    if (this.debug.enabled) {
      this.debug.ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);
      this.debug.playerSpeed = Math.hypot(this.player.vx, this.player.vy);
    }

    // 9. Atualização dos efeitos visuais (Juice)
    this.updateVisualEffects(dtRatio);
  }

  private updateVisualEffects(dtRatio: number) {
    if (!this.enableEffects) {
      this.particles = [];
      this.shockwaves = [];
      this.ballTrail = [];
      this.screenShake = 0;
      return;
    }

    // Atualização de partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtRatio;
      p.y += p.vy * dtRatio;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dtRatio;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Atualização de shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 1.4 * dtRatio;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0.02) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Rastro da bola em velocidade
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    if (ballSpeed > 2.0) {
      this.ballTrail.unshift({
        x: this.ball.x,
        y: this.ball.y,
        alpha: Math.min(0.48, ballSpeed / HAXBALL.ball.maxSpeed),
      });
      if (this.ballTrail.length > 6) {
        this.ballTrail.pop();
      }
    } else {
      if (this.ballTrail.length > 0) {
        this.ballTrail.pop();
      }
    }
    for (let i = 0; i < this.ballTrail.length; i++) {
      this.ballTrail[i].alpha *= 0.82;
    }

    // Decaimento do screen shake
    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(0.85, dtRatio);
      if (this.screenShake < 0.1) this.screenShake = 0;
    }
  }

  private checkGoal() {
    if (this.goalCooldownTicks > 0) return;

    const hw = this.field.width / 2;
    const gw2 = this.field.goalWidth / 2;
    const insideY = Math.abs(this.ball.y) < gw2 - 2;

    // Modo Treino Solo: Qualquer baliza conta para streak e precisão
    if (this.isSoloMode) {
      if ((this.ball.x < -hw || this.ball.x > hw) && insideY) {
        this.soloGoals++;
        this.soloStreak++;
        this.scoreYellow = this.soloGoals;
        this.scoreBlue = 0;

        const bSpeed = Math.hypot(this.ball.vx, this.ball.vy);
        const shotKm = Math.round(bSpeed * 22);
        if (shotKm > this.fastestShot) this.fastestShot = shotKm;

        const isCorner = Math.abs(this.ball.y) > gw2 * 0.55;
        let title = `⚽ GOL NO TREINO! (${this.soloGoals} GOLS)`;
        if (isCorner) {
          title = `🔥 GOLAÇO NA GAVETA! ${shotKm} KM/H 🔥`;
        } else if (this.soloStreak >= 3) {
          title = `⚡ STREAK: ${this.soloStreak} GOLS SEGUIDOS! ⚡`;
        }
        this.triggerGoal(title);
        return;
      }
      return;
    }

    // Gol do Time Azul (na baliza esquerda do Time Red)
    if (this.ball.x < -hw && insideY) {
      this.scoreBlue++;
      this.triggerGoal('GOL DO TIME AZUL!');
      return;
    }

    // Gol do Time Amarelo (na baliza direita do Time Blue)
    if (this.ball.x > hw && insideY) {
      this.scoreYellow++;
      this.triggerGoal('GOOOOOL DO TIME VERMELHO!');
      return;
    }
  }

  private triggerGoal(title: string) {
    this.goalMessage = title;
    this.goalCooldownTicks = 90;
    if (this.enableSlowMo) {
      this.slowMoTicks = 24;
    }
    this.screenShake = 8.5;
    sounds.playGoal();

    if (this.enableEffects) {
      const goalX = this.ball.x;
      const goalY = this.ball.y;
      const confettiColors = ['#facc15', '#38bdf8', '#4ade80', '#f43f5e', '#a855f7', '#ffffff', '#fb923c'];

      for (let c = 0; c < 50; c++) {
        const ang = (goalX > 0 ? Math.PI : 0) + (Math.random() - 0.5) * 1.8;
        const spd = 2.0 + Math.random() * 5.0;
        this.particles.push({
          x: goalX,
          y: goalY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 55 + Math.floor(Math.random() * 35),
          maxLife: 90,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          size: 2.4 + Math.random() * 2.2,
          alpha: 1.0,
        });
      }
    }

    // Amortecimento suave na rede
    this.ball.vx *= 0.35;
    this.ball.vy *= 0.35;
  }
}

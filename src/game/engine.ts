import { sounds } from '../audio/soundManager';
import { Ball, Cone, GameMode, GoalPost, GoalTarget, MatchScore, PitchTheme, Player, TrainingStats } from './types';

export const PITCH_WIDTH = 840;
export const PITCH_HEIGHT = 420;
export const GOAL_WIDTH = 140;
export const GOAL_DEPTH = 65;
export const GOAL_Y_TOP = (PITCH_HEIGHT - GOAL_WIDTH) / 2; // 140
export const GOAL_Y_BOTTOM = GOAL_Y_TOP + GOAL_WIDTH; // 280
export const POST_RADIUS = 8;
export const PLAYER_RADIUS = 15;
export const BALL_RADIUS = 10;
export const KICK_DIST = PLAYER_RADIUS + BALL_RADIUS + 6; // 31

export interface InputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  kick: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export class ChinaBallGame {
  public mode: GameMode = 'TRAINING';
  public theme: PitchTheme = 'classic';
  public botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

  public player1: Player;
  public player2?: Player; // Bot or 2nd human player
  public goalkeeperBot?: Player; // In training or penalty mode
  public ball: Ball;

  public posts: GoalPost[] = [];
  public cones: Cone[] = [];
  public targets: GoalTarget[] = [];
  public particles: Particle[] = [];

  public score: MatchScore = { red: 0, blue: 0 };
  public matchTime: number = 0; // in seconds
  public matchDuration: number = 180; // 3 minutes default for matches
  public scoreLimit: number = 3;

  public isGoalScored: boolean = false;
  public goalScoredTeam: 'red' | 'blue' | null = null;
  public goalCelebrationTimer: number = 0;
  public matchFinished: boolean = false;
  public matchWinner: 'red' | 'blue' | 'draw' | null = null;

  public trainingStats: TrainingStats = {
    shotsTotal: 0,
    shotsOnTarget: 0,
    goalsScored: 0,
    targetsHit: 0,
    topSpeedKmh: 0,
  };

  public trainingShowCones: boolean = false;
  public trainingShowKeeper: boolean = false;
  public trainingShowTargets: boolean = true;
  public ballTrajectory: { x: number; y: number; alpha: number }[] = [];

  // Inputs
  public p1Input: InputState = { moveX: 0, moveY: 0, kick: false };
  public p2Input: InputState = { moveX: 0, moveY: 0, kick: false };

  constructor(mode: GameMode = 'TRAINING', theme: PitchTheme = 'classic') {
    this.mode = mode;
    this.theme = theme;

    this.player1 = {
      id: 'p1',
      name: 'Player 1',
      x: PITCH_WIDTH / 4,
      y: PITCH_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
      team: 'red',
      color: '#ef4444',
      accentColor: '#fca5a5',
      number: '7',
      isKicking: false,
      kickCooldown: 0,
    };

    this.ball = {
      x: PITCH_WIDTH / 2,
      y: PITCH_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      speedKmh: 0,
      maxSpeedKmh: 0,
    };

    this.initPosts();
    this.initMode(mode);
  }

  private initPosts() {
    this.posts = [
      // Left Goal Posts
      { x: 0, y: GOAL_Y_TOP, radius: POST_RADIUS, team: 'red' },
      { x: 0, y: GOAL_Y_BOTTOM, radius: POST_RADIUS, team: 'red' },
      // Right Goal Posts
      { x: PITCH_WIDTH, y: GOAL_Y_TOP, radius: POST_RADIUS, team: 'blue' },
      { x: PITCH_WIDTH, y: GOAL_Y_BOTTOM, radius: POST_RADIUS, team: 'blue' },
    ];
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
    this.score = { red: 0, blue: 0 };
    this.matchTime = 0;
    this.matchFinished = false;
    this.matchWinner = null;
    this.isGoalScored = false;
    this.initMode(mode);
  }

  private initMode(mode: GameMode) {
    this.resetPositions();

    if (mode === 'TRAINING') {
      this.player2 = undefined;
      this.player1.x = PITCH_WIDTH / 3;
      this.player1.y = PITCH_HEIGHT / 2;
      this.setupTrainingCones();
      this.setupTrainingTargets();
    } else if (mode === 'VS_BOT') {
      this.player2 = {
        id: 'bot',
        name: 'China Bot',
        x: (PITCH_WIDTH * 3) / 4,
        y: PITCH_HEIGHT / 2,
        vx: 0,
        vy: 0,
        radius: PLAYER_RADIUS,
        team: 'blue',
        color: '#3b82f6',
        accentColor: '#93c5fd',
        number: '10',
        isKicking: false,
        kickCooldown: 0,
        isBot: true,
      };
      this.cones = [];
      this.targets = [];
    } else if (mode === 'LOCAL_2P') {
      this.player2 = {
        id: 'p2',
        name: 'Player 2',
        x: (PITCH_WIDTH * 3) / 4,
        y: PITCH_HEIGHT / 2,
        vx: 0,
        vy: 0,
        radius: PLAYER_RADIUS,
        team: 'blue',
        color: '#3b82f6',
        accentColor: '#93c5fd',
        number: '10',
        isKicking: false,
        kickCooldown: 0,
      };
      this.cones = [];
      this.targets = [];
    } else if (mode === 'PENALTIES') {
      this.player1.x = PITCH_WIDTH - 240;
      this.player1.y = PITCH_HEIGHT / 2;
      this.ball.x = PITCH_WIDTH - 200;
      this.ball.y = PITCH_HEIGHT / 2;
      this.player2 = {
        id: 'bot-keeper',
        name: 'Goleiro Robô',
        x: PITCH_WIDTH - 25,
        y: PITCH_HEIGHT / 2,
        vx: 0,
        vy: 0,
        radius: PLAYER_RADIUS,
        team: 'blue',
        color: '#eab308',
        accentColor: '#fef08a',
        number: '1',
        isKicking: false,
        kickCooldown: 0,
        isBot: true,
      };
      this.cones = [];
      this.targets = [];
    }
  }

  public setupTrainingCones() {
    this.cones = [
      { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 - 80, radius: 11 },
      { x: PITCH_WIDTH / 2 + 60, y: PITCH_HEIGHT / 2 - 30, radius: 11 },
      { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 + 20, radius: 11 },
      { x: PITCH_WIDTH / 2 + 60, y: PITCH_HEIGHT / 2 + 70, radius: 11 },
      { x: PITCH_WIDTH / 2 + 120, y: PITCH_HEIGHT / 2, radius: 11 },
    ];
  }

  public setupTrainingTargets() {
    this.targets = [
      // Right goal top corner target
      { x: PITCH_WIDTH - 12, y: GOAL_Y_TOP + 20, radius: 14, hit: false, score: 50 },
      // Right goal bottom corner target
      { x: PITCH_WIDTH - 12, y: GOAL_Y_BOTTOM - 20, radius: 14, hit: false, score: 50 },
      // Center sweet spot
      { x: PITCH_WIDTH - 25, y: PITCH_HEIGHT / 2, radius: 12, hit: false, score: 20 },
    ];
  }

  public toggleTrainingKeeper() {
    this.trainingShowKeeper = !this.trainingShowKeeper;
    if (this.trainingShowKeeper) {
      this.goalkeeperBot = {
        id: 'keeper-bot',
        name: 'Goleiro IA',
        x: PITCH_WIDTH - 20,
        y: PITCH_HEIGHT / 2,
        vx: 0,
        vy: 0,
        radius: PLAYER_RADIUS,
        team: 'blue',
        color: '#eab308',
        accentColor: '#fef08a',
        number: '1',
        isKicking: false,
        kickCooldown: 0,
        isBot: true,
      };
    } else {
      this.goalkeeperBot = undefined;
    }
  }

  public toggleTrainingCones() {
    this.trainingShowCones = !this.trainingShowCones;
    if (this.trainingShowCones) {
      this.setupTrainingCones();
    } else {
      this.cones = [];
    }
  }

  public toggleTrainingTargets() {
    this.trainingShowTargets = !this.trainingShowTargets;
    if (this.trainingShowTargets) {
      this.setupTrainingTargets();
    } else {
      this.targets = [];
    }
  }

  public resetBallToPlayer() {
    this.ball.x = this.player1.x + 28;
    this.ball.y = this.player1.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.speedKmh = 0;
  }

  public resetBallToCenter() {
    this.ball.x = PITCH_WIDTH / 2;
    this.ball.y = PITCH_HEIGHT / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.speedKmh = 0;
  }

  public resetPositions() {
    if (this.mode === 'TRAINING') {
      this.player1.x = PITCH_WIDTH / 3;
      this.player1.y = PITCH_HEIGHT / 2;
      this.player1.vx = 0;
      this.player1.vy = 0;
      this.resetBallToCenter();
      if (this.goalkeeperBot) {
        this.goalkeeperBot.x = PITCH_WIDTH - 20;
        this.goalkeeperBot.y = PITCH_HEIGHT / 2;
        this.goalkeeperBot.vx = 0;
        this.goalkeeperBot.vy = 0;
      }
    } else if (this.mode === 'PENALTIES') {
      this.player1.x = PITCH_WIDTH - 260;
      this.player1.y = PITCH_HEIGHT / 2;
      this.player1.vx = 0;
      this.player1.vy = 0;
      this.ball.x = PITCH_WIDTH - 200;
      this.ball.y = PITCH_HEIGHT / 2;
      this.ball.vx = 0;
      this.ball.vy = 0;
      if (this.player2) {
        this.player2.x = PITCH_WIDTH - 20;
        this.player2.y = PITCH_HEIGHT / 2;
        this.player2.vx = 0;
        this.player2.vy = 0;
      }
    } else {
      // Normal match kickoff
      this.player1.x = PITCH_WIDTH / 4;
      this.player1.y = PITCH_HEIGHT / 2;
      this.player1.vx = 0;
      this.player1.vy = 0;

      if (this.player2) {
        this.player2.x = (PITCH_WIDTH * 3) / 4;
        this.player2.y = PITCH_HEIGHT / 2;
        this.player2.vx = 0;
        this.player2.vy = 0;
      }

      this.resetBallToCenter();
    }
  }

  public update(dt: number) {
    // Spawn / update celebration particles
    this.updateParticles();

    // If goal scored celebration is active
    if (this.isGoalScored) {
      this.goalCelebrationTimer -= dt;
      if (this.goalCelebrationTimer <= 0) {
        this.isGoalScored = false;
        if (this.mode !== 'TRAINING') {
          // Check match end
          if (
            this.score.red >= this.scoreLimit ||
            this.score.blue >= this.scoreLimit ||
            (this.matchDuration > 0 && this.matchTime >= this.matchDuration)
          ) {
            this.matchFinished = true;
            this.matchWinner =
              this.score.red > this.scoreLimit ? 'red' : this.score.blue > this.score.red ? 'blue' : 'draw';
          }
        }
        this.resetPositions();
      }
      return;
    }

    if (this.matchFinished) {
      return;
    }

    // Match clock increment
    if (this.mode !== 'TRAINING') {
      this.matchTime += dt;
      if (this.matchDuration > 0 && this.matchTime >= this.matchDuration) {
        this.matchFinished = true;
        this.matchWinner =
          this.score.red > this.score.blue ? 'red' : this.score.blue > this.score.red ? 'blue' : 'draw';
        sounds.playWhistle();
        return;
      }
    }

    // Process Player 1
    this.processPlayerMovement(this.player1, this.p1Input);

    // Process Player 2 / Bot
    if (this.player2) {
      if (this.player2.isBot) {
        this.processBotAI(this.player2);
      } else {
        this.processPlayerMovement(this.player2, this.p2Input);
      }
    }

    // Process Goalkeeper in Training mode
    if (this.goalkeeperBot) {
      this.processKeeperAI(this.goalkeeperBot);
    }

    // Update Physics Positions & Damping
    this.updatePlayerPhysics(this.player1);
    if (this.player2) this.updatePlayerPhysics(this.player2);
    if (this.goalkeeperBot) this.updatePlayerPhysics(this.goalkeeperBot);

    // Update Ball
    this.updateBallPhysics();

    // Check collisions
    this.handlePlayerBallCollisions();
    this.handleObstacleCollisions();
    this.handlePostCollisions();
    this.handleWallCollisions();

    // Target checks in training mode
    if (this.mode === 'TRAINING' && this.trainingShowTargets) {
      this.checkTargetHits();
    }

    // Check goal conditions
    this.checkGoalCondition();

    // Update ball speed & trajectory trail
    const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    this.ball.speedKmh = Math.round(currentSpeed * 18);
    if (this.ball.speedKmh > this.trainingStats.topSpeedKmh) {
      this.trainingStats.topSpeedKmh = this.ball.speedKmh;
    }

    // Add trail when ball travels fast
    if (currentSpeed > 2.5) {
      this.ballTrajectory.push({ x: this.ball.x, y: this.ball.y, alpha: 0.6 });
    }
    for (let i = this.ballTrajectory.length - 1; i >= 0; i--) {
      this.ballTrajectory[i].alpha -= 0.05;
      if (this.ballTrajectory[i].alpha <= 0) {
        this.ballTrajectory.splice(i, 1);
      }
    }
  }

  private processPlayerMovement(player: Player, input: InputState) {
    const accel = 0.23;
    let mx = input.moveX;
    let my = input.moveY;
    const len = Math.hypot(mx, my);

    if (len > 1) {
      mx /= len;
      my /= len;
    }

    player.vx += mx * accel;
    player.vy += my * accel;

    player.isKicking = input.kick;
    if (player.kickCooldown > 0) {
      player.kickCooldown--;
    }
  }

  private updatePlayerPhysics(player: Player) {
    const damping = 0.96; // Standard Haxball friction
    player.vx *= damping;
    player.vy *= damping;

    player.x += player.vx;
    player.y += player.vy;

    // Pitch borders for player
    const minX = player.radius;
    const maxX = PITCH_WIDTH - player.radius;
    const minY = player.radius;
    const maxY = PITCH_HEIGHT - player.radius;

    // In Haxball, players can't easily walk into deep goal nets except right in front
    if (player.x < minX) {
      if (player.y < GOAL_Y_TOP || player.y > GOAL_Y_BOTTOM) {
        player.x = minX;
        player.vx = 0;
      } else if (player.x < -GOAL_DEPTH + player.radius) {
        player.x = -GOAL_DEPTH + player.radius;
        player.vx = 0;
      }
    } else if (player.x > maxX) {
      if (player.y < GOAL_Y_TOP || player.y > GOAL_Y_BOTTOM) {
        player.x = maxX;
        player.vx = 0;
      } else if (player.x > PITCH_WIDTH + GOAL_DEPTH - player.radius) {
        player.x = PITCH_WIDTH + GOAL_DEPTH - player.radius;
        player.vx = 0;
      }
    }

    if (player.y < minY) {
      player.y = minY;
      player.vy = 0;
    }
    if (player.y > maxY) {
      player.y = maxY;
      player.vy = 0;
    }
  }

  private updateBallPhysics() {
    let damping = 0.99; // Standard Haxball damping
    if (this.theme === 'futsal') damping = 0.985; // Faster roll on hard futsal wood
    if (this.theme === 'street') damping = 0.98;

    this.ball.vx *= damping;
    this.ball.vy *= damping;

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
  }

  private handlePlayerBallCollisions() {
    const players = [this.player1];
    if (this.player2) players.push(this.player2);
    if (this.goalkeeperBot) players.push(this.goalkeeperBot);

    for (const p of players) {
      const dx = this.ball.x - p.x;
      const dy = this.ball.y - p.y;
      const dist = Math.hypot(dx, dy);
      const minDist = p.radius + this.ball.radius;

      // Check if kicking when in kick range
      if (p.isKicking && dist <= KICK_DIST && p.kickCooldown <= 0) {
        // Execute shot!
        const normalX = dist > 0.0001 ? dx / dist : 1;
        const normalY = dist > 0.0001 ? dy / dist : 0;

        const kickStrength = 5.6; // High impulse kick
        // Add player velocity transfer
        this.ball.vx = normalX * kickStrength + p.vx * 0.45;
        this.ball.vy = normalY * kickStrength + p.vy * 0.45;

        // Player pushes slightly back from kick recoil
        p.vx -= normalX * 0.4;
        p.vy -= normalY * 0.4;

        p.kickCooldown = 8; // Prevent multiple kicks in consecutive frames
        this.ball.lastTouchTeam = p.team === 'neutral' ? undefined : p.team;
        this.ball.lastTouchPlayer = p.name;

        sounds.playKick(1.2);
        this.spawnKickSparks(this.ball.x, this.ball.y);

        if (p === this.player1) {
          this.trainingStats.shotsTotal++;
          // Check if shot heading towards right goal
          if (this.ball.vx > 1) {
            this.trainingStats.shotsOnTarget++;
          }
        }
        continue;
      }

      // Standard physical collision (bounce without kicking)
      if (dist < minDist) {
        const overlap = minDist - dist;
        const normalX = dist > 0.0001 ? dx / dist : 1;
        const normalY = dist > 0.0001 ? dy / dist : 0;

        // Push ball away from player
        this.ball.x += normalX * overlap;
        this.ball.y += normalY * overlap;

        // Relative velocity
        const kx = p.vx - this.ball.vx;
        const ky = p.vy - this.ball.vy;
        const pVelocity = normalX * kx + normalY * ky;

        if (pVelocity > 0) {
          const impulse = (2 * pVelocity) / (1 + this.ball.radius / p.radius);
          this.ball.vx += normalX * impulse * 1.1;
          this.ball.vy += normalY * impulse * 1.1;
          p.vx -= normalX * impulse * 0.15;
          p.vy -= normalY * impulse * 0.15;

          this.ball.lastTouchTeam = p.team === 'neutral' ? undefined : p.team;
          this.ball.lastTouchPlayer = p.name;

          sounds.playKick(0.65);
        }
      }
    }
  }

  private handleObstacleCollisions() {
    // Cones
    for (const cone of this.cones) {
      // Ball vs cone
      const bdx = this.ball.x - cone.x;
      const bdy = this.ball.y - cone.y;
      const bdist = Math.hypot(bdx, bdy);
      const bMin = cone.radius + this.ball.radius;

      if (bdist < bMin) {
        const nx = bdist > 0.0001 ? bdx / bdist : 1;
        const ny = bdist > 0.0001 ? bdy / bdist : 0;
        this.ball.x = cone.x + nx * bMin;
        this.ball.y = cone.y + ny * bMin;

        // Reflect velocity
        const dot = this.ball.vx * nx + this.ball.vy * ny;
        this.ball.vx -= 1.8 * dot * nx;
        this.ball.vy -= 1.8 * dot * ny;
        sounds.playWallBounce();
      }

      // Player vs cone
      const pdx = this.player1.x - cone.x;
      const pdy = this.player1.y - cone.y;
      const pdist = Math.hypot(pdx, pdy);
      const pMin = cone.radius + this.player1.radius;
      if (pdist < pMin) {
        const nx = pdist > 0.0001 ? pdx / pdist : 1;
        const ny = pdist > 0.0001 ? pdy / pdist : 0;
        this.player1.x = cone.x + nx * pMin;
        this.player1.y = cone.y + ny * pMin;
        this.player1.vx *= 0.5;
        this.player1.vy *= 0.5;
      }
    }
  }

  private handlePostCollisions() {
    for (const post of this.posts) {
      const dx = this.ball.x - post.x;
      const dy = this.ball.y - post.y;
      const dist = Math.hypot(dx, dy);
      const minDist = post.radius + this.ball.radius;

      if (dist < minDist) {
        const nx = dist > 0.0001 ? dx / dist : 1;
        const ny = dist > 0.0001 ? dy / dist : 0;

        this.ball.x = post.x + nx * minDist;
        this.ball.y = post.y + ny * minDist;

        // Metallic bounce reflection
        const dot = this.ball.vx * nx + this.ball.vy * ny;
        this.ball.vx = (this.ball.vx - 1.9 * dot * nx) * 0.92;
        this.ball.vy = (this.ball.vy - 1.9 * dot * ny) * 0.92;

        sounds.playPostHit();
        this.spawnPostSparks(post.x, post.y);
      }
    }
  }

  private handleWallCollisions() {
    const r = this.ball.radius;
    const bounce = 0.82;

    // Top & Bottom walls
    if (this.ball.y - r < 0) {
      this.ball.y = r;
      this.ball.vy = -this.ball.vy * bounce;
      sounds.playWallBounce();
    } else if (this.ball.y + r > PITCH_HEIGHT) {
      this.ball.y = PITCH_HEIGHT - r;
      this.ball.vy = -this.ball.vy * bounce;
      sounds.playWallBounce();
    }

    // Left Goal area vs Left wall
    if (this.ball.x - r < 0) {
      // Is ball inside goal mouth?
      if (this.ball.y > GOAL_Y_TOP && this.ball.y < GOAL_Y_BOTTOM) {
        // Goal net back wall
        if (this.ball.x - r < -GOAL_DEPTH) {
          this.ball.x = -GOAL_DEPTH + r;
          this.ball.vx = -this.ball.vx * 0.4; // Soft net damping
        }
        // Goal net top & bottom walls
        if (this.ball.y - r < GOAL_Y_TOP) {
          this.ball.y = GOAL_Y_TOP + r;
          this.ball.vy = -this.ball.vy * 0.4;
        } else if (this.ball.y + r > GOAL_Y_BOTTOM) {
          this.ball.y = GOAL_Y_BOTTOM - r;
          this.ball.vy = -this.ball.vy * 0.4;
        }
      } else {
        // Regular left sideline wall
        this.ball.x = r;
        this.ball.vx = -this.ball.vx * bounce;
        sounds.playWallBounce();
      }
    }

    // Right Goal area vs Right wall
    if (this.ball.x + r > PITCH_WIDTH) {
      // Inside right goal mouth?
      if (this.ball.y > GOAL_Y_TOP && this.ball.y < GOAL_Y_BOTTOM) {
        // Goal net back wall
        if (this.ball.x + r > PITCH_WIDTH + GOAL_DEPTH) {
          this.ball.x = PITCH_WIDTH + GOAL_DEPTH - r;
          this.ball.vx = -this.ball.vx * 0.4;
        }
        // Net top & bottom walls
        if (this.ball.y - r < GOAL_Y_TOP) {
          this.ball.y = GOAL_Y_TOP + r;
          this.ball.vy = -this.ball.vy * 0.4;
        } else if (this.ball.y + r > GOAL_Y_BOTTOM) {
          this.ball.y = GOAL_Y_BOTTOM - r;
          this.ball.vy = -this.ball.vy * 0.4;
        }
      } else {
        // Regular right sideline wall
        this.ball.x = PITCH_WIDTH - r;
        this.ball.vx = -this.ball.vx * bounce;
        sounds.playWallBounce();
      }
    }
  }

  private checkTargetHits() {
    for (const t of this.targets) {
      if (t.hit) continue;
      const dx = this.ball.x - t.x;
      const dy = this.ball.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < t.radius + this.ball.radius) {
        t.hit = true;
        this.trainingStats.targetsHit++;
        sounds.playPostHit();
        this.spawnConfetti(t.x, t.y, '#f59e0b');
        setTimeout(() => {
          t.hit = false;
        }, 2500);
      }
    }
  }

  private checkGoalCondition() {
    // Left goal line crossed (Blue team scores)
    if (this.ball.x < -8 && this.ball.y > GOAL_Y_TOP && this.ball.y < GOAL_Y_BOTTOM) {
      this.triggerGoal('blue');
    }
    // Right goal line crossed (Red team scores)
    else if (this.ball.x > PITCH_WIDTH + 8 && this.ball.y > GOAL_Y_TOP && this.ball.y < GOAL_Y_BOTTOM) {
      this.triggerGoal('red');
    }
  }

  private triggerGoal(scoringTeam: 'red' | 'blue') {
    this.isGoalScored = true;
    this.goalScoredTeam = scoringTeam;
    this.goalCelebrationTimer = 3.2; // 3.2 seconds celebration
    this.score[scoringTeam]++;

    if (this.mode === 'TRAINING' && scoringTeam === 'red') {
      this.trainingStats.goalsScored++;
    }

    sounds.playGoal();
    this.spawnGoalCelebration(scoringTeam);
  }

  private processBotAI(bot: Player) {
    let speed = 0.2;
    let kickRangeBonus = 1;
    if (this.botDifficulty === 'easy') {
      speed = 0.14;
      kickRangeBonus = 0.8;
    } else if (this.botDifficulty === 'hard') {
      speed = 0.25;
      kickRangeBonus = 1.2;
    }

    const targetGoal = { x: 0, y: PITCH_HEIGHT / 2 }; // Red team goal
    const ownGoal = { x: PITCH_WIDTH, y: PITCH_HEIGHT / 2 };

    // Calculate ideal position relative to ball to kick towards red goal
    const ballToGoalX = targetGoal.x - this.ball.x;
    const ballToGoalY = targetGoal.y - this.ball.y;
    const bDist = Math.hypot(ballToGoalX, ballToGoalY) || 1;
    const dirGoalX = ballToGoalX / bDist;
    const dirGoalY = ballToGoalY / bDist;

    // Desired spot behind the ball
    let targetX = this.ball.x - dirGoalX * 18;
    let targetY = this.ball.y - dirGoalY * 18;

    // If ball is behind bot or threatening own goal, fall back to defend
    if (this.ball.x > bot.x && this.ball.x > PITCH_WIDTH / 2) {
      targetX = PITCH_WIDTH - 60;
      targetY = Math.max(GOAL_Y_TOP + 15, Math.min(GOAL_Y_BOTTOM - 15, this.ball.y));
    }

    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const dist = Math.hypot(dx, dy) || 1;

    bot.vx += (dx / dist) * speed;
    bot.vy += (dy / dist) * speed;

    // Check if bot should kick
    const distToBall = Math.hypot(this.ball.x - bot.x, this.ball.y - bot.y);
    if (distToBall <= KICK_DIST * kickRangeBonus) {
      bot.isKicking = true;
    } else {
      bot.isKicking = false;
    }
  }

  private processKeeperAI(keeper: Player) {
    // Goalkeeper patrol inside penalty box
    const idealX = PITCH_WIDTH - 25;
    // Follow ball Y coordinate, clamped strictly inside goal posts
    const targetY = Math.max(GOAL_Y_TOP + 12, Math.min(GOAL_Y_BOTTOM - 12, this.ball.y));

    const dx = idealX - keeper.x;
    const dy = targetY - keeper.y;

    keeper.vx += dx * 0.12;
    keeper.vy += dy * 0.2;

    // Kick ball away if it gets close
    const distToBall = Math.hypot(this.ball.x - keeper.x, this.ball.y - keeper.y);
    if (distToBall < KICK_DIST + 4) {
      keeper.isKicking = true;
    } else {
      keeper.isKicking = false;
    }
  }

  // Visual particle generators
  private spawnKickSparks(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 2.5,
        alpha: 0.9,
        life: 0.35,
      });
    }
  }

  private spawnPostSparks(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#fbbf24',
        size: 3,
        alpha: 1,
        life: 0.45,
      });
    }
  }

  private spawnConfetti(x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3,
        alpha: 1,
        life: 0.8,
      });
    }
  }

  private spawnGoalCelebration(team: 'red' | 'blue') {
    const colors =
      team === 'red' ? ['#ef4444', '#f87171', '#fbbf24', '#ffffff'] : ['#3b82f6', '#60a5fa', '#38bdf8', '#ffffff'];
    const originX = team === 'red' ? PITCH_WIDTH + 20 : -20;
    const originY = PITCH_HEIGHT / 2;

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: originX + (Math.random() * 30 - 15),
        y: originY + (Math.random() * 80 - 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 1.5 + Math.random() * 1.5,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= 0.02;
      p.life -= 0.016;

      if (p.alpha <= 0 || p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

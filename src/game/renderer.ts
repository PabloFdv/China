import {
  BALL_RADIUS,
  ChinaBallGame,
  GOAL_DEPTH,
  GOAL_WIDTH,
  GOAL_Y_BOTTOM,
  GOAL_Y_TOP,
  KICK_DIST,
  PITCH_HEIGHT,
  PITCH_WIDTH,
  POST_RADIUS,
} from './engine';
import { Player } from './types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(game: ChinaBallGame, canvasWidth: number, canvasHeight: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale and translation to fit 840x420 + margins in viewport
    const totalW = PITCH_WIDTH + GOAL_DEPTH * 2 + 80;
    const totalH = PITCH_HEIGHT + 70;
    const scale = Math.min(canvasWidth / totalW, canvasHeight / totalH);

    const offsetX = (canvasWidth - PITCH_WIDTH * scale) / 2;
    const offsetY = (canvasHeight - PITCH_HEIGHT * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. Draw outer stadium surround
    this.drawStadiumSurround(game);

    // 2. Draw goal nets
    this.drawGoalNets(game);

    // 3. Draw pitch surface & field lines
    this.drawPitchSurface(game);
    this.drawPitchMarkings(game);

    // 4. Draw training cones & targets
    if (game.mode === 'TRAINING') {
      this.drawTrainingObstacles(game);
    }

    // 5. Draw goal posts
    this.drawGoalPosts(game);

    // 6. Draw ball trajectory trail
    this.drawBallTrail(game);

    // 7. Draw players
    this.drawPlayer(game.player1);
    if (game.player2) {
      this.drawPlayer(game.player2);
    }
    if (game.goalkeeperBot) {
      this.drawPlayer(game.goalkeeperBot);
    }

    // 8. Draw ball
    this.drawBall(game);

    // 9. Draw particles (sparks, confetti)
    this.drawParticles(game);

    // 10. Goal Celebration Banner
    if (game.isGoalScored) {
      this.drawGoalOverlay(game);
    }

    ctx.restore();
  }

  private drawStadiumSurround(game: ChinaBallGame) {
    const ctx = this.ctx;
    const margin = 80;

    // Outer tribune / stadium floor
    let surroundGrad = ctx.createRadialGradient(
      PITCH_WIDTH / 2,
      PITCH_HEIGHT / 2,
      200,
      PITCH_WIDTH / 2,
      PITCH_HEIGHT / 2,
      600
    );

    if (game.theme === 'chinared') {
      surroundGrad.addColorStop(0, '#450a0a');
      surroundGrad.addColorStop(1, '#1c0505');
    } else if (game.theme === 'futsal') {
      surroundGrad.addColorStop(0, '#1e293b');
      surroundGrad.addColorStop(1, '#090d16');
    } else if (game.theme === 'street') {
      surroundGrad.addColorStop(0, '#18181b');
      surroundGrad.addColorStop(1, '#09090b');
    } else {
      surroundGrad.addColorStop(0, '#143820');
      surroundGrad.addColorStop(1, '#08170c');
    }

    ctx.fillStyle = surroundGrad;
    ctx.fillRect(-margin - GOAL_DEPTH, -margin, PITCH_WIDTH + (margin + GOAL_DEPTH) * 2, PITCH_HEIGHT + margin * 2);
  }

  private drawGoalNets(game: ChinaBallGame) {
    const ctx = this.ctx;

    const netColor = game.theme === 'chinared' ? 'rgba(253, 224, 71, 0.4)' : 'rgba(255, 255, 255, 0.35)';
    const netBg = game.theme === 'chinared' ? 'rgba(153, 27, 27, 0.5)' : 'rgba(0, 0, 0, 0.3)';

    // Left Goal Net
    ctx.fillStyle = netBg;
    ctx.fillRect(-GOAL_DEPTH, GOAL_Y_TOP, GOAL_DEPTH, GOAL_WIDTH);

    ctx.strokeStyle = netColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Grid horizontal
    for (let y = GOAL_Y_TOP; y <= GOAL_Y_BOTTOM; y += 14) {
      ctx.moveTo(-GOAL_DEPTH, y);
      ctx.lineTo(0, y);
    }
    // Grid vertical
    for (let x = -GOAL_DEPTH; x <= 0; x += 13) {
      ctx.moveTo(x, GOAL_Y_TOP);
      ctx.lineTo(x, GOAL_Y_BOTTOM);
    }
    ctx.stroke();

    // Left Net Back border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-GOAL_DEPTH, GOAL_Y_TOP, GOAL_DEPTH, GOAL_WIDTH);

    // Right Goal Net
    ctx.fillStyle = netBg;
    ctx.fillRect(PITCH_WIDTH, GOAL_Y_TOP, GOAL_DEPTH, GOAL_WIDTH);

    ctx.strokeStyle = netColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = GOAL_Y_TOP; y <= GOAL_Y_BOTTOM; y += 14) {
      ctx.moveTo(PITCH_WIDTH, y);
      ctx.lineTo(PITCH_WIDTH + GOAL_DEPTH, y);
    }
    for (let x = PITCH_WIDTH; x <= PITCH_WIDTH + GOAL_DEPTH; x += 13) {
      ctx.moveTo(x, GOAL_Y_TOP);
      ctx.lineTo(x, GOAL_Y_BOTTOM);
    }
    ctx.stroke();

    // Right Net Back border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(PITCH_WIDTH, GOAL_Y_TOP, GOAL_DEPTH, GOAL_WIDTH);
  }

  private drawPitchSurface(game: ChinaBallGame) {
    const ctx = this.ctx;

    if (game.theme === 'classic') {
      // Classic Haxball stripes
      const stripeW = 60;
      const totalStripes = Math.ceil(PITCH_WIDTH / stripeW);
      for (let i = 0; i < totalStripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1f7537' : '#23863f';
        const x = i * stripeW;
        const w = Math.min(stripeW, PITCH_WIDTH - x);
        ctx.fillRect(x, 0, w, PITCH_HEIGHT);
      }
    } else if (game.theme === 'chinared') {
      // China Ball imperial red pitch with dragon subtle emblem
      const stripeW = 70;
      for (let i = 0; i < Math.ceil(PITCH_WIDTH / stripeW); i++) {
        ctx.fillStyle = i % 2 === 0 ? '#881337' : '#9f1239';
        ctx.fillRect(i * stripeW, 0, stripeW, PITCH_HEIGHT);
      }
    } else if (game.theme === 'futsal') {
      // Futsal hardwood court
      const plankH = 20;
      for (let y = 0; y < PITCH_HEIGHT; y += plankH) {
        ctx.fillStyle = (y / plankH) % 2 === 0 ? '#0284c7' : '#0369a1';
        ctx.fillRect(0, y, PITCH_WIDTH, plankH);
      }
    } else if (game.theme === 'street') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
      // Street asphalt texture
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 40; i++) {
        const rx = (i * 27) % PITCH_WIDTH;
        const ry = (i * 39) % PITCH_HEIGHT;
        ctx.fillRect(rx, ry, 4, 2);
      }
    }
  }

  private drawPitchMarkings(game: ChinaBallGame) {
    const ctx = this.ctx;
    const lineColor = game.theme === 'chinared' ? '#fde047' : '#ffffff';

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3.5;

    // Outer pitch boundary
    ctx.strokeRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 0);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Center kick-off spot
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Box
    const penaltyW = 120;
    const penaltyH = 220;
    const penaltyY = (PITCH_HEIGHT - penaltyH) / 2;
    ctx.strokeRect(0, penaltyY, penaltyW, penaltyH);

    // Left Penalty Spot
    ctx.beginPath();
    ctx.arc(90, PITCH_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Arc
    ctx.beginPath();
    ctx.arc(90, PITCH_HEIGHT / 2, 45, -0.65, 0.65);
    ctx.stroke();

    // Right Penalty Box
    ctx.strokeRect(PITCH_WIDTH - penaltyW, penaltyY, penaltyW, penaltyH);

    // Right Penalty Spot
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - 90, PITCH_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Right Penalty Arc
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - 90, PITCH_HEIGHT / 2, 45, Math.PI - 0.65, Math.PI + 0.65);
    ctx.stroke();

    // Corner Arcs
    const cornerR = 20;
    // Top-left
    ctx.beginPath();
    ctx.arc(0, 0, cornerR, 0, Math.PI / 2);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.arc(0, PITCH_HEIGHT, cornerR, -Math.PI / 2, 0);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH, 0, cornerR, Math.PI / 2, Math.PI);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH, PITCH_HEIGHT, cornerR, Math.PI, -Math.PI / 2);
    ctx.stroke();

    // Goal mouth lines (gap openings)
    ctx.clearRect(-2, GOAL_Y_TOP + 2, 4, GOAL_WIDTH - 4);
    ctx.clearRect(PITCH_WIDTH - 2, GOAL_Y_TOP + 2, 4, GOAL_WIDTH - 4);

    ctx.restore();
  }

  private drawGoalPosts(game: ChinaBallGame) {
    const ctx = this.ctx;

    for (const post of game.posts) {
      ctx.save();
      // Drop shadow
      ctx.beginPath();
      ctx.arc(post.x, post.y + 2, post.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Post body (Chrome / Metallic 3D gradient)
      const grad = ctx.createRadialGradient(
        post.x - post.radius * 0.3,
        post.y - post.radius * 0.3,
        post.radius * 0.1,
        post.x,
        post.y,
        post.radius
      );
      if (game.theme === 'chinared') {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.7, '#eab308');
        grad.addColorStop(1, '#854d0e');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#cbd5e1');
        grad.addColorStop(1, '#475569');
      }

      ctx.beginPath();
      ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawTrainingObstacles(game: ChinaBallGame) {
    const ctx = this.ctx;

    // 1. Cones
    for (const cone of game.cones) {
      ctx.save();
      // Shadow
      ctx.beginPath();
      ctx.ellipse(cone.x, cone.y + 3, cone.radius, cone.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Orange cone base
      const grad = ctx.createRadialGradient(cone.x - 2, cone.y - 2, 1, cone.x, cone.y, cone.radius);
      grad.addColorStop(0, '#ff7849');
      grad.addColorStop(0.8, '#ea580c');
      grad.addColorStop(1, '#9a3412');

      ctx.beginPath();
      ctx.arc(cone.x, cone.y, cone.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // White reflective stripe
      ctx.beginPath();
      ctx.arc(cone.x, cone.y, cone.radius * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Target Rings in Goal
    for (const target of game.targets) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fillStyle = target.hit ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fill();

      ctx.strokeStyle = target.hit ? '#4ade80' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = target.hit ? '#ffffff' : '#fbbf24';
      ctx.fill();

      // Target text
      ctx.font = 'bold 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`+${target.score}`, target.x, target.y);
      ctx.restore();
    }
  }

  private drawBallTrail(game: ChinaBallGame) {
    const ctx = this.ctx;
    for (const point of game.ballTrajectory) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(point.x, point.y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha * 0.35})`;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPlayer(player: Player) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Kick aura/ring (iconic Haxball visual: white expanding ring when kick button pressed)
    if (player.isKicking) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, KICK_DIST, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Subtle glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    }

    // 2. Drop shadow
    ctx.beginPath();
    ctx.arc(player.x, player.y + 3, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // 3. Player Disk body (Haxball style: solid with thick outer ring)
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Outer dark stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Inner highlight rim
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius - 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = player.accentColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Player number / initial
    ctx.font = 'bold 12px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.number, player.x, player.y + 1);

    // 5. Name tag floating above
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(player.name, player.x, player.y - player.radius - 6);

    ctx.restore();
  }

  private drawBall(game: ChinaBallGame) {
    const ctx = this.ctx;
    const b = game.ball;

    ctx.save();
    // Drop shadow
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 3, b.radius, b.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Ball sphere gradient
    const grad = ctx.createRadialGradient(
      b.x - b.radius * 0.3,
      b.y - b.radius * 0.3,
      b.radius * 0.1,
      b.x,
      b.y,
      b.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.8, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Black outer border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Soccer pentagon markings (classic Haxball style center patch)
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.restore();
  }

  private drawParticles(game: ChinaBallGame) {
    const ctx = this.ctx;
    for (const p of game.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawGoalOverlay(game: ChinaBallGame) {
    const ctx = this.ctx;
    ctx.save();

    // Semi-transparent backdrop flash
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    const team = game.goalScoredTeam;
    const teamName = team === 'red' ? 'VERMELHO' : 'AZUL';
    const bannerColor = team === 'red' ? '#ef4444' : '#3b82f6';

    // Celebration Card Banner
    const cardW = 420;
    const cardH = 130;
    const cardX = (PITCH_WIDTH - cardW) / 2;
    const cardY = (PITCH_HEIGHT - cardH) / 2;

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = bannerColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    // Header Text
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Chakra Petch", sans-serif';
    ctx.fillStyle = bannerColor;
    ctx.shadowColor = bannerColor;
    ctx.shadowBlur = 12;
    ctx.fillText('⚽ GOLAZO! ⚽', PITCH_WIDTH / 2, cardY + 48);

    // Subtitle
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`PONTO PARA O TIME ${teamName}!`, PITCH_WIDTH / 2, cardY + 84);

    // Countdown before kickoff
    const countdown = Math.ceil(game.goalCelebrationTimer);
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Reiniciando em ${countdown}...`, PITCH_WIDTH / 2, cardY + 112);

    ctx.restore();
  }
}

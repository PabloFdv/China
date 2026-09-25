import { ChinaBallEngine } from './chinaEngine';
import { HudConfig } from '../components/HudSettingsModal';

export class PitchRenderer {
  private ctx: CanvasRenderingContext2D;
  private camX = 0;
  private camY = 0;
  private ballGradient: CanvasGradient | null = null;
  private lastBallRadius = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    engine: ChinaBallEngine,
    width: number,
    height: number,
    alpha = 1,
    hudConfig?: HudConfig,
    playerProfile?: { color?: string; accentColor?: string; number?: string },
    inputX = 0,
    inputY = 0
  ) {
    const ctx = this.ctx;
    const field = engine.field;
    const FW = field.width;
    const FH = field.height;
    const GD = field.goalDepth;
    const GW = field.goalWidth;
    const hw = FW / 2;
    const hh = FH / 2;

    const cameraZoom = hudConfig?.cameraZoom || 'auto';
    const allowEffects = hudConfig ? hudConfig.showVisualEffects : true;
    const allowTrail = hudConfig ? hudConfig.showBallTrail : true;
    const allowShake = hudConfig ? hudConfig.enableScreenShake : true;
    const allowLaser = hudConfig ? hudConfig.showAimLaser : true;
    const isFixedCam = hudConfig ? hudConfig.cameraFollow === 'fixed' : false;

    ctx.clearRect(0, 0, width, height);

    // Fundo escuro do estádio (#112617)
    ctx.fillStyle = '#112617';
    ctx.fillRect(0, 0, width, height);

    // Escala responsiva otimizada para caber qualquer mapa (1v1 até 4v4)
    const isPortrait = height > width * 1.05;
    const marginX = isPortrait ? 8 : 24;
    const marginY = isPortrait ? 8 : 18;

    let baseScale = Math.min(
      (width - marginX * 2) / (FW + GD * 2 + 20),
      (height - marginY * 2) / (FH + 20)
    );

    if (cameraZoom === 'wide') {
      baseScale *= 0.88;
    } else if (cameraZoom === 'close') {
      baseScale *= 1.20;
    }

    const cx = Math.round(width / 2);
    const cy = isPortrait ? Math.round(height * 0.38) : Math.round(height / 2);

    // Câmera de transmissão suave ou fixa no meio
    if (isFixedCam) {
      this.camX = 0;
      this.camY = 0;
    } else {
      const targetCamX = (engine.ball.x * 0.10 + engine.player.x * 0.04);
      const targetCamY = (engine.ball.y * 0.10 + engine.player.y * 0.04);
      this.camX += (targetCamX - this.camX) * 0.06;
      this.camY += (targetCamY - this.camY) * 0.06;
    }

    ctx.save();

    // Aplicação do Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (allowShake && engine.screenShake > 0.05) {
      shakeX = (Math.random() - 0.5) * 2 * engine.screenShake;
      shakeY = (Math.random() - 0.5) * 2 * engine.screenShake;
    }

    ctx.translate(cx + shakeX - this.camX * baseScale, cy + shakeY - this.camY * baseScale);
    ctx.scale(baseScale, baseScale);

    // ========================================================================
    // 1. GRAMADO DINÂMICO (FAIXAS MANICURADAS EM ESMERALDA)
    // ========================================================================
    const numStripes = field.numStripes || 14;
    const stripeWidth = FW / numStripes;

    for (let i = 0; i < numStripes; i++) {
      const sx = -hw + i * stripeWidth;
      ctx.fillStyle = i % 2 === 0 ? '#226839' : '#27723f';
      ctx.fillRect(sx, -hh, stripeWidth, FH);
    }

    // ========================================================================
    // 2. REDES DOS GOLS (BATCHED SINGLE-STROKE PATHS PARA ALTA PERFORMANCE)
    // ========================================================================
    const drawGoalNet = (gx: number, gy: number, gw: number, gh: number, isRight = false) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(gx, gy, gw, gh);

      const step = 8;
      const xStart = gx;
      const xEnd = gx + gw;
      const yStart = gy;
      const yEnd = gy + gh;

      const ballInThisGoal = isRight ? engine.ball.x > hw : engine.ball.x < -hw;
      const pullX = ballInThisGoal ? (engine.ball.x - (isRight ? hw : -hw)) * 0.25 : 0;
      const pullY = ballInThisGoal ? engine.ball.y * 0.15 : 0;

      // Malha quadriculada consolidada
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let x = xStart; x <= xEnd; x += step) {
        ctx.moveTo(x + pullX, yStart);
        ctx.lineTo(x + pullX, yEnd + pullY);
      }
      for (let y = yStart; y <= yEnd; y += step) {
        ctx.moveTo(xStart, y + pullY);
        ctx.lineTo(xEnd + pullX, y + pullY);
      }
      ctx.stroke();

      // Moldura externa da rede
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(gx, gy, gw, gh);
    };

    drawGoalNet(-hw - GD, -GW / 2, GD, GW, false);
    drawGoalNet(hw, -GW / 2, GD, GW, true);

    // ========================================================================
    // 3. DEMARCAÇÕES OFICIAIS DO ESTÁDIO (PROPORCIONAIS AO MAPA)
    // ========================================================================
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    // Perímetro
    ctx.rect(-hw, -hh, FW, FH);
    // Linha de Meio de Campo
    ctx.moveTo(0, -hh);
    ctx.lineTo(0, hh);
    ctx.stroke();

    // Círculo Central
    ctx.beginPath();
    ctx.arc(0, 0, field.centerCircleR, 0, Math.PI * 2);
    ctx.stroke();

    // Ponto Central
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Grandes e Pequenas Áreas
    const boxW = field.penaltyBoxW;
    const boxH = field.penaltyBoxH;
    const sBoxW = field.goalBoxW;
    const sBoxH = field.goalBoxH;

    ctx.strokeRect(-hw, -boxH / 2, boxW, boxH);
    ctx.strokeRect(hw - boxW, -boxH / 2, boxW, boxH);
    ctx.strokeRect(-hw, -sBoxH / 2, sBoxW, sBoxH);
    ctx.strokeRect(hw - sBoxW, -sBoxH / 2, sBoxW, sBoxH);

    // Marcas de Pênalti
    const penDist = Math.round(boxW * 0.72);
    ctx.beginPath();
    ctx.arc(-hw + penDist, 0, 2.8, 0, Math.PI * 2);
    ctx.arc(hw - penDist, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Meias-Luas e Escanteios
    const arcR = Math.round(field.centerCircleR * 0.54);
    const cornerR = 14;
    ctx.beginPath();
    ctx.arc(-hw + penDist, 0, arcR, -0.65, 0.65);
    ctx.moveTo(hw - penDist, 0);
    ctx.arc(hw - penDist, 0, arcR, Math.PI - 0.65, Math.PI + 0.65);

    // Escanteios
    ctx.moveTo(-hw + cornerR, -hh);
    ctx.arc(-hw, -hh, cornerR, 0, Math.PI / 2);
    ctx.moveTo(-hw, hh - cornerR);
    ctx.arc(-hw, hh, cornerR, -Math.PI / 2, 0);
    ctx.moveTo(hw - cornerR, -hh);
    ctx.arc(hw, -hh, cornerR, Math.PI / 2, Math.PI);
    ctx.moveTo(hw, hh - cornerR);
    ctx.arc(hw, hh, cornerR, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // ========================================================================
    // 4. SHOCKWAVES NO GRAMADO (SE ATIVADO NAS OPÇÕES)
    // ========================================================================
    if (allowEffects && engine.shockwaves.length > 0) {
      for (let i = 0; i < engine.shockwaves.length; i++) {
        const sw = engine.shockwaves[i];
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = sw.alpha;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // ========================================================================
    // 5. RASTRO COMET DA BOLA (SE ATIVADO NAS OPÇÕES)
    // ========================================================================
    const b = engine.ball;
    const rBall = engine.getRenderBall(alpha);
    const ballRot = engine.getRenderBallRotation(alpha);
    const ballSpd = Math.hypot(b.vx, b.vy);

    if (allowTrail && engine.ballTrail.length > 1) {
      for (let i = 0; i < engine.ballTrail.length; i++) {
        const tr = engine.ballTrail[i];
        const progress = i / engine.ballTrail.length;
        const trRadius = b.radius * (1 - progress * 0.45);
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, trRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${tr.alpha * 0.35})`;
        ctx.fill();
      }
    }

    // ========================================================================
    // 6. POSTES DOS GOLS (POSTES METÁLICOS)
    // ========================================================================
    for (let i = 0; i < engine.posts.length; i++) {
      const post = engine.posts[i];
      ctx.beginPath();
      ctx.arc(post.x, post.y, post.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(post.x - 1.5, post.y - 1.5, post.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }

    // ========================================================================
    // 7. GUIA DE MIRA DINÂMICA DO CHUTE (SE ATIVADO NAS OPÇÕES)
    // ========================================================================
    if (allowLaser) {
      const aimVec = engine.getKickAimVector(inputX, inputY);
      if (aimVec.active && engine.kickCooldown === 0) {
        const aimLen = 52;
        const targetX = rBall.x + aimVec.x * aimLen;
        const targetY = rBall.y + aimVec.y * aimLen;

        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(rBall.x + aimVec.x * b.radius, rBall.y + aimVec.y * b.radius);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.setLineDash([]);

        const arrowAng = Math.atan2(aimVec.y, aimVec.x);
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(
          targetX - Math.cos(arrowAng - 0.45) * 8,
          targetY - Math.sin(arrowAng - 0.45) * 8
        );
        ctx.lineTo(
          targetX - Math.cos(arrowAng + 0.45) * 8,
          targetY - Math.sin(arrowAng + 0.45) * 8
        );
        ctx.closePath();
        ctx.fillStyle = '#facc15';
        ctx.fill();
      }
    }

    // ========================================================================
    // 8. BOLA COM PSEUDO-3D, SOMBRA DINÂMICA E SPIN REAL
    // ========================================================================
    const elevation = Math.min(5.5, ballSpd * 0.65);
    const drawBallY = rBall.y - elevation * 0.5;

    // Sombra dinâmica da bola
    ctx.beginPath();
    ctx.ellipse(
      rBall.x,
      rBall.y + 3.5 + elevation,
      b.radius * (1.1 - elevation * 0.03),
      b.radius * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.18, 0.38 - elevation * 0.03)})`;
    ctx.fill();

    // Renderização rotacional da bola
    ctx.save();
    ctx.translate(rBall.x, drawBallY);
    ctx.rotate(ballRot);

    // Corpo esférico da bola (gradiente cached)
    if (!this.ballGradient || this.lastBallRadius !== b.radius) {
      this.ballGradient = ctx.createRadialGradient(-3, -3, 1, 0, 0, b.radius);
      this.ballGradient.addColorStop(0, '#ffffff');
      this.ballGradient.addColorStop(0.7, '#f1f5f9');
      this.ballGradient.addColorStop(1, '#cbd5e1');
      this.lastBallRadius = b.radius;
    }

    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.ballGradient;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Pentágono central rotacionado
    ctx.beginPath();
    const sides = 5;
    const rSmall = b.radius * 0.44;
    for (let i = 0; i < sides; i++) {
      const ang = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = Math.cos(ang) * rSmall;
      const py = Math.sin(ang) * rSmall;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Costuras radiais consolidadas
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const vx = Math.cos(ang) * rSmall;
      const vy = Math.sin(ang) * rSmall;
      const ex = Math.cos(ang) * b.radius;
      const ey = Math.sin(ang) * b.radius;
      ctx.moveTo(vx, vy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // Gomos nas bordas
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const ex = Math.cos(ang) * b.radius;
      const ey = Math.sin(ang) * b.radius;
      ctx.moveTo(ex, ey);
      ctx.arc(ex, ey, b.radius * 0.22, 0, Math.PI * 2);
    }
    ctx.fill();

    // Brilho especular superior
    ctx.beginPath();
    ctx.arc(-2.5, -2.5, b.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    ctx.restore();

    // ========================================================================
    // 9. JOGADORES EM CAMPO (TIME VERMELHO/AMARELO & TIME AZUL - 1v1 até 4v4)
    // ========================================================================
    const renderPlayers = engine.getRenderPlayers(alpha);

    for (const p of renderPlayers) {
      const isHuman = !p.isBot && p === renderPlayers[0];

      // Halo de chute
      if (p.isKicking) {
        ctx.beginPath();
        ctx.arc(p.renderX, p.renderY, p.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }

      // Indicador de "CHUTE PRONTO" em volta do jogador humano
      if (isHuman) {
        const distToBall = Math.hypot(engine.ball.x - engine.player.x, engine.ball.y - engine.player.y);
        const kickReach = p.radius + b.radius + 7.5;
        const canKick = distToBall <= kickReach && engine.kickCooldown === 0;

        if (canKick) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.009);
          ctx.beginPath();
          ctx.arc(p.renderX, p.renderY, p.radius + 3.2 + pulse * 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${0.45 + pulse * 0.45})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      }

      // Sombra
      ctx.beginPath();
      ctx.ellipse(p.renderX, p.renderY + 5.0, p.radius * 1.15, p.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Disco do jogador
      let discColor = p.team === 'red' ? '#f4d025' : '#1e5cd8';
      let strokeColor = p.team === 'red' ? '#1e293b' : '#0f172a';

      if (isHuman && playerProfile?.color) {
        discColor = playerProfile.color;
      }

      ctx.beginPath();
      ctx.arc(p.renderX, p.renderY, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = discColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Anel interno esportivo
      ctx.beginPath();
      ctx.arc(p.renderX, p.renderY, p.radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Número da camisa
      const numText = isHuman && playerProfile?.number ? playerProfile.number : p.number || (p.team === 'red' ? '10' : '7');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 12px sans-serif';

      // Sombra nítida do número
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(numText, p.renderX + 1, p.renderY + 2);
      ctx.fillStyle = isHuman && playerProfile?.accentColor ? playerProfile.accentColor : '#ffffff';
      ctx.fillText(numText, p.renderX, p.renderY + 1);

      // Reflexo 3D
      ctx.beginPath();
      ctx.arc(p.renderX - 3, p.renderY - 3, p.radius * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      // Indicador Chevron Flutuante: P1 para o usuário, CPU ou nome para outros
      const chevronY = p.renderY - p.radius - 12;

      ctx.beginPath();
      ctx.moveTo(p.renderX, chevronY + 5);
      ctx.lineTo(p.renderX - 5, chevronY - 2);
      ctx.lineTo(p.renderX + 5, chevronY - 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p.renderX, chevronY + 4);
      ctx.lineTo(p.renderX - 5, chevronY - 3);
      ctx.lineTo(p.renderX + 5, chevronY - 3);
      ctx.closePath();
      ctx.fillStyle = isHuman ? '#facc15' : p.team === 'red' ? '#fbbf24' : '#38bdf8';
      ctx.fill();
    }

    // ========================================================================
    // 10. PARTÍCULAS (BATCHED LOOP SEM SAVE/RESTORE, SE ATIVADO)
    // ========================================================================
    if (allowEffects && engine.particles.length > 0) {
      for (let i = 0; i < engine.particles.length; i++) {
        const pt = engine.particles[i];
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // ========================================================================
    // 11. BANNER DE GOL ESTILO TRANSMISSÃO DE TV
    // ========================================================================
    if (engine.goalMessage) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-hw, -36, FW, 72);

      ctx.font = '900 italic 62px sans-serif';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText(engine.goalMessage, 0, -4);
      ctx.fillStyle = '#ffdf20';
      ctx.fillText(engine.goalMessage, 0, -4);

      ctx.font = '800 16px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('REINICIANDO NO MEIO-CAMPO...', 0, 48);
    }

    // ========================================================================
    // 12. SENSOR DE TELEMETRIA FÍSICA (QUANDO ATIVADO)
    // ========================================================================
    if (engine.debug.enabled) {
      ctx.beginPath();
      ctx.moveTo(engine.player.x, engine.player.y);
      ctx.lineTo(engine.player.x + engine.player.vx * 14, engine.player.y + engine.player.vy * 14);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rBall.x, drawBallY);
      ctx.lineTo(rBall.x + engine.ball.vx * 14, drawBallY + engine.ball.vy * 14);
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (engine.debug.lastCollisionNormal.x !== 0 || engine.debug.lastCollisionNormal.y !== 0) {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(rBall.x, drawBallY);
        ctx.lineTo(
          rBall.x + engine.debug.lastCollisionNormal.x * 32,
          drawBallY + engine.debug.lastCollisionNormal.y * 32
        );
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }
}

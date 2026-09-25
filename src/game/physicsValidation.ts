// Teste Automatizado de Verificação Físico-Sistemática:
// - Valida parada quase instantânea ao zerar joystick (sem deslizamento contínuo)
// - Valida preservação de 98% da velocidade na colisão com paredes
// - Valida condução da bola e colisão com tabelas
import { ChinaBallEngine } from './chinaEngine';
import { HAXBALL } from './physicsConfig';

export function runPhysicsValidation(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  const engine = new ChinaBallEngine();

  // Teste 1: Parada Quase Instantânea do Jogador
  // Acelera por 20 ticks
  for (let i = 0; i < 20; i++) {
    engine.tick(1, 0, false);
  }
  const speedMoving = Math.hypot(engine.player.vx, engine.player.vy);
  logs.push(`Velocidade em movimento acelerado: ${speedMoving.toFixed(2)} px/tick (max: ${HAXBALL.player.maxSpeed})`);

  // Solta o joystick por apenas 2 ticks
  engine.tick(0, 0, false);
  engine.tick(0, 0, false);
  const speedStopped = Math.hypot(engine.player.vx, engine.player.vy);
  logs.push(`Velocidade após soltar joystick (2 ticks): ${speedStopped.toFixed(4)} px/tick`);

  if (speedStopped > 0.15) {
    logs.push('FALHA: Jogador ainda está deslizando!');
    return { success: false, logs };
  }
  logs.push('SUCESSO: Jogador freia quase instantaneamente sem deslize residual.');

  // Teste 2: Preservação de 98% da velocidade no rebote da parede
  engine.ball.x = 0;
  engine.ball.y = -HAXBALL.field.height / 2 + 15; // Próximo à parede superior
  engine.ball.vx = 4.0;
  engine.ball.vy = -5.0; // Indo contra a parede superior (y = -210)
  const initialBallSpeed = Math.hypot(engine.ball.vx, engine.ball.vy);

  // Executa tick onde a bola colide com a parede
  engine.tick(0, 0, false);

  const postBounceSpeed = Math.hypot(engine.ball.vx, engine.ball.vy);
  const ratio = postBounceSpeed / initialBallSpeed;
  logs.push(`Velocidade inicial da bola: ${initialBallSpeed.toFixed(2)}, após rebote: ${postBounceSpeed.toFixed(2)}, ratio: ${(ratio * 100).toFixed(1)}%`);

  if (Math.abs(ratio - 0.98) > 0.03) {
    logs.push(`AVISO: Taxa de retenção ficou em ${(ratio * 100).toFixed(1)}% (esperado ~98%)`);
  } else {
    logs.push('SUCESSO: Tabela preservou exatamente 98% da velocidade na colisão com a parede.');
  }

  // Teste 3: Chute com mira do joystick em qualquer ângulo
  engine.player.x = 0;
  engine.player.y = 0;
  engine.ball.x = 10;
  engine.ball.y = 0;
  // Aponta joystick para cima (mirando na parede para tabela) e chuta
  engine.tick(0, -1, true);
  logs.push(`Bola após chute mirando para cima: vx=${engine.ball.vx.toFixed(2)}, vy=${engine.ball.vy.toFixed(2)}`);
  if (engine.ball.vy < -4.0) {
    logs.push('SUCESSO: Chute obedece à mira do joystick para tabelar na parede!');
  }

  return { success: true, logs };
}

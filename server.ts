import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();
app.use(express.json());

interface RoomPlayer {
  id: string;
  name: string;
  team: 'red' | 'blue' | 'spec';
  slot: number;
  isHost: boolean;
  ws?: WebSocket;
}

interface Room {
  id: string;
  name: string;
  mapSize: '1v1' | '2v2' | '3v3' | '4v4';
  teamSize: 1 | 2 | 3 | 4;
  maxPlayers: number;
  goalLimit: number;
  timeLimit: number;
  password?: string;
  region: string;
  createdAt: number;
  players: Map<string, RoomPlayer>;
}

// Armazenamento em memória das salas reais
const rooms = new Map<string, Room>();

// Inicializa salas padrão ativas para entrada imediata
function seedDefaultRooms() {
  const defaultRooms: Array<Omit<Room, 'players'> & { initialPlayers?: number }> = [
    {
      id: 'sala-brasil-1v1',
      name: '🇧🇷 Brasil Oficial 1v1',
      mapSize: '1v1',
      teamSize: 1,
      maxPlayers: 2,
      goalLimit: 3,
      timeLimit: 3,
      region: 'BR',
      createdAt: Date.now(),
    },
    {
      id: 'sala-duplas-2v2',
      name: '⚡ Duplas Rápidas 2v2',
      mapSize: '2v2',
      teamSize: 2,
      maxPlayers: 4,
      goalLimit: 5,
      timeLimit: 5,
      region: 'BR',
      createdAt: Date.now(),
    },
    {
      id: 'sala-arena-3v3',
      name: '🏆 Copa América 3v3',
      mapSize: '3v3',
      teamSize: 3,
      maxPlayers: 6,
      goalLimit: 5,
      timeLimit: 7,
      region: 'BR',
      createdAt: Date.now(),
    },
    {
      id: 'sala-maracana-4v4',
      name: '🏟️ Maracanã 4v4 Clássico',
      mapSize: '4v4',
      teamSize: 4,
      maxPlayers: 8,
      goalLimit: 7,
      timeLimit: 10,
      region: 'BR',
      createdAt: Date.now(),
    },
  ];

  for (const r of defaultRooms) {
    rooms.set(r.id, {
      ...r,
      players: new Map(),
    });
  }
}

seedDefaultRooms();

function serializeRooms() {
  const list = [];
  for (const [, r] of rooms) {
    list.push({
      id: r.id,
      name: r.name,
      mapSize: r.mapSize,
      teamSize: r.teamSize,
      mode: `${r.teamSize}v${r.teamSize}`,
      players: r.players.size,
      maxPlayers: r.maxPlayers,
      goalLimit: r.goalLimit,
      timeLimit: r.timeLimit,
      hasPassword: Boolean(r.password),
      region: r.region,
      ping: Math.floor(15 + Math.random() * 20),
    });
  }
  return list;
}

// REST API para Salas
app.get('/api/rooms', (req, res) => {
  res.json({ rooms: serializeRooms() });
});

app.post('/api/rooms', (req, res) => {
  const { name, mapSize = '1v1', teamSize = 1, goalLimit = 5, timeLimit = 5, password = '', region = 'BR' } = req.body;

  const validTeamSize = Math.max(1, Math.min(4, Number(teamSize) || 1)) as 1 | 2 | 3 | 4;
  const validMapSize = (['1v1', '2v2', '3v3', '4v4'].includes(mapSize) ? mapSize : `${validTeamSize}v${validTeamSize}`) as '1v1' | '2v2' | '3v3' | '4v4';

  const id = `sala-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newRoom: Room = {
    id,
    name: name?.trim() || `Sala ${validMapSize} de Amigos`,
    mapSize: validMapSize,
    teamSize: validTeamSize,
    maxPlayers: validTeamSize * 2,
    goalLimit: Number(goalLimit) || 5,
    timeLimit: Number(timeLimit) || 5,
    password: password?.trim() || undefined,
    region: region || 'BR',
    createdAt: Date.now(),
    players: new Map(),
  };

  rooms.set(id, newRoom);
  res.status(201).json({ success: true, room: newRoom });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// WebSocket para Multiplayer em Tempo Real
wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'join_room') {
        const room = rooms.get(msg.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' }));
          return;
        }

        currentRoomId = msg.roomId;
        playerId = msg.playerId || `p_${Date.now()}_${Math.floor(Math.random() * 100)}`;

        const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
        const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;
        const assignedTeam = msg.preferredTeam || (redCount <= blueCount ? 'red' : 'blue');

        const player: RoomPlayer = {
          id: playerId!,
          name: msg.name || 'Jogador',
          team: assignedTeam,
          slot: room.players.size,
          isHost: room.players.size === 0,
          ws,
        };

        room.players.set(playerId!, player);

        // Notifica o jogador que entrou
        ws.send(
          JSON.stringify({
            type: 'room_joined',
            roomId: room.id,
            roomName: room.name,
            mapSize: room.mapSize,
            teamSize: room.teamSize,
            player: { id: player.id, name: player.name, team: player.team, isHost: player.isHost },
            players: Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              team: p.team,
              isHost: p.isHost,
            })),
          })
        );

        // Notifica os outros jogadores da sala
        broadcastToRoom(room, {
          type: 'player_joined',
          player: { id: player.id, name: player.name, team: player.team },
        }, playerId!);
      }

      if (msg.type === 'player_input' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          broadcastToRoom(room, {
            type: 'peer_input',
            playerId,
            x: msg.x,
            y: msg.y,
            kick: msg.kick,
          }, playerId);
        }
      }

      if (msg.type === 'sync_player' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const sender = room.players.get(playerId);
          broadcastToRoom(
            room,
            {
              type: 'peer_player_sync',
              playerId,
              team: sender?.team || 'red',
              slot: sender?.slot || 0,
              x: msg.x,
              y: msg.y,
              vx: msg.vx,
              vy: msg.vy,
              isKicking: Boolean(msg.isKicking),
            },
            playerId
          );
        }
      }

      if (msg.type === 'sync_ball' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const sender = room.players.get(playerId);
          if (sender?.isHost) {
            broadcastToRoom(
              room,
              {
                type: 'peer_ball_sync',
                x: msg.x,
                y: msg.y,
                vx: msg.vx,
                vy: msg.vy,
                angle: msg.angle,
                scoreYellow: msg.scoreYellow,
                scoreBlue: msg.scoreBlue,
              },
              playerId
            );
          }
        }
      }

      if (msg.type === 'sync_goal' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          broadcastToRoom(room, {
            type: 'peer_goal',
            scorerTeam: msg.scorerTeam,
            message: msg.message,
            scoreYellow: msg.scoreYellow,
            scoreBlue: msg.scoreBlue,
          });
        }
      }

      if (msg.type === 'sync_reset' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          broadcastToRoom(room, {
            type: 'peer_reset',
          });
        }
      }

      if (msg.type === 'chat_message' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const sender = room.players.get(playerId);
          broadcastToRoom(room, {
            type: 'chat',
            sender: sender?.name || 'Jogador',
            team: sender?.team || 'red',
            text: msg.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && playerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const wasHost = room.players.get(playerId)?.isHost;
        room.players.delete(playerId);
        broadcastToRoom(room, { type: 'player_left', playerId });

        if (wasHost && room.players.size > 0) {
          const newHost = room.players.values().next().value;
          if (newHost) {
            newHost.isHost = true;
            broadcastToRoom(room, { type: 'host_transferred', hostId: newHost.id });
          }
        }

        // Se a sala for customizada e vazia, remove após 1 minuto
        if (room.players.size === 0 && !room.id.startsWith('sala-brasil') && !room.id.startsWith('sala-duplas') && !room.id.startsWith('sala-arena') && !room.id.startsWith('sala-maracana')) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

function broadcastToRoom(room: Room, msg: object, excludePlayerId?: string) {
  const json = JSON.stringify(msg);
  for (const [id, p] of room.players) {
    if (excludePlayerId && id === excludePlayerId) continue;
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(json);
    }
  }
}

// Inicia Vite em Dev ou Estáticos em Prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Servidor ChinaBall online na porta ${PORT}`);
  });
}

start();

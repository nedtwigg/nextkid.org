import { DurableObject } from 'cloudflare:workers';
import { applyCommand, createGame, parseCommand, parseNewGame, record, type Game, type Snapshot } from '../src/game';

interface Env { GAMES: DurableObjectNamespace<GameRoom>; ASSETS: Fetcher }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(id);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.headers.has('Origin') && request.headers.get('Origin') !== url.origin) return json({ error: 'Use the game link to join.' }, 403);
    if (url.pathname === '/api/games' && request.method === 'POST') {
      if (Number(request.headers.get('Content-Length')) > 8192) return json({ error: 'Request too large.' }, 413);
      let input;
      try {
        const body = await request.text();
        if (body.length > 8192) return json({ error: 'Request too large.' }, 413);
        input = parseNewGame(JSON.parse(body));
      } catch (error) { return json({ error: error instanceof Error ? error.message : 'Invalid game.' }, 400); }
      const id = crypto.randomUUID();
      return env.GAMES.getByName(id).fetch(new Request(`${url.origin}/create/${id}`, { method: 'POST', body: JSON.stringify(input) }));
    }
    const match = /^\/api\/games\/([a-zA-Z0-9_-]+)(\/socket)?$/.exec(url.pathname);
    if (!match || !validId(match[1]) || request.method !== 'GET') return json({ error: 'Game not found.' }, 404);
    if (match[2] && request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'WebSocket required.' }, 426);
    return env.GAMES.getByName(match[1]).fetch(request);
  },
} satisfies ExportedHandler<Env>;

export class GameRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS game (id INTEGER PRIMARY KEY CHECK(id = 1), state TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS commands (id TEXT PRIMARY KEY)');
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  private read(): Game | null {
    const rows = this.ctx.storage.sql.exec<{ state: string }>('SELECT state FROM game WHERE id = 1').toArray();
    return rows.length ? JSON.parse(rows[0].state) : null;
  }
  private write(game: Game) {
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO game (id, state) VALUES (1, ?)', JSON.stringify(game));
  }
  private connections() { return this.ctx.getWebSockets().filter(socket => socket.readyState === WebSocket.OPEN); }
  private snapshot(game: Game, extra: Partial<Snapshot> = {}): Snapshot {
    return { type: 'state', game, serverNow: Date.now(), connections: this.connections().length, ...extra };
  }
  private broadcast(game: Game, extra: Partial<Snapshot> = {}) {
    const message = JSON.stringify(this.snapshot(game, extra));
    for (const socket of this.connections()) {
      try { socket.send(message); } catch { socket.close(1011, 'Reconnect to sync.'); }
    }
  }
  private expired(game: Game) { return game.expiresAt !== null && game.expiresAt <= Date.now(); }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.startsWith('/create/')) {
      // Only the routing Worker can reach this initialization endpoint.
      const input = parseNewGame(await request.json());
      const game = createGame(url.pathname.split('/').pop()!, input, Date.now());
      const exists = this.ctx.storage.transactionSync(() => {
        if (this.read()) return true;
        this.write(game);
        return false;
      });
      if (exists) return json({ error: 'Game already exists.' }, 409);
      await this.ctx.storage.setAlarm(game.expiresAt!);
      return json({ id: game.id, url: `/g/${game.id}` }, 201);
    }
    const game = this.read();
    if (!game || this.expired(game)) return json({ error: 'This game has expired or does not exist.' }, 404);
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      if (this.connections().length >= 20) return json({ error: 'Too many connections. Close an extra game tab.' }, 429);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      this.broadcast(game);
      return new Response(null, { status: 101, webSocket: client });
    }
    return json(this.snapshot(game));
  }
  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer) {
    let id: string | undefined;
    try {
      if (typeof raw !== 'string' || raw.length > 8192) throw new Error('Invalid message.');
      const input = record(JSON.parse(raw));
      const game = this.read();
      if (!game || this.expired(game)) {
        socket.send(JSON.stringify({ type: 'expired' }));
        socket.close(4004, 'Game expired.');
        return;
      }
      if (input.type === 'sync') {
        if (!Array.isArray(input.pendingIds) || input.pendingIds.length > 100 || !input.pendingIds.every(validId)) throw new Error('Invalid sync request.');
        const notApplied = input.pendingIds.filter(id => !this.ctx.storage.sql.exec('SELECT id FROM commands WHERE id = ?', id).toArray().length);
        socket.send(JSON.stringify(this.snapshot(game, { settled: input.pendingIds, notApplied })));
        return;
      }
      if (!validId(input.id)) throw new Error('Invalid command ID.');
      id = input.id;
      const command = parseCommand(input.command);
      const next = this.ctx.storage.transactionSync(() => {
        if (this.ctx.storage.sql.exec('SELECT id FROM commands WHERE id = ?', id!).toArray().length) return game;
        const updated = applyCommand(game, command, Date.now());
        this.write(updated);
        this.ctx.storage.sql.exec('INSERT INTO commands (id) VALUES (?)', id!);
        return updated;
      });
      // Storage input/output gates keep alarms and acknowledgements ordered with the write.
      if (next.expiresAt === null) await this.ctx.storage.deleteAlarm();
      else await this.ctx.storage.setAlarm(next.expiresAt);
      this.broadcast(next, { ackId: id });
    } catch (error) {
      socket.send(JSON.stringify({ type: 'error', id, message: error instanceof Error ? error.message : 'Unable to save this action.' }));
    }
  }
  async webSocketClose(socket: WebSocket) {
    // Browsers may report reserved codes (1005/1006) that cannot be sent back.
    socket.close(1000, 'Connection closed.');
    const game = this.read();
    if (game && !this.expired(game)) this.broadcast(game);
  }
  async webSocketError(socket: WebSocket) { socket.close(1011, 'Reconnect to sync.'); }
  async alarm() {
    const game = this.read();
    if (!game) return;
    if (game.expiresAt === null) return;
    if (!this.expired(game)) { await this.ctx.storage.setAlarm(game.expiresAt); return; }
    for (const socket of this.connections()) {
      socket.send(JSON.stringify({ type: 'expired' }));
      socket.close(4004, 'Game expired.');
    }
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec('DELETE FROM commands');
      this.ctx.storage.sql.exec('DELETE FROM game');
    });
    await this.ctx.storage.deleteAlarm();
  }
}

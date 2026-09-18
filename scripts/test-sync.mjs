import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const mf = new Miniflare(convertV4MiniflareOptions({
  name: 'nextkid', modules: true, scriptPath: '.wrangler/test-dist/index.js',
  compatibilityDate: '2026-09-11',
  durableObjects: { GAMES: { className: 'GameRoom', useSQLite: true } },
  serviceBindings: { ASSETS: () => new Response('static assets') },
  unsafeInspectDurableObjects: true,
}));
const origin = 'https://nextkid.test';
const sockets = [];
async function connect(id) {
  const response = await mf.dispatchFetch(`${origin}/api/games/${id}/socket`, { headers: { Upgrade: 'websocket', Origin: origin } });
  assert.equal(response.status, 101);
  const ws = response.webSocket;
  const messages = [];
  const waiters = new Set();
  ws.addEventListener('message', event => {
    if (event.data === 'pong') return;
    const message = JSON.parse(event.data);
    messages.push(message);
    for (const waiter of waiters) waiter();
  });
  ws.accept(); sockets.push(ws);
  function wait(predicate, after = 0) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { waiters.delete(check); reject(new Error('Timed out waiting for game state')); }, 5000);
      const check = () => {
        const result = messages.slice(after).find(predicate);
        if (result) { clearTimeout(timer); waiters.delete(check); resolve(result); }
      };
      waiters.add(check); check();
    });
  }
  async function send(command, id = crypto.randomUUID()) {
    const after = messages.length;
    ws.send(JSON.stringify({ id, command }));
    return wait(m => m.ackId === id, after);
  }
  return { ws, messages, wait, send };
}
try {
  const created = await mf.dispatchFetch(`${origin}/api/games`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coaches: { alice: 'Alice', bob: 'Bob' }, players: ['Maya', 'Sam', 'Ivy', 'Leo', 'Ava', 'Finn', 'Nora', 'Owen', 'Theo'] }),
  });
  assert.equal(created.status, 201);
  const { id } = await created.json();
  const a = await connect(id);
  const b = await connect(id);
  await a.wait(m => m.connections === 2);
  await b.wait(m => m.connections === 2);
  const arrivals = await Promise.all([
    a.send({ type: 'attendance', playerId: '1', active: true }),
    b.send({ type: 'attendance', playerId: '2', active: true }),
  ]);
  assert.equal(Math.max(...arrivals.map(m => m.game.revision)), 2);
  await a.send({ type: 'begin' });
  const clockId = crypto.randomUUID();
  const started = await a.send({ type: 'clock', running: true }, clockId);
  const repeated = await b.send({ type: 'clock', running: true });
  assert.equal(started.game.clock.startedAt, repeated.game.clock.startedAt);
  const [movedA, movedB] = await Promise.all([
    a.send({ type: 'move', playerId: '1', zone: 'bench' }),
    b.send({ type: 'move', playerId: '2', zone: 'bob' }),
  ]);
  const latest = [movedA, movedB].sort((x, y) => y.game.revision - x.game.revision)[0];
  await a.wait(m => m.game?.revision === latest.game.revision);
  await b.wait(m => m.game?.revision === latest.game.revision);
  assert.equal(latest.game.players[0].zone, 'bench');
  assert.equal(latest.game.players[1].zone, 'bob');
  const conflict = await b.send({ type: 'move', playerId: '1', zone: 'bob' });
  assert.equal(conflict.game.players[0].zone, 'bob');
  await a.send({ type: 'clock', running: false });
  // Retrying an old Start after a newer Stop must not restart the game.
  const retry = await b.send({ type: 'clock', running: true }, clockId);
  assert.equal(retry.game.clock.startedAt, null);
  const unknownId = crypto.randomUUID();
  b.ws.send(JSON.stringify({ type: 'sync', pendingIds: [clockId, unknownId] }));
  const sync = await b.wait(m => m.settled?.includes(unknownId));
  assert.deepEqual(sync.notApplied, [unknownId]);
  assert.deepEqual(sync.game, retry.game);
  console.log('PASS: two clients, concurrent moves, shared clock, command deduplication, reconnect receipts');

  await mf.unsafeEvictDurableObject('nextkid', 'GameRoom', { name: id, webSockets: 'hibernate' });
  const woke = await a.send({ type: 'move', playerId: '1', zone: 'alice' });
  assert.equal(woke.game.players[0].zone, 'alice');
  await b.wait(m => m.game?.revision === woke.game.revision);
  assert.equal(woke.connections, 2);
  console.log('PASS: durable state and connected clients survive hibernation');

  const invalid = crypto.randomUUID();
  a.ws.send(JSON.stringify({ id: invalid, command: { type: 'move', playerId: '1', zone: 'invalid' } }));
  await a.wait(m => m.type === 'error' && m.id === invalid);
  const foreign = await mf.dispatchFetch(`${origin}/api/games/${id}/socket`, { headers: { Upgrade: 'websocket', Origin: 'https://unrelated.test' } });
  assert.equal(foreign.status, 403);
  const missing = await mf.dispatchFetch(`${origin}/api/games/00000000-0000-0000-0000-000000000000`);
  assert.equal(missing.status, 404);
  console.log('PASS: malformed commands, foreign origins and missing games are rejected');

  const beforeClose = a.messages.length;
  b.ws.close();
  await a.wait(m => m.connections === 1, beforeClose);
  console.log('PASS: closing a socket without a status code updates the remaining coach');

  // Test-only storage access makes expiry happen soon without a production test endpoint.
  const storage = await mf.unsafeGetDurableObjectStorage('nextkid', 'GameRoom', { name: id });
  const expiring = { ...woke.game, expiresAt: Date.now() + 300 };
  await storage.exec('UPDATE game SET state = ? WHERE id = 1', JSON.stringify(expiring));
  await a.send({ type: 'clock', running: false }); // schedules the existing deadline
  await a.wait(m => m.type === 'expired');
  const gone = await mf.dispatchFetch(`${origin}/api/games/${id}`);
  assert.equal(gone.status, 404);
  assert.deepEqual(await storage.exec('SELECT * FROM game'), []);
  assert.deepEqual(await storage.exec('SELECT * FROM commands'), []);
  console.log('PASS: alarm expires links, closes clients and deletes game and command data');
} finally {
  for (const socket of sockets) { try { socket.close(); } catch {} }
  await mf.dispose();
}

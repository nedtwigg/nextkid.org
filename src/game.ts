export type Zone = 'alice' | 'bob' | 'bench';
export type Expectation = 'unknown' | 'late' | 'absent';
export type GamePlayer = {
  id: string;
  name: string;
  active: boolean;
  arrivalOrder: number | null;
  arrivedAt: number | null;
  expectation: Expectation;
  note: string;
  zone: Zone;
  fieldMs: number;
  benchMs: number;
  stintStartedAt: number;
};
export type Game = {
  id: string;
  revision: number;
  createdAt: number;
  expiresAt: number | null;
  phase: 'pregame' | 'game';
  coaches: { alice: string; bob: string };
  clock: { elapsedMs: number; startedAt: number | null };
  nextArrival: number;
  players: GamePlayer[];
};
export type NewGame = { coaches: { alice: string; bob: string }; players: string[] };
export type Command =
  | { type: 'clock'; running: boolean }
  | { type: 'begin' }
  | { type: 'move'; playerId: string; zone: Zone }
  | { type: 'attendance'; playerId: string; active: boolean }
  | { type: 'note'; playerId: string; expectation: Expectation; note: string }
  | { type: 'rename'; playerId: string; name: string };
export type Snapshot = {
  type: 'state'; game: Game; serverNow: number; connections: number;
  ackId?: string; settled?: string[]; notApplied?: string[];
};
export const DAY = 24 * 60 * 60 * 1000;

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid request.');
  return value as Record<string, unknown>;
}
function name(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 40) throw new Error('Names must be 1–40 characters.');
  return value.trim();
}
export function parseNewGame(value: unknown): NewGame {
  const input = record(value);
  const coaches = record(input.coaches);
  if (!Array.isArray(input.players) || input.players.length < 1 || input.players.length > 15) throw new Error('Enter between 1 and 15 players.');
  return { coaches: { alice: name(coaches.alice), bob: name(coaches.bob) }, players: input.players.map(name) };
}
export function parseCommand(value: unknown): Command {
  const input = record(value);
  if (input.type === 'begin') return { type: 'begin' };
  if (input.type === 'clock' && typeof input.running === 'boolean') return { type: 'clock', running: input.running };
  if (typeof input.playerId !== 'string' || input.playerId.length > 64) throw new Error('Invalid player.');
  const playerId = input.playerId;
  if (input.type === 'move' && typeof input.zone === 'string' && ['alice', 'bob', 'bench'].includes(input.zone)) return { type: 'move', playerId, zone: input.zone as Zone };
  if (input.type === 'attendance' && typeof input.active === 'boolean') return { type: 'attendance', playerId, active: input.active };
  if (input.type === 'rename') return { type: 'rename', playerId, name: name(input.name) };
  if (input.type === 'note' && typeof input.expectation === 'string' && ['unknown', 'late', 'absent'].includes(input.expectation) && typeof input.note === 'string' && input.note.length <= 120) {
    return { type: 'note', playerId, expectation: input.expectation as Expectation, note: input.note.trim() };
  }
  throw new Error('Invalid action.');
}
export function createGame(id: string, input: NewGame, now: number): Game {
  return {
    id, revision: 0, createdAt: now, expiresAt: now + DAY, phase: 'pregame',
    coaches: input.coaches, clock: { elapsedMs: 0, startedAt: null }, nextArrival: 1,
    players: input.players.map((name, i) => ({ id: String(i + 1), name, active: false, arrivalOrder: null,
      arrivedAt: null, expectation: 'unknown', note: '', zone: 'bench', fieldMs: 0, benchMs: 0, stintStartedAt: 0 })),
  };
}
export function gameTime(game: Game, now: number) {
  return game.clock.elapsedMs + (game.clock.startedAt === null ? 0 : Math.max(0, now - game.clock.startedAt));
}
export function playerTime(player: GamePlayer, elapsed: number) {
  const stint = player.active ? Math.max(0, elapsed - player.stintStartedAt) : 0;
  return { fieldMs: player.fieldMs + (player.zone === 'bench' ? 0 : stint), benchMs: player.benchMs + (player.zone === 'bench' ? stint : 0) };
}
function settle(player: GamePlayer, elapsed: number) {
  Object.assign(player, playerTime(player, elapsed), { stintStartedAt: elapsed });
}
function begin(game: Game) {
  if (game.phase === 'game') return;
  if (!game.players.some(p => p.active)) throw new Error('Check in at least one player first.');
  game.players.filter(p => p.active).sort((a, b) => a.arrivalOrder! - b.arrivalOrder!).forEach((p, i) => {
    p.zone = i < 4 ? 'alice' : i < 8 ? 'bob' : 'bench';
  });
  game.phase = 'game';
}
// Shared deterministic rules. Only the server's result is authoritative.
export function applyCommand(current: Game, command: Command, now: number): Game {
  const game = structuredClone(current);
  const elapsed = gameTime(game, now);
  if (command.type === 'clock') {
    if (command.running === (game.clock.startedAt !== null)) return current;
    if (command.running) {
      begin(game);
      game.clock.startedAt = now;
      game.expiresAt = null;
    } else {
      game.clock = { elapsedMs: elapsed, startedAt: null };
      game.expiresAt = now + DAY;
    }
  } else if (command.type === 'begin') {
    if (game.phase === 'game') return current;
    begin(game);
  } else {
    const player = game.players.find(p => p.id === command.playerId);
    if (!player) throw new Error('Player not found.');
    if (command.type === 'move') {
      if (!player.active || game.phase !== 'game') throw new Error('Check the player in before moving them.');
      if (player.zone === command.zone) return current;
      settle(player, elapsed);
      player.zone = command.zone;
    } else if (command.type === 'attendance') {
      if (player.active === command.active) return current;
      settle(player, elapsed);
      player.active = command.active;
      player.zone = 'bench';
      if (command.active) {
        player.arrivalOrder = game.nextArrival++;
        player.arrivedAt = now;
      } else if (game.phase === 'pregame') {
        player.arrivalOrder = null;
        player.arrivedAt = null;
      }
    } else if (command.type === 'note') {
      player.expectation = command.expectation;
      player.note = command.note;
    } else {
      if (game.clock.startedAt !== null || game.clock.elapsedMs > 0) throw new Error('Names are locked once the clock starts.');
      player.name = command.name;
    }
  }
  game.revision++;
  return game;
}
export function balances(game: Game, now: number) {
  const elapsed = gameTime(game, now);
  const values = game.players.filter(p => p.active).map(p => {
    const totals = playerTime(p, elapsed);
    return [p.id, (totals.fieldMs - totals.benchMs) / 60000] as const;
  });
  const numbers = values.map(([, balance]) => balance);
  const mid = numbers.length ? (Math.min(...numbers) + Math.max(...numbers)) / 2 : 0;
  return new Map(values.map(([id, balance]) => [id, balance - mid]));
}

export function fieldBenchGap(game: Game, zone: Exclude<Zone, 'bench'>, now: number): number | null {
  const values = balances(game, now);
  const field = game.players.filter(p => p.active && p.zone === zone).map(p => values.get(p.id)!);
  const bench = game.players.filter(p => p.active && p.zone === 'bench').map(p => values.get(p.id)!);
  if (!field.length || !bench.length) return null;
  // Use the full balance, not the saturated color. The shared midpoint cancels.
  return (Math.max(...field) - Math.min(...bench)) / 2;
}

import { describe, expect, it } from 'vitest';
import { applyCommand, balances, createGame, DAY, fieldBenchGap, gameTime, parseCommand, parseNewGame, playerTime } from '../src/game';

const setup = () => createGame('test-game', { coaches: { alice: 'Alice', bob: 'Bob' }, players: Array.from({ length: 15 }, (_, i) => `Player ${i + 1}`) }, 1000);
const check = (game = setup(), ids = ['1', '2', '3', '4', '5', '6', '7', '8', '9']) => ids.reduce((g, playerId) => applyCommand(g, { type: 'attendance', playerId, active: true }, 2000), game);

describe('shared game rules', () => {
  it('shows half the largest field-to-bench balance gap, without color clamping', () => {
    let game = applyCommand(check(), { type: 'clock', running: true }, 10000);
    expect(fieldBenchGap(game, 'alice', 1210000)).toBe(20);
    game = applyCommand(game, { type: 'clock', running: false }, 1210000);
    expect(fieldBenchGap(game, 'bob', 9999999)).toBe(20);
    for (const player of game.players.filter(p => p.zone === 'alice')) game = applyCommand(game, { type: 'attendance', playerId: player.id, active: false }, 1210000);
    expect(fieldBenchGap(game, 'alice', 1210000)).toBeNull();
    game = applyCommand(game, { type: 'move', playerId: '9', zone: 'alice' }, 1210000);
    expect(fieldBenchGap(game, 'alice', 1210000)).toBeNull();
    game = applyCommand(game, { type: 'move', playerId: '5', zone: 'bench' }, 1210000);
    expect(fieldBenchGap(game, 'alice', 1210000)).toBe(-20);
  });
  it('uses arrival order for the first eight starters and preserves coach discretion', () => {
    let game = check(setup(), ['9', '8', '7', '6', '5', '4', '3', '2', '1']);
    game = applyCommand(game, { type: 'begin' }, 3000);
    expect(game.players.filter(p => p.zone === 'alice').map(p => p.id)).toEqual(['6', '7', '8', '9']);
    expect(game.players[0].zone).toBe('bench');
    game = applyCommand(game, { type: 'move', playerId: '1', zone: 'alice' }, 3000);
    expect(game.players.filter(p => p.zone === 'alice')).toHaveLength(5);
  });
  it('banks time across starts, stops, moves, late arrivals and departures', () => {
    let game = applyCommand(check(), { type: 'clock', running: true }, 10000);
    game = applyCommand(game, { type: 'move', playerId: '1', zone: 'bench' }, 70000);
    game = applyCommand(game, { type: 'attendance', playerId: '10', active: true }, 70000);
    game = applyCommand(game, { type: 'clock', running: false }, 130000);
    expect(gameTime(game, 500000)).toBe(120000);
    expect(playerTime(game.players[0], gameTime(game, 500000))).toEqual({ fieldMs: 60000, benchMs: 60000 });
    expect(playerTime(game.players[9], gameTime(game, 500000))).toEqual({ fieldMs: 0, benchMs: 60000 });
    game = applyCommand(game, { type: 'clock', running: true }, 500000);
    game = applyCommand(game, { type: 'attendance', playerId: '10', active: false }, 560000);
    expect(playerTime(game.players[9], gameTime(game, 620000))).toEqual({ fieldMs: 0, benchMs: 120000 });
    game = applyCommand(game, { type: 'attendance', playerId: '10', active: true }, 620000);
    expect(playerTime(game.players[9], gameTime(game, 680000))).toEqual({ fieldMs: 0, benchMs: 180000 });
  });
  it('treats repeated start, stop, arrival and begin as no-ops', () => {
    let game = check();
    expect(applyCommand(game, { type: 'attendance', playerId: '1', active: true }, 9000)).toBe(game);
    game = applyCommand(game, { type: 'clock', running: true }, 10000);
    expect(applyCommand(game, { type: 'clock', running: true }, 20000)).toBe(game);
    expect(applyCommand(game, { type: 'begin' }, 20000)).toBe(game);
    game = applyCommand(game, { type: 'clock', running: false }, 30000);
    expect(applyCommand(game, { type: 'clock', running: false }, 40000)).toBe(game);
    expect(game.expiresAt).toBe(30000 + DAY);
    expect(applyCommand(game, { type: 'clock', running: true }, 40000).expiresAt).toBeNull();
  });
  it('merges different-player moves and orders conflicting moves without duplicating players', () => {
    let game = applyCommand(check(), { type: 'clock', running: true }, 10000);
    game = applyCommand(game, { type: 'move', playerId: '1', zone: 'bench' }, 20000);
    game = applyCommand(game, { type: 'move', playerId: '2', zone: 'bob' }, 20001);
    game = applyCommand(game, { type: 'move', playerId: '1', zone: 'bob' }, 20002);
    expect(game.players[0].zone).toBe('bob');
    expect(game.players[1].zone).toBe('bob');
    expect(new Set(game.players.map(p => p.id)).size).toBe(15);
    expect(playerTime(game.players[0], gameTime(game, 30000))).toEqual({ fieldMs: 19998, benchMs: 2 });
  });
  it('normalizes only active players around the min/max midpoint', () => {
    const game = applyCommand(check(), { type: 'clock', running: true }, 10000);
    const values = balances(game, 70000);
    expect(values.get('1')).toBe(1);
    expect(values.get('9')).toBe(-1);
    expect(values.has('10')).toBe(false);
  });
  it('validates input and locks names after the clock first starts', () => {
    expect(() => parseNewGame({ coaches: { alice: 'A', bob: 'B' }, players: [] })).toThrow();
    expect(() => parseCommand({ type: 'clock', running: 'false' })).toThrow();
    expect(() => parseCommand({ type: 'move', playerId: '1', zone: 'missing' })).toThrow();
    expect(() => parseCommand({ type: 'move', playerId: '1', zone: ['alice'] })).toThrow();
    expect(() => parseCommand({ type: 'note', playerId: '1', expectation: 'late', note: 'x'.repeat(121) })).toThrow();
    const game = applyCommand(check(), { type: 'clock', running: true }, 10000);
    expect(() => applyCommand(game, { type: 'rename', playerId: '1', name: 'Other' }, 11000)).toThrow();
    expect(() => applyCommand(game, { type: 'move', playerId: '15', zone: 'alice' }, 11000)).toThrow();
  });
});

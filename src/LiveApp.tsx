import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, ChevronRight, Clock3, GripVertical, MoveHorizontal, Pause, Play, Plus, Share2, Users, X } from 'lucide-react';
import { Brand, WelcomeScreen, balanceColor } from './NextKidApp';
import { balances, fieldBenchGap, gameTime, playerTime, type Command, type Expectation, type Game, type GamePlayer, type Zone } from './game';
import { useGame } from './useGame';
import { usePlayerTransitions } from './usePlayerTransitions';

function formatTime(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function FieldGap({ game, zone, now }: { game: Game; zone: 'alice' | 'bob'; now: number }) {
  const gap = fieldBenchGap(game, zone, now);
  const value = gap === null ? '—' : `${gap >= 0.05 ? '+' : gap <= -0.05 ? '−' : ''}${Math.abs(gap).toFixed(1)} min`;
  return <div className="field-gap" aria-label={`${game.coaches[zone]} gap versus bench: ${value}`}
    title="Half the difference between this field’s highest field-minus-bench time and the bench’s lowest. An approximate playing-time gap.">
    <strong>{value}</strong><span>vs bench</span>
  </div>;
}

function Setup({ onCreated }: { onCreated: (id: string) => void }) {
  const [coaches, setCoaches] = useState({ alice: 'Ned', bob: 'Brian' });
  const [players, setPlayers] = useState([
    'Griffin', 'Patrick', 'Brodie', 'Beryl', 'JR',
    'Zander', 'Mac', 'Zachary', 'Kian', 'Rían',
    'Sammy', 'Remy', 'Nora', 'ZZ', 'Layla',
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function create() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/games', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coaches, players: players.map(p => p.trim()).filter(Boolean) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create the game.');
      onCreated(result.id);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not create the game. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form className="phone-sheet setup-screen live-setup" onSubmit={event => { event.preventDefault(); void create(); }}>
    <header className="app-header"><div><Brand /><span className="screen-label">NEW GAME</span></div></header>
    <section className="setup-intro"><h1>Write the match card</h1><p>Enter your coaches and players. Share the game link with your other coach.</p></section>
    <section className="coach-row" aria-label="Coaches">
      {(['alice', 'bob'] as const).map((side, i) => <label key={side}>{i === 0 ? 'Left coach' : 'Right coach'}<input required maxLength={40} value={coaches[side]} placeholder={i === 0 ? 'Alice' : 'Bob'} onChange={e => setCoaches({ ...coaches, [side]: e.target.value })} /></label>)}
    </section>
    <section className="roster-editor"><div className="section-heading"><h2>Players</h2><span>15 MAX</span></div>
      <div className="live-name-grid">{players.map((player, i) => <label className="name-line" key={i}><span>{i + 1}</span><input aria-label={`Player ${i + 1}`} maxLength={40} value={player} placeholder="Name" onChange={e => setPlayers(players.map((p, n) => n === i ? e.target.value : p))} /></label>)}</div>
      {players.length < 15 && <button className="add-players" type="button" onClick={() => setPlayers([...players, ''])}><Plus size={17} /> Add player</button>}
    </section>
    <div className="setup-submit"><p role={error ? 'alert' : undefined}>{error || 'Names are visible to anyone with the link.'}</p><button className="primary-action" disabled={busy} type="submit">{busy ? 'Creating…' : 'Begin pregame'}<ChevronRight size={21} /></button></div>
  </form>;
}

type Send = (command: Command) => void;
function Attendance({ game, send, disabled, onDone }: { game: Game; send: Send; disabled: boolean; onDone: () => void }) {
  const [unmark, setUnmark] = useState<string | null>(null);
  const [editing, setEditing] = useState<GamePlayer | null>(null);
  const [note, setNote] = useState('');
  const [expectation, setExpectation] = useState<Expectation>('unknown');
  const [name, setName] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const checked = game.players.filter(p => p.active).length;
  const canRename = game.clock.startedAt === null && game.clock.elapsedMs === 0;
  const stopHold = () => { if (timer.current) clearTimeout(timer.current); };
  useEffect(() => stopHold, []);
  function edit(player: GamePlayer) { setEditing(player); setNote(player.note); setExpectation(player.expectation); setName(player.name); setUnmark(null); }
  function check(player: GamePlayer) {
    if (held.current) { held.current = false; return; }
    if (player.active && unmark !== player.id) { setUnmark(player.id); return; }
    send({ type: 'attendance', playerId: player.id, active: !player.active }); setUnmark(null);
  }
  return <>
    <section className="arrival-summary"><div><strong>{checked}</strong><span>HERE</span></div><div><strong>{Math.max(8 - checked, 0)}</strong><span>STARTER SPOTS</span></div><button type="button" onClick={onDone} disabled={game.phase === 'pregame' && (disabled || checked === 0)}>{game.phase === 'pregame' ? 'To game' : 'Done'}<ChevronRight size={18} /></button></section>
    <section className="checkin-ledger live-attendance"><div className="section-heading"><h1>Tap players as they arrive</h1><span>HOLD TO EDIT</span></div><div className="checkin-grid">
      {game.players.map(player => <button key={player.id} type="button" disabled={disabled}
        className={`checkin-row ${player.active ? 'is-checked' : ''} ${unmark === player.id ? 'confirm-unmark' : ''} ${!player.active && (player.note || player.expectation !== 'unknown') ? 'is-expected' : ''}`}
        onPointerDown={() => { held.current = false; stopHold(); timer.current = setTimeout(() => { held.current = true; edit(player); }, 550); }}
        onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
        onContextMenu={event => event.preventDefault()} onClick={() => check(player)}
        onKeyDown={event => { if (event.key === 'F2') { event.preventDefault(); edit(player); } }}
        aria-pressed={player.active} aria-label={`${player.name}, ${player.active ? 'here' : 'not here'}. ${unmark === player.id ? 'Press again to confirm leaving.' : 'Tap to change attendance. Hold or press F2 to edit.'}`}>
        <span className="arrival-number">{player.arrivalOrder ?? '—'}</span><span className="player-name">{player.name}</span>
        <span className="arrival-state">{unmark === player.id ? <strong>LEAVING?</strong> : player.active ? <><Check size={15} />HERE</> : <strong>{player.expectation !== 'unknown' ? player.expectation : player.note || (player.arrivedAt ? 'LEFT' : 'WAITING')}</strong>}</span>
      </button>)}
    </div></section>
    <footer className="pregame-footer"><span>{game.phase === 'pregame' ? 'First arrivals start. Late arrivals join the bench.' : 'Mark players out when they leave; their time will stop.'}</span><button type="button" onClick={onDone} disabled={game.phase === 'pregame' && (disabled || checked === 0)}>Go to game<ChevronRight size={18} /></button></footer>
    {editing && <div className="live-dialog-backdrop"><form className="live-dialog" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`} onSubmit={event => {
      event.preventDefault(); send({ type: 'note', playerId: editing.id, note, expectation });
      if (canRename && name.trim() !== editing.name) send({ type: 'rename', playerId: editing.id, name });
      setEditing(null);
    }}><h2>{editing.name}</h2>
      {canRename && <label>Player name<input required maxLength={40} value={name} onChange={e => setName(e.target.value)} /></label>}
      <label>Expected<select value={expectation} onChange={e => setExpectation(e.target.value as Expectation)}><option value="unknown">Not specified</option><option value="late">Late</option><option value="absent">Absent</option></select></label>
      <label>Note<input autoFocus maxLength={120} value={note} placeholder="Arriving at halftime" onChange={e => setNote(e.target.value)} /></label>
      <div className="dialog-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={disabled}>Save</button></div>
    </form></div>}
  </>;
}

function Placement({ game, now, send, disabled, onAttendance }: { game: Game; now: number; send: Send; disabled: boolean; onAttendance: () => void }) {
  const registerPlayer = usePlayerTransitions();
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState<('alice' | 'bob')[]>(() => {
    try { return localStorage.getItem(`nextkid:sides:${game.id}`) === 'bob' ? ['bob', 'alice'] : ['alice', 'bob']; } catch { return ['alice', 'bob']; }
  });
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const coachDrag = useRef<number | null>(null);
  const currentBalances = balances(game, now);
  const elapsed = gameTime(game, now);
  function swap() {
    const next = [...order].reverse() as typeof order; setOrder(next);
    try { localStorage.setItem(`nextkid:sides:${game.id}`, next[0]); } catch { /* Optional device preference. */ }
  }
  function move(playerId: string, zone: Zone) { if (!disabled) send({ type: 'move', playerId, zone }); setSelected(null); }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.moved) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-zone]');
      if (target) move(drag.current.id, target.dataset.zone as Zone);
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
    }
    drag.current = null;
  }
  function strip(player: GamePlayer) {
    const balance = currentBalances.get(player.id) ?? 0;
    const totals = playerTime(player, elapsed);
    const description = balance >= .5 ? 'more field time' : balance <= -.5 ? 'more bench time' : 'playing time near even';
    return <button key={player.id} ref={element => registerPlayer(player.id, element)} data-player-id={player.id} className={`player-strip ${selected === player.id ? 'is-selected' : ''}`} type="button" disabled={disabled}
      style={{ borderColor: balanceColor(balance), touchAction: 'none' }} aria-pressed={selected === player.id}
      aria-label={`${player.name}, ${description}, field ${formatTime(totals.fieldMs)}, bench ${formatTime(totals.benchMs)}`}
      onPointerDown={event => { drag.current = { id: player.id, x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (drag.current && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 8) { drag.current.moved = true; setSelected(player.id); } }}
      onPointerUp={pointerUp} onPointerCancel={() => { drag.current = null; }}
      onClick={() => { if (!suppressClick.current) setSelected(selected === player.id ? null : player.id); }}>
      <span className="strip-name">{player.name}</span><GripVertical size={15} aria-hidden="true" />
    </button>;
  }
  const active = game.players.filter(p => p.active);
  const bench = active.filter(p => p.zone === 'bench');
  const selectedPlayer = active.find(p => p.id === selected);
  return <>
    <section className="clock-bar" aria-label="Game clock"><button className="stop-clock" type="button" disabled={disabled} onClick={() => send({ type: 'clock', running: false })} aria-pressed={game.clock.startedAt === null}><Pause size={19} fill="currentColor" />STOP</button><div><Clock3 size={17} /><strong>{formatTime(elapsed)}</strong><span>{disabled ? 'ESTIMATED · OFFLINE' : game.clock.startedAt === null ? 'PAUSED' : 'RUNNING'}</span></div><button className="start-clock" type="button" disabled={disabled} onClick={() => send({ type: 'clock', running: true })} aria-pressed={game.clock.startedAt !== null}>START<Play size={19} fill="currentColor" /></button></section>
    <section className="field-grid" aria-label="Player placement fields">{order.map((zone, i) => <section className={`field-ledger ${selectedPlayer ? 'is-target' : ''}`} data-zone={zone} key={zone} data-testid={i ? 'right-field' : 'left-field'}>
      <div className="field-heading"><h2 title={game.coaches[zone]}>{game.coaches[zone]}</h2><button className="coach-drag-handle" type="button" aria-label={`${game.coaches[zone]}, ${i ? 'right' : 'left'} coach. Swap sides on this phone`}
        onPointerDown={e => { coachDrag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={e => { if (coachDrag.current !== null && Math.abs(e.clientX - coachDrag.current) > 36) { swap(); suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0); } coachDrag.current = null; }}
        onClick={() => { if (!suppressClick.current) swap(); }}><MoveHorizontal size={16} /><span>{i ? 'RIGHT' : 'LEFT'}</span></button></div>
      <FieldGap game={game} zone={zone} now={now} />
      {active.filter(p => p.zone === zone).map(strip)}
      {selectedPlayer && selectedPlayer.zone !== zone && <button className="tap-target" type="button" disabled={disabled} onClick={() => move(selectedPlayer.id, zone)}>Move {selectedPlayer.name} here</button>}
    </section>)}</section>
    <section className={`bench-ledger ${selectedPlayer ? 'is-target' : ''}`} data-zone="bench" aria-label="Bench"><div className="field-heading"><h2>Bench</h2><button className="attendance-link" type="button" onClick={onAttendance}><Users size={15} />{active.length} here · Attendance</button></div><div className="bench-row">{bench.map(strip)}{bench.length === 0 && <span className="empty-bench">No players on the bench</span>}{selectedPlayer && selectedPlayer.zone !== 'bench' && <button className="tap-target" type="button" disabled={disabled} onClick={() => move(selectedPlayer.id, 'bench')}>Move {selectedPlayer.name} to bench</button>}</div></section>
  </>;
}

function SharedGame({ id }: { id: string }) {
  const { game, status, connections, error, clearError, send, now, pending } = useGame(id);
  const [attendance, setAttendance] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [showLink, setShowLink] = useState(false);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'NextKid game', url: location.href });
      else { await navigator.clipboard.writeText(location.href); setShareMessage('Link copied'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setShowLink(true); }
  }
  if (status === 'expired') return <main className="phone-sheet welcome-screen"><Brand /><h1>Game unavailable</h1><p>This link has expired or does not exist. Games are deleted 24 hours after the clock stops.</p><a href="/">Start a new game</a></main>;
  if (!game) return <main className="phone-sheet welcome-screen"><Brand /><p role="status">{status === 'reconnecting' ? 'Waiting for a connection…' : 'Opening the match card…'}</p></main>;
  const rosterView = game.phase === 'pregame' || attendance;
  const disabled = status !== 'live';
  return <main className={`phone-sheet live-screen ${rosterView ? 'pregame-screen' : `game-screen ${game.clock.startedAt === null ? 'clock-paused' : 'clock-running'}`}`}>
    <header className="app-header"><div><Brand /><span className="screen-label" role="status">{disabled ? 'RECONNECTING · EDITS PAUSED' : pending ? 'SAVING…' : rosterView ? 'ATTENDANCE · SHARED LIVE' : 'ONE CLOCK · TWO FIELDS'}</span></div><button className="shared-pill" type="button" aria-label="Share game link" onClick={() => void share()}><Users size={16} />{disabled ? 'Offline' : `${connections} live`}<Share2 size={15} /></button></header>
    {rosterView ? <Attendance game={game} send={send} disabled={disabled} onDone={() => { if (game.phase === 'pregame') send({ type: 'begin' }); setAttendance(false); }} /> : <Placement game={game} now={now} send={send} disabled={disabled} onAttendance={() => setAttendance(true)} />}
    {(error || shareMessage) && <div className="live-toast" role={error ? 'alert' : 'status'}>{error || shareMessage}<button type="button" aria-label="Dismiss message" onClick={() => { clearError(); setShareMessage(''); }}><X size={18} /></button></div>}
    {showLink && <div className="live-dialog-backdrop"><div className="live-dialog" role="dialog" aria-modal="true" aria-label="Share game"><h2>Share this game link</h2><input aria-label="Game link" readOnly value={location.href} onFocus={event => event.target.select()} autoFocus /><button type="button" onClick={() => setShowLink(false)}>Done</button></div></div>}
  </main>;
}

export function LiveApp() {
  const [path, setPath] = useState(location.pathname);
  const [creating, setCreating] = useState(false);
  useEffect(() => { const change = () => { setPath(location.pathname); setCreating(false); }; window.addEventListener('popstate', change); return () => window.removeEventListener('popstate', change); }, []);
  const match = /^\/g\/([a-zA-Z0-9_-]{16,80})\/?$/.exec(path);
  if (match) return <SharedGame key={match[1]} id={match[1]} />;
  if (creating) return <Setup onCreated={id => { history.pushState(null, '', `/g/${id}`); setPath(location.pathname); }} />;
  return <WelcomeScreen onNewGame={() => setCreating(true)} />;
}

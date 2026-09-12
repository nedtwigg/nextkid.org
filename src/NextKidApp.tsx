import { useMemo, useRef, useState, type DragEvent, type PointerEvent } from 'react';
import {
  Check,
  ChevronRight,
  Clock3,
  GripVertical,
  Link2,
  MoveHorizontal,
  Pause,
  Play,
  Plus,
  Share2,
  Users,
  X,
} from 'lucide-react';

export type Scenario =
  | 'welcome'
  | 'new-game'
  | 'pregame-empty'
  | 'pregame-ready'
  | 'game-running'
  | 'game-paused'
  | 'game-balanced';

type Player = {
  name: string;
  number: number;
  balance: number;
  state?: 'checked' | 'late' | 'absent' | 'waiting';
  note?: string;
};

const roster: Player[] = [
  { name: 'Maya', number: 8, balance: 1.8, state: 'checked' },
  { name: 'Sam', number: 1, balance: 0.7, state: 'checked' },
  { name: 'Ivy', number: 4, balance: 0.4, state: 'checked' },
  { name: 'Leo', number: 2, balance: 0.2, state: 'checked' },
  { name: 'Ava', number: 3, balance: 0.1, state: 'checked' },
  { name: 'Finn', number: 11, balance: -0.1, state: 'checked' },
  { name: 'Nora', number: 7, balance: -0.4, state: 'checked' },
  { name: 'Owen', number: 12, balance: -0.6, state: 'checked' },
  { name: 'Theo', number: 6, balance: -2.1, state: 'checked' },
  { name: 'Eli', number: 5, balance: -1.1, state: 'checked' },
  { name: 'Kai', number: 9, balance: -0.8, state: 'checked' },
  { name: 'Lily', number: 13, balance: -0.3, state: 'late', note: 'After music lesson · ~10:15' },
  { name: 'Ezra', number: 14, balance: 0, state: 'waiting' },
  { name: 'Mila', number: 15, balance: 0, state: 'absent', note: 'Family trip' },
  { name: 'Jude', number: 16, balance: 0, state: 'waiting' },
];

const initialZones = {
  alice: ['Maya', 'Sam', 'Ivy', 'Leo'],
  bob: ['Ava', 'Finn', 'Nora', 'Owen'],
  bench: ['Theo', 'Eli', 'Kai', 'Lily', 'Ezra', 'Mila', 'Jude'],
};

const playerByName = new Map(roster.map((player) => [player.name, player]));

function Brand() {
  return (
    <div className="brand" aria-label="NextKid">
      NextKid<span aria-hidden="true">•</span>
    </div>
  );
}

function Header({ label, shared = false }: { label: string; shared?: boolean }) {
  return (
    <header className="app-header">
      <div>
        <Brand />
        <span className="screen-label">{label}</span>
      </div>
      {shared ? (
        <button className="shared-pill" type="button" aria-label="Share game link">
          <Users size={16} strokeWidth={2.5} /> 2 live <Share2 size={15} strokeWidth={2.5} />
        </button>
      ) : (
        <span className="demo-mark">DEMO</span>
      )}
    </header>
  );
}

function WelcomeScreen({ onNewGame }: { onNewGame: () => void }) {
  return (
    <main className="phone-sheet welcome-screen">
      <div className="welcome-rule"><span>TOUCHLINE TIMEKEEPER</span><span>01</span></div>
      <Brand />
      <section className="welcome-copy">
        <h1>Coach the game.<br />We’ll watch the minutes.</h1>
        <p>Fair, arrival-aware playing time for two fields—without a rotation spreadsheet.</p>
      </section>
      <div className="placement-demo" aria-label="Example player placement">
        <div><small>ALICE</small><span style={{ borderColor: balanceColor(1.4) }}>Maya</span><span style={{ borderColor: balanceColor(0.1) }}>Sam</span></div>
        <div><small>BOB</small><span style={{ borderColor: balanceColor(-0.2) }}>Ava</span><span style={{ borderColor: balanceColor(0.6) }}>Finn</span></div>
        <div><small>BENCH</small><span style={{ borderColor: balanceColor(-1.7) }}>Theo</span><span style={{ borderColor: balanceColor(-0.5) }}>Eli</span></div>
      </div>
      <section className="welcome-actions">
        <button className="primary-action" type="button" onClick={onNewGame}>
          <Plus size={23} /> New game
        </button>
        <p><Link2 size={16} /> Already have a game link? Open it to join.</p>
      </section>
      <footer className="paper-footer">No account · shared live · deleted 24 hours after the game</footer>
    </main>
  );
}

function NewGameScreen() {
  const [created, setCreated] = useState(false);
  return (
    <main className="phone-sheet setup-screen">
      <Header label="NEW GAME" />
      <section className="setup-intro">
        <h1>Write the match card</h1>
        <p>Coach names label the two fields. Player names can be changed until the clock starts.</p>
      </section>
      <section className="coach-row" aria-label="Coaches">
        <label>Left coach<input defaultValue="Alice" /></label>
        <label>Right coach<input defaultValue="Bob" /></label>
      </section>
      <section className="roster-editor">
        <div className="section-heading"><h2>Players</h2><span>15 MAX</span></div>
        {['Maya', 'Sam', 'Ivy', 'Leo', 'Ava', 'Finn'].map((name, index) => (
          <label className="name-line" key={name}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <input defaultValue={name} aria-label={`Player ${index + 1}`} />
            {index === 5 && <button type="button" aria-label="Clear player"><X size={17} /></button>}
          </label>
        ))}
        <button className="add-players" type="button"><Plus size={17} /> Add the other 9 players</button>
      </section>
      <div className="setup-submit">
        {created ? <p role="status"><Check size={18} /> Game link ready</p> : <p>Names are visible to anyone with the link.</p>}
        <button className="primary-action" type="button" onClick={() => setCreated(true)}>
          Begin pregame <ChevronRight size={21} />
        </button>
      </div>
    </main>
  );
}

function PregameScreen({ ready }: { ready: boolean }) {
  const initial = ready ? new Set(roster.filter((p) => p.state === 'checked').slice(0, 8).map((p) => p.name)) : new Set<string>();
  const [checked, setChecked] = useState(initial);
  const toggle = (name: string) => {
    setChecked((current) => {
      const next = new Set(current);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };
  return (
    <main className="phone-sheet pregame-screen">
      <Header label="PREGAME · 9:42 AM" shared />
      <section className="arrival-summary">
        <div><strong>{checked.size}</strong><span>HERE</span></div>
        <div><strong>{Math.max(8 - checked.size, 0)}</strong><span>STARTER SPOTS</span></div>
        <button type="button"><Share2 size={18} /> Share</button>
      </section>
      <section className="checkin-ledger">
        <div className="section-heading"><h1>Tap players as they arrive</h1><span>ORDER SETS STARTERS</span></div>
        <div className="checkin-grid">
          {roster.map((player) => {
            const isChecked = checked.has(player.name);
            const special = ready && !isChecked ? player.state : undefined;
            return (
              <button
                className={`checkin-row ${isChecked ? 'is-checked' : ''} ${special ? `is-${special}` : ''}`}
                key={player.name}
                type="button"
                onClick={() => toggle(player.name)}
                aria-pressed={isChecked}
              >
                <span className="arrival-number">{isChecked ? [...checked].indexOf(player.name) + 1 : '—'}</span>
                <span className="player-name">{player.name}</span>
                <span className="arrival-state">
                  {isChecked ? <><Check size={15} /> HERE</> : special === 'late' ? 'LATE' : special === 'absent' ? 'OUT' : 'WAITING'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="pregame-footer">
        <span>{checked.size >= 8 ? 'First 8 are marked to start' : `${8 - checked.size} more for two full fields`}</span>
        <button type="button" disabled={checked.size === 0}>Go to game <ChevronRight size={18} /></button>
      </footer>
    </main>
  );
}

function balanceColor(balance: number) {
  const midpoint = [70, 85, 76];
  const endpoint = balance < 0 ? [10, 157, 97] : [216, 61, 61];
  const amount = Math.min(Math.abs(balance) / 2.5, 1);
  const channel = (index: number) => Math.round(midpoint[index] + (endpoint[index] - midpoint[index]) * amount);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

function PlayerStrip({ player, onDragStart, onClick }: {
  player: Player;
  onDragStart: (event: DragEvent<HTMLButtonElement>, name: string) => void;
  onClick: () => void;
}) {
  const balanceDescription = player.balance >= 0.5
    ? 'more field time'
    : player.balance <= -0.5
      ? 'more bench time'
      : 'playing time near even';
  return (
    <button
      className="player-strip"
      style={{ borderColor: balanceColor(player.balance) }}
      draggable
      type="button"
      onDragStart={(event) => onDragStart(event, player.name)}
      onClick={onClick}
      aria-label={`${player.name}, ${balanceDescription}`}
    >
      <span className="strip-name">{player.name}</span>
      <GripVertical size={15} aria-hidden="true" />
    </button>
  );
}

function GameScreen({ paused = false, balanced = false }: { paused?: boolean; balanced?: boolean }) {
  const balancedPlayers = useMemo(() => {
    if (!balanced) return playerByName;
    return new Map(roster.map((player, index) => [player.name, { ...player, balance: ((index % 5) - 2) * 0.15 }]));
  }, [balanced]);
  const [running, setRunning] = useState(!paused);
  const [zones, setZones] = useState(initialZones);
  const [coachOrder, setCoachOrder] = useState<('alice' | 'bob')[]>(['alice', 'bob']);
  const [selected, setSelected] = useState<string | null>(null);
  const coachPointer = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressCoachClick = useRef(false);

  const swapCoaches = () => setCoachOrder(([left, right]) => [right, left]);

  const coachPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    coachPointer.current = { x: event.clientX, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const coachPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (coachPointer.current && Math.abs(event.clientX - coachPointer.current.x) > 36) {
      coachPointer.current.moved = true;
    }
  };

  const coachPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (coachPointer.current?.moved) {
      suppressCoachClick.current = true;
      swapCoaches();
      window.setTimeout(() => { suppressCoachClick.current = false; }, 0);
    }
    coachPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const coachClick = () => {
    if (suppressCoachClick.current) {
      suppressCoachClick.current = false;
      return;
    }
    swapCoaches();
  };

  const movePlayer = (name: string, destination: keyof typeof zones) => {
    setZones((current) => {
      const next = {
        alice: current.alice.filter((value) => value !== name),
        bob: current.bob.filter((value) => value !== name),
        bench: current.bench.filter((value) => value !== name),
      };
      next[destination] = [...next[destination], name];
      return next;
    });
    setSelected(null);
  };

  const dragStart = (event: DragEvent<HTMLButtonElement>, name: string) => {
    event.dataTransfer.setData('text/player', name);
    event.dataTransfer.effectAllowed = 'move';
  };

  const drop = (event: DragEvent<HTMLElement>, destination: keyof typeof zones) => {
    event.preventDefault();
    const name = event.dataTransfer.getData('text/player');
    if (name) movePlayer(name, destination);
  };

  return (
    <main className={`phone-sheet game-screen ${running ? 'clock-running' : 'clock-paused'}`}>
      <Header label="U10 KNIGHTS · 1ST HALF" shared />
      <section className="clock-bar" aria-label="Game clock">
        <button className="stop-clock" type="button" onClick={() => setRunning(false)} aria-pressed={!running}>
          <Pause size={19} fill="currentColor" /> STOP
        </button>
        <div><Clock3 size={17} /><strong>{running ? '18:42' : '18:42'}</strong><span>{running ? 'RUNNING' : 'PAUSED'}</span></div>
        <button className="start-clock" type="button" onClick={() => setRunning(true)} aria-pressed={running}>
          START <Play size={19} fill="currentColor" />
        </button>
      </section>
      <section className="field-grid" aria-label="Player placement fields">
        {coachOrder.map((zone, index) => (
          <section
            className={`field-ledger ${selected ? 'is-target' : ''}`}
            key={zone}
            data-testid={index === 0 ? 'left-field' : 'right-field'}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => drop(event, zone)}
          >
            <div className="field-heading">
              <h2>{zone === 'alice' ? 'Alice' : 'Bob'}</h2>
              <button
                className="coach-drag-handle"
                type="button"
                aria-label={`${zone === 'alice' ? 'Alice' : 'Bob'}, ${index === 0 ? 'left' : 'right'} coach. Drag horizontally or press to swap sides`}
                onPointerDown={coachPointerDown}
                onPointerMove={coachPointerMove}
                onPointerUp={coachPointerUp}
                onClick={coachClick}
              >
                <MoveHorizontal size={16} aria-hidden="true" />
                <span>{index === 0 ? 'LEFT' : 'RIGHT'}</span>
              </button>
            </div>
            {zones[zone].map((name) => {
              const player = balancedPlayers.get(name)!;
              return <PlayerStrip key={name} player={player} onDragStart={dragStart} onClick={() => selected === name ? setSelected(null) : setSelected(name)} />;
            })}
            {selected && !zones[zone].includes(selected) && <button className="tap-target" type="button" onClick={() => movePlayer(selected, zone)}>Move here</button>}
          </section>
        ))}
      </section>
      <section
        className={`bench-ledger ${selected ? 'is-target' : ''}`}
        aria-label="Bench"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => drop(event, 'bench')}
      >
        <div className="field-heading"><h2>Bench</h2><span>{zones.bench.length} READY · TAP OR DRAG</span></div>
        <div className="bench-row">
          {zones.bench.map((name) => {
            const player = balancedPlayers.get(name)!;
            return <PlayerStrip key={name} player={player} onDragStart={dragStart} onClick={() => selected === name ? setSelected(null) : setSelected(name)} />;
          })}
          {selected && !zones.bench.includes(selected) && <button className="tap-target" type="button" onClick={() => movePlayer(selected, 'bench')}>Move to bench</button>}
        </div>
      </section>
    </main>
  );
}

export function NextKidApp({ scenario }: { scenario: Scenario }) {
  const [current, setCurrent] = useState(scenario);
  if (current === 'welcome') return <WelcomeScreen onNewGame={() => setCurrent('new-game')} />;
  if (current === 'new-game') return <NewGameScreen />;
  if (current === 'pregame-empty') return <PregameScreen ready={false} />;
  if (current === 'pregame-ready') return <PregameScreen ready />;
  if (current === 'game-paused') return <GameScreen paused />;
  if (current === 'game-balanced') return <GameScreen balanced />;
  return <GameScreen />;
}

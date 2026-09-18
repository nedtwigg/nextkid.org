import { useEffect, useRef, useState } from 'react';
import { applyCommand, type Command, type Game, type Snapshot } from './game';

type Pending = { command: Command; at: number } | null;
export function useGame(id: string) {
  const [confirmed, setConfirmed] = useState<Game | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'expired'>('connecting');
  const [connections, setConnections] = useState(0);
  const [error, setError] = useState('');
  const [, render] = useState(0);
  const socket = useRef<WebSocket | null>(null);
  const anchor = useRef({ server: Date.now(), local: performance.now() });
  const pending = useRef(new Map<string, Pending>());
  const lastMessage = useRef(0);
  const ready = useRef(false);
  const storageKey = `nextkid:pending:${id}`;
  const now = () => anchor.current.server + performance.now() - anchor.current.local;
  const savePending = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify([...pending.current.keys()])); } catch { /* Storage is optional. */ }
  };

  useEffect(() => {
    let disposed = false;
    let terminal = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let connectionTimer: ReturnType<typeof setTimeout>;
    let syncStarted = 0;
    const commandTimers = new Map<string, ReturnType<typeof setTimeout>>();
    try {
      const ids: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(ids)) for (const commandId of ids.slice(0, 100)) if (typeof commandId === 'string') pending.current.set(commandId, null);
    } catch { /* A fresh snapshot still works without browser storage. */ }
    const sync = (ws: WebSocket) => {
      syncStarted = performance.now();
      ws.send(JSON.stringify({ type: 'sync', pendingIds: [...pending.current.keys()] }));
    };
    const connect = () => {
      if (disposed || terminal) return;
      if (!navigator.onLine) { setStatus('reconnecting'); return; }
      clearTimeout(reconnectTimer);
      const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/games/${id}/socket`);
      socket.current = ws;
      clearTimeout(connectionTimer);
      connectionTimer = setTimeout(() => ws.close(), 10000);
      const current = () => !disposed && socket.current === ws;
      ws.onopen = () => { if (current()) { lastMessage.current = performance.now(); sync(ws); } };
      ws.onmessage = event => {
        if (!current()) return;
        lastMessage.current = performance.now();
        if (event.data === 'pong') return;
        const message = JSON.parse(event.data);
        if (message.type === 'expired') {
          terminal = true; ready.current = false; setStatus('expired'); ws.close(); return;
        }
        if (message.type === 'error') {
          pending.current.delete(message.id); savePending();
          setError(message.message); render(n => n + 1); return;
        }
        if (message.type !== 'state') return;
        const state = message as Snapshot;
        if (state.settled) {
          clearTimeout(connectionTimer);
          const rtt = performance.now() - syncStarted;
          anchor.current = { server: state.serverNow + rtt / 2, local: performance.now() };
          for (const commandId of state.settled) pending.current.delete(commandId);
          if (state.notApplied?.length) setError('An action did not reach the game. Please check the current state and try it again.');
          ready.current = true; attempt = 0; setStatus('live');
        }
        if (state.ackId) pending.current.delete(state.ackId);
        savePending();
        setConfirmed(previous => !previous || state.game.revision >= previous.revision ? state.game : previous);
        setConnections(state.connections);
      };
      ws.onclose = async () => {
        if (!current() || terminal) return;
        clearTimeout(connectionTimer);
        ready.current = false; setStatus('reconnecting');
        try {
          const response = await fetch(`/api/games/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
          if (!current()) return;
          if (response.status === 404) { terminal = true; setStatus('expired'); return; }
        } catch { /* Try again when reception returns. */ }
        if (current()) reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 15000));
      };
      ws.onerror = () => ws.close();
    };
    const wake = () => {
      if (document.visibilityState === 'hidden' || terminal) return;
      const ws = socket.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ready.current = false; setStatus('reconnecting'); sync(ws);
      } else if (ws?.readyState !== WebSocket.CONNECTING) connect();
    };
    const offline = () => {
      if (terminal) return;
      ready.current = false; setStatus('reconnecting');
      socket.current?.close();
    };
    connect();
    const tick = setInterval(() => {
      render(n => n + 1);
      const ws = socket.current;
      if (ws?.readyState !== WebSocket.OPEN) return;
      if (performance.now() - lastMessage.current > 45000) { ws.close(); return; }
      // Commands are never replayed after a disconnect. Resolve their receipts instead.
      for (const [commandId, item] of pending.current) {
        if (item && now() - item.at > 8000 && !commandTimers.has(commandId)) {
          commandTimers.set(commandId, setTimeout(() => ws.close(), 0));
        }
      }
    }, 250);
    const heartbeat = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) socket.current.send('ping');
    }, 15000);
    const resync = setInterval(() => {
      if (ready.current && socket.current?.readyState === WebSocket.OPEN) sync(socket.current);
    }, 60000);
    window.addEventListener('online', wake);
    window.addEventListener('offline', offline);
    document.addEventListener('visibilitychange', wake);
    return () => {
      disposed = true; ready.current = false;
      clearTimeout(reconnectTimer); clearTimeout(connectionTimer); clearInterval(tick); clearInterval(heartbeat); clearInterval(resync);
      for (const timer of commandTimers.values()) clearTimeout(timer);
      window.removeEventListener('online', wake);
      window.removeEventListener('offline', offline);
      document.removeEventListener('visibilitychange', wake);
      socket.current?.close();
    };
  }, [id]);

  function send(command: Command) {
    if (!ready.current || socket.current?.readyState !== WebSocket.OPEN) return;
    if (pending.current.size >= 100) { setError('Waiting for your previous actions to save.'); return; }
    const commandId = crypto.randomUUID();
    pending.current.set(commandId, { command, at: now() }); savePending(); setError('');
    try { socket.current.send(JSON.stringify({ id: commandId, command })); }
    catch { socket.current.close(); }
    render(n => n + 1);
  }
  let game = confirmed;
  for (const item of pending.current.values()) {
    if (game && item) {
      try { game = applyCommand(game, item.command, item.at); } catch { /* Server will explain a rejected action. */ }
    }
  }
  return { game, status, connections, error, clearError: () => setError(''), send, now: now(), pending: pending.current.size };
}

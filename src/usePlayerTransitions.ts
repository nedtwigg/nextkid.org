import { useLayoutEffect, useRef } from 'react';

type Position = { rect: DOMRect; zone: string };
type Flight = { ghost: HTMLElement; travel: Animation; reveal: Animation };

// Player buttons move between different parents, so animate a temporary copy
// above the scroll containers while the real, accessible button stays in place.
export function usePlayerTransitions() {
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const previous = useRef(new Map<string, Position>());
  const flights = useRef(new Map<string, Flight>());

  const finish = (id: string) => {
    const flight = flights.current.get(id);
    if (!flight) return;
    flight.travel.cancel();
    flight.reveal.cancel();
    flight.ghost.remove();
    flights.current.delete(id);
  };

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const next = new Map<string, Position>();
    for (const [id, element] of elements.current) {
      const rect = element.getBoundingClientRect();
      const zone = element.closest<HTMLElement>('[data-zone]')!.dataset.zone!;
      next.set(id, { rect, zone });
      const old = previous.current.get(id);
      if (reducedMotion) finish(id);
      if (!old || old.zone === zone || reducedMotion || !rect.width || !rect.height) continue;

      // A second move can start before the first finishes. Continue from the
      // visible card's current position rather than jumping back to its origin.
      const from = flights.current.get(id)?.ghost.getBoundingClientRect() ?? old.rect;
      finish(id);
      const ghost = element.cloneNode(true) as HTMLButtonElement;
      ghost.removeAttribute('id');
      ghost.removeAttribute('data-player-id');
      ghost.classList.remove('is-selected');
      ghost.classList.add('player-in-flight');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      ghost.tabIndex = -1;
      Object.assign(ghost.style, {
        position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, minHeight: '0',
        margin: '0', opacity: '1', pointerEvents: 'none', zIndex: '100',
        transformOrigin: 'top left', transition: 'none',
        padding: getComputedStyle(element).padding,
      });
      const label = ghost.querySelector<HTMLElement>('.strip-name');
      if (label) label.style.fontSize = getComputedStyle(element.querySelector('.strip-name')!).fontSize;
      document.body.append(ghost);
      const duration = 360;
      const travel = ghost.animate([
        { transform: `translate(${from.left - rect.left}px, ${from.top - rect.top}px) scale(${from.width / rect.width}, ${from.height / rect.height})`, boxShadow: '0 4px 12px #14281d33' },
        { transform: 'translate(0, 0) scale(1)', boxShadow: '0 0 0 #14281d00' },
      ], { duration, easing: 'cubic-bezier(.22, .7, .2, 1)' });
      const reveal = element.animate([{ opacity: 0 }, { opacity: 0 }], { duration });
      const flight = { ghost, travel, reveal };
      flights.current.set(id, flight);
      travel.onfinish = () => { if (flights.current.get(id) === flight) finish(id); };
    }
    for (const id of flights.current.keys()) if (!next.has(id)) finish(id);
    previous.current = next;
  });

  useLayoutEffect(() => () => {
    for (const id of flights.current.keys()) finish(id);
    previous.current.clear();
  }, []);

  return (id: string, element: HTMLButtonElement | null) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  };
}

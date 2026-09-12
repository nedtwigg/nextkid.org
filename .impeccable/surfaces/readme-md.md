---
version: 1
slug: "readme-md"
primary_target: "README.md"
related_targets: ["src/NextKidApp.tsx","src/NextKidApp.stories.tsx"]
---

## Scope and mode

Mobile-only Storybook prototype for the complete NextKid coaching workflow. Mode: Operate.

## Audience, job, and constraints

Two microsoccer coaches use a shared phone URL outdoors and need to record attendance and update player placement without losing attention on play. Every story must fit a 390×844 viewport without page scrolling. In the game view, color quietly guides judgment without displaying minutes or prescribing a move; screen-reader labels provide a non-visual equivalent.

## Direction and memorable moment

Match Card: a living referee ledger using weatherproof cream paper, forest ink, graphite rules, and fluorescent red/green roster tape. The memorable moment is the quiet placement board: the left coach field, right coach field, and bench keep all 15 names visible while only their borders carry the fairness signal. Either coach field can be dragged horizontally to swap sides.

Approved composition: `.impeccable/mocks/placement-only.json` (explicit user direction after the visual probes).

## Implementation inventory

| Visible ingredient | Commitment | Medium |
| --- | --- | --- |
| Header | NextKid wordmark, phase title, shared-live state | Semantic HTML/CSS |
| Clock | Explicit STOP and START/KEEP RUNNING destinations with central tabular time | Buttons and CSS |
| Placement | Left and right coach field ledgers plus a full-width seven-player bench; all 15 names coexist in one viewport | CSS grid/list |
| Coach side swap | A 44px horizontal-drag handle in each coach heading; dragging or pressing swaps the complete field columns | Pointer events, button semantics, CSS grid |
| Player marker | Name only, with a continuous red–black–green border and drag affordance; no displayed minutes or recommendation | Button/HTML/CSS |
| Pregame | Arrival-order checklist with late/absent note states | Semantic form controls |
| Setup | Coach names, roster, single primary progression action | Semantic form controls |
| Paused state | Clock state unmistakable; resume is explicit and placement remains editable | HTML/CSS |

## Unresolved decisions

Final production framework and exact smallest supported phone remain assumptions until user review. Backend synchronization and persistence are intentionally out of scope.

---
name: NextKid
description: A living touchline match card for fair, glanceable youth-soccer rotations.
colors:
  touchline-surround: "#19251e"
  weatherproof-cream: "#f3ebdd"
  weatherproof-cream-deep: "#e9dfcd"
  forest-ink: "#14281d"
  graphite-pencil: "#536057"
  graphite-rule: "#a9ad9f"
  fluorescent-red-tape: "#d93c3d"
  fluorescent-green-tape: "#0b7447"
  referee-card-yellow: "#f1be42"
  fresh-card-cream: "#fbf6eb"
  blue-pen-focus: "#2a67d3"
  weathered-tape-midpoint: "rgb(70 85 76)"
  fluorescent-red-tape-end: "rgb(216 61 61)"
  fluorescent-green-tape-end: "rgb(10 157 97)"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(44px, 12vw, 54px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "35px"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.25
  body-strong:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  clock:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
rounded:
  field: "2px"
  tape: "3px"
  pill: "999px"
spacing:
  micro: "4px"
  compact: "6px"
  small: "8px"
  control: "10px"
  gutter: "14px"
  panel: "18px"
  section: "24px"
components:
  app-header:
    backgroundColor: "{colors.weatherproof-cream}"
    textColor: "{colors.forest-ink}"
    padding: "12px 14px 9px"
    height: "66px"
  button-primary:
    backgroundColor: "{colors.forest-ink}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.tape}"
    padding: "0 18px"
    height: "58px"
    width: "100%"
  live-pill:
    backgroundColor: "transparent"
    textColor: "{colors.forest-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "44px"
  input-coach:
    backgroundColor: "rgba(255,255,255,.35)"
    textColor: "{colors.forest-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.field}"
    padding: "0 10px"
    height: "44px"
    width: "100%"
  checkin-row:
    backgroundColor: "rgba(255,255,255,.28)"
    textColor: "{colors.forest-ink}"
    rounded: "0"
    padding: "0 7px"
    height: "48px"
    width: "100%"
  clock-bar:
    backgroundColor: "{colors.weatherproof-cream-deep}"
    textColor: "{colors.forest-ink}"
    rounded: "0"
    height: "70px"
    width: "100%"
  player-strip:
    backgroundColor: "{colors.fresh-card-cream}"
    textColor: "{colors.forest-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.tape}"
    padding: "0 8px 0 10px"
    height: "48px"
    width: "100%"
---

# Design System: NextKid

## Overview

**Creative North Star: "The Touchline Match Card"**

The Touchline Match Card treats the phone as a weatherproof paper ledger held at the edge of a game: compact, tactile, and legible in a distracted outdoor setting. Cream stock, forest ink, graphite rules, condensed headings, and fluorescent roster-tape edges create a specific physical world without turning the interface into a literal soccer pitch.

Its energy comes from compressed information and purposeful marks rather than decoration. Rules divide working areas, tabular numerals steady the shared clock, and colored borders expose fairness while player names remain the dominant content. The system guides judgment but never draws a prescribed move; placement stays fully in the coaches' hands.

**Key Characteristics:**

- Weatherproof cream paper with a faint vertical stock texture
- Forest-ink typography and graphite ledger rules
- Condensed, uppercase operational headings paired with highly legible body text
- Fluorescent roster-tape borders as the quiet fairness signal
- Dense, one-handed controls with explicit states and almost-square corners

## Colors

The palette reads like materials gathered on a touchline: cream card stock, forest ink, pencil graphite, referee-card yellow, and fluorescent roster tape.

### Primary

- **Forest Ink** (`forest-ink`): The principal text, rule, button, and structural color; it gives the paper surface its authority.
- **Weatherproof Cream** (`weatherproof-cream`): The main sheet surface and the visual anchor of the physical match-card metaphor.

### Secondary

- **Fluorescent Green Tape** (`fluorescent-green-tape`): The explicit running/checked state, distinct from the continuous fairness endpoint used on player borders.
- **Fluorescent Red Tape** (`fluorescent-red-tape`): The explicit stopped/absent state, distinct from the continuous fairness endpoint used on player borders.
- **Referee Card Yellow** (`referee-card-yellow`): A rare attention color for share and target affordances, never the general brand fill.
- **Blue Pen Focus** (`blue-pen-focus`): The high-contrast keyboard focus outline across buttons and inputs.

### Neutral

- **Deep Weatherproof Cream** (`weatherproof-cream-deep`): Secondary working surfaces such as the clock bar and fixed action footers.
- **Fresh Card Cream** (`fresh-card-cream`): The cleaner insert stock behind player-name strips and placement examples.
- **Graphite Pencil** (`graphite-pencil`): Secondary copy, metadata, inactive marks, and drag affordances.
- **Graphite Rule** (`graphite-rule`): Quiet dividers, inactive control borders, and ledger row boundaries.
- **Touchline Surround** (`touchline-surround`): The dark environmental frame visible outside the phone-sized sheet.
- **Weathered Tape Midpoint** (`weathered-tape-midpoint`): The neutral center of the continuous fairness border scale.
- **Fluorescent Green Tape End** (`fluorescent-green-tape-end`): The negative-balance endpoint of the player-border interpolation.
- **Fluorescent Red Tape End** (`fluorescent-red-tape-end`): The positive-balance endpoint of the player-border interpolation.

### Named Rules

**The Tape Does the Talking Rule.** Fairness color belongs on the player strip's border; the name remains plain forest ink and the accessible label carries the non-visual meaning.

## Typography

- **Display Font:** Barlow Condensed (with sans-serif fallback)
- **Body Font:** Atkinson Hyperlegible (with sans-serif fallback)
- **Label/Clock Font:** Barlow Condensed (with tabular numerals on the clock)

**Character:** Barlow Condensed brings the clipped authority of a printed match card while Atkinson Hyperlegible keeps names and instructions clear at a hurried glance. Weight and case carry hierarchy; ornament does not.

### Hierarchy

- **Display** (700, fluid 44–54px, 0.9 line-height): The welcome statement only; uppercase, tightly stacked, and deliberately oversized.
- **Headline** (700, 35px, 1 line-height): Major workflow introductions such as setup.
- **Title** (700, 25px, 1 line-height): Field and bench ledger names.
- **Body** (400, 16px, 1.25 line-height): Instructions and explanatory text in Atkinson Hyperlegible.
- **Body Strong** (700, 18px, 1 line-height): Player names and primary actions.
- **Label** (600, 11px, 0.08em tracking): Uppercase metadata, phase labels, counts, and ledger annotations.
- **Clock** (700, 27px, 1 line-height): Shared game time with tabular numerals to prevent width shifts.

### Named Rules

**The Condensed for Command Rule.** Use Barlow Condensed for headings, labels, counts, and clock controls; reserve Atkinson Hyperlegible for names, instructions, and editable content.

## Layout

The core surface is a centered phone sheet capped at 390px wide and 844px high, with overflow intentionally contained. Desktop simply reveals the dark touchline surround; it does not introduce a separate desktop information architecture. The smallest declared width is 320px, while the implemented sheet keeps at least 600px of height.

The layout uses compact 6–10px internal gaps, a 14px working gutter, and 18–24px spacing for major editorial pauses. One-pixel graphite rules separate ordinary ledger information; two-pixel forest rules announce zones; three-pixel tape borders make player strips easy to locate. Dense two-column grids are reserved for parallel or repeatable choices, while primary progression actions span the available width. On the shipped placement surface, the compact header and clock sit above two equal field ledgers and one full-width bench ledger so all 15 player names remain in the first viewport; that is the Match Card's signature composition, not a default grid for unrelated workflows.

At compact heights of 700px or less, the game view shortens its header, clock row, player strips, and gaps as one coordinated density step. Critical placement content remains visible instead of becoming scroll-dependent.

## Elevation & Depth

The system is flat by default. Depth comes from cream-on-cream tonal layering, ruled boundaries, and a faint vertical paper grain rather than floating cards. The only shadow is a restrained hover response on draggable player strips (`0 4px 9px rgba(20,40,29,.12)`), paired with a one-pixel lift.

### Shadow Vocabulary

- **Lifted Roster Tape** (`0 4px 9px rgba(20,40,29,.12)`): Appears only when a pointer hovers a player strip and motion is permitted.

### Named Rules

**The Rule Before Shadow Rule.** Separate content with ink and graphite lines first; reserve shadow for the moment a movable strip lifts from the paper.

## Shapes

The form language is clipped and utilitarian. Inputs use a nearly square 2px corner, solid actions and player strips use a subtle 3px corner, and ledger containers stay square. The live-sharing indicator alone becomes a full pill because it behaves like a compact status capsule rather than a work surface.

Borders communicate material and role: one-pixel rules organize the page, two-pixel zone tops anchor ledgers, three-pixel player borders resemble applied roster tape, and dashed outlines mark optional additions or an active placement target.

## Components

### Buttons

- **Shape:** Primary actions use a subtly softened rectangle (3px); status capsules use a full pill (999px); most ledger actions remain square.
- **Primary:** Forest ink with white text, Atkinson Hyperlegible at 700 weight, a 58px minimum height, and full available width.
- **Hover / Focus:** Primary actions deepen toward green on hover. Every interactive element receives a 3px blue-pen focus outline with a 2px offset.
- **Secondary / Ghost:** Add and share-adjacent controls keep transparent paper backgrounds and use solid or dashed graphite/ink borders; a disabled progression action reduces opacity.

### Cards / Containers

- **Corner Style:** Ledger containers are square; player inserts use the 3px tape radius.
- **Background:** Main surfaces use weatherproof cream, secondary bars use deep cream, and player strips use fresh card cream.
- **Shadow Strategy:** Flat at rest; only draggable player strips lift on hover.
- **Border:** Graphite hairlines organize rows, forest rules organize zones, and fluorescent tape borders encode player fairness.
- **Internal Padding:** Usually 6–10px within compact controls and 14px at the sheet gutter.

### Inputs / Fields

- **Style:** A one-pixel forest-ink stroke, translucent white wash, 2px corners, 44px minimum height, and bold Atkinson Hyperlegible text.
- **Focus:** A 3px blue-pen outline with a 2px offset, shared with buttons.
- **Inline Editor:** Roster-name rows remove the field box and let graphite ledger rules carry the structure.

### Navigation

The 66px app header pairs the condensed NextKid wordmark and an uppercase phase label with either an outlined demo stamp or a 44px live-sharing pill. A one-pixel forest rule fixes the header to the match-card grammar; navigation never becomes a detached floating bar.

### Arrival Check-In Row

Two-column check-in rows combine an arrival number, player name, and text state in a 48px ruled cell. Checked rows add a thicker green border and pale green paper wash; late and absent rows retain explicit text so color never carries status alone.

### Shared Clock

The clock is a three-part ruled bar with separate STOP and START destinations around a central tabular time. Only the action that matches the current state receives a solid fluorescent fill, so the clock's state and available direction remain explicit.

### Player Placement Strip

The strip contains the player's name and a grip mark—no displayed minutes and no recommended move. Its 3px border is interpolated continuously from weathered graphite through fluorescent green or red endpoints according to the normalized balance, while the accessible name describes the same condition in words. Pointer hover adds a restrained lift; tap selection exposes destination zones without constraining the coach's choice.

## Do's and Don'ts

### Do:

- **Do** keep player names, attendance states, and clock direction readable without relying on color alone.
- **Do** use condensed uppercase type for operational hierarchy and Atkinson Hyperlegible for human names and instructions.
- **Do** preserve the cream-paper, forest-ink, graphite-rule material stack across new surfaces.
- **Do** let rules, dense grids, and explicit labels carry structure before adding depth or decoration.
- **Do** keep critical touch targets at least 44px high in ordinary phone layouts.

### Don't:

- **Don't** turn the interface into a literal soccer pitch or use field markings as decorative chrome.
- **Don't** convert the fairness signal into a prescribed substitution, ranked recommendation, or displayed minute calculation on the placement strip.
- **Don't** fill player cards with red or green; fairness stays on the fluorescent roster-tape border.
- **Don't** introduce rounded dashboard cards, soft floating panels, or broad shadow stacks into the paper-ledger world.
- **Don't** collapse explicit STOP and START destinations into an ambiguous clock toggle.

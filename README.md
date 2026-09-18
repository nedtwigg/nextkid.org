# NextKid.org

NextKid.org is an app for keeping track of how much time each player has played during a microsoccer game. The goal is to let the coaches focus on how the players are playing instead of on how much time each player has played.

### Background

A microsoccer team has two coaches, we will name ours Alice and Bob. There are at most 15 players, we will name ours 1 through 15. Each coach has their own field with up to 4 players, but there may be as few as 3 depending on circumstance.

During a typical situation, there will be 4 players on Alice's field, 4 players on Bob's field, and 7 players on the bench.

Starters are determined based on who shows up to the game first. As players show up, they are checked-in. The first 8 players to show up get to start. We keep track of who shows up 9 through 15 in case one of those players doesn't want to start, needs to use the restroom, etc. so that player 9 can start, etc.

Some players will show up late - the goal is to let them play at the same "gametime per minute while they are there" as the other players. The goal is not to help them catch up - if you show up for the last half of the game, you will not get to play the entire second half, but you aren't penalized for showing up late either. You just play at the same rate.

## How it works

This is a mobile website that runs only on a phone. On a desktop it's just a stretched out version of the phone interface.

### Pre-game

During pre-game, the goal is to check-in players, and share information about who is likely to be out or late. It's just a list of the 5 players. As the coaches check them in, the time is recorded, and they are numbered from 1 to 15. If a player is expected to be absent or later, a coach can tap and mark that in a note ("expected late", "expected absent", each with an optional note)

### Game

During the game, the coach can see which players are on the bench, and which players are on each field. The coach can drag players from the bench to the field, from one field to another, and vice-versa. It is okay for a field to have more than 4 players, less than 2 players, etc. The goal isn't to be exactly correct at all times, it's just to eventually represent which players are in play on which field.

Each player has a "bench time" and a "field time". While they are on the bench, their bench time is going up. While they are on the field, their field time is going up. If a player shows up late, they are accumulating neither bench time nor field time until they show up.

The key decision a coach has to make is "which player comes off the field, and which player goes on the field".

Which player comes off: field-bench, who is highest
Which player goes on: field-bench, who is lowest

Coaches always have discretion to make any move they want. The point of the interface is decision support - to show "of the players on the fields and the bench, what are biggest field-bench discrepancies"

### Normalized time, red/yellow/green

Each second:

- the field-bench for all active players is calculated
  - players who have not yet arrived, or players who had to leave early, are not considered - only active players count
- amongst the active players, we calclaute the (F-B)_min and the (F-B)_max, which allows us to define the midpoint (F-B)_mid
- every active player is assigned a normalized time, equal to "(F-B) - (F-B)_mid"
  - half of the players will have positive values, and have will have negative values
- there is a color scale: red fades to black fades to green
  - +10 = red (coach should consider taking them out)
  - -10 = green (coach should consider putting them in)
  - 0 = black (coach can leave it alone)
  - the color scale saturates at +10/-10 minutes, and fades smoothly from black to red/green in-between

Each field displays `(highest field-player balance - lowest bench-player balance) / 2` in minutes, using the full values before color saturation. This is an approximate playing-time gap; negative values mean the bench is ahead. Empty fields or an empty bench show a dash. Field and bench cards share the same dimensions, with two columns on the bench.

### Clock start/stop

Either time is going on both fields, or it is not. We don't keep track of time on the two fields independently. When time is stopped. Don't treat time as a toggle - treat it as "switch to on/time is on" to the right and "switch to off/time is off" on the left. Clicking the same spot shouldn't toggle it back and forth.

## How it is implemented

pnpm, cloudflare pages/workers as appropriate

- Go to `nextkid.org`, click "new game"
- you enter the names of the coaches and players, hit "begin pregame"
- you get a random URL
- anyone can visit that URL, you're in pregame
- gametime starts once the clock starts
- 24 hours after the game has stopped, the data backing up the game is deleted
- you can share the URL, anyone with the URL can make changes, everyone can see what anyone else with the URL is doing

## Development and deployment

The live app uses React/Vite and a Cloudflare Worker with static assets. `GameRoom` is a SQLite-backed Durable Object: every random game URL maps to one object, and both coaches connect to it using hibernatable WebSockets. No separate database or secrets are needed by the deployed app.

```sh
pnpm install
pnpm build
pnpm dev:worker
```

Open `http://localhost:8787` for the complete local app. For React hot reload, also run `pnpm dev` and use the Vite URL; its `/api` proxy connects to the local Worker. `pnpm storybook` retains the original isolated demo scenarios.

Validation:

```sh
pnpm test            # deterministic clock, arrival, placement and validation rules
pnpm test:sync       # real local Worker: two sockets, retries, hibernation and expiry
pnpm test:browser    # two mobile browser sessions; requires dev:worker on port 8787
pnpm test-storybook --run
```

The browser suite creates a disposable local game, tests check-in, placement, clock updates, late arrivals and reconnect behavior. Use a local server for this suite. It can take about a minute while waiting for a disconnected socket to be detected.

To publish to the Cloudflare account that owns `nextkid.org`:

```sh
pnpm exec wrangler login
pnpm deploy
```

`wrangler.jsonc` defines the `nextkid` Worker, its Durable Object migration, static assets, and `nextkid.org` Custom Domain. Cloudflare provisions the domain mapping and certificate. Do not remove or rename the existing Durable Object migration after deploying it.

## Shared game behavior

- The server processes commands atomically and broadcasts complete snapshots with increasing revisions. Concurrent edits to different players both apply; for the same player, server processing order determines the final placement.
- Command IDs are persisted with the game. Retrying an acknowledged command cannot apply it twice. After a disconnect, the phone checks receipts for uncertain commands and discards commands that never arrived, with a notice to the coach; it does not replay old substitutions.
- The server owns clock timestamps. Phones estimate server time using synchronization round trips, tick locally, and derive field/bench totals and fairness colors. Stopping the clock stops all time accounting.
- The first eight active arrivals fill the two fields when the coaches enter the game; later arrivals join the bench. Attendance remains accessible during play, including marking players out when they leave. Hold a player in attendance (or press F2) to edit expected late/absent, notes, and names before the first clock start.
- Moving players updates optimistically while connected. Disconnected phones show an estimated clock and disable edits until a fresh synchronization completes.
- Swapping the physical left/right field display is a preference on each phone; it does not move players or change the other coach's view.
- Stopping schedules deletion after 24 hours. Restarting cancels deletion; repeated Stop does not extend the deadline. Games that never start expire 24 hours after creation. Expiry deletes player data and command receipts, closes connected clients, and makes the link unavailable.
- The unguessable game URL grants editing access to anyone who has it. No accounts are required. New games prefill Ned and Brian and the team's 15-player roster; all names remain editable during setup. Storybook and the labeled welcome example use sample rosters.

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
  - +2.5 = red (coach should consider taking them out)
  - -2.5 = green (coach should consider putting them in)
  - 0 = black (coach can leave it alone)
  - the color scale saturates at +2.5/-2.5, and fades smoothly from black to red/green in-between

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
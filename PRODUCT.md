# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Assumed because the product brief delegates only the package manager and hosting: React, TypeScript, Vite, Storybook, and pnpm. Cloudflare Pages/Workers remain the intended eventual deployment environment.

## Users

The primary users are two microsoccer coaches working outdoors on adjacent fields during a game. They need to glance at and operate a shared phone interface while paying most of their attention to the children and play. Anyone with the game's random URL is a trusted collaborator and can make changes.

## Product Purpose

NextKid.org tracks each active player's field and bench time so coaches can make fair substitutions without doing mental arithmetic. Success means coaches can check players in, understand who should rotate next, and update actual placement quickly enough that the interface does not compete with coaching.

## Positioning

Rather than enforcing a rigid rotation schedule, NextKid continuously normalizes each active player's field-minus-bench time around the group midpoint, offers red-to-green decision support, and preserves coach discretion.

## Operating Context

- A team has two coaches, up to 15 players, two simultaneous fields, and usually three or four players per field.
- Players arrive over time. The first eight checked in normally start; later arrivals should play at the same rate from their arrival onward, without catch-up time.
- Coaches move players among Alice's field, Bob's field, and the bench. Temporary inaccuracies and unusual field counts are allowed.
- The game clock applies to both fields. Starting and stopping are separate explicit actions, not one ambiguous toggle.
- The shared game URL is the collaboration mechanism.

## Capabilities and Constraints

- Create a game by entering coach and player names, then begin pregame.
- Check players in with recorded arrival order and time.
- Mark a player HERE with one tap. Removing HERE requires a separate confirmation tap so an accidental touch cannot erase arrival order.
- Press and hold any pregame player to add one free-text `EXPECTED {NOTE}` status, such as `EXPECTED 30 mins late` or `EXPECTED gone`; late and absent are not separate state types.
- Track field time and bench time only while a player is active.
- Show the normalized field-minus-bench balance on a continuous green-through-black-to-red scale, saturating at -10 and +10 minutes.
- Use equal-sized field and bench cards, with two bench columns. Each field shows half the gap between its highest balance and the bench's lowest balance, in minutes.
- Permit any manual player move regardless of the recommendation.
- Label coach-name inputs by physical side (Left coach and Right coach), and allow the two coach field columns to swap sides during the game.
- Run as a phone-only website; desktop may simply stretch the phone interface.
- Assumed for this prototype: every primary scenario fits within a 390×844 CSS-pixel viewport with no page scrolling.
- Delete backing game data 24 hours after the game stops.

## Evidence on Hand

`README.md` is the sole source of product facts. There are no existing brand assets, customer claims, benchmarks, or production player data; the prototype must label representative names and times as demo content where confusion is possible.

## Product Principles

- Coaching stays primary; every critical action must be glanceable and reachable with one hand.
- Guidance is strong but never coercive; coaches can always make a different move.
- Arrival-aware fairness matters more than equal raw minutes.
- Shared state should be legible and forgiving when two coaches edit together.
- Clock controls communicate explicit state and explicit direction.

## Accessibility & Inclusion

Color cannot carry substitution guidance alone. Every recommendation and player state needs a text, icon, shape, or ordering cue in addition to red/green. Touch targets should remain suitable for hurried outdoor use.

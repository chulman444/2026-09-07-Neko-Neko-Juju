# Neko Neko Juju: Macro Loop & Game Design Proposal

## Overview
This document outlines the core roguelite game loop, phasing, and economy for *Neko Neko Juju*. The design shifts the game from a simple endless puzzle into a highly tactical, fast-paced arcade roguelite. 

---

## 1. The Structure of a "Set"
A single run consists of multiple "Sets." Each Set is a sequence of boards:
* **The Risk Boards:** A series of 3 to 4 small/medium-sized boards designed to build multipliers and currency.
* **The Reward Board:** 1 massive, final board at the end of the set filled with special tiles, acting as the "payout" phase.

---

## 2. Playing a Risk Board
When the player loads into a small/medium Risk Board, gameplay is split into two distinct phases:

### Phase 1: The Speed Run (Risk Building)
* **Mechanic:** Governed by a survival timer. 
* **Goal:** Clear as many tiles (sums of 10) as quickly as possible.
* **Reward:** Clearing tiles quickly deposits "Combo Stacks" (currency) and builds the **Risk Meter**. Players can use items to extend their survival timer to keep the phase going.

### Phase 2: The Cleanup (The Safety Net)
* **Mechanic:** Once the Phase 1 survival timer runs out, the board enters Phase 2. 
* **Goal:** The player is given a chance to manually clear the leftover tiles from Phase 1 without the pressure of the survival timer.
* **The Consequence:** Any tiles that are *not* cleared during Phase 2 will carry over to the end of the set and spawn as **Solid Blocks** on the final Reward Board, acting as permanent obstacles.

---

## 3. The "Boss Rush" Global Timer
To prevent players from spending 10 minutes perfectly cleaning up Phase 2, a **Global Set Timer** tracks the entire Set.
* If the player reaches and clears the Reward Board under a specific "Par Time" (similar to reaching the Boss Rush in *The Binding of Isaac*), they receive a massive score and currency multiplier.
* **The Strategic Choice:** Players must constantly choose: *"Do I spend 30 seconds carefully cleaning up Phase 2 to avoid Solid Blocks later, OR do I skip Phase 2, accept the Blocks, and rush to beat the Global Timer?"*

---

## 4. The Reward Board & "The Hunt"
After surviving the Risk Boards, the player reaches the big Reward Board.
* **The Setup:** The board is massive and populated with special tiles giving player 'fun stress' (negative tiles, stacked tiles, randomly changing tiles, etc). However, it is polluted by any Solid Blocks accumulated from skipping or failing Phase 2 on previous boards.
* **The "Hunt" Playstyle:** Specific high-value "bounty" tiles will spawn, marked by hint arrows. Clearing these specific targets yields massive rewards (extra time, massive currency). 
* **Offensive Item Usage:** Because the board is cluttered with Blocks, players are highly incentivized to use Shop Items (like the "Random Number" reroll or "OmniTile") *offensively* to snipe these bounty targets, rather than just saving items for emergencies.

---

## 5. The Economy & Upgrades
The Combo Stacks and currency earned throughout the Set are spent in the Shop. The economy features three tiers of purchases:

1. **Temporary Buffs:** Cheap enhancements (e.g., buffed items or score multipliers) that last only for the current Set. Lost upon death.
2. **Minimum Capacity Upgrades:** Permanent meta-progression. Players can buy a permanent "floor" for their items (e.g., always starting a Set with at least 2 free Shakes), allowing them to rely less on purchasing temporary items as they progress.
3. **Permanent Upgrades:** Highly expensive, permanent stat boosts or mechanics that persist across all future runs.

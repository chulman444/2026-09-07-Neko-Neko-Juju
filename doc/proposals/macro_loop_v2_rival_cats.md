# Neko Neko Juju: Macro Loop V2 (Rival Cats)

## Overview
This document outlines the revised macro loop and game design for *Neko Neko Juju*. The previous proposal (relying on Solid Blocks, Negative Blocks, and distinct Phase 1/Phase 2 pacing) has been pivoted because obstacle blocks require complex architectural changes that interfere with the core selection logic and hint algorithms. 

Instead, the new design introduces a single-phase, consistent pressure loop driven by the **"Rival Cats"** mechanic, which acts as a "free triggered hint" playing against you. 

---

## 1. The Core Mechanic: "Rival Cats" (The Anti-Hint)
Instead of splitting boards into a timed Speed Run phase and an untimed Cleanup phase, the game features continuous pressure governed by Rival Cats.

* **The Threat:** A "Rival Cat Timer" constantly ticks down. When it triggers, a Rival Cat finds a valid match on the board and "steals" it. This removes the tiles and steals potential points and currency from the player.
* **The Silver Lining (RNG Recovery):** Tiles stolen by Rival Cats are not always lost forever. There is a base **10% chance** (upgradable to **30%**) that a stolen tile will "reappear" in the final big board (The Reward Board). Because more tiles in the big board = more currency, this adds a silver lining. However, because the chance is low, players cannot rely on Rival Cats to carry tiles over.
* **The Catch:** Even on the Hard Board, Rival Cats still steal tiles. (Lore-wise, they are consuming them or taking them off-screen). 
* **Friendly Cats:** Occasionally, the timer will spawn a "Friendly Cat" instead, which acts like a traditional hint system and helps the player. Friendly cats might also have a chance to give a random item (Stable or Unstable).
* **Mitigation & Penalties:** Players can use specific items (like "Shoo") to temporarily drive away Rival Cats. Conversely, if the player plays poorly, they might face penalties where multiple (-1 or -2) Rival Cats visit the board at once.

---

## 2. Board Elements & Hazards
* **Stacked Tiles:** Tiles can spawn stacked on top of each other.
* **Restless Tiles:** Tiles that randomly change their values while on the board.

---

## 3. The 4 Incentives for Speed
To encourage fast play without relying on hard survival timers, the game employs four interlocked speed incentives:

1. **Security Incentive (Stress):** The constant threat of the Rival Cat Timer provides an omnipresent "stress" throughout the game. If you don't play fast, the game plays itself against you.
2. **Skill Incentive (Combo Enhancements):** Playing fast and chaining matches builds combos. These combos tie into "combo enhanced items" (either unlocking the ability to use certain items via combo currency, or directly empowering the items).
3. **Reward Incentive (Fever Mode & Risk Thresholds):** 
   * **Fever Mode:** The game tracks how many *clearable tiles* remain on the board. If you reduce the clearable tiles below a certain "Risk Threshold" (e.g., less than 10 or 20 tiles, which can be upgraded), you enter **Fever Mode**. In Fever Mode, item refill cooldowns become significantly faster.
   * **Penalty:** Conversely, if too many clearable tiles pile up (above the threshold), the game punishes you by spawning an additional Rival Cat.
   * **Marked Tiles:** (Pending Brainstorming) Special tiles that test impact on the game loop. Potential ideas include tiles that grant combo currency when cleared, or briefly stun Rival Cats.
4. **Item Incentive (Cooldown Accelerators):** Item cooldowns naturally refill faster when there are fewer tiles on the board, pushing players to aggressively clear the board to regain their abilities rather than hoarding them. There is also a "Smart Incentive" where using only a few items provides additional benefits.

---

## 4. The Macro Loop: The "Gold Rush" Timer
The overall run structure is tied together by a Boss Rush-style global timer, referred to as the **Gold Rush Timer**.

* **The Ongoing Timer:** Unlike a static flag (e.g., *The Binding of Isaac* boss rush) that checks if you reached the end in time, the Gold Rush is an ongoing, depleting global timer. 
* **The Goal:** The player must rush through the initial small/medium boards to reach the massive Reward Board while the Gold Rush timer is still active. You play the Gold Rush for the remainder of the timer once you enter the hard board.
* **The Payout:** During the Gold Rush, every tile cleared in the big board receives a massive multiplier. 
* **The Synergy:** Reaching the Reward Board quickly means you face a massive board filled with your safely "Taken Out" tiles and RNG recovered tiles. The more tiles in the big board, the more tiles are affected by the Gold Rush multiplier—if you can enter within the duration.

---

## 5. Items & The Shop Economy
The economy discourages hoarding and revolves around managing cooldowns and choosing between temporary power and permanent progression.

### Item Mechanics
* **Cooldowns over Charges:** Items rely on refill cooldowns. Some items do not refill naturally, or refill very slowly, and require using *other* items to become fully charged.
* **Stable vs. Unstable:** Items have a 0~50% chance to roll as "Unstable." Unstable items last longer (or have extended effects), but carry inherent trade-offs. The UI will need a way to visually show if an item is stable or unstable.

### The Arsenal
* **Take Out:** Allows the player to manually CHOOSE a tile to safely carry over into the big board, bypassing the RNG of the Rival Cats. *Note: "Not usable in difficult board", because the big board is the final destination.*
* **Mahjong:** Allows the player to select two matching tiles and remove them (bypassing sum mechanics) as long as they can be connected with a line that has a maximum of 2 corners.
* **Slicer:** Cuts a single tile's number into two smaller numbers. Cannot be used on `1`s, and requires an adjacent empty space to place the newly split tile.
* **Random Roll & Random Choose:** Tied to the combo system. Upgradable to have a chance to turn a tile into a **"Restless Tile"** (randomly changing).
* **Omni Tile:** Acts as a wild card to complete matches.
* **Shake (Values):** Randomizes the numbers on the board.
* **Shake (Positions):** Shuffles the physical positions of the tiles on the board.
* **Replacer:** Replaces a specific tile with a chosen number. Can be upgraded to have *N* more specific numbers to choose from.
* **Shoo:** Shoos away visiting Rival Cats.

### The Shop & Upgrades
* **Selling:** Players could sell items that don't refill to the shop.
* **Temporary Buffs:** The shop sells cheap, single-run versions of full upgrades. This allows players to buy a tiny bit of immediate power to survive the current run.
* **Permanent Meta-Progression:** Permanent upgrades (like upgrading the Fever Mode risk threshold, storage chance, or unlocking permanent effects) are highly expensive. Players must balance spending their currency on temporary buffs versus saving up for permanent, account-wide progression.

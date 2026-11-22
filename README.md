# makefun-best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Tiiashtf/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Tiiashtf/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**THE MARLOWE JOB** — a three-floor museum heist game. You are Vesper, the best second-story thief in the city: steal the art, crack the vault, reach the van — and never let the alarm hit 100%.

Three floors, each with its own layout and pressure: the Halcyon Gallery (paintings, patrols, cameras), the Vault Floor (laser grids and a tumbler-cracking minigame for the Star Sapphire), and the Rooftop Getaway (alarm already humming, guards converging, the van waiting). Guards patrol with vision cones and learnable routes; cameras sweep; lasers blink on a timer; shadow rugs hide you and vents give the thief routes the guards cannot take. Smoke bombs, EMP pulses and coin tosses all cost loot — spend it like it matters, because it does.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — WASD/arrows to move, Shift to run, C to sneak, 1/2/3 to pick a tool, click to use it, E to crack the vault, P to pause, M to mute. Or hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Self-test (a bot plays the whole job through the real game code): open `http://localhost:8080/?selftest=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=635rx196&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>

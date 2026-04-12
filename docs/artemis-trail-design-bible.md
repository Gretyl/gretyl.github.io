# The Artemis Trail — Design Bible

> Reference document for the interactive Artemis II simulation.
> Based on the real NASA Artemis II mission launched April 1, 2026.

---

## 1. Architecture Overview

- **Engine:** Single-file vanilla HTML/CSS/JS (no frameworks)
- **Aesthetic:** Retro CRT phosphor terminal — green/amber/red on black, scanline overlay, VT323 + Press Start 2P fonts
- **Time model:** 10 days × 3 shifts = **30 ticks** per mission
- **Shift rotation:** Alpha (00:00–08:00), Bravo (08:00–16:00), Charlie (16:00–00:00) — mirrors real Mission Control capcom rotations
- **Difficulty:** Easy / Normal / Hard — affects resource drain rate and bad-event probability
- **Win condition:** Survive all 30 shifts with no resource at 0% and morale > 0%
- **Lose condition:** Any resource hits 0% or morale hits 0% → Critical Failure → Mission Abort

---

## 2. Resource Model

| Resource | Drain/Shift (Normal) | Drain/Shift (Easy) | Drain/Shift (Hard) | Notes |
|----------|---------------------|--------------------|--------------------|-------|
| O₂       | 1.5%                | 1.0%               | 2.2%               | Life support |
| H₂O      | 1.5%                | 1.0%               | 2.2%               | Water recycler |
| Food     | 1.2%                | 0.8%               | 1.76%              | 3 meals/day, 1 shared |
| Power    | 0% (event-driven)   | 0%                 | 0%                 | Solar arrays; only changes via events |
| Fuel     | 0.7%                | 0.7%               | 0.7%               | Constant; burns are event-driven |
| Systems  | 0% (event-driven)   | 0%                 | 0%                 | Only changes via events |
| Morale   | 0% (event-driven)   | 0%                 | 0%                 | Only changes via events |

Starting values: All resources 100%, Morale 85% (Normal), 95% (Easy), 70% (Hard).
Hard mode also starts Fuel at 80% and Systems at 85%.

Values are clamped to [0, 100] and rounded to 1 decimal place via `clamp()` to prevent floating-point drift.

Display: Vertical bar gauges (10 cells = 10% each), color-banded red (0–30%), amber (30–60%), green (60–100%).

---

## 3. Shift Timeline — Complete Inventory

### Legend

- **S** = Scripted (always fires)
- **R** = Random (rolls from good/bad/neutral pools)
- **C** = Choice (22% chance on random shifts, drawn from unused pool)
- **skip** = Shift exists but is auto-advanced (launch screen already shown)
- **splashdown** = Triggers endgame

### Timeline

| # | Key | Day | Date | Shift | Type | Event Summary |
|---|-----|-----|------|-------|------|---------------|
| 1 | 0-0 | 1 | Apr 1 | ALPHA | S/skip | Launch — already shown in showLaunch() |
| 2 | 0-1 | 1 | Apr 1 | BRAVO | S | **Toilet malfunction.** Fan controller jams. Urine system down. Koch as space plumber. Player choice (3 options). Based on real event within hours of launch. |
| 3 | 0-2 | 1 | Apr 1 | CHARLIE | S | Split sleep (2×4hr blocks). Perigee raise burn interruption. Koch sleeps like a bat. Glover wants warmer sleeping bags. Cold cabin. |
| 4 | 1-0 | 2 | Apr 2 | ALPHA | S | Wake-up song: "Green Light" by John Legend. First exercise on flywheel. Koch preps TLI. Only two naps in 30 hours. |
| 5 | 1-1 | 2 | Apr 2 | BRAVO | S | **TLI burn.** 5 min 55 sec. ESM engine fires. +900 mph. Orion leaves Earth orbit. Capcom Birch: "Integrity, looks like a good burn." Hansen quote. |
| 6 | 1-2 | 2 | Apr 2 | CHARLIE | S | First real meal together. Rehydrated food + suitcase warmer. Wiseman's "pole to pole" Earth observation quote. |
| 7 | 2-0 | 3 | Apr 3 | ALPHA | R+C | Random event. Choice possible. |
| 8 | 2-1 | 3 | Apr 3 | BRAVO | S | **DSN handoff.** Link passes Goldstone→Canberra. Two 34m dishes lock on. 6 Mbps S-band at 160,000 km. |
| 9 | 2-2 | 3 | Apr 3 | CHARLIE | R+C | Random event. Choice possible. |
| 10 | 3-0 | 4 | Apr 4 | ALPHA | R+C | Random event. Choice possible. |
| 11 | 3-1 | 4 | Apr 4 | BRAVO | R+C | Random event. Choice possible. |
| 12 | 3-2 | 4 | Apr 4 | CHARLIE | R+C | Random event. Choice possible. |
| 13 | 4-0 | 5 | Apr 5 | ALPHA | R+C | Random event. Choice possible. |
| 14 | 4-1 | 5 | Apr 5 | BRAVO | S | **Distance record broken.** Passes Apollo 13's 248,655 mi. New record: 252,021 mi. |
| 15 | 4-2 | 5 | Apr 5 | CHARLIE | R+C | Random event. Choice possible. |
| 16 | 5-0 | 6 | Apr 6 | ALPHA | S | **Lunar approach.** Moon fills windows. Koch excitement quote. Glover on first woman's eyes at the Moon. |
| 17 | 5-1 | 6 | Apr 6 | BRAVO | S | **Comms blackout.** 30 min behind Moon. Crew utterly alone. Radio crackles back. Closest approach ~4,100 mi. |
| 18 | 5-2 | 6 | Apr 6 | CHARLIE | S | Far side photography. Low-angle sunlight. Individual craters at 6,600 km. |
| 19 | 6-0 | 7 | Apr 7 | ALPHA | S | **Off-duty day.** Rest, personal time, Moon gazing. Only such day in the mission. |
| 20 | 6-1 | 7 | Apr 7 | BRAVO | R+C | Random event. Choice possible. |
| 21 | 6-2 | 7 | Apr 7 | CHARLIE | R+C | Random event. Choice possible. |
| 22 | 7-0 | 8 | Apr 8 | ALPHA | R+C | Random event. Choice possible. |
| 23 | 7-1 | 8 | Apr 8 | BRAVO | S | **Green Bank + amateur radio.** 100m telescope bounces radar off Orion hull. 14-country amateur tracking network. |
| 24 | 7-2 | 8 | Apr 8 | CHARLIE | R+C | Random event. Choice possible. |
| 25 | 8-0 | 9 | Apr 9 | ALPHA | R+C | Random event. Choice possible. |
| 26 | 8-1 | 9 | Apr 9 | BRAVO | R+C | Random event. Choice possible. |
| 27 | 8-2 | 9 | Apr 9 | CHARLIE | R+C | Random event. Choice possible. |
| 28 | 9-0 | 10 | Apr 10 | ALPHA | R+C | Random event. Choice possible. |
| 29 | 9-1 | 10 | Apr 10 | BRAVO | S | **Re-entry.** Service module jettisoned. Skip re-entry. AVCOAT heat shield. G-forces. |
| 30 | 9-2 | 10 | Apr 10 | CHARLIE | S/end | **Splashdown.** Triggers endGame(true). |

**Totals:** 14 scripted slots (including skip + splashdown), 16 random slots (each with 22% choice chance).

---

## 4. Random Event Pools

### 4.1 Good Events (10)

| # | Summary | Effects | Source |
|---|---------|---------|--------|
| 1 | Solar arrays +12% above predicted | Power +10 | Engineering data |
| 2 | TDRS→DSN switch, first crewed in 50 yr | Systems +8 | Real mission milestone |
| 3 | School broadcast, Koch on Moon smell | Morale +10 | Real downlink event format |
| 4 | Hansen calibrates far-side cameras | Morale +5, Systems +5 | Daily agenda |
| 5 | AVATAR organ-chip nominal | Morale +5 | Real experiment |
| 6 | Emergency egress drill, faster than sim | Systems +8 | Training protocol |
| 7 | Glover manual piloting exercise | Morale +5, Systems +5 | Prox ops experience |
| 8 | Madrid DSS-56 lock, max data rate | Systems +5, Morale +5 | DSN newest antenna |
| 9 | Ka-band HD video test at 20 Mbps | Morale +8 | Real capability |
| 10 | Wake-up song, audio cut mid-lyric | Morale +10 | Real event from mission |

### 4.2 Bad Events (11)

| # | Summary | Effects | Source |
|---|---------|---------|--------|
| 1 | Cold cabin, Glover sleeping bag quote | Morale -12 | Real crew complaint |
| 2 | Solar proton event, 4hr shelter | Morale -12, Systems -5 | SWPC protocol |
| 3 | Water recycler pump fault | Water -12, Morale -5 | Common ISS issue |
| 4 | DSN dropout during antenna handoff | Morale -15, Systems -5 | DSN architecture risk |
| 5 | Micrometeorite sensor trigger | Systems -12 | Standard deep space risk |
| 6 | Nav computer reboot, 8 min dead reckoning | Systems -15, Morale -8 | Avionics scenario |
| 7 | Thermal glitch, cabin overheats 30°C | Morale -8, Systems -5 | ECLSS failure mode |
| 8 | Solar array degraded output | Power -15, Morale -5 | Power system risk |
| 9 | CME alert, 1200 km/s, 36hr ETA | Morale -15, Systems -5 | DONKI/SWPC data |
| 10 | S-band uplink degrades -8 dB | Systems -8, Morale -5 | Comms link budget |
| 11 | DSN congestion, bumps Juno/JWST | Morale -5 | Real DSN scheduling conflict |

### 4.3 Neutral Events (6)

| # | Summary | Effects | Source |
|---|---------|---------|--------|
| 1 | Routine check, "Integrity is go" | None | Standard callout |
| 2 | Meal time, shrimp cocktail + hot sauce | Morale +3 | Real crew food |
| 3 | Flywheel exercise, ARCHAR logging | Morale +3 | Real experiment |
| 4 | Quiet coast, family email via DSN | Morale +5 | Crew welfare |
| 5 | Sports scores, Hansen hockey | Morale +5 | Real crew personality |
| 6 | Canberra routine pass at 2.1 Mbps | None | Standard DSN ops |

---

## 5. Choice Events (9)

Drawn from an unused pool. Each can fire at most once per game. 22% chance per random shift.

| # | Title | Description | Option A | Option B | Option C |
|---|-------|-------------|----------|----------|----------|
| 1 | Power Allocation Dilemma | Solar dipped below forecast | Life support (+O₂/H₂O, -Sys) | Nav & GNC (+Sys, -Morale) | Balanced (-Power) |
| 2 | Course Correction Decision | 0.3° off free-return | Immediate burn (+Sys, -Fuel) | Wait (-Morale) | Star sighting (+Morale/Sys) |
| 3 | Crew Rest vs. Repairs | ECLSS sensor, crew at 16hr awake | Repair now (+Sys, -Morale) | Sleep first (+Morale, -Sys) | Split shift (mild both) |
| 4 | Radiation Shelter Alert | M1.1 flare, proton flux rising | Full shelter (-Morale, -O₂) | Ignore (+Morale) | Partial (-Morale) |
| 5 | Urine Dump Timing | Container full, GNC thrust risk | Dump now (+Water, -Sys) | Wait (-Morale) | Backup container (-Water) |
| 6 | Flywheel Exercise Issue | Grinding noise, ARCHAR needs data | Full teardown (+Sys, -Morale) | Reduce usage (-Morale) | Ignore (+Morale) |
| 7 | DSN Antenna Congestion | JPL overloaded, Voyager/JWST need time | Reduce rate (+Morale, -Sys) | Hold priority (-Morale, +Sys) | Negotiate split (+Morale) |
| 8 | CME Intercept Decision | DONKI CME en route, 18hr ETA | Full shelter (-Morale, -O₂) | Wait for update (-Morale) | Shelter crew only (-Morale, -Sys) |
| 9 | Ka-band Gimbal Sticking | High-gain antenna intermittent | EVA prep (+Sys, -Morale/-O₂) | S-band only (-Sys, -Morale) | Cycle power (+Sys) |

### Special Choice: Toilet (Day 1 Bravo — always fires)

| Option | Effects | Outcome Text |
|--------|---------|--------------|
| Koch fixes it now | Sys +8, Morale +5 | Nominal after 2 hours. GNC urine dump warning. |
| Use backup bags | Morale -12 | Apollo 10 callback. Bags work but morale tanks. |
| Partial fix — cycle controller | Sys +5, Morale -5 | Intermittent. Houston wants full teardown. |

---

## 6. Mission Telemetry Panel

Displayed below the gauges on every shift screen. Provides immersive context without gameplay impact.

### 6.1 Data Fields

| Field | Source | Behavior |
|-------|--------|----------|
| **MET** | `totalShifts × 8` hours | T+0d 00:00 through T+9d 16:00. Increments 8hr per shift. |
| **Range** | `TELEM_DIST[totalShifts]` | 30-element array. Pre-computed distance in km following real outbound/return profile. Peaks at shift 13 (406,841 km / ~252,000 mi). Displayed in miles. |
| **Velocity** | `TELEM_SPEED[totalShifts]` | 30-element array. km/h, converted to mph for display. Starts ~28,000 km/h in LEO, drops during coast, climbs on return. |
| **Signal delay** | Computed: `dist_miles × 1.609 / 299792` | Light-speed one-way delay in seconds. Peaks ~1.4s at lunar distance. Shows "<0.01s" when close. |
| **DSN station** | `DSN_STATIONS[shift % 3]` | Rotates with shift: Alpha→Goldstone, Bravo→Canberra, Charlie→Madrid. |
| **Antenna** | Per-station constant | Goldstone: DSS-24/25/26 (34m array). Canberra: DSS-43 (70m) + 34m. Madrid: DSS-63 (70m) + DSS-56 (34m). |
| **DSN Note** | Per-station constant | Goldstone: DSS-14 offline. Canberra: primary Southern Hemisphere. Madrid: newest all-in-one. |
| **Space Weather** | `SPACE_WX[(totalShifts×7 + day×3) % 15]` | 15 pre-written NOAA SWPC-style status strings. Deterministic per shift but appears varied. Amber highlight on elevated/active. |

### 6.2 Distance Profile (TELEM_DIST array, km)

```
Shift:  0     1     2     3      4       5       6       7       8       9
Dist:   0     0     0     6000   40000   100000  160000  200000  250000  300000

Shift:  10     11     12     13      14      15      16      17      18      19
Dist:   340000 370000 395000 406841  400000  380000  350000  300000  250000  200000

Shift:  20     21     22     23     24     25     26    27    28   29
Dist:   150000 100000 60000  30000  10000  2000   500   200   80   0
```

### 6.3 Velocity Profile (TELEM_SPEED array, km/h)

```
Shift:  0     1      2      3      4      5     6     7     8     9
Speed:  0     28000  27500  39000  15000  7200  5500  4200  3500  2800

Shift:  10    11    12    13    14    15    16    17    18    19
Speed:  2200  1800  1500  1200  1500  2000  2800  3500  4200  5500

Shift:  20    21     22     23     24     25     26     27     28     29
Speed:  7200  9500   12000  16000  22000  28000  32000  36000  39800  0
```

### 6.4 DSN Station Rotation

| Shift Index | Station | Rationale |
|-------------|---------|-----------|
| 0 (Alpha) | Goldstone, CA | US overnight = Goldstone prime |
| 1 (Bravo) | Canberra, AUS | Earth rotates, Australia faces deep space |
| 2 (Charlie) | Madrid, ESP | European evening/night window |

This is simplified — real DSN scheduling is more complex — but it conveys the 120°-apart architecture.

### 6.5 Space Weather Strings (15 total)

Each string is prefixed with a severity word used for UI coloring:

| Prefix | UI Color | Meaning |
|--------|----------|---------|
| Quiet | Green (default) | Nominal conditions |
| Minor | Green | Low-grade activity, no crew action |
| Elevated | Amber | Monitoring, possible crew advisory |
| Moderate | Amber | Active monitoring |
| Active | Amber | Crew may need to shelter |

---

## 7. ASCII Art Assets

| Constant | Lines | Used On | Description |
|----------|-------|---------|-------------|
| `SHIP` | 33 | Title screen, failed mission | SLS/Orion full stack with exhaust plume |
| `EARTH` | 9 | Launch screen | Stylized globe with continents |
| `MOON` | 9 | Day 6 lunar flyby shifts | Stylized Moon with craters |
| `TOILET` | 11 | Day 1 Bravo toilet event | Hygiene bay with warning indicator |
| `SPLASH` | 38 | Successful splashdown | Parachute + Orion + ocean waves + USS Portland (LPD-27) + Pacific Ocean label |

### 7.1 Art Color Rules

Each art constant is rendered inside a `<div class="ascii">` with an inline color override. The base `.ascii` class is green with green glow; specific screens override:

| Constant | Screen | Color | CSS |
|----------|--------|-------|-----|
| `SHIP` | Title screen | Amber | `color:var(--amber); text-shadow:0 0 8px rgba(255,176,0,0.3)` |
| `SHIP` | Failed mission (endgame) | Red | `color:var(--red)` |
| `EARTH` | Launch screen | Green (default) | Base `.ascii` class, no override |
| `MOON` | Day 6 flyby shifts | Amber | `color:var(--amber)` |
| `TOILET` | Day 1 Bravo | Amber | `color:var(--amber)` |
| `SPLASH` | Successful splashdown | Amber | `color:var(--amber)` |

The endgame dynamically selects art and color: `${win ? SPLASH : SHIP}` with `color:${win ? 'var(--amber)' : 'var(--red)'}`.

### 7.2 Art Design Constraints

- All art uses only ASCII printable characters (no Unicode box-drawing)
- Maximum width: ~45 characters (fits 800px viewport at font-size 14px)
- `white-space: pre` preserves spacing — leading spaces are structural
- Backslashes and backticks must be escaped in JS template literals (`\\`, `` \` ``)
- Art is centered via `text-align: center` on the container div, not via internal padding

---

## 8. Visual Design System

### 8.1 Fonts

| Font | Usage | Fallback | Source |
|------|-------|----------|--------|
| **VT323** | All body text, buttons, status, telemetry, event text | `monospace` | Google Fonts |
| **Press Start 2P** | Title screen art class `.title-art` (currently unused but available) | `monospace` | Google Fonts |

Both fonts are loaded via `@import url(...)` in the `<style>` block. If Google Fonts is unreachable (e.g., sandboxed environments), the browser falls back to system monospace — the CRT aesthetic still holds because the layout doesn't depend on exact glyph widths.

VT323 was chosen for its authentic early-80s terminal feel at large sizes. Press Start 2P is available for pixel-art-style headers if needed.

### 8.2 Color Palette

All colors are CSS custom properties defined in `:root`:

| Variable | Hex | Usage |
|----------|-----|-------|
| `--green` | `#33ff33` | Primary text, healthy values, filled gauge cells (top band), buttons |
| `--green-dim` | `#1a9a1a` | Labels, secondary text, dim info, shift labels, telemetry field names |
| `--green-glow` | `#33ff3366` | `text-shadow` and `box-shadow` glow on green elements |
| `--amber` | `#ffb000` | Warnings, good events, titles, scripted milestones, amber gauge band, `.btn.a` |
| `--red` | `#ff3333` | Bad events, critical failures, danger gauge band, low resource values, `.btn.r` |
| `--bg` | `#0a0a0a` | Screen background (near-black, not pure black — allows CRT depth) |
| `--scanline` | `rgba(0,0,0,0.15)` | Horizontal scanline overlay opacity |

### 8.3 CRT Effects (CSS only, no JS)

Three layers create the CRT illusion, all using `pointer-events: none` and `z-index` stacking:

| Layer | Element | Z-Index | Technique |
|-------|---------|---------|-----------|
| **Scanlines** | `#crt::before` | 10 | `repeating-linear-gradient` — 1px dark lines every 3px vertical |
| **Vignette** | `#crt::after` | 11 | `radial-gradient` — darkens edges, bright center (simulates CRT curvature) |
| **Content** | `#screen` | 5 | Scrollable content area underneath both overlays |

The content scrolls behind the fixed scanline and vignette overlays, which remain static — this is intentional and matches how a real CRT phosphor pattern would behave.

### 8.4 Text Glow

Key text classes include `text-shadow` to simulate phosphor bloom:

| Class | Glow Color | Radius |
|-------|-----------|--------|
| `.tb` (all body text) | `var(--green-glow)` | 5px |
| `.ta` (amber text) | `rgba(255,176,0,0.3)` | 5px |
| `.tr` (red text) | `rgba(255,50,50,0.3)` | 5px |
| `.ascii` (art blocks) | `var(--green-glow)` | 4px |
| `.subtitle` | `rgba(255,176,0,0.4)` | 15px (stronger bloom for title) |
| Gauge values | Per-status glow class (`g-glow-green/amber/red`) | 6px |

### 8.5 Gauge Rendering

Each gauge is a `<div class="gauge">` containing:

1. **Label** (`.g-label`) — resource abbreviation, dim green
2. **Value** (`.g-val`) — numeric percentage with status-colored glow
3. **Column** (`.g-col`) — 10 stacked `.g-cell` divs, bottom-to-top

Cell color logic (row 1 = bottom, row 10 = top):

| Rows | Band | Color Class | Meaning |
|------|------|-------------|---------|
| 1–3 | Danger | `.g-red` | Resource critically low if filled only to here |
| 4–6 | Warning | `.g-amber` | Resource declining |
| 7–10 | Healthy | `.g-green` | Resource in good shape |

Filled cells get `box-shadow: inset 0 0 4px currentColor` for an inner glow. Empty cells are `rgba(255,255,255,0.03)` — barely visible dark glass.

The gauge column sizes responsively via `clamp()`: 36–56px wide on desktop, 30–44px on mobile. Cell height also clamps: 6–9px desktop, 5px mobile.

### 8.6 Telemetry Panel

Rendered as a `.telem` grid (2-column on desktop, 1-column on mobile ≤600px). Field names use `.tl` (dim green), values use `.tv` (bright green) with `.tw` override for amber on elevated space weather.

The panel spans full width for the Space Weather and DSN Note rows via `grid-column: 1/-1`.

### 8.7 Animation

| Animation | Class | Technique | Duration |
|-----------|-------|-----------|----------|
| Screen transition | `.fin` | `fadeIn` keyframes — opacity 0→1, translateY 8px→0 | 0.5s ease-out |
| Blinking cursor/prompt | `.blink` | `step-end` opacity toggle | 1s infinite |
| Progress bar fill | `.pfill` | CSS `transition: width 0.5s` | 0.5s on width change |

No JavaScript animation is used. All motion is CSS-only.

### 8.8 Responsive Breakpoints

Single breakpoint at `max-width: 600px`:

| Property | Desktop | Mobile (≤600px) |
|----------|---------|-----------------|
| `.subtitle` font-size | 28px | 20px |
| `.tb`, `.btn` font-size | 22px | 18px |
| `.ascii` font-size | 14px | 10px |
| `#screen` padding | 20px | 12px |
| Gauge width | 36–56px | 30–44px |
| Gauge cell height | 6–9px | 5px |
| Gauge gap | 2px | 1px |
| Telemetry grid | 2 columns | 1 column |

---

## 9. Scoring

```
score = round((morale + average(all_resources)) / 2)
```

| Score | Rating |
|-------|--------|
| 86–100 | FLAWLESS — Worthy of the Golden Age |
| 66–85 | SUCCESSFUL — Integrity lived up to her name |
| 41–65 | ROUGH — USS Portland fished you out |
| 1–40 | BARELY SURVIVED — Houston relieved |
| 0 | MISSION LOST (failure only) |

---

## 10. Real Mission Facts Referenced

| Fact | Where Used | Source |
|------|-----------|--------|
| Launch: Apr 1, 2026, 6:35 PM EDT, LC-39B | Launch screen | NASA |
| Crew: Wiseman (CDR), Glover (PLT), Koch (MS1), Hansen (MS2/CSA) | Launch screen, crew display | NASA |
| Orion callsign "Integrity" | Throughout | NASA |
| Toilet fan controller jam on Day 1 | Scripted 0-1 | NASA blog, multiple news |
| Koch led toilet repair | Toilet choice | Astronomy.com, Space.com |
| GNC warning: urine dump could create thrust | Toilet choice, Urine Dump choice | Astronomy.com |
| TLI burn: 5m55s on Apr 2 | Scripted 1-1 | NASA, CBS |
| Cold cabin, Glover sleeping bag complaint | Bad event, Scripted 0-2 | CNN live updates |
| Koch sleeping "like a bat" | Scripted 0-2 | CNN live updates |
| Wake-up song: "Green Light" by John Legend | Scripted 1-0 | Space.com |
| Censored wake-up song, Wiseman quip | Good event | artemis.cdnspace.ca tracker |
| Distance record: 252,021 mi (Apollo 13: 248,655 mi) | Scripted 4-1 | CNN, NASA |
| Closest approach: ~4,100 mi / 6,600 km above far side | Scripted 5-1, 5-2 | NASA daily agenda |
| 30-50 min comms blackout behind Moon | Scripted 5-1 | NASA daily agenda |
| Splashdown: Pacific off San Diego, USS Portland (LPD-27) | Endgame | CBS, NASA |
| Skip re-entry maneuver | Scripted 9-1 | NASA |
| AVCOAT heat shield concerns from Artemis I | Scripted 9-1 | Wikipedia, NASA |
| DSS-14 Goldstone 70m damaged Sep 2025 | Telemetry panel, launch screen | SpaceNews, Gizmodo |
| DSN 120° spacing: Goldstone/Canberra/Madrid | Telemetry panel | NASA DSN |
| S-band (voice/commands) + Ka-band (HD video/data) | Events, telemetry | NASA comms docs |
| Artemis I consumed 903 DSN hours | DSN congestion event | SpaceNews |
| Green Bank 100m telescope radar tracking | Scripted 7-1 | New Space Economy |
| Amateur radio operators in 14 countries | Scripted 7-1 | New Space Economy |
| AVATAR organ-chip experiment | Good event, day desc | NASA |
| ARCHAR crew health study | Neutral event, choice | NASA |
| 3 capcom shifts/day, 8 hours each | Architecture, launch screen | CNN |
| Crew all sleeps simultaneously, ~8.5 hrs blocked | Architecture notes | Space.com, Fox |
| Off-duty day on Day 7 | Scripted 6-0 | NASA daily agenda |
| Wiseman "pole to pole" Earth quote | Scripted 1-2 | CNN live updates |
| Glover prox ops: "I see the ICPS and the Moon" | Good event pool | NASA live coverage |
| Firsts: first woman, person of color, non-US beyond LEO | Launch screen | Wikipedia, NASA |
| CME as primary flight timeline modifier | CME choice, bad event | artemis.cdnspace.ca |
| Signal delay ~1.3s one-way at lunar distance | Telemetry panel | Multiple tracker sites |
| Orion coasts at ~39,000 km/h post-TLI, decelerating | Telemetry panel | artemis.cdnspace.ca |
| DSS-56 Madrid: newest "all-in-one" antenna | Good event, telemetry | NASASpaceFlight |

---

## 11. OpenGraph / Distribution

- **OG image:** `og-artemis-trail.png` (1200×630, CRT aesthetic)
- **Tags:** In `<head>` — og:title, og:description, og:image, twitter:card (summary_large_image)
- **Before hosting:** Set `og:url` and make image paths absolute URLs

---

## 12. Future Ideas (Not Yet Implemented)

- Crew health individual tracking (per-astronaut morale/fatigue)
- Persistent high scores via `window.storage` API
- Sound effects (CRT hum, radio static, comms beeps)
- More wake-up songs from the real mission playlist
- Dynamic space weather tied to actual NOAA SWPC API
- Multiplayer: one player as Commander, one as Houston
- Extended mission variant (what if Artemis II had gone longer?)
- Artemis III expansion: lunar landing, EVA, surface ops

---

## Appendix A: Version Changelog

Follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format.

### [1.2.0] — 2026-04-11

Post-splashdown update. Mission concluded successfully on April 10, 2026 at 8:07 PM EDT — a "perfect bullseye splashdown" 40–50 miles off San Diego. This update incorporates real events that occurred between our v1.1 release and splashdown.

#### Added
- **Solar eclipse event (Day 6 Charlie, scripted)** — Glover cited this as his personal mission highlight. The Sun passed behind the Moon during the flyby, photographed by the solar array wing camera. The April 1 launch meant the far side was less illuminated than hoped, making the eclipse a consolation gift.
- **Presidential downlink (Day 7 Charlie, scripted)** — Live call with President Trump from the White Flight Control Room at Johnson Space Center.
- **Final return burn (Day 10 Alpha, scripted)** — 8-second thruster burn at 2:53 PM EDT, 4.2 ft/s delta-v. Wake-up songs "Run to the Water" (Live) and "Free" (Zac Brown Band), crew-selected.
- **Propellant efficiency random event** — ESM used less than half its fuel; engineers celebrated the performance margin.
- **Recovery armada random event** — NASA RB-57F Canberra high-altitude aircraft, modified Cessna 208, 7 Navy H-60 Black Hawks, and the USS John P. Murtha all on station.

#### Changed
- **Recovery ship corrected**: USS John P. Murtha (LPD-26), not USS Portland. In the splashdown ASCII art and endgame text. Updated to reflect first Navy-recovered crewed mission since Apollo-Soyuz in 1975.
- **Re-entry profile corrected** (Day 10 Bravo scripted event): NASA replaced the original planned skip re-entry with a steeper single-entry profile after Artemis I heat shield erosion. Max velocity now cited as 24,661 mph (35× speed of sound) with 6-minute plasma blackout. Crew module thrusters fire 19 seconds post-separation.
- **Splashdown endgame text** now includes the "perfect bullseye splashdown" Mission Control quote, the 40–50 mile distance from San Diego, parachute velocity (300 mph → 20 mph), the Apollo-Soyuz 1975 recovery record, and Glover's eclipse highlight quote.

#### Deprecated
- The `artemis.cdnspace.ca` live dashboard that inspired v1.1's telemetry panel is no longer serving live data (mission has ended). Its archived event logs, wake-up song entries, and DSN handoff records remain useful primary sources for any future content updates or Artemis III sequel.

### [1.1.0] — 2026-04-05

#### Added
- **Mission Telemetry Panel** — displayed below gauges on every shift screen
  - MET (Mission Elapsed Time) computed from shift count
  - Range from Earth in miles (30-element profile array)
  - Velocity in mph (30-element profile array)
  - Signal delay computed at light speed from range
  - Active DSN ground station rotating per shift (Goldstone → Canberra → Madrid)
  - Antenna designation per station (DSS-24/25/26, DSS-43, DSS-63, DSS-56)
  - DSN contextual note (Goldstone DSS-14 damage, Madrid newest dish, Canberra role)
  - Space weather status from 15-string pool with amber highlighting on elevated/active
- **New random good events (3):**
  - Madrid DSS-56 antenna lock, max data rate
  - Ka-band HD video test at 20 Mbps from lunar distance
  - Wake-up song with censored audio, Wiseman quip
- **New random bad events (3):**
  - CME alert — 1,200 km/s, 36-hour ETA to Earth-Moon system
  - S-band uplink degradation — command signal drops 8 dB
  - DSN scheduling conflict — Artemis II displaces Juno and JWST antenna time
- **New scripted events (2):**
  - Day 3 Bravo: DSN handoff from Goldstone to Canberra (6 Mbps S-band at 160,000 km)
  - Day 8 Bravo: Green Bank 100m telescope radar tracking + amateur radio operators in 14 countries
- **New choice events (3):**
  - DSN Antenna Congestion — reduce data rate for science missions vs hold mission priority
  - CME Intercept Decision — shelter now vs wait for updated DONKI trajectory
  - Ka-band Gimbal Sticking — risky EVA-prep inspection vs S-band fallback vs power cycle
- **Launch screen** now mentions DSN architecture (3 stations, 120° apart) and Goldstone DSS-14 offline status
- **Design bible** — Section 6 (Mission Telemetry Panel) documenting all data fields, arrays, rotation logic, and weather strings

#### Changed
- Random event pool expanded: 10 good (was 8), 11 bad (was 8), 6 neutral (was 4)
- Choice pool expanded: 9 choices (was 6)
- Choice trigger probability raised to 22% per random shift (was 20%)
- Existing bad event "45-minute communication dropout" rewritten as DSN-specific dropout during antenna handoff

### [1.0.0] — 2026-04-05

#### Added
- **Core game engine** — single-file HTML/CSS/JS, no dependencies
- **CRT terminal aesthetic** — scanline overlay, vignette, VT323 font, phosphor glow text-shadows
- **3-shift-per-day time model** — 30 shifts across 10-day mission, matching real Mission Control capcom rotations (Alpha/Bravo/Charlie, 8 hours each)
- **Resource system** — O₂, H₂O, Food, Power, Fuel, Systems, Morale with per-shift drain scaled by difficulty
- **Vertical bar gauges** — 10-cell columns color-banded red/amber/green with numeric value and status glow
- **3 difficulty levels** — Astronaut Candidate (easy), Mission Specialist (normal), Flight Commander (hard)
- **14 scripted shift events** covering real mission milestones:
  - Day 1: Launch, toilet malfunction (with 3-option choice), split sleep with perigee burn
  - Day 2: Wake-up song, TLI burn (5m55s), first meal together
  - Day 5: Distance record broken (252,021 mi)
  - Day 6: Lunar approach, comms blackout behind Moon, far side photography
  - Day 7: Off-duty day
  - Day 10: Service module jettison / re-entry, splashdown
- **Random event pools** — 8 good, 8 bad, 4 neutral events with resource effects
- **6 choice events** — Power allocation, course correction, crew rest vs repairs, radiation shelter, urine dump timing, flywheel exercise issue
- **Toilet malfunction** — guaranteed Day 1 Bravo event based on real mission, with HYGIENE BAY ASCII art and 3 repair options
- **5 ASCII art assets** — SLS rocket (33 lines), Earth (9), Moon (9), Toilet (11), Splashdown scene (38 lines with parachute, Orion, waves, USS Portland)
- **Mission log** — chronological record of all events and decisions, viewable mid-mission
- **Scoring system** — composite of morale + average resources, 5 rating tiers
- **Real mission facts** — 35+ verified details from NASA, news coverage, and live mission trackers
- **Accurate April 1, 2026 launch date** — all 10 days mapped to real calendar dates (Apr 1–10)
- **Crew firsts** documented on launch screen (first woman, person of color, non-US citizen, oldest beyond LEO)
- **Orion callsign "Integrity"** used throughout
- **Splashdown details** — Pacific off San Diego, USS Portland (LPD-27) recovery
- **OpenGraph + Twitter Card meta tags** with 1200×630 preview image
- **Responsive design** — single breakpoint at 600px for mobile
- **Design bible** (this document) — 12 sections covering architecture, resources, timeline, events, choices, art, visual design, scoring, facts, and distribution

#### Technical Notes
- All values rounded to 1 decimal via `clamp()` to prevent floating-point display artifacts
- All animation is CSS-only (no JS animation)
- Font loading gracefully degrades to system monospace
- OpenGraph image paths are relative — must be made absolute before hosting

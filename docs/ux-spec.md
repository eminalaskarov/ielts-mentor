# IELTS Mentor – UX/UI Spec (MVP)

Language: all UI copy is English (B1-friendly: short sentences, common words). Source of truth for scope: `PRODUCT_BRIEF.md`; plan content: `ielts-plan.txt`.
Items marked **[Later]** are nice-to-haves, not MVP.

---

## 1. Principles

1. **Open → know → tap.** Today answers "What do I do now?" in one glance; the first unfinished block has one big Start button.
2. **Consistency over intensity** (golden rule 2). Never shame. A missed day gets a calm "Welcome back", not a red alert.
3. **Native iOS feel.** Tab bar, large titles, sheets, swipe actions, system font, haptics-free (PWA), Dark Mode.
4. **Offline-first.** Everything works with no network. The only network-dependent things are external links (BBC, YouTube) and updating the app.
5. **Data safety is a feature.** Backup is visible, easy, and gently repeated.
6. **Small MVP.** One component set, one color system, reused everywhere.

---

## 2. Information architecture

### 2.1 Tab bar (5 tabs, always visible except in full-screen flows)

| Tab | Icon (SF-like, simple line SVG) | Contains |
|---|---|---|
| **Today** | sun / house | Today screen (feature 1), mentor card (8), quick access to Daily quiz (2) and Settings (gear, top right) |
| **Words** | stack of cards | Vocabulary / Anki review (3), word list, add word |
| **Practice** | pencil + mic | Hub: Daily quiz (2), Writing (5), Speaking (6), Listening/Reading helpers, Test log (7) |
| **Mistakes** | flag / notebook | Mistake notebook (4) |
| **Progress** | chart | Progress (9), checkpoints and test log summary (7), roadmap, **Backup entry** (10) |

Badges on tabs: Words shows count of due cards (cap "99+"). No other badges (no clutter). Today shows a small dot only if there is an unfinished block AND it is after the user's reminder time [Later].

### 2.2 Screen map

```
Today (tab)
 ├─ Block detail (sheet)           check off, timer, resources, "Start"
 ├─ Daily quiz (full-screen flow)  → Quiz result
 ├─ Rest-day view (variant of Today)
 ├─ Settings (push)                dates, reminders, backup, about
 │    ├─ Backup & Restore (push)
 │    ├─ Notifications (push)
 │    └─ Dates & plan (push)
 └─ Golden rules (push, from mentor card / Settings)

Words (tab)
 ├─ Review session (full-screen)   → Session done
 ├─ Add word (sheet)
 ├─ Word list (push) → Word detail (sheet) / edit
 └─ (Deck stats inline on Words home)

Practice (tab)
 ├─ Daily quiz (same flow as above)
 ├─ Writing hub (push)
 │    ├─ Writing session (full-screen: prompt, timer, editor, word count)
 │    ├─ Self-assessment (sheet, 4 criteria)
 │    ├─ Task 2 structure template (sheet)
 │    └─ Essay history (push) → Essay detail
 ├─ Speaking hub (push)
 │    ├─ Speaking session (full-screen: prompt, Part 2 timer, recorder)
 │    ├─ Self-review checklist (sheet)
 │    └─ Recordings (push) → Recording detail (playback)
 └─ Test log (push)
      ├─ Add test result (sheet)
      └─ Test detail

Mistakes (tab)
 ├─ Add mistake (sheet)
 ├─ Mistake detail / edit (sheet)
 └─ Monthly review (full-screen flow)

Progress (tab)
 ├─ Skill detail (push)
 ├─ Checkpoint detail (push)
 ├─ Roadmap (push) – phases and milestones
 └─ Backup & Restore (push)  (also reachable from Settings)

Global: Onboarding (first launch only), Welcome-back card, Milestone modal, Toast, Install/Update banner.
```

### 2.3 Feature coverage

| # | Feature | Where |
|---|---|---|
| 1 | Today | Today tab |
| 2 | Daily quiz | Card on Today (when a quiz is scheduled) + Practice hub |
| 3 | Vocabulary / Anki | Words tab |
| 4 | Mistake notebook | Mistakes tab; "Log a mistake" shortcuts in quiz result, test log, writing/speaking review |
| 5 | Writing | Practice > Writing |
| 6 | Speaking | Practice > Speaking |
| 7 | Test log and checkpoints | Practice > Test log; Progress > Checkpoints |
| 8 | Mentor layer | Mentor card on Today, streak chip, Golden rules, milestone modals, notifications |
| 9 | Progress | Progress tab |
| 10 | Backup | Progress > Backup & Restore; Settings; reminders on Today |

### 2.4 Navigation rules
- Each tab keeps its own stack; tapping the active tab pops to root (and scrolls to top on second tap).
- Large title on every tab root; collapses to inline title on scroll. Pushed screens use inline title and a "‹ Back" button (text = parent title).
- Sheets: modal, rounded top corners (radius 16), grabber bar, swipe-down dismiss. Use for add/edit/self-assess. If the sheet has unsaved text, swipe-down shows a confirm ("Discard changes?").
- Full-screen flows (quiz, review, writing, speaking, monthly review) hide the tab bar, show a close "✕" top-left (confirm if progress would be lost) and progress at the top.
- Use hash/history routing so the iOS edge-swipe back gesture works in standalone mode. Do not rely on browser back buttons (there are none in standalone).

---

## 3. Visual system

### 3.1 Skill colors (WCAG AA verified)

Each skill has a **light-mode** and **dark-mode** color. Both are used as *text / icon / stroke* on the app surfaces AND as solid fills (white text on light fills, near-black text on dark fills). All values below pass 4.5:1 for normal text.

| Skill | Light mode | Contrast on #FFFFFF | Dark mode | Contrast on #1C1C1E | Icon |
|---|---|---|---|---|---|
| Listening | `#0B6BCB` | 5.28 | `#6CB4FF` | 7.79 | headphones |
| Reading | `#0F7B5F` | 5.23 | `#4CD2A8` | 8.99 | book open |
| Writing | `#C2410C` | 5.18 | `#FF9A62` | 8.14 | pencil |
| Speaking | `#B4237A` | 6.07 | `#FF84CC` | 7.64 | microphone |
| Grammar | `#6D3FD0` | 6.42 | `#B79BFF` | 7.41 | "Aa" / braces |
| Vocabulary (Anki) | `#8A6100` | 5.54 | `#F2C14E` | 10.14 | cards |
| Test | `#BE1E2D` | 6.15 | `#FF8A8F` | 7.52 | stopwatch / clipboard |
| Rest | `#5B6B7B` | 5.48 | `#9FB0C0` | 7.65 | moon |

Also verified on grouped background (#F2F2F7): all light colors >= 4.64.

Rules:
- **Color is never the only signal.** Always pair with the skill icon and the skill name text.
- Tinted backgrounds (chips, block card accent): `color-mix` at 12% (light) / 22% (dark) of the skill color over the surface. Text stays the full skill color or `--label`.
- A block card shows a 4pt left accent bar in the skill color, a 36pt circular icon tile (tint bg, skill-color icon), then the title.
- Test (red) is a skill color, not an error color. Errors use `--danger` (below) and always come with an icon + text.

### 3.2 Semantic and neutral tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` (screen) | `#F2F2F7` | `#000000` |
| `--surface` (cards) | `#FFFFFF` | `#1C1C1E` |
| `--surface-2` (nested/inputs) | `#F2F2F7` | `#2C2C2E` |
| `--separator` | `#C6C6C8` at 60% | `#38383A` |
| `--label` (primary text) | `#000000` | `#FFFFFF` |
| `--label-2` (secondary) | `#5C5C61` (6.65 on white) | `#A1A1A8` (6.63 on #1C1C1E) |
| `--accent` (buttons, links, tab selected) | `#0B5FD6` (5.80) | `#6CB4FF` (7.79) |
| `--on-accent` | `#FFFFFF` | `#0A0A0A` |
| `--success` | `#1E7A3C` (5.38) | `#5BD98A` (9.51) |
| `--warning` | `#9A5B00` (5.43) | `#FFC247` (10.58) |
| `--danger` | `#C4271B` | `#FF6B61` |

Note: accent is a neutral blue deliberately close to but not identical to Listening blue; selected tab and primary buttons use accent. Do not reuse skill colors for generic buttons.

CSS variables: implement exactly as in section 3.9.

### 3.3 Typography
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`. Learning content (English passages, prompts, essays) uses the same stack, `line-height` 1.5.
- Use `rem` and let root size scale with iOS text size: `html { font: -apple-system-body; }` fallback `17px`. All sizes in `rem` so Dynamic Type-style scaling works. Layouts must not break at 130% text; wrap, don't truncate primary labels.

| Style | Size / line | Weight | Use |
|---|---|---|---|
| Large title | 34 / 41 | 700 | Tab root titles |
| Title 1 | 28 / 34 | 700 | Section hero, result score |
| Title 2 | 22 / 28 | 600 | Card headings |
| Headline | 17 / 22 | 600 | Block titles, buttons |
| Body | 17 / 24 | 400 | Default |
| Callout | 16 / 22 | 400 | Card secondary |
| Subhead | 15 / 20 | 400 | Meta |
| Footnote | 13 / 18 | 400 | Captions (never below 13) |
| Mono digits | 28-64 | 600, `font-variant-numeric: tabular-nums` | Timers, word count |

### 3.4 Spacing, radii, elevation
- 4pt grid: `--s-1:4 --s-2:8 --s-3:12 --s-4:16 --s-5:20 --s-6:24 --s-8:32 --s-10:40`.
- Screen horizontal padding 16 (plus safe area). Card padding 16. Gap between cards 12. Section gap 24.
- Radii: card 16, button 14 (full-width) / 999 (chips, pills), input 12, sheet top 16 (use 20 for big sheets), icon tile 10.
- Elevation: avoid shadows. Cards separated by background contrast; in dark mode use `--surface`. Sheets get a 1px top hairline. Tab bar: translucent blur (`backdrop-filter: blur(20px)`) over `--bg` at 85%, hairline top.

### 3.5 Touch targets and controls
- Minimum **44 x 44 pt** for every tappable (extend hit area with padding/pseudo-element if the visual is smaller, e.g. 24pt checkbox gets 44pt hit area).
- Min gap between tappables 8.
- Primary button: height 52, full width, accent fill, headline text. Secondary: height 44, tinted (accent at 12%). Destructive: danger text, tinted background, always confirmed.
- Checkbox for blocks: 28pt circle, 2pt stroke in skill color; done = filled skill color with white (light) / near-black (dark) check, and the title gets no strikethrough (instead "Done" subtitle + muted) to keep readable.
- Segmented controls height 32 visual / 44 hit. Switches: native-looking, 51x31.
- Pressed state: 0.97 opacity or `--surface-2` highlight within 100ms. No hover-only affordances.
- Respect `prefers-reduced-motion` (no slide/scale; crossfade only). Respect `prefers-color-scheme` with optional manual override in Settings (System / Light / Dark).

### 3.6 Safe areas and standalone mode
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=default` (content under a translucent bar; we add top safe padding) – or `black-translucent` with our own top padding. Pick `default` for MVP.
- Top bar: `padding-top: env(safe-area-inset-top)`. Tab bar: height 49 + `env(safe-area-inset-bottom)` (home indicator). Bottom-fixed buttons (sheets, session footers): `padding-bottom: max(16px, env(safe-area-inset-bottom))`.
- Sides (landscape notch): `padding-left/right: max(16px, env(safe-area-inset-*))`. MVP: portrait-locked via manifest `orientation: portrait`.
- Scroll containers: `overscroll-behavior: contain`; body not scrollable; each screen scrolls inside its own container so the tab bar never jumps. `-webkit-tap-highlight-color: transparent`; `user-select: none` on chrome, allow selection in essays/prompts. Inputs `font-size >= 16px` to prevent Safari zoom-on-focus.
- Keyboard: when the keyboard opens (visualViewport), keep the focused field and the primary action visible; the tab bar is hidden in editors.
- Manifest: `display: standalone`, `theme_color` and `background_color` per scheme, 180x180 apple-touch-icon, a splash color matching `--bg`.

### 3.7 Iconography and illustration
- Simple 1.75pt stroke SVG icons (SF-Symbols-like). No emoji in UI chrome. Emoji allowed only in milestone moments (one per modal, e.g. a flame is NOT used; keep it calm – use a small tick-star shape SVG).
- Streak symbol: a simple "chain link" or flame-less ring; see 5.1.

### 3.8 Voice and tone
- Second person, active, short. "You did it." not "The user has completed".
- Never use: "You failed", "You lost your streak", "Don't give up!!!", red warning banners for missed days, exclamation marks more than one per screen.
- Numbers first, judgement never: "3 of 5 correct", not "Poor".

### 3.9 Token file (CSS variables, drop into `src/styles/tokens.css`)

```css
:root {
  color-scheme: light dark;
  --skill-listening:#0B6BCB; --skill-reading:#0F7B5F; --skill-writing:#C2410C; --skill-speaking:#B4237A;
  --skill-grammar:#6D3FD0;   --skill-vocab:#8A6100;   --skill-test:#BE1E2D;    --skill-rest:#5B6B7B;
  --bg:#F2F2F7; --surface:#FFFFFF; --surface-2:#F2F2F7; --separator:rgba(198,198,200,.6);
  --label:#000; --label-2:#5C5C61; --accent:#0B5FD6; --on-accent:#fff;
  --success:#1E7A3C; --warning:#9A5B00; --danger:#C4271B;
  --on-skill:#FFFFFF; --tint-pct:12%;
  --r-card:16px; --r-btn:14px; --r-input:12px; --r-pill:999px; --r-tile:10px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px; --s-8:32px; --s-10:40px;
  --tabbar-h:49px; --hit:44px;
  --safe-t:env(safe-area-inset-top); --safe-b:env(safe-area-inset-bottom);
  --safe-l:env(safe-area-inset-left); --safe-r:env(safe-area-inset-right);
}
@media (prefers-color-scheme: dark) {
  :root {
    --skill-listening:#6CB4FF; --skill-reading:#4CD2A8; --skill-writing:#FF9A62; --skill-speaking:#FF84CC;
    --skill-grammar:#B79BFF;   --skill-vocab:#F2C14E;   --skill-test:#FF8A8F;    --skill-rest:#9FB0C0;
    --bg:#000; --surface:#1C1C1E; --surface-2:#2C2C2E; --separator:#38383A;
    --label:#fff; --label-2:#A1A1A8; --accent:#6CB4FF; --on-accent:#0A0A0A;
    --success:#5BD98A; --warning:#FFC247; --danger:#FF6B61;
    --on-skill:#0A0A0A; --tint-pct:22%;
  }
}
/* Manual override: [data-theme="light"] / [data-theme="dark"] on <html> must replicate the two blocks above. */
```

Skill tint helper: `background: color-mix(in srgb, var(--skill-x) var(--tint-pct), var(--surface));`

---

## 4. Screens

Conventions in wireframes: `[ ]` button, `( )` radio/checkbox, `>` row chevron, `===` progress bar. Width = iPhone 390pt.

### 4.0 Onboarding (first launch only)

Purpose: set start date and exam date, explain the plan in 3 taps, ask for nothing else. 4 steps, skippable defaults, back allowed. Stored in settings; can be changed later in Settings > Dates & plan.

**Step 1 – Welcome**
```
  (safe area)
        [logo mark]
   Welcome to IELTS Mentor
   Your daily guide from B1 to
   IELTS Academic 7.0+.

   • One plan for 12 months
   • A few short blocks every day
   • Works offline. Your data stays
     on this phone.

   [ Get started ]
```
**Step 2 – Dates**
```
  ‹ Back                      2 of 4
   When do you start?
   Start date   [ Mon, 23 Nov 2026 > ]   (date wheel sheet)
   When is your IELTS exam?
   Exam date    [ Nov 2027 – pick date > ]
   helper: "Not booked yet? Pick your best guess. You can change it later."
   Suggested: exam about 12 months after start.
   [ Continue ]
```
- Defaults: start `2026-11-23`, exam empty (required, but "I don't know yet" link sets last Saturday of Nov 2027 and flags it "estimated").
- If start date is in the past: "Starting late? No problem. We'll put you on today's day of the plan." Option: "Start the plan from Day 1 today" vs "Follow the calendar" (default Follow calendar).
- If start date is in the future: Today shows a "Your plan starts in N days" preview card (see 4.1 states).
- Validation: exam must be >= 8 weeks after start; otherwise "That's less than 8 weeks. The plan needs about 12 months. Choose a later date or continue anyway." (non-blocking).
**Step 3 – Your goal**
```
   What's your target?
   Overall band   ( ) 6.5  (•) 7.0  ( ) 7.5
   University minimum per skill (optional)
   [ No minimum > ]   (stepper 5.5–8.0)
   helper: "Many universities ask for a minimum in each skill, often 6.0 or 6.5. Check yours."
   [ Continue ]
```
Default 7.0; used for the target line on charts.
**Step 4 – Reminders and install**
```
   Stay on track
   A gentle daily reminder helps.
   Remind me at  [ 19:00 > ]      (switch ON/OFF)
   [ Turn on reminders ]     [ Not now ]
   (If not installed to Home Screen on iOS:)
   "Reminders need the app on your Home Screen. Tap Share, then Add to Home Screen."  [How? >]
```
- Notification permission is requested only after the user taps "Turn on reminders" (iOS requires a user gesture and installed PWA, iOS 16.4+). If unsupported: hide the button and show the Add-to-Home-Screen hint, otherwise "Reminders are not available on this device. We'll show reminders inside the app instead."
- Finish -> "You're all set. Day 1 is ready." [ Go to Today ].

**Offline:** onboarding works fully offline.

### 4.1 Today (tab 1)

Purpose: show exactly what to do today, start in one tap, track completion, show the mentor nudge.

Layout (study day, Phase 1 Tuesday example):
```
  Today                                   (gear)
  Tue, 24 Nov · Phase 1 · Day 2

  ┌ mentor card (only when relevant) ──────────┐
  │ Welcome back. Pick up where you left off.  │
  └────────────────────────────────────────────┘

  ┌───────────────────────────────────────────┐
  │ Today's plan             ~2 h 10 min       │
  │ (ring 1/3)  1 of 3 blocks done             │
  │ [ ▶ Start: Reading · 45 min ]              │
  └───────────────────────────────────────────┘

  ┃(o) Grammar          45 min        (✓ done)
  ┃    Murphy: 2 new units + exercises
  ┃(o) Reading          45 min        ( )   ← next
  ┃    1 short article. Write down new words.
  ┃(o) Speaking         30–40 min     ( )
  ┃    Talk 3–5 min on one topic and record it

  ┌ Daily quiz · 5 questions · 4 min   > ┐
  ┌ Words due: 23 cards                  > ┐
  ┌ streak chip: 5 days   ·  Phase 1 ===== 12% ┐
  ┌ Golden rule tip  (dismissible)          ┐

  [Today] [Words] [Practice] [Mistakes] [Progress]
```
Components:
- **Header:** large title "Today"; subtitle (date, phase, day number). Gear button (44pt) -> Settings.
- **Plan card:** total planned time, completion ring, one primary button that always points to the *next unfinished block* ("Start: Reading · 45 min"). When all done: button disappears and card shows done state.
- **Block card (x2–3):** left accent bar and icon tile in skill color; skill name, duration, one-line task from plan data; checkbox at right (44pt hit). Tap the card (not checkbox) opens Block detail sheet.
- **Daily quiz card:** appears when the day has a quiz (see 4.2); shows done check once finished today.
- **Words due card:** count of due Anki cards; opens review. Present every day including Sunday (golden rule 1).
- **Progress strip:** streak chip + phase progress bar ("Phase 1 · 12% · 98 days to Feb checkpoint").
- **Golden-rule tip:** one per day, deterministic by date, dismissible with "Got it" (hidden for the rest of the day).
- Order: mentor card (if any) > plan card > blocks > quiz > words > progress strip > tip > backup reminder (if due).

Block detail (sheet, medium/large detent):
```
  ───  (grabber)
  (icon) Reading                  45 min
  1 short article. Write down words
  you don't know.
  What to do
   1. Choose an article at your level
      (BBC Learning English, News in Levels 2–3).
   2. Read once without a dictionary.
   3. Write 5–10 new words in the Words tab.
  Resources     BBC Learning English  ↗
  [ Start 45:00 timer ]
  [ Add words > ]   (links to Add word)
  ( ) Mark as done
```
- Content comes from `src/data` (methodologist). The sheet renders: title, minutes, description, steps (optional), resources (external links open in Safari via `target=_blank rel=noopener`), and *deep-link actions* by block type: Writing -> Writing session, Speaking -> Speaking session, Vocabulary/Anki -> Review, Test -> Test log, Grammar/Reading/Listening -> timer + "Log a mistake".
- **Timer** (see 6.3): optional, never required to mark done. Timer survives backgrounding (timestamps).
- Marking done: checkbox fills with a short 150ms scale; ring updates; if last block, show the "All done" state (no confetti).
- Undo: toast "Marked done. Undo" for 5 seconds. Un-checking is always allowed.
- Actual minutes: when done, `minutes = timer elapsed` if timer was used, else planned minutes. Editable in sheet ("I spent: 45 min" stepper, 5-min steps) – feeds "hours studied".

**States**
- **Loading:** skeleton blocks for <300ms; data is local so usually none.
- **All done:**
```
  ┌ (check ring, full) ─────────────────────┐
  │ All done for today                      │
  │ 2 h 10 min studied. See you tomorrow.   │
  │ Tomorrow: Grammar · Writing · Anki      │
  └─────────────────────────────────────────┘
```
  Extra optional card: "Want a little more? Review 10 extra cards" (only if words available). No pressure.
- **Partially done at day end:** the next day shows no penalty; yesterday's unfinished blocks are *not* auto-carried. Show a quiet link "Yesterday: 1 block left. Do it now? >" only once, only in Phases 1–2 [Later: configurable].
- **Rest day (Sunday; Phase 3–4 full rest):**
```
  Today                      Sun, 29 Nov · Rest
  ┌ (moon icon, rest color) ──────────────┐
  │ Rest day                              │
  │ Your brain grows while you rest.      │
  └───────────────────────────────────────┘
  ┃ Vocabulary (Anki) · 15 min   ( )
  ┃  Review your cards only.
  [ Start review · 23 cards ]
  Phase 3/4: only "Rest" with copy "Full rest today. Fatigue slows learning. See you tomorrow." + optional "Review cards anyway" (secondary).
```
  Rest completion counts as a "kept day" for the streak when Anki done (Phases 1–2) or automatically (Phase 3–4 full rest).
- **Phase 1 Saturday mini test / Phase 3 Saturday mock exam:** Test-colored block with exact timing ("2 h 40 min, no breaks") and a "Mock exam mode" hint to put the phone in Do Not Disturb. Opens Test log "Add result" when done.
- **Before the start date:** "Your plan starts on Mon, 23 Nov (in 3 days)." Show Phase 1 overview and a link "Preview Day 1". Words tab still works.
- **After exam date:** "Your exam date has passed. How did it go?" [ Add my result ] [ Plan a retake > ] [ Archive plan ]. Keep data.
- **Offline:** nothing changes. Only external-resource links show a footnote "Needs internet" when `navigator.onLine` is false, and are disabled-looking but still tappable with a toast "You're offline. Open this link when you're connected."
- **Update available:** top banner "A new version is ready. [ Update ]" (applies on tap, never auto-reloads mid-session).
- **Date/time changes:** Today recomputes on `visibilitychange` and at midnight Asia/Baku. If the day changed while the app was open, show a small pill "It's a new day. Refresh Today" -> tap (don't yank content).

### 4.2 Daily quiz (full-screen flow, from Today or Practice)

Purpose: 3–10 quick original questions matched to the day's focus (grammar topic, vocab, T/F/NG, headings...).

```
  ✕                      Question 2 of 5
  ====----------------
  Grammar · Present perfect
  Choose the correct option.

  "I ____ in London since 2019."
  ( ) live
  ( ) have lived
  ( ) am living
  ( ) lived

  [ Check ]            (disabled until one is chosen)
```
After Check:
```
  ✓ Correct            (or) ✗ Not quite
  "have lived" is correct. We use the present
  perfect with "since" for a situation that
  started in the past and continues now.
  [ Next ]
  (on wrong) [ Add to Mistakes ]  (one tap, prefilled; default cause "Didn't know the rule")
```
- Options are full-width rows, min height 56 (44 min), radio style. Correct = success border + check icon + the words "Correct"; wrong = danger border + cross icon + "Not quite"; the right answer is also outlined. Never color alone.
- Question types for MVP: multiple choice, True/False/Not Given (with short passage above, scroll), fill-in (single word/phrase typed, case-insensitive trimmed, accepts listed alternatives), matching headings (pick from list per paragraph in a sheet) [Later: ordering, drag-drop]. Keyboard for fill-in: `autocapitalize=off autocorrect=off spellcheck=false`.
- Close "✕": "Leave quiz? Your answers so far are saved." [ Keep going ] [ Leave ]. Progress is saved per question; resume goes to the next unanswered.
- **Result:**
```
        4 / 5
  Nice work. 80% correct.
  Weak spot: Present perfect (1 miss)
  ┌ Review your mistake ┐   [ Add 1 to Mistakes ]
  [ Done ]     [ Try 5 more ] (optional extra set)
```
  Tier copy (numbers first, kind words): 100% "Perfect round."; 70–99% "Nice work."; 40–69% "Good start. The mistakes below are the useful part."; <40% "This one was tough. That's how we find what to practice."
- One quiz per day counts toward the "Daily quiz" card. Retaking is allowed; only the first attempt counts for stats.
- **Empty:** "No quiz for today yet. Try a practice set instead." [ Practice set > ] (when content bank is exhausted).
- **Offline:** fully works.

### 4.3 Words (tab 2) – built-in Anki

Purpose: daily spaced-repetition review, add own words, see progress to 3000–4000.

Home layout:
```
  Words                                  (+)
  ┌ Due today ─────────────────────────────┐
  │   23 cards          New today: 5 / 20   │
  │   ~6 min                                 │
  │   [ Start review ]                       │
  └─────────────────────────────────────────┘
  Progress to 3,000 words
  [=====-----------]  412 learned
  New 38 · Learning 52 · Young 130 · Mature 192

  [ Word list > ]
  [ Add a new word > ]
  Deck filter chips:  All · Academic (AWL) · My words · Collocations
```
- "+" (44pt) opens Add word sheet. Daily new-card limit default 20 (Settings, 5–50).
- Learned = cards with interval >= 21 days (define in tooltip: "A word counts as learned when you can remember it for 3 weeks.").

**Review session (full-screen):**
```
  ✕                              12 / 23
  ====-------------------
  (collocation + context front)
           sharp increase
   "There was a ______ in prices."
   (prompt: the missing word / definition cue)
  [ Show answer ]
```
Back:
```
   increase  (noun)  /ˈɪnkriːs/   (🔊 speaker icon, device TTS `speechSynthesis`, en-GB if available)
   a sharp increase in prices
   Meaning: a rise in amount or number
   Azerbaijani (optional): artım
   [ Again 1m ] [ Hard 6m ] [ Good 1d ] [ Easy 4d ]    (labels show next interval)
```
- Rating buttons: four equal buttons, 52 high, in a row at the bottom with safe-area padding; color-neutral (Again uses `--danger` text; others `--label`) + interval subtext. Swipe gestures [Later].
- Card types MVP: (a) word in context -> reveal; (b) cloze for example sentence. Direction English->meaning by default. Typing answers [Later].
- Undo last rating: "Undo" link top right after each rating (one level).
- Session done:
```
  Review done. 23 cards in 5 min.
  Again 3 · Hard 4 · Good 14 · Easy 2
  Tomorrow: 31 cards due.
  [ Done ]   [ Learn 5 more new words ]
```
- Empty (no due): "No cards due. Nice. Learn new words or come back tomorrow." [ Add words ] [ Learn new ]
- Empty (no deck yet, first launch): the built-in starter deck (content-author) is preloaded; if none: "Add your first word. Tip: write it in a phrase, like 'a sharp increase in prices', not alone."
- Overdue pile (after missed days): never show "You have 214 overdue cards!". Cap daily reviews shown at the configured maximum (default 100) and say "Today: 100 cards. The rest will wait. No stress." Backlog is spread by the scheduler.

**Add word (sheet):**
```
  Cancel     New word       Save
  Word or phrase      [ sharp increase        ]
  Part of speech      [ noun v ]
  Meaning (English)   [ a fast rise in number ]
  Example sentence    [ Prices saw a sharp ... ]  hint: "Write a full sentence."
  Azerbaijani (optional) [ kəskin artım ]
  Tags   ( ) Academic  ( ) Collocation  ( ) From my mistakes
```
- Save disabled until word + example are present (nudge: "A sentence helps you remember. Add one?" allows saving without). Duplicate detection: "You already have 'increase'. [ Open ] [ Add anyway ]".
- Block detail "Add words" opens this sheet repeatedly (stay open with "Save and add another").

**Word list:** searchable (iOS search bar, pull down), grouped by status; swipe left = Delete (confirm), swipe right = Suspend [Later]. Word detail sheet shows card stats and Edit.

### 4.4 Practice (tab 3) – hub

Purpose: all active-skill tools in one place, ordered by today's focus.
```
  Practice
  Suggested for today
  ┌ (Writing) Task 1 · Line graph   20 min  > ┐   (from today's blocks)
  Skills
  ┌ Daily quiz                  5 questions > ┐
  ┌ Writing         Task 1 · Task 2 · history > ┐
  ┌ Speaking        Parts 1–3 · recordings     > ┐
  ┌ Test log        Add a result · checkpoints > ┐
  ┌ Golden rules                              > ┐
```
- Each row has the skill icon tile and color. Listening and Reading do not have in-app tools beyond quiz and timer in MVP (content comes from external sources: BBC, Cambridge). Show a "Timed practice" row: "Reading timer 20 min per passage / Listening timer 30 min" -> Standalone timer screen (4.9) [MVP simple].
- Suggested row = the unfinished block of today with a tool, else the weak-skill recommendation (see 5.5).

### 4.5 Writing

**Writing hub**
```
  ‹ Practice   Writing
  This week · Task 1 chart type
  [ Line graph ]  Week 1 of 6 rotation
  ┌ Start Task 1  · 20 min · 150+ words  ┐
  ┌ Start Task 2  · 40 min · 250+ words  ┐
  ┌ Task 2 structure template            >
  ┌ Essay history (7)                    >
  Phase 3+:  ┌ Full Writing 60 min (Task 1 + 2) ┐
  Tip: "Task 2 is worth twice as much as Task 1."
```
- Rotation: chart type = (ISO week index since start) mod 6 -> line, bar, pie, table, process, map. Shown on Today block text as well.

**Writing session (full-screen)**
```
  ✕  Task 2                   [ 38:12 ]
  Prompt (collapsible card, ▾)
  "Some people think ... Discuss both views and give your opinion."
  ─────────────────────────────────────
  [ editor, auto-growing textarea, autosave ]
  ─────────────────────────────────────
  Words: 187 / 250+     ====------  ⏸  [ Finish ]
```
- Prompt: from content bank (original prompts). For Task 1, text description of the data plus a simple rendered chart (SVG, original data) placed above; user must be able to pinch-zoom the chart [Later: zoom].
- Timer: counts down from 20:00 / 40:00 / 60:00 (timestamp based, see 6.3). Mode toggle at start: "Timed" (default) / "Untimed" (stopwatch up). At 5 min left: subtle label color change to `--warning` plus text "5 min left". At 0: timer shows "Time's up", editor remains editable; a banner "Finish when you're ready. Writing past the time is fine for practice." Haptic/sound none.
- Word counter: whitespace-split count; hyphenated = 1. Turns `--success` with check icon when minimum reached; below minimum shows "63 words to go". Show also "Paragraphs: 4".
- Autosave: every 2 s and on `visibilitychange`/`pagehide` to IndexedDB (draft). On reopen: "Resume your draft? [ Resume ] [ Discard ]".
- Spellcheck on (user's own writing), autocorrect off, `autocapitalize=sentences`. Paste allowed.
- Finish -> Self-assessment sheet.

**Self-assessment (sheet) – 4 official criteria**
```
  Rate your essay          (be honest; this is for you)
  Task Response (Task 1: Task Achievement)
   chips: 4 5 5.5 6 6.5 7 7.5 8     (? what does this mean)
  Coherence and Cohesion
  Lexical Resource
  Grammatical Range and Accuracy
  Checklist  ( ) Answered every part of the question
             ( ) Clear overview/position
             ( ) Each paragraph has one main idea
             ( ) Used linking words naturally
             ( ) Checked spelling, articles, tenses
  Estimated band: 6.0  (average rounded to nearest 0.5)
  Main thing to fix next time: [ text ]
  ( ) I'll ask a teacher to check this    (adds to "Needs feedback" list)
  [ Save ]    [ Add mistakes… ]
```
- "?" opens a short plain-English description per criterion with band 5/6/7 descriptors (original wording).
- Phase 3+: a persistent card "Get feedback: aim for 2 essays checked each week" with a status "1 of 2 this week" (golden rule 6, Phase 3 note). Essay detail has a "Teacher feedback" note field and "Feedback received" toggle; plus "Rewrite" button (Phase 3 Wednesday: "Rewrite with corrections" creates a new version linked to original).

**Essay history:** list (date, task, words, estimated band, feedback chip "Checked" / "Needs feedback"). Empty: "No essays yet. Your first one is a big step." [ Start Task 1 ].

**Task 2 structure template (sheet):** Introduction -> Body 1 -> Body 2 -> Conclusion, each with 1–2 sentence frames in original wording, a "Copy to editor" action [Later: insert into session].

### 4.6 Speaking

**Speaking hub**
```
  Speaking
  [ Part 1 · Questions about you ]  8–10 questions
  [ Part 2 · Talk for 2 minutes ]   1 min prep + 2 min talk
  [ Part 3 · Discussion ]           deeper questions
  [ Full test · 11–14 min ]  (Phase 3+)
  Recordings (12) >
  Tip: "Recording yourself is the fastest way to improve."
  Phase 3+ card: "Talk to a real person 2 times this week. 1 of 2 done."  [ Log a session ]
```

**Speaking session – Part 2**
```
  ✕  Part 2
  ┌ Cue card (original) ──────────────┐
  │ Describe a place you like to visit.│
  │ You should say:                    │
  │ • where it is                      │
  │ • when you go there                │
  │ • what you do there                │
  │ and explain why you like it.       │
  └────────────────────────────────────┘
  Step 1: Prepare      01:00   (notes field: optional text)
  [ Start preparing ]  → counts down, then auto-switch
  Step 2: Speak        02:00   [ ● Record ]
```
- Flow: Prepare (60 s countdown, optional notes textarea) -> "Time to speak" -> Recording (up to 2:30 hard cap, elapsed shown, remaining 2:00 target as progress ring) -> Stop -> Playback screen.
- Mic permission: pre-prompt explanation before the Safari dialog: "We need your microphone to record your voice. The recording stays on this phone." [ Allow microphone ] [ Not now ]. Denied state: "Microphone is off. Open iPhone Settings > Safari > Microphone (or Settings > [app name]) to allow it." plus "Practice without recording" option (timers only).
- Recording indicator: red dot + "Recording" text + elapsed; waveform bars (simple level meter from AnalyserNode) [Later]; at minimum an animated dot.
- Interruptions (incoming call, backgrounding) stop the recording on iOS: on return show "Recording was interrupted. [ Keep what we have ] [ Record again ]". Save chunks every 1 s (`timeslice`) so partial audio isn't lost.
- Format: `MediaRecorder` with `audio/mp4` on Safari (detect with `isTypeSupported`, fallback webm/ogg), store Blob in IndexedDB with mime type. Playback in `<audio>`/custom controls (play/pause, scrubber, 1x/0.75x speed). Unlock audio via user gesture.
- Storage guard: show size ("2.1 MB"); warn at >200 MB total: "Recordings use 220 MB. Delete old ones or export them." Per-recording delete; "Keep only the 30 newest" option [Later].

**Playback + Self-review (after each recording)**
```
  ▶ ───o──────── 01:12 / 02:05      1x
  Listen once, then check:
  ( ) I spoke for almost 2 minutes
  ( ) I explained, not just answered
  ( ) I gave a real example
  ( ) I kept going when I made a mistake
  ( ) I used some linking words (because, however…)
  My mistakes to fix  [ note + timestamps ]
  Fluency  [1–5 chips]  Vocabulary  Grammar  Pronunciation
  [ Save ]   [ Record again ]   [ Add to Mistakes ]
```
- Part 1: shows one question at a time; "Record all 10" mode records one continuous file with markers [Later: per-question files]. MVP: one recording per session with the question list visible.
- Part 3: question list per topic, same recorder.
- Offline: all works. Empty recordings: "No recordings yet. Your first one will feel strange. That's normal. It gets easier."

### 4.7 Test log & checkpoints

**Test log (Practice > Test log)**
```
  Test log                              (+)
  Next checkpoint: End of Feb 2027 · ~5.5 · in 94 days
  ┌ 12 Dec · Mini test       L 5.5  R 5.0 ┐
  ┌ ... ┐
```
**Add result (sheet)**
```
  Type  [ Listening+Reading ] [ Full mock ] [ Mini test ] [ Official ]
  Source: [ Cambridge IELTS 12, Test 3 ]  (free text, suggestions)
  Date [ today ]
  Listening  correct [ 27 ] / 40   → Band 6.5
  Reading    correct [ 24 ] / 40   → Band 6.0   (Academic table)
  Writing    estimate [ 6.0 v ]  (optional; "from self-check or teacher")
  Speaking   estimate [ 6.0 v ]  (optional)
  Overall    6.0   (shown only if all 4 present, else "Add Writing and Speaking for overall")
  Weak area  [ chips: T/F/NG, Headings, Section 4, Task 2 … ]
  Notes
  [ Save ]  → after save: "Log the mistakes from this test?" [ Add mistakes ]
```
- Band conversion uses official Academic Reading and Listening raw-score tables (methodologist data). Show the conversion live under each field. Footnote: "Band tables are approximate and can change from test to test."
- Overall = average of 4 skills rounded to nearest 0.5 (IELTS rule: .25 -> up to .5; .75 -> up to 1.0). Implemented in logic, shown in UI.
- Official results: marked with a badge "Official".

**Checkpoint card (also in Progress)**
```
  ┌ Feb 2027 checkpoint        ~5.5 ┐
  │ How to check: Cambridge test: Listening + Reading
  │ Your result: not logged yet     [ Log result ]
  │ Status: On track / A little behind / Not tested yet
```
- Statuses: "On track" (>= target), "Close" (within 0.5), "Behind" (>0.5 below, but phrase "Needs more time on …"). Text + icon + color; Behind uses `--warning` not `--danger`.
- Checkpoints: end Feb 2027 (~5.5), end Jun 2027 (6.0–6.5), end Sep 2027 (6.5–7.0), Oct 2027 (7.0+ official mock), Nov 2027 (exam 7.0–7.5). Start of "checkpoint week": Today shows a "Checkpoint week" card 7 days before each (see 5.3).
- Empty: "No tests yet. In Phase 1 you don't take full tests. Your first checkpoint is end of Feb." [ Log a practice test anyway ].

### 4.8 Mistakes (tab 4)

Purpose: fast logging with a cause, easy review, monthly review.
```
  Mistakes                               (+)
  [ search ]
  Filters (chips, scroll): All · Listening · Reading · Writing · Speaking · Grammar · Vocabulary
  Cause filter (menu): Didn't know the word …
  ┌ This month: 14 mistakes · Top cause: Misread question ┐
  ┌ Monthly review due [ Start review ] ┐
  List (grouped by date):
  ┃(Reading) T/F/NG – "Not Given" vs "False"          Misread question
  ┃  Fix: NG = the text does not say it at all.        12 Nov
```
**Add mistake (sheet)**
```
  Skill        [ chips with icons ]
  What happened?  [ short text ]            (e.g. "Chose False, answer was Not Given")
  Correct answer / correction [ text ]
  Why did it happen?   (single choice list)
     ( ) I didn't know the word
     ( ) I misread the question
     ( ) I ran out of time
     ( ) I didn't know the grammar rule
     ( ) I didn't hear it clearly
     ( ) Careless slip
     ( ) Other [ text ]
  Source  [ Cambridge 12 T3 R2 ]  (optional)
  ( ) Also add as a word card      (only for vocab/word-related; creates card)
  [ Save ]
```
- Saving takes under 20 seconds: the only required fields are skill and cause. Prefill from quiz/test flows.
- Detail sheet: edit, "Mark as fixed" (appears after review "Got it right 2 times" [Later]), delete (confirm).
- **Monthly review (full-screen):** cards one by one: show the mistake and the cause, hide the correction; "Show correction" -> [ I know it now ] [ Still tricky ]. "Still tricky" mistakes reappear next month. Ends with summary: "You reviewed 14 mistakes. Top cause: Misread question. Try: underline keywords in the question." (tip map by cause).
- **Cause chart** (donut or horizontal bars) at the top of the tab: counts by cause, tap filters.
- Empty: "No mistakes logged yet. Mistakes are useful. Log them here after every test and quiz."
- Reminder: on the 1st of each month (or first open after): card on Today "Monthly mistakes review · 14 mistakes · 10 min" (golden rule 3), also notification if enabled.

### 4.9 Timer component (shared)
- Used by: Block detail, Writing session, Speaking prep/talk, Practice timers, mock exam.
- Display: large tabular digits, label ("Reading · passage 1"), buttons Start/Pause/Reset (44+).
- Behavior in section 6.3. Visible "Ends at 19:42" subtext while running, helpful when returning.
- Alert at end: in-app: screen state + (if notifications enabled and app is backgrounded) a local notification scheduled at start ("Time's up: Writing Task 2"). Sound: single short chime via `<audio>` (works only if app foreground; iOS silent switch applies).

### 4.10 Progress (tab 5)

Purpose: show growth over 12 months; motivating, not judgmental.
```
  Progress
  [ Overview | Skills | Tests ]          (segmented)
  Overview:
  ┌ Phase 1 · Foundation · day 12 of 120 ┐
  │ ===-----------------  10%            │
  │ Next checkpoint: Feb 28 (~5.5) in 94 days │
  └──────────────────────────────────────┘
  ┌ Streak ┐ ┌ This week ┐
  │ 5 days │ │ 9h 20m    │
  │ best 12│ │ 6 of 7 days │
  └────────┘ └───────────┘
  Study time (bar chart, last 7 / 30 / all)
     stacked by skill color
  Words learned   412 / 3,000   (line)
  Band trend      line chart: your overall (and per skill toggles)
                  + dashed target line (7.0) + checkpoint markers
  [ Roadmap > ] [ Checkpoints > ] [ Backup & Restore > ] [ Golden rules > ]
```
- Segment **Skills:** per-skill row: icon, skill color, hours studied, latest band (from test log), "weakest" tag on the lowest. Tap -> Skill detail: chart over time + mistake causes for that skill + recommendation text.
- Segment **Tests:** list shortcut to Test log.
- Charts: SVG, skill colors as in 3.1, with axis labels >= 13pt, pattern or direct labels in addition to color (e.g. data labels, legend with icons). Chart cards support VoiceOver text summary ("Band went from 5.0 to 5.5 in 3 tests").
- **Empty states:** before data: ghosted placeholder chart + "Your chart appears after your first logged test." Hours chart appears after day 1.
- **Roadmap:** vertical timeline of 4 phases + checkpoints + milestones (Aug 2027 register, etc.), current position marker, tapping a phase shows its summary and goals.
- **Backup & Restore** entry row shows status: "Last backup: 3 days ago" (success tint) or "Never backed up" (warning tint).

### 4.11 Settings (from Today gear)
```
  Settings
  Dates and plan      Start 23 Nov 2026 · Exam 20 Nov 2027 >
  Target              Overall 7.0 · Min per skill 6.0 >
  Reminders           Daily 19:00 · Backup weekly >
  Appearance          System / Light / Dark
  Study                New cards per day 20 · Max reviews 100 >
  Backup & Restore    Last backup: 3 days ago >
  Golden rules        >
  About               Version 1.0 · Storage used 38 MB >
  Danger zone         [ Erase all data ]  (needs typing ERASE + export prompt)
```
- Changing start date: confirms impact: "Changing the start date moves the whole plan. Your progress and history stay." Past completion records are stored by calendar date, so they don't move.
- Exam date change updates countdowns and checkpoints "close to exam" logic.

### 4.12 Backup & Restore (feature 10)

**Screen**
```
  ‹ Settings   Backup & Restore
  ┌ Your data lives on this iPhone only ┐
  │ If you delete the app or clear Safari data, it is gone. A backup file keeps it safe. │
  Last backup   3 days ago  (check icon)   · 1.2 MB · 412 words · 38 essays
  [ Back up now ]            ← shares JSON file via iOS share sheet (Save to Files / iCloud Drive / Mail / AirDrop)
  Auto reminders: ( weekly ▾ )  (Never / Weekly / Every 2 weeks)
  ─────────────
  Restore from a backup
  [ Choose backup file ]
  Includes recordings   ( ) Include voice recordings (larger file)
```
- **Export** (`ielts-mentor-backup-2026-12-05.json`): includes settings, plan progress, cards + SRS state, mistakes, essays, test logs, streak data; schema `version` field. Recordings default OFF (large); if ON, packed as base64 or separate `.zip` [MVP: JSON only with optional base64; warn on size >50 MB]. Use `navigator.share({files})` when available; fallback to `<a download>` (opens Files save sheet in iOS Safari).
- After export: confirmation sheet "Backup created. Save it in Files > iCloud Drive so it's safe if you lose your phone." Mark `lastBackupAt` only when the share/ download action completes without cancel (best effort: when `navigator.share` resolves).
- **Import:** pick file -> validate schema & version -> **preview** ("This backup is from 12 Mar 2027: 1,204 words, 31 essays, 96 days studied") -> choose [ Replace everything ] (default, destructive style, requires confirm "Replace data on this phone with this backup? Current data will be overwritten.") or [ Merge ] [Later]. Before replacing, auto-create a safety snapshot in IndexedDB ("Undo import" available for 7 days, Settings) and offer to export current data first.
- Errors: "This file doesn't look like an IELTS Mentor backup." / "This backup is from a newer version of the app. Update the app first." / "The file is damaged. Nothing was changed."
- **Storage persistence:** call `navigator.storage.persist()` after install; show status "Protected storage: on" in About. If off/unsupported: copy explaining Safari may clear data after 7 days of non-use in the browser (not applicable to installed Home Screen apps but still warn).

**Reminders to back up (progressive, never blocking)**
| Trigger | UI |
|---|---|
| No backup after 3 days of use | Today card (dismissible): "Make your first backup. It takes 20 seconds." [ Back up now ] [ Later ] |
| Last backup > 7 days (default) | Today card: "Last backup was 8 days ago." [ Back up now ] [ Remind me tomorrow ] |
| Last backup > 14 days | Same card + Progress row tinted warning; stays until done (still dismissible daily) |
| After milestone (checkpoint logged, essay saved N=10, phase change) | Toast after save: "Great moment to back up. [ Back up ]" (max 1 per day) |
| Before risky actions (Import replace, Erase, Change start date) | Offer "Back up first" |
| Local notification (if enabled) weekly Sun 10:00 | "Time for a weekly backup. It takes 20 seconds." |
- Backup card never appears during an active session (quiz/review/writing). Only on Today/Settings/Progress.
- [Later] File System Access isn't available on iOS; no auto-save to disk. [Later] optional iCloud via user's Files "Save" each time only.

### 4.13 Golden rules (push screen)
List of 8 rules from the plan, each with an icon and one-line plain-English version and a "Why it matters" expander. Rules surface contextually (see 5.4).

1. Anki every day, even on rest days. 15 minutes. 3,000–4,000 words in 12 months is realistic.
2. Consistency beats intensity. 2 hours on 6 days is far better than 6 hours on 2 days.
3. Keep a mistake notebook. Write the reason for each mistake. Review it once a month.
4. Record your speaking. Listen, note mistakes, say it again.
5. Surround yourself with English. Phone, YouTube, series, news: about 1 extra free hour a day.
6. Get feedback on Writing and Speaking. They are the hardest and most important to improve.
7. Don't waste Cambridge tests. Save books 14–19 for Phases 3 and 4.
8. If you miss one day, don't punish yourself. Return to the plan tomorrow, but try never to miss 2 days in a row.

---

## 5. Mentor and motivation UX

### 5.1 Streak (kind version)
- **Definition:** a "kept day" = at least one planned block checked off OR Anki review completed. (Rest day Phase 1–2: Anki 15 min. Phase 3–4 rest day: kept automatically.) This is intentionally forgiving.
- **Display:** streak chip on Today ("5 days") and Progress. Counts days kept consecutively.
- **One missed day does not break the streak** (golden rule 8): the chip shows "5 days" with a small "rest" hold marker; a 2nd consecutive missed day resets the current streak to 0. Best streak is kept forever ("Best: 12 days"). Allow 1 "grace day" per 7-day window; the UI says "1 day off is okay. 2 in a row resets your streak."
- **Never** show broken-streak red states or "You lost X days". After reset: "New streak starts today. Your best is 12 days."
- 7-day week dots under the chip (filled = kept, ring = today, dash = missed, moon = rest). Each has text label for VoiceOver.

### 5.2 "Don't miss 2 days in a row" nudge
- Missed yesterday (not today yet): Today's mentor card: **"You missed yesterday. That's okay. Doing something today keeps your streak safe."** with [ Do a 15-min review ] (starts the minimum viable day: Anki + 1 block). No red.
- Missed 2+ days: **"Welcome back. Let's restart gently."** Today shows a *recovery plan*: only the first block + Anki labeled "Easy restart: about 45 min today". After 3+ days: "Welcome back. We'll skip the backlog. Today is Day N of the plan. Start with one block." Backlog is never shown as a number of missed tasks.
- Evening nudge notification (if enabled, at reminder time and only if nothing done today): "Your plan for today is ready. Even 15 minutes counts." If yesterday was also missed: "A short session today keeps your streak going." Max 1 notification per day; never after 21:30; no repeat if ignored; after 3 ignored in a row, in-app suggestion "Want to change your reminder time?" (no auto-escalation).
- Minimum viable day (MVD) concept: the "15-minute" option on Today (button in mentor card): Anki review + the shortest block. Completing it counts as a kept day.

### 5.3 Checkpoints and milestones (modal moments, max one per day)
Full-height sheet, calm illustration (simple shapes in skill colors), one headline, one number, one action. No confetti. Dismiss with "Continue".

| Moment | Trigger | Copy |
|---|---|---|
| Day 1 done | first block done | "Day 1 done. This is how a year begins." |
| 7-day streak | streak = 7 | "7 days in a row. Your routine is forming." |
| 30 / 100 / 200 / 365 days studied | cumulative days | "100 days of study. That's real progress." |
| 500 / 1,000 / 2,000 / 3,000 words | learned cards | "1,000 words learned. You can now understand much more English." |
| First recording / first essay / first test | events | "Your first recording. Listen back in a week and notice the change." |
| Phase change (1->2 Mar 1, 2->3 Jul 1, 3->4 Oct 1) | date | "Phase 2 starts today: Development. From now on, one IELTS skill every day. Your target: ~6.0–6.5." plus short "What changes" list (3 bullets). |
| Checkpoint week (7 days before) | date | "Checkpoint in 7 days. Feb 2027 target ~5.5. Plan a Cambridge test: Listening + Reading." [ Plan it ] [ Remind me ] |
| Checkpoint result logged | test log saved | On track: "You reached ~5.5. On track." Behind: "Your score is 5.0. That's useful information. We'll add more time to Reading for the next 2 weeks." |
| Halfway (day ~182) | date | "Halfway there. 6 months done." |
| Aug 2027: register for exam | Aug 1 + weekly until marked done | Card: "Register for your IELTS exam now. November spots fill fast. Choose computer or paper." [ Mark as done ] [ Remind me in 3 days ] |
| Check university requirements | Day 7 of plan (and reminder at Phase 3 start) | "Check your university's IELTS rules: overall band and minimum per skill. Many ask for 6.0–6.5 in every skill." [ Set my minimums ] -> Settings > Target |
| Application deadlines | Day 7 and Aug | "Check application dates. If they close before November, you may need to take IELTS earlier." |
| Buy a notebook | Day 1 | "Get a notebook for mistakes and words. The app helps, but writing by hand also helps memory." (optional, one-time card) |
| Last-week countdown | exam date minus 7..0 | Replaces plan on Today with the **Final week** view: 7–4 days: "1 light test a day. Review your mistake notebook. No new material."; 3–2 days: "Speaking practice and Writing templates only. Sleep well."; 1 day: "Read nothing new. Prepare your passport, check the route, go to bed early."; Exam day: "Light breakfast. Arrive 30 minutes early. Listen to English for 10 minutes to warm up. You've done the work." |
| One Skill Retake note | result lower than target (after exam) | "If one skill is lower than you wanted, you may be able to retake just that skill (One Skill Retake). Check if your test center offers it." |
- Milestones are stored as seen so they never repeat. A "Milestones" list in Progress lets the user revisit them [Later].

### 5.4 Contextual golden-rule tips
Show a single-line tip card (dismissible with ✕, 44pt hit) in context:
| Context | Rule |
|---|---|
| Words due card / Rest day | 1 |
| Streak chip/milestone, after a missed day | 2, 8 |
| After quiz/test with wrong answers; Mistakes tab empty | 3 |
| Speaking hub / before recording | 4 |
| Listening blocks / Today's footer | 5 |
| Phase 3+: Writing/Speaking hub | 6 |
| Cambridge book chosen in test log (14–19 in Phase 1–2) | 7: "Cambridge 14–19 are best saved for Phase 3 and 4." |
| Missed day | 8 |
- Max 1 tip visible per screen; same tip not repeated within 7 days; tips off in Settings [Later].

### 5.5 Behind-target recommendations
- Computation (logic by methodologist/dev): compare latest per-skill estimate (from test log or self-assessment) vs. the phase checkpoint target (Phase 1 5.5, 2 6.0–6.5 (use 6.0 as "on track", 6.5 as stretch), 3 6.5–7.0, 4 7.0). Skills below target - 0.5 are "behind".
- Display: on Today, a "Focus this week" card (only when behind and a test exists):
  **"Writing is your lowest skill (5.0). This week, spend 30 more minutes on Writing."**  [ See plan > ] [ Not now ]
  Detail screen lists 2–3 concrete steps (original wording): e.g. Writing: "Write 1 extra Task 2 essay. Ask a teacher to check one essay. Review repeated grammar mistakes." Reading: "Practise T/F/NG for 15 minutes a day. Time yourself: 20 minutes per passage." Listening: "Do one extra Section 3 or 4. Read the transcript after you finish." Speaking: "Record Part 2 three times this week. Talk to a real person once." Vocabulary: "Add 5 more words a day from your mistakes."
- The extra time is added as an optional "Boost" block to Today (marked "Extra", not required; not counted as missed).
- Tone: never "you are failing"; always a next action.
- If no test data yet: no recommendation; show "Take a checkpoint test to unlock personalised advice."
- Weak-spot detection from mistakes [Later]: top cause/skill over 30 days influences tips.

### 5.6 Notifications (local, iOS 16.4+, installed PWA only)
- Web Push needs a push service/back end. With no backend, MVP cannot deliver scheduled notifications when the app is closed unless via `Notification Triggers` (not supported on iOS). **Therefore, MVP in-app reminders (cards/badges) are the primary mechanism, and scheduled notifications are best-effort:** use `showNotification` from the service worker only while the app/SW is alive (e.g. timer end scheduled while app is open). Daily reminders at fixed times are therefore **[Later, needs push server]**. Be honest in UI: in Notifications settings show "Reminders appear when you open the app. For reminders outside the app, add an iPhone Calendar or Clock alarm." plus [ Add daily alarm help ] (instructions) and an ICS export of a daily recurring event "IELTS Mentor – study time" [nice MVP: ICS file generation, Calendar import works on iOS].
- Open question for the dev (flag): can the pwa-developer confirm there is no feasible no-backend scheduled notification path? If a tiny push server is acceptable later, spec above (copy, caps) is ready.

---

## 6. iOS PWA constraints (must-respect list)

1. **Standalone mode:** only when added to Home Screen. In Safari tab (not installed), show a one-time "Install" explainer on Today: Share icon > "Add to Home Screen". Detect `navigator.standalone` / `display-mode: standalone`. Features that need install: notifications, persistent storage, full-screen. Don't nag more than once per 7 days.
2. **Notifications:** iOS 16.4+, installed only, permission by user gesture. See 5.6 for no-backend limits. Provide the degraded path.
3. **No background timers.** JS timers freeze in background/lock. **All timers store `startedAt` (epoch ms), `durationMs`, `pausedAccumMs`, `status` in IndexedDB/localStorage; UI renders `remaining = duration - (now - startedAt - pausedAccum)`** on a 250 ms `requestAnimationFrame`/`setInterval` tick and immediately on `visibilitychange`/`pageshow`/`focus`. Never increment a counter per tick. If the app is relaunched, restore the running timer. Time over: show "Time's up" immediately on return.
4. **Writing drafts:** autosave on `visibilitychange: hidden` and `pagehide` (iOS may kill the PWA anytime).
5. **MediaRecorder:** supported on Safari 14.1+/iOS; mime `audio/mp4` (AAC). Needs user gesture + `getUserMedia`; permission may re-prompt each launch in some iOS versions. Recording stops when backgrounded/locked or when a call comes in. Show a recording banner with "Keep the app open while recording". Keep screen awake: use Wake Lock API where supported (iOS 16.4+ in PWAs) during recording/mock exams; otherwise advise "Turn off Auto-Lock for long sessions."
6. **Audio playback:** requires user gesture first; silent switch silences some web audio. Chimes are optional; visual cue is always primary. Text-to-speech via `speechSynthesis` for vocabulary pronunciation (works offline on device voices).
7. **Storage:** IndexedDB with `navigator.storage.persist()`. iOS can evict site data for non-installed web pages after 7 days of inactivity; installed apps are better but not guaranteed. Reason for backup UX (4.12). Show storage usage in Settings > About.
8. **Offline:** service worker precaches app shell + content banks (Workbox). Banner "You're offline. Everything still works." appears once per session as a small pill, not a blocking bar. Only external links and update checks need internet.
9. **Updates:** `registerType: 'prompt'`: show "New version ready. [ Update ]". Apply when no active session. Never auto reload during writing/recording.
10. **Viewport/gestures:** disable double-tap zoom via `touch-action: manipulation`; prevent pull-to-refresh with `overscroll-behavior-y: none` on root (otherwise a reload in standalone loses state); allow pull-to-search in lists via own handler [Later].
11. **Date/time:** all "today" computations in `Asia/Baku` (UTC+4, no DST). Re-evaluate at `visibilitychange`. Weeks start on Monday (plan starts Monday).
12. **Keyboard/inputs:** 16px+ font; use `inputmode`, `enterkeyhint`; avoid fixed bottom bars colliding with the keyboard: hide the tab bar while the keyboard is open.
13. **Share/Files:** exports use `navigator.share` (files) or download link; no direct filesystem write.
14. **Haptics:** unavailable. Use visual feedback only.
15. **Screen sizes:** design for 375–430 pt width (iPhone SE 3 / 13 mini to Pro Max). On SE (375x667): plan card and first block must stay above the fold with the tab bar; reduce large title spacing.

---

## 7. States checklist (apply to every screen)

| State | Rule |
|---|---|
| Empty | Friendly one-line explanation + one primary action. Never blank. |
| Loading | Local data: skeleton <300 ms, no spinners unless importing/exporting (then a determinate-or-spinner modal "Preparing your backup…"). |
| Error | Plain English, say what happened and what to do; keep user data. Example: "We couldn't save that. Your text is still here. Try again." |
| Offline | App works; external links flagged; no error banners for being offline. |
| Done | Calm confirmation, summary number, next step. |
| First launch | Onboarding (4.0), starter content preloaded, "Add to Home Screen" explainer if not installed. |
| Long content | Wrap; no truncation of block titles; two-line limit for descriptions in list with "More". |
| Dark Mode | Every screen tested; images/charts use dark variants of skill colors. |
| Accessibility | VoiceOver labels on icon buttons and charts; focus order logical; contrast per 3.1/3.2; 130% text scale safe; reduce motion. |

---

## 8. Data the UI needs from data/logic (hand-off to developer)

- `PlanDay { date, phase, weekday, blocks: Block[] }`; `Block { id, skill, minutes, title, description, steps?, resources?[], action: 'timer' | 'quiz' | 'review' | 'writing' | 'speaking' | 'test' | 'none' }`.
- `Settings { startDate, examDate, targetBand, minPerSkill?, theme, reminderTime?, newCardsPerDay, maxReviews, lastBackupAt, backupReminder }`.
- `DayLog { date, blocksDone[], minutesBySkill, quizScore?, kept }`.
- Derived: streak, grace day, hours, words learned, checkpoint status, weak skill.
- Export schema: versioned JSON of all tables.

---

## 9. MVP vs Later

**MVP:** onboarding; Today with block check-off + timers + rest/final-week variants; daily quiz (MC, T/F/NG, fill-in); Words (SM-2, add word, review, TTS); Mistakes (add, filter, monthly review); Writing (timer, word count, draft autosave, self-assessment, history, template); Speaking (Part 1/2/3 prompts, Part 2 timer, record/playback, checklist); Test log with band conversion and checkpoints; Progress (streak, hours, words, band trend with target); mentor cards, milestones, golden rules; backup export/import with reminders; Settings; Dark Mode; offline; update prompt; ICS reminder export.

**Later:** scheduled push notifications (needs server), swipe review gestures, per-question speaking files, waveform, matching-headings drag UI, merge import, chart zoom, tip toggles, weak-spot from mistakes, suspend cards, milestone history, iPad layout, landscape, home-screen widget (not possible in PWA), haptics, multi-device sync.

---

## 10. Open questions (for the user)

1. Notifications without a backend: OK to rely on in-app reminders plus an optional Calendar/Alarm (ICS) for daily nudges, or do you want a small free push server later?
2. Streak rule: is "1 grace day per week, 2 in a row resets" right, or should the streak never reset?
3. Reminder time default 19:00 — what time of day do you usually study?
4. Exam date: booked already? Computer or paper format (affects final-weeks tips)?
5. Voice recordings: keep them forever (can take hundreds of MB) or auto-delete after 60 days (export optional)?
6. Do you want Azerbaijani translations visible on word cards by default (currently optional, hidden until "Show answer")?

# Curriculum data: notes for developers

Source of truth: `docs/ielts-plan.txt`. Data lives in `src/data/`. The files are plain TypeScript with no runtime dependencies. All types are in `src/data/types.ts`, and everything is re-exported from `src/data/index.ts`.
All user-facing strings are in B1-friendly English.

## 1. Files

| File | Contents |
|---|---|
| `types.ts` | All types, plus `WEEKDAY_BY_JS_DAY` (JS `getDay()` → `'sun'…'sat'`) |
| `config.ts` | `DEFAULT_CONFIG` (start 2026-11-23, exam 2027-11-20, 09:00, Asia/Baku), `PHASE_CALENDAR`, `TASK1_ROTATION_ANCHOR` (2027-03-01), `FINAL_WEEK_DAYS`, `resolvePhaseRanges(config)` |
| `phases.ts` | `PHASES` (4 phases: dates, daily hours, target band, goals, plan notes, resources, `newWordsPerWeek`), `EXAM_FORMAT`, `OVERALL_BAND_NOTE` |
| `schedule.ts` | `SCHEDULES[phase].days[weekday]` → `DayPlan` (blocks + `quizTopics`). Block ids are `p{phase}-{weekday}-{n}` and must never change, because completion records use them |
| `rotations.ts` | `TASK1_ROTATION` + `task1ForWeek()`, `TASK2_TYPE_ROTATION`, `READING_STRATEGY_ROTATION`, `PHASE3_VOCAB_TOPICS`, `PHASE1_SPEAKING_TOPICS` |
| `grammar.ts` | `MURPHY_PLAN`, `MURPHY_SECTIONS` (approximate unit ranges), `PHASE2_HEWINGS_TOPICS` (Mon), `PHASE2_LINKER_TOPICS` (Thu), `PHASE3_ERROR_TOPICS_FALLBACK` (Fri) |
| `checkpoints.ts` | `CHECKPOINTS` (Feb / Jun / Sep / Oct mock / exam), `FINAL_RAW_TARGETS` |
| `quizTopics.ts` | `META_QUIZ_TOPICS`, `isMetaQuizTopic`, `READING_TYPE_QUIZ_TOPICS`, `resolveQuizTopics(topics, context)` (meta → concrete quiz topics, see §2a) |
| `milestones.ts` | `MILESTONES` (absolute or start/exam-relative dates), `FINAL_WEEK` stages (override days exam−7 … exam) |
| `rules.ts` | `GOLDEN_RULES` (8, with triggers), `MENTOR_RULES` (parameters + message templates), `FLEX_POLICIES`, `WEAK_SKILL_PRACTICE` |
| `bandTables.ts` | Approximate Academic Listening and Reading raw→band tables, `rawToBand`, `minRawForBand`, `roundToHalfBand`, `overallBand`, `estimateWritingBand`, `criteriaToBand` |
| `criteria.ts` | 4 Writing criteria (TA for Task 1 / TR for Task 2, CC, LR, GRA) and 4 Speaking criteria (FC, LR, GRA, P). Each has band 5–8 summaries written in our own words and a self-check list. Also `WRITING_TIPS` and `SPEAKING_TIPS` |
| `resources.ts` | `RESOURCES` / `RESOURCE_BY_ID`. The app only references books; it never reproduces them |

Blocks reference an `ActivityKind`, which tells the UI which tool to open (timer, recorder, SRS, test log…), and a `Skill` colour. The skill colours are the 8 categories from the plan legend.

## 2. Resolving "today": pseudo-code

All dates are local dates in Asia/Baku (UTC+4, no DST). Compare them as `YYYY-MM-DD` strings.

```
today = localDate(now, 'Asia/Baku')
if today < config.startDate        → PRE-START: show setup/university milestones only
if today > config.examDate         → POST-EXAM: show results milestone, keep vocab review
d = daysBetween(today, config.examDate)
if 0 <= d <= 7                     → FINAL WEEK: blocks from FINAL_WEEK stage where from >= d >= to
                                     (stage 7–4 covers d = 7,6,5,4)
phase   = the phase whose resolvePhaseRanges(config) range contains today
weekday = WEEKDAY_BY_JS_DAY[localJsDay(today)]
plan    = deepCopy(SCHEDULES[phase].days[weekday])
weekOfPhase = floor((mondayOf(today) - mondayOf(phaseRange.start)) / 7) + 1   // 1-based
weeksSinceAnchor = floor((mondayOf(today) - mondayOf('2027-03-01')) / 7)

Apply overlays in this order:
1. Checkpoint: if today == checkpoint.date (default dates are Saturdays), replace block 1
   (the Saturday test) with the checkpoint test. Feb: L+R, 90 min, Cambridge 10–13. The film block stays.
2. Fill in details per activity:
   - murphy-units      → next units from the user's pointer (2, or 3 if rule murphy-pace says behind)
   - hewings-units     → PHASE2_HEWINGS_TOPICS[weekOfPhase-1] (clamp to last item)
   - grammar-topic     → PHASE2_LINKER_TOPICS[weekOfPhase-1] (clamp)
   - grammar-own-errors→ most frequent grammar tag in mistake notebook (last 28 days, at least 3 items);
                         else PHASE3_ERROR_TOPICS_FALLBACK[(weekOfPhase-1) % 10]
   - writing-task1     → phase 2 / phase 3 Wed: task1ForWeek(weeksSinceAnchor)
                         phase 3 Fri: the chart type with the lowest average self-score (at least 1 attempt
                         for every type); otherwise the rotation type
   - writing-task2     → TASK2_TYPE_ROTATION[weeksSinceAnchor % 6]
   - reading-passage (phase 2 Thu) → READING_STRATEGY_ROTATION[(weekOfPhase-1) % 12]
   - reading-passage (phase 3 Thu) → the 2 question types with the most reading mistakes
   - vocab-topic (phase 3 Fri)     → PHASE3_VOCAB_TOPICS[(weekOfPhase-1) % 4]
   - speaking-record (phase 1 Fri) → PHASE1_SPEAKING_TOPICS[(weekOfPhase-1) % 7]
   - weak-skill / "{weakSkill}"    → computeWeakSkill() (see rule behind-target); no data → 'writing'
3. Weak-skill focus: if it is ON and the block id is in FLEX_POLICIES[phase].blockIds,
   split the block as the policy's explanation describes (keep the original task + add a weak-skill
   sub-block using WEAK_SKILL_PRACTICE[weakSkill]).
4. Monthly mistake review: on the last Friday of the month, add a 20-minute "Mistake notebook review" item.
5. Quiz: topics = resolveQuizTopics(plan.quizTopics, { phase, weekday, weekOfPhase, murphyUnitsDone,
   topReadingMistakeTypes?, topGrammarErrorTopics? }), then pick questions tagged with those topics (§2a).
```

## 2a. Quiz topics: meta → concrete

Quiz items are only ever tagged with **concrete** topics. Three topics in `DayPlan.quizTopics` are **meta** topics; no item is tagged with them and the selector must expand them with `resolveQuizTopics()` (`src/data/quizTopics.ts`, pure). `mixed-review` is concrete (items are tagged with it). The grammar tables (`MURPHY_SECTIONS`, `PHASE2_*`, `PHASE3_ERROR_TOPICS_FALLBACK`) contain only concrete topics. `src/logic/quiz.ts expandTopics()` should delegate to `resolveQuizTopics()` so there is one rule set.

| Meta topic | Phase 1 (and pre-start / post-exam) | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| `grammar-current` | `quizTopics` of the Murphy section that contains unit `murphyUnitsDone + 1` | Thu: `PHASE2_LINKER_TOPICS[week-1]`; other days: `PHASE2_HEWINGS_TOPICS[week-1]` (clamped to the last week) | top 2 `topGrammarErrorTopics` + `common-errors`; if none: `PHASE3_ERROR_TOPICS_FALLBACK[(week-1) % 10]` | top 2 `topGrammarErrorTopics` + `common-errors`; if none: `common-errors` |
| `grammar-week-review` | topics of every Murphy section touched by the last 10 units done, plus the priority sections (tenses, articles, passive, conditionals) already reached (`from <= unitsDone`). 0 units → section 1 | this week's Hewings topics + this week's linker topics | same as `grammar-current` | same as `grammar-current` |
| `reading-question-type-current` | `reading-tfng`, `reading-headings` (the plan's two hardest types) | `READING_STRATEGY_ROTATION[(week-1) % 12]`: `main` + `alwaysAlso`, mapped with `READING_TYPE_QUIZ_TOPICS` | top 2 `topReadingMistakeTypes` (mapped); if none: the phase 2 rotation rule | same as phase 1 |

`READING_TYPE_QUIZ_TOPICS`: tfng → `reading-tfng`, ynng → `reading-ynng`, headings → `reading-headings`; completion types and short answer → `vocab-word-forms` (the grammar of the gap); matching types and multiple choice → `awl` (recognising paraphrase); diagram labelling → none. The result never contains meta topics, has no duplicates, and keeps input order. If everything maps to nothing it returns `['mixed-review']`. Week = `weekOfPhase` (1-based).

Murphy sections without their own quiz topic use the closest concrete topics: modals → `common-errors`; reported speech → `tenses`; questions and auxiliaries → `tenses` + `common-errors`; -ing / to → `vocab-collocations` + `common-errors`; pronouns and determiners → `articles` + `common-errors`; adjectives and adverbs → `vocab-word-forms` + `task1-language`; prepositions → `vocab-collocations` + `common-errors`. Hewings weeks 4–5 (modals) → `task2-structure` + `common-errors`; week 9 (quantifiers) → `articles` + `common-errors`.

Content gap found while checking: `task1-overview` (phase 2 Wed, phase 3 Fri) has no quiz items yet; the content bank must add some. Every other concrete topic used in the schedules and grammar tables is realistic for a short original quiz bank.

Phase 4 blocks with `activity: 'weak-skill'` have `skill: 'test'` in the data. At runtime, show them in the colour of the weak skill.

## 3. Mentor rules: pseudo-code

The parameters and message templates are in `MENTOR_RULES`.

- **Day status** (`day-status`). On Monday to Saturday, a day is `done` if all its blocks are checked, `partial` if at least one non-rest block is checked, and `missed` if none are. Partial days count as kept. Sunday (and final-week day −1) counts as kept if the vocabulary review is done (day −1 is always kept). Days are evaluated after midnight Baku time.
- **Never 2 in a row** (`never-two-in-a-row`):
  ```
  if status(yesterday) == missed:
      show golden rule 8 + messages.afterOneMiss; mark today "must not miss"
      at 20:00, if today has nothing checked → local notification messages.eveningWarning
  if yesterday AND the day before were missed: show messages.afterTwoOrMore and offer a "minimum day"
      (block 1 + vocabulary review)
  Never move missed blocks forward. Progress-based pointers (Murphy, topics, SRS) just continue.
  ```
- **No catch-up** (`no-catch-up`). The user can tick blocks for yesterday only. Older days are read-only. If the user plans more than 1.5× today's minutes, show golden rule 2.
- **Streaks**. A single missed day followed by a kept day is shown as "saved" (golden rule 8). Two missed days in a row reset the streak. The vocabulary streak is separate and covers all 7 days.
- **Behind target** (`behind-target`):
  ```
  target = targetBand.min of the latest checkpoint (or of the current phase for the running check)
  per skill: band = checkpoint result, or the average of the last 3 logged tests (need ≥ 2)
  gap[skill] = target - band
  if max(gap) > 0:
      weakSkill = argmax(gap), ties → writing > speaking > reading > listening
      weakSkillFocus = ON until the next checkpoint (re-evaluated after every logged test)
      if overall gap >= 1.0 → also show messages.bigGap
  else → messages.onTrack, focus OFF
  ```
  Also check `config.targetMinPerSkill` (the university's minimum per part). A skill below that minimum counts as behind even when the overall band is on target.
- **Checkpoint** (`checkpoint-due`). Remind 7 days before. A result logged inside `window` counts. If nothing is logged by `window.end`, show "missed — do it on your next study day".
- **Monthly mistake review**. Due on the last Friday of each month and visible for 7 days. Show the top 3 causes and the top 3 skills from the last month.
- **Feedback quota** (phase 3 and later). Count essays marked "got feedback" and live speaking sessions per Monday–Sunday week. The target is at least 2 of each. Remind on Thursday if a count is 0.
- **Test book guard**. Logging a Cambridge 14–19 test in phase 1 or 2 asks for confirmation (golden rule 7). Track book and test number to avoid repeating a test.
- **Murphy pace**. Expected units = 145 × (Mon–Thu sessions so far / all Mon–Thu sessions in phase 1). If the user is 4 or more units behind, suggest 3 units per session instead of 2.
- **Vocabulary load**. If more than 200 cards are due or retention is below 80%, today is review only (no new words).
- **Golden rule of the day**. Pick the rule whose trigger matches today's context first. Otherwise rotate through the rules that have the `daily-rotation` trigger.

Milestones: a relative `showFrom` / `dueBy` is resolved as `config.startDate + days` or `config.examDate + days`. Milestones with `requiresAction` stay visible until the user ticks them, and show as overdue after `dueBy`. `onlyForFormat` filters milestones by `config.examFormat`.

## 4. Assumptions and ambiguities (my interpretations)

1. **Exam date.** The plan only says "November 2027". The default is Saturday **2027-11-20**, and the user can change it. Phase 4 ends on the exam date. If the exam is moved earlier (for example because of an application deadline), `resolvePhaseRanges` cuts the later phases short, and the final week still applies.
2. **Phase boundaries** are fixed calendar months: Mar 1, Jul 1 and Oct 1. Only the phase 1 start (`startDate`) and the phase 4 end (`examDate`) can be configured. Phase 3 starts on a Thursday, so its week 1 is a short week.
3. **Murphy pace.** The schedule table says 2 units a day on Mon–Thu (8 units a week), but the plan's resource note says about 10 units a week finishes the book in February. My reconciliation: 2 units is the default, 3 when behind pace, and the target is all 145 units by Feb 28. Murphy unit ranges are approximate (5th edition), and the app tracks a unit pointer, not topics by number. Leftover units carry into early March as optional work.
4. **Hewings in phase 2.** The plan only says "Advanced Grammar in Use". I wrote an 18-week topic sequence (Monday) and a complex sentences / linkers sequence (Thursday). The user finds the matching units in their own edition.
5. **Task 1 rotation** starts the week of **2027-03-01** and runs continuously (6-week cycle) through phases 3 and 4. Phase 1 has no Task 1.
6. **Task 2 essay types, reading question-type rotation, phase 3 error-topic fallback and extra phase 1 speaking topics** are my additions *inside* existing blocks. They do not change the schedule.
7. **Sunday in phase 3.** The plan says "full rest", but golden rule 1 says to review vocabulary even on rest days. I kept the 15-minute vocabulary review on every Sunday.
8. **Minutes the plan does not give** are marked `minutesAssumed: true`: phase 1 Sat mini test 30 min, phase 2 Sat TED 30 min, phase 3 Sat analysis 40 min, phase 4 afternoon blocks 45 min, final-week blocks. Where the plan gives a range ("30–40 min"), `minutes` is the lower value and `minutesMax` the upper.
9. **Checkpoint dates.** "End of month" is set to the last Saturday (Feb 27, Jun 26, Sep 25). The October official mock is **deliberately not** the last Saturday: it is Sat **Oct 23**. The plan says "October 2027", not "end of October". Official mock results and Writing/Speaking feedback can take several days, and Oct 23 leaves about 3 weeks of phase 4 practice to act on them before the final week (exam − 7 = Nov 13 by default). Oct 30 would leave only 2 weeks. The window covers the whole of October, because the real mock date depends on the test centre. Each checkpoint replaces that Saturday's normal test. For the Feb check I used Cambridge 10–13 (rule 7 reserves 14–19).
10. **Not enough tests.** The plan uses far more tests than books 10–19 contain (16 + 24 tests). Phase 3 alone uses about 3 Listening and 2–3 Reading tests a week. I added an "other practice tests" resource for weekday practice, so that Cambridge 14–19 lasts for Saturday mocks and phase 4.
11. **New words per week** (50 / 80 / 80 / 0) is an assumption chosen to reach the plan's 3000–4000 words. It works out to roughly 3,100 words plus the user's own additions. Phase 4 has "no new material", so it is review only.
12. **Monthly mistake review** is due on the last Friday of the month. The plan only says "once a month".
13. **Flex blocks** (used to give more time to the weak skill) are my choice. I picked low-cost blocks (word-card review time, Saturday passive listening) so the plan's structure stays the same.
14. **Band tables** are the commonly published approximate Academic tables (Listening 18–22 = 5.5, 23–25 = 6.0, 26–29 = 6.5, 30–31 = 7.0, 32–34 = 7.5; Academic Reading 19–22 = 5.5, 23–26 = 6.0, 27–29 = 6.5, 30–32 = 7.0, 33–34 = 7.5). I checked them again and they are correct. They match the plan's numbers (L 30→7.0, 32→7.5; R 30→7.0, 33→7.5). The Writing estimate uses Task 2 × 2, which is approximate. Self-scores from criteria are rounded **down** on purpose, to stay cautious.
15. **Exam-day details.** The plan says to arrive 30 minutes early. Centres often ask for earlier arrival, so the text says "at least 30 minutes, check your centre's time". Speaking may be on a different day from the written test, so `config.speakingTestDate` is optional. The final week is anchored to the written exam date.
16. **Derived milestones** (`derived: true`): find a feedback teacher or partner in June, re-check requirements in July, book the official mock in September.
17. **Checkpoint raw targets vs band tables.** `bandTables.ts` is the source of truth. Invariant: `rawToBand(skill, rawTarget.min) == targetBand.min` and `rawToBand(skill, rawTarget.max) == targetBand.max` for both Listening and Academic Reading. The plan's Feb range "20–23 (~5.5)" follows the same pattern as June (23–27 → 6.0–6.5) and September (27–30 → 6.5–7.0): it runs from inside the band up to the first score of the next band. So 20–22 ≈ 5.5 and 23 ≈ 6.0. Feb is stored as `targetBand 5.5–6.0`, and the text says "23 is already about 6.0". The behind-target rule still uses `min` = 5.5. The plan gives no raw scores for the October mock, so I use 30–33 (≈ 7.0–7.5 in both tables; Reading 32 is still 7.0).

## 5. Open questions for the user

- What is the exact exam date and format (computer or paper)? Is there a university application deadline before November?
- Which edition of Murphy do you have (unit numbers)? Will you use Oxford Word Skills or English Vocabulary in Use?
- Which Cambridge IELTS books will you have? Is Cambridge 20 available to you, and do you want it added to the "reserved for phases 3–4" group?
- Do you want the 15-minute vocabulary review on phase 3 Sundays, or a completely free day?

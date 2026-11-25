# IELTS Mentor — Product Brief

Single source of truth for every agent on the team. Read this and `docs/ielts-plan.txt` before any work.

## The user
- One learner, Azerbaijani speaker, current level **B1**.
- Goal: **IELTS Academic 7.0–7.5** for university admission.
- Timeline: **November 2026 → November 2027** (official exam at the end).
- Uses the app daily on an **iPhone** for a full year. The app is their mentor.

## What the app is
A personal, offline-first **PWA** (Progressive Web App) installed on iPhone via Safari → "Add to Home Screen".
It turns the 12-month plan in `docs/ielts-plan.txt` into a daily guided routine: what to do today, practice/quizzes,
vocabulary review, mistake tracking, progress and checkpoints.

## Hard constraints (decided by the user)
- **Platform: PWA only.** No native Swift, no React Native, no App Store. Dev machine is Linux (no Xcode).
- **No AI / no paid APIs.** Writing & Speaking feedback is done with self-check rubrics, checklists, model answers,
  and reminders to get human feedback (teacher/iTalki/Cambly) as the plan requires. Keep code structured so an AI
  feedback module *could* be added later, but don't build it.
- **No backend required.** All data on device (IndexedDB). Static hosting (GitHub Pages / Netlify).
- **UI language: English.** All screens, buttons, messages, explanations and learning content are in English
  (decided 2026-11-25; replaces the earlier Azerbaijani-UI decision). Vocab cards may keep an optional Azerbaijani
  translation field as a learning aid.
- **No copyrighted content.** Don't copy Cambridge IELTS tests, Murphy/Hewings exercises, etc. The app *references*
  those books (e.g. "Murphy units 12–13 today") and tracks completion; all in-app quiz content must be original.
  The Academic Word List (Coxhead) headwords may be used.

## Core features (derived from the plan)
1. **Today screen** — date-aware: detects current phase (1–4) and weekday, shows the day's 2–3 blocks with
   durations and skill colors (Listening, Reading, Writing, Speaking, Grammar, Vocabulary/Anki, Test, Rest).
   Each block can be checked off. Sunday = rest + 15 min vocab review.
2. **Daily quiz** — short original quiz every day matched to the phase and the day's focus
   (grammar topics: tenses, articles, passive, conditionals, complex sentences, linkers; vocab; T/F/NG; headings…).
3. **Vocabulary (built-in Anki)** — spaced repetition (SM-2 or FSRS-like), words learned *in context*
   (collocation + example sentence), user can add own words. Daily review even on rest days.
   Target: 3000–4000 words in 12 months; AWL in phase 2+.
4. **Mistake notebook** — log each mistake with skill, cause ("didn't know word", "misread question",
   "ran out of time", …), and correction. Monthly review reminder.
5. **Writing** — timers (Task 1: 20 min/150+ words, Task 2: 40 min/250+ words), word counter, the weekly Task 1
   chart rotation (line → bar → pie → table → process → map), Task 2 structure template, self-assessment by the
   4 official criteria, history of essays.
6. **Speaking** — Part 1/2/3 prompts, Part 2 timer (1 min prep + 2 min talk), voice recording with playback
   (MediaRecorder in Safari), self-review checklist.
7. **Test log & checkpoints** — record Listening/Reading raw scores (convert to band), Writing/Speaking estimates;
   checkpoints: Feb 2027 ~5.5, Jun 2027 ~6.0–6.5, Sep 2027 ~6.5–7.0, Oct 2027 mock 7.0+, Nov 2027 exam.
   If behind target → app recommends more time on the weak skill.
8. **Mentor layer** — streaks, "don't miss 2 days in a row" rule, the 8 golden rules surfaced contextually,
   milestone reminders (register for exam in Aug 2027, check university requirements, final-week countdown),
   local notifications where iOS allows (home-screen PWA, iOS 16.4+).
9. **Progress** — per-skill charts, hours studied, words learned, band trend vs. target line.
10. **Backup** — export/import all data as JSON (critical: a year of data must not be lost).

## Tech defaults
- Vite + TypeScript + React, `vite-plugin-pwa` (Workbox), Dexie (IndexedDB), date handling in `Asia/Baku`.
- Tests: Vitest (logic) + Playwright WebKit with iPhone device emulation (UI/PWA).
- Plan schedule and content live as **typed data files** (`src/data/…`), not hard-coded in components.
- Start date configurable (default 2026-11-23); exam date configurable.

## User decisions (2026-11-25)
- **Exam date:** keep default 2027-11-20 (configurable). Format unknown — don't assume computer vs paper.
- **Books:** user owns no editions yet and will get whatever the app names. Recommend specific current editions
  (Murphy *English Grammar in Use* 5th ed., Hewings *Advanced Grammar in Use*, *English Vocabulary in Use*
  Upper-Intermediate/Advanced, Cambridge IELTS Academic 14–20) and point to legal sources (purchase/e-book,
  official free practice tests from British Council / IDP / IELTS.org). Book unit ranges in data assume these editions.
- **Phase 3 Sundays:** keep the 15-minute vocabulary review.
- **Study time:** varies day to day — no fixed study time. No default reminder time; never nag by clock.
- **Speaking recordings:** auto-delete 24 hours after recording (optional "Save to Files"/share before it expires).
  Keep only the self-review checklist results permanently.
- **Notifications:** off. No push, no ICS/alarm nudge in MVP; in-app reminder cards only.
- **Streak rule, word-card translation display:** use the ux-spec defaults.

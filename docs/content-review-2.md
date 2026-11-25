# Content review 2: pass A + pass B (IELTS accuracy)

Reviewer: ielts-methodologist. Date: 2026-11-25. Scope: everything in `src/content/` that was added or changed since `content-review.md`. That covers pass A (fix pass plus appended items, `quiz-task1.ts` and `vocab-extra.ts`) and pass B (`quiz-phase34.ts`, `vocab-phase34.ts`, `speaking-phase34.ts` and `writing-phase34.ts`).

Item IDs were taken from the built bundle (`index.ts`, bundled and dumped to JSON), so every ID below is the one the app actually uses.

**Bank size now:** 1,100 quiz items, 795 vocab cards, 72 speaking prompts and 42 writing prompts.

**What was checked**

| Area | Checked | How |
|---|---|---|
| Earlier fixes | every `wrong answer` and `ambiguous` row, plus every `minor` row | item compared with the exact fix text; the wr-0005 and wr-0007 models were diffed against Appendix A and B |
| New TFNG / YNNG / headings | **all 175** (107 TFNG, 26 YNNG, 42 headings) | each key checked under real IELTS logic (contradiction for F/N, absence for NG) |
| Pass B common-errors and linkers | **all 80** (47 + 33) | checked that only one option is defensible and that the explanation is right |
| New gap items | **all 86** (65 pass A, 21 pass B) | checked for missing valid alternatives |
| Model answers | **all 14 new** (wr-0102, wr-0103 and 12 in wr34) | word count, overview, every data claim against `dataDescription`, band level, accuracy of the notes |
| AWL flags | **all 63 flagged and 106 unflagged cards in vocab-extra; all 257 cards in vocab-phase34** | compared with the Coxhead 570 headword list, including family members (for example unprecedented belongs to precede, globalisation to globe) |
| translationAz | **all 59** (only v-1001 to v-1130 have one; vocab-phase34 has none) | checked one by one |
| Rest of the new grammar and vocab | about 560 quiz items and 426 vocab cards were read in full (far more than the 200 requested) | — |
| Speaking | all 32 sp34 prompts | format and realism |

**Severity scale** (same as review 1, with one clarification)
- **wrong answer**: the keyed answer is wrong, no option is correct, the instruction cannot be followed, a model answer misreports its data or fails the word minimum, **or the explanation contradicts the key**. The last case is new: the feedback tells a learner who answered correctly that the keyed option is the bad one.
- **ambiguous**: a second answer is defensible, or a valid alternative is missing from a gap item.
- **minor**: wording, naturalness, CEFR or phase tag, AWL flag, explanation clarity or metadata.

**Fix rule (unchanged):** IDs come from position. Edit items in place only. Never insert, delete or reorder. Changing the `phase`, `cefr`, `awl` or `explanation` fields does **not** change an ID, so all fixes below are safe.

---

## 1. Earlier fixes: verification

Every `wrong answer` and `ambiguous` row in `content-review.md` was applied correctly:

| Item id | Earlier severity | Status |
|---|---|---|
| q-vocab-word-forms-0004 | wrong answer | Applied exactly (prompt "...are very friendly. (person)", key "people", new explanation). |
| q-tenses-0015 | wrong answer | Applied exactly ("I ___ my manager in five minutes", key "am meeting"). |
| q-tenses-0035 | wrong answer | Applied exactly ("Use one word" removed). |
| wr-0007 | wrong answer | modelAnswer is word for word Appendix A (159 words). Last note replaced. |
| wr-0005 | wrong answer | modelAnswer is word for word Appendix B (185 words). Note 3 replaced. |
| q-tenses-0011, 0014, 0017, 0034 | ambiguous | All applied exactly. |
| q-articles-0014, 0015 | ambiguous | Both replaced exactly (Pacific; "sent to prison"). |
| q-conditionals-0002, 0003, 0016, 0019 | ambiguous | All applied exactly ("'ll" fixed in 0016; could/might added in 0019). |
| q-mixed-review-0008, 0012 | ambiguous | Both applied exactly. |
| q-task1-language-0002 | ambiguous | Applied exactly. |

The `minor` rows were also applied: the tenses, conditionals, linkers, collocations, topic-vocab and AWL-suffix fixes, exam-strategy-0005, passive-0012, the headings 0004 to 0006 CEFR change, the AWL_EXTRA post-map (all 31 cards now flagged), all 16 vocab definition and collocation fixes, the wr-0003 note, the wr-0012 data and the wr-0101 example.

Two items were fixed a little differently from my wording, and both versions are correct:
- **q-linkers-0008:** reworded to "...two well-known cases".
- **q-conditionals-0023:** now also accepts "gets" and "is".

No regressions were found.

---

## 2. New items: findings

### 2.1 Wrong answer: the explanation describes the wrong option (12)

**Root cause.** Pass B wrote "Option 2 / option 3 ..." in explanations, counting the options in the authored order. For headings, the `hd()` helper ignores its `_k` argument and rotates the correct heading to a new position. For several MCQs, the numbering was written as if the correct option were not in the list. The result: the explanation often calls **the keyed answer** "detail only", "repeats the title" and so on.

**Rule for authors:** never refer to options by number. Quote the option text instead.

| Item id | Problem | Exact fix (new `explanation`) | Severity |
|---|---|---|---|
| q34-reading-headings-0004 | "option 2 is wrong" points at "Why workers choose to live far from the centre". The shop-sales option is option 1. | `The paragraph is about the results of the congestion charge. "A fall in shop sales" is wrong because footfall actually increased; the other headings are minor or missing details.` | wrong answer |
| q34-reading-headings-0020 | "option 3 is wrong", but option 3 is the **key**. The falling-temperature option is option 4. | `The paragraph is about the effect on fishing communities. Boats and nets are only a detail, and "A fall in sea temperature" is wrong because the sea is getting warmer.` | wrong answer |
| q34-reading-headings-0024 | "option 2 is too extreme" points at "The reasons learners dislike reading". The dictionary option is option 1. | `The paragraph is about how many words are needed. "Why dictionaries should never be used" is too extreme, because dictionaries are still advised for important words.` | wrong answer |
| q34-task1-overview-0001 | It says "Option 2 gives only details", but option 2 is the **key**. | `A good overview states the main trends and the comparison without detailed numbers. "In 2010, Country A exported 20..." gives only details, "...a very good result for the country" gives an opinion, and "The graph shows exports..." only repeats the title.` | wrong answer |
| q34-task1-overview-0004 | It says "option 3 gives a reason", but option 3 is the **key**. | `The overview highlights the most important change. "Food was 35%..." only lists figures, "Spending changed a lot because people earned more money" gives a reason that is not in the data, and "There are six categories" is not a key feature.` | wrong answer |
| q34-task1-overview-0007 | It says "option 4 repeats the title", but option 4 is the **key**. | `A map overview describes the general change (rural to developed). "In 1980 there was a farm..." is a detail, "The village is much better now" is an opinion, and "The maps show a village in two different years" repeats the title.` | wrong answer |
| q34-task1-overview-0011 | It says "option 4 is detail only", but option 4 is the **key**. | `The best overview mentions all the main trends. "X rose." leaves out two lines, "The lines are different from each other" is too vague, and "X rose from 10 to 50" is detail only.` | wrong answer |
| q34-task1-overview-0013 | It says "Option 2 copies the title", but option 2 is the **key**. | `The correct option paraphrases the title with new words (illustrates, proportion, owned). "The graph shows the percentage of households with a car, 2000-2020" copies the title, "Cars are very common today" is off-topic, and "I will describe" is not suitable.` | wrong answer |
| q34-task1-overview-0015 | "Options 2 and 3 are opinions or guesses": option 3 is a plain fact, and the opinion is option 1. | `A key-feature statement picks out the exception in the data. "The worst country for tourism" is an opinion, "probably spent more on advertising" is a guess, and "All five countries earn money from tourism" is too obvious to be a key feature.` | wrong answer |
| q34-task1-overview-0016 | It says "option 3 is just detail", but option 3 is the **key**. | `The best overview includes both trends and the point where they cross. "Tea sales fell and coffee sales rose" leaves out the crossing, "Tea fell from 90 to 40..." is just detail, and "Both drinks changed a lot" is too vague.` | wrong answer |
| q34-task1-overview-0021 | It says "Option 2 is wrong about the city", but option 2 is the **key**. | `City A's rent tripled (+600), the biggest rise. The City C option names the wrong city, "Rents fell in City C" is false, and "City A had the highest rent in 2000" is false (City C had the highest).` | wrong answer |
| q34-task2-structure-0003 | It says "Option 2 is too general", but option 2 is the **key**. | `A good topic sentence states one clear main idea that the paragraph will develop. "Online learning is good" is too general, "I like online learning because I use it" is personal, and "In this paragraph I will talk about..." is an announcement.` | wrong answer |

All the other "option N" references were checked and are correct: q-passive-0012, q34-reading-headings-0019 and q34-reading-headings-0029.

### 2.2 Ambiguous (7)

| Item id | Problem | Exact fix | Severity |
|---|---|---|---|
| q-tenses-0045 | "Next year I **am** thirty" is natural British English (present simple for a fixed future fact, as in "I'm 30 next month"), but it is marked wrong. | Replace option 1 `am` with `was`. Options: `["was", "would be", "will be", "have been"]`, answerIndex 2. | ambiguous |
| q-linkers-0015 | "The hotel was cheap. **However**, it was very clean." is natural: a concession against the expectation that cheap means dirty. | Replace option 1 `However` with `For instance`. Options: `["For instance", "On the contrary", "Otherwise", "In addition"]`, answerIndex 3. | ambiguous |
| q34-linkers-0023 | "The experiment failed to produce results. **However**, the team repeated it with new equipment." is natural (failure, yet they did not give up). | Replace option 2 `However` with `Likewise`. Options: `["Subsequently", "Likewise", "Whereas", "Instead of"]`, answerIndex 0. Explanation: `"Subsequently" means "after that" and shows the order of events.` | ambiguous |
| q34-vocab-collocations-0015 | "a growing **amount** of evidence" is common, correct English, but it is marked wrong. | Replace option 3 `amount` with `level`. Options: `["bundle", "number", "level", "body"]`, answerIndex 3. | ambiguous |
| q-task1-language-0033 | Gap "(very fast; 7 letters)": "quickly" and "swiftly" also have seven letters and are correct. | answers `["sharply", "rapidly", "steeply", "quickly", "swiftly"]` | ambiguous |
| q34-reading-tfng-0016 | Keyed T for "Removing the entrance fee **caused** a large increase". The passage only says numbers rose "when" the fee was abolished. The app teaches the cause-versus-correlation trap elsewhere (q-reading-tfng-0049, q34-reading-tfng-0056), so a well-trained learner will answer NG. | Statement: `Visitor numbers rose sharply in the first year after the entrance fee was removed.` Keep answer T. Explanation: `Numbers "rose by 60 per cent in the first year". The statement reports the timing and size of the rise, which the text gives, so it is True.` | ambiguous |
| q34-reading-tfng-0034 | Keyed T for "Businesses in the suburbs have gained **from** the increase in home working". The passage says only "at the same time", so the cause is not stated, which is the same trap as above. | Statement: `Some shops and restaurants in the suburbs have seen their sales rise.` Keep answer T. Explanation: `"Shops and restaurants in suburbs have reported higher sales." Be careful: the text says this happened "at the same time"; it does not say that home working caused it.` | ambiguous |

### 2.3 Minor: quiz items (11)

| Item id | Problem | Exact fix | Severity |
|---|---|---|---|
| q-reading-ynng-0009, 0010, 0011, 0012, 0017, 0018, 0021 | The statements or explanations call the writer "she/her", but the passages never give a gender. Real IELTS says "the writer". | 0009 statement: `...brought only benefits to the writer's town.` 0012: `The writer has lived in the town for more than twenty years.` 0017: `The writer gets most of their news from social media.` 0018: `...would suit the writer's city.` 0021: `...most people in the writer's city own a car.` In all seven explanations, replace "She / she / her" with "The writer / the writer / the writer's". | minor |
| q34-reading-ynng-0001, 0003, 0009 | The explanations say "he/his" for a writer with no stated gender. | Replace "he"/"his"/"He" with "the writer"/"the writer's"/"The writer". | minor |
| q34-reading-tfng-0044 | The passage contradicts itself: "engineers are **testing** alternatives: one is ... pump water uphill", then "Pumped storage is **already common**". The key F is still right, but the passage is confusing. | In `P_STORE`, replace `engineers are testing alternatives:` with `other methods are needed:`. (Items 0043 and 0045 are unaffected.) | minor |
| q-reading-tfng-0055 | Keyed F ("free panels" against "offers them loans") is defensible, but a strict NG reader could object that the text never excludes free panels as well. | In the solar passage, change `offers them loans with low interest` to `offers them low-interest loans, which must be repaid`. Keep F. | minor |
| q34-linkers-0003 | Logic flaw: charging for bags is not an example of banning them. | Prompt: `Many countries have taken action against plastic bags. ___, shops in Britain must now charge for them.` | minor |
| q34-complex-sentences-0017 | The explanation discusses "is" and "was", which are not among the options. | Explanation: `After "suggest that" in formal English we can use the subjunctive (base form): "be". "Should be" is also possible. "Being", "was being" and "would to be" are wrong here.` | minor |
| q34-awl-0034 | The instruction gives the answer away ("Use the verb 'impose'..."). | Prompt: `Write one word: The new rules ___ restrictions on how much water farmers can use. (a verb meaning "to force a rule on people", present simple)` answers `["impose", "place", "put"]` | minor |
| q34-awl-0012, q-awl-0012, q-awl-0032 | necessarily, currently and adopt are **not** AWL words. ("adopt" is often confused with "adapt", which is AWL.) | Add the suffix ` (Useful academic word, not on the AWL.)` to each explanation, as was done for q-awl-0003, 0007 and 0008. | minor |
| q34-vocab-word-forms-0007 | "Many ___ countries" also accepts "underdeveloped", which is a valid form of "develop". | answers `["developing", "underdeveloped"]` | minor |
| q-task2-structure-0006 | An "outweigh" question is in practice an opinion question: the writer must say which side is stronger. The explanation does not say this. | Explanation: `The words "advantages" and "disadvantages" show the essay type. Because the question asks whether one side outweighs the other, you must also give a clear opinion.` | minor |
| about 20 q34 items (for example q34-common-errors-0013 and 0027, q34-vocab-collocations-0001, 0009 and 0012, q34-complex-sentences-0001, q34-task1-language-0003 and 0005, q34-task1-overview-0002, q34-task2-structure-0002, q34-vocab-word-forms-0005 and 0010) | They re-test, almost word for word, points already drilled in phase 1–2 (look forward to hearing, explain the problem to me, strike a balance, raise awareness, peaked at, dangerous...). Repeating them as spaced review is fine, but tagging them B2+/C1 is not. | No content change. Re-tag `cefr` to `B1+`/`B2` (see 3.2). In later passes, write new phase 3–4 items instead of reworded copies. | minor |

### 2.4 Minor: vocabulary (13)

| Item id | Problem | Exact fix | Severity |
|---|---|---|---|
| v-1205 adolescent, v-1207 hardship, v-1221 cluster | **Not AWL**, but flagged, because they sit in the `X_AWL` block (`vocabIds(X_AWL, 1201, 2, 'B2', true)`). These are probably among the 44 cards replaced in place, so they inherited the block's flag. | In vocab-extra.ts: `const X_NOT_AWL = new Set(['v-1205', 'v-1207', 'v-1221']);` and `...vocabIds(X_AWL, 1201, 2, 'B2', true).map((c) => (X_NOT_AWL.has(c.id) ? { ...c, awl: false } : c)),` | minor |
| v-1012 currency, v-1121 purchase | Both are AWL headwords (currency in sublist 8, purchase in sublist 2), but they are not flagged. | Same post-map approach: `const X_AWL_EXTRA = new Set(['v-1012', 'v-1121']);` and map them in the B1 and B1+ blocks to `{ ...c, awl: true }`. | minor |
| v34-0091 autonomy, v34-0127 productivity | **Not AWL** ("produce" is not on the list), but `awl: true` is set. | Remove `"awl": true` from both literals. | minor |
| v34-0028 erode, 0044 mediate, 0071 unprecedented, 0092 attainment, 0140 globalisation, 0167 empirical, 0205 disproportionately, 0214 unsustainable, 0215 unfounded, 0247 deregulation | These are AWL headwords or Coxhead family members (erode, mediate, empirical; precede, attain, globe, proportion, sustain, found, regulate), but they are not flagged. | Add `"awl": true` to these 10 literals. | minor |
| v-1205 adolescent | "a teenage adolescent" is a tautology. | collocations `["troubled adolescents", "young adolescents"]` | minor |
| v34-0014 comprise | "be comprised of" is widely treated as an error in formal writing. Teaching it to an IELTS candidate is risky. | collocations `["comprise mainly", "comprise several parts"]` | minor |
| v34-0058 utilise | "make full use of" is a synonym, not a collocation of "utilise". | collocations `["utilise resources", "fully utilise"]` | minor |
| v34-0106 obsolete | "Many typewriters became obsolete" reads oddly, because a technology becomes obsolete, not individual machines. | example `Typewriters became obsolete when personal computers spread in the 1990s.` | minor |
| v34-0146 credibility | "a source of credibility" is not a natural collocation. | collocations `["lose credibility", "damage your credibility"]` | minor |
| v34-0193 by and large | Neither collocation is real ("by and large" just repeats the headword; "accepted by and large"). | collocations `["by and large, people agree", "by and large, it works"]` | minor |
| v34-0200 conversely | "but conversely" is redundant, and the example is not a true converse (fuel against cost). | collocations `["conversely, ...", "and conversely"]`; example `Large cars use more fuel; conversely, small cars use less.` | minor |
| v-1334 in the short term | "During the next days or weeks" is too narrow, because the short term can mean months. | definition `for a short period of time in the near future` | minor |
| v-1316 fossil fuel / v34-0096 fossil fuels | This is a duplicate card in two phases. | No change needed (the phase 3 card serves as review). Optionally overwrite v34-0096 in place with a new C1 word (for example `carbon neutral`). | minor |

**translationAz (59 cards, v-1001 to v-1130): all correct.** Every rendering is natural, standard Azerbaijani (xəstə, aptek, gömrük, ipoteka, yarım ştat, manşet, sənədli film, rütubətli, növbə and so on). Two optional style notes, not counted as findings: "özü ilə aparmaq üçün yemək" (takeaway) could be shortened to `aparmaq üçün yemək`, and "qalıq yeməklər" (leftovers) is more natural as `artıq qalmış yemək`. No card was flagged as uncertain.

### 2.5 Minor: writing (5)

All 14 new model answers pass the word minimums: Task 1 ranges from 161 to 217 words, and Task 2 from 274 to 303 words, so all are at or above the 270-word margin I recommended. Each Task 1 model has a separate overview paragraph. **Every numerical claim** matches its dataDescription: multiples, crossing points, rankings, unchanged categories, and derived values such as 100 minus the female percentage. All read as solid band 7. The fixes below concern characterisation and notes only.

| Item id | Problem | Exact fix | Severity |
|---|---|---|---|
| wr34-0003 | The overview says coal went "from being the biggest source of electricity to a **minor** one". At 18 per cent, coal is still the **third largest** of five sources, so an examiner could see this as an inaccuracy. | Replace `to a minor one` with `to only the third largest`. | minor |
| wr34-0010 | "The ban on plastic bags in many countries... cut their use within months, whereas voluntary campaigns had achieved little for years" is stated as fact. This is the same issue as wr-0101 in review 1. | Replace with `Where plastic bags have been banned or taxed, their use has often fallen within months, whereas voluntary campaigns usually achieve much less.` | minor |
| wr34-0015 | The note says vocabulary includes "sedentary effects", but neither word appears in the essay. | In paragraph 2, change `Long periods of sitting are linked to` to `A sedentary lifestyle is linked to`, and change the note to `Vocabulary is topic-specific: sedentary lifestyle, type 2 diabetes, subsidised gym membership, brisk walking.` | minor |
| wr34-0005 | The note says "It does not add details that are not in the diagram", but the text adds "so that only suitable material is used". | Delete `so that only suitable material is used` from the first sentence of paragraph 3 (159 words remain, still above 150). | minor |
| wr34-0017 | One sentence is awkward: "which gives the impression of being better informed than with the daily press". | Replace with `so readers feel better informed than they would with a daily newspaper.` | minor |

wr-0102 (296 words) and wr-0103 (280 words) have clear positions, a concession that is then answered, and no invented statistics. Both pass.

### 2.6 Speaking (1)

| Item id | Problem | Exact fix | Severity |
|---|---|---|---|
| sp34-0017 to sp34-0032 | The Part 2 to Part 3 link is stored inside the `topic` string ("Education (linked to card 1)"), so the UI will show it to the learner. The links themselves are correct (card N is sp34-000N). | Contract change for pwa-developer: add an optional `linkedTo?: string` to `SpeakingPrompt`, then set `topic: "Education"` and `linkedTo: "sp34-0001"` and so on. Until then, the UI should strip the bracketed part. | minor |

The 16 Part 2 cards follow the real format (task line, 3 bullets, and an "and explain..." line). The 16 Part 3 sets now have 5 questions each and cover the right functions: speculate, compare past and present, evaluate a policy, and predict. This fixes the review 1 point about Part 3 sets having only 3 questions.

### 2.7 Checked and correct (no finding)

- **TFNG/YNNG:** all 107 + 26 other keys are correct. Every F directly contradicts the text, usually through a qualifier ("most"/"all", "up to", "some"/"every", "once believed"/"always"). Every NG truly has no information. All the "plan versus present fact" and "claim versus proof" items (q-reading-tfng-0019, 0021, 0036, 0049; q34-0021, 0041, 0056) are keyed correctly. The pass A material now includes the trap types I asked for in review 1.
- **Headings:** all 42 keys are correct. The distractors use the right trap types: a single detail, a word-match, or an extreme claim.
- **Common errors (47) and linkers (33):** apart from the rows above, every item has exactly one defensible answer and an accurate explanation. I checked the edge cases: "agree to"/"agree with", "the reason is because", "If not," as a linker, "different to" (mentioned correctly as British English), and non-defining "that".
- **Gap items:** apart from q-task1-language-0033 and q34-vocab-word-forms-0007, all 86 accept every reasonable answer. The letter-count and "starts with" hints narrow the answers correctly.
- **Exam facts:** all are correct. Reading is 60 minutes with 40 questions and no transfer time. Listening has about 30 minutes of audio, heard once. Speaking is 11 to 14 minutes, with a 1 to 2 minute Part 2. Task 2 counts double. The overall band is averaged and rounded to the nearest half. Spelling errors are marked wrong, and pencil is used on paper tests. Task 1 needs no separate conclusion. The minimums are 150 and 250 words.

---

## 3. Level progression: are phases 3–4 really harder?

**Mostly yes. Vocabulary, writing, speaking, complex grammar and headings are clearly harder. The weak spots are pass B's common-errors, word-forms, exam-strategy and task1-language sets, and the way pass B assigns `phase` and `cefr`.**

### 3.1 Evidence

| Measure | Phases 1–2 | Phases 3–4 | Verdict |
|---|---|---|---|
| Vocab CEFR | B1 157, B1+ 116, B2 205, B2+ 60 | B2+ 85, C1 172 | Clear step up. Pass B adds real C1 lexis (exacerbate, perpetuate, engender, galvanise, ubiquitous, stringent), topic chunks (digital divide, glass ceiling, gig economy) and C1 linkers and hedges (admittedly, arguably, to a certain extent). |
| MCQ/gap lexis | mean word length 4.32; 5.1% of words have 9+ letters | 4.84; 7.8% | Harder. |
| Headings paragraph length | 45 words | 70 words | Harder, with subtler distractors (detail, word-match, extreme claim). |
| TFNG passage length | 98 words, 5 statements | **84 words, 3 statements** | **Not harder in length.** The pass B traps are subtler ("experiment with" versus success, "at the same time", "once believed"), but the passages are shorter than in phase 1–2 and far from exam length (700–900 words). That is acceptable only because the plan uses Cambridge 14–19 for full tests in phases 3–4. |
| Grammar | tenses, articles, basic conditionals, relative clauses | inversion (Not until / Rarely / Had / Were it not for), clefts, mixed conditionals, subjunctive, participle clauses, "albeit"/"notwithstanding" | Clearly harder in complex-sentences and awl. |
| q34 common-errors / word-forms / task1-language / exam-strategy | — | mostly B1–B2 points (informations, depend on, more cheaper, should to, fell versus fallen, economy to economic, success to successful, Task 1 equals 150 words) | **Not harder.** They are useful as remedial review, but tagged B2+/C1. |
| Writing Task 1 | single-variable charts | a three-column table with a gender column, an 8-stage process, a map with 8 changes | Harder. |
| Writing Task 2 models | 260–296 words | 274–303 words, more precise lexis and a concession-then-rebuttal structure | Harder and closer to band 7.5. |
| Speaking | 3-question Part 3 sets | 5-question Part 3 sets linked to cue cards | Harder and more realistic. |

### 3.2 Systemic issues (fix before phase 3 starts in July 2027)

1. **The phase and CEFR tags in quiz-phase34 are mechanical, not based on difficulty.** In every q34 topic, the tags follow the fixed cycle `B2+/3, B2+/4, C1/3, B2+/4, B2+/3, C1/4`. As a result, B1-level items such as "Because of the strike..." (q34-linkers-0026) and "fell, not fallen" (q34-task1-language-0006) are tagged phase 4 / C1. Meanwhile, hard inversion items are tagged phase 3 / B2+.
   **Fix (safe, because IDs do not change):** set `phase: 3` for all 383 q34 items. Re-tag `cefr` by content: `B2` for the basic common-errors, word-forms, task1-language and exam-strategy items; `B2+` for most of the rest; `C1` only for inversion, clefts, mixed conditionals, subjunctive, "albeit"/"notwithstanding" and the C1 YNNG/TFNG passages.
2. **Phase 4 content conflicts with the plan.** `ielts-plan.txt` says of phase 4: "Yeni material öyrənmək yoxdur" (no new material). But 86 new C1 vocab cards (v34-0172 to v34-0257) and about 160 quiz items are tagged `phase: 4`. `selectQuiz` filters with `q.phase <= maxPhase`, so all of this would be new to the learner in October–November 2027.
   **Fix:** set `phase: 3` on v34-0172 to v34-0257 and on every q34 item, as in point 1. This gives about 257 new C1 cards over 13 weeks of phase 3 (about 20 per week), which fits the plan's Anki block. Writing and speaking prompts tagged phase 4 (wr34-0004/5/7/8/12/14/16/17/18, sp34-0009 to 0016 and 0025 to 0032) are exam tasks rather than new material, so they can stay in phase 4.
3. **Predictable answer patterns.**
   - In quiz-phase34, every TFNG/YNNG passage has exactly one T, one F and one NG (or Y, N, NG), and the **NG statement is always the last** (22 out of 22). Pass A is similar: NG is last in 18 of 19 passages.
   - The q34 MCQ and heading keys rotate through positions `2,1,0,3` (or `1,0,3,2`) item by item.

   Because `selectQuiz` shuffles items with `seededShuffle`, a learner rarely sees these runs in order, so the risk is low. But any future "passage set" view (all statements of one passage together) would expose the pattern.
   **Fix (pwa-developer):** when statements are shown as a passage set, shuffle their display order. Shuffle MCQ options at render time with a seed, keeping `answerIndex` mapped. No content change is needed.

---

## 4. Counts and verdict

| Severity | Count | Where |
|---|---|---|
| wrong answer | **12** | all of them are explanations that contradict the key (q34 headings and task1-overview, and one task2-structure item). **No keyed answer is wrong.** |
| ambiguous | **7** | 3 linker/tense items with a second defensible answer, 1 collocation, 1 gap missing alternatives, 2 TFNG cause-versus-correlation statements |
| minor | **30** | 11 quiz, 13 vocab (AWL flags: 5 false and 12 missing, grouped in 4 rows), 5 writing, 1 speaking |
| systemic (tracked separately) | 3 | phase/CEFR tagging in q34, phase 4 versus "no new material", predictable answer patterns |

For comparison, review 1 found 5 wrong answers in 303 items. This pass found 0 wrong keys in about 800 new quiz items. The 12 wrong-answer rows share a single root cause and are fixed by copying in the explanations from 2.1.

**Verdict:**
- **Phase 1–2 content (pass A): ready for daily use now.** The only fixes worth making before the learner reaches these items are the 3 ambiguous pass A items (q-tenses-0045, q-linkers-0015, q-task1-language-0033) and the YNNG pronoun rows. None of them blocks daily use.
- **Phase 3–4 content (pass B): accurate, but not ready until the 12 explanation fixes (2.1) and the re-tagging in 3.2 points 1–2 are applied.** The keys, passages, vocabulary and model answers are sound, and the material is clearly more advanced than phase 1–2. There is time: phase 3 starts in July 2027.

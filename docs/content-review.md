# Content review: batch 1 (IELTS accuracy)

Reviewer: ielts-methodologist. Date: 2026-11-25. Scope: `src/content/` (quiz-grammar, quiz-vocab, quiz-reading, vocab-phase1, vocab-awl, speaking, writing).
Item IDs were taken from the built bundle (`withIds` / `vocabIds` assign them by position), so the IDs below are the ones the app actually uses.

**What was checked:** all 303 quiz items (209 mcq, 72 gap, 12 TFNG, 4 YNNG, 6 headings), all 369 vocab cards, all 40 speaking prompts, and all 24 writing prompts. Model-answer word counts were measured. Task 1 data was checked against every claim in the model answers, and the AWL flags were checked against the Coxhead 570 headword list.

**Severity scale**
- **wrong answer**: the keyed answer is wrong, no option is correct, the instruction cannot be followed, or a model answer misreports its data or fails the word minimum.
- **ambiguous**: a second answer is defensible, so a learner can be marked wrong unfairly, or a valid alternative is missing from a gap item.
- **minor**: wording, naturalness, CEFR tag, explanation clarity or metadata.

**Rule for the fix pass:** IDs come from position. Edit items in place only. Never delete, insert or reorder entries inside an array. Where a fix says "replace item", overwrite the content at the same position.

## 1. Quiz items

| Item id | Problem | Suggested fix (exact text) | Severity |
|---|---|---|---|
| q-vocab-word-forms-0004 | No option is correct. "The people in the town **is** very friendly" breaks subject-verb agreement, because "people" is plural. | Prompt: `The ___ in the town are very friendly. (person)`. Keep the options and answerIndex 2. Explanation: `"People" is the plural of "person", so the verb is "are". "Personality" is a person's character.` | wrong answer |
| q-tenses-0015 | "I **have** a meeting in five minutes" is fully correct. It is actually the most natural option, yet it is marked wrong. | Prompt: `Sorry, I can't talk now. I ___ my manager in five minutes.` Options: `["meet", "am meeting", "met", "have met"]`, answerIndex 1. Keep the explanation. | wrong answer |
| q-tenses-0035 | The instruction says "Use one word", but the accepted answers are two or three words ("hasn't been" / "has not been"). A learner who follows the instruction cannot be right. | Prompt: `Write the correct verb form: She ___ (not / be) to Paris, so she wants to go next year.` Remove "Use one word". Keep the answers. | wrong answer |
| q-tenses-0011 | "have got" reads as "possess" (have got = have), so it is a confusing key. "got" is also accepted in American English. | Prompt: `I ___ three emails so far today, and I have not answered them yet.` Options: `["received", "have received", "was receiving", "receive"]`, answerIndex 1. | ambiguous |
| q-tenses-0014 | "He is tired because he worked all day" is also grammatical. | Prompt: `He is tired because he ___ since six o'clock this morning.` Keep the options and the key. | ambiguous |
| q-tenses-0017 | "The train is leaving at 6.15 tomorrow" (present continuous for an arrangement) is also acceptable. | Options: `["leaves", "leave", "left", "has left"]`, answerIndex 0. | ambiguous |
| q-tenses-0034 | "already" also works in a question ("Have you finished your homework already?"). The parenthetical hint is confusing. | Prompt: `Write one word: I haven't finished my homework ___. I will do it after dinner.` answers `["yet"]`. | ambiguous |
| q-articles-0014 | "plays guitar" with no article is normal in American English and common in British English (especially for pop or rock), so "no article" is defensible. | Replace the item: prompt `___ Pacific is the largest ocean in the world.` Options `["A", "An", "The", "No article"]`, answerIndex 2. Explanation: `We use "the" with the names of oceans and seas.` | ambiguous |
| q-articles-0015 | "taken to **the** hospital" is correct in American English and also in British English when it means a particular hospital. The explanation talks about "in hospital", which is not the phrase in the prompt. | Prompt: `He was sent to ___ prison for five years.` Keep the options and answerIndex 3. Explanation: `When we mean the purpose of the place (being a prisoner), we say "to prison" with no article. The same is true for "go to school" and "go to bed".` | ambiguous |
| q-conditionals-0002 | "If you heat ice, it **will melt**" is also correct, because first-conditional form is fine for facts. | Options: `["melts", "melted", "would melt", "has melted"]`, answerIndex 0. | ambiguous |
| q-conditionals-0003 | "If I **was** rich" is correct in everyday English. Item q-conditionals-0017 itself accepts "was", so the two items contradict each other. | Options: `["am", "were", "will be", "would be"]`, answerIndex 1. Explanation: `Second conditional: if + past simple. With "be" we often use "were" for all persons ("was" is also common in speech).` | ambiguous |
| q-conditionals-0016 | can, should, could, might and may all fit "we ___ be on time". | Prompt: `Write one word: If we leave now, we ___ be on time. (We are sure about the result.)` answers `["will", "'ll"]` (replace "ll" with "'ll"). | ambiguous |
| q-conditionals-0019 | "could" and "might" are also correct second-conditional results. | answers `["would", "could", "might"]`. Explanation: `Second conditional main clause: would (or could / might) + verb.` | ambiguous |
| q-mixed-review-0008 | "I lived in this city for five years" (finished period, I moved away) is also grammatical. | Prompt: `I ___ in this city for five years, and I still love it here.` | ambiguous |
| q-mixed-review-0012 | Backshift is optional when something is still true, so "She asked me where I come from" is correct. The hint "(come)" pushes learners towards exactly that answer. | answers `["came", "come"]`. Explanation: `In reported questions the verb usually moves back: come becomes came. ("come" is also possible because it is still true.) Note the word order: where I came from, not where did I come from.` | ambiguous |
| q-task1-language-0002 | "Sales increased **to** 20 per cent" is valid if 20 per cent is the final figure. | Prompt: `Sales increased ___ 20 per cent, from 50,000 to 60,000 units.` | ambiguous |
| q-tenses-0006 | "At 8 p.m. last night I cooked dinner" is grammatical, with a different meaning (I started at 8). The item is weakly ambiguous. | Prompt: `At 8 p.m. last night, when you phoned, I ___ dinner.` | minor |
| q-tenses-0027 | "in this company" plus a past story reads oddly. | Prompt: `Ali ___ for that company for two years when he got a new job.` | minor |
| q-tenses-0028 | The verb hint is placed after the object. | Prompt: `My sister usually ___ (drink) tea in the morning, but today she is drinking coffee.` | minor |
| q-tenses-0036 | The meaning is odd ("If you wait for me, I will call you"). | Prompt: `Write the missing word: If you ___ for me at the station, I will meet you there at six. Verb: wait.` | minor |
| q-conditionals-0004 | "passes" (zero conditional, a general truth) is weakly possible. | Prompt: `If she studies hard, she ___ the exam next month.` | minor |
| q-conditionals-0009 | "I wouldn't trust **you** if I were you" is illogical. | Prompt: `I ___ him if I were you.` | minor |
| q-conditionals-0015 | Inversion ("Should you need…") is B2-level. | cefr `B2`. | minor |
| q-conditionals-0020 | "couldn't have missed" is also valid. | answers `["wouldn't", "would not", "couldn't"]`. | minor |
| q-conditionals-0023 | "If water falls to 0 degrees" is loose wording. | Prompt: `Write one word: If the temperature ___ below 0 degrees, water turns into ice. (fall)` answers `["falls", "drops", "goes"]`. | minor |
| q-linkers-0008 | The model answer is a sentence fragment ("For example, tigers and pandas."). | Prompt: `Many animals are in danger. ___, tigers and pandas could disappear in the wild.` | minor |
| q-linkers-0011 | "whilst" (British English) is missing. | answers `["but", "while", "whereas", "whilst"]`. | minor |
| q-vocab-collocations-0014 | The strongest collocation is "strike/find a balance". "keep a balance" is weaker. | Options `["strike", "do", "carry", "make"]`, answerIndex 0. Explanation: `We say "strike a balance" (or "find a balance") between two things.` | minor |
| q-vocab-collocations-0025 | The hint "(shortage / lack-of)" is malformed. | Prompt: `Write one word: Water ___ is a serious problem in some countries. (shortage / lack)` | minor |
| q-topic-vocab-0011 | "many people" does not mean "overcrowded". | Prompt: `When too many people live in a city, it is ___.` | minor |
| q-task1-language-0004 | It asks for a "word" but the options are phrases. | Prompt: `Which phrase means "a very fast fall"?` | minor |
| q-awl-0003, q-awl-0007, q-awl-0008 | correlation, substantial and mitigate are not AWL headwords, but they sit under the `awl` topic. They are fine academic words. | Either keep them and change the explanation suffix to `(useful academic word, not on the AWL)`, or move them to a future `academic-vocab` topic. Do not re-topic in place, because that changes the IDs. | minor |
| q-exam-strategy-0005 | The advice is incomplete: Reading has no penalty for wrong answers. | Explanation: `Manage your time: move on and come back later. Never leave an answer empty at the end. There is no penalty for a wrong answer, so always guess.` | minor |
| q-passive-0012 | The explanation mixes two points. | Explanation: `"I was given a present" is the past passive (was + past participle). Option 4 is wrong because "yesterday" needs the past, not "am given".` | minor |
| q-reading-headings-0004 to 0006 | Tagged B2 / phase 2, but the language is B1+ level (as easy as 0001 to 0003). | cefr `B1+` (phase can stay 2). | minor |

**Reading (TFNG / YNNG / headings) verdict:** All 16 TFNG/YNNG keys are correct under real IELTS logic. Every NG item truly has no information (accidents, exam marks, map donors, salaries, the writer's own playing), and every F item directly contradicts the text. Each variant matches its text type: factual reports use TFNG and the opinion passage uses YNNG. All 6 heading keys are correct and the distractors are fair.
The only weakness is the difficulty level, not accuracy. Every statement can be answered by matching words. For phase 2 and later, the next batch should add items with paraphrase and qualifier traps ("all/most/only/always", cause versus correlation, a claim attributed to someone else, a future plan versus a present fact), because those are what separate band 6 from band 7.

All other quiz items (about 265) were checked and found correct, with one defensible answer and accurate explanations.

## 2. Vocabulary cards

| Item id | Problem | Suggested fix (exact text) | Severity |
|---|---|---|---|
| v-0703, 0704, 0705, 0706, 0707, 0708, 0710, 0712, 0713, 0714, 0716, 0717, 0718, 0719, 0720, 0721, 0722, 0723, 0724, 0725, 0729, 0730, 0731, 0732, 0733, 0734, 0736, 0738, 0741, 0742, 0749 | These are AWL headwords or family members but are not flagged, because `vocabIds(B2P, 701, 2, 'B2+')` has no `awl` argument. (They are: inevitable, inherent, fundamental, controversy, contradict, exploit, advocate, coincide, compensate, diminish, discriminate, dominate, fluctuate, hence, nevertheless, whereas, furthermore, consequent, contrast, instance, nonetheless, albeit, subsequent, approximate, predominant, drama, accommodate, prohibit, subsidy, insight.) The non-AWL cards in that block (mitigate, substantial, undermine, alleviate, deteriorate, persuade, stimulate, affluent, tackle, curb, thrive and others) are correctly unflagged. | Do not split the array, because that changes IDs. Add a post-map in vocab-awl.ts: `const AWL_EXTRA = new Set(['v-0703','v-0704','v-0705','v-0706','v-0707','v-0708','v-0710','v-0712','v-0713','v-0714','v-0716','v-0717','v-0718','v-0719','v-0720','v-0721','v-0722','v-0723','v-0724','v-0725','v-0729','v-0730','v-0731','v-0732','v-0733','v-0734','v-0736','v-0738','v-0741','v-0742','v-0749']);` and `...vocabIds(B2P, 701, 2, 'B2+').map(c => AWL_EXTRA.has(c.id) ? { ...c, awl: true } : c)`. | minor |
| v-0501 to v-0605 (AWL block) | All 105 flagged cards were verified as AWL headwords or family members (variable belongs to vary, financial to finance, circumstances to circumstance, motivate to motive, ultimately to ultimate). | No change. | — |
| v-0009 classmate | "a close classmate" is not a natural collocation. | collocations `["a former classmate", "an old classmate"]` | minor |
| v-0053 retire | Not everyone retires "because of your age" (for example, "retire early"). | definition `to stop working, usually because you have reached a certain age` | minor |
| v-0106 manage | The definition covers only one sense, but the collocation "manage a team" uses another. | definition `to succeed in doing something difficult; also, to be in charge of people or a business` | minor |
| v-0109 argue | The academic sense ("argue that…") is missing, and it is the sense IELTS uses most. | definition `to speak angrily because you disagree; also, to give reasons to support an opinion` / collocations `["argue with someone", "argue about money", "argue that"]` | minor |
| v-0201 compulsory | An adjective is defined as a noun ("something…"). | definition `that you must do because of a rule or law` | minor |
| v-0208 peer pressure | "suffer from peer pressure" is unnatural. | collocations `["give in to peer pressure", "resist peer pressure"]` | minor |
| v-0215 commute (verb) | "daily commute" is the noun use. | collocations `["commute to work", "commute by train"]` | minor |
| v-0232 addiction | The definition is missing the harmful or uncontrollable element. | definition `a strong need to keep doing or using something, even when it is harmful` | minor |
| v-0256 celebrity | "a famous celebrity" is a tautology. | collocations `["celebrity culture", "become a celebrity"]` | minor |
| v-0262 benefit (noun) | "benefit from" is the verb use. | collocations `["health benefits", "the benefits of"]` | minor |
| v-0515 estimate | "to guess" undersells the word. | definition `to calculate the size, cost or value of something roughly` | minor |
| v-0522 individual (noun) | "individual needs" is the adjective use, and "an individual" is not a collocation. | collocations `["each individual", "a private individual"]` | minor |
| v-0531 principle | "Equal rights is…" has uncertain agreement. | example `Equality before the law is an important principle in a democracy.` | minor |
| v-0585 perspective | "point of view" is a synonym, not a collocation. | collocations `["from a different perspective", "a fresh perspective"]` | minor |
| v-0731 albeit | Defining it simply as "although" leads to errors like "albeit it is slow". | definition `although (used before an adjective, adverb or short phrase, not a full clause)` | minor |
| v-0734 predominantly | "The audience was predominantly young people" is awkward. | example `The audience was predominantly young.` | minor |
| v-0020 drought, v-0042 prescription, v-0079 nutritious, v-0006 tuition | Tagged B1, but these are B1+/B2 in learner profiles. They are harmless in phase 1, but they inflate "B1" counts. | Optional. Leave as is to keep IDs and arrays intact, or note them for a future CEFR re-tag. | minor |

The other vocab cards are accurate. Definitions are simple and correct, collocations are natural, examples are grammatical, and British spelling is used consistently.

## 3. Writing

| Item id | Problem | Suggested fix | Severity |
|---|---|---|---|
| wr-0007 | (1) The overview says the increase "was far greater in Canada and Germany than elsewhere". This is false: Germany +260k, Australia +240k, UK +200k. Only Canada stands out. (2) "Japan **remained** the lowest" is false, because in 2005 Canada (80k) was lowest, not Japan (120k). (3) Only 133 words, below the 150 minimum, so it is not a band-7 model. (4) The note "Hard to describe every number, so detail is grouped" is wrong, because the answer quotes every number. | Replace modelAnswer with Appendix A (159 words, every claim checked). Replace the last note with `Every figure is used, but they are grouped by year and compared (eightfold, almost tripled, more than doubled).` | wrong answer |
| wr-0005 | (1) 139 words, below 150. (2) "leisure almost doubled, from 8 to 14" is inaccurate, because that is +75%. | Replace modelAnswer with Appendix B (185 words). Change note 3 to `Good language of change for proportions: accounted for, took, fell to, increased considerably.` | wrong answer |
| wr-0003 | The note "Paragraph 3 groups the older ages together" refers to the wrong paragraph. The older ages are in paragraph 4. | Note: `Paragraph 4 groups the older ages together.` | minor |
| wr-0001 | It is accurate (174 words, clear overview). One key feature is missing: A overtook C by 2010. | Optional: add `By 2010, Country A had overtaken Country C.` at the end of paragraph 3. | minor |
| wr-0012 | "The car park is moved underground" does not say where. | dataDescription: `The car park is moved underground, beneath a new garden in the north.` | minor |
| wr-0101, 0104, 0107, 0109 | These pass (261, 272, 262 and 271 words). Positions are clear, every part of each question is answered, and the essay types match their prompts. They read as solid band 7: clear progression, a good range of cohesive devices, and topic-specific vocabulary with no errors. They sit close to the 250 limit, which is fine. | No change. Later models could aim for 270 to 300 words so learners see a safe margin. | — |
| wr-0101 | "in several European countries… a higher proportion of students come from working-class families" is presented as fact. Examiners do not check facts, but the app should not teach invented statistics as true. | Change to `For example, in countries where university fees are low or non-existent, students from low-income families are more likely to apply.` | minor |

All 12 Task 1 data sets are internally consistent (every pie chart and percentage bar set adds up to 100). The process and map tasks are realistic. The Task 1 and Task 2 rubric lines are the standard short instructions, which is acceptable. All 12 Task 2 prompts are realistic Academic prompts with correct question forms for their essay types.

## 4. Speaking

| Item id | Problem | Suggested fix | Severity |
|---|---|---|---|
| sp-0101 to sp-0112 | The format is correct. Each card has a "Describe…" task line, 3 bullets and an "and explain…" line. The UI must add the heading "You should say:" and should show the "and explain…" line without a bullet, as on a real card. | UI/rendering note for pwa-developer. No content change. | minor |
| sp-0201 to sp-0208 | Each Part 3 set has 3 questions. A real Part 3 lasts 4 to 5 minutes with about 4 to 6 questions, and it is thematically linked to the Part 2 card. There is no link field in the contract. | Add 1 or 2 questions per set in a later batch. For mock sessions, suggested pairings: 101 to 207, 103 to 206, 107 to 201, 110 to 205, 111 to 202, 102 to 208, 109 to 204. | minor |
| sp-0106 / sp-0111 | The tasks overlap heavily (an object you use every day versus a piece of technology). | Optional: change sp-0106 to `Describe an object that is important in your family.` with bullets `["what it is", "where it came from", "who uses it", "and explain why it is important to your family"]`. | minor |

Part 1 topics and questions are realistic and natural for the test.

## 5. Originality

Nothing appears to be copied from Cambridge IELTS, Murphy, Hewings or official materials. All passages, data sets, place names (Veldon, Rivington, Hillford and others) and model answers are original. Some grammar sentences are generic textbook staples ("Water boils at 100 degrees", "Look! The children are playing"). They are common across the language and are not reproduced exercises. Task 2 topics (free university, working from home) are standard themes, written in original wording.

## Appendix A: wr-0007 modelAnswer (159 words)

```
The table shows how many international students studied in five countries in 2005 and in 2020.

Overall, the number of overseas students rose in every country, but the increase was by far the largest in Canada. By 2020, Canada had overtaken the United Kingdom as the most popular destination.

In 2005, the United Kingdom was in first place with 300,000 international students, followed by Australia with 200,000. Germany and Japan attracted 150,000 and 120,000 respectively, while Canada had the smallest number, at only 80,000.

By 2020, the picture had changed greatly. Canada's figure had risen eightfold to 640,000, the highest in the table. The United Kingdom also grew, but more slowly, by about two-thirds, reaching 500,000. Australia and Germany recorded similar totals, of 440,000 and 410,000 respectively, which meant that Australia's figure had more than doubled and Germany's had almost tripled. Japan's figure also more than doubled, but at 280,000 it was now the lowest of the five countries.
```

Overview note to keep: `The overview names the biggest change (Canada) and the new ranking.`

## Appendix B: wr-0005 modelAnswer (185 words)

```
The pie charts compare how an average family divided its spending between six categories in 1990 and 2020.

Overall, the biggest change was a shift from food to housing as the main cost, and spending on leisure and transport increased while clothing became less important.

In 1990, food took the largest share, at 30 per cent, followed by housing at 25 per cent. By 2020, these positions had been reversed: housing accounted for 35 per cent of spending, whereas food fell to 18 per cent. Even so, these two essential costs together made up just over half of the family budget in both years, at 55 and 53 per cent respectively.

Transport and leisure both grew. Transport rose from 12 to 16 per cent, and leisure increased considerably, from 8 to 14 per cent, so it changed from the smallest category in 1990 to the fourth largest in 2020. In contrast, the share spent on clothing dropped from 10 per cent to just 6 per cent, making it the smallest item, and the "other" category also became smaller, falling from 15 to 11 per cent.
```

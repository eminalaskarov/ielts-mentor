/**
 * Phase 3-4 writing prompts. Task 1 data is given in text. Model answers are written at about band 7.5
 * and every data claim in them was checked against the dataDescription. IDs "wr34-NNNN". APPEND ONLY.
 */
import type { WritingPrompt } from './types';

const T1 = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.';
const T2 = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.';

const id = (n: number) => `wr34-${String(n).padStart(4, '0')}`;

export const WRITING_TASK1_PHASE34: WritingPrompt[] = [
  {
    id: id(1), task: 1, phase: 3, chartType: 'line', topic: 'media',
    prompt: `The graph shows the percentage of adults in one country who used three different sources of news between 2005 and 2025. ${T1}`,
    dataDescription: 'Line graph. Years: 2005, 2010, 2015, 2020, 2025. Printed newspapers: 62%, 48%, 35%, 24%, 15%. News websites: 12%, 30%, 51%, 66%, 74%. Social media: 5%, 22%, 40%, 52%, 58%.',
    modelAnswer: `The line graph compares the percentage of adults in one country who got their news from three sources, printed newspapers, news websites and social media, between 2005 and 2025.

Overall, printed newspapers went into steady decline, while the other two sources became far more popular. By 2025, news websites were the most widely used source, and the printed press was the least used.

In 2005, print was the dominant source, used by 62 per cent of adults, compared with only 12 per cent for websites and 5 per cent for social media. Over the next two decades, the figure for print fell in every period, dropping to 35 per cent in 2015 and reaching just 15 per cent in 2025.

Websites moved in the opposite direction, rising to 30 per cent in 2010 and then to 51 per cent in 2015, which meant that they had overtaken print by that year. Their growth then slowed, and the figure reached 74 per cent in 2025. Social media followed a similar path, climbing from 5 per cent to 40 per cent by 2015 and to 58 per cent in 2025, although it remained below websites throughout the period. By 2015 it had also overtaken print.`,
    modelAnswerNotes: ['The overview names the main trend (print down, the others up) and the final ranking in 2025.', 'It uses the crossing point as a key feature: websites and social media overtook print by 2015.', 'Data is grouped by trend, not listed year by year.', 'Good range of language: went into decline, overtook, followed a similar path, remained below.'],
  },
  {
    id: id(2), task: 1, phase: 3, chartType: 'bar', topic: 'education',
    prompt: `The bar chart shows the percentage of graduates who found work within six months of finishing their degree in five subject areas, in 2010 and 2020. ${T1}`,
    dataDescription: 'Bar chart. Subject: 2010 / 2020 (% of graduates employed within six months). Medicine: 92 / 95. Engineering: 85 / 90. Business: 74 / 71. Science: 70 / 78. Arts: 58 / 66.',
    modelAnswer: `The bar chart compares the proportion of graduates who found work within six months of finishing their studies in five subject areas in 2010 and 2020.

Overall, employment rates improved in every subject except business, and medicine had the highest figure in both years, while arts graduates had the lowest.

Medicine led the way in both years, rising slightly from 92 per cent in 2010 to 95 per cent in 2020. Engineering also performed well, with the figure increasing from 85 to 90 per cent over the same period.

The biggest improvements were in science and arts. In science, the proportion rose by eight percentage points, from 70 to 78 per cent, and arts graduates saw an identical increase, from 58 to 66 per cent, although arts remained the lowest of the five subjects. Business was the only subject to show a decline: its rate fell from 74 to 71 per cent, and as a result it dropped below science, which had been lower in 2010.`,
    modelAnswerNotes: ['The overview shows the general trend, the exception (business), and the highest and lowest subjects.', 'Comparisons are made across both years and between subjects (identical increase, dropped below science).', 'Percentage points and per cent are used correctly.', 'No reasons are given for the changes.'],
  },
  {
    id: id(3), task: 1, phase: 3, chartType: 'pie', topic: 'environment',
    prompt: `The pie charts show the sources of electricity in one country in 2000 and in 2020. ${T1}`,
    dataDescription: 'Two pie charts (percentage of electricity generated). 2000: coal 45%, gas 25%, nuclear 15%, renewables 10%, oil 5%. 2020: renewables 35%, gas 30%, coal 18%, nuclear 12%, oil 5%.',
    modelAnswer: `The two pie charts show the proportion of electricity generated from five sources in one country in 2000 and in 2020.

Overall, the most striking change was that coal went from being the biggest source of electricity to only the third largest, while renewable energy overtook it to become the largest source by 2020. Gas also grew in importance.

In 2000, coal dominated, generating 45 per cent of the country's electricity, followed by gas at 25 per cent. Nuclear power accounted for 15 per cent, renewables for 10 per cent, and oil provided the smallest share, at just 5 per cent.

By 2020, the picture had changed considerably. The share of coal had fallen to 18 per cent, whereas renewables had more than tripled, to 35 per cent, making them the leading source. Gas rose modestly to 30 per cent and was therefore the second largest. Nuclear power declined slightly, from 15 to 12 per cent, and oil was the only source that remained unchanged, at 5 per cent.`,
    modelAnswerNotes: ['The overview picks out the two biggest changes: the fall of coal and the rise of renewables.', 'Only the key changes are described in detail; small changes are grouped in the last sentence.', 'Good comparison language: more than tripled, whereas, the only source that remained unchanged.', 'Both charts are described in separate paragraphs, which keeps the answer easy to follow.'],
  },
  {
    id: id(4), task: 1, phase: 4, chartType: 'table', topic: 'education',
    prompt: `The table shows the number of students in higher education in five countries in 1990 and 2020, and the percentage of students who were female in 2020. ${T1}`,
    dataDescription: 'Table. Country / students 1990 (thousands) / students 2020 (thousands) / female students 2020 (%). Alberon: 420 / 1,260 / 54. Brevia: 300 / 450 / 48. Corlan: 150 / 900 / 57. Dentia: 800 / 1,000 / 51. Estoria: 90 / 180 / 45.',
    modelAnswer: `The table compares higher education enrolment in five countries in 1990 and 2020, and also shows the proportion of female students in 2020.

Overall, the number of students rose in every country, with the sharpest growth in Corlan and Alberon, and women formed a majority of students in three of the five countries.

In 1990, Dentia had by far the largest student population, at 800,000, followed by Alberon with 420,000 and Brevia with 300,000. Corlan and Estoria had much smaller systems, with 150,000 and 90,000 students respectively. By 2020, Alberon had overtaken Dentia, with 1.26 million students compared with 1 million. This represents a threefold rise for Alberon, while Dentia's figure grew by only a quarter. The most dramatic growth occurred in Corlan, where enrolment increased sixfold to 900,000. Estoria's total doubled to 180,000, whereas the number in Brevia rose by 50 per cent, to 450,000.

As for gender, women accounted for 57 per cent of students in Corlan, 54 per cent in Alberon and 51 per cent in Dentia. In contrast, men were in the majority in Brevia, at 52 per cent, and in Estoria, at 55 per cent.`,
    modelAnswerNotes: ['The overview covers both parts of the table: growth in numbers and the gender pattern.', 'Multiples and fractions (threefold, sixfold, doubled, a quarter) summarise the data without repeating every number.', 'The male percentages are worked out from the female figures (52 and 55), which is allowed because the claim is exact.', 'Table data is grouped by year and then by theme, not country by country.'],
  },
  {
    id: id(5), task: 1, phase: 4, chartType: 'process', topic: 'environment',
    prompt: `The diagram shows how waste paper is recycled to make new paper. ${T1}`,
    dataDescription: 'Process diagram with eight stages in order: (1) waste paper is collected and sorted; (2) it is mixed with water in a large tank to make pulp; (3) the pulp passes through screens that remove staples and plastic; (4) chemicals and air bubbles remove the ink (de-inking); (5) the clean pulp is pressed between rollers to form thin wet sheets; (6) the sheets are dried on hot cylinders; (7) the dry paper is wound into large rolls; (8) the rolls are cut into standard sheets and packed.',
    modelAnswer: `The diagram illustrates the process by which waste paper is recycled to produce new paper.

Overall, the process consists of eight stages, beginning with the collection of used paper and ending with the packing of the finished sheets.

First, waste paper is collected and sorted. It is then mixed with water in a large tank, where it is broken down into a soft pulp. Next, the pulp passes through screens, which remove unwanted items such as staples and plastic. In the fourth stage, chemicals and air bubbles are used to take the ink out of the pulp, a step known as de-inking.

After that, the clean pulp is pressed between rollers to form thin, wet sheets, which are subsequently dried on hot cylinders. Once the sheets are dry, the paper is wound into large rolls. In the final stage, these rolls are cut into standard sheets, and the sheets are packed ready for delivery.`,
    modelAnswerNotes: ['The overview gives the number of stages, the start and the end.', 'The present simple passive is used throughout (is collected, are dried).', 'Sequencing words are varied: first, then, next, after that, once, in the final stage.', 'It does not add details that are not in the diagram, such as how long each stage takes.'],
  },
  {
    id: id(6), task: 1, phase: 3, chartType: 'map', topic: 'urban life',
    prompt: `The maps show the village of Hillby in 1995 and today. ${T1}`,
    dataDescription: '1995 map: farmland covers the whole northern part of the village; the primary school is in the centre; Main Street runs from west to east with small shops on both sides; the railway station is at the eastern end of Main Street; a pond is in the west; about twenty houses are in the south. Map today: the eastern half of the northern farmland has been replaced by a new housing estate (the western half is still farmland); a sports field has been added on the east side of the school; Main Street still has shops but is pedestrian-only; the railway station has closed and its site is now a car park; a supermarket has been built on the north side of the eastern end of Main Street; the pond has been filled in and replaced by a public park with a cafe; the houses in the south are unchanged; a new bypass runs along the southern edge of the village.',
    modelAnswer: `The two maps show how the village of Hillby has changed between 1995 and the present day.

Overall, the village has developed from a mainly rural settlement into a larger and more modern community, with new housing and leisure facilities replacing farmland and some older features.

In 1995, farmland covered the whole northern part of the village, and the school stood in the centre. Main Street ran from west to east, with small shops on both sides and a railway station at its eastern end. A pond lay to the west, and about twenty houses stood in the south.

Today, the eastern half of the northern farmland has been replaced by a new housing estate, while the western half remains as farmland. The school has been extended by the addition of a sports field on its east side. Main Street is still lined with shops, but it has been made pedestrian-only, and a supermarket has been built on the north side of its eastern end. The railway station has closed, and a car park now occupies the site. In the west, the pond has been filled in and turned into a public park with a cafe. The houses in the south have not changed, but a new bypass now runs along the southern edge of the village.`,
    modelAnswerNotes: ['The overview states the general change (rural to developed) and gives examples.', 'The tenses match the time: past simple for 1995, present perfect and present simple for today.', 'Position words are used accurately: in the west, on its east side, at its eastern end, along the southern edge.', 'Unchanged features (the southern houses) are mentioned briefly, which shows full coverage.'],
  },
  {
    id: id(7), task: 1, phase: 4, chartType: 'line', topic: 'travel',
    prompt: `The graph shows the number of international visitors (in millions) to three countries between 2000 and 2020. ${T1}`,
    dataDescription: 'Line graph. Years: 2000, 2005, 2010, 2015, 2020. Country A: 12, 18, 25, 31, 12 (millions). Country B: 8, 10, 14, 22, 24. Country C: 20, 22, 21, 23, 9.',
  },
  {
    id: id(8), task: 1, phase: 4, chartType: 'bar', topic: 'technology',
    prompt: `The chart shows the percentage of households in four countries that owned each of three devices in 2023. ${T1}`,
    dataDescription: 'Bar chart, percentage of households. Country / smartphone / laptop / tablet. Norland: 96 / 88 / 61. Kestria: 90 / 52 / 40. Valmor: 78 / 35 / 22. Pellin: 85 / 70 / 55.',
  },
];

export const WRITING_TASK2_PHASE34: WritingPrompt[] = [
  {
    id: id(9), task: 2, phase: 3, essayType: 'opinion', topic: 'technology',
    prompt: `Some people believe that artificial intelligence will soon make most human jobs unnecessary. To what extent do you agree or disagree? ${T2}`,
    modelAnswer: `It is often claimed that artificial intelligence will make most human workers redundant within a generation. While I accept that automation will eliminate a number of existing jobs, I disagree that it will make most human work unnecessary, because new roles will emerge and many tasks require human qualities that machines cannot replicate.

There is no doubt that some occupations are at risk. Software can already process insurance claims, translate documents and scan medical images faster than any person, and factories that use robots need far fewer assembly workers than they once did. Employees whose jobs consist mainly of repetitive, predictable tasks are therefore the most vulnerable, and governments will need to help them retrain.

However, history suggests that technology tends to change the nature of work rather than abolish it. When computers became widespread, typists lost their jobs, but millions of people found work as programmers, data analysts and web designers, roles that barely existed beforehand. In the same way, the spread of artificial intelligence is creating demand for people who can design, supervise and check these systems.

Moreover, many jobs depend on empathy, creativity and judgement. A nurse comforting an anxious patient, a teacher who notices that a pupil is struggling, or an architect who balances beauty against cost cannot easily be replaced by an algorithm, and customers often prefer to deal with a real person in sensitive situations.

In conclusion, artificial intelligence will undoubtedly transform the labour market and remove some jobs, but I do not believe that it will make most human work unnecessary. The greater challenge for societies is to ensure that workers are given the training they need to benefit from the new opportunities.`,
    modelAnswerNotes: ['The position is clear in the introduction (partly agrees, but disagrees with "most") and is repeated in the conclusion.', 'The concession paragraph shows balance before the main argument.', 'Each body paragraph has one main idea and a specific example.', 'Range of language: make redundant, replicate, vulnerable, the labour market, benefit from.'],
  },
  {
    id: id(10), task: 2, phase: 3, essayType: 'opinion', topic: 'environment',
    prompt: `Some people say that governments, not individuals, should take the main responsibility for protecting the environment. To what extent do you agree or disagree? ${T2}`,
    modelAnswer: `Environmental damage is now widely recognised as one of the most serious problems facing humanity. Although individuals can make a difference, I largely agree that governments should bear the main responsibility for protecting the environment, because only they have the power to change systems on a large scale.

The first reason is that governments can make rules which apply to everyone. Individuals may choose to recycle or to buy electric cars, but their efforts are limited if factories are free to pollute rivers or if power stations continue to burn coal. By introducing emission limits, taxing carbon and banning the most harmful products, a government can reduce pollution far more effectively than millions of separate decisions. Where plastic bags have been banned or taxed, their use has often fallen within months, whereas voluntary campaigns usually achieve much less.

Furthermore, governments control the infrastructure that shapes daily habits. People cannot use public transport if no reliable buses or trains exist, and they cannot cycle safely without protected lanes. Cities that have built large cycle networks, such as Amsterdam, show how public investment can change behaviour. Without investment from the state, even highly motivated citizens have few green choices.

That said, individuals should not be left without responsibility. Consumers influence companies through what they buy, and voters can put pressure on politicians to act. If people were unwilling to accept higher prices or changes in lifestyle, even the best policies would meet resistance.

In conclusion, governments are better placed to lead because they can regulate industry and build the necessary systems, but their policies will succeed only if individuals support them through responsible everyday behaviour.`,
    modelAnswerNotes: ['A partial-agreement position ("largely agree") is clear and consistent.', 'The answer addresses "the main responsibility" and does not ignore the role of individuals.', 'Cohesive devices are varied: The first reason, Furthermore, That said, In conclusion.', 'The example about plastic bags is specific without needing exact statistics.'],
  },
  {
    id: id(11), task: 2, phase: 3, essayType: 'discussion', topic: 'education',
    prompt: `Some people believe that school students should be free to choose all of the subjects they study. Others think that all students should follow the same curriculum. Discuss both views and give your own opinion. ${T2}`,
    modelAnswer: `The question of how much freedom pupils should have in choosing their subjects divides educators and parents. Some argue that students should decide everything for themselves, while others prefer a common curriculum. Although there are good reasons for choice, I believe that a shared core of subjects should be compulsory, with room for personal choice in the later years.

Supporters of free choice point out that students learn best when they are interested. A teenager who loves music or computing will probably work harder in those subjects than in ones that seem irrelevant, and this motivation can lead to higher achievement. In addition, allowing choice treats young people as responsible individuals and helps them to discover their strengths before they begin a career.

On the other hand, a fixed curriculum has important advantages. Young people often do not know which skills they will need as adults, and a pupil who abandons mathematics or a foreign language at fourteen may find that many university courses or jobs are closed to them later. A common curriculum also guarantees that everyone leaves school with the basic knowledge needed to take part in society, such as the ability to read critically, understand numbers and appreciate history.

In my opinion, the best solution is a balance. All students should study essential subjects, including their own language, mathematics and science, until about the age of fifteen. After that, they should be able to specialise in areas that match their interests and plans. This approach protects pupils from making irreversible mistakes too early, while still rewarding their curiosity.

To sum up, both views have merit, but a core curriculum followed by gradual specialisation seems to serve students best.`,
    modelAnswerNotes: ['Both views get a full paragraph each, with reasons and examples.', 'The writer gives a clear opinion in the introduction and develops it in its own paragraph.', 'The opinion is a balanced one but still clear: core subjects first, then choice.', 'Topic sentences make the structure easy to follow: Supporters of free choice, On the other hand, In my opinion.'],
  },
  {
    id: id(12), task: 2, phase: 4, essayType: 'discussion', topic: 'crime',
    prompt: `Some people think that the best way to reduce crime is to give longer prison sentences. Others believe that other methods would be more effective. Discuss both views and give your own opinion. ${T2}`,
  },
  {
    id: id(13), task: 2, phase: 3, essayType: 'adv-disadv', topic: 'education',
    prompt: `In many countries, a growing number of young people take a year out to travel or work before they start university. Do the advantages of this outweigh the disadvantages? ${T2}`,
    modelAnswer: `It has become increasingly common for school leavers to postpone their studies for a year in order to travel or work. Although this choice has some drawbacks, I believe that the benefits clearly outweigh them, provided that the year is used sensibly.

The main advantage is personal development. Spending twelve months away from the classroom, whether in a paid job or in another country, forces young people to manage money, solve practical problems and deal with people from different backgrounds. These experiences build the independence and maturity which universities value, and many students return with a much clearer idea of what they wish to study. This can reduce the number of students who start a course, discover that it is unsuitable and drop out. Furthermore, a year of full-time work can help students to save money and so reduce the burden of debt.

There are, however, some disadvantages. Some young people lose the habit of studying, and a few never go back to education at all. A gap year can also be expensive if it involves long-distance travel, which means that students from wealthier families benefit more than others. In addition, friends who go straight to university will be a year ahead, and this may cause some feelings of isolation.

Nevertheless, these problems are not impossible to overcome. Students who arrange a university place before leaving can return with a guaranteed path, and a year spent working rather than travelling is affordable for almost everyone.

In conclusion, a year out can be an excellent preparation for adult life, and its advantages in terms of maturity, motivation and finance outweigh the risks, especially when it is planned carefully.`,
    modelAnswerNotes: ['The question "do the advantages outweigh the disadvantages?" is answered directly: the writer says yes and explains why.', 'Advantages come first and get the longest paragraph, which matches the writer\'s position.', 'The disadvantages paragraph is followed by a short paragraph that answers the problems, which strengthens the argument.', 'Language shows range: postpone, maturity, burden of debt, a guaranteed path.'],
  },
  {
    id: id(14), task: 2, phase: 4, essayType: 'adv-disadv', topic: 'urban life',
    prompt: `Some cities have banned private cars from their centres. What are the advantages and disadvantages of this? ${T2}`,
  },
  {
    id: id(15), task: 2, phase: 3, essayType: 'problem-solution', topic: 'health',
    prompt: `In many countries, people spend most of their working day and much of their free time sitting down. What problems does this cause, and what can be done to solve them? ${T2}`,
    modelAnswer: `Modern life has become remarkably inactive. Office workers sit at desks for hours, and many people spend their evenings in front of screens. This trend causes several serious problems, but there are practical steps that individuals, employers and governments can take to reverse it.

The most obvious consequence is damage to physical health. A sedentary lifestyle is linked to obesity, heart disease and type 2 diabetes, and they can also cause back and neck pain. Less visible, but equally important, are the effects on mental health: people who rarely move around often report lower energy and a greater risk of depression. As these conditions become more common, they put growing pressure on health services and cost economies millions of working days each year.

One solution lies with employers. Companies could encourage staff to take short walking breaks, provide standing desks and hold some meetings while walking, which many people find helps them to think more clearly. Offering subsidised gym membership, or allowing flexible hours so that employees can exercise, would also help.

Governments, for their part, can make activity easier by investing in safe cycle lanes, parks and sports facilities, and by making physical education a serious part of every school timetable so that children develop active habits early. Public information campaigns could remind adults that even thirty minutes of brisk walking a day makes a difference.

Finally, individuals need to take responsibility by making small changes, such as using the stairs, walking to nearby shops and limiting time on screens in the evening.

In conclusion, inactivity harms both physical and mental health, but a combination of workplace initiatives, public investment and personal effort can help people to become more active.`,
    modelAnswerNotes: ['The essay answers both parts: one paragraph for problems, then separate paragraphs for solutions by employers, governments and individuals.', 'Each solution is specific and realistic, not just "people should exercise more".', 'Vocabulary is topic-specific: sedentary lifestyle, type 2 diabetes, subsidised gym membership, brisk walking.', 'The introduction previews the structure, which helps coherence.'],
  },
  {
    id: id(16), task: 2, phase: 4, essayType: 'problem-solution', topic: 'urban life',
    prompt: `In many large cities, young people cannot afford to rent or buy a home. What are the causes of this problem, and what can be done to solve it? ${T2}`,
  },
  {
    id: id(17), task: 2, phase: 4, essayType: 'two-part', topic: 'media',
    prompt: `Many people now get most of their news from social media instead of from newspapers or television. Why is this happening? Is this a positive or a negative development? ${T2}`,
    modelAnswer: `In recent years, social media platforms have replaced newspapers and television as the main source of news for a large proportion of the population, particularly among the young. This shift is mainly the result of convenience and cost, and in my view it is a negative development, although it does have some benefits.

There are several reasons why people now turn to social media. First, news appears automatically in the same place where they already spend time, so no extra effort is needed. A smartphone user can read the headlines while waiting for a bus, whereas a newspaper must be bought and a television programme watched at a fixed time. Secondly, most social media content is free, and stories are posted within minutes of an event, so readers feel better informed than they would with a daily newspaper.

On the positive side, this change has made information accessible to people who were previously excluded from public debate, and it allows ordinary citizens to share first-hand reports from places where journalists cannot go. News can also be discussed immediately, which encourages participation.

On balance, however, I believe the negative effects are greater. Social media posts are rarely checked by editors, so false stories can spread faster than corrections. In addition, algorithms show users the content they are most likely to enjoy, and as a result people may see only opinions which match their own and become less tolerant of other views. Finally, the short, emotional style of many posts can encourage people to react to headlines without reading the full story.

In conclusion, people prefer social media for news because it is quick, free and convenient, but the lack of checking and the creation of narrow information bubbles mean that, overall, this trend is harmful unless users learn to verify what they read.`,
    modelAnswerNotes: ['Both questions are answered: reasons (paragraph 2) and an evaluation (paragraphs 3 and 4).', 'The writer shows a clear position ("negative") but acknowledges the benefits, which gives balance.', 'Linking is precise: First, Secondly, On the positive side, On balance, however, In addition, Finally.', 'Topic vocabulary is accurate: algorithms, information bubbles, first-hand reports.'],
  },
  {
    id: id(18), task: 2, phase: 4, essayType: 'two-part', topic: 'culture',
    prompt: `In many countries, fewer young people speak the regional or local languages of their families. Why is this happening? Is this a problem? ${T2}`,
  },
];

export const WRITING_PHASE34: WritingPrompt[] = [...WRITING_TASK1_PHASE34, ...WRITING_TASK2_PHASE34];

import { gap, heading, headingc, mcq, mcqc, tfng, withIds } from './helpers';
import type { QuizItem } from './types';

const TF = 'reading-tfng' as const;
const YN = 'reading-ynng' as const;
const H = 'reading-headings' as const;
const LS = 'listening-spelling-numbers' as const;
const T1 = 'task1-language' as const;
const ES = 'exam-strategy' as const;
const SL = 'speaking-language' as const;
const T2 = 'task2-structure' as const;
const M = 'mixed-review' as const;

const P_CYCLE =
  'Over the last decade, the city of Veldon has built more than 120 kilometres of cycle lanes. Before the programme began in 2014, only 4 per cent of daily journeys were made by bicycle. By 2024 the figure had risen to 17 per cent. City officials say the change has reduced morning traffic on the main roads, although shopkeepers on some streets complain that they have lost parking spaces for customers. A survey of 2,000 residents found that most cyclists were over thirty. The council now plans to add bicycle storage at all railway stations.';
const P_SLEEP =
  'Sleep experts recommend that adults sleep between seven and nine hours a night, but many people sleep less. In a study at a Canadian university, 300 students kept a sleep diary for a month. Those who slept fewer than six hours reported more difficulty concentrating in class. The researchers also noticed that students who used phones in bed took longer to fall asleep. However, the study did not look at the students\' exam results, so the team cannot say whether poor sleep lowers marks. They suggest that universities should give students advice on sleep habits in their first week.';
const P_MUSEUM =
  'The Harbour Museum opened in 1987 in a former fish market. At first it had only two rooms, but today it has twelve and receives about 80,000 visitors a year. Entry is free for children under 12, while adults pay 6 manat. The museum\'s most popular exhibit is a full-size model of a fishing boat, which visitors are allowed to climb on. Photography is permitted everywhere except in the room of old maps. The museum is closed on Mondays, and in winter it closes at four o\'clock instead of six.';
const P_REMOTE =
  'Since 2020 the number of people who work from home at least one day a week has grown steadily in many countries. Employers often say that staff are more productive without office distractions, while some workers report feeling lonely. A recent report from a consulting firm found that companies offering flexible hours lost fewer employees each year. Meanwhile, city-centre cafes and shops near big offices have seen fewer customers at lunchtime. The report\'s authors expect that most companies will keep some form of hybrid working in the future.';
const P_MUSIC =
  'Some people argue that every child should learn a musical instrument at school. I understand the appeal, but I am not convinced that it should be compulsory. Music lessons are expensive, and many schools already struggle to find enough teachers for core subjects. That said, I believe that children who play an instrument often develop patience and confidence, and schools should at least offer lessons to those who want them. Learning an instrument is not the only way to build these skills, but it is one of the most enjoyable.';

const P_GARDEN =
  'Urban gardening has become popular in several large cities. In Rivington, more than 200 rooftops now grow vegetables, and some restaurants buy herbs directly from these gardens. Most of the gardeners are volunteers, although a few receive a small payment from the city council. Experts say that plants on a roof can lower the temperature of a building by up to five degrees in summer. However, the gardens need regular watering, and some owners have found this expensive. A few buildings were not suitable because their roofs could not carry the extra weight.';
const P_LIBRARY =
  'The public library in Hillford was closed for repairs for six months in 2023. When it reopened, the number of members rose from 3,200 to 4,100. The manager believes that the new children\'s area is the main reason, but she admits that she has no proof. The library now stays open until nine in the evening on weekdays, two hours later than before. Book loans have not changed much, but the number of people using the computers has doubled. A coffee shop will be added to the ground floor next spring.';
const P_SUGAR =
  'A health charity in Norland studied the drinking habits of 5,000 teenagers over two years. It found that teenagers who drank more than three sugary drinks a day were twice as likely to have dental problems as those who drank none. The charity did not say that the drinks alone caused the problems, since other habits, such as not brushing teeth, may also play a part. Sales of sugary drinks in Norland fell by 8 per cent last year after a new tax was introduced. Some shop owners say the tax has hurt their business, but the government says that lower sales will save money on healthcare in the long term.';
const P_APP =
  'Lingo-Learn is a mobile app that teaches foreign languages through short daily games. It was launched in 2019 by two friends and now has users in more than 90 countries. The company claims that learners who practise for ten minutes a day can reach a basic level in six months, but independent teachers say that this depends on the language and on the learner\'s earlier experience. The app is free to download, though users must pay a monthly fee to remove advertisements. It has not yet added any courses for Asian languages.';
const P_MARATHON =
  'The annual Seaside Marathon attracted a record 12,000 runners this year, compared with 9,500 last year. Almost all of the runners were from the local region, but about 300 travelled from abroad. The race was moved from October to May to avoid the heavy autumn rain. Organisers reported that nearly a third of participants were running a marathon for the first time. Because of the larger crowd, the route had to be changed, and the finish line was moved from the old harbour to the central park. Next year, the organisers plan to offer a shorter race for children.';
const P_BRIDGE =
  'The Old Karsten Bridge was built in 1872 and was, for many years, the only way to cross the river in the town. It is 140 metres long and made of local stone. In 1965, a new road bridge was opened a kilometre downstream, and cars were no longer allowed on the old bridge. Since then it has been used only by walkers and cyclists. Engineers inspected the bridge last year and found cracks in two of its five arches. The town council has promised to repair them, but it has not yet said how much the work will cost or when it will begin.';
const P_ISLAND =
  'Kavar Island is home to about 400 species of birds, and several of them are found nowhere else in the world. Most visitors come between April and June, when the birds nest on the cliffs. To protect the nests, tourists are not allowed to leave the marked paths. In recent years, however, rats brought by ships have eaten many eggs, and the number of seabirds has fallen by nearly a quarter. A rat-removal programme began in 2022 and is expected to take five years. Some scientists believe that climate change is also a threat to the island, but there is little evidence so far.';
const P_GRAD =
  'A survey of 1,500 graduates in Dalmere found that those who had done an internship during their studies were more likely to be employed six months after graduation. Of the graduates with an internship, 72 per cent had a job, compared with 54 per cent of those without one. However, the survey also showed that students who did internships tended to have higher marks, so it is not clear whether the internship itself helped them to find work. Employers\' groups say that practical experience is valuable, and universities are being encouraged to organise more work placements.';
const P_SOLAR =
  'Solar panels have become much cheaper over the last ten years. In 2014 a typical home system cost about 12,000 manat, but today the same system costs about 5,000 manat. As a result, the number of homes with solar panels in Ganjaland has tripled. Even so, installation is still expensive for low-income families, and the government offers them low-interest loans, which must be repaid. Experts warn that panels produce less electricity in winter, so most homes still need a connection to the national grid. A new factory that will make panels locally is due to open in 2027.';
const P_BUS =
  'In a recent survey, 60 per cent of residents of Oswick said that the city\'s buses were too expensive, and 35 per cent said that they were not frequent enough. Only 8 per cent complained about the cleanliness of the buses. The mayor responded that fares have risen by only 3 per cent in five years, which is less than the rise in the cost of living. Bus drivers\' representatives argue that the real problem is traffic, which makes buses late. The city is considering bus-only lanes on three main roads, but a decision will not be made until the autumn.';
const P_HOMEWORK =
  'I have taught in primary schools for twenty years, and I am convinced that young children are given too much homework. Children aged seven or eight need time to play and rest after a long day, and research suggests that homework at this age has little effect on results. I do accept that older students benefit from regular practice, and I would not want to remove homework completely. What worries me more is the effect on family life: parents often spend their evenings arguing with tired children. Some of my colleagues disagree with me, saying that homework teaches responsibility, but I have yet to see convincing evidence.';
const P_TOURISM =
  'Cheap flights have made it possible for millions of people to travel, and it is easy to see this as a good thing. I am not so sure. In my own town, the old centre is now so full of visitors that residents avoid it at weekends, and rents have risen because owners prefer to let flats to tourists. It would be unfair to blame tourists themselves, since most of them are respectful. The problem lies with local authorities, which have done little to limit the numbers. I would therefore support a small daily charge for visitors, as long as the money is spent on improving life for local people.';
const P_SOCIAL =
  'Many people claim that social media has made us better informed. I would argue the opposite. On these platforms, people mostly see opinions that match their own, and short, shocking headlines spread faster than careful reports. It is also true that anyone can post false stories, and it can take days before the truth catches up. Having said that, I do not believe we should abandon social media completely, because it allows ordinary people to share news from places that journalists cannot reach. What we need is better education, so that young people learn how to check whether a story is reliable.';
const P_CARBAN =
  'Some cities have banned cars from their centres, and supporters say that the air is cleaner and the streets are safer. I accept these benefits, but I doubt that a complete ban would work in a city like ours. Many elderly and disabled residents depend on cars, and small shops worry about losing customers who cannot carry heavy bags on a bus. A better first step, in my view, would be to limit cars on two or three busy streets at the weekend and then see what happens. If the trial is successful, we can extend it.';

export const QUIZ_READING: QuizItem[] = withIds([
  // ---------------- reading-tfng (12) ----------------
  tfng(TF, 1, 'B1+', P_CYCLE, 'The new cycle lanes have reduced the number of road accidents.', 'NG', 'The text talks about traffic and parking, but says nothing about accidents.'),
  tfng(TF, 1, 'B1+', P_CYCLE, 'Most cyclists in the survey were younger than thirty.', 'F', 'The text says most cyclists were over thirty. This is the opposite.'),
  tfng(TF, 1, 'B1+', P_CYCLE, 'The share of journeys made by bicycle in Veldon grew after 2014.', 'T', 'The text says it rose from 4 per cent to 17 per cent.'),
  tfng(TF, 1, 'B1+', P_SLEEP, 'The students kept their sleep diaries for a whole year.', 'F', 'The text says they kept diaries for a month.'),
  tfng(TF, 1, 'B1+', P_SLEEP, 'Students who slept fewer than six hours found it harder to concentrate.', 'T', 'The text says they reported more difficulty concentrating.'),
  tfng(TF, 1, 'B1+', P_SLEEP, 'Students who slept badly got lower exam marks.', 'NG', 'The study did not look at exam results, so the text gives no information.'),
  tfng(TF, 1, 'B1', P_MUSEUM, 'The museum is open every day of the week.', 'F', 'The text says it is closed on Mondays.'),
  tfng(TF, 1, 'B1', P_MUSEUM, 'The old maps in the museum were given by a local family.', 'NG', 'The text does not say where the maps came from.'),
  tfng(TF, 1, 'B1', P_MUSEUM, 'Visitors may climb onto the model fishing boat.', 'T', 'The text says visitors are allowed to climb on it.'),
  tfng(TF, 2, 'B2', P_REMOTE, 'Cafes near large offices now have more customers at lunchtime.', 'F', 'The text says they have seen fewer customers.'),
  tfng(TF, 2, 'B2', P_REMOTE, 'Companies with flexible hours lost fewer staff than other companies.', 'T', 'The report found this directly.'),
  tfng(TF, 2, 'B2', P_REMOTE, 'People who work from home earn more than office workers.', 'NG', 'The text does not mention salaries.'),

  // ---------------- reading-ynng (4) ----------------
  tfng(YN, 2, 'B2', P_MUSIC, 'The writer believes that learning an instrument is the only way to build confidence.', 'N', 'The writer says it is not the only way.', 'ynng'),
  tfng(YN, 2, 'B2', P_MUSIC, 'The writer plays a musical instrument.', 'NG', 'The writer gives no information about their own playing.', 'ynng'),
  tfng(YN, 2, 'B2', P_MUSIC, 'The writer thinks music lessons should be compulsory for all children.', 'N', 'The writer says they are not convinced it should be compulsory.', 'ynng'),
  tfng(YN, 2, 'B2', P_MUSIC, 'The writer thinks schools should offer music lessons to children who are interested.', 'Y', 'The writer says schools should at least offer lessons to those who want them.', 'ynng'),

  // ---------------- reading-headings (6) ----------------
  heading(H, 1, 'B1+', 'In the past, most people in the village worked on farms. Today, many young people leave to find jobs in the capital, and the population is falling. Schools have closed, and some shops have no customers. The mayor hopes that better internet connections will encourage companies to open small offices there.', ["A hope for new work opportunities", "The history of local farming", "Plans for a new school", "A village losing its young people"], 3, 'The main idea is that young people leave and the village is getting smaller. Farming and the mayor\'s hope are only details.'),
  heading(H, 1, 'B1+', 'Regular exercise does more than keep the body strong. Studies show that people who walk for thirty minutes a day feel less stressed and sleep better. Even a short walk during a work break can improve mood and help people think more clearly.', ["Sports for professional athletes", "The cost of gym membership", "Mental benefits of physical activity", "Why people sleep too much"], 2, 'The paragraph is about how exercise helps mood, stress and thinking.'),
  heading(H, 1, 'B1+', 'Tourism brings money to coastal towns, but it also brings problems. In summer the population of some towns triples, and the water supply cannot always meet demand. Rubbish on the beaches has become another serious concern for local councils.', ["Difficulties caused by visitors", "The pleasures of a beach holiday", "How councils earn money", "Why towns are growing smaller"], 0, 'The paragraph lists problems from tourism: water and rubbish.'),
  heading(H, 2, 'B1+', 'The first mobile phones were large, heavy and very expensive. They could only make calls, and the battery lasted for a short time. Few people believed that ordinary families would ever own one.', ["The latest phone features", "Early limits of a new technology", "Why phones are cheaper today", "Dangers of phone use"], 1, 'The paragraph describes weak points of the first phones.'),
  heading(H, 2, 'B1+', 'Many companies now allow staff to choose their working hours. Supporters say this helps parents and reduces travel in rush hour. Critics worry that it is harder for teams to meet and share ideas.', ["Arguments for and against flexible hours", "The rise of working from home", "Why parents should not work", "A new law about holidays"], 0, 'Both supporters and critics are mentioned, so the paragraph is about for and against.'),
  heading(H, 2, 'B1+', 'Coral reefs cover less than one per cent of the ocean floor, yet about a quarter of all sea species depend on them. Rising water temperatures cause corals to lose their colour and die. Scientists are testing ways to grow heat-resistant corals in laboratories.', ["The beauty of tropical holidays", "The size of the ocean", "A threat to reefs and a possible answer", "How fish are caught"], 2, 'The paragraph has a problem (rising temperatures) and a possible answer (heat-resistant corals).'),

  // ---------------- listening-spelling-numbers (15) ----------------
  mcq(LS, 1, 'B1', 'Which spelling is correct?', ["Wensday", "Wendesday", "Wednsday", "Wednesday"], 3, 'Wed-nes-day: the spelling does not follow the sound.'),
  mcq(LS, 1, 'B1', 'Which spelling is correct?', ["Febuary", "February", "Febrary", "Feburary"], 1, 'February has "br" in the middle: Feb-ru-ary.'),
  mcq(LS, 1, 'B1', 'Which spelling is correct?', ["accomodation", "acommodation", "acomodation", "accommodation"], 3, 'Accommodation has double c and double m.'),
  mcq(LS, 1, 'B1', 'Which spelling is correct?', ["adress", "address", "addres", "adres"], 1, 'Address has double d and double s.'),
  mcq(LS, 1, 'B1+', 'Which spelling is correct?', ["recieve", "receeve", "receive", "recive"], 2, 'Remember: "i before e, except after c".'),
  mcq(LS, 1, 'B1+', 'Which spelling is correct?', ["necessary", "neccessary", "necesary", "nesessary"], 0, 'Necessary has one c and two s.'),
  mcq(LS, 1, 'B1', 'Which number has the stress on the first part of the word?', ["thirty", "thirteen", "fourteen", "nineteen"], 0, 'In "thirty" the stress is on "thir". In -teen words the stress is usually on "teen".'),
  mcq(LS, 1, 'B1', 'A speaker says "double seven". What does that mean?', ["7", "77", "7.7", "70"], 1, '"Double seven" means two sevens together: 77.'),
  mcq(LS, 1, 'B1+', 'A speaker says "oh" in a phone number. Which digit is it?', ["1", "8", "9", "0"], 3, '"Oh" is often used for zero in phone numbers.'),
  gap(LS, 1, 'B1', 'Write the number in digits: fifty-three = ___', ['53'], 'Fifty = 50; three = 3; so 53.'),
  gap(LS, 1, 'B1', 'Write the number in digits: one thousand, two hundred and five = ___', ['1205', '1,205'], '1,000 + 200 + 5 = 1,205.'),
  gap(LS, 1, 'B1', 'Write the missing letters: Wed___day (use three letters).', ['nes'], 'The word is Wednesday: Wed + nes + day.'),
  gap(LS, 1, 'B1+', 'Write the word that is spelled: B-A-L-A-N-C-E. It is ___', ['balance'], 'Write the letters together in lower case.'),
  gap(LS, 1, 'B1+', 'Write the number in digits: "three point five per cent" = ___ %', ['3.5'], 'Point means the decimal point: 3.5.'),
  gap(LS, 1, 'B1+', 'Write the date in numbers, day first: "the twenty-second of November" = ___ November', ['22', '22nd'], 'Twenty-second = 22nd.'),

  // ---------------- task1-language (6) ----------------
  mcq(T1, 1, 'B1+', 'The number of visitors rose ___ 200 to 500.', ["by", "at", "from", "of"], 2, 'We say "rose from X to Y".'),
  mcq(T1, 1, 'B1+', 'Sales increased ___ 20 per cent, from 50,000 to 60,000 units.', ["to", "by", "from", "with"], 1, '"By" shows the size of the change.'),
  mcq(T1, 1, 'B1+', 'Which phrase means "stayed the same"?', ["remained stable", "fluctuated", "plunged", "peaked"], 0, 'Remained stable = did not change.'),
  mcq(T1, 1, 'B1+', 'Which phrase means "a very fast fall"?', ["a slight dip", "a gradual rise", "a sharp drop", "a steady level"], 2, 'A sharp drop is fast and large.'),
  mcq(T1, 1, 'B1+', 'In a pie chart: Cars ___ 45 per cent of all journeys.', ["consist", "depend", "belong", "account for"], 3, '"Account for" is used to describe parts of a whole.'),
  mcq(T1, 1, 'B1+', 'Which verb fits a graph that goes up and down many times?', ["fluctuated", "doubled", "levelled", "reached"], 0, 'Fluctuate = change up and down.'),

  // ---------------- exam-strategy (5) ----------------
  mcq(ES, 1, 'B1', 'In True/False/Not Given, the passage says nothing about the statement. What is the answer?', ["True", "False", "Guess", "Not Given"], 3, 'If there is no information, the answer is Not Given.'),
  mcq(ES, 1, 'B1', 'How many words must you write at least in IELTS Writing Task 2?', ["150", "200", "250", "300"], 2, 'Task 2 needs at least 250 words. Task 1 needs 150.'),
  mcq(ES, 1, 'B1', 'How long do you have to prepare for Speaking Part 2?', ["10 seconds", "One minute", "Five minutes", "No time"], 1, 'You have one minute and you can make notes.'),
  mcq(ES, 1, 'B1', 'In the Listening test, how many times do you hear each recording?', ["Twice", "Once", "Three times", "As many as you want"], 1, 'You hear each recording only once, so read the questions first.'),
  mcq(ES, 1, 'B1+', 'In Academic Reading, if you cannot answer a question after a short time, you should ___.', ["stop the test", "leave it empty", "move on and come back later", "read it ten times"], 2, 'Manage your time: move on and come back later. Never leave an answer empty at the end. There is no penalty for a wrong answer, so always guess.'),

  // ---------------- speaking-language (5) ----------------
  mcq(SL, 1, 'B1+', 'Which phrase is best to give yourself time to think?', ["I don't know.", "No.", "Next question, please.", "That's an interesting question. Let me think."], 3, 'This is natural and keeps you speaking.'),
  mcq(SL, 1, 'B1+', 'Which is the best way to give an opinion?', ["In my opinion, it is a good idea.", "I am thinking that.", "My opinion is yes yes.", "It good."], 0, '"In my opinion" is a clear, correct phrase.'),
  mcq(SL, 1, 'B1+', 'Which sentence extends the answer best? Question: "Do you like cooking?"', ["Yes.", "Yes, I do, because it helps me relax after a busy day.", "Yes I like.", "Cooking."], 1, 'A good answer gives a reason and a little detail.'),
  mcq(SL, 1, 'B1+', 'If you do not know a word, you should ___.', ["stop talking", "say the word in your language", "explain it with other words", "ask the examiner to speak slowly"], 2, 'Paraphrasing shows good communication skills.'),
  mcq(SL, 1, 'B1+', 'Which is a natural way to start talking about the past?', ["Before is a year, I...", "Last year has I...", "In last year, I...", "Last year, I..."], 3, '"Last year, I..." is correct and natural.'),

  // ---------------- task2-structure (5) ----------------
  mcq(T2, 1, 'B1+', 'What is the best paragraph plan for a Task 2 essay?', ["Introduction, two body paragraphs, conclusion", "One long paragraph", "Only a conclusion", "A list of notes"], 0, 'A clear four-paragraph plan is a good structure.'),
  mcq(T2, 1, 'B1+', 'What should the first sentence of a body paragraph do?', ["Say thank you", "Repeat the question", "Give the conclusion", "Introduce the main idea"], 3, 'A topic sentence tells the reader the main idea.'),
  mcq(T2, 1, 'B1+', 'What does a good introduction contain?', ["A paraphrase of the question and your position", "A long story about your life", "Three examples", "Only the word \"Today\""], 0, 'Paraphrase the question and state your opinion or plan.'),
  mcq(T2, 1, 'B1+', 'Which sentence is best for a conclusion?', ["Finally, I will eat dinner.", "Another idea is this.", "In conclusion, I believe that the advantages outweigh the disadvantages.", "Moreover, I think."], 2, 'A conclusion summarises your view without adding new ideas.'),
  mcq(T2, 1, 'B1+', 'What follows a main idea in a body paragraph?', ["A new topic", "An explanation and an example", "A greeting", "A question to the examiner"], 1, 'Develop each idea with explanation and an example.'),

  // ---------------- mixed-review (12) ----------------
  mcq(M, 1, 'B1', 'I ___ to the gym three times a week.', ["go", "goes", "am going", "went"], 0, 'Habit with "I": present simple, go.'),
  mcq(M, 1, 'B1', 'She ___ an apple every day.', ["eat", "eats", "eating", "is eat"], 1, 'She + verb + s.'),
  mcq(M, 1, 'B1', 'This is ___ most interesting book I have ever read.', ["a", "an", "no article", "the"], 3, 'Use "the" with superlatives.'),
  mcq(M, 1, 'B1', 'The film ___ by a young director.', ["made", "is making", "was made", "has make"], 2, 'Passive past: was + past participle.'),
  mcq(M, 1, 'B1', 'If I ___ time, I will help you.', ["will have", "have", "would have", "had"], 1, 'First conditional: present simple in the if-clause.'),
  mcq(M, 1, 'B1', 'Which word is a noun?', ["quickly", "beautiful", "happiness", "decide"], 2, 'Happiness is a noun. The others are adverb, adjective and verb.'),
  mcq(M, 1, 'B1', 'Which is the correct spelling?', ["definately", "definitly", "defanitely", "definitely"], 3, 'Definitely: de-fi-nite-ly.'),
  mcq(M, 1, 'B1+', 'I ___ in this city for five years, and I still love it here.', ["have lived", "live", "lived", "am living"], 0, 'For + period until now: present perfect.'),
  mcq(M, 1, 'B1+', 'Despite ___ tired, she finished the work.', ["be", "was", "being", "to be"], 2, 'After "despite" we use a noun or an -ing form.'),
  mcq(M, 1, 'B1+', 'A synonym of "big" is ___.', ["tiny", "narrow", "quiet", "large"], 3, 'Large means big.'),
  gap(M, 1, 'B1', 'Choose much or many and write it: There isn\'t ___ milk in the fridge.', ['much'], '"Milk" is uncountable, so use "much".'),
  gap(M, 1, 'B1+', 'Write one word: She asked me where I ___ from. (come)', ['came', 'come'], 'In reported questions the verb usually moves back: come becomes came. ("come" is also possible because it is still true.) Note the word order: where I came from, not where did I come from.'),

  // ================= pass A additions: reading-tfng (qualifiers, paraphrase, NG vs F) =================
  tfng(TF, 2, 'B2', P_GARDEN, 'The city council plans to build more rooftop gardens next year.', 'NG', 'The text does not mention any plan for new gardens.'),
  tfng(TF, 2, 'B2', P_GARDEN, 'A rooftop garden always lowers the temperature of a building by five degrees.', 'F', '"Up to five degrees" means five is the most. It is not always five.'),
  tfng(TF, 2, 'B2', P_GARDEN, 'Some roofs were not strong enough to hold a garden.', 'T', '"Could not carry the extra weight" means the roofs were not strong enough.'),
  tfng(TF, 2, 'B2', P_GARDEN, 'Some restaurants buy herbs from rooftop gardens.', 'T', 'The text says some restaurants buy herbs directly from the gardens.'),
  tfng(TF, 2, 'B2', P_GARDEN, 'All of the gardeners in Rivington are volunteers.', 'F', 'The text says "most" are volunteers, and "a few" are paid. "All" is too strong.'),

  tfng(TF, 2, 'B2', P_LIBRARY, 'On weekdays, the library used to close at seven o\'clock.', 'T', 'It now closes at nine, which is two hours later than before. So it closed at seven.'),
  tfng(TF, 2, 'B2', P_LIBRARY, 'The manager has proof that the new children\'s area caused the rise in members.', 'F', 'The manager only believes it. She admits that she has no proof.'),
  tfng(TF, 2, 'B2', P_LIBRARY, 'Most of the new members are children.', 'NG', 'The text does not say who the new members are.'),
  tfng(TF, 2, 'B2', P_LIBRARY, 'More people joined the library after the repairs.', 'T', 'Members rose from 3,200 to 4,100.'),
  tfng(TF, 2, 'B2', P_LIBRARY, 'There is a coffee shop on the ground floor now.', 'F', 'The coffee shop "will be added" next spring. It is a future plan, not a present fact.'),

  tfng(TF, 2, 'B2', P_SUGAR, 'The government expects the lower sales to reduce healthcare costs in the future.', 'T', '"Save money on healthcare in the long term" means lower costs in the future.'),
  tfng(TF, 2, 'B2', P_SUGAR, 'The charity says that sugary drinks are the only cause of dental problems.', 'F', 'The charity did not say the drinks alone caused the problems. Other habits may play a part.'),
  tfng(TF, 2, 'B2', P_SUGAR, 'The study lasted for two years.', 'T', 'The text says the charity studied teenagers "over two years".'),
  tfng(TF, 2, 'B2', P_SUGAR, 'All 5,000 teenagers in the study lived in the same city.', 'NG', 'The text does not say where the teenagers lived.'),
  tfng(TF, 2, 'B2', P_SUGAR, 'Sales of sugary drinks fell by 8 per cent after a tax was introduced.', 'T', 'This is stated directly in the text.'),

  tfng(TF, 2, 'B2', P_APP, 'The app was created by two friends.', 'T', 'The text says it was launched by two friends.'),
  tfng(TF, 2, 'B2', P_APP, 'More of the app\'s users live in Europe than in any other continent.', 'NG', 'The text gives the number of countries, but not where most users live.'),
  tfng(TF, 2, 'B2', P_APP, 'Users who do not want to see advertisements must pay a fee.', 'T', 'A monthly fee removes the advertisements.'),
  tfng(TF, 2, 'B2', P_APP, 'Independent teachers agree that ten minutes a day is enough for every learner to reach a basic level in six months.', 'F', 'The teachers say it depends on the language and the learner. They do not agree with the claim for every learner.'),
  tfng(TF, 2, 'B2', P_APP, 'The app already offers courses in Asian languages.', 'F', 'The text says it has not yet added any courses for Asian languages.'),

  tfng(TF, 2, 'B2', P_MARATHON, 'The winner finished the race in less than three hours.', 'NG', 'The text does not give any finishing times.'),
  tfng(TF, 2, 'B2', P_MARATHON, 'Every runner in the marathon came from the local region.', 'F', '"Almost all" is not "every". About 300 runners came from abroad.'),
  tfng(TF, 2, 'B2', P_MARATHON, 'More people ran in the marathon this year than last year.', 'T', '12,000 runners this year compared with 9,500 last year.'),
  tfng(TF, 2, 'B2', P_MARATHON, 'The finish line is now in the central park.', 'T', 'It was moved from the old harbour to the central park.'),
  tfng(TF, 2, 'B2', P_MARATHON, 'A race for children will be offered this year.', 'F', 'The organisers plan to offer it next year, not this year.'),

  tfng(TF, 2, 'B2', P_BRIDGE, 'The council has announced how much the repairs will cost.', 'F', 'The council has not yet said how much the work will cost.'),
  tfng(TF, 2, 'B2', P_BRIDGE, 'Cars have not been allowed on the Old Karsten Bridge since 1965.', 'T', 'After the new road bridge opened in 1965, cars were no longer allowed on the old one.'),
  tfng(TF, 2, 'B2', P_BRIDGE, 'The new road bridge is made of steel.', 'NG', 'The text does not say what the new bridge is made of.'),
  tfng(TF, 2, 'B2', P_BRIDGE, 'At one time, the Old Karsten Bridge was the only way to cross the river in the town.', 'T', 'The text says it was, for many years, the only way to cross.'),
  tfng(TF, 2, 'B2', P_BRIDGE, 'All five arches of the bridge have cracks.', 'F', 'Cracks were found in two of the five arches.'),

  tfng(TF, 2, 'B2', P_ISLAND, 'The rat-removal programme has already finished.', 'F', 'It began in 2022 and is expected to take five years.'),
  tfng(TF, 2, 'B2', P_ISLAND, 'Visitors have to pay a fee to enter the island.', 'NG', 'The text does not mention any fee.'),
  tfng(TF, 2, 'B2', P_ISLAND, 'Some of the birds on Kavar Island are not found anywhere else in the world.', 'T', '"Several of them are found nowhere else" means they live only on the island.'),
  tfng(TF, 2, 'B2', P_ISLAND, 'Tourists may walk anywhere on Kavar Island during the nesting season.', 'F', 'Tourists are not allowed to leave the marked paths.'),
  tfng(TF, 2, 'B2', P_ISLAND, 'Rats reached the island on ships.', 'T', 'The text says the rats were "brought by ships".'),

  tfng(TF, 2, 'B2', P_GRAD, 'More than 70 per cent of graduates without an internship had a job.', 'F', 'Only 54 per cent of them had a job. The 72 per cent figure is for graduates with an internship.'),
  tfng(TF, 2, 'B2', P_GRAD, 'The survey proves that internships help graduates to find jobs.', 'F', 'The text says it is not clear whether the internship itself helped. The link is not proof.'),
  tfng(TF, 2, 'B2', P_GRAD, 'Graduates who had done an internship were more likely to be employed after six months.', 'T', 'The survey found this: 72 per cent compared with 54 per cent.'),
  tfng(TF, 2, 'B2', P_GRAD, 'Students who did internships tended to get higher marks.', 'T', 'The text says they "tended to have higher marks".'),
  tfng(TF, 2, 'B2', P_GRAD, 'Most of the graduates in the survey had studied business.', 'NG', 'The text does not say what the graduates studied.'),

  tfng(TF, 2, 'B2', P_SOLAR, 'A typical home solar system now costs less than half of its price in 2014.', 'T', '5,000 manat is less than half of 12,000 manat.'),
  tfng(TF, 2, 'B2', P_SOLAR, 'The new panel factory will employ more than 500 people.', 'NG', 'The text says only that the factory is due to open in 2027.'),
  tfng(TF, 2, 'B2', P_SOLAR, 'Homes with solar panels no longer need a connection to the national grid.', 'F', 'The text says most homes still need a connection to the grid.'),
  tfng(TF, 2, 'B2', P_SOLAR, 'There are now three times as many homes with solar panels as before.', 'T', '"Tripled" means three times as many.'),
  tfng(TF, 2, 'B2', P_SOLAR, 'The government gives free solar panels to low-income families.', 'F', 'The government offers low-interest loans, not free panels.'),

  tfng(TF, 2, 'B2', P_BUS, 'The survey included residents under eighteen.', 'NG', 'The text does not say who was asked.'),
  tfng(TF, 2, 'B2', P_BUS, 'Bus drivers\' representatives believe that traffic is the main reason for late buses.', 'T', 'They argue that the real problem is traffic, which makes buses late.'),
  tfng(TF, 2, 'B2', P_BUS, 'The mayor says that bus fares have risen faster than the cost of living.', 'F', 'The mayor says fares rose by less than the cost of living.'),
  tfng(TF, 2, 'B2', P_BUS, 'Most residents complained about the cleanliness of the buses.', 'F', 'Only 8 per cent complained about cleanliness.'),
  tfng(TF, 2, 'B2', P_BUS, 'Ticket prices were the most common complaint in the survey.', 'T', '60 per cent complained about prices, more than the other complaints (35 and 8 per cent).'),

  // ================= reading-ynng (writer\'s views) =================
  tfng(YN, 2, 'B2', P_HOMEWORK, 'The writer thinks that older students can gain from regular practice.', 'Y', 'The writer accepts that older students benefit from regular practice.', 'ynng'),
  tfng(YN, 2, 'B2', P_HOMEWORK, 'The writer thinks that homework should be stopped for students of all ages.', 'N', 'The writer says older students benefit and does not want to remove homework completely.', 'ynng'),
  tfng(YN, 2, 'B2', P_HOMEWORK, 'The writer thinks that children should do their homework before dinner.', 'NG', 'The writer gives no opinion about when homework should be done.', 'ynng'),
  tfng(YN, 2, 'B2', P_HOMEWORK, 'The writer believes that primary school children are given too much homework.', 'Y', 'The writer says this at the start: "I am convinced that young children are given too much homework."', 'ynng'),

  tfng(YN, 2, 'B2', P_TOURISM, "The writer thinks that cheap flights have brought only benefits to the writer's town.", 'N', "The writer describes problems: crowded streets and higher rents.", 'ynng'),
  tfng(YN, 2, 'B2', P_TOURISM, 'The writer would support a charge for visitors if the money helps local people.', 'Y', "The writer says they would support a small daily charge as long as the money improves life for local people.", 'ynng'),
  tfng(YN, 2, 'B2', P_TOURISM, 'The writer blames tourists for the problems in the old centre.', 'N', "The writer says it would be unfair to blame tourists. The writer blames the local authorities.", 'ynng'),
  tfng(YN, 2, 'B2', P_TOURISM, "The writer has lived in the town for more than twenty years.", 'NG', "The writer does not say how long they have lived there.", 'ynng'),

  tfng(YN, 2, 'B2', P_SOCIAL, 'The writer believes that social media has made people better informed.', 'N', 'The writer says "I would argue the opposite".', 'ynng'),
  tfng(YN, 2, 'B2', P_SOCIAL, "The writer gets most of their news from social media.", 'NG', "The writer does not talk about their own news habits.", 'ynng'),
  tfng(YN, 2, 'B2', P_SOCIAL, 'The writer thinks that false stories can spread faster than the truth.', 'Y', 'The writer says it can take days before the truth catches up with a false story.', 'ynng'),
  tfng(YN, 2, 'B2', P_SOCIAL, 'The writer thinks that social media should be abandoned.', 'N', 'The writer says we should not abandon social media completely.', 'ynng'),
  tfng(YN, 2, 'B2', P_SOCIAL, 'The writer thinks that young people should be taught how to check whether news is reliable.', 'Y', 'The writer says better education is needed so that young people learn to check stories.', 'ynng'),

  tfng(YN, 2, 'B2', P_CARBAN, "The writer thinks that most people in the writer's city own a car.", 'NG', 'The writer does not give any information about car ownership.', 'ynng'),
  tfng(YN, 2, 'B2', P_CARBAN, 'The writer accepts that car bans can improve air quality.', 'Y', 'The writer says "I accept these benefits", which include cleaner air.', 'ynng'),
  tfng(YN, 2, 'B2', P_CARBAN, "The writer thinks that a complete car ban would suit the writer's city.", 'N', "The writer doubts that a complete ban would work in their city.", 'ynng'),
  tfng(YN, 2, 'B2', P_CARBAN, 'The writer recommends starting with a limited trial.', 'Y', 'The writer suggests limiting cars on two or three streets at the weekend first.', 'ynng'),

  // ================= reading-headings =================
  headingc(H, 1, 'B1+', 'Many teenagers find it hard to get up early. Scientists say that during the teenage years the body clock moves later, so young people feel sleepy in the morning and wide awake at night. This is a natural change, not laziness.', ['A natural change in the teenage body clock', 'Laziness among young people', 'The danger of phones at night', 'Schools that start earlier'], 'The paragraph explains a natural reason (the body clock). It says it is not laziness.'),
  headingc(H, 1, 'B1+', 'Volunteering gives people the chance to learn new skills without paying for a course. A young volunteer in a museum, for example, may learn how to talk to visitors and how to organise events. These skills often help when applying for paid work later, because employers like to see experience and a positive attitude.', ['Skills gained from unpaid work', 'The cost of museum tickets', 'Why employers dislike young workers', 'A new course for volunteers'], 'The paragraph is about useful skills that volunteers learn.'),
  headingc(H, 1, 'B1+', 'Almost one in ten people in the world has no access to clean drinking water. In many villages, women and children walk for hours each day to collect it, so children often miss school. Simple solutions, such as wells and small filters, can make a big difference at low cost.', ['Lack of clean water: effects and low-cost answers', 'The invention of the well', 'Water sports for children', 'How rich countries use water'], 'The paragraph describes the problem, its effect on children and simple solutions.'),
  headingc(H, 2, 'B2', 'Advertisers have long known that children influence what families buy. Colourful packaging, cartoon characters and free toys are all designed to attract young shoppers. Some countries have therefore banned adverts for sweets during children\'s television programmes, while others rely on companies to control themselves.', ['Targeting children and attempts to control it', 'The benefits of colourful toys', 'Why children dislike television', 'How parents save money'], 'The paragraph describes advertising to children and the rules some countries use.'),
  headingc(H, 2, 'B2', 'When a language disappears, a whole way of seeing the world goes with it. Around half of the world\'s 7,000 languages are expected to die out by the end of this century, mostly those spoken by small communities. Linguists are recording elders in remote villages so that at least some words and stories are saved.', ['The danger facing small languages', 'The easiest languages to learn', 'Why English is spreading', 'New words in the dictionary'], 'The paragraph is about languages that may disappear and efforts to record them.'),
  headingc(H, 2, 'B2', 'Cities that build more roads often find that traffic gets worse, not better. New roads attract more drivers, so the extra space is soon full again. Experts therefore recommend investing in trains, trams and cycle paths, which can carry many more people in the same space.', ['Why more roads do not solve traffic problems', 'The history of the railway', 'Cycling accidents in cities', 'How to drive safely'], 'The main idea is that new roads do not reduce traffic. Public transport is the suggested answer.'),
  headingc(H, 2, 'B2', 'In the 1990s, most people wrote letters and used landline phones. Today, we send messages in seconds, hold video calls with relatives abroad and share photos with hundreds of friends at once. Yet some researchers worry that we talk less face to face.', ['Changes in the way people communicate', 'The rise of postal services', 'Why letters are better', 'A new phone company'], 'The paragraph compares old and new ways of communicating.'),
  headingc(H, 2, 'B2', 'The first reason for the success of the company was its location. It was built next to a river, which provided cheap transport for goods. A second reason was its workforce: many local people had learned practical skills at the nearby technical college. Finally, the owner was willing to try new machines before his competitors did.', ['Reasons behind a firm\'s success', 'The problems of river transport', 'A history of technical colleges', 'Why machines are dangerous'], 'The paragraph lists three reasons for the success of the company.'),
  headingc(H, 2, 'B2', 'Some people believe that money brings happiness, but studies suggest the link is weaker than we think. Up to a certain income, extra money improves life because people can afford food, housing and healthcare. After that point, however, more money makes little difference to how happy people feel.', ['The limited link between income and happiness', 'How to become rich quickly', 'The cost of healthcare', 'Why housing is expensive'], 'The paragraph says money helps only up to a point.'),
  headingc(H, 2, 'B2', 'Electric cars produce no exhaust gases, so they make city air cleaner. Yet critics point out that making their batteries uses large amounts of energy and rare metals. In addition, if the electricity comes from coal, the overall pollution may not fall as much as people hope.', ['Advantages and limits of electric cars for the environment', 'The speed of electric cars', 'Where to buy electric cars', 'The history of the battery'], 'The paragraph gives a benefit and then some doubts, all about the environment.'),
  headingc(H, 2, 'B2', 'Learning to swim is not only a fun activity; it can save lives. Every year, thousands of people die from drowning, and many of them never learned to swim. Several countries have therefore made swimming lessons part of the school programme.', ['Swimming as a life-saving skill', 'The best beaches in the world', 'Famous Olympic swimmers', 'Dangers of cold weather'], 'The paragraph is about swimming lessons as protection from drowning.'),
  headingc(H, 2, 'B2', 'Not all museums are quiet places full of glass cases. Some now allow visitors to touch objects, play games or even sleep overnight among the exhibits. Managers say that these experiences attract families and help children to remember what they have seen.', ['New ways museums attract visitors', 'Why museums are closing', 'The oldest museum in the world', 'Rules for quiet behaviour'], 'The paragraph describes new, more active kinds of museum experience.'),

  // ================= listening-spelling-numbers (additions) =================
  mcqc(LS, 1, 'B1', 'Which spelling is correct?', ['separate', 'seperate', 'separete', 'seprate'], 'Separate has "a" in the middle: sep-a-rate. Think: there is "a rat" in "separate".'),
  mcqc(LS, 1, 'B1', 'Which spelling is correct?', ['environment', 'enviroment', 'environmant', 'envirenment'], 'Environment has "n" before "m": environ-ment.'),
  mcqc(LS, 1, 'B1', 'Which spelling is correct?', ['government', 'goverment', 'govenment', 'governmant'], 'Government has "n" before "m": govern-ment.'),
  mcqc(LS, 1, 'B1', 'Which spelling is correct?', ['restaurant', 'restarant', 'resturant', 'restaraunt'], 'Restaurant: rest-au-rant. It has "au" in the middle.'),
  mcqc(LS, 1, 'B1', 'Which spelling is correct?', ['library', 'libary', 'librery', 'liberry'], 'Library has "br" and then "ary": lib-rar-y.'),
  mcqc(LS, 1, 'B1+', 'Which spelling is correct?', ['calendar', 'calender', 'calandar', 'calander'], 'Calendar is cal-en-dar. The ending is -dar, not -der.'),
  mcqc(LS, 1, 'B1', 'You hear "fifteen". Which is the correct number?', ['15', '50', '5.1', '1.5'], '"Fifteen" is 15. "Fifty" is 50.'),
  mcqc(LS, 1, 'B1+', 'The speaker says: "The number is oh-seven, double five, nine." Which is correct?', ['07559', '075559', '70559', '07599'], '"Oh" is 0, "seven" is 7, "double five" is 55, and then 9. So: 07559.'),
  mcqc(LS, 1, 'B1', 'The speaker says "A as in Apple". What do you write?', ['A', 'Apple', 'AA', 'AP'], 'The word "Apple" only helps you hear the letter. You write the letter A.'),
  mcqc(LS, 1, 'B1', 'The speaker says "double T" in a name. What do you write?', ['TT', 'T', 'DT', '2'], '"Double T" means two T letters: TT.'),
  mcqc(LS, 1, 'B1', 'You hear: "The museum opens at nine thirty." What time do you write?', ['9.30', '9.13', '3.09', '9.03'], 'Nine thirty is 9.30.'),
  mcqc(LS, 1, 'B1+', 'You hear: "The first of September." Which is correct?', ['1 September', '1th September', '1 Septmber', 'first Septembar'], 'We can write the date as 1 September (or 1st September). Check the spelling of September.'),
  gap(LS, 1, 'B1', 'You hear "four hundred and sixty". Write the number in digits: ___', ['460'], '400 + 60 = 460.'),
  gap(LS, 1, 'B1', 'You hear "seven hundred and six". Write the number in digits: ___', ['706'], '700 + 6 = 706. There are no tens, so the middle digit is 0.'),
  gap(LS, 1, 'B1', 'You hear "two thousand and nineteen". Write the number in digits: ___', ['2019', '2,019'], '2,000 + 19 = 2019.'),
  gap(LS, 1, 'B1+', 'You hear "one point two five". Write the number in digits: ___', ['1.25'], 'The word "point" means the decimal point: 1.25.'),
  gap(LS, 1, 'B1+', 'Write the time in digits with a dot or colon (no am/pm): a quarter past five = ___', ['5.15', '5:15', '05.15', '05:15'], 'A quarter past five is 15 minutes after five: 5.15.'),
  gap(LS, 1, 'B1+', 'Write the word that is spelled R-E-C-O-M-M-E-N-D. It is ___', ['recommend'], 'Recommend has one c and double m.'),
  gap(LS, 1, 'B1+', 'Write the word that is spelled S-C-H-E-D-U-L-E. It is ___', ['schedule'], 'Schedule starts with "sch": s-c-h-e-d-u-l-e.'),
  gap(LS, 1, 'B1+', 'Write the word that is spelled T-E-M-P-E-R-A-T-U-R-E. It is ___', ['temperature'], 'Temperature has four syllables, but in speech we often say only three. Write all the letters.'),

  // ================= task1-language (additions) =================
  mcqc(T1, 1, 'B1+', 'Sales ___ from 10,000 to 20,000 between 2010 and 2015.', ['doubled', 'were doubled', 'doubling', 'doubles'], '"Double" is a verb. A finished period in the past needs past simple: doubled.'),
  mcqc(T1, 1, 'B1+', 'The price ___ at 50 manat for three years.', ['remained', 'rose', 'dropped', 'recovered'], '"Remained at 50" means it did not change. The other verbs show a change.'),
  mcqc(T1, 1, 'B1+', 'There was a ___ rise in unemployment. (a small and slow rise)', ['slight', 'sharp', 'dramatic', 'steep'], '"Slight" means small. "Sharp", "dramatic" and "steep" mean big and fast.'),
  mcqc(T1, 1, 'B1+', 'The figure peaked ___ 45 per cent in 2008.', ['at', 'by', 'in', 'to'], 'We say "peaked at" a number. "By" shows the amount of change.'),
  mcqc(T1, 1, 'B1+', 'The number of users increased by 3 million, ___ 2 million to 5 million.', ['from', 'by', 'at', 'of'], 'We say "from X to Y" for the start and end points.'),
  mcqc(T1, 1, 'B1+', 'Which adverb means "slowly and steadily"?', ['gradually', 'suddenly', 'sharply', 'rapidly'], '"Gradually" means a little at a time.'),
  mcqc(T1, 1, 'B1+', 'Which word means "about" when you give a number?', ['approximately', 'exactly', 'precisely', 'definitely'], '"Approximately 200" means about 200.'),
  mcqc(T1, 1, 'B1+', 'There was a ___ in sales last year. (sales went down)', ['fall', 'falling', 'fell', 'falls'], 'After "a" we need a noun: a fall in sales.'),
  mcqc(T1, 1, 'B1+', '25 per cent is the same as ___.', ['a quarter', 'a third', 'a half', 'three quarters'], '25 per cent = 1/4 = a quarter.'),
  mcqc(T1, 1, 'B1+', '33 per cent is about ___.', ['a third', 'a quarter', 'a fifth', 'two thirds'], '33 per cent is about 1/3.'),
  mcqc(T1, 1, 'B1+', '70 per cent of people chose A. ___ of people chose A.', ['The majority', 'A small minority', 'Very few', 'A handful'], 'More than half is "the majority".'),
  mcqc(T1, 1, 'B1+', 'Only a small ___ of students (4 per cent) chose chemistry.', ['minority', 'majority', 'half', 'most'], '"Minority" means a small part of a group.'),
  mcqc(T1, 1, 'B1+', 'Which sentence is correct?', ['Sales rose by 10 per cent.', 'Sales were rised by 10 per cent.', 'Sales raised by 10 per cent.', 'Sales has risen by 10 per cent in 2010.'], '"Rise" is intransitive and irregular: rise - rose - risen. It has no passive form.'),
  mcqc(T1, 1, 'B1+', 'Which word means "a sudden large rise"?', ['a surge', 'a dip', 'a plateau', 'a decline'], 'A surge is a fast, strong increase.'),
  mcqc(T1, 1, 'B1+', 'Which verb means "stopped changing and stayed at the same level for a time"?', ['levelled off', 'plunged', 'soared', 'fluctuated'], 'Levelled off = became flat after a change.'),
  mcqc(T1, 1, 'B1+', 'Which two words are opposites?', ['rise / fall', 'peak / top', 'plunge / drop', 'climb / increase'], 'Rise goes up and fall goes down. The other pairs have similar meanings.'),
  mcqc(T1, 2, 'B2', 'The old school ___ in 2010, and a larger building now stands there. (map language)', ['was demolished', 'demolished', 'is demolishing', 'demolishes'], 'Map changes are often passive. The school did not do the action itself.'),
  mcqc(T1, 1, 'B1+', 'A new road was built ___ the east of the town.', ['to', 'at', 'by', 'for'], 'We say "to the east of" for direction.'),
  mcqc(T1, 1, 'B1+', 'The park is ___ the river and the station.', ['between', 'among', 'under', 'against'], '"Between" is used for two things.'),
  mcqc(T1, 2, 'B2', 'The old market was ___ by a shopping centre.', ['replaced', 'removed', 'built', 'demolished'], 'We say "was replaced by". "Removed by" would mean the centre removed it.'),
  mcqc(T1, 1, 'B1+', 'Which word shows the last step in a process?', ['Finally', 'First', 'Initially', 'At the start'], '"Finally" introduces the last stage.'),
  mcqc(T1, 1, 'B1+', 'In a process description, we usually use the ___ voice.', ['passive', 'future', 'imperative', 'conditional'], 'The action matters more than who does it: "The paper is cut".'),
  mcqc(T1, 1, 'B1+', 'The wood is cut, ___ it is dried.', ['and then', 'because', 'although', 'unless'], '"Then" shows the next stage in a process.'),
  mcqc(T1, 2, 'B2', 'Which linker shows two stages at the same time?', ['while', 'finally', 'after that', 'first'], '"While" joins two actions that happen together.'),
  mcqc(T1, 1, 'B1', 'The chart ___ the percentage of people who use the internet.', ['shows', 'tells', 'talks', 'makes'], '"Shows" is the normal verb to introduce a chart.'),
  gap(T1, 1, 'B1+', 'Write one word: The figure remained ___ at 20 per cent. (it did not change; 6 letters)', ['stable', 'steady'], '"Remained stable / steady" means no change.'),
  gap(T1, 1, 'B1+', 'Write one word: Prices fell ___ from 80 to 30 in one year. (very fast; 7 letters)', ['sharply', 'rapidly', 'steeply', 'quickly', 'swiftly'], "Adverbs for a fast change with seven letters: sharply, rapidly, steeply, quickly, swiftly."),
  gap(T1, 1, 'B1+', 'Write one word: Car use ___ from 60 to 40 per cent. (past simple of "fall")', ['fell'], 'Fall - fell - fallen.'),
  gap(T1, 1, 'B1+', 'Write one word: Sales rose ___ 20 per cent. (shows the size of the change)', ['by'], '"By" shows how big the change is.'),
  gap(T1, 1, 'B1+', 'Write one word: Tourism accounted ___ 12 per cent of the income.', ['for'], 'We say "accounted for" a part of a whole.'),

  // ================= exam-strategy (additions) =================
  mcqc(ES, 1, 'B1', 'How many words must you write at least in IELTS Writing Task 1?', ['150', '100', '200', '250'], 'Task 1 needs at least 150 words. Task 2 needs at least 250.'),
  mcqc(ES, 1, 'B1', 'How long is the IELTS Academic Reading test?', ['60 minutes', '30 minutes', '90 minutes', '45 minutes'], 'You have 60 minutes for 40 questions. There is no extra time to copy answers.'),
  mcqc(ES, 1, 'B1', 'How many questions are there in the IELTS Reading test?', ['40', '20', '60', '30'], 'There are 40 questions in three passages.'),
  mcqc(ES, 1, 'B1', 'How long is the IELTS Listening recording?', ['About 30 minutes', 'About 60 minutes', 'About 10 minutes', 'About 90 minutes'], 'There are four sections and about 30 minutes of audio.'),
  mcqc(ES, 1, 'B1', 'How long is the Academic Writing test in total?', ['60 minutes', '30 minutes', '90 minutes', '45 minutes'], 'You have 60 minutes for Task 1 and Task 2.'),
  mcqc(ES, 1, 'B1', 'Which Writing task is worth more marks?', ['Task 2', 'Task 1', 'They are equal', 'Neither'], 'Task 2 counts about twice as much as Task 1, so spend more time on it.'),
  mcqc(ES, 1, 'B1', 'How long is the IELTS Speaking test?', ['11 to 14 minutes', '30 minutes', '2 minutes', 'One hour'], 'The Speaking test is a short face-to-face interview of 11 to 14 minutes.'),
  mcqc(ES, 1, 'B1', 'In Speaking Part 2, how long should you talk?', ['1 to 2 minutes', '10 seconds', '5 minutes', '30 minutes'], 'You speak for one to two minutes, and the examiner stops you.'),
  mcqc(ES, 1, 'B1', 'Which score range does IELTS use?', ['0 to 9', '1 to 10', '0 to 100', '1 to 5'], 'IELTS band scores go from 0 to 9, with half bands such as 6.5.'),
  mcqc(ES, 1, 'B1', 'How is the overall IELTS band score found?', ['The average of the four skills', 'The highest of the four skills', 'The lowest of the four skills', 'Only the Writing score'], 'The four scores are averaged and rounded to the nearest half band.'),
  mcqc(ES, 1, 'B1+', 'In IELTS Listening, spelling mistakes in your answers are ___.', ['marked wrong', 'ignored', 'worth half a mark', 'allowed in Section 1 only'], 'A wrongly spelt answer gets no mark, so practise common spellings.'),
  mcqc(ES, 1, 'B1+', 'You miss an answer in Listening. What is the best action?', ['Guess quickly and keep listening', 'Stop and think for a minute', 'Leave all the next questions empty', 'Ask the speaker to repeat'], 'You hear the recording once, so move on or you will lose the next answers too.'),
  mcqc(ES, 1, 'B1+', 'In Reading, what is a good way to start a passage?', ['Skim the text for the main idea, then answer the questions', 'Translate every word', 'Read the last sentence only', 'Memorise the first paragraph'], 'Skimming saves time. You do not need to understand every word.'),
  mcqc(ES, 1, 'B1+', 'You do not understand a Speaking question. What should you do?', ['Politely ask the examiner to repeat it', 'Stay silent', 'Change the topic', 'Say "No answer"'], 'Asking for repetition is fine. Silence is worse.'),
  mcqc(ES, 1, 'B1+', 'Which is better in Speaking?', ['Extended answers with reasons and examples', 'One-word answers', 'A memorised speech', 'Very fast speech'], 'A longer answer shows more vocabulary and grammar.'),
  mcqc(ES, 1, 'B1+', 'You have two minutes left in Writing Task 2 and no conclusion. What should you do?', ['Write a short conclusion', 'Start a new body paragraph', 'Stop writing', 'Rewrite the introduction'], 'A short conclusion is better than no conclusion.'),
  mcqc(ES, 1, 'B1+', 'In the paper-based Listening and Reading tests, what do you use to write your answers?', ['A pencil', 'A red pen', 'A marker', 'A computer only'], 'Paper answer sheets for Listening and Reading are completed in pencil.'),
  mcqc(ES, 1, 'B1+', 'In Listening, what should you do before each recording starts?', ['Read the questions and underline key words', 'Close your eyes', 'Read the answers in the audio script', 'Write your name only'], 'Reading first helps you know what to listen for.'),
  mcqc(ES, 1, 'B1', 'In which Listening section is there a conversation about an everyday situation?', ['Section 1', 'Section 4', 'None of them', 'Only the last section'], 'Section 1 is a conversation between two people in an everyday situation, for example booking something.'),

  // ================= speaking-language (additions) =================
  mcqc(SL, 1, 'B1+', 'Which phrase helps you give an example?', ['For instance,', 'Whereas,', 'Unless,', 'Because of,'], '"For instance" and "for example" introduce an example.'),
  mcqc(SL, 1, 'B1+', 'Which sentence talks about a past habit correctly?', ['When I was a child, I used to play outside every day.', 'When I was a child, I use to playing outside every day.', 'When I am child, I play outside every day.', 'Before, I playing outside every day.'], '"Used to + base verb" describes a past habit.'),
  mcqc(SL, 1, 'B1+', 'Which phrase introduces a reason?', ['The main reason is that...', 'The reason is why because...', 'Reason of it is...', 'Because reason is...'], '"The main reason is that..." is a correct and natural pattern.'),
  mcqc(SL, 1, 'B1+', 'Which sentence compares correctly?', ['Cycling is cheaper than driving.', 'Cycling is more cheap than driving.', 'Cycling is cheap than driving.', 'Cycling is the more cheaper than driving.'], 'Short adjectives take -er: cheap, cheaper.'),
  mcqc(SL, 1, 'B1+', 'Which answer to "What do you do in your free time?" is better?', ['I usually go for a walk in the park, and sometimes I meet friends.', 'Walk.', 'I free time walk.', 'No.'], 'A good answer is a full sentence with a little detail.'),
  mcqc(SL, 1, 'B1+', 'Which phrase helps you correct yourself politely?', ['Sorry, I mean...', 'Wrong!', 'No, no, no.', 'I am stupid.'], '"Sorry, I mean..." is a natural way to correct a mistake.'),
  mcqc(SL, 1, 'B1+', 'Which linking word shows a result in speech?', ['so', 'but', 'although', 'while'], '"So" shows a result: "It was raining, so we stayed in."'),
  mcqc(SL, 1, 'B1+', 'Which is a correct way to talk about plans?', ['I am planning to start a course next month.', 'I plan to to start a course next month.', 'I am plan start a course next month.', 'I will to start a course next month.'], '"Be planning to + verb" is a natural pattern.'),
  mcqc(SL, 1, 'B1+', 'Which sentence about experience is correct?', ['I have never been to Japan, but I would love to go.', 'I never have been in Japan, but I love go.', 'I did not been to Japan, but I would go.', 'I have never go to Japan, but I would love.'], 'Present perfect (have never been) talks about life experience.'),
  mcqc(SL, 1, 'B1+', 'You do not know much about a Part 3 topic. What can you say?', ['I have never thought about it before, but I suppose...', 'I do not know. Next question.', 'Nothing.', 'No.'], 'This keeps you talking and gives you thinking time.'),
  mcqc(SL, 1, 'B1+', 'Which is a better way to say "very tired"?', ['exhausted', 'very much tired', 'too tired', 'a tired'], '"Exhausted" is a strong adjective that means very tired.'),
  mcqc(SL, 1, 'B1+', 'Which is a better way to say "very good"?', ['excellent', 'more good', 'good good', 'well'], '"Excellent" is a stronger adjective.'),
  mcqc(SL, 1, 'B1+', 'What does "a piece of cake" mean?', ['very easy', 'delicious', 'expensive', 'small'], 'It is an idiom: something is very easy to do.'),
  mcqc(SL, 1, 'B1+', 'What does "once in a blue moon" mean?', ['very rarely', 'every day', 'at night', 'very soon'], 'It means something happens almost never.'),
  mcqc(SL, 1, 'B1+', 'What does "I am feeling under the weather" mean?', ['I feel a little ill', 'It is raining', 'I am cold', 'I am outside'], '"Under the weather" means slightly ill.'),
  mcqc(SL, 1, 'B1+', 'What does "to get along with someone" mean?', ['to have a good relationship with them', 'to walk next to them', 'to argue with them', 'to meet them'], 'If you get along with a person, you are friendly with each other.'),
  mcqc(SL, 2, 'B2', 'Which Part 3 answer is more developed? Question: "Does technology make life easier?"', ['Yes, in many ways. For example, we can pay bills online, which saves time. However, it can also be stressful.', 'Yes.', 'Technology is good.', 'I think so, maybe.'], 'A strong answer gives an opinion, an example and a balanced point.'),
  mcqc(SL, 1, 'B1+', 'Which phrase can start your Part 2 talk?', ['I would like to talk about...', 'Next one', 'No idea', 'Hmm, hmm, hmm'], 'A clear starter helps you organise the talk.'),
  mcqc(SL, 1, 'B1+', 'What helps you sound natural in English?', ['Using stress and intonation', 'Speaking in a flat voice', 'Whispering', 'Shouting'], 'Stress and intonation make your speech easier to follow.'),
  gap(SL, 1, 'B1+', 'Write one word: In my ___, online lessons are very useful.', ['opinion', 'view', 'experience'], '"In my opinion / view / experience" introduces your own idea.'),
  gap(SL, 1, 'B1+', 'Write one word: I would ___ to visit Japan one day.', ['like', 'love'], '"Would like to" or "would love to" talks about a wish.'),
  gap(SL, 1, 'B1+', 'Write one word: I ___ to live in the countryside when I was a child.', ['used'], '"Used to + verb" talks about a past habit or state.'),
  gap(SL, 1, 'B1+', 'Write one word: What I like ___ about my job is the people.', ['most', 'best'], '"What I like most / best about..." is a natural pattern.'),
  gap(SL, 1, 'B1+', 'Write one word: That is an interesting question. Let me ___ for a moment.', ['think'], '"Let me think" gives you time to prepare an answer.'),

  // ================= task2-structure (additions) =================
  mcqc(T2, 1, 'B1+', 'The question says: "Do the advantages outweigh the disadvantages?" What type of essay is this?', ['Advantages and disadvantages', 'Problem and solution', 'Discussion', 'Two-part question'], "The words \"advantages\" and \"disadvantages\" show the essay type. Because the question asks whether one side outweighs the other, you must also give a clear opinion."),
  mcqc(T2, 1, 'B1+', 'The question says: "To what extent do you agree or disagree?" What must you do?', ['Give a clear opinion', 'Only describe both sides without an opinion', 'List only problems', 'Write a story'], 'You must say how far you agree and give reasons.'),
  mcqc(T2, 1, 'B1+', 'The question says: "Discuss both views and give your own opinion." What is the best plan?', ['Introduction, view 1, view 2, conclusion with your opinion', 'Introduction, only view 1, conclusion', 'Introduction, a story, conclusion', 'Only a conclusion'], 'A discussion essay needs both views and your own opinion.'),
  mcqc(T2, 1, 'B1+', 'In a problem and solution essay, the body paragraphs usually ___.', ['describe the problems and then the solutions', 'argue for and against only', 'describe a graph', 'tell a personal story'], 'First explain the problems or causes, then give practical solutions.'),
  mcqc(T2, 1, 'B1+', 'A two-part question asks: "Why is this happening? Is it a positive or negative development?" You must ___.', ['answer both questions', 'answer only the first', 'answer only the second', 'write about a different topic'], 'Every part of the question must be answered.'),
  mcqc(T2, 1, 'B1+', 'Which sentence is a clear opinion in an introduction?', ['I strongly believe that governments should fund public transport.', 'There are many opinions about transport.', 'Transport is everywhere.', 'Some people agree and some do not.'], 'A clear position answers the question directly.'),
  mcqc(T2, 1, 'B1+', 'How long should an introduction be?', ['About 40 to 60 words', 'About 200 words', 'One word', 'About 500 words'], 'A short introduction leaves enough words for the body paragraphs.'),
  mcqc(T2, 1, 'B1+', 'About how long should you spend on Task 2?', ['40 minutes', '10 minutes', '90 minutes', '20 minutes'], 'You have 60 minutes in total. Spend about 20 on Task 1 and 40 on Task 2.'),
  mcqc(T2, 1, 'B1+', 'Which is a good topic sentence?', ['One major benefit of remote work is the time saved on commuting.', 'Remote work.', 'For example, my uncle works at home.', 'In conclusion, I agree.'], 'A topic sentence states the main idea of the paragraph.'),
  mcqc(T2, 1, 'B1+', 'How long should you plan before you start writing Task 2?', ['About 5 minutes', 'About 30 minutes', 'No time', 'About 20 minutes'], 'A short plan helps you write clearly. Do not spend too long.'),
  mcqc(T2, 1, 'B1+', 'Which sentence is the best paraphrase of "Some people think that children spend too much time on screens"?', ['Many people argue that children use screens for too many hours.', 'Some people think that children spend too much time on screens.', 'Children and screens.', 'Screens are bad.'], 'A paraphrase keeps the meaning but changes the words and structure.'),
  mcqc(T2, 1, 'B1+', 'Which is NOT a good idea in Task 2?', ['Memorising a full essay and using it for any topic', 'Giving examples', 'Making a plan', 'Checking your grammar'], 'Examiners can see memorised text, and it may not answer the question.'),
  mcqc(T2, 1, 'B1+', 'A conclusion should ___.', ['summarise your main points and opinion', 'introduce a completely new argument', 'ask the reader a long question', 'repeat the whole essay'], 'The conclusion closes the essay. It does not add new ideas.'),
  mcqc(T2, 1, 'B1+', 'A well-developed body paragraph has ___.', ['a main idea, an explanation and an example', 'only a list of examples', 'a question and a joke', 'three conclusions'], 'Each idea needs explanation and support.'),
  mcqc(T2, 1, 'B1+', 'Which phrase introduces the conclusion?', ['To sum up,', 'For example,', 'Moreover,', 'Whereas,'], '"To sum up" and "In conclusion" start a conclusion.'),
  mcqc(T2, 1, 'B1+', 'If you write only 200 words in Task 2, ___.', ['you may lose marks for being under length', 'you get full marks', 'the examiner stops reading', 'your score is not affected'], 'Under 250 words reduces your Task Response score.'),
  mcqc(T2, 1, 'B1+', 'Which essay type asks you to explain two views and give your opinion?', ['Discussion essay', 'Problem and solution essay', 'Two-part question', 'Report'], 'A discussion essay needs both views and your opinion.'),
  mcqc(T2, 1, 'B1+', 'Which is the best way to give an example in an essay?', ['For example, many students in my country use online lessons to prepare for exams.', 'Example: students online.', 'Online lessons.', 'I saw an example.'], 'A good example is a full sentence that supports the idea.'),
  mcqc(T2, 1, 'B1+', 'Task 2 should be written in ___ style.', ['formal', 'slang', 'text-message', 'very informal'], 'Academic writing is formal.'),
  mcqc(T2, 1, 'B1+', 'Which sentence is acceptable in formal writing?', ['Many people are concerned about pollution.', 'Loads of people are worried about pollution.', 'Folks are freaking out about pollution.', 'Pollution is a total nightmare, guys.'], 'Use formal words and avoid slang in IELTS Writing.'),
  mcqc(T2, 1, 'B1+', 'You write "I will discuss both views" in a discussion essay. What else must you do?', ['Give your own opinion', 'Avoid giving any opinion', 'Repeat the question in each paragraph', 'List ten more views'], 'The question asks for your opinion, so it must be clear.'),
  mcqc(T2, 1, 'B1+', 'Contractions such as "don\'t" in Task 2 are ___.', ['better avoided in formal writing', 'required', 'always correct', 'a sign of a high band'], 'Write "do not" in formal essays.'),
  gap(T2, 1, 'B1+', 'The first sentence of a body paragraph states the main idea. It is called the ___ sentence.', ['topic'], 'The topic sentence tells the reader what the paragraph is about.'),
  gap(T2, 1, 'B1+', 'In a "To what extent do you agree?" essay, you should clearly state your ___ in the introduction. (one word)', ['opinion', 'position', 'view', 'stance'], 'A clear opinion or position helps the examiner follow your essay.'),

  // ================= mixed-review (additions) =================
  mcqc(M, 1, 'B1', 'Which sentence is correct?', ['She has lived here for five years.', 'She lives here since five years.', 'She is living here for five years.', 'She has live here for five years.'], 'Present perfect (has lived) + for + a period of time.'),
  mcqc(M, 1, 'B1', 'The bridge ___ by a famous engineer in 1920.', ['was designed', 'designed', 'is designing', 'has design'], 'The bridge receives the action, and 1920 is a finished time: was designed.'),
  mcqc(M, 1, 'B1', 'If we ___ now, we will catch the train.', ['leave', 'will leave', 'left', 'would leave'], 'First conditional: if + present simple, will + verb.'),
  mcqc(M, 1, 'B1', 'He asked me ___ I liked my job.', ['if', 'that', 'what', 'which'], 'For yes/no questions in reported speech we use "if" or "whether".'),
  mcqc(M, 1, 'B1', 'I like ___ coffee, but I do not like ___ tea.', ['no article / no article', 'the / the', 'a / a', 'an / an'], 'We use no article for things in general.'),
  mcqc(M, 1, 'B1+', 'Which word is an adjective?', ['reliable', 'reliably', 'reliability', 'rely'], '"Reliable" is the adjective. "Reliably" is an adverb, "reliability" a noun, "rely" a verb.'),
  mcqc(M, 1, 'B1+', 'Please ___ a seat. The doctor will see you soon.', ['take', 'make', 'do', 'put'], 'We say "take a seat".'),
  mcqc(M, 1, 'B1+', 'Which sentence is correct?', ['Although it was raining, we went out.', 'Although it was raining, but we went out.', 'Despite it was raining, we went out.', 'In spite it was raining, we went out.'], '"Although" joins two clauses without "but". "Despite" needs a noun or -ing.'),
  mcqc(M, 1, 'B1+', 'Which is the correct spelling?', ['necessary', 'neccessary', 'necesary', 'nessesary'], 'Necessary has one c and two s: ne-ces-sa-ry.'),
]);

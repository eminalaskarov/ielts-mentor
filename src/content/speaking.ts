import type { SpeakingPrompt } from './types';

const p1 = (n: number, topic: string, questions: string[], usefulLanguage: string[], phase: 1 | 2 = 1): SpeakingPrompt => ({
  id: `sp-${String(n).padStart(4, '0')}`, part: 1, phase, topic, questions, usefulLanguage,
});

export const SPEAKING_PART1: SpeakingPrompt[] = [
  p1(1, 'Hometown', ['Where is your hometown?', 'What do you like most about it?', 'Has your hometown changed much in recent years?', 'Would you like to live there in the future?'], ['I come from...', 'It is famous for...', 'What I like most is...']),
  p1(2, 'Work or studies', ['Do you work or are you a student?', 'Why did you choose this job or subject?', 'What do you find most difficult about it?', 'What would you like to do in the future?'], ['I am currently studying...', 'I chose it because...', 'In the future I hope to...']),
  p1(3, 'Home', ['Do you live in a house or an apartment?', 'Which room do you spend most time in?', 'Is there anything you would like to change in your home?'], ['I spend most of my time in...', 'It is quite spacious / cosy...']),
  p1(4, 'Family', ['Do you have a large family?', 'Who are you closest to in your family?', 'Do you spend much time with your relatives?'], ['I am very close to...', 'We get together on...']),
  p1(5, 'Food and cooking', ['What is your favourite food?', 'Do you like cooking?', 'Is food in your country healthy?', 'Do you prefer eating at home or in restaurants?'], ['I am keen on...', 'I would rather eat...', 'It is rich in...']),
  p1(6, 'Daily routine', ['What is your daily routine like?', 'Which part of the day do you like best?', 'Would you like to change your routine?'], ['I usually get up at...', 'After that, I...', 'I am a morning / evening person.']),
  p1(7, 'Friends', ['Do you prefer to spend time with one friend or a group?', 'How often do you see your friends?', 'What do you like doing together?'], ['We hang out...', 'We have a lot in common.']),
  p1(8, 'Weather', ['What is the weather like in your country?', 'What is your favourite season?', 'Does the weather affect your mood?'], ['It gets very hot / cold...', 'I enjoy...because...']),
  p1(9, 'Transport', ['How do you usually travel around your city?', 'Is public transport good where you live?', 'Do you prefer travelling by car or public transport?'], ['I usually take...', 'It is convenient / crowded.']),
  p1(10, 'Technology', ['How often do you use your phone?', 'What do you use the internet for?', 'Do you think people spend too much time online?'], ['I spend about... hours a day', 'It helps me to...']),
  p1(11, 'Hobbies', ['What do you like doing in your free time?', 'Have you had the same hobbies since you were a child?', 'Do you prefer indoor or outdoor activities?'], ['In my free time I...', 'I have been into... for years.']),
  p1(12, 'Music', ['What kind of music do you like?', 'Do you play a musical instrument?', 'Do you listen to music while working or studying?'], ['I am a big fan of...', 'It helps me relax.']),
  p1(13, 'Shopping', ['Do you like shopping?', 'Do you prefer shopping online or in shops?', 'What was the last thing you bought?'], ['I prefer... because...', 'It saves time / money.']),
  p1(14, 'Sport and exercise', ['Do you do any sport?', 'Did you play sports at school?', 'Is sport popular in your country?'], ['I try to keep fit by...', 'It is a popular pastime.']),
  p1(15, 'Reading', ['Do you enjoy reading?', 'What kind of books do you like?', 'Do you read more on paper or on a screen?'], ['I am fond of...', 'I cannot put it down.']),
  p1(16, 'Holidays', ['Where did you go on your last holiday?', 'Do you prefer relaxing or active holidays?', 'Where would you like to go next?'], ['I went to...', 'I would love to visit...']),
  p1(17, 'Clothes', ['What kind of clothes do you usually wear?', 'Do you like to follow fashion?', 'Do you wear different clothes for work and at home?'], ['I prefer comfortable clothes.', 'I pay attention to...']),
  p1(18, 'Sleep', ['How many hours do you sleep?', 'Do you ever take a nap in the day?', 'What do you do if you cannot sleep?'], ['I need at least... hours', 'It makes me feel refreshed.']),
  p1(19, 'Neighbours', ['Do you know your neighbours well?', 'Do you think it is important to have good neighbours?', 'Have you ever helped a neighbour?'], ['We say hello...', 'They are very helpful.']),
  p1(20, 'Languages', ['Which languages can you speak?', 'Why are you learning English?', 'What is the most difficult thing about learning English?'], ['I started learning when...', 'The hardest part is...'], 1),
];

const p2 = (n: number, topic: string, task: string, bullets: string[], phase: 1 | 2 | 3 = 1, usefulLanguage?: string[]): SpeakingPrompt => ({
  id: `sp-${String(n).padStart(4, '0')}`, part: 2, phase, topic, questions: [task], bullets, ...(usefulLanguage ? { usefulLanguage } : {}),
});

export const SPEAKING_PART2: SpeakingPrompt[] = [
  p2(101, 'A person who helped you', 'Describe a person who has helped you.', ['who the person is', 'how you know this person', 'how this person helped you', 'and explain how you felt about it'], 1, ['I will never forget when...', 'I am really grateful because...']),
  p2(102, 'A place you like', 'Describe a place in your town where you like to spend time.', ['where the place is', 'what it looks like', 'what you do there', 'and explain why you like it'], 1),
  p2(103, 'A memorable journey', 'Describe a journey that you remember well.', ['where you went', 'who you went with', 'how you travelled', 'and explain why you remember it'], 1, ['It was one of the best trips I have ever had...']),
  p2(104, 'A gift', 'Describe a gift you gave to someone.', ['what the gift was', 'who you gave it to', 'why you chose it', 'and explain how the person reacted'], 1),
  p2(105, 'A book or film', 'Describe a book or a film that you enjoyed.', ['what it was called', 'what it was about', 'when you read or saw it', 'and explain why you enjoyed it'], 1),
  p2(106, 'An important family object', 'Describe an object that is important in your family.', ['what it is', 'where it came from', 'who uses it', 'and explain why it is important to your family'], 1),
  p2(107, 'A skill you learned', 'Describe a skill that you learned and are proud of.', ['what the skill is', 'how you learned it', 'how long it took', 'and explain why you are proud of it'], 2),
  p2(108, 'A festival or celebration', 'Describe a festival or celebration in your country.', ['what the festival is', 'when it takes place', 'what people do', 'and explain what you enjoy about it'], 1),
  p2(109, 'A time you were busy', 'Describe a time when you were very busy.', ['when it was', 'what you had to do', 'why you were so busy', 'and explain how you managed your time'], 2),
  p2(110, 'A healthy habit', 'Describe a healthy habit that you have.', ['what the habit is', 'when you started it', 'how often you do it', 'and explain how it helps you'], 1),
  p2(111, 'A piece of technology', 'Describe a piece of technology that you find useful.', ['what it is', 'how you use it', 'how long you have used it', 'and explain why it is important to you'], 2),
  p2(112, 'A decision you made', 'Describe an important decision you made.', ['what the decision was', 'when you made it', 'who helped you decide', 'and explain whether it was a good decision'], 2),
];

const p3 = (n: number, topic: string, questions: string[], phase: 2 | 3 = 2, usefulLanguage?: string[]): SpeakingPrompt => ({
  id: `sp-${String(n).padStart(4, '0')}`, part: 3, phase, topic, questions, ...(usefulLanguage ? { usefulLanguage } : {}),
});

export const SPEAKING_PART3: SpeakingPrompt[] = [
  p3(201, 'Education', ['What makes a good teacher?', 'Should university education be free for everyone?', 'How will education change in the next twenty years?', 'Is it better to learn practical skills or academic subjects at school?', 'Do students learn more from teachers or from their own experience?', 'Why do some adults go back to study later in life?'], 2, ['It largely depends on...', 'One reason for this is...']),
  p3(202, 'Technology and society', ['How has technology changed the way people communicate?', 'Do you think children use screens too much?', 'What are the dangers of relying on technology?', 'Do you think robots and artificial intelligence will replace many jobs?', 'Is talking online as good as meeting face to face?', 'Should schools teach students how to use social media safely?'], 2),
  p3(203, 'Environment', ['What are the main environmental problems in your country?', 'Who is more responsible for protecting the environment, governments or individuals?', 'Do you think people will care more about nature in the future?', 'Is recycling enough to solve environmental problems?', 'Should companies that pollute pay higher taxes?', 'How can schools teach children to protect nature?'], 2),
  p3(204, 'Work and careers', ['Why do some people change jobs often?', 'Is it more important to enjoy your job or to earn a high salary?', 'How might jobs change in the future?', 'Is working from home better than working in an office?', 'What qualities do employers look for in new staff?', 'Should people have to retire at a fixed age?'], 2),
  p3(205, 'Health', ['Why do many people find it difficult to stay healthy?', 'Should the government do more to encourage healthy eating?', 'Is mental health as important as physical health?', 'Why are some people unwilling to see a doctor?', 'Should sport be compulsory in schools?', "How does stress affect people's health?"], 2),
  p3(206, 'Travel and tourism', ['What are the advantages and disadvantages of tourism for a local area?', 'Why do some people prefer to travel independently?', 'How has travel changed in the last fifty years?', 'Does travel help people to understand other cultures?', 'Is it better to spend money on travel or on things you can keep?', 'How can tourists avoid damaging the places they visit?'], 3),
  p3(207, 'Family and society', ['How have family relationships changed over the last generation?', 'Do you think older people are respected enough?', 'What can communities do to help people feel less lonely?', 'Is it better for children to be brought up by their parents or by their grandparents?', 'Do young people have more freedom now than in the past?', 'What are the benefits of living near relatives?'], 3),
  p3(208, 'Cities and housing', ['Why are so many people moving to cities?', 'What problems do big cities face?', 'How can cities be made more pleasant places to live?', 'Should cities limit the number of private cars?', 'Is life in a small town better than life in a big city?', 'What facilities does a city need to be a good place for young people?'], 3),
];

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [...SPEAKING_PART1, ...SPEAKING_PART2, ...SPEAKING_PART3];

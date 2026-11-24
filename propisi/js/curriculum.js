// Программа обучения: разделы, уроки и строки прописей.

export const LETTERS = {
  'а': ['арбуз', '🍉', 'а'], 'б': ['банан', '🍌', 'бэ'], 'в': ['волк', '🐺', 'вэ'], 'г': ['гриб', '🍄', 'гэ'],
  'д': ['дом', '🏠', 'дэ'], 'е': ['ель', '🌲', 'е'], 'ё': ['ёж', '🦔', 'ё'], 'ж': ['жук', '🐞', 'жэ'],
  'з': ['заяц', '🐰', 'зэ'], 'и': ['индюк', '🦃', 'и'], 'й': ['йогурт', '🥛', 'и краткое'], 'к': ['кот', '🐱', 'ка'],
  'л': ['лиса', '🦊', 'эль'], 'м': ['мышь', '🐭', 'эм'], 'н': ['нос', '👃', 'эн'], 'о': ['облако', '☁️', 'о'],
  'п': ['пчела', '🐝', 'пэ'], 'р': ['рыба', '🐟', 'эр'], 'с': ['слон', '🐘', 'эс'], 'т': ['тигр', '🐯', 'тэ'],
  'у': ['утка', '🦆', 'у'], 'ф': ['флаг', '🚩', 'эф'], 'х': ['хлеб', '🍞', 'ха'], 'ц': ['цветок', '🌸', 'цэ'],
  'ч': ['часы', '⏰', 'че'], 'ш': ['шар', '🎈', 'ша'], 'щ': ['щенок', '🐶', 'ща'], 'ъ': ['подъезд', '🏢', 'твёрдый знак'],
  'ы': ['сыр', '🧀', 'ы'], 'ь': ['конь', '🐴', 'мягкий знак'], 'э': ['эскимо', '🍦', 'э'], 'ю': ['юбка', '👗', 'ю'],
  'я': ['яблоко', '🍎', 'я'],
};

// Порядок изучения букв — как в букваре
export const ORDER = 'аоиыунсктлрвепмзбдягчьшжёйхюцэщфъ';

const NAMES = {
  'А': 'Аня', 'Б': 'Боря', 'В': 'Вова', 'Г': 'Галя', 'Д': 'Дима', 'Е': 'Ева', 'Ё': 'Ёжик', 'Ж': 'Женя', 'З': 'Зоя',
  'И': 'Ира', 'Й': 'Йорк', 'К': 'Катя', 'Л': 'Лена', 'М': 'Маша', 'Н': 'Нина', 'О': 'Оля', 'П': 'Петя', 'Р': 'Рома',
  'С': 'Саша', 'Т': 'Таня', 'У': 'Уля', 'Ф': 'Федя', 'Х': 'Хома', 'Ц': 'Царь', 'Ч': 'Чук', 'Ш': 'Шура', 'Щ': 'Щука',
  'Э': 'Эля', 'Ю': 'Юля', 'Я': 'Яна',
};

const BANK = ('ау уа иа он но на ну ан сон нос сын сани сок кони кино окно утка кот кто так тут нота кит ' +
  'лиса слон стол стул лук кукла рак рука рот торт урок корова ворона слива трава волк ветер лес лето репа пила папа ' +
  'суп лапа мама мыло мост зонт коза роза зима зуб бант рыба бусы дуб дом вода дыня дети мяч яма няня ' +
  'гора гусь книга нога час чай туча ночь день пень конь соль шар каша мышь шуба жук ёж ложка лыжи ёлка мёд ' +
  'йод май чайка зайка хлеб муха петух юла юбка утюг цветок цирк заяц эхо этаж щука щенок ящик флаг шарф фото ' +
  'объём съел подъезд').split(' ');

function wordsFor(ch) {
  const learned = new Set(ORDER.slice(0, ORDER.indexOf(ch) + 1));
  const fit = BANK.filter(w => w.includes(ch) && [...w].every(c => learned.has(c)));
  // сначала те, где буква встречается в начале, потом покороче
  fit.sort((a, b) => (a.indexOf(ch) > 0) - (b.indexOf(ch) > 0) || a.length - b.length);
  return fit.slice(0, 2);
}

const WORD_EMOJI = {
  мама: '👩', папа: '👨', баба: '👵', деда: '👴', кот: '🐱', пёс: '🐶', лиса: '🦊', волк: '🐺', ёж: '🦔', заяц: '🐰',
  сова: '🦉', гриб: '🍄', суп: '🍲', каша: '🥣', хлеб: '🍞', сыр: '🧀', торт: '🎂', мёд: '🍯', чай: '🍵', сок: '🧃',
  дом: '🏠', окно: '🪟', стол: '🪑', стул: '🪑', небо: '🌤️', река: '🏞️', лес: '🌲', море: '🌊', мяч: '⚽', кукла: '🪆',
  шар: '🎈', юла: '🌀', книга: '📖', ручка: '🖊️', урок: '🔔', класс: '🏫', зима: '❄️', весна: '🌷', лето: '☀️', осень: '🍂',
};
const THEMES = [
  ['Семья', '👨‍👩‍👧', 'мама папа баба деда'], ['Звери', '🐾', 'кот пёс лиса волк'], ['В лесу', '🌲', 'ёж заяц сова гриб'],
  ['Обед', '🍲', 'суп каша хлеб сыр'], ['Сладости', '🍬', 'торт мёд чай сок'], ['Дом', '🏡', 'дом окно стол стул'],
  ['Природа', '🌤️', 'небо река лес море'], ['Игрушки', '🧸', 'мяч кукла шар юла'], ['Школа', '🎒', 'книга ручка урок класс'],
  ['Времена года', '🍂', 'зима весна лето осень'],
];
const SENTENCES = [
  ['👩', 'Мама мыла раму.', 'У Ани кот.'], ['🏠', 'Вот мой дом.', 'Я люблю маму!'], ['🥣', 'Саша ест кашу.', 'Кот пьёт сок.'],
  ['🌧️', 'Идёт дождь.', 'Мы идём в лес.'], ['🤝', 'Это мой друг.', 'У нас урок.'], ['📖', 'Папа читал книгу.', 'Я умею писать!'],
  ['☀️', 'Светит солнце.', 'Зима. Идёт снег.'], ['🎉', 'Спасибо, мама!', 'С днём рождения!'],
];
const WARM = [
  ['line', 'Дорожки', '🛤️'], ['stick', 'Палочки', '🥢'], ['tall', 'Столбики', '🪜'], ['zigzag', 'Горы', '⛰️'],
  ['wave', 'Волны', '🌊'], ['circle', 'Шарики', '🎈'], ['square', 'Окошки', '🪟'], ['tri', 'Крыши', '🏠'],
  ['arcs', 'Радуги', '🌈'], ['cups', 'Улыбки', '😊'],
];
const CELEM = [
  ['cstick', 'Наклонные палочки', '🌧️'], ['ctall', 'Длинные палочки', '🎋'], ['chook', 'Крючок', '🪝'],
  ['ctallhook', 'Длинный крючок', '☂️'], ['carch', 'Тросточка', '🦯'], ['cboth', 'Горка', '🎢'], ['chooks', 'Заборчик', '🌾'],
  ['coval', 'Овал', '🥚'], ['cleft', 'Левый полуовал', '🌙'], ['cright', 'Правый полуовал', '🌛'],
  ['cloopdown', 'Петля вниз', '🎣'], ['cloopup', 'Петля вверх', '🎀'], ['ceee', 'Петельки', '➰'],
];

const R = (set, text, mode) => ({ set, keys: Array.isArray(text) ? text : [...text], mode });
const young = a => a <= 5, mid = a => a === 6 || a === 7;

function elemLesson(sec, set, [key, title, emoji]) {
  return {
    id: `${sec}:${key}`, sec, title, emoji, say: title, label: { set, keys: [key] },
    intro: { set, keys: [key], word: title, emoji },
    rows: a => young(a) ? [R(set, [key], 'trace'), R(set, [key], 'trace'), R(set, [key], 'dots')]
      : [R(set, [key], 'trace'), R(set, [key], 'dots'), R(set, [key], 'free')],
  };
}

function build() {
  const S = [];
  S.push({ id: 'warm', title: 'Разминка', sub: 'Линии и фигуры', color: '#ff9f43', icon: { set: 'e', keys: ['wave'] }, lessons: WARM.map(w => elemLesson('warm', 'e', w)) });

  S.push({
    id: 'print', title: 'Печатные буквы', sub: 'Вся азбука', color: '#2e9bf0', icon: { set: 'p', keys: ['А', 'а'] },
    lessons: [...ORDER].map(ch => {
      const U = ch.toUpperCase(), [word, emoji, name] = LETTERS[ch];
      return {
        id: `print:${ch}`, sec: 'print', title: `Буква ${U}`, emoji, say: `Буква ${name}. ${word}.`, label: { set: 'p', keys: [U, ch] }, sticker: emoji,
        intro: { set: 'p', keys: [U, ch], word, emoji, hi: ch },
        rows: a => young(a)
          ? [R('p', U, 'trace'), R('p', U, 'dots'), R('p', ch, 'trace'), R('p', ch, 'dots'), R('p', word.toUpperCase(), 'trace')]
          : [R('p', U, 'trace'), R('p', U, 'dots'), R('p', U, 'free'), R('p', ch, 'trace'), R('p', ch, 'dots'), R('p', ch, 'free'), R('p', word, 'trace'), R('p', word, 'free')],
      };
    }),
  });

  const wordLessons = (sec, set, upper) => THEMES.map(([title, emoji, list]) => {
    const words = list.split(' ');
    return {
      id: `${sec}:${title}`, sec, title, emoji, say: title, label: { emoji, text: title }, words: words.map(w => [w, WORD_EMOJI[w]]),
      rows: a => words.flatMap(w => {
        const t = upper ? w.toUpperCase() : w;
        return young(a) ? [R(set, t, 'trace'), R(set, t, 'dots')] : [R(set, t, 'trace'), R(set, t, 'dots'), R(set, t, 'free')];
      }),
    };
  });
  S.push({ id: 'pwords', title: 'Слова печатными', sub: 'Первые слова', color: '#27ae60', icon: { set: 'p', keys: [...'КОТ'] }, lessons: wordLessons('pwords', 'p', true) });

  S.push({ id: 'celem', title: 'Элементы букв', sub: 'Крючки, овалы, петли', color: '#f368a0', icon: { set: 'ce', keys: ['chooks'] }, lessons: CELEM.map(w => elemLesson('celem', 'ce', w)) });

  S.push({
    id: 'clow', title: 'Строчные буквы', sub: 'Пишем прописью', color: '#8e5cf7', icon: { set: 'c', keys: [...'абв'] },
    lessons: [...ORDER].map(ch => {
      const [word, emoji, name] = LETTERS[ch], ws = wordsFor(ch);
      return {
        id: `clow:${ch}`, sec: 'clow', title: `Строчная ${ch}`, emoji, say: `Буква ${name}. ${word}.`, label: { set: 'c', keys: [ch] }, sticker: emoji,
        intro: { set: 'c', keys: [ch], word, emoji, hi: ch },
        rows: a => (mid(a) || young(a))
          ? [R('c', ch, 'trace'), R('c', ch, 'trace'), R('c', ch, 'dots'), R('c', ch, 'free'), ...ws.slice(0, 1).flatMap(w => [R('c', w, 'trace'), R('c', w, 'dots')])]
          : [R('c', ch, 'trace'), R('c', ch, 'dots'), R('c', ch, 'free'), ...ws.flatMap(w => [R('c', w, 'trace'), R('c', w, 'free')])],
      };
    }),
  });

  S.push({
    id: 'cup', title: 'Заглавные буквы', sub: 'Большие прописные', color: '#e84393', icon: { set: 'c', keys: [...'АБ'] },
    lessons: [...ORDER].filter(c => !'ъыь'.includes(c)).map(ch => {
      const U = ch.toUpperCase(), [, , name] = LETTERS[ch], nm = NAMES[U];
      return {
        id: `cup:${ch}`, sec: 'cup', title: `Заглавная ${U}`, emoji: '✍️', say: `Заглавная буква ${name}. ${nm}.`, label: { set: 'c', keys: [U] },
        intro: { set: 'c', keys: [U], word: nm, emoji: '✍️', hi: U },
        rows: a => (mid(a) || young(a))
          ? [R('c', U, 'trace'), R('c', U, 'trace'), R('c', U, 'dots'), R('c', U, 'free'), R('c', nm, 'trace')]
          : [R('c', U, 'trace'), R('c', U, 'dots'), R('c', U, 'free'), R('c', U + ch, 'trace'), R('c', nm, 'trace'), R('c', nm, 'free')],
      };
    }),
  });

  S.push({ id: 'cwords', title: 'Слова прописью', sub: 'Соединяем буквы', color: '#00a8cc', icon: { set: 'c', keys: [...'кот'] }, lessons: wordLessons('cwords', 'c', false) });

  S.push({
    id: 'csent', title: 'Предложения', sub: 'Пишем как взрослые', color: '#12947f', icon: { set: 'c', keys: [...'Я!'] },
    lessons: SENTENCES.map(([emoji, s1, s2], i) => ({
      id: `csent:${i}`, sec: 'csent', title: s1, emoji, say: s1, label: { emoji, text: s1 }, sentences: [s1, s2],
      rows: () => [s1, s2].flatMap(s => [R('c', s, 'trace'), R('c', s, 'dots'), R('c', s, 'free')]),
    })),
  });
  return S;
}

export const SECTIONS = build();
export const LESSONS = new Map(SECTIONS.flatMap(s => s.lessons.map(l => [l.id, l])));
export const sectionById = id => SECTIONS.find(s => s.id === id);

/** Какие разделы входят в программу по возрасту (остальные доступны в «Ещё») */
export function pathFor(age) {
  if (age <= 5) return ['warm', 'print', 'pwords'];
  if (age <= 7) return ['warm', 'print', 'celem', 'clow', 'cup', 'cwords'];
  return ['celem', 'clow', 'cup', 'cwords', 'csent'];
}
export function levelName(age) {
  return age <= 5 ? 'Малыши: линии и печатные буквы' : age <= 7 ? 'Дошколята: от печатных к прописным' : 'Школьники: прописи, слова и предложения';
}

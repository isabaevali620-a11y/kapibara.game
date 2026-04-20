// ------------------- ПЕРЕВОДЫ -------------------
const translations = {
    ru: {
        title: "🐹 Капибара Учитель",
        mathMode: "📚 Математика",
        dexterityMode: "🎯 Ловкость",
        quizMode: "📖 Книга вопросов",
        menuInstruction: "Выбери режим и учись с капибарой!",
        score: "Очки:",
        backToMenu: "🏠 В меню",
        dexterityInstruction: "Кликай на появляющиеся предметы!",
        correct: "Молодец! 🎉",
        wrong_prefix: "Ошибка! Правильный ответ: ",
        great: "Отлично!",
        excellent: "Ты гений! ✨",
        tryAgain: "Попробуй ещё!",
        catchMessage: "Хлоп! +1 очко",
        dexterityStart: "Лови предметы!",
        quizTitle: "Естественные науки. Я и мир",
        quizComplete: "Поздравляем! Ты прошёл викторину! 🎓"
    },
    kg: {
        title: "🐹 Капибара Мугалим",
        mathMode: "📚 Математика",
        dexterityMode: "🎯 Шамдылык",
        quizMode: "📖 Суроо китеби",
        menuInstruction: "Режимди танда жана капибара менен үйрөн!",
        score: "Упай:",
        backToMenu: "🏠 Менюга",
        dexterityInstruction: "Пайда болгон нерселерди чыкылдат!",
        correct: "Жакшы! 🎉",
        wrong_prefix: "Ката! Туура жооп: ",
        great: "Сонун!",
        excellent: "Сен генийсиң! ✨",
        tryAgain: "Дагы аракет кыл!",
        catchMessage: "Бастың! +1 упай",
        dexterityStart: "Нерселерди карма!",
        quizTitle: "Жаратылыш илимдери. Мен жана дүйнө",
        quizComplete: "Куттуктайбыз! Сен викторинаны бүтүрдүң! 🎓"
    }
};

let currentLang = 'ru';

// DOM элементы
const menuSection = document.getElementById('menuSection');
const mathSection = document.getElementById('mathSection');
const dexteritySection = document.getElementById('dexteritySection');
const quizSection = document.getElementById('quizSection');
const capybara = document.getElementById('capybara');
const capybaraMessage = document.getElementById('capybaraMessage');
const scoreSpan = document.getElementById('scoreValue');

// Общий счёт (для всех режимов)
let currentScore = 0;

// ---------- Режим Математики ----------
let mathActive = false;
let currentDifficulty = 8;
let currentQuestion = null;
let currentCorrectAnswer = null;

function generateMathQuestion() {
    const operation = Math.floor(Math.random() * 3);
    let a, b, answer, questionText;
    if (operation === 0) {
        a = Math.floor(Math.random() * (currentDifficulty + 1));
        b = Math.floor(Math.random() * (currentDifficulty + 1));
        answer = a + b;
        questionText = `${a} + ${b}`;
    } else if (operation === 1) {
        a = Math.floor(Math.random() * (currentDifficulty + 1));
        b = Math.floor(Math.random() * (a + 1));
        answer = a - b;
        questionText = `${a} - ${b}`;
    } else {
        let maxMul = Math.min(6, Math.floor(currentDifficulty / 2) + 2);
        if (maxMul < 2) maxMul = 2;
        a = Math.floor(Math.random() * (maxMul - 1)) + 2;
        b = Math.floor(Math.random() * (maxMul - 1)) + 2;
        answer = a * b;
        questionText = `${a} × ${b}`;
    }
    return { questionText, answer };
}

function generateOptions(correct, count = 4) {
    let options = new Set();
    options.add(correct);
    while (options.size < count) {
        let offset = Math.floor(Math.random() * (Math.max(5, Math.floor(correct / 2) + 3))) + 1;
        let variant = correct + (Math.random() > 0.5 ? offset : -offset);
        if (variant < 0) variant = correct + offset;
        if (variant === correct) variant = correct + 1;
        options.add(variant);
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
}

function renderMathQuestion() {
    const q = generateMathQuestion();
    currentQuestion = q.questionText;
    currentCorrectAnswer = q.answer;
    document.getElementById('mathQuestion').innerText = currentQuestion;
    const options = generateOptions(currentCorrectAnswer);
    const btnsContainer = document.getElementById('answerButtons');
    btnsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerText = opt;
        btn.addEventListener('click', () => checkMathAnswer(opt));
        btnsContainer.appendChild(btn);
    });
}

function checkMathAnswer(selected) {
    if (!mathActive) return;
    const feedbackDiv = document.getElementById('feedback');
    if (selected === currentCorrectAnswer) {
        currentScore += 10;
        updateScoreUI();
        let praise = translations[currentLang].correct;
        if (currentScore % 30 === 0) praise = translations[currentLang].excellent;
        else if (currentScore % 20 === 0) praise = translations[currentLang].great;
        showCapybaraMessage(praise, true);
        feedbackDiv.innerHTML = `✅ ${praise}`;
        if (currentDifficulty < 20) currentDifficulty += 1;
        renderMathQuestion();
    } else {
        const wrongMsg = `${translations[currentLang].wrong_prefix}${currentCorrectAnswer}`;
        showCapybaraMessage(wrongMsg, false);
        feedbackDiv.innerHTML = `❌ ${wrongMsg}`;
        renderMathQuestion();
    }
}

function startMathMode() {
    mathActive = true;
    dexterityActive = false;
    quizActive = false;
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    currentScore = 0;
    currentDifficulty = 8;
    updateScoreUI();
    renderMathQuestion();
    document.getElementById('feedback').innerHTML = '';
    showCapybaraMessage(translations[currentLang].great, true);
}

// ---------- Режим Ловкости ----------
let dexterityActive = false;
let spawnIntervalId = null;
let spawnDelay = 1000;
let minDelay = 350;
let speedUpThreshold = 5;
let lastSpeedScore = 0;
let activeObjects = [];

function createCatchObject() {
    if (!dexterityActive) return;
    const field = document.getElementById('gameField');
    const fieldRect = field.getBoundingClientRect();
    const obj = document.createElement('div');
    obj.className = 'catch-object';
    const items = ['🍎', '🍉', '⭐', '🍃', '🐟', '🥕', '🍒', '🦋', '🌸'];
    obj.innerText = items[Math.floor(Math.random() * items.length)];
    const maxX = Math.max(40, fieldRect.width - 70);
    const maxY = Math.max(40, fieldRect.height - 70);
    const left = Math.random() * maxX;
    const top = Math.random() * maxY;
    obj.style.left = `${left}px`;
    obj.style.top = `${top}px`;
    obj.style.position = 'absolute';
    obj.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!dexterityActive) return;
        catchObjectHandler(obj);
    });
    field.appendChild(obj);
    activeObjects.push(obj);
    setTimeout(() => {
        if (obj && obj.parentNode) {
            obj.remove();
            const idx = activeObjects.indexOf(obj);
            if (idx !== -1) activeObjects.splice(idx, 1);
        }
    }, 1400);
}

function catchObjectHandler(obj) {
    if (!dexterityActive) return;
    currentScore++;
    updateScoreUI();
    showCapybaraMessage(translations[currentLang].catchMessage, true);
    if (obj && obj.parentNode) obj.remove();
    const idx = activeObjects.indexOf(obj);
    if (idx !== -1) activeObjects.splice(idx, 1);
    
    if (currentScore >= lastSpeedScore + speedUpThreshold && spawnDelay > minDelay) {
        lastSpeedScore = currentScore;
        spawnDelay = Math.max(minDelay, spawnDelay - 45);
        if (spawnIntervalId) {
            clearInterval(spawnIntervalId);
            spawnIntervalId = setInterval(() => {
                if (dexterityActive) createCatchObject();
            }, spawnDelay);
        }
    }
}

function startDexterityMode() {
    mathActive = false;
    dexterityActive = true;
    quizActive = false;
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    const field = document.getElementById('gameField');
    field.innerHTML = '';
    activeObjects.forEach(obj => { if(obj && obj.remove) obj.remove(); });
    activeObjects = [];
    currentScore = 0;
    spawnDelay = 1000;
    lastSpeedScore = 0;
    updateScoreUI();
    spawnIntervalId = setInterval(() => {
        if (dexterityActive) createCatchObject();
    }, spawnDelay);
    setTimeout(() => { if(dexterityActive) for(let i=0;i<2;i++) createCatchObject(); }, 100);
    showCapybaraMessage(translations[currentLang].dexterityStart, true);
    const inst = document.querySelector('.dexterity-instruction');
    if (inst) inst.innerText = translations[currentLang].dexterityInstruction;
}

// ---------- Режим Викторины (Книга вопросов) ----------
let quizActive = false;
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScore = 0;
let waitingForNext = false;

// Вопросы по естественным наукам (Я и мир, 2 класс)
const baseQuestions = [
    {
        text_ru: "Как называется наша планета?",
        text_kg: "Биздин планета кандай аталат?",
        options_ru: ["Земля", "Марс", "Юпитер", "Венера"],
        options_kg: ["Жер", "Марс", "Юпитер", "Чолпон"],
        correct: 0
    },
    {
        text_ru: "Какое животное даёт молоко?",
        text_kg: "Кайсы жаныбар сүт берет?",
        options_ru: ["Курица", "Корова", "Собака", "Лошадь"],
        options_kg: ["Тоок", "Уй", "Ит", "Жылкы"],
        correct: 1
    },
    {
        text_ru: "Что из этого растёт на дереве?",
        text_kg: "Мунун кайсынысы даракта өсөт?",
        options_ru: ["Картошка", "Морковь", "Яблоко", "Огурец"],
        options_kg: ["Картошка", "Сабиз", "Алма", "Бадыраң"],
        correct: 2
    },
    {
        text_ru: "Сколько дней в неделе?",
        text_kg: "Аптада канча күн бар?",
        options_ru: ["5", "6", "7", "8"],
        options_kg: ["5", "6", "7", "8"],
        correct: 2
    },
    {
        text_ru: "Как называется время года, когда тает снег?",
        text_kg: "Кар эриген жыл мезгили кандай аталат?",
        options_ru: ["Зима", "Весна", "Лето", "Осень"],
        options_kg: ["Кыш", "Жаз", "Жай", "Күз"],
        correct: 1
    },
    {
        text_ru: "Кто из этих животных плавает в воде?",
        text_kg: "Бул жаныбарлардын кайсынысы сууда сүзөт?",
        options_ru: ["Кошка", "Рыба", "Птица", "Заяц"],
        options_kg: ["Мышык", "Балык", "Куш", "Коён"],
        correct: 1
    },
    {
        text_ru: "Какой орган помогает нам думать?",
        text_kg: "Бизге ойлоого кайсы орган жардам берет?",
        options_ru: ["Сердце", "Мозг", "Желудок", "Лёгкие"],
        options_kg: ["Жүрөк", "Мээ", "Ашказан", "Өпкө"],
        correct: 1
    },
    {
        text_ru: "Что нужно растениям для роста?",
        text_kg: "Өсүмдүктөргө өсүү үчүн эмне керек?",
        options_ru: ["Свет и вода", "Только темнота", "Только песок", "Лёд"],
        options_kg: ["Жарык жана суу", "Караңгылык", "Кум гана", "Муз"],
        correct: 0
    },
    {
        text_ru: "Какой праздник отмечают весной?",
        text_kg: "Кайсы майрам жазда белгиленет?",
        options_ru: ["Новый год", "8 Марта", "Хэллоуин", "День рождения"],
        options_kg: ["Жаңы жыл", "8-Март", "Хэллоуин", "Туулган күн"],
        correct: 1
    },
    {
        text_ru: "Кто из них — домашнее животное?",
        text_kg: "Алардын кайсынысы үй жаныбары?",
        options_ru: ["Волк", "Лиса", "Корова", "Медведь"],
        options_kg: ["Карышкыр", "Түлкү", "Уй", "Аюу"],
        correct: 2
    }
];

function buildQuizQuestions() {
    return baseQuestions.map(q => ({
        text: currentLang === 'ru' ? q.text_ru : q.text_kg,
        options: currentLang === 'ru' ? [...q.options_ru] : [...q.options_kg],
        correct: q.correct
    }));
}

function loadQuizQuestion() {
    if (!quizActive) return;
    if (currentQuizIndex >= quizQuestions.length) {
        finishQuiz();
        return;
    }
    const q = quizQuestions[currentQuizIndex];
    document.getElementById('quizQuestion').innerText = q.text;
    const container = document.getElementById('quizOptions');
    container.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option';
        btn.innerText = opt;
        btn.dataset.optIndex = idx;
        btn.addEventListener('click', () => checkQuizAnswer(idx));
        container.appendChild(btn);
    });
    document.getElementById('quizFeedback').innerHTML = '';
    document.getElementById('quizProgress').innerText = `${translations[currentLang].quizProgress || 'Вопрос'} ${currentQuizIndex+1} ${translations[currentLang].of || 'из'} ${quizQuestions.length}`;
    waitingForNext = false;
}

function checkQuizAnswer(selectedIdx) {
    if (waitingForNext || !quizActive) return;
    const q = quizQuestions[currentQuizIndex];
    const isCorrect = (selectedIdx === q.correct);
    const optionsDivs = document.querySelectorAll('.quiz-option');
    optionsDivs.forEach(div => div.style.pointerEvents = 'none');
    if (isCorrect) {
        currentScore += 10;
        updateScoreUI();
        quizScore++;
        showCapybaraMessage(translations[currentLang].correct, true);
        document.getElementById('quizFeedback').innerHTML = `✅ ${translations[currentLang].correct}`;
        optionsDivs[selectedIdx].classList.add('correct-feedback');
    } else {
        showCapybaraMessage(translations[currentLang].wrong_prefix + q.options[q.correct], false);
        document.getElementById('quizFeedback').innerHTML = `❌ ${translations[currentLang].wrong_prefix} ${q.options[q.correct]}`;
        optionsDivs[selectedIdx].classList.add('wrong-feedback');
        optionsDivs[q.correct].classList.add('correct-feedback');
    }
    waitingForNext = true;
    setTimeout(() => {
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
            loadQuizQuestion();
        } else {
            finishQuiz();
        }
    }, 2000);
}

function finishQuiz() {
    if (!quizActive) return;
    quizActive = false;
    const total = quizQuestions.length;
    const message = `${translations[currentLang].quizComplete} ${translations[currentLang].score} ${currentScore}`;
    showCapybaraMessage(message, true);
    document.getElementById('quizFeedback').innerHTML = `🎉 ${message} 🎉`;
    document.getElementById('quizProgress').innerText = `${translations[currentLang].quizComplete}`;
    const optionsDivs = document.querySelectorAll('.quiz-option');
    optionsDivs.forEach(div => div.style.pointerEvents = 'none');
}

function startQuizMode() {
    mathActive = false;
    dexterityActive = false;
    quizActive = true;
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    // Обновить вопросы согласно текущему языку
    quizQuestions = buildQuizQuestions();
    currentQuizIndex = 0;
    quizScore = 0;
    currentScore = 0; // можно начать с нуля или оставить старый счёт — для честности обнулим
    updateScoreUI();
    waitingForNext = false;
    loadQuizQuestion();
    showCapybaraMessage(translations[currentLang].great, true);
}

// ---------- Общие функции ----------
function updateUIForLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
    // Если активен режим викторины, перезагрузить вопросы
    if (quizActive && quizSection.classList.contains('active')) {
        quizQuestions = buildQuizQuestions();
        currentQuizIndex = 0;
        loadQuizQuestion();
    }
    // Если активен любой другой режим, обновить сообщение капибары
    if (menuSection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].menuInstruction;
    } else if (mathSection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].great;
    } else if (dexteritySection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].dexterityStart;
    }
}

function showCapybaraMessage(text, isHappy = true) {
    capybaraMessage.innerText = text;
    capybara.classList.remove('happy', 'sad');
    if (isHappy) {
        capybara.classList.add('happy');
    } else {
        capybara.classList.add('sad');
    }
    setTimeout(() => {
        capybara.classList.remove('happy', 'sad');
    }, 500);
}

function updateScoreUI() {
    scoreSpan.innerText = currentScore;
}

function showMenu() {
    mathActive = false;
    dexterityActive = false;
    quizActive = false;
    if (spawnIntervalId) {
        clearInterval(spawnIntervalId);
        spawnIntervalId = null;
    }
    const field = document.getElementById('gameField');
    if (field) field.innerHTML = '';
    activeObjects = [];
    menuSection.classList.add('active');
    mathSection.classList.remove('active');
    dexteritySection.classList.remove('active');
    quizSection.classList.remove('active');
    currentScore = 0;
    updateScoreUI();
    capybaraMessage.innerText = translations[currentLang].menuInstruction;
}

function setLanguage(lang) {
    currentLang = lang;
    updateUIForLanguage();
}

// ---------- Инициализация ----------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = btn.getAttribute('data-lang');
            if (lang === 'ru' || lang === 'kg') setLanguage(lang);
        });
    });
    
    document.getElementById('mathModeBtn').addEventListener('click', () => {
        menuSection.classList.remove('active');
        mathSection.classList.add('active');
        startMathMode();
        updateUIForLanguage();
    });
    document.getElementById('dexterityModeBtn').addEventListener('click', () => {
        menuSection.classList.remove('active');
        dexteritySection.classList.add('active');
        startDexterityMode();
        updateUIForLanguage();
    });
    document.getElementById('quizModeBtn').addEventListener('click', () => {
        menuSection.classList.remove('active');
        quizSection.classList.add('active');
        startQuizMode();
        updateUIForLanguage();
    });
    
    document.getElementById('backToMenuFromMath').addEventListener('click', showMenu);
    document.getElementById('backToMenuFromDexterity').addEventListener('click', showMenu);
    document.getElementById('backToMenuFromQuiz').addEventListener('click', showMenu);
    
    setLanguage('ru');
    showMenu();
});

// Добавим недостающий перевод для quizProgress
translations.ru.quizProgress = 'Вопрос';
translations.ru.of = 'из';
translations.kg.quizProgress = 'Суроо';
translations.kg.of = 'ичинен';

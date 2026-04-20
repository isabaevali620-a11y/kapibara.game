// ------------------- ПЕРЕВОДЫ -------------------
const translations = {
    ru: {
        title: "🐹 Капибара Учитель",
        mathMode: "📚 Математика",
        dexterityMode: "🎯 Ловкость",
        menuInstruction: "Выбери режим и начинай учиться с капибарой!",
        score: "Очки:",
        backToMenu: "🏠 В меню",
        dexterityInstruction: "Кликай на появляющиеся предметы!",
        // сообщения капибары
        correct: "Молодец! 🎉",
        wrong_prefix: "Ошибка! Правильный ответ: ",
        great: "Отлично!",
        excellent: "Ты гений! ✨",
        tryAgain: "Попробуй ещё!",
        catchMessage: "Хлоп! +1 очко",
        dexterityStart: "Лови предметы!",
        gameOver: "Игра закончена"
    },
    kg: {
        title: "🐹 Капибара Мугалим",
        mathMode: "📚 Математика",
        dexterityMode: "🎯 Шамдылык",
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
        gameOver: "Оюн бүттү"
    }
};

let currentLang = 'ru'; // ru или kg

// DOM элементы
const menuSection = document.getElementById('menuSection');
const mathSection = document.getElementById('mathSection');
const dexteritySection = document.getElementById('dexteritySection');
const capybara = document.getElementById('capybara');
const capybaraMessage = document.getElementById('capybaraMessage');
const scoreSpan = document.getElementById('scoreValue');

// Режим математики
let currentScore = 0;
let currentDifficulty = 10; // максимальное число для сложения/вычитания
let currentQuestion = null;
let currentCorrectAnswer = null;
let mathActive = false;

// Режим ловкости
let dexterityActive = false;
let dexterityScore = 0;
let spawnIntervalId = null;
let spawnDelay = 1000; // мс
let minDelay = 350;
let speedUpThreshold = 5; // ускоряемся каждые 5 очков
let lastSpeedScore = 0;
let activeObjects = [];

// ---------- Вспомогательные функции ----------
function updateUIText() {
    // Обновляем все элементы с data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
    // Дополнительно если в ловкости есть сообщение
    const dexterityInst = document.querySelector('.dexterity-instruction');
    if (dexterityInst && dexterityActive === false) {
        dexterityInst.innerText = translations[currentLang].dexterityInstruction;
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
        if (capybara.classList.contains('happy') || capybara.classList.contains('sad')) {
            capybara.classList.remove('happy', 'sad');
        }
    }, 500);
}

function updateScoreUI() {
    scoreSpan.innerText = currentScore;
}

// ---------- МАТЕМАТИКА ----------
function generateMathQuestion() {
    const operation = Math.floor(Math.random() * 3); // 0:+ 1:- 2:*
    let a, b, answer, questionText;
    if (operation === 0) { // сложение
        a = Math.floor(Math.random() * (currentDifficulty + 1));
        b = Math.floor(Math.random() * (currentDifficulty + 1));
        answer = a + b;
        questionText = `${a} + ${b}`;
    } else if (operation === 1) { // вычитание (результат >=0)
        a = Math.floor(Math.random() * (currentDifficulty + 1));
        b = Math.floor(Math.random() * (a + 1));
        answer = a - b;
        questionText = `${a} - ${b}`;
    } else { // умножение для 2 класса (таблица до 5, но с увеличением сложности можно до 6)
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
        btn.addEventListener('click', () => checkAnswer(opt));
        btnsContainer.appendChild(btn);
    });
}

function checkAnswer(selected) {
    if (!mathActive) return;
    const feedbackDiv = document.getElementById('feedback');
    if (selected === currentCorrectAnswer) {
        // Правильно
        currentScore += 10;
        updateScoreUI();
        // Похвала на языке
        let praise = translations[currentLang].correct;
        if (currentScore % 30 === 0) praise = translations[currentLang].excellent;
        else if (currentScore % 20 === 0) praise = translations[currentLang].great;
        showCapybaraMessage(praise, true);
        feedbackDiv.innerHTML = `✅ ${praise}`;
        // Увеличиваем сложность
        if (currentDifficulty < 20) currentDifficulty += 1;
        renderMathQuestion();
    } else {
        // Неправильно
        const wrongMsg = `${translations[currentLang].wrong_prefix}${currentCorrectAnswer}`;
        showCapybaraMessage(wrongMsg, false);
        feedbackDiv.innerHTML = `❌ ${wrongMsg}`;
        // Не увеличиваем сложность, но вопрос меняем
        renderMathQuestion();
    }
}

function startMathMode() {
    mathActive = true;
    dexterityActive = false;
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    currentScore = 0;
    currentDifficulty = 8; // начальный уровень
    updateScoreUI();
    renderMathQuestion();
    document.getElementById('feedback').innerHTML = '';
    showCapybaraMessage(translations[currentLang].great, true);
}

// ---------- ЛОВКОСТЬ (клик по объектам) ----------
function createCatchObject() {
    if (!dexterityActive) return;
    const field = document.getElementById('gameField');
    const fieldRect = field.getBoundingClientRect();
    const obj = document.createElement('div');
    obj.className = 'catch-object';
    // Симпатичные emoji для ловли
    const items = ['🍎', '🍉', '⭐', '🍃', '🐟', '🥕', '🍒'];
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
    // самоуничтожение через 1.3 секунды
    setTimeout(() => {
        if (obj && obj.parentNode) {
            obj.remove();
            const idx = activeObjects.indexOf(obj);
            if (idx !== -1) activeObjects.splice(idx, 1);
        }
    }, 1300);
}

function catchObjectHandler(obj) {
    if (!dexterityActive) return;
    dexterityScore++;
    currentScore = dexterityScore;
    updateScoreUI();
    // Анимация капибары радость
    showCapybaraMessage(translations[currentLang].catchMessage, true);
    // Удаляем объект
    if (obj && obj.parentNode) obj.remove();
    const idx = activeObjects.indexOf(obj);
    if (idx !== -1) activeObjects.splice(idx, 1);
    
    // Ускорение игры (каждые speedUpThreshold очков)
    if (dexterityScore >= lastSpeedScore + speedUpThreshold && spawnDelay > minDelay) {
        lastSpeedScore = dexterityScore;
        spawnDelay = Math.max(minDelay, spawnDelay - 50);
        // перезапуск интервала
        if (spawnIntervalId) {
            clearInterval(spawnIntervalId);
            spawnIntervalId = setInterval(() => {
                if (dexterityActive) createCatchObject();
            }, spawnDelay);
        }
    }
}

function startDexterityMode() {
    // Очистка предыдущего режима математики
    mathActive = false;
    dexterityActive = true;
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    // Очистка поля
    const field = document.getElementById('gameField');
    field.innerHTML = '';
    activeObjects.forEach(obj => { if(obj && obj.remove) obj.remove(); });
    activeObjects = [];
    dexterityScore = 0;
    currentScore = 0;
    spawnDelay = 1000;
    lastSpeedScore = 0;
    updateScoreUI();
    // Запускаем спавн
    spawnIntervalId = setInterval(() => {
        if (dexterityActive) createCatchObject();
    }, spawnDelay);
    // Первые 3 объекта быстро
    setTimeout(() => { if(dexterityActive) for(let i=0;i<2;i++) createCatchObject(); }, 100);
    showCapybaraMessage(translations[currentLang].dexterityStart, true);
    const inst = document.querySelector('.dexterity-instruction');
    if (inst) inst.innerText = translations[currentLang].dexterityInstruction;
}

// ---------- ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ И ЯЗЫКА ----------
function showMenu() {
    // Останавливаем активные режимы
    mathActive = false;
    dexterityActive = false;
    if (spawnIntervalId) {
        clearInterval(spawnIntervalId);
        spawnIntervalId = null;
    }
    // Очистка поля ловкости
    const field = document.getElementById('gameField');
    if (field) field.innerHTML = '';
    activeObjects = [];
    // Показываем меню
    menuSection.classList.add('active');
    mathSection.classList.remove('active');
    dexteritySection.classList.remove('active');
    currentScore = 0;
    updateScoreUI();
    capybaraMessage.innerText = translations[currentLang].menuInstruction;
}

function setLanguage(lang) {
    currentLang = lang;
    updateUIText();
    // Обновить сообщение капибары в зависимости от активного режима
    if (menuSection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].menuInstruction;
    } else if (mathSection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].great;
        document.getElementById('feedback').innerHTML = '';
    } else if (dexteritySection.classList.contains('active')) {
        capybaraMessage.innerText = translations[currentLang].dexterityStart;
        const inst = document.querySelector('.dexterity-instruction');
        if (inst) inst.innerText = translations[currentLang].dexterityInstruction;
    }
}

// ---------- ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ ----------
document.addEventListener('DOMContentLoaded', () => {
    // Кнопки выбора языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = btn.getAttribute('data-lang');
            if (lang === 'ru' || lang === 'kg') setLanguage(lang);
        });
    });
    
    // Кнопки режимов в меню
    document.getElementById('mathModeBtn').addEventListener('click', () => {
        menuSection.classList.remove('active');
        mathSection.classList.add('active');
        startMathMode();
        updateUIText(); // обновить надписи кнопок
    });
    document.getElementById('dexterityModeBtn').addEventListener('click', () => {
        menuSection.classList.remove('active');
        dexteritySection.classList.add('active');
        startDexterityMode();
        updateUIText();
    });
    
    // Кнопки "В меню"
    document.getElementById('backToMenuFromMath').addEventListener('click', showMenu);
    document.getElementById('backToMenuFromDexterity').addEventListener('click', showMenu);
    
    // Начальная установка языка и UI
    setLanguage('ru');
    showMenu();
});
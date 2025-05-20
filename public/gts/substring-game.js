// substring-game.js
// Spiellogik für das Substring-Spiel

let wordlist = [];
let substring = '';
let possibleWords = [];
let streak = 0;
let highscore = 0;
let timer = 10;
let timerInterval = null;

const streakEl = document.getElementById('streak');
const highscoreEl = document.getElementById('highscore');
const timerEl = document.getElementById('timer');
const substringEl = document.getElementById('substring');
const feedbackEl = document.getElementById('feedback');
const solutionEl = document.getElementById('solution');
const wordForm = document.getElementById('wordForm');
const wordInput = document.getElementById('wordInput');

function loadWordlist() {
    fetch('wordlist.txt')
        .then(res => res.text())
        .then(text => {
            wordlist = text.split(/\r?\n/).filter(w => w.length > 2);
            startGame();
        });
}

function pickSubstring() {
    // Wähle zufälliges Wort, dann zufälliges Substring daraus
    const word = wordlist[Math.floor(Math.random() * wordlist.length)];
    if (!word) return '';
    if (word.length < 4) return pickSubstring();
    const start = Math.floor(Math.random() * (word.length - 2));
    return word.substring(start, start + 3);
}

function findPossibleWords(sub) {
    return wordlist.filter(w => w.includes(sub));
}

function startGame() {
    streak = 0;
    timer = 10;
    highscore = Number(localStorage.getItem('substringHighscore') || 0);
    highscoreEl.textContent = highscore;
    nextRound();
    updateStreak();
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        if (timer <= 0) {
            endGame();
        }
    }, 1000);
}

function nextRound() {
    setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.style.color = '';
        solutionEl.textContent = '';
    }, 3000);
    substring = pickSubstring();
    possibleWords = findPossibleWords(substring);
    substringEl.textContent = substring;
    wordInput.value = '';
    wordInput.focus();
    timer = 10;
    updateTimer();
}

function updateStreak() {
    streakEl.textContent = streak;
    if (streak > highscore) {
        highscore = streak;
        localStorage.setItem('substringHighscore', highscore);
        highscoreEl.textContent = highscore;
    }
}

function updateTimer() {
    timerEl.textContent = timer;
}

function endGame() {
    clearInterval(timerInterval);
    feedbackEl.textContent = 'Zeit abgelaufen!';
    solutionEl.textContent = possibleWords.length ? 'Mögliche Lösung: ' + possibleWords[0] : '';
    setTimeout(startGame, 3000);
}

wordForm.onsubmit = function(e) {
    e.preventDefault();
    const input = wordInput.value.trim().toLowerCase();
    if (!input) return;
    const possibleWordsLower = possibleWords.map(w => w.toLowerCase());
    if (possibleWordsLower.includes(input)) {
        feedbackEl.textContent = 'Richtig!';
        feedbackEl.style.color = 'limegreen';
        streak++;
        updateStreak();
        nextRound();
    } else {
        feedbackEl.textContent = 'Falsch!';
        feedbackEl.style.color = 'red';
        solutionEl.textContent = possibleWords.length ? 'Mögliche Lösung: ' + possibleWords[0] : 'Keine Lösung gefunden.';
        streak = 0;
        updateStreak();
        nextRound();
    }
};

// Spiel starten, wenn Seite geladen
window.onload = loadWordlist;

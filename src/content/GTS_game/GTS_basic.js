import { safeRoute } from '../../helper/helper.js'
import { renderPage } from '../../helper/render-page.js'

/**
 * @param {number} active
 * @returns {string}
 */
export function renderNavigation(active) {
  return `
  <ul class="nav nav-tabs" style="margin-bottom: 24px;">
    <li class="nav-item">
      <a class="nav-link" style="color: #00bc8c; border: none;" href="/map">zurück</a>
    </li>
    <li class="nav-item">
      <a class="nav-link${active === 0 ? ' active' : ''}" href="/GTSgame">Spielen</a>
    </li>
    <li class="nav-item">
      <a class="nav-link${active === 1 ? ' active' : ''}" href="/GTSgame/guide">Anleitung</a>
    </li>
  </ul>`
}

/**
 * @param {import('../../data/types.js').App} App
 */
export function setupGTSPage(App) {
  App.express.get(
    '/GTSgame',
    safeRoute(async (req, res) => {
      renderPage(App, req, res, {
        page: 'GTSgame',
        heading: 'GTS Game',
        backButton: false,
        content: `
        ${renderNavigation(0)}
        <h1><b>G</b>uess <b>T</b>he <b>S</b>tring Game</h1>
        <br/>
        <div class="card" style="max-width: 70% min-width: 300px; margin: auto;">
          <div class="card-body" id="game-container" style="text-align: center;">
            <h2 id="substring">---</h2>
            <div class="progress" style="height: 30px; margin-bottom: 20px; position: relative;">
              <div id="timer-bar" class="progress-bar bg-success" role="progressbar" style="width: 100%" aria-valuemin="0" aria-valuemax="100"></div>
                <div style="position: absolute; width: 100%; text-align: center; line-height: 30px; font-weight: bold;">
                  <span id="timer-text" style="font-size: 16px;">5s</span>
                </div>
            </div>
            <input type="text" id="guess-input" class="form-control" placeholder="Dein Wort..." autocomplete="off" />
            <button id="submit-btn" class="btn btn-primary" style="margin-top: 8px;">Raten</button>
            <p id="feedback" style="margin-top: 12px; font-weight: bold;"></p>
            <p>Score: <span id="score">0</span></p>
          </div>
        </div>
        <script>
         (function() {
            let currentWord = '';
            let currentSub = '';
            let timer;
            let timeLeft = 5;
            let score = 0;
            let WORDS = [];
            
            const subEl = document.getElementById('substring');
            const barEl = document.getElementById('timer-bar');
            const timerTextEl = document.getElementById('timer-text');
            const inputEl = document.getElementById('guess-input');
            const btnEl = document.getElementById('submit-btn');
            const feedbackEl = document.getElementById('feedback');
            const scoreEl = document.getElementById('score');
          
            function getNext() {
              const word = WORDS[Math.floor(Math.random() * WORDS.length)];
              const start = Math.floor(Math.random() * (word.length - 3));
              const sub = word.substring(start, start + 3);
              return { word, sub };
            }
          
            function startRound() {
              const next = getNext();
              currentWord = next.word;
              currentSub = next.sub;
              subEl.textContent = currentSub;
              inputEl.value = '';
              feedbackEl.textContent = '';
              timeLeft = 10;
              timerTextEl.textContent = timeLeft + 's';
              barEl.style.width = '100%';
              timer = setInterval(updateTimer, 1000);
            }

            function updateTimer() {
              timeLeft -= 1;
              timerTextEl.textContent = timeLeft + 's';
              const pct = (timeLeft / 10) * 100;
              barEl.style.width = pct + '%';
              if (timeLeft <= 0) {
                clearInterval(timer);
                feedbackEl.textContent = 'Zeit abgelaufen! Richtige Antwort: ' + currentWord;
                setTimeout(startRound, 2000);
              }
            }

            function checkGuess() {
              clearInterval(timer);
              const val = inputEl.value.trim().toLowerCase();
              if (val === currentWord.toLowerCase()) {
                score += 1;
                feedbackEl.textContent = 'Richtig!';
              } else {
                feedbackEl.textContent = 'Falsch! Richtige Antwort: ' + currentWord;
              }
              scoreEl.textContent = score;
              setTimeout(startRound, 2000);
            }

            btnEl.addEventListener('click', checkGuess);
            inputEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') checkGuess(); });

            fetch('/gts/wordlist.txt')
              .then(response => response.text())
              .then(text => {
                WORDS = text.split('\\n').map(line => line.trim()).filter(word => word.length > 0);
                startRound();
              })
              .catch(err => {
                feedbackEl.textContent = 'Error loading words.';
                console.error(err);
              });
          })();
        </script>
      `,
      })
    })
  )

  App.express.get(
    '/GTSgame/guide',
    safeRoute(async (req, res) => {
      renderPage(App, req, res, {
        page: 'GTSguide',
        heading: 'GTS Game - Anleitung',
        backButton: false,
        content: `
          ${renderNavigation(1)}
          <div style="background-color: #34495e; padding: 20px; border-radius: 8px;">
            <h4 style="text-align: center">Anleitung</h4>
            <p>Bei Guess The String (GTS) geht es darum aus einem gegebenen Teil eines Wortes, innerhalb von 10 Sekunden, ein komplettes Wort zu erraten.</p>
            <p>Ziel ist es möglichst viele Wörter am Stück richtig zu erraten.</p>
            <p>Beispiel:</p>
            <p style="margin-left: 20px;">Teil des Wortes: lan <br>
            Eine Möglichkeit es zu erraten: <span style="font-weight: bold;">lan</span>gsam</p>
          </div>
        `,
      })
    })
  )
}

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
                  <span id="timer-text" style="font-size: 16px;">10s</span>
                </div>
            </div>
            <input type="text" id="guess-input" class="form-control" placeholder="Dein Wort..." autocomplete="off" />
            <button id="submit-btn" class="btn btn-primary" style="margin-top: 8px;">Raten</button>
            <p id="feedback" style="margin-top: 12px; font-weight: bold;"></p>
            <p>Score: <span id="score">0</span></p>
          </div>
        </div>
        <script type="text/javascript">
         (function() {
            let currentSub = '';
            let timer;
            let timeLeft = 10;
            let score = 0;
            let highscore = 0;
            
            const subEl = document.getElementById('substring');
            const barEl = document.getElementById('timer-bar');
            const timerTextEl = document.getElementById('timer-text');
            const inputEl = document.getElementById('guess-input');
            const btnEl = document.getElementById('submit-btn');
            const feedbackEl = document.getElementById('feedback');
            const scoreEl = document.getElementById('score');
          
            function getNextSubstring() {
              return fetch('/GTSgame/getSubstring')
                .then(res => {
                  if (!res.ok) {
                    throw new Error('Failed to get substring');
                  }
                  return res.json();
                })
                .then(data => data.substring)
                .catch(err => {
                  console.error('Error getting substring:', err);
                  return '---';
                });
            }

            function getCorrectWord() {
              return fetch('/GTSgame/getCorrectWord')
                .then(res => {
                  if (!res.ok) {
                    throw new Error('Failed to get correct word');
                  }
                  return res.json();
                })
                .then(data => data.correctWord)
                .catch(err => {
                  console.error('Error getting correct word:', err);
                  return '(unbekannt)';
                });
            }
            
            function verifyWord(attempt) {
              return fetch(\`/GTSgame/verify?attempt=\${encodeURIComponent(attempt)}\`)
                .then(res => {
                  if (!res.ok) {
                    throw new Error('Failed to verify word');
                  }
                  return res.json();
                })
                .then(data => data.valid)
                .catch(err => {
                  console.error('Error verifying word:', err);
                  return false;
                });
            }
          
            async function startRound() {
              if (timer) clearInterval(timer);
              currentSub = await getNextSubstring();
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
                timer = null;
                const correctWord = getCorrectWord()
                feedbackEl.textContent = 'Zeit abgelaufen! Richtige Antwort: ' + correctWord;
                setTimeout(startRound, 3000);
              }
            }

            async function checkGuess() {
              const attempt = inputEl.value.trim().toLowerCase();
              const isValidWord = await verifyWord(attempt);
            
              if (isValidWord) {
                score += 1;
                feedbackEl.textContent = 'Richtig!';
              } else {
                feedbackEl.textContent = 'Falsch! Versuchs nochmal.';
                if (score > highscore) {
                  highscore = score;
                  feedbackEl.textContent += ' Neuer Highscore: ' + highscore;
                }
              }
              scoreEl.textContent = score;
              inputEl.value = "";
            }

            btnEl.addEventListener('click', () => checkGuess().then());
            inputEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') checkGuess().then(); });
            
            startRound();
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

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
 * @param {import("../../data/types.js").App} App
 */
export function setupGTSPage(App) {
    App.express.get('/GTSgame', safeRoute(async (req, res) => {
        renderPage(App, req, res, {
            page: 'GTSgame',
            heading: 'GTS Game',
            backButton: false,
            content: `
                ${renderNavigation(0)}
                    <h1>GTS steht für: "Guess The String"</h1>
                    <p>Viel Spaß Noa!</p>
            `,
        });
    }));

    App.express.get('/GTSgame/guide', safeRoute(async (req, res) => {
        renderPage(App, req, res, {
            page: 'GTSguide',
            heading: 'GTS Game - Anleitung',
            backButton: false,
            content: `
                ${renderNavigation(1)}
                <div style="background-color: #34495e; padding: 20px; border-radius: 8px;">
                <h4 style="text-align: center" >Anleitung</h4>
                <p>Bei Guess The String (GTS) geht es darum aus einem gegebenen Teil eines Wortes, innerhalb von 10 Sekunden, ein komplettes Wort zu erraten. </p>

                <p>Ziel ist es möglichst viele Wörter am Stück richtig zu erraten.</p>
                <p>Beispiel:</p>
                <p style="margin-left: 20px;">Teil des Wortes: lan <br>
                Eine möglichkeit es zu erraten : <span style="font-weight: bold;">lan</span>gsam</p>
                </div>            
            `,
        });
    }));
}
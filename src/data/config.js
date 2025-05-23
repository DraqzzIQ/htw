import { getI18nExtension } from '../content/i18n-extension.js'
import { secrets } from '../helper/secrets-loader.js'

export const appConfig = {
  database: (() => {
    if (process.env.UBERSPACE || process.env.LIVE) {
      console.log('using live database\n')
      return {
        database: 'arrrg_hacktheweb',
        username: 'arrrg',
        password: secrets('config_db_password'),
        dialect: /** @type {'mariadb'} */ ('mariadb'),
        dialectOptions: {
          timezone: 'Europe/Berlin',
          connectTimeout: 10000, // increased due to several errors - default value is 1000 (ms) and feels quite short
        },
      }
    }
    return {
      database: 'local_db',
      dialect: /** @type {'sqlite'} */ ('sqlite'),
      storage: './db.sqlite',
    }
  })(),
  sync: {
    //force: true,
    //alter: true,
  },
  logdb: false,
  logprefix: '[htw] ',
  port: process.env.HTWPORT ? parseInt(process.env.HTWPORT) : 3000,
  sessionSecret: 'keyboard cat',
  languages: /** @type {['de' , 'en']} */ (['de', 'en']),
  detectLanguage: false,
  theme: 'darkly',
  reloadChallenges: !process.env.UBERSPACE,
  configRoutes: false,
  challengesDir: process.cwd() + '/src/content',
  staticFolder: './public',
  bcryptRounds: 10,
  accounts: {
    minUsername: 3,
    maxUsername: 40,
    minPw: 4,
    maxPw: 100,
    regex: /^[ -~äöüÄÖÜß]+$/,
    maxRatePerHour: 500,
    roomRegex: /^[a-zA-Z0-9]+$/,
    minRoom: 3,
    maxRoom: 20,
    maxRoomPerHour: 50,
    highscoreLimit: 250,
    topHackersLimit: 10,
    solveRateLimit: 20,
    solveRateTimeout: 30,
  },
  map: {
    background: '/background.jpg',
    backgroundLicenseHtml: `
    <a href="http://www.flickr.com/photos/scotbot/9686457096">scotbot</a>
    (<a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>), Satellit: <a href="https://www.freepik.com/free-vector/illustration-satellite_2606121.htm" target="_blank">Image by rawpixel.com</a> on Freepik
  `,
    centeringOffset: 0.5,
    width: 3000,
    height: 2400,
    customMapHtml: (
      /** @type {{App: import('./types.js').App, req: import('express').Request}} */ {
        App,
        req,
      }
    ) => {
      const showWorms =
        req.user &&
        (req.user.score >= 30 || App.config.editors.includes(req.user.name))

      const GTS_Game =
        req.user &&
        (req.user.score >= 30 || App.config.editors.includes(req.user.name))

      const showEnough =
        req.user &&
        (req.user.score >= 60 || App.config.editors.includes(req.user.name))

      const showPleaseFixMeAndMortalCoil =
        req.user &&
        (req.user.score >= 90 || App.config.editors.includes(req.user.name))

      return `
    <img style="position:absolute;left:110px;top:100px;z-index:-1;" src="/start_galaxy.png">
    <img style="position:absolute;left:1298px;top:903px;z-index:-1;" src="/passage_galaxy.png">
    <img style="position:absolute;left:650px;top:1640px;z-index:-1;" src="/passage_2_galaxy.png">
    <span style="position:absolute; left:680px; top:1680px;z-index:-2; font-size:8px;">&#87;&#65;&#76;&#68;&#79;</span>
    ${
      showWorms
        ? '<a href="/worms" style="position:absolute;left:1280px;top:120px;" class="text-reset text-decoration-none fade-in"><div>Worms</div><img src="/worms.png" style="width:46px"></a>'
        : ''
    }
    ${
      GTS_Game
        ? `<a href="/GTSgame" style="position:absolute;left:1750px;top:120px;" class="text-reset text-decoration-none fade-in">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div>GTS</div>
              <img src="/arcade-machine.png" style="width:50px" alt="GTS game">
            </div>
          </a>`
        : ''
    }
     ${
       showEnough
         ? '<a href="/enough" style="position:absolute;left:57px;top:845px;" class="text-reset text-decoration-none fade-in"><div>&nbsp;&nbsp;&nbsp;Enough</div><img src="/enough.png" style="width:65px;margin-top:6px;"></a>' +
           '<a href="/typer/index.html" style="position:absolute;left:140px;top:955px;" class="text-reset text-decoration-none fade-in"><div>Typer</div><img src="/typer.png" style="width:35px;margin-top:6px;margin-left:1px;"></a>'
         : ''
     }
     ${
       showPleaseFixMeAndMortalCoil
         ? '<a href="/mortal-coil" style="position:absolute;left:2250px;top:500px;" class="text-reset text-decoration-none fade-in"><div>Mortal Coil</div><img src="/mortal_coil.png" style="width:42px;margin-top:6px;margin-left:14px;"></a>' +
           '<a href="/please-fix-me" style="position:absolute;left:1370px;top:745px;" class="text-reset text-decoration-none fade-in"><div>Please Fix Me!</div><img src="/pfm.png" style="width:65px;margin-left:16px; margin-top: 2px; border-radius: 4px;"></a>'
         : ''
     }
  `
    },
  },
  brand: 'Hack The Web',
  periodic: {
    startupDelay: 2000,
    baseInterval: 10000,
  },
  session: {
    cleanupInterval: 5, // minutes
    allowUnderexpire: 10, // minutes
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  urlPrefix: '',
  i18nConfig: {
    debug: false,
    fallbackLng: 'en',
    backend: {
      loadPath: process.cwd() + '/src/server/lang/{{lng}}.json',
    },
  },
  i18nExtend: getI18nExtension(),
  styles: {
    mapTextColor: 'white',
    mapTextWeight: 'normal',
    connectionColor: '#464545',
    pointColor: 'var(--success)',
    pointColor_solved: '#666699',
    hrColor: '#313030',
    solutionClass_correct: 'primary',
    solutionClass_wrong: 'danger',
    tableHighlightClass: 'secondary',
    fontSize: '16px',
  },
  editors: ['editor', 'demo'],
  noSelfAdmin: ['demo'],
  customCSS: '',
  masterPassword: process.env.UBERSPACE
    ? secrets('config_master_password')
    : '1234',
  githubHref: '/links',
  githubTargetBlank: false,
  fullscreenMap: false,
  statusBackgroundColor: '',
  prefixPlaceholder: '{{PREFIX}}',
  scoreMode: 'distance',
  assetsMaxAge: '2d',
  historyBack: true,
  slowRequestWarning: true,
  slowRequestThreshold: 5000,
  autoPassword: false,
  allowNewAutoPassword: false,
  tokenSecret: secrets('config_token_secret'),
  rateLimit: {
    enabled: true,
    timespan: 3, // min
    requests: 250,
  },
}

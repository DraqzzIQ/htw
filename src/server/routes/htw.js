import { Sequelize, Op } from 'sequelize'
import { secrets } from '../../helper/secrets-loader.js'
import { renderPage } from '../../helper/render-page.js'
import { setupAnalyze } from './analyze.js'
import { generateWeChallToken } from '../../helper/helper.js'

/**
 * @param {import("../../data/types.js").App} App
 */
export function setupHtw(App) {
  App.express.get('/news', (req, res) => {
    renderPage(App, req, res, {
      page: 'news',
    })
  })

  App.express.get('/links', (req, res) => {
    renderPage(App, req, res, {
      page: 'links',
    })
  })

  App.express.get('/api/top100', async (req, res) => {
    const users = await App.db.models.User.findAll({
      attributes: ['name', 'score', 'updatedAt'],
      where: {
        score: { [Op.gt]: 0 },
      },
      order: [
        ['score', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      limit: 100,
      raw: true,
    })

    const usersOut =
      /** @type {(import('../../data/types.js').UserModel & {rank: number})[]} */ (
        users
      )
    usersOut.forEach((user, i) => {
      if (i > 0 && users[i - 1].score == user.score) {
        user.rank = usersOut[i - 1].rank
      } else {
        user.rank = i + 1
      }
    })
    res.json(usersOut)
  })

  App.express.post('/api/user-rankings', async (req, res) => {
    if (!req.body || !req.body.name || !Array.isArray(req.body.name)) {
      res.send('bad body')
      return
    }
    const names = req.body.name

    try {
      const users = await App.db.models.User.findAll({
        attributes: [
          'name',
          'score',
          'updatedAt',
          [
            Sequelize.literal(
              '(SELECT COUNT(*) FROM Users as U WHERE U.score > User.score)'
            ),
            'rank',
          ],
        ],
        where: {
          name: names,
        },
        raw: true,
      })
      users.forEach((u) => {
        if ('rank' in u && typeof u.rank == 'number') {
          u.rank += 1
        }
      })
      res.json(users)
    } catch (e) {
      console.log(e)
      res.send('db query failed')
    }
  })

  App.express.get('/api/map', async (req, res) => {
    res.json(
      Object.keys(App.challenges.distance).filter(
        (x) =>
          x != secrets('secret_chal_1_id') && x != secrets('secret_chal_2_id')
      )
    )
  })

  App.express.get('/api/wechall/validate', async (req, res) => {
    const username = req.query.username?.toString() ?? ''
    const email = req.query.email?.toString() ?? ''
    const authkey = req.query.authkey?.toString() ?? ''

    if (authkey !== secrets('config_wechall_authkey')) {
      res.send('0')
      return
    }

    const token = generateWeChallToken(username)

    if (email === token) {
      res.send('1')
    } else {
      res.send('0')
    }
  })

  App.express.get('/api/wechall/score', async (req, res) => {
    const username = req.query.username?.toString() ?? ''
    const authkey = req.query.authkey?.toString() ?? ''

    if (authkey !== secrets('config_wechall_authkey')) {
      res.send('error')
      return
    }

    const user = await App.db.models.User.findOne({
      where: { name: username },
    })

    if (!user) {
      res.send('error')
      return
    }

    const betterThanMe = await App.db.models.User.count({
      where: {
        [Op.or]: [{ score: { [Op.gt]: user.score } }],
      },
    })
    const rank = user.score == 0 ? -1 : betterThanMe + 1
    const sum = await App.db.models.User.count({
      where: { score: { [Op.gt]: 0 } },
    })

    const maxScore = await App.db.models.User.max('score')

    const cids = App.challenges.data.filter((c) => !c.noScore).map((c) => c.id)
    const solved = await App.db.models.Solution.count({
      where: { UserId: user.id, cid: cids },
    })

    res.send(
      `${username}:${rank}:${user.score}:${maxScore}:${solved}:${cids.length}:${sum}`
    )
  })

  App.express.get('/simple-stats', async (req, res) => {
    let count = await App.storage.getItem('worms_counter_v0')
    let count2 = await App.storage.getItem('enough_counter_v0')
    let count3 = await App.storage.getItem('enough_long_counter_v0')

    renderPage(App, req, res, {
      page: 'simple-stats',
      heading: 'Simple Stats',
      backButton: false,
      content: `
        <p>Worms: ${count}</p>
        <p>Enough: ${count2}</p>
        <p>Enough, länger verweilt (5min): ${count3}</p>
      `,
    })
  })

  if (process.env.SAVE2LOCAL && !process.env.UBERSPACE) {
    run()

    async function run() {
      if (!process.env.LIVE) throw 'NOT CONNECTED TO LIVE SERVER'
      const LOCALAPP = /** @type {App} */ ({})

      // @ts-expect-error Typings for models
      LOCALAPP.db = new Sequelize({
        dialect: 'sqlite',
        storage: './db.sqlite',
        logging: false,
      })
      await (await import('../lib/dbModel.js')).dbModel(LOCALAPP)
      await LOCALAPP.db.authenticate()

      // Es ist viel schneller, die gesamte Datenbank neu aufzusetzen
      await LOCALAPP.db.sync({ force: true })

      console.log('Lokale Datenbank synchronisiert')

      console.log('Starte Import Räume ...')

      const rooms = await App.db.models.Room.findAll({ raw: true })
      await LOCALAPP.db.models.Room.bulkCreate(rooms)

      console.log('Starte Import Benutzer und gelöste Aufgaben ...')

      console.log('  Lade Nutzer von Server')
      const users = await App.db.models.User.findAll({ raw: true })

      console.log('  Lade Lösungen vom Server')
      const solutions = await App.db.models.Solution.findAll({ raw: true })

      console.log(`  Füge ${users.length} Nutzer lokal ein`)
      await LOCALAPP.db.models.User.bulkCreate(users)

      console.log(`  Füge ${solutions.length} Lösungen lokal ein`)
      await LOCALAPP.db.models.Solution.bulkCreate(solutions)

      console.log('Starte Import KVPairs ...')

      const kvpairs = await App.db.models.KVPair.findAll({ raw: true })

      // sqlite not supporting null bytes in strings
      for (const pair of kvpairs) {
        pair.value = pair.value.replace(/\0/g, '')
      }

      await LOCALAPP.db.models.KVPair.bulkCreate(kvpairs)

      console.log('  KVPAirs vollständig')

      console.log('Starte Import WormsBotDraft ...')

      const wormsBotDrafts = await App.db.models.WormsBotDraft.findAll({
        raw: true,
      })
      await LOCALAPP.db.models.WormsBotDraft.bulkCreate(wormsBotDrafts)

      console.log('  WormsBotDraft vollständig')

      console.log('Starte Import WormsArenaMatch ...')

      const wormsArenaMatch = await App.db.models.WormsArenaMatch.findAll({
        raw: true,
      })
      await LOCALAPP.db.models.WormsArenaMatch.bulkCreate(wormsArenaMatch)

      console.log('  WormsArenaMatch vollständig')

      process.exit()
    }
  }

  if (!process.env.UBERSPACE) {
    setupAnalyze(App)
  }

  if (process.env.RECALCULATESCORE) {
    void (async () => {
      console.log('\nStart recalculating scores')
      const users = await App.db.models.User.findAll()

      const solutions = await App.db.models.Solution.findAll({ raw: true })

      // make sure data is consistent by retrieving scores again and compare
      const users2 = await App.db.models.User.findAll({ raw: true })
      /** @type {{[key: number]: number}} */
      const userScores1 = {}
      for (const user of users) {
        userScores1[user.id] = user.score
      }
      for (const user of users2) {
        if (user.score !== userScores1[user.id]) {
          console.log(
            `user ${user.name} solved a challenge while retrieving data, making data inconsistent. Please rerun.`
          )
          process.exit(1)
        }
      }

      /** @type {{[key: number]: number[]}} */
      const byUser = {}

      solutions.forEach((sol) => {
        if (!byUser[sol.UserId]) byUser[sol.UserId] = []

        byUser[sol.UserId].push(sol.cid)
      })

      let hasChange = false

      for (const user of users) {
        const solutions = byUser[user.id] ?? []
        let score = 0
        for (const solution of solutions) {
          if (App.challenges.data.some((c) => c.id == solution)) {
            score += 10 + (App.challenges.distance[solution] || 0)
          }
        }
        if (user.score != score) {
          hasChange = true
          console.log(`${user.score} -> ${score}`)
        }
        user.score = score
        await user.save({ silent: true })
      }
      console.log('completed')

      if (hasChange) {
        console.log(
          'changes saved. to make sure data is consistent, please rerun'
        )
        process.exit(1)
      }
      process.exit()
    })()
  }
}

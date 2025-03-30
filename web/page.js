const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)
/******************************************************************************
  PAGE
******************************************************************************/
const app = require('../src/node_modules/menu')
const action_bar = require('../src/node_modules/action_bar')
delete require.cache[require.resolve('../src/node_modules/search_bar')]
const search_bar = require('../src/node_modules/search_bar')
const graph_explorer = require('../src/node_modules/graph_explorer')
const chat_history = require('../src/node_modules/chat_history')
const tabbed_editor = require('../src/node_modules/tabbed_editor')

const imports = {
  action_bar,
  search_bar,
  graph_explorer,
  chat_history,
  tabbed_editor
}
const sheet = new CSSStyleSheet()
config().then(() => boot({ sid: '' }))

async function config () {
  // const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)
  const html = document.documentElement
  const meta = document.createElement('meta')
  const appleTouch = '<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">'
  // const icon32 = '<link rel="icon" type="image/png" sizes="32x32" href="./src/node_modules/assets/images/favicon/favicon-32x32.png">'
  // const icon16 = '<link rel="icon" type="image/png" sizes="16x16" href="./src/node_modules/assets/images/favicon/favicon-16x16.png">'
  // const webmanifest = '<link rel="manifest" href="./src/node_modules/assets/images/favicon/site.webmanifest"></link>'
  const font = 'https://fonts.googleapis.com/css?family=Nunito:300,400,700,900|Slackey&display=swap'
  const loadFont = `<link href=${font} rel='stylesheet' type='text/css'>`
  html.setAttribute('lang', 'en')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0')
  // @TODO: use font api and cache to avoid re-downloading the font data every time
  document.head.append(meta)
  document.head.innerHTML += appleTouch + loadFont // + icon16 + icon32 + webmanifest
  document.adoptedStyleSheets = [sheet]
  await document.fonts.ready // @TODO: investigate why there is a FOUC
}
/******************************************************************************
  PAGE BOOT
******************************************************************************/
async function boot (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const on = {
    theme: inject
  }
  const subs = await sdb.watch(onbatch)
  // const status = {}
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.body
  const shopts = { mode: 'closed' }
  const shadow = el.attachShadow(shopts)
  shadow.adoptedStyleSheets = [sheet]
  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------
  // desktop
  const view = document.createElement('div')
  shadow.append(await menu(subs[1]), onmessage, view)
  
  function onmessage (msg) {
    const { type, data } = msg
    if (type === '???') {
      const name = data
      const [sid] = subs.filter(x => {
        if (x.type === name) return x.sid
      })
      const el = imports[name](sid)
      view.append(el)
    }
  }

  // ----------------------------------------
  // INIT
  // ----------------------------------------
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
}
async function inject (data) {
  sheet.replaceSync(data.join('\n'))
}
function fallback_module () {
  const menuname = '../src/node_modules/menu'
  const names = [
    '../src/node_modules/action_bar',
    '../src/node_modules/search_bar',
    '../src/node_modules/chat_history',
    '../src/node_modules/graph_explorer',
    '../src/node_modules/tabbed_editor',
  ]
  const subs = {}
  names.forEach(name => (subs[name] = ''))
  subs[menuname] = override
  return { _: subs }
  function override ([menu]) {
    const data = menu()
    data.drive['names.json'] = { raw: JSON.stringify(names) }
    return data
  }
}
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const admin_api = statedb.admin()
const admin_on = {}
admin_api.on(({type, data}) => {
  admin_on[type] && admin_on[type]()
})
const { sdb, io, id } = statedb(fallback_module)
const { drive, admin } = sdb
/******************************************************************************
  PAGE
******************************************************************************/
const navbar = require('../src/node_modules/menu')
const theme_widget = require('../src/node_modules/theme_widget')
const taskbar = require('../src/node_modules/taskbar')
const tabsbar = require('../src/node_modules/tabsbar')
const action_bar = require('../src/node_modules/action_bar')
const space = require('../src/node_modules/space')
const tabs = require('../src/node_modules/tabs')
const console_history = require('../src/node_modules/console_history')
const actions = require('../src/node_modules/actions')
const tabbed_editor = require('../src/node_modules/tabbed_editor')
const task_manager = require('../src/node_modules/task_manager')
const quick_actions = require('../src/node_modules/quick_actions')
const graph_explorer = require('graph-explorer')
const editor = require('../src/node_modules/quick_editor')
const manager = require('../src/node_modules/manager')
const steps_wizard = require('../src/node_modules/steps_wizard')
const { resource } = require('../src/node_modules/helpers')

const imports = {
  theme_widget,
  taskbar,
  tabsbar,
  action_bar,
  space,
  tabs,
  console_history,
  actions,
  tabbed_editor,
  task_manager,
  quick_actions,
  graph_explorer,
  manager,
  steps_wizard,
}
config().then(() => boot({ sid: '' }))

async function config() {
  // const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)
  const html = document.documentElement
  const meta = document.createElement('meta')
  // const appleTouch = '<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">'
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
  document.head.innerHTML += loadFont // + icon16 + icon32 + webmanifest
  await document.fonts.ready // @TODO: investigate why there is a FOUC
}
/******************************************************************************
  PAGE BOOT
******************************************************************************/
async function boot(opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const on = {
    style: inject,
    ...sdb.admin.status.dataset.drive,
    ...sdb.admin
  }
  // const status = {}
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.body
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="navbar-slot"></div>
  <div class="components-wrapper-container">
    <div class="components-wrapper"></div>
  </div>
  <style>
  </style>`
  el.style.margin = 0
  el.style.backgroundColor = '#d8dee9'


  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------

  const navbar_slot = shadow.querySelector('.navbar-slot')
  const components_wrapper = shadow.querySelector('.components-wrapper')
  const style = shadow.querySelector('style')

  const entries = Object.entries(imports)
  const wrappers = []
  const pairs = {}
  const names = entries.map(([name]) => name)
  let current_selected_wrapper = null

  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  const selected_name_param = url_params.get('selected')
  let initial_checked_indices = []

  if (checked_param) {
    try {
      const parsed = JSON.parse(checked_param)
      if (Array.isArray(parsed) && parsed.every(Number.isInteger)) {
        initial_checked_indices = parsed
      } else {
        console.warn('Invalid "checked" URL parameter format.')
      }
    } catch (e) {
      console.error('Error parsing "checked" URL parameter:', e)
    }
  }

  const menu_callbacks = {
    on_checkbox_change: handle_checkbox_change,
    on_label_click: handle_label_click,
    on_select_all_toggle: handle_select_all_toggle
  }
  const item = resource()
  io.on(port => {
    const { by, to } = port
    item.set(port.to, port)
    port.onmessage = event => {
      const txt = event.data
      const key = `[${by} -> ${to}]`

      on[txt.type] && on[txt.type](...txt.data)

    }
  })


  const editor_subs = await sdb.get_sub("page>../src/node_modules/quick_editor")
  // const subs = await sdb.watch(onbatch)
  const subs = (await sdb.watch(onbatch)).filter((_, index) => index % 2 === 0)
  console.log('Page subs', subs)
  const nav_menu_element = await navbar(subs[names.length], names, initial_checked_indices, menu_callbacks)



  navbar_slot.replaceWith(nav_menu_element, await editor(editor_subs[0]))
  await create_component(entries)
  window.onload = scroll_to_initial_selected
  send_quick_editor_data()
  admin_on['import'] = send_quick_editor_data

  return el
  async function create_component(entries_obj) {
    let index = 0
    for (const [name, factory] of entries_obj) {
      const is_initially_checked = initial_checked_indices.length === 0 || initial_checked_indices.includes(index + 1)
      const outer = document.createElement('div')
      outer.className = 'component-outer-wrapper'
      outer.style.display = is_initially_checked ? 'block' : 'none'
      outer.innerHTML = `
      <div class="component-name-label">${name}</div>
      <div class="component-wrapper"></div>
    `
      const inner = outer.querySelector('.component-wrapper')
      const component_content = await factory(subs[index])
      component_content.className = 'component-content'

      const node_id = admin.status.s2i[subs[index].sid]
      const editor_index = index + 1
      inner.append(component_content, await editor(editor_subs[editor_index]))


      const result = {}
      const drive = admin.status.dataset.drive


      const modulepath = node_id.split(':')[0]
      const fields = admin.status.db.read_all(['state', modulepath])
      const nodes = Object.keys(fields).filter(field => !isNaN(Number(field.split(':').at(-1))))
      for (const node of nodes) {
        result[node] = {}
        const datasets = drive.list('', node)
        for (dataset of datasets) {
          result[node][dataset] = {}
          const files = drive.list(dataset, node)
          for (file of files) {
            result[node][dataset][file] = (await drive.get(dataset + file, node)).raw
          }
        }
      }

      const editor_id = admin.status.a2i[admin.status.s2i[editor_subs[editor_index].sid]]
      const port = await item.get(editor_id)
      // await io.at(editor_id)
      port.postMessage(result)

      components_wrapper.appendChild(outer)
      wrappers[index] = { outer, inner, name, checkbox_state: is_initially_checked }
      index++
    }
  }

  function scroll_to_initial_selected() {
    if (selected_name_param) {
      const index = names.indexOf(selected_name_param)
      if (index !== -1 && wrappers[index]) {
        const target_wrapper = wrappers[index].outer
        if (target_wrapper.style.display !== 'none') {
          setTimeout(() => {
            target_wrapper.scrollIntoView({ behavior: 'auto', block: 'center' })
            clear_selection_highlight()
            target_wrapper.style.backgroundColor = '#2e3440'
            current_selected_wrapper = target_wrapper
          }, 100)
        }
      }
    }
  }

  function clear_selection_highlight() {
    if (current_selected_wrapper) {
      current_selected_wrapper.style.backgroundColor = ''
    }
    current_selected_wrapper = null
  }

  function update_url(selected_name = url_params.get('selected')) {
    const checked_indices = wrappers.reduce((acc, w, i) => {
      if (w.checkbox_state) { acc.push(i + 1) }
      return acc
    }, [])
    const params = new URLSearchParams()
    if (checked_indices.length > 0 && checked_indices.length < wrappers.length) {
      params.set('checked', JSON.stringify(checked_indices))
    }
    const selected_index = names.indexOf(selected_name)
    if (selected_name && selected_index !== -1 && wrappers[selected_index]?.checkbox_state) {
      params.set('selected', selected_name)
    }
    const new_url = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState(null, '', new_url)
  }

  function handle_checkbox_change(detail) {
    const { index, checked } = detail
    if (wrappers[index]) {
      wrappers[index].outer.style.display = checked ? 'block' : 'none'
      wrappers[index].checkbox_state = checked
      update_url()
      if (!checked && current_selected_wrapper === wrappers[index].outer) {
        clear_selection_highlight()
        update_url(null)
      }
    }
  }

  function handle_label_click(detail) {
    const { index, name } = detail
    if (wrappers[index]) {
      const target_wrapper = wrappers[index].outer
      if (target_wrapper.style.display === 'none') {
        target_wrapper.style.display = 'block'
        wrappers[index].checkbox_state = true
      }
      target_wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
      clear_selection_highlight()
      target_wrapper.style.backgroundColor = 'lightblue'
      current_selected_wrapper = target_wrapper
      update_url(name)
    }
  }

  function handle_select_all_toggle(detail) {
    const { selectAll: select_all } = detail
    wrappers.forEach((w, index) => {
      w.outer.style.display = select_all ? 'block' : 'none'
      w.checkbox_state = select_all
    })
    clear_selection_highlight()
    update_url(null)
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || (() => { })
      func(data, type)
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject(data) {
    style.innerHTML = data.join('\n')
  }
    async function send_quick_editor_data() {
      const roots = admin.status.db.read(['root_datasets'])
      const result = {}
      roots.forEach(root_dataset => {
        const root = root_dataset.name
        result[root] = {}
        const inputs = sdb.admin.get_dataset({ root }) || []
        inputs.forEach(type => {
          result[root][type] = {}
          const datasets = sdb.admin.get_dataset({ root, type })
          datasets && Object.values(datasets).forEach(name => {
            result[root][type][name] = {}
            const ds = sdb.admin.get_dataset({ root, type, name: name })
            ds.forEach(ds_id => {
              const files = admin.status.db.read([root, ds_id]).files || []
              result[root][type][name][ds_id] = {}
              files.forEach(file_id => {
                result[root][type][name][ds_id][file_id] = admin.status.db.read([root, file_id]) 
              })
            })
          })
        })
      })
      
      const editor_id = admin.status.a2i[admin.status.s2i[editor_subs[0].sid]]
      const port = await item.get(editor_id)
      // await io.at(editor_id)
      port.postMessage(result)

  }
}
function fallback_module() {
  const menuname = '../src/node_modules/menu'
  const names = [
    '../src/node_modules/theme_widget',
    '../src/node_modules/taskbar',
    '../src/node_modules/tabsbar',
    '../src/node_modules/action_bar',
    '../src/node_modules/space',
    '../src/node_modules/tabs',
    '../src/node_modules/console_history',
    '../src/node_modules/actions',
    '../src/node_modules/tabbed_editor',
    '../src/node_modules/task_manager',
    '../src/node_modules/quick_actions',
    'graph-explorer',
    '../src/node_modules/manager',
    '../src/node_modules/steps_wizard'
  ]
  const subs = {}
  names.forEach(subgen)
  subs['../src/node_modules/helpers'] = 0
  subs['../src/node_modules/tabs'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'variables': 'variables',
      'scroll': 'scroll',
      'style': 'style'
    }
  }
  subs['../src/node_modules/manager'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style'
    }
  }
  subs['../src/node_modules/steps_wizard'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style'
    }
  }
  subs['../src/node_modules/tabsbar'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/action_bar'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/console_history'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'commands': 'commands',
      'icons': 'icons',
      'scroll': 'scroll'
    }
  }
  subs['../src/node_modules/actions'] = {
    $: '',
    0: '',
    mapping: {
      'actions': 'actions',
      'icons': 'icons',
      'hardcons': 'hardcons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/tabbed_editor'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'files': 'files',
      'highlight': 'highlight',
      'active_tab': 'active_tab'
    }
  }
  subs['../src/node_modules/task_manager'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'count': 'count'
    }
  }
  subs['../src/node_modules/quick_actions'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'icons': 'icons',
      'actions': 'actions',
      'hardcons': 'hardcons'
    }
  }
  subs['graph-explorer'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'entries': 'entries',
      'runtime': 'runtime',
      'mode': 'mode'
    }
  }
  subs[menuname] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
    }
  }
  subs['../src/node_modules/quick_editor'] = {
    $: '',
    mapping: {
      'style': 'style'
    }
  }
  for (i = 0; i < Object.keys(subs).length - 1; i++) {
    subs['../src/node_modules/quick_editor'][i] = quick_editor$
  }

  return {
    _: subs,
    drive: {
      'style/': {
        'theme.css': {
          raw: `
          .components-wrapper-container {
            padding-top: 10px; /* Adjust as needed */
          }
      
          .components-wrapper {
            width: 95%;
            margin: 0 auto;
            padding: 2.5%;
          }
      
          .component-outer-wrapper {
            margin-bottom: 20px;
            padding: 0px 0px 10px 0px;
            transition: background-color 0.3s ease;
          }
      
          .component-name-label {
            background-color:transparent;
            padding: 8px 15px;
            text-align: center;
            font-weight: bold;
            color: #333;
          }
      
          .component-wrapper {
            position: relative;
            padding: 15px;
            border: 3px solid #666;
            resize: both;
            overflow: visible;
            border-radius: 0px;
            background-color: #eceff4;
            min-height: 50px;
          }
          .component-content {
            width: 100%;
            height: 100%;
          }
          .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #ccc;
          border-radius: 26px;
          transition: 0.4s;
        }

        .slider::before {
          content: "";
          position: absolute;
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.4s;
        }

        input:checked + .slider {
          background-color: #2196F3;
        }

        input:checked + .slider::before {
          transform: translateX(24px);
        }
      .component-wrapper:hover::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        border: 4px solid skyblue;
        pointer-events: none;
        z-index: 15;
        resize: both;
        overflow: auto;
      }
      .quick-editor {
        position: absolute;
        z-index: 100;
        top: 0;
        right: 0;
      }
      .component-wrapper:hover .quick-editor {
        display: block;
      }
      .component-wrapper > .quick-editor {
        display: none;
        top: -5px;
        right: -10px;
      }
      
      `

        }
      },
      'icons/': {},
      'variables/': {},
      'scroll/': {},
      'commands/': {},
      'actions/': {},
      'hardcons/': {},
      'files/': {},
      'highlight/': {},
      'count/': {},
      'entries/': {},
      'active_tab/': {},
      'runtime/': {},
      'mode/': {},
      'data/': {}
    }
  }
  function quick_editor$(args, tools, [quick_editor]) {
    const state = quick_editor()
    state.net = {
      page: {}
    }
    return state
  }
  function subgen(name) {
    subs[name] = {
      $: '',
      0: '',
      mapping: {
        'style': 'style',
      }
    }
  }
}

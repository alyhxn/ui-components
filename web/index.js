const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)
module.exports = create_component_menu
const action_bar = require('../src/node_modules/action_bar')
const search_bar = require('../src/node_modules/search_bar')
const graph_explorer = require('../src/node_modules/graph_explorer')
const chat_history = require('../src/node_modules/chat_history')
const tabbed_editor = require('../src/node_modules/tabbed_editor')
async function create_component_menu (opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const imports = {
    action_bar,
    search_bar,
    graph_explorer,
    chat_history,
    tabbed_editor
  }
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="nav-bar-container">
    <div class="nav-bar">
      <button class="menu-toggle-button">☰ MENU</button>
      <div class="menu hidden">
        <div class="menu-header">
          <button class="unselect-all-button">Unselect All</button>
        </div>
        <ul class="menu-list"></ul>
      </div>
    </div>
  </div>
  <div class="components-wrapper"></div>`
  // styling
  document.body.style.margin = 0
  const sheet = new CSSStyleSheet()
  shadow.adoptedStyleSheets = [sheet]
  // refering to template
  const list = shadow.querySelector('.menu-list')
  const wrapper = shadow.querySelector('.components-wrapper')
  const menu = shadow.querySelector('.menu')
  const toggle_btn = shadow.querySelector('.menu-toggle-button')
  const unselect_btn = shadow.querySelector('.unselect-all-button')
  // helper variables
  const entries = Object.entries(imports)
  const checkboxes = []
  const wrappers = []
  const names = []
  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  let initial_checked = []
  const selected_name = url_params.get('selected')
  let current_wrapper = null
  // events
  if (checked_param) {
    try {
      initial_checked = JSON.parse(checked_param)
      if (!Array.isArray(initial_checked)) initial_checked = []
    } catch (e) {
      console.error('Error parsing checked parameter:', e)
      initial_checked = []
    }
  }
  const subs = await sdb.watch(onbatch)
  entries.forEach(create_list)

  unselect_btn.onclick = on_unselect
  toggle_btn.onclick = on_menu_toggle
  document.onclick = on_doc_click
  window.onload = scroll_to_selected

  return el

  async function create_list ([name, factory], index) {
    const checked = initial_checked.includes(index + 1) || initial_checked.length === 0  
    // Menu List
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'
    menu_item.innerHTML = `
    <span>${name}</span>
    <input type="checkbox" ${checked ? 'checked' : ''}>`
    const label = menu_item.querySelector('span')
    const checkbox = menu_item.querySelector('input')
  
    list.append(menu_item)
    checkboxes.push(checkbox)
    names.push(name)

    // Actual Component
    const outer = document.createElement('div')
    outer.className = 'component-outer-wrapper'
    outer.style.display = checked ? 'block' : 'none'
    outer.innerHTML = `
    <div class="component-name-label">${name}</div>
    <div class="component-wrapper"></div>`
    wrappers.push(outer)
    const inner = outer.querySelector('.component-wrapper')
    inner.append(await factory(subs[index]))
    console.log(index)
    wrapper.append(outer)
    // event
    checkbox.onchange = on_checkbox
    label.onclick = on_label

    function on_checkbox (e) {
      outer.style.display = e.target.checked ? 'block' : 'none'
      update_url(checkboxes)
    }
  
    function on_label () {
      inner.scrollIntoView({ behavior: 'smooth', block: 'center' })
      update_url(checkboxes, name)
      if (current_wrapper && current_wrapper !== outer) {
        current_wrapper.style.backgroundColor = ''
      }
      outer.style.backgroundColor = 'lightblue'
      current_wrapper = outer
    }
  }

  function on_unselect () {
    if (unselect_btn.textContent === 'Unselect All') {
      checkboxes.forEach(c => c.checked = false)
      wrappers.forEach(w => w.style.display = 'none')
      unselect_btn.textContent = 'Select All'
    } else {
      checkboxes.forEach(c => c.checked = true)
      wrappers.forEach(w => w.style.display = 'block')
      unselect_btn.textContent = 'Unselect All'
    }
    update_url(checkboxes)
    if (current_wrapper) {
      current_wrapper.style.backgroundColor = ''
      current_wrapper = null
    }
  }

  function on_menu_toggle (e) {
    e.stopPropagation()
    menu.classList.toggle('hidden')
  }

  function on_doc_click (e) {
    if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !toggle_btn.contains(e.target)) {
      menu.classList.add('hidden')
    }
  }

  function scroll_to_selected () {
    if (selected_name) {
      const i = names.indexOf(selected_name)
      if (i !== -1) {
        const w = wrappers[i]
        w.scrollIntoView({ behavior: 'smooth', block: 'center' })
        w.style.backgroundColor = 'lightblue'
        current_wrapper = w
      }
    }
  }

  function update_url (checkboxes, selected) {
    const checked = checkboxes.reduce((acc, c, i) => {
      if (c.checked) acc.push(i + 1)
      return acc
    }, [])

    const params = new URLSearchParams(window.location.search)
    if (checked.length > 0 && checked.length < checkboxes.length) {
      params.set('checked', `[${checked.join(',')}]`)
    } else {
      params.delete('checked')
    }

    if (selected) {
      params.set('selected', selected)
    } else {
      params.delete('selected')
    }

    window.history.pushState(null, '', `${window.location.pathname}?${params}`)
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  async function inject (data) {
    sheet.replaceSync(data.join('\n'))
  }
}
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      '../src/node_modules/action_bar': {
        $: ''
      },
      '../src/node_modules/search_bar': {
        $: ''
      },
      '../src/node_modules/graph_explorer': {
        $: '',
      },
      '../src/node_modules/chat_history': {
        $: '',
      },
      '../src/node_modules/tabbed_editor': {
        $: '',
      }
    }
  }
  function fallback_instance () {
    return {
      _: {
        '../src/node_modules/action_bar': {
          0: ''
        },
        '../src/node_modules/search_bar': {
          0: ''
        },
        '../src/node_modules/graph_explorer': {
          0: ""
        },
        '../src/node_modules/chat_history': {
          0: ""
        },
        '../src/node_modules/tabbed_editor': {
          0: ""
        }
      },
      drive: {
        style: {
          'theme.css': {
            raw: `
            .nav-bar-container {
              position: sticky;
              top: 0;
              z-index: 100;
              background-color: #e0e0e0;
            }
  
            .nav-bar {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 10px 20px;
              background-color: #e0e0e0;
              border-bottom: 2px solid #333;
            }
  
            .menu-toggle-button {
              padding: 10px;
              background-color: #e0e0e0;
              border: none;
              cursor: pointer;
              border-radius: 5px;
            }
  
            .menu.hidden {
              display: none;
            }
  
            .menu {
              display: block;
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              width: 200px;
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
  
            .menu-header {
              margin-bottom: 10px;
              text-align: center;
            }
  
            .unselect-all-button {
              padding: 8px 12px;
              border: none;
              background-color: #d0d0d0;
              cursor: pointer;
              border-radius: 5px;
              width: 100%;
            }
  
            .menu-list {
              list-style: none;
              padding: 0;
              margin: 0;
              max-height: 400px;
              overflow-y: auto;
              background-color: #f0f0f0;
            }
  
            .menu-list::-webkit-scrollbar {
              width: 0;
              background: transparent;
            }
  
            .menu-list::-webkit-scrollbar-thumb {
              background: transparent;
            }
  
            .menu-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #ccc;
              cursor: pointer;
            }
  
            .menu-item:last-child {
              border-bottom: none;
            }
  
            .component-container {
              flex-grow: 1;
              padding-top: 20px + 50px;
              padding-left: 20px;
              padding-right: 20px;
              padding-bottom: 20px;
            }
  
            .components-wrapper {
              width: 95%;
              margin: 0 auto;
              padding: 2.5%;
            }
  
            .component-outer-wrapper {
              margin-bottom: 20px;
              padding: 0px 0px 10px 0px;
            }
  
            .component-name-label {
              background-color:transparent;
              padding: 8px 15px;
              text-align: center;
              font-weight: bold;
            }
  
            .component-wrapper {
              padding: 15px;
              border:3px solid #666;
              resize:both;
              overflow: auto;
              border-radius: 0px;
              background-color:#ffffff;
            }
  
            .component-wrapper:last-child {
              margin-bottom: 0;
            }`
          }
        }
      }
    }
  }
}
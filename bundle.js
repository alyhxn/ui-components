(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const { terminal, wand, help } = require('icons')
const search_bar = require('search_bar')

module.exports = action_bar

async function action_bar (opts = '') {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="action-bar-container">
    <div class="action-bar-content">
      <button class="icon-button">
        ${terminal()}
      </button>
      <div class="separator"></div>
      <button class="icon-button">
        ${wand()}
      </button>
      <div class="separator"></div>
      <searchbar></searchbar>
      <button class="icon-button">
        ${help()}
      </button>
    </div>
  </div>`
  const subs = await sdb.watch(onbatch)
  console.log(`actionbar subs: `, subs)
  search_bar(subs[0]).then(el => shadow.querySelector('searchbar').replaceWith(el))

  // to add a click event listener to the buttons:
  // const [btn1, btn2, btn3] = shadow.querySelectorAll('button')
  // btn1.addEventListener('click', () => { console.log('Terminal button clicked') })

  return el
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      search_bar: {
        $: ([app]) => app()
      },
      icons: {
        $: ''
      }
    }
  }
  function fallback_instance () {
    return {
      _: {
        search_bar: {
          0: '',
          mapping: {
            style: 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .action-bar-container {
                  display: flex;
                  align-items: center;
                  background-color: #212121;
                  padding: 0.5rem;
                  // min-width: 456px
              }

              .action-bar-content {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  flex:1;
              }

              .icon-button {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                border: none;
                background-color: transparent;
                cursor: pointer;
              }


              .separator {
                  width: 1px;
                  height: 24px;
                  background-color: #424242;
              }

              .search-bar-container {
                flex: 1;
                position: relative;
              }
              svg {
                display: block;
                margin: auto;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/action_bar.js")
},{"STATE":1,"icons":5,"search_bar":7}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = chat_history
async function chat_history(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Chat-History</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/chat_history.js")
},{"STATE":1}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = graph_explorer
async function graph_explorer(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Graph-Explorer</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/graph_explorer.js")
},{"STATE":1}],5:[function(require,module,exports){
module.exports = {
  terminal,
  wand,
  search,
  close,
  help,
  crumb
}

const stroke = '#a0a0a0'
const thickness = '1.5'
const width = '24'
const height = '24'

function terminal() {
  const path = `
  <svg width=${width} height=${height} viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_256_7194)">
      <path d="M16.6365 16.0813H16.8365V15.8813V14.8297V14.6297H16.6365H11.453H11.253V14.8297V15.8813V16.0813H11.453H16.6365ZM5.09034 7.85454L4.9519 7.99496L5.09034 8.13538L8.58038 11.6752L5.09034 15.2151L4.9519 15.3555L5.09034 15.4959L5.8234 16.2394L5.96582 16.3839L6.10824 16.2394L10.4698 11.8156L10.6082 11.6752L10.4698 11.5348L6.10824 7.11102L5.96582 6.96656L5.8234 7.11102L5.09034 7.85454ZM17.6732 0.960156H4.19606C2.36527 0.960156 0.885937 2.46471 0.885937 4.31468V15.8813C0.885937 17.7313 2.36527 19.2358 4.19606 19.2358H17.6732C19.5041 19.2358 20.9834 17.7313 20.9834 15.8813V4.31468C20.9834 2.46471 19.5041 0.960156 17.6732 0.960156ZM2.33285 4.11468C2.43133 3.15557 3.23023 2.41167 4.19606 2.41167H17.6732C18.6391 2.41167 19.438 3.15557 19.5364 4.11468H2.33285ZM4.19606 17.7843C3.16406 17.7843 2.32264 16.935 2.32264 15.8813V5.5662H19.5467V15.8813C19.5467 16.935 18.7053 17.7843 17.6732 17.7843H4.19606Z" fill=${stroke} stroke=${stroke} stroke-width=${thickness / 4} />
    </g>
    <defs>
      <clipPath id="clip0_256_7194">
        <rect width="22" height="20" fill="white"/>
      </clipPath>
    </defs>
  </svg>`

  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}

function wand() {
  const path = `
  <svg width=${width} height=${height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_256_6751)">
      <path d="M5 17.5L17.5 5L15 2.5L2.5 15L5 17.5Z" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.5 5L15 7.5" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7.4987 2.5C7.4987 2.94203 7.67429 3.36595 7.98685 3.67851C8.29941 3.99107 8.72334 4.16667 9.16536 4.16667C8.72334 4.16667 8.29941 4.34226 7.98685 4.65482C7.67429 4.96738 7.4987 5.39131 7.4987 5.83333C7.4987 5.39131 7.3231 4.96738 7.01054 4.65482C6.69798 4.34226 6.27406 4.16667 5.83203 4.16667C6.27406 4.16667 6.69798 3.99107 7.01054 3.67851C7.3231 3.36595 7.4987 2.94203 7.4987 2.5Z" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15.8346 10.8333C15.8346 11.2753 16.0102 11.6992 16.3228 12.0118C16.6354 12.3243 17.0593 12.4999 17.5013 12.4999C17.0593 12.4999 16.6354 12.6755 16.3228 12.9881C16.0102 13.3006 15.8346 13.7246 15.8346 14.1666C15.8346 13.7246 15.659 13.3006 15.3465 12.9881C15.0339 12.6755 14.61 12.4999 14.168 12.4999C14.61 12.4999 15.0339 12.3243 15.3465 12.0118C15.659 11.6992 15.8346 11.2753 15.8346 10.8333Z" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_256_6751">
        <rect width="20" height="20" fill="white"/>
      </clipPath>
    </defs>
  </svg>`

  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}

function search() {
  const path = `
  <svg width=${width} height=${height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Group for the circle (background) -->
    <g id="circle">
      <circle cx="12" cy="12" r="12" fill="#1A1A1A"/>
    </g>

    <!-- Group for the search icon (foreground) -->
    <g id="search-icon" transform="translate(7 7)">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_256_6745)">
          <path d="M4.68129 8.49368C6.78776 8.49368 8.49539 6.78605 8.49539 4.67958C8.49539 2.57311 6.78776 0.865479 4.68129 0.865479C2.57482 0.865479 0.867188 2.57311 0.867188 4.67958C0.867188 6.78605 2.57482 8.49368 4.68129 8.49368Z" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.22987 9.23084L7.69141 7.69238" stroke=${stroke} stroke-width=${thickness}stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_256_6745">
            <rect width="10" height="10" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </g>
  </svg>`

  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}

function close() {
  const path = `
  <svg width=${width} height=${height} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_256_7190)">
      <path d="M11.25 4.25L3.75 11.75" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.75 4.25L11.25 11.75" stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_256_7190">
        <rect width="15" height="15" fill="white" transform="translate(0 0.5)"/>
      </clipPath>
    </defs>
  </svg>`

  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}

function help() {
  const path = `
  <svg width=${width} height=${height} viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_256_7199)">
      <path d="M6 6.66675C6 6.00371 6.27656 5.36782 6.76884 4.89898C7.26113 4.43014 7.92881 4.16675 8.625 4.16675H9.375C10.0712 4.16675 10.7389 4.43014 11.2312 4.89898C11.7234 5.36782 12 6.00371 12 6.66675C12.0276 7.20779 11.8963 7.74416 11.6257 8.19506C11.3552 8.64596 10.9601 8.98698 10.5 9.16675C10.0399 9.40644 9.64482 9.86113 9.37428 10.4623C9.10374 11.0635 8.97238 11.7787 9 12.5001" stroke=${stroke} stroke-width=${thickness * 1.5} stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 15.8333V15.8416" stroke=${stroke} stroke-width=${thickness * 1.5} stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_256_7199">
        <rect width="18" height="20" fill="white"/>
      </clipPath>
    </defs>
  </svg>`

  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}
function crumb() {
  const path = `
  <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke=${stroke} stroke-width=${thickness} stroke-linecap="round" stroke-linejoin="round" d="m10 16 4-4-4-4"/>
  </svg>`
  const container = document.createElement('div')
  container.innerHTML = path

  return container.outerHTML
}
},{}],6:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
module.exports = create_component_menu
async function create_component_menu (opts, names, inicheck, callbacks) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const {
    on_checkbox_change,
    on_label_click,
    on_select_all_toggle
  } = callbacks

  const checkobject = {}
  inicheck.forEach(i => {
    checkobject[i - 1] = true
  })
  const all_checked = inicheck.length === 0 || Object.keys(checkobject).length === names.length

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="nav-bar-container-inner">
    <div class="nav-bar">
      <button class="menu-toggle-button">☰ MENU</button>
      <div class="menu hidden">
        <div class="menu-header">
          <button class="unselect-all-button">${all_checked ? 'Unselect All' : 'Select All'}</button>
        </div>
        <ul class="menu-list"></ul>
      </div>
    </div>
  </div>`

  const menu = shadow.querySelector('.menu')
  const toggle_btn = shadow.querySelector('.menu-toggle-button')
  const unselect_btn = shadow.querySelector('.unselect-all-button')
  const list = shadow.querySelector('.menu-list')

  names.forEach((name, index) => {
    const is_checked = all_checked || checkobject[index] === true
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'
    menu_item.innerHTML = `
      <span data-index="${index}" data-name="${name}">${name}</span>
      <input type="checkbox" data-index="${index}" ${is_checked ? 'checked' : ''}>
    `
    list.appendChild(menu_item)

    const checkbox = menu_item.querySelector('input')
    const label = menu_item.querySelector('span')

    checkbox.onchange = (e) => {
      on_checkbox_change({ index, checked: e.target.checked })
    }

    label.onclick = () => {
      on_label_click({ index, name })
      menu.classList.add('hidden')
    }
  })
  // event listeners
  const subs = await sdb.watch(onbatch)
  toggle_btn.onclick = on_toggle_btn
  unselect_btn.onclick = on_unselect_btn
  document.onclick = handle_document_click

  return el

  function on_toggle_btn (e) {
    e.stopPropagation()
    menu.classList.toggle('hidden')
  }

  function on_unselect_btn () {
    const select_all = unselect_btn.textContent === 'Select All'
    unselect_btn.textContent = select_all ? 'Unselect All' : 'Select All'
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = select_all })
    on_select_all_toggle({ selectAll: select_all })
  }

  function handle_document_click (e) {
    const path = e.composedPath()
    if (!menu.classList.contains('hidden') && !path.includes(el)) {
      menu.classList.add('hidden')
    }
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  function inject (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module () {
  return {
    api: fallback_instance
  }
  function fallback_instance () {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
            :host {
              display: block;
              position: sticky;
              top: 0;
              z-index: 100;
              background-color: #e0e0e0;
            }

            .nav-bar-container-inner {
            }

            .nav-bar {
              display: flex;
              position: relative;
              justify-content: center;
              align-items: center;
              padding: 10px 20px;
              border-bottom: 2px solid #333;
              min-height: 30px;
            }

            .menu-toggle-button {
              padding: 10px;
              background-color: #e0e0e0;
              border: none;
              cursor: pointer;
              border-radius: 5px;
              font-weight: bold;
            }

            .menu-toggle-button:hover {
              background-color: #d0d0d0;
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
              width: 250px;
              max-width: 90%;
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              z-index: 101;
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

            .unselect-all-button:hover {
              background-color: #c0c0c0;
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
              width: 8px;
            }

            .menu-list::-webkit-scrollbar-track {
              background: #f0f0f0;
            }

            .menu-list::-webkit-scrollbar-thumb {
              background: #ccc;
              border-radius: 4px;
            }

            .menu-list::-webkit-scrollbar-thumb:hover {
              background: #bbb;
            }

            .menu-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 5px;
              border-bottom: 1px solid #ccc;
            }

            .menu-item span {
              cursor: pointer;
              flex-grow: 1;
              margin-right: 10px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .menu-item span:hover {
              color: #007bff;
            }

            .menu-item:last-child {
              border-bottom: none;
            }

            .menu-item input[type="checkbox"] {
              flex-shrink: 0;
            }`
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/menu.js")
},{"STATE":1}],7:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const { search, close } = require('icons')
module.exports = search_bar
async function search_bar (opts = '') {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const el = document.createElement('div')
  el.className = 'search-bar-container'
  const shadow = el.attachShadow({ mode: 'closed' })
  const sheet = new CSSStyleSheet()
  shadow.innerHTML = `
  <div class="search-input-container">
    <div class="search-input-content">
      <div class="search-input-text"></div>
      <input type="text" class="search-input" style="display: none;">
    </div>
    <button class="search-reset-button"></button>
  </div>`

  const input_container = shadow.querySelector('.search-input-container')
  const input_content = shadow.querySelector('.search-input-content')
  const text_span = shadow.querySelector('.search-input-text')
  const input_element = shadow.querySelector('.search-input')
  const reset_button = shadow.querySelector('.search-reset-button')
  let barmode = ''
  const subs = await sdb.watch(onbatch)
  console.log(`search bar subs: ${subs}`)

  async function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  input_container.onclick = on_input_container_click
  input_element.onblur = on_input_element_blur
  reset_button.onclick = on_reset_click
  text_span.onclick = on_span_click

  return el
  function inject(data) {
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  function show () {
    input_content.replaceChildren(input_element)
    input_element.style.display = 'block'
    input_element.focus()
    reset_button.innerHTML = close()
    barmode = 'already'
  }
  function hide () {
    input_content.replaceChildren(text_span)
    input_element.style.display = 'none'
    reset_button.innerHTML = search()
  }
  function on_input_container_click (event) {
    // console.log('Focus Event:', event)
    if (barmode === 'already') {
      return
    }
    show()
  }
  function on_input_element_blur (event) {
    // console.log('Blur Event:', event)
    if (input_element.value === '') {
      hide()
    }
  }
  function on_span_click (event) {
    event.stopPropagation()
    handle_breadcrumb_click(event)
  }
  function on_reset_click (event) {
    event.stopPropagation()
    handle_reset(event)
  }
  function handle_reset (event) {
    // console.log('Reset Event:', event)
    input_element.value = ''
    hide()
  }
  function handle_breadcrumb_click (event) {
    // console.log('Breadcrumb Event:', event)
    show()
    input_element.placeholder = '#night'
  }
}
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      icons: {
        $: ''
      }
    }
  }
  function fallback_instance () {
    return {
      drive: {
        'style': {
          'theme.css':{
            raw: `
              .search-bar-container {
                flex: 1;
                position: relative;
              }
          
              .search-input-container {
                height: 2rem;
                padding-left: 0.75rem;
                padding-right: 0.75rem;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                background-color: #303030;
                border-radius: 0.375rem;
                cursor: text;
              }
              
              svg {
                display: block;
                margin: auto;
              }
              
              .search-input-content {
                flex: 1;
              }
          
              .search-input-text {
                font-size: 0.875rem;
                color: #a0a0a0;
              }
          
              .search-input {
                width: 100%;
                background-color: transparent;
                outline: none;
                border: none;
                color: #a0a0a0;
                font-size: 0.875rem;
              }
          
              .search-reset-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin-left: 0;
                padding: 0;
                border: none;
                background-color: transparent;
              }
          
              .search-reset-button:hover {
                cursor: pointer;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/search_bar.js")
},{"STATE":1,"icons":5}],8:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = tabbed_editor
async function tabbed_editor(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Tabbed-Editor</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/tabbed_editor.js")
},{"STATE":1}],9:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
module.exports = component
async function component(opts, callback) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    variables: onvariables,
    style: inject,
    icons: iconject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<div class="tab-entries"></div>`
  const entries = shadow.querySelector('.tab-entries')
  let dricons = {}
  const subs = await sdb.watch(onbatch)
  return div
  async function create_btn ({name, id},index) {
    const el = document.createElement('div')
    el.innerHTML = `
    <span class="icon">${dricons[index + 1]}</span>
    <span class='name'>${id}</span>
    <span class="name">${name}</span>
    <button class="btn">${dricons[0]}</button>`

    el.className = 'tabsbtn'
    const icon_el = el.querySelector('.icon')
    const label_el = el.querySelector('.name')

    label_el.draggable = false
    icon_el.onclick = callback
    entries.onwheel = (e) => {
      if(entries.scrollWidth > entries.clientWidth) {
      e.preventDefault()
      entries.scrollLeft += e.deltaY/20
      }
    }
    entries.appendChild(el)
    return
  }
  async function load_svg(svg_url) {
    const response = await fetch(svg_url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const text_svg = await response.text()
    return text_svg
  }
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  function onvariables (data) {
    data[0].forEach( create_btn)
  }
  function iconject(data) {
    dricons = data
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        icons: {
          'cross.svg':{
            raw: 
            `<svg class="btn" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_1463_3695)">
            <path d="M10.5 3.5L3.5 10.5" stroke="#A6A6A6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.5 3.5L10.5 10.5" stroke="#A6A6A6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <defs>
            <clipPath id="clip0_1463_3695">
            <rect width="14" height="14" fill="white"/>
            </clipPath>
            </defs>
            </svg>`
          },
          '1.svg': {
            raw: `<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.30078 0.351562C9.64362 0.257059 10.0075 0.41754 10.1689 0.734375L10.2002 0.804688L10.2012 0.806641L14.9297 13.4746C15.6501 13.6286 16.5509 13.8696 17.2842 14.2246C17.6644 14.4087 18.0083 14.6273 18.2588 14.8867C18.5108 15.1476 18.6748 15.4579 18.6748 15.8174C18.6747 16.3309 18.3337 16.7589 17.8125 17.1064C17.2887 17.4557 16.5531 17.7452 15.6914 17.9756C13.9659 18.4369 11.696 18.6748 9.5 18.6748C7.30384 18.6748 5.03327 18.437 3.30762 17.9756C2.44588 17.7452 1.71036 17.4557 1.18652 17.1064C0.665391 16.7589 0.324333 16.3309 0.324219 15.8174L0.332031 15.6846C0.366904 15.3809 0.520732 15.115 0.741211 14.8867C0.991742 14.6275 1.33571 14.4086 1.71582 14.2246C2.44857 13.87 3.34834 13.6296 4.06836 13.4756L8.79688 0.80957L8.8291 0.736328C8.91244 0.571987 9.05409 0.44336 9.22754 0.375977L9.30078 0.351562ZM15.5254 15.0713H15.5264C15.5294 15.0791 15.5324 15.0869 15.5352 15.0947L15.5566 15.1689C15.6444 15.5396 15.4389 15.9242 15.0713 16.0518L15.0674 16.0527C13.2683 16.6242 11.3884 16.8986 9.50098 16.8682L9.50195 16.8691L9.49902 16.8682L9.49707 16.8691V16.8682C7.61 16.8985 5.7304 16.6241 3.93164 16.0527L3.92773 16.0518L3.90234 16.042C3.53972 15.901 3.34893 15.5097 3.4502 15.1426L3.47363 15.0693L3.68945 14.4893C2.85761 14.7018 2.24878 14.9437 1.8418 15.1797C1.61636 15.3104 1.45822 15.4363 1.3584 15.5498C1.25773 15.6643 1.22656 15.7546 1.22656 15.8174C1.22664 15.8804 1.25554 15.963 1.33984 16.0645C1.42399 16.1656 1.55552 16.2755 1.73828 16.3896C2.10391 16.6181 2.65266 16.8495 3.37207 17.0557C4.80922 17.4675 6.90121 17.7725 9.5 17.7725C12.0986 17.7724 14.1899 17.4675 15.627 17.0557C16.3464 16.8495 16.8951 16.6181 17.2607 16.3896C17.4435 16.2755 17.575 16.1656 17.6592 16.0645C17.7435 15.963 17.7724 15.8804 17.7725 15.8174C17.7725 15.7546 17.7413 15.6643 17.6406 15.5498C17.5408 15.4363 17.3827 15.3105 17.1572 15.1797C16.7501 14.9435 16.1409 14.702 15.3086 14.4893L15.5254 15.0713ZM4.37109 15.2393C6.03024 15.7517 7.76019 15.9993 9.49707 15.9678H9.50195L10.1729 15.9658C11.6834 15.9305 13.1817 15.6851 14.6279 15.2422L14.2998 14.3643C12.7446 14.8392 11.1266 15.0757 9.5 15.0635L9.50098 15.0645L9.49902 15.0635L9.49805 15.0645V15.0635C7.87169 15.0757 6.25406 14.8385 4.69922 14.3633L4.37109 15.2393ZM5.01367 13.5176C6.46761 13.9558 7.97893 14.175 9.49805 14.1631H9.50098L10.0898 14.1562C11.4101 14.1156 12.7194 13.8999 13.9854 13.5186L9.49902 1.5L5.01367 13.5176Z" fill="#A6A6A6" stroke="#A6A6A6" stroke-width="0.3"/>
            </svg>`
          },
          '2.svg': {
            raw: `
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.30078 0.351562C9.64362 0.257059 10.0075 0.41754 10.1689 0.734375L10.2002 0.804688L10.2012 0.806641L14.9297 13.4746C15.6501 13.6286 16.5509 13.8696 17.2842 14.2246C17.6644 14.4087 18.0083 14.6273 18.2588 14.8867C18.5108 15.1476 18.6748 15.4579 18.6748 15.8174C18.6747 16.3309 18.3337 16.7589 17.8125 17.1064C17.2887 17.4557 16.5531 17.7452 15.6914 17.9756C13.9659 18.4369 11.696 18.6748 9.5 18.6748C7.30384 18.6748 5.03327 18.437 3.30762 17.9756C2.44588 17.7452 1.71036 17.4557 1.18652 17.1064C0.665391 16.7589 0.324333 16.3309 0.324219 15.8174L0.332031 15.6846C0.366904 15.3809 0.520732 15.115 0.741211 14.8867C0.991742 14.6275 1.33571 14.4086 1.71582 14.2246C2.44857 13.87 3.34834 13.6296 4.06836 13.4756L8.79688 0.80957L8.8291 0.736328C8.91244 0.571987 9.05409 0.44336 9.22754 0.375977L9.30078 0.351562ZM15.5254 15.0713H15.5264C15.5294 15.0791 15.5324 15.0869 15.5352 15.0947L15.5566 15.1689C15.6444 15.5396 15.4389 15.9242 15.0713 16.0518L15.0674 16.0527C13.2683 16.6242 11.3884 16.8986 9.50098 16.8682L9.50195 16.8691L9.49902 16.8682L9.49707 16.8691V16.8682C7.61 16.8985 5.7304 16.6241 3.93164 16.0527L3.92773 16.0518L3.90234 16.042C3.53972 15.901 3.34893 15.5097 3.4502 15.1426L3.47363 15.0693L3.68945 14.4893C2.85761 14.7018 2.24878 14.9437 1.8418 15.1797C1.61636 15.3104 1.45822 15.4363 1.3584 15.5498C1.25773 15.6643 1.22656 15.7546 1.22656 15.8174C1.22664 15.8804 1.25554 15.963 1.33984 16.0645C1.42399 16.1656 1.55552 16.2755 1.73828 16.3896C2.10391 16.6181 2.65266 16.8495 3.37207 17.0557C4.80922 17.4675 6.90121 17.7725 9.5 17.7725C12.0986 17.7724 14.1899 17.4675 15.627 17.0557C16.3464 16.8495 16.8951 16.6181 17.2607 16.3896C17.4435 16.2755 17.575 16.1656 17.6592 16.0645C17.7435 15.963 17.7724 15.8804 17.7725 15.8174C17.7725 15.7546 17.7413 15.6643 17.6406 15.5498C17.5408 15.4363 17.3827 15.3105 17.1572 15.1797C16.7501 14.9435 16.1409 14.702 15.3086 14.4893L15.5254 15.0713ZM4.37109 15.2393C6.03024 15.7517 7.76019 15.9993 9.49707 15.9678H9.50195L10.1729 15.9658C11.6834 15.9305 13.1817 15.6851 14.6279 15.2422L14.2998 14.3643C12.7446 14.8392 11.1266 15.0757 9.5 15.0635L9.50098 15.0645L9.49902 15.0635L9.49805 15.0645V15.0635C7.87169 15.0757 6.25406 14.8385 4.69922 14.3633L4.37109 15.2393ZM5.01367 13.5176C6.46761 13.9558 7.97893 14.175 9.49805 14.1631H9.50098L10.0898 14.1562C11.4101 14.1156 12.7194 13.8999 13.9854 13.5186L9.49902 1.5L5.01367 13.5176Z" fill="#A6A6A6" stroke="#A6A6A6" stroke-width="0.3"/>
            </svg>`
          },
          '3.svg': {
            raw: `
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.30078 0.351562C9.64362 0.257059 10.0075 0.41754 10.1689 0.734375L10.2002 0.804688L10.2012 0.806641L14.9297 13.4746C15.6501 13.6286 16.5509 13.8696 17.2842 14.2246C17.6644 14.4087 18.0083 14.6273 18.2588 14.8867C18.5108 15.1476 18.6748 15.4579 18.6748 15.8174C18.6747 16.3309 18.3337 16.7589 17.8125 17.1064C17.2887 17.4557 16.5531 17.7452 15.6914 17.9756C13.9659 18.4369 11.696 18.6748 9.5 18.6748C7.30384 18.6748 5.03327 18.437 3.30762 17.9756C2.44588 17.7452 1.71036 17.4557 1.18652 17.1064C0.665391 16.7589 0.324333 16.3309 0.324219 15.8174L0.332031 15.6846C0.366904 15.3809 0.520732 15.115 0.741211 14.8867C0.991742 14.6275 1.33571 14.4086 1.71582 14.2246C2.44857 13.87 3.34834 13.6296 4.06836 13.4756L8.79688 0.80957L8.8291 0.736328C8.91244 0.571987 9.05409 0.44336 9.22754 0.375977L9.30078 0.351562ZM15.5254 15.0713H15.5264C15.5294 15.0791 15.5324 15.0869 15.5352 15.0947L15.5566 15.1689C15.6444 15.5396 15.4389 15.9242 15.0713 16.0518L15.0674 16.0527C13.2683 16.6242 11.3884 16.8986 9.50098 16.8682L9.50195 16.8691L9.49902 16.8682L9.49707 16.8691V16.8682C7.61 16.8985 5.7304 16.6241 3.93164 16.0527L3.92773 16.0518L3.90234 16.042C3.53972 15.901 3.34893 15.5097 3.4502 15.1426L3.47363 15.0693L3.68945 14.4893C2.85761 14.7018 2.24878 14.9437 1.8418 15.1797C1.61636 15.3104 1.45822 15.4363 1.3584 15.5498C1.25773 15.6643 1.22656 15.7546 1.22656 15.8174C1.22664 15.8804 1.25554 15.963 1.33984 16.0645C1.42399 16.1656 1.55552 16.2755 1.73828 16.3896C2.10391 16.6181 2.65266 16.8495 3.37207 17.0557C4.80922 17.4675 6.90121 17.7725 9.5 17.7725C12.0986 17.7724 14.1899 17.4675 15.627 17.0557C16.3464 16.8495 16.8951 16.6181 17.2607 16.3896C17.4435 16.2755 17.575 16.1656 17.6592 16.0645C17.7435 15.963 17.7724 15.8804 17.7725 15.8174C17.7725 15.7546 17.7413 15.6643 17.6406 15.5498C17.5408 15.4363 17.3827 15.3105 17.1572 15.1797C16.7501 14.9435 16.1409 14.702 15.3086 14.4893L15.5254 15.0713ZM4.37109 15.2393C6.03024 15.7517 7.76019 15.9993 9.49707 15.9678H9.50195L10.1729 15.9658C11.6834 15.9305 13.1817 15.6851 14.6279 15.2422L14.2998 14.3643C12.7446 14.8392 11.1266 15.0757 9.5 15.0635L9.50098 15.0645L9.49902 15.0635L9.49805 15.0645V15.0635C7.87169 15.0757 6.25406 14.8385 4.69922 14.3633L4.37109 15.2393ZM5.01367 13.5176C6.46761 13.9558 7.97893 14.175 9.49805 14.1631H9.50098L10.0898 14.1562C11.4101 14.1156 12.7194 13.8999 13.9854 13.5186L9.49902 1.5L5.01367 13.5176Z" fill="#A6A6A6" stroke="#A6A6A6" stroke-width="0.3"/>
            </svg>`
          }
        },
        variables: {
          'tabs.json': {
            raw: [
              { name: 'Home',id: '0:' },
              { name: 'Settings', id: '1:' },
              { name: 'Profile', id: '2:' },
            ]
          }
        },
        style: {
          'theme.css': {
            raw: `
            .tab-entries {
              display: flex;
              flex-direction: row;
              justify-content: flex-start;
              align-items: center;
              align-content: center;
              flex-wrap: nowrap;
              overflow-x: hidden;
              background-color: #131315;
              column-gap: 14px;
              padding: 10px 2px;
            }
            .tabsbtn {
              display: flex;
              flex-direction: row;
              flex-wrap: nowrap;
              align-items: center;
              background-color: #191919;
              padding: 8px 14px;
              border-radius: 30px;
            }
            .icon {
              margin-right: 5px;
            }
            .name {
              font-size: 14px;
              margin-right: 5px;
              user-select: none;
              color: #a6a6a6;
            }
            .btn {
              border: none;
              display: flex;
              padding: 0;
              background-color: transparent;
              color: #ffffff;
            }
            svg.btn{
              width: 25px;
              height: 25px;
            }
            svg{
              width: 20px;
              height: 20px;
            }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/tabs.js")
},{"STATE":1}],10:[function(require,module,exports){
const init_url = location.hash === '#dev' ? '/doc/state/example/init.js' : 'https://raw.githubusercontent.com/alyhxn/playproject/refs/heads/main/doc/state/example/init.js'
const args = arguments

fetch(init_url, { cache: "no-store" }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args) 
  require('./page') // or whatever is otherwise the main entry of our project
})
},{"./page":11}],11:[function(require,module,exports){
(function (__filename){(function (){
localStorage.clear()
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
/******************************************************************************
  PAGE
******************************************************************************/
const navbar = require('../src/node_modules/menu')
const action_bar = require('../src/node_modules/action_bar')
const search_bar = require('../src/node_modules/search_bar')
const graph_explorer = require('../src/node_modules/graph_explorer')
const chat_history = require('../src/node_modules/chat_history')
const tabbed_editor = require('../src/node_modules/tabbed_editor')
const tabs = require('../src/node_modules/tabs')

const imports = {
  action_bar,
  search_bar,
  tabs,
  chat_history,
  graph_explorer,
  tabbed_editor
}
config().then(() => boot({ sid: '' }))

async function config () {
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
async function boot (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const on = {
    style: inject
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
  </div>`
  el.style.margin = 0
  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------

  const navbar_slot = shadow.querySelector('.navbar-slot')
  const components_wrapper = shadow.querySelector('.components-wrapper')

  const entries = Object.entries(imports)
  const wrappers = []
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
  const subs = await sdb.watch(onbatch)
  console.log(`page subs: `, subs)
  const { style } = subs['../src/node_modules/menu']
  const nav_menu_element = await navbar(subs[names.length], names, initial_checked_indices, menu_callbacks)
  navbar_slot.replaceWith(nav_menu_element)
  entries.forEach(create_component)
  window.onload = scroll_to_initial_selected
  return el
  async function create_component ([name, factory], index) {
    const is_initially_checked = initial_checked_indices.length === 0 || initial_checked_indices.includes(index + 1)
    const outer = document.createElement('div')
    outer.className = 'component-outer-wrapper'
    outer.style.display = is_initially_checked ? 'block' : 'none'
    outer.innerHTML = `
      <div class="component-name-label">${name}</div>
      <div class="component-wrapper"></div>
    `
    const inner = outer.querySelector('.component-wrapper')
    if(index === 0) inner.append(await factory(subs[1]))
    else inner.append(await factory(subs[index + 2]))
    components_wrapper.appendChild(outer)
    wrappers[index] = { outer, inner, name, checkbox_state: is_initially_checked }
  }

  function scroll_to_initial_selected () {
    if (selected_name_param) {
      const index = names.indexOf(selected_name_param)
      if (index !== -1 && wrappers[index]) {
        const target_wrapper = wrappers[index].outer
        if (target_wrapper.style.display !== 'none') {
          setTimeout(() => {
            target_wrapper.scrollIntoView({ behavior: 'auto', block: 'center' })
            clear_selection_highlight()
            target_wrapper.style.backgroundColor = 'lightblue'
            current_selected_wrapper = target_wrapper
          }, 100)
        }
      }
    }
  }

  function clear_selection_highlight () {
    if (current_selected_wrapper) {
      current_selected_wrapper.style.backgroundColor = ''
    }
    current_selected_wrapper = null
  }

  function update_url (selected_name = url_params.get('selected')) {
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

  function handle_checkbox_change (detail) {
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

  function handle_label_click (detail) {
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

  function handle_select_all_toggle (detail) {
    const { selectAll: select_all } = detail
    wrappers.forEach((w, index) => {
      w.outer.style.display = select_all ? 'block' : 'none'
      w.checkbox_state = select_all
    })
    clear_selection_highlight()
    update_url(null)
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module () {
  const menuname = '../src/node_modules/menu'
  const names = [
    '../src/node_modules/action_bar',
    '../src/node_modules/search_bar',
    '../src/node_modules/tabs',
    '../src/node_modules/chat_history',
    '../src/node_modules/graph_explorer',
    '../src/node_modules/tabbed_editor'
  ]
  const subs = {}
  names.forEach(subgen)
  subs[menuname] = { 
    $: '',
    0: '',
    mapping: {
      'style': 'style',
    }
  }
  subs['../src/node_modules/tabs'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'variables': 'variables',
      'style': 'style'
    }
  }
  console.log('subs', subs)
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
            padding: 15px;
            border: 3px solid #666;
            resize: both;
            overflow: auto;
            border-radius: 0px;
            background-color: #ffffff;
            min-height: 50px;
          }`
        }
      }
    }
  }
  function subgen (name) {
    subs[name] = {
      $: '',
      0: '',
      mapping: {
        'style': 'style',
      }
    }
  }
}

}).call(this)}).call(this,"/web/page.js")
},{"../src/node_modules/STATE":1,"../src/node_modules/action_bar":2,"../src/node_modules/chat_history":3,"../src/node_modules/graph_explorer":4,"../src/node_modules/menu":6,"../src/node_modules/search_bar":7,"../src/node_modules/tabbed_editor":8,"../src/node_modules/tabs":9}]},{},[10]);

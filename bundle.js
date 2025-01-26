(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.action_bar = require('Action-Bar')
module.exports.chat_history = require('Chat-History')
module.exports.graph_explorer = require('Graph-Explorer')
module.exports.tabbed_editor = require('Tabbed-Editor')
module.exports.search_bar = require('Action-Bar/search-bar')
module.exports.action_bar1 = require('Action-Bar')
module.exports.chat_history1 = require('Chat-History')
module.exports.graph_explorer1 = require('Graph-Explorer')
module.exports.tabbed_editor1 = require('Tabbed-Editor')
module.exports.search_bar1 = require('Action-Bar/search-bar')
module.exports.action_bar2 = require('Action-Bar')
module.exports.chat_history2 = require('Chat-History')
module.exports.graph_explorer2 = require('Graph-Explorer')
module.exports.tabbed_editor2 = require('Tabbed-Editor')
module.exports.search_bar2 = require('Action-Bar/search-bar')
module.exports.action_bar3 = require('Action-Bar')
module.exports.chat_history3 = require('Chat-History')
module.exports.graph_explorer3 = require('Graph-Explorer')
module.exports.tabbed_editor3 = require('Tabbed-Editor')
module.exports.search_bar3 = require('Action-Bar/search-bar')
module.exports.action_bar4 = require('Action-Bar')
module.exports.chat_history4 = require('Chat-History')
module.exports.graph_explorer4 = require('Graph-Explorer')
module.exports.tabbed_editor4 = require('Tabbed-Editor')
module.exports.search_bar4 = require('Action-Bar/search-bar')

},{"Action-Bar":2,"Action-Bar/search-bar":3,"Chat-History":4,"Graph-Explorer":5,"Tabbed-Editor":6}],2:[function(require,module,exports){
const { terminal, wand, help } = require('icons')
const SearchBar = require('Action-Bar/search-bar')

module.exports = action_bar

function action_bar () {
  const search_bar = SearchBar('Home > Documents > Current > theme')

  // creating parent
  const el = document.createElement('div')
  el.className = 'action-bar-container'
  el.id = 'action_bar'
  const shadow = el.attachShadow({ mode: 'closed' })

  // styling
  const sheet = new CSSStyleSheet()
  const opts = {}
  sheet.replaceSync(get_theme(opts))
  shadow.adoptedStyleSheets = [sheet]

  shadow.innerHTML = `
  <div class = 'action-bar-container'>
    <div class="action-bar-content">
        <button class='icon-button' id="Open Terminal">
            ${terminal()}
        </button>
        <div class='separator'></div>
        <button class='icon-button' id="Magic Wand">
            ${wand()}
        </button>
        <div class='separator'></div>
        <button class='icon-button' id="Help">
            ${help()}
        </button>
    </div>
  </div>
  `

  const separator_element = shadow.querySelector('.separator:last-of-type')
  shadow.querySelector('.action-bar-content').insertBefore(search_bar, separator_element)

  // to add a click event listener to the buttons:
  // const terminal_button = shadow.querySelector(`.icon-button[id="Open Terminal"]`)
  // terminal_button.addEventListener('click', () => { console.log('Terminal button clicked') })

  return el
}

function get_theme () { // opts
  return `
  .action-bar-container {
      display: flex;
      align-items: center;
      background-color: #212121;
      padding: 0.5rem;
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

},{"Action-Bar/search-bar":3,"icons":7}],3:[function(require,module,exports){
const { search, close } = require('icons')

module.exports = search_bar
function search_bar (path = 'Home > Documents > Current') {
  const el = document.createElement('div')
  el.className = 'search-bar-container'
  const shadow = el.attachShadow({ mode: 'closed' })

  const sheet = new CSSStyleSheet()
  const opts = {} // for get_theme(opts), opts = {theme:dark}
  sheet.replaceSync(get_theme(opts))
  shadow.adoptedStyleSheets = [sheet]

  shadow.innerHTML = `
    <div class="search-input-container">
      <div class="search-input-content">
        <div class="search-input-text">${path}</div>
        <input type="text" class="search-input" style="display: none;">
      </div>
      <button class="search-reset-button">${search()}</button>
    </div>
  `

  const input_container = shadow.querySelector('.search-input-container')
  const input_content = shadow.querySelector('.search-input-content')
  const text_span = shadow.querySelector('.search-input-text')
  const input_element = shadow.querySelector('.search-input')
  const reset_button = shadow.querySelector('.search-reset-button')
  let barmode = ''

  input_container.onclick = on_input_container_click
  input_element.onblur = on_input_element_blur
  reset_button.onclick = on_reset_click
  text_span.onclick = on_span_click

  return el

  function showInput () {
    input_content.replaceChildren(input_element)
    input_element.style.display = 'block'
    input_element.focus()
    reset_button.innerHTML = close()
    barmode = 'already'
  }

  function hideInput () {
    input_content.replaceChildren(text_span)
    input_element.style.display = 'none'
    reset_button.innerHTML = search()
  }

  function on_input_container_click (event) {
    // console.log('Focus Event:', event)
    if (barmode === 'already') {
      return
    }
    showInput()
  }

  function on_input_element_blur (event) {
    // console.log('Blur Event:', event)
    if (input_element.value === '') {
      hideInput()
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
    hideInput()
  }

  function handle_breadcrumb_click (event) {
    // console.log('Breadcrumb Event:', event)
    showInput()
    input_element.placeholder = '#night'
  }
}

function get_theme (opts) {
  return `
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

},{"icons":7}],4:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div')
      div.innerHTML = `<h1>Chat-History</h1>`
      div.id = 'chat_history'
    return div
  };
},{}],5:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div');
      div.innerHTML = `<h1>Graph-Explorer</h1>`;
      div.id = 'graph_explorer'
    return div;
  };
},{}],6:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div');
      div.innerHTML = `<h1>Tabbed-Editor</h1>`;
      div.id = 'tabbed_editor';
    return div;
  };
},{}],7:[function(require,module,exports){
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
  </svg>
`

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

},{}],8:[function(require,module,exports){
const components = require('..')

document.body.append(create_component_menu(components))

function create_component_menu (imports) {
  const style = get_theme()
  const root = document.createElement('div')
  root.className = 'root'
  root.innerHTML = `
    <style>
      ${style}
    </style>
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
    <div class="components-wrapper"></div>
  `

  const list = root.querySelector('.menu-list')
  const wrapper = root.querySelector('.components-wrapper')
  const menu = root.querySelector('.menu')
  const toggle_btn = root.querySelector('.menu-toggle-button')
  const unselect_btn = root.querySelector('.unselect-all-button')

  const entries = Object.entries(imports)
  const checkboxes = []
  const wrappers = []
  const names = []
  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  let initial_checked = []
  const selected_name = url_params.get('selected')
  let current_wrapper = null

  if (checked_param) {
    try {
      initial_checked = JSON.parse(checked_param)
      if (!Array.isArray(initial_checked)) initial_checked = []
    } catch (e) {
      console.error('Error parsing checked parameter:', e)
      initial_checked = []
    }
  }

  entries.forEach(create_list)

  unselect_btn.onclick = on_unselect
  toggle_btn.onclick = on_menu_toggle
  document.onclick = on_doc_click
  window.onload = scroll_to_selected
  
  return root

  function create_list ([name, factory], index) {
    const item = document.createElement('li')
    item.className = 'menu-item'

    const label = document.createElement('span')
    label.textContent = name
    item.append(label)

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    const checked = initial_checked.includes(index + 1) || initial_checked.length === 0
    checkbox.checked = checked
    item.append(checkbox)
    list.append(item)
    checkboxes.push(checkbox)
    names.push(name)

    const outer = document.createElement('div')
    outer.className = 'component-outer-wrapper'
    wrappers.push(outer)

    const name_div = document.createElement('div')
    name_div.className = 'component-name-label'
    name_div.textContent = name
    outer.append(name_div)

    const inner = document.createElement('div')
    inner.className = 'component-wrapper'
    inner.append(factory())
    outer.append(inner)
    wrapper.append(outer)

    outer.style.display = checked ? 'block' : 'none'

    checkbox.onchange = on_checkbox
    label.onclick = on_label

    function on_checkbox (e) {
      outer.style.display = e.target.checked ? 'block' : 'none'
      update_url(checkboxes)
    }
    
    function on_label () {
      inner.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        w.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
}

function get_theme () {
  return `
    body {
      background-color: #f0f0f0;
      margin: 0;
      padding: 0;
    }

    .root {
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
      background-color: #f5f5f5;
      padding: 0;
      margin: 0;
    }

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
    }
  `
}
},{"..":1}]},{},[8]);

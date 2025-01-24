(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.action_bar = require('Action-Bar')
module.exports.chat_history = require('Chat-History')
module.exports.graph_explorer = require('Graph-Explorer')
module.exports.tabbed_editor = require('Tabbed-Editor')
// module.exports.search_bar = require('Action-Bar/search-bar')

},{"Action-Bar":2,"Chat-History":4,"Graph-Explorer":5,"Tabbed-Editor":6}],2:[function(require,module,exports){
const { terminal, wand, help } = require('icons')
const SearchBar = require('Action-Bar/search-bar')

function action_bar () {
  style = get_theme()
  const search_bar_element = SearchBar({ default_path: 'Playproject.github.io > themes > default > search-bar.css' })
  const container = 'action-bar-container'
  const icon_button_class = 'icon-button'
  const separator_class = 'separator'

  const el = document.createElement('div')
  el.className = container
  el.id = 'action_bar'
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
  <div class = '${container}'>
    <style>${style}</style>
    <div class="action-bar-content">
        <button class="${icon_button_class}" id="Open Terminal">
            ${terminal()}
        </button>
        <div class="${separator_class}"></div>
        <button class="${icon_button_class}" id="Magic Wand">
            ${wand()}
        </button>
        <div class="${separator_class}"></div>
        <button class="${icon_button_class}" id="Help">
            ${help()}
        </button>
    </div>
  </div>
  `
  const separator_element = shadow.querySelector(`.${separator_class}:last-of-type`)
  shadow.querySelector('.action-bar-content').insertBefore(search_bar_element, separator_element)
  
  // to add a click event listener to the buttons:
  // const terminal_button = shadow.querySelector(`.${icon_button_class}[id="Open Terminal"]`)
  // terminal_button.addEventListener('click', () => { console.log('Terminal button clicked') })

  return el
}

module.exports = action_bar

  function get_theme () {
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
function search_bar ({ default_path = 'Home > Documents > Current' } = {}) {
  const container = 'search-bar-container'
  const search_input_container_class = 'search-input-container'
  const search_input_content_class = 'search-input-content'
  const search_input_text_class = 'search-input-text'
  const search_input_class = 'search-input'
  const search_reset_button_class = 'search-reset-button'
  // const opts = {theme: 'dark'}

  const el = document.createElement('div')
  el.className = container
  const shadow = el.attachShadow({ mode: 'closed' })
  const input_container_html = `
    <div class="${search_input_container_class}">
      <div class="${search_input_content_class}">
        <div class="${search_input_text_class}">${default_path}</div>
        <input type="text" class="${search_input_class}" style="display: none;">
      </div>
      <button class="${search_reset_button_class}">${search()}</button>
    </div>
    <style></style>
  `

  shadow.innerHTML = input_container_html
  const style = shadow.querySelector('style')
  style.textContent = get_theme() // get_theme(opts)

  const input_container = shadow.querySelector(`.${search_input_container_class}`)
  const input_content = shadow.querySelector(`.${search_input_content_class}`)
  const text_span = shadow.querySelector(`.${search_input_text_class}`)
  const input_element = shadow.querySelector(`.${search_input_class}`)
  const reset_button = shadow.querySelector(`.${search_reset_button_class}`)

  input_container.addEventListener('click', handle_action_input_focus())

  input_element.addEventListener('blur', handle_action_input_blur(Event))

  reset_button.addEventListener('click', (event) => {
    event.stopPropagation()
    handle_reset()
  })

  text_span.addEventListener('click', (event) => {
    event.stopPropagation()
    handle_breadcrumb_click()
  })

  return el

  function handle_action_input_focus (event) {
    input_content.innerHTML = ''
    input_content.appendChild(input_element)
    input_element.style.display = 'block'
    input_element.focus()
    reset_button.innerHTML = close()
    // reset_button.appendChild(close())
    }
  function handle_action_input_blur (event) {
    if (input_element.value === '') {
      input_content.innerHTML = ''
      input_content.appendChild(text_span)
      input_element.style.display = 'none'
      reset_button.innerHTML = search()
      // reset_button.appendChild(search())
    }
  }
  function handle_reset (event) {
    input_element.value = ''
    input_content.innerHTML = ''
    input_content.appendChild(text_span)
    input_element.style.display = 'none'
    reset_button.innerHTML = search()
    // reset_button.appendChild(search())
  }
  function handle_breadcrumb_click (event) {
    input_content.innerHTML = ''
    input_content.appendChild(input_element)
    input_element.style.display = 'block'
    input_element.placeholder = '#night'
    input_element.focus()
    reset_button.innerHTML = close()
    // reset_button.appendChild(close())
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

document.body.append(createComponentMenu(components))

function createComponentMenu (imports) {
  const style = get_theme()
  const root_element = document.createElement('div')
  root_element.className = 'root'
  root_element.innerHTML = `
    <style>
      ${style}
    </style>
    <div class="menu">
      <ul class="menu-list"></ul>
    </div>
    <div class="component-container"></div>
  `

  const menu_list = root_element.querySelector('.menu-list')
  const component_container = root_element.querySelector('.component-container')

  const factories = Object.entries(imports)
  const checkbox_elements = []
  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  let initially_checked_indices = []

  if (checked_param) {
    try {
      initially_checked_indices = JSON.parse(checked_param)
      if (!Array.isArray(initially_checked_indices)) {
        initially_checked_indices = [] // If parsing fails or not array, default to empty
      }
    } catch (error) {
      console.error('Error parsing checked parameter:', error)
      initially_checked_indices = [] // If parsing fails, default to empty
    }
  }

  factories.forEach(([name, factory], index) => {
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'

    const label_element = document.createElement('span')
    label_element.textContent = name
    menu_item.append(label_element)

    const checkbox_element = document.createElement('input')
    checkbox_element.type = 'checkbox'
    const is_initially_checked = initially_checked_indices.includes(index + 1) || initially_checked_indices.length === 0 // if no checked param, default to all checked
    checkbox_element.checked = is_initially_checked
    menu_item.append(checkbox_element)
    menu_list.append(menu_item)
    checkbox_elements.push(checkbox_element)

    const component_wrapper = document.createElement('div')
    component_wrapper.className = 'component-wrapper'
    component_wrapper.append(factory())
    component_container.append(component_wrapper)
    component_wrapper.style.display = is_initially_checked ? 'block' : 'none' // Set initial display

    checkbox_element.addEventListener('change', (event) => {
      component_wrapper.style.display = event.target.checked ? 'block' : 'none'
      updateURL(checkbox_elements)
    })
  })

  return root_element

  function updateURL (checkboxes) {
    const checked_indices = checkboxes.reduce((acc, checkbox, index) => {
      if (checkbox.checked) {
        acc.push(index + 1)
      }
      return acc
    }, [])
  
    const params = new URLSearchParams(window.location.search)
    if (checked_indices.length > 0 && checked_indices.length < checkboxes.length) { // Only add param if not all are checked or none are checked. If all are checked, its default state so no need to add param
      params.set('checked', `[${checked_indices.join(',')}]`)
    } else {
      params.delete('checked') // Remove param if all are checked (default) or none are checked (empty param is cleaner)
    }
    const new_url = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(null, '', new_url)
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
      font-family: sans-serif;
      background-color:rgb(255, 248, 190);
      padding: 0;
      margin: 0;
    }

    .menu {
      width: 200px;
      background-color: #f0f0f0;
      padding: 10px;
    }

    .menu-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #ccc;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .component-container {
      flex-grow: 1;
      padding: 20px;
    }

    .component-wrapper {
      margin-bottom: 20px;
      padding: 15px;
      border: 2px solid #1d1d1d;
      border-radius: 0px;
      background-color:#f0f0f0;
    }

    .component-wrapper:last-child {
      margin-bottom: 0;
    }
  `
}
},{"..":1}]},{},[8]);

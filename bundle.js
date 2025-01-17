(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.action_bar = require('Action-Bar')
module.exports.chat_history = require('Chat-History')
module.exports.graph_explorer = require('Graph-Explorer')
module.exports.tabbed_editor = require('Tabbed-Editor')
module.exports.style = () => {
    const style = document.createElement('style')
    style.textContent = `
  :target {
    background-color: lightblue; /* Highlight target element */
  }

  a.selected {
    font-weight: bold;
    color: red; /* Highlight active link */
  }
  `
    return style
}
},{"Action-Bar":3,"Chat-History":5,"Graph-Explorer":6,"Tabbed-Editor":7}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
const { terminal, wand, help } = require('Action-Bar/icons')
const SearchBar = require('Action-Bar/search-bar')

function action_bar () {
  const action_bar_container_class = 'action-bar-container'
  const icon_button_class = 'icon-button'
  const separator_class = 'separator'

  const action_bar = document.createElement('div')
  action_bar.className = action_bar_container_class
  action_bar.id = 'action_bar'
  const shadow = action_bar.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
  <div class = '${action_bar_container_class}'>
    <style>${styles}</style>
    <div class="action-bar-content">
        <button class="${icon_button_class}" aria-label="Open Terminal">
            ${terminal()}
        </button>
        <div class="${separator_class}"></div>
        <button class="${icon_button_class}" aria-label="Magic Wand">
            ${wand()}
        </button>
        <div class="${separator_class}"></div>
        <button class="${icon_button_class}" aria-label="Help">
            ${help()}
        </button>
    </div>
  </div>
  `

  const terminal_button = shadow.querySelector(`.${icon_button_class}[aria-label="Open Terminal"]`)
  terminal_button.addEventListener('click', () => { console.log('Terminal button clicked') })

  const search_bar_element = SearchBar()
  const separator_element = shadow.querySelector(`.${separator_class}:last-of-type`)
  shadow.querySelector('.action-bar-content').insertBefore(search_bar_element, separator_element)

  return action_bar
}

module.exports = action_bar

const styles = `
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
`
},{"Action-Bar/icons":2,"Action-Bar/search-bar":4}],4:[function(require,module,exports){
const { search, close } = require('./icons')

function search_bar ({ default_path = 'Home > Documents > Current' } = {}) {
  const search_bar_container_class = 'search-bar-container'
  const search_input_container_class = 'search-input-container'
  const search_input_content_class = 'search-input-content'
  const search_input_text_class = 'search-input-text'
  const search_input_class = 'search-input'
  const search_reset_button_class = 'search-reset-button'

  const element = document.createElement('div')
  element.className = search_bar_container_class

  const shadow = element.attachShadow({ mode: 'closed' })

  const css = document.createElement('style')
  css.textContent = styles
  shadow.appendChild(css)

  const input_container_html = `
    <div class="${search_input_container_class}">
      <div class="${search_input_content_class}">
        <div class="${search_input_text_class}">${default_path}</div>
        <input type="text" class="${search_input_class}" style="display: none;">
      </div>
      <button class="${search_reset_button_class}">${search()}</button>
    </div>
  `
  // using += so that the styles are not overwritten
  shadow.innerHTML += input_container_html

  const input_container = shadow.querySelector(`.${search_input_container_class}`)
  const input_content = shadow.querySelector(`.${search_input_content_class}`)
  const text_span = shadow.querySelector(`.${search_input_text_class}`)
  const input_element = shadow.querySelector(`.${search_input_class}`)
  const reset_button = shadow.querySelector(`.${search_reset_button_class}`)

  const handle_action_input_focus = () => {
    input_content.innerHTML = ''
    input_content.appendChild(input_element)
    input_element.style.display = 'block'
    input_element.focus()
    reset_button.innerHTML = close()
    // reset_button.appendChild(close())
  }

  const handle_action_input_blur = () => {
    if (input_element.value === '') {
      input_content.innerHTML = ''
      input_content.appendChild(text_span)
      input_element.style.display = 'none'
      reset_button.innerHTML = search()
      // reset_button.appendChild(search())
    }
  }

  const handle_reset = () => {
    input_element.value = ''
    input_content.innerHTML = ''
    input_content.appendChild(text_span)
    input_element.style.display = 'none'
    reset_button.innerHTML = search()
    // reset_button.appendChild(search())
  }

  const handle_breadcrumb_click = () => {
    input_content.innerHTML = ''
    input_content.appendChild(input_element)
    input_element.style.display = 'block'
    input_element.placeholder = '#night'
    input_element.focus()
    reset_button.innerHTML = close()
    // reset_button.appendChild(close())
  }

  input_container.addEventListener('click', () => {
    handle_action_input_focus()
  })

  input_element.addEventListener('blur', () => {
    handle_action_input_blur()
  })

  reset_button.addEventListener('click', (event) => {
    event.stopPropagation()
    handle_reset()
  })

  text_span.addEventListener('click', (event) => {
    event.stopPropagation()
    handle_breadcrumb_click()
  })

  return element
}

module.exports = search_bar

const styles = `
.search-bar-container {
  flex: 1;
  position: relative;
}

.search-input-container {
  height: 2rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #303030;
  border-radius: 0.375rem;
  cursor: text;
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
},{"./icons":2}],5:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div')
      div.innerHTML = `<h1>Chat-History</h1>`
      div.id = 'chat_history'
    return div
  };
},{}],6:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div');
      div.innerHTML = `<h1>Graph-Explorer</h1>`;
      div.id = 'graph_explorer'
    return div;
  };
},{}],7:[function(require,module,exports){
module.exports = () => {
    const div = document.createElement('div');
      div.innerHTML = `<h1>Tabbed-Editor</h1>`;
      div.id = 'tabbed_editor';
    return div;
  };
},{}],8:[function(require,module,exports){
const components = require('..')

const factories = Object.keys(components).map((name) => [
  name,
  components[name]
])
document.createElement('div').className = 'root'
document.body.append(
  ...factories.map(([name, fn]) => {
    const container = document.createElement('div')
    container.append(fn())
    return container
  })
)

},{"..":1}]},{},[8]);

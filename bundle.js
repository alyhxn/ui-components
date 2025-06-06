(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = action_bar
const quick_actions = require('quick_actions')
async function action_bar(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: style_inject,
    icons: iconject
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  shadow.innerHTML = `
  <div class="action-bar-container">
    <div class="command-history">
      <button class="icon-btn"></button>
    </div>
    <div class="quick-actions">
      <quick-actions></quick-actions>
    </div>
  </div>`

  const history_icon = shadow.querySelector('.icon-btn')
  const quick_placeholder = shadow.querySelector('quick-actions')
  let console_icon = {}
  const subs = await sdb.watch(onbatch)
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage }, quick_actions: null }
  
  console.log(subs)
  history_icon.innerHTML = console_icon
  history_icon.onclick = () => {
    console.log('calling:', 'Command History')
    _.up.send({ type: 'console_history_toggle', data: {} })
  }
  const element = await quick_actions(subs[0], quick_actions_protocol)
  element.classList.add('replaced-quick-actions')
  quick_placeholder.replaceWith(element)
  return el

  // ---------
  // PROTOCOLS  
  // ---------
  function quick_actions_protocol (send) {
    _.quick_actions = { send, on }
    on.id = id
    on.name = 'action_bar'
    return on
    function on ({ type, data }) { 
      console.log('[quick_actions->action_bar]', type, data)
      if (type === 'text_bar_clicked') {
        console.log('quick action text bar clicked')
      }
      // Forward quick_actions messages up to taskbar
      _.up.send({ type: `quick_actions:${type}`, data })
    }
  }
  
  function onmessage ({ type, data }) {
    console.log(`[taskbar->action_bar]`, type, data)
    
    // Handle console history toggle
    if (type === 'console_history_toggle') {
      // Console history is handled by space component, just acknowledge
      return
    }
    
    // Route quick_actions messages
    if (type.startsWith('quick_actions:')) {
      const action_type = type.replace('quick_actions:', '')
      _.quick_actions.send({ type: action_type, data })
    }
    
    // Route quick_actions_callback messages
    if (type.startsWith('quick_actions_callback:')) {
      const action_type = type.replace('quick_actions_callback:', '')
      _.quick_actions.send({ type: action_type, data })
    }
  }

  function onbatch (batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function style_inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function iconject(data) {
    console_icon = data[0]
  }
}

function fallback_module() {
  return {
    api: fallback_instance,
    _: {
      'quick_actions': {
        $: ''
      }
    }
  }
  function fallback_instance() {
    return {
      _: {
        'quick_actions': {
          0: '',
          mapping: {
            'style': 'style',
            'icons': 'icons',
            'actions': 'actions',
            'hardcons': 'hardcons'
          }
        }
      },
      drive: {
        'icons/': {
          'console.svg': {
            '$ref': 'console.svg'
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .action-bar-container {
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                background: #131315;
                padding: 8px;
                gap: 12px;
              }
              .command-history {
                display: flex;
                align-items: center;
              }
              .quick-actions {
                display: flex;
                flex: auto;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                min-width: 300px;
              }
              .replaced-quick-actions {
                display: flex;
                flex: auto;
              }
              .icon-btn {
                display: flex;
                min-width: 32px;
                height: 32px;
                border: none;
                background: transparent;
                cursor: pointer;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                padding: 6px;
                border-radius: 6px;
                color: #a6a6a6;
              }
              .icon-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              svg {
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
}).call(this)}).call(this,"/src/node_modules/action_bar/index.js")
},{"STATE":1,"quick_actions":6}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = actions

async function actions(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  
  const on = {
    style: inject_style,
    actions: onactions,
    icons: iconject,
    hardcons: onhardcons
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  shadow.innerHTML = `
  <div class="actions-container">
    <div class="actions-menu"></div>
  </div>`

  const actions_menu = shadow.querySelector('.actions-menu')
  
  let init = false
  let actions = []
  let icons = {}
  let hardcons = {}
  let is_visible = false

  const subs = await sdb.watch(onbatch)
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage } }
  const api = { toggle, show, hide, filter, set_selected_action }

  if(protocol.toString() != (() => console.log('action selected')).toString()) el.style.display = 'none'

  return el

  function onmessage ({ type, data }) {
    console.log(`[space->actions]`, type, data)
    const fn = api[type]
    if (fn) return fn({ type, data })
    throw new Error('invalid msg', { cause: { type, data } })
  }
  
  // ---
  // API
  // ---
  function toggle (msg) {
    is_visible = !is_visible
    el.style.display = is_visible ? 'block' : 'none'
  }
  
  function show (msg) {
    is_visible = true
    el.style.display = 'block'
  }
  
  function hide (msg) {
    is_visible = false
    el.style.display = 'none'
  }
  
  function filter (msg) {
    filter_actions_by_search(msg.data)
  }
  
  function set_selected_action (msg) {
    // This will be sent back to quick_actions via the routing system
    _.up.send({ type: 'quick_actions_callback:set_selected_action', data: msg.data })
  }

  function onbatch(batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
    if (!init) {
      create_actions_menu()
      init = true
    }
  }

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function iconject(data) {
    icons = data
  }

  function onhardcons(data) {
    hardcons = {
      pin: data[0],
      unpin: data[1],
      default: data[2],
      undefault: data[3]
    }
  }

  function onactions(data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    actions = vars
  }

  function create_actions_menu() {
    actions_menu.innerHTML = ''
    actions.forEach(create_action_item)
  }

  function create_action_item(action_data, index) {
    const action_item = document.createElement('div')
    action_item.classList.add('action-item')
    
    const icon = icons[index]
    
    action_item.innerHTML = `
      <div class="action-icon">${icon}</div>
      <div class="action-name">${action_data.action}</div>
      <div class="action-pin">${action_data.pin ? hardcons.pin : hardcons.unpin}</div>
      <div class="action-default">${action_data.default ? hardcons.default : hardcons.undefault}</div>
      
    `
    
    action_item.onclick = () => {
      _.up.send({ type: 'action_selected', data: action_data })
      set_selected_action({ data: action_data })
      hide()
    }
    
    actions_menu.appendChild(action_item)
  }

  function filter_actions_by_search(search_term) {
    const items = shadow.querySelectorAll('.action-item')
    items.forEach(item => {
      const action_name = item.dataset.action.toLowerCase()
      const matches = action_name.includes(search_term.toLowerCase())
      item.style.display = matches ? 'flex' : 'none'
    })
  }
}

function fallback_module() {
  return {
    api: fallback_instance
  }

  function fallback_instance() {
    return {
      drive: {
        'actions/': {
          'commands.json': {
            raw: JSON.stringify([
              {
                action: 'New File',
                pinned: true,
                default: true,
                icon: 'file'
              },
              {
                action: 'Open File',
                pinned: false,
                default: true,
                icon: 'folder'
              },
              {
                action: 'Save File',
                pinned: true,
                default: false,
                icon: 'save'
              },
              {
                action: 'Settings',
                pinned: false,
                default: true,
                icon: 'gear'
              },
              {
                action: 'Help',
                pinned: false,
                default: false,
                icon: 'help'
              },
              {
                action: 'Terminal',
                pinned: true,
                default: true,
                icon: 'terminal'
              },
              {
                action: 'Search',
                pinned: false,
                default: true,
                icon: 'search'
              }
            ])
          }
        },
        'icons/': {
          'file.svg': {
            '$ref': 'icon.svg'
          },
          'folder.svg': {
            '$ref': 'icon.svg'
          },
          'save.svg': {
            '$ref': 'icon.svg'
          },
          'gear.svg': {
            '$ref': 'icon.svg'
          },
          'help.svg': {
            '$ref': 'icon.svg'
          },
          'terminal.svg': {
            '$ref': 'icon.svg'
          },
          'search.svg': {
            '$ref': 'icon.svg'
          }
        },
        'hardcons/': {
          'pin.svg': {
            '$ref': 'pin.svg'
          },
          'unpin.svg': {
            '$ref': 'unpin.svg'
          },
          'default.svg': {
            '$ref': 'default.svg'
          },
          'undefault.svg': {
            '$ref': 'undefault.svg'
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .actions-container {
                position: relative;
                top: 0;
                left: 0;
                right: 0;
                background: #202124;
                border: 1px solid #3c3c3c;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                z-index: 1;
                max-height: 400px;
                overflow-y: auto;
                color: #e8eaed;
              }
              
              .actions-menu {
                padding: 8px 0;
              }
              
              .action-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #3c3c3c;
                transition: background-color 0.2s ease;
              }
              
              .action-item:hover {
                background-color: #2d2f31;
              }
              
              .action-item:last-child {
                border-bottom: none;
              }
              
              .action-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #a6a6a6;
              }
              
              .action-name {
                flex: 1;
                font-size: 14px;
                color: #e8eaed;
              }
              
              .action-pin .action-default{
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                font-size: 12px;
                opacity: 0.7;
                color: #a6a6a6;
              }
              
              svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/actions/index.js")
},{"STATE":1}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = console_history

async function console_history (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject_style,
    commands: oncommands,
    icons: iconject
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="console-history-container">
    <div class="console-menu">
      <console-commands></console-commands>
    </div>
  </div>`

  const commands_placeholder = shadow.querySelector('console-commands')
  
  let init = false
  let commands = []
  let dricons = []
  let is_visible = false

  const subs = await sdb.watch(onbatch)
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage } }
  const api = { toggle }

  if(protocol.toString() != (() => console.log('console history toggle')).toString()) el.style.display = 'none'

  return el

  function onmessage ({ type, data }) {
    console.log(`[space->console_history]`, type, data)
    const fn = api[type]
    if (fn) return fn({ type, data })
    throw new Error('invalid msg', { cause: { type, data } })
  }
  
  // ---
  // API
  // ---
  function toggle (msg) {
    toggle_visibility()
  }

  function toggle_visibility () {
    is_visible = !is_visible
    el.style.display = is_visible ? 'block' : 'none'
  }

  function create_command_item (command_data) {
    const command_el = document.createElement('div')
    command_el.className = 'command-item'

    const icon_html = dricons[command_data.icon_type] || ''
    const linked_icon_html = command_data.linked.is ? (dricons[command_data.linked.icon_type] || '') : ''

    let action_html = ''
    action_html += command_data.can_restore ? '<div class="action-icon">' + (dricons.restore || '') + '</div>' : ''
    action_html += command_data.can_delete ? '<div class="action-icon">' + (dricons.delete || '') + '</div>' : ''
    action_html += command_data.action ? '<div class="action-text">' + command_data.action + '</div>' : ''

    command_el.innerHTML = `
    <div class="command-content">
    <div class="command-icon">${icon_html}</div>
    <div class="command-info">
      <div class="command-path">${command_data.name_path}</div>
    </div>
    ${command_data.linked.is
      ? `<div class="linked-info">
          <span class="command-separator">---&gt;</span>
          <div class="linked-icon">${linked_icon_html}</div>
          <div class="linked-name">${command_data.linked.name}</div>
        </div>`
      : ''}
      ${action_html
        ? `<div class="command-actions">${action_html}</div>`
        : ''}
        <div class="command-name">${command_data.command}</div>
      </div>`

    command_el.onclick = function () {
      console.log('Command clicked:', command_data.command)
      _.up.send({ type: 'command_clicked', data: command_data })
    }

    return command_el
  }
  function render_commands () {
      const commands_container = document.createElement('div')
      commands_container.className = 'commands-list'
      
      commands.forEach((command, index) => {
        const command_item = create_command_item(command, index)
        commands_container.appendChild(command_item)
      })
      
      commands_placeholder.replaceWith(commands_container)
      init = true
  }
  function onbatch (batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
    
    if (!init && commands.length > 0) {
      render_commands()
    }
  }

  function fail (data, type) { 
    throw new Error('invalid message', { cause: { data, type } }) 
  }

  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function oncommands (data) {
    const commands_data = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    commands = commands_data
  }

  function iconject (data) {
    dricons = {
      file: data[0] || '',
      bulb: data[1] || '',
      restore: data[2] || '',
      delete: data[3] || '' 
    }
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance () {
    return {
      drive: {
        'commands/': {
          'list.json': {
            '$ref': 'commands.json'
          }
        },
        'icons/': {
          'file.svg': {
            raw: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 1H3.5C3.10218 1 2.72064 1.15804 2.43934 1.43934C2.15804 1.72064 2 2.10218 2 2.5V13.5C2 13.8978 2.15804 14.2794 2.43934 14.5607C2.72064 14.8420 3.10218 15 3.5 15H12.5C12.8978 15 13.2794 14.8420 13.5607 14.5607C13.8420 14.2794 14 13.8978 14 13.5V5.5L9.5 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 1V5.5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
          },
          'bulb.svg': {
            raw: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1C6.4087 1 4.88258 1.63214 3.75736 2.75736C2.63214 3.88258 2 5.4087 2 7C2 8.5913 2.63214 10.1174 3.75736 11.2426C4.88258 12.3679 6.4087 13 8 13C9.5913 13 11.1174 12.3679 12.2426 11.2426C13.3679 10.1174 14 8.5913 14 7C14 5.4087 13.3679 3.88258 12.2426 2.75736C11.1174 1.63214 9.5913 1 8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6.5 14H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
          },
          'restore.svg': {
            raw: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
            </svg>`
          },
          'delete.svg': {
            raw: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92H4.885a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.528ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Zm2.522.47a.5.5 0 0 1 .528.47l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .47-.528Z"/>
            </svg>`
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .console-history-container {
                position: relative;
                width: 100%; /* Or a specific width based on images */
                background: #202124;
                border: 1px solid #3c3c3c;
                Set box-sizing property to border-box:
                box-sizing: border-box;
                -moz-box-sizing: border-box;
                -webkit-box-sizing: border-box;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                z-index: 1;
                max-height: 400px;
                overflow-y: auto;
                color: #e8eaed;
              }

              .console-menu {
                padding: 0px;
              }

              .commands-list {
                display: flex;
                flex-direction: column;
                gap: 0px;
              }

              .command-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                background: transparent;
                border-bottom: 1px solid #3c3c3c;
                cursor: pointer;
                transition: background-color 0.2s ease;
              }

              .command-item:last-child {
                border-bottom: none;
              }

              .command-item:hover {
                background: #282a2d;
              }

              .command-content {
                display: flex;
                align-items: center;
                width: 100%;
                gap: 10px; /* Adjusted gap */
              }

              .command-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #969ba1;
              }

              .command-icon svg {
                width: 16px;
                height: 16px;
              }

              .command-info {
                display: flex; /* Use flex to align name and path */
                align-items: center; /* Vertically align items if they wrap */
                gap: 8px; /* Gap between name and path */
                min-width: 0; /* Prevent overflow issues with flex items */
              }

              .command-name {
                font-size: 13px;
                font-weight: 400;
                color: #e8eaed;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .command-path {
                font-size: 13px;
                color: #969ba1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              
              .command-separator {
                color: #969ba1;
                margin: 0 4px;
                font-size: 13px;
              }

              .linked-info {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-grow: 1; /* Allow info to take available space */

              }

              .linked-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                color: #fbbc04; 
              }

              .linked-icon svg {
                width: 14px;
                height: 14px;
              }

              .linked-name {
                font-size: 13px;
                color: #fbbc04;
                font-weight: 400;
                white-space: nowrap;
              }

              .command-actions {
                display: flex;
                align-items: center;
                gap: 10px; /* Adjusted gap */
                margin-left: auto; /* Pushes actions to the right */
              }

              .action-text {
                font-size: 13px;
                color: #969ba1;
                white-space: nowrap;
              }

              .action-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #969ba1;
                cursor: pointer;
              }

              .action-icon:hover {
                color: #e8eaed;
              }

              .action-icon svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/console_history/index.js")
},{"STATE":1}],5:[function(require,module,exports){
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
},{"STATE":1}],6:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = quick_actions

async function quick_actions(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  
  const on = {
    style: inject,
    icons: iconject,
    hardcons: onhardcons,
    actions: onactions
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  
  shadow.innerHTML = `
    <div class="quick-actions-container">
      <div class="default-actions"></div>
      <div class="text-bar" role="button"></div>
      <div class="input-wrapper" style="display: none;">
        <div class="input-display">
          <span class="slash-prefix">/</span>
          <span class="command-text"></span>
          <input class="input-field" type="text" placeholder="Type to search actions...">
        </div>
        <button class="submit-btn" style="display: none;"></button>
        <button class="close-btn"></button>
      </div>
    </div>
  `
  const default_actions = shadow.querySelector('.default-actions')
  const text_bar = shadow.querySelector('.text-bar')
  const input_wrapper = shadow.querySelector('.input-wrapper')
  const slash_prefix = shadow.querySelector('.slash-prefix')
  const command_text = shadow.querySelector('.command-text')
  const input_field = shadow.querySelector('.input-field')
  const submit_btn = shadow.querySelector('.submit-btn')
  const close_btn = shadow.querySelector('.close-btn')

  let init = false
  let icons = {}
  let hardcons = {}
  let defaults = []
  let is_input_active = false
  let selected_action = null
  
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage } }

  text_bar.onclick = activate_input_field
  close_btn.onclick = deactivate_input_field
  
  submit_btn.onclick = () => {
    if (selected_action) {
      console.log('Selected action submitted:', selected_action)
      _.up.send({ type: 'action_submitted', data: selected_action })
    }
  }
  
  input_field.oninput = (e) => {
    _.up.send({ type: 'filter_actions', data: e.target.value })
  }

  const subs = await sdb.watch(onbatch)
  submit_btn.innerHTML = hardcons.submit
  close_btn.innerHTML = hardcons.cross
  return el

  function onmessage ({ type, data }) {
    console.log(`[action_bar->quick_actions]`, type, data)
    
    if (type === 'set_selected_action') {
      selected_action = data
      update_input_display()
    } else if (type === 'show_actions') {
      activate_input_field()
    } else if (type === 'hide_actions') {
      deactivate_input_field()
    }
  }

  function activate_input_field() {
    is_input_active = true
    
    default_actions.style.display = 'none'
    text_bar.style.display = 'none'
    
    input_wrapper.style.display = 'flex'
    input_field.focus()
    
    _.up.send({ type: 'show_actions', data: {} })
    _.up.send({ type: 'text_bar_clicked', data: {} })
  }

  function deactivate_input_field() {
    is_input_active = false
    
    default_actions.style.display = 'flex'
    text_bar.style.display = 'flex'
    
    input_wrapper.style.display = 'none'
    
    input_field.value = ''
    selected_action = null
    update_input_display()
    
    _.up.send({ type: 'hide_actions', data: {} })
  }

  function update_input_display() {
    if (selected_action) {
      slash_prefix.style.display = 'inline'
      command_text.style.display = 'inline'
      command_text.textContent = `"${selected_action.action}"`
      input_field.style.display = 'none'
      submit_btn.style.display = 'flex'
    } else {
      slash_prefix.style.display = 'none'
      command_text.style.display = 'none'
      input_field.style.display = 'block'
      submit_btn.style.display = 'none'
      input_field.placeholder = 'Type to search actions...'
    }
  }

  function onbatch (batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
    if(!init) {
      create_default_actions(defaults)
      init = true
    } else {
      //TODO: update actions
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  function onhardcons(data) {
    hardcons = {
      submit: data[0],
      cross: data[1]
    }
  }
  function iconject(data) {
    icons = data
  }

  function onactions(data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    defaults = vars
  }

  function create_default_actions (actions) {
    default_actions.innerHTML = ''
    actions.forEach(action => {
      const btn = document.createElement('div')
      btn.classList.add('action-btn')
      btn.innerHTML = icons[action.icon]
      default_actions.appendChild(btn)
    })
    
    if (icons['close'] || icons['5']) {
      close_btn.innerHTML = icons['close'] || icons['4']
    } else {
      close_btn.innerHTML = '✕'
    }
  }
}

function fallback_module() {
  return {
    api: fallback_instance
  }

  function fallback_instance() {
    return {
      drive: {
        'icons/': {
          '0.svg': {
            '$ref': 'action1.svg'
          },
          '1.svg': {
            '$ref': 'action2.svg'
          },
          '2.svg': {
            '$ref': 'action1.svg'
          },
          '3.svg': {
            '$ref': 'action2.svg'
          },
          '4.svg': {
            '$ref': 'action1.svg'
          }
        },
        'hardcons/': {
          'submit.svg': {
            '$ref': 'submit.svg'
          },
          'close.svg': {
            '$ref': 'cross.svg'
          }
        },
        'actions/': {
          'default.json': {
            raw: JSON.stringify([
              {
                name: 'New',
                icon: '0',
              },
              {
                name: 'Settings',
                icon: '1',
              },
              {
                name: 'Help',
                icon: '2',
              },
              {
                name: 'About',
                icon: '3',
              },
              {
                name: 'Exit',
                icon: '4',
              }
            ])
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .quick-actions-container {
                display: flex;
                flex: auto;
                flex-direction: row;
                align-items: center;
                background: #191919;
                border-radius: 20px;
                padding: 4px;
                gap: 8px;
                min-width: 200px;
              }
              .default-actions {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 4px;
                padding: 0 4px;
              }
              .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: #a6a6a6;
              }
              .action-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              .text-bar {
                flex: 1;
                min-height: 32px;
                border-radius: 16px;
                background: #131315;
                cursor: pointer;
                user-select: none;
              }
              .text-bar:hover {
                background: #1a1a1c;
              }
              .input-wrapper {
                display: flex;
                flex: 1;
                align-items: center;
                background: #131315;
                border-radius: 16px;
                border: 1px solid #3c3c3c;
                padding-right: 4px;
              }
              .input-wrapper:focus-within {
                border-color: #4285f4;
                background: #1a1a1c;
              }
              .input-display {
                display: flex;
                flex: 1;
                align-items: center;
                padding: 0 12px;
                min-height: 32px;
              }
              .slash-prefix {
                color: #a6a6a6;
                font-size: 14px;
                margin-right: 4px;
                display: none;
              }
              .command-text {
                color: #e8eaed;
                font-size: 14px;
                background: #2d2d2d;
                border: 1px solid #4285f4;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                display: none;
              }
              .input-field {
                flex: 1;
                min-height: 32px;
                background: transparent;
                border: none;
                color: #e8eaed;
                padding: 0 12px;
                font-size: 14px;
                outline: none;
              }
              .input-field::placeholder {
                color: #a6a6a6;
              }
              .submit-btn {
                display: none;
                align-items: center;
                justify-content: center;
                background: #ffffff00;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: white;
                min-width: 32px;
                height: 32px;
                margin-right: 4px;
                font-size: 12px;
              }
              .submit-btn:hover {
                background: #ffffff00;
              }
              .close-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: #a6a6a6;
                min-width: 32px;
                height: 32px;
              }
              .close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/quick_actions/index.js")
},{"STATE":1}],7:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const console_history = require('console_history')
const actions = require('actions')

module.exports = component

async function component (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="space">
    <actions-placeholder></actions-placeholder>
    <console-history-placeholder></console-history-placeholder>
  </div>`

  const actions_placeholder = shadow.querySelector('actions-placeholder')
  const console_placeholder = shadow.querySelector('console-history-placeholder')
  let console_history_el = null
  let actions_el = null

  const subs = await sdb.watch(onbatch)
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage }, actions: null, console_history: null }
  const api = { toggle_console_history, show_actions, hide_actions, toggle_actions, filter_actions }

  actions_el = await actions(subs[1], actions_protocol)
  actions_el.classList.add('actions')
  actions_placeholder.replaceWith(actions_el)
  
  console_history_el = await console_history(subs[0], console_history_protocol)
  console_history_el.classList.add('console-history')
  console_placeholder.replaceWith(console_history_el)
  return el

  // ---------
  // PROTOCOLS
  // ---------
  function console_history_protocol (send) {
    _.console_history = { send, on }
    on.id = id
    on.name = 'space'
    return on
    function on ({ type, data }) { 
      console.log('[console_history->space]', type, data)
      if (type === 'toggle') {
        _.up.send({ type: 'toggle_console_history', data })
      }
    }
  }
  
  function actions_protocol (send) {
    _.actions = { send, on }
    on.id = id
    on.name = 'space'
    return on
    function on ({ type, data }) { 
      console.log('[actions->space]', type, data)
      if (type === 'action_selected') {
        _.up.send({ type: 'actions:action_selected', data })
      }
      if (type.startsWith('quick_actions_callback:')) {
        _.up.send({ type, data })
      }
    }
  }
  
  function onmessage ({ type, data }) {
    console.log(`[theme_widget->space]`, type, data)
    const fn = api[type]
    if (fn) return fn({ type, data })
    
    // Route actions messages to actions component
    if (type.startsWith('actions:')) {
      const action_type = type.replace('actions:', '')
      _.actions.send({ type: action_type, data })
    }
    
    // Route quick_actions messages to actions component (for set_selected_action)
    if (type.startsWith('quick_actions:')) {
      const action_type = type.replace('quick_actions:', '')
      _.actions.send({ type: action_type, data })
    }
    
    throw new Error('invalid msg', { cause: { type, data } })
  }
  
  // ---
  // API
  // ---
  function toggle_console_history (msg) { 
    if (_.console_history) _.console_history.send({ type: 'toggle', data: msg.data }) 
  }
  function show_actions (msg) { 
    if (_.actions) _.actions.send({ type: 'show', data: msg.data }) 
  }
  function hide_actions (msg) { 
    if (_.actions) _.actions.send({ type: 'hide', data: msg.data }) 
  }
  function toggle_actions (msg) { 
    if (_.actions) _.actions.send({ type: 'toggle', data: msg.data }) 
  }
  function filter_actions (msg) { 
    if (_.actions) _.actions.send({ type: 'filter', data: msg.data }) 
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'console_history': {
        $: ''
      },
      'actions': {
        $: ''
      }
    }
  }

  function fallback_instance () {
    return {
      _: {
        'console_history': {
          0: '',
          mapping: {
            'style': 'style',
            'commands': 'commands',
            'icons': 'icons',
            'scroll': 'scroll'
          }
        },
        'actions': {
          0: '',
          mapping: {
            'style': 'style',
            'actions': 'actions',
            'icons': 'icons',
            'hardcons': 'hardcons'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .space {
                display: flex;
                min-height: 100px;
                width: 100%;
                height: inherit;
                flex-direction: column-reverse;
                background-color:#2e3440;
                position: relative;
              }
              .console-history {
                position: relative;
                width: 100%;
              }
              .actions {
                position: relative;
                width: 100%;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/space.js")
},{"STATE":1,"actions":3,"console_history":4}],8:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
module.exports = component

async function component (opts, callback = id => console.log('calling:', '@' + id)) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = {
    variables: onvariables,
    style: inject_style,
    icons: iconject,
    scroll: onscroll
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<div class="tab-entries"></div>`
  const entries = shadow.querySelector('.tab-entries')

  let init = false
  let variables = []
  let dricons = []
  const subs = await sdb.watch(onbatch)
  if (entries) {
    let is_down = false
    let start_x
    let scroll_start

    const stop = () => {
      is_down = false
      entries.classList.remove('grabbing')
      update_scroll_position()
    }

    const move = x => {
      if (!is_down) return
      if (entries.scrollWidth <= entries.clientWidth) return stop()
      entries.scrollLeft = scroll_start - (x - start_x) * 1.5
    }

    entries.onmousedown = e => {
      if (entries.scrollWidth <= entries.clientWidth) return
      is_down = true
      entries.classList.add('grabbing')
      start_x = e.pageX - entries.offsetLeft
      scroll_start = entries.scrollLeft
      window.onmousemove = e => {
        move(e.pageX - entries.offsetLeft)
        e.preventDefault()
      }
      window.onmouseup = () => {
        stop()
        window.onmousemove = window.onmouseup = null
      }
    }

    entries.onmouseleave = stop

    entries.ontouchstart = e => {
      if (entries.scrollWidth <= entries.clientWidth) return
      is_down = true
      start_x = e.touches[0].pageX - entries.offsetLeft
      scroll_start = entries.scrollLeft
    }
    ;['ontouchend', 'ontouchcancel'].forEach(ev => {
      entries[ev] = stop
    })

    entries.ontouchmove = e => {
      move(e.touches[0].pageX - entries.offsetLeft)
      e.preventDefault()
    }
  }
  return div

  async function create_btn ({ name, id }, index) {
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
    entries.appendChild(el)
    return
  }

  function onbatch (batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
    if (!init) {
      variables.forEach(create_btn)
      init = true
    } else {
      // TODO: Here we can handle drive updates
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function onvariables (data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    variables = vars
  }

  function iconject (data) {
    dricons = data
  }

  function update_scroll_position () {
    // TODO
  }

  function onscroll (data) {
    setTimeout(() => {
      if (entries) {
        entries.scrollLeft = data
      }
    }, 200)
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }
  function fallback_instance () {
    return {
      drive: {
        'icons/': {
          'cross.svg': {
            '$ref': 'cross.svg'
          },
          '1.svg': {
            '$ref': 'icon.svg'
          },
          '2.svg': {
            '$ref': 'icon.svg'
          },
          '3.svg': {
            '$ref': 'icon.svg'
          }
        },
        'variables/': {
          'tabs.json': {
            '$ref': 'tabs.json'
          }
        },
        'scroll/': {
          'position.json': {
            raw: '100'
          }
        },
        'style/': {
          'theme.css': {
            '$ref': 'style.css'
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/tabs/index.js")
},{"STATE":1}],9:[function(require,module,exports){
(function (__filename){(function (){
const state = require('STATE')
const state_db = state(__filename)
const { sdb, get } = state_db(fallback_module)

const tabs_component = require('tabs')
const task_manager = require('task_manager')

module.exports = tabsbar

async function tabsbar (opts, callback = id => console.log('calling:', '$' + id), callback_subs = id => console.log('calling_from_tabsbar:', '@' + id)) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject_style,
    icons: inject_icons
  }

  let dricons = {}
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  const subs = await sdb.watch(onbatch)
  dricons.forEach(num => console.log(num))
  console.log('dricons:', dricons)
  shadow.innerHTML = `
    <div class="tabs-bar-container">
      <button class="hat-btn">${dricons[0]}</button>
      <tabs></tabs>
      <task-manager></task-manager>
      <button class="bar-btn">${dricons[2]}</button>
    </div>
  `

  const tabs = await tabs_component(subs[0], callback_subs)
  tabs.classList.add('tabs-bar')
  shadow.querySelector('tabs').replaceWith(tabs)

  const task_mgr = await task_manager(subs[1], () => console.log('Task manager clicked!'))
  task_mgr.classList.add('bar-btn')
  shadow.querySelector('task-manager').replaceWith(task_mgr)

  return el

  function onbatch (batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style (data) {
    const sheet = new window.CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function inject_icons (data) {
    dricons = data
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      tabs: {
        $: ''
      },
      task_manager: {
        $: ''
      }
    }
  }

  function fallback_instance () {
    return {
      _: {
        tabs: {
          0: '',
          mapping: {
            icons: 'icons',
            variables: 'variables',
            scroll: 'scroll',
            style: 'style'
          }
        },
        task_manager: {
          0: '',
          mapping: {
            count: 'count',
            style: 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .tabs-bar-container {
                display: flex;
                flex: inherit;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: stretch;
              }
              .tabs-bar {
                display: flex;
                flex: auto;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: stretch;
                width: 300px;
              }
              .hat-btn, .bar-btn {
                display: flex;
                min-width: 32px;
                border: none;
                background: #131315;
                cursor: pointer;
                flex-direction: row;
                justify-content: center;
                align-items: center;
              }
            `
          }
        },
        'icons/': {
          '1.svg': {
            $ref: 'hat.svg'
          },
          '2.svg': {
            $ref: 'hat.svg'
          },
          '3.svg': {
            $ref: 'docs.svg'
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/tabsbar/index.js")
},{"STATE":1,"tabs":8,"task_manager":10}],10:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = task_manager

async function task_manager (opts, callback = () => console.log('task manager clicked')) {
  const { id, sdb } = await get(opts.sid)
  let number = 0
  const on = {
    style: inject,
    count: update_count
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = '<button class="task-count-btn">0</button>'

  const btn = shadow.querySelector('.task-count-btn')
  btn.onclick = callback

  await sdb.watch(onbatch)

  return el

  function onbatch (batch) {
    for (const { type, data } of batch) {
      if (on[type]) on[type](data)
    }
  }

  function inject (data) {
    const sheet = new window.CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function update_count (data) {
    if (btn) btn.textContent = data.toString()
    else number = data
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance () {
    return {
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .task-count-btn {
                background: #2d2d2d;
                color: #fff;
                border: none;
                border-radius: 100%;
                padding: 4px 8px;
                min-width: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
              }
              .task-count-btn:hover {
                background: #3d3d3d;
              }
            `
          }
        },
        'count/': {
          'value.json': {
            raw: '3'
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/task_manager.js")
},{"STATE":1}],11:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const action_bar = require('action_bar')
const tabsbar = require('tabsbar')

module.exports = taskbar

async function taskbar(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
  <div class="taskbar-container">
    <div class="action-bar-slot"></div>
    <div class="tabsbar-slot"></div>
  </div>`

  const action_bar_slot = shadow.querySelector('.action-bar-slot')
  const tabsbar_slot = shadow.querySelector('.tabsbar-slot')

  const subs = await sdb.watch(onbatch)
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage }, action_bar: null, tabsbar: null }
  
  const action_bar_el = await action_bar(subs[0], action_bar_protocol)
  action_bar_el.classList.add('replaced-action-bar')
  action_bar_slot.replaceWith(action_bar_el)

  const tabsbar_el = await tabsbar(subs[1])
  tabsbar_el.classList.add('replaced-tabsbar')
  tabsbar_slot.replaceWith(tabsbar_el)

  return el

  // ---------
  // PROTOCOLS  
  // ---------
  function action_bar_protocol (send) {
    _.action_bar = { send, on }
    on.id = id
    on.name = 'taskbar'
    return on
    function on ({ type, data }) { 
      console.log('[action_bar->taskbar]', type, data)
      // Forward console history messages up to theme_widget
      if (type === 'console_history_toggle') {
        _.up.send({ type: 'console_history:toggle', data })
      }
      // Forward action-related messages up to theme_widget
      if (type.startsWith('quick_actions:')) {
        _.up.send({ type: `actions:${type.replace('quick_actions:', '')}`, data })
      }
    }
  }
  
  function onmessage ({ type, data }) {
    console.log(`[theme_widget->taskbar]`, type, data)
    
    // Route toggle_console_history to action_bar
    if (type === 'toggle_console_history') {
      _.action_bar.send({ type: 'console_history_toggle', data })
    }
    
    // Route actions messages to action_bar
    if (type.startsWith('actions:')) {
      const action_type = type.replace('actions:', '')
      _.action_bar.send({ type: `quick_actions:${action_type}`, data })
    }
    
    // Route action_selected to action_bar for quick_actions
    if (type === 'action_selected') {
      _.action_bar.send({ type: 'quick_actions:set_selected_action', data })
    }
    
    // Route quick_actions_callback messages
    if (type.startsWith('quick_actions_callback:')) {
      _.action_bar.send({ type, data })
    }
  }

  function onbatch(batch) {
    for (const { type, data } of batch) (on[type] || fail)(data, type)
  }

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}

function fallback_module() {
  return {
    api: fallback_instance,
    _: {
      'action_bar': {
        $: ''
      },
      'tabsbar': {
        $: ''
      }
    }
  }

  function fallback_instance() {
    return {
      _: {
        'action_bar': {
          0: '',
          mapping: {
            'icons': 'icons',
            'style': 'style'
          }
        },
        'tabsbar': {
          0: '',
          mapping: {
            'icons': 'icons',
            'style': 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .taskbar-container {
                display: flex;
                background: #2d2d2d;
                column-gap: 1px;
              }
              .replaced-tabsbar {
                display: flex;
                flex: auto;
              }
              .replaced-action-bar {
                display: flex;
              }
              @media (max-width: 768px) {
                .taskbar-container {
                  flex-direction: column;
                }
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/taskbar/index.js")
},{"STATE":1,"action_bar":2,"tabsbar":9}],12:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const space = require('space')
const taskbar = require('taskbar')

module.exports = theme_widget

async function theme_widget (opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="theme-widget">
    <div class="space-slot"></div>
    <div class="taskbar-slot"></div>
  </div>`

  const space_slot = shadow.querySelector('.space-slot')
  const taskbar_slot = shadow.querySelector('.taskbar-slot')

  const subs = await sdb.watch(onbatch)
  
  let space_el = null
  let taskbar_el = null
  const _ = { space: null, taskbar: null }
  
  space_el = await space(subs[0], space_protocol)
  space_el.classList.add('space')
  space_slot.replaceWith(space_el)

  taskbar_el = await taskbar(subs[1], taskbar_protocol)
  taskbar_slot.replaceWith(taskbar_el)

  return el

  // ---------
  // PROTOCOLS
  // ---------
  function space_protocol (send) {
    _.space = { send, on }
    on.id = id
    on.name = 'theme_widget'
    return on
    function on ({ type, data }) {
      console.log('[space->theme_widget]', type, data)
      // Route messages to taskbar
      if (type === 'toggle_console_history' || type.startsWith('actions:') || type === 'action_selected' || type.startsWith('quick_actions_callback:')) {
        _.taskbar.send({ type, data })
      }
    }
  }

  function taskbar_protocol (send) {
    _.taskbar = { send, on }
    on.id = id
    on.name = 'theme_widget'
    return on
    function on ({ type, data }) {
      console.log('[taskbar->theme_widget]', type, data)
      // Route messages to space
      if (type.startsWith('console_history:') || type === 'action_selected' || type.startsWith('quick_actions:')) {
        _.space.send({ type, data })
      }
    }
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'space': {
        $: ''
      },
      'taskbar': {
        $: ''
      }
    }
  }

  function fallback_instance () {
    return {
      _: {
        'space': {
          0: '',
          mapping: {
            'style': 'style'
          }
        },
        'taskbar': {
          0: '',
          mapping: {
            'style': 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .theme-widget {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                background: #131315;
              }
              .space{
                height: inherit;
                }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/theme_widget/index.js")
},{"STATE":1,"space":7,"taskbar":11}],13:[function(require,module,exports){
const hash = 'bc2766416051e07aa6d29da131181ff69668aea8'
const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/' + hash + '/'
const init_url = prefix + 'doc/state/example/init.js'
const args = arguments

fetch(init_url).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args, prefix)
  require('./page')
})
},{"./page":14}],14:[function(require,module,exports){
(function (__filename){(function (){
localStorage.clear()
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
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
const task_manager = require('../src/node_modules/task_manager')
const quick_actions = require('../src/node_modules/quick_actions')

const imports = {
  theme_widget,
  taskbar,
  tabsbar,
  action_bar,
  space,
  tabs,
  console_history,
  actions,
  task_manager,
  quick_actions
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
  const subs = (await sdb.watch(onbatch)).filter((_, index) => index % 2 === 0)
  console.log('subs', subs)
  const nav_menu_element = await navbar(subs[names.length], names, initial_checked_indices, menu_callbacks)
  navbar_slot.replaceWith(nav_menu_element)
  create_component(entries)
  window.onload = scroll_to_initial_selected
  return el
async function create_component (entries_obj) {
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
    inner.append(component_content)
    components_wrapper.appendChild(outer)
    wrappers[index] = { outer, inner, name, checkbox_state: is_initially_checked }
    index++
  }
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
    const style_data = Array.isArray(data) ? data[0] : (JSON.parse(data))[0]
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(style_data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module () {
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
    '../src/node_modules/task_manager',
    '../src/node_modules/quick_actions'
  ]
  const subs = {}
  names.forEach(subgen)
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
  subs[menuname] = { 
    $: '',
    0: '',
    mapping: {
      'style': 'style',
    }
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
            padding: 15px;
            border: 3px solid #666;
            resize: both;
            overflow: auto;
            border-radius: 0px;
            background-color: #ffffff;
            min-height: 50px;
          }
          .component-content {
            width: 100%;
            height: 100%;
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
},{"../src/node_modules/STATE":1,"../src/node_modules/action_bar":2,"../src/node_modules/actions":3,"../src/node_modules/console_history":4,"../src/node_modules/menu":5,"../src/node_modules/quick_actions":6,"../src/node_modules/space":7,"../src/node_modules/tabs":8,"../src/node_modules/tabsbar":9,"../src/node_modules/task_manager":10,"../src/node_modules/taskbar":11,"../src/node_modules/theme_widget":12}]},{},[13]);

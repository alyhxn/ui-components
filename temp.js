// @TODO: replace `callback` and `actions_callback` with this
async function component (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  // ...
  const send = protocol(msg => onmessage(msg))
  const _ = { up: { send, on: onmessage } } // for communicating with "sub components"
  // ...
  const api = { toggle_console_history, show_actions, hide_actions }
  // ...
  actions_el = await actions(subs[1], actions_protocol)
  // ...
  console_history_el = await console_history(subs[0], console_history_protocol)
  // ...
  return el
  // ...
  function create_action_item (action_data, index) {
    const action_item = document.createElement('div')
    action_item.classList.add('action-item')
    const icon = icons[index]
    action_item.innerHTML = `
      <div class="action-icon">${icon}</div>
      <div class="action-name">${action_data.action}</div>
      <div class="action-pin">${action_data.pin ? hardcons.pin : hardcons.unpin}</div>
      <div class="action-default">${action_data.default ? hardcons.default : hardcons.undefault}</div>
    `
    action_item.onclick = onclick
    actions_menu.appendChild(action_item)
    return
    function onclick () {
      _.up.send({ type: 'callback', data: action_data }) // callback(action_data)
      _.up.send({ type: 'quick_actions_callback:set_selected_action', data: action_data })
      // if (quick_actions_callback && quick_actions_callback.set_selected_action) {
      //   quick_actions_callback.set_selected_action(action_data)
      // }
      el.hide_actions()
    }
  }
  // ...
  // ---------
  // PROTOCOLS
  // ---------
  function console_history_protocol (send) {
    _.console_history = { send, on }
    on.id = id
    on.name = 'space'
    return on
    function on ({ type, data }) { console.log('[console_history->space]', type, data) }
  }
  function actions_protocol (send) {
    _.actions = { send, on }
    on.id = id
    on.name = 'space'
    return on
    function on ({ type, data }) { console.log('[actions->space]', type, data) }
  }
  function onmessage ({ type, data }) {
    console.log(`[${send.name}->space]`, type, data)
    const fn = api[type]
    if (fn) return fn({ type, data })
    throw new Error('invalid msg', { cause: { type, data } })
  }
  // ---
  // API
  // ---
  function toggle_console_history (msg) { _.console_history.send(msg) }
  function show_actions (msg) { _.actions.send(msg) }
  function hide_actions (msg) { _.actions.send(msg) }
}

  // ...
  function actions_protocol (send) {
    _.actions = { send, on }
    on.id = id
    on.name = 'space'
    const actions_api = { show_actions, hide_actions, toggle_actions, filter_actions }
    return on
    function on ({ type, data }) {
      console.log('[space->theme_widget]', type, data)
      const fn = actions_api[type]
      if (fn) return fn({ type, data })
      throw new Error('invalid msg', { cause: { type, data } })
    }
    function show_actions (msg) { _.space.send(msg) }
    function hide_actions (msg) { _.space.send(msg) }
    function toggle_actions (msg) { _.space.send(msg) }
    function filter_actions (msg) { _.space.send(msg) }
  }
  // ...
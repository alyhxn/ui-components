const components = require('..')

document.body.append(create_component_menu(components))

function create_component_menu (imports) {
  const style = get_theme()
  const root_element = document.createElement('div')
  root_element.className = 'root'
  root_element.innerHTML = `
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

  const menu_list = root_element.querySelector('.menu-list')
  const components_wrapper = root_element.querySelector('.components-wrapper')
  const menu_element = root_element.querySelector('.menu')
  const menu_toggle_button = root_element.querySelector('.menu-toggle-button')
  const unselect_all_button = root_element.querySelector('.unselect-all-button')

  const factories = Object.entries(imports)
  const checkbox_elements = []
  const component_outer_wrappers = []
  const component_names = []
  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  let initial_checked_items = []
  const selected_component_name = url_params.get('selected')
  let currently_selected_wrapper = null

  if (checked_param) {
    try {
      initial_checked_items = JSON.parse(checked_param)
      if (!Array.isArray(initial_checked_items)) {
        initial_checked_items = []
      }
    } catch (error) {
      console.error('Error parsing checked parameter:', error)
      initial_checked_items = []
    }
  }

  factories.forEach(create_list)

  unselect_all_button.onclick = on_unselect_button
  menu_toggle_button.onclick = on_menu_toggle
  document.onclick = on_document_click

  scroll_to_selected_component()
  return root_element

  function create_list ([name, factory], index) {
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'

    const label_element = document.createElement('span')
    label_element.textContent = name
    menu_item.append(label_element)

    const checkbox_element = document.createElement('input')
    checkbox_element.type = 'checkbox'
    const is_initially_checked = initial_checked_items.includes(index + 1) || initial_checked_items.length === 0
    checkbox_element.checked = is_initially_checked
    menu_item.append(checkbox_element)
    menu_list.append(menu_item)
    checkbox_elements.push(checkbox_element)
    component_names.push(name)

    const component_outer_wrapper = document.createElement('div')
    component_outer_wrapper.className = 'component-outer-wrapper'
    component_outer_wrappers.push(component_outer_wrapper)

    const component_name_div = document.createElement('div')
    component_name_div.className = 'component-name-label'
    component_name_div.textContent = name
    component_outer_wrapper.append(component_name_div)

    const component_wrapper = document.createElement('div')
    component_wrapper.className = 'component-wrapper'
    component_wrapper.append(factory())
    component_outer_wrapper.append(component_wrapper)
    components_wrapper.append(component_outer_wrapper)

    component_outer_wrapper.style.display = is_initially_checked ? 'block' : 'none'

    checkbox_element.onchange = on_checkbox_change
    label_element.onclick = on_label_click

    function on_checkbox_change (event) {
      component_outer_wrapper.style.display = event.target.checked ? 'block' : 'none'
      update_url(checkbox_elements, name)
    }

    function on_label_click () {
      component_wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
      update_url(checkbox_elements, name)

      if (currently_selected_wrapper && currently_selected_wrapper !== component_outer_wrapper) {
        currently_selected_wrapper.style.backgroundColor = ''
      }
      component_outer_wrapper.style.backgroundColor = 'lightblue'
      currently_selected_wrapper = component_outer_wrapper
    }
  }

  function on_unselect_button () {
    if (unselect_all_button.textContent === 'Unselect All') {
      checkbox_elements.forEach(checkbox => {
        checkbox.checked = false
      })
      component_outer_wrappers.forEach(wrapper => {
        wrapper.style.display = 'none'
      })
      unselect_all_button.textContent = 'Select All'
    } else {
      checkbox_elements.forEach(checkbox => {
        checkbox.checked = true
      })
      component_outer_wrappers.forEach(wrapper => {
        wrapper.style.display = 'block'
      })
      unselect_all_button.textContent = 'Unselect All'
    }
    update_url(checkbox_elements)
    if (currently_selected_wrapper) {
      currently_selected_wrapper.style.backgroundColor = ''
      currently_selected_wrapper = null
    }
  }

  function on_menu_toggle (event) {
    event.stopPropagation()
    menu_element.classList.toggle('hidden')
  }

  function on_document_click (event) {
    if (!menu_element.classList.contains('hidden') && !menu_element.contains(event.target) && !menu_toggle_button.contains(event.target)) {
      menu_element.classList.add('hidden')
    }
  }

  function scroll_to_selected_component () {
    if (selected_component_name) {
      const selected_index = component_names.indexOf(selected_component_name)
      if (selected_index !== -1) {
        const selected_wrapper = component_outer_wrappers[selected_index]
        selected_wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
        selected_wrapper.style.backgroundColor = 'lightblue'
        currently_selected_wrapper = selected_wrapper
      }
    }
  }

  function update_url (checkboxes, selected_name) {
    const checked_indices = checkboxes.reduce(function (acc, checkbox, index) {
      if (checkbox.checked) {
        acc.push(index + 1)
      }
      return acc
    }, [])

    const params = new URLSearchParams(window.location.search)
    if (checked_indices.length > 0 && checked_indices.length < checkboxes.length) {
      params.set('checked', `[${checked_indices.join(',')}]`)
    } else {
      params.delete('checked')
    }

    if (selected_name) {
      params.set('selected', selected_name)
    } else {
      params.delete('selected')
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

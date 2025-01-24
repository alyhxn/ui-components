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
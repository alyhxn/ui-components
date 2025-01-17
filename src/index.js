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
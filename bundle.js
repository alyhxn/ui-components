(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.action_bar = require('action_bar');
module.exports.graph_explorer = require('graph_explorer');
module.exports.tabbed_editor = require('tabbed_editor');
module.exports.chat_history = require('chat_history');
},{"action_bar":2,"chat_history":3,"graph_explorer":4,"tabbed_editor":5}],2:[function(require,module,exports){
module.exports = action_bar

function action_bar() {
    const element = document.createElement('div') 
    const shadow = element.attachShadow({ mode: 'closed' })
    shadow.innerHTML = `<h1>Action Bar....</h1>`
    return element
}

},{}],3:[function(require,module,exports){
module.exports = chat_history

function chat_history() {
    const element = document.createElement('div') 
    const shadow = element.attachShadow({ mode: 'closed' })
    shadow.innerHTML = `<h1>Chat History....</h1>`
    return element
}

},{}],4:[function(require,module,exports){
module.exports = graph_explorer

function graph_explorer() {
    const element = document.createElement('div') 
    const shadow = element.attachShadow({ mode: 'closed' })
    shadow.innerHTML = `<h1>Graph Explorer....</h1>`
    return element
}

},{}],5:[function(require,module,exports){
module.exports = tabbed_editor

function tabbed_editor() {
    const element = document.createElement('div') 
    const shadow = element.attachShadow({ mode: 'closed' })
    shadow.innerHTML = `<h1>Tabbed Editor....</h1>`
    return element
}

},{}],6:[function(require,module,exports){
const components = require('..')

const factories = Object.keys(components).map(name => [name, components[name]])

document.body.append(...factories.map(([name, fn]) => {
  const container = document.createElement('div')
  container.append(fn())
  return container;
}))
},{"..":1}]},{},[6]);

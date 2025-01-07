(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const uiComponents = require('../src/index.js')

const x = uiComponents()

document.body.append(x)

},{"../src/index.js":2}],2:[function(require,module,exports){
module.exports = uiComponents

function uiComponents() {
    const el = document.createElement('div') 
    const shadow = el.attachShadow({ mode: 'closed' })
    shadow.innerHTML = `
    <h1>Ui Components for task-messenger</h1>
    <p>These are some components that will be used in the task-messenger project.</p>
    <ul>
        <li>action bar</li>
        <li>graph explorer</li>
        <li>tabbed editor</li>
        <li>chat history</li>
    `
    return el
}

},{}]},{},[1]);

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

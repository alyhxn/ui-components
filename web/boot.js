const init_url = location.hash === '#dev' ? '/doc/state/example/init.js' : 'https://raw.githubusercontent.com/alyhxn/playproject/refs/heads/main/doc/state/example/init.js'
const args = arguments

fetch(init_url, { cache: "no-store" }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args) 
  require('./page') // or whatever is otherwise the main entry of our project
})
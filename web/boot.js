const hash = 'main'
const base = 'https://raw.githubusercontent.com/alyhxn/playproject/'
const prefix = base + hash
const init_url = location.hash === '#dev' ? '/src/node_modules/init.js' : prefix + '/src/node_modules/init.js'
const args = arguments



fetch(init_url, { cache: 'no-store' }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args, prefix)
  require('./page') // or whatever is otherwise the main entry of our project
})

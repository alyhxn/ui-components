const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/a31832ad3cb24fe15ab36bdc73a929f43179d7b8/'
const init_url = location.hash === '#dev' ? 'web/init.js' : prefix + 'doc/state/example/init.js'
const args = arguments

fetch(init_url, { cache: 'no-store' }).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args, prefix)
  require('./page') // or whatever is otherwise the main entry of our project
})

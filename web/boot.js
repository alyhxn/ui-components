const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/a31832ad3cb24fe15ab36bdc73a929f43179d7b8/'
const init_url = location.hash === '#dev' ? 'web/init.js' : prefix + 'src/node_modules/init.js'
const args = arguments

const has_save = location.hash.includes('#save')
const fetch_opts = has_save ? {} : { cache: 'no-store' }

if (!has_save) {
  localStorage.clear()
}

fetch(init_url, fetch_opts).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args, prefix)
  require('./page') // or whatever is otherwise the main entry of our project
})

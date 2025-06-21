const hash = 'dd5a8a33c1ca1228ed3f4284b3067f36a0d2873e'
const prefix = 'https://raw.githubusercontent.com/alyhxn/playproject/' + hash + '/'
const init_url = prefix + 'doc/state/example/init.js'
const args = arguments

const fetch_opts = location.hash.includes('#save') ? {} : { cache: 'no-store' }

fetch(init_url, fetch_opts).then(res => res.text()).then(async source => {
  const module = { exports: {} }
  const f = new Function('module', 'require', source)
  f(module, require)
  const init = module.exports
  await init(args, prefix)
  require('./page')
})
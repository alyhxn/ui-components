(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const localdb = require('localdb')
const db = localdb()
/** Data stored in a entry in db by STATE (Schema): 
 * id (String): Node Path 
 * name (String/Optional): Any (To be used in theme_widget)
 * type (String): Module Name for module / Module id for instances
 * hubs (Array): List of hub-nodes
 * subs (Array): List of sub-nodes
 * inputs (Array): List of input files
 */
// Constants and initial setup (global level)
const VERSION = 10
const ROOT_ID = 'page'

const status = {
  root_module: true, 
  root_instance: true, 
  overrides: {},
  tree: {},
  tree_pointers: {},
  modulepaths: {},
  inits: [],
  open_branches: {},
  db,
  local_statuses: {},
  listeners: {},
  missing_supers: new Set(),
  imports: {}
}
window.STATEMODULE = status

// Version check and initialization
status.fallback_check = Boolean(check_version())
status.fallback_check && db.add(['playproject_version'], VERSION)


// Symbol mappings
const s2i = {}
const i2s = {}
let admins = [0, 'menu']

// Inner Function
function STATE (address, modulepath) {
  status.modulepaths[modulepath] = 0
  register_imports(modulepath, address)
  //Variables (module-level)

  const local_status = {
    name: extract_filename(address),
    module_id: modulepath,
    deny: {},
    sub_modules: [],
    sub_instances: {}
  }
  status.local_statuses[modulepath] = local_status
  return statedb
  
  function statedb (fallback) {
    const data = fallback()
    local_status.fallback_instance = data.api

    if(data._)
      status.open_branches[modulepath] = Object.keys(data._).length
    
    local_status.fallback_module = new Function(`return ${fallback.toString()}`)()
    const updated_status = append_tree_node(modulepath, status)
    Object.assign(status.tree_pointers, updated_status.tree_pointers)
    Object.assign(status.open_branches, updated_status.open_branches)
    status.inits.push(init_module)

    if(!Object.values(status.open_branches).reduce((acc, curr) => acc + curr, 0)){
      status.inits.forEach(init => init())
    }
    
    const sdb = create_statedb_interface(local_status, modulepath, xtype = 'module')
    status.dataset = sdb.private_api
    return {
      id: modulepath,
      sdb: sdb.public_api,
      subs: [get],
      // sub_modules
    }
  }
  function append_tree_node (id, status) {
    const [super_id, name] = id.split(/\/(?=[^\/]*$)/)
  
    if(name){
      if(status.tree_pointers[super_id]){
        status.tree_pointers[super_id]._[name] = { $: { _: {} } }
        status.tree_pointers[id] = status.tree_pointers[super_id]._[name].$
        status.open_branches[super_id]--
      }
      else{
        let temp_name, new_name = name
        let new_super_id = super_id
        
        while(!status.tree_pointers[new_super_id]){
          [new_super_id, temp_name] = new_super_id.split(/\/(?=[^\/]*$)/)
          new_name = temp_name + '.' + new_name
        }
        status.tree_pointers[new_super_id]._[new_name] = { $: { _: {} } }
        status.tree_pointers[id] = status.tree_pointers[new_super_id]._[new_name].$
        if(!status.missing_supers.has(super_id))
          status.open_branches[new_super_id]--
        status.missing_supers.add(super_id)
      }
    }
    else{
      status.tree[id] = { $: { _: {} } }
      status.tree_pointers[id] = status.tree[id].$
    }
    return status
  }
  function init_module () {
    const {statedata, state_entries, newstatus, updated_local_status} = get_module_data(local_status.fallback_module)
    statedata.orphan && (local_status.orphan = true)
    //side effects
    if (status.fallback_check) {
      Object.assign(status.root_module, newstatus.root_module)
      Object.assign(status.overrides, newstatus.overrides)
      console.log('Main module: ', statedata.name, '\n', state_entries)
      updated_local_status && Object.assign(local_status, updated_local_status)
      const old_fallback = local_status.fallback_instance
      local_status.fallback_instance = () => statedata.api([old_fallback])
      db.append(['state'], state_entries)
      // add_source_code(statedata.inputs) // @TODO: remove side effect
    }

    [local_status.sub_modules, symbol2ID, ID2Symbol] = symbolfy(statedata, local_status)
    Object.assign(s2i, symbol2ID)
    Object.assign(i2s, ID2Symbol)
    
    //Setup local data (module level)
    if(status.root_module){
      status.root_module = false
      statedata.admins && admins.push(...statedata.admins)
    }
    // @TODO: handle sub_modules when dynamic require is implemented
    // const sub_modules = {}
    // statedata.subs && statedata.subs.forEach(id => {
    //   sub_modules[db.read(['state', id]).type] = id
    // })
  }
  function get (sid) {
    const {statedata, state_entries, newstatus} = get_instance_data(sid)
    
    if (status.fallback_check) {
      Object.assign(status.root_module, newstatus.root_module)
      Object.assign(status.overrides, newstatus.overrides)
      Object.assign(status.tree, newstatus.tree)
      console.log('Main instance: ', statedata.name, '\n', state_entries)
      db.append(['state'], state_entries)
    }
    [local_status.sub_instances[statedata.id], symbol2ID, ID2Symbol] = symbolfy(statedata, local_status)
    Object.assign(s2i, symbol2ID)
    Object.assign(i2s, ID2Symbol)
    const sdb = create_statedb_interface(local_status, statedata.id, xtype = 'instance')
    return {
      id: statedata.id,
      sdb: sdb.public_api,
    }
  }
  function get_module_data (fallback) {
    let data = db.read(['state', modulepath])
    if (status.fallback_check) {
      if (data) {
        var {sanitized_data, updated_status} = validate_and_preprocess({ fun_status: status, fallback, xtype: 'module', pre_data: data })
      } 
      else if (status.root_module) {
        var {sanitized_data, updated_status} = validate_and_preprocess({ fun_status: status, fallback, xtype: 'module', pre_data: {id: modulepath}})
      } 
      else {
        var {sanitized_data, updated_status, updated_local_status} = find_super({ xtype: 'module', fallback, fun_status:status, local_status })
      }
      data = sanitized_data.entry
    }
    return {
      statedata: data,
      state_entries: sanitized_data?.entries,
      newstatus: updated_status,
      updated_local_status
    }
  }
  function get_instance_data (sid) {
    let id = s2i[sid]
    let data = id && db.read(['state', id])
    let sanitized_data, updated_status = status
    if (status.fallback_check) {
      if (!data && !status.root_instance) {
        ({sanitized_data, updated_status} = find_super({ xtype: 'instance', fallback: local_status.fallback_instance, fun_status: status }))
      } else {
        ({sanitized_data, updated_status} = validate_and_preprocess({
          fun_status: status,
          fallback: local_status.fallback_instance, 
          xtype: 'instance',
          pre_data: data || {id: get_instance_path(modulepath)}
        }))
        updated_status.root_instance = false
      }
      data = sanitized_data.entry
    }
    else if (status.root_instance) {
      data = db.read(['state', id || get_instance_path(modulepath)])
      updated_status.tree = JSON.parse(JSON.stringify(status.tree))
      updated_status.root_instance = false
    }
    
    if (!data && local_status.orphan) {
      data = db.read(['state', get_instance_path(modulepath)])
    }
    return {
      statedata: data,
      state_entries: sanitized_data?.entries,
      newstatus: updated_status,
    }
  }
  function find_super ({ xtype, fallback, fun_status, local_status }) {
    let modulepath_super = modulepath.split(/\/(?=[^\/]*$)/)[0]
    let modulepath_grand = modulepath_super.split(/\/(?=[^\/]*$)/)[0]
    const split = modulepath.split('/')
    const name = split.at(-2) + '.' + split.at(-1)
    let data
    const entries = {}
    if(xtype === 'module'){
      while(!data){
        data = db.read(['state', modulepath_super])
        modulepath_grand = modulepath_super = modulepath_super.split(/\/(?=[^\/]*$)/)[0]
      }
      data.path = data.id = modulepath
      local_status.name = name

      const super_data = db.read(['state', modulepath_grand])
      super_data.subs.forEach((sub_id, i) => {
        if(sub_id === modulepath_super){
          super_data.subs.splice(i, 1)
          return
        }
      })
      super_data.subs.push(data.id)
      entries[super_data.id] = super_data
    }
    else{
      //@TODO: Make the :0 dynamic
      let instance_path_super = modulepath_super + ':0'
      let temp
      while(!data && temp !== modulepath_super){
        data = db.read(['state', instance_path_super])
        temp = modulepath_super
        modulepath_grand = modulepath_super = modulepath_super.split(/\/(?=[^\/]*$)/)[0]
        instance_path_super = modulepath_super + ':0'
      }
      data.path = data.id = get_instance_path(modulepath)
      temp = null
      let super_data
      let instance_path_grand = modulepath_grand.includes('/') ? modulepath_grand + ':0' : modulepath_grand

      while(!super_data?.subs && temp !== modulepath_grand){
        super_data = db.read(['state', instance_path_grand])
        temp = modulepath_grand
        modulepath_grand = modulepath_grand.split(/\/(?=[^\/]*$)/)[0]
        instance_path_grand = modulepath_grand.includes('/') ? modulepath_grand + ':0' : modulepath_grand
      }
      
      super_data.subs.forEach((sub_id, i) => {
        if(sub_id === instance_path_super){
          super_data.subs.splice(i, 1)
          return
        }
      })
      super_data.subs.push(data.id)
      entries[super_data.id] = super_data
    }
    data.name = split.at(-1)
    return { updated_local_status: local_status,
      ...validate_and_preprocess({ 
      fun_status,
      fallback, xtype, 
      pre_data: data, 
      orphan_check: true, entries }) }
  }
  function validate_and_preprocess ({ fallback, xtype, pre_data = {}, orphan_check, fun_status, entries }) {
    let {id: pre_id, hubs: pre_hubs, mapping} = pre_data
    let fallback_data
    try {
      validate(fallback(), xtype)
    } catch (error) {
      throw new Error(`Error in fallback function of ${pre_id} ${xtype}\n${error.stack}`);
    }
    if(fun_status.overrides[pre_id]){
      fallback_data = fun_status.overrides[pre_id].fun[0](get_fallbacks({ fallback, modulename: local_status.name, modulepath, instance_path: pre_id }))
      fun_status.overrides[pre_id].by.splice(0, 1)
      fun_status.overrides[pre_id].fun.splice(0, 1)
    }
    else
      fallback_data = fallback()

    // console.log('fallback_data: ', fallback_data)
    fun_status.overrides = register_overrides({ overrides: fun_status.overrides, tree: fallback_data, path: modulepath, id: pre_id })
    console.log('overrides: ', Object.keys(fun_status.overrides))
    orphan_check && (fallback_data.orphan = orphan_check)
    //This function makes changes in fun_status (side effect)
    return {
      sanitized_data: sanitize_state({ local_id: '', entry: fallback_data, path: pre_id, xtype, mapping, entries }),
      updated_status: fun_status
    }
    
    function sanitize_state ({ local_id, entry, path, hub_entry, local_tree, entries = {}, xtype, mapping }) {
      [path, entry, local_tree] = extract_data({ local_id, entry, path, hub_entry, local_tree, xtype })
      
      entry.id = path
      entry.name = entry.name || local_id.split(':')[0] || local_status.name
      mapping && (entry.mapping = mapping)
      
      entries = {...entries, ...sanitize_subs({ local_id, entry, path, local_tree, xtype, mapping })}
      
      delete entry._
      entries[entry.id] = entry
      // console.log('Entry: ', entry)
      return {entries, entry}
    }
    function extract_data ({ local_id, entry, path, hub_entry, xtype }) {
      if (local_id) {
        entry.hubs = [hub_entry.id]
        if (xtype === 'instance') {
          let temp_path = path.split(':')[0]
          temp_path = temp_path ? temp_path + '/' : temp_path
          const module_id = temp_path + local_id
          entry.type = module_id
          path = module_id + ':' + (status.modulepaths[module_id]++ || 0)
        }
        else {
          entry.type = local_id
          path = path ? path + '/' : ''
          path = path + local_id
        }
      } 
      else {
        if (xtype === 'instance') {
          entry.type = local_status.module_id
        } else {
          local_tree = JSON.parse(JSON.stringify(entry))
          // @TODO Handle JS file entry
          // console.log('pre_id:', pre_id)
          // const file_id = local_status.name + '.js'
          // entry.drive || (entry.drive = {})
          // entry.drive[file_id] = { $ref: address }
          entry.type = local_status.name
        }
        pre_hubs && (entry.hubs = pre_hubs)
      }
      return [path, entry, local_tree]
    }
    function sanitize_subs ({ local_id, entry, path, local_tree, xtype, mapping }) {
      const entries = {}
      if (!local_id) {
        entry.subs = []
        if(entry._){
          //@TODO refactor when fallback structure improves
          Object.entries(entry._).forEach(([local_id, value]) => {
            Object.entries(value).forEach(([key, override]) => {
              if(key === 'mapping' || typeof(override) === 'object')
                return
              const sub_instance = sanitize_state({ local_id, entry: value, path, hub_entry: entry, local_tree, xtype: key === '$' ? 'module' : 'instance', mapping: value['mapping'] }).entry
              entries[sub_instance.id] = JSON.parse(JSON.stringify(sub_instance))
              entry.subs.push(sub_instance.id)
            })
        })}
        if (entry.drive) {
          // entry.drive.theme && (entry.theme = entry.drive.theme)
          // entry.drive.lang && (entry.lang = entry.drive.lang)
          entry.inputs = []
          const new_drive = []
          Object.entries(entry.drive).forEach(([dataset_type, dataset]) => {
            dataset_type = dataset_type.split('/')[0]
            const new_dataset = { files: [], mapping: {} }
            Object.entries(dataset).forEach(([key, value]) => {
              const sanitized_file = sanitize_file(key, value, entry, entries)
              entries[sanitized_file.id] = sanitized_file
              new_dataset.files.push(sanitized_file.id)
            })
            new_dataset.id = local_status.name + '.' + dataset_type + '.dataset'
            new_dataset.type = dataset_type
            new_dataset.name = 'default'
            const copies = Object.keys(db.read_all(['state', new_dataset.id]))
            if (copies.length) {
              const id = copies.sort().at(-1).split(':')[1]
              new_dataset.id = new_dataset.id + ':' + (Number(id || 0) + 1)
            }
            entries[new_dataset.id] = new_dataset
            let check_name = true
            entry.inputs.forEach(dataset_id => {
              const ds = entries[dataset_id]
              if(ds.type === new_dataset.type)
                check_name = false
            })
            check_name && entry.inputs.push(new_dataset.id)
            new_drive.push(new_dataset.id)


            if(!status.root_module){
              const hub_entry = db.read(['state', entry.hubs[0]])
              const mapped_file_type = mapping?.[dataset_type] || dataset_type
              hub_entry.inputs.forEach(input_id => {
                const input = db.read(['state', input_id])
                if(mapped_file_type === input.type){
                  input.mapping[entry.id] = new_dataset.id
                  entries[input_id] = input
                  return
                }
              })
            }
          })
          entry.drive = new_drive
        }
      }
      return entries
    }
    function sanitize_file (file_id, file, entry, entries) {
      const type = file_id.split('.').at(-1)

      if (!isNaN(Number(file_id))) return file_id


      file.id = local_status.name + '.' + type
      file.name = file.name || file.id
      file.local_name = file_id
      file.type = type
      file[file.type === 'js' ? 'subs' : 'hubs'] = [entry.id]
      
      const copies = Object.keys(db.read_all(['state', file.id]))
      if (copies.length) {
        const no = copies.sort().at(-1).split(':')[1]
        file.id = file.id + ':' + (Number(no || 0) + 1)
      }
      while(entries[file.id]){
        const no = file.id.split(':')[1]
        file.id = file.id + ':' + (Number(no || 0) + 1)
      }
      return file
    }
  }
}

// External Function (helper)
function validate (data, xtype) {
  /**  Expected structure and types
   * Sample : "key1|key2:*:type1|type2"
   * ":" : separator
   * "|" : OR
   * "*" : Required key
   * 
   * */
  const expected_structure = {
    '_::object': {
      ":*:object": xtype === 'module' ? {
        "$:*:function|string|object": '',
        "mapping::": {}
      } : { // Required key, any name allowed
        ":*:function|string|object": () => {}, // Optional key
        "mapping::": {}
      },
    },
    'drive::object': {
      "::object": {
        "::object": { // Required key, any name allowed
          "raw|link:*:object|string": {}, // data or link are names, required, object or string are types
          "link": "string"
        }
      },
    },
  }

  
  validate_shape(data, expected_structure)

  function validate_shape (obj, expected, super_node = 'root', path = '') {
    const keys = Object.keys(obj)
    const values = Object.values(obj)

    Object.entries(expected).forEach(([expected_key, expected_value]) => {
      let [expected_key_names, required, expected_types] = expected_key.split(':')
      expected_types = expected_types ? expected_types.split('|') : [typeof(expected_value)]
      let absent = true
      if(expected_key_names)
        expected_key_names.split('|').forEach(expected_key_name => {
          const value = obj[expected_key_name]
          if(value !== undefined){
            const type = typeof(value)
            absent = false

            if(expected_types.includes(type))
              type === 'object' && validate_shape(value, expected_value, expected_key_name, path + '/' + expected_key_name)
            else
              throw new Error(`Type mismatch: Expected "${expected_types.join(' or ')}" got "${type}" for key "${expected_key_name}" at:` + path)
          }
        })
      else{
        values.forEach((value, index) => {
          absent = false
          const type = typeof(value)

          if(expected_types.includes(type))
            type === 'object' && validate_shape(value, expected_value, keys[index], path + '/' + keys[index])
          else
            throw new Error(`Type mismatch: Expected "${expected_types.join(' or ')}" got "${type}" for key "${keys[index]}" at: ` + path)
        })
      }
      if(absent && required){
        if(expected_key_names)
          throw new Error(`Can't find required key "${expected_key_names.replace('|', ' or ')}" at: ` + path)
        else
          throw new Error(`No subnodes found for super key "${super_node}" at sub: ` + path)
      }
    })
  }
}
function extract_filename (address) {
  const parts = address.split('/node_modules/')
  const last = parts.at(-1).split('/')
  if(last.at(-1) === 'index.js')
    return last.at(-2)
  return last.at(-1).slice(0, -3)
}
function get_instance_path (modulepath, modulepaths = status.modulepaths) {
  return modulepath + ':' + modulepaths[modulepath]++
}
async function get_input ({ id, name, $ref, type, raw }) {
  const xtype = (typeof(id) === "number" ? name : id).split('.').at(-1)
  let result = db.read([type, id])
  
  if (!result) {
    result = raw !== undefined ? raw : await((await fetch($ref))[xtype === 'json' ? 'json' : 'text']())
  }
  return result
}
//Unavoidable side effect
function add_source_code (hubs) {
  hubs.forEach(async id => {
    const data = db.read(['state', id])
    if (data.type === 'js') {
      data.data = await get_input(data)
      db.add(['state', data.id], data)
      return
    }
  })
}
async function register_imports (id, address) {
  const code = await((await fetch(address)).text())
  const regex = /require\(['"`](.*?)['"`]\)/g
  let matches, modules = []

  while ((matches = regex.exec(code)) !== null) {
      modules.push(matches[1]) // Extract module name
  }
  status.imports[id] = modules
  if(Object.keys(status.imports).length === Object.keys(status.modulepaths).length){
    verify_imports()
  }
}
function verify_imports () {
  Object.entries(status.imports).some(([id, imports]) => {
   const data = status.local_statuses[id].fallback_module()
    if(!data._)
      return
    const fallback_imports = Object.keys(data._)

    imports.forEach(imp => {
      let check = true
      if(imp.includes('STATE'))
        return
      fallback_imports.forEach(fallimp => {
        if(imp.includes(fallimp))
          check = false
      })

      if(check)
        throw new Error('Required module "'+imp+'" is not defined in the fallback of '+status.local_statuses[id].module_id)
    })

    fallback_imports.forEach(fallimp => {
      let check = true
      imports.forEach(imp => {
        if(imp.includes(fallimp))
          check = false
      })
      
      if(check)
        throw new Error('Module "'+fallimp+'" defined in the fallback of '+status.local_statuses[id].module_id+' is not required')
    })
  })
}
function symbolfy (data) {
  const s2i = {}
  const i2s = {}
  const subs = []
  data.subs && data.subs.forEach(sub => {
    const substate = db.read(['state', sub])
    s2i[i2s[sub] = Symbol(sub)] = sub
    subs.push({ sid: i2s[sub], type: substate.type })
  })
  return [subs, s2i, i2s]
}
function register_overrides ({overrides, ...args}) {
  recurse(args)
  return overrides
  function recurse ({ tree, path = '', id, xtype = 'instance', local_modulepaths = {} }) {

    tree._ && Object.entries(tree._).forEach(([type, instances]) => {
      const sub_path = path + '/' + type.replace('.', '/')
      Object.entries(instances).forEach(([id, override]) => {
        if(typeof(override) === 'function'){
          let resultant_path = id === '$' ? sub_path : sub_path + ':' + id
          if(overrides[resultant_path]){
            overrides[resultant_path].fun.push(override)
            overrides[resultant_path].by.push(id)
          }
          else
            overrides[resultant_path] = {fun: [override], by: [id]}
        }
        else{
          recurse({ tree: override, path: sub_path, id, xtype, local_modulepaths })
        }
      })
    })
  }
}
function get_fallbacks ({ fallback, modulename, modulepath, instance_path }) {
  return [mutated_fallback, ...status.overrides[instance_path].fun]
    
  function mutated_fallback () {
    const data = fallback()

    data.overrider = status.overrides[instance_path].by[0]
    merge_trees(data, modulepath)
    return data

    function merge_trees (data, path) {
      if (data._) {
        Object.entries(data._).forEach(([type, data]) => merge_trees(data, path + '/' + type.split('$')[0].replace('.', '/')))
      } else {
        data.$ = { _: status.tree_pointers[path]._ }
      }
    }
  }
}
function check_version () {
  if (db.read(['playproject_version']) != VERSION) {
    localStorage.clear()
    return true
  }
}

// Public Function
function create_statedb_interface (local_status, node_id, xtype) {
  const api =  {
    public_api: {
      watch, get_sub, req_access
    },
    private_api: {
      get, register, swtch, unregister
    }
  }
  api.public_api.admin = node_id === ROOT_ID && api.private_api
  return api

  async function watch (listener) {
    const data = db.read(['state', node_id])
    if(listener){
      status.listeners[data.id] = listener
      listener(await make_input_map(data.inputs))
    }
    return xtype === 'module' ? local_status.sub_modules : local_status.sub_instances[node_id]
  }
  function get_sub (type) {
    return local_status.subs.filter(sub => {
      const dad = db.read(['state', sub.type])
      return dad.type === type
    })
  }
  function req_access (sid) {
    if (local_status.deny[sid]) throw new Error('access denied')
    const el = db.read(['state', s2i[sid]])
    if (admins.includes(s2i[sid]) || admins.includes(el?.name)) {
      return {
        xget: (id) => db.read(['state', id]),
        get_all: () => db.read_all(['state']),
        add_admins: (ids) => { admins.push(...ids) },
        get,
        register,
        load: (snapshot) => {
          localStorage.clear()
          Object.entries(snapshot).forEach(([key, value]) => {
            db.add([key], JSON.parse(value), true)
          })
          window.location.reload()
        },
        swtch
      }
    }
  }
  function get (dataset_type, dataset_name) {
    const node = db.read(['state', ROOT_ID])
    if(dataset_type){
      const dataset_list = []
      node.drive.forEach(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(dataset.type === dataset_type)
          dataset_list.push(dataset.name)
      })
      if(dataset_name){
        return recurse(ROOT_ID, dataset_type)
      }
      return dataset_list
    }
    const datasets = []
    node.inputs && node.inputs.forEach(dataset_id => {
      datasets.push(db.read(['state', dataset_id]).type)
    })
    return datasets
  
    function recurse (node_id, dataset_type){
      const node_list = []
      const entry = db.read(['state', node_id])
      const temp = entry.mapping ? Object.keys(entry.mapping).find(key => entry.mapping[key] === dataset_type) : null
      const mapped_type = temp || dataset_type
      entry.drive && entry.drive.forEach(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(dataset.name === dataset_name && dataset.type === mapped_type){
          node_list.push(node_id)
          return
        }
      })
      entry.subs && entry.subs.forEach(sub_id => node_list.push(...recurse(sub_id, mapped_type)))
      return node_list
    }
  }
  function register (dataset_type, dataset_name, dataset) {
    Object.entries(dataset).forEach(([node_id, files]) => {
      const new_dataset = { files: [] }
      Object.entries(files).forEach(([file_id, file]) => {
        const type = file_id.split('.').at(-1)
        
        file.id = local_status.name + '.' + type
        file.local_name = file_id
        file.type = type
        file[file.type === 'js' ? 'subs' : 'hubs'] = [node_id]
        
        const copies = Object.keys(db.read_all(['state', file.id]))
        if (copies.length) {
          const no = copies.sort().at(-1).split(':')[1]
          file.id = file.id + ':' + (Number(no || 0) + 1)
        }  
        db.add(['state', file.id], file)
        new_dataset.files.push(file.id)
      })
  
      const node = db.read(['state', node_id])
      new_dataset.id = node.name + '.' + dataset_type + '.dataset'
      new_dataset.name = dataset_name
      new_dataset.type = dataset_type
      const copies = Object.keys(db.read_all(['state', new_dataset.id]))
      if (copies.length) {
        const id = copies.sort().at(-1).split(':')[1]
        new_dataset.id = new_dataset.id + ':' + (Number(id || 0) + 1)
      }
      db.push(['state', node_id, 'drive'], new_dataset.id)
      db.add(['state', new_dataset.id], new_dataset)
    })
    return ' registered ' + dataset_name + '.' + dataset_type
  }
  function unregister (dataset_type, dataset_name) {
    return recurse(ROOT_ID)

    function recurse (node_id){
      const node = db.read(['state', node_id])
      node.drive && node.drive.some(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(dataset.name === dataset_name && dataset.type === dataset_type){
          node.drive.splice(node.drive.indexOf(dataset_id), 1)
          return true
        }
      })
      node.inputs && node.inputs.some(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(dataset.name === dataset_name && dataset.type === dataset_type){
          node.inputs.splice(node.inputs.indexOf(dataset_id), 1)
          swtch(dataset_type)
          return true
        }
      })
      db.add(['state', node_id], node)
      node.subs.forEach(sub_id => recurse(sub_id))
    }
  }
  function swtch (dataset_type, dataset_name = 'default') {
    recurse(dataset_type, dataset_name, ROOT_ID)

    async function recurse (target_type, target_name, id) {
      const node = db.read(['state', id])
      
      let target_dataset
      node.drive && node.drive.forEach(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(target_name === dataset.name && target_type === dataset.type){
          target_dataset = dataset
          return
        }
      })
      if(target_dataset){
        node.inputs.forEach((dataset_id, i) => {
          const dataset = db.read(['state', dataset_id])
          if(target_type === dataset.type){
            node.inputs.splice(i, 1)
            return
          }
        })
        node.inputs.push(target_dataset.id)
      }
      db.add(['state', id], node)
      status.listeners[id] && status.listeners[id](await make_input_map(node.inputs))
      node.subs && node.subs.forEach(sub_id => {
        const subdataset_id = target_dataset?.mapping?.[sub_id] 
        recurse(target_type, db.read(['state', subdataset_id])?.name || target_name, sub_id)
      })
    }
  }
}
async function make_input_map (inputs) {
  const input_map = []   
  if (inputs) {
    await Promise.all(inputs.map(async input => {
      let files = []
      const dataset = db.read(['state', input])
      await Promise.all(dataset.files.map(async file_id => {
        const input_state = db.read(['state', file_id])
        files.push(await get_input(input_state))
      }))
      input_map.push({ type: dataset.type, data: files })
    }))
  }
  return input_map
}


module.exports = STATE
},{"localdb":4}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)

module.exports = chat_history
async function chat_history(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Chat-History</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/chat_history.js")
},{"STATE":1}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)

module.exports = graph_explorer
async function graph_explorer(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Graph-Explorer</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/graph_explorer.js")
},{"STATE":1}],4:[function(require,module,exports){
/******************************************************************************
  LOCALDB COMPONENT
******************************************************************************/
module.exports = localdb

function localdb () {
  const prefix = '153/'
  return { add, read_all, read, drop, push, length, append, find }

  function length (keys) {
    const address = prefix + keys.join('/')
    return Object.keys(localStorage).filter(key => key.includes(address)).length
  }
  /**
   * Assigns value to the key of an object already present in the DB
   * 
   * @param {String[]} keys 
   * @param {any} value 
   */
  function add (keys, value, precheck) {
    localStorage[(precheck ? '' : prefix) + keys.join('/')] = JSON.stringify(value)
  }
  /**
   * Appends values into an object already present in the DB
   * 
   * @param {String[]} keys 
   * @param {any} value 
   */
  function append (keys, data) {
    const pre = keys.join('/')
    Object.entries(data).forEach(([key, value]) => {
      localStorage[prefix + pre+'/'+key] = JSON.stringify(value)
    })
  }
  /**
   * Pushes value to an array already present in the DB
   * 
   * @param {String[]} keys
   * @param {any} value 
   */
  function push (keys, value) {
    const independent_key = keys.slice(0, -1)
    const data = JSON.parse(localStorage[prefix + independent_key.join('/')])
    data[keys.at(-1)].push(value)
    localStorage[prefix + independent_key.join('/')] = JSON.stringify(data)
  }
  function read (keys) {
    const result = localStorage[prefix + keys.join('/')]
    return result && JSON.parse(result)
  }
  function read_all (keys) {
    const address = prefix + keys.join('/')
    let result = {}
    Object.entries(localStorage).forEach(([key, value]) => {
      if(key.includes(address))
        result[key.split('/').at(-1)] = JSON.parse(value)
      })
    return result
  }
  function drop (keys) {
    if(keys.length > 1){
      const data = JSON.parse(localStorage[keys[0]])
      let temp = data
      keys.slice(1, -1).forEach(key => {
        temp = temp[key]
      })
      if(Array.isArray(temp))
        temp.splice(keys[keys.length - 1], 1)
      else
        delete(temp[keys[keys.length - 1]])
      localStorage[keys[0]] = JSON.stringify(data)
    }
    else
      delete(localStorage[keys[0]])
  }
  function find (keys, filters, index = 0) {
    let index_count = 0
    const address = prefix + keys.join('/')
    const target_key = Object.keys(localStorage).find(key => {
      if(key.includes(address)){
        const entry = JSON.parse(localStorage[key])
        let count = 0
        Object.entries(filters).some(([search_key, value]) => {
          if(entry[search_key] !== value)
            return
          count++
        })
        if(count === Object.keys(filters).length){
          if(index_count === index)
            return key
          index_count++
        }
      }
    }, undefined)
    return target_key && JSON.parse(localStorage[target_key])
  } 
}
},{}],5:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)

module.exports = tabbed_editor
async function tabbed_editor(opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<h1>Tabbed-Editor</h1>`
  shadow.querySelector('h1').className = 'text'
  const subs = await sdb.watch(onbatch)
  return div
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module() {
  return {
    api: fallback_instance,
  }
  function fallback_instance() {
    return {
      drive: {
        style: {
          'theme.css': {
            raw: `
              .text {
                color: #D8DEE9;
                background-color: #2E3440;
                padding: 1rem;
                border-left: 4px solid #81A1C1;
                line-height: 1.6;
                box-shadow: 0 2px 5px rgba(46, 52, 64, 0.5);
                transition: background-color 0.3s ease, color 0.3s ease;
              }
              
              .text:hover {
                color: #88C0D0;
                background-color: #3B4252;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/tabbed_editor.js")
},{"STATE":1}],6:[function(require,module,exports){
patch_cache_in_browser(arguments[4], arguments[5])

function patch_cache_in_browser (source_cache, module_cache) {
  const meta = { modulepath: ['page'], paths: {} }
  for (const key of Object.keys(source_cache)) {
    const [module, names] = source_cache[key]
    const dependencies = names || {}
    source_cache[key][0] = patch(module, dependencies, meta)
  }
  function patch (module, dependencies, meta) {
    const MAP = {}
    for (const [name, number] of Object.entries(dependencies)) MAP[name] = number
    return (...args) => {
      const original = args[0]
      require.cache = module_cache
      require.resolve = resolve
      args[0] = require
      return module(...args)
      function require (name) {
        const identifier = resolve(name)
        if (name.endsWith('STATE')) {
          const modulepath = meta.modulepath.join('/')
          const original_export = require.cache[identifier] || (require.cache[identifier] = original(name))
          const exports = (...args) => original_export(...args, modulepath)
          return exports
        } else if (require.cache[identifier]) return require.cache[identifier]
        else {
          const counter = meta.modulepath.concat(name).join('/')
          if (!meta.paths[counter]) meta.paths[counter] = 0
          let localid = `${name}${meta.paths[counter] ? '#' + meta.paths[counter] : ''}`
          meta.paths[counter]++
          meta.modulepath.push(localid.replace(/^\.\/+/, '').replace('/', ','))
        }
        const exports = require.cache[identifier] = original(name)
        if (!name.endsWith('node_modules/STATE')) meta.modulepath.pop(name)
        return exports
      }
    }
    function resolve (name) { return MAP[name] }
  }
}
require('./page') // or whatever is otherwise the main entry of our project

},{"./page":8}],7:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)
module.exports = create_component_menu
delete require.cache[require.resolve('search_bar')]
delete require.cache[require.resolve('action_bar')]
const graph_explorer = require('../src/node_modules/graph_explorer')
const chat_history = require('../src/node_modules/chat_history')
const tabbed_editor = require('../src/node_modules/tabbed_editor')
async function create_component_menu (opts) {
  const { id, sdb } = await get(opts.sid)
  const on = {
    style: inject
  }
  const imports = {
    graph_explorer,
    chat_history,
    tabbed_editor
  }
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="nav-bar-container">
    <div class="nav-bar">
      <button class="menu-toggle-button">☰ MENU</button>
      <div class="menu hidden">
        <div class="menu-header">
          <button class="unselect-all-button">Unselect All</button>
        </div>
        <ul class="menu-list"></ul>
      </div>
    </div>
  </div>
  <div class="components-wrapper"></div>`
  // styling
  document.body.style.margin = 0
  const sheet = new CSSStyleSheet()
  shadow.adoptedStyleSheets = [sheet]
  // refering to template
  const list = shadow.querySelector('.menu-list')
  const wrapper = shadow.querySelector('.components-wrapper')
  const menu = shadow.querySelector('.menu')
  const toggle_btn = shadow.querySelector('.menu-toggle-button')
  const unselect_btn = shadow.querySelector('.unselect-all-button')
  // helper variables
  const entries = Object.entries(imports)
  const checkboxes = []
  const wrappers = []
  const names = []
  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  let initial_checked = []
  const selected_name = url_params.get('selected')
  let current_wrapper = null
  // events
  if (checked_param) {
    try {
      initial_checked = JSON.parse(checked_param)
      if (!Array.isArray(initial_checked)) initial_checked = []
    } catch (e) {
      console.error('Error parsing checked parameter:', e)
      initial_checked = []
    }
  }
  const subs = await sdb.watch(onbatch)
  entries.forEach(create_list)

  unselect_btn.onclick = on_unselect
  toggle_btn.onclick = on_menu_toggle
  document.onclick = on_doc_click
  window.onload = scroll_to_selected

  return el

  async function create_list ([name, factory], index) {
    const checked = initial_checked.includes(index + 1) || initial_checked.length === 0  
    // Menu List
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'
    menu_item.innerHTML = `
    <span>${name}</span>
    <input type="checkbox" ${checked ? 'checked' : ''}>`
    const label = menu_item.querySelector('span')
    const checkbox = menu_item.querySelector('input')
  
    list.append(menu_item)
    checkboxes.push(checkbox)
    names.push(name)

    // Actual Component
    const outer = document.createElement('div')
    outer.className = 'component-outer-wrapper'
    outer.style.display = checked ? 'block' : 'none'
    outer.innerHTML = `
    <div class="component-name-label">${name}</div>
    <div class="component-wrapper"></div>`
    wrappers.push(outer)
    const inner = outer.querySelector('.component-wrapper')
    inner.append(await factory(subs[index]))
    console.log(index)
    wrapper.append(outer)
    // event
    checkbox.onchange = on_checkbox
    label.onclick = on_label

    function on_checkbox (e) {
      outer.style.display = e.target.checked ? 'block' : 'none'
      update_url(checkboxes)
    }
  
    function on_label () {
      inner.scrollIntoView({ behavior: 'smooth', block: 'center' })
      update_url(checkboxes, name)
      if (current_wrapper && current_wrapper !== outer) {
        current_wrapper.style.backgroundColor = ''
      }
      outer.style.backgroundColor = 'lightblue'
      current_wrapper = outer
    }
  }

  function on_unselect () {
    if (unselect_btn.textContent === 'Unselect All') {
      checkboxes.forEach(c => c.checked = false)
      wrappers.forEach(w => w.style.display = 'none')
      unselect_btn.textContent = 'Select All'
    } else {
      checkboxes.forEach(c => c.checked = true)
      wrappers.forEach(w => w.style.display = 'block')
      unselect_btn.textContent = 'Unselect All'
    }
    update_url(checkboxes)
    if (current_wrapper) {
      current_wrapper.style.backgroundColor = ''
      current_wrapper = null
    }
  }

  function on_menu_toggle (e) {
    e.stopPropagation()
    menu.classList.toggle('hidden')
  }

  function on_doc_click (e) {
    if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !toggle_btn.contains(e.target)) {
      menu.classList.add('hidden')
    }
  }

  function scroll_to_selected () {
    if (selected_name) {
      const i = names.indexOf(selected_name)
      if (i !== -1) {
        const w = wrappers[i]
        w.scrollIntoView({ behavior: 'smooth', block: 'center' })
        w.style.backgroundColor = 'lightblue'
        current_wrapper = w
      }
    }
  }

  function update_url (checkboxes, selected) {
    const checked = checkboxes.reduce((acc, c, i) => {
      if (c.checked) acc.push(i + 1)
      return acc
    }, [])

    const params = new URLSearchParams(window.location.search)
    if (checked.length > 0 && checked.length < checkboxes.length) {
      params.set('checked', `[${checked.join(',')}]`)
    } else {
      params.delete('checked')
    }

    if (selected) {
      params.set('selected', selected)
    } else {
      params.delete('selected')
    }

    window.history.pushState(null, '', `${window.location.pathname}?${params}`)
  }

  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }

  async function inject (data) {
    sheet.replaceSync(data.join('\n'))
  }
}
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      graph_explorer: {
        $: '',
      },
      chat_history: {
        $: '',
      },
      tabbed_editor: {
        $: '',
      }
    }
  }
  function fallback_instance () {
    return {
      _: {
        graph_explorer: {
          0: ""
        },
        chat_history: {
          0: ""
        },
        tabbed_editor: {
          0: ""
        }
      },
      drive: {
        style: {
          'theme.css': {
            raw: `
            .nav-bar-container {
              position: sticky;
              top: 0;
              z-index: 100;
              background-color: #e0e0e0;
            }
  
            .nav-bar {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 10px 20px;
              background-color: #e0e0e0;
              border-bottom: 2px solid #333;
            }
  
            .menu-toggle-button {
              padding: 10px;
              background-color: #e0e0e0;
              border: none;
              cursor: pointer;
              border-radius: 5px;
            }
  
            .menu.hidden {
              display: none;
            }
  
            .menu {
              display: block;
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              width: 200px;
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
  
            .menu-header {
              margin-bottom: 10px;
              text-align: center;
            }
  
            .unselect-all-button {
              padding: 8px 12px;
              border: none;
              background-color: #d0d0d0;
              cursor: pointer;
              border-radius: 5px;
              width: 100%;
            }
  
            .menu-list {
              list-style: none;
              padding: 0;
              margin: 0;
              max-height: 400px;
              overflow-y: auto;
              background-color: #f0f0f0;
            }
  
            .menu-list::-webkit-scrollbar {
              width: 0;
              background: transparent;
            }
  
            .menu-list::-webkit-scrollbar-thumb {
              background: transparent;
            }
  
            .menu-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #ccc;
              cursor: pointer;
            }
  
            .menu-item:last-child {
              border-bottom: none;
            }
  
            .component-container {
              flex-grow: 1;
              padding-top: 20px + 50px;
              padding-left: 20px;
              padding-right: 20px;
              padding-bottom: 20px;
            }
  
            .components-wrapper {
              width: 95%;
              margin: 0 auto;
              padding: 2.5%;
            }
  
            .component-outer-wrapper {
              margin-bottom: 20px;
              padding: 0px 0px 10px 0px;
            }
  
            .component-name-label {
              background-color:transparent;
              padding: 8px 15px;
              text-align: center;
              font-weight: bold;
            }
  
            .component-wrapper {
              padding: 15px;
              border:3px solid #666;
              resize:both;
              overflow: auto;
              border-radius: 0px;
              background-color:#ffffff;
            }
  
            .component-wrapper:last-child {
              margin-bottom: 0;
            }`
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/web/index.js")
},{"../src/node_modules/STATE":1,"../src/node_modules/chat_history":2,"../src/node_modules/graph_explorer":3,"../src/node_modules/tabbed_editor":5}],8:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb, subs: [get] } = statedb(fallback_module)
/******************************************************************************
  PAGE
******************************************************************************/
const app = require('./index')
const sheet = new CSSStyleSheet()
config().then(() => boot({ sid: '' }))

async function config () {
  // const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)
  const html = document.documentElement
  const meta = document.createElement('meta')
  const appleTouch = '<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">'
  // const icon32 = '<link rel="icon" type="image/png" sizes="32x32" href="./src/node_modules/assets/images/favicon/favicon-32x32.png">'
  // const icon16 = '<link rel="icon" type="image/png" sizes="16x16" href="./src/node_modules/assets/images/favicon/favicon-16x16.png">'
  // const webmanifest = '<link rel="manifest" href="./src/node_modules/assets/images/favicon/site.webmanifest"></link>'
  const font = 'https://fonts.googleapis.com/css?family=Nunito:300,400,700,900|Slackey&display=swap'
  const loadFont = `<link href=${font} rel='stylesheet' type='text/css'>`
  html.setAttribute('lang', 'en')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0')
  // @TODO: use font api and cache to avoid re-downloading the font data every time
  document.head.append(meta)
  document.head.innerHTML += appleTouch + loadFont // + icon16 + icon32 + webmanifest
  document.adoptedStyleSheets = [sheet]
  await document.fonts.ready // @TODO: investigate why there is a FOUC
}
/******************************************************************************
  PAGE BOOT
******************************************************************************/
async function boot (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const on = {
    theme: inject
  }
  const subs = await sdb.watch(onbatch)
  // const status = {}
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.body
  const shopts = { mode: 'closed' }
  const shadow = el.attachShadow(shopts)
  shadow.adoptedStyleSheets = [sheet]
  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------
  // desktop
  shadow.append(await app(subs[1]))

  // ----------------------------------------
  // INIT
  // ----------------------------------------
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
  }
}
async function inject (data) {
  sheet.replaceSync(data.join('\n'))
}
function fallback_module () {
  return {
    _: {
      'index': {
        $: '',
        0: override_app
      }
    },
    drive: {
      theme: {
        'style.css': {
          raw: 'body { font-family: \'system-ui\'; }'
        }
      }
    }
  }

  function override_app ([app]) {
    const data = app()
    return data
  }
}
}).call(this)}).call(this,"/web/page.js")
},{"../src/node_modules/STATE":1,"./index":7}]},{},[6]);

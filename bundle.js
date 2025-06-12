(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const localdb = require('localdb')
const io = require('io')

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
const VERSION = 13
const HELPER_MODULES = ['io', 'localdb', 'STATE']
const FALLBACK_POST_ERROR = '\nFor more info visit https://github.com/alyhxn/playproject/blob/main/doc/state/temp.md#defining-fallbacks'
const FALLBACK_SYNTAX_POST_ERROR = '\nFor more info visit https://github.com/alyhxn/playproject/blob/main/doc/state/temp.md#key-descriptions'
const FALLBACK_SUBS_POST_ERROR = '\nFor more info visit https://github.com/alyhxn/playproject/blob/main/doc/state/temp.md#shadow-dom-integration'
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
  imports: {},
  expected_imports: {},
  used_ids: new Set(),
  a2i: {},
  i2a: {},
  services: {},
  args: {}
}
window.STATEMODULE = status

// Version check and initialization
status.fallback_check = Boolean(check_version())
status.fallback_check && db.add(['playproject_version'], VERSION)


// Symbol mappings
const s2i = {}
const i2s = {}
let admins = [0]

// Inner Function
function STATE (address, modulepath, dependencies) {
  !status.ROOT_ID && (status.ROOT_ID = modulepath)
  status.modulepaths[modulepath] = 0
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
    const data = fallback(status.args[modulepath], { listfy: tree => listfy(tree, modulepath), tree: status.tree_pointers[modulepath] })
    local_status.fallback_instance = data.api
    const super_id = modulepath.split(/>(?=[^>]*$)/)[0]
    
    if(super_id === status.current_node){
      status.expected_imports[super_id].splice(status.expected_imports[super_id].indexOf(modulepath), 1)
    }
    else if((status?.current_node?.split('>').length || 0) < super_id.split('>').length){
      let temp = super_id
      while(temp !== status.current_node && temp.includes('>')){
        status.open_branches[temp] = 0
        temp = temp.split(/>(?=[^>]*$)/)[0]
      }
    }
    else{
      let temp = status.current_node
      while(temp !== super_id && temp.includes('>')){
        status.open_branches[temp] = 0
        temp = temp.split(/>(?=[^>]*$)/)[0]
      }
    }

    if(data._){
      status.open_branches[modulepath] = Object.values(data._).filter(node => node).length
      status.expected_imports[modulepath] = Object.keys(data._)
      status.current_node = modulepath
    }

    local_status.fallback_module = new Function(`return ${fallback.toString()}`)()
    verify_imports(modulepath, dependencies, data)
    const updated_status = append_tree_node(modulepath, status)
    Object.assign(status.tree_pointers, updated_status.tree_pointers)
    Object.assign(status.open_branches, updated_status.open_branches)
    status.inits.push(init_module)
    
    if(!Object.values(status.open_branches).reduce((acc, curr) => acc + curr, 0)){
      status.inits.forEach(init => init())
    }
    
    const sdb = create_statedb_interface(local_status, modulepath, xtype = 'module')
    status.dataset = sdb.private_api

    const get = init_instance
    const extra_fallbacks = Object.entries(local_status.fallback_instance || {})
    extra_fallbacks.length && extra_fallbacks.forEach(([key]) => {
      get[key] = (sid) => get(sid, key)
    })
    if(!status.a2i[modulepath]){
      status.i2a[status.a2i[modulepath] = encode(modulepath)] = modulepath
    }
    return {
      id: modulepath,
      sdb: sdb.public_api,
      get: init_instance,
      io: io(status.a2i[modulepath], modulepath)
      // sub_modules
    }
  }
  function append_tree_node (id, status) {
    const [super_id, name] = id.split(/>(?=[^>]*$)/)

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
          [new_super_id, temp_name] = new_super_id.split(/>(?=[^>]*$)/)
          new_name = temp_name + '>' + new_name
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
      console.log('Main module: ', statedata.id, '\n', state_entries)
      updated_local_status && Object.assign(local_status, updated_local_status)
      // console.log('Local status: ', local_status.fallback_instance, statedata.api)
      const old_fallback = local_status.fallback_instance
      
      if(local_status.fallback_instance ? local_status.fallback_instance?.toString() === statedata.api?.toString() : false)
        local_status.fallback_instance = statedata.api
      else
        local_status.fallback_instance = (args, tools) => {
          return statedata.api(args, tools, [old_fallback])
        }
      const extra_fallbacks = Object.entries(old_fallback || {})
      extra_fallbacks.length && extra_fallbacks.forEach(([key, value]) => {
        local_status.fallback_instance[key] = (args, tools) => {
          console.log('Extra fallback: ', statedata.api[key] ? statedata.api[key] : old_fallback[key])
          return (statedata.api[key] ? statedata.api[key] : old_fallback[key])(args, tools, [value])
        }
      })
      db.append(['state'], state_entries)
      // add_source_code(statedata.inputs) // @TODO: remove side effect
    }
    [local_status.sub_modules, symbol2ID, ID2Symbol, address2ID, ID2Address] = symbolfy(statedata, local_status)
    Object.assign(s2i, symbol2ID)
    Object.assign(i2s, ID2Symbol)
    Object.assign(status.a2i, address2ID)
    Object.assign(status.i2a, ID2Address)
    
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
  function init_instance (sid, fallback_key) {
    const fallback = local_status.fallback_instance[fallback_key] || local_status.fallback_instance
    const {statedata, state_entries, newstatus} = get_instance_data(sid, fallback)
    
    if (status.fallback_check) {
      Object.assign(status.root_module, newstatus.root_module)
      Object.assign(status.overrides, newstatus.overrides)
      Object.assign(status.tree, newstatus.tree)
      console.log('Main instance: ', statedata.id, '\n', state_entries)
      db.append(['state'], state_entries)
    }
    [local_status.sub_instances[statedata.id], symbol2ID, ID2Symbol, address2ID, ID2Address] = symbolfy(statedata, local_status)
    Object.assign(s2i, symbol2ID)
    Object.assign(i2s, ID2Symbol)
    Object.assign(status.a2i, address2ID)
    Object.assign(status.i2a, ID2Address)
    
    const sdb = create_statedb_interface(local_status, statedata.id, xtype = 'instance')

    const sanitized_event = {}
    statedata.net && Object.entries(statedata.net?.event).forEach(([def, action]) => {
      sanitized_event[def] = action.map(msg => {
        msg.id = status.a2i[msg.address] || (a2i[msg.address] = encode(msg.address))
        return msg
      })
    })
    if(statedata.net)
      statedata.net.event = sanitized_event
    return {
      id: statedata.id,
      net: statedata.net,
      sdb: sdb.public_api,
      io: io(status.a2i[statedata.id], modulepath)
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
  function get_instance_data (sid, fallback) {
    let id = s2i[sid]
    if(id && (id.split(':')[0] !== modulepath || !id.includes(':')))
        throw new Error(`Access denied! Wrong SID '${id}' used by instance of '${modulepath}'` + FALLBACK_SUBS_POST_ERROR)
    if(status.used_ids.has(id))
      throw new Error(`Access denied! SID '${id}' is already used` + FALLBACK_SUBS_POST_ERROR)

    id && status.used_ids.add(id)
    let data = id && db.read(['state', id])
    let sanitized_data, updated_status = status
    if (status.fallback_check) {
      if (!data && !status.root_instance) {
        ({sanitized_data, updated_status} = find_super({ xtype: 'instance', fallback, fun_status: status }))
      } else {
        ({sanitized_data, updated_status} = validate_and_preprocess({
          fun_status: status,
          fallback, 
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
    let modulepath_super = modulepath.split(/\>(?=[^>]*$)/)[0]
    let modulepath_grand = modulepath_super.split(/\>(?=[^>]*$)/)[0]
    const split = modulepath.split('>')
    let data
    const entries = {}
    if(xtype === 'module'){
      let name = split.at(-1)
      while(!data && modulepath_grand.includes('>')){
        data = db.read(['state', modulepath_super])
        const split = modulepath_super.split(/\>(?=[^>]*$)/)
        modulepath_super = split[0]
        name = split[1] + '>' + name
      }
      data.path = data.id = modulepath_super + '>' + name
      modulepath = modulepath_super + '>' + name
      local_status.name = name

      const super_data = db.read(['state', modulepath_super])
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
        modulepath_grand = modulepath_super = modulepath_super.split(/\>(?=[^>]*$)/)[0]
        instance_path_super = modulepath_super + ':0'
      }
      data.path = data.id = get_instance_path(modulepath)
      temp = null
      let super_data
      let instance_path_grand = modulepath_grand.includes('>') ? modulepath_grand + ':0' : modulepath_grand

      while(!super_data?.subs && temp !== modulepath_grand){
        super_data = db.read(['state', instance_path_grand])
        temp = modulepath_grand
        modulepath_grand = modulepath_grand.split(/\>(?=[^>]*$)/)[0]
        instance_path_grand = modulepath_grand.includes('>') ? modulepath_grand + ':0' : modulepath_grand
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
    const used_keys = new Set()
    let {id: pre_id, hubs: pre_hubs, mapping} = pre_data
    let fallback_data
    try {
      validate(fallback(status.args[pre_id], { listfy: tree => listfy(tree, modulepath), tree: status.tree_pointers[modulepath] }), xtype)
    } catch (error) {
      throw new Error(`in fallback function of ${pre_id} ${xtype}\n${error.stack}`)
    }
    if(fun_status.overrides[pre_id]){
      fallback_data = fun_status.overrides[pre_id].fun[0](status.args[pre_id], { listfy: tree => listfy(tree, modulepath), tree: status.tree_pointers[modulepath] }, get_fallbacks({ fallback, modulename: local_status.name, modulepath, instance_path: pre_id }))
      console.log('Override used: ', pre_id)
      fun_status.overrides[pre_id].by.splice(0, 1)
      fun_status.overrides[pre_id].fun.splice(0, 1)
    }
    else
      fallback_data = fallback(status.args[pre_id], { listfy: tree => listfy(tree, modulepath), tree: status.tree_pointers[modulepath] })

    console.log('fallback_data: ', fallback)
    fun_status.overrides = register_overrides({ overrides: fun_status.overrides, tree: fallback_data, path: modulepath, id: pre_id })
    console.log('overrides: ', Object.keys(fun_status.overrides))
    orphan_check && (fallback_data.orphan = orphan_check)
    //This function makes changes in fun_status (side effect)
    return {
      sanitized_data: sanitize_state({ local_id: '', entry: fallback_data, path: pre_id, xtype, mapping, entries }),
      updated_status: fun_status
    }
    
    function sanitize_state ({ local_id, entry, path, hub_entry, local_tree, entries = {}, xtype, mapping, xkey }) {
      [path, entry, local_tree] = extract_data({ local_id, entry, path, hub_entry, local_tree, xtype, xkey })

      entry.id =  path
      entry.name = entry.name || local_id.split(':')[0] || local_status.name
      mapping && (entry.mapping = mapping)
      
      entries = {...entries, ...sanitize_subs({ local_id, entry, path, local_tree, xtype, mapping })}
      delete entry._
      entries[entry.id] = entry
      // console.log('Entry: ', entry)
      return {entries, entry}
    }
    function extract_data ({ local_id, entry, path, hub_entry, xtype, xkey }) {
      if (local_id) {
        entry.hubs = [hub_entry.id]
        if (xtype === 'instance') {
          let temp_path = path.split(':')[0]
          temp_path = temp_path ? temp_path + '>' : temp_path
          const module_id = temp_path + local_id
          entry.type = module_id
          path = module_id + ':' + xkey
          temp = Number(xkey)+1
          temp2 = db.read(['state', path])
          while(temp2 || used_keys.has(path)){
            path = module_id + ':' + temp
            temp2 = db.read(['state', path])
            temp++
          }
        }
        else {
          entry.type = local_id
          path = path ? path + '>' : ''
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
              if(key === 'mapping' || (key === '$' && xtype === 'instance'))
                return
              const sub_instance = sanitize_state({ local_id, entry: value, path, hub_entry: entry, local_tree, xtype: key === '$' ? 'module' : 'instance', mapping: value['mapping'], xkey: key }).entry
              entries[sub_instance.id] = JSON.parse(JSON.stringify(sub_instance))
              entry.subs.push(sub_instance.id)
              used_keys.add(sub_instance.id)
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
              if(!mapping?.[dataset_type])
                throw new Error(`No mapping found for dataset "${dataset_type}" of subnode "${entry.id}" in node "${hub_entry.id}"\nTip: Add a mapping prop for "${dataset_type}" dataset in "${hub_entry.id}"'s fallback for "${entry.id}"` + FALLBACK_POST_ERROR)
              const mapped_file_type = mapping[dataset_type]
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

      const raw_id = local_status.name + '.' + type
      file.id = raw_id
      file.name = file.name || file_id
      file.type = type
      file[file.type === 'js' ? 'subs' : 'hubs'] = [entry.id]
      if(file.$ref){
        file.$ref = address.substring(0, address.lastIndexOf("/")) + '/' + file.$ref
      }
      const copies = Object.keys(db.read_all(['state', file.id]))
      if (copies.length) {
        const no = copies.sort().at(-1).split(':')[1]
        file.id = raw_id + ':' + (Number(no || 0) + 1)
      }
      while(entries[file.id]){
        const no = file.id.split(':')[1]
        file.id = raw_id + ':' + (Number(no || 0) + 1)
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
   * */
  const expected_structure = {
    'api::function': () => {},
    '_::object': {
      ":*:object|number": xtype === 'module' ? {
        ":*:function|string|object": '',
        "mapping::": {}
      } : { // Required key, any name allowed
        ":*:function|string|object": () => {}, // Optional key
        "mapping::": {}
      },
    },
    'drive::object': {
      "::object": {
        "::object": { // Required key, any name allowed
          "raw|$ref:*:object|string": {}, // data or $ref are names, required, object or string are types
          "$ref": "string"
        }
      },
    },
    'net::object': {}
  }

  validate_shape(data, expected_structure)

  function validate_shape (obj, expected, super_node = 'root', path = '') {
    const keys = Object.keys(obj)
    const values = Object.values(obj)
    let strict = Object.keys(expected).length

    const all_keys = []
    Object.entries(expected).forEach(([expected_key, expected_value]) => {
      let [expected_key_names, required, expected_types] = expected_key.split(':')
      expected_types = expected_types ? expected_types.split('|') : [typeof(expected_value)]
      let absent = true
      if(expected_key_names)
        expected_key_names.split('|').forEach(expected_key_name => {
          const value = obj[expected_key_name]
          if(value !== undefined){
            all_keys.push(expected_key_name)
            const type = typeof(value)
            absent = false

            if(expected_types.includes(type))
              type === 'object' && validate_shape(value, expected_value, expected_key_name, path + '/' + expected_key_name)
            else
              throw new Error(`Type mismatch: Expected "${expected_types.join(' or ')}" got "${type}" for key "${expected_key_name}" at:` + path + FALLBACK_POST_ERROR)
          }
        })
      else{
        strict = false
        values.forEach((value, index) => {
          absent = false
          const type = typeof(value)

          if(expected_types.includes(type))
            type === 'object' && validate_shape(value, expected_value, keys[index], path + '/' + keys[index])
          else
            throw new Error(`Type mismatch: Expected "${expected_types.join(' or ')}" got "${type}" for key "${keys[index]}" at: ` + path + FALLBACK_POST_ERROR)
        })
      }
      if(absent && required){
        if(expected_key_names)
          throw new Error(`Can't find required key "${expected_key_names.replace('|', ' or ')}" at: ` + path + FALLBACK_POST_ERROR)
        else
          throw new Error(`No sub-nodes found for super key "${super_node}" at sub: ` + path + FALLBACK_POST_ERROR)
      }
    })

    strict && keys.forEach(key => {
      if(!all_keys.includes(key)){
        throw new Error(`Unknown key detected: '${key}' is an unknown property at: ${path || 'root'}` + FALLBACK_POST_ERROR)
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
    if (raw === undefined){
      let ref_url = $ref
      // Patch: Prepend GitHub project name if running on GitHub Pages
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        const path_parts = window.location.pathname.split('/').filter(Boolean)
        if (path_parts.length > 0 && !$ref.startsWith('/' + path_parts[0])) {
          ref_url = '/' + path_parts[0] + ($ref.startsWith('/') ? '' : '/') + $ref
        }
      }
      const response = await fetch(ref_url)
      if (!response.ok) 
        throw new Error(`Failed to fetch data from '${ref_url}' for '${id}'` + FALLBACK_SYNTAX_POST_ERROR)
      else
        result = await response[xtype === 'json' ? 'json' : 'text']()
    }
    else
      result = raw
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
function verify_imports (id, imports, data) {
  const state_address = imports.find(imp => imp.includes('STATE'))
  HELPER_MODULES.push(state_address)
  imports = imports.filter(imp => !HELPER_MODULES.includes(imp))
  if(!data._){
    if(imports.length > 1){
      imports.splice(imports.indexOf(state_address), 1)
      throw new Error(`No sub-nodes found for required modules "${imports.join(', ')}" in the fallback of "${status.local_statuses[id].module_id}"` + FALLBACK_POST_ERROR)
    }
    else return
  }
  const fallback_imports = Object.keys(data._)

  imports.forEach(imp => {
    let check = true
    fallback_imports.forEach(fallimp => {
      if(imp === fallimp)
        check = false
    })

    if(check)
      throw new Error('Required module "'+imp+'" is not defined in the fallback of '+status.local_statuses[id].module_id + FALLBACK_POST_ERROR)
  })
  
  fallback_imports.forEach(fallimp => {
    let check = true
    imports.forEach(imp => {
      if(imp === fallimp)
        check = false
    })
    
    if(check)
      throw new Error('Module "'+fallimp+'" defined in the fallback of '+status.local_statuses[id].module_id+' is not required')
  })

}
function symbolfy (data) {
  const i2s = {}
  const s2i = {}
  const i2a = {}
  const a2i = {}
  const subs = []
  data.subs && data.subs.forEach(sub => {
    const substate = db.read(['state', sub])
    i2a[a2i[sub] = encode(sub)] = sub
    s2i[i2s[sub] = Symbol(a2i[sub])] = sub
    subs.push({ sid: i2s[sub], type: substate.type })
  })
  return [subs, s2i, i2s, a2i, i2a]
}
function encode(text) {
  let code = ''
  while (code.length < 50) {
    for (let i = 0; i < text.length && code.length < 50; i++) {
      code += Math.floor(10 + Math.random() * 90)
    }
  }
  return code
}
function listfy(tree, prefix = '') {
  if (!tree)
    return []

  const result = []

  function walk(current, prefix = '') {
    for (const key in current) {
      if (key === '$' && current[key]._ && typeof current[key]._ === 'object') {
        walk(current[key]._, prefix)
      } else {
        const path = prefix ? `${prefix}>${key}` : key
        result.push(path)
        if (current[key]?.$?._ && typeof current[key].$._ === 'object') {
          walk(current[key].$._, path)
        }
      }
    }
  }

  if (tree._ && typeof tree._ === 'object') {
    walk(tree._, prefix)
  }

  return result
}
function register_overrides ({overrides, ...args}) {
  recurse(args)
  return overrides
  function recurse ({ tree, path = '', id, xtype = 'instance', local_modulepaths = {} }) {

    tree._ && Object.entries(tree._).forEach(([type, instances]) => {
      const sub_path = path + '>' + type
      Object.entries(instances).forEach(([id, override]) => {
        const resultant_path = id === '$' ? sub_path : sub_path + ':' + id
        if(typeof(override) === 'function'){
          if(overrides[resultant_path]){
            overrides[resultant_path].fun.push(override)
            overrides[resultant_path].by.push(id)
          }
          else
            overrides[resultant_path] = {fun: [override], by: [id]}
        }
        else if ( ['object', 'string'].includes(typeof(override)) && id !== 'mapping' && override._ === undefined)
          status.args[resultant_path] = structuredClone(override)
        else
          recurse({ tree: override, path: sub_path, id, xtype, local_modulepaths })
      })
    })
  }
}
function get_fallbacks ({ fallback, modulename, modulepath, instance_path }) {
  return [mutated_fallback, ...status.overrides[instance_path].fun]
    
  function mutated_fallback () {
    console.log('Args: ', status.args[instance_path])
    const data = fallback(status.args[instance_path], { listfy: tree => listfy(tree, modulepath), tree: status.tree_pointers[modulepath] })

    data.overrider = status.overrides[instance_path].by[0]
    merge_trees(data, modulepath)
    return data

    function merge_trees (data, path) {
      if (data._) {
        Object.entries(data._).forEach(([type, data]) => merge_trees(data, path + '>' + type.split('$')[0].replace('.', '>')))
      } else {
        data.$ = { _: status.tree_pointers[path]?._ }
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
      watch, get_sub, drive: {
        get, has, put, list
      }
    },
    private_api: {
      xget: (id) => db.read(['state', id]),
      get_all: () => db.read_all(['state']),
      get_db,
      register,
      load: (snapshot) => {
        localStorage.clear()
        Object.entries(snapshot).forEach(([key, value]) => {
          db.add([key], JSON.parse(value), true)
        })
        window.location.reload()
      },
      swtch,
      unregister,
      status,
    }
  }
  node_id === status.ROOT_ID && (api.public_api.admin = api.private_api)
  return api

  async function watch (listener, on) {
    if(on)
      status.services[node_id] = Object.keys(on)
    const data = db.read(['state', node_id])
    if(listener){
      status.listeners[data.id] = listener
      await listener(await make_input_map(data.inputs))
    }
    return xtype === 'module' ? local_status.sub_modules : local_status.sub_instances[node_id]
  }
  function get_sub (type) {
    return local_status.subs.filter(sub => {
      const dad = db.read(['state', sub.type])
      return dad.type === type
    })
  }
  function get_db ({ type: dataset_type, name: dataset_name } = {}) {
    const node = db.read(['state', status.ROOT_ID])
    if(dataset_type){
      const dataset_list = []
      node.drive.forEach(dataset_id => {
        const dataset = db.read(['state', dataset_id])
        if(dataset.type === dataset_type)
          dataset_list.push(dataset.name)
      })
      if(dataset_name){
        return recurse(status.ROOT_ID, dataset_type)
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
  function register ({ type: dataset_type, name: dataset_name, dataset}) {
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
    console.log(' registered ' + dataset_name + '.' + dataset_type)
  }
  function unregister ({ type: dataset_type, name: dataset_name } = {}) {
    return recurse(status.ROOT_ID)

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
  function swtch ({ type: dataset_type, name: dataset_name = 'default'}) {
    recurse(dataset_type, dataset_name, status.ROOT_ID)

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
  
  function list (path) {
    const node = db.read(['state', node_id])
    const dataset_names = node.drive.map(dataset_id => {
      return dataset_id.split('.').at(1) + '/'
    })
    if (path) {
      let index
      dataset_names.some((dataset_name, i) => {
        if (path.includes(dataset_name)) {
          index = i
          return true
        }
      })
      if (index === undefined)
        throw new Error(`Dataset "${dataset_name}" not found in node "${node.name}"`) 
      const dataset = db.read(['state', node.drive[index]])
      return dataset.files.map(fileId => {
        const file = db.read(['state', fileId])
        return file.name
      })
    }
    return dataset_names
  }
  async function get (path) {
    console.log(path)
    const [dataset_name, file_name] = path.split('/')
    const node = db.read(['state', node_id])
    let dataset
    if(!node.drive)
      throw new Error(`Node ${node.id} has no drive defined in the fallback` + FALLBACK_POST_ERROR)
    node.drive.some(dataset_id => {
      if (dataset_name === dataset_id.split('.').at(1)) {
        dataset = db.read(['state', dataset_id])
        return true
      }
    })
    if (!dataset) 
      throw new Error(`Dataset "${dataset_name}" not found in node "${node.name}"`)
    
    let target_file
    for (const file_id of dataset.files) {
      const file = db.read(['state', file_id])
      if (file.name === file_name) {
        target_file =  { id: file.id, name: file.name, type: file.type, raw: await get_input(file)}
        break
      }
    }
    if (!target_file)
      throw new Error(`File "${path}" not found`)
    return target_file
  }
  function put (path, buffer) {
    const [dataset_name, filename] = path.split('/')
    let dataset
    const node = db.read(['state', node_id])
    node.drive.some(dataset_id => {
      if (dataset_name === dataset_id.split('.').at(1)) {
        dataset = db.read(['state', dataset_id])
        return true
      }
    })
    if (!dataset) 
      throw new Error(`Dataset "${dataset_name}" not found in node "${node.name}"`)
    const type = filename.split('.').pop()
    let file_id = filename
    let count = 1
    while (db.read(['state', file_id])) {
      file_id = `${filename}:${count++}`
    }
    const file = {
      id: file_id,
      name: filename,
      type,
      raw: buffer
    }
    db.add(['state', file_id], file)
    dataset.files.push(file_id)
    db.add(['state', dataset.id], dataset)
    return { id: file_id, name: filename, type, raw: buffer }
  }
  function has (path) {
    const [dataset_name, filename] = path.split('/')
    let dataset
    const node = db.read(['state', node_id])
    node.drive.some(dataset_id => {
      if (dataset_name === dataset_id.split('.').at(1)) {
        dataset = db.read(['state', dataset_id])
        return true
      }
    })
    if (!dataset) 
      throw new Error(`Dataset "${dataset_name}" not found in node "${node.name}"`)
    return dataset.files.some(file_id => {
      const file = db.read(['state', file_id])
      return file && file.name === filename
    })
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
        files.push(dataset.id.split('.').at(1) + '/' + input_state.name)
      }))
      input_map.push({ type: dataset.type, paths: files })
    }))
  }
  return input_map
}


module.exports = STATE
},{"io":5,"localdb":6}],2:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = action_bar

const quick_actions = require('quick_actions')
async function action_bar(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = {
    style: style_inject,
    icons: iconject
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  shadow.innerHTML = `
  <div class="action-bar-container">
    <div class="command-history">
      <button class="icon-btn"></button>
    </div>
    <div class="quick-actions">
      <quick-actions></quick-actions>
    </div>
  </div>`

  const history_icon = shadow.querySelector('.icon-btn')
  const quick_placeholder = shadow.querySelector('quick-actions')
  let console_icon = {}
  const subs = await sdb.watch(onbatch)

  let send = null
  let _ = null
  if(protocol){
    send = protocol(msg => onmessage(msg))
    _ = { up: send, send_quick_actions: null }
  }

  history_icon.innerHTML = console_icon
  history_icon.onclick = onhistory
  const element = protocol ? await quick_actions(subs[0], quick_actions_protocol) : await quick_actions(subs[0])
  element.classList.add('replaced-quick-actions')
  quick_placeholder.replaceWith(element)
  return el

  async function onbatch (batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function style_inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function iconject(data) {
    console_icon = data[0]
  }
  function onhistory() {
    _.up({ type: 'console_history_toggle', data: null })
  }
  // ---------
  // PROTOCOLS  
  // ---------
  function quick_actions_protocol (send) {
    _.send_quick_actions = send
    return on
    function on ({ type, data }) {
      _.up({ type, data })
    }
  }
  
  function onmessage ({ type, data }) {
    _.send_quick_actions({ type, data })
  }
}

function fallback_module() {
  return {
    api: fallback_instance,
    _: {
      'quick_actions': {
        $: ''
      }
    }
  }
  function fallback_instance() {
    return {
      _: {
        'quick_actions': {
          0: '',
          mapping: {
            'style': 'style',
            'icons': 'icons',
            'actions': 'actions',
            'hardcons': 'hardcons'
          }
        }
      },
      drive: {
        'icons/': {
          'console.svg': {
            '$ref': 'console.svg'
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .action-bar-container {
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                background: #131315;
                padding: 8px;
                gap: 12px;
              }
              .command-history {
                display: flex;
                align-items: center;
              }
              .quick-actions {
                display: flex;
                flex: auto;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                min-width: 300px;
              }
              .replaced-quick-actions {
                display: flex;
                flex: auto;
              }
              .icon-btn {
                display: flex;
                min-width: 32px;
                height: 32px;
                border: none;
                background: transparent;
                cursor: pointer;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                padding: 6px;
                border-radius: 6px;
                color: #a6a6a6;
              }
              .icon-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              svg {
                width: 20px;
                height: 20px;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/action_bar/action_bar.js")
},{"STATE":1,"quick_actions":8}],3:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = actions

async function actions(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  
  const on = {
    style: inject_style,
    actions: onactions,
    icons: iconject,
    hardcons: onhardcons
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  shadow.innerHTML = `
  <div class="actions-container">
    <div class="actions-menu"></div>
  </div>`

  const actions_menu = shadow.querySelector('.actions-menu')
  
  let init = false
  let actions = []
  let icons = {}
  let hardcons = {}
  let is_visible = false

  const subs = await sdb.watch(onbatch)
  let send = null
  let _ = null
  if (protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send }
  }

  return el

  function onmessage ({ type, data }) {
    switch (type) {
      case 'filter_actions':
        filter(data)
        break
      case 'send_selected_action':
        send_selected_action(data)
        break
      default:
        fail(data, type)
    }
  }
  
  function send_selected_action (msg) {
    _.up({ type: 'selected_action', data: msg.data })
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
    if (!init) {
      create_actions_menu()
      init = true
    }
  }

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function iconject(data) {
    icons = data
  }

  function onhardcons(data) {
    hardcons = {
      pin: data[0],
      unpin: data[1],
      default: data[2],
      undefault: data[3]
    }
  }

  function onactions(data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    actions = vars
  }

  function create_actions_menu() {
    actions_menu.innerHTML = ''
    actions.forEach(create_action_item)
  }

  function create_action_item(action_data, index) {
    const action_item = document.createElement('div')
    action_item.classList.add('action-item')
    
    const icon = icons[index]
    
    action_item.innerHTML = `
    <div class="action-icon">${icon}</div>
    <div class="action-name">${action_data.action}</div>
    <div class="action-pin">${action_data.pin ? hardcons.pin : hardcons.unpin}</div>
    <div class="action-default">${action_data.default ? hardcons.default : hardcons.undefault}</div>`
    action_item.onclick = onaction
    actions_menu.appendChild(action_item)

    function onaction() {
      send_selected_action({ data: action_data })
    }
  }

  function filter(search_term) {
    const items = shadow.querySelectorAll('.action-item')
    items.forEach(item => {
      const action_name = item.children[1].innerText.toLowerCase()
      const matches = action_name.includes(search_term.toLowerCase())
      item.style.display = matches ? 'flex' : 'none'
    })
  }
}

function fallback_module() {
  return {
    api: fallback_instance
  }

  function fallback_instance() {
    return {
      drive: {
        'actions/': {
          'commands.json': {
            raw: JSON.stringify([
              {
                action: 'New File',
                pinned: true,
                default: true,
                icon: 'file'
              },
              {
                action: 'Open File',
                pinned: false,
                default: true,
                icon: 'folder'
              },
              {
                action: 'Save File',
                pinned: true,
                default: false,
                icon: 'save'
              },
              {
                action: 'Settings',
                pinned: false,
                default: true,
                icon: 'gear'
              },
              {
                action: 'Help',
                pinned: false,
                default: false,
                icon: 'help'
              },
              {
                action: 'Terminal',
                pinned: true,
                default: true,
                icon: 'terminal'
              },
              {
                action: 'Search',
                pinned: false,
                default: true,
                icon: 'search'
              }
            ])
          }
        },
        'icons/': {
          'file.svg': {
            '$ref': 'icon.svg'
          },
          'folder.svg': {
            '$ref': 'icon.svg'
          },
          'save.svg': {
            '$ref': 'icon.svg'
          },
          'gear.svg': {
            '$ref': 'icon.svg'
          },
          'help.svg': {
            '$ref': 'icon.svg'
          },
          'terminal.svg': {
            '$ref': 'icon.svg'
          },
          'search.svg': {
            '$ref': 'icon.svg'
          }
        },
        'hardcons/': {
          'pin.svg': {
            '$ref': 'pin.svg'
          },
          'unpin.svg': {
            '$ref': 'unpin.svg'
          },
          'default.svg': {
            '$ref': 'default.svg'
          },
          'undefault.svg': {
            '$ref': 'undefault.svg'
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .actions-container {
                position: relative;
                top: 0;
                left: 0;
                right: 0;
                background: #202124;
                border: 1px solid #3c3c3c;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                z-index: 1;
                max-height: 400px;
                overflow-y: auto;
                color: #e8eaed;
              }
              
              .actions-menu {
                padding: 8px 0;
              }
              
              .action-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #3c3c3c;
                transition: background-color 0.2s ease;
              }
              
              .action-item:hover {
                background-color: #2d2f31;
              }
              
              .action-item:last-child {
                border-bottom: none;
              }
              
              .action-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #a6a6a6;
              }
              
              .action-name {
                flex: 1;
                font-size: 14px;
                color: #e8eaed;
              }
              
              .action-pin .action-default{
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                font-size: 12px;
                opacity: 0.7;
                color: #a6a6a6;
              }
              
              svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/actions/actions.js")
},{"STATE":1}],4:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = console_history

async function console_history (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject_style,
    commands: oncommands,
    icons: iconject
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="console-history-container">
    <div class="console-menu">
      <console-commands></console-commands>
    </div>
  </div>`

  const commands_placeholder = shadow.querySelector('console-commands')
  
  let init = false
  let commands = []
  let dricons = []

  const subs = await sdb.watch(onbatch)
  let send = null
  let _ = null
  if(protocol){
    send = protocol(msg => onmessage(msg))
    _ = { up: send }
  }
  return el

  function onmessage ({ type, data }) {
    console.log(`[space->console_history]`, type, data)
  }

  function create_command_item (command_data) {
    const command_el = document.createElement('div')
    command_el.className = 'command-item'

    const icon_html = dricons[command_data.icon_type] || ''
    const linked_icon_html = command_data.linked.is ? (dricons[command_data.linked.icon_type] || '') : ''

    let action_html = ''
    action_html += command_data.can_restore ? '<div class="action-icon">' + (dricons.restore || '') + '</div>' : ''
    action_html += command_data.can_delete ? '<div class="action-icon">' + (dricons.delete || '') + '</div>' : ''
    action_html += command_data.action ? '<div class="action-text">' + command_data.action + '</div>' : ''

    command_el.innerHTML = `
    <div class="command-content">
    <div class="command-icon">${icon_html}</div>
    <div class="command-info">
      <div class="command-path">${command_data.name_path}</div>
    </div>
    ${command_data.linked.is
      ? `<div class="linked-info">
          <span class="command-separator">---&gt;</span>
          <div class="linked-icon">${linked_icon_html}</div>
          <div class="linked-name">${command_data.linked.name}</div>
        </div>`
      : ''}
      ${action_html
        ? `<div class="command-actions">${action_html}</div>`
        : ''}
        <div class="command-name">${command_data.command}</div>
      </div>`

    command_el.onclick = function () {
      _.up({ type: 'command_clicked', data: command_data })
    }

    return command_el
  }
  function render_commands () {
      const commands_container = document.createElement('div')
      commands_container.className = 'commands-list'
      
      commands.forEach((command, index) => {
        const command_item = create_command_item(command, index)
        commands_container.appendChild(command_item)
      })
      
      commands_placeholder.replaceWith(commands_container)
      init = true
  }
  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
    if (!init && commands.length > 0) {
      render_commands()
    }
  }

  function fail (data, type) { 
    throw new Error('invalid message', { cause: { data, type } }) 
  }

  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function oncommands (data) {
    const commands_data = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    commands = commands_data
  }

  function iconject (data) {
    dricons = {
      file: data[0] || '',
      bulb: data[1] || '',
      restore: data[2] || '',
      delete: data[3] || '' 
    }
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance () {
    return {
      drive: {
        'commands/': {
          'list.json': {
            '$ref': 'commands.json'
          }
        },
        'icons/': {
          'file.svg': {
            raw: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 1H3.5C3.10218 1 2.72064 1.15804 2.43934 1.43934C2.15804 1.72064 2 2.10218 2 2.5V13.5C2 13.8978 2.15804 14.2794 2.43934 14.5607C2.72064 14.8420 3.10218 15 3.5 15H12.5C12.8978 15 13.2794 14.8420 13.5607 14.5607C13.8420 14.2794 14 13.8978 14 13.5V5.5L9.5 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 1V5.5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
          },
          'bulb.svg': {
            raw: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1C6.4087 1 4.88258 1.63214 3.75736 2.75736C2.63214 3.88258 2 5.4087 2 7C2 8.5913 2.63214 10.1174 3.75736 11.2426C4.88258 12.3679 6.4087 13 8 13C9.5913 13 11.1174 12.3679 12.2426 11.2426C13.3679 10.1174 14 8.5913 14 7C14 5.4087 13.3679 3.88258 12.2426 2.75736C11.1174 1.63214 9.5913 1 8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6.5 14H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
          },
          'restore.svg': {
            raw: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
            </svg>`
          },
          'delete.svg': {
            raw: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92H4.885a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.528ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Zm2.522.47a.5.5 0 0 1 .528.47l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .47-.528Z"/>
            </svg>`
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .console-history-container {
                position: relative;
                width: 100%; /* Or a specific width based on images */
                background: #202124;
                border: 1px solid #3c3c3c;
                Set box-sizing property to border-box:
                box-sizing: border-box;
                -moz-box-sizing: border-box;
                -webkit-box-sizing: border-box;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                z-index: 1;
                max-height: 400px;
                overflow-y: auto;
                color: #e8eaed;
              }

              .console-menu {
                padding: 0px;
              }

              .commands-list {
                display: flex;
                flex-direction: column;
                gap: 0px;
              }

              .command-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                background: transparent;
                border-bottom: 1px solid #3c3c3c;
                cursor: pointer;
                transition: background-color 0.2s ease;
              }

              .command-item:last-child {
                border-bottom: none;
              }

              .command-item:hover {
                background: #282a2d;
              }

              .command-content {
                display: flex;
                align-items: center;
                width: 100%;
                gap: 10px; /* Adjusted gap */
              }

              .command-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #969ba1;
              }

              .command-icon svg {
                width: 16px;
                height: 16px;
              }

              .command-info {
                display: flex; /* Use flex to align name and path */
                align-items: center; /* Vertically align items if they wrap */
                gap: 8px; /* Gap between name and path */
                min-width: 0; /* Prevent overflow issues with flex items */
              }

              .command-name {
                font-size: 13px;
                font-weight: 400;
                color: #e8eaed;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .command-path {
                font-size: 13px;
                color: #969ba1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              
              .command-separator {
                color: #969ba1;
                margin: 0 4px;
                font-size: 13px;
              }

              .linked-info {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-grow: 1; /* Allow info to take available space */

              }

              .linked-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                color: #fbbc04; 
              }

              .linked-icon svg {
                width: 14px;
                height: 14px;
              }

              .linked-name {
                font-size: 13px;
                color: #fbbc04;
                font-weight: 400;
                white-space: nowrap;
              }

              .command-actions {
                display: flex;
                align-items: center;
                gap: 10px; /* Adjusted gap */
                margin-left: auto; /* Pushes actions to the right */
              }

              .action-text {
                font-size: 13px;
                color: #969ba1;
                white-space: nowrap;
              }

              .action-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                color: #969ba1;
                cursor: pointer;
              }

              .action-icon:hover {
                color: #e8eaed;
              }

              .action-icon svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/console_history/console_history.js")
},{"STATE":1}],5:[function(require,module,exports){
const taken = {}

module.exports = io
function io(seed, alias) {
  if (taken[seed]) throw new Error(`seed "${seed}" already taken`)
  // const pk = seed.slice(0, seed.length / 2)
  // const sk = seed.slice(seed.length / 2, seed.length)
  const self = taken[seed] = { id: seed, alias, peer: {} }
  const io = { at, on }
  return io

  async function at (id, signal = AbortSignal.timeout(1000)) {
    if (id === seed) throw new Error('cannot connect to loopback address')
    if (!self.online) throw new Error('network must be online')
    const peer = taken[id] || {}
    // if (self.peer[id] && peer.peer[pk]) {
    //   self.peer[id].close() || delete self.peer[id]
    //   peer.peer[pk].close() || delete peer.peer[pk]
    //   return console.log('disconnect')
    // }
    // self.peer[id] = peer
    if (!peer.online) return wait() // peer with id is offline or doesnt exist
    return connect()
    function wait () {
      const { resolve, reject, promise } = Promise.withResolvers()
      signal.onabort = () => reject(`timeout connecting to "${id}"`)
      peer.online = { resolve }
      return promise.then(connect)
    }
    function connect () {
      signal.onabort = null
      const { port1, port2 } = new MessageChannel()
      port2.by = port1.to = id
      port2.to = port1.by = seed
      self.online(self.peer[id] = port1)
      peer.online(peer.peer[seed] = port2)
      return port1
    }
  }
  function on (online) { 
    if (!online) return self.online = null
    const resolve = self.online?.resolve
    self.online = online
    if (resolve) resolve(online)
  }
}
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
const editor = require('quick_editor')

module.exports = create_component_menu
async function create_component_menu (opts, names, inicheck, callbacks) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject
  }
  const {
    on_checkbox_change,
    on_label_click,
    on_select_all_toggle
  } = callbacks

  const checkobject = {}
  inicheck.forEach(i => {
    checkobject[i - 1] = true
  })
  const all_checked = inicheck.length === 0 || Object.keys(checkobject).length === names.length

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="nav-bar-container-inner main">
    <div class="nav-bar">
      <button class="menu-toggle-button">☰ MENU</button>
      <div class="menu hidden">
        <div class="menu-header">
          <button class="unselect-all-button">${all_checked ? 'Unselect All' : 'Select All'}</button>
        </div>
        <ul class="menu-list"></ul>
      </div>
    </div>
  </div>
  <style>
  </style>
  `
  const style = shadow.querySelector('style')
  const main = shadow.querySelector('.main')
  const menu = shadow.querySelector('.menu')
  const toggle_btn = shadow.querySelector('.menu-toggle-button')
  const unselect_btn = shadow.querySelector('.unselect-all-button')
  const list = shadow.querySelector('.menu-list')

  main.append(editor(style, inject))

  names.forEach((name, index) => {
    const is_checked = all_checked || checkobject[index] === true
    const menu_item = document.createElement('li')
    menu_item.className = 'menu-item'
    menu_item.innerHTML = `
      <span data-index="${index}" data-name="${name}">${name}</span>
      <input type="checkbox" data-index="${index}" ${is_checked ? 'checked' : ''}>
    `
    list.appendChild(menu_item)

    const checkbox = menu_item.querySelector('input')
    const label = menu_item.querySelector('span')

    checkbox.onchange = (e) => {
      on_checkbox_change({ index, checked: e.target.checked })
    }

    label.onclick = () => {
      on_label_click({ index, name })
      menu.classList.add('hidden')
    }
  })
  // event listeners
  const subs = await sdb.watch(onbatch)
  toggle_btn.onclick = on_toggle_btn
  unselect_btn.onclick = on_unselect_btn
  document.onclick = handle_document_click

  return el

  function on_toggle_btn (e) {
    e.stopPropagation()
    menu.classList.toggle('hidden')
  }

  function on_unselect_btn () {
    const select_all = unselect_btn.textContent === 'Select All'
    unselect_btn.textContent = select_all ? 'Unselect All' : 'Select All'
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = select_all })
    on_select_all_toggle({ selectAll: select_all })
  }

  function handle_document_click (e) {
    const path = e.composedPath()
    if (!menu.classList.contains('hidden') && !path.includes(el)) {
      menu.classList.add('hidden')
    }
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject (data) {
    style.innerHTML = data.join('\n')
  }
}
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'quick_editor': 0
    }
  }
  function fallback_instance () {
    return {
      drive: {
        'style/': {
          'theme.css': {
            raw: `
            :host {
              display: block;
              position: sticky;
              top: 0;
              z-index: 100;
              background-color: #e0e0e0;
            }

            .nav-bar-container-inner {
            }

            .nav-bar {
              display: flex;
              position: relative;
              justify-content: center;
              align-items: center;
              padding: 10px 20px;
              border-bottom: 2px solid #333;
              min-height: 30px;
            }

            .menu-toggle-button {
              padding: 10px;
              background-color: #e0e0e0;
              border: none;
              cursor: pointer;
              border-radius: 5px;
              font-weight: bold;
            }

            .menu-toggle-button:hover {
              background-color: #d0d0d0;
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
              width: 250px;
              max-width: 90%;
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              z-index: 101;
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

            .unselect-all-button:hover {
              background-color: #c0c0c0;
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
              width: 8px;
            }

            .menu-list::-webkit-scrollbar-track {
              background: #f0f0f0;
            }

            .menu-list::-webkit-scrollbar-thumb {
              background: #ccc;
              border-radius: 4px;
            }

            .menu-list::-webkit-scrollbar-thumb:hover {
              background: #bbb;
            }

            .menu-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 5px;
              border-bottom: 1px solid #ccc;
            }

            .menu-item span {
              cursor: pointer;
              flex-grow: 1;
              margin-right: 10px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .menu-item span:hover {
              color: #007bff;
            }

            .menu-item:last-child {
              border-bottom: none;
            }

            .menu-item input[type="checkbox"] {
              flex-shrink: 0;
            }`
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/menu.js")
},{"STATE":1,"quick_editor":9}],8:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = quick_actions

async function quick_actions(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  
  const on = {
    style: inject,
    icons: iconject,
    hardcons: onhardcons,
    actions: onactions
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  
  
  shadow.innerHTML = `
    <div class="quick-actions-container">
      <div class="default-actions"></div>
      <div class="text-bar" role="button"></div>
      <div class="input-wrapper" style="display: none;">
        <div class="input-display">
          <span class="slash-prefix">/</span>
          <span class="command-text"></span>
          <input class="input-field" type="text" placeholder="Type to search actions...">
        </div>
        <button class="submit-btn" style="display: none;"></button>
        <button class="close-btn"></button>
      </div>
    </div>
  `
  const default_actions = shadow.querySelector('.default-actions')
  const text_bar = shadow.querySelector('.text-bar')
  const input_wrapper = shadow.querySelector('.input-wrapper')
  const slash_prefix = shadow.querySelector('.slash-prefix')
  const command_text = shadow.querySelector('.command-text')
  const input_field = shadow.querySelector('.input-field')
  const submit_btn = shadow.querySelector('.submit-btn')
  const close_btn = shadow.querySelector('.close-btn')

  let init = false
  let icons = {}
  let hardcons = {}
  let defaults = []
  let is_input_active = false
  let selected_action = null
  
  let send = null
  let _ = null
  if(protocol){
    send = protocol(msg => onmessage(msg))
    _ = { up: send }
  }
  text_bar.onclick = activate_input_field
  close_btn.onclick = deactivate_input_field
  submit_btn.onclick = onsubmit
  input_field.oninput = oninput

  const subs = await sdb.watch(onbatch)
  submit_btn.innerHTML = hardcons.submit
  close_btn.innerHTML = hardcons.cross
  return el

  function onmessage ({ type, data }) {
    if (type === 'selected_action') {
      select_action(data)
    }
  }
  function activate_input_field() {
    is_input_active = true
    
    default_actions.style.display = 'none'
    text_bar.style.display = 'none'
    
    input_wrapper.style.display = 'flex'
    input_field.focus()
    
    _.up({ type: 'display_actions', data: 'block' })
  }

  function onsubmit() {
    if (selected_action) {
      console.log('Selected action submitted:', selected_action)
      _.up({ type: 'action_submitted', data: selected_action })
    }
  }
  function oninput(e) {
    _.up({ type: 'filter_actions', data: e.target.value })
  }
  function deactivate_input_field() {
    is_input_active = false
    
    default_actions.style.display = 'flex'
    text_bar.style.display = 'flex'
    
    input_wrapper.style.display = 'none'
    
    input_field.value = ''
    selected_action = null
    update_input_display()
    
    _.up({ type: 'display_actions', data: 'none' })
  }
  function select_action(action) {
    selected_action = action
    update_input_display(selected_action)
  }

  function update_input_display(selected_action = null) {
    if (selected_action) {
      slash_prefix.style.display = 'inline'
      command_text.style.display = 'inline'
      command_text.textContent = `"${selected_action.action}"`
      input_field.style.display = 'none'
      submit_btn.style.display = 'flex'
    } else {
      slash_prefix.style.display = 'none'
      command_text.style.display = 'none'
      input_field.style.display = 'block'
      submit_btn.style.display = 'none'
      input_field.placeholder = 'Type to search actions...'
    }
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
    if(!init) {
      create_default_actions(defaults)
      init = true
    } else {
      //TODO: update actions
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  function onhardcons(data) {
    hardcons = {
      submit: data[0],
      cross: data[1]
    }
  }
  function iconject(data) {
    icons = data
  }

  function onactions(data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    defaults = vars
  }

  function create_default_actions (actions) {
    default_actions.innerHTML = ''
    actions.forEach(action => {
      const btn = document.createElement('div')
      btn.classList.add('action-btn')
      btn.innerHTML = icons[action.icon]
      default_actions.appendChild(btn)
    })
    
    if (icons['close'] || icons['5']) {
      close_btn.innerHTML = icons['close'] || icons['4']
    } else {
      close_btn.innerHTML = '✕'
    }
  }
}

function fallback_module() {
  return {
    api: fallback_instance
  }

  function fallback_instance() {
    return {
      drive: {
        'icons/': {
          '0.svg': {
            '$ref': 'action1.svg'
          },
          '1.svg': {
            '$ref': 'action2.svg'
          },
          '2.svg': {
            '$ref': 'action1.svg'
          },
          '3.svg': {
            '$ref': 'action2.svg'
          },
          '4.svg': {
            '$ref': 'action1.svg'
          }
        },
        'hardcons/': {
          'submit.svg': {
            '$ref': 'submit.svg'
          },
          'close.svg': {
            '$ref': 'cross.svg'
          }
        },
        'actions/': {
          'default.json': {
            raw: JSON.stringify([
              {
                name: 'New',
                icon: '0',
              },
              {
                name: 'Settings',
                icon: '1',
              },
              {
                name: 'Help',
                icon: '2',
              },
              {
                name: 'About',
                icon: '3',
              },
              {
                name: 'Exit',
                icon: '4',
              }
            ])
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .quick-actions-container {
                display: flex;
                flex: auto;
                flex-direction: row;
                align-items: center;
                background: #191919;
                border-radius: 20px;
                padding: 4px;
                gap: 8px;
                min-width: 200px;
              }
              .default-actions {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 4px;
                padding: 0 4px;
              }
              .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: #a6a6a6;
              }
              .action-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              .text-bar {
                flex: 1;
                min-height: 32px;
                border-radius: 16px;
                background: #131315;
                cursor: pointer;
                user-select: none;
              }
              .text-bar:hover {
                background: #1a1a1c;
              }
              .input-wrapper {
                display: flex;
                flex: 1;
                align-items: center;
                background: #131315;
                border-radius: 16px;
                border: 1px solid #3c3c3c;
                padding-right: 4px;
              }
              .input-wrapper:focus-within {
                border-color: #4285f4;
                background: #1a1a1c;
              }
              .input-display {
                display: flex;
                flex: 1;
                align-items: center;
                padding: 0 12px;
                min-height: 32px;
              }
              .slash-prefix {
                color: #a6a6a6;
                font-size: 14px;
                margin-right: 4px;
                display: none;
              }
              .command-text {
                color: #e8eaed;
                font-size: 14px;
                background: #2d2d2d;
                border: 1px solid #4285f4;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                display: none;
              }
              .input-field {
                flex: 1;
                min-height: 32px;
                background: transparent;
                border: none;
                color: #e8eaed;
                padding: 0 12px;
                font-size: 14px;
                outline: none;
              }
              .input-field::placeholder {
                color: #a6a6a6;
              }
              .submit-btn {
                display: none;
                align-items: center;
                justify-content: center;
                background: #ffffff00;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: white;
                min-width: 32px;
                height: 32px;
                margin-right: 4px;
                font-size: 12px;
              }
              .submit-btn:hover {
                background: #ffffff00;
              }
              .close-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 6px;
                border-radius: 50%;
                cursor: pointer;
                color: #a6a6a6;
                min-width: 32px;
                height: 32px;
              }
              .close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              svg {
                width: 16px;
                height: 16px;
              }
            `
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/quick_actions/quick_actions.js")
},{"STATE":1}],9:[function(require,module,exports){
module.exports = editor
let count = 0
let first = true
const els = []
const els_data = []

function toggle () {
  els.forEach((el, i) => {
    if(el.innerHTML){
      els_data[i].text = el.querySelector('textarea').value
      el.replaceChildren('')
    }
    else
      el.replaceChildren(...init(els_data[i], el).children)
  })
}
function editor (style, inject, drive) {
  if(first){
      first = false
      return toggle
  }
  const el = document.createElement('div')
  el.classList.add('quick-editor')
  els.push(el)
  els_data.push({style, inject, drive})
  return el
}

function init ({ style, inject, drive, text }, el) {
  
  el.innerHTML = `
      <button class="dots-button">⋮</button>
      <div class="quick-menu hidden">
        <textarea placeholder="Type here..."></textarea>
        <button class="apply-button">Apply</button>
      </div>
    
    <style>
      .main {
        position: relative;
        overflow: visible;
      }
      .main:hover {
        margin-right: 20px;
      }
      .main:hover::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        border: 4px solid skyblue;
        pointer-events: none;
        z-index: 4;
      }
      .main:hover .quick-editor {
        display: block;
      }
      .quick-editor {
        display: none;
        position: absolute;
        top: -5px;
        right: -10px;
        z-index: 5;
      }

      .quick-editor .dots-button {
        border: none;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        background-color: white;
        letter-spacing: 1px;
        padding: 3px 5px;
        border-radius: 20%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .quick-editor .quick-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        white-space: nowrap;
        z-index: 10;
      }

      .quick-editor .quick-menu textarea {
        width: 300px;
        height: 400px;
        resize: vertical;
      }

      .quick-editor .hidden {
        display: none;
      }
      .quick-editor .apply-button {
        display: block;
        margin-top: 10px;
        padding: 5px 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    </style>
  `
  const btn = el.querySelector('.dots-button')
  const menu = el.querySelector('.quick-menu')
  const textarea = el.querySelector('textarea')
  const applyBtn = el.querySelector('.apply-button')

  btn.addEventListener('click', (e) => {
    menu.classList.toggle('hidden')
    textarea.value = text || style.innerHTML
    // Auto reposition to avoid overflow
    const rect = menu.getBoundingClientRect()
    const overflowRight = rect.right > window.innerWidth
    const overflowLeft = rect.left < 0

    if (overflowRight) {
      menu.style.left = 'auto'
      menu.style.right = '0'
    } else if (overflowLeft) {
      menu.style.left = '0'
      menu.style.right = 'auto'
    } else {
      menu.style.left = '0'
      menu.style.right = 'auto'
    }
  })

  applyBtn.addEventListener('click', apply)

  textarea.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      apply()
    }
  })

  return el

  function apply() {
    if (style && textarea) {
      inject([textarea.value])
    }
  }
}
},{}],10:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const console_history = require('console_history')
const actions = require('actions')
const tabbed_editor = require('tabbed_editor')

module.exports = component

async function component (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="space">
    <actions-placeholder></actions-placeholder>
    <tabbed-editor-placeholder></tabbed-editor-placeholder>
    <console-history-placeholder></console-history-placeholder>
  </div>`

  const actions_placeholder = shadow.querySelector('actions-placeholder')
  const tabbed_editor_placeholder = shadow.querySelector('tabbed-editor-placeholder')
  const console_placeholder = shadow.querySelector('console-history-placeholder')
  let console_history_el = null
  let actions_el = null
  let tabbed_editor_el = null

  const subs = await sdb.watch(onbatch)
  let send = null
  let _ = null
  if(protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send, actions: null, send_console_history: null, send_tabbed_editor: null }
  }
  
  actions_el = protocol ? await actions(subs[1], actions_protocol) : await actions(subs[1])
  actions_el.classList.add('actions')
  actions_placeholder.replaceWith(actions_el)
  
  tabbed_editor_el = protocol ? await tabbed_editor(subs[2], tabbed_editor_protocol) : await tabbed_editor(subs[2])
  tabbed_editor_el.classList.add('tabbed-editor')
  tabbed_editor_placeholder.replaceWith(tabbed_editor_el)
  
  console_history_el = protocol ? await console_history(subs[0], console_history_protocol) : await console_history(subs[0])
  console_history_el.classList.add('console-history')
  console_placeholder.replaceWith(console_history_el)
  let console_view = false
  let actions_view = false
  let tabbed_editor_view = true

  if (protocol) {
    console_history_el.style.setProperty('display', 'none')
    actions_el.style.setProperty('display', 'none')
    tabbed_editor_el.style.setProperty('display', 'block')
  }

  return el
  
  function console_history_toggle_view () { 
    if(console_view) console_history_el.style.setProperty('display', 'none')
    else console_history_el.style.setProperty('display', 'block')
    console_view = !console_view
  }
  function actions_toggle_view (data) {
    if(actions_view) actions_el.style.setProperty('display', data)
    else actions_el.style.setProperty('display', data)
    actions_view = !actions_view
  }

  function tabbed_editor_toggle_view (show = true) {
    if (show) {
      tabbed_editor_el.style.setProperty('display', 'block')
      actions_el.style.setProperty('display', 'none')
      console_history_el.style.setProperty('display', 'none')
      tabbed_editor_view = true
      actions_view = false
      console_view = false
    } else {
      tabbed_editor_el.style.setProperty('display', 'none')
      tabbed_editor_view = false
    }
  } 

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  
  // ---------
  // PROTOCOLS
  // ---------

  function console_history_protocol (send) {
    _.send_console_history = send
    return on
    function on ({ type, data }) { 
      _.up(type, data)
    }
  }
  
  function actions_protocol (send) {
    _.send_actions = send
    return on
    function on ({ type, data }) { 
      _.up({ type, data })
    }
  }
  
  function tabbed_editor_protocol (send) {
    _.send_tabbed_editor = send
    return on
    function on ({ type, data }) { 
      _.up({ type, data })
    }
  }
  
  function onmessage ({ type, data }) {
    if(type == 'console_history_toggle') console_history_toggle_view()
    else if (type == 'display_actions') actions_toggle_view(data)
    else if (type == 'filter_actions') _.send_actions({ type, data })
    else if (type == 'tab_name_clicked') {
      tabbed_editor_toggle_view(true)
      if (_.send_tabbed_editor) {
        _.send_tabbed_editor({ type: 'toggle_tab', data })
      }
    }
    else if (type == 'tab_close_clicked') {
      if (_.send_tabbed_editor) {
        _.send_tabbed_editor({ type: 'close_tab', data })
      }
    }
    else if (type == 'switch_tab') {
      tabbed_editor_toggle_view(true)
      if (_.send_tabbed_editor) {
        _.send_tabbed_editor({ type, data })
      }
    }
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'console_history': {
        $: ''
      },
      'actions': {
        $: ''
      },
      'tabbed_editor': {
        $: ''
      }
    }
  }

  function fallback_instance () {
    return {
      _: {
        'console_history': {
          0: '',
          mapping: {
            'style': 'style',
            'commands': 'commands',
            'icons': 'icons',
            'scroll': 'scroll'
          }
        },
        'actions': {
          0: '',
          mapping: {
            'style': 'style',
            'actions': 'actions',
            'icons': 'icons',
            'hardcons': 'hardcons'
          }
        },
        'tabbed_editor': {
          0: '',
          mapping: {
            'style': 'style',
            'files': 'files',
            'highlight': 'highlight',
            'active_tab': 'active_tab'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .space {
                display: grid;
                grid-template-rows: 1fr auto auto;
                min-height: 200px;
                width: 100;
                height: 100;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
                position: relative;
                gap: 8px;
                padding: 8px;
              }
              .console-history {
                grid-row: 3;
                position: relative;
                width: 100%;
                background-color: #161b22;
                border: 1px solid #21262d;
                border-radius: 6px;
                min-height: 120px;
              }
              .actions {
                grid-row: 2;
                position: relative;
                width: 100%;
                background-color: #161b22;
                border: 1px solid #21262d;
                border-radius: 6px;
                min-height: 60px;
              }
              .tabbed-editor {
                grid-row: 1;
                position: relative;
                width: 100%;
                min-height: 250px;
                background-color: #0d1117;
                border: 1px solid #21262d;
                border-radius: 6px;
                overflow: hidden;
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/space.js")
},{"STATE":1,"actions":3,"console_history":4,"tabbed_editor":11}],11:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = tabbed_editor

async function tabbed_editor(opts, protocol) {
  const { sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = {
    style: inject_style,
    files: onfiles,
    highlight: onhighlight,
    active_tab: onactivetab
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="tabbed-editor">
    <div class="editor-content">
      <div class="editor-placeholder">
        <div class="placeholder-text">Select a file to edit</div>
      </div>
    </div>
  </div>`

  const editor_content = shadow.querySelector('.editor-content')
  const placeholder = shadow.querySelector('.editor-placeholder')

  let init = false
  let files = {}
  let highlight_rules = {}
  let active_tab = null
  let current_editor = null

  let send = null
  let _ = null
  if (protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send }
  }

  const subs = await sdb.watch(onbatch)

  return el

  function onmessage({ type, data }) {
    switch (type) {
      case 'switch_tab':
        switch_to_tab(data)
        break
      case 'close_tab':
        close_tab(data)
        break
      case 'toggle_tab':
        toggle_tab(data)
        break
      default:
    }
  }

  function switch_to_tab(tab_data) {
    if (active_tab === tab_data.id) {
      return
    }
    
    active_tab = tab_data.id
    create_editor(tab_data)
    
    if (_) {
      _.up({ type: 'tab_switched', data: tab_data })
    }
  }

  function toggle_tab(tab_data) {
    if (active_tab === tab_data.id) {
      hide_editor()
      active_tab = null
    } else {
      switch_to_tab(tab_data)
    }
  }

  function close_tab(tab_data) {
    if (active_tab === tab_data.id) {
      hide_editor()
      active_tab = null
    }
    
    if (_) {
      _.up({ type: 'tab_closed', data: tab_data })
    }
  }

  function create_editor(tab_data) {
    let parsed_data = JSON.parse(tab_data[0])
    const file_content = files[parsed_data.id] || ''
    console.log('Creating editor for:', parsed_data)
    const file_extension = get_file_extension(parsed_data.name || parsed_data.id)
    const syntax_rules = highlight_rules[file_extension] || {}

    editor_content.innerHTML = ''

    const editor = document.createElement('div')
    editor.className = 'code-editor'
    
    const editor_wrapper = document.createElement('div')
    editor_wrapper.className = 'editor-wrapper'
    
    const line_numbers = document.createElement('div')
    line_numbers.className = 'line-numbers'
    
    const code_area = document.createElement('textarea')
    code_area.className = 'code-area'
    code_area.value = file_content
    code_area.spellcheck = false
    code_area.placeholder = `Start editing ${parsed_data.name || parsed_data.id}...`
    
    const syntax_overlay = document.createElement('div')
    syntax_overlay.className = 'syntax-overlay'
    
    editor_wrapper.appendChild(line_numbers)
    editor_wrapper.appendChild(code_area)
    editor_wrapper.appendChild(syntax_overlay)
    editor.appendChild(editor_wrapper)
    
    editor_content.appendChild(editor)
    current_editor = { editor, code_area, line_numbers, syntax_overlay, tab_data: parsed_data }
    
    code_area.oninput = handle_code_input
    code_area.onscroll = handle_code_scroll
    syntax_overlay.onscroll = handle_overlay_scroll
    
    update_line_numbers()
    apply_syntax_highlighting()
  }

  function hide_editor() {
    editor_content.innerHTML = `
      <div class="editor-placeholder">
        <div class="placeholder-text">Select a file to edit</div>
      </div>`
    current_editor = null
  }

  function update_line_numbers() {
    if (!current_editor) return
    
    const { code_area, line_numbers } = current_editor
    const lines = code_area.value.split('\n')
    const line_count = lines.length
    
    let line_html = ''
    for (let i = 1; i <= line_count; i++) {
      line_html += `<div class="line-number">${i}</div>`
    }
    
    line_numbers.innerHTML = line_html
  }

  function apply_syntax_highlighting() {
    if (!current_editor) return
    
    const { code_area, syntax_overlay, tab_data } = current_editor
    console.log('Applying syntax highlighting for:', tab_data)
    const file_extension = get_file_extension(tab_data.name)
    const syntax_rules = highlight_rules[file_extension] || {}
    const content = code_area.value
    
    let highlighted_content = escape_html(content)
    
    for (const [keyword, color] of Object.entries(syntax_rules)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      highlighted_content = highlighted_content.replace(
        regex, 
        `<span style="color: ${color}">${keyword}</span>`
      )
    }
    
    highlighted_content = highlighted_content.replace(/\n/g, '<br>')
    
    syntax_overlay.innerHTML = highlighted_content
  }

  function save_file_content() {
    if (!current_editor) return
    
    const { code_area, tab_data } = current_editor
    files[tab_data.id] = code_area.value
    
    if (_) {
      _.up({ 
        type: 'file_changed', 
        data: { 
          id: tab_data.id, 
          content: code_area.value 
        } 
      })
    }
  }

  function get_file_extension(filename) {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
  }

  function escape_html(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
    if (!init) {
      init = true
    }
  }

  function fail(data, type) { 
    console.warn('Invalid message', { data, type })
  }

  function inject_style(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function onfiles(data) {
    files = data[0]
  }

  function onhighlight(data) {
    const file_type = data.type || 'default'
    const rules = typeof data.rules === 'string' ? JSON.parse(data.rules) : data.rules
    highlight_rules[file_type] = rules
  }

  function onactivetab(data) {
    if (data && data.id !== active_tab) {
      switch_to_tab(data)
    }
  }

  function handle_code_input() {
    update_line_numbers()
    apply_syntax_highlighting()
    save_file_content()
  }

  function handle_code_scroll() {
    if (!current_editor) return
    const { code_area, line_numbers, syntax_overlay } = current_editor
    line_numbers.scrollTop = code_area.scrollTop
    syntax_overlay.scrollTop = code_area.scrollTop
    syntax_overlay.scrollLeft = code_area.scrollLeft
  }

  function handle_overlay_scroll() {
    if (!current_editor) return
    const { code_area, syntax_overlay } = current_editor
    code_area.scrollLeft = syntax_overlay.scrollLeft
  }
}

function fallback_module() {
  return {
    api: fallback_instance
  }

  function fallback_instance() {
    return {
      drive: {
        'files/': {
          'example.js': {
            raw: `
              function hello() {
                console.log("Hello, World!");
              }

              const x = 42;
              let y = "string";

              if (x > 0) {
                hello();
              }
            `
          },
          'example.md': {
            raw: `
              # Example Markdown
              This is an **example** markdown file.

              ## Features

              - Syntax highlighting
              - Line numbers
              - File editing

              \`\`\`javascript
              function example() {
                return true;
              }
              \`\`\`
            `
          },
          'data.json': {
            raw: `
              {
                "name": "example",
                "version": "1.0.0",
                "dependencies": {
                "lodash": "^4.17.21"
              }
            `
          }
        },
        'highlight/': {
          'js': {
            raw: JSON.stringify({
              'function': '#ff7b72',
              'const': '#ff7b72', 
              'let': '#ff7b72',
              'var': '#ff7b72',
              'if': '#ff7b72',
              'else': '#ff7b72',
              'for': '#ff7b72',
              'while': '#ff7b72',
              'return': '#ff7b72',
              'true': '#79c0ff',
              'false': '#79c0ff',
              'null': '#79c0ff',
              'undefined': '#79c0ff',
              'console': '#d2a8ff',
              'log': '#d2a8ff',
              'document': '#ffa657',
              'window': '#ffa657',
              'Math': '#ffa657',
              'Array': '#ffa657',
              'Object': '#ffa657',
              'String': '#ffa657',
              'Number': '#ffa657'
            })
          },
          'css': {
            raw: JSON.stringify({
              'display': '#ff7b72',
              'position': '#ff7b72', 
              'background': '#ff7b72',
              'color': '#ff7b72',
              'margin': '#ff7b72',
              'padding': '#ff7b72',
              'border': '#ff7b72',
              'width': '#ff7b72',
              'height': '#ff7b72',
              'flex': '#ff7b72',
              'grid': '#ff7b72',
              'auto': '#79c0ff',
              'center': '#79c0ff',
              'relative': '#79c0ff',
              'absolute': '#79c0ff',
              'fixed': '#79c0ff'
            })
          },
          'md': {
            raw: JSON.stringify({
              '#': '#7ee787',
              '##': '#7ee787',
              '###': '#7ee787',
              '####': '#7ee787',
              '**': '#a5d6ff',
              '*': '#a5d6ff',
              '`': '#f85149',
              '-': '#ffa657',
              '1.': '#ffa657',
              '2.': '#ffa657',
              '3.': '#ffa657'
            })
          },
          'json': {
            raw: JSON.stringify({
              'true': '#79c0ff',
              'false': '#79c0ff',
              'null': '#79c0ff'
            })
          }
        },
        'style/': {
          'theme.css': {
            raw: `
              .tabbed-editor {
                width: 100%;
                height: 100%;
                background-color: #0d1117;
                color: #e6edf3;
                font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
                display: grid;
                grid-template-rows: 1fr;
                position: relative;
                border: 1px solid #30363d;
                border-radius: 6px;
                overflow: hidden;
              }

              .editor-content {
                display: grid;
                grid-template-rows: 1fr;
                position: relative;
                overflow: hidden;
                background-color: #0d1117;
              }

              .editor-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #7d8590;
                font-style: italic;
                font-size: 16px;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
              }

              .code-editor {
                height: 100%;
                display: grid;
                grid-template-rows: 1fr;
                background-color: #0d1117;
              }

              .editor-wrapper {
                display: grid;
                grid-template-columns: auto 1fr;
                position: relative;
                overflow: auto;
                background-color: #0d1117;
              }

              .line-numbers {
                background-color: #161b22;
                color: #7d8590;
                padding: 12px 16px 12px 20px;
                min-width: 60px;
                text-align: right;
                user-select: none;
                font-size: 13px;
                line-height: 20px;
                font-weight: 400;
                border-right: 1px solid #21262d;
                position: sticky;
                left: 0;
                z-index: 1;
              }

              .line-number {
                height: 20px;
                line-height: 20px;
                transition: color 0.1s ease;
              }

              .line-number:hover {
                color: #f0f6fc;
              }

              .code-area {
                background-color: transparent;
                color: transparent;
                border: none;
                outline: none;
                resize: none;
                font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
                font-size: 13px;
                line-height: 20px;
                padding: 12px 16px;
                caret-color: #f0f6fc;
                position: relative;
                z-index: 2;
                tab-size: 2;
                white-space: pre;
                overflow-wrap: normal;
                overflow-x: auto;
                min-height: 100%;
              }

              .syntax-overlay {
                position: absolute;
                top: 0;
                left: 77px;
                right: 0;
                bottom: 0;
                pointer-events: none;
                font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
                font-size: 13px;
                line-height: 20px;
                padding: 12px 16px;
                color: #e6edf3;
                white-space: pre;
                overflow: hidden;
                z-index: 1;
                background-color: #0d1117;
              }

              .code-area:focus {
                background-color: transparent;
                box-shadow: none;
              }

              .code-area::selection {
                background-color: #264f78;
              }

              .syntax-overlay::selection {
                background-color: transparent;
              }

              /* Scrollbar styling */
              .editor-wrapper::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }

              .editor-wrapper::-webkit-scrollbar-track {
                background: #161b22;
              }

              .editor-wrapper::-webkit-scrollbar-thumb {
                background: #30363d;
                border-radius: 4px;
              }

              .editor-wrapper::-webkit-scrollbar-thumb:hover {
                background: #484f58;
              }

              /* Syntax highlighting improvements */
              .syntax-keyword {
                color: #ff7b72;
                font-weight: 500;
              }

              .syntax-string {
                color: #a5d6ff;
              }

              .syntax-number {
                color: #79c0ff;
              }

              .syntax-comment {
                color: #8b949e;
                font-style: italic;
              }

              .syntax-function {
                color: #d2a8ff;
              }

              .syntax-variable {
                color: #ffa657;
              }
            `
          }
        },
        'active_tab/': {
          'current.json': {
            raw: JSON.stringify({
              id: 'example.js',
              name: 'example.js'
            })
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/tabbed_editor/tabbed_editor.js")
},{"STATE":1}],12:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = component

async function component (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const { drive } = sdb
  const on = {
    variables: onvariables,
    style: inject_style,
    icons: iconject,
    scroll: onscroll
  }
  const div = document.createElement('div')
  const shadow = div.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `<div class="tab-entries"></div>`
  const entries = shadow.querySelector('.tab-entries')

  let init = false
  let variables = []
  let dricons = []
  const subs = await sdb.watch(onbatch)
  let send = null
  let _ = null
  if (protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send }
  }
  if (entries) {
    let is_down = false
    let start_x
    let scroll_start

    const stop = () => {
      is_down = false
      entries.classList.remove('grabbing')
      update_scroll_position()
    }

    const move = x => {
      if (!is_down) return
      if (entries.scrollWidth <= entries.clientWidth) return stop()
      entries.scrollLeft = scroll_start - (x - start_x) * 1.5
    }

    entries.onmousedown = e => {
      if (entries.scrollWidth <= entries.clientWidth) return
      is_down = true
      entries.classList.add('grabbing')
      start_x = e.pageX - entries.offsetLeft
      scroll_start = entries.scrollLeft
      window.onmousemove = e => {
        move(e.pageX - entries.offsetLeft)
        e.preventDefault()
      }
      window.onmouseup = () => {
        stop()
        window.onmousemove = window.onmouseup = null
      }
    }

    entries.onmouseleave = stop

    entries.ontouchstart = e => {
      if (entries.scrollWidth <= entries.clientWidth) return
      is_down = true
      start_x = e.touches[0].pageX - entries.offsetLeft
      scroll_start = entries.scrollLeft
    }
    ;['ontouchend', 'ontouchcancel'].forEach(ev => {
      entries[ev] = stop
    })

    entries.ontouchmove = e => {
      move(e.touches[0].pageX - entries.offsetLeft)
      e.preventDefault()
    }
  }
  return div

  function onmessage({ type, data }) {
    switch (type) {
      default:
        // Handle other message types
    }
  }

  async function create_btn ({ name, id }, index) {
    const el = document.createElement('div')
    el.innerHTML = `
    <span class="icon">${dricons[index + 1]}</span>
    <span class='name'>${id}</span>
    <span class="name">${name}</span>
    <button class="btn">${dricons[0]}</button>`

    el.className = 'tabsbtn'
    const icon_el = el.querySelector('.icon')
    const name_el = el.querySelector('.name')
    const close_btn = el.querySelector('.btn')

    name_el.draggable = false
    
    // Add click handler for tab name (switch/toggle tab)
    name_el.onclick = () => {
      if (_) {
        _.up({ type: 'tab_name_clicked', data: { id, name } })
      }
    }
    
    // Add click handler for close button
    close_btn.onclick = (e) => {
      e.stopPropagation()
      if (_) {
        _.up({ type: 'tab_close_clicked', data: { id, name } })
      }
    }
    
    entries.appendChild(el)
    return
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
    if (!init) {
      variables.forEach(create_btn)
      init = true
    } else {
      // TODO: Here we can handle drive updates
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject_style (data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function onvariables (data) {
    const vars = typeof data[0] === 'string' ? JSON.parse(data[0]) : data[0]
    variables = vars
  }

  function iconject (data) {
    dricons = data
  }

  function update_scroll_position () {
    // TODO
  }

  function onscroll (data) {
    setTimeout(() => {
      if (entries) {
        entries.scrollLeft = data
      }
    }, 200)
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }
  function fallback_instance () {
    return {
      drive: {
        'icons/': {
          'cross.svg': {
            '$ref': 'cross.svg'
          },
          '1.svg': {
            '$ref': 'icon.svg'
          },
          '2.svg': {
            '$ref': 'icon.svg'
          },
          '3.svg': {
            '$ref': 'icon.svg'
          }
        },
        'variables/': {
          'tabs.json': {
            '$ref': 'tabs.json'
          }
        },
        'scroll/': {
          'position.json': {
            raw: '100'
          }
        },
        'style/': {
          'theme.css': {
            '$ref': 'style.css'
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/tabs/tabs.js")
},{"STATE":1}],13:[function(require,module,exports){
(function (__filename){(function (){
const state = require('STATE')
const state_db = state(__filename)
const { sdb, get } = state_db(fallback_module)

const tabs_component = require('tabs')
const task_manager = require('task_manager')

module.exports = tabsbar

async function tabsbar (opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject_style,
    icons: inject_icons
  }

  let dricons = {}
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  const subs = await sdb.watch(onbatch)
  
  let send = null
  let _ = null
  if (protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send, tabs: null }
  }
  
  shadow.innerHTML = `
    <div class="tabs-bar-container">
      <button class="hat-btn">${dricons[0] || ''}</button>
      <tabs></tabs>
      <task-manager></task-manager>
      <button class="bar-btn">${dricons[2] || ''}</button>
    </div>
  `

  const tabs = protocol ? await tabs_component(subs[0], () => {}, tabs_protocol) : await tabs_component(subs[0])
  tabs.classList.add('tabs-bar')
  shadow.querySelector('tabs').replaceWith(tabs)

  const task_mgr = await task_manager(subs[1], () => console.log('Task manager clicked!'))
  task_mgr.classList.add('bar-btn')
  shadow.querySelector('task-manager').replaceWith(task_mgr)

  return el

  function onmessage({ type, data }) {
    switch (type) {
      default:
        // Handle other message types
    }
  }

  function tabs_protocol(send) {
    _.tabs = send
    return on
    function on({ type, data }) {
      _.up({ type, data })
    }
  }

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style (data) {
    const sheet = new window.CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function inject_icons (data) {
    dricons = data
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      tabs: {
        $: ''
      },
      task_manager: {
        $: ''
      }
    }
  }

  function fallback_instance () {
    return {
      _: {
        tabs: {
          0: '',
          mapping: {
            icons: 'icons',
            variables: 'variables',
            scroll: 'scroll',
            style: 'style'
          }
        },
        task_manager: {
          0: '',
          mapping: {
            count: 'count',
            style: 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .tabs-bar-container {
                display: flex;
                flex: inherit;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: stretch;
              }
              .tabs-bar {
                display: flex;
                flex: auto;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: stretch;
                width: 300px;
              }
              .hat-btn, .bar-btn {
                display: flex;
                min-width: 32px;
                border: none;
                background: #131315;
                cursor: pointer;
                flex-direction: row;
                justify-content: center;
                align-items: center;
              }
            `
          }
        },
        'icons/': {
          '1.svg': {
            $ref: 'hat.svg'
          },
          '2.svg': {
            $ref: 'hat.svg'
          },
          '3.svg': {
            $ref: 'docs.svg'
          }
        }
      }
    }
  }
}
}).call(this)}).call(this,"/src/node_modules/tabsbar/tabsbar.js")
},{"STATE":1,"tabs":12,"task_manager":14}],14:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

module.exports = task_manager

async function task_manager (opts, callback = () => console.log('task manager clicked')) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  let number = 0
  const on = {
    style: inject,
    count: update_count
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = '<button class="task-count-btn">0</button>'

  const btn = shadow.querySelector('.task-count-btn')
  btn.onclick = callback

  await sdb.watch(onbatch)

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject (data) {
    const sheet = new window.CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  function update_count (data) {
    if (btn) btn.textContent = data.toString()
    else number = data
  }
}

function fallback_module () {
  return {
    api: fallback_instance
  }

  function fallback_instance () {
    return {
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .task-count-btn {
                background: #2d2d2d;
                color: #fff;
                border: none;
                border-radius: 100%;
                padding: 4px 8px;
                min-width: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
              }
              .task-count-btn:hover {
                background: #3d3d3d;
              }
            `
          }
        },
        'count/': {
          'value.json': {
            raw: '3'
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/task_manager.js")
},{"STATE":1}],15:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const action_bar = require('action_bar')
const tabsbar = require('tabsbar')

module.exports = taskbar

async function taskbar(opts, protocol) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })

  shadow.innerHTML = `
  <div class="taskbar-container">
    <div class="action-bar-slot"></div>
    <div class="tabsbar-slot"></div>
  </div>`

  const action_bar_slot = shadow.querySelector('.action-bar-slot')
  const tabsbar_slot = shadow.querySelector('.tabsbar-slot')

  const subs = await sdb.watch(onbatch)
  let send = null
  let _ = null
  if(protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send, action_bar: null, tabsbar: null }
  }
  const action_bar_el = protocol ? await action_bar(subs[0], action_bar_protocol) : await action_bar(subs[0])
  action_bar_el.classList.add('replaced-action-bar')
  action_bar_slot.replaceWith(action_bar_el)

  const tabsbar_el = protocol ? await tabsbar(subs[1], tabsbar_protocol) : await tabsbar(subs[1])
  tabsbar_el.classList.add('replaced-tabsbar')
  tabsbar_slot.replaceWith(tabsbar_el)

  return el

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }

  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }

  function inject_style(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }

  // ---------
  // PROTOCOLS  
  // ---------
  function action_bar_protocol (send) {
    _.action_bar = send
    return on
    function on ({ type, data }) { 
      _.up({ type, data })
    }
  }
  
  function tabsbar_protocol (send) {
    _.tabsbar = send
    return on
    function on ({ type, data }) { 
      _.up({ type, data })
    }
  }
  
  function onmessage ({ type, data }) {
    switch (type) {
      case 'tab_name_clicked':
      case 'tab_close_clicked':
        _.up({ type, data })
        break
      default:
        if (_.action_bar) {
          _.action_bar({ type, data })
        }
    }
  }
}

function fallback_module() {
  return {
    api: fallback_instance,
    _: {
      'action_bar': {
        $: ''
      },
      'tabsbar': {
        $: ''
      }
    }
  }

  function fallback_instance() {
    return {
      _: {
        'action_bar': {
          0: '',
          mapping: {
            'icons': 'icons',
            'style': 'style'
          }
        },
        'tabsbar': {
          0: '',
          mapping: {
            'icons': 'icons',
            'style': 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .taskbar-container {
                display: flex;
                background: #2d2d2d;
                column-gap: 1px;
              }
              .replaced-tabsbar {
                display: flex;
                flex: auto;
              }
              .replaced-action-bar {
                display: flex;
              }
              @media (max-width: 768px) {
                .taskbar-container {
                  flex-direction: column;
                }
              }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/taskbar/taskbar.js")
},{"STATE":1,"action_bar":2,"tabsbar":13}],16:[function(require,module,exports){
(function (__filename){(function (){
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)

const space = require('space')
const taskbar = require('taskbar')
const editor = require('quick_editor')

module.exports = theme_widget

async function theme_widget (opts) {
  const { id, sdb } = await get(opts.sid)
  const {drive} = sdb
  const on = {
    style: inject_style
  }

  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="theme-widget main">
    <div class="space-slot"></div>
    <div class="taskbar-slot"></div>
  </div>
  <style>
  </style>
  `

  const style = shadow.querySelector('style')
  const main = shadow.querySelector('.main')
  const space_slot = shadow.querySelector('.space-slot')
  const taskbar_slot = shadow.querySelector('.taskbar-slot')

  main.append(editor(style, inject = inject_style))

  const subs = await sdb.watch(onbatch)
  
  let space_el = null
  let taskbar_el = null
  const _ = { send_space: null, send_taskbar: null }
  
  taskbar_el = await taskbar(subs[1], taskbar_protocol)
  taskbar_slot.replaceWith(taskbar_el)
  
  space_el = await space(subs[0], space_protocol)
  space_el.classList.add('space')
  space_slot.replaceWith(space_el)
  
  return el
  
  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail(data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject_style (data) {
    style.innerHTML = data.join('\n')
  }

  // ---------
  // PROTOCOLS
  // ---------
  function space_protocol (send) {
    _.send_space = send
    return on
    function on ({ type, data }) {
      _.send_taskbar({ type, data })
    }
  }

  function taskbar_protocol (send) {
    _.send_taskbar = send
    return on
    function on ({ type, data }) {
      _.send_space({ type, data })
    }
  }
}

function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      'space': {
        $: ''
      },
      'taskbar': {
        $: ''
      },
      'quick_editor': 0
    }
  }

  function fallback_instance () {
    return {
      _: {
        'space': {
          0: '',
          mapping: {
            'style': 'style'
          }
        },
        'taskbar': {
          0: '',
          mapping: {
            'style': 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .theme-widget {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                background: #131315;
              }
              .space{
                height: inherit;
                }
            `
          }
        }
      }
    }
  }
}

}).call(this)}).call(this,"/src/node_modules/theme_widget/theme_widget.js")
},{"STATE":1,"quick_editor":9,"space":10,"taskbar":15}],17:[function(require,module,exports){
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

},{"./page":18}],18:[function(require,module,exports){
(function (__filename){(function (){
localStorage.clear()
const STATE = require('../src/node_modules/STATE')
const statedb = STATE(__filename)
const { sdb } = statedb(fallback_module)
const {drive} = sdb
/******************************************************************************
  PAGE
******************************************************************************/
const navbar = require('../src/node_modules/menu')
const theme_widget = require('../src/node_modules/theme_widget')
const taskbar = require('../src/node_modules/taskbar')
const tabsbar = require('../src/node_modules/tabsbar')
const action_bar = require('../src/node_modules/action_bar')
const space = require('../src/node_modules/space')
const tabs = require('../src/node_modules/tabs')
const console_history = require('../src/node_modules/console_history')
const actions = require('../src/node_modules/actions')
const tabbed_editor = require('../src/node_modules/tabbed_editor')
const task_manager = require('../src/node_modules/task_manager')
const quick_actions = require('../src/node_modules/quick_actions')
const editor = require('../src/node_modules/quick_editor')

const imports = {
  theme_widget,
  taskbar,
  tabsbar,
  action_bar,
  space,
  tabs,
  console_history,
  actions,
  tabbed_editor,
  task_manager,
  quick_actions
}
config().then(() => boot({ sid: '' }))

async function config () {
  // const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)
  const html = document.documentElement
  const meta = document.createElement('meta')
  // const appleTouch = '<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">'
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
  document.head.innerHTML += loadFont // + icon16 + icon32 + webmanifest
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
    style: inject
  }
  // const status = {}
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.body
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <label class="toggle-switch">
    <input type="checkbox">
    <span class="slider"></span>
  </label>
  <div class="navbar-slot"></div>
  <div class="components-wrapper-container">
    <div class="components-wrapper"></div>
  </div>`
  el.style.margin = 0
  el.style.backgroundColor = '#d8dee9'
  const editor_btn = shadow.querySelector('input')
  const toggle = editor()
  editor_btn.onclick = toggle

  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------

  const navbar_slot = shadow.querySelector('.navbar-slot')
  const components_wrapper = shadow.querySelector('.components-wrapper')

  const entries = Object.entries(imports)
  const wrappers = []
  const names = entries.map(([name]) => name)
  let current_selected_wrapper = null

  const url_params = new URLSearchParams(window.location.search)
  const checked_param = url_params.get('checked')
  const selected_name_param = url_params.get('selected')
  let initial_checked_indices = []

  if (checked_param) {
    try {
      const parsed = JSON.parse(checked_param)
      if (Array.isArray(parsed) && parsed.every(Number.isInteger)) {
        initial_checked_indices = parsed
      } else {
        console.warn('Invalid "checked" URL parameter format.')
      }
    } catch (e) {
      console.error('Error parsing "checked" URL parameter:', e)
    }
  }

  const menu_callbacks = {
    on_checkbox_change: handle_checkbox_change,
    on_label_click: handle_label_click,
    on_select_all_toggle: handle_select_all_toggle
  }
  const subs = (await sdb.watch(onbatch)).filter((_, index) => index % 2 === 0)
  console.log('subs', subs)
  const nav_menu_element = await navbar(subs[names.length], names, initial_checked_indices, menu_callbacks)
  navbar_slot.replaceWith(nav_menu_element)
  create_component(entries)
  window.onload = scroll_to_initial_selected
  return el
async function create_component (entries_obj) {
  let index = 0
  for (const [name, factory] of entries_obj) {
    const is_initially_checked = initial_checked_indices.length === 0 || initial_checked_indices.includes(index + 1)
    const outer = document.createElement('div')
    outer.className = 'component-outer-wrapper'
    outer.style.display = is_initially_checked ? 'block' : 'none'
    outer.innerHTML = `
      <div class="component-name-label">${name}</div>
      <div class="component-wrapper"></div>
    `
    const inner = outer.querySelector('.component-wrapper')
    const component_content = await factory(subs[index])
    component_content.className = 'component-content'
    inner.append(component_content)
    components_wrapper.appendChild(outer)
    wrappers[index] = { outer, inner, name, checkbox_state: is_initially_checked }
    index++
  }
}

  function scroll_to_initial_selected () {
    if (selected_name_param) {
      const index = names.indexOf(selected_name_param)
      if (index !== -1 && wrappers[index]) {
        const target_wrapper = wrappers[index].outer
        if (target_wrapper.style.display !== 'none') {
          setTimeout(() => {
            target_wrapper.scrollIntoView({ behavior: 'auto', block: 'center' })
            clear_selection_highlight()
            target_wrapper.style.backgroundColor = '#2e3440'
            current_selected_wrapper = target_wrapper
          }, 100)
        }
      }
    }
  }

  function clear_selection_highlight () {
    if (current_selected_wrapper) {
      current_selected_wrapper.style.backgroundColor = ''
    }
    current_selected_wrapper = null
  }

  function update_url (selected_name = url_params.get('selected')) {
    const checked_indices = wrappers.reduce((acc, w, i) => {
      if (w.checkbox_state) { acc.push(i + 1) }
      return acc
    }, [])
    const params = new URLSearchParams()
    if (checked_indices.length > 0 && checked_indices.length < wrappers.length) {
      params.set('checked', JSON.stringify(checked_indices))
    }
    const selected_index = names.indexOf(selected_name)
    if (selected_name && selected_index !== -1 && wrappers[selected_index]?.checkbox_state) {
      params.set('selected', selected_name)
    }
    const new_url = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState(null, '', new_url)
  }

  function handle_checkbox_change (detail) {
    const { index, checked } = detail
    if (wrappers[index]) {
      wrappers[index].outer.style.display = checked ? 'block' : 'none'
      wrappers[index].checkbox_state = checked
      update_url()
      if (!checked && current_selected_wrapper === wrappers[index].outer) {
        clear_selection_highlight()
        update_url(null)
      }
    }
  }

  function handle_label_click (detail) {
    const { index, name } = detail
    if (wrappers[index]) {
      const target_wrapper = wrappers[index].outer
      if (target_wrapper.style.display === 'none') {
        target_wrapper.style.display = 'block'
        wrappers[index].checkbox_state = true
      }
      target_wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
      clear_selection_highlight()
      target_wrapper.style.backgroundColor = 'lightblue'
      current_selected_wrapper = target_wrapper
      update_url(name)
    }
  }

  function handle_select_all_toggle (detail) {
    const { selectAll: select_all } = detail
    wrappers.forEach((w, index) => {
      w.outer.style.display = select_all ? 'block' : 'none'
      w.checkbox_state = select_all
    })
    clear_selection_highlight()
    update_url(null)
  }

  async function onbatch(batch) {
    for (const { type, paths } of batch){
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      console.log('onbatch', type, data)
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { throw new Error('invalid message', { cause: { data, type } }) }
  function inject(data) {
    const style_data = Array.isArray(data) ? data[0] : (JSON.parse(data))[0]
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(style_data)
    shadow.adoptedStyleSheets = [sheet]
  }
}
function fallback_module () {
  const menuname = '../src/node_modules/menu'
  const names = [
    '../src/node_modules/theme_widget',
    '../src/node_modules/taskbar',
    '../src/node_modules/tabsbar',
    '../src/node_modules/action_bar',
    '../src/node_modules/space',
    '../src/node_modules/tabs',
    '../src/node_modules/console_history',
    '../src/node_modules/actions',
    '../src/node_modules/tabbed_editor',
    '../src/node_modules/task_manager',
    '../src/node_modules/quick_actions'
  ]
  const subs = {}
  names.forEach(subgen)
  subs['../src/node_modules/tabs'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'variables': 'variables',
      'scroll': 'scroll',
      'style': 'style'
    }
  }
  subs['../src/node_modules/tabsbar'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/action_bar'] = {
    $: '',
    0: '',
    mapping: {
      'icons': 'icons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/console_history'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'commands': 'commands',
      'icons': 'icons',
      'scroll': 'scroll'
    }
  }
  subs['../src/node_modules/actions'] = {
    $: '',
    0: '',
    mapping: {
      'actions': 'actions',
      'icons': 'icons',
      'hardcons': 'hardcons',
      'style': 'style'
    }
  }
  subs['../src/node_modules/tabbed_editor'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'files': 'files',
      'highlight': 'highlight',
      'active_tab': 'active_tab'
    }
  }
  subs['../src/node_modules/task_manager'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'count': 'count'
    }
  }
  subs['../src/node_modules/quick_actions'] = {
    $: '',
    0: '',
    mapping: {
      'style': 'style',
      'icons': 'icons',
      'actions': 'actions',
      'hardcons': 'hardcons'
    }
  }
  subs[menuname] = { 
    $: '',
    0: '',
    mapping: {
      'style': 'style',
    }
  }
  subs['../src/node_modules/quick_editor'] = 0
  return {
    _: subs,
    drive: {
      'style/': {
        'theme.css': {
          raw: `
          .components-wrapper-container {
            padding-top: 10px; /* Adjust as needed */
          }
      
          .components-wrapper {
            width: 95%;
            margin: 0 auto;
            padding: 2.5%;
          }
      
          .component-outer-wrapper {
            margin-bottom: 20px;
            padding: 0px 0px 10px 0px;
            transition: background-color 0.3s ease;
          }
      
          .component-name-label {
            background-color:transparent;
            padding: 8px 15px;
            text-align: center;
            font-weight: bold;
            color: #333;
          }
      
          .component-wrapper {
            padding: 15px;
            border: 3px solid #666;
            resize: both;
            overflow: auto;
            border-radius: 0px;
            background-color: #eceff4;
            min-height: 50px;
          }
          .component-content {
            width: 100%;
            height: 100%;
          }
          .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #ccc;
          border-radius: 26px;
          transition: 0.4s;
        }

        .slider::before {
          content: "";
          position: absolute;
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.4s;
        }

        input:checked + .slider {
          background-color: #2196F3;
        }

        input:checked + .slider::before {
          transform: translateX(24px);
        }
        `
        }
      }
    }
  }
  function subgen (name) {
    subs[name] = {
      $: '',
      0: '',
      mapping: {
        'style': 'style',
      }
    }
  }
}

}).call(this)}).call(this,"/web/page.js")
},{"../src/node_modules/STATE":1,"../src/node_modules/action_bar":2,"../src/node_modules/actions":3,"../src/node_modules/console_history":4,"../src/node_modules/menu":7,"../src/node_modules/quick_actions":8,"../src/node_modules/quick_editor":9,"../src/node_modules/space":10,"../src/node_modules/tabbed_editor":11,"../src/node_modules/tabs":12,"../src/node_modules/tabsbar":13,"../src/node_modules/task_manager":14,"../src/node_modules/taskbar":15,"../src/node_modules/theme_widget":16}]},{},[17]);

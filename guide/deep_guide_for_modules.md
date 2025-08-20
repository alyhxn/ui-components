# Guide to create modules:

Here we would discuss the rules and a deep explanation of the steps for creating a module.

## Here are some rules:
- We use StandardJS.
- We use snake_case and try to keep variable names concise.
- We use CommonJS. Which consist of `require` keyword for importing external modules.
- Furthermore, we use shadow DOM.
- We handle all the element creation through JavaScript and try to maximize the use of template literals while creating HTML elements.
- We try to keep the code modular by dividing the functionality into multiple functioned which are defined/placed always under the return statement of parent function and are used above, obviously.
- Likewise, we don't use `btn.addEventListner()` syntax. Instead, we use `btn.onclick = onclick_function` etc.
- We don't use JavaScript `classes` or `this` keyword.
- We use a module called `STATE` for state management and persistent browser storage. I Will discuss it in detail in a bit.
- We use bundlers `budo/browserify`. Our index.html is a small file that just includes the bundle.js script.
- Try to keep code as short as possible without compromising the readability and reusability.

# Structure Explained:
Here is the structure that I would show you step by step.
## `example.js`
First 3 lines for each module are always same:
```js
const STATE = require('STATE')
const statedb = STATE(__filename)
const { sdb, get } = statedb(fallback_module)
```
As you can see here we just require the `STATE` module and then execute it to create a state database function. This is then passed with a `fallback` function.

You dont need to get deep into these first 2 lines.

---
A `submodule` is a module that is required by our current module.

A `fallback_module` is a function which returns an object which contains 3 properties:

- **_** : This defines the `submodules`. If there is no `submodule` used or `required`/`imported` in the current module then It is not defined (meaning it should not exist as a key. It should not be like `_:{}`. Instead, there should be nothing). **It is necessary to define when we do require a external module as a `submodule`.**
- **drive** : It is a place where we can store data which we want to be saved in localStorage. We store all the Styles, SVG's inside the drive.
- **api** : this defines another `fallback` function called `fallback_instance`. It is used to provide a developer who reuses our component with customization api to override our default data which is defined in `fallback_module`'s object. `fallback_instance` has obj returned with 2 properties ⇾ **_** and **drive**.
---
#### The `_` property is very important.
It represents the submodules and instances. Any number of instances can be made from a single required module.
It is an object that is assigned to `_`.
Unlike `drive` (which has same structure in both `fallback_module` and `fallback_instance`) the stuctural syntax for **`_`** is a little different in `fallback_module` and `fallback_instance`.

---
In `fallback_module` we include the required module names as keys, and we assign an object to those keys which define the module by `$` key, This `$` property is mandatory what ever reason. We can create as many instances we want using `0,1,2,3,4,5,....,n` as keys of object that is passed to required module key. But mostly we use `fallback_instance` for creating instances. Anyways an example is:
```js
_: {
  '../../module_address' : {
    $ : '', // This is a must. we can either assign a string as a override which keeps the default data intact. Or we can specify an override function which would change the default fallbacks for each instance.
    0 : override_func, // we can assign a override to a sigle instance which will change the data only for this particular instance.
    1 : override_func2, // we can use same or different override functions for each instance.
    2 : '', // obviously we can also assign a empty string which would take data from $. and if $ also has and empty string then it defaults to orignal module data.
    mapping: {
      style: 'style'
    }
  }
}
```
I have added the comments for explanation about `overrides`.

---
In `fallback_instance` the only difference is that we don't have a $ property for representing the module.

That's why the `$` inside the `_` property of `fallback_module` is mandatory whether we use `fallback_instance` for creating instances or `fallback_module`.


There is another mandatory thing inside the **`_`** which is **`mapping`** property. It is always defined where we create Instances.

If we create instance at module level then we would add it inside `_` of `fallback_module` but as most of the times we create instances through the `fallback_instance` add mapping there.

Example:
```js
  _: {
    $: '', // only if we create module level instances
    0: '',
    mapping: {
      style: 'style'
    }
  }
```
---
Let's go back to drive. As discussed above that we place the data in **drive** which is supposed to be stored in localStorage of a browser. It is completely optional, we can ignore it if we want. The data we want to be customizable is stored in **api**'s **drive** (`fallback_instance`) and which is supposed to be not is stored in `fallback_module`'s drive.

Drive is an JavaScript object. It contains datasets of different types or category. These categories can contain multiple files.
```json
drive: {
  'style/': {
    'theme.css': {
      raw: `
      .element-class {
        display: flex;
        align-items: center;
        background-color: #212121;
        padding: 0.5rem;
        // min-width: 456px
      }`
    }
  }
}
```
Now these datasets like `style/` can contain files and each file contains content using `raw:`.

Another way of defining the content is by using `$ref:`. This is used when we want to use a file from the same directory as the module file. For example, if we want to require/import --> $ref `cross.svg` from directory of the module, we can do it like this :
```js
drive: {
  'style/': {
    'theme.css': {
      '$ref': 'example.svg'
    }
  }
}
```
This `$ref` can help a lot in short and clean `fallbacks`

---
### Back to where we left
After we have added those 3 lines of code, we can require modules to use them as `submodules` (if any).

```js
const submodule1 = require('example_submodule')
```

Then we export our current module function.
```js
module.exports = module_function
```
Then we define our function which is always async and always takes one `opts` parameter.
```js
async function module_function (opts) {
  // Code
}
```
Inside the function we start with this line:
```js
  const { id, sdb } = await get(opts.sid)
```
It fetches our `sdb` which is state database.
Now there is also a `sdb` in third line of the module i.e.
```js
const { sdb, get } = statedb(fallback_module)
```
It is used when we use `fallback_module` to create instances. It is only used when we don't add this `const { id, sdb } = await get(opts.sid)` line to the module function. Most of the time we do add it as it's the backbone of customization `api`. I will share the exceptions in a bit.

We should only add this line if we use `fallback_instance` to create instances. Which we mostly do.

---

After that we create this object according to the datasets in drive. They will be helpful in executing certain functions when specific dataset is updated or changed.
```js
  const on = {
    style: inject
  }
```
This has a simple structure where key name is based of dataset and its value is the function we want to execute when that dataset changes.

---

Then we start the real vanilla JavaScript journey for creating some useful HTML.
```js
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="action-bar-container">
    <div class="action-bar-content">
      <button class="icon-button"></button>
      <placeholder></placeholder>
    </div>
  </div>`
```
As mentioned before that we make the maximum use of literals. We also use Shadow DOM with closed mode.

We can also define some placeholder elements that we can later replace with a submodule.

---
Then the most important line of the `STATE` program comes.
```js
  const subs = await sdb.watch(onbatch)
```
This does two things.

First is that it is a watch function which is like an event listener. It triggers the `onbatch()` whenever something in the drive changes. We would share the `onbatch()` code later.

Second it stores `Sid`'s for all the submodules and their instances into the subs array. It gets then from `_` properties of `drive` from both fallbacks (instance and module). These `Sid`'s are passed as parameters to the `submodules`.

The order of execution of functions by `onbatch` is not random. so we need to so we need to make sure that those functions work independent of order of execution. A strategy we can opt is to create elements at the end after storing all the data into variables and then using those variables for creating elements.

---

After we get the `Sid`'s we can append the required submodules into our HTML elements.
```js
  submodule1(subs[0]).then(el => shadow.querySelector('placeholder').replaceWith(el))

  // to add a click event listener to the buttons:
  // const [btn1, btn2, btn3] = shadow.querySelectorAll('button')
  // btn1.onclick = () => { console.log('Terminal button clicked') })
```
We can also add event listeners if we want at this stage. As mentioned in rules we dont use `element.addEventListner()` syntax.

---
 Then we return the `el`. The main element to which we have attached the shadow.
 ```js
 return el
 ```
 This is the end of a clean code. We can add the real mess under this return statement.

 ---

Then we define the functions used under the return statement.
```js
  function onbatch (batch) {
    for (const { type, data } of batch) {
      on[type] && on[type](data)
    }
    // here we can create some elements after storing data
  }
  function inject(data) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets = [sheet]
  }
  function iconject(data) {
    dricons = data[0]
    // using data[0] to retrieve the first file from the dataset.
  }
  function some_useful_function (){
    // NON state function
  }
```
We add both `STATE` related and actual code related functions here. And finally after those we close our main module delimiters.

---
Last but not the least outside the main module function, we define the `fallback_module`

It is placed at the last as it can be pretty long sometimes.

```js
function fallback_module () {
  return {
    api: fallback_instance,
    _: {
      submodule1: {
        $: ''
      }
    }
  }
  function fallback_instance () {
    return {
      _: {
        submodule1: {
          0: '',
          mapping: {
            style: 'style'
          }
        }
      },
      drive: {
        'style/': {
          'theme.css': {
            raw: `
              .element-class {
                display: flex;
                align-items: center;
                background-color: #212121;
                padding: 0.5rem;
                // min-width: 456px
              }
            `
          }
        }
      }
    }
  }
}
```
---
## Communication of a module with other modules

As discussed above we use **_** property of fallbacks to use **submodules**, Now to add communication between which can be used to trigger functions on events we use a **protocol** based system.
### Concept
Lets say **child.js** is a submodule of **parent.js**, then what we need to do is to first of all define a protocol function and pass it as a parameter to the instance of that submodules inorder to introduce a message based communication between those.
```js
  const child = require('child')
```
and then
```js
  let _ = {child : null} // this is used to hold functions for all the children. These would be passed or sent back by the all of the children. We can also include an `up` property for the communication functions for the parent if the current module is a child for another module and it getting protocol as a paramerter.
  element = await child(subs[0], space_protocol)
```
An example of a protocol function in the `parent.js` for `child.js` is:
```js
  function space_protocol (send) {
    _.send_space = send
    return on // this is the function which is passed to child and the child can execute this to send a message to the parent
    function on ({ type, data }) { // runs on behalf of the child
      decide_and_execute_function_for_child_based_on_the_passed_type({ type, data })
    }
  }
```
When the **_** property is like this:
```js
  function fallback_instance () {
    return {
      _: {
        'child': {
          0: '',
          mapping: {
            'style': 'style'
          }
        }
      }
    }
  }
```
Then for the `child.js` the code could look like:
```js
async function taskbar(opts, protocol) {
...
  let send = null
  let _ = null
  if(protocol) {
    send = protocol(msg => onmessage(msg))
    _ = { up: send, action_bar: null, tabsbar: null }
  }
...
return
...
  function action_bar_protocol (send) {
    _.action_bar = send
    return on
    function on ({ type, data }) {  //routing the messages to parent
      _.up({ type, data })
    }
  }
  
  function tabsbar_protocol (send) {
    _.tabsbar = send
    return on
    function on ({ type, data }) { //routing the messages to parent
      _.up({ type, data })
    }
  }
  function onmessage ({ type, data }) { // This function is passed as parameter to the parent function, so it can communicate with the child
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
...
}
```

This sets up a 2 way communication between modules to send messages and based on which we can execute any function or piece of code after defining the logic for a message.

---
## sdb

This is an object which we get from either instance or module level as discussed above. This object has two important properties which are `drive` and `watch`.

Drive can be accessed throug to simplyfy code.
```js
{ drive } = sdb
```
### drive methods

The `sdb.drive` object provides an interface for managing datasets and files attached to the current node. It allows you to list, retrieve, add, and check files within datasets defined in the module's state.

- **sdb.drive.list(path?)**
  - Lists all dataset names (as folders) attached to the current node.
  - If a `path` (dataset name) is provided, returns the list of file names within that dataset.
  - Example:
    ```js
    const datasets = sdb.drive.list(); // ['mydata/', 'images/']
    const files = sdb.drive.list('mydata/'); // ['file1.json', 'file2.txt']
    ```

- **sdb.drive.get(path)**
  - Retrieves a file object from a dataset.
  - `path` should be in the format `'dataset_name/filename.ext'`.
  - Returns an object: `{ id, name, type, raw }` or `null` if not found.
  - Example:
    ```js
    const file = sdb.drive.get('mydata/file1.json');
    // file: { id: '...', name: 'file1.json', type: 'json', raw: ... }
    ```

- **sdb.drive.put(path, buffer)**
  - Adds a new file to a dataset.
  - `path` is `'dataset_name/filename.ext'`.
  - `buffer` is the file content (object, string, etc.).
  - Returns the created file object: `{ id, name, type, raw }`.
  - Example:
    ```js
    sdb.drive.put('mydata/newfile.txt', 'Hello World');
    ```

- **sdb.drive.has(path)**
  - Checks if a file exists in a dataset.
  - `path` is `'dataset_name/filename.ext'`.
  - Returns `true` if the file exists, otherwise `false`.
  - Example:
    ```js
    if (sdb.drive.has('mydata/file1.json')) { /* ... */ }
    ```

**Notes:**
- Dataset names are defined in the fallback structure and must be unique within a node.
- File types are inferred from the file extension.
- All file operations are isolated to the current node's state and changes are persisted immediately.\
- The onbatch() function is triggered as soon as something in the drive is updated through `drive.put()` so thats we may need to add flags for events which we dont want to trigger the update of whole ui.


## Admin
// @todo as I (ddroid) myself don't know the usage.
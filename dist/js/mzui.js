/*!
 * mzui - v1.0.0 - 2016-07-13
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 */

/*! Zepto v1.1.6 - zeptojs.com/license */

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (isDocument(element) && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this[0].textContent : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (!this.length || this[0].nodeType !== 1 ? undefined :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return 0 in arguments ?
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var computedStyle, element = this[0]
        if(!element) return
        computedStyle = getComputedStyle(element, '')
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {
          var props = {}
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >=
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch(event){
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  function isPointerEventType(e, type){
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  $(document).ready(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body
    }

    $(document)
      .bind('MSGestureEnd', function(e){
        var swipeDirectionFromVelocity =
          e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
        if (swipeDirectionFromVelocity) {
          touch.el.trigger('swipe')
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
        }
      })
      .on('touchstart MSPointerDown pointerdown', function(e){
        if((_isPointerType = isPointerEventType(e, 'down')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        if (e.touches && e.touches.length === 1 && touch.x2) {
          // Clear out touch movement data if we have it sticking around
          // This can occur if touchcancel doesn't fire due to preventDefault, etc.
          touch.x2 = undefined
          touch.y2 = undefined
        }
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $('tagName' in firstTouch.target ?
          firstTouch.target : firstTouch.target.parentNode)
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = firstTouch.pageX
        touch.y1 = firstTouch.pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
        // adds the current touch contact for IE gesture recognition
        if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
      })
      .on('touchmove MSPointerMove pointermove', function(e){
        if((_isPointerType = isPointerEventType(e, 'move')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        cancelLongTap()
        touch.x2 = firstTouch.pageX
        touch.y2 = firstTouch.pageY

        deltaX += Math.abs(touch.x1 - touch.x2)
        deltaY += Math.abs(touch.y1 - touch.y2)
      })
      .on('touchend MSPointerUp pointerup', function(e){
        if((_isPointerType = isPointerEventType(e, 'up')) &&
          !isPrimaryTouch(e)) return
        cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (deltaX < 30 && deltaY < 30) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap')
              event.cancelTouch = cancelAll
              touch.el.trigger(event)

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if (touch.el) touch.el.trigger('doubleTap')
                touch = {}
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null
                  if (touch.el) touch.el.trigger('singleTap')
                  touch = {}
                }, 250)
              }
            }, 0)
          } else {
            touch = {}
          }
          deltaX = deltaY = 0

      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

;(function($){
  var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), emptyArray = []

  // Get value from node:
  // 1. first try key as given,
  // 2. then try camelized key,
  // 3. fall back to reading "data-*" attribute.
  function getData(node, name) {
    var id = node[exp], store = id && data[id]
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      return dataAttr.call($(node), name)
    }
  }

  // Store value under camelized key on node
  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node))
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // Read all "data-*" attributes from a node
  function attributeData(node) {
    var store = {}
    $.each(node.attributes || emptyArray, function(i, attr){
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // get value from first element
        (0 in this ? getData(this[0], name) : undefined) :
      // set value on all elements
      this.each(function(){ setData(this, name, value) })
  }

  $.fn.removeData = function(names) {
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }

  // Generate extended `remove` and `empty` functions
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

/* ========================================================================
 * MZUI: utils.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

window.CoreLib = window['jQuery'] || window['Zepto'];

!(function($){
    'use strict';

    $.callEvent = function(name, func, proxy, relativeElement, params) {
        var event = $.Event(name);
        var result;
        if(relativeElement) {
            $(relativeElement).trigger(event, params);
            result = event.result;
        }
        if($.isFunction(func)) {
            result = func.apply(proxy, $.isArray(params) ? params : [params]);
        }
        return result;
    }

    $.fn.callEvent = function(component, name, params) {
        return $.callEvent(name, component.options ? component.options[name] : null, component, this, params);
    };

    $.bindFn = function(fnName, _Constructor, defaultOptions) {
        var old = $.fn[fnName];
        var NAME = _Constructor.NAME || ('mzui.' + fnName);
        
        $.fn[fnName] = function(option, params) {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data(NAME);

                var options = typeof option == 'object' && option;
                if(defaultOptions) options = $.extend(options, defaultOptions);

                if(!data) $this.data(NAME, (data = new _Constructor($this, options)));
                if(typeof option == 'string') data[option].apply(data, $.isArray(params) ? params : [params]);
            });
        };

        $.fn[fnName].Constructor = _Constructor;

        $.fn[fnName].noConflict = function() {
            $.fn[fnName] = old;
            return this
        };
    };

    $.formatDate = function(date, format) {
        if(!(date instanceof Date)) date = new Date(date);

        var dateInfo = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            // 'H+': date.getHours() % 12,
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            // 'q+': Math.floor((date.getMonth() + 3) / 3),
            'S+': date.getMilliseconds()
        };
        if(/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for(var k in dateInfo) {
            if(new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? dateInfo[k] : ('00' + dateInfo[k]).substr(('' + dateInfo[k]).length));
            }
        }
        return format;
    };

    $.format = function(str, args) {
        if(str instanceof Date) return $.formatDate(str, args);

        if(arguments.length > 1) {
            var reg;
            if(arguments.length == 2 && typeof(args) == "object") {
                for(var key in args) {
                    if(args[key] !== undefined) {
                        reg = new RegExp("({" + key + "})", "g");
                        str = str.replace(reg, args[key]);
                    }
                }
            } else {
                for(var i = 1; i < arguments.length; i++) {
                    if(arguments[i] !== undefined) {
                        reg = new RegExp("({[" + (i - 1) + "]})", "g");
                        str = str.replace(reg, arguments[i]);
                    }
                }
            }
        }
        return str;
    };

    $.calValue = function(anything, proxy, params) {
        return $.isFunction(anything) ? anything.apply(proxy, $.isArray(params) ? params : [params]) : anything;
    };

    $.is$ = function(obj) {
        return $.zepto.isZ(obj)
    };

    $.isStr = function(x) {
        return typeof x == 'string';
    };

    $.isNum = function(x) {
        return typeof x == 'number';
    };

    $.TapName = 'ontouchstart' in document.documentElement ? 'tap' : 'click';
}(CoreLib));

/* ========================================================================
 * MZUI: display.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

!(function($, undefined, window, document){
    'use strict';

    var uuid                = 1200,
        TAP_EVENT_NAME      = $.TapName,
        STR_DISPLAY         = 'display',
        STR_ORIGINAL_CLASS  = 'orginalClass',
        STR_HIDDEN          = 'hidden',
        STR_LOADING         = 'loading',
        STR_BODY            = 'body',
        TARGET_EVENT_SUFFIX = '.' + STR_DISPLAY + '.oneTarget',
        NAME                = 'mzui.' + STR_DISPLAY,
        inverseSide         = {left: 'right', bottom: 'top', top: 'bottom', right: 'left'};

    // Display constructor([$element], options)
    // $element is optional
    var Display = function($element, options) {
        var that = this;
        if($.isPlainObject($element)) {
            options  = $element;
            $element = null;
        }
        options = $.extend({element: $element}, Display.DEFAULT, $element ? $element.data() : null, options);

        var display = options.display;
        if(display && Display.plugs['_' + display]) {
            options = $.calValue(Display.plugs['_' + display], that, options);
        }

        var selector = options.selector;

        if(!$element)     options.trigger = null;
        if(!options.name) options.name    = STR_DISPLAY + uuid++;

        var triggerCallback = function(e) {
            if(options.stopPropagation) e.stopPropagation();
            var $this = $(this);
            var thisOptions = $this.data() || {};
            thisOptions.element = this;

            if($this.is('a')) {
                var href = $this.attr('href');
                if(href && href !== '#' && href.indexOf('##') < 0) {
                    if(/^#[a-z]/i.test(href)) {
                        thisOptions.target = href;
                    } else if(!thisOptions.remote) {
                        thisOptions.remote = href;
                    }
                }
                if(e) e.preventDefault();
            }
            that[options.triggerMethod](thisOptions);
        };

        if(options.trigger) {
            selector ? $element.on(options.trigger, selector, triggerCallback) : $element.on(options.trigger, triggerCallback);
        }

        that.$       = $element;
        that.options = options;

        if(options.displayAuto !== undefined && options.displayAuto !== false) {
            if(selector && $element) {
                $element.find(selector).each(triggerCallback);
            } else that.show();
        } else if(selector && $element) {
            var activeClass = options.activeClass;
            $element.find(selector).filter('[data-display-auto]' + (activeClass ? (',.' + activeClass) : '')).each(triggerCallback);
        }
    };

    Display.prototype._getTarget = function(options) {
        var that = this;

        var target = $.calValue(options.target, that, options);
        if(target === '!new' || target === '#' + STR_DISPLAY + 'Target') {
            var targetId = STR_DISPLAY + 'Target-' + options.name,
                layerId = STR_DISPLAY + 'Layer-' + options.name;
            $('#' + targetId).remove();
            target = $('<div class="' + STR_DISPLAY + ' ' + STR_HIDDEN + '"/>', {id: targetId});
            var $layer = $('#' + layerId);
            if(!$layer.length) $layer = $('<div class="' + STR_DISPLAY + '-layer"/>', {id: layerId}).appendTo(STR_BODY);
            options.layer = options.container = $layer.append(target);
        } else if(target === '!self') {
            target = options.element || that.$;
        }

        target = $(target).addClass(STR_DISPLAY).attr('data-' + STR_DISPLAY + '-name', options.name);
        if(!target.parent().length) {
            target.appendTo(options.container);
        }
        if(!target.data(STR_ORIGINAL_CLASS)) target.data(STR_ORIGINAL_CLASS, target.attr('class'));
        return target;
    };

    Display.prototype.update = function($target, options, callback, readyCallback) {
        var that = this;
        var fillContent = function(content) {
            var template = options.template;
            if($.isFunction(template)) {
                content = template(content, options);
            } else if($.isStr(template)) {
                content = $.format(template, content);
            }

            if(content !== false) {
                if($.is$(content)) {
                    $target.empty().append(content);
                } else {
                    $target[options.contentType === 'text' ? 'text' : 'html'](content);
                }
            }
        };

        var remote = $.calValue(options.remote, that, options);
        if(remote) {
            var remoteCall   = $.uuid++,
                loadingClass = options.loadingClass;
            $target.removeClass(options.showInClass).addClass(loadingClass);
            $(STR_BODY).addClass('has-' + STR_DISPLAY + '-' + STR_LOADING);
            if(options.$backdrop) options.$backdrop.addClass(loadingClass);

            var ajaxOptions = $.isStr(remote) ? {url: remote} : remote;
            if(that.xhr) that.xhr.abort();
            that.remoteCall  = remoteCall;
            that.xhr = $.ajax($.extend({
                dataType: options.remoteType || 'html',
                error: options.remoteError
            }, ajaxOptions, {
                success: function(data, status, xhr) {
                    fillContent(data);
                    ajaxOptions.success && ajaxOptions.success(data, status, xhr);
                },
                complete: function(xhr, status) {
                    that.xhr = 0;
                    if(that.remoteCall !== remoteCall) return;
                    if(that.lastRemote !== remote) {
                        $(options.container).scrollTop(0);
                        that.lastRemote = remote;
                    }
                    $target.removeClass(loadingClass).addClass(options.showInClass);
                    $(STR_BODY).removeClass('has-' + STR_DISPLAY + '-' + STR_LOADING);
                    if(options.$backdrop) options.$backdrop.removeClass(loadingClass);
                    $.callEvent('loaded', options['loaded'], that, that.$, options);
                    $(document).triggerHandler(STR_DISPLAY + '.loaded', [that, that.$, options]);
                    ajaxOptions.complete && ajaxOptions.complete(xhr, status);
                    readyCallback && readyCallback();
                }
            }));
        } else {
            var content = $.calValue(options.content, that, options),
                source = options.source;
            if(source) {
                source = $($.calValue(source, that, options));
                source = source.parent().length ? source.clone() : source;
                content = content ? source.html(content) : source;
            }
            fillContent(content);
            readyCallback && readyCallback();
        }
        callback && callback(remote);
    };

    Display.prototype._getOptions = function(extraOptions) {
        var that = this;
        var options   = $.extend({}, that.options, extraOptions);

        var display = options.display;
        if(display && Display.plugs[display]) {
            options = $.calValue(Display.plugs[display], that, options);
        }

        if(!options.$target) options.$target = that._getTarget(options);

        return options;
    };

    Display.prototype.show = function(extraOptions, callback) {
        if($.isFunction(extraOptions)) {
            callback = extraOptions;
            extraOptions = null;
        }

        var that = this;
        var options = that._getOptions(extraOptions);
        that.last = options;

        var $target        = options.$target,
            activeClass    = options.activeClass,
            animate        = options.animate,
            element        = options.element,
            placement      = options.placement,
            $layer         = options.layer,
            suggestAnimate = '', 
            suggestArrow   = '',
            displayName    = options.name,
            arrow          = options.arrow,
            backdrop       = options.backdrop,
            $element       = $(element);

        $target.attr('class', 'invisible ' + $target.data(STR_ORIGINAL_CLASS) + ' ' + (options.targetClass || '')).removeClass(STR_HIDDEN);

        if($.callEvent('show', options.show, that, that.$, options) === false) {
            $target.attr('class', STR_ORIGINAL_CLASS);
            if(options.layer) options.layer.remove();
            return callback && callback();
        }

        if(options.showSingle) {
            (options.showSingle === true ? $target.parent().children() : $(options.showSingle)).not($target).removeClass(options.showInClass).addClass(STR_HIDDEN);
        }

        if($layer) $layer.removeClass(STR_HIDDEN);

        if(backdrop) {
            var backdropId = 'backdrop-' + displayName;
            $('#' + backdropId).remove();
            var $backdrop = options.$backdrop = $('<div class="display-backdrop"/>', {
                id: backdropId,
                type: options.display,
                'data-display-name': displayName
            }).appendTo(STR_BODY).css('zIndex', uuid++);
            if(backdrop === true) backdrop = 'fade';
            if($.isStr(backdrop)) $backdrop.addClass(backdrop);
            $(STR_BODY).addClass('display-show-' + options.name);
            setTimeout(function(){$backdrop.addClass('in');}, 10);

            if(options.backdropDismiss) {
                $backdrop.attr('data-dismiss', STR_DISPLAY);
            }
        }

        if(options.targetZIndex !== 'none') ($layer || $target).css('zIndex', options.targetZIndex || uuid++);

        if(activeClass && element) {
            if(options.activeSingle) $element.parent().children().removeClass(activeClass);
            $element.addClass(activeClass);
        }

        that.update($target, options, function(isRemoteContent) {
            if(options.scrollTop) $(options.container).scrollTop(0);
            placement = $.calValue(placement, that, options);
            if(placement) {
                if($.isStr(placement) && placement[0] == '{') {
                    placement = $.parseJSON(placement);
                }
                var $body = $('body');
                if($.isPlainObject(placement)) {
                    $target.css(placement);
                } else if(placement === 'overlay') {
                    var offset = $element.offset();
                    $target.css({
                        position: 'absolute',
                        left: offset.left - (options.layer ? $body.scrollLeft() : 0),
                        top: offset.top - (options.layer ? $body.scrollTop() : 0),
                        width: $element.width(),
                        height: $element.height()
                    });
                } else if(placement.indexOf('beside') === 0) {
                    $target.css({position: 'absolute'});
                    placement = placement.split('-');
                    var beside = placement[1] || 'auto', 
                        float = placement[2] || 'center',
                        offset = $element.offset(),
                        eTop = offset.top - (options.layer ? $body.scrollTop() : 0),
                        eLeft = offset.left - (options.layer ? $body.scrollLeft() : 0),
                        left, top,
                        eWidth = $element.width(),
                        eHeight = $element.height(),
                        width = $target.width(),
                        height = $target.height(),
                        wWidth = $(document).width(),
                        wHeight = $(document).height(),
                        floatStart = float === 'start',
                        floatEnd = float === 'end'

                    if(beside === 'auto') {
                        if(eTop + eHeight + height <= wHeight) {
                            beside = 'bottom';
                        } else if(height <= eTop) {
                            beside = 'top';
                        } else if(eLeft + eWidth + width <= wWidth) {
                            beside = 'right';
                        } else if(width <= eLeft) {
                            beside = 'left';
                        } else beside = 'bottom'
                    }

                    var bestLeft = floatStart ? eLeft : (floatEnd ? (eLeft + eWidth) : (eLeft + eWidth/2 - width/2)),
                        bestTop = floatStart ? eTop : (floatEnd ? (eTop + eHeight) : (eTop + eHeight/2 - height/2));

                    if(beside === 'bottom') {
                        top = eTop + eHeight;
                        left = bestLeft;
                    } else if(beside === 'top') {
                        top = eTop - height;
                        left = bestLeft;
                    } else if(beside === 'right') {
                        top = bestTop;
                        left = eLeft + eWidth;
                    } else {
                        top = bestTop;
                        left = eLeft - width;
                    }

                    $target.css({
                        top: Math.max(0, Math.min(top, wHeight - height)),
                        left: Math.max(0, Math.min(left, wWidth - width))
                    });

                    suggestArrow = inverseSide[beside];
                    suggestAnimate = 'fade scale-from-' + suggestArrow;
                } else {
                    placement = placement.split('-');
                    var justify = placement[0], 
                        align = placement[1],
                        layerCss = {};
                    if(justify == 'top' || justify == 'bottom' || justify == 'left' || justify == 'right') {
                        layerCss.justifyContent = 'flex-' + ((justify === 'top' || justify == 'left') ? 'start' : 'end');
                        layerCss.flexDirection = (justify == 'top' || justify == 'bottom') ? 'column' : 'row';
                        layerCss.alignItems = align ? (align == 'center' ? 'center' : (align == 'left' ? 'flex-start' : 'flex-end')) : 'stretch';
                    }

                    if($layer) $layer.css(layerCss);
                    suggestAnimate = justify;
                    suggestArrow = inverseSide[suggestAnimate];
                    suggestAnimate = 'from-' + suggestAnimate;
                }
            }

            if(arrow) {
                var arrowClass = 'display-arrow arrow-' + suggestArrow;
                if($.isStr(arrow)) arrowClass += ' ' + arrow;
                $target.addClass(arrowClass);
            }

            var afterShow = function() {
                $target.removeClass('invisible');
                if(!isRemoteContent) $target.addClass(options.showInClass);

                callback && callback();

                var autoHide = options.autoHide;
                if(autoHide) {
                    that.animateCall = setTimeout(function(){that.hide()}, $.isNum(autoHide) ? autoHide : 5000);
                }

                that.animateCall = setTimeout(function() {
                    $.callEvent('shown', options.shown, that, that.$, options);
                    $(document).triggerHandler(STR_DISPLAY + '.shown', [that, that.$, options]);
                }, options.duration + 50);

                if(options.targetDismiss) {
                    $target.one((options.targetDismiss === true ? TAP_EVENT_NAME : options.targetDismiss) + TARGET_EVENT_SUFFIX, function(){that.hide();});
                }
            };

            if(animate) {
                if(animate === true) {
                    $target.addClass(suggestAnimate ? ('enter-' + suggestAnimate) : 'fade');
                } else {
                    if($.isStr(animate)) {
                        $target.addClass(animate.replace('suggest', suggestAnimate));
                    } else if($.isNum(animate)) {
                        options.duration = animate;
                    }
                }

                clearTimeout(that.animateCall);
                that.animateCall = setTimeout(afterShow, 10);
            } else {
                afterShow();
            }
        }, function() {
            $.callEvent('displayed', options.displayed, that, that.$, options);
            $(document).triggerHandler(STR_DISPLAY + '.displayed', [that, that.$, options]);

            if(options.plugSkin) {
                $target.find('[data-skin]').skin();
            }

            if(options.plugDisplay) {
                $target.find('[data-' + STR_DISPLAY + ']').display();
            }

            if($.fn.listenScroll) {
                $target.find('.listen-scroll').listenScroll();
            }
        });

        Display.last             = displayName;
        Display.all[displayName] = that;
    };

    Display.prototype.hide = function(extraOptions, callback) {
        if($.isFunction(extraOptions)) {
            callback = extraOptions;
            extraOptions = null;
        }

        var that = this;
        var options = that.last || that._getOptions(extraOptions);
        if($.callEvent('hide', options.hide, that, that.$, options) === false) return callback && callback();

        that.last = false;

        var $target = options.$target.off(TARGET_EVENT_SUFFIX),
            $backdrop = $('#backdrop-' + options.name);
        var afterHide = function() {
            if(options.layer) options.layer.addClass(STR_HIDDEN);
            $.callEvent(STR_HIDDEN, options[STR_HIDDEN], that, that.$, options);
            $(document).triggerHandler(STR_DISPLAY + '.' + STR_HIDDEN, [that, that.$, options]);
            $target.addClass(STR_HIDDEN);
            $backdrop.remove();
            $(STR_BODY).removeClass(STR_DISPLAY + '-show-' + options.name);
            if(options.layer) options.layer.remove();
        };

        if(options.activeClass && options.element) {
            $(options.element).removeClass(options.activeClass);
        }

        $target.removeClass(options.showInClass);
        $backdrop.removeClass('in');
        if(options.animate) {
            clearTimeout(that.animateCall);
            that.animateCall = setTimeout(afterHide, options.duration + 50);
        } else {
            afterHide();
        }
    };

    Display.prototype.isShow = function(options) {
        options = this._getOptions(options);
        return options.checkShow ? $.calValue(options.checkShow, this, options) : (options.$target ? options.$target.hasClass(options.showInClass) : options.last);
    };

    Display.prototype.toggle = function(options, callback) {
        var toggle;
        if(options === true || options === false) {
            toggle = options;
            options = $.isPlainObject(callback) ? callback : null;
            if(options) callback = null;
        } else {
            toggle = this.isShow(options);
        }
        this[toggle ? 'hide' : 'show'](options, callback);
    };

    Display.NAME = NAME;
    Display.DEFAULT = {
        // display: '',    // the display type

        trigger: TAP_EVENT_NAME,        // trigger event name
        // name: '',              // unique name
        triggerMethod: 'show', // trigger method: show, toggle, hide

        // target: null,   // page, tooltip, 
        // selector: null, // trigger event selector,
        // targetClass: null // CSS class be add to the target element
        // targetGroup: '',
        container: STR_BODY,
        // arrow: false,   // Display arrow beside target edge
        // scrollTop: false,
        plugSkin: true,
        plugDisplay: true,
        // targetDismiss: false,

        content: false,          // content source
        // remote: '',              // remote source
        // remoteType: 'html',      // html or json
        // remoteError: '',         // content or function for remote error
        // contentType: 'html',     // Content type: html or text
        // source: '',              // function or jquery selector
        // template: null,          // string to format content,
        loadingClass: STR_LOADING, // CSS class to append to target and body element

        showInClass: 'in',     // CSS class to be add after show target
        // showSingle: false,     // 
        animate: true,         // boolean, CSS classes or number for duration
        duration: 300,         // animation duration
        // backdrop: false,    // show backdrop or not,
        // placement: false,   // target placement, 'screen-center', 'screen-top-left'...
        keyboard: true,        // if true then hide target on press ESC
        backdropDismiss: true, // if true then dismiss display on tab backdrop
        // autoHide: 0,           // if set a number then auto hide the target after the given millionseconds

        // activeClass: '',    // active class add to the trigger element after target show and remove it after the target hide
        activeSingle: true, // make sure active class only be add to a single trigger element

        // events callback
        // show: null,     // callback before show target
        // shown: null,    // callback after show target
        // hide: null,     // callback before hide target
        // hidden: null,   // callback after hide target
        // loaded: null,   // callback after load target
    };

    Display.plugs = function(name, func, fnName) {
        if($.isPlainObject(name)) {
            $.each(name, Display.plugs);
        } else if(func) {
            Display.plugs[name] = func;
            name = name.indexOf('_') === 0 ? name.substr(1) : name;
            if(!$.fn[name] && fnName !== false) {
                $.bindFn(fnName || name, Display, {display: name});
            }
        } else {
            return Display.plugs[name];
        }
    };

    Display.all = {};

    Display.dismiss = function(name, callback) {
        if($.isFunction(name)) {
            callback = name;
            name = '';
        }
        name = name || Display.last;
        var display = Display.all[name];
        if(display) display.hide(callback);
    };

    $.bindFn(STR_DISPLAY, Display);
    $.Display = Display;

    $(function() {
        $('[data-' + STR_DISPLAY + ']').display();

        $(document).on(TAP_EVENT_NAME, '[data-dismiss="' + STR_DISPLAY + '"]', function() {
            var $this = $(this), dataName = 'data-' + STR_DISPLAY + '-name';
            name = $this.attr(dataName);
            if(!name || name == 'null') name = $this.closest('.' + STR_DISPLAY).attr(dataName);
            Display.dismiss(name);
        });
    });
}(CoreLib, undefined, window, document));

/* ========================================================================
 * MZUI: display.plugs.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

!(function($, undefined){
    'use strict';

    if(!$.Display) {
        console.error('display.plugs.js requires display.js');
        return;
    }

    var getSourceElement = function(name, element, oldSource, extraClass, nameClass) {
        var $element = $(element).next('.' + name);
        if(!$element.length) $element = oldSource;
        return $element || '<div class="' + (nameClass || name) + ' ' + (extraClass || '') + '"/>';
    };

    var isUndefinedThen = function(x, y) {
        return x === undefined ? y : x;
    };

    $.Display.plugs({
        dropdown: function(options) {
            var that = this,
                oldSource = options.source;
            return $.extend(options, {
                backdrop: isUndefinedThen(options.backdrop, 'clean'),
                source: options.target ? null : function() {
                    return getSourceElement('dropdown-menu', options.element, oldSource);
                },
                target: isUndefinedThen(options.target, '!new'),
                placement: isUndefinedThen(options.placement, 'beside'),
                activeClass: isUndefinedThen(options.activeClass, 'open'),
                targetDismiss: isUndefinedThen(options.targetDismiss, true)
            });
        },
        popover: function(options) {
            var that = this,
                oldSource = options.source;
            return $.extend(options, {
                arrow: isUndefinedThen(options.arrow, true),
                backdrop: isUndefinedThen(options.backdrop, 'clean'),
                source: options.target ? null : function() {
                    return getSourceElement('popover', options.element, oldSource, 'canvas with-padding');
                },
                target: isUndefinedThen(options.target, '!new'),
                placement: isUndefinedThen(options.placement, 'beside'),
                activeClass: isUndefinedThen(options.activeClass, 'open')
            });
        },
        messager: function(options) {
            var that = this;
            return $.extend(options, {
                autoHide: isUndefinedThen(options.autoHide, true),
                animate: (options.animate === undefined || options.animate === true) ? 'scale-suggest fade' : options.animate,
                // backdrop: isUndefinedThen(options.backdrop, 'clean'),
                closeButton: isUndefinedThen(options.closeButton, true),
                template: function(content, options) {
                    var $messager = $(options.source || '<div class="messager list-item"/>');
                    if(options.icon) $messager.append('<div class="avatar"><i class="icon icon-' + options.icon + '"/></div>');
                    $messager.append('<div class="title">' + content + '</div>');
                    if(options.closeButton) {
                        $messager.append('<button class="btn muted" type="button" data-dismiss="display"><i class="icon icon-remove"></i></button>');
                    }
                    return $messager.addClass(options.type || 'gray');
                },
                target: '!new',
                placement: isUndefinedThen(options.placement, 'bottom-center'),
                activeClass: isUndefinedThen(options.activeClass, 'open')
            });
        },
        modal: function(options) {
            var that = this,
                oldSource = options.source;
            return $.extend(options, {
                backdrop: isUndefinedThen(options.backdrop, 'modal-backdrop fade'),
                source: options.target ? null : function() {
                    return getSourceElement('modal', options.element, oldSource, '', 'content');
                },
                target: isUndefinedThen(options.target, '!new'),
                targetClass: 'modal ' + (options.targetClass || ''),
                placement: isUndefinedThen(options.placement, $.TapName === 'tap' ? 'bottom' : 'center'),
                activeClass: isUndefinedThen(options.activeClass, 'open')
            });
        },
        _collapse: function(options) {
            return $.extend(options, {
                triggerMethod: 'toggle',
                animate: false,
                showInClass: 'in',
                activeClass: 'collapse-open',
                showSingle: isUndefinedThen(options.group || options.showSingle, options.selector ? ('collapse-group-' + (++$.uuid)) : false)
            });
        }
    });

    $.Display.plugs('_self', function(options) {
        return $.extend(options, {
            trigger: false,
            target: '!self',
            targetZIndex: 'none',
            displayAuto: isUndefinedThen(options.displayAuto, true)
        });
    }, 'displaySelf');

    var messager = new $.Display({display: 'messager'});
    messager._show = messager.show;
    messager.show = function(content, options) {
        messager._show($.extend({content: content}, options));
    };
    $.each({
        primary  : 0,
        success  : 'ok-sign',
        info     : 'info-sign',
        warning  : 'warning-sign',
        danger   : 'exclamation-sign',
        important: 0,
        special  : 0
    }, function(name, icon){
        messager[name] = function(content, options) {
            messager._show($.extend({content: content, icon: icon || null, type: name}, options));
        };
    });
    $.messager = messager;
}(CoreLib, undefined));

/* ========================================================================
 * MZUI: scroll-listener.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($){
    'use strict';

    var NAME = 'mzui.scrollListener';

    var ScrollListener = function($element, options) {
        var that           = this;
        that.options       = options = $.extend({}, ScrollListener.DEFAULT, $element.data(), options);
        that.$             = $element;
        that.$container    = options.container ? (options.container == 'parent' ? that.$.parent() : $(options.container)) : that.$;
        that.lastScrollTop = 0;
        that.lastCallTime  = 0;
        var lastScrollCall = 0;

        $element.on('scroll.' + NAME, function() {
            clearTimeout(lastScrollCall);
            var time = new Date().getTime();
            lastScrollCall = setTimeout(function() {
                that.onScroll();
                that.lastCallTime = time;
            }, (time - that.lastCallTime) > options.handleInterval ? 0 : options.handleInterval);
        });

        if(options.canScrollClass) {
            var scrollHeight = (that.$[0] === window ? $('body') : that.$)[0].scrollHeight;
            that.$container.toggleClass(options.canScrollClass, scrollHeight > that.$.height());
        }
    };

    ScrollListener.prototype.onScroll = function() {
        var that            = this;
        var options         = that.options;
        var scrollTop       = that.$.scrollTop();
        var isInScroll      = scrollTop > 0;
        var scrollDirection = scrollTop > that.lastScrollTop ? 'down' : 'up';

        that.$container.toggleClass(options.inScrollClass, isInScroll)
            .toggleClass(options.directionClass + '-down', scrollDirection === 'down')
            .toggleClass(options.directionClass + '-up', scrollDirection === 'up')
            .toggleClass(options.directionClass + '-over', scrollTop + that.$.height() >= that.$[0].scrollHeight);

        that.$container.callEvent(that, 'listenScroll', [isInScroll, scrollDirection, scrollTop]);

        that.isInScroll      = isInScroll;
        that.scrollDirection = scrollDirection;
        that.lastScrollTop   = scrollTop;
    };

    ScrollListener.NAME = NAME;
    ScrollListener.DEFAULT = {
        minDelta      : 20,
        handleInterval: 100,
        inScrollClass : 'in-scroll',
        directionClass: 'scroll',
        canScrollClass: 'can-scroll'
    };

    $.bindFn('listenScroll', ScrollListener);

    $(function() {
        $(window).listenScroll({container: 'body'});
        $('.listen-scroll').listenScroll();
    });
}(CoreLib));

/* ========================================================================
 * MZUI: color.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, Math, undefined) {
    'use strict';

    var hexReg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/,
        N255 = 255,
        N360 = 360,
        N100 = 100,
        STR_STRING = 'string',
        STR_OBJECT = 'object';

    var isUndefined = function(x) {
        return x === undefined;
    };

    var isNotUndefined = function(x) {
        return !isUndefined(x);
    };

    var convertToInt = function(x) {
        return parseInt(x);
    };

    var clampNumber = function(x, max) {
        return clamp(number(x), max);
    };

    var convertToRgbInt = function(x) {
        return convertToInt(clampNumber(x, N255));
    };

    /* color */
    var Color = function(r, g, b, a) {
        var that = this;
        that.r = that.g = that.b = 0;
        that.a = 1;

        if(isNotUndefined(a)) that.a = clampNumber(a, 1);
        if(isNotUndefined(r) && isNotUndefined(g) && isNotUndefined(b)) {
            that.r = convertToRgbInt(r);
            that.g = convertToRgbInt(g);
            that.b = convertToRgbInt(b);
        } else if(isNotUndefined(r)) {
            var type = typeof(r);
            if(type == STR_STRING) {
                r = r.toLowerCase();
                if(r === 'transparent') {
                    that.a = 0;
                } else {
                    that.rgb(hexToRgb(r));
                }
            } else if(type == 'number' && isUndefined(g)) {
                that.r = that.g = that.b = convertToRgbInt(r);
            } else if(type == STR_OBJECT && isNotUndefined(r.r)) {
                that.r = convertToRgbInt(r.r);
                if(isNotUndefined(r.g)) that.g = convertToRgbInt(r.g);
                if(isNotUndefined(r.b)) that.b = convertToRgbInt(r.b);
                if(isNotUndefined(r.a)) that.a = clampNumber(r.a, 1);
            } else if(type == STR_OBJECT && isNotUndefined(r.h)) {
                var hsl = {
                    h: clampNumber(r.h, N360),
                    s: 1,
                    l: 1,
                    a: 1
                };
                if(isNotUndefined(r.s)) hsl.s = clampNumber(r.s, 1);
                if(isNotUndefined(r.l)) hsl.l = clampNumber(r.l, 1);
                if(isNotUndefined(r.a)) hsl.a = clampNumber(r.a, 1);

                that.rgb(hslToRgb(hsl));
            }
        }
    };

    Color.prototype.rgb = function(rgb) {
        var that = this;
        if(isNotUndefined(rgb)) {
            if(typeof(rgb) == STR_OBJECT) {
                if(isNotUndefined(rgb.r)) that.r = convertToRgbInt(rgb.r);
                if(isNotUndefined(rgb.g)) that.g = convertToRgbInt(rgb.g);
                if(isNotUndefined(rgb.b)) that.b = convertToRgbInt(rgb.b);
                if(isNotUndefined(rgb.a)) that.a = clampNumber(rgb.a, 1);
            } else {
                var v = convertToInt(number(rgb));
                that.r = v;
                that.g = v;
                that.b = v;
            }
            return that;
        } else return {
            r: that.r,
            g: that.g,
            b: that.b,
            a: that.a
        };
    };

    Color.prototype.hue = function(hue) {
        var that = this;
        var hsl = that.toHsl();

        if(isUndefined(hue)) return hsl.h;
        else {
            hsl.h = clampNumber(hue, N360);
            that.rgb(hslToRgb(hsl));
            return that;
        }
    };

    Color.prototype.darken = function(amount) {
        var that = this;
        var hsl = that.toHsl();

        hsl.l -= amount / N100;
        hsl.l = clamp(hsl.l, 1);

        that.rgb(hslToRgb(hsl));
        return that;
    };

    Color.prototype.clone = function() {
        var that = this;
        return new Color(that.r, that.g, that.b, that.a);
    };

    Color.prototype.lighten = function(amount) {
        return this.darken(-amount);
    };

    Color.prototype.fade = function(amount) {
        this.a = clamp(amount / N100, 1);

        return this;
    };

    // Color.prototype.spin = function(amount) {
    //     var hsl = this.toHsl();
    //     var hue = (hsl.h + amount) % N360;

    //     hsl.h = hue < 0 ? N360 + hue : hue;
    //     return this.rgb(hslToRgb(hsl));
    // };

    Color.prototype.toHsl = function() {
        var that = this;
        var r = that.r / N255,
            g = that.g / N255,
            b = that.b / N255,
            a = that.a;

        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2,
            d = max - min;

        if(max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch(max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return {
            h: h * N360,
            s: s,
            l: l,
            a: a
        };
    };

    Color.prototype.luma = function() {
        var r = this.r / N255,
            g = this.g / N255,
            b = this.b / N255;

        r = (r <= 0.03928) ? r / 12.92 : Math.pow(((r + 0.055) / 1.055), 2.4);
        g = (g <= 0.03928) ? g / 12.92 : Math.pow(((g + 0.055) / 1.055), 2.4);
        b = (b <= 0.03928) ? b / 12.92 : Math.pow(((b + 0.055) / 1.055), 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    Color.prototype.saturate = function(amount) {
        var hsl = this.toHsl();

        hsl.s += amount / N100;
        hsl.s = clamp(hsl.s);

        return this.rgb(hslToRgb(hsl));
    };

    // Color.prototype.desaturate = function(amount) {
    //     return this.saturate(-amount);
    // };

    Color.prototype.contrast = function(dark, light, threshold) {
        if(isUndefined(light)) light = new Color(N255, N255, N255, 1);
        else light = new Color(light);
        if(isUndefined(dark)) dark = new Color(0, 0, 0, 1);
        else dark = new Color(dark);

        if(this.a < 0.5) return dark;

        if(isUndefined(threshold)) threshold = 0.43;
        else threshold = number(threshold);

        if(dark.luma() > light.luma()) {
            var t = light;
            light = dark;
            dark = t;
        }

        if(this.luma() < threshold) {
            return light;
        } else {
            return dark;
        }
    };

    Color.prototype.hexStr = function() {
        var toHexValue = function(x) {
            x = x.toString(16);
            return x.length == 1 ? ('0' + x) : x;
        };
        return '#' + toHexValue(this.r) + toHexValue(this.g) + toHexValue(this.b);
    };

    Color.prototype.toCssStr = function() {
        var that = this;
        if(that.a > 0) {
            if(that.a < 1) {
                return 'rgba(' + that.r + ',' + that.g + ',' + that.b + ',' + that.a + ')';
            } else {
                return that.hexStr();
            }
        } else {
            return 'transparent';
        }
    };

    Color.isColor = isColor;

    /* helpers */
    function hexToRgb(hex) {
        hex = hex.toLowerCase();
        if(hex && hexReg.test(hex)) {
            var i;
            if(hex.length === 4) {
                var hexNew = '#';
                for(i = 1; i < 4; i += 1) {
                    hexNew += hex.slice(i, i + 1).concat(hex.slice(i, i + 1));
                }
                hex = hexNew;
            }

            var hexChange = [];
            for(i = 1; i < 7; i += 2) {
                hexChange.push(convertToInt('0x' + hex.slice(i, i + 2)));
            }
            return {
                r: hexChange[0],
                g: hexChange[1],
                b: hexChange[2],
                a: 1
            };
        } else {
            throw new Error('Wrong hex string! (hex: ' + hex + ')');
        }
    }

    function isColor(hex) {
        return typeof(hex) === STR_STRING && (hex.toLowerCase() === 'transparent' || hexReg.test($.trim(hex.toLowerCase())));
    }

    function hslToRgb(hsl) {
        var h = hsl.h,
            s = hsl.s,
            l = hsl.l,
            a = hsl.a;

        h = (number(h) % N360) / N360;
        s = clampNumber(s);
        l = clampNumber(l);
        a = clampNumber(a);

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        var r = {
            r: hue(h + 1 / 3) * N255,
            g: hue(h) * N255,
            b: hue(h - 1 / 3) * N255,
            a: a
        };

        return r;

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if(h * 6 < 1) {
                return m1 + (m2 - m1) * h * 6;
            } else if(h * 2 < 1) {
                return m2;
            } else if(h * 3 < 2) {
                return m1 + (m2 - m1) * (2 / 3 - h) * 6;
            } else {
                return m1;
            }
        }
    }

    function fit(n, end, start) {
        if(isUndefined(start)) start = 0;
        if(isUndefined(end)) end = N255;

        return Math.min(Math.max(n, start), end);
    }

    function clamp(v, max) {
        return fit(v, max);
    }

    function number(n) {
        if(typeof(n) == 'number') return n;
        return parseFloat(n);
    }

    $.Color = Color;

}(CoreLib, Math, undefined));


/* ========================================================================
 * MZUI: skin.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


(function($, undefined){
    'use strict';

    var NAME = 'mzui.skin',
        allSkins = {};

    var Skin = function($element, options) {
        var that     = this;
        that.options = options = $.extend({}, Skin.DEFAULT, $element.data(), options);
        that.$       = $element;

        that.paint();
    };

    Skin.prototype.paint = function(skin) {
        var that = this;
        var options = that.options,
            $e = that.$;
        var isPale = that.$.hasClass('pale') || options.pale,
            isOutline = options.outline || $e.hasClass('outline'),
            isTextTint = options.tint || $e.hasClass('text-tint'),
            color, skinName;

        skin = skin === undefined ? options.skin : skin;
        if(isPale === undefined && (that.$.hasClass('dark') || options.dark)) isPale = false;

        if($.isStr(skin) && skin.indexOf(':') > 0) {
            skin = skin.split(':');
            skinName = skin[0];
            skin = skin[1];
            var skinNum = parseInt(skin);
            if(skinNum !== NaN) skin = skinNum;
        }

        if(skin === '' || skin === undefined || skin === 'random') {
            skin = Math.round(Math.random() * 360);
        } else if(allSkins[skin]) {
            skin = allSkins[skin];
        } else if($.isStr(skin) && skin.indexOf('random') === 0) {
            allSkins[skin] = skin = Math.round(Math.random() * 360);
        } else if($.isStr(skin) && skin.indexOf('@') === 0) {
            var val = 0;
            for(var i = skin.length - 1; i > 0; --i) {
                val += Math.pow(3, (i - 1)) * skin.charCodeAt(i);
            }
            skin = val;
        }

        if(skinName) allSkins[skinName] = skin;

        if(typeof skin === 'number') {
            color = new $.Color({h: (skin * options.hueSpace) % 360, s: options.saturation, l: options.lightness});
        } else {
            color = new $.Color(skin);
        }

        that.color = color;
        if(color.luma() < options.threshold) { //  color is dark color
            if(isPale) {
                that.darkColor = color;
                that.color     = new $.Color($.extend(color.toHsl(), {l: options.paleLight}));
            }
        } else {
            if(isPale === false) {
                that.paleColor = color;
                that.color = new $.Color($.extend(color.toHsl(), {l: options.darkLight}));
            } else {
                isPale = true;
                if(isTextTint) that.darkColor = new $.Color($.extend(color.toHsl(), {l: options.darkLight}));
            }
        }

        var colorCss  = that.color.toCssStr();
        var cssStyle  = {
            backgroundColor: isOutline ? 'transparent' : colorCss,
            borderColor: colorCss,
            color: isOutline ? colorCss : (!isPale ? '#fff' : (isTextTint ? that.darkColor.toCssStr() : ''))
        };

        if(that.$.callEvent(that, 'paint', cssStyle) !== false) $e.css(cssStyle);
    };

    Skin.NAME = NAME;
    Skin.DEFAULT = {
        skin: 'random',
        hueSpace: 47,
        saturation: 0.7,
        lightness: 0.6,
        threshold: 0.5,
        darkLight: 0.4,
        paleLight: 0.92
    };

    Skin.all = allSkins;
    Skin.set = function(name, skin) {
        if($.isPlainObject(name)) {
            $.extend(Skin.all, name, skin);
        } else {
            Skin.all[name] = skin;
        }
        $('[data-skin]').skin('paint');
    };

    $.bindFn('skin', Skin);
    $.Skin = Skin;

    $(function() {
        $('[data-skin]').skin();
    });
}(CoreLib, undefined));

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value })
      }
    if (this[0]) $.each(this[0].elements, function(_, field){
      type = field.type, name = field.name
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        // !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
          add(type == 'file' ? field.files : $(field).val())
    })
    return result
  }

  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    if (0 in arguments) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)

/* ========================================================================
 * MZUI: ajaxform.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, window, undefined){
    'use strict';

    var NAME = 'mzui.ajaxform';

    var setAjaxForm = function($form, options)
    {
        if(!$form.length || $form.data(NAME)) return;
        $form.data(NAME, 1);

        var callEvent = function(name, event) {
            if(options && $.isFunction(options[name])) {
                return options[name](event);
            }
            $form.trigger(name + '.' + NAME, event);
        };

        var showMessage = function(message) {
            var $message = $form.find('.form-message');
            if($message.length) {
                var $content = $message.find('.content');
                ($content.length ? $content : $message).html(message);
                $message.show();
            } else {
                $.messager.warning(message, {time: 10000});
            }
        };

        callEvent('init');

        $form.on('submit', function(e) {
            e.preventDefault();

            var form = $form[0];
            var _formData = {};
            $.each($form.serializeArray(), function(idx, item) {
                var _name = item.name, 
                    _val = item.value,
                    _formVal = _formData[_name];
                if(_val instanceof FileList) {
                    var _fileVal = [];
                    for(var i = _val.length - 1; i >= 0; --i) {
                        _fileVal.push(_val[i]);
                    }
                    _val = _fileVal;
                }
                if($.isArray(_val)) {
                    if(_formVal === undefined) {
                        _formVal = _val;
                    } else if($.isArray(_formVal)) {
                        _formVal.push.apply(_formVal, _val);
                    } else {
                        _val.push(_formVal);
                        _formVal = _val;
                    }
                } else if(_name.lastIndexOf(']') === _name.length - 1) {
                    if(_formVal === undefined) {
                        _formVal = [_val];
                    } else {
                        _formVal.push(_val);
                    }
                } else {
                    _formVal = _val;
                }
                _formData[_name] = _formVal;
            });
            callEvent('onSubmit', _formData);

            var formData = new FormData();
            for (var key in _formData) {
                var _val = _formData[key];
                if($.isArray(_val)) {
                    for(var i = _val.length - 1; i >= 0; --i) {
                        formData.append(key, _val[i]);
                    }
                } else formData.append(key, _val);
            }
            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');
            $.ajax({
                url: form.action,
                type: form.method,
                processData: false,
                contentType: false,
                dataType: $form.data('type') || 'json',
                data: formData,
                success: function(response, status) {
                    try {
                        if(typeof response === 'string') response = $.parseJSON(response);
                        callEvent('onSuccess', response);
                        if(response.result === 'success') {
                            if(response.message) {
                                $.messager.success(response.message);
                                if(response.locate) {
                                    setTimeout(function(){location.href = response.locate;}, 1200);
                                }
                            } else {
                                if(response.locate) location.href = response.locate;
                            }
                        } else {
                            var message = response.message || response.reason || response.error;
                            if(message) {
                                if($.isPlainObject(message)) {
                                    $.each(message, function(msgId, msg) {
                                        if($.isArray(msg) && msg.length) {
                                            msg = msg.length > 1? ('<ul><li>' + msg.join('</li><li>') + '</li></ul>') : msg[0];
                                        }
                                        var $group = $form.find('#' + msgId + ', [name="' + msgId + '"]').closest('.control');
                                        if($group.length) {
                                            var $msg = $group.find('.help-text');
                                            if(!$msg.length) {
                                                $group.append('<div class="help-text">' + msg + '</div>');
                                            } else {
                                                $msg.html(msg);
                                            }
                                            $group.addClass('has-error');
                                        } else {
                                            showMessage(msg);
                                        }
                                    });
                                } else {
                                    showMessage(message);
                                }
                            }
                        }
                    } catch(e) {
                        showMessage(response || 'No response.');
                    }
                    callEvent('onResult', response);
                },
                error: function(xhr, errorType, error) {
                    showMessage('error: ' + error);
                    callEvent('onError', {xhr: xhr, errorType: errorType, error: error});
                    if(window.v && window.v.lang.timeout) {
                        $.messager.danger(window.v.lang.timeout);
                    }
                },
                complete: function(xhr, status) {
                    $submitBtn.attr('disabled', null).removeClass('disabled loading');
                    callEvent('onComplete', {xhr: xhr, status: status});
                }
            });
        }).on('change', function(e){
            $form.find('.form-message').hide();
            $(e.target).closest('.control').removeClass('has-error');
        });
    };

    $.ajaxForm = setAjaxForm;

    $.fn.ajaxform = function(options) {
        return $(this).each(function() {
            var $form = $(this);
            setAjaxForm($form, $.extend($form.data(), options));
        });
    };

    $(function(){$('.ajaxform').ajaxform();});

}(CoreLib, window, undefined));

var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6973 = x == null ? null : x;
  if(p[goog.typeOf(x__6973)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6974__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6974 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6974__delegate.call(this, array, i, idxs)
    };
    G__6974.cljs$lang$maxFixedArity = 2;
    G__6974.cljs$lang$applyTo = function(arglist__6975) {
      var array = cljs.core.first(arglist__6975);
      var i = cljs.core.first(cljs.core.next(arglist__6975));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6975));
      return G__6974__delegate(array, i, idxs)
    };
    G__6974.cljs$lang$arity$variadic = G__6974__delegate;
    return G__6974
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____7060 = this$;
      if(and__3822__auto____7060) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____7060
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2369__auto____7061 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7062 = cljs.core._invoke[goog.typeOf(x__2369__auto____7061)];
        if(or__3824__auto____7062) {
          return or__3824__auto____7062
        }else {
          var or__3824__auto____7063 = cljs.core._invoke["_"];
          if(or__3824__auto____7063) {
            return or__3824__auto____7063
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____7064 = this$;
      if(and__3822__auto____7064) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____7064
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2369__auto____7065 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7066 = cljs.core._invoke[goog.typeOf(x__2369__auto____7065)];
        if(or__3824__auto____7066) {
          return or__3824__auto____7066
        }else {
          var or__3824__auto____7067 = cljs.core._invoke["_"];
          if(or__3824__auto____7067) {
            return or__3824__auto____7067
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____7068 = this$;
      if(and__3822__auto____7068) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____7068
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2369__auto____7069 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7070 = cljs.core._invoke[goog.typeOf(x__2369__auto____7069)];
        if(or__3824__auto____7070) {
          return or__3824__auto____7070
        }else {
          var or__3824__auto____7071 = cljs.core._invoke["_"];
          if(or__3824__auto____7071) {
            return or__3824__auto____7071
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____7072 = this$;
      if(and__3822__auto____7072) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____7072
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2369__auto____7073 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7074 = cljs.core._invoke[goog.typeOf(x__2369__auto____7073)];
        if(or__3824__auto____7074) {
          return or__3824__auto____7074
        }else {
          var or__3824__auto____7075 = cljs.core._invoke["_"];
          if(or__3824__auto____7075) {
            return or__3824__auto____7075
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____7076 = this$;
      if(and__3822__auto____7076) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____7076
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2369__auto____7077 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7078 = cljs.core._invoke[goog.typeOf(x__2369__auto____7077)];
        if(or__3824__auto____7078) {
          return or__3824__auto____7078
        }else {
          var or__3824__auto____7079 = cljs.core._invoke["_"];
          if(or__3824__auto____7079) {
            return or__3824__auto____7079
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____7080 = this$;
      if(and__3822__auto____7080) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____7080
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2369__auto____7081 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7082 = cljs.core._invoke[goog.typeOf(x__2369__auto____7081)];
        if(or__3824__auto____7082) {
          return or__3824__auto____7082
        }else {
          var or__3824__auto____7083 = cljs.core._invoke["_"];
          if(or__3824__auto____7083) {
            return or__3824__auto____7083
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____7084 = this$;
      if(and__3822__auto____7084) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____7084
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2369__auto____7085 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7086 = cljs.core._invoke[goog.typeOf(x__2369__auto____7085)];
        if(or__3824__auto____7086) {
          return or__3824__auto____7086
        }else {
          var or__3824__auto____7087 = cljs.core._invoke["_"];
          if(or__3824__auto____7087) {
            return or__3824__auto____7087
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____7088 = this$;
      if(and__3822__auto____7088) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____7088
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2369__auto____7089 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7090 = cljs.core._invoke[goog.typeOf(x__2369__auto____7089)];
        if(or__3824__auto____7090) {
          return or__3824__auto____7090
        }else {
          var or__3824__auto____7091 = cljs.core._invoke["_"];
          if(or__3824__auto____7091) {
            return or__3824__auto____7091
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____7092 = this$;
      if(and__3822__auto____7092) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____7092
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2369__auto____7093 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7094 = cljs.core._invoke[goog.typeOf(x__2369__auto____7093)];
        if(or__3824__auto____7094) {
          return or__3824__auto____7094
        }else {
          var or__3824__auto____7095 = cljs.core._invoke["_"];
          if(or__3824__auto____7095) {
            return or__3824__auto____7095
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____7096 = this$;
      if(and__3822__auto____7096) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____7096
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2369__auto____7097 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7098 = cljs.core._invoke[goog.typeOf(x__2369__auto____7097)];
        if(or__3824__auto____7098) {
          return or__3824__auto____7098
        }else {
          var or__3824__auto____7099 = cljs.core._invoke["_"];
          if(or__3824__auto____7099) {
            return or__3824__auto____7099
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____7100 = this$;
      if(and__3822__auto____7100) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____7100
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2369__auto____7101 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7102 = cljs.core._invoke[goog.typeOf(x__2369__auto____7101)];
        if(or__3824__auto____7102) {
          return or__3824__auto____7102
        }else {
          var or__3824__auto____7103 = cljs.core._invoke["_"];
          if(or__3824__auto____7103) {
            return or__3824__auto____7103
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____7104 = this$;
      if(and__3822__auto____7104) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____7104
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2369__auto____7105 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7106 = cljs.core._invoke[goog.typeOf(x__2369__auto____7105)];
        if(or__3824__auto____7106) {
          return or__3824__auto____7106
        }else {
          var or__3824__auto____7107 = cljs.core._invoke["_"];
          if(or__3824__auto____7107) {
            return or__3824__auto____7107
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____7108 = this$;
      if(and__3822__auto____7108) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____7108
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2369__auto____7109 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7110 = cljs.core._invoke[goog.typeOf(x__2369__auto____7109)];
        if(or__3824__auto____7110) {
          return or__3824__auto____7110
        }else {
          var or__3824__auto____7111 = cljs.core._invoke["_"];
          if(or__3824__auto____7111) {
            return or__3824__auto____7111
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____7112 = this$;
      if(and__3822__auto____7112) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____7112
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2369__auto____7113 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7114 = cljs.core._invoke[goog.typeOf(x__2369__auto____7113)];
        if(or__3824__auto____7114) {
          return or__3824__auto____7114
        }else {
          var or__3824__auto____7115 = cljs.core._invoke["_"];
          if(or__3824__auto____7115) {
            return or__3824__auto____7115
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____7116 = this$;
      if(and__3822__auto____7116) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____7116
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2369__auto____7117 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7118 = cljs.core._invoke[goog.typeOf(x__2369__auto____7117)];
        if(or__3824__auto____7118) {
          return or__3824__auto____7118
        }else {
          var or__3824__auto____7119 = cljs.core._invoke["_"];
          if(or__3824__auto____7119) {
            return or__3824__auto____7119
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____7120 = this$;
      if(and__3822__auto____7120) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____7120
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2369__auto____7121 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7122 = cljs.core._invoke[goog.typeOf(x__2369__auto____7121)];
        if(or__3824__auto____7122) {
          return or__3824__auto____7122
        }else {
          var or__3824__auto____7123 = cljs.core._invoke["_"];
          if(or__3824__auto____7123) {
            return or__3824__auto____7123
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____7124 = this$;
      if(and__3822__auto____7124) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____7124
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2369__auto____7125 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7126 = cljs.core._invoke[goog.typeOf(x__2369__auto____7125)];
        if(or__3824__auto____7126) {
          return or__3824__auto____7126
        }else {
          var or__3824__auto____7127 = cljs.core._invoke["_"];
          if(or__3824__auto____7127) {
            return or__3824__auto____7127
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____7128 = this$;
      if(and__3822__auto____7128) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____7128
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2369__auto____7129 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7130 = cljs.core._invoke[goog.typeOf(x__2369__auto____7129)];
        if(or__3824__auto____7130) {
          return or__3824__auto____7130
        }else {
          var or__3824__auto____7131 = cljs.core._invoke["_"];
          if(or__3824__auto____7131) {
            return or__3824__auto____7131
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____7132 = this$;
      if(and__3822__auto____7132) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____7132
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2369__auto____7133 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7134 = cljs.core._invoke[goog.typeOf(x__2369__auto____7133)];
        if(or__3824__auto____7134) {
          return or__3824__auto____7134
        }else {
          var or__3824__auto____7135 = cljs.core._invoke["_"];
          if(or__3824__auto____7135) {
            return or__3824__auto____7135
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____7136 = this$;
      if(and__3822__auto____7136) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____7136
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2369__auto____7137 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7138 = cljs.core._invoke[goog.typeOf(x__2369__auto____7137)];
        if(or__3824__auto____7138) {
          return or__3824__auto____7138
        }else {
          var or__3824__auto____7139 = cljs.core._invoke["_"];
          if(or__3824__auto____7139) {
            return or__3824__auto____7139
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____7140 = this$;
      if(and__3822__auto____7140) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____7140
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2369__auto____7141 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7142 = cljs.core._invoke[goog.typeOf(x__2369__auto____7141)];
        if(or__3824__auto____7142) {
          return or__3824__auto____7142
        }else {
          var or__3824__auto____7143 = cljs.core._invoke["_"];
          if(or__3824__auto____7143) {
            return or__3824__auto____7143
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____7148 = coll;
    if(and__3822__auto____7148) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____7148
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2369__auto____7149 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7150 = cljs.core._count[goog.typeOf(x__2369__auto____7149)];
      if(or__3824__auto____7150) {
        return or__3824__auto____7150
      }else {
        var or__3824__auto____7151 = cljs.core._count["_"];
        if(or__3824__auto____7151) {
          return or__3824__auto____7151
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____7156 = coll;
    if(and__3822__auto____7156) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____7156
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2369__auto____7157 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7158 = cljs.core._empty[goog.typeOf(x__2369__auto____7157)];
      if(or__3824__auto____7158) {
        return or__3824__auto____7158
      }else {
        var or__3824__auto____7159 = cljs.core._empty["_"];
        if(or__3824__auto____7159) {
          return or__3824__auto____7159
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____7164 = coll;
    if(and__3822__auto____7164) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____7164
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2369__auto____7165 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7166 = cljs.core._conj[goog.typeOf(x__2369__auto____7165)];
      if(or__3824__auto____7166) {
        return or__3824__auto____7166
      }else {
        var or__3824__auto____7167 = cljs.core._conj["_"];
        if(or__3824__auto____7167) {
          return or__3824__auto____7167
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____7176 = coll;
      if(and__3822__auto____7176) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____7176
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2369__auto____7177 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7178 = cljs.core._nth[goog.typeOf(x__2369__auto____7177)];
        if(or__3824__auto____7178) {
          return or__3824__auto____7178
        }else {
          var or__3824__auto____7179 = cljs.core._nth["_"];
          if(or__3824__auto____7179) {
            return or__3824__auto____7179
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____7180 = coll;
      if(and__3822__auto____7180) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____7180
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2369__auto____7181 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7182 = cljs.core._nth[goog.typeOf(x__2369__auto____7181)];
        if(or__3824__auto____7182) {
          return or__3824__auto____7182
        }else {
          var or__3824__auto____7183 = cljs.core._nth["_"];
          if(or__3824__auto____7183) {
            return or__3824__auto____7183
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____7188 = coll;
    if(and__3822__auto____7188) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____7188
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2369__auto____7189 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7190 = cljs.core._first[goog.typeOf(x__2369__auto____7189)];
      if(or__3824__auto____7190) {
        return or__3824__auto____7190
      }else {
        var or__3824__auto____7191 = cljs.core._first["_"];
        if(or__3824__auto____7191) {
          return or__3824__auto____7191
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____7196 = coll;
    if(and__3822__auto____7196) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____7196
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2369__auto____7197 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7198 = cljs.core._rest[goog.typeOf(x__2369__auto____7197)];
      if(or__3824__auto____7198) {
        return or__3824__auto____7198
      }else {
        var or__3824__auto____7199 = cljs.core._rest["_"];
        if(or__3824__auto____7199) {
          return or__3824__auto____7199
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____7204 = coll;
    if(and__3822__auto____7204) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____7204
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2369__auto____7205 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7206 = cljs.core._next[goog.typeOf(x__2369__auto____7205)];
      if(or__3824__auto____7206) {
        return or__3824__auto____7206
      }else {
        var or__3824__auto____7207 = cljs.core._next["_"];
        if(or__3824__auto____7207) {
          return or__3824__auto____7207
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____7216 = o;
      if(and__3822__auto____7216) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____7216
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2369__auto____7217 = o == null ? null : o;
      return function() {
        var or__3824__auto____7218 = cljs.core._lookup[goog.typeOf(x__2369__auto____7217)];
        if(or__3824__auto____7218) {
          return or__3824__auto____7218
        }else {
          var or__3824__auto____7219 = cljs.core._lookup["_"];
          if(or__3824__auto____7219) {
            return or__3824__auto____7219
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____7220 = o;
      if(and__3822__auto____7220) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____7220
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2369__auto____7221 = o == null ? null : o;
      return function() {
        var or__3824__auto____7222 = cljs.core._lookup[goog.typeOf(x__2369__auto____7221)];
        if(or__3824__auto____7222) {
          return or__3824__auto____7222
        }else {
          var or__3824__auto____7223 = cljs.core._lookup["_"];
          if(or__3824__auto____7223) {
            return or__3824__auto____7223
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____7228 = coll;
    if(and__3822__auto____7228) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____7228
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2369__auto____7229 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7230 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2369__auto____7229)];
      if(or__3824__auto____7230) {
        return or__3824__auto____7230
      }else {
        var or__3824__auto____7231 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____7231) {
          return or__3824__auto____7231
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____7236 = coll;
    if(and__3822__auto____7236) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____7236
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2369__auto____7237 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7238 = cljs.core._assoc[goog.typeOf(x__2369__auto____7237)];
      if(or__3824__auto____7238) {
        return or__3824__auto____7238
      }else {
        var or__3824__auto____7239 = cljs.core._assoc["_"];
        if(or__3824__auto____7239) {
          return or__3824__auto____7239
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____7244 = coll;
    if(and__3822__auto____7244) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____7244
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2369__auto____7245 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7246 = cljs.core._dissoc[goog.typeOf(x__2369__auto____7245)];
      if(or__3824__auto____7246) {
        return or__3824__auto____7246
      }else {
        var or__3824__auto____7247 = cljs.core._dissoc["_"];
        if(or__3824__auto____7247) {
          return or__3824__auto____7247
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____7252 = coll;
    if(and__3822__auto____7252) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____7252
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2369__auto____7253 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7254 = cljs.core._key[goog.typeOf(x__2369__auto____7253)];
      if(or__3824__auto____7254) {
        return or__3824__auto____7254
      }else {
        var or__3824__auto____7255 = cljs.core._key["_"];
        if(or__3824__auto____7255) {
          return or__3824__auto____7255
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____7260 = coll;
    if(and__3822__auto____7260) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____7260
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2369__auto____7261 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7262 = cljs.core._val[goog.typeOf(x__2369__auto____7261)];
      if(or__3824__auto____7262) {
        return or__3824__auto____7262
      }else {
        var or__3824__auto____7263 = cljs.core._val["_"];
        if(or__3824__auto____7263) {
          return or__3824__auto____7263
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____7268 = coll;
    if(and__3822__auto____7268) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____7268
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2369__auto____7269 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7270 = cljs.core._disjoin[goog.typeOf(x__2369__auto____7269)];
      if(or__3824__auto____7270) {
        return or__3824__auto____7270
      }else {
        var or__3824__auto____7271 = cljs.core._disjoin["_"];
        if(or__3824__auto____7271) {
          return or__3824__auto____7271
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____7276 = coll;
    if(and__3822__auto____7276) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____7276
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2369__auto____7277 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7278 = cljs.core._peek[goog.typeOf(x__2369__auto____7277)];
      if(or__3824__auto____7278) {
        return or__3824__auto____7278
      }else {
        var or__3824__auto____7279 = cljs.core._peek["_"];
        if(or__3824__auto____7279) {
          return or__3824__auto____7279
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____7284 = coll;
    if(and__3822__auto____7284) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____7284
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2369__auto____7285 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7286 = cljs.core._pop[goog.typeOf(x__2369__auto____7285)];
      if(or__3824__auto____7286) {
        return or__3824__auto____7286
      }else {
        var or__3824__auto____7287 = cljs.core._pop["_"];
        if(or__3824__auto____7287) {
          return or__3824__auto____7287
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____7292 = coll;
    if(and__3822__auto____7292) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____7292
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2369__auto____7293 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7294 = cljs.core._assoc_n[goog.typeOf(x__2369__auto____7293)];
      if(or__3824__auto____7294) {
        return or__3824__auto____7294
      }else {
        var or__3824__auto____7295 = cljs.core._assoc_n["_"];
        if(or__3824__auto____7295) {
          return or__3824__auto____7295
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____7300 = o;
    if(and__3822__auto____7300) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____7300
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2369__auto____7301 = o == null ? null : o;
    return function() {
      var or__3824__auto____7302 = cljs.core._deref[goog.typeOf(x__2369__auto____7301)];
      if(or__3824__auto____7302) {
        return or__3824__auto____7302
      }else {
        var or__3824__auto____7303 = cljs.core._deref["_"];
        if(or__3824__auto____7303) {
          return or__3824__auto____7303
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____7308 = o;
    if(and__3822__auto____7308) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____7308
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2369__auto____7309 = o == null ? null : o;
    return function() {
      var or__3824__auto____7310 = cljs.core._deref_with_timeout[goog.typeOf(x__2369__auto____7309)];
      if(or__3824__auto____7310) {
        return or__3824__auto____7310
      }else {
        var or__3824__auto____7311 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____7311) {
          return or__3824__auto____7311
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____7316 = o;
    if(and__3822__auto____7316) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____7316
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2369__auto____7317 = o == null ? null : o;
    return function() {
      var or__3824__auto____7318 = cljs.core._meta[goog.typeOf(x__2369__auto____7317)];
      if(or__3824__auto____7318) {
        return or__3824__auto____7318
      }else {
        var or__3824__auto____7319 = cljs.core._meta["_"];
        if(or__3824__auto____7319) {
          return or__3824__auto____7319
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____7324 = o;
    if(and__3822__auto____7324) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____7324
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2369__auto____7325 = o == null ? null : o;
    return function() {
      var or__3824__auto____7326 = cljs.core._with_meta[goog.typeOf(x__2369__auto____7325)];
      if(or__3824__auto____7326) {
        return or__3824__auto____7326
      }else {
        var or__3824__auto____7327 = cljs.core._with_meta["_"];
        if(or__3824__auto____7327) {
          return or__3824__auto____7327
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____7336 = coll;
      if(and__3822__auto____7336) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____7336
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2369__auto____7337 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7338 = cljs.core._reduce[goog.typeOf(x__2369__auto____7337)];
        if(or__3824__auto____7338) {
          return or__3824__auto____7338
        }else {
          var or__3824__auto____7339 = cljs.core._reduce["_"];
          if(or__3824__auto____7339) {
            return or__3824__auto____7339
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____7340 = coll;
      if(and__3822__auto____7340) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____7340
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2369__auto____7341 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7342 = cljs.core._reduce[goog.typeOf(x__2369__auto____7341)];
        if(or__3824__auto____7342) {
          return or__3824__auto____7342
        }else {
          var or__3824__auto____7343 = cljs.core._reduce["_"];
          if(or__3824__auto____7343) {
            return or__3824__auto____7343
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____7348 = coll;
    if(and__3822__auto____7348) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____7348
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2369__auto____7349 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7350 = cljs.core._kv_reduce[goog.typeOf(x__2369__auto____7349)];
      if(or__3824__auto____7350) {
        return or__3824__auto____7350
      }else {
        var or__3824__auto____7351 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____7351) {
          return or__3824__auto____7351
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____7356 = o;
    if(and__3822__auto____7356) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7356
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2369__auto____7357 = o == null ? null : o;
    return function() {
      var or__3824__auto____7358 = cljs.core._equiv[goog.typeOf(x__2369__auto____7357)];
      if(or__3824__auto____7358) {
        return or__3824__auto____7358
      }else {
        var or__3824__auto____7359 = cljs.core._equiv["_"];
        if(or__3824__auto____7359) {
          return or__3824__auto____7359
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____7364 = o;
    if(and__3822__auto____7364) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7364
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2369__auto____7365 = o == null ? null : o;
    return function() {
      var or__3824__auto____7366 = cljs.core._hash[goog.typeOf(x__2369__auto____7365)];
      if(or__3824__auto____7366) {
        return or__3824__auto____7366
      }else {
        var or__3824__auto____7367 = cljs.core._hash["_"];
        if(or__3824__auto____7367) {
          return or__3824__auto____7367
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____7372 = o;
    if(and__3822__auto____7372) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7372
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2369__auto____7373 = o == null ? null : o;
    return function() {
      var or__3824__auto____7374 = cljs.core._seq[goog.typeOf(x__2369__auto____7373)];
      if(or__3824__auto____7374) {
        return or__3824__auto____7374
      }else {
        var or__3824__auto____7375 = cljs.core._seq["_"];
        if(or__3824__auto____7375) {
          return or__3824__auto____7375
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____7380 = coll;
    if(and__3822__auto____7380) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7380
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2369__auto____7381 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7382 = cljs.core._rseq[goog.typeOf(x__2369__auto____7381)];
      if(or__3824__auto____7382) {
        return or__3824__auto____7382
      }else {
        var or__3824__auto____7383 = cljs.core._rseq["_"];
        if(or__3824__auto____7383) {
          return or__3824__auto____7383
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7388 = coll;
    if(and__3822__auto____7388) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7388
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2369__auto____7389 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7390 = cljs.core._sorted_seq[goog.typeOf(x__2369__auto____7389)];
      if(or__3824__auto____7390) {
        return or__3824__auto____7390
      }else {
        var or__3824__auto____7391 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7391) {
          return or__3824__auto____7391
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7396 = coll;
    if(and__3822__auto____7396) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7396
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2369__auto____7397 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7398 = cljs.core._sorted_seq_from[goog.typeOf(x__2369__auto____7397)];
      if(or__3824__auto____7398) {
        return or__3824__auto____7398
      }else {
        var or__3824__auto____7399 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7399) {
          return or__3824__auto____7399
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7404 = coll;
    if(and__3822__auto____7404) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7404
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2369__auto____7405 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7406 = cljs.core._entry_key[goog.typeOf(x__2369__auto____7405)];
      if(or__3824__auto____7406) {
        return or__3824__auto____7406
      }else {
        var or__3824__auto____7407 = cljs.core._entry_key["_"];
        if(or__3824__auto____7407) {
          return or__3824__auto____7407
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7412 = coll;
    if(and__3822__auto____7412) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7412
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2369__auto____7413 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7414 = cljs.core._comparator[goog.typeOf(x__2369__auto____7413)];
      if(or__3824__auto____7414) {
        return or__3824__auto____7414
      }else {
        var or__3824__auto____7415 = cljs.core._comparator["_"];
        if(or__3824__auto____7415) {
          return or__3824__auto____7415
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____7420 = o;
    if(and__3822__auto____7420) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7420
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2369__auto____7421 = o == null ? null : o;
    return function() {
      var or__3824__auto____7422 = cljs.core._pr_seq[goog.typeOf(x__2369__auto____7421)];
      if(or__3824__auto____7422) {
        return or__3824__auto____7422
      }else {
        var or__3824__auto____7423 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7423) {
          return or__3824__auto____7423
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____7428 = d;
    if(and__3822__auto____7428) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7428
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2369__auto____7429 = d == null ? null : d;
    return function() {
      var or__3824__auto____7430 = cljs.core._realized_QMARK_[goog.typeOf(x__2369__auto____7429)];
      if(or__3824__auto____7430) {
        return or__3824__auto____7430
      }else {
        var or__3824__auto____7431 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7431) {
          return or__3824__auto____7431
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____7436 = this$;
    if(and__3822__auto____7436) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7436
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2369__auto____7437 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7438 = cljs.core._notify_watches[goog.typeOf(x__2369__auto____7437)];
      if(or__3824__auto____7438) {
        return or__3824__auto____7438
      }else {
        var or__3824__auto____7439 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7439) {
          return or__3824__auto____7439
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7444 = this$;
    if(and__3822__auto____7444) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7444
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2369__auto____7445 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7446 = cljs.core._add_watch[goog.typeOf(x__2369__auto____7445)];
      if(or__3824__auto____7446) {
        return or__3824__auto____7446
      }else {
        var or__3824__auto____7447 = cljs.core._add_watch["_"];
        if(or__3824__auto____7447) {
          return or__3824__auto____7447
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7452 = this$;
    if(and__3822__auto____7452) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7452
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2369__auto____7453 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7454 = cljs.core._remove_watch[goog.typeOf(x__2369__auto____7453)];
      if(or__3824__auto____7454) {
        return or__3824__auto____7454
      }else {
        var or__3824__auto____7455 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7455) {
          return or__3824__auto____7455
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7460 = coll;
    if(and__3822__auto____7460) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7460
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2369__auto____7461 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7462 = cljs.core._as_transient[goog.typeOf(x__2369__auto____7461)];
      if(or__3824__auto____7462) {
        return or__3824__auto____7462
      }else {
        var or__3824__auto____7463 = cljs.core._as_transient["_"];
        if(or__3824__auto____7463) {
          return or__3824__auto____7463
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7468 = tcoll;
    if(and__3822__auto____7468) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7468
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2369__auto____7469 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7470 = cljs.core._conj_BANG_[goog.typeOf(x__2369__auto____7469)];
      if(or__3824__auto____7470) {
        return or__3824__auto____7470
      }else {
        var or__3824__auto____7471 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7471) {
          return or__3824__auto____7471
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7476 = tcoll;
    if(and__3822__auto____7476) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7476
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2369__auto____7477 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7478 = cljs.core._persistent_BANG_[goog.typeOf(x__2369__auto____7477)];
      if(or__3824__auto____7478) {
        return or__3824__auto____7478
      }else {
        var or__3824__auto____7479 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7479) {
          return or__3824__auto____7479
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7484 = tcoll;
    if(and__3822__auto____7484) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7484
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2369__auto____7485 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7486 = cljs.core._assoc_BANG_[goog.typeOf(x__2369__auto____7485)];
      if(or__3824__auto____7486) {
        return or__3824__auto____7486
      }else {
        var or__3824__auto____7487 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7487) {
          return or__3824__auto____7487
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7492 = tcoll;
    if(and__3822__auto____7492) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7492
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2369__auto____7493 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7494 = cljs.core._dissoc_BANG_[goog.typeOf(x__2369__auto____7493)];
      if(or__3824__auto____7494) {
        return or__3824__auto____7494
      }else {
        var or__3824__auto____7495 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7495) {
          return or__3824__auto____7495
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7500 = tcoll;
    if(and__3822__auto____7500) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7500
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2369__auto____7501 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7502 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2369__auto____7501)];
      if(or__3824__auto____7502) {
        return or__3824__auto____7502
      }else {
        var or__3824__auto____7503 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7503) {
          return or__3824__auto____7503
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7508 = tcoll;
    if(and__3822__auto____7508) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7508
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2369__auto____7509 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7510 = cljs.core._pop_BANG_[goog.typeOf(x__2369__auto____7509)];
      if(or__3824__auto____7510) {
        return or__3824__auto____7510
      }else {
        var or__3824__auto____7511 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7511) {
          return or__3824__auto____7511
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7516 = tcoll;
    if(and__3822__auto____7516) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7516
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2369__auto____7517 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7518 = cljs.core._disjoin_BANG_[goog.typeOf(x__2369__auto____7517)];
      if(or__3824__auto____7518) {
        return or__3824__auto____7518
      }else {
        var or__3824__auto____7519 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7519) {
          return or__3824__auto____7519
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7524 = x;
    if(and__3822__auto____7524) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7524
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2369__auto____7525 = x == null ? null : x;
    return function() {
      var or__3824__auto____7526 = cljs.core._compare[goog.typeOf(x__2369__auto____7525)];
      if(or__3824__auto____7526) {
        return or__3824__auto____7526
      }else {
        var or__3824__auto____7527 = cljs.core._compare["_"];
        if(or__3824__auto____7527) {
          return or__3824__auto____7527
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7532 = coll;
    if(and__3822__auto____7532) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7532
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2369__auto____7533 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7534 = cljs.core._drop_first[goog.typeOf(x__2369__auto____7533)];
      if(or__3824__auto____7534) {
        return or__3824__auto____7534
      }else {
        var or__3824__auto____7535 = cljs.core._drop_first["_"];
        if(or__3824__auto____7535) {
          return or__3824__auto____7535
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7540 = coll;
    if(and__3822__auto____7540) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7540
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2369__auto____7541 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7542 = cljs.core._chunked_first[goog.typeOf(x__2369__auto____7541)];
      if(or__3824__auto____7542) {
        return or__3824__auto____7542
      }else {
        var or__3824__auto____7543 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7543) {
          return or__3824__auto____7543
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7548 = coll;
    if(and__3822__auto____7548) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7548
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2369__auto____7549 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7550 = cljs.core._chunked_rest[goog.typeOf(x__2369__auto____7549)];
      if(or__3824__auto____7550) {
        return or__3824__auto____7550
      }else {
        var or__3824__auto____7551 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7551) {
          return or__3824__auto____7551
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7556 = coll;
    if(and__3822__auto____7556) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7556
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2369__auto____7557 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7558 = cljs.core._chunked_next[goog.typeOf(x__2369__auto____7557)];
      if(or__3824__auto____7558) {
        return or__3824__auto____7558
      }else {
        var or__3824__auto____7559 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7559) {
          return or__3824__auto____7559
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7561 = x === y;
    if(or__3824__auto____7561) {
      return or__3824__auto____7561
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7562__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7563 = y;
            var G__7564 = cljs.core.first.call(null, more);
            var G__7565 = cljs.core.next.call(null, more);
            x = G__7563;
            y = G__7564;
            more = G__7565;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7562 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7562__delegate.call(this, x, y, more)
    };
    G__7562.cljs$lang$maxFixedArity = 2;
    G__7562.cljs$lang$applyTo = function(arglist__7566) {
      var x = cljs.core.first(arglist__7566);
      var y = cljs.core.first(cljs.core.next(arglist__7566));
      var more = cljs.core.rest(cljs.core.next(arglist__7566));
      return G__7562__delegate(x, y, more)
    };
    G__7562.cljs$lang$arity$variadic = G__7562__delegate;
    return G__7562
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7567 = null;
  var G__7567__2 = function(o, k) {
    return null
  };
  var G__7567__3 = function(o, k, not_found) {
    return not_found
  };
  G__7567 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7567__2.call(this, o, k);
      case 3:
        return G__7567__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7567
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7568 = null;
  var G__7568__2 = function(_, f) {
    return f.call(null)
  };
  var G__7568__3 = function(_, f, start) {
    return start
  };
  G__7568 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7568__2.call(this, _, f);
      case 3:
        return G__7568__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7568
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7569 = null;
  var G__7569__2 = function(_, n) {
    return null
  };
  var G__7569__3 = function(_, n, not_found) {
    return not_found
  };
  G__7569 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7569__2.call(this, _, n);
      case 3:
        return G__7569__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7569
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7570 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7570) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7570
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7583 = cljs.core._count.call(null, cicoll);
    if(cnt__7583 === 0) {
      return f.call(null)
    }else {
      var val__7584 = cljs.core._nth.call(null, cicoll, 0);
      var n__7585 = 1;
      while(true) {
        if(n__7585 < cnt__7583) {
          var nval__7586 = f.call(null, val__7584, cljs.core._nth.call(null, cicoll, n__7585));
          if(cljs.core.reduced_QMARK_.call(null, nval__7586)) {
            return cljs.core.deref.call(null, nval__7586)
          }else {
            var G__7595 = nval__7586;
            var G__7596 = n__7585 + 1;
            val__7584 = G__7595;
            n__7585 = G__7596;
            continue
          }
        }else {
          return val__7584
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7587 = cljs.core._count.call(null, cicoll);
    var val__7588 = val;
    var n__7589 = 0;
    while(true) {
      if(n__7589 < cnt__7587) {
        var nval__7590 = f.call(null, val__7588, cljs.core._nth.call(null, cicoll, n__7589));
        if(cljs.core.reduced_QMARK_.call(null, nval__7590)) {
          return cljs.core.deref.call(null, nval__7590)
        }else {
          var G__7597 = nval__7590;
          var G__7598 = n__7589 + 1;
          val__7588 = G__7597;
          n__7589 = G__7598;
          continue
        }
      }else {
        return val__7588
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7591 = cljs.core._count.call(null, cicoll);
    var val__7592 = val;
    var n__7593 = idx;
    while(true) {
      if(n__7593 < cnt__7591) {
        var nval__7594 = f.call(null, val__7592, cljs.core._nth.call(null, cicoll, n__7593));
        if(cljs.core.reduced_QMARK_.call(null, nval__7594)) {
          return cljs.core.deref.call(null, nval__7594)
        }else {
          var G__7599 = nval__7594;
          var G__7600 = n__7593 + 1;
          val__7592 = G__7599;
          n__7593 = G__7600;
          continue
        }
      }else {
        return val__7592
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7613 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7614 = arr[0];
      var n__7615 = 1;
      while(true) {
        if(n__7615 < cnt__7613) {
          var nval__7616 = f.call(null, val__7614, arr[n__7615]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7616)) {
            return cljs.core.deref.call(null, nval__7616)
          }else {
            var G__7625 = nval__7616;
            var G__7626 = n__7615 + 1;
            val__7614 = G__7625;
            n__7615 = G__7626;
            continue
          }
        }else {
          return val__7614
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7617 = arr.length;
    var val__7618 = val;
    var n__7619 = 0;
    while(true) {
      if(n__7619 < cnt__7617) {
        var nval__7620 = f.call(null, val__7618, arr[n__7619]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7620)) {
          return cljs.core.deref.call(null, nval__7620)
        }else {
          var G__7627 = nval__7620;
          var G__7628 = n__7619 + 1;
          val__7618 = G__7627;
          n__7619 = G__7628;
          continue
        }
      }else {
        return val__7618
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7621 = arr.length;
    var val__7622 = val;
    var n__7623 = idx;
    while(true) {
      if(n__7623 < cnt__7621) {
        var nval__7624 = f.call(null, val__7622, arr[n__7623]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7624)) {
          return cljs.core.deref.call(null, nval__7624)
        }else {
          var G__7629 = nval__7624;
          var G__7630 = n__7623 + 1;
          val__7622 = G__7629;
          n__7623 = G__7630;
          continue
        }
      }else {
        return val__7622
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7631 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7632 = this;
  if(this__7632.i + 1 < this__7632.a.length) {
    return new cljs.core.IndexedSeq(this__7632.a, this__7632.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7633 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7634 = this;
  var c__7635 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7635 > 0) {
    return new cljs.core.RSeq(coll, c__7635 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7636 = this;
  var this__7637 = this;
  return cljs.core.pr_str.call(null, this__7637)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7638 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7638.a)) {
    return cljs.core.ci_reduce.call(null, this__7638.a, f, this__7638.a[this__7638.i], this__7638.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7638.a[this__7638.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7639 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7639.a)) {
    return cljs.core.ci_reduce.call(null, this__7639.a, f, start, this__7639.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7640 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7641 = this;
  return this__7641.a.length - this__7641.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7642 = this;
  return this__7642.a[this__7642.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7643 = this;
  if(this__7643.i + 1 < this__7643.a.length) {
    return new cljs.core.IndexedSeq(this__7643.a, this__7643.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7644 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7645 = this;
  var i__7646 = n + this__7645.i;
  if(i__7646 < this__7645.a.length) {
    return this__7645.a[i__7646]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7647 = this;
  var i__7648 = n + this__7647.i;
  if(i__7648 < this__7647.a.length) {
    return this__7647.a[i__7648]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7649 = null;
  var G__7649__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7649__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7649 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7649__2.call(this, array, f);
      case 3:
        return G__7649__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7649
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7650 = null;
  var G__7650__2 = function(array, k) {
    return array[k]
  };
  var G__7650__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7650 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7650__2.call(this, array, k);
      case 3:
        return G__7650__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7650
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7651 = null;
  var G__7651__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7651__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7651 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7651__2.call(this, array, n);
      case 3:
        return G__7651__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7651
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7652 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7653 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7654 = this;
  var this__7655 = this;
  return cljs.core.pr_str.call(null, this__7655)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7656 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7657 = this;
  return this__7657.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7658 = this;
  return cljs.core._nth.call(null, this__7658.ci, this__7658.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7659 = this;
  if(this__7659.i > 0) {
    return new cljs.core.RSeq(this__7659.ci, this__7659.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7660 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7661 = this;
  return new cljs.core.RSeq(this__7661.ci, this__7661.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7662 = this;
  return this__7662.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7666__7667 = coll;
      if(G__7666__7667) {
        if(function() {
          var or__3824__auto____7668 = G__7666__7667.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7668) {
            return or__3824__auto____7668
          }else {
            return G__7666__7667.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7666__7667.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7666__7667)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7666__7667)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7673__7674 = coll;
      if(G__7673__7674) {
        if(function() {
          var or__3824__auto____7675 = G__7673__7674.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7675) {
            return or__3824__auto____7675
          }else {
            return G__7673__7674.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7673__7674.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7673__7674)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7673__7674)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7676 = cljs.core.seq.call(null, coll);
      if(s__7676 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7676)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7681__7682 = coll;
      if(G__7681__7682) {
        if(function() {
          var or__3824__auto____7683 = G__7681__7682.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7683) {
            return or__3824__auto____7683
          }else {
            return G__7681__7682.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7681__7682.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7681__7682)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7681__7682)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7684 = cljs.core.seq.call(null, coll);
      if(!(s__7684 == null)) {
        return cljs.core._rest.call(null, s__7684)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7688__7689 = coll;
      if(G__7688__7689) {
        if(function() {
          var or__3824__auto____7690 = G__7688__7689.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7690) {
            return or__3824__auto____7690
          }else {
            return G__7688__7689.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7688__7689.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7688__7689)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7688__7689)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7692 = cljs.core.next.call(null, s);
    if(!(sn__7692 == null)) {
      var G__7693 = sn__7692;
      s = G__7693;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7694__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7695 = conj.call(null, coll, x);
          var G__7696 = cljs.core.first.call(null, xs);
          var G__7697 = cljs.core.next.call(null, xs);
          coll = G__7695;
          x = G__7696;
          xs = G__7697;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7694 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7694__delegate.call(this, coll, x, xs)
    };
    G__7694.cljs$lang$maxFixedArity = 2;
    G__7694.cljs$lang$applyTo = function(arglist__7698) {
      var coll = cljs.core.first(arglist__7698);
      var x = cljs.core.first(cljs.core.next(arglist__7698));
      var xs = cljs.core.rest(cljs.core.next(arglist__7698));
      return G__7694__delegate(coll, x, xs)
    };
    G__7694.cljs$lang$arity$variadic = G__7694__delegate;
    return G__7694
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7701 = cljs.core.seq.call(null, coll);
  var acc__7702 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7701)) {
      return acc__7702 + cljs.core._count.call(null, s__7701)
    }else {
      var G__7703 = cljs.core.next.call(null, s__7701);
      var G__7704 = acc__7702 + 1;
      s__7701 = G__7703;
      acc__7702 = G__7704;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7711__7712 = coll;
        if(G__7711__7712) {
          if(function() {
            var or__3824__auto____7713 = G__7711__7712.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7713) {
              return or__3824__auto____7713
            }else {
              return G__7711__7712.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7711__7712.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7711__7712)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7711__7712)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7714__7715 = coll;
        if(G__7714__7715) {
          if(function() {
            var or__3824__auto____7716 = G__7714__7715.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7716) {
              return or__3824__auto____7716
            }else {
              return G__7714__7715.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7714__7715.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7714__7715)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7714__7715)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7719__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7718 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7720 = ret__7718;
          var G__7721 = cljs.core.first.call(null, kvs);
          var G__7722 = cljs.core.second.call(null, kvs);
          var G__7723 = cljs.core.nnext.call(null, kvs);
          coll = G__7720;
          k = G__7721;
          v = G__7722;
          kvs = G__7723;
          continue
        }else {
          return ret__7718
        }
        break
      }
    };
    var G__7719 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7719__delegate.call(this, coll, k, v, kvs)
    };
    G__7719.cljs$lang$maxFixedArity = 3;
    G__7719.cljs$lang$applyTo = function(arglist__7724) {
      var coll = cljs.core.first(arglist__7724);
      var k = cljs.core.first(cljs.core.next(arglist__7724));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7724)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7724)));
      return G__7719__delegate(coll, k, v, kvs)
    };
    G__7719.cljs$lang$arity$variadic = G__7719__delegate;
    return G__7719
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7727__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7726 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7728 = ret__7726;
          var G__7729 = cljs.core.first.call(null, ks);
          var G__7730 = cljs.core.next.call(null, ks);
          coll = G__7728;
          k = G__7729;
          ks = G__7730;
          continue
        }else {
          return ret__7726
        }
        break
      }
    };
    var G__7727 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7727__delegate.call(this, coll, k, ks)
    };
    G__7727.cljs$lang$maxFixedArity = 2;
    G__7727.cljs$lang$applyTo = function(arglist__7731) {
      var coll = cljs.core.first(arglist__7731);
      var k = cljs.core.first(cljs.core.next(arglist__7731));
      var ks = cljs.core.rest(cljs.core.next(arglist__7731));
      return G__7727__delegate(coll, k, ks)
    };
    G__7727.cljs$lang$arity$variadic = G__7727__delegate;
    return G__7727
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7735__7736 = o;
    if(G__7735__7736) {
      if(function() {
        var or__3824__auto____7737 = G__7735__7736.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7737) {
          return or__3824__auto____7737
        }else {
          return G__7735__7736.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7735__7736.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7735__7736)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7735__7736)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7740__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7739 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7741 = ret__7739;
          var G__7742 = cljs.core.first.call(null, ks);
          var G__7743 = cljs.core.next.call(null, ks);
          coll = G__7741;
          k = G__7742;
          ks = G__7743;
          continue
        }else {
          return ret__7739
        }
        break
      }
    };
    var G__7740 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7740__delegate.call(this, coll, k, ks)
    };
    G__7740.cljs$lang$maxFixedArity = 2;
    G__7740.cljs$lang$applyTo = function(arglist__7744) {
      var coll = cljs.core.first(arglist__7744);
      var k = cljs.core.first(cljs.core.next(arglist__7744));
      var ks = cljs.core.rest(cljs.core.next(arglist__7744));
      return G__7740__delegate(coll, k, ks)
    };
    G__7740.cljs$lang$arity$variadic = G__7740__delegate;
    return G__7740
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7746 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7746;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7746
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7748 = cljs.core.string_hash_cache[k];
  if(!(h__7748 == null)) {
    return h__7748
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7750 = goog.isString(o);
      if(and__3822__auto____7750) {
        return check_cache
      }else {
        return and__3822__auto____7750
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7754__7755 = x;
    if(G__7754__7755) {
      if(function() {
        var or__3824__auto____7756 = G__7754__7755.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7756) {
          return or__3824__auto____7756
        }else {
          return G__7754__7755.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7754__7755.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7754__7755)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7754__7755)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7760__7761 = x;
    if(G__7760__7761) {
      if(function() {
        var or__3824__auto____7762 = G__7760__7761.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7762) {
          return or__3824__auto____7762
        }else {
          return G__7760__7761.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7760__7761.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7760__7761)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7760__7761)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7766__7767 = x;
  if(G__7766__7767) {
    if(function() {
      var or__3824__auto____7768 = G__7766__7767.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7768) {
        return or__3824__auto____7768
      }else {
        return G__7766__7767.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7766__7767.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7766__7767)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7766__7767)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7772__7773 = x;
  if(G__7772__7773) {
    if(function() {
      var or__3824__auto____7774 = G__7772__7773.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7774) {
        return or__3824__auto____7774
      }else {
        return G__7772__7773.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7772__7773.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7772__7773)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7772__7773)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7778__7779 = x;
  if(G__7778__7779) {
    if(function() {
      var or__3824__auto____7780 = G__7778__7779.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7780) {
        return or__3824__auto____7780
      }else {
        return G__7778__7779.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7778__7779.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7778__7779)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7778__7779)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7784__7785 = x;
  if(G__7784__7785) {
    if(function() {
      var or__3824__auto____7786 = G__7784__7785.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7786) {
        return or__3824__auto____7786
      }else {
        return G__7784__7785.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7784__7785.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7784__7785)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7784__7785)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7790__7791 = x;
  if(G__7790__7791) {
    if(function() {
      var or__3824__auto____7792 = G__7790__7791.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7792) {
        return or__3824__auto____7792
      }else {
        return G__7790__7791.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7790__7791.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7790__7791)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7790__7791)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7796__7797 = x;
    if(G__7796__7797) {
      if(function() {
        var or__3824__auto____7798 = G__7796__7797.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7798) {
          return or__3824__auto____7798
        }else {
          return G__7796__7797.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7796__7797.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7796__7797)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7796__7797)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7802__7803 = x;
  if(G__7802__7803) {
    if(function() {
      var or__3824__auto____7804 = G__7802__7803.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7804) {
        return or__3824__auto____7804
      }else {
        return G__7802__7803.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7802__7803.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7802__7803)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7802__7803)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7808__7809 = x;
  if(G__7808__7809) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7810 = null;
      if(cljs.core.truth_(or__3824__auto____7810)) {
        return or__3824__auto____7810
      }else {
        return G__7808__7809.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7808__7809.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7808__7809)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7808__7809)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7811__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7811 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7811__delegate.call(this, keyvals)
    };
    G__7811.cljs$lang$maxFixedArity = 0;
    G__7811.cljs$lang$applyTo = function(arglist__7812) {
      var keyvals = cljs.core.seq(arglist__7812);
      return G__7811__delegate(keyvals)
    };
    G__7811.cljs$lang$arity$variadic = G__7811__delegate;
    return G__7811
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7814 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7814.push(key)
  });
  return keys__7814
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7818 = i;
  var j__7819 = j;
  var len__7820 = len;
  while(true) {
    if(len__7820 === 0) {
      return to
    }else {
      to[j__7819] = from[i__7818];
      var G__7821 = i__7818 + 1;
      var G__7822 = j__7819 + 1;
      var G__7823 = len__7820 - 1;
      i__7818 = G__7821;
      j__7819 = G__7822;
      len__7820 = G__7823;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7827 = i + (len - 1);
  var j__7828 = j + (len - 1);
  var len__7829 = len;
  while(true) {
    if(len__7829 === 0) {
      return to
    }else {
      to[j__7828] = from[i__7827];
      var G__7830 = i__7827 - 1;
      var G__7831 = j__7828 - 1;
      var G__7832 = len__7829 - 1;
      i__7827 = G__7830;
      j__7828 = G__7831;
      len__7829 = G__7832;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7836__7837 = s;
    if(G__7836__7837) {
      if(function() {
        var or__3824__auto____7838 = G__7836__7837.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7838) {
          return or__3824__auto____7838
        }else {
          return G__7836__7837.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7836__7837.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7836__7837)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7836__7837)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7842__7843 = s;
  if(G__7842__7843) {
    if(function() {
      var or__3824__auto____7844 = G__7842__7843.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7844) {
        return or__3824__auto____7844
      }else {
        return G__7842__7843.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7842__7843.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7842__7843)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7842__7843)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7847 = goog.isString(x);
  if(and__3822__auto____7847) {
    return!function() {
      var or__3824__auto____7848 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7848) {
        return or__3824__auto____7848
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7847
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7850 = goog.isString(x);
  if(and__3822__auto____7850) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7850
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7852 = goog.isString(x);
  if(and__3822__auto____7852) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7852
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7857 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7857) {
    return or__3824__auto____7857
  }else {
    var G__7858__7859 = f;
    if(G__7858__7859) {
      if(function() {
        var or__3824__auto____7860 = G__7858__7859.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7860) {
          return or__3824__auto____7860
        }else {
          return G__7858__7859.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7858__7859.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7858__7859)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7858__7859)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7862 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7862) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7862
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7865 = coll;
    if(cljs.core.truth_(and__3822__auto____7865)) {
      var and__3822__auto____7866 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7866) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7866
      }
    }else {
      return and__3822__auto____7865
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7875__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7871 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7872 = more;
        while(true) {
          var x__7873 = cljs.core.first.call(null, xs__7872);
          var etc__7874 = cljs.core.next.call(null, xs__7872);
          if(cljs.core.truth_(xs__7872)) {
            if(cljs.core.contains_QMARK_.call(null, s__7871, x__7873)) {
              return false
            }else {
              var G__7876 = cljs.core.conj.call(null, s__7871, x__7873);
              var G__7877 = etc__7874;
              s__7871 = G__7876;
              xs__7872 = G__7877;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7875 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7875__delegate.call(this, x, y, more)
    };
    G__7875.cljs$lang$maxFixedArity = 2;
    G__7875.cljs$lang$applyTo = function(arglist__7878) {
      var x = cljs.core.first(arglist__7878);
      var y = cljs.core.first(cljs.core.next(arglist__7878));
      var more = cljs.core.rest(cljs.core.next(arglist__7878));
      return G__7875__delegate(x, y, more)
    };
    G__7875.cljs$lang$arity$variadic = G__7875__delegate;
    return G__7875
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7882__7883 = x;
            if(G__7882__7883) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7884 = null;
                if(cljs.core.truth_(or__3824__auto____7884)) {
                  return or__3824__auto____7884
                }else {
                  return G__7882__7883.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7882__7883.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7882__7883)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7882__7883)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7889 = cljs.core.count.call(null, xs);
    var yl__7890 = cljs.core.count.call(null, ys);
    if(xl__7889 < yl__7890) {
      return-1
    }else {
      if(xl__7889 > yl__7890) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7889, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7891 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7892 = d__7891 === 0;
        if(and__3822__auto____7892) {
          return n + 1 < len
        }else {
          return and__3822__auto____7892
        }
      }()) {
        var G__7893 = xs;
        var G__7894 = ys;
        var G__7895 = len;
        var G__7896 = n + 1;
        xs = G__7893;
        ys = G__7894;
        len = G__7895;
        n = G__7896;
        continue
      }else {
        return d__7891
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7898 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7898)) {
        return r__7898
      }else {
        if(cljs.core.truth_(r__7898)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7900 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7900, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7900)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7906 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7906) {
      var s__7907 = temp__3971__auto____7906;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7907), cljs.core.next.call(null, s__7907))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7908 = val;
    var coll__7909 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7909) {
        var nval__7910 = f.call(null, val__7908, cljs.core.first.call(null, coll__7909));
        if(cljs.core.reduced_QMARK_.call(null, nval__7910)) {
          return cljs.core.deref.call(null, nval__7910)
        }else {
          var G__7911 = nval__7910;
          var G__7912 = cljs.core.next.call(null, coll__7909);
          val__7908 = G__7911;
          coll__7909 = G__7912;
          continue
        }
      }else {
        return val__7908
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7914 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7914);
  return cljs.core.vec.call(null, a__7914)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7921__7922 = coll;
      if(G__7921__7922) {
        if(function() {
          var or__3824__auto____7923 = G__7921__7922.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7923) {
            return or__3824__auto____7923
          }else {
            return G__7921__7922.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7921__7922.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7921__7922)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7921__7922)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7924__7925 = coll;
      if(G__7924__7925) {
        if(function() {
          var or__3824__auto____7926 = G__7924__7925.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7926) {
            return or__3824__auto____7926
          }else {
            return G__7924__7925.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7924__7925.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7924__7925)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7924__7925)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7927 = this;
  return this__7927.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7928__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7928 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7928__delegate.call(this, x, y, more)
    };
    G__7928.cljs$lang$maxFixedArity = 2;
    G__7928.cljs$lang$applyTo = function(arglist__7929) {
      var x = cljs.core.first(arglist__7929);
      var y = cljs.core.first(cljs.core.next(arglist__7929));
      var more = cljs.core.rest(cljs.core.next(arglist__7929));
      return G__7928__delegate(x, y, more)
    };
    G__7928.cljs$lang$arity$variadic = G__7928__delegate;
    return G__7928
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7930__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7930 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7930__delegate.call(this, x, y, more)
    };
    G__7930.cljs$lang$maxFixedArity = 2;
    G__7930.cljs$lang$applyTo = function(arglist__7931) {
      var x = cljs.core.first(arglist__7931);
      var y = cljs.core.first(cljs.core.next(arglist__7931));
      var more = cljs.core.rest(cljs.core.next(arglist__7931));
      return G__7930__delegate(x, y, more)
    };
    G__7930.cljs$lang$arity$variadic = G__7930__delegate;
    return G__7930
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7932__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7932 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7932__delegate.call(this, x, y, more)
    };
    G__7932.cljs$lang$maxFixedArity = 2;
    G__7932.cljs$lang$applyTo = function(arglist__7933) {
      var x = cljs.core.first(arglist__7933);
      var y = cljs.core.first(cljs.core.next(arglist__7933));
      var more = cljs.core.rest(cljs.core.next(arglist__7933));
      return G__7932__delegate(x, y, more)
    };
    G__7932.cljs$lang$arity$variadic = G__7932__delegate;
    return G__7932
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7934__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7934 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7934__delegate.call(this, x, y, more)
    };
    G__7934.cljs$lang$maxFixedArity = 2;
    G__7934.cljs$lang$applyTo = function(arglist__7935) {
      var x = cljs.core.first(arglist__7935);
      var y = cljs.core.first(cljs.core.next(arglist__7935));
      var more = cljs.core.rest(cljs.core.next(arglist__7935));
      return G__7934__delegate(x, y, more)
    };
    G__7934.cljs$lang$arity$variadic = G__7934__delegate;
    return G__7934
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7936__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7937 = y;
            var G__7938 = cljs.core.first.call(null, more);
            var G__7939 = cljs.core.next.call(null, more);
            x = G__7937;
            y = G__7938;
            more = G__7939;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7936 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7936__delegate.call(this, x, y, more)
    };
    G__7936.cljs$lang$maxFixedArity = 2;
    G__7936.cljs$lang$applyTo = function(arglist__7940) {
      var x = cljs.core.first(arglist__7940);
      var y = cljs.core.first(cljs.core.next(arglist__7940));
      var more = cljs.core.rest(cljs.core.next(arglist__7940));
      return G__7936__delegate(x, y, more)
    };
    G__7936.cljs$lang$arity$variadic = G__7936__delegate;
    return G__7936
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7941__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7942 = y;
            var G__7943 = cljs.core.first.call(null, more);
            var G__7944 = cljs.core.next.call(null, more);
            x = G__7942;
            y = G__7943;
            more = G__7944;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7941 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7941__delegate.call(this, x, y, more)
    };
    G__7941.cljs$lang$maxFixedArity = 2;
    G__7941.cljs$lang$applyTo = function(arglist__7945) {
      var x = cljs.core.first(arglist__7945);
      var y = cljs.core.first(cljs.core.next(arglist__7945));
      var more = cljs.core.rest(cljs.core.next(arglist__7945));
      return G__7941__delegate(x, y, more)
    };
    G__7941.cljs$lang$arity$variadic = G__7941__delegate;
    return G__7941
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7946__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7947 = y;
            var G__7948 = cljs.core.first.call(null, more);
            var G__7949 = cljs.core.next.call(null, more);
            x = G__7947;
            y = G__7948;
            more = G__7949;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7946 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7946__delegate.call(this, x, y, more)
    };
    G__7946.cljs$lang$maxFixedArity = 2;
    G__7946.cljs$lang$applyTo = function(arglist__7950) {
      var x = cljs.core.first(arglist__7950);
      var y = cljs.core.first(cljs.core.next(arglist__7950));
      var more = cljs.core.rest(cljs.core.next(arglist__7950));
      return G__7946__delegate(x, y, more)
    };
    G__7946.cljs$lang$arity$variadic = G__7946__delegate;
    return G__7946
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7951__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7952 = y;
            var G__7953 = cljs.core.first.call(null, more);
            var G__7954 = cljs.core.next.call(null, more);
            x = G__7952;
            y = G__7953;
            more = G__7954;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7951 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7951__delegate.call(this, x, y, more)
    };
    G__7951.cljs$lang$maxFixedArity = 2;
    G__7951.cljs$lang$applyTo = function(arglist__7955) {
      var x = cljs.core.first(arglist__7955);
      var y = cljs.core.first(cljs.core.next(arglist__7955));
      var more = cljs.core.rest(cljs.core.next(arglist__7955));
      return G__7951__delegate(x, y, more)
    };
    G__7951.cljs$lang$arity$variadic = G__7951__delegate;
    return G__7951
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7956__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7956 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7956__delegate.call(this, x, y, more)
    };
    G__7956.cljs$lang$maxFixedArity = 2;
    G__7956.cljs$lang$applyTo = function(arglist__7957) {
      var x = cljs.core.first(arglist__7957);
      var y = cljs.core.first(cljs.core.next(arglist__7957));
      var more = cljs.core.rest(cljs.core.next(arglist__7957));
      return G__7956__delegate(x, y, more)
    };
    G__7956.cljs$lang$arity$variadic = G__7956__delegate;
    return G__7956
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7958__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7958 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7958__delegate.call(this, x, y, more)
    };
    G__7958.cljs$lang$maxFixedArity = 2;
    G__7958.cljs$lang$applyTo = function(arglist__7959) {
      var x = cljs.core.first(arglist__7959);
      var y = cljs.core.first(cljs.core.next(arglist__7959));
      var more = cljs.core.rest(cljs.core.next(arglist__7959));
      return G__7958__delegate(x, y, more)
    };
    G__7958.cljs$lang$arity$variadic = G__7958__delegate;
    return G__7958
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7961 = n % d;
  return cljs.core.fix.call(null, (n - rem__7961) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7963 = cljs.core.quot.call(null, n, d);
  return n - d * q__7963
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7966 = v - (v >> 1 & 1431655765);
  var v__7967 = (v__7966 & 858993459) + (v__7966 >> 2 & 858993459);
  return(v__7967 + (v__7967 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7968__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7969 = y;
            var G__7970 = cljs.core.first.call(null, more);
            var G__7971 = cljs.core.next.call(null, more);
            x = G__7969;
            y = G__7970;
            more = G__7971;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7968 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7968__delegate.call(this, x, y, more)
    };
    G__7968.cljs$lang$maxFixedArity = 2;
    G__7968.cljs$lang$applyTo = function(arglist__7972) {
      var x = cljs.core.first(arglist__7972);
      var y = cljs.core.first(cljs.core.next(arglist__7972));
      var more = cljs.core.rest(cljs.core.next(arglist__7972));
      return G__7968__delegate(x, y, more)
    };
    G__7968.cljs$lang$arity$variadic = G__7968__delegate;
    return G__7968
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7976 = n;
  var xs__7977 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7978 = xs__7977;
      if(and__3822__auto____7978) {
        return n__7976 > 0
      }else {
        return and__3822__auto____7978
      }
    }())) {
      var G__7979 = n__7976 - 1;
      var G__7980 = cljs.core.next.call(null, xs__7977);
      n__7976 = G__7979;
      xs__7977 = G__7980;
      continue
    }else {
      return xs__7977
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7981__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7982 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7983 = cljs.core.next.call(null, more);
            sb = G__7982;
            more = G__7983;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7981 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7981__delegate.call(this, x, ys)
    };
    G__7981.cljs$lang$maxFixedArity = 1;
    G__7981.cljs$lang$applyTo = function(arglist__7984) {
      var x = cljs.core.first(arglist__7984);
      var ys = cljs.core.rest(arglist__7984);
      return G__7981__delegate(x, ys)
    };
    G__7981.cljs$lang$arity$variadic = G__7981__delegate;
    return G__7981
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7985__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7986 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7987 = cljs.core.next.call(null, more);
            sb = G__7986;
            more = G__7987;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7985 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7985__delegate.call(this, x, ys)
    };
    G__7985.cljs$lang$maxFixedArity = 1;
    G__7985.cljs$lang$applyTo = function(arglist__7988) {
      var x = cljs.core.first(arglist__7988);
      var ys = cljs.core.rest(arglist__7988);
      return G__7985__delegate(x, ys)
    };
    G__7985.cljs$lang$arity$variadic = G__7985__delegate;
    return G__7985
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7989) {
    var fmt = cljs.core.first(arglist__7989);
    var args = cljs.core.rest(arglist__7989);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7992 = cljs.core.seq.call(null, x);
    var ys__7993 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7992 == null) {
        return ys__7993 == null
      }else {
        if(ys__7993 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7992), cljs.core.first.call(null, ys__7993))) {
            var G__7994 = cljs.core.next.call(null, xs__7992);
            var G__7995 = cljs.core.next.call(null, ys__7993);
            xs__7992 = G__7994;
            ys__7993 = G__7995;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7996_SHARP_, p2__7997_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7996_SHARP_, cljs.core.hash.call(null, p2__7997_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__8001 = 0;
  var s__8002 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__8002) {
      var e__8003 = cljs.core.first.call(null, s__8002);
      var G__8004 = (h__8001 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__8003)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__8003)))) % 4503599627370496;
      var G__8005 = cljs.core.next.call(null, s__8002);
      h__8001 = G__8004;
      s__8002 = G__8005;
      continue
    }else {
      return h__8001
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__8009 = 0;
  var s__8010 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__8010) {
      var e__8011 = cljs.core.first.call(null, s__8010);
      var G__8012 = (h__8009 + cljs.core.hash.call(null, e__8011)) % 4503599627370496;
      var G__8013 = cljs.core.next.call(null, s__8010);
      h__8009 = G__8012;
      s__8010 = G__8013;
      continue
    }else {
      return h__8009
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__8034__8035 = cljs.core.seq.call(null, fn_map);
  if(G__8034__8035) {
    var G__8037__8039 = cljs.core.first.call(null, G__8034__8035);
    var vec__8038__8040 = G__8037__8039;
    var key_name__8041 = cljs.core.nth.call(null, vec__8038__8040, 0, null);
    var f__8042 = cljs.core.nth.call(null, vec__8038__8040, 1, null);
    var G__8034__8043 = G__8034__8035;
    var G__8037__8044 = G__8037__8039;
    var G__8034__8045 = G__8034__8043;
    while(true) {
      var vec__8046__8047 = G__8037__8044;
      var key_name__8048 = cljs.core.nth.call(null, vec__8046__8047, 0, null);
      var f__8049 = cljs.core.nth.call(null, vec__8046__8047, 1, null);
      var G__8034__8050 = G__8034__8045;
      var str_name__8051 = cljs.core.name.call(null, key_name__8048);
      obj[str_name__8051] = f__8049;
      var temp__3974__auto____8052 = cljs.core.next.call(null, G__8034__8050);
      if(temp__3974__auto____8052) {
        var G__8034__8053 = temp__3974__auto____8052;
        var G__8054 = cljs.core.first.call(null, G__8034__8053);
        var G__8055 = G__8034__8053;
        G__8037__8044 = G__8054;
        G__8034__8045 = G__8055;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8056 = this;
  var h__2198__auto____8057 = this__8056.__hash;
  if(!(h__2198__auto____8057 == null)) {
    return h__2198__auto____8057
  }else {
    var h__2198__auto____8058 = cljs.core.hash_coll.call(null, coll);
    this__8056.__hash = h__2198__auto____8058;
    return h__2198__auto____8058
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8059 = this;
  if(this__8059.count === 1) {
    return null
  }else {
    return this__8059.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8060 = this;
  return new cljs.core.List(this__8060.meta, o, coll, this__8060.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__8061 = this;
  var this__8062 = this;
  return cljs.core.pr_str.call(null, this__8062)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8063 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8064 = this;
  return this__8064.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8065 = this;
  return this__8065.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8066 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8067 = this;
  return this__8067.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8068 = this;
  if(this__8068.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__8068.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8069 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8070 = this;
  return new cljs.core.List(meta, this__8070.first, this__8070.rest, this__8070.count, this__8070.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8071 = this;
  return this__8071.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8072 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8073 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8074 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8075 = this;
  return new cljs.core.List(this__8075.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__8076 = this;
  var this__8077 = this;
  return cljs.core.pr_str.call(null, this__8077)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8078 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8079 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8080 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8081 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8082 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8083 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8084 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8085 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8086 = this;
  return this__8086.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8087 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__8091__8092 = coll;
  if(G__8091__8092) {
    if(function() {
      var or__3824__auto____8093 = G__8091__8092.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____8093) {
        return or__3824__auto____8093
      }else {
        return G__8091__8092.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__8091__8092.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8091__8092)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8091__8092)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__8094__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__8094 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8094__delegate.call(this, x, y, z, items)
    };
    G__8094.cljs$lang$maxFixedArity = 3;
    G__8094.cljs$lang$applyTo = function(arglist__8095) {
      var x = cljs.core.first(arglist__8095);
      var y = cljs.core.first(cljs.core.next(arglist__8095));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8095)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8095)));
      return G__8094__delegate(x, y, z, items)
    };
    G__8094.cljs$lang$arity$variadic = G__8094__delegate;
    return G__8094
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8096 = this;
  var h__2198__auto____8097 = this__8096.__hash;
  if(!(h__2198__auto____8097 == null)) {
    return h__2198__auto____8097
  }else {
    var h__2198__auto____8098 = cljs.core.hash_coll.call(null, coll);
    this__8096.__hash = h__2198__auto____8098;
    return h__2198__auto____8098
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8099 = this;
  if(this__8099.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__8099.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8100 = this;
  return new cljs.core.Cons(null, o, coll, this__8100.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__8101 = this;
  var this__8102 = this;
  return cljs.core.pr_str.call(null, this__8102)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8103 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8104 = this;
  return this__8104.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8105 = this;
  if(this__8105.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8105.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8106 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8107 = this;
  return new cljs.core.Cons(meta, this__8107.first, this__8107.rest, this__8107.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8108 = this;
  return this__8108.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8109 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8109.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____8114 = coll == null;
    if(or__3824__auto____8114) {
      return or__3824__auto____8114
    }else {
      var G__8115__8116 = coll;
      if(G__8115__8116) {
        if(function() {
          var or__3824__auto____8117 = G__8115__8116.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8117) {
            return or__3824__auto____8117
          }else {
            return G__8115__8116.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8115__8116.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8115__8116)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8115__8116)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__8121__8122 = x;
  if(G__8121__8122) {
    if(function() {
      var or__3824__auto____8123 = G__8121__8122.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____8123) {
        return or__3824__auto____8123
      }else {
        return G__8121__8122.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__8121__8122.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8121__8122)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8121__8122)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__8124 = null;
  var G__8124__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__8124__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__8124 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8124__2.call(this, string, f);
      case 3:
        return G__8124__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8124
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__8125 = null;
  var G__8125__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__8125__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__8125 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8125__2.call(this, string, k);
      case 3:
        return G__8125__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8125
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__8126 = null;
  var G__8126__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__8126__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__8126 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8126__2.call(this, string, n);
      case 3:
        return G__8126__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8126
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__8138 = null;
  var G__8138__2 = function(this_sym8129, coll) {
    var this__8131 = this;
    var this_sym8129__8132 = this;
    var ___8133 = this_sym8129__8132;
    if(coll == null) {
      return null
    }else {
      var strobj__8134 = coll.strobj;
      if(strobj__8134 == null) {
        return cljs.core._lookup.call(null, coll, this__8131.k, null)
      }else {
        return strobj__8134[this__8131.k]
      }
    }
  };
  var G__8138__3 = function(this_sym8130, coll, not_found) {
    var this__8131 = this;
    var this_sym8130__8135 = this;
    var ___8136 = this_sym8130__8135;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__8131.k, not_found)
    }
  };
  G__8138 = function(this_sym8130, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8138__2.call(this, this_sym8130, coll);
      case 3:
        return G__8138__3.call(this, this_sym8130, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8138
}();
cljs.core.Keyword.prototype.apply = function(this_sym8127, args8128) {
  var this__8137 = this;
  return this_sym8127.call.apply(this_sym8127, [this_sym8127].concat(args8128.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__8147 = null;
  var G__8147__2 = function(this_sym8141, coll) {
    var this_sym8141__8143 = this;
    var this__8144 = this_sym8141__8143;
    return cljs.core._lookup.call(null, coll, this__8144.toString(), null)
  };
  var G__8147__3 = function(this_sym8142, coll, not_found) {
    var this_sym8142__8145 = this;
    var this__8146 = this_sym8142__8145;
    return cljs.core._lookup.call(null, coll, this__8146.toString(), not_found)
  };
  G__8147 = function(this_sym8142, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8147__2.call(this, this_sym8142, coll);
      case 3:
        return G__8147__3.call(this, this_sym8142, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8147
}();
String.prototype.apply = function(this_sym8139, args8140) {
  return this_sym8139.call.apply(this_sym8139, [this_sym8139].concat(args8140.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__8149 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__8149
  }else {
    lazy_seq.x = x__8149.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8150 = this;
  var h__2198__auto____8151 = this__8150.__hash;
  if(!(h__2198__auto____8151 == null)) {
    return h__2198__auto____8151
  }else {
    var h__2198__auto____8152 = cljs.core.hash_coll.call(null, coll);
    this__8150.__hash = h__2198__auto____8152;
    return h__2198__auto____8152
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8153 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8154 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__8155 = this;
  var this__8156 = this;
  return cljs.core.pr_str.call(null, this__8156)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8157 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8158 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8159 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8160 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8161 = this;
  return new cljs.core.LazySeq(meta, this__8161.realized, this__8161.x, this__8161.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8162 = this;
  return this__8162.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8163 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8163.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8164 = this;
  return this__8164.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__8165 = this;
  var ___8166 = this;
  this__8165.buf[this__8165.end] = o;
  return this__8165.end = this__8165.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__8167 = this;
  var ___8168 = this;
  var ret__8169 = new cljs.core.ArrayChunk(this__8167.buf, 0, this__8167.end);
  this__8167.buf = null;
  return ret__8169
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8170 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__8170.arr[this__8170.off], this__8170.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8171 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__8171.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__8172 = this;
  if(this__8172.off === this__8172.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__8172.arr, this__8172.off + 1, this__8172.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__8173 = this;
  return this__8173.arr[this__8173.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__8174 = this;
  if(function() {
    var and__3822__auto____8175 = i >= 0;
    if(and__3822__auto____8175) {
      return i < this__8174.end - this__8174.off
    }else {
      return and__3822__auto____8175
    }
  }()) {
    return this__8174.arr[this__8174.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8176 = this;
  return this__8176.end - this__8176.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__8177 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8178 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8179 = this;
  return cljs.core._nth.call(null, this__8179.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8180 = this;
  if(cljs.core._count.call(null, this__8180.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__8180.chunk), this__8180.more, this__8180.meta)
  }else {
    if(this__8180.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__8180.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8181 = this;
  if(this__8181.more == null) {
    return null
  }else {
    return this__8181.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8182 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8183 = this;
  return new cljs.core.ChunkedCons(this__8183.chunk, this__8183.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8184 = this;
  return this__8184.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8185 = this;
  return this__8185.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8186 = this;
  if(this__8186.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8186.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__8190__8191 = s;
    if(G__8190__8191) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____8192 = null;
        if(cljs.core.truth_(or__3824__auto____8192)) {
          return or__3824__auto____8192
        }else {
          return G__8190__8191.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__8190__8191.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8190__8191)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8190__8191)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__8195 = [];
  var s__8196 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__8196)) {
      ary__8195.push(cljs.core.first.call(null, s__8196));
      var G__8197 = cljs.core.next.call(null, s__8196);
      s__8196 = G__8197;
      continue
    }else {
      return ary__8195
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__8201 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__8202 = 0;
  var xs__8203 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__8203) {
      ret__8201[i__8202] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__8203));
      var G__8204 = i__8202 + 1;
      var G__8205 = cljs.core.next.call(null, xs__8203);
      i__8202 = G__8204;
      xs__8203 = G__8205;
      continue
    }else {
    }
    break
  }
  return ret__8201
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__8213 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8214 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8215 = 0;
      var s__8216 = s__8214;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8217 = s__8216;
          if(and__3822__auto____8217) {
            return i__8215 < size
          }else {
            return and__3822__auto____8217
          }
        }())) {
          a__8213[i__8215] = cljs.core.first.call(null, s__8216);
          var G__8220 = i__8215 + 1;
          var G__8221 = cljs.core.next.call(null, s__8216);
          i__8215 = G__8220;
          s__8216 = G__8221;
          continue
        }else {
          return a__8213
        }
        break
      }
    }else {
      var n__2533__auto____8218 = size;
      var i__8219 = 0;
      while(true) {
        if(i__8219 < n__2533__auto____8218) {
          a__8213[i__8219] = init_val_or_seq;
          var G__8222 = i__8219 + 1;
          i__8219 = G__8222;
          continue
        }else {
        }
        break
      }
      return a__8213
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__8230 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8231 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8232 = 0;
      var s__8233 = s__8231;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8234 = s__8233;
          if(and__3822__auto____8234) {
            return i__8232 < size
          }else {
            return and__3822__auto____8234
          }
        }())) {
          a__8230[i__8232] = cljs.core.first.call(null, s__8233);
          var G__8237 = i__8232 + 1;
          var G__8238 = cljs.core.next.call(null, s__8233);
          i__8232 = G__8237;
          s__8233 = G__8238;
          continue
        }else {
          return a__8230
        }
        break
      }
    }else {
      var n__2533__auto____8235 = size;
      var i__8236 = 0;
      while(true) {
        if(i__8236 < n__2533__auto____8235) {
          a__8230[i__8236] = init_val_or_seq;
          var G__8239 = i__8236 + 1;
          i__8236 = G__8239;
          continue
        }else {
        }
        break
      }
      return a__8230
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__8247 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8248 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8249 = 0;
      var s__8250 = s__8248;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8251 = s__8250;
          if(and__3822__auto____8251) {
            return i__8249 < size
          }else {
            return and__3822__auto____8251
          }
        }())) {
          a__8247[i__8249] = cljs.core.first.call(null, s__8250);
          var G__8254 = i__8249 + 1;
          var G__8255 = cljs.core.next.call(null, s__8250);
          i__8249 = G__8254;
          s__8250 = G__8255;
          continue
        }else {
          return a__8247
        }
        break
      }
    }else {
      var n__2533__auto____8252 = size;
      var i__8253 = 0;
      while(true) {
        if(i__8253 < n__2533__auto____8252) {
          a__8247[i__8253] = init_val_or_seq;
          var G__8256 = i__8253 + 1;
          i__8253 = G__8256;
          continue
        }else {
        }
        break
      }
      return a__8247
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__8261 = s;
    var i__8262 = n;
    var sum__8263 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8264 = i__8262 > 0;
        if(and__3822__auto____8264) {
          return cljs.core.seq.call(null, s__8261)
        }else {
          return and__3822__auto____8264
        }
      }())) {
        var G__8265 = cljs.core.next.call(null, s__8261);
        var G__8266 = i__8262 - 1;
        var G__8267 = sum__8263 + 1;
        s__8261 = G__8265;
        i__8262 = G__8266;
        sum__8263 = G__8267;
        continue
      }else {
        return sum__8263
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__8272 = cljs.core.seq.call(null, x);
      if(s__8272) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8272)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__8272), concat.call(null, cljs.core.chunk_rest.call(null, s__8272), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__8272), concat.call(null, cljs.core.rest.call(null, s__8272), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__8276__delegate = function(x, y, zs) {
      var cat__8275 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__8274 = cljs.core.seq.call(null, xys);
          if(xys__8274) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__8274)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__8274), cat.call(null, cljs.core.chunk_rest.call(null, xys__8274), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__8274), cat.call(null, cljs.core.rest.call(null, xys__8274), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__8275.call(null, concat.call(null, x, y), zs)
    };
    var G__8276 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8276__delegate.call(this, x, y, zs)
    };
    G__8276.cljs$lang$maxFixedArity = 2;
    G__8276.cljs$lang$applyTo = function(arglist__8277) {
      var x = cljs.core.first(arglist__8277);
      var y = cljs.core.first(cljs.core.next(arglist__8277));
      var zs = cljs.core.rest(cljs.core.next(arglist__8277));
      return G__8276__delegate(x, y, zs)
    };
    G__8276.cljs$lang$arity$variadic = G__8276__delegate;
    return G__8276
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__8278__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__8278 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8278__delegate.call(this, a, b, c, d, more)
    };
    G__8278.cljs$lang$maxFixedArity = 4;
    G__8278.cljs$lang$applyTo = function(arglist__8279) {
      var a = cljs.core.first(arglist__8279);
      var b = cljs.core.first(cljs.core.next(arglist__8279));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8279)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8279))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8279))));
      return G__8278__delegate(a, b, c, d, more)
    };
    G__8278.cljs$lang$arity$variadic = G__8278__delegate;
    return G__8278
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__8321 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__8322 = cljs.core._first.call(null, args__8321);
    var args__8323 = cljs.core._rest.call(null, args__8321);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__8322)
      }else {
        return f.call(null, a__8322)
      }
    }else {
      var b__8324 = cljs.core._first.call(null, args__8323);
      var args__8325 = cljs.core._rest.call(null, args__8323);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__8322, b__8324)
        }else {
          return f.call(null, a__8322, b__8324)
        }
      }else {
        var c__8326 = cljs.core._first.call(null, args__8325);
        var args__8327 = cljs.core._rest.call(null, args__8325);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__8322, b__8324, c__8326)
          }else {
            return f.call(null, a__8322, b__8324, c__8326)
          }
        }else {
          var d__8328 = cljs.core._first.call(null, args__8327);
          var args__8329 = cljs.core._rest.call(null, args__8327);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__8322, b__8324, c__8326, d__8328)
            }else {
              return f.call(null, a__8322, b__8324, c__8326, d__8328)
            }
          }else {
            var e__8330 = cljs.core._first.call(null, args__8329);
            var args__8331 = cljs.core._rest.call(null, args__8329);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__8322, b__8324, c__8326, d__8328, e__8330)
              }else {
                return f.call(null, a__8322, b__8324, c__8326, d__8328, e__8330)
              }
            }else {
              var f__8332 = cljs.core._first.call(null, args__8331);
              var args__8333 = cljs.core._rest.call(null, args__8331);
              if(argc === 6) {
                if(f__8332.cljs$lang$arity$6) {
                  return f__8332.cljs$lang$arity$6(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332)
                }else {
                  return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332)
                }
              }else {
                var g__8334 = cljs.core._first.call(null, args__8333);
                var args__8335 = cljs.core._rest.call(null, args__8333);
                if(argc === 7) {
                  if(f__8332.cljs$lang$arity$7) {
                    return f__8332.cljs$lang$arity$7(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334)
                  }else {
                    return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334)
                  }
                }else {
                  var h__8336 = cljs.core._first.call(null, args__8335);
                  var args__8337 = cljs.core._rest.call(null, args__8335);
                  if(argc === 8) {
                    if(f__8332.cljs$lang$arity$8) {
                      return f__8332.cljs$lang$arity$8(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336)
                    }else {
                      return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336)
                    }
                  }else {
                    var i__8338 = cljs.core._first.call(null, args__8337);
                    var args__8339 = cljs.core._rest.call(null, args__8337);
                    if(argc === 9) {
                      if(f__8332.cljs$lang$arity$9) {
                        return f__8332.cljs$lang$arity$9(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338)
                      }else {
                        return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338)
                      }
                    }else {
                      var j__8340 = cljs.core._first.call(null, args__8339);
                      var args__8341 = cljs.core._rest.call(null, args__8339);
                      if(argc === 10) {
                        if(f__8332.cljs$lang$arity$10) {
                          return f__8332.cljs$lang$arity$10(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340)
                        }else {
                          return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340)
                        }
                      }else {
                        var k__8342 = cljs.core._first.call(null, args__8341);
                        var args__8343 = cljs.core._rest.call(null, args__8341);
                        if(argc === 11) {
                          if(f__8332.cljs$lang$arity$11) {
                            return f__8332.cljs$lang$arity$11(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342)
                          }else {
                            return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342)
                          }
                        }else {
                          var l__8344 = cljs.core._first.call(null, args__8343);
                          var args__8345 = cljs.core._rest.call(null, args__8343);
                          if(argc === 12) {
                            if(f__8332.cljs$lang$arity$12) {
                              return f__8332.cljs$lang$arity$12(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344)
                            }else {
                              return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344)
                            }
                          }else {
                            var m__8346 = cljs.core._first.call(null, args__8345);
                            var args__8347 = cljs.core._rest.call(null, args__8345);
                            if(argc === 13) {
                              if(f__8332.cljs$lang$arity$13) {
                                return f__8332.cljs$lang$arity$13(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346)
                              }else {
                                return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346)
                              }
                            }else {
                              var n__8348 = cljs.core._first.call(null, args__8347);
                              var args__8349 = cljs.core._rest.call(null, args__8347);
                              if(argc === 14) {
                                if(f__8332.cljs$lang$arity$14) {
                                  return f__8332.cljs$lang$arity$14(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348)
                                }else {
                                  return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348)
                                }
                              }else {
                                var o__8350 = cljs.core._first.call(null, args__8349);
                                var args__8351 = cljs.core._rest.call(null, args__8349);
                                if(argc === 15) {
                                  if(f__8332.cljs$lang$arity$15) {
                                    return f__8332.cljs$lang$arity$15(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350)
                                  }else {
                                    return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350)
                                  }
                                }else {
                                  var p__8352 = cljs.core._first.call(null, args__8351);
                                  var args__8353 = cljs.core._rest.call(null, args__8351);
                                  if(argc === 16) {
                                    if(f__8332.cljs$lang$arity$16) {
                                      return f__8332.cljs$lang$arity$16(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352)
                                    }else {
                                      return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352)
                                    }
                                  }else {
                                    var q__8354 = cljs.core._first.call(null, args__8353);
                                    var args__8355 = cljs.core._rest.call(null, args__8353);
                                    if(argc === 17) {
                                      if(f__8332.cljs$lang$arity$17) {
                                        return f__8332.cljs$lang$arity$17(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354)
                                      }else {
                                        return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354)
                                      }
                                    }else {
                                      var r__8356 = cljs.core._first.call(null, args__8355);
                                      var args__8357 = cljs.core._rest.call(null, args__8355);
                                      if(argc === 18) {
                                        if(f__8332.cljs$lang$arity$18) {
                                          return f__8332.cljs$lang$arity$18(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356)
                                        }else {
                                          return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356)
                                        }
                                      }else {
                                        var s__8358 = cljs.core._first.call(null, args__8357);
                                        var args__8359 = cljs.core._rest.call(null, args__8357);
                                        if(argc === 19) {
                                          if(f__8332.cljs$lang$arity$19) {
                                            return f__8332.cljs$lang$arity$19(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356, s__8358)
                                          }else {
                                            return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356, s__8358)
                                          }
                                        }else {
                                          var t__8360 = cljs.core._first.call(null, args__8359);
                                          var args__8361 = cljs.core._rest.call(null, args__8359);
                                          if(argc === 20) {
                                            if(f__8332.cljs$lang$arity$20) {
                                              return f__8332.cljs$lang$arity$20(a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356, s__8358, t__8360)
                                            }else {
                                              return f__8332.call(null, a__8322, b__8324, c__8326, d__8328, e__8330, f__8332, g__8334, h__8336, i__8338, j__8340, k__8342, l__8344, m__8346, n__8348, o__8350, p__8352, q__8354, r__8356, s__8358, t__8360)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__8376 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8377 = cljs.core.bounded_count.call(null, args, fixed_arity__8376 + 1);
      if(bc__8377 <= fixed_arity__8376) {
        return cljs.core.apply_to.call(null, f, bc__8377, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8378 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8379 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8380 = cljs.core.bounded_count.call(null, arglist__8378, fixed_arity__8379 + 1);
      if(bc__8380 <= fixed_arity__8379) {
        return cljs.core.apply_to.call(null, f, bc__8380, arglist__8378)
      }else {
        return f.cljs$lang$applyTo(arglist__8378)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8378))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8381 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8382 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8383 = cljs.core.bounded_count.call(null, arglist__8381, fixed_arity__8382 + 1);
      if(bc__8383 <= fixed_arity__8382) {
        return cljs.core.apply_to.call(null, f, bc__8383, arglist__8381)
      }else {
        return f.cljs$lang$applyTo(arglist__8381)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8381))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8384 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8385 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8386 = cljs.core.bounded_count.call(null, arglist__8384, fixed_arity__8385 + 1);
      if(bc__8386 <= fixed_arity__8385) {
        return cljs.core.apply_to.call(null, f, bc__8386, arglist__8384)
      }else {
        return f.cljs$lang$applyTo(arglist__8384)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8384))
    }
  };
  var apply__6 = function() {
    var G__8390__delegate = function(f, a, b, c, d, args) {
      var arglist__8387 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8388 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8389 = cljs.core.bounded_count.call(null, arglist__8387, fixed_arity__8388 + 1);
        if(bc__8389 <= fixed_arity__8388) {
          return cljs.core.apply_to.call(null, f, bc__8389, arglist__8387)
        }else {
          return f.cljs$lang$applyTo(arglist__8387)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8387))
      }
    };
    var G__8390 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8390__delegate.call(this, f, a, b, c, d, args)
    };
    G__8390.cljs$lang$maxFixedArity = 5;
    G__8390.cljs$lang$applyTo = function(arglist__8391) {
      var f = cljs.core.first(arglist__8391);
      var a = cljs.core.first(cljs.core.next(arglist__8391));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8391)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8391))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8391)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8391)))));
      return G__8390__delegate(f, a, b, c, d, args)
    };
    G__8390.cljs$lang$arity$variadic = G__8390__delegate;
    return G__8390
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__8392) {
    var obj = cljs.core.first(arglist__8392);
    var f = cljs.core.first(cljs.core.next(arglist__8392));
    var args = cljs.core.rest(cljs.core.next(arglist__8392));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__8393__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8393 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8393__delegate.call(this, x, y, more)
    };
    G__8393.cljs$lang$maxFixedArity = 2;
    G__8393.cljs$lang$applyTo = function(arglist__8394) {
      var x = cljs.core.first(arglist__8394);
      var y = cljs.core.first(cljs.core.next(arglist__8394));
      var more = cljs.core.rest(cljs.core.next(arglist__8394));
      return G__8393__delegate(x, y, more)
    };
    G__8393.cljs$lang$arity$variadic = G__8393__delegate;
    return G__8393
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__8395 = pred;
        var G__8396 = cljs.core.next.call(null, coll);
        pred = G__8395;
        coll = G__8396;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____8398 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8398)) {
        return or__3824__auto____8398
      }else {
        var G__8399 = pred;
        var G__8400 = cljs.core.next.call(null, coll);
        pred = G__8399;
        coll = G__8400;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__8401 = null;
    var G__8401__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8401__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8401__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8401__3 = function() {
      var G__8402__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8402 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8402__delegate.call(this, x, y, zs)
      };
      G__8402.cljs$lang$maxFixedArity = 2;
      G__8402.cljs$lang$applyTo = function(arglist__8403) {
        var x = cljs.core.first(arglist__8403);
        var y = cljs.core.first(cljs.core.next(arglist__8403));
        var zs = cljs.core.rest(cljs.core.next(arglist__8403));
        return G__8402__delegate(x, y, zs)
      };
      G__8402.cljs$lang$arity$variadic = G__8402__delegate;
      return G__8402
    }();
    G__8401 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8401__0.call(this);
        case 1:
          return G__8401__1.call(this, x);
        case 2:
          return G__8401__2.call(this, x, y);
        default:
          return G__8401__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8401.cljs$lang$maxFixedArity = 2;
    G__8401.cljs$lang$applyTo = G__8401__3.cljs$lang$applyTo;
    return G__8401
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8404__delegate = function(args) {
      return x
    };
    var G__8404 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8404__delegate.call(this, args)
    };
    G__8404.cljs$lang$maxFixedArity = 0;
    G__8404.cljs$lang$applyTo = function(arglist__8405) {
      var args = cljs.core.seq(arglist__8405);
      return G__8404__delegate(args)
    };
    G__8404.cljs$lang$arity$variadic = G__8404__delegate;
    return G__8404
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__8412 = null;
      var G__8412__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8412__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8412__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8412__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8412__4 = function() {
        var G__8413__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8413 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8413__delegate.call(this, x, y, z, args)
        };
        G__8413.cljs$lang$maxFixedArity = 3;
        G__8413.cljs$lang$applyTo = function(arglist__8414) {
          var x = cljs.core.first(arglist__8414);
          var y = cljs.core.first(cljs.core.next(arglist__8414));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8414)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8414)));
          return G__8413__delegate(x, y, z, args)
        };
        G__8413.cljs$lang$arity$variadic = G__8413__delegate;
        return G__8413
      }();
      G__8412 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8412__0.call(this);
          case 1:
            return G__8412__1.call(this, x);
          case 2:
            return G__8412__2.call(this, x, y);
          case 3:
            return G__8412__3.call(this, x, y, z);
          default:
            return G__8412__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8412.cljs$lang$maxFixedArity = 3;
      G__8412.cljs$lang$applyTo = G__8412__4.cljs$lang$applyTo;
      return G__8412
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8415 = null;
      var G__8415__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8415__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8415__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8415__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8415__4 = function() {
        var G__8416__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8416 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8416__delegate.call(this, x, y, z, args)
        };
        G__8416.cljs$lang$maxFixedArity = 3;
        G__8416.cljs$lang$applyTo = function(arglist__8417) {
          var x = cljs.core.first(arglist__8417);
          var y = cljs.core.first(cljs.core.next(arglist__8417));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8417)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8417)));
          return G__8416__delegate(x, y, z, args)
        };
        G__8416.cljs$lang$arity$variadic = G__8416__delegate;
        return G__8416
      }();
      G__8415 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8415__0.call(this);
          case 1:
            return G__8415__1.call(this, x);
          case 2:
            return G__8415__2.call(this, x, y);
          case 3:
            return G__8415__3.call(this, x, y, z);
          default:
            return G__8415__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8415.cljs$lang$maxFixedArity = 3;
      G__8415.cljs$lang$applyTo = G__8415__4.cljs$lang$applyTo;
      return G__8415
    }()
  };
  var comp__4 = function() {
    var G__8418__delegate = function(f1, f2, f3, fs) {
      var fs__8409 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8419__delegate = function(args) {
          var ret__8410 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8409), args);
          var fs__8411 = cljs.core.next.call(null, fs__8409);
          while(true) {
            if(fs__8411) {
              var G__8420 = cljs.core.first.call(null, fs__8411).call(null, ret__8410);
              var G__8421 = cljs.core.next.call(null, fs__8411);
              ret__8410 = G__8420;
              fs__8411 = G__8421;
              continue
            }else {
              return ret__8410
            }
            break
          }
        };
        var G__8419 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8419__delegate.call(this, args)
        };
        G__8419.cljs$lang$maxFixedArity = 0;
        G__8419.cljs$lang$applyTo = function(arglist__8422) {
          var args = cljs.core.seq(arglist__8422);
          return G__8419__delegate(args)
        };
        G__8419.cljs$lang$arity$variadic = G__8419__delegate;
        return G__8419
      }()
    };
    var G__8418 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8418__delegate.call(this, f1, f2, f3, fs)
    };
    G__8418.cljs$lang$maxFixedArity = 3;
    G__8418.cljs$lang$applyTo = function(arglist__8423) {
      var f1 = cljs.core.first(arglist__8423);
      var f2 = cljs.core.first(cljs.core.next(arglist__8423));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8423)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8423)));
      return G__8418__delegate(f1, f2, f3, fs)
    };
    G__8418.cljs$lang$arity$variadic = G__8418__delegate;
    return G__8418
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__8424__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8424 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8424__delegate.call(this, args)
      };
      G__8424.cljs$lang$maxFixedArity = 0;
      G__8424.cljs$lang$applyTo = function(arglist__8425) {
        var args = cljs.core.seq(arglist__8425);
        return G__8424__delegate(args)
      };
      G__8424.cljs$lang$arity$variadic = G__8424__delegate;
      return G__8424
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8426__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8426 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8426__delegate.call(this, args)
      };
      G__8426.cljs$lang$maxFixedArity = 0;
      G__8426.cljs$lang$applyTo = function(arglist__8427) {
        var args = cljs.core.seq(arglist__8427);
        return G__8426__delegate(args)
      };
      G__8426.cljs$lang$arity$variadic = G__8426__delegate;
      return G__8426
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8428__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8428 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8428__delegate.call(this, args)
      };
      G__8428.cljs$lang$maxFixedArity = 0;
      G__8428.cljs$lang$applyTo = function(arglist__8429) {
        var args = cljs.core.seq(arglist__8429);
        return G__8428__delegate(args)
      };
      G__8428.cljs$lang$arity$variadic = G__8428__delegate;
      return G__8428
    }()
  };
  var partial__5 = function() {
    var G__8430__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8431__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8431 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8431__delegate.call(this, args)
        };
        G__8431.cljs$lang$maxFixedArity = 0;
        G__8431.cljs$lang$applyTo = function(arglist__8432) {
          var args = cljs.core.seq(arglist__8432);
          return G__8431__delegate(args)
        };
        G__8431.cljs$lang$arity$variadic = G__8431__delegate;
        return G__8431
      }()
    };
    var G__8430 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8430__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8430.cljs$lang$maxFixedArity = 4;
    G__8430.cljs$lang$applyTo = function(arglist__8433) {
      var f = cljs.core.first(arglist__8433);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8433));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8433)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8433))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8433))));
      return G__8430__delegate(f, arg1, arg2, arg3, more)
    };
    G__8430.cljs$lang$arity$variadic = G__8430__delegate;
    return G__8430
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__8434 = null;
      var G__8434__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8434__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8434__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8434__4 = function() {
        var G__8435__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8435 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8435__delegate.call(this, a, b, c, ds)
        };
        G__8435.cljs$lang$maxFixedArity = 3;
        G__8435.cljs$lang$applyTo = function(arglist__8436) {
          var a = cljs.core.first(arglist__8436);
          var b = cljs.core.first(cljs.core.next(arglist__8436));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8436)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8436)));
          return G__8435__delegate(a, b, c, ds)
        };
        G__8435.cljs$lang$arity$variadic = G__8435__delegate;
        return G__8435
      }();
      G__8434 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8434__1.call(this, a);
          case 2:
            return G__8434__2.call(this, a, b);
          case 3:
            return G__8434__3.call(this, a, b, c);
          default:
            return G__8434__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8434.cljs$lang$maxFixedArity = 3;
      G__8434.cljs$lang$applyTo = G__8434__4.cljs$lang$applyTo;
      return G__8434
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8437 = null;
      var G__8437__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8437__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8437__4 = function() {
        var G__8438__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8438 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8438__delegate.call(this, a, b, c, ds)
        };
        G__8438.cljs$lang$maxFixedArity = 3;
        G__8438.cljs$lang$applyTo = function(arglist__8439) {
          var a = cljs.core.first(arglist__8439);
          var b = cljs.core.first(cljs.core.next(arglist__8439));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8439)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8439)));
          return G__8438__delegate(a, b, c, ds)
        };
        G__8438.cljs$lang$arity$variadic = G__8438__delegate;
        return G__8438
      }();
      G__8437 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8437__2.call(this, a, b);
          case 3:
            return G__8437__3.call(this, a, b, c);
          default:
            return G__8437__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8437.cljs$lang$maxFixedArity = 3;
      G__8437.cljs$lang$applyTo = G__8437__4.cljs$lang$applyTo;
      return G__8437
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8440 = null;
      var G__8440__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8440__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8440__4 = function() {
        var G__8441__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8441 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8441__delegate.call(this, a, b, c, ds)
        };
        G__8441.cljs$lang$maxFixedArity = 3;
        G__8441.cljs$lang$applyTo = function(arglist__8442) {
          var a = cljs.core.first(arglist__8442);
          var b = cljs.core.first(cljs.core.next(arglist__8442));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8442)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8442)));
          return G__8441__delegate(a, b, c, ds)
        };
        G__8441.cljs$lang$arity$variadic = G__8441__delegate;
        return G__8441
      }();
      G__8440 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8440__2.call(this, a, b);
          case 3:
            return G__8440__3.call(this, a, b, c);
          default:
            return G__8440__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8440.cljs$lang$maxFixedArity = 3;
      G__8440.cljs$lang$applyTo = G__8440__4.cljs$lang$applyTo;
      return G__8440
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8458 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8466 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8466) {
        var s__8467 = temp__3974__auto____8466;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8467)) {
          var c__8468 = cljs.core.chunk_first.call(null, s__8467);
          var size__8469 = cljs.core.count.call(null, c__8468);
          var b__8470 = cljs.core.chunk_buffer.call(null, size__8469);
          var n__2533__auto____8471 = size__8469;
          var i__8472 = 0;
          while(true) {
            if(i__8472 < n__2533__auto____8471) {
              cljs.core.chunk_append.call(null, b__8470, f.call(null, idx + i__8472, cljs.core._nth.call(null, c__8468, i__8472)));
              var G__8473 = i__8472 + 1;
              i__8472 = G__8473;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8470), mapi.call(null, idx + size__8469, cljs.core.chunk_rest.call(null, s__8467)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8467)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8467)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8458.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8483 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8483) {
      var s__8484 = temp__3974__auto____8483;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8484)) {
        var c__8485 = cljs.core.chunk_first.call(null, s__8484);
        var size__8486 = cljs.core.count.call(null, c__8485);
        var b__8487 = cljs.core.chunk_buffer.call(null, size__8486);
        var n__2533__auto____8488 = size__8486;
        var i__8489 = 0;
        while(true) {
          if(i__8489 < n__2533__auto____8488) {
            var x__8490 = f.call(null, cljs.core._nth.call(null, c__8485, i__8489));
            if(x__8490 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8487, x__8490)
            }
            var G__8492 = i__8489 + 1;
            i__8489 = G__8492;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8487), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8484)))
      }else {
        var x__8491 = f.call(null, cljs.core.first.call(null, s__8484));
        if(x__8491 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8484))
        }else {
          return cljs.core.cons.call(null, x__8491, keep.call(null, f, cljs.core.rest.call(null, s__8484)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8518 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8528 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8528) {
        var s__8529 = temp__3974__auto____8528;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8529)) {
          var c__8530 = cljs.core.chunk_first.call(null, s__8529);
          var size__8531 = cljs.core.count.call(null, c__8530);
          var b__8532 = cljs.core.chunk_buffer.call(null, size__8531);
          var n__2533__auto____8533 = size__8531;
          var i__8534 = 0;
          while(true) {
            if(i__8534 < n__2533__auto____8533) {
              var x__8535 = f.call(null, idx + i__8534, cljs.core._nth.call(null, c__8530, i__8534));
              if(x__8535 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8532, x__8535)
              }
              var G__8537 = i__8534 + 1;
              i__8534 = G__8537;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8532), keepi.call(null, idx + size__8531, cljs.core.chunk_rest.call(null, s__8529)))
        }else {
          var x__8536 = f.call(null, idx, cljs.core.first.call(null, s__8529));
          if(x__8536 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8529))
          }else {
            return cljs.core.cons.call(null, x__8536, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8529)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8518.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8623 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8623)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8623
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8624 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8624)) {
            var and__3822__auto____8625 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8625)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8625
            }
          }else {
            return and__3822__auto____8624
          }
        }())
      };
      var ep1__4 = function() {
        var G__8694__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8626 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8626)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8626
            }
          }())
        };
        var G__8694 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8694__delegate.call(this, x, y, z, args)
        };
        G__8694.cljs$lang$maxFixedArity = 3;
        G__8694.cljs$lang$applyTo = function(arglist__8695) {
          var x = cljs.core.first(arglist__8695);
          var y = cljs.core.first(cljs.core.next(arglist__8695));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8695)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8695)));
          return G__8694__delegate(x, y, z, args)
        };
        G__8694.cljs$lang$arity$variadic = G__8694__delegate;
        return G__8694
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8638 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8638)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8638
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8639 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8639)) {
            var and__3822__auto____8640 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8640)) {
              var and__3822__auto____8641 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8641)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8641
              }
            }else {
              return and__3822__auto____8640
            }
          }else {
            return and__3822__auto____8639
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8642 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8642)) {
            var and__3822__auto____8643 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8643)) {
              var and__3822__auto____8644 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8644)) {
                var and__3822__auto____8645 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8645)) {
                  var and__3822__auto____8646 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8646)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8646
                  }
                }else {
                  return and__3822__auto____8645
                }
              }else {
                return and__3822__auto____8644
              }
            }else {
              return and__3822__auto____8643
            }
          }else {
            return and__3822__auto____8642
          }
        }())
      };
      var ep2__4 = function() {
        var G__8696__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8647 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8647)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8493_SHARP_) {
                var and__3822__auto____8648 = p1.call(null, p1__8493_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8648)) {
                  return p2.call(null, p1__8493_SHARP_)
                }else {
                  return and__3822__auto____8648
                }
              }, args)
            }else {
              return and__3822__auto____8647
            }
          }())
        };
        var G__8696 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8696__delegate.call(this, x, y, z, args)
        };
        G__8696.cljs$lang$maxFixedArity = 3;
        G__8696.cljs$lang$applyTo = function(arglist__8697) {
          var x = cljs.core.first(arglist__8697);
          var y = cljs.core.first(cljs.core.next(arglist__8697));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8697)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8697)));
          return G__8696__delegate(x, y, z, args)
        };
        G__8696.cljs$lang$arity$variadic = G__8696__delegate;
        return G__8696
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8667 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8667)) {
            var and__3822__auto____8668 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8668)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8668
            }
          }else {
            return and__3822__auto____8667
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8669 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8669)) {
            var and__3822__auto____8670 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8670)) {
              var and__3822__auto____8671 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8671)) {
                var and__3822__auto____8672 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8672)) {
                  var and__3822__auto____8673 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8673)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8673
                  }
                }else {
                  return and__3822__auto____8672
                }
              }else {
                return and__3822__auto____8671
              }
            }else {
              return and__3822__auto____8670
            }
          }else {
            return and__3822__auto____8669
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8674 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8674)) {
            var and__3822__auto____8675 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8675)) {
              var and__3822__auto____8676 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8676)) {
                var and__3822__auto____8677 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8677)) {
                  var and__3822__auto____8678 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8678)) {
                    var and__3822__auto____8679 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8679)) {
                      var and__3822__auto____8680 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8680)) {
                        var and__3822__auto____8681 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8681)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8681
                        }
                      }else {
                        return and__3822__auto____8680
                      }
                    }else {
                      return and__3822__auto____8679
                    }
                  }else {
                    return and__3822__auto____8678
                  }
                }else {
                  return and__3822__auto____8677
                }
              }else {
                return and__3822__auto____8676
              }
            }else {
              return and__3822__auto____8675
            }
          }else {
            return and__3822__auto____8674
          }
        }())
      };
      var ep3__4 = function() {
        var G__8698__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8682 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8682)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8494_SHARP_) {
                var and__3822__auto____8683 = p1.call(null, p1__8494_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8683)) {
                  var and__3822__auto____8684 = p2.call(null, p1__8494_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8684)) {
                    return p3.call(null, p1__8494_SHARP_)
                  }else {
                    return and__3822__auto____8684
                  }
                }else {
                  return and__3822__auto____8683
                }
              }, args)
            }else {
              return and__3822__auto____8682
            }
          }())
        };
        var G__8698 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8698__delegate.call(this, x, y, z, args)
        };
        G__8698.cljs$lang$maxFixedArity = 3;
        G__8698.cljs$lang$applyTo = function(arglist__8699) {
          var x = cljs.core.first(arglist__8699);
          var y = cljs.core.first(cljs.core.next(arglist__8699));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8699)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8699)));
          return G__8698__delegate(x, y, z, args)
        };
        G__8698.cljs$lang$arity$variadic = G__8698__delegate;
        return G__8698
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8700__delegate = function(p1, p2, p3, ps) {
      var ps__8685 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8495_SHARP_) {
            return p1__8495_SHARP_.call(null, x)
          }, ps__8685)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8496_SHARP_) {
            var and__3822__auto____8690 = p1__8496_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8690)) {
              return p1__8496_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8690
            }
          }, ps__8685)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8497_SHARP_) {
            var and__3822__auto____8691 = p1__8497_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8691)) {
              var and__3822__auto____8692 = p1__8497_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8692)) {
                return p1__8497_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8692
              }
            }else {
              return and__3822__auto____8691
            }
          }, ps__8685)
        };
        var epn__4 = function() {
          var G__8701__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8693 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8693)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8498_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8498_SHARP_, args)
                }, ps__8685)
              }else {
                return and__3822__auto____8693
              }
            }())
          };
          var G__8701 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8701__delegate.call(this, x, y, z, args)
          };
          G__8701.cljs$lang$maxFixedArity = 3;
          G__8701.cljs$lang$applyTo = function(arglist__8702) {
            var x = cljs.core.first(arglist__8702);
            var y = cljs.core.first(cljs.core.next(arglist__8702));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8702)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8702)));
            return G__8701__delegate(x, y, z, args)
          };
          G__8701.cljs$lang$arity$variadic = G__8701__delegate;
          return G__8701
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8700 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8700__delegate.call(this, p1, p2, p3, ps)
    };
    G__8700.cljs$lang$maxFixedArity = 3;
    G__8700.cljs$lang$applyTo = function(arglist__8703) {
      var p1 = cljs.core.first(arglist__8703);
      var p2 = cljs.core.first(cljs.core.next(arglist__8703));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8703)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8703)));
      return G__8700__delegate(p1, p2, p3, ps)
    };
    G__8700.cljs$lang$arity$variadic = G__8700__delegate;
    return G__8700
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8784 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8784)) {
          return or__3824__auto____8784
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8785 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8785)) {
          return or__3824__auto____8785
        }else {
          var or__3824__auto____8786 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8786)) {
            return or__3824__auto____8786
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8855__delegate = function(x, y, z, args) {
          var or__3824__auto____8787 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8787)) {
            return or__3824__auto____8787
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8855 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8855__delegate.call(this, x, y, z, args)
        };
        G__8855.cljs$lang$maxFixedArity = 3;
        G__8855.cljs$lang$applyTo = function(arglist__8856) {
          var x = cljs.core.first(arglist__8856);
          var y = cljs.core.first(cljs.core.next(arglist__8856));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8856)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8856)));
          return G__8855__delegate(x, y, z, args)
        };
        G__8855.cljs$lang$arity$variadic = G__8855__delegate;
        return G__8855
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8799 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8799)) {
          return or__3824__auto____8799
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8800 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8800)) {
          return or__3824__auto____8800
        }else {
          var or__3824__auto____8801 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8801)) {
            return or__3824__auto____8801
          }else {
            var or__3824__auto____8802 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8802)) {
              return or__3824__auto____8802
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8803 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8803)) {
          return or__3824__auto____8803
        }else {
          var or__3824__auto____8804 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8804)) {
            return or__3824__auto____8804
          }else {
            var or__3824__auto____8805 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8805)) {
              return or__3824__auto____8805
            }else {
              var or__3824__auto____8806 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8806)) {
                return or__3824__auto____8806
              }else {
                var or__3824__auto____8807 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8807)) {
                  return or__3824__auto____8807
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8857__delegate = function(x, y, z, args) {
          var or__3824__auto____8808 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8808)) {
            return or__3824__auto____8808
          }else {
            return cljs.core.some.call(null, function(p1__8538_SHARP_) {
              var or__3824__auto____8809 = p1.call(null, p1__8538_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8809)) {
                return or__3824__auto____8809
              }else {
                return p2.call(null, p1__8538_SHARP_)
              }
            }, args)
          }
        };
        var G__8857 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8857__delegate.call(this, x, y, z, args)
        };
        G__8857.cljs$lang$maxFixedArity = 3;
        G__8857.cljs$lang$applyTo = function(arglist__8858) {
          var x = cljs.core.first(arglist__8858);
          var y = cljs.core.first(cljs.core.next(arglist__8858));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8858)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8858)));
          return G__8857__delegate(x, y, z, args)
        };
        G__8857.cljs$lang$arity$variadic = G__8857__delegate;
        return G__8857
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8828 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8828)) {
          return or__3824__auto____8828
        }else {
          var or__3824__auto____8829 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8829)) {
            return or__3824__auto____8829
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8830 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8830)) {
          return or__3824__auto____8830
        }else {
          var or__3824__auto____8831 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8831)) {
            return or__3824__auto____8831
          }else {
            var or__3824__auto____8832 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8832)) {
              return or__3824__auto____8832
            }else {
              var or__3824__auto____8833 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8833)) {
                return or__3824__auto____8833
              }else {
                var or__3824__auto____8834 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8834)) {
                  return or__3824__auto____8834
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8835 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8835)) {
          return or__3824__auto____8835
        }else {
          var or__3824__auto____8836 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8836)) {
            return or__3824__auto____8836
          }else {
            var or__3824__auto____8837 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8837)) {
              return or__3824__auto____8837
            }else {
              var or__3824__auto____8838 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8838)) {
                return or__3824__auto____8838
              }else {
                var or__3824__auto____8839 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8839)) {
                  return or__3824__auto____8839
                }else {
                  var or__3824__auto____8840 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8840)) {
                    return or__3824__auto____8840
                  }else {
                    var or__3824__auto____8841 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8841)) {
                      return or__3824__auto____8841
                    }else {
                      var or__3824__auto____8842 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8842)) {
                        return or__3824__auto____8842
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8859__delegate = function(x, y, z, args) {
          var or__3824__auto____8843 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8843)) {
            return or__3824__auto____8843
          }else {
            return cljs.core.some.call(null, function(p1__8539_SHARP_) {
              var or__3824__auto____8844 = p1.call(null, p1__8539_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8844)) {
                return or__3824__auto____8844
              }else {
                var or__3824__auto____8845 = p2.call(null, p1__8539_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8845)) {
                  return or__3824__auto____8845
                }else {
                  return p3.call(null, p1__8539_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8859 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8859__delegate.call(this, x, y, z, args)
        };
        G__8859.cljs$lang$maxFixedArity = 3;
        G__8859.cljs$lang$applyTo = function(arglist__8860) {
          var x = cljs.core.first(arglist__8860);
          var y = cljs.core.first(cljs.core.next(arglist__8860));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8860)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8860)));
          return G__8859__delegate(x, y, z, args)
        };
        G__8859.cljs$lang$arity$variadic = G__8859__delegate;
        return G__8859
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8861__delegate = function(p1, p2, p3, ps) {
      var ps__8846 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8540_SHARP_) {
            return p1__8540_SHARP_.call(null, x)
          }, ps__8846)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8541_SHARP_) {
            var or__3824__auto____8851 = p1__8541_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8851)) {
              return or__3824__auto____8851
            }else {
              return p1__8541_SHARP_.call(null, y)
            }
          }, ps__8846)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8542_SHARP_) {
            var or__3824__auto____8852 = p1__8542_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8852)) {
              return or__3824__auto____8852
            }else {
              var or__3824__auto____8853 = p1__8542_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8853)) {
                return or__3824__auto____8853
              }else {
                return p1__8542_SHARP_.call(null, z)
              }
            }
          }, ps__8846)
        };
        var spn__4 = function() {
          var G__8862__delegate = function(x, y, z, args) {
            var or__3824__auto____8854 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8854)) {
              return or__3824__auto____8854
            }else {
              return cljs.core.some.call(null, function(p1__8543_SHARP_) {
                return cljs.core.some.call(null, p1__8543_SHARP_, args)
              }, ps__8846)
            }
          };
          var G__8862 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8862__delegate.call(this, x, y, z, args)
          };
          G__8862.cljs$lang$maxFixedArity = 3;
          G__8862.cljs$lang$applyTo = function(arglist__8863) {
            var x = cljs.core.first(arglist__8863);
            var y = cljs.core.first(cljs.core.next(arglist__8863));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8863)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8863)));
            return G__8862__delegate(x, y, z, args)
          };
          G__8862.cljs$lang$arity$variadic = G__8862__delegate;
          return G__8862
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8861 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8861__delegate.call(this, p1, p2, p3, ps)
    };
    G__8861.cljs$lang$maxFixedArity = 3;
    G__8861.cljs$lang$applyTo = function(arglist__8864) {
      var p1 = cljs.core.first(arglist__8864);
      var p2 = cljs.core.first(cljs.core.next(arglist__8864));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8864)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8864)));
      return G__8861__delegate(p1, p2, p3, ps)
    };
    G__8861.cljs$lang$arity$variadic = G__8861__delegate;
    return G__8861
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8883 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8883) {
        var s__8884 = temp__3974__auto____8883;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8884)) {
          var c__8885 = cljs.core.chunk_first.call(null, s__8884);
          var size__8886 = cljs.core.count.call(null, c__8885);
          var b__8887 = cljs.core.chunk_buffer.call(null, size__8886);
          var n__2533__auto____8888 = size__8886;
          var i__8889 = 0;
          while(true) {
            if(i__8889 < n__2533__auto____8888) {
              cljs.core.chunk_append.call(null, b__8887, f.call(null, cljs.core._nth.call(null, c__8885, i__8889)));
              var G__8901 = i__8889 + 1;
              i__8889 = G__8901;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8887), map.call(null, f, cljs.core.chunk_rest.call(null, s__8884)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8884)), map.call(null, f, cljs.core.rest.call(null, s__8884)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8890 = cljs.core.seq.call(null, c1);
      var s2__8891 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8892 = s1__8890;
        if(and__3822__auto____8892) {
          return s2__8891
        }else {
          return and__3822__auto____8892
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8890), cljs.core.first.call(null, s2__8891)), map.call(null, f, cljs.core.rest.call(null, s1__8890), cljs.core.rest.call(null, s2__8891)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8893 = cljs.core.seq.call(null, c1);
      var s2__8894 = cljs.core.seq.call(null, c2);
      var s3__8895 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8896 = s1__8893;
        if(and__3822__auto____8896) {
          var and__3822__auto____8897 = s2__8894;
          if(and__3822__auto____8897) {
            return s3__8895
          }else {
            return and__3822__auto____8897
          }
        }else {
          return and__3822__auto____8896
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8893), cljs.core.first.call(null, s2__8894), cljs.core.first.call(null, s3__8895)), map.call(null, f, cljs.core.rest.call(null, s1__8893), cljs.core.rest.call(null, s2__8894), cljs.core.rest.call(null, s3__8895)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8902__delegate = function(f, c1, c2, c3, colls) {
      var step__8900 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8899 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8899)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8899), step.call(null, map.call(null, cljs.core.rest, ss__8899)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8704_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8704_SHARP_)
      }, step__8900.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8902 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8902__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8902.cljs$lang$maxFixedArity = 4;
    G__8902.cljs$lang$applyTo = function(arglist__8903) {
      var f = cljs.core.first(arglist__8903);
      var c1 = cljs.core.first(cljs.core.next(arglist__8903));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8903)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8903))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8903))));
      return G__8902__delegate(f, c1, c2, c3, colls)
    };
    G__8902.cljs$lang$arity$variadic = G__8902__delegate;
    return G__8902
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8906 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8906) {
        var s__8907 = temp__3974__auto____8906;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8907), take.call(null, n - 1, cljs.core.rest.call(null, s__8907)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8913 = function(n, coll) {
    while(true) {
      var s__8911 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8912 = n > 0;
        if(and__3822__auto____8912) {
          return s__8911
        }else {
          return and__3822__auto____8912
        }
      }())) {
        var G__8914 = n - 1;
        var G__8915 = cljs.core.rest.call(null, s__8911);
        n = G__8914;
        coll = G__8915;
        continue
      }else {
        return s__8911
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8913.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8918 = cljs.core.seq.call(null, coll);
  var lead__8919 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8919) {
      var G__8920 = cljs.core.next.call(null, s__8918);
      var G__8921 = cljs.core.next.call(null, lead__8919);
      s__8918 = G__8920;
      lead__8919 = G__8921;
      continue
    }else {
      return s__8918
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8927 = function(pred, coll) {
    while(true) {
      var s__8925 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8926 = s__8925;
        if(and__3822__auto____8926) {
          return pred.call(null, cljs.core.first.call(null, s__8925))
        }else {
          return and__3822__auto____8926
        }
      }())) {
        var G__8928 = pred;
        var G__8929 = cljs.core.rest.call(null, s__8925);
        pred = G__8928;
        coll = G__8929;
        continue
      }else {
        return s__8925
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8927.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8932 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8932) {
      var s__8933 = temp__3974__auto____8932;
      return cljs.core.concat.call(null, s__8933, cycle.call(null, s__8933))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8938 = cljs.core.seq.call(null, c1);
      var s2__8939 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8940 = s1__8938;
        if(and__3822__auto____8940) {
          return s2__8939
        }else {
          return and__3822__auto____8940
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8938), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8939), interleave.call(null, cljs.core.rest.call(null, s1__8938), cljs.core.rest.call(null, s2__8939))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8942__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8941 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8941)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8941), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8941)))
        }else {
          return null
        }
      }, null)
    };
    var G__8942 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8942__delegate.call(this, c1, c2, colls)
    };
    G__8942.cljs$lang$maxFixedArity = 2;
    G__8942.cljs$lang$applyTo = function(arglist__8943) {
      var c1 = cljs.core.first(arglist__8943);
      var c2 = cljs.core.first(cljs.core.next(arglist__8943));
      var colls = cljs.core.rest(cljs.core.next(arglist__8943));
      return G__8942__delegate(c1, c2, colls)
    };
    G__8942.cljs$lang$arity$variadic = G__8942__delegate;
    return G__8942
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8953 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8951 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8951) {
        var coll__8952 = temp__3971__auto____8951;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8952), cat.call(null, cljs.core.rest.call(null, coll__8952), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8953.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8954__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8954 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8954__delegate.call(this, f, coll, colls)
    };
    G__8954.cljs$lang$maxFixedArity = 2;
    G__8954.cljs$lang$applyTo = function(arglist__8955) {
      var f = cljs.core.first(arglist__8955);
      var coll = cljs.core.first(cljs.core.next(arglist__8955));
      var colls = cljs.core.rest(cljs.core.next(arglist__8955));
      return G__8954__delegate(f, coll, colls)
    };
    G__8954.cljs$lang$arity$variadic = G__8954__delegate;
    return G__8954
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8965 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8965) {
      var s__8966 = temp__3974__auto____8965;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8966)) {
        var c__8967 = cljs.core.chunk_first.call(null, s__8966);
        var size__8968 = cljs.core.count.call(null, c__8967);
        var b__8969 = cljs.core.chunk_buffer.call(null, size__8968);
        var n__2533__auto____8970 = size__8968;
        var i__8971 = 0;
        while(true) {
          if(i__8971 < n__2533__auto____8970) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8967, i__8971)))) {
              cljs.core.chunk_append.call(null, b__8969, cljs.core._nth.call(null, c__8967, i__8971))
            }else {
            }
            var G__8974 = i__8971 + 1;
            i__8971 = G__8974;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8969), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8966)))
      }else {
        var f__8972 = cljs.core.first.call(null, s__8966);
        var r__8973 = cljs.core.rest.call(null, s__8966);
        if(cljs.core.truth_(pred.call(null, f__8972))) {
          return cljs.core.cons.call(null, f__8972, filter.call(null, pred, r__8973))
        }else {
          return filter.call(null, pred, r__8973)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8977 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8977.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8975_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8975_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8981__8982 = to;
    if(G__8981__8982) {
      if(function() {
        var or__3824__auto____8983 = G__8981__8982.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8983) {
          return or__3824__auto____8983
        }else {
          return G__8981__8982.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8981__8982.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8981__8982)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8981__8982)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8984__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8984 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8984__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8984.cljs$lang$maxFixedArity = 4;
    G__8984.cljs$lang$applyTo = function(arglist__8985) {
      var f = cljs.core.first(arglist__8985);
      var c1 = cljs.core.first(cljs.core.next(arglist__8985));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8985)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8985))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8985))));
      return G__8984__delegate(f, c1, c2, c3, colls)
    };
    G__8984.cljs$lang$arity$variadic = G__8984__delegate;
    return G__8984
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8992 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8992) {
        var s__8993 = temp__3974__auto____8992;
        var p__8994 = cljs.core.take.call(null, n, s__8993);
        if(n === cljs.core.count.call(null, p__8994)) {
          return cljs.core.cons.call(null, p__8994, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8993)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8995 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8995) {
        var s__8996 = temp__3974__auto____8995;
        var p__8997 = cljs.core.take.call(null, n, s__8996);
        if(n === cljs.core.count.call(null, p__8997)) {
          return cljs.core.cons.call(null, p__8997, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8996)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8997, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__9002 = cljs.core.lookup_sentinel;
    var m__9003 = m;
    var ks__9004 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__9004) {
        var m__9005 = cljs.core._lookup.call(null, m__9003, cljs.core.first.call(null, ks__9004), sentinel__9002);
        if(sentinel__9002 === m__9005) {
          return not_found
        }else {
          var G__9006 = sentinel__9002;
          var G__9007 = m__9005;
          var G__9008 = cljs.core.next.call(null, ks__9004);
          sentinel__9002 = G__9006;
          m__9003 = G__9007;
          ks__9004 = G__9008;
          continue
        }
      }else {
        return m__9003
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__9009, v) {
  var vec__9014__9015 = p__9009;
  var k__9016 = cljs.core.nth.call(null, vec__9014__9015, 0, null);
  var ks__9017 = cljs.core.nthnext.call(null, vec__9014__9015, 1);
  if(cljs.core.truth_(ks__9017)) {
    return cljs.core.assoc.call(null, m, k__9016, assoc_in.call(null, cljs.core._lookup.call(null, m, k__9016, null), ks__9017, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9016, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9018, f, args) {
    var vec__9023__9024 = p__9018;
    var k__9025 = cljs.core.nth.call(null, vec__9023__9024, 0, null);
    var ks__9026 = cljs.core.nthnext.call(null, vec__9023__9024, 1);
    if(cljs.core.truth_(ks__9026)) {
      return cljs.core.assoc.call(null, m, k__9025, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__9025, null), ks__9026, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9025, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__9025, null), args))
    }
  };
  var update_in = function(m, p__9018, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9018, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9027) {
    var m = cljs.core.first(arglist__9027);
    var p__9018 = cljs.core.first(cljs.core.next(arglist__9027));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9027)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9027)));
    return update_in__delegate(m, p__9018, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9030 = this;
  var h__2198__auto____9031 = this__9030.__hash;
  if(!(h__2198__auto____9031 == null)) {
    return h__2198__auto____9031
  }else {
    var h__2198__auto____9032 = cljs.core.hash_coll.call(null, coll);
    this__9030.__hash = h__2198__auto____9032;
    return h__2198__auto____9032
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9033 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9034 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9035 = this;
  var new_array__9036 = this__9035.array.slice();
  new_array__9036[k] = v;
  return new cljs.core.Vector(this__9035.meta, new_array__9036, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__9067 = null;
  var G__9067__2 = function(this_sym9037, k) {
    var this__9039 = this;
    var this_sym9037__9040 = this;
    var coll__9041 = this_sym9037__9040;
    return coll__9041.cljs$core$ILookup$_lookup$arity$2(coll__9041, k)
  };
  var G__9067__3 = function(this_sym9038, k, not_found) {
    var this__9039 = this;
    var this_sym9038__9042 = this;
    var coll__9043 = this_sym9038__9042;
    return coll__9043.cljs$core$ILookup$_lookup$arity$3(coll__9043, k, not_found)
  };
  G__9067 = function(this_sym9038, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9067__2.call(this, this_sym9038, k);
      case 3:
        return G__9067__3.call(this, this_sym9038, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9067
}();
cljs.core.Vector.prototype.apply = function(this_sym9028, args9029) {
  var this__9044 = this;
  return this_sym9028.call.apply(this_sym9028, [this_sym9028].concat(args9029.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9045 = this;
  var new_array__9046 = this__9045.array.slice();
  new_array__9046.push(o);
  return new cljs.core.Vector(this__9045.meta, new_array__9046, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9047 = this;
  var this__9048 = this;
  return cljs.core.pr_str.call(null, this__9048)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9049 = this;
  return cljs.core.ci_reduce.call(null, this__9049.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9050 = this;
  return cljs.core.ci_reduce.call(null, this__9050.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9051 = this;
  if(this__9051.array.length > 0) {
    var vector_seq__9052 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9051.array.length) {
          return cljs.core.cons.call(null, this__9051.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__9052.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9053 = this;
  return this__9053.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9054 = this;
  var count__9055 = this__9054.array.length;
  if(count__9055 > 0) {
    return this__9054.array[count__9055 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9056 = this;
  if(this__9056.array.length > 0) {
    var new_array__9057 = this__9056.array.slice();
    new_array__9057.pop();
    return new cljs.core.Vector(this__9056.meta, new_array__9057, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9058 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9059 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9060 = this;
  return new cljs.core.Vector(meta, this__9060.array, this__9060.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9061 = this;
  return this__9061.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9062 = this;
  if(function() {
    var and__3822__auto____9063 = 0 <= n;
    if(and__3822__auto____9063) {
      return n < this__9062.array.length
    }else {
      return and__3822__auto____9063
    }
  }()) {
    return this__9062.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9064 = this;
  if(function() {
    var and__3822__auto____9065 = 0 <= n;
    if(and__3822__auto____9065) {
      return n < this__9064.array.length
    }else {
      return and__3822__auto____9065
    }
  }()) {
    return this__9064.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9066 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9066.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2316__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__9069 = pv.cnt;
  if(cnt__9069 < 32) {
    return 0
  }else {
    return cnt__9069 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__9075 = level;
  var ret__9076 = node;
  while(true) {
    if(ll__9075 === 0) {
      return ret__9076
    }else {
      var embed__9077 = ret__9076;
      var r__9078 = cljs.core.pv_fresh_node.call(null, edit);
      var ___9079 = cljs.core.pv_aset.call(null, r__9078, 0, embed__9077);
      var G__9080 = ll__9075 - 5;
      var G__9081 = r__9078;
      ll__9075 = G__9080;
      ret__9076 = G__9081;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9087 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__9088 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__9087, subidx__9088, tailnode);
    return ret__9087
  }else {
    var child__9089 = cljs.core.pv_aget.call(null, parent, subidx__9088);
    if(!(child__9089 == null)) {
      var node_to_insert__9090 = push_tail.call(null, pv, level - 5, child__9089, tailnode);
      cljs.core.pv_aset.call(null, ret__9087, subidx__9088, node_to_insert__9090);
      return ret__9087
    }else {
      var node_to_insert__9091 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__9087, subidx__9088, node_to_insert__9091);
      return ret__9087
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____9095 = 0 <= i;
    if(and__3822__auto____9095) {
      return i < pv.cnt
    }else {
      return and__3822__auto____9095
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__9096 = pv.root;
      var level__9097 = pv.shift;
      while(true) {
        if(level__9097 > 0) {
          var G__9098 = cljs.core.pv_aget.call(null, node__9096, i >>> level__9097 & 31);
          var G__9099 = level__9097 - 5;
          node__9096 = G__9098;
          level__9097 = G__9099;
          continue
        }else {
          return node__9096.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9102 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__9102, i & 31, val);
    return ret__9102
  }else {
    var subidx__9103 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__9102, subidx__9103, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9103), i, val));
    return ret__9102
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9109 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9110 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9109));
    if(function() {
      var and__3822__auto____9111 = new_child__9110 == null;
      if(and__3822__auto____9111) {
        return subidx__9109 === 0
      }else {
        return and__3822__auto____9111
      }
    }()) {
      return null
    }else {
      var ret__9112 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__9112, subidx__9109, new_child__9110);
      return ret__9112
    }
  }else {
    if(subidx__9109 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__9113 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__9113, subidx__9109, null);
        return ret__9113
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9116 = this;
  return new cljs.core.TransientVector(this__9116.cnt, this__9116.shift, cljs.core.tv_editable_root.call(null, this__9116.root), cljs.core.tv_editable_tail.call(null, this__9116.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9117 = this;
  var h__2198__auto____9118 = this__9117.__hash;
  if(!(h__2198__auto____9118 == null)) {
    return h__2198__auto____9118
  }else {
    var h__2198__auto____9119 = cljs.core.hash_coll.call(null, coll);
    this__9117.__hash = h__2198__auto____9119;
    return h__2198__auto____9119
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9120 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9121 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9122 = this;
  if(function() {
    var and__3822__auto____9123 = 0 <= k;
    if(and__3822__auto____9123) {
      return k < this__9122.cnt
    }else {
      return and__3822__auto____9123
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__9124 = this__9122.tail.slice();
      new_tail__9124[k & 31] = v;
      return new cljs.core.PersistentVector(this__9122.meta, this__9122.cnt, this__9122.shift, this__9122.root, new_tail__9124, null)
    }else {
      return new cljs.core.PersistentVector(this__9122.meta, this__9122.cnt, this__9122.shift, cljs.core.do_assoc.call(null, coll, this__9122.shift, this__9122.root, k, v), this__9122.tail, null)
    }
  }else {
    if(k === this__9122.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__9122.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__9172 = null;
  var G__9172__2 = function(this_sym9125, k) {
    var this__9127 = this;
    var this_sym9125__9128 = this;
    var coll__9129 = this_sym9125__9128;
    return coll__9129.cljs$core$ILookup$_lookup$arity$2(coll__9129, k)
  };
  var G__9172__3 = function(this_sym9126, k, not_found) {
    var this__9127 = this;
    var this_sym9126__9130 = this;
    var coll__9131 = this_sym9126__9130;
    return coll__9131.cljs$core$ILookup$_lookup$arity$3(coll__9131, k, not_found)
  };
  G__9172 = function(this_sym9126, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9172__2.call(this, this_sym9126, k);
      case 3:
        return G__9172__3.call(this, this_sym9126, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9172
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym9114, args9115) {
  var this__9132 = this;
  return this_sym9114.call.apply(this_sym9114, [this_sym9114].concat(args9115.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__9133 = this;
  var step_init__9134 = [0, init];
  var i__9135 = 0;
  while(true) {
    if(i__9135 < this__9133.cnt) {
      var arr__9136 = cljs.core.array_for.call(null, v, i__9135);
      var len__9137 = arr__9136.length;
      var init__9141 = function() {
        var j__9138 = 0;
        var init__9139 = step_init__9134[1];
        while(true) {
          if(j__9138 < len__9137) {
            var init__9140 = f.call(null, init__9139, j__9138 + i__9135, arr__9136[j__9138]);
            if(cljs.core.reduced_QMARK_.call(null, init__9140)) {
              return init__9140
            }else {
              var G__9173 = j__9138 + 1;
              var G__9174 = init__9140;
              j__9138 = G__9173;
              init__9139 = G__9174;
              continue
            }
          }else {
            step_init__9134[0] = len__9137;
            step_init__9134[1] = init__9139;
            return init__9139
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9141)) {
        return cljs.core.deref.call(null, init__9141)
      }else {
        var G__9175 = i__9135 + step_init__9134[0];
        i__9135 = G__9175;
        continue
      }
    }else {
      return step_init__9134[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9142 = this;
  if(this__9142.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__9143 = this__9142.tail.slice();
    new_tail__9143.push(o);
    return new cljs.core.PersistentVector(this__9142.meta, this__9142.cnt + 1, this__9142.shift, this__9142.root, new_tail__9143, null)
  }else {
    var root_overflow_QMARK___9144 = this__9142.cnt >>> 5 > 1 << this__9142.shift;
    var new_shift__9145 = root_overflow_QMARK___9144 ? this__9142.shift + 5 : this__9142.shift;
    var new_root__9147 = root_overflow_QMARK___9144 ? function() {
      var n_r__9146 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__9146, 0, this__9142.root);
      cljs.core.pv_aset.call(null, n_r__9146, 1, cljs.core.new_path.call(null, null, this__9142.shift, new cljs.core.VectorNode(null, this__9142.tail)));
      return n_r__9146
    }() : cljs.core.push_tail.call(null, coll, this__9142.shift, this__9142.root, new cljs.core.VectorNode(null, this__9142.tail));
    return new cljs.core.PersistentVector(this__9142.meta, this__9142.cnt + 1, new_shift__9145, new_root__9147, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9148 = this;
  if(this__9148.cnt > 0) {
    return new cljs.core.RSeq(coll, this__9148.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__9149 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__9150 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__9151 = this;
  var this__9152 = this;
  return cljs.core.pr_str.call(null, this__9152)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9153 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9154 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9155 = this;
  if(this__9155.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9156 = this;
  return this__9156.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9157 = this;
  if(this__9157.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__9157.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9158 = this;
  if(this__9158.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__9158.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9158.meta)
    }else {
      if(1 < this__9158.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__9158.meta, this__9158.cnt - 1, this__9158.shift, this__9158.root, this__9158.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__9159 = cljs.core.array_for.call(null, coll, this__9158.cnt - 2);
          var nr__9160 = cljs.core.pop_tail.call(null, coll, this__9158.shift, this__9158.root);
          var new_root__9161 = nr__9160 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__9160;
          var cnt_1__9162 = this__9158.cnt - 1;
          if(function() {
            var and__3822__auto____9163 = 5 < this__9158.shift;
            if(and__3822__auto____9163) {
              return cljs.core.pv_aget.call(null, new_root__9161, 1) == null
            }else {
              return and__3822__auto____9163
            }
          }()) {
            return new cljs.core.PersistentVector(this__9158.meta, cnt_1__9162, this__9158.shift - 5, cljs.core.pv_aget.call(null, new_root__9161, 0), new_tail__9159, null)
          }else {
            return new cljs.core.PersistentVector(this__9158.meta, cnt_1__9162, this__9158.shift, new_root__9161, new_tail__9159, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9164 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9165 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9166 = this;
  return new cljs.core.PersistentVector(meta, this__9166.cnt, this__9166.shift, this__9166.root, this__9166.tail, this__9166.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9167 = this;
  return this__9167.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9168 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9169 = this;
  if(function() {
    var and__3822__auto____9170 = 0 <= n;
    if(and__3822__auto____9170) {
      return n < this__9169.cnt
    }else {
      return and__3822__auto____9170
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9171 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9171.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__9176 = xs.length;
  var xs__9177 = no_clone === true ? xs : xs.slice();
  if(l__9176 < 32) {
    return new cljs.core.PersistentVector(null, l__9176, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__9177, null)
  }else {
    var node__9178 = xs__9177.slice(0, 32);
    var v__9179 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__9178, null);
    var i__9180 = 32;
    var out__9181 = cljs.core._as_transient.call(null, v__9179);
    while(true) {
      if(i__9180 < l__9176) {
        var G__9182 = i__9180 + 1;
        var G__9183 = cljs.core.conj_BANG_.call(null, out__9181, xs__9177[i__9180]);
        i__9180 = G__9182;
        out__9181 = G__9183;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9181)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__9184) {
    var args = cljs.core.seq(arglist__9184);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__9185 = this;
  if(this__9185.off + 1 < this__9185.node.length) {
    var s__9186 = cljs.core.chunked_seq.call(null, this__9185.vec, this__9185.node, this__9185.i, this__9185.off + 1);
    if(s__9186 == null) {
      return null
    }else {
      return s__9186
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9187 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9188 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9189 = this;
  return this__9189.node[this__9189.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9190 = this;
  if(this__9190.off + 1 < this__9190.node.length) {
    var s__9191 = cljs.core.chunked_seq.call(null, this__9190.vec, this__9190.node, this__9190.i, this__9190.off + 1);
    if(s__9191 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__9191
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9192 = this;
  var l__9193 = this__9192.node.length;
  var s__9194 = this__9192.i + l__9193 < cljs.core._count.call(null, this__9192.vec) ? cljs.core.chunked_seq.call(null, this__9192.vec, this__9192.i + l__9193, 0) : null;
  if(s__9194 == null) {
    return null
  }else {
    return s__9194
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9195 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9196 = this;
  return cljs.core.chunked_seq.call(null, this__9196.vec, this__9196.node, this__9196.i, this__9196.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__9197 = this;
  return this__9197.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9198 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9198.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9199 = this;
  return cljs.core.array_chunk.call(null, this__9199.node, this__9199.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9200 = this;
  var l__9201 = this__9200.node.length;
  var s__9202 = this__9200.i + l__9201 < cljs.core._count.call(null, this__9200.vec) ? cljs.core.chunked_seq.call(null, this__9200.vec, this__9200.i + l__9201, 0) : null;
  if(s__9202 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__9202
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9205 = this;
  var h__2198__auto____9206 = this__9205.__hash;
  if(!(h__2198__auto____9206 == null)) {
    return h__2198__auto____9206
  }else {
    var h__2198__auto____9207 = cljs.core.hash_coll.call(null, coll);
    this__9205.__hash = h__2198__auto____9207;
    return h__2198__auto____9207
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9208 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9209 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9210 = this;
  var v_pos__9211 = this__9210.start + key;
  return new cljs.core.Subvec(this__9210.meta, cljs.core._assoc.call(null, this__9210.v, v_pos__9211, val), this__9210.start, this__9210.end > v_pos__9211 + 1 ? this__9210.end : v_pos__9211 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__9237 = null;
  var G__9237__2 = function(this_sym9212, k) {
    var this__9214 = this;
    var this_sym9212__9215 = this;
    var coll__9216 = this_sym9212__9215;
    return coll__9216.cljs$core$ILookup$_lookup$arity$2(coll__9216, k)
  };
  var G__9237__3 = function(this_sym9213, k, not_found) {
    var this__9214 = this;
    var this_sym9213__9217 = this;
    var coll__9218 = this_sym9213__9217;
    return coll__9218.cljs$core$ILookup$_lookup$arity$3(coll__9218, k, not_found)
  };
  G__9237 = function(this_sym9213, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9237__2.call(this, this_sym9213, k);
      case 3:
        return G__9237__3.call(this, this_sym9213, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9237
}();
cljs.core.Subvec.prototype.apply = function(this_sym9203, args9204) {
  var this__9219 = this;
  return this_sym9203.call.apply(this_sym9203, [this_sym9203].concat(args9204.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9220 = this;
  return new cljs.core.Subvec(this__9220.meta, cljs.core._assoc_n.call(null, this__9220.v, this__9220.end, o), this__9220.start, this__9220.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9221 = this;
  var this__9222 = this;
  return cljs.core.pr_str.call(null, this__9222)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9223 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9224 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9225 = this;
  var subvec_seq__9226 = function subvec_seq(i) {
    if(i === this__9225.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9225.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__9226.call(null, this__9225.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9227 = this;
  return this__9227.end - this__9227.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9228 = this;
  return cljs.core._nth.call(null, this__9228.v, this__9228.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9229 = this;
  if(this__9229.start === this__9229.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9229.meta, this__9229.v, this__9229.start, this__9229.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9230 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9231 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9232 = this;
  return new cljs.core.Subvec(meta, this__9232.v, this__9232.start, this__9232.end, this__9232.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9233 = this;
  return this__9233.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9234 = this;
  return cljs.core._nth.call(null, this__9234.v, this__9234.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9235 = this;
  return cljs.core._nth.call(null, this__9235.v, this__9235.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9236 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9236.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__9239 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9239, 0, tl.length);
  return ret__9239
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9243 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9244 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9243, subidx__9244, level === 5 ? tail_node : function() {
    var child__9245 = cljs.core.pv_aget.call(null, ret__9243, subidx__9244);
    if(!(child__9245 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__9245, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9243
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9250 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9251 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9252 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9250, subidx__9251));
    if(function() {
      var and__3822__auto____9253 = new_child__9252 == null;
      if(and__3822__auto____9253) {
        return subidx__9251 === 0
      }else {
        return and__3822__auto____9253
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9250, subidx__9251, new_child__9252);
      return node__9250
    }
  }else {
    if(subidx__9251 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9250, subidx__9251, null);
        return node__9250
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____9258 = 0 <= i;
    if(and__3822__auto____9258) {
      return i < tv.cnt
    }else {
      return and__3822__auto____9258
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9259 = tv.root;
      var node__9260 = root__9259;
      var level__9261 = tv.shift;
      while(true) {
        if(level__9261 > 0) {
          var G__9262 = cljs.core.tv_ensure_editable.call(null, root__9259.edit, cljs.core.pv_aget.call(null, node__9260, i >>> level__9261 & 31));
          var G__9263 = level__9261 - 5;
          node__9260 = G__9262;
          level__9261 = G__9263;
          continue
        }else {
          return node__9260.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__9303 = null;
  var G__9303__2 = function(this_sym9266, k) {
    var this__9268 = this;
    var this_sym9266__9269 = this;
    var coll__9270 = this_sym9266__9269;
    return coll__9270.cljs$core$ILookup$_lookup$arity$2(coll__9270, k)
  };
  var G__9303__3 = function(this_sym9267, k, not_found) {
    var this__9268 = this;
    var this_sym9267__9271 = this;
    var coll__9272 = this_sym9267__9271;
    return coll__9272.cljs$core$ILookup$_lookup$arity$3(coll__9272, k, not_found)
  };
  G__9303 = function(this_sym9267, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9303__2.call(this, this_sym9267, k);
      case 3:
        return G__9303__3.call(this, this_sym9267, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9303
}();
cljs.core.TransientVector.prototype.apply = function(this_sym9264, args9265) {
  var this__9273 = this;
  return this_sym9264.call.apply(this_sym9264, [this_sym9264].concat(args9265.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9274 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9275 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9276 = this;
  if(this__9276.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9277 = this;
  if(function() {
    var and__3822__auto____9278 = 0 <= n;
    if(and__3822__auto____9278) {
      return n < this__9277.cnt
    }else {
      return and__3822__auto____9278
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9279 = this;
  if(this__9279.root.edit) {
    return this__9279.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9280 = this;
  if(this__9280.root.edit) {
    if(function() {
      var and__3822__auto____9281 = 0 <= n;
      if(and__3822__auto____9281) {
        return n < this__9280.cnt
      }else {
        return and__3822__auto____9281
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9280.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9286 = function go(level, node) {
          var node__9284 = cljs.core.tv_ensure_editable.call(null, this__9280.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9284, n & 31, val);
            return node__9284
          }else {
            var subidx__9285 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9284, subidx__9285, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9284, subidx__9285)));
            return node__9284
          }
        }.call(null, this__9280.shift, this__9280.root);
        this__9280.root = new_root__9286;
        return tcoll
      }
    }else {
      if(n === this__9280.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9280.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__9287 = this;
  if(this__9287.root.edit) {
    if(this__9287.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9287.cnt) {
        this__9287.cnt = 0;
        return tcoll
      }else {
        if((this__9287.cnt - 1 & 31) > 0) {
          this__9287.cnt = this__9287.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9288 = cljs.core.editable_array_for.call(null, tcoll, this__9287.cnt - 2);
            var new_root__9290 = function() {
              var nr__9289 = cljs.core.tv_pop_tail.call(null, tcoll, this__9287.shift, this__9287.root);
              if(!(nr__9289 == null)) {
                return nr__9289
              }else {
                return new cljs.core.VectorNode(this__9287.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____9291 = 5 < this__9287.shift;
              if(and__3822__auto____9291) {
                return cljs.core.pv_aget.call(null, new_root__9290, 1) == null
              }else {
                return and__3822__auto____9291
              }
            }()) {
              var new_root__9292 = cljs.core.tv_ensure_editable.call(null, this__9287.root.edit, cljs.core.pv_aget.call(null, new_root__9290, 0));
              this__9287.root = new_root__9292;
              this__9287.shift = this__9287.shift - 5;
              this__9287.cnt = this__9287.cnt - 1;
              this__9287.tail = new_tail__9288;
              return tcoll
            }else {
              this__9287.root = new_root__9290;
              this__9287.cnt = this__9287.cnt - 1;
              this__9287.tail = new_tail__9288;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9293 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9294 = this;
  if(this__9294.root.edit) {
    if(this__9294.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9294.tail[this__9294.cnt & 31] = o;
      this__9294.cnt = this__9294.cnt + 1;
      return tcoll
    }else {
      var tail_node__9295 = new cljs.core.VectorNode(this__9294.root.edit, this__9294.tail);
      var new_tail__9296 = cljs.core.make_array.call(null, 32);
      new_tail__9296[0] = o;
      this__9294.tail = new_tail__9296;
      if(this__9294.cnt >>> 5 > 1 << this__9294.shift) {
        var new_root_array__9297 = cljs.core.make_array.call(null, 32);
        var new_shift__9298 = this__9294.shift + 5;
        new_root_array__9297[0] = this__9294.root;
        new_root_array__9297[1] = cljs.core.new_path.call(null, this__9294.root.edit, this__9294.shift, tail_node__9295);
        this__9294.root = new cljs.core.VectorNode(this__9294.root.edit, new_root_array__9297);
        this__9294.shift = new_shift__9298;
        this__9294.cnt = this__9294.cnt + 1;
        return tcoll
      }else {
        var new_root__9299 = cljs.core.tv_push_tail.call(null, tcoll, this__9294.shift, this__9294.root, tail_node__9295);
        this__9294.root = new_root__9299;
        this__9294.cnt = this__9294.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9300 = this;
  if(this__9300.root.edit) {
    this__9300.root.edit = null;
    var len__9301 = this__9300.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9302 = cljs.core.make_array.call(null, len__9301);
    cljs.core.array_copy.call(null, this__9300.tail, 0, trimmed_tail__9302, 0, len__9301);
    return new cljs.core.PersistentVector(null, this__9300.cnt, this__9300.shift, this__9300.root, trimmed_tail__9302, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9304 = this;
  var h__2198__auto____9305 = this__9304.__hash;
  if(!(h__2198__auto____9305 == null)) {
    return h__2198__auto____9305
  }else {
    var h__2198__auto____9306 = cljs.core.hash_coll.call(null, coll);
    this__9304.__hash = h__2198__auto____9306;
    return h__2198__auto____9306
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9307 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9308 = this;
  var this__9309 = this;
  return cljs.core.pr_str.call(null, this__9309)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9310 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9311 = this;
  return cljs.core._first.call(null, this__9311.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9312 = this;
  var temp__3971__auto____9313 = cljs.core.next.call(null, this__9312.front);
  if(temp__3971__auto____9313) {
    var f1__9314 = temp__3971__auto____9313;
    return new cljs.core.PersistentQueueSeq(this__9312.meta, f1__9314, this__9312.rear, null)
  }else {
    if(this__9312.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9312.meta, this__9312.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9315 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9316 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9316.front, this__9316.rear, this__9316.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9317 = this;
  return this__9317.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9318 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9318.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9319 = this;
  var h__2198__auto____9320 = this__9319.__hash;
  if(!(h__2198__auto____9320 == null)) {
    return h__2198__auto____9320
  }else {
    var h__2198__auto____9321 = cljs.core.hash_coll.call(null, coll);
    this__9319.__hash = h__2198__auto____9321;
    return h__2198__auto____9321
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9322 = this;
  if(cljs.core.truth_(this__9322.front)) {
    return new cljs.core.PersistentQueue(this__9322.meta, this__9322.count + 1, this__9322.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____9323 = this__9322.rear;
      if(cljs.core.truth_(or__3824__auto____9323)) {
        return or__3824__auto____9323
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9322.meta, this__9322.count + 1, cljs.core.conj.call(null, this__9322.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9324 = this;
  var this__9325 = this;
  return cljs.core.pr_str.call(null, this__9325)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9326 = this;
  var rear__9327 = cljs.core.seq.call(null, this__9326.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____9328 = this__9326.front;
    if(cljs.core.truth_(or__3824__auto____9328)) {
      return or__3824__auto____9328
    }else {
      return rear__9327
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9326.front, cljs.core.seq.call(null, rear__9327), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9329 = this;
  return this__9329.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9330 = this;
  return cljs.core._first.call(null, this__9330.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9331 = this;
  if(cljs.core.truth_(this__9331.front)) {
    var temp__3971__auto____9332 = cljs.core.next.call(null, this__9331.front);
    if(temp__3971__auto____9332) {
      var f1__9333 = temp__3971__auto____9332;
      return new cljs.core.PersistentQueue(this__9331.meta, this__9331.count - 1, f1__9333, this__9331.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9331.meta, this__9331.count - 1, cljs.core.seq.call(null, this__9331.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9334 = this;
  return cljs.core.first.call(null, this__9334.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9335 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9336 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9337 = this;
  return new cljs.core.PersistentQueue(meta, this__9337.count, this__9337.front, this__9337.rear, this__9337.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9338 = this;
  return this__9338.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9339 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9340 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__9343 = array.length;
  var i__9344 = 0;
  while(true) {
    if(i__9344 < len__9343) {
      if(k === array[i__9344]) {
        return i__9344
      }else {
        var G__9345 = i__9344 + incr;
        i__9344 = G__9345;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9348 = cljs.core.hash.call(null, a);
  var b__9349 = cljs.core.hash.call(null, b);
  if(a__9348 < b__9349) {
    return-1
  }else {
    if(a__9348 > b__9349) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__9357 = m.keys;
  var len__9358 = ks__9357.length;
  var so__9359 = m.strobj;
  var out__9360 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9361 = 0;
  var out__9362 = cljs.core.transient$.call(null, out__9360);
  while(true) {
    if(i__9361 < len__9358) {
      var k__9363 = ks__9357[i__9361];
      var G__9364 = i__9361 + 1;
      var G__9365 = cljs.core.assoc_BANG_.call(null, out__9362, k__9363, so__9359[k__9363]);
      i__9361 = G__9364;
      out__9362 = G__9365;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9362, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9371 = {};
  var l__9372 = ks.length;
  var i__9373 = 0;
  while(true) {
    if(i__9373 < l__9372) {
      var k__9374 = ks[i__9373];
      new_obj__9371[k__9374] = obj[k__9374];
      var G__9375 = i__9373 + 1;
      i__9373 = G__9375;
      continue
    }else {
    }
    break
  }
  return new_obj__9371
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9378 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9379 = this;
  var h__2198__auto____9380 = this__9379.__hash;
  if(!(h__2198__auto____9380 == null)) {
    return h__2198__auto____9380
  }else {
    var h__2198__auto____9381 = cljs.core.hash_imap.call(null, coll);
    this__9379.__hash = h__2198__auto____9381;
    return h__2198__auto____9381
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9382 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9383 = this;
  if(function() {
    var and__3822__auto____9384 = goog.isString(k);
    if(and__3822__auto____9384) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9383.keys) == null)
    }else {
      return and__3822__auto____9384
    }
  }()) {
    return this__9383.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9385 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9386 = this__9385.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9386) {
        return or__3824__auto____9386
      }else {
        return this__9385.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9385.keys) == null)) {
        var new_strobj__9387 = cljs.core.obj_clone.call(null, this__9385.strobj, this__9385.keys);
        new_strobj__9387[k] = v;
        return new cljs.core.ObjMap(this__9385.meta, this__9385.keys, new_strobj__9387, this__9385.update_count + 1, null)
      }else {
        var new_strobj__9388 = cljs.core.obj_clone.call(null, this__9385.strobj, this__9385.keys);
        var new_keys__9389 = this__9385.keys.slice();
        new_strobj__9388[k] = v;
        new_keys__9389.push(k);
        return new cljs.core.ObjMap(this__9385.meta, new_keys__9389, new_strobj__9388, this__9385.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9390 = this;
  if(function() {
    var and__3822__auto____9391 = goog.isString(k);
    if(and__3822__auto____9391) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9390.keys) == null)
    }else {
      return and__3822__auto____9391
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9413 = null;
  var G__9413__2 = function(this_sym9392, k) {
    var this__9394 = this;
    var this_sym9392__9395 = this;
    var coll__9396 = this_sym9392__9395;
    return coll__9396.cljs$core$ILookup$_lookup$arity$2(coll__9396, k)
  };
  var G__9413__3 = function(this_sym9393, k, not_found) {
    var this__9394 = this;
    var this_sym9393__9397 = this;
    var coll__9398 = this_sym9393__9397;
    return coll__9398.cljs$core$ILookup$_lookup$arity$3(coll__9398, k, not_found)
  };
  G__9413 = function(this_sym9393, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9413__2.call(this, this_sym9393, k);
      case 3:
        return G__9413__3.call(this, this_sym9393, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9413
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9376, args9377) {
  var this__9399 = this;
  return this_sym9376.call.apply(this_sym9376, [this_sym9376].concat(args9377.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9400 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9401 = this;
  var this__9402 = this;
  return cljs.core.pr_str.call(null, this__9402)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9403 = this;
  if(this__9403.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9366_SHARP_) {
      return cljs.core.vector.call(null, p1__9366_SHARP_, this__9403.strobj[p1__9366_SHARP_])
    }, this__9403.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9404 = this;
  return this__9404.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9405 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9406 = this;
  return new cljs.core.ObjMap(meta, this__9406.keys, this__9406.strobj, this__9406.update_count, this__9406.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9407 = this;
  return this__9407.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9408 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9408.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9409 = this;
  if(function() {
    var and__3822__auto____9410 = goog.isString(k);
    if(and__3822__auto____9410) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9409.keys) == null)
    }else {
      return and__3822__auto____9410
    }
  }()) {
    var new_keys__9411 = this__9409.keys.slice();
    var new_strobj__9412 = cljs.core.obj_clone.call(null, this__9409.strobj, this__9409.keys);
    new_keys__9411.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9411), 1);
    cljs.core.js_delete.call(null, new_strobj__9412, k);
    return new cljs.core.ObjMap(this__9409.meta, new_keys__9411, new_strobj__9412, this__9409.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9417 = this;
  var h__2198__auto____9418 = this__9417.__hash;
  if(!(h__2198__auto____9418 == null)) {
    return h__2198__auto____9418
  }else {
    var h__2198__auto____9419 = cljs.core.hash_imap.call(null, coll);
    this__9417.__hash = h__2198__auto____9419;
    return h__2198__auto____9419
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9420 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9421 = this;
  var bucket__9422 = this__9421.hashobj[cljs.core.hash.call(null, k)];
  var i__9423 = cljs.core.truth_(bucket__9422) ? cljs.core.scan_array.call(null, 2, k, bucket__9422) : null;
  if(cljs.core.truth_(i__9423)) {
    return bucket__9422[i__9423 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9424 = this;
  var h__9425 = cljs.core.hash.call(null, k);
  var bucket__9426 = this__9424.hashobj[h__9425];
  if(cljs.core.truth_(bucket__9426)) {
    var new_bucket__9427 = bucket__9426.slice();
    var new_hashobj__9428 = goog.object.clone(this__9424.hashobj);
    new_hashobj__9428[h__9425] = new_bucket__9427;
    var temp__3971__auto____9429 = cljs.core.scan_array.call(null, 2, k, new_bucket__9427);
    if(cljs.core.truth_(temp__3971__auto____9429)) {
      var i__9430 = temp__3971__auto____9429;
      new_bucket__9427[i__9430 + 1] = v;
      return new cljs.core.HashMap(this__9424.meta, this__9424.count, new_hashobj__9428, null)
    }else {
      new_bucket__9427.push(k, v);
      return new cljs.core.HashMap(this__9424.meta, this__9424.count + 1, new_hashobj__9428, null)
    }
  }else {
    var new_hashobj__9431 = goog.object.clone(this__9424.hashobj);
    new_hashobj__9431[h__9425] = [k, v];
    return new cljs.core.HashMap(this__9424.meta, this__9424.count + 1, new_hashobj__9431, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9432 = this;
  var bucket__9433 = this__9432.hashobj[cljs.core.hash.call(null, k)];
  var i__9434 = cljs.core.truth_(bucket__9433) ? cljs.core.scan_array.call(null, 2, k, bucket__9433) : null;
  if(cljs.core.truth_(i__9434)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9459 = null;
  var G__9459__2 = function(this_sym9435, k) {
    var this__9437 = this;
    var this_sym9435__9438 = this;
    var coll__9439 = this_sym9435__9438;
    return coll__9439.cljs$core$ILookup$_lookup$arity$2(coll__9439, k)
  };
  var G__9459__3 = function(this_sym9436, k, not_found) {
    var this__9437 = this;
    var this_sym9436__9440 = this;
    var coll__9441 = this_sym9436__9440;
    return coll__9441.cljs$core$ILookup$_lookup$arity$3(coll__9441, k, not_found)
  };
  G__9459 = function(this_sym9436, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9459__2.call(this, this_sym9436, k);
      case 3:
        return G__9459__3.call(this, this_sym9436, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9459
}();
cljs.core.HashMap.prototype.apply = function(this_sym9415, args9416) {
  var this__9442 = this;
  return this_sym9415.call.apply(this_sym9415, [this_sym9415].concat(args9416.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9443 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9444 = this;
  var this__9445 = this;
  return cljs.core.pr_str.call(null, this__9445)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9446 = this;
  if(this__9446.count > 0) {
    var hashes__9447 = cljs.core.js_keys.call(null, this__9446.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9414_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9446.hashobj[p1__9414_SHARP_]))
    }, hashes__9447)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9448 = this;
  return this__9448.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9449 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9450 = this;
  return new cljs.core.HashMap(meta, this__9450.count, this__9450.hashobj, this__9450.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9451 = this;
  return this__9451.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9452 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9452.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9453 = this;
  var h__9454 = cljs.core.hash.call(null, k);
  var bucket__9455 = this__9453.hashobj[h__9454];
  var i__9456 = cljs.core.truth_(bucket__9455) ? cljs.core.scan_array.call(null, 2, k, bucket__9455) : null;
  if(cljs.core.not.call(null, i__9456)) {
    return coll
  }else {
    var new_hashobj__9457 = goog.object.clone(this__9453.hashobj);
    if(3 > bucket__9455.length) {
      cljs.core.js_delete.call(null, new_hashobj__9457, h__9454)
    }else {
      var new_bucket__9458 = bucket__9455.slice();
      new_bucket__9458.splice(i__9456, 2);
      new_hashobj__9457[h__9454] = new_bucket__9458
    }
    return new cljs.core.HashMap(this__9453.meta, this__9453.count - 1, new_hashobj__9457, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9460 = ks.length;
  var i__9461 = 0;
  var out__9462 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9461 < len__9460) {
      var G__9463 = i__9461 + 1;
      var G__9464 = cljs.core.assoc.call(null, out__9462, ks[i__9461], vs[i__9461]);
      i__9461 = G__9463;
      out__9462 = G__9464;
      continue
    }else {
      return out__9462
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9468 = m.arr;
  var len__9469 = arr__9468.length;
  var i__9470 = 0;
  while(true) {
    if(len__9469 <= i__9470) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9468[i__9470], k)) {
        return i__9470
      }else {
        if("\ufdd0'else") {
          var G__9471 = i__9470 + 2;
          i__9470 = G__9471;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9474 = this;
  return new cljs.core.TransientArrayMap({}, this__9474.arr.length, this__9474.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9475 = this;
  var h__2198__auto____9476 = this__9475.__hash;
  if(!(h__2198__auto____9476 == null)) {
    return h__2198__auto____9476
  }else {
    var h__2198__auto____9477 = cljs.core.hash_imap.call(null, coll);
    this__9475.__hash = h__2198__auto____9477;
    return h__2198__auto____9477
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9478 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9479 = this;
  var idx__9480 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9480 === -1) {
    return not_found
  }else {
    return this__9479.arr[idx__9480 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9481 = this;
  var idx__9482 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9482 === -1) {
    if(this__9481.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9481.meta, this__9481.cnt + 1, function() {
        var G__9483__9484 = this__9481.arr.slice();
        G__9483__9484.push(k);
        G__9483__9484.push(v);
        return G__9483__9484
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9481.arr[idx__9482 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9481.meta, this__9481.cnt, function() {
          var G__9485__9486 = this__9481.arr.slice();
          G__9485__9486[idx__9482 + 1] = v;
          return G__9485__9486
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9487 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9519 = null;
  var G__9519__2 = function(this_sym9488, k) {
    var this__9490 = this;
    var this_sym9488__9491 = this;
    var coll__9492 = this_sym9488__9491;
    return coll__9492.cljs$core$ILookup$_lookup$arity$2(coll__9492, k)
  };
  var G__9519__3 = function(this_sym9489, k, not_found) {
    var this__9490 = this;
    var this_sym9489__9493 = this;
    var coll__9494 = this_sym9489__9493;
    return coll__9494.cljs$core$ILookup$_lookup$arity$3(coll__9494, k, not_found)
  };
  G__9519 = function(this_sym9489, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9519__2.call(this, this_sym9489, k);
      case 3:
        return G__9519__3.call(this, this_sym9489, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9519
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9472, args9473) {
  var this__9495 = this;
  return this_sym9472.call.apply(this_sym9472, [this_sym9472].concat(args9473.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9496 = this;
  var len__9497 = this__9496.arr.length;
  var i__9498 = 0;
  var init__9499 = init;
  while(true) {
    if(i__9498 < len__9497) {
      var init__9500 = f.call(null, init__9499, this__9496.arr[i__9498], this__9496.arr[i__9498 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9500)) {
        return cljs.core.deref.call(null, init__9500)
      }else {
        var G__9520 = i__9498 + 2;
        var G__9521 = init__9500;
        i__9498 = G__9520;
        init__9499 = G__9521;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9501 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9502 = this;
  var this__9503 = this;
  return cljs.core.pr_str.call(null, this__9503)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9504 = this;
  if(this__9504.cnt > 0) {
    var len__9505 = this__9504.arr.length;
    var array_map_seq__9506 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9505) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9504.arr[i], this__9504.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9506.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9507 = this;
  return this__9507.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9508 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9509 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9509.cnt, this__9509.arr, this__9509.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9510 = this;
  return this__9510.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9511 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9511.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9512 = this;
  var idx__9513 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9513 >= 0) {
    var len__9514 = this__9512.arr.length;
    var new_len__9515 = len__9514 - 2;
    if(new_len__9515 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9516 = cljs.core.make_array.call(null, new_len__9515);
      var s__9517 = 0;
      var d__9518 = 0;
      while(true) {
        if(s__9517 >= len__9514) {
          return new cljs.core.PersistentArrayMap(this__9512.meta, this__9512.cnt - 1, new_arr__9516, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9512.arr[s__9517])) {
            var G__9522 = s__9517 + 2;
            var G__9523 = d__9518;
            s__9517 = G__9522;
            d__9518 = G__9523;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9516[d__9518] = this__9512.arr[s__9517];
              new_arr__9516[d__9518 + 1] = this__9512.arr[s__9517 + 1];
              var G__9524 = s__9517 + 2;
              var G__9525 = d__9518 + 2;
              s__9517 = G__9524;
              d__9518 = G__9525;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9526 = cljs.core.count.call(null, ks);
  var i__9527 = 0;
  var out__9528 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9527 < len__9526) {
      var G__9529 = i__9527 + 1;
      var G__9530 = cljs.core.assoc_BANG_.call(null, out__9528, ks[i__9527], vs[i__9527]);
      i__9527 = G__9529;
      out__9528 = G__9530;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9528)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9531 = this;
  if(cljs.core.truth_(this__9531.editable_QMARK_)) {
    var idx__9532 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9532 >= 0) {
      this__9531.arr[idx__9532] = this__9531.arr[this__9531.len - 2];
      this__9531.arr[idx__9532 + 1] = this__9531.arr[this__9531.len - 1];
      var G__9533__9534 = this__9531.arr;
      G__9533__9534.pop();
      G__9533__9534.pop();
      G__9533__9534;
      this__9531.len = this__9531.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9535 = this;
  if(cljs.core.truth_(this__9535.editable_QMARK_)) {
    var idx__9536 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9536 === -1) {
      if(this__9535.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9535.len = this__9535.len + 2;
        this__9535.arr.push(key);
        this__9535.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9535.len, this__9535.arr), key, val)
      }
    }else {
      if(val === this__9535.arr[idx__9536 + 1]) {
        return tcoll
      }else {
        this__9535.arr[idx__9536 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9537 = this;
  if(cljs.core.truth_(this__9537.editable_QMARK_)) {
    if(function() {
      var G__9538__9539 = o;
      if(G__9538__9539) {
        if(function() {
          var or__3824__auto____9540 = G__9538__9539.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9540) {
            return or__3824__auto____9540
          }else {
            return G__9538__9539.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9538__9539.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9538__9539)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9538__9539)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9541 = cljs.core.seq.call(null, o);
      var tcoll__9542 = tcoll;
      while(true) {
        var temp__3971__auto____9543 = cljs.core.first.call(null, es__9541);
        if(cljs.core.truth_(temp__3971__auto____9543)) {
          var e__9544 = temp__3971__auto____9543;
          var G__9550 = cljs.core.next.call(null, es__9541);
          var G__9551 = tcoll__9542.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9542, cljs.core.key.call(null, e__9544), cljs.core.val.call(null, e__9544));
          es__9541 = G__9550;
          tcoll__9542 = G__9551;
          continue
        }else {
          return tcoll__9542
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9545 = this;
  if(cljs.core.truth_(this__9545.editable_QMARK_)) {
    this__9545.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9545.len, 2), this__9545.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9546 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9547 = this;
  if(cljs.core.truth_(this__9547.editable_QMARK_)) {
    var idx__9548 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9548 === -1) {
      return not_found
    }else {
      return this__9547.arr[idx__9548 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9549 = this;
  if(cljs.core.truth_(this__9549.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9549.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9554 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9555 = 0;
  while(true) {
    if(i__9555 < len) {
      var G__9556 = cljs.core.assoc_BANG_.call(null, out__9554, arr[i__9555], arr[i__9555 + 1]);
      var G__9557 = i__9555 + 2;
      out__9554 = G__9556;
      i__9555 = G__9557;
      continue
    }else {
      return out__9554
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2316__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9562__9563 = arr.slice();
    G__9562__9563[i] = a;
    return G__9562__9563
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9564__9565 = arr.slice();
    G__9564__9565[i] = a;
    G__9564__9565[j] = b;
    return G__9564__9565
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9567 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9567, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9567, 2 * i, new_arr__9567.length - 2 * i);
  return new_arr__9567
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9570 = inode.ensure_editable(edit);
    editable__9570.arr[i] = a;
    return editable__9570
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9571 = inode.ensure_editable(edit);
    editable__9571.arr[i] = a;
    editable__9571.arr[j] = b;
    return editable__9571
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9578 = arr.length;
  var i__9579 = 0;
  var init__9580 = init;
  while(true) {
    if(i__9579 < len__9578) {
      var init__9583 = function() {
        var k__9581 = arr[i__9579];
        if(!(k__9581 == null)) {
          return f.call(null, init__9580, k__9581, arr[i__9579 + 1])
        }else {
          var node__9582 = arr[i__9579 + 1];
          if(!(node__9582 == null)) {
            return node__9582.kv_reduce(f, init__9580)
          }else {
            return init__9580
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9583)) {
        return cljs.core.deref.call(null, init__9583)
      }else {
        var G__9584 = i__9579 + 2;
        var G__9585 = init__9583;
        i__9579 = G__9584;
        init__9580 = G__9585;
        continue
      }
    }else {
      return init__9580
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9586 = this;
  var inode__9587 = this;
  if(this__9586.bitmap === bit) {
    return null
  }else {
    var editable__9588 = inode__9587.ensure_editable(e);
    var earr__9589 = editable__9588.arr;
    var len__9590 = earr__9589.length;
    editable__9588.bitmap = bit ^ editable__9588.bitmap;
    cljs.core.array_copy.call(null, earr__9589, 2 * (i + 1), earr__9589, 2 * i, len__9590 - 2 * (i + 1));
    earr__9589[len__9590 - 2] = null;
    earr__9589[len__9590 - 1] = null;
    return editable__9588
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9591 = this;
  var inode__9592 = this;
  var bit__9593 = 1 << (hash >>> shift & 31);
  var idx__9594 = cljs.core.bitmap_indexed_node_index.call(null, this__9591.bitmap, bit__9593);
  if((this__9591.bitmap & bit__9593) === 0) {
    var n__9595 = cljs.core.bit_count.call(null, this__9591.bitmap);
    if(2 * n__9595 < this__9591.arr.length) {
      var editable__9596 = inode__9592.ensure_editable(edit);
      var earr__9597 = editable__9596.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9597, 2 * idx__9594, earr__9597, 2 * (idx__9594 + 1), 2 * (n__9595 - idx__9594));
      earr__9597[2 * idx__9594] = key;
      earr__9597[2 * idx__9594 + 1] = val;
      editable__9596.bitmap = editable__9596.bitmap | bit__9593;
      return editable__9596
    }else {
      if(n__9595 >= 16) {
        var nodes__9598 = cljs.core.make_array.call(null, 32);
        var jdx__9599 = hash >>> shift & 31;
        nodes__9598[jdx__9599] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9600 = 0;
        var j__9601 = 0;
        while(true) {
          if(i__9600 < 32) {
            if((this__9591.bitmap >>> i__9600 & 1) === 0) {
              var G__9654 = i__9600 + 1;
              var G__9655 = j__9601;
              i__9600 = G__9654;
              j__9601 = G__9655;
              continue
            }else {
              nodes__9598[i__9600] = !(this__9591.arr[j__9601] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9591.arr[j__9601]), this__9591.arr[j__9601], this__9591.arr[j__9601 + 1], added_leaf_QMARK_) : this__9591.arr[j__9601 + 1];
              var G__9656 = i__9600 + 1;
              var G__9657 = j__9601 + 2;
              i__9600 = G__9656;
              j__9601 = G__9657;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9595 + 1, nodes__9598)
      }else {
        if("\ufdd0'else") {
          var new_arr__9602 = cljs.core.make_array.call(null, 2 * (n__9595 + 4));
          cljs.core.array_copy.call(null, this__9591.arr, 0, new_arr__9602, 0, 2 * idx__9594);
          new_arr__9602[2 * idx__9594] = key;
          new_arr__9602[2 * idx__9594 + 1] = val;
          cljs.core.array_copy.call(null, this__9591.arr, 2 * idx__9594, new_arr__9602, 2 * (idx__9594 + 1), 2 * (n__9595 - idx__9594));
          added_leaf_QMARK_.val = true;
          var editable__9603 = inode__9592.ensure_editable(edit);
          editable__9603.arr = new_arr__9602;
          editable__9603.bitmap = editable__9603.bitmap | bit__9593;
          return editable__9603
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9604 = this__9591.arr[2 * idx__9594];
    var val_or_node__9605 = this__9591.arr[2 * idx__9594 + 1];
    if(key_or_nil__9604 == null) {
      var n__9606 = val_or_node__9605.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9606 === val_or_node__9605) {
        return inode__9592
      }else {
        return cljs.core.edit_and_set.call(null, inode__9592, edit, 2 * idx__9594 + 1, n__9606)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9604)) {
        if(val === val_or_node__9605) {
          return inode__9592
        }else {
          return cljs.core.edit_and_set.call(null, inode__9592, edit, 2 * idx__9594 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9592, edit, 2 * idx__9594, null, 2 * idx__9594 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9604, val_or_node__9605, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9607 = this;
  var inode__9608 = this;
  return cljs.core.create_inode_seq.call(null, this__9607.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9609 = this;
  var inode__9610 = this;
  var bit__9611 = 1 << (hash >>> shift & 31);
  if((this__9609.bitmap & bit__9611) === 0) {
    return inode__9610
  }else {
    var idx__9612 = cljs.core.bitmap_indexed_node_index.call(null, this__9609.bitmap, bit__9611);
    var key_or_nil__9613 = this__9609.arr[2 * idx__9612];
    var val_or_node__9614 = this__9609.arr[2 * idx__9612 + 1];
    if(key_or_nil__9613 == null) {
      var n__9615 = val_or_node__9614.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9615 === val_or_node__9614) {
        return inode__9610
      }else {
        if(!(n__9615 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9610, edit, 2 * idx__9612 + 1, n__9615)
        }else {
          if(this__9609.bitmap === bit__9611) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9610.edit_and_remove_pair(edit, bit__9611, idx__9612)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9613)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9610.edit_and_remove_pair(edit, bit__9611, idx__9612)
      }else {
        if("\ufdd0'else") {
          return inode__9610
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9616 = this;
  var inode__9617 = this;
  if(e === this__9616.edit) {
    return inode__9617
  }else {
    var n__9618 = cljs.core.bit_count.call(null, this__9616.bitmap);
    var new_arr__9619 = cljs.core.make_array.call(null, n__9618 < 0 ? 4 : 2 * (n__9618 + 1));
    cljs.core.array_copy.call(null, this__9616.arr, 0, new_arr__9619, 0, 2 * n__9618);
    return new cljs.core.BitmapIndexedNode(e, this__9616.bitmap, new_arr__9619)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9620 = this;
  var inode__9621 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9620.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9622 = this;
  var inode__9623 = this;
  var bit__9624 = 1 << (hash >>> shift & 31);
  if((this__9622.bitmap & bit__9624) === 0) {
    return not_found
  }else {
    var idx__9625 = cljs.core.bitmap_indexed_node_index.call(null, this__9622.bitmap, bit__9624);
    var key_or_nil__9626 = this__9622.arr[2 * idx__9625];
    var val_or_node__9627 = this__9622.arr[2 * idx__9625 + 1];
    if(key_or_nil__9626 == null) {
      return val_or_node__9627.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9626)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9626, val_or_node__9627], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9628 = this;
  var inode__9629 = this;
  var bit__9630 = 1 << (hash >>> shift & 31);
  if((this__9628.bitmap & bit__9630) === 0) {
    return inode__9629
  }else {
    var idx__9631 = cljs.core.bitmap_indexed_node_index.call(null, this__9628.bitmap, bit__9630);
    var key_or_nil__9632 = this__9628.arr[2 * idx__9631];
    var val_or_node__9633 = this__9628.arr[2 * idx__9631 + 1];
    if(key_or_nil__9632 == null) {
      var n__9634 = val_or_node__9633.inode_without(shift + 5, hash, key);
      if(n__9634 === val_or_node__9633) {
        return inode__9629
      }else {
        if(!(n__9634 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9628.bitmap, cljs.core.clone_and_set.call(null, this__9628.arr, 2 * idx__9631 + 1, n__9634))
        }else {
          if(this__9628.bitmap === bit__9630) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9628.bitmap ^ bit__9630, cljs.core.remove_pair.call(null, this__9628.arr, idx__9631))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9632)) {
        return new cljs.core.BitmapIndexedNode(null, this__9628.bitmap ^ bit__9630, cljs.core.remove_pair.call(null, this__9628.arr, idx__9631))
      }else {
        if("\ufdd0'else") {
          return inode__9629
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9635 = this;
  var inode__9636 = this;
  var bit__9637 = 1 << (hash >>> shift & 31);
  var idx__9638 = cljs.core.bitmap_indexed_node_index.call(null, this__9635.bitmap, bit__9637);
  if((this__9635.bitmap & bit__9637) === 0) {
    var n__9639 = cljs.core.bit_count.call(null, this__9635.bitmap);
    if(n__9639 >= 16) {
      var nodes__9640 = cljs.core.make_array.call(null, 32);
      var jdx__9641 = hash >>> shift & 31;
      nodes__9640[jdx__9641] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9642 = 0;
      var j__9643 = 0;
      while(true) {
        if(i__9642 < 32) {
          if((this__9635.bitmap >>> i__9642 & 1) === 0) {
            var G__9658 = i__9642 + 1;
            var G__9659 = j__9643;
            i__9642 = G__9658;
            j__9643 = G__9659;
            continue
          }else {
            nodes__9640[i__9642] = !(this__9635.arr[j__9643] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9635.arr[j__9643]), this__9635.arr[j__9643], this__9635.arr[j__9643 + 1], added_leaf_QMARK_) : this__9635.arr[j__9643 + 1];
            var G__9660 = i__9642 + 1;
            var G__9661 = j__9643 + 2;
            i__9642 = G__9660;
            j__9643 = G__9661;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9639 + 1, nodes__9640)
    }else {
      var new_arr__9644 = cljs.core.make_array.call(null, 2 * (n__9639 + 1));
      cljs.core.array_copy.call(null, this__9635.arr, 0, new_arr__9644, 0, 2 * idx__9638);
      new_arr__9644[2 * idx__9638] = key;
      new_arr__9644[2 * idx__9638 + 1] = val;
      cljs.core.array_copy.call(null, this__9635.arr, 2 * idx__9638, new_arr__9644, 2 * (idx__9638 + 1), 2 * (n__9639 - idx__9638));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9635.bitmap | bit__9637, new_arr__9644)
    }
  }else {
    var key_or_nil__9645 = this__9635.arr[2 * idx__9638];
    var val_or_node__9646 = this__9635.arr[2 * idx__9638 + 1];
    if(key_or_nil__9645 == null) {
      var n__9647 = val_or_node__9646.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9647 === val_or_node__9646) {
        return inode__9636
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9635.bitmap, cljs.core.clone_and_set.call(null, this__9635.arr, 2 * idx__9638 + 1, n__9647))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9645)) {
        if(val === val_or_node__9646) {
          return inode__9636
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9635.bitmap, cljs.core.clone_and_set.call(null, this__9635.arr, 2 * idx__9638 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9635.bitmap, cljs.core.clone_and_set.call(null, this__9635.arr, 2 * idx__9638, null, 2 * idx__9638 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9645, val_or_node__9646, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9648 = this;
  var inode__9649 = this;
  var bit__9650 = 1 << (hash >>> shift & 31);
  if((this__9648.bitmap & bit__9650) === 0) {
    return not_found
  }else {
    var idx__9651 = cljs.core.bitmap_indexed_node_index.call(null, this__9648.bitmap, bit__9650);
    var key_or_nil__9652 = this__9648.arr[2 * idx__9651];
    var val_or_node__9653 = this__9648.arr[2 * idx__9651 + 1];
    if(key_or_nil__9652 == null) {
      return val_or_node__9653.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9652)) {
        return val_or_node__9653
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9669 = array_node.arr;
  var len__9670 = 2 * (array_node.cnt - 1);
  var new_arr__9671 = cljs.core.make_array.call(null, len__9670);
  var i__9672 = 0;
  var j__9673 = 1;
  var bitmap__9674 = 0;
  while(true) {
    if(i__9672 < len__9670) {
      if(function() {
        var and__3822__auto____9675 = !(i__9672 === idx);
        if(and__3822__auto____9675) {
          return!(arr__9669[i__9672] == null)
        }else {
          return and__3822__auto____9675
        }
      }()) {
        new_arr__9671[j__9673] = arr__9669[i__9672];
        var G__9676 = i__9672 + 1;
        var G__9677 = j__9673 + 2;
        var G__9678 = bitmap__9674 | 1 << i__9672;
        i__9672 = G__9676;
        j__9673 = G__9677;
        bitmap__9674 = G__9678;
        continue
      }else {
        var G__9679 = i__9672 + 1;
        var G__9680 = j__9673;
        var G__9681 = bitmap__9674;
        i__9672 = G__9679;
        j__9673 = G__9680;
        bitmap__9674 = G__9681;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9674, new_arr__9671)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9682 = this;
  var inode__9683 = this;
  var idx__9684 = hash >>> shift & 31;
  var node__9685 = this__9682.arr[idx__9684];
  if(node__9685 == null) {
    var editable__9686 = cljs.core.edit_and_set.call(null, inode__9683, edit, idx__9684, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9686.cnt = editable__9686.cnt + 1;
    return editable__9686
  }else {
    var n__9687 = node__9685.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9687 === node__9685) {
      return inode__9683
    }else {
      return cljs.core.edit_and_set.call(null, inode__9683, edit, idx__9684, n__9687)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9688 = this;
  var inode__9689 = this;
  return cljs.core.create_array_node_seq.call(null, this__9688.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9690 = this;
  var inode__9691 = this;
  var idx__9692 = hash >>> shift & 31;
  var node__9693 = this__9690.arr[idx__9692];
  if(node__9693 == null) {
    return inode__9691
  }else {
    var n__9694 = node__9693.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9694 === node__9693) {
      return inode__9691
    }else {
      if(n__9694 == null) {
        if(this__9690.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9691, edit, idx__9692)
        }else {
          var editable__9695 = cljs.core.edit_and_set.call(null, inode__9691, edit, idx__9692, n__9694);
          editable__9695.cnt = editable__9695.cnt - 1;
          return editable__9695
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9691, edit, idx__9692, n__9694)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9696 = this;
  var inode__9697 = this;
  if(e === this__9696.edit) {
    return inode__9697
  }else {
    return new cljs.core.ArrayNode(e, this__9696.cnt, this__9696.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9698 = this;
  var inode__9699 = this;
  var len__9700 = this__9698.arr.length;
  var i__9701 = 0;
  var init__9702 = init;
  while(true) {
    if(i__9701 < len__9700) {
      var node__9703 = this__9698.arr[i__9701];
      if(!(node__9703 == null)) {
        var init__9704 = node__9703.kv_reduce(f, init__9702);
        if(cljs.core.reduced_QMARK_.call(null, init__9704)) {
          return cljs.core.deref.call(null, init__9704)
        }else {
          var G__9723 = i__9701 + 1;
          var G__9724 = init__9704;
          i__9701 = G__9723;
          init__9702 = G__9724;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9702
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9705 = this;
  var inode__9706 = this;
  var idx__9707 = hash >>> shift & 31;
  var node__9708 = this__9705.arr[idx__9707];
  if(!(node__9708 == null)) {
    return node__9708.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9709 = this;
  var inode__9710 = this;
  var idx__9711 = hash >>> shift & 31;
  var node__9712 = this__9709.arr[idx__9711];
  if(!(node__9712 == null)) {
    var n__9713 = node__9712.inode_without(shift + 5, hash, key);
    if(n__9713 === node__9712) {
      return inode__9710
    }else {
      if(n__9713 == null) {
        if(this__9709.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9710, null, idx__9711)
        }else {
          return new cljs.core.ArrayNode(null, this__9709.cnt - 1, cljs.core.clone_and_set.call(null, this__9709.arr, idx__9711, n__9713))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9709.cnt, cljs.core.clone_and_set.call(null, this__9709.arr, idx__9711, n__9713))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9710
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9714 = this;
  var inode__9715 = this;
  var idx__9716 = hash >>> shift & 31;
  var node__9717 = this__9714.arr[idx__9716];
  if(node__9717 == null) {
    return new cljs.core.ArrayNode(null, this__9714.cnt + 1, cljs.core.clone_and_set.call(null, this__9714.arr, idx__9716, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9718 = node__9717.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9718 === node__9717) {
      return inode__9715
    }else {
      return new cljs.core.ArrayNode(null, this__9714.cnt, cljs.core.clone_and_set.call(null, this__9714.arr, idx__9716, n__9718))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9719 = this;
  var inode__9720 = this;
  var idx__9721 = hash >>> shift & 31;
  var node__9722 = this__9719.arr[idx__9721];
  if(!(node__9722 == null)) {
    return node__9722.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9727 = 2 * cnt;
  var i__9728 = 0;
  while(true) {
    if(i__9728 < lim__9727) {
      if(cljs.core.key_test.call(null, key, arr[i__9728])) {
        return i__9728
      }else {
        var G__9729 = i__9728 + 2;
        i__9728 = G__9729;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9730 = this;
  var inode__9731 = this;
  if(hash === this__9730.collision_hash) {
    var idx__9732 = cljs.core.hash_collision_node_find_index.call(null, this__9730.arr, this__9730.cnt, key);
    if(idx__9732 === -1) {
      if(this__9730.arr.length > 2 * this__9730.cnt) {
        var editable__9733 = cljs.core.edit_and_set.call(null, inode__9731, edit, 2 * this__9730.cnt, key, 2 * this__9730.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9733.cnt = editable__9733.cnt + 1;
        return editable__9733
      }else {
        var len__9734 = this__9730.arr.length;
        var new_arr__9735 = cljs.core.make_array.call(null, len__9734 + 2);
        cljs.core.array_copy.call(null, this__9730.arr, 0, new_arr__9735, 0, len__9734);
        new_arr__9735[len__9734] = key;
        new_arr__9735[len__9734 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9731.ensure_editable_array(edit, this__9730.cnt + 1, new_arr__9735)
      }
    }else {
      if(this__9730.arr[idx__9732 + 1] === val) {
        return inode__9731
      }else {
        return cljs.core.edit_and_set.call(null, inode__9731, edit, idx__9732 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9730.collision_hash >>> shift & 31), [null, inode__9731, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9736 = this;
  var inode__9737 = this;
  return cljs.core.create_inode_seq.call(null, this__9736.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9738 = this;
  var inode__9739 = this;
  var idx__9740 = cljs.core.hash_collision_node_find_index.call(null, this__9738.arr, this__9738.cnt, key);
  if(idx__9740 === -1) {
    return inode__9739
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9738.cnt === 1) {
      return null
    }else {
      var editable__9741 = inode__9739.ensure_editable(edit);
      var earr__9742 = editable__9741.arr;
      earr__9742[idx__9740] = earr__9742[2 * this__9738.cnt - 2];
      earr__9742[idx__9740 + 1] = earr__9742[2 * this__9738.cnt - 1];
      earr__9742[2 * this__9738.cnt - 1] = null;
      earr__9742[2 * this__9738.cnt - 2] = null;
      editable__9741.cnt = editable__9741.cnt - 1;
      return editable__9741
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9743 = this;
  var inode__9744 = this;
  if(e === this__9743.edit) {
    return inode__9744
  }else {
    var new_arr__9745 = cljs.core.make_array.call(null, 2 * (this__9743.cnt + 1));
    cljs.core.array_copy.call(null, this__9743.arr, 0, new_arr__9745, 0, 2 * this__9743.cnt);
    return new cljs.core.HashCollisionNode(e, this__9743.collision_hash, this__9743.cnt, new_arr__9745)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9746 = this;
  var inode__9747 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9746.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9748 = this;
  var inode__9749 = this;
  var idx__9750 = cljs.core.hash_collision_node_find_index.call(null, this__9748.arr, this__9748.cnt, key);
  if(idx__9750 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9748.arr[idx__9750])) {
      return cljs.core.PersistentVector.fromArray([this__9748.arr[idx__9750], this__9748.arr[idx__9750 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9751 = this;
  var inode__9752 = this;
  var idx__9753 = cljs.core.hash_collision_node_find_index.call(null, this__9751.arr, this__9751.cnt, key);
  if(idx__9753 === -1) {
    return inode__9752
  }else {
    if(this__9751.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9751.collision_hash, this__9751.cnt - 1, cljs.core.remove_pair.call(null, this__9751.arr, cljs.core.quot.call(null, idx__9753, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9754 = this;
  var inode__9755 = this;
  if(hash === this__9754.collision_hash) {
    var idx__9756 = cljs.core.hash_collision_node_find_index.call(null, this__9754.arr, this__9754.cnt, key);
    if(idx__9756 === -1) {
      var len__9757 = this__9754.arr.length;
      var new_arr__9758 = cljs.core.make_array.call(null, len__9757 + 2);
      cljs.core.array_copy.call(null, this__9754.arr, 0, new_arr__9758, 0, len__9757);
      new_arr__9758[len__9757] = key;
      new_arr__9758[len__9757 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9754.collision_hash, this__9754.cnt + 1, new_arr__9758)
    }else {
      if(cljs.core._EQ_.call(null, this__9754.arr[idx__9756], val)) {
        return inode__9755
      }else {
        return new cljs.core.HashCollisionNode(null, this__9754.collision_hash, this__9754.cnt, cljs.core.clone_and_set.call(null, this__9754.arr, idx__9756 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9754.collision_hash >>> shift & 31), [null, inode__9755])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9759 = this;
  var inode__9760 = this;
  var idx__9761 = cljs.core.hash_collision_node_find_index.call(null, this__9759.arr, this__9759.cnt, key);
  if(idx__9761 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9759.arr[idx__9761])) {
      return this__9759.arr[idx__9761 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9762 = this;
  var inode__9763 = this;
  if(e === this__9762.edit) {
    this__9762.arr = array;
    this__9762.cnt = count;
    return inode__9763
  }else {
    return new cljs.core.HashCollisionNode(this__9762.edit, this__9762.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9768 = cljs.core.hash.call(null, key1);
    if(key1hash__9768 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9768, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9769 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9768, key1, val1, added_leaf_QMARK___9769).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9769)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9770 = cljs.core.hash.call(null, key1);
    if(key1hash__9770 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9770, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9771 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9770, key1, val1, added_leaf_QMARK___9771).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9771)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9772 = this;
  var h__2198__auto____9773 = this__9772.__hash;
  if(!(h__2198__auto____9773 == null)) {
    return h__2198__auto____9773
  }else {
    var h__2198__auto____9774 = cljs.core.hash_coll.call(null, coll);
    this__9772.__hash = h__2198__auto____9774;
    return h__2198__auto____9774
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9775 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9776 = this;
  var this__9777 = this;
  return cljs.core.pr_str.call(null, this__9777)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9778 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9779 = this;
  if(this__9779.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9779.nodes[this__9779.i], this__9779.nodes[this__9779.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9779.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9780 = this;
  if(this__9780.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9780.nodes, this__9780.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9780.nodes, this__9780.i, cljs.core.next.call(null, this__9780.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9781 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9782 = this;
  return new cljs.core.NodeSeq(meta, this__9782.nodes, this__9782.i, this__9782.s, this__9782.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9783 = this;
  return this__9783.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9784 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9784.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9791 = nodes.length;
      var j__9792 = i;
      while(true) {
        if(j__9792 < len__9791) {
          if(!(nodes[j__9792] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9792, null, null)
          }else {
            var temp__3971__auto____9793 = nodes[j__9792 + 1];
            if(cljs.core.truth_(temp__3971__auto____9793)) {
              var node__9794 = temp__3971__auto____9793;
              var temp__3971__auto____9795 = node__9794.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9795)) {
                var node_seq__9796 = temp__3971__auto____9795;
                return new cljs.core.NodeSeq(null, nodes, j__9792 + 2, node_seq__9796, null)
              }else {
                var G__9797 = j__9792 + 2;
                j__9792 = G__9797;
                continue
              }
            }else {
              var G__9798 = j__9792 + 2;
              j__9792 = G__9798;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9799 = this;
  var h__2198__auto____9800 = this__9799.__hash;
  if(!(h__2198__auto____9800 == null)) {
    return h__2198__auto____9800
  }else {
    var h__2198__auto____9801 = cljs.core.hash_coll.call(null, coll);
    this__9799.__hash = h__2198__auto____9801;
    return h__2198__auto____9801
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9802 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9803 = this;
  var this__9804 = this;
  return cljs.core.pr_str.call(null, this__9804)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9805 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9806 = this;
  return cljs.core.first.call(null, this__9806.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9807 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9807.nodes, this__9807.i, cljs.core.next.call(null, this__9807.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9808 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9809 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9809.nodes, this__9809.i, this__9809.s, this__9809.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9810 = this;
  return this__9810.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9811 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9811.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9818 = nodes.length;
      var j__9819 = i;
      while(true) {
        if(j__9819 < len__9818) {
          var temp__3971__auto____9820 = nodes[j__9819];
          if(cljs.core.truth_(temp__3971__auto____9820)) {
            var nj__9821 = temp__3971__auto____9820;
            var temp__3971__auto____9822 = nj__9821.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9822)) {
              var ns__9823 = temp__3971__auto____9822;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9819 + 1, ns__9823, null)
            }else {
              var G__9824 = j__9819 + 1;
              j__9819 = G__9824;
              continue
            }
          }else {
            var G__9825 = j__9819 + 1;
            j__9819 = G__9825;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9828 = this;
  return new cljs.core.TransientHashMap({}, this__9828.root, this__9828.cnt, this__9828.has_nil_QMARK_, this__9828.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9829 = this;
  var h__2198__auto____9830 = this__9829.__hash;
  if(!(h__2198__auto____9830 == null)) {
    return h__2198__auto____9830
  }else {
    var h__2198__auto____9831 = cljs.core.hash_imap.call(null, coll);
    this__9829.__hash = h__2198__auto____9831;
    return h__2198__auto____9831
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9832 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9833 = this;
  if(k == null) {
    if(this__9833.has_nil_QMARK_) {
      return this__9833.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9833.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9833.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9834 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9835 = this__9834.has_nil_QMARK_;
      if(and__3822__auto____9835) {
        return v === this__9834.nil_val
      }else {
        return and__3822__auto____9835
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9834.meta, this__9834.has_nil_QMARK_ ? this__9834.cnt : this__9834.cnt + 1, this__9834.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9836 = new cljs.core.Box(false);
    var new_root__9837 = (this__9834.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9834.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9836);
    if(new_root__9837 === this__9834.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9834.meta, added_leaf_QMARK___9836.val ? this__9834.cnt + 1 : this__9834.cnt, new_root__9837, this__9834.has_nil_QMARK_, this__9834.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9838 = this;
  if(k == null) {
    return this__9838.has_nil_QMARK_
  }else {
    if(this__9838.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9838.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9861 = null;
  var G__9861__2 = function(this_sym9839, k) {
    var this__9841 = this;
    var this_sym9839__9842 = this;
    var coll__9843 = this_sym9839__9842;
    return coll__9843.cljs$core$ILookup$_lookup$arity$2(coll__9843, k)
  };
  var G__9861__3 = function(this_sym9840, k, not_found) {
    var this__9841 = this;
    var this_sym9840__9844 = this;
    var coll__9845 = this_sym9840__9844;
    return coll__9845.cljs$core$ILookup$_lookup$arity$3(coll__9845, k, not_found)
  };
  G__9861 = function(this_sym9840, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9861__2.call(this, this_sym9840, k);
      case 3:
        return G__9861__3.call(this, this_sym9840, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9861
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9826, args9827) {
  var this__9846 = this;
  return this_sym9826.call.apply(this_sym9826, [this_sym9826].concat(args9827.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9847 = this;
  var init__9848 = this__9847.has_nil_QMARK_ ? f.call(null, init, null, this__9847.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9848)) {
    return cljs.core.deref.call(null, init__9848)
  }else {
    if(!(this__9847.root == null)) {
      return this__9847.root.kv_reduce(f, init__9848)
    }else {
      if("\ufdd0'else") {
        return init__9848
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9849 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9850 = this;
  var this__9851 = this;
  return cljs.core.pr_str.call(null, this__9851)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9852 = this;
  if(this__9852.cnt > 0) {
    var s__9853 = !(this__9852.root == null) ? this__9852.root.inode_seq() : null;
    if(this__9852.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9852.nil_val], true), s__9853)
    }else {
      return s__9853
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9854 = this;
  return this__9854.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9855 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9856 = this;
  return new cljs.core.PersistentHashMap(meta, this__9856.cnt, this__9856.root, this__9856.has_nil_QMARK_, this__9856.nil_val, this__9856.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9857 = this;
  return this__9857.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9858 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9858.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9859 = this;
  if(k == null) {
    if(this__9859.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9859.meta, this__9859.cnt - 1, this__9859.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9859.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9860 = this__9859.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9860 === this__9859.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9859.meta, this__9859.cnt - 1, new_root__9860, this__9859.has_nil_QMARK_, this__9859.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9862 = ks.length;
  var i__9863 = 0;
  var out__9864 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9863 < len__9862) {
      var G__9865 = i__9863 + 1;
      var G__9866 = cljs.core.assoc_BANG_.call(null, out__9864, ks[i__9863], vs[i__9863]);
      i__9863 = G__9865;
      out__9864 = G__9866;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9864)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9867 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9868 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9869 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9870 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9871 = this;
  if(k == null) {
    if(this__9871.has_nil_QMARK_) {
      return this__9871.nil_val
    }else {
      return null
    }
  }else {
    if(this__9871.root == null) {
      return null
    }else {
      return this__9871.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9872 = this;
  if(k == null) {
    if(this__9872.has_nil_QMARK_) {
      return this__9872.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9872.root == null) {
      return not_found
    }else {
      return this__9872.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9873 = this;
  if(this__9873.edit) {
    return this__9873.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9874 = this;
  var tcoll__9875 = this;
  if(this__9874.edit) {
    if(function() {
      var G__9876__9877 = o;
      if(G__9876__9877) {
        if(function() {
          var or__3824__auto____9878 = G__9876__9877.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9878) {
            return or__3824__auto____9878
          }else {
            return G__9876__9877.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9876__9877.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9876__9877)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9876__9877)
      }
    }()) {
      return tcoll__9875.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9879 = cljs.core.seq.call(null, o);
      var tcoll__9880 = tcoll__9875;
      while(true) {
        var temp__3971__auto____9881 = cljs.core.first.call(null, es__9879);
        if(cljs.core.truth_(temp__3971__auto____9881)) {
          var e__9882 = temp__3971__auto____9881;
          var G__9893 = cljs.core.next.call(null, es__9879);
          var G__9894 = tcoll__9880.assoc_BANG_(cljs.core.key.call(null, e__9882), cljs.core.val.call(null, e__9882));
          es__9879 = G__9893;
          tcoll__9880 = G__9894;
          continue
        }else {
          return tcoll__9880
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9883 = this;
  var tcoll__9884 = this;
  if(this__9883.edit) {
    if(k == null) {
      if(this__9883.nil_val === v) {
      }else {
        this__9883.nil_val = v
      }
      if(this__9883.has_nil_QMARK_) {
      }else {
        this__9883.count = this__9883.count + 1;
        this__9883.has_nil_QMARK_ = true
      }
      return tcoll__9884
    }else {
      var added_leaf_QMARK___9885 = new cljs.core.Box(false);
      var node__9886 = (this__9883.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9883.root).inode_assoc_BANG_(this__9883.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9885);
      if(node__9886 === this__9883.root) {
      }else {
        this__9883.root = node__9886
      }
      if(added_leaf_QMARK___9885.val) {
        this__9883.count = this__9883.count + 1
      }else {
      }
      return tcoll__9884
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9887 = this;
  var tcoll__9888 = this;
  if(this__9887.edit) {
    if(k == null) {
      if(this__9887.has_nil_QMARK_) {
        this__9887.has_nil_QMARK_ = false;
        this__9887.nil_val = null;
        this__9887.count = this__9887.count - 1;
        return tcoll__9888
      }else {
        return tcoll__9888
      }
    }else {
      if(this__9887.root == null) {
        return tcoll__9888
      }else {
        var removed_leaf_QMARK___9889 = new cljs.core.Box(false);
        var node__9890 = this__9887.root.inode_without_BANG_(this__9887.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9889);
        if(node__9890 === this__9887.root) {
        }else {
          this__9887.root = node__9890
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9889[0])) {
          this__9887.count = this__9887.count - 1
        }else {
        }
        return tcoll__9888
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9891 = this;
  var tcoll__9892 = this;
  if(this__9891.edit) {
    this__9891.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9891.count, this__9891.root, this__9891.has_nil_QMARK_, this__9891.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9897 = node;
  var stack__9898 = stack;
  while(true) {
    if(!(t__9897 == null)) {
      var G__9899 = ascending_QMARK_ ? t__9897.left : t__9897.right;
      var G__9900 = cljs.core.conj.call(null, stack__9898, t__9897);
      t__9897 = G__9899;
      stack__9898 = G__9900;
      continue
    }else {
      return stack__9898
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9901 = this;
  var h__2198__auto____9902 = this__9901.__hash;
  if(!(h__2198__auto____9902 == null)) {
    return h__2198__auto____9902
  }else {
    var h__2198__auto____9903 = cljs.core.hash_coll.call(null, coll);
    this__9901.__hash = h__2198__auto____9903;
    return h__2198__auto____9903
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9904 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9905 = this;
  var this__9906 = this;
  return cljs.core.pr_str.call(null, this__9906)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9907 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9908 = this;
  if(this__9908.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9908.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9909 = this;
  return cljs.core.peek.call(null, this__9909.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9910 = this;
  var t__9911 = cljs.core.first.call(null, this__9910.stack);
  var next_stack__9912 = cljs.core.tree_map_seq_push.call(null, this__9910.ascending_QMARK_ ? t__9911.right : t__9911.left, cljs.core.next.call(null, this__9910.stack), this__9910.ascending_QMARK_);
  if(!(next_stack__9912 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9912, this__9910.ascending_QMARK_, this__9910.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9913 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9914 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9914.stack, this__9914.ascending_QMARK_, this__9914.cnt, this__9914.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9915 = this;
  return this__9915.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9917 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9917) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9917
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9919 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9919) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9919
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9923 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9923)) {
    return cljs.core.deref.call(null, init__9923)
  }else {
    var init__9924 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9923) : init__9923;
    if(cljs.core.reduced_QMARK_.call(null, init__9924)) {
      return cljs.core.deref.call(null, init__9924)
    }else {
      var init__9925 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9924) : init__9924;
      if(cljs.core.reduced_QMARK_.call(null, init__9925)) {
        return cljs.core.deref.call(null, init__9925)
      }else {
        return init__9925
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9928 = this;
  var h__2198__auto____9929 = this__9928.__hash;
  if(!(h__2198__auto____9929 == null)) {
    return h__2198__auto____9929
  }else {
    var h__2198__auto____9930 = cljs.core.hash_coll.call(null, coll);
    this__9928.__hash = h__2198__auto____9930;
    return h__2198__auto____9930
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9931 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9932 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9933 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9933.key, this__9933.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9981 = null;
  var G__9981__2 = function(this_sym9934, k) {
    var this__9936 = this;
    var this_sym9934__9937 = this;
    var node__9938 = this_sym9934__9937;
    return node__9938.cljs$core$ILookup$_lookup$arity$2(node__9938, k)
  };
  var G__9981__3 = function(this_sym9935, k, not_found) {
    var this__9936 = this;
    var this_sym9935__9939 = this;
    var node__9940 = this_sym9935__9939;
    return node__9940.cljs$core$ILookup$_lookup$arity$3(node__9940, k, not_found)
  };
  G__9981 = function(this_sym9935, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9981__2.call(this, this_sym9935, k);
      case 3:
        return G__9981__3.call(this, this_sym9935, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9981
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9926, args9927) {
  var this__9941 = this;
  return this_sym9926.call.apply(this_sym9926, [this_sym9926].concat(args9927.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9942 = this;
  return cljs.core.PersistentVector.fromArray([this__9942.key, this__9942.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9943 = this;
  return this__9943.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9944 = this;
  return this__9944.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9945 = this;
  var node__9946 = this;
  return ins.balance_right(node__9946)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9947 = this;
  var node__9948 = this;
  return new cljs.core.RedNode(this__9947.key, this__9947.val, this__9947.left, this__9947.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9949 = this;
  var node__9950 = this;
  return cljs.core.balance_right_del.call(null, this__9949.key, this__9949.val, this__9949.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9951 = this;
  var node__9952 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9953 = this;
  var node__9954 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9954, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9955 = this;
  var node__9956 = this;
  return cljs.core.balance_left_del.call(null, this__9955.key, this__9955.val, del, this__9955.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9957 = this;
  var node__9958 = this;
  return ins.balance_left(node__9958)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9959 = this;
  var node__9960 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9960, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9982 = null;
  var G__9982__0 = function() {
    var this__9961 = this;
    var this__9963 = this;
    return cljs.core.pr_str.call(null, this__9963)
  };
  G__9982 = function() {
    switch(arguments.length) {
      case 0:
        return G__9982__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9982
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9964 = this;
  var node__9965 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9965, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9966 = this;
  var node__9967 = this;
  return node__9967
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9968 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9969 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9970 = this;
  return cljs.core.list.call(null, this__9970.key, this__9970.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9971 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9972 = this;
  return this__9972.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9973 = this;
  return cljs.core.PersistentVector.fromArray([this__9973.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9974 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9974.key, this__9974.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9975 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9976 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9976.key, this__9976.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9977 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9978 = this;
  if(n === 0) {
    return this__9978.key
  }else {
    if(n === 1) {
      return this__9978.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9979 = this;
  if(n === 0) {
    return this__9979.key
  }else {
    if(n === 1) {
      return this__9979.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9980 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9985 = this;
  var h__2198__auto____9986 = this__9985.__hash;
  if(!(h__2198__auto____9986 == null)) {
    return h__2198__auto____9986
  }else {
    var h__2198__auto____9987 = cljs.core.hash_coll.call(null, coll);
    this__9985.__hash = h__2198__auto____9987;
    return h__2198__auto____9987
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9988 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9989 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9990 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9990.key, this__9990.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__10038 = null;
  var G__10038__2 = function(this_sym9991, k) {
    var this__9993 = this;
    var this_sym9991__9994 = this;
    var node__9995 = this_sym9991__9994;
    return node__9995.cljs$core$ILookup$_lookup$arity$2(node__9995, k)
  };
  var G__10038__3 = function(this_sym9992, k, not_found) {
    var this__9993 = this;
    var this_sym9992__9996 = this;
    var node__9997 = this_sym9992__9996;
    return node__9997.cljs$core$ILookup$_lookup$arity$3(node__9997, k, not_found)
  };
  G__10038 = function(this_sym9992, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10038__2.call(this, this_sym9992, k);
      case 3:
        return G__10038__3.call(this, this_sym9992, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10038
}();
cljs.core.RedNode.prototype.apply = function(this_sym9983, args9984) {
  var this__9998 = this;
  return this_sym9983.call.apply(this_sym9983, [this_sym9983].concat(args9984.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9999 = this;
  return cljs.core.PersistentVector.fromArray([this__9999.key, this__9999.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10000 = this;
  return this__10000.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10001 = this;
  return this__10001.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10002 = this;
  var node__10003 = this;
  return new cljs.core.RedNode(this__10002.key, this__10002.val, this__10002.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10004 = this;
  var node__10005 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10006 = this;
  var node__10007 = this;
  return new cljs.core.RedNode(this__10006.key, this__10006.val, this__10006.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10008 = this;
  var node__10009 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10010 = this;
  var node__10011 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10011, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10012 = this;
  var node__10013 = this;
  return new cljs.core.RedNode(this__10012.key, this__10012.val, del, this__10012.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10014 = this;
  var node__10015 = this;
  return new cljs.core.RedNode(this__10014.key, this__10014.val, ins, this__10014.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10016 = this;
  var node__10017 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10016.left)) {
    return new cljs.core.RedNode(this__10016.key, this__10016.val, this__10016.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10016.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10016.right)) {
      return new cljs.core.RedNode(this__10016.right.key, this__10016.right.val, new cljs.core.BlackNode(this__10016.key, this__10016.val, this__10016.left, this__10016.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10016.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10017, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10039 = null;
  var G__10039__0 = function() {
    var this__10018 = this;
    var this__10020 = this;
    return cljs.core.pr_str.call(null, this__10020)
  };
  G__10039 = function() {
    switch(arguments.length) {
      case 0:
        return G__10039__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10039
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10021 = this;
  var node__10022 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10021.right)) {
    return new cljs.core.RedNode(this__10021.key, this__10021.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10021.left, null), this__10021.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10021.left)) {
      return new cljs.core.RedNode(this__10021.left.key, this__10021.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10021.left.left, null), new cljs.core.BlackNode(this__10021.key, this__10021.val, this__10021.left.right, this__10021.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10022, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10023 = this;
  var node__10024 = this;
  return new cljs.core.BlackNode(this__10023.key, this__10023.val, this__10023.left, this__10023.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10025 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10026 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10027 = this;
  return cljs.core.list.call(null, this__10027.key, this__10027.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10028 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10029 = this;
  return this__10029.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10030 = this;
  return cljs.core.PersistentVector.fromArray([this__10030.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10031 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10031.key, this__10031.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10032 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10033 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10033.key, this__10033.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10034 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10035 = this;
  if(n === 0) {
    return this__10035.key
  }else {
    if(n === 1) {
      return this__10035.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__10036 = this;
  if(n === 0) {
    return this__10036.key
  }else {
    if(n === 1) {
      return this__10036.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__10037 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10043 = comp.call(null, k, tree.key);
    if(c__10043 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10043 < 0) {
        var ins__10044 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__10044 == null)) {
          return tree.add_left(ins__10044)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10045 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__10045 == null)) {
            return tree.add_right(ins__10045)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__10048 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10048)) {
            return new cljs.core.RedNode(app__10048.key, app__10048.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10048.left, null), new cljs.core.RedNode(right.key, right.val, app__10048.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10048, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10049 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10049)) {
              return new cljs.core.RedNode(app__10049.key, app__10049.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10049.left, null), new cljs.core.BlackNode(right.key, right.val, app__10049.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10049, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__10055 = comp.call(null, k, tree.key);
    if(c__10055 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10055 < 0) {
        var del__10056 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10057 = !(del__10056 == null);
          if(or__3824__auto____10057) {
            return or__3824__auto____10057
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10056, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10056, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10058 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10059 = !(del__10058 == null);
            if(or__3824__auto____10059) {
              return or__3824__auto____10059
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10058)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10058, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__10062 = tree.key;
  var c__10063 = comp.call(null, k, tk__10062);
  if(c__10063 === 0) {
    return tree.replace(tk__10062, v, tree.left, tree.right)
  }else {
    if(c__10063 < 0) {
      return tree.replace(tk__10062, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10062, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10066 = this;
  var h__2198__auto____10067 = this__10066.__hash;
  if(!(h__2198__auto____10067 == null)) {
    return h__2198__auto____10067
  }else {
    var h__2198__auto____10068 = cljs.core.hash_imap.call(null, coll);
    this__10066.__hash = h__2198__auto____10068;
    return h__2198__auto____10068
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10069 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10070 = this;
  var n__10071 = coll.entry_at(k);
  if(!(n__10071 == null)) {
    return n__10071.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10072 = this;
  var found__10073 = [null];
  var t__10074 = cljs.core.tree_map_add.call(null, this__10072.comp, this__10072.tree, k, v, found__10073);
  if(t__10074 == null) {
    var found_node__10075 = cljs.core.nth.call(null, found__10073, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10075.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10072.comp, cljs.core.tree_map_replace.call(null, this__10072.comp, this__10072.tree, k, v), this__10072.cnt, this__10072.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10072.comp, t__10074.blacken(), this__10072.cnt + 1, this__10072.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10076 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10110 = null;
  var G__10110__2 = function(this_sym10077, k) {
    var this__10079 = this;
    var this_sym10077__10080 = this;
    var coll__10081 = this_sym10077__10080;
    return coll__10081.cljs$core$ILookup$_lookup$arity$2(coll__10081, k)
  };
  var G__10110__3 = function(this_sym10078, k, not_found) {
    var this__10079 = this;
    var this_sym10078__10082 = this;
    var coll__10083 = this_sym10078__10082;
    return coll__10083.cljs$core$ILookup$_lookup$arity$3(coll__10083, k, not_found)
  };
  G__10110 = function(this_sym10078, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10110__2.call(this, this_sym10078, k);
      case 3:
        return G__10110__3.call(this, this_sym10078, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10110
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym10064, args10065) {
  var this__10084 = this;
  return this_sym10064.call.apply(this_sym10064, [this_sym10064].concat(args10065.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10085 = this;
  if(!(this__10085.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10085.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10086 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10087 = this;
  if(this__10087.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10087.tree, false, this__10087.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10088 = this;
  var this__10089 = this;
  return cljs.core.pr_str.call(null, this__10089)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10090 = this;
  var coll__10091 = this;
  var t__10092 = this__10090.tree;
  while(true) {
    if(!(t__10092 == null)) {
      var c__10093 = this__10090.comp.call(null, k, t__10092.key);
      if(c__10093 === 0) {
        return t__10092
      }else {
        if(c__10093 < 0) {
          var G__10111 = t__10092.left;
          t__10092 = G__10111;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10112 = t__10092.right;
            t__10092 = G__10112;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10094 = this;
  if(this__10094.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10094.tree, ascending_QMARK_, this__10094.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10095 = this;
  if(this__10095.cnt > 0) {
    var stack__10096 = null;
    var t__10097 = this__10095.tree;
    while(true) {
      if(!(t__10097 == null)) {
        var c__10098 = this__10095.comp.call(null, k, t__10097.key);
        if(c__10098 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10096, t__10097), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10098 < 0) {
              var G__10113 = cljs.core.conj.call(null, stack__10096, t__10097);
              var G__10114 = t__10097.left;
              stack__10096 = G__10113;
              t__10097 = G__10114;
              continue
            }else {
              var G__10115 = stack__10096;
              var G__10116 = t__10097.right;
              stack__10096 = G__10115;
              t__10097 = G__10116;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10098 > 0) {
                var G__10117 = cljs.core.conj.call(null, stack__10096, t__10097);
                var G__10118 = t__10097.right;
                stack__10096 = G__10117;
                t__10097 = G__10118;
                continue
              }else {
                var G__10119 = stack__10096;
                var G__10120 = t__10097.left;
                stack__10096 = G__10119;
                t__10097 = G__10120;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10096 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10096, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10099 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10100 = this;
  return this__10100.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10101 = this;
  if(this__10101.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10101.tree, true, this__10101.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10102 = this;
  return this__10102.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10103 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10104 = this;
  return new cljs.core.PersistentTreeMap(this__10104.comp, this__10104.tree, this__10104.cnt, meta, this__10104.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10105 = this;
  return this__10105.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10106 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10106.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10107 = this;
  var found__10108 = [null];
  var t__10109 = cljs.core.tree_map_remove.call(null, this__10107.comp, this__10107.tree, k, found__10108);
  if(t__10109 == null) {
    if(cljs.core.nth.call(null, found__10108, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10107.comp, null, 0, this__10107.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10107.comp, t__10109.blacken(), this__10107.cnt - 1, this__10107.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__10123 = cljs.core.seq.call(null, keyvals);
    var out__10124 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__10123) {
        var G__10125 = cljs.core.nnext.call(null, in__10123);
        var G__10126 = cljs.core.assoc_BANG_.call(null, out__10124, cljs.core.first.call(null, in__10123), cljs.core.second.call(null, in__10123));
        in__10123 = G__10125;
        out__10124 = G__10126;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10124)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__10127) {
    var keyvals = cljs.core.seq(arglist__10127);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__10128) {
    var keyvals = cljs.core.seq(arglist__10128);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__10132 = [];
    var obj__10133 = {};
    var kvs__10134 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__10134) {
        ks__10132.push(cljs.core.first.call(null, kvs__10134));
        obj__10133[cljs.core.first.call(null, kvs__10134)] = cljs.core.second.call(null, kvs__10134);
        var G__10135 = cljs.core.nnext.call(null, kvs__10134);
        kvs__10134 = G__10135;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__10132, obj__10133)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__10136) {
    var keyvals = cljs.core.seq(arglist__10136);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__10139 = cljs.core.seq.call(null, keyvals);
    var out__10140 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__10139) {
        var G__10141 = cljs.core.nnext.call(null, in__10139);
        var G__10142 = cljs.core.assoc.call(null, out__10140, cljs.core.first.call(null, in__10139), cljs.core.second.call(null, in__10139));
        in__10139 = G__10141;
        out__10140 = G__10142;
        continue
      }else {
        return out__10140
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__10143) {
    var keyvals = cljs.core.seq(arglist__10143);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__10146 = cljs.core.seq.call(null, keyvals);
    var out__10147 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__10146) {
        var G__10148 = cljs.core.nnext.call(null, in__10146);
        var G__10149 = cljs.core.assoc.call(null, out__10147, cljs.core.first.call(null, in__10146), cljs.core.second.call(null, in__10146));
        in__10146 = G__10148;
        out__10147 = G__10149;
        continue
      }else {
        return out__10147
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__10150) {
    var comparator = cljs.core.first(arglist__10150);
    var keyvals = cljs.core.rest(arglist__10150);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__10151_SHARP_, p2__10152_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____10154 = p1__10151_SHARP_;
          if(cljs.core.truth_(or__3824__auto____10154)) {
            return or__3824__auto____10154
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__10152_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__10155) {
    var maps = cljs.core.seq(arglist__10155);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__10163 = function(m, e) {
        var k__10161 = cljs.core.first.call(null, e);
        var v__10162 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__10161)) {
          return cljs.core.assoc.call(null, m, k__10161, f.call(null, cljs.core._lookup.call(null, m, k__10161, null), v__10162))
        }else {
          return cljs.core.assoc.call(null, m, k__10161, v__10162)
        }
      };
      var merge2__10165 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__10163, function() {
          var or__3824__auto____10164 = m1;
          if(cljs.core.truth_(or__3824__auto____10164)) {
            return or__3824__auto____10164
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__10165, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__10166) {
    var f = cljs.core.first(arglist__10166);
    var maps = cljs.core.rest(arglist__10166);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__10171 = cljs.core.ObjMap.EMPTY;
  var keys__10172 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__10172) {
      var key__10173 = cljs.core.first.call(null, keys__10172);
      var entry__10174 = cljs.core._lookup.call(null, map, key__10173, "\ufdd0'cljs.core/not-found");
      var G__10175 = cljs.core.not_EQ_.call(null, entry__10174, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__10171, key__10173, entry__10174) : ret__10171;
      var G__10176 = cljs.core.next.call(null, keys__10172);
      ret__10171 = G__10175;
      keys__10172 = G__10176;
      continue
    }else {
      return ret__10171
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10180 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__10180.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10181 = this;
  var h__2198__auto____10182 = this__10181.__hash;
  if(!(h__2198__auto____10182 == null)) {
    return h__2198__auto____10182
  }else {
    var h__2198__auto____10183 = cljs.core.hash_iset.call(null, coll);
    this__10181.__hash = h__2198__auto____10183;
    return h__2198__auto____10183
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10184 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10185 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10185.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10206 = null;
  var G__10206__2 = function(this_sym10186, k) {
    var this__10188 = this;
    var this_sym10186__10189 = this;
    var coll__10190 = this_sym10186__10189;
    return coll__10190.cljs$core$ILookup$_lookup$arity$2(coll__10190, k)
  };
  var G__10206__3 = function(this_sym10187, k, not_found) {
    var this__10188 = this;
    var this_sym10187__10191 = this;
    var coll__10192 = this_sym10187__10191;
    return coll__10192.cljs$core$ILookup$_lookup$arity$3(coll__10192, k, not_found)
  };
  G__10206 = function(this_sym10187, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10206__2.call(this, this_sym10187, k);
      case 3:
        return G__10206__3.call(this, this_sym10187, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10206
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym10178, args10179) {
  var this__10193 = this;
  return this_sym10178.call.apply(this_sym10178, [this_sym10178].concat(args10179.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10194 = this;
  return new cljs.core.PersistentHashSet(this__10194.meta, cljs.core.assoc.call(null, this__10194.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__10195 = this;
  var this__10196 = this;
  return cljs.core.pr_str.call(null, this__10196)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10197 = this;
  return cljs.core.keys.call(null, this__10197.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10198 = this;
  return new cljs.core.PersistentHashSet(this__10198.meta, cljs.core.dissoc.call(null, this__10198.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10199 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10200 = this;
  var and__3822__auto____10201 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10201) {
    var and__3822__auto____10202 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10202) {
      return cljs.core.every_QMARK_.call(null, function(p1__10177_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10177_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10202
    }
  }else {
    return and__3822__auto____10201
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10203 = this;
  return new cljs.core.PersistentHashSet(meta, this__10203.hash_map, this__10203.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10204 = this;
  return this__10204.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10205 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10205.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__10207 = cljs.core.count.call(null, items);
  var i__10208 = 0;
  var out__10209 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__10208 < len__10207) {
      var G__10210 = i__10208 + 1;
      var G__10211 = cljs.core.conj_BANG_.call(null, out__10209, items[i__10208]);
      i__10208 = G__10210;
      out__10209 = G__10211;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10209)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__10229 = null;
  var G__10229__2 = function(this_sym10215, k) {
    var this__10217 = this;
    var this_sym10215__10218 = this;
    var tcoll__10219 = this_sym10215__10218;
    if(cljs.core._lookup.call(null, this__10217.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10229__3 = function(this_sym10216, k, not_found) {
    var this__10217 = this;
    var this_sym10216__10220 = this;
    var tcoll__10221 = this_sym10216__10220;
    if(cljs.core._lookup.call(null, this__10217.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10229 = function(this_sym10216, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10229__2.call(this, this_sym10216, k);
      case 3:
        return G__10229__3.call(this, this_sym10216, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10229
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym10213, args10214) {
  var this__10222 = this;
  return this_sym10213.call.apply(this_sym10213, [this_sym10213].concat(args10214.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10223 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10224 = this;
  if(cljs.core._lookup.call(null, this__10224.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10225 = this;
  return cljs.core.count.call(null, this__10225.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10226 = this;
  this__10226.transient_map = cljs.core.dissoc_BANG_.call(null, this__10226.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10227 = this;
  this__10227.transient_map = cljs.core.assoc_BANG_.call(null, this__10227.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10228 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10228.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10232 = this;
  var h__2198__auto____10233 = this__10232.__hash;
  if(!(h__2198__auto____10233 == null)) {
    return h__2198__auto____10233
  }else {
    var h__2198__auto____10234 = cljs.core.hash_iset.call(null, coll);
    this__10232.__hash = h__2198__auto____10234;
    return h__2198__auto____10234
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10235 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10236 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10236.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10262 = null;
  var G__10262__2 = function(this_sym10237, k) {
    var this__10239 = this;
    var this_sym10237__10240 = this;
    var coll__10241 = this_sym10237__10240;
    return coll__10241.cljs$core$ILookup$_lookup$arity$2(coll__10241, k)
  };
  var G__10262__3 = function(this_sym10238, k, not_found) {
    var this__10239 = this;
    var this_sym10238__10242 = this;
    var coll__10243 = this_sym10238__10242;
    return coll__10243.cljs$core$ILookup$_lookup$arity$3(coll__10243, k, not_found)
  };
  G__10262 = function(this_sym10238, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10262__2.call(this, this_sym10238, k);
      case 3:
        return G__10262__3.call(this, this_sym10238, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10262
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym10230, args10231) {
  var this__10244 = this;
  return this_sym10230.call.apply(this_sym10230, [this_sym10230].concat(args10231.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10245 = this;
  return new cljs.core.PersistentTreeSet(this__10245.meta, cljs.core.assoc.call(null, this__10245.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10246 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10246.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10247 = this;
  var this__10248 = this;
  return cljs.core.pr_str.call(null, this__10248)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10249 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10249.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10250 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10250.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10251 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10252 = this;
  return cljs.core._comparator.call(null, this__10252.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10253 = this;
  return cljs.core.keys.call(null, this__10253.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10254 = this;
  return new cljs.core.PersistentTreeSet(this__10254.meta, cljs.core.dissoc.call(null, this__10254.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10255 = this;
  return cljs.core.count.call(null, this__10255.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10256 = this;
  var and__3822__auto____10257 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10257) {
    var and__3822__auto____10258 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10258) {
      return cljs.core.every_QMARK_.call(null, function(p1__10212_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10212_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10258
    }
  }else {
    return and__3822__auto____10257
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10259 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10259.tree_map, this__10259.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10260 = this;
  return this__10260.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10261 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10261.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__10267__delegate = function(keys) {
      var in__10265 = cljs.core.seq.call(null, keys);
      var out__10266 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__10265)) {
          var G__10268 = cljs.core.next.call(null, in__10265);
          var G__10269 = cljs.core.conj_BANG_.call(null, out__10266, cljs.core.first.call(null, in__10265));
          in__10265 = G__10268;
          out__10266 = G__10269;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__10266)
        }
        break
      }
    };
    var G__10267 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10267__delegate.call(this, keys)
    };
    G__10267.cljs$lang$maxFixedArity = 0;
    G__10267.cljs$lang$applyTo = function(arglist__10270) {
      var keys = cljs.core.seq(arglist__10270);
      return G__10267__delegate(keys)
    };
    G__10267.cljs$lang$arity$variadic = G__10267__delegate;
    return G__10267
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__10271) {
    var keys = cljs.core.seq(arglist__10271);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__10273) {
    var comparator = cljs.core.first(arglist__10273);
    var keys = cljs.core.rest(arglist__10273);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10279 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____10280 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____10280)) {
        var e__10281 = temp__3971__auto____10280;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10281))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10279, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10272_SHARP_) {
      var temp__3971__auto____10282 = cljs.core.find.call(null, smap, p1__10272_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____10282)) {
        var e__10283 = temp__3971__auto____10282;
        return cljs.core.second.call(null, e__10283)
      }else {
        return p1__10272_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10313 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10306, seen) {
        while(true) {
          var vec__10307__10308 = p__10306;
          var f__10309 = cljs.core.nth.call(null, vec__10307__10308, 0, null);
          var xs__10310 = vec__10307__10308;
          var temp__3974__auto____10311 = cljs.core.seq.call(null, xs__10310);
          if(temp__3974__auto____10311) {
            var s__10312 = temp__3974__auto____10311;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10309)) {
              var G__10314 = cljs.core.rest.call(null, s__10312);
              var G__10315 = seen;
              p__10306 = G__10314;
              seen = G__10315;
              continue
            }else {
              return cljs.core.cons.call(null, f__10309, step.call(null, cljs.core.rest.call(null, s__10312), cljs.core.conj.call(null, seen, f__10309)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__10313.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__10318 = cljs.core.PersistentVector.EMPTY;
  var s__10319 = s;
  while(true) {
    if(cljs.core.next.call(null, s__10319)) {
      var G__10320 = cljs.core.conj.call(null, ret__10318, cljs.core.first.call(null, s__10319));
      var G__10321 = cljs.core.next.call(null, s__10319);
      ret__10318 = G__10320;
      s__10319 = G__10321;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10318)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____10324 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____10324) {
        return or__3824__auto____10324
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10325 = x.lastIndexOf("/");
      if(i__10325 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10325 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____10328 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____10328) {
      return or__3824__auto____10328
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10329 = x.lastIndexOf("/");
    if(i__10329 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10329)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10336 = cljs.core.ObjMap.EMPTY;
  var ks__10337 = cljs.core.seq.call(null, keys);
  var vs__10338 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____10339 = ks__10337;
      if(and__3822__auto____10339) {
        return vs__10338
      }else {
        return and__3822__auto____10339
      }
    }()) {
      var G__10340 = cljs.core.assoc.call(null, map__10336, cljs.core.first.call(null, ks__10337), cljs.core.first.call(null, vs__10338));
      var G__10341 = cljs.core.next.call(null, ks__10337);
      var G__10342 = cljs.core.next.call(null, vs__10338);
      map__10336 = G__10340;
      ks__10337 = G__10341;
      vs__10338 = G__10342;
      continue
    }else {
      return map__10336
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__10345__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10330_SHARP_, p2__10331_SHARP_) {
        return max_key.call(null, k, p1__10330_SHARP_, p2__10331_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10345 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10345__delegate.call(this, k, x, y, more)
    };
    G__10345.cljs$lang$maxFixedArity = 3;
    G__10345.cljs$lang$applyTo = function(arglist__10346) {
      var k = cljs.core.first(arglist__10346);
      var x = cljs.core.first(cljs.core.next(arglist__10346));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10346)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10346)));
      return G__10345__delegate(k, x, y, more)
    };
    G__10345.cljs$lang$arity$variadic = G__10345__delegate;
    return G__10345
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__10347__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10343_SHARP_, p2__10344_SHARP_) {
        return min_key.call(null, k, p1__10343_SHARP_, p2__10344_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10347 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10347__delegate.call(this, k, x, y, more)
    };
    G__10347.cljs$lang$maxFixedArity = 3;
    G__10347.cljs$lang$applyTo = function(arglist__10348) {
      var k = cljs.core.first(arglist__10348);
      var x = cljs.core.first(cljs.core.next(arglist__10348));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10348)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10348)));
      return G__10347__delegate(k, x, y, more)
    };
    G__10347.cljs$lang$arity$variadic = G__10347__delegate;
    return G__10347
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10351 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10351) {
        var s__10352 = temp__3974__auto____10351;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10352), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10352)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10355 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10355) {
      var s__10356 = temp__3974__auto____10355;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10356)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10356), take_while.call(null, pred, cljs.core.rest.call(null, s__10356)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__10358 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10358.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10370 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10371 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10371)) {
        var vec__10372__10373 = temp__3974__auto____10371;
        var e__10374 = cljs.core.nth.call(null, vec__10372__10373, 0, null);
        var s__10375 = vec__10372__10373;
        if(cljs.core.truth_(include__10370.call(null, e__10374))) {
          return s__10375
        }else {
          return cljs.core.next.call(null, s__10375)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10370, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10376 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10376)) {
      var vec__10377__10378 = temp__3974__auto____10376;
      var e__10379 = cljs.core.nth.call(null, vec__10377__10378, 0, null);
      var s__10380 = vec__10377__10378;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10379)) ? s__10380 : cljs.core.next.call(null, s__10380))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__10392 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10393 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10393)) {
        var vec__10394__10395 = temp__3974__auto____10393;
        var e__10396 = cljs.core.nth.call(null, vec__10394__10395, 0, null);
        var s__10397 = vec__10394__10395;
        if(cljs.core.truth_(include__10392.call(null, e__10396))) {
          return s__10397
        }else {
          return cljs.core.next.call(null, s__10397)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10392, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10398 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10398)) {
      var vec__10399__10400 = temp__3974__auto____10398;
      var e__10401 = cljs.core.nth.call(null, vec__10399__10400, 0, null);
      var s__10402 = vec__10399__10400;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10401)) ? s__10402 : cljs.core.next.call(null, s__10402))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__10403 = this;
  var h__2198__auto____10404 = this__10403.__hash;
  if(!(h__2198__auto____10404 == null)) {
    return h__2198__auto____10404
  }else {
    var h__2198__auto____10405 = cljs.core.hash_coll.call(null, rng);
    this__10403.__hash = h__2198__auto____10405;
    return h__2198__auto____10405
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10406 = this;
  if(this__10406.step > 0) {
    if(this__10406.start + this__10406.step < this__10406.end) {
      return new cljs.core.Range(this__10406.meta, this__10406.start + this__10406.step, this__10406.end, this__10406.step, null)
    }else {
      return null
    }
  }else {
    if(this__10406.start + this__10406.step > this__10406.end) {
      return new cljs.core.Range(this__10406.meta, this__10406.start + this__10406.step, this__10406.end, this__10406.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10407 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10408 = this;
  var this__10409 = this;
  return cljs.core.pr_str.call(null, this__10409)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10410 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10411 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10412 = this;
  if(this__10412.step > 0) {
    if(this__10412.start < this__10412.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10412.start > this__10412.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10413 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10413.end - this__10413.start) / this__10413.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10414 = this;
  return this__10414.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10415 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10415.meta, this__10415.start + this__10415.step, this__10415.end, this__10415.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10416 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10417 = this;
  return new cljs.core.Range(meta, this__10417.start, this__10417.end, this__10417.step, this__10417.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10418 = this;
  return this__10418.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10419 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10419.start + n * this__10419.step
  }else {
    if(function() {
      var and__3822__auto____10420 = this__10419.start > this__10419.end;
      if(and__3822__auto____10420) {
        return this__10419.step === 0
      }else {
        return and__3822__auto____10420
      }
    }()) {
      return this__10419.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10421 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10421.start + n * this__10421.step
  }else {
    if(function() {
      var and__3822__auto____10422 = this__10421.start > this__10421.end;
      if(and__3822__auto____10422) {
        return this__10421.step === 0
      }else {
        return and__3822__auto____10422
      }
    }()) {
      return this__10421.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10423 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10423.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10426 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10426) {
      var s__10427 = temp__3974__auto____10426;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10427), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10427)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10434 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10434) {
      var s__10435 = temp__3974__auto____10434;
      var fst__10436 = cljs.core.first.call(null, s__10435);
      var fv__10437 = f.call(null, fst__10436);
      var run__10438 = cljs.core.cons.call(null, fst__10436, cljs.core.take_while.call(null, function(p1__10428_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10437, f.call(null, p1__10428_SHARP_))
      }, cljs.core.next.call(null, s__10435)));
      return cljs.core.cons.call(null, run__10438, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10438), s__10435))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10453 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10453) {
        var s__10454 = temp__3971__auto____10453;
        return reductions.call(null, f, cljs.core.first.call(null, s__10454), cljs.core.rest.call(null, s__10454))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10455 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10455) {
        var s__10456 = temp__3974__auto____10455;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10456)), cljs.core.rest.call(null, s__10456))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10459 = null;
      var G__10459__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10459__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10459__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10459__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10459__4 = function() {
        var G__10460__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10460 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10460__delegate.call(this, x, y, z, args)
        };
        G__10460.cljs$lang$maxFixedArity = 3;
        G__10460.cljs$lang$applyTo = function(arglist__10461) {
          var x = cljs.core.first(arglist__10461);
          var y = cljs.core.first(cljs.core.next(arglist__10461));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10461)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10461)));
          return G__10460__delegate(x, y, z, args)
        };
        G__10460.cljs$lang$arity$variadic = G__10460__delegate;
        return G__10460
      }();
      G__10459 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10459__0.call(this);
          case 1:
            return G__10459__1.call(this, x);
          case 2:
            return G__10459__2.call(this, x, y);
          case 3:
            return G__10459__3.call(this, x, y, z);
          default:
            return G__10459__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10459.cljs$lang$maxFixedArity = 3;
      G__10459.cljs$lang$applyTo = G__10459__4.cljs$lang$applyTo;
      return G__10459
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10462 = null;
      var G__10462__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10462__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10462__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10462__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10462__4 = function() {
        var G__10463__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10463 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10463__delegate.call(this, x, y, z, args)
        };
        G__10463.cljs$lang$maxFixedArity = 3;
        G__10463.cljs$lang$applyTo = function(arglist__10464) {
          var x = cljs.core.first(arglist__10464);
          var y = cljs.core.first(cljs.core.next(arglist__10464));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10464)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10464)));
          return G__10463__delegate(x, y, z, args)
        };
        G__10463.cljs$lang$arity$variadic = G__10463__delegate;
        return G__10463
      }();
      G__10462 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10462__0.call(this);
          case 1:
            return G__10462__1.call(this, x);
          case 2:
            return G__10462__2.call(this, x, y);
          case 3:
            return G__10462__3.call(this, x, y, z);
          default:
            return G__10462__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10462.cljs$lang$maxFixedArity = 3;
      G__10462.cljs$lang$applyTo = G__10462__4.cljs$lang$applyTo;
      return G__10462
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10465 = null;
      var G__10465__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10465__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10465__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10465__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10465__4 = function() {
        var G__10466__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10466 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10466__delegate.call(this, x, y, z, args)
        };
        G__10466.cljs$lang$maxFixedArity = 3;
        G__10466.cljs$lang$applyTo = function(arglist__10467) {
          var x = cljs.core.first(arglist__10467);
          var y = cljs.core.first(cljs.core.next(arglist__10467));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10467)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10467)));
          return G__10466__delegate(x, y, z, args)
        };
        G__10466.cljs$lang$arity$variadic = G__10466__delegate;
        return G__10466
      }();
      G__10465 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10465__0.call(this);
          case 1:
            return G__10465__1.call(this, x);
          case 2:
            return G__10465__2.call(this, x, y);
          case 3:
            return G__10465__3.call(this, x, y, z);
          default:
            return G__10465__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10465.cljs$lang$maxFixedArity = 3;
      G__10465.cljs$lang$applyTo = G__10465__4.cljs$lang$applyTo;
      return G__10465
    }()
  };
  var juxt__4 = function() {
    var G__10468__delegate = function(f, g, h, fs) {
      var fs__10458 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10469 = null;
        var G__10469__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10439_SHARP_, p2__10440_SHARP_) {
            return cljs.core.conj.call(null, p1__10439_SHARP_, p2__10440_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10458)
        };
        var G__10469__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10441_SHARP_, p2__10442_SHARP_) {
            return cljs.core.conj.call(null, p1__10441_SHARP_, p2__10442_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10458)
        };
        var G__10469__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10443_SHARP_, p2__10444_SHARP_) {
            return cljs.core.conj.call(null, p1__10443_SHARP_, p2__10444_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10458)
        };
        var G__10469__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10445_SHARP_, p2__10446_SHARP_) {
            return cljs.core.conj.call(null, p1__10445_SHARP_, p2__10446_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10458)
        };
        var G__10469__4 = function() {
          var G__10470__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10447_SHARP_, p2__10448_SHARP_) {
              return cljs.core.conj.call(null, p1__10447_SHARP_, cljs.core.apply.call(null, p2__10448_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10458)
          };
          var G__10470 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10470__delegate.call(this, x, y, z, args)
          };
          G__10470.cljs$lang$maxFixedArity = 3;
          G__10470.cljs$lang$applyTo = function(arglist__10471) {
            var x = cljs.core.first(arglist__10471);
            var y = cljs.core.first(cljs.core.next(arglist__10471));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10471)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10471)));
            return G__10470__delegate(x, y, z, args)
          };
          G__10470.cljs$lang$arity$variadic = G__10470__delegate;
          return G__10470
        }();
        G__10469 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10469__0.call(this);
            case 1:
              return G__10469__1.call(this, x);
            case 2:
              return G__10469__2.call(this, x, y);
            case 3:
              return G__10469__3.call(this, x, y, z);
            default:
              return G__10469__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10469.cljs$lang$maxFixedArity = 3;
        G__10469.cljs$lang$applyTo = G__10469__4.cljs$lang$applyTo;
        return G__10469
      }()
    };
    var G__10468 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10468__delegate.call(this, f, g, h, fs)
    };
    G__10468.cljs$lang$maxFixedArity = 3;
    G__10468.cljs$lang$applyTo = function(arglist__10472) {
      var f = cljs.core.first(arglist__10472);
      var g = cljs.core.first(cljs.core.next(arglist__10472));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10472)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10472)));
      return G__10468__delegate(f, g, h, fs)
    };
    G__10468.cljs$lang$arity$variadic = G__10468__delegate;
    return G__10468
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10475 = cljs.core.next.call(null, coll);
        coll = G__10475;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10474 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10474) {
          return n > 0
        }else {
          return and__3822__auto____10474
        }
      }())) {
        var G__10476 = n - 1;
        var G__10477 = cljs.core.next.call(null, coll);
        n = G__10476;
        coll = G__10477;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10479 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10479), s)) {
    if(cljs.core.count.call(null, matches__10479) === 1) {
      return cljs.core.first.call(null, matches__10479)
    }else {
      return cljs.core.vec.call(null, matches__10479)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10481 = re.exec(s);
  if(matches__10481 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10481) === 1) {
      return cljs.core.first.call(null, matches__10481)
    }else {
      return cljs.core.vec.call(null, matches__10481)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10486 = cljs.core.re_find.call(null, re, s);
  var match_idx__10487 = s.search(re);
  var match_str__10488 = cljs.core.coll_QMARK_.call(null, match_data__10486) ? cljs.core.first.call(null, match_data__10486) : match_data__10486;
  var post_match__10489 = cljs.core.subs.call(null, s, match_idx__10487 + cljs.core.count.call(null, match_str__10488));
  if(cljs.core.truth_(match_data__10486)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10486, re_seq.call(null, re, post_match__10489))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10496__10497 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10498 = cljs.core.nth.call(null, vec__10496__10497, 0, null);
  var flags__10499 = cljs.core.nth.call(null, vec__10496__10497, 1, null);
  var pattern__10500 = cljs.core.nth.call(null, vec__10496__10497, 2, null);
  return new RegExp(pattern__10500, flags__10499)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10490_SHARP_) {
    return print_one.call(null, p1__10490_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10510 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10510)) {
            var and__3822__auto____10514 = function() {
              var G__10511__10512 = obj;
              if(G__10511__10512) {
                if(function() {
                  var or__3824__auto____10513 = G__10511__10512.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10513) {
                    return or__3824__auto____10513
                  }else {
                    return G__10511__10512.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10511__10512.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10511__10512)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10511__10512)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10514)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10514
            }
          }else {
            return and__3822__auto____10510
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10515 = !(obj == null);
          if(and__3822__auto____10515) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10515
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10516__10517 = obj;
          if(G__10516__10517) {
            if(function() {
              var or__3824__auto____10518 = G__10516__10517.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10518) {
                return or__3824__auto____10518
              }else {
                return G__10516__10517.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10516__10517.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10516__10517)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10516__10517)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10538 = new goog.string.StringBuffer;
  var G__10539__10540 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10539__10540) {
    var string__10541 = cljs.core.first.call(null, G__10539__10540);
    var G__10539__10542 = G__10539__10540;
    while(true) {
      sb__10538.append(string__10541);
      var temp__3974__auto____10543 = cljs.core.next.call(null, G__10539__10542);
      if(temp__3974__auto____10543) {
        var G__10539__10544 = temp__3974__auto____10543;
        var G__10557 = cljs.core.first.call(null, G__10539__10544);
        var G__10558 = G__10539__10544;
        string__10541 = G__10557;
        G__10539__10542 = G__10558;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10545__10546 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10545__10546) {
    var obj__10547 = cljs.core.first.call(null, G__10545__10546);
    var G__10545__10548 = G__10545__10546;
    while(true) {
      sb__10538.append(" ");
      var G__10549__10550 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10547, opts));
      if(G__10549__10550) {
        var string__10551 = cljs.core.first.call(null, G__10549__10550);
        var G__10549__10552 = G__10549__10550;
        while(true) {
          sb__10538.append(string__10551);
          var temp__3974__auto____10553 = cljs.core.next.call(null, G__10549__10552);
          if(temp__3974__auto____10553) {
            var G__10549__10554 = temp__3974__auto____10553;
            var G__10559 = cljs.core.first.call(null, G__10549__10554);
            var G__10560 = G__10549__10554;
            string__10551 = G__10559;
            G__10549__10552 = G__10560;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10555 = cljs.core.next.call(null, G__10545__10548);
      if(temp__3974__auto____10555) {
        var G__10545__10556 = temp__3974__auto____10555;
        var G__10561 = cljs.core.first.call(null, G__10545__10556);
        var G__10562 = G__10545__10556;
        obj__10547 = G__10561;
        G__10545__10548 = G__10562;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10538
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10564 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10564.append("\n");
  return[cljs.core.str(sb__10564)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10583__10584 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10583__10584) {
    var string__10585 = cljs.core.first.call(null, G__10583__10584);
    var G__10583__10586 = G__10583__10584;
    while(true) {
      cljs.core.string_print.call(null, string__10585);
      var temp__3974__auto____10587 = cljs.core.next.call(null, G__10583__10586);
      if(temp__3974__auto____10587) {
        var G__10583__10588 = temp__3974__auto____10587;
        var G__10601 = cljs.core.first.call(null, G__10583__10588);
        var G__10602 = G__10583__10588;
        string__10585 = G__10601;
        G__10583__10586 = G__10602;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10589__10590 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10589__10590) {
    var obj__10591 = cljs.core.first.call(null, G__10589__10590);
    var G__10589__10592 = G__10589__10590;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10593__10594 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10591, opts));
      if(G__10593__10594) {
        var string__10595 = cljs.core.first.call(null, G__10593__10594);
        var G__10593__10596 = G__10593__10594;
        while(true) {
          cljs.core.string_print.call(null, string__10595);
          var temp__3974__auto____10597 = cljs.core.next.call(null, G__10593__10596);
          if(temp__3974__auto____10597) {
            var G__10593__10598 = temp__3974__auto____10597;
            var G__10603 = cljs.core.first.call(null, G__10593__10598);
            var G__10604 = G__10593__10598;
            string__10595 = G__10603;
            G__10593__10596 = G__10604;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10599 = cljs.core.next.call(null, G__10589__10592);
      if(temp__3974__auto____10599) {
        var G__10589__10600 = temp__3974__auto____10599;
        var G__10605 = cljs.core.first.call(null, G__10589__10600);
        var G__10606 = G__10589__10600;
        obj__10591 = G__10605;
        G__10589__10592 = G__10606;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10607) {
    var objs = cljs.core.seq(arglist__10607);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10608) {
    var objs = cljs.core.seq(arglist__10608);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10609) {
    var objs = cljs.core.seq(arglist__10609);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10610) {
    var objs = cljs.core.seq(arglist__10610);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10611) {
    var objs = cljs.core.seq(arglist__10611);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10612) {
    var objs = cljs.core.seq(arglist__10612);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10613) {
    var objs = cljs.core.seq(arglist__10613);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10614) {
    var objs = cljs.core.seq(arglist__10614);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10615) {
    var fmt = cljs.core.first(arglist__10615);
    var args = cljs.core.rest(arglist__10615);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10616 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10616, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10617 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10617, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10618 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10618, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10619 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10619)) {
        var nspc__10620 = temp__3974__auto____10619;
        return[cljs.core.str(nspc__10620), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10621 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10621)) {
          var nspc__10622 = temp__3974__auto____10621;
          return[cljs.core.str(nspc__10622), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10623 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10623, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10625 = function(n, len) {
    var ns__10624 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10624) < len) {
        var G__10627 = [cljs.core.str("0"), cljs.core.str(ns__10624)].join("");
        ns__10624 = G__10627;
        continue
      }else {
        return ns__10624
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10625.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10625.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10625.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10625.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10625.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10625.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10626 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10626, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10628 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10629 = this;
  var G__10630__10631 = cljs.core.seq.call(null, this__10629.watches);
  if(G__10630__10631) {
    var G__10633__10635 = cljs.core.first.call(null, G__10630__10631);
    var vec__10634__10636 = G__10633__10635;
    var key__10637 = cljs.core.nth.call(null, vec__10634__10636, 0, null);
    var f__10638 = cljs.core.nth.call(null, vec__10634__10636, 1, null);
    var G__10630__10639 = G__10630__10631;
    var G__10633__10640 = G__10633__10635;
    var G__10630__10641 = G__10630__10639;
    while(true) {
      var vec__10642__10643 = G__10633__10640;
      var key__10644 = cljs.core.nth.call(null, vec__10642__10643, 0, null);
      var f__10645 = cljs.core.nth.call(null, vec__10642__10643, 1, null);
      var G__10630__10646 = G__10630__10641;
      f__10645.call(null, key__10644, this$, oldval, newval);
      var temp__3974__auto____10647 = cljs.core.next.call(null, G__10630__10646);
      if(temp__3974__auto____10647) {
        var G__10630__10648 = temp__3974__auto____10647;
        var G__10655 = cljs.core.first.call(null, G__10630__10648);
        var G__10656 = G__10630__10648;
        G__10633__10640 = G__10655;
        G__10630__10641 = G__10656;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10649 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10649.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10650 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10650.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10651 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10651.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10652 = this;
  return this__10652.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10653 = this;
  return this__10653.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10654 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10668__delegate = function(x, p__10657) {
      var map__10663__10664 = p__10657;
      var map__10663__10665 = cljs.core.seq_QMARK_.call(null, map__10663__10664) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10663__10664) : map__10663__10664;
      var validator__10666 = cljs.core._lookup.call(null, map__10663__10665, "\ufdd0'validator", null);
      var meta__10667 = cljs.core._lookup.call(null, map__10663__10665, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10667, validator__10666, null)
    };
    var G__10668 = function(x, var_args) {
      var p__10657 = null;
      if(goog.isDef(var_args)) {
        p__10657 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10668__delegate.call(this, x, p__10657)
    };
    G__10668.cljs$lang$maxFixedArity = 1;
    G__10668.cljs$lang$applyTo = function(arglist__10669) {
      var x = cljs.core.first(arglist__10669);
      var p__10657 = cljs.core.rest(arglist__10669);
      return G__10668__delegate(x, p__10657)
    };
    G__10668.cljs$lang$arity$variadic = G__10668__delegate;
    return G__10668
  }();
  atom = function(x, var_args) {
    var p__10657 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10673 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10673)) {
    var validate__10674 = temp__3974__auto____10673;
    if(cljs.core.truth_(validate__10674.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10675 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10675, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10676__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10676 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10676__delegate.call(this, a, f, x, y, z, more)
    };
    G__10676.cljs$lang$maxFixedArity = 5;
    G__10676.cljs$lang$applyTo = function(arglist__10677) {
      var a = cljs.core.first(arglist__10677);
      var f = cljs.core.first(cljs.core.next(arglist__10677));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10677)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10677))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10677)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10677)))));
      return G__10676__delegate(a, f, x, y, z, more)
    };
    G__10676.cljs$lang$arity$variadic = G__10676__delegate;
    return G__10676
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10678) {
    var iref = cljs.core.first(arglist__10678);
    var f = cljs.core.first(cljs.core.next(arglist__10678));
    var args = cljs.core.rest(cljs.core.next(arglist__10678));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10679 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10679.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10680 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10680.state, function(p__10681) {
    var map__10682__10683 = p__10681;
    var map__10682__10684 = cljs.core.seq_QMARK_.call(null, map__10682__10683) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10682__10683) : map__10682__10683;
    var curr_state__10685 = map__10682__10684;
    var done__10686 = cljs.core._lookup.call(null, map__10682__10684, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10686)) {
      return curr_state__10685
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10680.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10707__10708 = options;
    var map__10707__10709 = cljs.core.seq_QMARK_.call(null, map__10707__10708) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10707__10708) : map__10707__10708;
    var keywordize_keys__10710 = cljs.core._lookup.call(null, map__10707__10709, "\ufdd0'keywordize-keys", null);
    var keyfn__10711 = cljs.core.truth_(keywordize_keys__10710) ? cljs.core.keyword : cljs.core.str;
    var f__10726 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2468__auto____10725 = function iter__10719(s__10720) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10720__10723 = s__10720;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10720__10723)) {
                        var k__10724 = cljs.core.first.call(null, s__10720__10723);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10711.call(null, k__10724), thisfn.call(null, x[k__10724])], true), iter__10719.call(null, cljs.core.rest.call(null, s__10720__10723)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2468__auto____10725.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10726.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10727) {
    var x = cljs.core.first(arglist__10727);
    var options = cljs.core.rest(arglist__10727);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10732 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10736__delegate = function(args) {
      var temp__3971__auto____10733 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10732), args, null);
      if(cljs.core.truth_(temp__3971__auto____10733)) {
        var v__10734 = temp__3971__auto____10733;
        return v__10734
      }else {
        var ret__10735 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10732, cljs.core.assoc, args, ret__10735);
        return ret__10735
      }
    };
    var G__10736 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10736__delegate.call(this, args)
    };
    G__10736.cljs$lang$maxFixedArity = 0;
    G__10736.cljs$lang$applyTo = function(arglist__10737) {
      var args = cljs.core.seq(arglist__10737);
      return G__10736__delegate(args)
    };
    G__10736.cljs$lang$arity$variadic = G__10736__delegate;
    return G__10736
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10739 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10739)) {
        var G__10740 = ret__10739;
        f = G__10740;
        continue
      }else {
        return ret__10739
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10741__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10741 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10741__delegate.call(this, f, args)
    };
    G__10741.cljs$lang$maxFixedArity = 1;
    G__10741.cljs$lang$applyTo = function(arglist__10742) {
      var f = cljs.core.first(arglist__10742);
      var args = cljs.core.rest(arglist__10742);
      return G__10741__delegate(f, args)
    };
    G__10741.cljs$lang$arity$variadic = G__10741__delegate;
    return G__10741
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10744 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10744, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10744, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10753 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10753) {
      return or__3824__auto____10753
    }else {
      var or__3824__auto____10754 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10754) {
        return or__3824__auto____10754
      }else {
        var and__3822__auto____10755 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10755) {
          var and__3822__auto____10756 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10756) {
            var and__3822__auto____10757 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10757) {
              var ret__10758 = true;
              var i__10759 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10760 = cljs.core.not.call(null, ret__10758);
                  if(or__3824__auto____10760) {
                    return or__3824__auto____10760
                  }else {
                    return i__10759 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10758
                }else {
                  var G__10761 = isa_QMARK_.call(null, h, child.call(null, i__10759), parent.call(null, i__10759));
                  var G__10762 = i__10759 + 1;
                  ret__10758 = G__10761;
                  i__10759 = G__10762;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10757
            }
          }else {
            return and__3822__auto____10756
          }
        }else {
          return and__3822__auto____10755
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10771 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10772 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10773 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10774 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10775 = cljs.core.contains_QMARK_.call(null, tp__10771.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10773.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10773.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10771, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10774.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10772, parent, ta__10773), "\ufdd0'descendants":tf__10774.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10773, tag, td__10772)})
    }();
    if(cljs.core.truth_(or__3824__auto____10775)) {
      return or__3824__auto____10775
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10780 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10781 = cljs.core.truth_(parentMap__10780.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10780.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10782 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10781)) ? cljs.core.assoc.call(null, parentMap__10780, tag, childsParents__10781) : cljs.core.dissoc.call(null, parentMap__10780, tag);
    var deriv_seq__10783 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10763_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10763_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10763_SHARP_), cljs.core.second.call(null, p1__10763_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10782)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10780.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10764_SHARP_, p2__10765_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10764_SHARP_, p2__10765_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10783))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10791 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10793 = cljs.core.truth_(function() {
    var and__3822__auto____10792 = xprefs__10791;
    if(cljs.core.truth_(and__3822__auto____10792)) {
      return xprefs__10791.call(null, y)
    }else {
      return and__3822__auto____10792
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10793)) {
    return or__3824__auto____10793
  }else {
    var or__3824__auto____10795 = function() {
      var ps__10794 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10794) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10794), prefer_table))) {
          }else {
          }
          var G__10798 = cljs.core.rest.call(null, ps__10794);
          ps__10794 = G__10798;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10795)) {
      return or__3824__auto____10795
    }else {
      var or__3824__auto____10797 = function() {
        var ps__10796 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10796) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10796), y, prefer_table))) {
            }else {
            }
            var G__10799 = cljs.core.rest.call(null, ps__10796);
            ps__10796 = G__10799;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10797)) {
        return or__3824__auto____10797
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10801 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10801)) {
    return or__3824__auto____10801
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10819 = cljs.core.reduce.call(null, function(be, p__10811) {
    var vec__10812__10813 = p__10811;
    var k__10814 = cljs.core.nth.call(null, vec__10812__10813, 0, null);
    var ___10815 = cljs.core.nth.call(null, vec__10812__10813, 1, null);
    var e__10816 = vec__10812__10813;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10814)) {
      var be2__10818 = cljs.core.truth_(function() {
        var or__3824__auto____10817 = be == null;
        if(or__3824__auto____10817) {
          return or__3824__auto____10817
        }else {
          return cljs.core.dominates.call(null, k__10814, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10816 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10818), k__10814, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10814), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10818)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10818
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10819)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10819));
      return cljs.core.second.call(null, best_entry__10819)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10824 = mf;
    if(and__3822__auto____10824) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10824
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2369__auto____10825 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10826 = cljs.core._reset[goog.typeOf(x__2369__auto____10825)];
      if(or__3824__auto____10826) {
        return or__3824__auto____10826
      }else {
        var or__3824__auto____10827 = cljs.core._reset["_"];
        if(or__3824__auto____10827) {
          return or__3824__auto____10827
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10832 = mf;
    if(and__3822__auto____10832) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10832
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2369__auto____10833 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10834 = cljs.core._add_method[goog.typeOf(x__2369__auto____10833)];
      if(or__3824__auto____10834) {
        return or__3824__auto____10834
      }else {
        var or__3824__auto____10835 = cljs.core._add_method["_"];
        if(or__3824__auto____10835) {
          return or__3824__auto____10835
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10840 = mf;
    if(and__3822__auto____10840) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10840
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2369__auto____10841 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10842 = cljs.core._remove_method[goog.typeOf(x__2369__auto____10841)];
      if(or__3824__auto____10842) {
        return or__3824__auto____10842
      }else {
        var or__3824__auto____10843 = cljs.core._remove_method["_"];
        if(or__3824__auto____10843) {
          return or__3824__auto____10843
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10848 = mf;
    if(and__3822__auto____10848) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10848
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2369__auto____10849 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10850 = cljs.core._prefer_method[goog.typeOf(x__2369__auto____10849)];
      if(or__3824__auto____10850) {
        return or__3824__auto____10850
      }else {
        var or__3824__auto____10851 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10851) {
          return or__3824__auto____10851
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10856 = mf;
    if(and__3822__auto____10856) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10856
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2369__auto____10857 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10858 = cljs.core._get_method[goog.typeOf(x__2369__auto____10857)];
      if(or__3824__auto____10858) {
        return or__3824__auto____10858
      }else {
        var or__3824__auto____10859 = cljs.core._get_method["_"];
        if(or__3824__auto____10859) {
          return or__3824__auto____10859
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10864 = mf;
    if(and__3822__auto____10864) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10864
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2369__auto____10865 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10866 = cljs.core._methods[goog.typeOf(x__2369__auto____10865)];
      if(or__3824__auto____10866) {
        return or__3824__auto____10866
      }else {
        var or__3824__auto____10867 = cljs.core._methods["_"];
        if(or__3824__auto____10867) {
          return or__3824__auto____10867
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10872 = mf;
    if(and__3822__auto____10872) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10872
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2369__auto____10873 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10874 = cljs.core._prefers[goog.typeOf(x__2369__auto____10873)];
      if(or__3824__auto____10874) {
        return or__3824__auto____10874
      }else {
        var or__3824__auto____10875 = cljs.core._prefers["_"];
        if(or__3824__auto____10875) {
          return or__3824__auto____10875
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10880 = mf;
    if(and__3822__auto____10880) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10880
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2369__auto____10881 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10882 = cljs.core._dispatch[goog.typeOf(x__2369__auto____10881)];
      if(or__3824__auto____10882) {
        return or__3824__auto____10882
      }else {
        var or__3824__auto____10883 = cljs.core._dispatch["_"];
        if(or__3824__auto____10883) {
          return or__3824__auto____10883
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10886 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10887 = cljs.core._get_method.call(null, mf, dispatch_val__10886);
  if(cljs.core.truth_(target_fn__10887)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10886)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10887, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10888 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10889 = this;
  cljs.core.swap_BANG_.call(null, this__10889.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10889.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10889.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10889.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10890 = this;
  cljs.core.swap_BANG_.call(null, this__10890.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10890.method_cache, this__10890.method_table, this__10890.cached_hierarchy, this__10890.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10891 = this;
  cljs.core.swap_BANG_.call(null, this__10891.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10891.method_cache, this__10891.method_table, this__10891.cached_hierarchy, this__10891.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10892 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10892.cached_hierarchy), cljs.core.deref.call(null, this__10892.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10892.method_cache, this__10892.method_table, this__10892.cached_hierarchy, this__10892.hierarchy)
  }
  var temp__3971__auto____10893 = cljs.core.deref.call(null, this__10892.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10893)) {
    var target_fn__10894 = temp__3971__auto____10893;
    return target_fn__10894
  }else {
    var temp__3971__auto____10895 = cljs.core.find_and_cache_best_method.call(null, this__10892.name, dispatch_val, this__10892.hierarchy, this__10892.method_table, this__10892.prefer_table, this__10892.method_cache, this__10892.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10895)) {
      var target_fn__10896 = temp__3971__auto____10895;
      return target_fn__10896
    }else {
      return cljs.core.deref.call(null, this__10892.method_table).call(null, this__10892.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10897 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10897.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10897.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10897.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10897.method_cache, this__10897.method_table, this__10897.cached_hierarchy, this__10897.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10898 = this;
  return cljs.core.deref.call(null, this__10898.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10899 = this;
  return cljs.core.deref.call(null, this__10899.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10900 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10900.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10902__delegate = function(_, args) {
    var self__10901 = this;
    return cljs.core._dispatch.call(null, self__10901, args)
  };
  var G__10902 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10902__delegate.call(this, _, args)
  };
  G__10902.cljs$lang$maxFixedArity = 1;
  G__10902.cljs$lang$applyTo = function(arglist__10903) {
    var _ = cljs.core.first(arglist__10903);
    var args = cljs.core.rest(arglist__10903);
    return G__10902__delegate(_, args)
  };
  G__10902.cljs$lang$arity$variadic = G__10902__delegate;
  return G__10902
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10904 = this;
  return cljs.core._dispatch.call(null, self__10904, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10905 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10907, _) {
  var this__10906 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10906.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10908 = this;
  var and__3822__auto____10909 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10909) {
    return this__10908.uuid === other.uuid
  }else {
    return and__3822__auto____10909
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10910 = this;
  var this__10911 = this;
  return cljs.core.pr_str.call(null, this__10911)
};
cljs.core.UUID;
goog.provide("reflex.core");
goog.require("cljs.core");
reflex.core.capture_derefed = function capture_derefed(f) {
  var _BANG_recently_derefed11624__11625 = reflex.core._BANG_recently_derefed;
  try {
    reflex.core._BANG_recently_derefed = cljs.core.atom.call(null, cljs.core.PersistentHashSet.EMPTY, "\ufdd0'meta", cljs.core.ObjMap.fromObject(["\ufdd0'no-deref-monitor"], {"\ufdd0'no-deref-monitor":true}));
    var res__11627 = f.call(null);
    return cljs.core.ObjMap.fromObject(["\ufdd0'res", "\ufdd0'derefed"], {"\ufdd0'res":res__11627, "\ufdd0'derefed":cljs.core.deref.call(null, reflex.core._BANG_recently_derefed)})
  }finally {
    reflex.core._BANG_recently_derefed = _BANG_recently_derefed11624__11625
  }
};
reflex.core.notify_deref_watcher_BANG_ = function notify_deref_watcher_BANG_(derefable) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____11629 = reflex.core._BANG_recently_derefed;
    if(cljs.core.truth_(and__3822__auto____11629)) {
      return cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'no-deref-monitor")).call(null, cljs.core.meta.call(null, derefable)))
    }else {
      return and__3822__auto____11629
    }
  }())) {
    return cljs.core.swap_BANG_.call(null, reflex.core._BANG_recently_derefed, function(p1__11619_SHARP_) {
      return cljs.core.conj.call(null, p1__11619_SHARP_, derefable)
    })
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  reflex.core.notify_deref_watcher_BANG_.call(null, this$);
  return this$.state
};
reflex.core.IDisposable = {};
reflex.core.dispose_BANG_ = function dispose_BANG_(this$) {
  if(function() {
    var and__3822__auto____11634 = this$;
    if(and__3822__auto____11634) {
      return this$.reflex$core$IDisposable$dispose_BANG_$arity$1
    }else {
      return and__3822__auto____11634
    }
  }()) {
    return this$.reflex$core$IDisposable$dispose_BANG_$arity$1(this$)
  }else {
    var x__2369__auto____11635 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11636 = reflex.core.dispose_BANG_[goog.typeOf(x__2369__auto____11635)];
      if(or__3824__auto____11636) {
        return or__3824__auto____11636
      }else {
        var or__3824__auto____11637 = reflex.core.dispose_BANG_["_"];
        if(or__3824__auto____11637) {
          return or__3824__auto____11637
        }else {
          throw cljs.core.missing_protocol.call(null, "IDisposable.dispose!", this$);
        }
      }
    }().call(null, this$)
  }
};
reflex.core.ComputedObservable = function(state, dirty_QMARK_, f, key, parent_watchables, watches, __meta, __extmap) {
  this.state = state;
  this.dirty_QMARK_ = dirty_QMARK_;
  this.f = f;
  this.key = key;
  this.parent_watchables = parent_watchables;
  this.watches = watches;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2766571274;
  if(arguments.length > 6) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2324__auto__) {
  var this__11641 = this;
  var h__2198__auto____11642 = this__11641.__hash;
  if(!(h__2198__auto____11642 == null)) {
    return h__2198__auto____11642
  }else {
    var h__2198__auto____11643 = cljs.core.hash_imap.call(null, this__2324__auto__);
    this__11641.__hash = h__2198__auto____11643;
    return h__2198__auto____11643
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2329__auto__, k__2330__auto__) {
  var this__11644 = this;
  return this__2329__auto__.cljs$core$ILookup$_lookup$arity$3(this__2329__auto__, k__2330__auto__, null)
};
reflex.core.ComputedObservable.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2331__auto__, k11639, else__2332__auto__) {
  var this__11645 = this;
  if(k11639 === "\ufdd0'state") {
    return this__11645.state
  }else {
    if(k11639 === "\ufdd0'dirty?") {
      return this__11645.dirty_QMARK_
    }else {
      if(k11639 === "\ufdd0'f") {
        return this__11645.f
      }else {
        if(k11639 === "\ufdd0'key") {
          return this__11645.key
        }else {
          if(k11639 === "\ufdd0'parent-watchables") {
            return this__11645.parent_watchables
          }else {
            if(k11639 === "\ufdd0'watches") {
              return this__11645.watches
            }else {
              if("\ufdd0'else") {
                return cljs.core._lookup.call(null, this__11645.__extmap, k11639, else__2332__auto__)
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2336__auto__, k__2337__auto__, G__11638) {
  var this__11646 = this;
  var pred__11647__11650 = cljs.core.identical_QMARK_;
  var expr__11648__11651 = k__2337__auto__;
  if(pred__11647__11650.call(null, "\ufdd0'state", expr__11648__11651)) {
    return new reflex.core.ComputedObservable(G__11638, this__11646.dirty_QMARK_, this__11646.f, this__11646.key, this__11646.parent_watchables, this__11646.watches, this__11646.__meta, this__11646.__extmap, null)
  }else {
    if(pred__11647__11650.call(null, "\ufdd0'dirty?", expr__11648__11651)) {
      return new reflex.core.ComputedObservable(this__11646.state, G__11638, this__11646.f, this__11646.key, this__11646.parent_watchables, this__11646.watches, this__11646.__meta, this__11646.__extmap, null)
    }else {
      if(pred__11647__11650.call(null, "\ufdd0'f", expr__11648__11651)) {
        return new reflex.core.ComputedObservable(this__11646.state, this__11646.dirty_QMARK_, G__11638, this__11646.key, this__11646.parent_watchables, this__11646.watches, this__11646.__meta, this__11646.__extmap, null)
      }else {
        if(pred__11647__11650.call(null, "\ufdd0'key", expr__11648__11651)) {
          return new reflex.core.ComputedObservable(this__11646.state, this__11646.dirty_QMARK_, this__11646.f, G__11638, this__11646.parent_watchables, this__11646.watches, this__11646.__meta, this__11646.__extmap, null)
        }else {
          if(pred__11647__11650.call(null, "\ufdd0'parent-watchables", expr__11648__11651)) {
            return new reflex.core.ComputedObservable(this__11646.state, this__11646.dirty_QMARK_, this__11646.f, this__11646.key, G__11638, this__11646.watches, this__11646.__meta, this__11646.__extmap, null)
          }else {
            if(pred__11647__11650.call(null, "\ufdd0'watches", expr__11648__11651)) {
              return new reflex.core.ComputedObservable(this__11646.state, this__11646.dirty_QMARK_, this__11646.f, this__11646.key, this__11646.parent_watchables, G__11638, this__11646.__meta, this__11646.__extmap, null)
            }else {
              return new reflex.core.ComputedObservable(this__11646.state, this__11646.dirty_QMARK_, this__11646.f, this__11646.key, this__11646.parent_watchables, this__11646.watches, this__11646.__meta, cljs.core.assoc.call(null, this__11646.__extmap, k__2337__auto__, G__11638), null)
            }
          }
        }
      }
    }
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var this__11652 = this;
  reflex.core.notify_deref_watcher_BANG_.call(null, this$);
  if(cljs.core.not.call(null, this__11652.dirty_QMARK_)) {
    return this$.state
  }else {
    var map__11653__11654 = reflex.core.capture_derefed.call(null, this__11652.f);
    var map__11653__11655 = cljs.core.seq_QMARK_.call(null, map__11653__11654) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11653__11654) : map__11653__11654;
    var derefed__11656 = cljs.core._lookup.call(null, map__11653__11655, "\ufdd0'derefed", null);
    var res__11657 = cljs.core._lookup.call(null, map__11653__11655, "\ufdd0'res", null);
    var G__11658__11659 = cljs.core.seq.call(null, this__11652.parent_watchables);
    if(G__11658__11659) {
      var w__11660 = cljs.core.first.call(null, G__11658__11659);
      var G__11658__11661 = G__11658__11659;
      while(true) {
        cljs.core.remove_watch.call(null, w__11660, this__11652.key);
        var temp__3974__auto____11662 = cljs.core.next.call(null, G__11658__11661);
        if(temp__3974__auto____11662) {
          var G__11658__11663 = temp__3974__auto____11662;
          var G__11711 = cljs.core.first.call(null, G__11658__11663);
          var G__11712 = G__11658__11663;
          w__11660 = G__11711;
          G__11658__11661 = G__11712;
          continue
        }else {
        }
        break
      }
    }else {
    }
    this$.parent_watchables = derefed__11656;
    var G__11664__11665 = cljs.core.seq.call(null, derefed__11656);
    if(G__11664__11665) {
      var w__11666 = cljs.core.first.call(null, G__11664__11665);
      var G__11664__11667 = G__11664__11665;
      while(true) {
        cljs.core.add_watch.call(null, w__11666, this__11652.key, function(w__11666, G__11664__11667) {
          return function() {
            this$.dirty_QMARK_ = true;
            return cljs.core._notify_watches.call(null, this$, null, null)
          }
        }(w__11666, G__11664__11667));
        var temp__3974__auto____11668 = cljs.core.next.call(null, G__11664__11667);
        if(temp__3974__auto____11668) {
          var G__11664__11669 = temp__3974__auto____11668;
          var G__11713 = cljs.core.first.call(null, G__11664__11669);
          var G__11714 = G__11664__11669;
          w__11666 = G__11713;
          G__11664__11667 = G__11714;
          continue
        }else {
        }
        break
      }
    }else {
    }
    this$.state = res__11657;
    this$.dirty_QMARK_ = false;
    return res__11657
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2334__auto__, entry__2335__auto__) {
  var this__11670 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2335__auto__)) {
    return this__2334__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2334__auto__, cljs.core._nth.call(null, entry__2335__auto__, 0), cljs.core._nth.call(null, entry__2335__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2334__auto__, entry__2335__auto__)
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, _11672, _) {
  var this__11671 = this;
  var G__11673__11674 = cljs.core.seq.call(null, this__11671.watches);
  if(G__11673__11674) {
    var G__11676__11678 = cljs.core.first.call(null, G__11673__11674);
    var vec__11677__11679 = G__11676__11678;
    var key__11680 = cljs.core.nth.call(null, vec__11677__11679, 0, null);
    var wf__11681 = cljs.core.nth.call(null, vec__11677__11679, 1, null);
    var G__11673__11682 = G__11673__11674;
    var G__11676__11683 = G__11676__11678;
    var G__11673__11684 = G__11673__11682;
    while(true) {
      var vec__11685__11686 = G__11676__11683;
      var key__11687 = cljs.core.nth.call(null, vec__11685__11686, 0, null);
      var wf__11688 = cljs.core.nth.call(null, vec__11685__11686, 1, null);
      var G__11673__11689 = G__11673__11684;
      wf__11688.call(null);
      var temp__3974__auto____11690 = cljs.core.next.call(null, G__11673__11689);
      if(temp__3974__auto____11690) {
        var G__11673__11691 = temp__3974__auto____11690;
        var G__11715 = cljs.core.first.call(null, G__11673__11691);
        var G__11716 = G__11673__11691;
        G__11676__11683 = G__11715;
        G__11673__11684 = G__11716;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, wf) {
  var this__11692 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11692.watches, key, wf)
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11693 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11693.watches, key)
};
reflex.core.ComputedObservable.prototype.reflex$core$IDisposable$ = true;
reflex.core.ComputedObservable.prototype.reflex$core$IDisposable$dispose_BANG_$arity$1 = function(this$) {
  var this__11694 = this;
  var G__11695__11696 = cljs.core.seq.call(null, this__11694.parent_watchables);
  if(G__11695__11696) {
    var w__11697 = cljs.core.first.call(null, G__11695__11696);
    var G__11695__11698 = G__11695__11696;
    while(true) {
      cljs.core.remove_watch.call(null, w__11697, this__11694.key);
      var temp__3974__auto____11699 = cljs.core.next.call(null, G__11695__11698);
      if(temp__3974__auto____11699) {
        var G__11695__11700 = temp__3974__auto____11699;
        var G__11717 = cljs.core.first.call(null, G__11695__11700);
        var G__11718 = G__11695__11700;
        w__11697 = G__11717;
        G__11695__11698 = G__11718;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return this$.watches = null
};
reflex.core.ComputedObservable.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2341__auto__) {
  var this__11701 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'state", this__11701.state), cljs.core.vector.call(null, "\ufdd0'dirty?", this__11701.dirty_QMARK_), cljs.core.vector.call(null, "\ufdd0'f", this__11701.f), cljs.core.vector.call(null, "\ufdd0'key", this__11701.key), cljs.core.vector.call(null, "\ufdd0'parent-watchables", this__11701.parent_watchables), cljs.core.vector.call(null, "\ufdd0'watches", this__11701.watches)], 
  true), this__11701.__extmap))
};
reflex.core.ComputedObservable.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2343__auto__, opts__2344__auto__) {
  var this__11702 = this;
  var pr_pair__2345__auto____11703 = function(keyval__2346__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2344__auto__, keyval__2346__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2345__auto____11703, [cljs.core.str("#"), cljs.core.str("ComputedObservable"), cljs.core.str("{")].join(""), ", ", "}", opts__2344__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'state", this__11702.state), cljs.core.vector.call(null, "\ufdd0'dirty?", this__11702.dirty_QMARK_), cljs.core.vector.call(null, "\ufdd0'f", this__11702.f), cljs.core.vector.call(null, "\ufdd0'key", this__11702.key), 
  cljs.core.vector.call(null, "\ufdd0'parent-watchables", this__11702.parent_watchables), cljs.core.vector.call(null, "\ufdd0'watches", this__11702.watches)], true), this__11702.__extmap))
};
reflex.core.ComputedObservable.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2333__auto__) {
  var this__11704 = this;
  return 6 + cljs.core.count.call(null, this__11704.__extmap)
};
reflex.core.ComputedObservable.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2325__auto__, other__2326__auto__) {
  var this__11705 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____11706 = other__2326__auto__;
    if(cljs.core.truth_(and__3822__auto____11706)) {
      var and__3822__auto____11707 = this__2325__auto__.constructor === other__2326__auto__.constructor;
      if(and__3822__auto____11707) {
        return cljs.core.equiv_map.call(null, this__2325__auto__, other__2326__auto__)
      }else {
        return and__3822__auto____11707
      }
    }else {
      return and__3822__auto____11706
    }
  }())) {
    return true
  }else {
    return false
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2328__auto__, G__11638) {
  var this__11708 = this;
  return new reflex.core.ComputedObservable(this__11708.state, this__11708.dirty_QMARK_, this__11708.f, this__11708.key, this__11708.parent_watchables, this__11708.watches, G__11638, this__11708.__extmap, this__11708.__hash)
};
reflex.core.ComputedObservable.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2327__auto__) {
  var this__11709 = this;
  return this__11709.__meta
};
reflex.core.ComputedObservable.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2338__auto__, k__2339__auto__) {
  var this__11710 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'dirty?", "\ufdd0'state", "\ufdd0'key", "\ufdd0'f", "\ufdd0'watches", "\ufdd0'parent-watchables"]), k__2339__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2338__auto__), this__11710.__meta), k__2339__auto__)
  }else {
    return new reflex.core.ComputedObservable(this__11710.state, this__11710.dirty_QMARK_, this__11710.f, this__11710.key, this__11710.parent_watchables, this__11710.watches, this__11710.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__11710.__extmap, k__2339__auto__)), null)
  }
};
reflex.core.ComputedObservable.cljs$lang$type = true;
reflex.core.ComputedObservable.cljs$lang$ctorPrSeq = function(this__2363__auto__) {
  return cljs.core.list.call(null, "reflex.core/ComputedObservable")
};
reflex.core.__GT_ComputedObservable = function __GT_ComputedObservable(state, dirty_QMARK_, f, key, parent_watchables, watches) {
  return new reflex.core.ComputedObservable(state, dirty_QMARK_, f, key, parent_watchables, watches)
};
reflex.core.map__GT_ComputedObservable = function map__GT_ComputedObservable(G__11640) {
  return new reflex.core.ComputedObservable((new cljs.core.Keyword("\ufdd0'state")).call(null, G__11640), (new cljs.core.Keyword("\ufdd0'dirty?")).call(null, G__11640), (new cljs.core.Keyword("\ufdd0'f")).call(null, G__11640), (new cljs.core.Keyword("\ufdd0'key")).call(null, G__11640), (new cljs.core.Keyword("\ufdd0'parent-watchables")).call(null, G__11640), (new cljs.core.Keyword("\ufdd0'watches")).call(null, G__11640), null, cljs.core.dissoc.call(null, G__11640, "\ufdd0'state", "\ufdd0'dirty?", 
  "\ufdd0'f", "\ufdd0'key", "\ufdd0'parent-watchables", "\ufdd0'watches"))
};
reflex.core.ComputedObservable;
reflex.core.ComputedObservable.prototype.cljs$core$IHash$ = true;
reflex.core.ComputedObservable.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  return this$.key
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____6958 = this$;
    if(and__3822__auto____6958) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____6958
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2369__auto____6959 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6960 = clojure.browser.event.event_types[goog.typeOf(x__2369__auto____6959)];
      if(or__3824__auto____6960) {
        return or__3824__auto____6960
      }else {
        var or__3824__auto____6961 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____6961) {
          return or__3824__auto____6961
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6962) {
    var vec__6963__6964 = p__6962;
    var k__6965 = cljs.core.nth.call(null, vec__6963__6964, 0, null);
    var v__6966 = cljs.core.nth.call(null, vec__6963__6964, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6965.toLowerCase()), v__6966], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6967) {
    var vec__6968__6969 = p__6967;
    var k__6970 = cljs.core.nth.call(null, vec__6968__6969, 0, null);
    var v__6971 = cljs.core.nth.call(null, vec__6968__6969, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6970.toLowerCase()), v__6971], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.browser.dom");
goog.require("cljs.core");
goog.require("goog.object");
goog.require("goog.dom");
clojure.browser.dom.append = function() {
  var append__delegate = function(parent, children) {
    cljs.core.apply.call(null, goog.dom.append, parent, children);
    return parent
  };
  var append = function(parent, var_args) {
    var children = null;
    if(goog.isDef(var_args)) {
      children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return append__delegate.call(this, parent, children)
  };
  append.cljs$lang$maxFixedArity = 1;
  append.cljs$lang$applyTo = function(arglist__10912) {
    var parent = cljs.core.first(arglist__10912);
    var children = cljs.core.rest(arglist__10912);
    return append__delegate(parent, children)
  };
  append.cljs$lang$arity$variadic = append__delegate;
  return append
}();
clojure.browser.dom.DOMBuilder = {};
clojure.browser.dom._element = function() {
  var _element = null;
  var _element__1 = function(this$) {
    if(function() {
      var and__3822__auto____10925 = this$;
      if(and__3822__auto____10925) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____10925
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2369__auto____10926 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10927 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____10926)];
        if(or__3824__auto____10927) {
          return or__3824__auto____10927
        }else {
          var or__3824__auto____10928 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10928) {
            return or__3824__auto____10928
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____10929 = this$;
      if(and__3822__auto____10929) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____10929
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2369__auto____10930 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10931 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____10930)];
        if(or__3824__auto____10931) {
          return or__3824__auto____10931
        }else {
          var or__3824__auto____10932 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10932) {
            return or__3824__auto____10932
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____10933 = this$;
      if(and__3822__auto____10933) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____10933
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2369__auto____10934 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10935 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____10934)];
        if(or__3824__auto____10935) {
          return or__3824__auto____10935
        }else {
          var or__3824__auto____10936 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10936) {
            return or__3824__auto____10936
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs, children)
    }
  };
  _element = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return _element__1.call(this, this$);
      case 2:
        return _element__2.call(this, this$, attrs);
      case 3:
        return _element__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _element.cljs$lang$arity$1 = _element__1;
  _element.cljs$lang$arity$2 = _element__2;
  _element.cljs$lang$arity$3 = _element__3;
  return _element
}();
clojure.browser.dom.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.call(null, cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10937) {
    var args = cljs.core.seq(arglist__10937);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
clojure.browser.dom.log_obj = function log_obj(obj) {
  return console.log(obj)
};
Element.prototype.clojure$browser$dom$DOMBuilder$ = true;
Element.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "js/Element (-element ", this$, ")");
  return this$
};
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$ = true;
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "PersistentVector (-element ", this$, ")");
  var tag__10938 = cljs.core.first.call(null, this$);
  var attrs__10939 = cljs.core.second.call(null, this$);
  var children__10940 = cljs.core.drop.call(null, 2, this$);
  if(cljs.core.map_QMARK_.call(null, attrs__10939)) {
    return clojure.browser.dom._element.call(null, tag__10938, attrs__10939, children__10940)
  }else {
    return clojure.browser.dom._element.call(null, tag__10938, null, cljs.core.rest.call(null, this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__10953 = null;
  var G__10953__1 = function(this$) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, ")");
    if(cljs.core.keyword_QMARK_.call(null, this$)) {
      return goog.dom.createElement(cljs.core.name.call(null, this$))
    }else {
      if("\ufdd0'else") {
        return goog.dom.createTextNode(cljs.core.name.call(null, this$))
      }else {
        return null
      }
    }
  };
  var G__10953__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs_or_children, ")");
    var attrs__10941 = cljs.core.first.call(null, attrs_or_children);
    if(cljs.core.map_QMARK_.call(null, attrs__10941)) {
      return clojure.browser.dom._element.call(null, this$, attrs__10941, cljs.core.rest.call(null, attrs_or_children))
    }else {
      return clojure.browser.dom._element.call(null, this$, null, attrs_or_children)
    }
  };
  var G__10953__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs, " ", children, ")");
    var str_attrs__10952 = cljs.core.truth_(function() {
      var and__3822__auto____10942 = cljs.core.map_QMARK_.call(null, attrs);
      if(and__3822__auto____10942) {
        return cljs.core.seq.call(null, attrs)
      }else {
        return and__3822__auto____10942
      }
    }()) ? cljs.core.reduce.call(null, function(o, p__10943) {
      var vec__10944__10945 = p__10943;
      var k__10946 = cljs.core.nth.call(null, vec__10944__10945, 0, null);
      var v__10947 = cljs.core.nth.call(null, vec__10944__10945, 1, null);
      var o__10948 = o == null ? {} : o;
      clojure.browser.dom.log.call(null, "o = ", o__10948);
      clojure.browser.dom.log.call(null, "k = ", k__10946);
      clojure.browser.dom.log.call(null, "v = ", v__10947);
      if(function() {
        var or__3824__auto____10949 = cljs.core.keyword_QMARK_.call(null, k__10946);
        if(or__3824__auto____10949) {
          return or__3824__auto____10949
        }else {
          return cljs.core.string_QMARK_.call(null, k__10946)
        }
      }()) {
        var G__10950__10951 = o__10948;
        G__10950__10951[cljs.core.name.call(null, k__10946)] = v__10947;
        return G__10950__10951
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj.call(null, str_attrs__10952);
    if(cljs.core.seq.call(null, children)) {
      return cljs.core.apply.call(null, goog.dom.createDom, cljs.core.name.call(null, this$), str_attrs__10952, cljs.core.map.call(null, clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name.call(null, this$), str_attrs__10952)
    }
  };
  G__10953 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__10953__1.call(this, this$);
      case 2:
        return G__10953__2.call(this, this$, attrs);
      case 3:
        return G__10953__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10953
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.call(null, "(element ", tag_or_text, ")");
    return clojure.browser.dom._element.call(null, tag_or_text)
  };
  var element__2 = function() {
    var G__10956__delegate = function(tag, children) {
      clojure.browser.dom.log.call(null, "(element ", tag, " ", children, ")");
      var attrs__10955 = cljs.core.first.call(null, children);
      if(cljs.core.map_QMARK_.call(null, attrs__10955)) {
        return clojure.browser.dom._element.call(null, tag, attrs__10955, cljs.core.rest.call(null, children))
      }else {
        return clojure.browser.dom._element.call(null, tag, null, children)
      }
    };
    var G__10956 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10956__delegate.call(this, tag, children)
    };
    G__10956.cljs$lang$maxFixedArity = 1;
    G__10956.cljs$lang$applyTo = function(arglist__10957) {
      var tag = cljs.core.first(arglist__10957);
      var children = cljs.core.rest(arglist__10957);
      return G__10956__delegate(tag, children)
    };
    G__10956.cljs$lang$arity$variadic = G__10956__delegate;
    return G__10956
  }();
  element = function(tag, var_args) {
    var children = var_args;
    switch(arguments.length) {
      case 1:
        return element__1.call(this, tag);
      default:
        return element__2.cljs$lang$arity$variadic(tag, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  element.cljs$lang$maxFixedArity = 1;
  element.cljs$lang$applyTo = element__2.cljs$lang$applyTo;
  element.cljs$lang$arity$1 = element__1;
  element.cljs$lang$arity$variadic = element__2.cljs$lang$arity$variadic;
  return element
}();
clojure.browser.dom.remove_children = function remove_children(id) {
  var parent__10959 = goog.dom.getElement(cljs.core.name.call(null, id));
  return goog.dom.removeChildren(parent__10959)
};
clojure.browser.dom.get_element = function get_element(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
clojure.browser.dom.html__GT_dom = function html__GT_dom(s) {
  return goog.dom.htmlToDocumentFragment(s)
};
clojure.browser.dom.insert_at = function insert_at(parent, child, index) {
  return goog.dom.insertChildAt(parent, child, index)
};
clojure.browser.dom.ensure_element = function ensure_element(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return clojure.browser.dom.get_element.call(null, e)
  }else {
    if(cljs.core.string_QMARK_.call(null, e)) {
      return clojure.browser.dom.html__GT_dom.call(null, e)
    }else {
      if("\ufdd0'else") {
        return e
      }else {
        return null
      }
    }
  }
};
clojure.browser.dom.replace_node = function replace_node(old_node, new_node) {
  var old_node__10962 = clojure.browser.dom.ensure_element.call(null, old_node);
  var new_node__10963 = clojure.browser.dom.ensure_element.call(null, new_node);
  goog.dom.replaceNode(new_node__10963, old_node__10962);
  return new_node__10963
};
clojure.browser.dom.set_text = function set_text(e, s) {
  return goog.dom.setTextContent(clojure.browser.dom.ensure_element.call(null, e), s)
};
clojure.browser.dom.get_value = function get_value(e) {
  return clojure.browser.dom.ensure_element.call(null, e).value
};
clojure.browser.dom.set_properties = function set_properties(e, m) {
  return goog.dom.setProperties(clojure.browser.dom.ensure_element.call(null, e), cljs.core.apply.call(null, goog.object.create, cljs.core.interleave.call(null, cljs.core.keys.call(null, m), cljs.core.vals.call(null, m))))
};
clojure.browser.dom.set_value = function set_value(e, v) {
  return clojure.browser.dom.set_properties.call(null, e, cljs.core.ObjMap.fromObject(["value"], {"value":v}))
};
clojure.browser.dom.click_element = function click_element(e) {
  return clojure.browser.dom.ensure_element.call(null, e).click(cljs.core.List.EMPTY)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__11547 = s;
      var limit__11548 = limit;
      var parts__11549 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__11548, 1)) {
          return cljs.core.conj.call(null, parts__11549, s__11547)
        }else {
          var temp__3971__auto____11550 = cljs.core.re_find.call(null, re, s__11547);
          if(cljs.core.truth_(temp__3971__auto____11550)) {
            var m__11551 = temp__3971__auto____11550;
            var index__11552 = s__11547.indexOf(m__11551);
            var G__11553 = s__11547.substring(index__11552 + cljs.core.count.call(null, m__11551));
            var G__11554 = limit__11548 - 1;
            var G__11555 = cljs.core.conj.call(null, parts__11549, s__11547.substring(0, index__11552));
            s__11547 = G__11553;
            limit__11548 = G__11554;
            parts__11549 = G__11555;
            continue
          }else {
            return cljs.core.conj.call(null, parts__11549, s__11547)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__11559 = s.length;
  while(true) {
    if(index__11559 === 0) {
      return""
    }else {
      var ch__11560 = cljs.core._lookup.call(null, s, index__11559 - 1, null);
      if(function() {
        var or__3824__auto____11561 = cljs.core._EQ_.call(null, ch__11560, "\n");
        if(or__3824__auto____11561) {
          return or__3824__auto____11561
        }else {
          return cljs.core._EQ_.call(null, ch__11560, "\r")
        }
      }()) {
        var G__11562 = index__11559 - 1;
        index__11559 = G__11562;
        continue
      }else {
        return s.substring(0, index__11559)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__11566 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____11567 = cljs.core.not.call(null, s__11566);
    if(or__3824__auto____11567) {
      return or__3824__auto____11567
    }else {
      var or__3824__auto____11568 = cljs.core._EQ_.call(null, "", s__11566);
      if(or__3824__auto____11568) {
        return or__3824__auto____11568
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__11566)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__11575 = new goog.string.StringBuffer;
  var length__11576 = s.length;
  var index__11577 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__11576, index__11577)) {
      return buffer__11575.toString()
    }else {
      var ch__11578 = s.charAt(index__11577);
      var temp__3971__auto____11579 = cljs.core._lookup.call(null, cmap, ch__11578, null);
      if(cljs.core.truth_(temp__3971__auto____11579)) {
        var replacement__11580 = temp__3971__auto____11579;
        buffer__11575.append([cljs.core.str(replacement__11580)].join(""))
      }else {
        buffer__11575.append(ch__11578)
      }
      var G__11581 = index__11577 + 1;
      index__11577 = G__11581;
      continue
    }
    break
  }
};
goog.provide("crate.util");
goog.require("cljs.core");
goog.require("clojure.string");
crate.util._STAR_base_url_STAR_ = null;
crate.util.as_str = function() {
  var as_str = null;
  var as_str__0 = function() {
    return""
  };
  var as_str__1 = function(x) {
    if(function() {
      var or__3824__auto____11583 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____11583) {
        return or__3824__auto____11583
      }else {
        return cljs.core.keyword_QMARK_.call(null, x)
      }
    }()) {
      return cljs.core.name.call(null, x)
    }else {
      return[cljs.core.str(x)].join("")
    }
  };
  var as_str__2 = function() {
    var G__11584__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__11585 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__11586 = cljs.core.next.call(null, more);
            s = G__11585;
            more = G__11586;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__11584 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11584__delegate.call(this, x, xs)
    };
    G__11584.cljs$lang$maxFixedArity = 1;
    G__11584.cljs$lang$applyTo = function(arglist__11587) {
      var x = cljs.core.first(arglist__11587);
      var xs = cljs.core.rest(arglist__11587);
      return G__11584__delegate(x, xs)
    };
    G__11584.cljs$lang$arity$variadic = G__11584__delegate;
    return G__11584
  }();
  as_str = function(x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 0:
        return as_str__0.call(this);
      case 1:
        return as_str__1.call(this, x);
      default:
        return as_str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  as_str.cljs$lang$maxFixedArity = 1;
  as_str.cljs$lang$applyTo = as_str__2.cljs$lang$applyTo;
  as_str.cljs$lang$arity$0 = as_str__0;
  as_str.cljs$lang$arity$1 = as_str__1;
  as_str.cljs$lang$arity$variadic = as_str__2.cljs$lang$arity$variadic;
  return as_str
}();
crate.util.escape_html = function escape_html(text) {
  return clojure.string.replace.call(null, clojure.string.replace.call(null, clojure.string.replace.call(null, clojure.string.replace.call(null, crate.util.as_str.call(null, text), "&", "&amp;"), "<", "&lt;"), ">", "&gt;"), '"', "&quot;")
};
crate.util.to_uri = function to_uri(uri) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, /^\w+:.*/, uri))) {
    return uri
  }else {
    return[cljs.core.str(crate.util._STAR_base_url_STAR_), cljs.core.str(uri)].join("")
  }
};
crate.util.url_encode_component = function url_encode_component(s) {
  return encodeURIComponent(crate.util.as_str.call(null, s))
};
crate.util.url_encode = function url_encode(params) {
  return clojure.string.join.call(null, "&", function() {
    var iter__2468__auto____11613 = function iter__11601(s__11602) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__11602__11608 = s__11602;
        while(true) {
          if(cljs.core.seq.call(null, s__11602__11608)) {
            var vec__11609__11610 = cljs.core.first.call(null, s__11602__11608);
            var k__11611 = cljs.core.nth.call(null, vec__11609__11610, 0, null);
            var v__11612 = cljs.core.nth.call(null, vec__11609__11610, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__11611)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__11612))].join(""), iter__11601.call(null, cljs.core.rest.call(null, s__11602__11608)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2468__auto____11613.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__11616 = cljs.core.last.call(null, args);
    var args__11617 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__11617)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__11616) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__11616))].join("") : params__11616)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__11618) {
    var args = cljs.core.seq(arglist__11618);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max__11461 = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max__11461, cljs.core.remove.call(null, function(p1__11459_SHARP_) {
    return max__11461 === p1__11459_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__11465__delegate = function(s1, s2, sets) {
      var bubbled_sets__11464 = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets__11464), cljs.core.rest.call(null, bubbled_sets__11464))
    };
    var G__11465 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11465__delegate.call(this, s1, s2, sets)
    };
    G__11465.cljs$lang$maxFixedArity = 2;
    G__11465.cljs$lang$applyTo = function(arglist__11466) {
      var s1 = cljs.core.first(arglist__11466);
      var s2 = cljs.core.first(cljs.core.next(arglist__11466));
      var sets = cljs.core.rest(cljs.core.next(arglist__11466));
      return G__11465__delegate(s1, s2, sets)
    };
    G__11465.cljs$lang$arity$variadic = G__11465__delegate;
    return G__11465
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$lang$arity$0 = union__0;
  union.cljs$lang$arity$1 = union__1;
  union.cljs$lang$arity$2 = union__2;
  union.cljs$lang$arity$variadic = union__3.cljs$lang$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__11469 = s2;
        var G__11470 = s1;
        s1 = G__11469;
        s2 = G__11470;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__11471__delegate = function(s1, s2, sets) {
      var bubbled_sets__11468 = clojure.set.bubble_max_key.call(null, function(p1__11462_SHARP_) {
        return-cljs.core.count.call(null, p1__11462_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets__11468), cljs.core.rest.call(null, bubbled_sets__11468))
    };
    var G__11471 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11471__delegate.call(this, s1, s2, sets)
    };
    G__11471.cljs$lang$maxFixedArity = 2;
    G__11471.cljs$lang$applyTo = function(arglist__11472) {
      var s1 = cljs.core.first(arglist__11472);
      var s2 = cljs.core.first(cljs.core.next(arglist__11472));
      var sets = cljs.core.rest(cljs.core.next(arglist__11472));
      return G__11471__delegate(s1, s2, sets)
    };
    G__11471.cljs$lang$arity$variadic = G__11471__delegate;
    return G__11471
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$lang$arity$1 = intersection__1;
  intersection.cljs$lang$arity$2 = intersection__2;
  intersection.cljs$lang$arity$variadic = intersection__3.cljs$lang$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__11473__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__11473 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11473__delegate.call(this, s1, s2, sets)
    };
    G__11473.cljs$lang$maxFixedArity = 2;
    G__11473.cljs$lang$applyTo = function(arglist__11474) {
      var s1 = cljs.core.first(arglist__11474);
      var s2 = cljs.core.first(cljs.core.next(arglist__11474));
      var sets = cljs.core.rest(cljs.core.next(arglist__11474));
      return G__11473__delegate(s1, s2, sets)
    };
    G__11473.cljs$lang$arity$variadic = G__11473__delegate;
    return G__11473
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$lang$arity$1 = difference__1;
  difference.cljs$lang$arity$2 = difference__2;
  difference.cljs$lang$arity$variadic = difference__3.cljs$lang$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__11475_SHARP_) {
    return cljs.core.select_keys.call(null, p1__11475_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__11483) {
    var vec__11484__11485 = p__11483;
    var old__11486 = cljs.core.nth.call(null, vec__11484__11485, 0, null);
    var new__11487 = cljs.core.nth.call(null, vec__11484__11485, 1, null);
    if(function() {
      var and__3822__auto____11488 = cljs.core.not_EQ_.call(null, old__11486, new__11487);
      if(and__3822__auto____11488) {
        return cljs.core.contains_QMARK_.call(null, m, old__11486)
      }else {
        return and__3822__auto____11488
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new__11487, cljs.core._lookup.call(null, m, old__11486, null)), old__11486)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__11476_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__11476_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik__11490 = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik__11490, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik__11490, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m, p__11500) {
    var vec__11501__11502 = p__11500;
    var k__11503 = cljs.core.nth.call(null, vec__11501__11502, 0, null);
    var v__11504 = cljs.core.nth.call(null, vec__11501__11502, 1, null);
    return cljs.core.assoc.call(null, m, v__11504, k__11503)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto____11521 = cljs.core.seq.call(null, xrel);
      if(and__3822__auto____11521) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto____11521
      }
    }()) {
      var ks__11523 = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__11522__11524 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r__11525 = cljs.core.nth.call(null, vec__11522__11524, 0, null);
      var s__11526 = cljs.core.nth.call(null, vec__11522__11524, 1, null);
      var idx__11527 = clojure.set.index.call(null, r__11525, ks__11523);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found__11528 = idx__11527.call(null, cljs.core.select_keys.call(null, x, ks__11523));
        if(cljs.core.truth_(found__11528)) {
          return cljs.core.reduce.call(null, function(p1__11491_SHARP_, p2__11492_SHARP_) {
            return cljs.core.conj.call(null, p1__11491_SHARP_, cljs.core.merge.call(null, p2__11492_SHARP_, x))
          }, ret, found__11528)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s__11526)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__11529__11530 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r__11531 = cljs.core.nth.call(null, vec__11529__11530, 0, null);
    var s__11532 = cljs.core.nth.call(null, vec__11529__11530, 1, null);
    var k__11533 = cljs.core.nth.call(null, vec__11529__11530, 2, null);
    var idx__11534 = clojure.set.index.call(null, r__11531, cljs.core.vals.call(null, k__11533));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found__11535 = idx__11534.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k__11533)), k__11533));
      if(cljs.core.truth_(found__11535)) {
        return cljs.core.reduce.call(null, function(p1__11493_SHARP_, p2__11494_SHARP_) {
          return cljs.core.conj.call(null, p1__11493_SHARP_, cljs.core.merge.call(null, p2__11494_SHARP_, x))
        }, ret, found__11535)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s__11532)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$2 = join__2;
  join.cljs$lang$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3822__auto____11538 = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto____11538) {
    return cljs.core.every_QMARK_.call(null, function(p1__11505_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__11505_SHARP_)
    }, set1)
  }else {
    return and__3822__auto____11538
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto____11540 = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto____11540) {
    return cljs.core.every_QMARK_.call(null, function(p1__11536_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__11536_SHARP_)
    }, set2)
  }else {
    return and__3822__auto____11540
  }
};
goog.provide("crate.binding");
goog.require("cljs.core");
goog.require("clojure.set");
crate.binding.SubAtom = function(atm, path, prevhash, watches) {
  this.atm = atm;
  this.path = path;
  this.prevhash = prevhash;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690678784
};
crate.binding.SubAtom.cljs$lang$type = true;
crate.binding.SubAtom.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "crate.binding/SubAtom")
};
crate.binding.SubAtom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11230 = this;
  return goog.getUid(this$)
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11231 = this;
  var G__11232__11233 = cljs.core.seq.call(null, this__11231.watches);
  if(G__11232__11233) {
    var G__11235__11237 = cljs.core.first.call(null, G__11232__11233);
    var vec__11236__11238 = G__11235__11237;
    var key__11239 = cljs.core.nth.call(null, vec__11236__11238, 0, null);
    var f__11240 = cljs.core.nth.call(null, vec__11236__11238, 1, null);
    var G__11232__11241 = G__11232__11233;
    var G__11235__11242 = G__11235__11237;
    var G__11232__11243 = G__11232__11241;
    while(true) {
      var vec__11244__11245 = G__11235__11242;
      var key__11246 = cljs.core.nth.call(null, vec__11244__11245, 0, null);
      var f__11247 = cljs.core.nth.call(null, vec__11244__11245, 1, null);
      var G__11232__11248 = G__11232__11243;
      f__11247.call(null, key__11246, this$, oldval, newval);
      var temp__3974__auto____11249 = cljs.core.next.call(null, G__11232__11248);
      if(temp__3974__auto____11249) {
        var G__11232__11250 = temp__3974__auto____11249;
        var G__11256 = cljs.core.first.call(null, G__11232__11250);
        var G__11257 = G__11232__11250;
        G__11235__11242 = G__11256;
        G__11232__11243 = G__11257;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11251 = this;
  if(cljs.core.truth_(f)) {
    return this$.watches = cljs.core.assoc.call(null, this__11251.watches, key, f)
  }else {
    return null
  }
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11252 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11252.watches, key)
};
crate.binding.SubAtom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11253 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<SubAtom: "], true), cljs.core._pr_seq.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, this__11253.atm), this__11253.path), opts), ">")
};
crate.binding.SubAtom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11254 = this;
  return cljs.core.get_in.call(null, cljs.core.deref.call(null, this__11254.atm), this__11254.path)
};
crate.binding.SubAtom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11255 = this;
  return o === other
};
crate.binding.SubAtom;
crate.binding.subatom = function subatom(atm, path) {
  var path__11271 = cljs.core.coll_QMARK_.call(null, path) ? path : cljs.core.PersistentVector.fromArray([path], true);
  var vec__11270__11272 = cljs.core.instance_QMARK_.call(null, crate.binding.SubAtom, atm) ? cljs.core.PersistentVector.fromArray([atm.atm, cljs.core.concat.call(null, atm.path, path__11271)], true) : cljs.core.PersistentVector.fromArray([atm, path__11271], true);
  var atm__11273 = cljs.core.nth.call(null, vec__11270__11272, 0, null);
  var path__11274 = cljs.core.nth.call(null, vec__11270__11272, 1, null);
  var k__11275 = cljs.core.gensym.call(null, "subatom");
  var sa__11276 = new crate.binding.SubAtom(atm__11273, path__11274, cljs.core.hash.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, atm__11273), path__11274)), null);
  cljs.core.add_watch.call(null, atm__11273, k__11275, function(_11277, _, ov, nv) {
    var latest__11278 = cljs.core.get_in.call(null, nv, path__11274);
    var prev__11279 = cljs.core.get_in.call(null, ov, path__11274);
    var latest_hash__11280 = cljs.core.hash.call(null, latest__11278);
    if(function() {
      var and__3822__auto____11281 = cljs.core.not_EQ_.call(null, sa__11276.prevhash, latest_hash__11280);
      if(and__3822__auto____11281) {
        return cljs.core.not_EQ_.call(null, prev__11279, latest__11278)
      }else {
        return and__3822__auto____11281
      }
    }()) {
      sa__11276.prevhash = latest_hash__11280;
      return cljs.core._notify_watches.call(null, sa__11276, cljs.core.get_in.call(null, ov, path__11274), latest__11278)
    }else {
      return null
    }
  });
  return sa__11276
};
crate.binding.sub_reset_BANG_ = function sub_reset_BANG_(sa, new_value) {
  cljs.core.swap_BANG_.call(null, sa.atm, cljs.core.assoc_in, sa.path, new_value);
  return new_value
};
crate.binding.sub_swap_BANG_ = function() {
  var sub_swap_BANG_ = null;
  var sub_swap_BANG___2 = function(sa, f) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa)))
  };
  var sub_swap_BANG___3 = function(sa, f, x) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x))
  };
  var sub_swap_BANG___4 = function(sa, f, x, y) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x, y))
  };
  var sub_swap_BANG___5 = function(sa, f, x, y, z) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x, y, z))
  };
  var sub_swap_BANG___6 = function() {
    var G__11282__delegate = function(sa, f, x, y, z, more) {
      return crate.binding.sub_reset_BANG_.call(null, sa, cljs.core.apply.call(null, f, cljs.core.deref.call(null, sa), x, y, z, more))
    };
    var G__11282 = function(sa, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11282__delegate.call(this, sa, f, x, y, z, more)
    };
    G__11282.cljs$lang$maxFixedArity = 5;
    G__11282.cljs$lang$applyTo = function(arglist__11283) {
      var sa = cljs.core.first(arglist__11283);
      var f = cljs.core.first(cljs.core.next(arglist__11283));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11283)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11283))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11283)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11283)))));
      return G__11282__delegate(sa, f, x, y, z, more)
    };
    G__11282.cljs$lang$arity$variadic = G__11282__delegate;
    return G__11282
  }();
  sub_swap_BANG_ = function(sa, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return sub_swap_BANG___2.call(this, sa, f);
      case 3:
        return sub_swap_BANG___3.call(this, sa, f, x);
      case 4:
        return sub_swap_BANG___4.call(this, sa, f, x, y);
      case 5:
        return sub_swap_BANG___5.call(this, sa, f, x, y, z);
      default:
        return sub_swap_BANG___6.cljs$lang$arity$variadic(sa, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  sub_swap_BANG_.cljs$lang$maxFixedArity = 5;
  sub_swap_BANG_.cljs$lang$applyTo = sub_swap_BANG___6.cljs$lang$applyTo;
  sub_swap_BANG_.cljs$lang$arity$2 = sub_swap_BANG___2;
  sub_swap_BANG_.cljs$lang$arity$3 = sub_swap_BANG___3;
  sub_swap_BANG_.cljs$lang$arity$4 = sub_swap_BANG___4;
  sub_swap_BANG_.cljs$lang$arity$5 = sub_swap_BANG___5;
  sub_swap_BANG_.cljs$lang$arity$variadic = sub_swap_BANG___6.cljs$lang$arity$variadic;
  return sub_swap_BANG_
}();
crate.binding.notify = function notify(w, o, v) {
  return cljs.core._notify_watches.call(null, w, o, v)
};
crate.binding.bindable_coll = {};
crate.binding.bindable = {};
crate.binding._value = function _value(this$) {
  if(function() {
    var and__3822__auto____11288 = this$;
    if(and__3822__auto____11288) {
      return this$.crate$binding$bindable$_value$arity$1
    }else {
      return and__3822__auto____11288
    }
  }()) {
    return this$.crate$binding$bindable$_value$arity$1(this$)
  }else {
    var x__2369__auto____11289 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11290 = crate.binding._value[goog.typeOf(x__2369__auto____11289)];
      if(or__3824__auto____11290) {
        return or__3824__auto____11290
      }else {
        var or__3824__auto____11291 = crate.binding._value["_"];
        if(or__3824__auto____11291) {
          return or__3824__auto____11291
        }else {
          throw cljs.core.missing_protocol.call(null, "bindable.-value", this$);
        }
      }
    }().call(null, this$)
  }
};
crate.binding._on_change = function _on_change(this$, func) {
  if(function() {
    var and__3822__auto____11296 = this$;
    if(and__3822__auto____11296) {
      return this$.crate$binding$bindable$_on_change$arity$2
    }else {
      return and__3822__auto____11296
    }
  }()) {
    return this$.crate$binding$bindable$_on_change$arity$2(this$, func)
  }else {
    var x__2369__auto____11297 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11298 = crate.binding._on_change[goog.typeOf(x__2369__auto____11297)];
      if(or__3824__auto____11298) {
        return or__3824__auto____11298
      }else {
        var or__3824__auto____11299 = crate.binding._on_change["_"];
        if(or__3824__auto____11299) {
          return or__3824__auto____11299
        }else {
          throw cljs.core.missing_protocol.call(null, "bindable.-on-change", this$);
        }
      }
    }().call(null, this$, func)
  }
};
crate.binding.atom_binding = function(atm, value_func) {
  this.atm = atm;
  this.value_func = value_func
};
crate.binding.atom_binding.cljs$lang$type = true;
crate.binding.atom_binding.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "crate.binding/atom-binding")
};
crate.binding.atom_binding.prototype.crate$binding$bindable$ = true;
crate.binding.atom_binding.prototype.crate$binding$bindable$_value$arity$1 = function(this$) {
  var this__11300 = this;
  return this__11300.value_func.call(null, cljs.core.deref.call(null, this__11300.atm))
};
crate.binding.atom_binding.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__11301 = this;
  return cljs.core.add_watch.call(null, this__11301.atm, cljs.core.gensym.call(null, "atom-binding"), function() {
    return func.call(null, crate.binding._value.call(null, this$))
  })
};
crate.binding.atom_binding;
crate.binding.notifier = function(watches) {
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2147483648
};
crate.binding.notifier.cljs$lang$type = true;
crate.binding.notifier.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "crate.binding/notifier")
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11302 = this;
  var G__11303__11304 = cljs.core.seq.call(null, this__11302.watches);
  if(G__11303__11304) {
    var G__11306__11308 = cljs.core.first.call(null, G__11303__11304);
    var vec__11307__11309 = G__11306__11308;
    var key__11310 = cljs.core.nth.call(null, vec__11307__11309, 0, null);
    var f__11311 = cljs.core.nth.call(null, vec__11307__11309, 1, null);
    var G__11303__11312 = G__11303__11304;
    var G__11306__11313 = G__11306__11308;
    var G__11303__11314 = G__11303__11312;
    while(true) {
      var vec__11315__11316 = G__11306__11313;
      var key__11317 = cljs.core.nth.call(null, vec__11315__11316, 0, null);
      var f__11318 = cljs.core.nth.call(null, vec__11315__11316, 1, null);
      var G__11303__11319 = G__11303__11314;
      f__11318.call(null, key__11317, this$, oldval, newval);
      var temp__3974__auto____11320 = cljs.core.next.call(null, G__11303__11319);
      if(temp__3974__auto____11320) {
        var G__11303__11321 = temp__3974__auto____11320;
        var G__11324 = cljs.core.first.call(null, G__11303__11321);
        var G__11325 = G__11303__11321;
        G__11306__11313 = G__11324;
        G__11303__11314 = G__11325;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11322 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11322.watches, key, f)
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11323 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11323.watches, key)
};
crate.binding.notifier;
crate.binding.bound_collection = function(atm, notif, opts, stuff) {
  this.atm = atm;
  this.notif = notif;
  this.opts = opts;
  this.stuff = stuff
};
crate.binding.bound_collection.cljs$lang$type = true;
crate.binding.bound_collection.cljs$lang$ctorPrSeq = function(this__2315__auto__) {
  return cljs.core.list.call(null, "crate.binding/bound-collection")
};
crate.binding.bound_collection.prototype.crate$binding$bindable$ = true;
crate.binding.bound_collection.prototype.crate$binding$bindable$_value$arity$1 = function(this$) {
  var this__11326 = this;
  return cljs.core.map.call(null, "\ufdd0'elem", cljs.core.vals.call(null, this$.stuff))
};
crate.binding.bound_collection.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__11327 = this;
  return cljs.core.add_watch.call(null, this__11327.notif, cljs.core.gensym.call(null, "bound-coll"), function(_11329, _11330, _, p__11328) {
    var vec__11331__11332 = p__11328;
    var event__11333 = cljs.core.nth.call(null, vec__11331__11332, 0, null);
    var el__11334 = cljs.core.nth.call(null, vec__11331__11332, 1, null);
    var v__11335 = cljs.core.nth.call(null, vec__11331__11332, 2, null);
    return func.call(null, event__11333, el__11334, v__11335)
  })
};
crate.binding.bound_collection.prototype.crate$binding$bindable_coll$ = true;
crate.binding.bound_collection;
crate.binding.opt = function opt(bc, k) {
  return bc.opts.call(null, k)
};
crate.binding.bc_add = function bc_add(bc, path, key) {
  var sa__11338 = crate.binding.subatom.call(null, bc.atm, path);
  var elem__11339 = crate.binding.opt.call(null, bc, "\ufdd0'as").call(null, sa__11338);
  bc.stuff = cljs.core.assoc.call(null, bc.stuff, key, cljs.core.ObjMap.fromObject(["\ufdd0'elem", "\ufdd0'subatom"], {"\ufdd0'elem":elem__11339, "\ufdd0'subatom":sa__11338}));
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'add", elem__11339, cljs.core.deref.call(null, sa__11338)], true))
};
crate.binding.bc_remove = function bc_remove(bc, key) {
  var notif__11342 = bc.notif;
  var prev__11343 = bc.stuff.call(null, key);
  bc.stuff = cljs.core.dissoc.call(null, bc.stuff, key);
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'remove", (new cljs.core.Keyword("\ufdd0'elem")).call(null, prev__11343), null], true))
};
crate.binding.__GT_indexed = function __GT_indexed(coll) {
  if(cljs.core.map_QMARK_.call(null, coll)) {
    return cljs.core.seq.call(null, coll)
  }else {
    if(cljs.core.set_QMARK_.call(null, coll)) {
      return cljs.core.map.call(null, cljs.core.juxt.call(null, cljs.core.identity, cljs.core.identity), coll)
    }else {
      if("\ufdd0'else") {
        return cljs.core.map_indexed.call(null, cljs.core.vector, coll)
      }else {
        return null
      }
    }
  }
};
crate.binding.__GT_keyed = function __GT_keyed(coll, keyfn) {
  return cljs.core.into.call(null, cljs.core.PersistentHashSet.EMPTY, cljs.core.map.call(null, keyfn, crate.binding.__GT_indexed.call(null, coll)))
};
crate.binding.__GT_path = function() {
  var __GT_path__delegate = function(bc, segs) {
    return cljs.core.concat.call(null, function() {
      var or__3824__auto____11345 = crate.binding.opt.call(null, bc, "\ufdd0'path");
      if(cljs.core.truth_(or__3824__auto____11345)) {
        return or__3824__auto____11345
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), segs)
  };
  var __GT_path = function(bc, var_args) {
    var segs = null;
    if(goog.isDef(var_args)) {
      segs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return __GT_path__delegate.call(this, bc, segs)
  };
  __GT_path.cljs$lang$maxFixedArity = 1;
  __GT_path.cljs$lang$applyTo = function(arglist__11346) {
    var bc = cljs.core.first(arglist__11346);
    var segs = cljs.core.rest(arglist__11346);
    return __GT_path__delegate(bc, segs)
  };
  __GT_path.cljs$lang$arity$variadic = __GT_path__delegate;
  return __GT_path
}();
crate.binding.bc_compare = function bc_compare(bc, neue) {
  var prev__11364 = bc.stuff;
  var pset__11365 = cljs.core.into.call(null, cljs.core.PersistentHashSet.EMPTY, cljs.core.keys.call(null, prev__11364));
  var nset__11366 = crate.binding.__GT_keyed.call(null, neue, crate.binding.opt.call(null, bc, "\ufdd0'keyfn"));
  var added__11367 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, nset__11366, pset__11365));
  var removed__11368 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, pset__11365, nset__11366));
  var G__11369__11370 = cljs.core.seq.call(null, added__11367);
  if(G__11369__11370) {
    var a__11371 = cljs.core.first.call(null, G__11369__11370);
    var G__11369__11372 = G__11369__11370;
    while(true) {
      crate.binding.bc_add.call(null, bc, a__11371, a__11371);
      var temp__3974__auto____11373 = cljs.core.next.call(null, G__11369__11372);
      if(temp__3974__auto____11373) {
        var G__11369__11374 = temp__3974__auto____11373;
        var G__11381 = cljs.core.first.call(null, G__11369__11374);
        var G__11382 = G__11369__11374;
        a__11371 = G__11381;
        G__11369__11372 = G__11382;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11375__11376 = cljs.core.seq.call(null, removed__11368);
  if(G__11375__11376) {
    var r__11377 = cljs.core.first.call(null, G__11375__11376);
    var G__11375__11378 = G__11375__11376;
    while(true) {
      crate.binding.bc_remove.call(null, bc, r__11377);
      var temp__3974__auto____11379 = cljs.core.next.call(null, G__11375__11378);
      if(temp__3974__auto____11379) {
        var G__11375__11380 = temp__3974__auto____11379;
        var G__11383 = cljs.core.first.call(null, G__11375__11380);
        var G__11384 = G__11375__11380;
        r__11377 = G__11383;
        G__11375__11378 = G__11384;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.binding.bound_coll = function() {
  var bound_coll__delegate = function(atm, p__11385) {
    var vec__11400__11401 = p__11385;
    var path__11402 = cljs.core.nth.call(null, vec__11400__11401, 0, null);
    var opts__11403 = cljs.core.nth.call(null, vec__11400__11401, 1, null);
    var vec__11404__11405 = cljs.core.truth_(opts__11403) ? cljs.core.PersistentVector.fromArray([path__11402, opts__11403], true) : cljs.core.PersistentVector.fromArray([null, path__11402], true);
    var path__11406 = cljs.core.nth.call(null, vec__11404__11405, 0, null);
    var opts__11407 = cljs.core.nth.call(null, vec__11404__11405, 1, null);
    var atm__11408 = cljs.core.not.call(null, path__11406) ? atm : crate.binding.subatom.call(null, atm, path__11406);
    var opts__11409 = cljs.core.assoc.call(null, opts__11407, "\ufdd0'path", path__11406);
    var opts__11410 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11409)) ? cljs.core.assoc.call(null, opts__11409, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__11409, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11409), cljs.core.second));
    var bc__11411 = new crate.binding.bound_collection(atm__11408, new crate.binding.notifier(null), opts__11410, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__11408, cljs.core.gensym.call(null, "bound-coll"), function(_11412, _11413, _, neue) {
      return crate.binding.bc_compare.call(null, bc__11411, neue)
    });
    crate.binding.bc_compare.call(null, bc__11411, cljs.core.deref.call(null, atm__11408));
    return bc__11411
  };
  var bound_coll = function(atm, var_args) {
    var p__11385 = null;
    if(goog.isDef(var_args)) {
      p__11385 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound_coll__delegate.call(this, atm, p__11385)
  };
  bound_coll.cljs$lang$maxFixedArity = 1;
  bound_coll.cljs$lang$applyTo = function(arglist__11414) {
    var atm = cljs.core.first(arglist__11414);
    var p__11385 = cljs.core.rest(arglist__11414);
    return bound_coll__delegate(atm, p__11385)
  };
  bound_coll.cljs$lang$arity$variadic = bound_coll__delegate;
  return bound_coll
}();
crate.binding.map_bound = function() {
  var map_bound__delegate = function(as, atm, p__11415) {
    var vec__11425__11426 = p__11415;
    var opts__11427 = cljs.core.nth.call(null, vec__11425__11426, 0, null);
    var opts__11428 = cljs.core.assoc.call(null, opts__11427, "\ufdd0'as", as);
    var atm__11429 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__11428)) ? atm : crate.binding.subatom.call(null, atm, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__11428));
    var opts__11430 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11428)) ? cljs.core.assoc.call(null, opts__11428, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__11428, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11428), cljs.core.second));
    var bc__11431 = new crate.binding.bound_collection(atm__11429, new crate.binding.notifier(null), opts__11430, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__11429, cljs.core.gensym.call(null, "bound-coll"), function(_11432, _11433, _, neue) {
      return crate.binding.bc_compare.call(null, bc__11431, neue)
    });
    crate.binding.bc_compare.call(null, bc__11431, cljs.core.deref.call(null, atm__11429));
    return bc__11431
  };
  var map_bound = function(as, atm, var_args) {
    var p__11415 = null;
    if(goog.isDef(var_args)) {
      p__11415 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return map_bound__delegate.call(this, as, atm, p__11415)
  };
  map_bound.cljs$lang$maxFixedArity = 2;
  map_bound.cljs$lang$applyTo = function(arglist__11434) {
    var as = cljs.core.first(arglist__11434);
    var atm = cljs.core.first(cljs.core.next(arglist__11434));
    var p__11415 = cljs.core.rest(cljs.core.next(arglist__11434));
    return map_bound__delegate(as, atm, p__11415)
  };
  map_bound.cljs$lang$arity$variadic = map_bound__delegate;
  return map_bound
}();
crate.binding.binding_QMARK_ = function binding_QMARK_(b) {
  var G__11438__11439 = b;
  if(G__11438__11439) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11440 = null;
      if(cljs.core.truth_(or__3824__auto____11440)) {
        return or__3824__auto____11440
      }else {
        return G__11438__11439.crate$binding$bindable$
      }
    }())) {
      return true
    }else {
      if(!G__11438__11439.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__11438__11439)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__11438__11439)
  }
};
crate.binding.binding_coll_QMARK_ = function binding_coll_QMARK_(b) {
  var G__11444__11445 = b;
  if(G__11444__11445) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11446 = null;
      if(cljs.core.truth_(or__3824__auto____11446)) {
        return or__3824__auto____11446
      }else {
        return G__11444__11445.crate$binding$bindable_coll$
      }
    }())) {
      return true
    }else {
      if(!G__11444__11445.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__11444__11445)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__11444__11445)
  }
};
crate.binding.value = function value(b) {
  return crate.binding._value.call(null, b)
};
crate.binding.index = function index(sub_atom) {
  return cljs.core.last.call(null, sub_atom.path)
};
crate.binding.on_change = function on_change(b, func) {
  return crate.binding._on_change.call(null, b, func)
};
crate.binding.bound = function() {
  var bound__delegate = function(atm, p__11447) {
    var vec__11453__11454 = p__11447;
    var func__11455 = cljs.core.nth.call(null, vec__11453__11454, 0, null);
    var func__11457 = function() {
      var or__3824__auto____11456 = func__11455;
      if(cljs.core.truth_(or__3824__auto____11456)) {
        return or__3824__auto____11456
      }else {
        return cljs.core.identity
      }
    }();
    return new crate.binding.atom_binding(atm, func__11457)
  };
  var bound = function(atm, var_args) {
    var p__11447 = null;
    if(goog.isDef(var_args)) {
      p__11447 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound__delegate.call(this, atm, p__11447)
  };
  bound.cljs$lang$maxFixedArity = 1;
  bound.cljs$lang$applyTo = function(arglist__11458) {
    var atm = cljs.core.first(arglist__11458);
    var p__11447 = cljs.core.rest(arglist__11458);
    return bound__delegate(atm, p__11447)
  };
  bound.cljs$lang$arity$variadic = bound__delegate;
  return bound
}();
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "visiblity:hidden;overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.provide("crate.compiler");
goog.require("cljs.core");
goog.require("crate.binding");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("goog.dom");
crate.compiler.xmlns = cljs.core.ObjMap.fromObject(["\ufdd0'xhtml", "\ufdd0'svg"], {"\ufdd0'xhtml":"http://www.w3.org/1999/xhtml", "\ufdd0'svg":"http://www.w3.org/2000/svg"});
crate.compiler.group_id = cljs.core.atom.call(null, 0);
crate.compiler.bindings = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
crate.compiler.capture_binding = function capture_binding(tag, b) {
  return cljs.core.swap_BANG_.call(null, crate.compiler.bindings, cljs.core.conj, cljs.core.PersistentVector.fromArray([tag, b], true))
};
crate.compiler.as_content = function as_content(parent, content) {
  var G__10974__10975 = cljs.core.seq.call(null, content);
  if(G__10974__10975) {
    var c__10976 = cljs.core.first.call(null, G__10974__10975);
    var G__10974__10977 = G__10974__10975;
    while(true) {
      var child__10978 = c__10976 == null ? null : cljs.core.map_QMARK_.call(null, c__10976) ? function() {
        throw"Maps cannot be used as content";
      }() : cljs.core.string_QMARK_.call(null, c__10976) ? goog.dom.createTextNode(c__10976) : cljs.core.vector_QMARK_.call(null, c__10976) ? crate.compiler.elem_factory.call(null, c__10976) : cljs.core.seq_QMARK_.call(null, c__10976) ? as_content.call(null, parent, c__10976) : cljs.core.truth_(crate.binding.binding_coll_QMARK_.call(null, c__10976)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'coll", c__10976);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__10976)], true))
      }() : cljs.core.truth_(crate.binding.binding_QMARK_.call(null, c__10976)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'text", c__10976);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__10976)], true))
      }() : cljs.core.truth_(c__10976.nodeName) ? c__10976 : cljs.core.truth_(c__10976.get) ? c__10976.get(0) : "\ufdd0'else" ? goog.dom.createTextNode([cljs.core.str(c__10976)].join("")) : null;
      if(cljs.core.truth_(child__10978)) {
        goog.dom.appendChild(parent, child__10978)
      }else {
      }
      var temp__3974__auto____10979 = cljs.core.next.call(null, G__10974__10977);
      if(temp__3974__auto____10979) {
        var G__10974__10980 = temp__3974__auto____10979;
        var G__10981 = cljs.core.first.call(null, G__10974__10980);
        var G__10982 = G__10974__10980;
        c__10976 = G__10981;
        G__10974__10977 = G__10982;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.compiler.dom_binding = function() {
  var method_table__2543__auto____10983 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2544__auto____10984 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2545__auto____10985 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2546__auto____10986 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2547__auto____10987 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("dom-binding", function(type, _10988, _) {
    return type
  }, "\ufdd0'default", hierarchy__2547__auto____10987, method_table__2543__auto____10983, prefer_table__2544__auto____10984, method_cache__2545__auto____10985, cached_hierarchy__2546__auto____10986)
}();
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'text", function(_, b, elem) {
  return crate.binding.on_change.call(null, b, function(v) {
    goog.dom.removeChildren(elem);
    return crate.compiler.as_content.call(null, elem, cljs.core.PersistentVector.fromArray([v], true))
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'attr", function(_, p__10989, elem) {
  var vec__10990__10991 = p__10989;
  var k__10992 = cljs.core.nth.call(null, vec__10990__10991, 0, null);
  var b__10993 = cljs.core.nth.call(null, vec__10990__10991, 1, null);
  return crate.binding.on_change.call(null, b__10993, function(v) {
    return crate.compiler.dom_attr.call(null, elem, k__10992, v)
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'style", function(_, p__10994, elem) {
  var vec__10995__10996 = p__10994;
  var k__10997 = cljs.core.nth.call(null, vec__10995__10996, 0, null);
  var b__10998 = cljs.core.nth.call(null, vec__10995__10996, 1, null);
  return crate.binding.on_change.call(null, b__10998, function(v) {
    if(cljs.core.truth_(k__10997)) {
      return crate.compiler.dom_style.call(null, elem, k__10997, v)
    }else {
      return crate.compiler.dom_style.call(null, elem, v)
    }
  })
});
crate.compiler.dom_add = function dom_add(bc, parent, elem, v) {
  var temp__3971__auto____11001 = crate.binding.opt.call(null, bc, "\ufdd0'add");
  if(cljs.core.truth_(temp__3971__auto____11001)) {
    var adder__11002 = temp__3971__auto____11001;
    return adder__11002.call(null, parent, elem, v)
  }else {
    return goog.dom.appendChild(parent, elem)
  }
};
crate.compiler.dom_remove = function dom_remove(bc, elem) {
  var temp__3971__auto____11005 = crate.binding.opt.call(null, bc, "\ufdd0'remove");
  if(cljs.core.truth_(temp__3971__auto____11005)) {
    var remover__11006 = temp__3971__auto____11005;
    return remover__11006.call(null, elem)
  }else {
    return goog.dom.removeNode(elem)
  }
};
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'coll", function(_, bc, parent) {
  return crate.binding.on_change.call(null, bc, function(type, elem, v) {
    var pred__11007__11010 = cljs.core._EQ_;
    var expr__11008__11011 = type;
    if(pred__11007__11010.call(null, "\ufdd0'add", expr__11008__11011)) {
      return crate.compiler.dom_add.call(null, bc, parent, elem, v)
    }else {
      if(pred__11007__11010.call(null, "\ufdd0'remove", expr__11008__11011)) {
        return crate.compiler.dom_remove.call(null, bc, elem)
      }else {
        throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__11008__11011)].join(""));
      }
    }
  })
});
crate.compiler.handle_bindings = function handle_bindings(bs, elem) {
  var G__11031__11032 = cljs.core.seq.call(null, bs);
  if(G__11031__11032) {
    var G__11034__11036 = cljs.core.first.call(null, G__11031__11032);
    var vec__11035__11037 = G__11034__11036;
    var type__11038 = cljs.core.nth.call(null, vec__11035__11037, 0, null);
    var b__11039 = cljs.core.nth.call(null, vec__11035__11037, 1, null);
    var G__11031__11040 = G__11031__11032;
    var G__11034__11041 = G__11034__11036;
    var G__11031__11042 = G__11031__11040;
    while(true) {
      var vec__11043__11044 = G__11034__11041;
      var type__11045 = cljs.core.nth.call(null, vec__11043__11044, 0, null);
      var b__11046 = cljs.core.nth.call(null, vec__11043__11044, 1, null);
      var G__11031__11047 = G__11031__11042;
      crate.compiler.dom_binding.call(null, type__11045, b__11046, elem);
      var temp__3974__auto____11048 = cljs.core.next.call(null, G__11031__11047);
      if(temp__3974__auto____11048) {
        var G__11031__11049 = temp__3974__auto____11048;
        var G__11050 = cljs.core.first.call(null, G__11031__11049);
        var G__11051 = G__11031__11049;
        G__11034__11041 = G__11050;
        G__11031__11042 = G__11051;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
crate.compiler.dom_style = function() {
  var dom_style = null;
  var dom_style__2 = function(elem, v) {
    if(cljs.core.string_QMARK_.call(null, v)) {
      elem.setAttribute("style", v)
    }else {
      if(cljs.core.map_QMARK_.call(null, v)) {
        var G__11072__11073 = cljs.core.seq.call(null, v);
        if(G__11072__11073) {
          var G__11075__11077 = cljs.core.first.call(null, G__11072__11073);
          var vec__11076__11078 = G__11075__11077;
          var k__11079 = cljs.core.nth.call(null, vec__11076__11078, 0, null);
          var v__11080 = cljs.core.nth.call(null, vec__11076__11078, 1, null);
          var G__11072__11081 = G__11072__11073;
          var G__11075__11082 = G__11075__11077;
          var G__11072__11083 = G__11072__11081;
          while(true) {
            var vec__11084__11085 = G__11075__11082;
            var k__11086 = cljs.core.nth.call(null, vec__11084__11085, 0, null);
            var v__11087 = cljs.core.nth.call(null, vec__11084__11085, 1, null);
            var G__11072__11088 = G__11072__11083;
            dom_style.call(null, elem, k__11086, v__11087);
            var temp__3974__auto____11089 = cljs.core.next.call(null, G__11072__11088);
            if(temp__3974__auto____11089) {
              var G__11072__11090 = temp__3974__auto____11089;
              var G__11092 = cljs.core.first.call(null, G__11072__11090);
              var G__11093 = G__11072__11090;
              G__11075__11082 = G__11092;
              G__11072__11083 = G__11093;
              continue
            }else {
            }
            break
          }
        }else {
        }
      }else {
        if(cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v))) {
          crate.compiler.capture_binding.call(null, "\ufdd0'style", cljs.core.PersistentVector.fromArray([null, v], true));
          dom_style.call(null, elem, crate.binding.value.call(null, v))
        }else {
        }
      }
    }
    return elem
  };
  var dom_style__3 = function(elem, k, v) {
    var v__11091 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
      crate.compiler.capture_binding.call(null, "\ufdd0'style", cljs.core.PersistentVector.fromArray([k, v], true));
      return crate.binding.value.call(null, v)
    }() : v;
    return goog.style.setStyle(elem, cljs.core.name.call(null, k), v__11091)
  };
  dom_style = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return dom_style__2.call(this, elem, k);
      case 3:
        return dom_style__3.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dom_style.cljs$lang$arity$2 = dom_style__2;
  dom_style.cljs$lang$arity$3 = dom_style__3;
  return dom_style
}();
crate.compiler.dom_attr = function() {
  var dom_attr = null;
  var dom_attr__2 = function(elem, attrs) {
    if(cljs.core.truth_(elem)) {
      if(!cljs.core.map_QMARK_.call(null, attrs)) {
        return elem.getAttribute(cljs.core.name.call(null, attrs))
      }else {
        var G__11114__11115 = cljs.core.seq.call(null, attrs);
        if(G__11114__11115) {
          var G__11117__11119 = cljs.core.first.call(null, G__11114__11115);
          var vec__11118__11120 = G__11117__11119;
          var k__11121 = cljs.core.nth.call(null, vec__11118__11120, 0, null);
          var v__11122 = cljs.core.nth.call(null, vec__11118__11120, 1, null);
          var G__11114__11123 = G__11114__11115;
          var G__11117__11124 = G__11117__11119;
          var G__11114__11125 = G__11114__11123;
          while(true) {
            var vec__11126__11127 = G__11117__11124;
            var k__11128 = cljs.core.nth.call(null, vec__11126__11127, 0, null);
            var v__11129 = cljs.core.nth.call(null, vec__11126__11127, 1, null);
            var G__11114__11130 = G__11114__11125;
            dom_attr.call(null, elem, k__11128, v__11129);
            var temp__3974__auto____11131 = cljs.core.next.call(null, G__11114__11130);
            if(temp__3974__auto____11131) {
              var G__11114__11132 = temp__3974__auto____11131;
              var G__11134 = cljs.core.first.call(null, G__11114__11132);
              var G__11135 = G__11114__11132;
              G__11117__11124 = G__11134;
              G__11114__11125 = G__11135;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return elem
      }
    }else {
      return null
    }
  };
  var dom_attr__3 = function(elem, k, v) {
    if(cljs.core._EQ_.call(null, k, "\ufdd0'style")) {
      crate.compiler.dom_style.call(null, elem, v)
    }else {
      var v__11133 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'attr", cljs.core.PersistentVector.fromArray([k, v], true));
        return crate.binding.value.call(null, v)
      }() : v;
      elem.setAttribute(cljs.core.name.call(null, k), v__11133)
    }
    return elem
  };
  dom_attr = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return dom_attr__2.call(this, elem, k);
      case 3:
        return dom_attr__3.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dom_attr.cljs$lang$arity$2 = dom_attr__2;
  dom_attr.cljs$lang$arity$3 = dom_attr__3;
  return dom_attr
}();
crate.compiler.re_tag = /([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;
crate.compiler.normalize_map_attrs = function normalize_map_attrs(map_attrs) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__11142) {
    var vec__11143__11144 = p__11142;
    var n__11145 = cljs.core.nth.call(null, vec__11143__11144, 0, null);
    var v__11146 = cljs.core.nth.call(null, vec__11143__11144, 1, null);
    if(v__11146 === true) {
      return cljs.core.PersistentVector.fromArray([n__11145, cljs.core.name.call(null, n__11145)], true)
    }else {
      return cljs.core.PersistentVector.fromArray([n__11145, v__11146], true)
    }
  }, cljs.core.filter.call(null, cljs.core.comp.call(null, cljs.core.boolean$, cljs.core.second), map_attrs)))
};
crate.compiler.normalize_element = function normalize_element(p__11147) {
  var vec__11173__11174 = p__11147;
  var tag__11175 = cljs.core.nth.call(null, vec__11173__11174, 0, null);
  var content__11176 = cljs.core.nthnext.call(null, vec__11173__11174, 1);
  if(!function() {
    var or__3824__auto____11177 = cljs.core.keyword_QMARK_.call(null, tag__11175);
    if(or__3824__auto____11177) {
      return or__3824__auto____11177
    }else {
      var or__3824__auto____11178 = cljs.core.symbol_QMARK_.call(null, tag__11175);
      if(or__3824__auto____11178) {
        return or__3824__auto____11178
      }else {
        return cljs.core.string_QMARK_.call(null, tag__11175)
      }
    }
  }()) {
    throw[cljs.core.str(tag__11175), cljs.core.str(" is not a valid tag name.")].join("");
  }else {
  }
  var vec__11179__11181 = cljs.core.re_matches.call(null, crate.compiler.re_tag, cljs.core.name.call(null, tag__11175));
  var ___11182 = cljs.core.nth.call(null, vec__11179__11181, 0, null);
  var tag__11183 = cljs.core.nth.call(null, vec__11179__11181, 1, null);
  var id__11184 = cljs.core.nth.call(null, vec__11179__11181, 2, null);
  var class__11185 = cljs.core.nth.call(null, vec__11179__11181, 3, null);
  var vec__11180__11192 = function() {
    var vec__11186__11187 = clojure.string.split.call(null, tag__11183, /:/);
    var nsp__11188 = cljs.core.nth.call(null, vec__11186__11187, 0, null);
    var t__11189 = cljs.core.nth.call(null, vec__11186__11187, 1, null);
    var ns_xmlns__11190 = crate.compiler.xmlns.call(null, cljs.core.keyword.call(null, nsp__11188));
    if(cljs.core.truth_(t__11189)) {
      return cljs.core.PersistentVector.fromArray([function() {
        var or__3824__auto____11191 = ns_xmlns__11190;
        if(cljs.core.truth_(or__3824__auto____11191)) {
          return or__3824__auto____11191
        }else {
          return nsp__11188
        }
      }(), t__11189], true)
    }else {
      return cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0'xhtml")).call(null, crate.compiler.xmlns), nsp__11188], true)
    }
  }();
  var nsp__11193 = cljs.core.nth.call(null, vec__11180__11192, 0, null);
  var tag__11194 = cljs.core.nth.call(null, vec__11180__11192, 1, null);
  var tag_attrs__11196 = cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.filter.call(null, function(p1__11136_SHARP_) {
    return!(cljs.core.second.call(null, p1__11136_SHARP_) == null)
  }, cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":function() {
    var or__3824__auto____11195 = id__11184;
    if(cljs.core.truth_(or__3824__auto____11195)) {
      return or__3824__auto____11195
    }else {
      return null
    }
  }(), "\ufdd0'class":cljs.core.truth_(class__11185) ? clojure.string.replace.call(null, class__11185, /\./, " ") : null})));
  var map_attrs__11197 = cljs.core.first.call(null, content__11176);
  if(cljs.core.map_QMARK_.call(null, map_attrs__11197)) {
    return cljs.core.PersistentVector.fromArray([nsp__11193, tag__11194, cljs.core.merge.call(null, tag_attrs__11196, crate.compiler.normalize_map_attrs.call(null, map_attrs__11197)), cljs.core.next.call(null, content__11176)], true)
  }else {
    return cljs.core.PersistentVector.fromArray([nsp__11193, tag__11194, tag_attrs__11196, content__11176], true)
  }
};
crate.compiler.parse_content = function parse_content(elem, content) {
  var attrs__11199 = cljs.core.first.call(null, content);
  if(cljs.core.map_QMARK_.call(null, attrs__11199)) {
    crate.compiler.dom_attr.call(null, elem, attrs__11199);
    return cljs.core.rest.call(null, content)
  }else {
    return content
  }
};
crate.compiler.create_elem = cljs.core.truth_(document.createElementNS) ? function(nsp, tag) {
  return document.createElementNS(nsp, tag)
} : function(_, tag) {
  return document.createElement(tag)
};
crate.compiler.elem_factory = function elem_factory(tag_def) {
  var bindings11210__11211 = crate.compiler.bindings;
  try {
    crate.compiler.bindings = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
    var vec__11213__11214 = crate.compiler.normalize_element.call(null, tag_def);
    var nsp__11215 = cljs.core.nth.call(null, vec__11213__11214, 0, null);
    var tag__11216 = cljs.core.nth.call(null, vec__11213__11214, 1, null);
    var attrs__11217 = cljs.core.nth.call(null, vec__11213__11214, 2, null);
    var content__11218 = cljs.core.nth.call(null, vec__11213__11214, 3, null);
    var elem__11219 = crate.compiler.create_elem.call(null, nsp__11215, tag__11216);
    crate.compiler.dom_attr.call(null, elem__11219, attrs__11217);
    crate.compiler.as_content.call(null, elem__11219, content__11218);
    crate.compiler.handle_bindings.call(null, cljs.core.deref.call(null, crate.compiler.bindings), elem__11219);
    return elem__11219
  }finally {
    crate.compiler.bindings = bindings11210__11211
  }
};
crate.compiler.add_optional_attrs = function add_optional_attrs(func) {
  return function() {
    var G__11228__delegate = function(args) {
      if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, args))) {
        var vec__11224__11225 = cljs.core.apply.call(null, func, cljs.core.rest.call(null, args));
        var tag__11226 = cljs.core.nth.call(null, vec__11224__11225, 0, null);
        var body__11227 = cljs.core.nthnext.call(null, vec__11224__11225, 1);
        if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, body__11227))) {
          return cljs.core.apply.call(null, cljs.core.vector, tag__11226, cljs.core.merge.call(null, cljs.core.first.call(null, body__11227), cljs.core.first.call(null, args)), cljs.core.rest.call(null, body__11227))
        }else {
          return cljs.core.apply.call(null, cljs.core.vector, tag__11226, cljs.core.first.call(null, args), body__11227)
        }
      }else {
        return cljs.core.apply.call(null, func, args)
      }
    };
    var G__11228 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11228__delegate.call(this, args)
    };
    G__11228.cljs$lang$maxFixedArity = 0;
    G__11228.cljs$lang$applyTo = function(arglist__11229) {
      var args = cljs.core.seq(arglist__11229);
      return G__11228__delegate(args)
    };
    G__11228.cljs$lang$arity$variadic = G__11228__delegate;
    return G__11228
  }()
};
goog.provide("crate.core");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("crate.compiler");
crate.core.group_id = cljs.core.atom.call(null, 0);
crate.core.html = function() {
  var html__delegate = function(tags) {
    var res__10965 = cljs.core.map.call(null, crate.compiler.elem_factory, tags);
    if(cljs.core.truth_(cljs.core.second.call(null, res__10965))) {
      return res__10965
    }else {
      return cljs.core.first.call(null, res__10965)
    }
  };
  var html = function(var_args) {
    var tags = null;
    if(goog.isDef(var_args)) {
      tags = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return html__delegate.call(this, tags)
  };
  html.cljs$lang$maxFixedArity = 0;
  html.cljs$lang$applyTo = function(arglist__10966) {
    var tags = cljs.core.seq(arglist__10966);
    return html__delegate(tags)
  };
  html.cljs$lang$arity$variadic = html__delegate;
  return html
}();
crate.core.h = crate.util.escape_html;
goog.provide("hedgehog.core");
goog.require("cljs.core");
goog.require("crate.core");
goog.require("goog.dom");
goog.require("clojure.browser.dom");
goog.require("clojure.browser.event");
hedgehog.core.document = document;
hedgehog.core.window = window;
hedgehog.core.body_el = function body_el() {
  return hedgehog.core.document.body
};
hedgehog.core.dom_state = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'focus", "\ufdd0'selection"], {"\ufdd0'focus":null, "\ufdd0'selection":null}));
hedgehog.core.rerender_QMARK_ = cljs.core.atom.call(null, true);
hedgehog.core.toggle_rerender = function toggle_rerender() {
  return cljs.core.reset_BANG_.call(null, hedgehog.core.rerender_QMARK_, cljs.core.not.call(null, cljs.core.deref.call(null, hedgehog.core.rerender_QMARK_)))
};
hedgehog.core.dom_ready_BANG_ = function dom_ready_BANG_(f) {
  return hedgehog.core.window.onload = f
};
hedgehog.core.get_element_index = function get_element_index(el) {
  var siblings__6785 = cljs.core.js__GT_clj.call(null, Array.prototype.slice.call(el.parentNode.childNodes));
  return cljs.core.count.call(null, cljs.core.take_while.call(null, cljs.core.partial.call(null, cljs.core.not_EQ_, el), siblings__6785))
};
hedgehog.core.get_element_path = function get_element_path(el) {
  var parent__6788 = el.parentNode;
  var tagname__6789 = el.tagName;
  if(cljs.core.not_EQ_.call(null, el.id, "")) {
    return[cljs.core.str('id("'), cljs.core.str(el.id), cljs.core.str('")')].join("")
  }else {
    if(cljs.core._EQ_.call(null, el, hedgehog.core.body_el.call(null))) {
      return tagname__6789
    }else {
      if("\ufdd0'else") {
        return[cljs.core.str(get_element_path.call(null, parent__6788)), cljs.core.str("/"), cljs.core.str(tagname__6789), cljs.core.str("["), cljs.core.str(hedgehog.core.get_element_index.call(null, el)), cljs.core.str("]")].join("")
      }else {
        return null
      }
    }
  }
};
hedgehog.core.get_element = function get_element(xpath) {
  return hedgehog.core.document.evaluate(xpath, hedgehog.core.document, null, XPathResult.ANY_TYPE, null).iterateNext()
};
hedgehog.core.get_selection = function get_selection(el) {
  return cljs.core.PersistentVector.fromArray([el.selectionStart, el.selectionEnd, el.selectionDirection], true)
};
hedgehog.core.set_selection_BANG_ = function set_selection_BANG_(el, selection) {
  var vec__6795__6796 = selection;
  var start__6797 = cljs.core.nth.call(null, vec__6795__6796, 0, null);
  var end__6798 = cljs.core.nth.call(null, vec__6795__6796, 1, null);
  var dir__6799 = cljs.core.nth.call(null, vec__6795__6796, 2, null);
  return el.setSelectionRange(start__6797, end__6798, dir__6799)
};
hedgehog.core.restore_focus_BANG_ = function restore_focus_BANG_(p__6800) {
  var map__6809__6810 = p__6800;
  var map__6809__6811 = cljs.core.seq_QMARK_.call(null, map__6809__6810) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6809__6810) : map__6809__6810;
  var curr_dom_state__6812 = map__6809__6811;
  var selection__6813 = cljs.core._lookup.call(null, map__6809__6811, "\ufdd0'selection", null);
  var focus__6814 = cljs.core._lookup.call(null, map__6809__6811, "\ufdd0'focus", null);
  var temp__3974__auto____6815 = hedgehog.core.get_element.call(null, focus__6814);
  if(cljs.core.truth_(temp__3974__auto____6815)) {
    var focus_el__6816 = temp__3974__auto____6815;
    focus_el__6816.focus();
    if(cljs.core.truth_(selection__6813)) {
      return hedgehog.core.set_selection_BANG_.call(null, focus_el__6816, selection__6813)
    }else {
      return null
    }
  }else {
    return null
  }
};
hedgehog.core.set_title_BANG_ = function set_title_BANG_(title) {
  return hedgehog.core.document.title = cljs.core.deref.call(null, title)
};
hedgehog.core.pre_render_BANG_ = function pre_render_BANG_() {
  var active_el__6818 = hedgehog.core.document.activeElement;
  return cljs.core.swap_BANG_.call(null, hedgehog.core.dom_state, cljs.core.assoc, "\ufdd0'focus", hedgehog.core.get_element_path.call(null, active_el__6818), "\ufdd0'selection", hedgehog.core.get_selection.call(null, active_el__6818))
};
hedgehog.core.update_dom_BANG_ = function update_dom_BANG_(body) {
  if(cljs.core.truth_(cljs.core.deref.call(null, hedgehog.core.rerender_QMARK_))) {
    goog.dom.removeChildren(hedgehog.core.body_el.call(null))
  }else {
  }
  return clojure.browser.dom.insert_at.call(null, hedgehog.core.body_el.call(null), crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'body", cljs.core.deref.call(null, body)], true)), 0)
};
hedgehog.core.post_render_BANG_ = function post_render_BANG_() {
  var curr_dom_state__6820 = cljs.core.deref.call(null, hedgehog.core.dom_state);
  return hedgehog.core.restore_focus_BANG_.call(null, curr_dom_state__6820)
};
hedgehog.core.render_BANG_ = function render_BANG_(title, body) {
  hedgehog.core.pre_render_BANG_.call(null);
  hedgehog.core.set_title_BANG_.call(null, title);
  hedgehog.core.update_dom_BANG_.call(null, body);
  return hedgehog.core.post_render_BANG_.call(null)
};
hedgehog.core.make_watcher_BANG_ = function make_watcher_BANG_(title, body) {
  return cljs.core.add_watch.call(null, body, null, function(k, a, old_val, new_val) {
    return setTimeout(function() {
      return hedgehog.core.render_BANG_.call(null, title, body)
    }, 0)
  })
};
hedgehog.core.init_BANG_ = function init_BANG_(title, body) {
  hedgehog.core.make_watcher_BANG_.call(null, title, body);
  return hedgehog.core.render_BANG_.call(null, title, body)
};
goog.provide("hedgehog.todos");
goog.require("cljs.core");
goog.require("hedgehog.core");
goog.require("reflex.core");
goog.require("clojure.browser.event");
goog.require("clojure.browser.dom");
hedgehog.todos.todos = cljs.core.atom.call(null, cljs.core.PersistentVector.fromArray(["buy milk", "eat lunch", "drink milk"], true));
hedgehog.todos.pending_todo = cljs.core.atom.call(null, "foo bar");
hedgehog.todos.first_todo = function() {
  var co__6827__auto____6947 = new reflex.core.ComputedObservable(null, true, function() {
    return cljs.core.first.call(null, cljs.core.deref.call(null, hedgehog.todos.todos))
  }, cljs.core.gensym.call(null, "computed-observable"), cljs.core.ObjMap.EMPTY, cljs.core.ObjMap.EMPTY);
  cljs.core.deref.call(null, co__6827__auto____6947);
  return co__6827__auto____6947
}();
hedgehog.todos.num_todos = function() {
  var co__6827__auto____6948 = new reflex.core.ComputedObservable(null, true, function() {
    return cljs.core.count.call(null, cljs.core.deref.call(null, hedgehog.todos.todos))
  }, cljs.core.gensym.call(null, "computed-observable"), cljs.core.ObjMap.EMPTY, cljs.core.ObjMap.EMPTY);
  cljs.core.deref.call(null, co__6827__auto____6948);
  return co__6827__auto____6948
}();
hedgehog.todos.add_todo_BANG_ = function add_todo_BANG_(todo) {
  return cljs.core.swap_BANG_.call(null, hedgehog.todos.todos, cljs.core.conj, todo)
};
hedgehog.todos.todo_element = function todo_element(todo) {
  return cljs.core.PersistentVector.fromArray(["\ufdd0'li.todo", todo], true)
};
hedgehog.todos.title = function() {
  var co__6827__auto____6949 = new reflex.core.ComputedObservable(null, true, function() {
    return[cljs.core.str("Todos"), cljs.core.str(cljs.core.deref.call(null, hedgehog.todos.num_todos) === 0 ? null : [cljs.core.str(" ("), cljs.core.str(cljs.core.deref.call(null, hedgehog.todos.num_todos)), cljs.core.str(")")].join(""))].join("")
  }, cljs.core.gensym.call(null, "computed-observable"), cljs.core.ObjMap.EMPTY, cljs.core.ObjMap.EMPTY);
  cljs.core.deref.call(null, co__6827__auto____6949);
  return co__6827__auto____6949
}();
hedgehog.todos.body = function() {
  var co__6827__auto____6950 = new reflex.core.ComputedObservable(null, true, function() {
    return cljs.core.PersistentVector.fromArray(["\ufdd0'div#todos", cljs.core.PersistentVector.fromArray(["\ufdd0'ul", cljs.core.map.call(null, hedgehog.todos.todo_element, cljs.core.deref.call(null, hedgehog.todos.todos)), cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, hedgehog.todos.pending_todo)) ? null : hedgehog.todos.todo_element.call(null, cljs.core.deref.call(null, hedgehog.todos.pending_todo))], true), cljs.core.PersistentVector.fromArray(["\ufdd0'input#input", cljs.core.ObjMap.fromObject(["\ufdd0'value", 
    "\ufdd0'type", "\ufdd0'autofocus"], {"\ufdd0'value":cljs.core.deref.call(null, hedgehog.todos.pending_todo), "\ufdd0'type":"text", "\ufdd0'autofocus":"true"})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'input", cljs.core.ObjMap.fromObject(["\ufdd0'value"], {"\ufdd0'value":cljs.core.deref.call(null, hedgehog.todos.pending_todo)})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'button", "Add"], true)], true)
  }, cljs.core.gensym.call(null, "computed-observable"), cljs.core.ObjMap.EMPTY, cljs.core.ObjMap.EMPTY);
  cljs.core.deref.call(null, co__6827__auto____6950);
  return co__6827__auto____6950
}();
hedgehog.todos.input_event = function input_event(ev) {
  var val__6952 = ev.target.value;
  return cljs.core.reset_BANG_.call(null, hedgehog.todos.pending_todo, val__6952)
};
hedgehog.core.dom_ready_BANG_.call(null, function() {
  hedgehog.core.init_BANG_.call(null, hedgehog.todos.title, hedgehog.todos.body);
  return clojure.browser.event.listen.call(null, hedgehog.core.body_el.call(null), "\ufdd0'input", hedgehog.todos.input_event, true)
});

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
  var x__15208 = x == null ? null : x;
  if(p[goog.typeOf(x__15208)]) {
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
    var G__15209__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__15209 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15209__delegate.call(this, array, i, idxs)
    };
    G__15209.cljs$lang$maxFixedArity = 2;
    G__15209.cljs$lang$applyTo = function(arglist__15210) {
      var array = cljs.core.first(arglist__15210);
      var i = cljs.core.first(cljs.core.next(arglist__15210));
      var idxs = cljs.core.rest(cljs.core.next(arglist__15210));
      return G__15209__delegate(array, i, idxs)
    };
    G__15209.cljs$lang$arity$variadic = G__15209__delegate;
    return G__15209
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
      var and__3822__auto____15295 = this$;
      if(and__3822__auto____15295) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____15295
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2369__auto____15296 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15297 = cljs.core._invoke[goog.typeOf(x__2369__auto____15296)];
        if(or__3824__auto____15297) {
          return or__3824__auto____15297
        }else {
          var or__3824__auto____15298 = cljs.core._invoke["_"];
          if(or__3824__auto____15298) {
            return or__3824__auto____15298
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____15299 = this$;
      if(and__3822__auto____15299) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____15299
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2369__auto____15300 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15301 = cljs.core._invoke[goog.typeOf(x__2369__auto____15300)];
        if(or__3824__auto____15301) {
          return or__3824__auto____15301
        }else {
          var or__3824__auto____15302 = cljs.core._invoke["_"];
          if(or__3824__auto____15302) {
            return or__3824__auto____15302
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____15303 = this$;
      if(and__3822__auto____15303) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____15303
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2369__auto____15304 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15305 = cljs.core._invoke[goog.typeOf(x__2369__auto____15304)];
        if(or__3824__auto____15305) {
          return or__3824__auto____15305
        }else {
          var or__3824__auto____15306 = cljs.core._invoke["_"];
          if(or__3824__auto____15306) {
            return or__3824__auto____15306
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____15307 = this$;
      if(and__3822__auto____15307) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____15307
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2369__auto____15308 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15309 = cljs.core._invoke[goog.typeOf(x__2369__auto____15308)];
        if(or__3824__auto____15309) {
          return or__3824__auto____15309
        }else {
          var or__3824__auto____15310 = cljs.core._invoke["_"];
          if(or__3824__auto____15310) {
            return or__3824__auto____15310
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____15311 = this$;
      if(and__3822__auto____15311) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____15311
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2369__auto____15312 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15313 = cljs.core._invoke[goog.typeOf(x__2369__auto____15312)];
        if(or__3824__auto____15313) {
          return or__3824__auto____15313
        }else {
          var or__3824__auto____15314 = cljs.core._invoke["_"];
          if(or__3824__auto____15314) {
            return or__3824__auto____15314
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____15315 = this$;
      if(and__3822__auto____15315) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____15315
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2369__auto____15316 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15317 = cljs.core._invoke[goog.typeOf(x__2369__auto____15316)];
        if(or__3824__auto____15317) {
          return or__3824__auto____15317
        }else {
          var or__3824__auto____15318 = cljs.core._invoke["_"];
          if(or__3824__auto____15318) {
            return or__3824__auto____15318
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____15319 = this$;
      if(and__3822__auto____15319) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____15319
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2369__auto____15320 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15321 = cljs.core._invoke[goog.typeOf(x__2369__auto____15320)];
        if(or__3824__auto____15321) {
          return or__3824__auto____15321
        }else {
          var or__3824__auto____15322 = cljs.core._invoke["_"];
          if(or__3824__auto____15322) {
            return or__3824__auto____15322
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____15323 = this$;
      if(and__3822__auto____15323) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____15323
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2369__auto____15324 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15325 = cljs.core._invoke[goog.typeOf(x__2369__auto____15324)];
        if(or__3824__auto____15325) {
          return or__3824__auto____15325
        }else {
          var or__3824__auto____15326 = cljs.core._invoke["_"];
          if(or__3824__auto____15326) {
            return or__3824__auto____15326
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____15327 = this$;
      if(and__3822__auto____15327) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____15327
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2369__auto____15328 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15329 = cljs.core._invoke[goog.typeOf(x__2369__auto____15328)];
        if(or__3824__auto____15329) {
          return or__3824__auto____15329
        }else {
          var or__3824__auto____15330 = cljs.core._invoke["_"];
          if(or__3824__auto____15330) {
            return or__3824__auto____15330
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____15331 = this$;
      if(and__3822__auto____15331) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____15331
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2369__auto____15332 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15333 = cljs.core._invoke[goog.typeOf(x__2369__auto____15332)];
        if(or__3824__auto____15333) {
          return or__3824__auto____15333
        }else {
          var or__3824__auto____15334 = cljs.core._invoke["_"];
          if(or__3824__auto____15334) {
            return or__3824__auto____15334
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____15335 = this$;
      if(and__3822__auto____15335) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____15335
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2369__auto____15336 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15337 = cljs.core._invoke[goog.typeOf(x__2369__auto____15336)];
        if(or__3824__auto____15337) {
          return or__3824__auto____15337
        }else {
          var or__3824__auto____15338 = cljs.core._invoke["_"];
          if(or__3824__auto____15338) {
            return or__3824__auto____15338
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____15339 = this$;
      if(and__3822__auto____15339) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____15339
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2369__auto____15340 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15341 = cljs.core._invoke[goog.typeOf(x__2369__auto____15340)];
        if(or__3824__auto____15341) {
          return or__3824__auto____15341
        }else {
          var or__3824__auto____15342 = cljs.core._invoke["_"];
          if(or__3824__auto____15342) {
            return or__3824__auto____15342
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____15343 = this$;
      if(and__3822__auto____15343) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____15343
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2369__auto____15344 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15345 = cljs.core._invoke[goog.typeOf(x__2369__auto____15344)];
        if(or__3824__auto____15345) {
          return or__3824__auto____15345
        }else {
          var or__3824__auto____15346 = cljs.core._invoke["_"];
          if(or__3824__auto____15346) {
            return or__3824__auto____15346
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____15347 = this$;
      if(and__3822__auto____15347) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____15347
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2369__auto____15348 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15349 = cljs.core._invoke[goog.typeOf(x__2369__auto____15348)];
        if(or__3824__auto____15349) {
          return or__3824__auto____15349
        }else {
          var or__3824__auto____15350 = cljs.core._invoke["_"];
          if(or__3824__auto____15350) {
            return or__3824__auto____15350
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____15351 = this$;
      if(and__3822__auto____15351) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____15351
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2369__auto____15352 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15353 = cljs.core._invoke[goog.typeOf(x__2369__auto____15352)];
        if(or__3824__auto____15353) {
          return or__3824__auto____15353
        }else {
          var or__3824__auto____15354 = cljs.core._invoke["_"];
          if(or__3824__auto____15354) {
            return or__3824__auto____15354
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____15355 = this$;
      if(and__3822__auto____15355) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____15355
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2369__auto____15356 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15357 = cljs.core._invoke[goog.typeOf(x__2369__auto____15356)];
        if(or__3824__auto____15357) {
          return or__3824__auto____15357
        }else {
          var or__3824__auto____15358 = cljs.core._invoke["_"];
          if(or__3824__auto____15358) {
            return or__3824__auto____15358
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____15359 = this$;
      if(and__3822__auto____15359) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____15359
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2369__auto____15360 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15361 = cljs.core._invoke[goog.typeOf(x__2369__auto____15360)];
        if(or__3824__auto____15361) {
          return or__3824__auto____15361
        }else {
          var or__3824__auto____15362 = cljs.core._invoke["_"];
          if(or__3824__auto____15362) {
            return or__3824__auto____15362
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____15363 = this$;
      if(and__3822__auto____15363) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____15363
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2369__auto____15364 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15365 = cljs.core._invoke[goog.typeOf(x__2369__auto____15364)];
        if(or__3824__auto____15365) {
          return or__3824__auto____15365
        }else {
          var or__3824__auto____15366 = cljs.core._invoke["_"];
          if(or__3824__auto____15366) {
            return or__3824__auto____15366
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____15367 = this$;
      if(and__3822__auto____15367) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____15367
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2369__auto____15368 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15369 = cljs.core._invoke[goog.typeOf(x__2369__auto____15368)];
        if(or__3824__auto____15369) {
          return or__3824__auto____15369
        }else {
          var or__3824__auto____15370 = cljs.core._invoke["_"];
          if(or__3824__auto____15370) {
            return or__3824__auto____15370
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____15371 = this$;
      if(and__3822__auto____15371) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____15371
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2369__auto____15372 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15373 = cljs.core._invoke[goog.typeOf(x__2369__auto____15372)];
        if(or__3824__auto____15373) {
          return or__3824__auto____15373
        }else {
          var or__3824__auto____15374 = cljs.core._invoke["_"];
          if(or__3824__auto____15374) {
            return or__3824__auto____15374
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____15375 = this$;
      if(and__3822__auto____15375) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____15375
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2369__auto____15376 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____15377 = cljs.core._invoke[goog.typeOf(x__2369__auto____15376)];
        if(or__3824__auto____15377) {
          return or__3824__auto____15377
        }else {
          var or__3824__auto____15378 = cljs.core._invoke["_"];
          if(or__3824__auto____15378) {
            return or__3824__auto____15378
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
    var and__3822__auto____15383 = coll;
    if(and__3822__auto____15383) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____15383
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2369__auto____15384 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15385 = cljs.core._count[goog.typeOf(x__2369__auto____15384)];
      if(or__3824__auto____15385) {
        return or__3824__auto____15385
      }else {
        var or__3824__auto____15386 = cljs.core._count["_"];
        if(or__3824__auto____15386) {
          return or__3824__auto____15386
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
    var and__3822__auto____15391 = coll;
    if(and__3822__auto____15391) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____15391
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2369__auto____15392 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15393 = cljs.core._empty[goog.typeOf(x__2369__auto____15392)];
      if(or__3824__auto____15393) {
        return or__3824__auto____15393
      }else {
        var or__3824__auto____15394 = cljs.core._empty["_"];
        if(or__3824__auto____15394) {
          return or__3824__auto____15394
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
    var and__3822__auto____15399 = coll;
    if(and__3822__auto____15399) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____15399
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2369__auto____15400 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15401 = cljs.core._conj[goog.typeOf(x__2369__auto____15400)];
      if(or__3824__auto____15401) {
        return or__3824__auto____15401
      }else {
        var or__3824__auto____15402 = cljs.core._conj["_"];
        if(or__3824__auto____15402) {
          return or__3824__auto____15402
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
      var and__3822__auto____15411 = coll;
      if(and__3822__auto____15411) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____15411
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2369__auto____15412 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15413 = cljs.core._nth[goog.typeOf(x__2369__auto____15412)];
        if(or__3824__auto____15413) {
          return or__3824__auto____15413
        }else {
          var or__3824__auto____15414 = cljs.core._nth["_"];
          if(or__3824__auto____15414) {
            return or__3824__auto____15414
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____15415 = coll;
      if(and__3822__auto____15415) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____15415
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2369__auto____15416 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15417 = cljs.core._nth[goog.typeOf(x__2369__auto____15416)];
        if(or__3824__auto____15417) {
          return or__3824__auto____15417
        }else {
          var or__3824__auto____15418 = cljs.core._nth["_"];
          if(or__3824__auto____15418) {
            return or__3824__auto____15418
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
    var and__3822__auto____15423 = coll;
    if(and__3822__auto____15423) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____15423
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2369__auto____15424 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15425 = cljs.core._first[goog.typeOf(x__2369__auto____15424)];
      if(or__3824__auto____15425) {
        return or__3824__auto____15425
      }else {
        var or__3824__auto____15426 = cljs.core._first["_"];
        if(or__3824__auto____15426) {
          return or__3824__auto____15426
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____15431 = coll;
    if(and__3822__auto____15431) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____15431
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2369__auto____15432 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15433 = cljs.core._rest[goog.typeOf(x__2369__auto____15432)];
      if(or__3824__auto____15433) {
        return or__3824__auto____15433
      }else {
        var or__3824__auto____15434 = cljs.core._rest["_"];
        if(or__3824__auto____15434) {
          return or__3824__auto____15434
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
    var and__3822__auto____15439 = coll;
    if(and__3822__auto____15439) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____15439
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2369__auto____15440 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15441 = cljs.core._next[goog.typeOf(x__2369__auto____15440)];
      if(or__3824__auto____15441) {
        return or__3824__auto____15441
      }else {
        var or__3824__auto____15442 = cljs.core._next["_"];
        if(or__3824__auto____15442) {
          return or__3824__auto____15442
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
      var and__3822__auto____15451 = o;
      if(and__3822__auto____15451) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____15451
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2369__auto____15452 = o == null ? null : o;
      return function() {
        var or__3824__auto____15453 = cljs.core._lookup[goog.typeOf(x__2369__auto____15452)];
        if(or__3824__auto____15453) {
          return or__3824__auto____15453
        }else {
          var or__3824__auto____15454 = cljs.core._lookup["_"];
          if(or__3824__auto____15454) {
            return or__3824__auto____15454
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____15455 = o;
      if(and__3822__auto____15455) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____15455
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2369__auto____15456 = o == null ? null : o;
      return function() {
        var or__3824__auto____15457 = cljs.core._lookup[goog.typeOf(x__2369__auto____15456)];
        if(or__3824__auto____15457) {
          return or__3824__auto____15457
        }else {
          var or__3824__auto____15458 = cljs.core._lookup["_"];
          if(or__3824__auto____15458) {
            return or__3824__auto____15458
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
    var and__3822__auto____15463 = coll;
    if(and__3822__auto____15463) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____15463
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2369__auto____15464 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15465 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2369__auto____15464)];
      if(or__3824__auto____15465) {
        return or__3824__auto____15465
      }else {
        var or__3824__auto____15466 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____15466) {
          return or__3824__auto____15466
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____15471 = coll;
    if(and__3822__auto____15471) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____15471
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2369__auto____15472 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15473 = cljs.core._assoc[goog.typeOf(x__2369__auto____15472)];
      if(or__3824__auto____15473) {
        return or__3824__auto____15473
      }else {
        var or__3824__auto____15474 = cljs.core._assoc["_"];
        if(or__3824__auto____15474) {
          return or__3824__auto____15474
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
    var and__3822__auto____15479 = coll;
    if(and__3822__auto____15479) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____15479
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2369__auto____15480 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15481 = cljs.core._dissoc[goog.typeOf(x__2369__auto____15480)];
      if(or__3824__auto____15481) {
        return or__3824__auto____15481
      }else {
        var or__3824__auto____15482 = cljs.core._dissoc["_"];
        if(or__3824__auto____15482) {
          return or__3824__auto____15482
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
    var and__3822__auto____15487 = coll;
    if(and__3822__auto____15487) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____15487
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2369__auto____15488 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15489 = cljs.core._key[goog.typeOf(x__2369__auto____15488)];
      if(or__3824__auto____15489) {
        return or__3824__auto____15489
      }else {
        var or__3824__auto____15490 = cljs.core._key["_"];
        if(or__3824__auto____15490) {
          return or__3824__auto____15490
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____15495 = coll;
    if(and__3822__auto____15495) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____15495
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2369__auto____15496 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15497 = cljs.core._val[goog.typeOf(x__2369__auto____15496)];
      if(or__3824__auto____15497) {
        return or__3824__auto____15497
      }else {
        var or__3824__auto____15498 = cljs.core._val["_"];
        if(or__3824__auto____15498) {
          return or__3824__auto____15498
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
    var and__3822__auto____15503 = coll;
    if(and__3822__auto____15503) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____15503
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2369__auto____15504 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15505 = cljs.core._disjoin[goog.typeOf(x__2369__auto____15504)];
      if(or__3824__auto____15505) {
        return or__3824__auto____15505
      }else {
        var or__3824__auto____15506 = cljs.core._disjoin["_"];
        if(or__3824__auto____15506) {
          return or__3824__auto____15506
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
    var and__3822__auto____15511 = coll;
    if(and__3822__auto____15511) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____15511
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2369__auto____15512 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15513 = cljs.core._peek[goog.typeOf(x__2369__auto____15512)];
      if(or__3824__auto____15513) {
        return or__3824__auto____15513
      }else {
        var or__3824__auto____15514 = cljs.core._peek["_"];
        if(or__3824__auto____15514) {
          return or__3824__auto____15514
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____15519 = coll;
    if(and__3822__auto____15519) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____15519
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2369__auto____15520 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15521 = cljs.core._pop[goog.typeOf(x__2369__auto____15520)];
      if(or__3824__auto____15521) {
        return or__3824__auto____15521
      }else {
        var or__3824__auto____15522 = cljs.core._pop["_"];
        if(or__3824__auto____15522) {
          return or__3824__auto____15522
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
    var and__3822__auto____15527 = coll;
    if(and__3822__auto____15527) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____15527
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2369__auto____15528 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15529 = cljs.core._assoc_n[goog.typeOf(x__2369__auto____15528)];
      if(or__3824__auto____15529) {
        return or__3824__auto____15529
      }else {
        var or__3824__auto____15530 = cljs.core._assoc_n["_"];
        if(or__3824__auto____15530) {
          return or__3824__auto____15530
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
    var and__3822__auto____15535 = o;
    if(and__3822__auto____15535) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____15535
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2369__auto____15536 = o == null ? null : o;
    return function() {
      var or__3824__auto____15537 = cljs.core._deref[goog.typeOf(x__2369__auto____15536)];
      if(or__3824__auto____15537) {
        return or__3824__auto____15537
      }else {
        var or__3824__auto____15538 = cljs.core._deref["_"];
        if(or__3824__auto____15538) {
          return or__3824__auto____15538
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
    var and__3822__auto____15543 = o;
    if(and__3822__auto____15543) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____15543
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2369__auto____15544 = o == null ? null : o;
    return function() {
      var or__3824__auto____15545 = cljs.core._deref_with_timeout[goog.typeOf(x__2369__auto____15544)];
      if(or__3824__auto____15545) {
        return or__3824__auto____15545
      }else {
        var or__3824__auto____15546 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____15546) {
          return or__3824__auto____15546
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
    var and__3822__auto____15551 = o;
    if(and__3822__auto____15551) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____15551
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2369__auto____15552 = o == null ? null : o;
    return function() {
      var or__3824__auto____15553 = cljs.core._meta[goog.typeOf(x__2369__auto____15552)];
      if(or__3824__auto____15553) {
        return or__3824__auto____15553
      }else {
        var or__3824__auto____15554 = cljs.core._meta["_"];
        if(or__3824__auto____15554) {
          return or__3824__auto____15554
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
    var and__3822__auto____15559 = o;
    if(and__3822__auto____15559) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____15559
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2369__auto____15560 = o == null ? null : o;
    return function() {
      var or__3824__auto____15561 = cljs.core._with_meta[goog.typeOf(x__2369__auto____15560)];
      if(or__3824__auto____15561) {
        return or__3824__auto____15561
      }else {
        var or__3824__auto____15562 = cljs.core._with_meta["_"];
        if(or__3824__auto____15562) {
          return or__3824__auto____15562
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
      var and__3822__auto____15571 = coll;
      if(and__3822__auto____15571) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____15571
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2369__auto____15572 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15573 = cljs.core._reduce[goog.typeOf(x__2369__auto____15572)];
        if(or__3824__auto____15573) {
          return or__3824__auto____15573
        }else {
          var or__3824__auto____15574 = cljs.core._reduce["_"];
          if(or__3824__auto____15574) {
            return or__3824__auto____15574
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____15575 = coll;
      if(and__3822__auto____15575) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____15575
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2369__auto____15576 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____15577 = cljs.core._reduce[goog.typeOf(x__2369__auto____15576)];
        if(or__3824__auto____15577) {
          return or__3824__auto____15577
        }else {
          var or__3824__auto____15578 = cljs.core._reduce["_"];
          if(or__3824__auto____15578) {
            return or__3824__auto____15578
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
    var and__3822__auto____15583 = coll;
    if(and__3822__auto____15583) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____15583
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2369__auto____15584 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15585 = cljs.core._kv_reduce[goog.typeOf(x__2369__auto____15584)];
      if(or__3824__auto____15585) {
        return or__3824__auto____15585
      }else {
        var or__3824__auto____15586 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____15586) {
          return or__3824__auto____15586
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
    var and__3822__auto____15591 = o;
    if(and__3822__auto____15591) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____15591
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2369__auto____15592 = o == null ? null : o;
    return function() {
      var or__3824__auto____15593 = cljs.core._equiv[goog.typeOf(x__2369__auto____15592)];
      if(or__3824__auto____15593) {
        return or__3824__auto____15593
      }else {
        var or__3824__auto____15594 = cljs.core._equiv["_"];
        if(or__3824__auto____15594) {
          return or__3824__auto____15594
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
    var and__3822__auto____15599 = o;
    if(and__3822__auto____15599) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____15599
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2369__auto____15600 = o == null ? null : o;
    return function() {
      var or__3824__auto____15601 = cljs.core._hash[goog.typeOf(x__2369__auto____15600)];
      if(or__3824__auto____15601) {
        return or__3824__auto____15601
      }else {
        var or__3824__auto____15602 = cljs.core._hash["_"];
        if(or__3824__auto____15602) {
          return or__3824__auto____15602
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
    var and__3822__auto____15607 = o;
    if(and__3822__auto____15607) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____15607
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2369__auto____15608 = o == null ? null : o;
    return function() {
      var or__3824__auto____15609 = cljs.core._seq[goog.typeOf(x__2369__auto____15608)];
      if(or__3824__auto____15609) {
        return or__3824__auto____15609
      }else {
        var or__3824__auto____15610 = cljs.core._seq["_"];
        if(or__3824__auto____15610) {
          return or__3824__auto____15610
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
    var and__3822__auto____15615 = coll;
    if(and__3822__auto____15615) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____15615
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2369__auto____15616 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15617 = cljs.core._rseq[goog.typeOf(x__2369__auto____15616)];
      if(or__3824__auto____15617) {
        return or__3824__auto____15617
      }else {
        var or__3824__auto____15618 = cljs.core._rseq["_"];
        if(or__3824__auto____15618) {
          return or__3824__auto____15618
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
    var and__3822__auto____15623 = coll;
    if(and__3822__auto____15623) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____15623
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2369__auto____15624 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15625 = cljs.core._sorted_seq[goog.typeOf(x__2369__auto____15624)];
      if(or__3824__auto____15625) {
        return or__3824__auto____15625
      }else {
        var or__3824__auto____15626 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____15626) {
          return or__3824__auto____15626
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____15631 = coll;
    if(and__3822__auto____15631) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____15631
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2369__auto____15632 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15633 = cljs.core._sorted_seq_from[goog.typeOf(x__2369__auto____15632)];
      if(or__3824__auto____15633) {
        return or__3824__auto____15633
      }else {
        var or__3824__auto____15634 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____15634) {
          return or__3824__auto____15634
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____15639 = coll;
    if(and__3822__auto____15639) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____15639
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2369__auto____15640 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15641 = cljs.core._entry_key[goog.typeOf(x__2369__auto____15640)];
      if(or__3824__auto____15641) {
        return or__3824__auto____15641
      }else {
        var or__3824__auto____15642 = cljs.core._entry_key["_"];
        if(or__3824__auto____15642) {
          return or__3824__auto____15642
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____15647 = coll;
    if(and__3822__auto____15647) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____15647
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2369__auto____15648 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15649 = cljs.core._comparator[goog.typeOf(x__2369__auto____15648)];
      if(or__3824__auto____15649) {
        return or__3824__auto____15649
      }else {
        var or__3824__auto____15650 = cljs.core._comparator["_"];
        if(or__3824__auto____15650) {
          return or__3824__auto____15650
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
    var and__3822__auto____15655 = o;
    if(and__3822__auto____15655) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____15655
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2369__auto____15656 = o == null ? null : o;
    return function() {
      var or__3824__auto____15657 = cljs.core._pr_seq[goog.typeOf(x__2369__auto____15656)];
      if(or__3824__auto____15657) {
        return or__3824__auto____15657
      }else {
        var or__3824__auto____15658 = cljs.core._pr_seq["_"];
        if(or__3824__auto____15658) {
          return or__3824__auto____15658
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
    var and__3822__auto____15663 = d;
    if(and__3822__auto____15663) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____15663
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2369__auto____15664 = d == null ? null : d;
    return function() {
      var or__3824__auto____15665 = cljs.core._realized_QMARK_[goog.typeOf(x__2369__auto____15664)];
      if(or__3824__auto____15665) {
        return or__3824__auto____15665
      }else {
        var or__3824__auto____15666 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____15666) {
          return or__3824__auto____15666
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
    var and__3822__auto____15671 = this$;
    if(and__3822__auto____15671) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____15671
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2369__auto____15672 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15673 = cljs.core._notify_watches[goog.typeOf(x__2369__auto____15672)];
      if(or__3824__auto____15673) {
        return or__3824__auto____15673
      }else {
        var or__3824__auto____15674 = cljs.core._notify_watches["_"];
        if(or__3824__auto____15674) {
          return or__3824__auto____15674
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____15679 = this$;
    if(and__3822__auto____15679) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____15679
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2369__auto____15680 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15681 = cljs.core._add_watch[goog.typeOf(x__2369__auto____15680)];
      if(or__3824__auto____15681) {
        return or__3824__auto____15681
      }else {
        var or__3824__auto____15682 = cljs.core._add_watch["_"];
        if(or__3824__auto____15682) {
          return or__3824__auto____15682
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____15687 = this$;
    if(and__3822__auto____15687) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____15687
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2369__auto____15688 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15689 = cljs.core._remove_watch[goog.typeOf(x__2369__auto____15688)];
      if(or__3824__auto____15689) {
        return or__3824__auto____15689
      }else {
        var or__3824__auto____15690 = cljs.core._remove_watch["_"];
        if(or__3824__auto____15690) {
          return or__3824__auto____15690
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
    var and__3822__auto____15695 = coll;
    if(and__3822__auto____15695) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____15695
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2369__auto____15696 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15697 = cljs.core._as_transient[goog.typeOf(x__2369__auto____15696)];
      if(or__3824__auto____15697) {
        return or__3824__auto____15697
      }else {
        var or__3824__auto____15698 = cljs.core._as_transient["_"];
        if(or__3824__auto____15698) {
          return or__3824__auto____15698
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
    var and__3822__auto____15703 = tcoll;
    if(and__3822__auto____15703) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____15703
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2369__auto____15704 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15705 = cljs.core._conj_BANG_[goog.typeOf(x__2369__auto____15704)];
      if(or__3824__auto____15705) {
        return or__3824__auto____15705
      }else {
        var or__3824__auto____15706 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____15706) {
          return or__3824__auto____15706
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15711 = tcoll;
    if(and__3822__auto____15711) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____15711
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2369__auto____15712 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15713 = cljs.core._persistent_BANG_[goog.typeOf(x__2369__auto____15712)];
      if(or__3824__auto____15713) {
        return or__3824__auto____15713
      }else {
        var or__3824__auto____15714 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____15714) {
          return or__3824__auto____15714
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
    var and__3822__auto____15719 = tcoll;
    if(and__3822__auto____15719) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____15719
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2369__auto____15720 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15721 = cljs.core._assoc_BANG_[goog.typeOf(x__2369__auto____15720)];
      if(or__3824__auto____15721) {
        return or__3824__auto____15721
      }else {
        var or__3824__auto____15722 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____15722) {
          return or__3824__auto____15722
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
    var and__3822__auto____15727 = tcoll;
    if(and__3822__auto____15727) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____15727
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2369__auto____15728 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15729 = cljs.core._dissoc_BANG_[goog.typeOf(x__2369__auto____15728)];
      if(or__3824__auto____15729) {
        return or__3824__auto____15729
      }else {
        var or__3824__auto____15730 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____15730) {
          return or__3824__auto____15730
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
    var and__3822__auto____15735 = tcoll;
    if(and__3822__auto____15735) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____15735
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2369__auto____15736 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15737 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2369__auto____15736)];
      if(or__3824__auto____15737) {
        return or__3824__auto____15737
      }else {
        var or__3824__auto____15738 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____15738) {
          return or__3824__auto____15738
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____15743 = tcoll;
    if(and__3822__auto____15743) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____15743
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2369__auto____15744 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15745 = cljs.core._pop_BANG_[goog.typeOf(x__2369__auto____15744)];
      if(or__3824__auto____15745) {
        return or__3824__auto____15745
      }else {
        var or__3824__auto____15746 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____15746) {
          return or__3824__auto____15746
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
    var and__3822__auto____15751 = tcoll;
    if(and__3822__auto____15751) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____15751
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2369__auto____15752 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____15753 = cljs.core._disjoin_BANG_[goog.typeOf(x__2369__auto____15752)];
      if(or__3824__auto____15753) {
        return or__3824__auto____15753
      }else {
        var or__3824__auto____15754 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____15754) {
          return or__3824__auto____15754
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
    var and__3822__auto____15759 = x;
    if(and__3822__auto____15759) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____15759
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2369__auto____15760 = x == null ? null : x;
    return function() {
      var or__3824__auto____15761 = cljs.core._compare[goog.typeOf(x__2369__auto____15760)];
      if(or__3824__auto____15761) {
        return or__3824__auto____15761
      }else {
        var or__3824__auto____15762 = cljs.core._compare["_"];
        if(or__3824__auto____15762) {
          return or__3824__auto____15762
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
    var and__3822__auto____15767 = coll;
    if(and__3822__auto____15767) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____15767
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2369__auto____15768 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15769 = cljs.core._drop_first[goog.typeOf(x__2369__auto____15768)];
      if(or__3824__auto____15769) {
        return or__3824__auto____15769
      }else {
        var or__3824__auto____15770 = cljs.core._drop_first["_"];
        if(or__3824__auto____15770) {
          return or__3824__auto____15770
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
    var and__3822__auto____15775 = coll;
    if(and__3822__auto____15775) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____15775
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2369__auto____15776 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15777 = cljs.core._chunked_first[goog.typeOf(x__2369__auto____15776)];
      if(or__3824__auto____15777) {
        return or__3824__auto____15777
      }else {
        var or__3824__auto____15778 = cljs.core._chunked_first["_"];
        if(or__3824__auto____15778) {
          return or__3824__auto____15778
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____15783 = coll;
    if(and__3822__auto____15783) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____15783
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2369__auto____15784 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15785 = cljs.core._chunked_rest[goog.typeOf(x__2369__auto____15784)];
      if(or__3824__auto____15785) {
        return or__3824__auto____15785
      }else {
        var or__3824__auto____15786 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____15786) {
          return or__3824__auto____15786
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
    var and__3822__auto____15791 = coll;
    if(and__3822__auto____15791) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____15791
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2369__auto____15792 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____15793 = cljs.core._chunked_next[goog.typeOf(x__2369__auto____15792)];
      if(or__3824__auto____15793) {
        return or__3824__auto____15793
      }else {
        var or__3824__auto____15794 = cljs.core._chunked_next["_"];
        if(or__3824__auto____15794) {
          return or__3824__auto____15794
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
    var or__3824__auto____15796 = x === y;
    if(or__3824__auto____15796) {
      return or__3824__auto____15796
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__15797__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__15798 = y;
            var G__15799 = cljs.core.first.call(null, more);
            var G__15800 = cljs.core.next.call(null, more);
            x = G__15798;
            y = G__15799;
            more = G__15800;
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
    var G__15797 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15797__delegate.call(this, x, y, more)
    };
    G__15797.cljs$lang$maxFixedArity = 2;
    G__15797.cljs$lang$applyTo = function(arglist__15801) {
      var x = cljs.core.first(arglist__15801);
      var y = cljs.core.first(cljs.core.next(arglist__15801));
      var more = cljs.core.rest(cljs.core.next(arglist__15801));
      return G__15797__delegate(x, y, more)
    };
    G__15797.cljs$lang$arity$variadic = G__15797__delegate;
    return G__15797
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
  var G__15802 = null;
  var G__15802__2 = function(o, k) {
    return null
  };
  var G__15802__3 = function(o, k, not_found) {
    return not_found
  };
  G__15802 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15802__2.call(this, o, k);
      case 3:
        return G__15802__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15802
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
  var G__15803 = null;
  var G__15803__2 = function(_, f) {
    return f.call(null)
  };
  var G__15803__3 = function(_, f, start) {
    return start
  };
  G__15803 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15803__2.call(this, _, f);
      case 3:
        return G__15803__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15803
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
  var G__15804 = null;
  var G__15804__2 = function(_, n) {
    return null
  };
  var G__15804__3 = function(_, n, not_found) {
    return not_found
  };
  G__15804 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15804__2.call(this, _, n);
      case 3:
        return G__15804__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15804
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
  var and__3822__auto____15805 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____15805) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____15805
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
    var cnt__15818 = cljs.core._count.call(null, cicoll);
    if(cnt__15818 === 0) {
      return f.call(null)
    }else {
      var val__15819 = cljs.core._nth.call(null, cicoll, 0);
      var n__15820 = 1;
      while(true) {
        if(n__15820 < cnt__15818) {
          var nval__15821 = f.call(null, val__15819, cljs.core._nth.call(null, cicoll, n__15820));
          if(cljs.core.reduced_QMARK_.call(null, nval__15821)) {
            return cljs.core.deref.call(null, nval__15821)
          }else {
            var G__15830 = nval__15821;
            var G__15831 = n__15820 + 1;
            val__15819 = G__15830;
            n__15820 = G__15831;
            continue
          }
        }else {
          return val__15819
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__15822 = cljs.core._count.call(null, cicoll);
    var val__15823 = val;
    var n__15824 = 0;
    while(true) {
      if(n__15824 < cnt__15822) {
        var nval__15825 = f.call(null, val__15823, cljs.core._nth.call(null, cicoll, n__15824));
        if(cljs.core.reduced_QMARK_.call(null, nval__15825)) {
          return cljs.core.deref.call(null, nval__15825)
        }else {
          var G__15832 = nval__15825;
          var G__15833 = n__15824 + 1;
          val__15823 = G__15832;
          n__15824 = G__15833;
          continue
        }
      }else {
        return val__15823
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__15826 = cljs.core._count.call(null, cicoll);
    var val__15827 = val;
    var n__15828 = idx;
    while(true) {
      if(n__15828 < cnt__15826) {
        var nval__15829 = f.call(null, val__15827, cljs.core._nth.call(null, cicoll, n__15828));
        if(cljs.core.reduced_QMARK_.call(null, nval__15829)) {
          return cljs.core.deref.call(null, nval__15829)
        }else {
          var G__15834 = nval__15829;
          var G__15835 = n__15828 + 1;
          val__15827 = G__15834;
          n__15828 = G__15835;
          continue
        }
      }else {
        return val__15827
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
    var cnt__15848 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__15849 = arr[0];
      var n__15850 = 1;
      while(true) {
        if(n__15850 < cnt__15848) {
          var nval__15851 = f.call(null, val__15849, arr[n__15850]);
          if(cljs.core.reduced_QMARK_.call(null, nval__15851)) {
            return cljs.core.deref.call(null, nval__15851)
          }else {
            var G__15860 = nval__15851;
            var G__15861 = n__15850 + 1;
            val__15849 = G__15860;
            n__15850 = G__15861;
            continue
          }
        }else {
          return val__15849
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__15852 = arr.length;
    var val__15853 = val;
    var n__15854 = 0;
    while(true) {
      if(n__15854 < cnt__15852) {
        var nval__15855 = f.call(null, val__15853, arr[n__15854]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15855)) {
          return cljs.core.deref.call(null, nval__15855)
        }else {
          var G__15862 = nval__15855;
          var G__15863 = n__15854 + 1;
          val__15853 = G__15862;
          n__15854 = G__15863;
          continue
        }
      }else {
        return val__15853
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__15856 = arr.length;
    var val__15857 = val;
    var n__15858 = idx;
    while(true) {
      if(n__15858 < cnt__15856) {
        var nval__15859 = f.call(null, val__15857, arr[n__15858]);
        if(cljs.core.reduced_QMARK_.call(null, nval__15859)) {
          return cljs.core.deref.call(null, nval__15859)
        }else {
          var G__15864 = nval__15859;
          var G__15865 = n__15858 + 1;
          val__15857 = G__15864;
          n__15858 = G__15865;
          continue
        }
      }else {
        return val__15857
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
  var this__15866 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__15867 = this;
  if(this__15867.i + 1 < this__15867.a.length) {
    return new cljs.core.IndexedSeq(this__15867.a, this__15867.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15868 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15869 = this;
  var c__15870 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__15870 > 0) {
    return new cljs.core.RSeq(coll, c__15870 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__15871 = this;
  var this__15872 = this;
  return cljs.core.pr_str.call(null, this__15872)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15873 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15873.a)) {
    return cljs.core.ci_reduce.call(null, this__15873.a, f, this__15873.a[this__15873.i], this__15873.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__15873.a[this__15873.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15874 = this;
  if(cljs.core.counted_QMARK_.call(null, this__15874.a)) {
    return cljs.core.ci_reduce.call(null, this__15874.a, f, start, this__15874.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15875 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__15876 = this;
  return this__15876.a.length - this__15876.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__15877 = this;
  return this__15877.a[this__15877.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__15878 = this;
  if(this__15878.i + 1 < this__15878.a.length) {
    return new cljs.core.IndexedSeq(this__15878.a, this__15878.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15879 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15880 = this;
  var i__15881 = n + this__15880.i;
  if(i__15881 < this__15880.a.length) {
    return this__15880.a[i__15881]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15882 = this;
  var i__15883 = n + this__15882.i;
  if(i__15883 < this__15882.a.length) {
    return this__15882.a[i__15883]
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
  var G__15884 = null;
  var G__15884__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__15884__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__15884 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15884__2.call(this, array, f);
      case 3:
        return G__15884__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15884
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__15885 = null;
  var G__15885__2 = function(array, k) {
    return array[k]
  };
  var G__15885__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__15885 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15885__2.call(this, array, k);
      case 3:
        return G__15885__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15885
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__15886 = null;
  var G__15886__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__15886__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__15886 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15886__2.call(this, array, n);
      case 3:
        return G__15886__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15886
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
  var this__15887 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15888 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__15889 = this;
  var this__15890 = this;
  return cljs.core.pr_str.call(null, this__15890)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15891 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15892 = this;
  return this__15892.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15893 = this;
  return cljs.core._nth.call(null, this__15893.ci, this__15893.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15894 = this;
  if(this__15894.i > 0) {
    return new cljs.core.RSeq(this__15894.ci, this__15894.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15895 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__15896 = this;
  return new cljs.core.RSeq(this__15896.ci, this__15896.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15897 = this;
  return this__15897.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__15901__15902 = coll;
      if(G__15901__15902) {
        if(function() {
          var or__3824__auto____15903 = G__15901__15902.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____15903) {
            return or__3824__auto____15903
          }else {
            return G__15901__15902.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__15901__15902.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15901__15902)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__15901__15902)
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
      var G__15908__15909 = coll;
      if(G__15908__15909) {
        if(function() {
          var or__3824__auto____15910 = G__15908__15909.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15910) {
            return or__3824__auto____15910
          }else {
            return G__15908__15909.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15908__15909.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15908__15909)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15908__15909)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__15911 = cljs.core.seq.call(null, coll);
      if(s__15911 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__15911)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__15916__15917 = coll;
      if(G__15916__15917) {
        if(function() {
          var or__3824__auto____15918 = G__15916__15917.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____15918) {
            return or__3824__auto____15918
          }else {
            return G__15916__15917.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__15916__15917.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15916__15917)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__15916__15917)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__15919 = cljs.core.seq.call(null, coll);
      if(!(s__15919 == null)) {
        return cljs.core._rest.call(null, s__15919)
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
      var G__15923__15924 = coll;
      if(G__15923__15924) {
        if(function() {
          var or__3824__auto____15925 = G__15923__15924.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____15925) {
            return or__3824__auto____15925
          }else {
            return G__15923__15924.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__15923__15924.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15923__15924)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__15923__15924)
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
    var sn__15927 = cljs.core.next.call(null, s);
    if(!(sn__15927 == null)) {
      var G__15928 = sn__15927;
      s = G__15928;
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
    var G__15929__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__15930 = conj.call(null, coll, x);
          var G__15931 = cljs.core.first.call(null, xs);
          var G__15932 = cljs.core.next.call(null, xs);
          coll = G__15930;
          x = G__15931;
          xs = G__15932;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__15929 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15929__delegate.call(this, coll, x, xs)
    };
    G__15929.cljs$lang$maxFixedArity = 2;
    G__15929.cljs$lang$applyTo = function(arglist__15933) {
      var coll = cljs.core.first(arglist__15933);
      var x = cljs.core.first(cljs.core.next(arglist__15933));
      var xs = cljs.core.rest(cljs.core.next(arglist__15933));
      return G__15929__delegate(coll, x, xs)
    };
    G__15929.cljs$lang$arity$variadic = G__15929__delegate;
    return G__15929
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
  var s__15936 = cljs.core.seq.call(null, coll);
  var acc__15937 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__15936)) {
      return acc__15937 + cljs.core._count.call(null, s__15936)
    }else {
      var G__15938 = cljs.core.next.call(null, s__15936);
      var G__15939 = acc__15937 + 1;
      s__15936 = G__15938;
      acc__15937 = G__15939;
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
        var G__15946__15947 = coll;
        if(G__15946__15947) {
          if(function() {
            var or__3824__auto____15948 = G__15946__15947.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15948) {
              return or__3824__auto____15948
            }else {
              return G__15946__15947.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15946__15947.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15946__15947)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15946__15947)
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
        var G__15949__15950 = coll;
        if(G__15949__15950) {
          if(function() {
            var or__3824__auto____15951 = G__15949__15950.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____15951) {
              return or__3824__auto____15951
            }else {
              return G__15949__15950.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__15949__15950.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15949__15950)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__15949__15950)
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
    var G__15954__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__15953 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__15955 = ret__15953;
          var G__15956 = cljs.core.first.call(null, kvs);
          var G__15957 = cljs.core.second.call(null, kvs);
          var G__15958 = cljs.core.nnext.call(null, kvs);
          coll = G__15955;
          k = G__15956;
          v = G__15957;
          kvs = G__15958;
          continue
        }else {
          return ret__15953
        }
        break
      }
    };
    var G__15954 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15954__delegate.call(this, coll, k, v, kvs)
    };
    G__15954.cljs$lang$maxFixedArity = 3;
    G__15954.cljs$lang$applyTo = function(arglist__15959) {
      var coll = cljs.core.first(arglist__15959);
      var k = cljs.core.first(cljs.core.next(arglist__15959));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15959)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15959)));
      return G__15954__delegate(coll, k, v, kvs)
    };
    G__15954.cljs$lang$arity$variadic = G__15954__delegate;
    return G__15954
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
    var G__15962__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15961 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15963 = ret__15961;
          var G__15964 = cljs.core.first.call(null, ks);
          var G__15965 = cljs.core.next.call(null, ks);
          coll = G__15963;
          k = G__15964;
          ks = G__15965;
          continue
        }else {
          return ret__15961
        }
        break
      }
    };
    var G__15962 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15962__delegate.call(this, coll, k, ks)
    };
    G__15962.cljs$lang$maxFixedArity = 2;
    G__15962.cljs$lang$applyTo = function(arglist__15966) {
      var coll = cljs.core.first(arglist__15966);
      var k = cljs.core.first(cljs.core.next(arglist__15966));
      var ks = cljs.core.rest(cljs.core.next(arglist__15966));
      return G__15962__delegate(coll, k, ks)
    };
    G__15962.cljs$lang$arity$variadic = G__15962__delegate;
    return G__15962
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
    var G__15970__15971 = o;
    if(G__15970__15971) {
      if(function() {
        var or__3824__auto____15972 = G__15970__15971.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____15972) {
          return or__3824__auto____15972
        }else {
          return G__15970__15971.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15970__15971.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15970__15971)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15970__15971)
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
    var G__15975__delegate = function(coll, k, ks) {
      while(true) {
        var ret__15974 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__15976 = ret__15974;
          var G__15977 = cljs.core.first.call(null, ks);
          var G__15978 = cljs.core.next.call(null, ks);
          coll = G__15976;
          k = G__15977;
          ks = G__15978;
          continue
        }else {
          return ret__15974
        }
        break
      }
    };
    var G__15975 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15975__delegate.call(this, coll, k, ks)
    };
    G__15975.cljs$lang$maxFixedArity = 2;
    G__15975.cljs$lang$applyTo = function(arglist__15979) {
      var coll = cljs.core.first(arglist__15979);
      var k = cljs.core.first(cljs.core.next(arglist__15979));
      var ks = cljs.core.rest(cljs.core.next(arglist__15979));
      return G__15975__delegate(coll, k, ks)
    };
    G__15975.cljs$lang$arity$variadic = G__15975__delegate;
    return G__15975
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
  var h__15981 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__15981;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__15981
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__15983 = cljs.core.string_hash_cache[k];
  if(!(h__15983 == null)) {
    return h__15983
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
      var and__3822__auto____15985 = goog.isString(o);
      if(and__3822__auto____15985) {
        return check_cache
      }else {
        return and__3822__auto____15985
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
    var G__15989__15990 = x;
    if(G__15989__15990) {
      if(function() {
        var or__3824__auto____15991 = G__15989__15990.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____15991) {
          return or__3824__auto____15991
        }else {
          return G__15989__15990.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__15989__15990.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15989__15990)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__15989__15990)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__15995__15996 = x;
    if(G__15995__15996) {
      if(function() {
        var or__3824__auto____15997 = G__15995__15996.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____15997) {
          return or__3824__auto____15997
        }else {
          return G__15995__15996.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__15995__15996.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15995__15996)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__15995__15996)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__16001__16002 = x;
  if(G__16001__16002) {
    if(function() {
      var or__3824__auto____16003 = G__16001__16002.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____16003) {
        return or__3824__auto____16003
      }else {
        return G__16001__16002.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__16001__16002.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__16001__16002)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__16001__16002)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__16007__16008 = x;
  if(G__16007__16008) {
    if(function() {
      var or__3824__auto____16009 = G__16007__16008.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____16009) {
        return or__3824__auto____16009
      }else {
        return G__16007__16008.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__16007__16008.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__16007__16008)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__16007__16008)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__16013__16014 = x;
  if(G__16013__16014) {
    if(function() {
      var or__3824__auto____16015 = G__16013__16014.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____16015) {
        return or__3824__auto____16015
      }else {
        return G__16013__16014.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__16013__16014.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__16013__16014)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__16013__16014)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__16019__16020 = x;
  if(G__16019__16020) {
    if(function() {
      var or__3824__auto____16021 = G__16019__16020.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____16021) {
        return or__3824__auto____16021
      }else {
        return G__16019__16020.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__16019__16020.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__16019__16020)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__16019__16020)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__16025__16026 = x;
  if(G__16025__16026) {
    if(function() {
      var or__3824__auto____16027 = G__16025__16026.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____16027) {
        return or__3824__auto____16027
      }else {
        return G__16025__16026.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__16025__16026.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16025__16026)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16025__16026)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__16031__16032 = x;
    if(G__16031__16032) {
      if(function() {
        var or__3824__auto____16033 = G__16031__16032.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____16033) {
          return or__3824__auto____16033
        }else {
          return G__16031__16032.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__16031__16032.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16031__16032)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__16031__16032)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__16037__16038 = x;
  if(G__16037__16038) {
    if(function() {
      var or__3824__auto____16039 = G__16037__16038.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____16039) {
        return or__3824__auto____16039
      }else {
        return G__16037__16038.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__16037__16038.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16037__16038)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__16037__16038)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__16043__16044 = x;
  if(G__16043__16044) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____16045 = null;
      if(cljs.core.truth_(or__3824__auto____16045)) {
        return or__3824__auto____16045
      }else {
        return G__16043__16044.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__16043__16044.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16043__16044)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__16043__16044)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__16046__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__16046 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16046__delegate.call(this, keyvals)
    };
    G__16046.cljs$lang$maxFixedArity = 0;
    G__16046.cljs$lang$applyTo = function(arglist__16047) {
      var keyvals = cljs.core.seq(arglist__16047);
      return G__16046__delegate(keyvals)
    };
    G__16046.cljs$lang$arity$variadic = G__16046__delegate;
    return G__16046
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
  var keys__16049 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__16049.push(key)
  });
  return keys__16049
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__16053 = i;
  var j__16054 = j;
  var len__16055 = len;
  while(true) {
    if(len__16055 === 0) {
      return to
    }else {
      to[j__16054] = from[i__16053];
      var G__16056 = i__16053 + 1;
      var G__16057 = j__16054 + 1;
      var G__16058 = len__16055 - 1;
      i__16053 = G__16056;
      j__16054 = G__16057;
      len__16055 = G__16058;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__16062 = i + (len - 1);
  var j__16063 = j + (len - 1);
  var len__16064 = len;
  while(true) {
    if(len__16064 === 0) {
      return to
    }else {
      to[j__16063] = from[i__16062];
      var G__16065 = i__16062 - 1;
      var G__16066 = j__16063 - 1;
      var G__16067 = len__16064 - 1;
      i__16062 = G__16065;
      j__16063 = G__16066;
      len__16064 = G__16067;
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
    var G__16071__16072 = s;
    if(G__16071__16072) {
      if(function() {
        var or__3824__auto____16073 = G__16071__16072.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____16073) {
          return or__3824__auto____16073
        }else {
          return G__16071__16072.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__16071__16072.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16071__16072)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16071__16072)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__16077__16078 = s;
  if(G__16077__16078) {
    if(function() {
      var or__3824__auto____16079 = G__16077__16078.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____16079) {
        return or__3824__auto____16079
      }else {
        return G__16077__16078.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__16077__16078.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16077__16078)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__16077__16078)
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
  var and__3822__auto____16082 = goog.isString(x);
  if(and__3822__auto____16082) {
    return!function() {
      var or__3824__auto____16083 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____16083) {
        return or__3824__auto____16083
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____16082
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____16085 = goog.isString(x);
  if(and__3822__auto____16085) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____16085
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____16087 = goog.isString(x);
  if(and__3822__auto____16087) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____16087
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____16092 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____16092) {
    return or__3824__auto____16092
  }else {
    var G__16093__16094 = f;
    if(G__16093__16094) {
      if(function() {
        var or__3824__auto____16095 = G__16093__16094.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____16095) {
          return or__3824__auto____16095
        }else {
          return G__16093__16094.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__16093__16094.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16093__16094)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__16093__16094)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____16097 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____16097) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____16097
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
    var and__3822__auto____16100 = coll;
    if(cljs.core.truth_(and__3822__auto____16100)) {
      var and__3822__auto____16101 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____16101) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____16101
      }
    }else {
      return and__3822__auto____16100
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
    var G__16110__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__16106 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__16107 = more;
        while(true) {
          var x__16108 = cljs.core.first.call(null, xs__16107);
          var etc__16109 = cljs.core.next.call(null, xs__16107);
          if(cljs.core.truth_(xs__16107)) {
            if(cljs.core.contains_QMARK_.call(null, s__16106, x__16108)) {
              return false
            }else {
              var G__16111 = cljs.core.conj.call(null, s__16106, x__16108);
              var G__16112 = etc__16109;
              s__16106 = G__16111;
              xs__16107 = G__16112;
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
    var G__16110 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16110__delegate.call(this, x, y, more)
    };
    G__16110.cljs$lang$maxFixedArity = 2;
    G__16110.cljs$lang$applyTo = function(arglist__16113) {
      var x = cljs.core.first(arglist__16113);
      var y = cljs.core.first(cljs.core.next(arglist__16113));
      var more = cljs.core.rest(cljs.core.next(arglist__16113));
      return G__16110__delegate(x, y, more)
    };
    G__16110.cljs$lang$arity$variadic = G__16110__delegate;
    return G__16110
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
            var G__16117__16118 = x;
            if(G__16117__16118) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____16119 = null;
                if(cljs.core.truth_(or__3824__auto____16119)) {
                  return or__3824__auto____16119
                }else {
                  return G__16117__16118.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__16117__16118.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16117__16118)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__16117__16118)
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
    var xl__16124 = cljs.core.count.call(null, xs);
    var yl__16125 = cljs.core.count.call(null, ys);
    if(xl__16124 < yl__16125) {
      return-1
    }else {
      if(xl__16124 > yl__16125) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__16124, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__16126 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____16127 = d__16126 === 0;
        if(and__3822__auto____16127) {
          return n + 1 < len
        }else {
          return and__3822__auto____16127
        }
      }()) {
        var G__16128 = xs;
        var G__16129 = ys;
        var G__16130 = len;
        var G__16131 = n + 1;
        xs = G__16128;
        ys = G__16129;
        len = G__16130;
        n = G__16131;
        continue
      }else {
        return d__16126
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
      var r__16133 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__16133)) {
        return r__16133
      }else {
        if(cljs.core.truth_(r__16133)) {
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
      var a__16135 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__16135, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__16135)
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
    var temp__3971__auto____16141 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____16141) {
      var s__16142 = temp__3971__auto____16141;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__16142), cljs.core.next.call(null, s__16142))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__16143 = val;
    var coll__16144 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__16144) {
        var nval__16145 = f.call(null, val__16143, cljs.core.first.call(null, coll__16144));
        if(cljs.core.reduced_QMARK_.call(null, nval__16145)) {
          return cljs.core.deref.call(null, nval__16145)
        }else {
          var G__16146 = nval__16145;
          var G__16147 = cljs.core.next.call(null, coll__16144);
          val__16143 = G__16146;
          coll__16144 = G__16147;
          continue
        }
      }else {
        return val__16143
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
  var a__16149 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__16149);
  return cljs.core.vec.call(null, a__16149)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__16156__16157 = coll;
      if(G__16156__16157) {
        if(function() {
          var or__3824__auto____16158 = G__16156__16157.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16158) {
            return or__3824__auto____16158
          }else {
            return G__16156__16157.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16156__16157.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16156__16157)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16156__16157)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__16159__16160 = coll;
      if(G__16159__16160) {
        if(function() {
          var or__3824__auto____16161 = G__16159__16160.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____16161) {
            return or__3824__auto____16161
          }else {
            return G__16159__16160.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__16159__16160.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16159__16160)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__16159__16160)
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
  var this__16162 = this;
  return this__16162.val
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
    var G__16163__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__16163 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16163__delegate.call(this, x, y, more)
    };
    G__16163.cljs$lang$maxFixedArity = 2;
    G__16163.cljs$lang$applyTo = function(arglist__16164) {
      var x = cljs.core.first(arglist__16164);
      var y = cljs.core.first(cljs.core.next(arglist__16164));
      var more = cljs.core.rest(cljs.core.next(arglist__16164));
      return G__16163__delegate(x, y, more)
    };
    G__16163.cljs$lang$arity$variadic = G__16163__delegate;
    return G__16163
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
    var G__16165__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__16165 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16165__delegate.call(this, x, y, more)
    };
    G__16165.cljs$lang$maxFixedArity = 2;
    G__16165.cljs$lang$applyTo = function(arglist__16166) {
      var x = cljs.core.first(arglist__16166);
      var y = cljs.core.first(cljs.core.next(arglist__16166));
      var more = cljs.core.rest(cljs.core.next(arglist__16166));
      return G__16165__delegate(x, y, more)
    };
    G__16165.cljs$lang$arity$variadic = G__16165__delegate;
    return G__16165
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
    var G__16167__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__16167 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16167__delegate.call(this, x, y, more)
    };
    G__16167.cljs$lang$maxFixedArity = 2;
    G__16167.cljs$lang$applyTo = function(arglist__16168) {
      var x = cljs.core.first(arglist__16168);
      var y = cljs.core.first(cljs.core.next(arglist__16168));
      var more = cljs.core.rest(cljs.core.next(arglist__16168));
      return G__16167__delegate(x, y, more)
    };
    G__16167.cljs$lang$arity$variadic = G__16167__delegate;
    return G__16167
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
    var G__16169__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__16169 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16169__delegate.call(this, x, y, more)
    };
    G__16169.cljs$lang$maxFixedArity = 2;
    G__16169.cljs$lang$applyTo = function(arglist__16170) {
      var x = cljs.core.first(arglist__16170);
      var y = cljs.core.first(cljs.core.next(arglist__16170));
      var more = cljs.core.rest(cljs.core.next(arglist__16170));
      return G__16169__delegate(x, y, more)
    };
    G__16169.cljs$lang$arity$variadic = G__16169__delegate;
    return G__16169
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
    var G__16171__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__16172 = y;
            var G__16173 = cljs.core.first.call(null, more);
            var G__16174 = cljs.core.next.call(null, more);
            x = G__16172;
            y = G__16173;
            more = G__16174;
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
    var G__16171 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16171__delegate.call(this, x, y, more)
    };
    G__16171.cljs$lang$maxFixedArity = 2;
    G__16171.cljs$lang$applyTo = function(arglist__16175) {
      var x = cljs.core.first(arglist__16175);
      var y = cljs.core.first(cljs.core.next(arglist__16175));
      var more = cljs.core.rest(cljs.core.next(arglist__16175));
      return G__16171__delegate(x, y, more)
    };
    G__16171.cljs$lang$arity$variadic = G__16171__delegate;
    return G__16171
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
    var G__16176__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16177 = y;
            var G__16178 = cljs.core.first.call(null, more);
            var G__16179 = cljs.core.next.call(null, more);
            x = G__16177;
            y = G__16178;
            more = G__16179;
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
    var G__16176 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16176__delegate.call(this, x, y, more)
    };
    G__16176.cljs$lang$maxFixedArity = 2;
    G__16176.cljs$lang$applyTo = function(arglist__16180) {
      var x = cljs.core.first(arglist__16180);
      var y = cljs.core.first(cljs.core.next(arglist__16180));
      var more = cljs.core.rest(cljs.core.next(arglist__16180));
      return G__16176__delegate(x, y, more)
    };
    G__16176.cljs$lang$arity$variadic = G__16176__delegate;
    return G__16176
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
    var G__16181__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__16182 = y;
            var G__16183 = cljs.core.first.call(null, more);
            var G__16184 = cljs.core.next.call(null, more);
            x = G__16182;
            y = G__16183;
            more = G__16184;
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
    var G__16181 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16181__delegate.call(this, x, y, more)
    };
    G__16181.cljs$lang$maxFixedArity = 2;
    G__16181.cljs$lang$applyTo = function(arglist__16185) {
      var x = cljs.core.first(arglist__16185);
      var y = cljs.core.first(cljs.core.next(arglist__16185));
      var more = cljs.core.rest(cljs.core.next(arglist__16185));
      return G__16181__delegate(x, y, more)
    };
    G__16181.cljs$lang$arity$variadic = G__16181__delegate;
    return G__16181
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
    var G__16186__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__16187 = y;
            var G__16188 = cljs.core.first.call(null, more);
            var G__16189 = cljs.core.next.call(null, more);
            x = G__16187;
            y = G__16188;
            more = G__16189;
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
    var G__16186 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16186__delegate.call(this, x, y, more)
    };
    G__16186.cljs$lang$maxFixedArity = 2;
    G__16186.cljs$lang$applyTo = function(arglist__16190) {
      var x = cljs.core.first(arglist__16190);
      var y = cljs.core.first(cljs.core.next(arglist__16190));
      var more = cljs.core.rest(cljs.core.next(arglist__16190));
      return G__16186__delegate(x, y, more)
    };
    G__16186.cljs$lang$arity$variadic = G__16186__delegate;
    return G__16186
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
    var G__16191__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__16191 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16191__delegate.call(this, x, y, more)
    };
    G__16191.cljs$lang$maxFixedArity = 2;
    G__16191.cljs$lang$applyTo = function(arglist__16192) {
      var x = cljs.core.first(arglist__16192);
      var y = cljs.core.first(cljs.core.next(arglist__16192));
      var more = cljs.core.rest(cljs.core.next(arglist__16192));
      return G__16191__delegate(x, y, more)
    };
    G__16191.cljs$lang$arity$variadic = G__16191__delegate;
    return G__16191
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
    var G__16193__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__16193 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16193__delegate.call(this, x, y, more)
    };
    G__16193.cljs$lang$maxFixedArity = 2;
    G__16193.cljs$lang$applyTo = function(arglist__16194) {
      var x = cljs.core.first(arglist__16194);
      var y = cljs.core.first(cljs.core.next(arglist__16194));
      var more = cljs.core.rest(cljs.core.next(arglist__16194));
      return G__16193__delegate(x, y, more)
    };
    G__16193.cljs$lang$arity$variadic = G__16193__delegate;
    return G__16193
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
  var rem__16196 = n % d;
  return cljs.core.fix.call(null, (n - rem__16196) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__16198 = cljs.core.quot.call(null, n, d);
  return n - d * q__16198
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
  var v__16201 = v - (v >> 1 & 1431655765);
  var v__16202 = (v__16201 & 858993459) + (v__16201 >> 2 & 858993459);
  return(v__16202 + (v__16202 >> 4) & 252645135) * 16843009 >> 24
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
    var G__16203__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__16204 = y;
            var G__16205 = cljs.core.first.call(null, more);
            var G__16206 = cljs.core.next.call(null, more);
            x = G__16204;
            y = G__16205;
            more = G__16206;
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
    var G__16203 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16203__delegate.call(this, x, y, more)
    };
    G__16203.cljs$lang$maxFixedArity = 2;
    G__16203.cljs$lang$applyTo = function(arglist__16207) {
      var x = cljs.core.first(arglist__16207);
      var y = cljs.core.first(cljs.core.next(arglist__16207));
      var more = cljs.core.rest(cljs.core.next(arglist__16207));
      return G__16203__delegate(x, y, more)
    };
    G__16203.cljs$lang$arity$variadic = G__16203__delegate;
    return G__16203
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
  var n__16211 = n;
  var xs__16212 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____16213 = xs__16212;
      if(and__3822__auto____16213) {
        return n__16211 > 0
      }else {
        return and__3822__auto____16213
      }
    }())) {
      var G__16214 = n__16211 - 1;
      var G__16215 = cljs.core.next.call(null, xs__16212);
      n__16211 = G__16214;
      xs__16212 = G__16215;
      continue
    }else {
      return xs__16212
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
    var G__16216__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16217 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__16218 = cljs.core.next.call(null, more);
            sb = G__16217;
            more = G__16218;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__16216 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16216__delegate.call(this, x, ys)
    };
    G__16216.cljs$lang$maxFixedArity = 1;
    G__16216.cljs$lang$applyTo = function(arglist__16219) {
      var x = cljs.core.first(arglist__16219);
      var ys = cljs.core.rest(arglist__16219);
      return G__16216__delegate(x, ys)
    };
    G__16216.cljs$lang$arity$variadic = G__16216__delegate;
    return G__16216
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
    var G__16220__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__16221 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__16222 = cljs.core.next.call(null, more);
            sb = G__16221;
            more = G__16222;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__16220 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16220__delegate.call(this, x, ys)
    };
    G__16220.cljs$lang$maxFixedArity = 1;
    G__16220.cljs$lang$applyTo = function(arglist__16223) {
      var x = cljs.core.first(arglist__16223);
      var ys = cljs.core.rest(arglist__16223);
      return G__16220__delegate(x, ys)
    };
    G__16220.cljs$lang$arity$variadic = G__16220__delegate;
    return G__16220
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
  format.cljs$lang$applyTo = function(arglist__16224) {
    var fmt = cljs.core.first(arglist__16224);
    var args = cljs.core.rest(arglist__16224);
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
    var xs__16227 = cljs.core.seq.call(null, x);
    var ys__16228 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__16227 == null) {
        return ys__16228 == null
      }else {
        if(ys__16228 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__16227), cljs.core.first.call(null, ys__16228))) {
            var G__16229 = cljs.core.next.call(null, xs__16227);
            var G__16230 = cljs.core.next.call(null, ys__16228);
            xs__16227 = G__16229;
            ys__16228 = G__16230;
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
  return cljs.core.reduce.call(null, function(p1__16231_SHARP_, p2__16232_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__16231_SHARP_, cljs.core.hash.call(null, p2__16232_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__16236 = 0;
  var s__16237 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__16237) {
      var e__16238 = cljs.core.first.call(null, s__16237);
      var G__16239 = (h__16236 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__16238)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__16238)))) % 4503599627370496;
      var G__16240 = cljs.core.next.call(null, s__16237);
      h__16236 = G__16239;
      s__16237 = G__16240;
      continue
    }else {
      return h__16236
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__16244 = 0;
  var s__16245 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__16245) {
      var e__16246 = cljs.core.first.call(null, s__16245);
      var G__16247 = (h__16244 + cljs.core.hash.call(null, e__16246)) % 4503599627370496;
      var G__16248 = cljs.core.next.call(null, s__16245);
      h__16244 = G__16247;
      s__16245 = G__16248;
      continue
    }else {
      return h__16244
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__16269__16270 = cljs.core.seq.call(null, fn_map);
  if(G__16269__16270) {
    var G__16272__16274 = cljs.core.first.call(null, G__16269__16270);
    var vec__16273__16275 = G__16272__16274;
    var key_name__16276 = cljs.core.nth.call(null, vec__16273__16275, 0, null);
    var f__16277 = cljs.core.nth.call(null, vec__16273__16275, 1, null);
    var G__16269__16278 = G__16269__16270;
    var G__16272__16279 = G__16272__16274;
    var G__16269__16280 = G__16269__16278;
    while(true) {
      var vec__16281__16282 = G__16272__16279;
      var key_name__16283 = cljs.core.nth.call(null, vec__16281__16282, 0, null);
      var f__16284 = cljs.core.nth.call(null, vec__16281__16282, 1, null);
      var G__16269__16285 = G__16269__16280;
      var str_name__16286 = cljs.core.name.call(null, key_name__16283);
      obj[str_name__16286] = f__16284;
      var temp__3974__auto____16287 = cljs.core.next.call(null, G__16269__16285);
      if(temp__3974__auto____16287) {
        var G__16269__16288 = temp__3974__auto____16287;
        var G__16289 = cljs.core.first.call(null, G__16269__16288);
        var G__16290 = G__16269__16288;
        G__16272__16279 = G__16289;
        G__16269__16280 = G__16290;
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
  var this__16291 = this;
  var h__2198__auto____16292 = this__16291.__hash;
  if(!(h__2198__auto____16292 == null)) {
    return h__2198__auto____16292
  }else {
    var h__2198__auto____16293 = cljs.core.hash_coll.call(null, coll);
    this__16291.__hash = h__2198__auto____16293;
    return h__2198__auto____16293
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16294 = this;
  if(this__16294.count === 1) {
    return null
  }else {
    return this__16294.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16295 = this;
  return new cljs.core.List(this__16295.meta, o, coll, this__16295.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__16296 = this;
  var this__16297 = this;
  return cljs.core.pr_str.call(null, this__16297)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16298 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16299 = this;
  return this__16299.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16300 = this;
  return this__16300.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16301 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16302 = this;
  return this__16302.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16303 = this;
  if(this__16303.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__16303.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16304 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16305 = this;
  return new cljs.core.List(meta, this__16305.first, this__16305.rest, this__16305.count, this__16305.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16306 = this;
  return this__16306.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16307 = this;
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
  var this__16308 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16309 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16310 = this;
  return new cljs.core.List(this__16310.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__16311 = this;
  var this__16312 = this;
  return cljs.core.pr_str.call(null, this__16312)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16313 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16314 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__16315 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__16316 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16317 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16318 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16319 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16320 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16321 = this;
  return this__16321.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16322 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__16326__16327 = coll;
  if(G__16326__16327) {
    if(function() {
      var or__3824__auto____16328 = G__16326__16327.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____16328) {
        return or__3824__auto____16328
      }else {
        return G__16326__16327.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__16326__16327.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16326__16327)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__16326__16327)
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
    var G__16329__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__16329 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16329__delegate.call(this, x, y, z, items)
    };
    G__16329.cljs$lang$maxFixedArity = 3;
    G__16329.cljs$lang$applyTo = function(arglist__16330) {
      var x = cljs.core.first(arglist__16330);
      var y = cljs.core.first(cljs.core.next(arglist__16330));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16330)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16330)));
      return G__16329__delegate(x, y, z, items)
    };
    G__16329.cljs$lang$arity$variadic = G__16329__delegate;
    return G__16329
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
  var this__16331 = this;
  var h__2198__auto____16332 = this__16331.__hash;
  if(!(h__2198__auto____16332 == null)) {
    return h__2198__auto____16332
  }else {
    var h__2198__auto____16333 = cljs.core.hash_coll.call(null, coll);
    this__16331.__hash = h__2198__auto____16333;
    return h__2198__auto____16333
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16334 = this;
  if(this__16334.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__16334.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16335 = this;
  return new cljs.core.Cons(null, o, coll, this__16335.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__16336 = this;
  var this__16337 = this;
  return cljs.core.pr_str.call(null, this__16337)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16338 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16339 = this;
  return this__16339.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16340 = this;
  if(this__16340.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16340.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16341 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16342 = this;
  return new cljs.core.Cons(meta, this__16342.first, this__16342.rest, this__16342.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16343 = this;
  return this__16343.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16344 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16344.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____16349 = coll == null;
    if(or__3824__auto____16349) {
      return or__3824__auto____16349
    }else {
      var G__16350__16351 = coll;
      if(G__16350__16351) {
        if(function() {
          var or__3824__auto____16352 = G__16350__16351.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____16352) {
            return or__3824__auto____16352
          }else {
            return G__16350__16351.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__16350__16351.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16350__16351)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__16350__16351)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__16356__16357 = x;
  if(G__16356__16357) {
    if(function() {
      var or__3824__auto____16358 = G__16356__16357.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____16358) {
        return or__3824__auto____16358
      }else {
        return G__16356__16357.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__16356__16357.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16356__16357)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__16356__16357)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__16359 = null;
  var G__16359__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__16359__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__16359 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__16359__2.call(this, string, f);
      case 3:
        return G__16359__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16359
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__16360 = null;
  var G__16360__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__16360__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__16360 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16360__2.call(this, string, k);
      case 3:
        return G__16360__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16360
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__16361 = null;
  var G__16361__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__16361__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__16361 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16361__2.call(this, string, n);
      case 3:
        return G__16361__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16361
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
  var G__16373 = null;
  var G__16373__2 = function(this_sym16364, coll) {
    var this__16366 = this;
    var this_sym16364__16367 = this;
    var ___16368 = this_sym16364__16367;
    if(coll == null) {
      return null
    }else {
      var strobj__16369 = coll.strobj;
      if(strobj__16369 == null) {
        return cljs.core._lookup.call(null, coll, this__16366.k, null)
      }else {
        return strobj__16369[this__16366.k]
      }
    }
  };
  var G__16373__3 = function(this_sym16365, coll, not_found) {
    var this__16366 = this;
    var this_sym16365__16370 = this;
    var ___16371 = this_sym16365__16370;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__16366.k, not_found)
    }
  };
  G__16373 = function(this_sym16365, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16373__2.call(this, this_sym16365, coll);
      case 3:
        return G__16373__3.call(this, this_sym16365, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16373
}();
cljs.core.Keyword.prototype.apply = function(this_sym16362, args16363) {
  var this__16372 = this;
  return this_sym16362.call.apply(this_sym16362, [this_sym16362].concat(args16363.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__16382 = null;
  var G__16382__2 = function(this_sym16376, coll) {
    var this_sym16376__16378 = this;
    var this__16379 = this_sym16376__16378;
    return cljs.core._lookup.call(null, coll, this__16379.toString(), null)
  };
  var G__16382__3 = function(this_sym16377, coll, not_found) {
    var this_sym16377__16380 = this;
    var this__16381 = this_sym16377__16380;
    return cljs.core._lookup.call(null, coll, this__16381.toString(), not_found)
  };
  G__16382 = function(this_sym16377, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16382__2.call(this, this_sym16377, coll);
      case 3:
        return G__16382__3.call(this, this_sym16377, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16382
}();
String.prototype.apply = function(this_sym16374, args16375) {
  return this_sym16374.call.apply(this_sym16374, [this_sym16374].concat(args16375.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__16384 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__16384
  }else {
    lazy_seq.x = x__16384.call(null);
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
  var this__16385 = this;
  var h__2198__auto____16386 = this__16385.__hash;
  if(!(h__2198__auto____16386 == null)) {
    return h__2198__auto____16386
  }else {
    var h__2198__auto____16387 = cljs.core.hash_coll.call(null, coll);
    this__16385.__hash = h__2198__auto____16387;
    return h__2198__auto____16387
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__16388 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16389 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__16390 = this;
  var this__16391 = this;
  return cljs.core.pr_str.call(null, this__16391)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16392 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16393 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16394 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16395 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16396 = this;
  return new cljs.core.LazySeq(meta, this__16396.realized, this__16396.x, this__16396.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16397 = this;
  return this__16397.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16398 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16398.meta)
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
  var this__16399 = this;
  return this__16399.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__16400 = this;
  var ___16401 = this;
  this__16400.buf[this__16400.end] = o;
  return this__16400.end = this__16400.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__16402 = this;
  var ___16403 = this;
  var ret__16404 = new cljs.core.ArrayChunk(this__16402.buf, 0, this__16402.end);
  this__16402.buf = null;
  return ret__16404
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
  var this__16405 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__16405.arr[this__16405.off], this__16405.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__16406 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__16406.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__16407 = this;
  if(this__16407.off === this__16407.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__16407.arr, this__16407.off + 1, this__16407.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__16408 = this;
  return this__16408.arr[this__16408.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__16409 = this;
  if(function() {
    var and__3822__auto____16410 = i >= 0;
    if(and__3822__auto____16410) {
      return i < this__16409.end - this__16409.off
    }else {
      return and__3822__auto____16410
    }
  }()) {
    return this__16409.arr[this__16409.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__16411 = this;
  return this__16411.end - this__16411.off
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
  var this__16412 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16413 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16414 = this;
  return cljs.core._nth.call(null, this__16414.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16415 = this;
  if(cljs.core._count.call(null, this__16415.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__16415.chunk), this__16415.more, this__16415.meta)
  }else {
    if(this__16415.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__16415.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__16416 = this;
  if(this__16416.more == null) {
    return null
  }else {
    return this__16416.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16417 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__16418 = this;
  return new cljs.core.ChunkedCons(this__16418.chunk, this__16418.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16419 = this;
  return this__16419.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__16420 = this;
  return this__16420.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__16421 = this;
  if(this__16421.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__16421.more
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
    var G__16425__16426 = s;
    if(G__16425__16426) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____16427 = null;
        if(cljs.core.truth_(or__3824__auto____16427)) {
          return or__3824__auto____16427
        }else {
          return G__16425__16426.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__16425__16426.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16425__16426)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__16425__16426)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__16430 = [];
  var s__16431 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__16431)) {
      ary__16430.push(cljs.core.first.call(null, s__16431));
      var G__16432 = cljs.core.next.call(null, s__16431);
      s__16431 = G__16432;
      continue
    }else {
      return ary__16430
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__16436 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__16437 = 0;
  var xs__16438 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__16438) {
      ret__16436[i__16437] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__16438));
      var G__16439 = i__16437 + 1;
      var G__16440 = cljs.core.next.call(null, xs__16438);
      i__16437 = G__16439;
      xs__16438 = G__16440;
      continue
    }else {
    }
    break
  }
  return ret__16436
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
    var a__16448 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16449 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16450 = 0;
      var s__16451 = s__16449;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16452 = s__16451;
          if(and__3822__auto____16452) {
            return i__16450 < size
          }else {
            return and__3822__auto____16452
          }
        }())) {
          a__16448[i__16450] = cljs.core.first.call(null, s__16451);
          var G__16455 = i__16450 + 1;
          var G__16456 = cljs.core.next.call(null, s__16451);
          i__16450 = G__16455;
          s__16451 = G__16456;
          continue
        }else {
          return a__16448
        }
        break
      }
    }else {
      var n__2533__auto____16453 = size;
      var i__16454 = 0;
      while(true) {
        if(i__16454 < n__2533__auto____16453) {
          a__16448[i__16454] = init_val_or_seq;
          var G__16457 = i__16454 + 1;
          i__16454 = G__16457;
          continue
        }else {
        }
        break
      }
      return a__16448
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
    var a__16465 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16466 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16467 = 0;
      var s__16468 = s__16466;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16469 = s__16468;
          if(and__3822__auto____16469) {
            return i__16467 < size
          }else {
            return and__3822__auto____16469
          }
        }())) {
          a__16465[i__16467] = cljs.core.first.call(null, s__16468);
          var G__16472 = i__16467 + 1;
          var G__16473 = cljs.core.next.call(null, s__16468);
          i__16467 = G__16472;
          s__16468 = G__16473;
          continue
        }else {
          return a__16465
        }
        break
      }
    }else {
      var n__2533__auto____16470 = size;
      var i__16471 = 0;
      while(true) {
        if(i__16471 < n__2533__auto____16470) {
          a__16465[i__16471] = init_val_or_seq;
          var G__16474 = i__16471 + 1;
          i__16471 = G__16474;
          continue
        }else {
        }
        break
      }
      return a__16465
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
    var a__16482 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__16483 = cljs.core.seq.call(null, init_val_or_seq);
      var i__16484 = 0;
      var s__16485 = s__16483;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____16486 = s__16485;
          if(and__3822__auto____16486) {
            return i__16484 < size
          }else {
            return and__3822__auto____16486
          }
        }())) {
          a__16482[i__16484] = cljs.core.first.call(null, s__16485);
          var G__16489 = i__16484 + 1;
          var G__16490 = cljs.core.next.call(null, s__16485);
          i__16484 = G__16489;
          s__16485 = G__16490;
          continue
        }else {
          return a__16482
        }
        break
      }
    }else {
      var n__2533__auto____16487 = size;
      var i__16488 = 0;
      while(true) {
        if(i__16488 < n__2533__auto____16487) {
          a__16482[i__16488] = init_val_or_seq;
          var G__16491 = i__16488 + 1;
          i__16488 = G__16491;
          continue
        }else {
        }
        break
      }
      return a__16482
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
    var s__16496 = s;
    var i__16497 = n;
    var sum__16498 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____16499 = i__16497 > 0;
        if(and__3822__auto____16499) {
          return cljs.core.seq.call(null, s__16496)
        }else {
          return and__3822__auto____16499
        }
      }())) {
        var G__16500 = cljs.core.next.call(null, s__16496);
        var G__16501 = i__16497 - 1;
        var G__16502 = sum__16498 + 1;
        s__16496 = G__16500;
        i__16497 = G__16501;
        sum__16498 = G__16502;
        continue
      }else {
        return sum__16498
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
      var s__16507 = cljs.core.seq.call(null, x);
      if(s__16507) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16507)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__16507), concat.call(null, cljs.core.chunk_rest.call(null, s__16507), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__16507), concat.call(null, cljs.core.rest.call(null, s__16507), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__16511__delegate = function(x, y, zs) {
      var cat__16510 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__16509 = cljs.core.seq.call(null, xys);
          if(xys__16509) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__16509)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__16509), cat.call(null, cljs.core.chunk_rest.call(null, xys__16509), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__16509), cat.call(null, cljs.core.rest.call(null, xys__16509), zs))
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
      return cat__16510.call(null, concat.call(null, x, y), zs)
    };
    var G__16511 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16511__delegate.call(this, x, y, zs)
    };
    G__16511.cljs$lang$maxFixedArity = 2;
    G__16511.cljs$lang$applyTo = function(arglist__16512) {
      var x = cljs.core.first(arglist__16512);
      var y = cljs.core.first(cljs.core.next(arglist__16512));
      var zs = cljs.core.rest(cljs.core.next(arglist__16512));
      return G__16511__delegate(x, y, zs)
    };
    G__16511.cljs$lang$arity$variadic = G__16511__delegate;
    return G__16511
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
    var G__16513__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__16513 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16513__delegate.call(this, a, b, c, d, more)
    };
    G__16513.cljs$lang$maxFixedArity = 4;
    G__16513.cljs$lang$applyTo = function(arglist__16514) {
      var a = cljs.core.first(arglist__16514);
      var b = cljs.core.first(cljs.core.next(arglist__16514));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16514)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16514))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16514))));
      return G__16513__delegate(a, b, c, d, more)
    };
    G__16513.cljs$lang$arity$variadic = G__16513__delegate;
    return G__16513
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
  var args__16556 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__16557 = cljs.core._first.call(null, args__16556);
    var args__16558 = cljs.core._rest.call(null, args__16556);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__16557)
      }else {
        return f.call(null, a__16557)
      }
    }else {
      var b__16559 = cljs.core._first.call(null, args__16558);
      var args__16560 = cljs.core._rest.call(null, args__16558);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__16557, b__16559)
        }else {
          return f.call(null, a__16557, b__16559)
        }
      }else {
        var c__16561 = cljs.core._first.call(null, args__16560);
        var args__16562 = cljs.core._rest.call(null, args__16560);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__16557, b__16559, c__16561)
          }else {
            return f.call(null, a__16557, b__16559, c__16561)
          }
        }else {
          var d__16563 = cljs.core._first.call(null, args__16562);
          var args__16564 = cljs.core._rest.call(null, args__16562);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__16557, b__16559, c__16561, d__16563)
            }else {
              return f.call(null, a__16557, b__16559, c__16561, d__16563)
            }
          }else {
            var e__16565 = cljs.core._first.call(null, args__16564);
            var args__16566 = cljs.core._rest.call(null, args__16564);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__16557, b__16559, c__16561, d__16563, e__16565)
              }else {
                return f.call(null, a__16557, b__16559, c__16561, d__16563, e__16565)
              }
            }else {
              var f__16567 = cljs.core._first.call(null, args__16566);
              var args__16568 = cljs.core._rest.call(null, args__16566);
              if(argc === 6) {
                if(f__16567.cljs$lang$arity$6) {
                  return f__16567.cljs$lang$arity$6(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567)
                }else {
                  return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567)
                }
              }else {
                var g__16569 = cljs.core._first.call(null, args__16568);
                var args__16570 = cljs.core._rest.call(null, args__16568);
                if(argc === 7) {
                  if(f__16567.cljs$lang$arity$7) {
                    return f__16567.cljs$lang$arity$7(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569)
                  }else {
                    return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569)
                  }
                }else {
                  var h__16571 = cljs.core._first.call(null, args__16570);
                  var args__16572 = cljs.core._rest.call(null, args__16570);
                  if(argc === 8) {
                    if(f__16567.cljs$lang$arity$8) {
                      return f__16567.cljs$lang$arity$8(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571)
                    }else {
                      return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571)
                    }
                  }else {
                    var i__16573 = cljs.core._first.call(null, args__16572);
                    var args__16574 = cljs.core._rest.call(null, args__16572);
                    if(argc === 9) {
                      if(f__16567.cljs$lang$arity$9) {
                        return f__16567.cljs$lang$arity$9(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573)
                      }else {
                        return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573)
                      }
                    }else {
                      var j__16575 = cljs.core._first.call(null, args__16574);
                      var args__16576 = cljs.core._rest.call(null, args__16574);
                      if(argc === 10) {
                        if(f__16567.cljs$lang$arity$10) {
                          return f__16567.cljs$lang$arity$10(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575)
                        }else {
                          return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575)
                        }
                      }else {
                        var k__16577 = cljs.core._first.call(null, args__16576);
                        var args__16578 = cljs.core._rest.call(null, args__16576);
                        if(argc === 11) {
                          if(f__16567.cljs$lang$arity$11) {
                            return f__16567.cljs$lang$arity$11(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577)
                          }else {
                            return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577)
                          }
                        }else {
                          var l__16579 = cljs.core._first.call(null, args__16578);
                          var args__16580 = cljs.core._rest.call(null, args__16578);
                          if(argc === 12) {
                            if(f__16567.cljs$lang$arity$12) {
                              return f__16567.cljs$lang$arity$12(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579)
                            }else {
                              return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579)
                            }
                          }else {
                            var m__16581 = cljs.core._first.call(null, args__16580);
                            var args__16582 = cljs.core._rest.call(null, args__16580);
                            if(argc === 13) {
                              if(f__16567.cljs$lang$arity$13) {
                                return f__16567.cljs$lang$arity$13(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581)
                              }else {
                                return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581)
                              }
                            }else {
                              var n__16583 = cljs.core._first.call(null, args__16582);
                              var args__16584 = cljs.core._rest.call(null, args__16582);
                              if(argc === 14) {
                                if(f__16567.cljs$lang$arity$14) {
                                  return f__16567.cljs$lang$arity$14(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583)
                                }else {
                                  return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583)
                                }
                              }else {
                                var o__16585 = cljs.core._first.call(null, args__16584);
                                var args__16586 = cljs.core._rest.call(null, args__16584);
                                if(argc === 15) {
                                  if(f__16567.cljs$lang$arity$15) {
                                    return f__16567.cljs$lang$arity$15(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585)
                                  }else {
                                    return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585)
                                  }
                                }else {
                                  var p__16587 = cljs.core._first.call(null, args__16586);
                                  var args__16588 = cljs.core._rest.call(null, args__16586);
                                  if(argc === 16) {
                                    if(f__16567.cljs$lang$arity$16) {
                                      return f__16567.cljs$lang$arity$16(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587)
                                    }else {
                                      return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587)
                                    }
                                  }else {
                                    var q__16589 = cljs.core._first.call(null, args__16588);
                                    var args__16590 = cljs.core._rest.call(null, args__16588);
                                    if(argc === 17) {
                                      if(f__16567.cljs$lang$arity$17) {
                                        return f__16567.cljs$lang$arity$17(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589)
                                      }else {
                                        return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589)
                                      }
                                    }else {
                                      var r__16591 = cljs.core._first.call(null, args__16590);
                                      var args__16592 = cljs.core._rest.call(null, args__16590);
                                      if(argc === 18) {
                                        if(f__16567.cljs$lang$arity$18) {
                                          return f__16567.cljs$lang$arity$18(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591)
                                        }else {
                                          return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591)
                                        }
                                      }else {
                                        var s__16593 = cljs.core._first.call(null, args__16592);
                                        var args__16594 = cljs.core._rest.call(null, args__16592);
                                        if(argc === 19) {
                                          if(f__16567.cljs$lang$arity$19) {
                                            return f__16567.cljs$lang$arity$19(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591, s__16593)
                                          }else {
                                            return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591, s__16593)
                                          }
                                        }else {
                                          var t__16595 = cljs.core._first.call(null, args__16594);
                                          var args__16596 = cljs.core._rest.call(null, args__16594);
                                          if(argc === 20) {
                                            if(f__16567.cljs$lang$arity$20) {
                                              return f__16567.cljs$lang$arity$20(a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591, s__16593, t__16595)
                                            }else {
                                              return f__16567.call(null, a__16557, b__16559, c__16561, d__16563, e__16565, f__16567, g__16569, h__16571, i__16573, j__16575, k__16577, l__16579, m__16581, n__16583, o__16585, p__16587, q__16589, r__16591, s__16593, t__16595)
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
    var fixed_arity__16611 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16612 = cljs.core.bounded_count.call(null, args, fixed_arity__16611 + 1);
      if(bc__16612 <= fixed_arity__16611) {
        return cljs.core.apply_to.call(null, f, bc__16612, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__16613 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__16614 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16615 = cljs.core.bounded_count.call(null, arglist__16613, fixed_arity__16614 + 1);
      if(bc__16615 <= fixed_arity__16614) {
        return cljs.core.apply_to.call(null, f, bc__16615, arglist__16613)
      }else {
        return f.cljs$lang$applyTo(arglist__16613)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16613))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__16616 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__16617 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16618 = cljs.core.bounded_count.call(null, arglist__16616, fixed_arity__16617 + 1);
      if(bc__16618 <= fixed_arity__16617) {
        return cljs.core.apply_to.call(null, f, bc__16618, arglist__16616)
      }else {
        return f.cljs$lang$applyTo(arglist__16616)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16616))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__16619 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__16620 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__16621 = cljs.core.bounded_count.call(null, arglist__16619, fixed_arity__16620 + 1);
      if(bc__16621 <= fixed_arity__16620) {
        return cljs.core.apply_to.call(null, f, bc__16621, arglist__16619)
      }else {
        return f.cljs$lang$applyTo(arglist__16619)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__16619))
    }
  };
  var apply__6 = function() {
    var G__16625__delegate = function(f, a, b, c, d, args) {
      var arglist__16622 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__16623 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__16624 = cljs.core.bounded_count.call(null, arglist__16622, fixed_arity__16623 + 1);
        if(bc__16624 <= fixed_arity__16623) {
          return cljs.core.apply_to.call(null, f, bc__16624, arglist__16622)
        }else {
          return f.cljs$lang$applyTo(arglist__16622)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__16622))
      }
    };
    var G__16625 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__16625__delegate.call(this, f, a, b, c, d, args)
    };
    G__16625.cljs$lang$maxFixedArity = 5;
    G__16625.cljs$lang$applyTo = function(arglist__16626) {
      var f = cljs.core.first(arglist__16626);
      var a = cljs.core.first(cljs.core.next(arglist__16626));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16626)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16626))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16626)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16626)))));
      return G__16625__delegate(f, a, b, c, d, args)
    };
    G__16625.cljs$lang$arity$variadic = G__16625__delegate;
    return G__16625
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
  vary_meta.cljs$lang$applyTo = function(arglist__16627) {
    var obj = cljs.core.first(arglist__16627);
    var f = cljs.core.first(cljs.core.next(arglist__16627));
    var args = cljs.core.rest(cljs.core.next(arglist__16627));
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
    var G__16628__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__16628 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__16628__delegate.call(this, x, y, more)
    };
    G__16628.cljs$lang$maxFixedArity = 2;
    G__16628.cljs$lang$applyTo = function(arglist__16629) {
      var x = cljs.core.first(arglist__16629);
      var y = cljs.core.first(cljs.core.next(arglist__16629));
      var more = cljs.core.rest(cljs.core.next(arglist__16629));
      return G__16628__delegate(x, y, more)
    };
    G__16628.cljs$lang$arity$variadic = G__16628__delegate;
    return G__16628
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
        var G__16630 = pred;
        var G__16631 = cljs.core.next.call(null, coll);
        pred = G__16630;
        coll = G__16631;
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
      var or__3824__auto____16633 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____16633)) {
        return or__3824__auto____16633
      }else {
        var G__16634 = pred;
        var G__16635 = cljs.core.next.call(null, coll);
        pred = G__16634;
        coll = G__16635;
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
    var G__16636 = null;
    var G__16636__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__16636__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__16636__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__16636__3 = function() {
      var G__16637__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__16637 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__16637__delegate.call(this, x, y, zs)
      };
      G__16637.cljs$lang$maxFixedArity = 2;
      G__16637.cljs$lang$applyTo = function(arglist__16638) {
        var x = cljs.core.first(arglist__16638);
        var y = cljs.core.first(cljs.core.next(arglist__16638));
        var zs = cljs.core.rest(cljs.core.next(arglist__16638));
        return G__16637__delegate(x, y, zs)
      };
      G__16637.cljs$lang$arity$variadic = G__16637__delegate;
      return G__16637
    }();
    G__16636 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__16636__0.call(this);
        case 1:
          return G__16636__1.call(this, x);
        case 2:
          return G__16636__2.call(this, x, y);
        default:
          return G__16636__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__16636.cljs$lang$maxFixedArity = 2;
    G__16636.cljs$lang$applyTo = G__16636__3.cljs$lang$applyTo;
    return G__16636
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__16639__delegate = function(args) {
      return x
    };
    var G__16639 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16639__delegate.call(this, args)
    };
    G__16639.cljs$lang$maxFixedArity = 0;
    G__16639.cljs$lang$applyTo = function(arglist__16640) {
      var args = cljs.core.seq(arglist__16640);
      return G__16639__delegate(args)
    };
    G__16639.cljs$lang$arity$variadic = G__16639__delegate;
    return G__16639
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
      var G__16647 = null;
      var G__16647__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__16647__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__16647__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__16647__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__16647__4 = function() {
        var G__16648__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__16648 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16648__delegate.call(this, x, y, z, args)
        };
        G__16648.cljs$lang$maxFixedArity = 3;
        G__16648.cljs$lang$applyTo = function(arglist__16649) {
          var x = cljs.core.first(arglist__16649);
          var y = cljs.core.first(cljs.core.next(arglist__16649));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16649)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16649)));
          return G__16648__delegate(x, y, z, args)
        };
        G__16648.cljs$lang$arity$variadic = G__16648__delegate;
        return G__16648
      }();
      G__16647 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16647__0.call(this);
          case 1:
            return G__16647__1.call(this, x);
          case 2:
            return G__16647__2.call(this, x, y);
          case 3:
            return G__16647__3.call(this, x, y, z);
          default:
            return G__16647__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16647.cljs$lang$maxFixedArity = 3;
      G__16647.cljs$lang$applyTo = G__16647__4.cljs$lang$applyTo;
      return G__16647
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__16650 = null;
      var G__16650__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__16650__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__16650__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__16650__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__16650__4 = function() {
        var G__16651__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__16651 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16651__delegate.call(this, x, y, z, args)
        };
        G__16651.cljs$lang$maxFixedArity = 3;
        G__16651.cljs$lang$applyTo = function(arglist__16652) {
          var x = cljs.core.first(arglist__16652);
          var y = cljs.core.first(cljs.core.next(arglist__16652));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16652)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16652)));
          return G__16651__delegate(x, y, z, args)
        };
        G__16651.cljs$lang$arity$variadic = G__16651__delegate;
        return G__16651
      }();
      G__16650 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__16650__0.call(this);
          case 1:
            return G__16650__1.call(this, x);
          case 2:
            return G__16650__2.call(this, x, y);
          case 3:
            return G__16650__3.call(this, x, y, z);
          default:
            return G__16650__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16650.cljs$lang$maxFixedArity = 3;
      G__16650.cljs$lang$applyTo = G__16650__4.cljs$lang$applyTo;
      return G__16650
    }()
  };
  var comp__4 = function() {
    var G__16653__delegate = function(f1, f2, f3, fs) {
      var fs__16644 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__16654__delegate = function(args) {
          var ret__16645 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__16644), args);
          var fs__16646 = cljs.core.next.call(null, fs__16644);
          while(true) {
            if(fs__16646) {
              var G__16655 = cljs.core.first.call(null, fs__16646).call(null, ret__16645);
              var G__16656 = cljs.core.next.call(null, fs__16646);
              ret__16645 = G__16655;
              fs__16646 = G__16656;
              continue
            }else {
              return ret__16645
            }
            break
          }
        };
        var G__16654 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16654__delegate.call(this, args)
        };
        G__16654.cljs$lang$maxFixedArity = 0;
        G__16654.cljs$lang$applyTo = function(arglist__16657) {
          var args = cljs.core.seq(arglist__16657);
          return G__16654__delegate(args)
        };
        G__16654.cljs$lang$arity$variadic = G__16654__delegate;
        return G__16654
      }()
    };
    var G__16653 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16653__delegate.call(this, f1, f2, f3, fs)
    };
    G__16653.cljs$lang$maxFixedArity = 3;
    G__16653.cljs$lang$applyTo = function(arglist__16658) {
      var f1 = cljs.core.first(arglist__16658);
      var f2 = cljs.core.first(cljs.core.next(arglist__16658));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16658)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16658)));
      return G__16653__delegate(f1, f2, f3, fs)
    };
    G__16653.cljs$lang$arity$variadic = G__16653__delegate;
    return G__16653
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
      var G__16659__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__16659 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16659__delegate.call(this, args)
      };
      G__16659.cljs$lang$maxFixedArity = 0;
      G__16659.cljs$lang$applyTo = function(arglist__16660) {
        var args = cljs.core.seq(arglist__16660);
        return G__16659__delegate(args)
      };
      G__16659.cljs$lang$arity$variadic = G__16659__delegate;
      return G__16659
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__16661__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__16661 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16661__delegate.call(this, args)
      };
      G__16661.cljs$lang$maxFixedArity = 0;
      G__16661.cljs$lang$applyTo = function(arglist__16662) {
        var args = cljs.core.seq(arglist__16662);
        return G__16661__delegate(args)
      };
      G__16661.cljs$lang$arity$variadic = G__16661__delegate;
      return G__16661
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__16663__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__16663 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__16663__delegate.call(this, args)
      };
      G__16663.cljs$lang$maxFixedArity = 0;
      G__16663.cljs$lang$applyTo = function(arglist__16664) {
        var args = cljs.core.seq(arglist__16664);
        return G__16663__delegate(args)
      };
      G__16663.cljs$lang$arity$variadic = G__16663__delegate;
      return G__16663
    }()
  };
  var partial__5 = function() {
    var G__16665__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__16666__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__16666 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__16666__delegate.call(this, args)
        };
        G__16666.cljs$lang$maxFixedArity = 0;
        G__16666.cljs$lang$applyTo = function(arglist__16667) {
          var args = cljs.core.seq(arglist__16667);
          return G__16666__delegate(args)
        };
        G__16666.cljs$lang$arity$variadic = G__16666__delegate;
        return G__16666
      }()
    };
    var G__16665 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__16665__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__16665.cljs$lang$maxFixedArity = 4;
    G__16665.cljs$lang$applyTo = function(arglist__16668) {
      var f = cljs.core.first(arglist__16668);
      var arg1 = cljs.core.first(cljs.core.next(arglist__16668));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16668)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16668))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__16668))));
      return G__16665__delegate(f, arg1, arg2, arg3, more)
    };
    G__16665.cljs$lang$arity$variadic = G__16665__delegate;
    return G__16665
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
      var G__16669 = null;
      var G__16669__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__16669__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__16669__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__16669__4 = function() {
        var G__16670__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__16670 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16670__delegate.call(this, a, b, c, ds)
        };
        G__16670.cljs$lang$maxFixedArity = 3;
        G__16670.cljs$lang$applyTo = function(arglist__16671) {
          var a = cljs.core.first(arglist__16671);
          var b = cljs.core.first(cljs.core.next(arglist__16671));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16671)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16671)));
          return G__16670__delegate(a, b, c, ds)
        };
        G__16670.cljs$lang$arity$variadic = G__16670__delegate;
        return G__16670
      }();
      G__16669 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__16669__1.call(this, a);
          case 2:
            return G__16669__2.call(this, a, b);
          case 3:
            return G__16669__3.call(this, a, b, c);
          default:
            return G__16669__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16669.cljs$lang$maxFixedArity = 3;
      G__16669.cljs$lang$applyTo = G__16669__4.cljs$lang$applyTo;
      return G__16669
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__16672 = null;
      var G__16672__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16672__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__16672__4 = function() {
        var G__16673__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__16673 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16673__delegate.call(this, a, b, c, ds)
        };
        G__16673.cljs$lang$maxFixedArity = 3;
        G__16673.cljs$lang$applyTo = function(arglist__16674) {
          var a = cljs.core.first(arglist__16674);
          var b = cljs.core.first(cljs.core.next(arglist__16674));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16674)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16674)));
          return G__16673__delegate(a, b, c, ds)
        };
        G__16673.cljs$lang$arity$variadic = G__16673__delegate;
        return G__16673
      }();
      G__16672 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16672__2.call(this, a, b);
          case 3:
            return G__16672__3.call(this, a, b, c);
          default:
            return G__16672__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16672.cljs$lang$maxFixedArity = 3;
      G__16672.cljs$lang$applyTo = G__16672__4.cljs$lang$applyTo;
      return G__16672
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__16675 = null;
      var G__16675__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__16675__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__16675__4 = function() {
        var G__16676__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__16676 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16676__delegate.call(this, a, b, c, ds)
        };
        G__16676.cljs$lang$maxFixedArity = 3;
        G__16676.cljs$lang$applyTo = function(arglist__16677) {
          var a = cljs.core.first(arglist__16677);
          var b = cljs.core.first(cljs.core.next(arglist__16677));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16677)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16677)));
          return G__16676__delegate(a, b, c, ds)
        };
        G__16676.cljs$lang$arity$variadic = G__16676__delegate;
        return G__16676
      }();
      G__16675 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__16675__2.call(this, a, b);
          case 3:
            return G__16675__3.call(this, a, b, c);
          default:
            return G__16675__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__16675.cljs$lang$maxFixedArity = 3;
      G__16675.cljs$lang$applyTo = G__16675__4.cljs$lang$applyTo;
      return G__16675
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
  var mapi__16693 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16701 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16701) {
        var s__16702 = temp__3974__auto____16701;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16702)) {
          var c__16703 = cljs.core.chunk_first.call(null, s__16702);
          var size__16704 = cljs.core.count.call(null, c__16703);
          var b__16705 = cljs.core.chunk_buffer.call(null, size__16704);
          var n__2533__auto____16706 = size__16704;
          var i__16707 = 0;
          while(true) {
            if(i__16707 < n__2533__auto____16706) {
              cljs.core.chunk_append.call(null, b__16705, f.call(null, idx + i__16707, cljs.core._nth.call(null, c__16703, i__16707)));
              var G__16708 = i__16707 + 1;
              i__16707 = G__16708;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16705), mapi.call(null, idx + size__16704, cljs.core.chunk_rest.call(null, s__16702)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__16702)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__16702)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__16693.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16718 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16718) {
      var s__16719 = temp__3974__auto____16718;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__16719)) {
        var c__16720 = cljs.core.chunk_first.call(null, s__16719);
        var size__16721 = cljs.core.count.call(null, c__16720);
        var b__16722 = cljs.core.chunk_buffer.call(null, size__16721);
        var n__2533__auto____16723 = size__16721;
        var i__16724 = 0;
        while(true) {
          if(i__16724 < n__2533__auto____16723) {
            var x__16725 = f.call(null, cljs.core._nth.call(null, c__16720, i__16724));
            if(x__16725 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__16722, x__16725)
            }
            var G__16727 = i__16724 + 1;
            i__16724 = G__16727;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16722), keep.call(null, f, cljs.core.chunk_rest.call(null, s__16719)))
      }else {
        var x__16726 = f.call(null, cljs.core.first.call(null, s__16719));
        if(x__16726 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__16719))
        }else {
          return cljs.core.cons.call(null, x__16726, keep.call(null, f, cljs.core.rest.call(null, s__16719)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__16753 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16763 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16763) {
        var s__16764 = temp__3974__auto____16763;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__16764)) {
          var c__16765 = cljs.core.chunk_first.call(null, s__16764);
          var size__16766 = cljs.core.count.call(null, c__16765);
          var b__16767 = cljs.core.chunk_buffer.call(null, size__16766);
          var n__2533__auto____16768 = size__16766;
          var i__16769 = 0;
          while(true) {
            if(i__16769 < n__2533__auto____16768) {
              var x__16770 = f.call(null, idx + i__16769, cljs.core._nth.call(null, c__16765, i__16769));
              if(x__16770 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__16767, x__16770)
              }
              var G__16772 = i__16769 + 1;
              i__16769 = G__16772;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__16767), keepi.call(null, idx + size__16766, cljs.core.chunk_rest.call(null, s__16764)))
        }else {
          var x__16771 = f.call(null, idx, cljs.core.first.call(null, s__16764));
          if(x__16771 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16764))
          }else {
            return cljs.core.cons.call(null, x__16771, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__16764)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__16753.call(null, 0, coll)
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
          var and__3822__auto____16858 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16858)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____16858
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16859 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16859)) {
            var and__3822__auto____16860 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16860)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____16860
            }
          }else {
            return and__3822__auto____16859
          }
        }())
      };
      var ep1__4 = function() {
        var G__16929__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16861 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16861)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____16861
            }
          }())
        };
        var G__16929 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16929__delegate.call(this, x, y, z, args)
        };
        G__16929.cljs$lang$maxFixedArity = 3;
        G__16929.cljs$lang$applyTo = function(arglist__16930) {
          var x = cljs.core.first(arglist__16930);
          var y = cljs.core.first(cljs.core.next(arglist__16930));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16930)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16930)));
          return G__16929__delegate(x, y, z, args)
        };
        G__16929.cljs$lang$arity$variadic = G__16929__delegate;
        return G__16929
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
          var and__3822__auto____16873 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16873)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____16873
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16874 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16874)) {
            var and__3822__auto____16875 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16875)) {
              var and__3822__auto____16876 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16876)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____16876
              }
            }else {
              return and__3822__auto____16875
            }
          }else {
            return and__3822__auto____16874
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16877 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16877)) {
            var and__3822__auto____16878 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____16878)) {
              var and__3822__auto____16879 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____16879)) {
                var and__3822__auto____16880 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____16880)) {
                  var and__3822__auto____16881 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16881)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____16881
                  }
                }else {
                  return and__3822__auto____16880
                }
              }else {
                return and__3822__auto____16879
              }
            }else {
              return and__3822__auto____16878
            }
          }else {
            return and__3822__auto____16877
          }
        }())
      };
      var ep2__4 = function() {
        var G__16931__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16882 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16882)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16728_SHARP_) {
                var and__3822__auto____16883 = p1.call(null, p1__16728_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16883)) {
                  return p2.call(null, p1__16728_SHARP_)
                }else {
                  return and__3822__auto____16883
                }
              }, args)
            }else {
              return and__3822__auto____16882
            }
          }())
        };
        var G__16931 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16931__delegate.call(this, x, y, z, args)
        };
        G__16931.cljs$lang$maxFixedArity = 3;
        G__16931.cljs$lang$applyTo = function(arglist__16932) {
          var x = cljs.core.first(arglist__16932);
          var y = cljs.core.first(cljs.core.next(arglist__16932));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16932)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16932)));
          return G__16931__delegate(x, y, z, args)
        };
        G__16931.cljs$lang$arity$variadic = G__16931__delegate;
        return G__16931
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
          var and__3822__auto____16902 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16902)) {
            var and__3822__auto____16903 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16903)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____16903
            }
          }else {
            return and__3822__auto____16902
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16904 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16904)) {
            var and__3822__auto____16905 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16905)) {
              var and__3822__auto____16906 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16906)) {
                var and__3822__auto____16907 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16907)) {
                  var and__3822__auto____16908 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16908)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____16908
                  }
                }else {
                  return and__3822__auto____16907
                }
              }else {
                return and__3822__auto____16906
              }
            }else {
              return and__3822__auto____16905
            }
          }else {
            return and__3822__auto____16904
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____16909 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____16909)) {
            var and__3822__auto____16910 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16910)) {
              var and__3822__auto____16911 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____16911)) {
                var and__3822__auto____16912 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____16912)) {
                  var and__3822__auto____16913 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____16913)) {
                    var and__3822__auto____16914 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____16914)) {
                      var and__3822__auto____16915 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____16915)) {
                        var and__3822__auto____16916 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____16916)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____16916
                        }
                      }else {
                        return and__3822__auto____16915
                      }
                    }else {
                      return and__3822__auto____16914
                    }
                  }else {
                    return and__3822__auto____16913
                  }
                }else {
                  return and__3822__auto____16912
                }
              }else {
                return and__3822__auto____16911
              }
            }else {
              return and__3822__auto____16910
            }
          }else {
            return and__3822__auto____16909
          }
        }())
      };
      var ep3__4 = function() {
        var G__16933__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____16917 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____16917)) {
              return cljs.core.every_QMARK_.call(null, function(p1__16729_SHARP_) {
                var and__3822__auto____16918 = p1.call(null, p1__16729_SHARP_);
                if(cljs.core.truth_(and__3822__auto____16918)) {
                  var and__3822__auto____16919 = p2.call(null, p1__16729_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____16919)) {
                    return p3.call(null, p1__16729_SHARP_)
                  }else {
                    return and__3822__auto____16919
                  }
                }else {
                  return and__3822__auto____16918
                }
              }, args)
            }else {
              return and__3822__auto____16917
            }
          }())
        };
        var G__16933 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__16933__delegate.call(this, x, y, z, args)
        };
        G__16933.cljs$lang$maxFixedArity = 3;
        G__16933.cljs$lang$applyTo = function(arglist__16934) {
          var x = cljs.core.first(arglist__16934);
          var y = cljs.core.first(cljs.core.next(arglist__16934));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16934)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16934)));
          return G__16933__delegate(x, y, z, args)
        };
        G__16933.cljs$lang$arity$variadic = G__16933__delegate;
        return G__16933
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
    var G__16935__delegate = function(p1, p2, p3, ps) {
      var ps__16920 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__16730_SHARP_) {
            return p1__16730_SHARP_.call(null, x)
          }, ps__16920)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__16731_SHARP_) {
            var and__3822__auto____16925 = p1__16731_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16925)) {
              return p1__16731_SHARP_.call(null, y)
            }else {
              return and__3822__auto____16925
            }
          }, ps__16920)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__16732_SHARP_) {
            var and__3822__auto____16926 = p1__16732_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____16926)) {
              var and__3822__auto____16927 = p1__16732_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____16927)) {
                return p1__16732_SHARP_.call(null, z)
              }else {
                return and__3822__auto____16927
              }
            }else {
              return and__3822__auto____16926
            }
          }, ps__16920)
        };
        var epn__4 = function() {
          var G__16936__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____16928 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____16928)) {
                return cljs.core.every_QMARK_.call(null, function(p1__16733_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__16733_SHARP_, args)
                }, ps__16920)
              }else {
                return and__3822__auto____16928
              }
            }())
          };
          var G__16936 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__16936__delegate.call(this, x, y, z, args)
          };
          G__16936.cljs$lang$maxFixedArity = 3;
          G__16936.cljs$lang$applyTo = function(arglist__16937) {
            var x = cljs.core.first(arglist__16937);
            var y = cljs.core.first(cljs.core.next(arglist__16937));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16937)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16937)));
            return G__16936__delegate(x, y, z, args)
          };
          G__16936.cljs$lang$arity$variadic = G__16936__delegate;
          return G__16936
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
    var G__16935 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16935__delegate.call(this, p1, p2, p3, ps)
    };
    G__16935.cljs$lang$maxFixedArity = 3;
    G__16935.cljs$lang$applyTo = function(arglist__16938) {
      var p1 = cljs.core.first(arglist__16938);
      var p2 = cljs.core.first(cljs.core.next(arglist__16938));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16938)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16938)));
      return G__16935__delegate(p1, p2, p3, ps)
    };
    G__16935.cljs$lang$arity$variadic = G__16935__delegate;
    return G__16935
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
        var or__3824__auto____17019 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17019)) {
          return or__3824__auto____17019
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____17020 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17020)) {
          return or__3824__auto____17020
        }else {
          var or__3824__auto____17021 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17021)) {
            return or__3824__auto____17021
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__17090__delegate = function(x, y, z, args) {
          var or__3824__auto____17022 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17022)) {
            return or__3824__auto____17022
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__17090 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17090__delegate.call(this, x, y, z, args)
        };
        G__17090.cljs$lang$maxFixedArity = 3;
        G__17090.cljs$lang$applyTo = function(arglist__17091) {
          var x = cljs.core.first(arglist__17091);
          var y = cljs.core.first(cljs.core.next(arglist__17091));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17091)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17091)));
          return G__17090__delegate(x, y, z, args)
        };
        G__17090.cljs$lang$arity$variadic = G__17090__delegate;
        return G__17090
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
        var or__3824__auto____17034 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17034)) {
          return or__3824__auto____17034
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____17035 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17035)) {
          return or__3824__auto____17035
        }else {
          var or__3824__auto____17036 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17036)) {
            return or__3824__auto____17036
          }else {
            var or__3824__auto____17037 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17037)) {
              return or__3824__auto____17037
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____17038 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17038)) {
          return or__3824__auto____17038
        }else {
          var or__3824__auto____17039 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____17039)) {
            return or__3824__auto____17039
          }else {
            var or__3824__auto____17040 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____17040)) {
              return or__3824__auto____17040
            }else {
              var or__3824__auto____17041 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____17041)) {
                return or__3824__auto____17041
              }else {
                var or__3824__auto____17042 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17042)) {
                  return or__3824__auto____17042
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__17092__delegate = function(x, y, z, args) {
          var or__3824__auto____17043 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17043)) {
            return or__3824__auto____17043
          }else {
            return cljs.core.some.call(null, function(p1__16773_SHARP_) {
              var or__3824__auto____17044 = p1.call(null, p1__16773_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17044)) {
                return or__3824__auto____17044
              }else {
                return p2.call(null, p1__16773_SHARP_)
              }
            }, args)
          }
        };
        var G__17092 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17092__delegate.call(this, x, y, z, args)
        };
        G__17092.cljs$lang$maxFixedArity = 3;
        G__17092.cljs$lang$applyTo = function(arglist__17093) {
          var x = cljs.core.first(arglist__17093);
          var y = cljs.core.first(cljs.core.next(arglist__17093));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17093)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17093)));
          return G__17092__delegate(x, y, z, args)
        };
        G__17092.cljs$lang$arity$variadic = G__17092__delegate;
        return G__17092
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
        var or__3824__auto____17063 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17063)) {
          return or__3824__auto____17063
        }else {
          var or__3824__auto____17064 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17064)) {
            return or__3824__auto____17064
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____17065 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17065)) {
          return or__3824__auto____17065
        }else {
          var or__3824__auto____17066 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17066)) {
            return or__3824__auto____17066
          }else {
            var or__3824__auto____17067 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17067)) {
              return or__3824__auto____17067
            }else {
              var or__3824__auto____17068 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17068)) {
                return or__3824__auto____17068
              }else {
                var or__3824__auto____17069 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17069)) {
                  return or__3824__auto____17069
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____17070 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____17070)) {
          return or__3824__auto____17070
        }else {
          var or__3824__auto____17071 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____17071)) {
            return or__3824__auto____17071
          }else {
            var or__3824__auto____17072 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17072)) {
              return or__3824__auto____17072
            }else {
              var or__3824__auto____17073 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17073)) {
                return or__3824__auto____17073
              }else {
                var or__3824__auto____17074 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____17074)) {
                  return or__3824__auto____17074
                }else {
                  var or__3824__auto____17075 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____17075)) {
                    return or__3824__auto____17075
                  }else {
                    var or__3824__auto____17076 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____17076)) {
                      return or__3824__auto____17076
                    }else {
                      var or__3824__auto____17077 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____17077)) {
                        return or__3824__auto____17077
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
        var G__17094__delegate = function(x, y, z, args) {
          var or__3824__auto____17078 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____17078)) {
            return or__3824__auto____17078
          }else {
            return cljs.core.some.call(null, function(p1__16774_SHARP_) {
              var or__3824__auto____17079 = p1.call(null, p1__16774_SHARP_);
              if(cljs.core.truth_(or__3824__auto____17079)) {
                return or__3824__auto____17079
              }else {
                var or__3824__auto____17080 = p2.call(null, p1__16774_SHARP_);
                if(cljs.core.truth_(or__3824__auto____17080)) {
                  return or__3824__auto____17080
                }else {
                  return p3.call(null, p1__16774_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__17094 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17094__delegate.call(this, x, y, z, args)
        };
        G__17094.cljs$lang$maxFixedArity = 3;
        G__17094.cljs$lang$applyTo = function(arglist__17095) {
          var x = cljs.core.first(arglist__17095);
          var y = cljs.core.first(cljs.core.next(arglist__17095));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17095)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17095)));
          return G__17094__delegate(x, y, z, args)
        };
        G__17094.cljs$lang$arity$variadic = G__17094__delegate;
        return G__17094
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
    var G__17096__delegate = function(p1, p2, p3, ps) {
      var ps__17081 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__16775_SHARP_) {
            return p1__16775_SHARP_.call(null, x)
          }, ps__17081)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__16776_SHARP_) {
            var or__3824__auto____17086 = p1__16776_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17086)) {
              return or__3824__auto____17086
            }else {
              return p1__16776_SHARP_.call(null, y)
            }
          }, ps__17081)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__16777_SHARP_) {
            var or__3824__auto____17087 = p1__16777_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____17087)) {
              return or__3824__auto____17087
            }else {
              var or__3824__auto____17088 = p1__16777_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____17088)) {
                return or__3824__auto____17088
              }else {
                return p1__16777_SHARP_.call(null, z)
              }
            }
          }, ps__17081)
        };
        var spn__4 = function() {
          var G__17097__delegate = function(x, y, z, args) {
            var or__3824__auto____17089 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____17089)) {
              return or__3824__auto____17089
            }else {
              return cljs.core.some.call(null, function(p1__16778_SHARP_) {
                return cljs.core.some.call(null, p1__16778_SHARP_, args)
              }, ps__17081)
            }
          };
          var G__17097 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17097__delegate.call(this, x, y, z, args)
          };
          G__17097.cljs$lang$maxFixedArity = 3;
          G__17097.cljs$lang$applyTo = function(arglist__17098) {
            var x = cljs.core.first(arglist__17098);
            var y = cljs.core.first(cljs.core.next(arglist__17098));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17098)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17098)));
            return G__17097__delegate(x, y, z, args)
          };
          G__17097.cljs$lang$arity$variadic = G__17097__delegate;
          return G__17097
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
    var G__17096 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17096__delegate.call(this, p1, p2, p3, ps)
    };
    G__17096.cljs$lang$maxFixedArity = 3;
    G__17096.cljs$lang$applyTo = function(arglist__17099) {
      var p1 = cljs.core.first(arglist__17099);
      var p2 = cljs.core.first(cljs.core.next(arglist__17099));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17099)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17099)));
      return G__17096__delegate(p1, p2, p3, ps)
    };
    G__17096.cljs$lang$arity$variadic = G__17096__delegate;
    return G__17096
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
      var temp__3974__auto____17118 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17118) {
        var s__17119 = temp__3974__auto____17118;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__17119)) {
          var c__17120 = cljs.core.chunk_first.call(null, s__17119);
          var size__17121 = cljs.core.count.call(null, c__17120);
          var b__17122 = cljs.core.chunk_buffer.call(null, size__17121);
          var n__2533__auto____17123 = size__17121;
          var i__17124 = 0;
          while(true) {
            if(i__17124 < n__2533__auto____17123) {
              cljs.core.chunk_append.call(null, b__17122, f.call(null, cljs.core._nth.call(null, c__17120, i__17124)));
              var G__17136 = i__17124 + 1;
              i__17124 = G__17136;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17122), map.call(null, f, cljs.core.chunk_rest.call(null, s__17119)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__17119)), map.call(null, f, cljs.core.rest.call(null, s__17119)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17125 = cljs.core.seq.call(null, c1);
      var s2__17126 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17127 = s1__17125;
        if(and__3822__auto____17127) {
          return s2__17126
        }else {
          return and__3822__auto____17127
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17125), cljs.core.first.call(null, s2__17126)), map.call(null, f, cljs.core.rest.call(null, s1__17125), cljs.core.rest.call(null, s2__17126)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__17128 = cljs.core.seq.call(null, c1);
      var s2__17129 = cljs.core.seq.call(null, c2);
      var s3__17130 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____17131 = s1__17128;
        if(and__3822__auto____17131) {
          var and__3822__auto____17132 = s2__17129;
          if(and__3822__auto____17132) {
            return s3__17130
          }else {
            return and__3822__auto____17132
          }
        }else {
          return and__3822__auto____17131
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__17128), cljs.core.first.call(null, s2__17129), cljs.core.first.call(null, s3__17130)), map.call(null, f, cljs.core.rest.call(null, s1__17128), cljs.core.rest.call(null, s2__17129), cljs.core.rest.call(null, s3__17130)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__17137__delegate = function(f, c1, c2, c3, colls) {
      var step__17135 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__17134 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17134)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__17134), step.call(null, map.call(null, cljs.core.rest, ss__17134)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__16939_SHARP_) {
        return cljs.core.apply.call(null, f, p1__16939_SHARP_)
      }, step__17135.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__17137 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17137__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17137.cljs$lang$maxFixedArity = 4;
    G__17137.cljs$lang$applyTo = function(arglist__17138) {
      var f = cljs.core.first(arglist__17138);
      var c1 = cljs.core.first(cljs.core.next(arglist__17138));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17138)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17138))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17138))));
      return G__17137__delegate(f, c1, c2, c3, colls)
    };
    G__17137.cljs$lang$arity$variadic = G__17137__delegate;
    return G__17137
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
      var temp__3974__auto____17141 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17141) {
        var s__17142 = temp__3974__auto____17141;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17142), take.call(null, n - 1, cljs.core.rest.call(null, s__17142)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__17148 = function(n, coll) {
    while(true) {
      var s__17146 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17147 = n > 0;
        if(and__3822__auto____17147) {
          return s__17146
        }else {
          return and__3822__auto____17147
        }
      }())) {
        var G__17149 = n - 1;
        var G__17150 = cljs.core.rest.call(null, s__17146);
        n = G__17149;
        coll = G__17150;
        continue
      }else {
        return s__17146
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17148.call(null, n, coll)
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
  var s__17153 = cljs.core.seq.call(null, coll);
  var lead__17154 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__17154) {
      var G__17155 = cljs.core.next.call(null, s__17153);
      var G__17156 = cljs.core.next.call(null, lead__17154);
      s__17153 = G__17155;
      lead__17154 = G__17156;
      continue
    }else {
      return s__17153
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__17162 = function(pred, coll) {
    while(true) {
      var s__17160 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____17161 = s__17160;
        if(and__3822__auto____17161) {
          return pred.call(null, cljs.core.first.call(null, s__17160))
        }else {
          return and__3822__auto____17161
        }
      }())) {
        var G__17163 = pred;
        var G__17164 = cljs.core.rest.call(null, s__17160);
        pred = G__17163;
        coll = G__17164;
        continue
      }else {
        return s__17160
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__17162.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17167 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17167) {
      var s__17168 = temp__3974__auto____17167;
      return cljs.core.concat.call(null, s__17168, cycle.call(null, s__17168))
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
      var s1__17173 = cljs.core.seq.call(null, c1);
      var s2__17174 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____17175 = s1__17173;
        if(and__3822__auto____17175) {
          return s2__17174
        }else {
          return and__3822__auto____17175
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__17173), cljs.core.cons.call(null, cljs.core.first.call(null, s2__17174), interleave.call(null, cljs.core.rest.call(null, s1__17173), cljs.core.rest.call(null, s2__17174))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__17177__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__17176 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__17176)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__17176), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__17176)))
        }else {
          return null
        }
      }, null)
    };
    var G__17177 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17177__delegate.call(this, c1, c2, colls)
    };
    G__17177.cljs$lang$maxFixedArity = 2;
    G__17177.cljs$lang$applyTo = function(arglist__17178) {
      var c1 = cljs.core.first(arglist__17178);
      var c2 = cljs.core.first(cljs.core.next(arglist__17178));
      var colls = cljs.core.rest(cljs.core.next(arglist__17178));
      return G__17177__delegate(c1, c2, colls)
    };
    G__17177.cljs$lang$arity$variadic = G__17177__delegate;
    return G__17177
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
  var cat__17188 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17186 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17186) {
        var coll__17187 = temp__3971__auto____17186;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__17187), cat.call(null, cljs.core.rest.call(null, coll__17187), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__17188.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__17189__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__17189 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__17189__delegate.call(this, f, coll, colls)
    };
    G__17189.cljs$lang$maxFixedArity = 2;
    G__17189.cljs$lang$applyTo = function(arglist__17190) {
      var f = cljs.core.first(arglist__17190);
      var coll = cljs.core.first(cljs.core.next(arglist__17190));
      var colls = cljs.core.rest(cljs.core.next(arglist__17190));
      return G__17189__delegate(f, coll, colls)
    };
    G__17189.cljs$lang$arity$variadic = G__17189__delegate;
    return G__17189
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
    var temp__3974__auto____17200 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17200) {
      var s__17201 = temp__3974__auto____17200;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__17201)) {
        var c__17202 = cljs.core.chunk_first.call(null, s__17201);
        var size__17203 = cljs.core.count.call(null, c__17202);
        var b__17204 = cljs.core.chunk_buffer.call(null, size__17203);
        var n__2533__auto____17205 = size__17203;
        var i__17206 = 0;
        while(true) {
          if(i__17206 < n__2533__auto____17205) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__17202, i__17206)))) {
              cljs.core.chunk_append.call(null, b__17204, cljs.core._nth.call(null, c__17202, i__17206))
            }else {
            }
            var G__17209 = i__17206 + 1;
            i__17206 = G__17209;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__17204), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__17201)))
      }else {
        var f__17207 = cljs.core.first.call(null, s__17201);
        var r__17208 = cljs.core.rest.call(null, s__17201);
        if(cljs.core.truth_(pred.call(null, f__17207))) {
          return cljs.core.cons.call(null, f__17207, filter.call(null, pred, r__17208))
        }else {
          return filter.call(null, pred, r__17208)
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
  var walk__17212 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__17212.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__17210_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__17210_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__17216__17217 = to;
    if(G__17216__17217) {
      if(function() {
        var or__3824__auto____17218 = G__17216__17217.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____17218) {
          return or__3824__auto____17218
        }else {
          return G__17216__17217.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__17216__17217.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17216__17217)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__17216__17217)
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
    var G__17219__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__17219 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__17219__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__17219.cljs$lang$maxFixedArity = 4;
    G__17219.cljs$lang$applyTo = function(arglist__17220) {
      var f = cljs.core.first(arglist__17220);
      var c1 = cljs.core.first(cljs.core.next(arglist__17220));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17220)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17220))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17220))));
      return G__17219__delegate(f, c1, c2, c3, colls)
    };
    G__17219.cljs$lang$arity$variadic = G__17219__delegate;
    return G__17219
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
      var temp__3974__auto____17227 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17227) {
        var s__17228 = temp__3974__auto____17227;
        var p__17229 = cljs.core.take.call(null, n, s__17228);
        if(n === cljs.core.count.call(null, p__17229)) {
          return cljs.core.cons.call(null, p__17229, partition.call(null, n, step, cljs.core.drop.call(null, step, s__17228)))
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
      var temp__3974__auto____17230 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17230) {
        var s__17231 = temp__3974__auto____17230;
        var p__17232 = cljs.core.take.call(null, n, s__17231);
        if(n === cljs.core.count.call(null, p__17232)) {
          return cljs.core.cons.call(null, p__17232, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__17231)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__17232, pad)))
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
    var sentinel__17237 = cljs.core.lookup_sentinel;
    var m__17238 = m;
    var ks__17239 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__17239) {
        var m__17240 = cljs.core._lookup.call(null, m__17238, cljs.core.first.call(null, ks__17239), sentinel__17237);
        if(sentinel__17237 === m__17240) {
          return not_found
        }else {
          var G__17241 = sentinel__17237;
          var G__17242 = m__17240;
          var G__17243 = cljs.core.next.call(null, ks__17239);
          sentinel__17237 = G__17241;
          m__17238 = G__17242;
          ks__17239 = G__17243;
          continue
        }
      }else {
        return m__17238
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
cljs.core.assoc_in = function assoc_in(m, p__17244, v) {
  var vec__17249__17250 = p__17244;
  var k__17251 = cljs.core.nth.call(null, vec__17249__17250, 0, null);
  var ks__17252 = cljs.core.nthnext.call(null, vec__17249__17250, 1);
  if(cljs.core.truth_(ks__17252)) {
    return cljs.core.assoc.call(null, m, k__17251, assoc_in.call(null, cljs.core._lookup.call(null, m, k__17251, null), ks__17252, v))
  }else {
    return cljs.core.assoc.call(null, m, k__17251, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__17253, f, args) {
    var vec__17258__17259 = p__17253;
    var k__17260 = cljs.core.nth.call(null, vec__17258__17259, 0, null);
    var ks__17261 = cljs.core.nthnext.call(null, vec__17258__17259, 1);
    if(cljs.core.truth_(ks__17261)) {
      return cljs.core.assoc.call(null, m, k__17260, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__17260, null), ks__17261, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__17260, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__17260, null), args))
    }
  };
  var update_in = function(m, p__17253, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__17253, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__17262) {
    var m = cljs.core.first(arglist__17262);
    var p__17253 = cljs.core.first(cljs.core.next(arglist__17262));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17262)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17262)));
    return update_in__delegate(m, p__17253, f, args)
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
  var this__17265 = this;
  var h__2198__auto____17266 = this__17265.__hash;
  if(!(h__2198__auto____17266 == null)) {
    return h__2198__auto____17266
  }else {
    var h__2198__auto____17267 = cljs.core.hash_coll.call(null, coll);
    this__17265.__hash = h__2198__auto____17267;
    return h__2198__auto____17267
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17268 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17269 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17270 = this;
  var new_array__17271 = this__17270.array.slice();
  new_array__17271[k] = v;
  return new cljs.core.Vector(this__17270.meta, new_array__17271, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__17302 = null;
  var G__17302__2 = function(this_sym17272, k) {
    var this__17274 = this;
    var this_sym17272__17275 = this;
    var coll__17276 = this_sym17272__17275;
    return coll__17276.cljs$core$ILookup$_lookup$arity$2(coll__17276, k)
  };
  var G__17302__3 = function(this_sym17273, k, not_found) {
    var this__17274 = this;
    var this_sym17273__17277 = this;
    var coll__17278 = this_sym17273__17277;
    return coll__17278.cljs$core$ILookup$_lookup$arity$3(coll__17278, k, not_found)
  };
  G__17302 = function(this_sym17273, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17302__2.call(this, this_sym17273, k);
      case 3:
        return G__17302__3.call(this, this_sym17273, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17302
}();
cljs.core.Vector.prototype.apply = function(this_sym17263, args17264) {
  var this__17279 = this;
  return this_sym17263.call.apply(this_sym17263, [this_sym17263].concat(args17264.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17280 = this;
  var new_array__17281 = this__17280.array.slice();
  new_array__17281.push(o);
  return new cljs.core.Vector(this__17280.meta, new_array__17281, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__17282 = this;
  var this__17283 = this;
  return cljs.core.pr_str.call(null, this__17283)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17284 = this;
  return cljs.core.ci_reduce.call(null, this__17284.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17285 = this;
  return cljs.core.ci_reduce.call(null, this__17285.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17286 = this;
  if(this__17286.array.length > 0) {
    var vector_seq__17287 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__17286.array.length) {
          return cljs.core.cons.call(null, this__17286.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__17287.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17288 = this;
  return this__17288.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17289 = this;
  var count__17290 = this__17289.array.length;
  if(count__17290 > 0) {
    return this__17289.array[count__17290 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17291 = this;
  if(this__17291.array.length > 0) {
    var new_array__17292 = this__17291.array.slice();
    new_array__17292.pop();
    return new cljs.core.Vector(this__17291.meta, new_array__17292, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17293 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17294 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17295 = this;
  return new cljs.core.Vector(meta, this__17295.array, this__17295.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17296 = this;
  return this__17296.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17297 = this;
  if(function() {
    var and__3822__auto____17298 = 0 <= n;
    if(and__3822__auto____17298) {
      return n < this__17297.array.length
    }else {
      return and__3822__auto____17298
    }
  }()) {
    return this__17297.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17299 = this;
  if(function() {
    var and__3822__auto____17300 = 0 <= n;
    if(and__3822__auto____17300) {
      return n < this__17299.array.length
    }else {
      return and__3822__auto____17300
    }
  }()) {
    return this__17299.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17301 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17301.meta)
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
  var cnt__17304 = pv.cnt;
  if(cnt__17304 < 32) {
    return 0
  }else {
    return cnt__17304 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__17310 = level;
  var ret__17311 = node;
  while(true) {
    if(ll__17310 === 0) {
      return ret__17311
    }else {
      var embed__17312 = ret__17311;
      var r__17313 = cljs.core.pv_fresh_node.call(null, edit);
      var ___17314 = cljs.core.pv_aset.call(null, r__17313, 0, embed__17312);
      var G__17315 = ll__17310 - 5;
      var G__17316 = r__17313;
      ll__17310 = G__17315;
      ret__17311 = G__17316;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__17322 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__17323 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__17322, subidx__17323, tailnode);
    return ret__17322
  }else {
    var child__17324 = cljs.core.pv_aget.call(null, parent, subidx__17323);
    if(!(child__17324 == null)) {
      var node_to_insert__17325 = push_tail.call(null, pv, level - 5, child__17324, tailnode);
      cljs.core.pv_aset.call(null, ret__17322, subidx__17323, node_to_insert__17325);
      return ret__17322
    }else {
      var node_to_insert__17326 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__17322, subidx__17323, node_to_insert__17326);
      return ret__17322
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____17330 = 0 <= i;
    if(and__3822__auto____17330) {
      return i < pv.cnt
    }else {
      return and__3822__auto____17330
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__17331 = pv.root;
      var level__17332 = pv.shift;
      while(true) {
        if(level__17332 > 0) {
          var G__17333 = cljs.core.pv_aget.call(null, node__17331, i >>> level__17332 & 31);
          var G__17334 = level__17332 - 5;
          node__17331 = G__17333;
          level__17332 = G__17334;
          continue
        }else {
          return node__17331.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__17337 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__17337, i & 31, val);
    return ret__17337
  }else {
    var subidx__17338 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__17337, subidx__17338, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17338), i, val));
    return ret__17337
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__17344 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17345 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__17344));
    if(function() {
      var and__3822__auto____17346 = new_child__17345 == null;
      if(and__3822__auto____17346) {
        return subidx__17344 === 0
      }else {
        return and__3822__auto____17346
      }
    }()) {
      return null
    }else {
      var ret__17347 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__17347, subidx__17344, new_child__17345);
      return ret__17347
    }
  }else {
    if(subidx__17344 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__17348 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__17348, subidx__17344, null);
        return ret__17348
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
  var this__17351 = this;
  return new cljs.core.TransientVector(this__17351.cnt, this__17351.shift, cljs.core.tv_editable_root.call(null, this__17351.root), cljs.core.tv_editable_tail.call(null, this__17351.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17352 = this;
  var h__2198__auto____17353 = this__17352.__hash;
  if(!(h__2198__auto____17353 == null)) {
    return h__2198__auto____17353
  }else {
    var h__2198__auto____17354 = cljs.core.hash_coll.call(null, coll);
    this__17352.__hash = h__2198__auto____17354;
    return h__2198__auto____17354
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17355 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17356 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17357 = this;
  if(function() {
    var and__3822__auto____17358 = 0 <= k;
    if(and__3822__auto____17358) {
      return k < this__17357.cnt
    }else {
      return and__3822__auto____17358
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__17359 = this__17357.tail.slice();
      new_tail__17359[k & 31] = v;
      return new cljs.core.PersistentVector(this__17357.meta, this__17357.cnt, this__17357.shift, this__17357.root, new_tail__17359, null)
    }else {
      return new cljs.core.PersistentVector(this__17357.meta, this__17357.cnt, this__17357.shift, cljs.core.do_assoc.call(null, coll, this__17357.shift, this__17357.root, k, v), this__17357.tail, null)
    }
  }else {
    if(k === this__17357.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__17357.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__17407 = null;
  var G__17407__2 = function(this_sym17360, k) {
    var this__17362 = this;
    var this_sym17360__17363 = this;
    var coll__17364 = this_sym17360__17363;
    return coll__17364.cljs$core$ILookup$_lookup$arity$2(coll__17364, k)
  };
  var G__17407__3 = function(this_sym17361, k, not_found) {
    var this__17362 = this;
    var this_sym17361__17365 = this;
    var coll__17366 = this_sym17361__17365;
    return coll__17366.cljs$core$ILookup$_lookup$arity$3(coll__17366, k, not_found)
  };
  G__17407 = function(this_sym17361, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17407__2.call(this, this_sym17361, k);
      case 3:
        return G__17407__3.call(this, this_sym17361, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17407
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym17349, args17350) {
  var this__17367 = this;
  return this_sym17349.call.apply(this_sym17349, [this_sym17349].concat(args17350.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__17368 = this;
  var step_init__17369 = [0, init];
  var i__17370 = 0;
  while(true) {
    if(i__17370 < this__17368.cnt) {
      var arr__17371 = cljs.core.array_for.call(null, v, i__17370);
      var len__17372 = arr__17371.length;
      var init__17376 = function() {
        var j__17373 = 0;
        var init__17374 = step_init__17369[1];
        while(true) {
          if(j__17373 < len__17372) {
            var init__17375 = f.call(null, init__17374, j__17373 + i__17370, arr__17371[j__17373]);
            if(cljs.core.reduced_QMARK_.call(null, init__17375)) {
              return init__17375
            }else {
              var G__17408 = j__17373 + 1;
              var G__17409 = init__17375;
              j__17373 = G__17408;
              init__17374 = G__17409;
              continue
            }
          }else {
            step_init__17369[0] = len__17372;
            step_init__17369[1] = init__17374;
            return init__17374
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17376)) {
        return cljs.core.deref.call(null, init__17376)
      }else {
        var G__17410 = i__17370 + step_init__17369[0];
        i__17370 = G__17410;
        continue
      }
    }else {
      return step_init__17369[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17377 = this;
  if(this__17377.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__17378 = this__17377.tail.slice();
    new_tail__17378.push(o);
    return new cljs.core.PersistentVector(this__17377.meta, this__17377.cnt + 1, this__17377.shift, this__17377.root, new_tail__17378, null)
  }else {
    var root_overflow_QMARK___17379 = this__17377.cnt >>> 5 > 1 << this__17377.shift;
    var new_shift__17380 = root_overflow_QMARK___17379 ? this__17377.shift + 5 : this__17377.shift;
    var new_root__17382 = root_overflow_QMARK___17379 ? function() {
      var n_r__17381 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__17381, 0, this__17377.root);
      cljs.core.pv_aset.call(null, n_r__17381, 1, cljs.core.new_path.call(null, null, this__17377.shift, new cljs.core.VectorNode(null, this__17377.tail)));
      return n_r__17381
    }() : cljs.core.push_tail.call(null, coll, this__17377.shift, this__17377.root, new cljs.core.VectorNode(null, this__17377.tail));
    return new cljs.core.PersistentVector(this__17377.meta, this__17377.cnt + 1, new_shift__17380, new_root__17382, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__17383 = this;
  if(this__17383.cnt > 0) {
    return new cljs.core.RSeq(coll, this__17383.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__17384 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__17385 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__17386 = this;
  var this__17387 = this;
  return cljs.core.pr_str.call(null, this__17387)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__17388 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__17389 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17390 = this;
  if(this__17390.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17391 = this;
  return this__17391.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17392 = this;
  if(this__17392.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__17392.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17393 = this;
  if(this__17393.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__17393.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17393.meta)
    }else {
      if(1 < this__17393.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__17393.meta, this__17393.cnt - 1, this__17393.shift, this__17393.root, this__17393.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__17394 = cljs.core.array_for.call(null, coll, this__17393.cnt - 2);
          var nr__17395 = cljs.core.pop_tail.call(null, coll, this__17393.shift, this__17393.root);
          var new_root__17396 = nr__17395 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__17395;
          var cnt_1__17397 = this__17393.cnt - 1;
          if(function() {
            var and__3822__auto____17398 = 5 < this__17393.shift;
            if(and__3822__auto____17398) {
              return cljs.core.pv_aget.call(null, new_root__17396, 1) == null
            }else {
              return and__3822__auto____17398
            }
          }()) {
            return new cljs.core.PersistentVector(this__17393.meta, cnt_1__17397, this__17393.shift - 5, cljs.core.pv_aget.call(null, new_root__17396, 0), new_tail__17394, null)
          }else {
            return new cljs.core.PersistentVector(this__17393.meta, cnt_1__17397, this__17393.shift, new_root__17396, new_tail__17394, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17399 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17400 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17401 = this;
  return new cljs.core.PersistentVector(meta, this__17401.cnt, this__17401.shift, this__17401.root, this__17401.tail, this__17401.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17402 = this;
  return this__17402.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17403 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17404 = this;
  if(function() {
    var and__3822__auto____17405 = 0 <= n;
    if(and__3822__auto____17405) {
      return n < this__17404.cnt
    }else {
      return and__3822__auto____17405
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17406 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17406.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__17411 = xs.length;
  var xs__17412 = no_clone === true ? xs : xs.slice();
  if(l__17411 < 32) {
    return new cljs.core.PersistentVector(null, l__17411, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__17412, null)
  }else {
    var node__17413 = xs__17412.slice(0, 32);
    var v__17414 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__17413, null);
    var i__17415 = 32;
    var out__17416 = cljs.core._as_transient.call(null, v__17414);
    while(true) {
      if(i__17415 < l__17411) {
        var G__17417 = i__17415 + 1;
        var G__17418 = cljs.core.conj_BANG_.call(null, out__17416, xs__17412[i__17415]);
        i__17415 = G__17417;
        out__17416 = G__17418;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__17416)
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
  vector.cljs$lang$applyTo = function(arglist__17419) {
    var args = cljs.core.seq(arglist__17419);
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
  var this__17420 = this;
  if(this__17420.off + 1 < this__17420.node.length) {
    var s__17421 = cljs.core.chunked_seq.call(null, this__17420.vec, this__17420.node, this__17420.i, this__17420.off + 1);
    if(s__17421 == null) {
      return null
    }else {
      return s__17421
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17422 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17423 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17424 = this;
  return this__17424.node[this__17424.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17425 = this;
  if(this__17425.off + 1 < this__17425.node.length) {
    var s__17426 = cljs.core.chunked_seq.call(null, this__17425.vec, this__17425.node, this__17425.i, this__17425.off + 1);
    if(s__17426 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__17426
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__17427 = this;
  var l__17428 = this__17427.node.length;
  var s__17429 = this__17427.i + l__17428 < cljs.core._count.call(null, this__17427.vec) ? cljs.core.chunked_seq.call(null, this__17427.vec, this__17427.i + l__17428, 0) : null;
  if(s__17429 == null) {
    return null
  }else {
    return s__17429
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17430 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__17431 = this;
  return cljs.core.chunked_seq.call(null, this__17431.vec, this__17431.node, this__17431.i, this__17431.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__17432 = this;
  return this__17432.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17433 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__17433.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__17434 = this;
  return cljs.core.array_chunk.call(null, this__17434.node, this__17434.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__17435 = this;
  var l__17436 = this__17435.node.length;
  var s__17437 = this__17435.i + l__17436 < cljs.core._count.call(null, this__17435.vec) ? cljs.core.chunked_seq.call(null, this__17435.vec, this__17435.i + l__17436, 0) : null;
  if(s__17437 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__17437
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
  var this__17440 = this;
  var h__2198__auto____17441 = this__17440.__hash;
  if(!(h__2198__auto____17441 == null)) {
    return h__2198__auto____17441
  }else {
    var h__2198__auto____17442 = cljs.core.hash_coll.call(null, coll);
    this__17440.__hash = h__2198__auto____17442;
    return h__2198__auto____17442
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17443 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17444 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__17445 = this;
  var v_pos__17446 = this__17445.start + key;
  return new cljs.core.Subvec(this__17445.meta, cljs.core._assoc.call(null, this__17445.v, v_pos__17446, val), this__17445.start, this__17445.end > v_pos__17446 + 1 ? this__17445.end : v_pos__17446 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__17472 = null;
  var G__17472__2 = function(this_sym17447, k) {
    var this__17449 = this;
    var this_sym17447__17450 = this;
    var coll__17451 = this_sym17447__17450;
    return coll__17451.cljs$core$ILookup$_lookup$arity$2(coll__17451, k)
  };
  var G__17472__3 = function(this_sym17448, k, not_found) {
    var this__17449 = this;
    var this_sym17448__17452 = this;
    var coll__17453 = this_sym17448__17452;
    return coll__17453.cljs$core$ILookup$_lookup$arity$3(coll__17453, k, not_found)
  };
  G__17472 = function(this_sym17448, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17472__2.call(this, this_sym17448, k);
      case 3:
        return G__17472__3.call(this, this_sym17448, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17472
}();
cljs.core.Subvec.prototype.apply = function(this_sym17438, args17439) {
  var this__17454 = this;
  return this_sym17438.call.apply(this_sym17438, [this_sym17438].concat(args17439.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17455 = this;
  return new cljs.core.Subvec(this__17455.meta, cljs.core._assoc_n.call(null, this__17455.v, this__17455.end, o), this__17455.start, this__17455.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__17456 = this;
  var this__17457 = this;
  return cljs.core.pr_str.call(null, this__17457)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__17458 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__17459 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17460 = this;
  var subvec_seq__17461 = function subvec_seq(i) {
    if(i === this__17460.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__17460.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__17461.call(null, this__17460.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17462 = this;
  return this__17462.end - this__17462.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17463 = this;
  return cljs.core._nth.call(null, this__17463.v, this__17463.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17464 = this;
  if(this__17464.start === this__17464.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__17464.meta, this__17464.v, this__17464.start, this__17464.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__17465 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17466 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17467 = this;
  return new cljs.core.Subvec(meta, this__17467.v, this__17467.start, this__17467.end, this__17467.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17468 = this;
  return this__17468.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17469 = this;
  return cljs.core._nth.call(null, this__17469.v, this__17469.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17470 = this;
  return cljs.core._nth.call(null, this__17470.v, this__17470.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17471 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__17471.meta)
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
  var ret__17474 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__17474, 0, tl.length);
  return ret__17474
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__17478 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__17479 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__17478, subidx__17479, level === 5 ? tail_node : function() {
    var child__17480 = cljs.core.pv_aget.call(null, ret__17478, subidx__17479);
    if(!(child__17480 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__17480, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__17478
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__17485 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__17486 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__17487 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__17485, subidx__17486));
    if(function() {
      var and__3822__auto____17488 = new_child__17487 == null;
      if(and__3822__auto____17488) {
        return subidx__17486 === 0
      }else {
        return and__3822__auto____17488
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__17485, subidx__17486, new_child__17487);
      return node__17485
    }
  }else {
    if(subidx__17486 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__17485, subidx__17486, null);
        return node__17485
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____17493 = 0 <= i;
    if(and__3822__auto____17493) {
      return i < tv.cnt
    }else {
      return and__3822__auto____17493
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__17494 = tv.root;
      var node__17495 = root__17494;
      var level__17496 = tv.shift;
      while(true) {
        if(level__17496 > 0) {
          var G__17497 = cljs.core.tv_ensure_editable.call(null, root__17494.edit, cljs.core.pv_aget.call(null, node__17495, i >>> level__17496 & 31));
          var G__17498 = level__17496 - 5;
          node__17495 = G__17497;
          level__17496 = G__17498;
          continue
        }else {
          return node__17495.arr
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
  var G__17538 = null;
  var G__17538__2 = function(this_sym17501, k) {
    var this__17503 = this;
    var this_sym17501__17504 = this;
    var coll__17505 = this_sym17501__17504;
    return coll__17505.cljs$core$ILookup$_lookup$arity$2(coll__17505, k)
  };
  var G__17538__3 = function(this_sym17502, k, not_found) {
    var this__17503 = this;
    var this_sym17502__17506 = this;
    var coll__17507 = this_sym17502__17506;
    return coll__17507.cljs$core$ILookup$_lookup$arity$3(coll__17507, k, not_found)
  };
  G__17538 = function(this_sym17502, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17538__2.call(this, this_sym17502, k);
      case 3:
        return G__17538__3.call(this, this_sym17502, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17538
}();
cljs.core.TransientVector.prototype.apply = function(this_sym17499, args17500) {
  var this__17508 = this;
  return this_sym17499.call.apply(this_sym17499, [this_sym17499].concat(args17500.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17509 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17510 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__17511 = this;
  if(this__17511.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__17512 = this;
  if(function() {
    var and__3822__auto____17513 = 0 <= n;
    if(and__3822__auto____17513) {
      return n < this__17512.cnt
    }else {
      return and__3822__auto____17513
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17514 = this;
  if(this__17514.root.edit) {
    return this__17514.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__17515 = this;
  if(this__17515.root.edit) {
    if(function() {
      var and__3822__auto____17516 = 0 <= n;
      if(and__3822__auto____17516) {
        return n < this__17515.cnt
      }else {
        return and__3822__auto____17516
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__17515.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__17521 = function go(level, node) {
          var node__17519 = cljs.core.tv_ensure_editable.call(null, this__17515.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__17519, n & 31, val);
            return node__17519
          }else {
            var subidx__17520 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__17519, subidx__17520, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__17519, subidx__17520)));
            return node__17519
          }
        }.call(null, this__17515.shift, this__17515.root);
        this__17515.root = new_root__17521;
        return tcoll
      }
    }else {
      if(n === this__17515.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__17515.cnt)].join(""));
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
  var this__17522 = this;
  if(this__17522.root.edit) {
    if(this__17522.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__17522.cnt) {
        this__17522.cnt = 0;
        return tcoll
      }else {
        if((this__17522.cnt - 1 & 31) > 0) {
          this__17522.cnt = this__17522.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__17523 = cljs.core.editable_array_for.call(null, tcoll, this__17522.cnt - 2);
            var new_root__17525 = function() {
              var nr__17524 = cljs.core.tv_pop_tail.call(null, tcoll, this__17522.shift, this__17522.root);
              if(!(nr__17524 == null)) {
                return nr__17524
              }else {
                return new cljs.core.VectorNode(this__17522.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____17526 = 5 < this__17522.shift;
              if(and__3822__auto____17526) {
                return cljs.core.pv_aget.call(null, new_root__17525, 1) == null
              }else {
                return and__3822__auto____17526
              }
            }()) {
              var new_root__17527 = cljs.core.tv_ensure_editable.call(null, this__17522.root.edit, cljs.core.pv_aget.call(null, new_root__17525, 0));
              this__17522.root = new_root__17527;
              this__17522.shift = this__17522.shift - 5;
              this__17522.cnt = this__17522.cnt - 1;
              this__17522.tail = new_tail__17523;
              return tcoll
            }else {
              this__17522.root = new_root__17525;
              this__17522.cnt = this__17522.cnt - 1;
              this__17522.tail = new_tail__17523;
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
  var this__17528 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17529 = this;
  if(this__17529.root.edit) {
    if(this__17529.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__17529.tail[this__17529.cnt & 31] = o;
      this__17529.cnt = this__17529.cnt + 1;
      return tcoll
    }else {
      var tail_node__17530 = new cljs.core.VectorNode(this__17529.root.edit, this__17529.tail);
      var new_tail__17531 = cljs.core.make_array.call(null, 32);
      new_tail__17531[0] = o;
      this__17529.tail = new_tail__17531;
      if(this__17529.cnt >>> 5 > 1 << this__17529.shift) {
        var new_root_array__17532 = cljs.core.make_array.call(null, 32);
        var new_shift__17533 = this__17529.shift + 5;
        new_root_array__17532[0] = this__17529.root;
        new_root_array__17532[1] = cljs.core.new_path.call(null, this__17529.root.edit, this__17529.shift, tail_node__17530);
        this__17529.root = new cljs.core.VectorNode(this__17529.root.edit, new_root_array__17532);
        this__17529.shift = new_shift__17533;
        this__17529.cnt = this__17529.cnt + 1;
        return tcoll
      }else {
        var new_root__17534 = cljs.core.tv_push_tail.call(null, tcoll, this__17529.shift, this__17529.root, tail_node__17530);
        this__17529.root = new_root__17534;
        this__17529.cnt = this__17529.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17535 = this;
  if(this__17535.root.edit) {
    this__17535.root.edit = null;
    var len__17536 = this__17535.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__17537 = cljs.core.make_array.call(null, len__17536);
    cljs.core.array_copy.call(null, this__17535.tail, 0, trimmed_tail__17537, 0, len__17536);
    return new cljs.core.PersistentVector(null, this__17535.cnt, this__17535.shift, this__17535.root, trimmed_tail__17537, null)
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
  var this__17539 = this;
  var h__2198__auto____17540 = this__17539.__hash;
  if(!(h__2198__auto____17540 == null)) {
    return h__2198__auto____17540
  }else {
    var h__2198__auto____17541 = cljs.core.hash_coll.call(null, coll);
    this__17539.__hash = h__2198__auto____17541;
    return h__2198__auto____17541
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17542 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__17543 = this;
  var this__17544 = this;
  return cljs.core.pr_str.call(null, this__17544)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17545 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17546 = this;
  return cljs.core._first.call(null, this__17546.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17547 = this;
  var temp__3971__auto____17548 = cljs.core.next.call(null, this__17547.front);
  if(temp__3971__auto____17548) {
    var f1__17549 = temp__3971__auto____17548;
    return new cljs.core.PersistentQueueSeq(this__17547.meta, f1__17549, this__17547.rear, null)
  }else {
    if(this__17547.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__17547.meta, this__17547.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17550 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17551 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__17551.front, this__17551.rear, this__17551.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17552 = this;
  return this__17552.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17553 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17553.meta)
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
  var this__17554 = this;
  var h__2198__auto____17555 = this__17554.__hash;
  if(!(h__2198__auto____17555 == null)) {
    return h__2198__auto____17555
  }else {
    var h__2198__auto____17556 = cljs.core.hash_coll.call(null, coll);
    this__17554.__hash = h__2198__auto____17556;
    return h__2198__auto____17556
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__17557 = this;
  if(cljs.core.truth_(this__17557.front)) {
    return new cljs.core.PersistentQueue(this__17557.meta, this__17557.count + 1, this__17557.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____17558 = this__17557.rear;
      if(cljs.core.truth_(or__3824__auto____17558)) {
        return or__3824__auto____17558
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__17557.meta, this__17557.count + 1, cljs.core.conj.call(null, this__17557.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__17559 = this;
  var this__17560 = this;
  return cljs.core.pr_str.call(null, this__17560)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17561 = this;
  var rear__17562 = cljs.core.seq.call(null, this__17561.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____17563 = this__17561.front;
    if(cljs.core.truth_(or__3824__auto____17563)) {
      return or__3824__auto____17563
    }else {
      return rear__17562
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__17561.front, cljs.core.seq.call(null, rear__17562), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17564 = this;
  return this__17564.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__17565 = this;
  return cljs.core._first.call(null, this__17565.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__17566 = this;
  if(cljs.core.truth_(this__17566.front)) {
    var temp__3971__auto____17567 = cljs.core.next.call(null, this__17566.front);
    if(temp__3971__auto____17567) {
      var f1__17568 = temp__3971__auto____17567;
      return new cljs.core.PersistentQueue(this__17566.meta, this__17566.count - 1, f1__17568, this__17566.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__17566.meta, this__17566.count - 1, cljs.core.seq.call(null, this__17566.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__17569 = this;
  return cljs.core.first.call(null, this__17569.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__17570 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17571 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17572 = this;
  return new cljs.core.PersistentQueue(meta, this__17572.count, this__17572.front, this__17572.rear, this__17572.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17573 = this;
  return this__17573.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17574 = this;
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
  var this__17575 = this;
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
  var len__17578 = array.length;
  var i__17579 = 0;
  while(true) {
    if(i__17579 < len__17578) {
      if(k === array[i__17579]) {
        return i__17579
      }else {
        var G__17580 = i__17579 + incr;
        i__17579 = G__17580;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__17583 = cljs.core.hash.call(null, a);
  var b__17584 = cljs.core.hash.call(null, b);
  if(a__17583 < b__17584) {
    return-1
  }else {
    if(a__17583 > b__17584) {
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
  var ks__17592 = m.keys;
  var len__17593 = ks__17592.length;
  var so__17594 = m.strobj;
  var out__17595 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__17596 = 0;
  var out__17597 = cljs.core.transient$.call(null, out__17595);
  while(true) {
    if(i__17596 < len__17593) {
      var k__17598 = ks__17592[i__17596];
      var G__17599 = i__17596 + 1;
      var G__17600 = cljs.core.assoc_BANG_.call(null, out__17597, k__17598, so__17594[k__17598]);
      i__17596 = G__17599;
      out__17597 = G__17600;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__17597, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__17606 = {};
  var l__17607 = ks.length;
  var i__17608 = 0;
  while(true) {
    if(i__17608 < l__17607) {
      var k__17609 = ks[i__17608];
      new_obj__17606[k__17609] = obj[k__17609];
      var G__17610 = i__17608 + 1;
      i__17608 = G__17610;
      continue
    }else {
    }
    break
  }
  return new_obj__17606
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
  var this__17613 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17614 = this;
  var h__2198__auto____17615 = this__17614.__hash;
  if(!(h__2198__auto____17615 == null)) {
    return h__2198__auto____17615
  }else {
    var h__2198__auto____17616 = cljs.core.hash_imap.call(null, coll);
    this__17614.__hash = h__2198__auto____17616;
    return h__2198__auto____17616
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17617 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17618 = this;
  if(function() {
    var and__3822__auto____17619 = goog.isString(k);
    if(and__3822__auto____17619) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17618.keys) == null)
    }else {
      return and__3822__auto____17619
    }
  }()) {
    return this__17618.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17620 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____17621 = this__17620.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____17621) {
        return or__3824__auto____17621
      }else {
        return this__17620.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__17620.keys) == null)) {
        var new_strobj__17622 = cljs.core.obj_clone.call(null, this__17620.strobj, this__17620.keys);
        new_strobj__17622[k] = v;
        return new cljs.core.ObjMap(this__17620.meta, this__17620.keys, new_strobj__17622, this__17620.update_count + 1, null)
      }else {
        var new_strobj__17623 = cljs.core.obj_clone.call(null, this__17620.strobj, this__17620.keys);
        var new_keys__17624 = this__17620.keys.slice();
        new_strobj__17623[k] = v;
        new_keys__17624.push(k);
        return new cljs.core.ObjMap(this__17620.meta, new_keys__17624, new_strobj__17623, this__17620.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17625 = this;
  if(function() {
    var and__3822__auto____17626 = goog.isString(k);
    if(and__3822__auto____17626) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17625.keys) == null)
    }else {
      return and__3822__auto____17626
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__17648 = null;
  var G__17648__2 = function(this_sym17627, k) {
    var this__17629 = this;
    var this_sym17627__17630 = this;
    var coll__17631 = this_sym17627__17630;
    return coll__17631.cljs$core$ILookup$_lookup$arity$2(coll__17631, k)
  };
  var G__17648__3 = function(this_sym17628, k, not_found) {
    var this__17629 = this;
    var this_sym17628__17632 = this;
    var coll__17633 = this_sym17628__17632;
    return coll__17633.cljs$core$ILookup$_lookup$arity$3(coll__17633, k, not_found)
  };
  G__17648 = function(this_sym17628, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17648__2.call(this, this_sym17628, k);
      case 3:
        return G__17648__3.call(this, this_sym17628, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17648
}();
cljs.core.ObjMap.prototype.apply = function(this_sym17611, args17612) {
  var this__17634 = this;
  return this_sym17611.call.apply(this_sym17611, [this_sym17611].concat(args17612.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17635 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__17636 = this;
  var this__17637 = this;
  return cljs.core.pr_str.call(null, this__17637)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17638 = this;
  if(this__17638.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__17601_SHARP_) {
      return cljs.core.vector.call(null, p1__17601_SHARP_, this__17638.strobj[p1__17601_SHARP_])
    }, this__17638.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17639 = this;
  return this__17639.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17640 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17641 = this;
  return new cljs.core.ObjMap(meta, this__17641.keys, this__17641.strobj, this__17641.update_count, this__17641.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17642 = this;
  return this__17642.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17643 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__17643.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17644 = this;
  if(function() {
    var and__3822__auto____17645 = goog.isString(k);
    if(and__3822__auto____17645) {
      return!(cljs.core.scan_array.call(null, 1, k, this__17644.keys) == null)
    }else {
      return and__3822__auto____17645
    }
  }()) {
    var new_keys__17646 = this__17644.keys.slice();
    var new_strobj__17647 = cljs.core.obj_clone.call(null, this__17644.strobj, this__17644.keys);
    new_keys__17646.splice(cljs.core.scan_array.call(null, 1, k, new_keys__17646), 1);
    cljs.core.js_delete.call(null, new_strobj__17647, k);
    return new cljs.core.ObjMap(this__17644.meta, new_keys__17646, new_strobj__17647, this__17644.update_count + 1, null)
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
  var this__17652 = this;
  var h__2198__auto____17653 = this__17652.__hash;
  if(!(h__2198__auto____17653 == null)) {
    return h__2198__auto____17653
  }else {
    var h__2198__auto____17654 = cljs.core.hash_imap.call(null, coll);
    this__17652.__hash = h__2198__auto____17654;
    return h__2198__auto____17654
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17655 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17656 = this;
  var bucket__17657 = this__17656.hashobj[cljs.core.hash.call(null, k)];
  var i__17658 = cljs.core.truth_(bucket__17657) ? cljs.core.scan_array.call(null, 2, k, bucket__17657) : null;
  if(cljs.core.truth_(i__17658)) {
    return bucket__17657[i__17658 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17659 = this;
  var h__17660 = cljs.core.hash.call(null, k);
  var bucket__17661 = this__17659.hashobj[h__17660];
  if(cljs.core.truth_(bucket__17661)) {
    var new_bucket__17662 = bucket__17661.slice();
    var new_hashobj__17663 = goog.object.clone(this__17659.hashobj);
    new_hashobj__17663[h__17660] = new_bucket__17662;
    var temp__3971__auto____17664 = cljs.core.scan_array.call(null, 2, k, new_bucket__17662);
    if(cljs.core.truth_(temp__3971__auto____17664)) {
      var i__17665 = temp__3971__auto____17664;
      new_bucket__17662[i__17665 + 1] = v;
      return new cljs.core.HashMap(this__17659.meta, this__17659.count, new_hashobj__17663, null)
    }else {
      new_bucket__17662.push(k, v);
      return new cljs.core.HashMap(this__17659.meta, this__17659.count + 1, new_hashobj__17663, null)
    }
  }else {
    var new_hashobj__17666 = goog.object.clone(this__17659.hashobj);
    new_hashobj__17666[h__17660] = [k, v];
    return new cljs.core.HashMap(this__17659.meta, this__17659.count + 1, new_hashobj__17666, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17667 = this;
  var bucket__17668 = this__17667.hashobj[cljs.core.hash.call(null, k)];
  var i__17669 = cljs.core.truth_(bucket__17668) ? cljs.core.scan_array.call(null, 2, k, bucket__17668) : null;
  if(cljs.core.truth_(i__17669)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__17694 = null;
  var G__17694__2 = function(this_sym17670, k) {
    var this__17672 = this;
    var this_sym17670__17673 = this;
    var coll__17674 = this_sym17670__17673;
    return coll__17674.cljs$core$ILookup$_lookup$arity$2(coll__17674, k)
  };
  var G__17694__3 = function(this_sym17671, k, not_found) {
    var this__17672 = this;
    var this_sym17671__17675 = this;
    var coll__17676 = this_sym17671__17675;
    return coll__17676.cljs$core$ILookup$_lookup$arity$3(coll__17676, k, not_found)
  };
  G__17694 = function(this_sym17671, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17694__2.call(this, this_sym17671, k);
      case 3:
        return G__17694__3.call(this, this_sym17671, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17694
}();
cljs.core.HashMap.prototype.apply = function(this_sym17650, args17651) {
  var this__17677 = this;
  return this_sym17650.call.apply(this_sym17650, [this_sym17650].concat(args17651.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17678 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__17679 = this;
  var this__17680 = this;
  return cljs.core.pr_str.call(null, this__17680)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17681 = this;
  if(this__17681.count > 0) {
    var hashes__17682 = cljs.core.js_keys.call(null, this__17681.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__17649_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__17681.hashobj[p1__17649_SHARP_]))
    }, hashes__17682)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17683 = this;
  return this__17683.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17684 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17685 = this;
  return new cljs.core.HashMap(meta, this__17685.count, this__17685.hashobj, this__17685.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17686 = this;
  return this__17686.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17687 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__17687.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17688 = this;
  var h__17689 = cljs.core.hash.call(null, k);
  var bucket__17690 = this__17688.hashobj[h__17689];
  var i__17691 = cljs.core.truth_(bucket__17690) ? cljs.core.scan_array.call(null, 2, k, bucket__17690) : null;
  if(cljs.core.not.call(null, i__17691)) {
    return coll
  }else {
    var new_hashobj__17692 = goog.object.clone(this__17688.hashobj);
    if(3 > bucket__17690.length) {
      cljs.core.js_delete.call(null, new_hashobj__17692, h__17689)
    }else {
      var new_bucket__17693 = bucket__17690.slice();
      new_bucket__17693.splice(i__17691, 2);
      new_hashobj__17692[h__17689] = new_bucket__17693
    }
    return new cljs.core.HashMap(this__17688.meta, this__17688.count - 1, new_hashobj__17692, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__17695 = ks.length;
  var i__17696 = 0;
  var out__17697 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__17696 < len__17695) {
      var G__17698 = i__17696 + 1;
      var G__17699 = cljs.core.assoc.call(null, out__17697, ks[i__17696], vs[i__17696]);
      i__17696 = G__17698;
      out__17697 = G__17699;
      continue
    }else {
      return out__17697
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__17703 = m.arr;
  var len__17704 = arr__17703.length;
  var i__17705 = 0;
  while(true) {
    if(len__17704 <= i__17705) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__17703[i__17705], k)) {
        return i__17705
      }else {
        if("\ufdd0'else") {
          var G__17706 = i__17705 + 2;
          i__17705 = G__17706;
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
  var this__17709 = this;
  return new cljs.core.TransientArrayMap({}, this__17709.arr.length, this__17709.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__17710 = this;
  var h__2198__auto____17711 = this__17710.__hash;
  if(!(h__2198__auto____17711 == null)) {
    return h__2198__auto____17711
  }else {
    var h__2198__auto____17712 = cljs.core.hash_imap.call(null, coll);
    this__17710.__hash = h__2198__auto____17712;
    return h__2198__auto____17712
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__17713 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__17714 = this;
  var idx__17715 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17715 === -1) {
    return not_found
  }else {
    return this__17714.arr[idx__17715 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__17716 = this;
  var idx__17717 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17717 === -1) {
    if(this__17716.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__17716.meta, this__17716.cnt + 1, function() {
        var G__17718__17719 = this__17716.arr.slice();
        G__17718__17719.push(k);
        G__17718__17719.push(v);
        return G__17718__17719
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__17716.arr[idx__17717 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__17716.meta, this__17716.cnt, function() {
          var G__17720__17721 = this__17716.arr.slice();
          G__17720__17721[idx__17717 + 1] = v;
          return G__17720__17721
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__17722 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__17754 = null;
  var G__17754__2 = function(this_sym17723, k) {
    var this__17725 = this;
    var this_sym17723__17726 = this;
    var coll__17727 = this_sym17723__17726;
    return coll__17727.cljs$core$ILookup$_lookup$arity$2(coll__17727, k)
  };
  var G__17754__3 = function(this_sym17724, k, not_found) {
    var this__17725 = this;
    var this_sym17724__17728 = this;
    var coll__17729 = this_sym17724__17728;
    return coll__17729.cljs$core$ILookup$_lookup$arity$3(coll__17729, k, not_found)
  };
  G__17754 = function(this_sym17724, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__17754__2.call(this, this_sym17724, k);
      case 3:
        return G__17754__3.call(this, this_sym17724, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__17754
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym17707, args17708) {
  var this__17730 = this;
  return this_sym17707.call.apply(this_sym17707, [this_sym17707].concat(args17708.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__17731 = this;
  var len__17732 = this__17731.arr.length;
  var i__17733 = 0;
  var init__17734 = init;
  while(true) {
    if(i__17733 < len__17732) {
      var init__17735 = f.call(null, init__17734, this__17731.arr[i__17733], this__17731.arr[i__17733 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__17735)) {
        return cljs.core.deref.call(null, init__17735)
      }else {
        var G__17755 = i__17733 + 2;
        var G__17756 = init__17735;
        i__17733 = G__17755;
        init__17734 = G__17756;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__17736 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__17737 = this;
  var this__17738 = this;
  return cljs.core.pr_str.call(null, this__17738)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__17739 = this;
  if(this__17739.cnt > 0) {
    var len__17740 = this__17739.arr.length;
    var array_map_seq__17741 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__17740) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__17739.arr[i], this__17739.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__17741.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__17742 = this;
  return this__17742.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__17743 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__17744 = this;
  return new cljs.core.PersistentArrayMap(meta, this__17744.cnt, this__17744.arr, this__17744.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__17745 = this;
  return this__17745.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__17746 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__17746.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__17747 = this;
  var idx__17748 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__17748 >= 0) {
    var len__17749 = this__17747.arr.length;
    var new_len__17750 = len__17749 - 2;
    if(new_len__17750 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__17751 = cljs.core.make_array.call(null, new_len__17750);
      var s__17752 = 0;
      var d__17753 = 0;
      while(true) {
        if(s__17752 >= len__17749) {
          return new cljs.core.PersistentArrayMap(this__17747.meta, this__17747.cnt - 1, new_arr__17751, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__17747.arr[s__17752])) {
            var G__17757 = s__17752 + 2;
            var G__17758 = d__17753;
            s__17752 = G__17757;
            d__17753 = G__17758;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__17751[d__17753] = this__17747.arr[s__17752];
              new_arr__17751[d__17753 + 1] = this__17747.arr[s__17752 + 1];
              var G__17759 = s__17752 + 2;
              var G__17760 = d__17753 + 2;
              s__17752 = G__17759;
              d__17753 = G__17760;
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
  var len__17761 = cljs.core.count.call(null, ks);
  var i__17762 = 0;
  var out__17763 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__17762 < len__17761) {
      var G__17764 = i__17762 + 1;
      var G__17765 = cljs.core.assoc_BANG_.call(null, out__17763, ks[i__17762], vs[i__17762]);
      i__17762 = G__17764;
      out__17763 = G__17765;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__17763)
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
  var this__17766 = this;
  if(cljs.core.truth_(this__17766.editable_QMARK_)) {
    var idx__17767 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17767 >= 0) {
      this__17766.arr[idx__17767] = this__17766.arr[this__17766.len - 2];
      this__17766.arr[idx__17767 + 1] = this__17766.arr[this__17766.len - 1];
      var G__17768__17769 = this__17766.arr;
      G__17768__17769.pop();
      G__17768__17769.pop();
      G__17768__17769;
      this__17766.len = this__17766.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__17770 = this;
  if(cljs.core.truth_(this__17770.editable_QMARK_)) {
    var idx__17771 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__17771 === -1) {
      if(this__17770.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__17770.len = this__17770.len + 2;
        this__17770.arr.push(key);
        this__17770.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__17770.len, this__17770.arr), key, val)
      }
    }else {
      if(val === this__17770.arr[idx__17771 + 1]) {
        return tcoll
      }else {
        this__17770.arr[idx__17771 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__17772 = this;
  if(cljs.core.truth_(this__17772.editable_QMARK_)) {
    if(function() {
      var G__17773__17774 = o;
      if(G__17773__17774) {
        if(function() {
          var or__3824__auto____17775 = G__17773__17774.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____17775) {
            return or__3824__auto____17775
          }else {
            return G__17773__17774.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__17773__17774.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17773__17774)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__17773__17774)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__17776 = cljs.core.seq.call(null, o);
      var tcoll__17777 = tcoll;
      while(true) {
        var temp__3971__auto____17778 = cljs.core.first.call(null, es__17776);
        if(cljs.core.truth_(temp__3971__auto____17778)) {
          var e__17779 = temp__3971__auto____17778;
          var G__17785 = cljs.core.next.call(null, es__17776);
          var G__17786 = tcoll__17777.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__17777, cljs.core.key.call(null, e__17779), cljs.core.val.call(null, e__17779));
          es__17776 = G__17785;
          tcoll__17777 = G__17786;
          continue
        }else {
          return tcoll__17777
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__17780 = this;
  if(cljs.core.truth_(this__17780.editable_QMARK_)) {
    this__17780.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__17780.len, 2), this__17780.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__17781 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__17782 = this;
  if(cljs.core.truth_(this__17782.editable_QMARK_)) {
    var idx__17783 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__17783 === -1) {
      return not_found
    }else {
      return this__17782.arr[idx__17783 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__17784 = this;
  if(cljs.core.truth_(this__17784.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__17784.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__17789 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__17790 = 0;
  while(true) {
    if(i__17790 < len) {
      var G__17791 = cljs.core.assoc_BANG_.call(null, out__17789, arr[i__17790], arr[i__17790 + 1]);
      var G__17792 = i__17790 + 2;
      out__17789 = G__17791;
      i__17790 = G__17792;
      continue
    }else {
      return out__17789
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
    var G__17797__17798 = arr.slice();
    G__17797__17798[i] = a;
    return G__17797__17798
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__17799__17800 = arr.slice();
    G__17799__17800[i] = a;
    G__17799__17800[j] = b;
    return G__17799__17800
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
  var new_arr__17802 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__17802, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__17802, 2 * i, new_arr__17802.length - 2 * i);
  return new_arr__17802
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
    var editable__17805 = inode.ensure_editable(edit);
    editable__17805.arr[i] = a;
    return editable__17805
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__17806 = inode.ensure_editable(edit);
    editable__17806.arr[i] = a;
    editable__17806.arr[j] = b;
    return editable__17806
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
  var len__17813 = arr.length;
  var i__17814 = 0;
  var init__17815 = init;
  while(true) {
    if(i__17814 < len__17813) {
      var init__17818 = function() {
        var k__17816 = arr[i__17814];
        if(!(k__17816 == null)) {
          return f.call(null, init__17815, k__17816, arr[i__17814 + 1])
        }else {
          var node__17817 = arr[i__17814 + 1];
          if(!(node__17817 == null)) {
            return node__17817.kv_reduce(f, init__17815)
          }else {
            return init__17815
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__17818)) {
        return cljs.core.deref.call(null, init__17818)
      }else {
        var G__17819 = i__17814 + 2;
        var G__17820 = init__17818;
        i__17814 = G__17819;
        init__17815 = G__17820;
        continue
      }
    }else {
      return init__17815
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
  var this__17821 = this;
  var inode__17822 = this;
  if(this__17821.bitmap === bit) {
    return null
  }else {
    var editable__17823 = inode__17822.ensure_editable(e);
    var earr__17824 = editable__17823.arr;
    var len__17825 = earr__17824.length;
    editable__17823.bitmap = bit ^ editable__17823.bitmap;
    cljs.core.array_copy.call(null, earr__17824, 2 * (i + 1), earr__17824, 2 * i, len__17825 - 2 * (i + 1));
    earr__17824[len__17825 - 2] = null;
    earr__17824[len__17825 - 1] = null;
    return editable__17823
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__17826 = this;
  var inode__17827 = this;
  var bit__17828 = 1 << (hash >>> shift & 31);
  var idx__17829 = cljs.core.bitmap_indexed_node_index.call(null, this__17826.bitmap, bit__17828);
  if((this__17826.bitmap & bit__17828) === 0) {
    var n__17830 = cljs.core.bit_count.call(null, this__17826.bitmap);
    if(2 * n__17830 < this__17826.arr.length) {
      var editable__17831 = inode__17827.ensure_editable(edit);
      var earr__17832 = editable__17831.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__17832, 2 * idx__17829, earr__17832, 2 * (idx__17829 + 1), 2 * (n__17830 - idx__17829));
      earr__17832[2 * idx__17829] = key;
      earr__17832[2 * idx__17829 + 1] = val;
      editable__17831.bitmap = editable__17831.bitmap | bit__17828;
      return editable__17831
    }else {
      if(n__17830 >= 16) {
        var nodes__17833 = cljs.core.make_array.call(null, 32);
        var jdx__17834 = hash >>> shift & 31;
        nodes__17833[jdx__17834] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__17835 = 0;
        var j__17836 = 0;
        while(true) {
          if(i__17835 < 32) {
            if((this__17826.bitmap >>> i__17835 & 1) === 0) {
              var G__17889 = i__17835 + 1;
              var G__17890 = j__17836;
              i__17835 = G__17889;
              j__17836 = G__17890;
              continue
            }else {
              nodes__17833[i__17835] = !(this__17826.arr[j__17836] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__17826.arr[j__17836]), this__17826.arr[j__17836], this__17826.arr[j__17836 + 1], added_leaf_QMARK_) : this__17826.arr[j__17836 + 1];
              var G__17891 = i__17835 + 1;
              var G__17892 = j__17836 + 2;
              i__17835 = G__17891;
              j__17836 = G__17892;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__17830 + 1, nodes__17833)
      }else {
        if("\ufdd0'else") {
          var new_arr__17837 = cljs.core.make_array.call(null, 2 * (n__17830 + 4));
          cljs.core.array_copy.call(null, this__17826.arr, 0, new_arr__17837, 0, 2 * idx__17829);
          new_arr__17837[2 * idx__17829] = key;
          new_arr__17837[2 * idx__17829 + 1] = val;
          cljs.core.array_copy.call(null, this__17826.arr, 2 * idx__17829, new_arr__17837, 2 * (idx__17829 + 1), 2 * (n__17830 - idx__17829));
          added_leaf_QMARK_.val = true;
          var editable__17838 = inode__17827.ensure_editable(edit);
          editable__17838.arr = new_arr__17837;
          editable__17838.bitmap = editable__17838.bitmap | bit__17828;
          return editable__17838
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__17839 = this__17826.arr[2 * idx__17829];
    var val_or_node__17840 = this__17826.arr[2 * idx__17829 + 1];
    if(key_or_nil__17839 == null) {
      var n__17841 = val_or_node__17840.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17841 === val_or_node__17840) {
        return inode__17827
      }else {
        return cljs.core.edit_and_set.call(null, inode__17827, edit, 2 * idx__17829 + 1, n__17841)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17839)) {
        if(val === val_or_node__17840) {
          return inode__17827
        }else {
          return cljs.core.edit_and_set.call(null, inode__17827, edit, 2 * idx__17829 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__17827, edit, 2 * idx__17829, null, 2 * idx__17829 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__17839, val_or_node__17840, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__17842 = this;
  var inode__17843 = this;
  return cljs.core.create_inode_seq.call(null, this__17842.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17844 = this;
  var inode__17845 = this;
  var bit__17846 = 1 << (hash >>> shift & 31);
  if((this__17844.bitmap & bit__17846) === 0) {
    return inode__17845
  }else {
    var idx__17847 = cljs.core.bitmap_indexed_node_index.call(null, this__17844.bitmap, bit__17846);
    var key_or_nil__17848 = this__17844.arr[2 * idx__17847];
    var val_or_node__17849 = this__17844.arr[2 * idx__17847 + 1];
    if(key_or_nil__17848 == null) {
      var n__17850 = val_or_node__17849.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__17850 === val_or_node__17849) {
        return inode__17845
      }else {
        if(!(n__17850 == null)) {
          return cljs.core.edit_and_set.call(null, inode__17845, edit, 2 * idx__17847 + 1, n__17850)
        }else {
          if(this__17844.bitmap === bit__17846) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__17845.edit_and_remove_pair(edit, bit__17846, idx__17847)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17848)) {
        removed_leaf_QMARK_[0] = true;
        return inode__17845.edit_and_remove_pair(edit, bit__17846, idx__17847)
      }else {
        if("\ufdd0'else") {
          return inode__17845
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__17851 = this;
  var inode__17852 = this;
  if(e === this__17851.edit) {
    return inode__17852
  }else {
    var n__17853 = cljs.core.bit_count.call(null, this__17851.bitmap);
    var new_arr__17854 = cljs.core.make_array.call(null, n__17853 < 0 ? 4 : 2 * (n__17853 + 1));
    cljs.core.array_copy.call(null, this__17851.arr, 0, new_arr__17854, 0, 2 * n__17853);
    return new cljs.core.BitmapIndexedNode(e, this__17851.bitmap, new_arr__17854)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__17855 = this;
  var inode__17856 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17855.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17857 = this;
  var inode__17858 = this;
  var bit__17859 = 1 << (hash >>> shift & 31);
  if((this__17857.bitmap & bit__17859) === 0) {
    return not_found
  }else {
    var idx__17860 = cljs.core.bitmap_indexed_node_index.call(null, this__17857.bitmap, bit__17859);
    var key_or_nil__17861 = this__17857.arr[2 * idx__17860];
    var val_or_node__17862 = this__17857.arr[2 * idx__17860 + 1];
    if(key_or_nil__17861 == null) {
      return val_or_node__17862.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17861)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__17861, val_or_node__17862], true)
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
  var this__17863 = this;
  var inode__17864 = this;
  var bit__17865 = 1 << (hash >>> shift & 31);
  if((this__17863.bitmap & bit__17865) === 0) {
    return inode__17864
  }else {
    var idx__17866 = cljs.core.bitmap_indexed_node_index.call(null, this__17863.bitmap, bit__17865);
    var key_or_nil__17867 = this__17863.arr[2 * idx__17866];
    var val_or_node__17868 = this__17863.arr[2 * idx__17866 + 1];
    if(key_or_nil__17867 == null) {
      var n__17869 = val_or_node__17868.inode_without(shift + 5, hash, key);
      if(n__17869 === val_or_node__17868) {
        return inode__17864
      }else {
        if(!(n__17869 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__17863.bitmap, cljs.core.clone_and_set.call(null, this__17863.arr, 2 * idx__17866 + 1, n__17869))
        }else {
          if(this__17863.bitmap === bit__17865) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__17863.bitmap ^ bit__17865, cljs.core.remove_pair.call(null, this__17863.arr, idx__17866))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17867)) {
        return new cljs.core.BitmapIndexedNode(null, this__17863.bitmap ^ bit__17865, cljs.core.remove_pair.call(null, this__17863.arr, idx__17866))
      }else {
        if("\ufdd0'else") {
          return inode__17864
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17870 = this;
  var inode__17871 = this;
  var bit__17872 = 1 << (hash >>> shift & 31);
  var idx__17873 = cljs.core.bitmap_indexed_node_index.call(null, this__17870.bitmap, bit__17872);
  if((this__17870.bitmap & bit__17872) === 0) {
    var n__17874 = cljs.core.bit_count.call(null, this__17870.bitmap);
    if(n__17874 >= 16) {
      var nodes__17875 = cljs.core.make_array.call(null, 32);
      var jdx__17876 = hash >>> shift & 31;
      nodes__17875[jdx__17876] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__17877 = 0;
      var j__17878 = 0;
      while(true) {
        if(i__17877 < 32) {
          if((this__17870.bitmap >>> i__17877 & 1) === 0) {
            var G__17893 = i__17877 + 1;
            var G__17894 = j__17878;
            i__17877 = G__17893;
            j__17878 = G__17894;
            continue
          }else {
            nodes__17875[i__17877] = !(this__17870.arr[j__17878] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__17870.arr[j__17878]), this__17870.arr[j__17878], this__17870.arr[j__17878 + 1], added_leaf_QMARK_) : this__17870.arr[j__17878 + 1];
            var G__17895 = i__17877 + 1;
            var G__17896 = j__17878 + 2;
            i__17877 = G__17895;
            j__17878 = G__17896;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__17874 + 1, nodes__17875)
    }else {
      var new_arr__17879 = cljs.core.make_array.call(null, 2 * (n__17874 + 1));
      cljs.core.array_copy.call(null, this__17870.arr, 0, new_arr__17879, 0, 2 * idx__17873);
      new_arr__17879[2 * idx__17873] = key;
      new_arr__17879[2 * idx__17873 + 1] = val;
      cljs.core.array_copy.call(null, this__17870.arr, 2 * idx__17873, new_arr__17879, 2 * (idx__17873 + 1), 2 * (n__17874 - idx__17873));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__17870.bitmap | bit__17872, new_arr__17879)
    }
  }else {
    var key_or_nil__17880 = this__17870.arr[2 * idx__17873];
    var val_or_node__17881 = this__17870.arr[2 * idx__17873 + 1];
    if(key_or_nil__17880 == null) {
      var n__17882 = val_or_node__17881.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__17882 === val_or_node__17881) {
        return inode__17871
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__17870.bitmap, cljs.core.clone_and_set.call(null, this__17870.arr, 2 * idx__17873 + 1, n__17882))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17880)) {
        if(val === val_or_node__17881) {
          return inode__17871
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__17870.bitmap, cljs.core.clone_and_set.call(null, this__17870.arr, 2 * idx__17873 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__17870.bitmap, cljs.core.clone_and_set.call(null, this__17870.arr, 2 * idx__17873, null, 2 * idx__17873 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__17880, val_or_node__17881, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17883 = this;
  var inode__17884 = this;
  var bit__17885 = 1 << (hash >>> shift & 31);
  if((this__17883.bitmap & bit__17885) === 0) {
    return not_found
  }else {
    var idx__17886 = cljs.core.bitmap_indexed_node_index.call(null, this__17883.bitmap, bit__17885);
    var key_or_nil__17887 = this__17883.arr[2 * idx__17886];
    var val_or_node__17888 = this__17883.arr[2 * idx__17886 + 1];
    if(key_or_nil__17887 == null) {
      return val_or_node__17888.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__17887)) {
        return val_or_node__17888
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
  var arr__17904 = array_node.arr;
  var len__17905 = 2 * (array_node.cnt - 1);
  var new_arr__17906 = cljs.core.make_array.call(null, len__17905);
  var i__17907 = 0;
  var j__17908 = 1;
  var bitmap__17909 = 0;
  while(true) {
    if(i__17907 < len__17905) {
      if(function() {
        var and__3822__auto____17910 = !(i__17907 === idx);
        if(and__3822__auto____17910) {
          return!(arr__17904[i__17907] == null)
        }else {
          return and__3822__auto____17910
        }
      }()) {
        new_arr__17906[j__17908] = arr__17904[i__17907];
        var G__17911 = i__17907 + 1;
        var G__17912 = j__17908 + 2;
        var G__17913 = bitmap__17909 | 1 << i__17907;
        i__17907 = G__17911;
        j__17908 = G__17912;
        bitmap__17909 = G__17913;
        continue
      }else {
        var G__17914 = i__17907 + 1;
        var G__17915 = j__17908;
        var G__17916 = bitmap__17909;
        i__17907 = G__17914;
        j__17908 = G__17915;
        bitmap__17909 = G__17916;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__17909, new_arr__17906)
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
  var this__17917 = this;
  var inode__17918 = this;
  var idx__17919 = hash >>> shift & 31;
  var node__17920 = this__17917.arr[idx__17919];
  if(node__17920 == null) {
    var editable__17921 = cljs.core.edit_and_set.call(null, inode__17918, edit, idx__17919, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__17921.cnt = editable__17921.cnt + 1;
    return editable__17921
  }else {
    var n__17922 = node__17920.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17922 === node__17920) {
      return inode__17918
    }else {
      return cljs.core.edit_and_set.call(null, inode__17918, edit, idx__17919, n__17922)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__17923 = this;
  var inode__17924 = this;
  return cljs.core.create_array_node_seq.call(null, this__17923.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17925 = this;
  var inode__17926 = this;
  var idx__17927 = hash >>> shift & 31;
  var node__17928 = this__17925.arr[idx__17927];
  if(node__17928 == null) {
    return inode__17926
  }else {
    var n__17929 = node__17928.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__17929 === node__17928) {
      return inode__17926
    }else {
      if(n__17929 == null) {
        if(this__17925.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17926, edit, idx__17927)
        }else {
          var editable__17930 = cljs.core.edit_and_set.call(null, inode__17926, edit, idx__17927, n__17929);
          editable__17930.cnt = editable__17930.cnt - 1;
          return editable__17930
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__17926, edit, idx__17927, n__17929)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__17931 = this;
  var inode__17932 = this;
  if(e === this__17931.edit) {
    return inode__17932
  }else {
    return new cljs.core.ArrayNode(e, this__17931.cnt, this__17931.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__17933 = this;
  var inode__17934 = this;
  var len__17935 = this__17933.arr.length;
  var i__17936 = 0;
  var init__17937 = init;
  while(true) {
    if(i__17936 < len__17935) {
      var node__17938 = this__17933.arr[i__17936];
      if(!(node__17938 == null)) {
        var init__17939 = node__17938.kv_reduce(f, init__17937);
        if(cljs.core.reduced_QMARK_.call(null, init__17939)) {
          return cljs.core.deref.call(null, init__17939)
        }else {
          var G__17958 = i__17936 + 1;
          var G__17959 = init__17939;
          i__17936 = G__17958;
          init__17937 = G__17959;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__17937
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17940 = this;
  var inode__17941 = this;
  var idx__17942 = hash >>> shift & 31;
  var node__17943 = this__17940.arr[idx__17942];
  if(!(node__17943 == null)) {
    return node__17943.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__17944 = this;
  var inode__17945 = this;
  var idx__17946 = hash >>> shift & 31;
  var node__17947 = this__17944.arr[idx__17946];
  if(!(node__17947 == null)) {
    var n__17948 = node__17947.inode_without(shift + 5, hash, key);
    if(n__17948 === node__17947) {
      return inode__17945
    }else {
      if(n__17948 == null) {
        if(this__17944.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__17945, null, idx__17946)
        }else {
          return new cljs.core.ArrayNode(null, this__17944.cnt - 1, cljs.core.clone_and_set.call(null, this__17944.arr, idx__17946, n__17948))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__17944.cnt, cljs.core.clone_and_set.call(null, this__17944.arr, idx__17946, n__17948))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__17945
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17949 = this;
  var inode__17950 = this;
  var idx__17951 = hash >>> shift & 31;
  var node__17952 = this__17949.arr[idx__17951];
  if(node__17952 == null) {
    return new cljs.core.ArrayNode(null, this__17949.cnt + 1, cljs.core.clone_and_set.call(null, this__17949.arr, idx__17951, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__17953 = node__17952.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__17953 === node__17952) {
      return inode__17950
    }else {
      return new cljs.core.ArrayNode(null, this__17949.cnt, cljs.core.clone_and_set.call(null, this__17949.arr, idx__17951, n__17953))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17954 = this;
  var inode__17955 = this;
  var idx__17956 = hash >>> shift & 31;
  var node__17957 = this__17954.arr[idx__17956];
  if(!(node__17957 == null)) {
    return node__17957.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__17962 = 2 * cnt;
  var i__17963 = 0;
  while(true) {
    if(i__17963 < lim__17962) {
      if(cljs.core.key_test.call(null, key, arr[i__17963])) {
        return i__17963
      }else {
        var G__17964 = i__17963 + 2;
        i__17963 = G__17964;
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
  var this__17965 = this;
  var inode__17966 = this;
  if(hash === this__17965.collision_hash) {
    var idx__17967 = cljs.core.hash_collision_node_find_index.call(null, this__17965.arr, this__17965.cnt, key);
    if(idx__17967 === -1) {
      if(this__17965.arr.length > 2 * this__17965.cnt) {
        var editable__17968 = cljs.core.edit_and_set.call(null, inode__17966, edit, 2 * this__17965.cnt, key, 2 * this__17965.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__17968.cnt = editable__17968.cnt + 1;
        return editable__17968
      }else {
        var len__17969 = this__17965.arr.length;
        var new_arr__17970 = cljs.core.make_array.call(null, len__17969 + 2);
        cljs.core.array_copy.call(null, this__17965.arr, 0, new_arr__17970, 0, len__17969);
        new_arr__17970[len__17969] = key;
        new_arr__17970[len__17969 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__17966.ensure_editable_array(edit, this__17965.cnt + 1, new_arr__17970)
      }
    }else {
      if(this__17965.arr[idx__17967 + 1] === val) {
        return inode__17966
      }else {
        return cljs.core.edit_and_set.call(null, inode__17966, edit, idx__17967 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__17965.collision_hash >>> shift & 31), [null, inode__17966, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__17971 = this;
  var inode__17972 = this;
  return cljs.core.create_inode_seq.call(null, this__17971.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__17973 = this;
  var inode__17974 = this;
  var idx__17975 = cljs.core.hash_collision_node_find_index.call(null, this__17973.arr, this__17973.cnt, key);
  if(idx__17975 === -1) {
    return inode__17974
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__17973.cnt === 1) {
      return null
    }else {
      var editable__17976 = inode__17974.ensure_editable(edit);
      var earr__17977 = editable__17976.arr;
      earr__17977[idx__17975] = earr__17977[2 * this__17973.cnt - 2];
      earr__17977[idx__17975 + 1] = earr__17977[2 * this__17973.cnt - 1];
      earr__17977[2 * this__17973.cnt - 1] = null;
      earr__17977[2 * this__17973.cnt - 2] = null;
      editable__17976.cnt = editable__17976.cnt - 1;
      return editable__17976
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__17978 = this;
  var inode__17979 = this;
  if(e === this__17978.edit) {
    return inode__17979
  }else {
    var new_arr__17980 = cljs.core.make_array.call(null, 2 * (this__17978.cnt + 1));
    cljs.core.array_copy.call(null, this__17978.arr, 0, new_arr__17980, 0, 2 * this__17978.cnt);
    return new cljs.core.HashCollisionNode(e, this__17978.collision_hash, this__17978.cnt, new_arr__17980)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__17981 = this;
  var inode__17982 = this;
  return cljs.core.inode_kv_reduce.call(null, this__17981.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__17983 = this;
  var inode__17984 = this;
  var idx__17985 = cljs.core.hash_collision_node_find_index.call(null, this__17983.arr, this__17983.cnt, key);
  if(idx__17985 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17983.arr[idx__17985])) {
      return cljs.core.PersistentVector.fromArray([this__17983.arr[idx__17985], this__17983.arr[idx__17985 + 1]], true)
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
  var this__17986 = this;
  var inode__17987 = this;
  var idx__17988 = cljs.core.hash_collision_node_find_index.call(null, this__17986.arr, this__17986.cnt, key);
  if(idx__17988 === -1) {
    return inode__17987
  }else {
    if(this__17986.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__17986.collision_hash, this__17986.cnt - 1, cljs.core.remove_pair.call(null, this__17986.arr, cljs.core.quot.call(null, idx__17988, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__17989 = this;
  var inode__17990 = this;
  if(hash === this__17989.collision_hash) {
    var idx__17991 = cljs.core.hash_collision_node_find_index.call(null, this__17989.arr, this__17989.cnt, key);
    if(idx__17991 === -1) {
      var len__17992 = this__17989.arr.length;
      var new_arr__17993 = cljs.core.make_array.call(null, len__17992 + 2);
      cljs.core.array_copy.call(null, this__17989.arr, 0, new_arr__17993, 0, len__17992);
      new_arr__17993[len__17992] = key;
      new_arr__17993[len__17992 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__17989.collision_hash, this__17989.cnt + 1, new_arr__17993)
    }else {
      if(cljs.core._EQ_.call(null, this__17989.arr[idx__17991], val)) {
        return inode__17990
      }else {
        return new cljs.core.HashCollisionNode(null, this__17989.collision_hash, this__17989.cnt, cljs.core.clone_and_set.call(null, this__17989.arr, idx__17991 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__17989.collision_hash >>> shift & 31), [null, inode__17990])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__17994 = this;
  var inode__17995 = this;
  var idx__17996 = cljs.core.hash_collision_node_find_index.call(null, this__17994.arr, this__17994.cnt, key);
  if(idx__17996 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__17994.arr[idx__17996])) {
      return this__17994.arr[idx__17996 + 1]
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
  var this__17997 = this;
  var inode__17998 = this;
  if(e === this__17997.edit) {
    this__17997.arr = array;
    this__17997.cnt = count;
    return inode__17998
  }else {
    return new cljs.core.HashCollisionNode(this__17997.edit, this__17997.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__18003 = cljs.core.hash.call(null, key1);
    if(key1hash__18003 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__18003, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___18004 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__18003, key1, val1, added_leaf_QMARK___18004).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___18004)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__18005 = cljs.core.hash.call(null, key1);
    if(key1hash__18005 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__18005, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___18006 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__18005, key1, val1, added_leaf_QMARK___18006).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___18006)
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
  var this__18007 = this;
  var h__2198__auto____18008 = this__18007.__hash;
  if(!(h__2198__auto____18008 == null)) {
    return h__2198__auto____18008
  }else {
    var h__2198__auto____18009 = cljs.core.hash_coll.call(null, coll);
    this__18007.__hash = h__2198__auto____18009;
    return h__2198__auto____18009
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18010 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__18011 = this;
  var this__18012 = this;
  return cljs.core.pr_str.call(null, this__18012)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18013 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__18014 = this;
  if(this__18014.s == null) {
    return cljs.core.PersistentVector.fromArray([this__18014.nodes[this__18014.i], this__18014.nodes[this__18014.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__18014.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__18015 = this;
  if(this__18015.s == null) {
    return cljs.core.create_inode_seq.call(null, this__18015.nodes, this__18015.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__18015.nodes, this__18015.i, cljs.core.next.call(null, this__18015.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18016 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18017 = this;
  return new cljs.core.NodeSeq(meta, this__18017.nodes, this__18017.i, this__18017.s, this__18017.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18018 = this;
  return this__18018.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18019 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18019.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__18026 = nodes.length;
      var j__18027 = i;
      while(true) {
        if(j__18027 < len__18026) {
          if(!(nodes[j__18027] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__18027, null, null)
          }else {
            var temp__3971__auto____18028 = nodes[j__18027 + 1];
            if(cljs.core.truth_(temp__3971__auto____18028)) {
              var node__18029 = temp__3971__auto____18028;
              var temp__3971__auto____18030 = node__18029.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____18030)) {
                var node_seq__18031 = temp__3971__auto____18030;
                return new cljs.core.NodeSeq(null, nodes, j__18027 + 2, node_seq__18031, null)
              }else {
                var G__18032 = j__18027 + 2;
                j__18027 = G__18032;
                continue
              }
            }else {
              var G__18033 = j__18027 + 2;
              j__18027 = G__18033;
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
  var this__18034 = this;
  var h__2198__auto____18035 = this__18034.__hash;
  if(!(h__2198__auto____18035 == null)) {
    return h__2198__auto____18035
  }else {
    var h__2198__auto____18036 = cljs.core.hash_coll.call(null, coll);
    this__18034.__hash = h__2198__auto____18036;
    return h__2198__auto____18036
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18037 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__18038 = this;
  var this__18039 = this;
  return cljs.core.pr_str.call(null, this__18039)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18040 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__18041 = this;
  return cljs.core.first.call(null, this__18041.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__18042 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__18042.nodes, this__18042.i, cljs.core.next.call(null, this__18042.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18043 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18044 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__18044.nodes, this__18044.i, this__18044.s, this__18044.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18045 = this;
  return this__18045.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18046 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18046.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__18053 = nodes.length;
      var j__18054 = i;
      while(true) {
        if(j__18054 < len__18053) {
          var temp__3971__auto____18055 = nodes[j__18054];
          if(cljs.core.truth_(temp__3971__auto____18055)) {
            var nj__18056 = temp__3971__auto____18055;
            var temp__3971__auto____18057 = nj__18056.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____18057)) {
              var ns__18058 = temp__3971__auto____18057;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__18054 + 1, ns__18058, null)
            }else {
              var G__18059 = j__18054 + 1;
              j__18054 = G__18059;
              continue
            }
          }else {
            var G__18060 = j__18054 + 1;
            j__18054 = G__18060;
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
  var this__18063 = this;
  return new cljs.core.TransientHashMap({}, this__18063.root, this__18063.cnt, this__18063.has_nil_QMARK_, this__18063.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18064 = this;
  var h__2198__auto____18065 = this__18064.__hash;
  if(!(h__2198__auto____18065 == null)) {
    return h__2198__auto____18065
  }else {
    var h__2198__auto____18066 = cljs.core.hash_imap.call(null, coll);
    this__18064.__hash = h__2198__auto____18066;
    return h__2198__auto____18066
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18067 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18068 = this;
  if(k == null) {
    if(this__18068.has_nil_QMARK_) {
      return this__18068.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18068.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__18068.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18069 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____18070 = this__18069.has_nil_QMARK_;
      if(and__3822__auto____18070) {
        return v === this__18069.nil_val
      }else {
        return and__3822__auto____18070
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18069.meta, this__18069.has_nil_QMARK_ ? this__18069.cnt : this__18069.cnt + 1, this__18069.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___18071 = new cljs.core.Box(false);
    var new_root__18072 = (this__18069.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18069.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18071);
    if(new_root__18072 === this__18069.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__18069.meta, added_leaf_QMARK___18071.val ? this__18069.cnt + 1 : this__18069.cnt, new_root__18072, this__18069.has_nil_QMARK_, this__18069.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18073 = this;
  if(k == null) {
    return this__18073.has_nil_QMARK_
  }else {
    if(this__18073.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__18073.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__18096 = null;
  var G__18096__2 = function(this_sym18074, k) {
    var this__18076 = this;
    var this_sym18074__18077 = this;
    var coll__18078 = this_sym18074__18077;
    return coll__18078.cljs$core$ILookup$_lookup$arity$2(coll__18078, k)
  };
  var G__18096__3 = function(this_sym18075, k, not_found) {
    var this__18076 = this;
    var this_sym18075__18079 = this;
    var coll__18080 = this_sym18075__18079;
    return coll__18080.cljs$core$ILookup$_lookup$arity$3(coll__18080, k, not_found)
  };
  G__18096 = function(this_sym18075, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18096__2.call(this, this_sym18075, k);
      case 3:
        return G__18096__3.call(this, this_sym18075, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18096
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym18061, args18062) {
  var this__18081 = this;
  return this_sym18061.call.apply(this_sym18061, [this_sym18061].concat(args18062.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18082 = this;
  var init__18083 = this__18082.has_nil_QMARK_ ? f.call(null, init, null, this__18082.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__18083)) {
    return cljs.core.deref.call(null, init__18083)
  }else {
    if(!(this__18082.root == null)) {
      return this__18082.root.kv_reduce(f, init__18083)
    }else {
      if("\ufdd0'else") {
        return init__18083
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18084 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__18085 = this;
  var this__18086 = this;
  return cljs.core.pr_str.call(null, this__18086)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18087 = this;
  if(this__18087.cnt > 0) {
    var s__18088 = !(this__18087.root == null) ? this__18087.root.inode_seq() : null;
    if(this__18087.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__18087.nil_val], true), s__18088)
    }else {
      return s__18088
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18089 = this;
  return this__18089.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18090 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18091 = this;
  return new cljs.core.PersistentHashMap(meta, this__18091.cnt, this__18091.root, this__18091.has_nil_QMARK_, this__18091.nil_val, this__18091.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18092 = this;
  return this__18092.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18093 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__18093.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18094 = this;
  if(k == null) {
    if(this__18094.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__18094.meta, this__18094.cnt - 1, this__18094.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__18094.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__18095 = this__18094.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__18095 === this__18094.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__18094.meta, this__18094.cnt - 1, new_root__18095, this__18094.has_nil_QMARK_, this__18094.nil_val, null)
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
  var len__18097 = ks.length;
  var i__18098 = 0;
  var out__18099 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__18098 < len__18097) {
      var G__18100 = i__18098 + 1;
      var G__18101 = cljs.core.assoc_BANG_.call(null, out__18099, ks[i__18098], vs[i__18098]);
      i__18098 = G__18100;
      out__18099 = G__18101;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18099)
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
  var this__18102 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__18103 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__18104 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18105 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__18106 = this;
  if(k == null) {
    if(this__18106.has_nil_QMARK_) {
      return this__18106.nil_val
    }else {
      return null
    }
  }else {
    if(this__18106.root == null) {
      return null
    }else {
      return this__18106.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__18107 = this;
  if(k == null) {
    if(this__18107.has_nil_QMARK_) {
      return this__18107.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__18107.root == null) {
      return not_found
    }else {
      return this__18107.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18108 = this;
  if(this__18108.edit) {
    return this__18108.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__18109 = this;
  var tcoll__18110 = this;
  if(this__18109.edit) {
    if(function() {
      var G__18111__18112 = o;
      if(G__18111__18112) {
        if(function() {
          var or__3824__auto____18113 = G__18111__18112.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____18113) {
            return or__3824__auto____18113
          }else {
            return G__18111__18112.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__18111__18112.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18111__18112)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__18111__18112)
      }
    }()) {
      return tcoll__18110.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__18114 = cljs.core.seq.call(null, o);
      var tcoll__18115 = tcoll__18110;
      while(true) {
        var temp__3971__auto____18116 = cljs.core.first.call(null, es__18114);
        if(cljs.core.truth_(temp__3971__auto____18116)) {
          var e__18117 = temp__3971__auto____18116;
          var G__18128 = cljs.core.next.call(null, es__18114);
          var G__18129 = tcoll__18115.assoc_BANG_(cljs.core.key.call(null, e__18117), cljs.core.val.call(null, e__18117));
          es__18114 = G__18128;
          tcoll__18115 = G__18129;
          continue
        }else {
          return tcoll__18115
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__18118 = this;
  var tcoll__18119 = this;
  if(this__18118.edit) {
    if(k == null) {
      if(this__18118.nil_val === v) {
      }else {
        this__18118.nil_val = v
      }
      if(this__18118.has_nil_QMARK_) {
      }else {
        this__18118.count = this__18118.count + 1;
        this__18118.has_nil_QMARK_ = true
      }
      return tcoll__18119
    }else {
      var added_leaf_QMARK___18120 = new cljs.core.Box(false);
      var node__18121 = (this__18118.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__18118.root).inode_assoc_BANG_(this__18118.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___18120);
      if(node__18121 === this__18118.root) {
      }else {
        this__18118.root = node__18121
      }
      if(added_leaf_QMARK___18120.val) {
        this__18118.count = this__18118.count + 1
      }else {
      }
      return tcoll__18119
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__18122 = this;
  var tcoll__18123 = this;
  if(this__18122.edit) {
    if(k == null) {
      if(this__18122.has_nil_QMARK_) {
        this__18122.has_nil_QMARK_ = false;
        this__18122.nil_val = null;
        this__18122.count = this__18122.count - 1;
        return tcoll__18123
      }else {
        return tcoll__18123
      }
    }else {
      if(this__18122.root == null) {
        return tcoll__18123
      }else {
        var removed_leaf_QMARK___18124 = new cljs.core.Box(false);
        var node__18125 = this__18122.root.inode_without_BANG_(this__18122.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___18124);
        if(node__18125 === this__18122.root) {
        }else {
          this__18122.root = node__18125
        }
        if(cljs.core.truth_(removed_leaf_QMARK___18124[0])) {
          this__18122.count = this__18122.count - 1
        }else {
        }
        return tcoll__18123
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__18126 = this;
  var tcoll__18127 = this;
  if(this__18126.edit) {
    this__18126.edit = null;
    return new cljs.core.PersistentHashMap(null, this__18126.count, this__18126.root, this__18126.has_nil_QMARK_, this__18126.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__18132 = node;
  var stack__18133 = stack;
  while(true) {
    if(!(t__18132 == null)) {
      var G__18134 = ascending_QMARK_ ? t__18132.left : t__18132.right;
      var G__18135 = cljs.core.conj.call(null, stack__18133, t__18132);
      t__18132 = G__18134;
      stack__18133 = G__18135;
      continue
    }else {
      return stack__18133
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
  var this__18136 = this;
  var h__2198__auto____18137 = this__18136.__hash;
  if(!(h__2198__auto____18137 == null)) {
    return h__2198__auto____18137
  }else {
    var h__2198__auto____18138 = cljs.core.hash_coll.call(null, coll);
    this__18136.__hash = h__2198__auto____18138;
    return h__2198__auto____18138
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18139 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__18140 = this;
  var this__18141 = this;
  return cljs.core.pr_str.call(null, this__18141)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__18142 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18143 = this;
  if(this__18143.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__18143.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__18144 = this;
  return cljs.core.peek.call(null, this__18144.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__18145 = this;
  var t__18146 = cljs.core.first.call(null, this__18145.stack);
  var next_stack__18147 = cljs.core.tree_map_seq_push.call(null, this__18145.ascending_QMARK_ ? t__18146.right : t__18146.left, cljs.core.next.call(null, this__18145.stack), this__18145.ascending_QMARK_);
  if(!(next_stack__18147 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__18147, this__18145.ascending_QMARK_, this__18145.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18148 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18149 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__18149.stack, this__18149.ascending_QMARK_, this__18149.cnt, this__18149.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18150 = this;
  return this__18150.meta
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
        var and__3822__auto____18152 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____18152) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____18152
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
        var and__3822__auto____18154 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____18154) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____18154
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
  var init__18158 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__18158)) {
    return cljs.core.deref.call(null, init__18158)
  }else {
    var init__18159 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__18158) : init__18158;
    if(cljs.core.reduced_QMARK_.call(null, init__18159)) {
      return cljs.core.deref.call(null, init__18159)
    }else {
      var init__18160 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__18159) : init__18159;
      if(cljs.core.reduced_QMARK_.call(null, init__18160)) {
        return cljs.core.deref.call(null, init__18160)
      }else {
        return init__18160
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
  var this__18163 = this;
  var h__2198__auto____18164 = this__18163.__hash;
  if(!(h__2198__auto____18164 == null)) {
    return h__2198__auto____18164
  }else {
    var h__2198__auto____18165 = cljs.core.hash_coll.call(null, coll);
    this__18163.__hash = h__2198__auto____18165;
    return h__2198__auto____18165
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18166 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18167 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18168 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18168.key, this__18168.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__18216 = null;
  var G__18216__2 = function(this_sym18169, k) {
    var this__18171 = this;
    var this_sym18169__18172 = this;
    var node__18173 = this_sym18169__18172;
    return node__18173.cljs$core$ILookup$_lookup$arity$2(node__18173, k)
  };
  var G__18216__3 = function(this_sym18170, k, not_found) {
    var this__18171 = this;
    var this_sym18170__18174 = this;
    var node__18175 = this_sym18170__18174;
    return node__18175.cljs$core$ILookup$_lookup$arity$3(node__18175, k, not_found)
  };
  G__18216 = function(this_sym18170, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18216__2.call(this, this_sym18170, k);
      case 3:
        return G__18216__3.call(this, this_sym18170, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18216
}();
cljs.core.BlackNode.prototype.apply = function(this_sym18161, args18162) {
  var this__18176 = this;
  return this_sym18161.call.apply(this_sym18161, [this_sym18161].concat(args18162.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18177 = this;
  return cljs.core.PersistentVector.fromArray([this__18177.key, this__18177.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18178 = this;
  return this__18178.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18179 = this;
  return this__18179.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__18180 = this;
  var node__18181 = this;
  return ins.balance_right(node__18181)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__18182 = this;
  var node__18183 = this;
  return new cljs.core.RedNode(this__18182.key, this__18182.val, this__18182.left, this__18182.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__18184 = this;
  var node__18185 = this;
  return cljs.core.balance_right_del.call(null, this__18184.key, this__18184.val, this__18184.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__18186 = this;
  var node__18187 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__18188 = this;
  var node__18189 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18189, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__18190 = this;
  var node__18191 = this;
  return cljs.core.balance_left_del.call(null, this__18190.key, this__18190.val, del, this__18190.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__18192 = this;
  var node__18193 = this;
  return ins.balance_left(node__18193)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__18194 = this;
  var node__18195 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__18195, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__18217 = null;
  var G__18217__0 = function() {
    var this__18196 = this;
    var this__18198 = this;
    return cljs.core.pr_str.call(null, this__18198)
  };
  G__18217 = function() {
    switch(arguments.length) {
      case 0:
        return G__18217__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18217
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__18199 = this;
  var node__18200 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18200, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__18201 = this;
  var node__18202 = this;
  return node__18202
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18203 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18204 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18205 = this;
  return cljs.core.list.call(null, this__18205.key, this__18205.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18206 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18207 = this;
  return this__18207.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18208 = this;
  return cljs.core.PersistentVector.fromArray([this__18208.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18209 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18209.key, this__18209.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18210 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18211 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18211.key, this__18211.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18212 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18213 = this;
  if(n === 0) {
    return this__18213.key
  }else {
    if(n === 1) {
      return this__18213.val
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
  var this__18214 = this;
  if(n === 0) {
    return this__18214.key
  }else {
    if(n === 1) {
      return this__18214.val
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
  var this__18215 = this;
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
  var this__18220 = this;
  var h__2198__auto____18221 = this__18220.__hash;
  if(!(h__2198__auto____18221 == null)) {
    return h__2198__auto____18221
  }else {
    var h__2198__auto____18222 = cljs.core.hash_coll.call(null, coll);
    this__18220.__hash = h__2198__auto____18222;
    return h__2198__auto____18222
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__18223 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__18224 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__18225 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__18225.key, this__18225.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__18273 = null;
  var G__18273__2 = function(this_sym18226, k) {
    var this__18228 = this;
    var this_sym18226__18229 = this;
    var node__18230 = this_sym18226__18229;
    return node__18230.cljs$core$ILookup$_lookup$arity$2(node__18230, k)
  };
  var G__18273__3 = function(this_sym18227, k, not_found) {
    var this__18228 = this;
    var this_sym18227__18231 = this;
    var node__18232 = this_sym18227__18231;
    return node__18232.cljs$core$ILookup$_lookup$arity$3(node__18232, k, not_found)
  };
  G__18273 = function(this_sym18227, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18273__2.call(this, this_sym18227, k);
      case 3:
        return G__18273__3.call(this, this_sym18227, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18273
}();
cljs.core.RedNode.prototype.apply = function(this_sym18218, args18219) {
  var this__18233 = this;
  return this_sym18218.call.apply(this_sym18218, [this_sym18218].concat(args18219.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__18234 = this;
  return cljs.core.PersistentVector.fromArray([this__18234.key, this__18234.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__18235 = this;
  return this__18235.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__18236 = this;
  return this__18236.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__18237 = this;
  var node__18238 = this;
  return new cljs.core.RedNode(this__18237.key, this__18237.val, this__18237.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__18239 = this;
  var node__18240 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__18241 = this;
  var node__18242 = this;
  return new cljs.core.RedNode(this__18241.key, this__18241.val, this__18241.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__18243 = this;
  var node__18244 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__18245 = this;
  var node__18246 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__18246, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__18247 = this;
  var node__18248 = this;
  return new cljs.core.RedNode(this__18247.key, this__18247.val, del, this__18247.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__18249 = this;
  var node__18250 = this;
  return new cljs.core.RedNode(this__18249.key, this__18249.val, ins, this__18249.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__18251 = this;
  var node__18252 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18251.left)) {
    return new cljs.core.RedNode(this__18251.key, this__18251.val, this__18251.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__18251.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18251.right)) {
      return new cljs.core.RedNode(this__18251.right.key, this__18251.right.val, new cljs.core.BlackNode(this__18251.key, this__18251.val, this__18251.left, this__18251.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__18251.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__18252, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__18274 = null;
  var G__18274__0 = function() {
    var this__18253 = this;
    var this__18255 = this;
    return cljs.core.pr_str.call(null, this__18255)
  };
  G__18274 = function() {
    switch(arguments.length) {
      case 0:
        return G__18274__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18274
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__18256 = this;
  var node__18257 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18256.right)) {
    return new cljs.core.RedNode(this__18256.key, this__18256.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18256.left, null), this__18256.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__18256.left)) {
      return new cljs.core.RedNode(this__18256.left.key, this__18256.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__18256.left.left, null), new cljs.core.BlackNode(this__18256.key, this__18256.val, this__18256.left.right, this__18256.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__18257, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__18258 = this;
  var node__18259 = this;
  return new cljs.core.BlackNode(this__18258.key, this__18258.val, this__18258.left, this__18258.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__18260 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__18261 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__18262 = this;
  return cljs.core.list.call(null, this__18262.key, this__18262.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__18263 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__18264 = this;
  return this__18264.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__18265 = this;
  return cljs.core.PersistentVector.fromArray([this__18265.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__18266 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__18266.key, this__18266.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18267 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__18268 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__18268.key, this__18268.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__18269 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__18270 = this;
  if(n === 0) {
    return this__18270.key
  }else {
    if(n === 1) {
      return this__18270.val
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
  var this__18271 = this;
  if(n === 0) {
    return this__18271.key
  }else {
    if(n === 1) {
      return this__18271.val
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
  var this__18272 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__18278 = comp.call(null, k, tree.key);
    if(c__18278 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__18278 < 0) {
        var ins__18279 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__18279 == null)) {
          return tree.add_left(ins__18279)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__18280 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__18280 == null)) {
            return tree.add_right(ins__18280)
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
          var app__18283 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18283)) {
            return new cljs.core.RedNode(app__18283.key, app__18283.val, new cljs.core.RedNode(left.key, left.val, left.left, app__18283.left, null), new cljs.core.RedNode(right.key, right.val, app__18283.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__18283, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__18284 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__18284)) {
              return new cljs.core.RedNode(app__18284.key, app__18284.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__18284.left, null), new cljs.core.BlackNode(right.key, right.val, app__18284.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__18284, right.right, null))
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
    var c__18290 = comp.call(null, k, tree.key);
    if(c__18290 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__18290 < 0) {
        var del__18291 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____18292 = !(del__18291 == null);
          if(or__3824__auto____18292) {
            return or__3824__auto____18292
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__18291, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__18291, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__18293 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____18294 = !(del__18293 == null);
            if(or__3824__auto____18294) {
              return or__3824__auto____18294
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__18293)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__18293, null)
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
  var tk__18297 = tree.key;
  var c__18298 = comp.call(null, k, tk__18297);
  if(c__18298 === 0) {
    return tree.replace(tk__18297, v, tree.left, tree.right)
  }else {
    if(c__18298 < 0) {
      return tree.replace(tk__18297, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__18297, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__18301 = this;
  var h__2198__auto____18302 = this__18301.__hash;
  if(!(h__2198__auto____18302 == null)) {
    return h__2198__auto____18302
  }else {
    var h__2198__auto____18303 = cljs.core.hash_imap.call(null, coll);
    this__18301.__hash = h__2198__auto____18303;
    return h__2198__auto____18303
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__18304 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__18305 = this;
  var n__18306 = coll.entry_at(k);
  if(!(n__18306 == null)) {
    return n__18306.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__18307 = this;
  var found__18308 = [null];
  var t__18309 = cljs.core.tree_map_add.call(null, this__18307.comp, this__18307.tree, k, v, found__18308);
  if(t__18309 == null) {
    var found_node__18310 = cljs.core.nth.call(null, found__18308, 0);
    if(cljs.core._EQ_.call(null, v, found_node__18310.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18307.comp, cljs.core.tree_map_replace.call(null, this__18307.comp, this__18307.tree, k, v), this__18307.cnt, this__18307.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18307.comp, t__18309.blacken(), this__18307.cnt + 1, this__18307.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__18311 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__18345 = null;
  var G__18345__2 = function(this_sym18312, k) {
    var this__18314 = this;
    var this_sym18312__18315 = this;
    var coll__18316 = this_sym18312__18315;
    return coll__18316.cljs$core$ILookup$_lookup$arity$2(coll__18316, k)
  };
  var G__18345__3 = function(this_sym18313, k, not_found) {
    var this__18314 = this;
    var this_sym18313__18317 = this;
    var coll__18318 = this_sym18313__18317;
    return coll__18318.cljs$core$ILookup$_lookup$arity$3(coll__18318, k, not_found)
  };
  G__18345 = function(this_sym18313, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18345__2.call(this, this_sym18313, k);
      case 3:
        return G__18345__3.call(this, this_sym18313, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18345
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym18299, args18300) {
  var this__18319 = this;
  return this_sym18299.call.apply(this_sym18299, [this_sym18299].concat(args18300.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__18320 = this;
  if(!(this__18320.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__18320.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__18321 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18322 = this;
  if(this__18322.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18322.tree, false, this__18322.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__18323 = this;
  var this__18324 = this;
  return cljs.core.pr_str.call(null, this__18324)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__18325 = this;
  var coll__18326 = this;
  var t__18327 = this__18325.tree;
  while(true) {
    if(!(t__18327 == null)) {
      var c__18328 = this__18325.comp.call(null, k, t__18327.key);
      if(c__18328 === 0) {
        return t__18327
      }else {
        if(c__18328 < 0) {
          var G__18346 = t__18327.left;
          t__18327 = G__18346;
          continue
        }else {
          if("\ufdd0'else") {
            var G__18347 = t__18327.right;
            t__18327 = G__18347;
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
  var this__18329 = this;
  if(this__18329.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18329.tree, ascending_QMARK_, this__18329.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18330 = this;
  if(this__18330.cnt > 0) {
    var stack__18331 = null;
    var t__18332 = this__18330.tree;
    while(true) {
      if(!(t__18332 == null)) {
        var c__18333 = this__18330.comp.call(null, k, t__18332.key);
        if(c__18333 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__18331, t__18332), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__18333 < 0) {
              var G__18348 = cljs.core.conj.call(null, stack__18331, t__18332);
              var G__18349 = t__18332.left;
              stack__18331 = G__18348;
              t__18332 = G__18349;
              continue
            }else {
              var G__18350 = stack__18331;
              var G__18351 = t__18332.right;
              stack__18331 = G__18350;
              t__18332 = G__18351;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__18333 > 0) {
                var G__18352 = cljs.core.conj.call(null, stack__18331, t__18332);
                var G__18353 = t__18332.right;
                stack__18331 = G__18352;
                t__18332 = G__18353;
                continue
              }else {
                var G__18354 = stack__18331;
                var G__18355 = t__18332.left;
                stack__18331 = G__18354;
                t__18332 = G__18355;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__18331 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__18331, ascending_QMARK_, -1, null)
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
  var this__18334 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18335 = this;
  return this__18335.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18336 = this;
  if(this__18336.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__18336.tree, true, this__18336.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18337 = this;
  return this__18337.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18338 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18339 = this;
  return new cljs.core.PersistentTreeMap(this__18339.comp, this__18339.tree, this__18339.cnt, meta, this__18339.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18340 = this;
  return this__18340.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18341 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__18341.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__18342 = this;
  var found__18343 = [null];
  var t__18344 = cljs.core.tree_map_remove.call(null, this__18342.comp, this__18342.tree, k, found__18343);
  if(t__18344 == null) {
    if(cljs.core.nth.call(null, found__18343, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__18342.comp, null, 0, this__18342.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__18342.comp, t__18344.blacken(), this__18342.cnt - 1, this__18342.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__18358 = cljs.core.seq.call(null, keyvals);
    var out__18359 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__18358) {
        var G__18360 = cljs.core.nnext.call(null, in__18358);
        var G__18361 = cljs.core.assoc_BANG_.call(null, out__18359, cljs.core.first.call(null, in__18358), cljs.core.second.call(null, in__18358));
        in__18358 = G__18360;
        out__18359 = G__18361;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__18359)
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
  hash_map.cljs$lang$applyTo = function(arglist__18362) {
    var keyvals = cljs.core.seq(arglist__18362);
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
  array_map.cljs$lang$applyTo = function(arglist__18363) {
    var keyvals = cljs.core.seq(arglist__18363);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__18367 = [];
    var obj__18368 = {};
    var kvs__18369 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__18369) {
        ks__18367.push(cljs.core.first.call(null, kvs__18369));
        obj__18368[cljs.core.first.call(null, kvs__18369)] = cljs.core.second.call(null, kvs__18369);
        var G__18370 = cljs.core.nnext.call(null, kvs__18369);
        kvs__18369 = G__18370;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__18367, obj__18368)
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
  obj_map.cljs$lang$applyTo = function(arglist__18371) {
    var keyvals = cljs.core.seq(arglist__18371);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__18374 = cljs.core.seq.call(null, keyvals);
    var out__18375 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__18374) {
        var G__18376 = cljs.core.nnext.call(null, in__18374);
        var G__18377 = cljs.core.assoc.call(null, out__18375, cljs.core.first.call(null, in__18374), cljs.core.second.call(null, in__18374));
        in__18374 = G__18376;
        out__18375 = G__18377;
        continue
      }else {
        return out__18375
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
  sorted_map.cljs$lang$applyTo = function(arglist__18378) {
    var keyvals = cljs.core.seq(arglist__18378);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__18381 = cljs.core.seq.call(null, keyvals);
    var out__18382 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__18381) {
        var G__18383 = cljs.core.nnext.call(null, in__18381);
        var G__18384 = cljs.core.assoc.call(null, out__18382, cljs.core.first.call(null, in__18381), cljs.core.second.call(null, in__18381));
        in__18381 = G__18383;
        out__18382 = G__18384;
        continue
      }else {
        return out__18382
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__18385) {
    var comparator = cljs.core.first(arglist__18385);
    var keyvals = cljs.core.rest(arglist__18385);
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
      return cljs.core.reduce.call(null, function(p1__18386_SHARP_, p2__18387_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____18389 = p1__18386_SHARP_;
          if(cljs.core.truth_(or__3824__auto____18389)) {
            return or__3824__auto____18389
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__18387_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__18390) {
    var maps = cljs.core.seq(arglist__18390);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__18398 = function(m, e) {
        var k__18396 = cljs.core.first.call(null, e);
        var v__18397 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__18396)) {
          return cljs.core.assoc.call(null, m, k__18396, f.call(null, cljs.core._lookup.call(null, m, k__18396, null), v__18397))
        }else {
          return cljs.core.assoc.call(null, m, k__18396, v__18397)
        }
      };
      var merge2__18400 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__18398, function() {
          var or__3824__auto____18399 = m1;
          if(cljs.core.truth_(or__3824__auto____18399)) {
            return or__3824__auto____18399
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__18400, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__18401) {
    var f = cljs.core.first(arglist__18401);
    var maps = cljs.core.rest(arglist__18401);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__18406 = cljs.core.ObjMap.EMPTY;
  var keys__18407 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__18407) {
      var key__18408 = cljs.core.first.call(null, keys__18407);
      var entry__18409 = cljs.core._lookup.call(null, map, key__18408, "\ufdd0'cljs.core/not-found");
      var G__18410 = cljs.core.not_EQ_.call(null, entry__18409, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__18406, key__18408, entry__18409) : ret__18406;
      var G__18411 = cljs.core.next.call(null, keys__18407);
      ret__18406 = G__18410;
      keys__18407 = G__18411;
      continue
    }else {
      return ret__18406
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
  var this__18415 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__18415.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__18416 = this;
  var h__2198__auto____18417 = this__18416.__hash;
  if(!(h__2198__auto____18417 == null)) {
    return h__2198__auto____18417
  }else {
    var h__2198__auto____18418 = cljs.core.hash_iset.call(null, coll);
    this__18416.__hash = h__2198__auto____18418;
    return h__2198__auto____18418
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18419 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18420 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18420.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__18441 = null;
  var G__18441__2 = function(this_sym18421, k) {
    var this__18423 = this;
    var this_sym18421__18424 = this;
    var coll__18425 = this_sym18421__18424;
    return coll__18425.cljs$core$ILookup$_lookup$arity$2(coll__18425, k)
  };
  var G__18441__3 = function(this_sym18422, k, not_found) {
    var this__18423 = this;
    var this_sym18422__18426 = this;
    var coll__18427 = this_sym18422__18426;
    return coll__18427.cljs$core$ILookup$_lookup$arity$3(coll__18427, k, not_found)
  };
  G__18441 = function(this_sym18422, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18441__2.call(this, this_sym18422, k);
      case 3:
        return G__18441__3.call(this, this_sym18422, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18441
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym18413, args18414) {
  var this__18428 = this;
  return this_sym18413.call.apply(this_sym18413, [this_sym18413].concat(args18414.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18429 = this;
  return new cljs.core.PersistentHashSet(this__18429.meta, cljs.core.assoc.call(null, this__18429.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__18430 = this;
  var this__18431 = this;
  return cljs.core.pr_str.call(null, this__18431)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18432 = this;
  return cljs.core.keys.call(null, this__18432.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18433 = this;
  return new cljs.core.PersistentHashSet(this__18433.meta, cljs.core.dissoc.call(null, this__18433.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18434 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18435 = this;
  var and__3822__auto____18436 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18436) {
    var and__3822__auto____18437 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18437) {
      return cljs.core.every_QMARK_.call(null, function(p1__18412_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18412_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18437
    }
  }else {
    return and__3822__auto____18436
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18438 = this;
  return new cljs.core.PersistentHashSet(meta, this__18438.hash_map, this__18438.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18439 = this;
  return this__18439.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18440 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__18440.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__18442 = cljs.core.count.call(null, items);
  var i__18443 = 0;
  var out__18444 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__18443 < len__18442) {
      var G__18445 = i__18443 + 1;
      var G__18446 = cljs.core.conj_BANG_.call(null, out__18444, items[i__18443]);
      i__18443 = G__18445;
      out__18444 = G__18446;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__18444)
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
  var G__18464 = null;
  var G__18464__2 = function(this_sym18450, k) {
    var this__18452 = this;
    var this_sym18450__18453 = this;
    var tcoll__18454 = this_sym18450__18453;
    if(cljs.core._lookup.call(null, this__18452.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__18464__3 = function(this_sym18451, k, not_found) {
    var this__18452 = this;
    var this_sym18451__18455 = this;
    var tcoll__18456 = this_sym18451__18455;
    if(cljs.core._lookup.call(null, this__18452.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__18464 = function(this_sym18451, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18464__2.call(this, this_sym18451, k);
      case 3:
        return G__18464__3.call(this, this_sym18451, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18464
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym18448, args18449) {
  var this__18457 = this;
  return this_sym18448.call.apply(this_sym18448, [this_sym18448].concat(args18449.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__18458 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__18459 = this;
  if(cljs.core._lookup.call(null, this__18459.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__18460 = this;
  return cljs.core.count.call(null, this__18460.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__18461 = this;
  this__18461.transient_map = cljs.core.dissoc_BANG_.call(null, this__18461.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__18462 = this;
  this__18462.transient_map = cljs.core.assoc_BANG_.call(null, this__18462.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__18463 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__18463.transient_map), null)
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
  var this__18467 = this;
  var h__2198__auto____18468 = this__18467.__hash;
  if(!(h__2198__auto____18468 == null)) {
    return h__2198__auto____18468
  }else {
    var h__2198__auto____18469 = cljs.core.hash_iset.call(null, coll);
    this__18467.__hash = h__2198__auto____18469;
    return h__2198__auto____18469
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__18470 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__18471 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__18471.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__18497 = null;
  var G__18497__2 = function(this_sym18472, k) {
    var this__18474 = this;
    var this_sym18472__18475 = this;
    var coll__18476 = this_sym18472__18475;
    return coll__18476.cljs$core$ILookup$_lookup$arity$2(coll__18476, k)
  };
  var G__18497__3 = function(this_sym18473, k, not_found) {
    var this__18474 = this;
    var this_sym18473__18477 = this;
    var coll__18478 = this_sym18473__18477;
    return coll__18478.cljs$core$ILookup$_lookup$arity$3(coll__18478, k, not_found)
  };
  G__18497 = function(this_sym18473, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__18497__2.call(this, this_sym18473, k);
      case 3:
        return G__18497__3.call(this, this_sym18473, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__18497
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym18465, args18466) {
  var this__18479 = this;
  return this_sym18465.call.apply(this_sym18465, [this_sym18465].concat(args18466.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__18480 = this;
  return new cljs.core.PersistentTreeSet(this__18480.meta, cljs.core.assoc.call(null, this__18480.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__18481 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__18481.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__18482 = this;
  var this__18483 = this;
  return cljs.core.pr_str.call(null, this__18483)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__18484 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__18484.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__18485 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__18485.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__18486 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__18487 = this;
  return cljs.core._comparator.call(null, this__18487.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__18488 = this;
  return cljs.core.keys.call(null, this__18488.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__18489 = this;
  return new cljs.core.PersistentTreeSet(this__18489.meta, cljs.core.dissoc.call(null, this__18489.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__18490 = this;
  return cljs.core.count.call(null, this__18490.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__18491 = this;
  var and__3822__auto____18492 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____18492) {
    var and__3822__auto____18493 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____18493) {
      return cljs.core.every_QMARK_.call(null, function(p1__18447_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__18447_SHARP_)
      }, other)
    }else {
      return and__3822__auto____18493
    }
  }else {
    return and__3822__auto____18492
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__18494 = this;
  return new cljs.core.PersistentTreeSet(meta, this__18494.tree_map, this__18494.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__18495 = this;
  return this__18495.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__18496 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__18496.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__18502__delegate = function(keys) {
      var in__18500 = cljs.core.seq.call(null, keys);
      var out__18501 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__18500)) {
          var G__18503 = cljs.core.next.call(null, in__18500);
          var G__18504 = cljs.core.conj_BANG_.call(null, out__18501, cljs.core.first.call(null, in__18500));
          in__18500 = G__18503;
          out__18501 = G__18504;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__18501)
        }
        break
      }
    };
    var G__18502 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18502__delegate.call(this, keys)
    };
    G__18502.cljs$lang$maxFixedArity = 0;
    G__18502.cljs$lang$applyTo = function(arglist__18505) {
      var keys = cljs.core.seq(arglist__18505);
      return G__18502__delegate(keys)
    };
    G__18502.cljs$lang$arity$variadic = G__18502__delegate;
    return G__18502
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
  sorted_set.cljs$lang$applyTo = function(arglist__18506) {
    var keys = cljs.core.seq(arglist__18506);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__18508) {
    var comparator = cljs.core.first(arglist__18508);
    var keys = cljs.core.rest(arglist__18508);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__18514 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____18515 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____18515)) {
        var e__18516 = temp__3971__auto____18515;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__18516))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__18514, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__18507_SHARP_) {
      var temp__3971__auto____18517 = cljs.core.find.call(null, smap, p1__18507_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____18517)) {
        var e__18518 = temp__3971__auto____18517;
        return cljs.core.second.call(null, e__18518)
      }else {
        return p1__18507_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__18548 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__18541, seen) {
        while(true) {
          var vec__18542__18543 = p__18541;
          var f__18544 = cljs.core.nth.call(null, vec__18542__18543, 0, null);
          var xs__18545 = vec__18542__18543;
          var temp__3974__auto____18546 = cljs.core.seq.call(null, xs__18545);
          if(temp__3974__auto____18546) {
            var s__18547 = temp__3974__auto____18546;
            if(cljs.core.contains_QMARK_.call(null, seen, f__18544)) {
              var G__18549 = cljs.core.rest.call(null, s__18547);
              var G__18550 = seen;
              p__18541 = G__18549;
              seen = G__18550;
              continue
            }else {
              return cljs.core.cons.call(null, f__18544, step.call(null, cljs.core.rest.call(null, s__18547), cljs.core.conj.call(null, seen, f__18544)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__18548.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__18553 = cljs.core.PersistentVector.EMPTY;
  var s__18554 = s;
  while(true) {
    if(cljs.core.next.call(null, s__18554)) {
      var G__18555 = cljs.core.conj.call(null, ret__18553, cljs.core.first.call(null, s__18554));
      var G__18556 = cljs.core.next.call(null, s__18554);
      ret__18553 = G__18555;
      s__18554 = G__18556;
      continue
    }else {
      return cljs.core.seq.call(null, ret__18553)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____18559 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____18559) {
        return or__3824__auto____18559
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__18560 = x.lastIndexOf("/");
      if(i__18560 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__18560 + 1)
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
    var or__3824__auto____18563 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____18563) {
      return or__3824__auto____18563
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__18564 = x.lastIndexOf("/");
    if(i__18564 > -1) {
      return cljs.core.subs.call(null, x, 2, i__18564)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__18571 = cljs.core.ObjMap.EMPTY;
  var ks__18572 = cljs.core.seq.call(null, keys);
  var vs__18573 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____18574 = ks__18572;
      if(and__3822__auto____18574) {
        return vs__18573
      }else {
        return and__3822__auto____18574
      }
    }()) {
      var G__18575 = cljs.core.assoc.call(null, map__18571, cljs.core.first.call(null, ks__18572), cljs.core.first.call(null, vs__18573));
      var G__18576 = cljs.core.next.call(null, ks__18572);
      var G__18577 = cljs.core.next.call(null, vs__18573);
      map__18571 = G__18575;
      ks__18572 = G__18576;
      vs__18573 = G__18577;
      continue
    }else {
      return map__18571
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
    var G__18580__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18565_SHARP_, p2__18566_SHARP_) {
        return max_key.call(null, k, p1__18565_SHARP_, p2__18566_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__18580 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18580__delegate.call(this, k, x, y, more)
    };
    G__18580.cljs$lang$maxFixedArity = 3;
    G__18580.cljs$lang$applyTo = function(arglist__18581) {
      var k = cljs.core.first(arglist__18581);
      var x = cljs.core.first(cljs.core.next(arglist__18581));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18581)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18581)));
      return G__18580__delegate(k, x, y, more)
    };
    G__18580.cljs$lang$arity$variadic = G__18580__delegate;
    return G__18580
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
    var G__18582__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__18578_SHARP_, p2__18579_SHARP_) {
        return min_key.call(null, k, p1__18578_SHARP_, p2__18579_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__18582 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18582__delegate.call(this, k, x, y, more)
    };
    G__18582.cljs$lang$maxFixedArity = 3;
    G__18582.cljs$lang$applyTo = function(arglist__18583) {
      var k = cljs.core.first(arglist__18583);
      var x = cljs.core.first(cljs.core.next(arglist__18583));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18583)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18583)));
      return G__18582__delegate(k, x, y, more)
    };
    G__18582.cljs$lang$arity$variadic = G__18582__delegate;
    return G__18582
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
      var temp__3974__auto____18586 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18586) {
        var s__18587 = temp__3974__auto____18586;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__18587), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__18587)))
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
    var temp__3974__auto____18590 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18590) {
      var s__18591 = temp__3974__auto____18590;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__18591)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__18591), take_while.call(null, pred, cljs.core.rest.call(null, s__18591)))
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
    var comp__18593 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__18593.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__18605 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____18606 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____18606)) {
        var vec__18607__18608 = temp__3974__auto____18606;
        var e__18609 = cljs.core.nth.call(null, vec__18607__18608, 0, null);
        var s__18610 = vec__18607__18608;
        if(cljs.core.truth_(include__18605.call(null, e__18609))) {
          return s__18610
        }else {
          return cljs.core.next.call(null, s__18610)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18605, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18611 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____18611)) {
      var vec__18612__18613 = temp__3974__auto____18611;
      var e__18614 = cljs.core.nth.call(null, vec__18612__18613, 0, null);
      var s__18615 = vec__18612__18613;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__18614)) ? s__18615 : cljs.core.next.call(null, s__18615))
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
    var include__18627 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____18628 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____18628)) {
        var vec__18629__18630 = temp__3974__auto____18628;
        var e__18631 = cljs.core.nth.call(null, vec__18629__18630, 0, null);
        var s__18632 = vec__18629__18630;
        if(cljs.core.truth_(include__18627.call(null, e__18631))) {
          return s__18632
        }else {
          return cljs.core.next.call(null, s__18632)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__18627, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____18633 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____18633)) {
      var vec__18634__18635 = temp__3974__auto____18633;
      var e__18636 = cljs.core.nth.call(null, vec__18634__18635, 0, null);
      var s__18637 = vec__18634__18635;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__18636)) ? s__18637 : cljs.core.next.call(null, s__18637))
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
  var this__18638 = this;
  var h__2198__auto____18639 = this__18638.__hash;
  if(!(h__2198__auto____18639 == null)) {
    return h__2198__auto____18639
  }else {
    var h__2198__auto____18640 = cljs.core.hash_coll.call(null, rng);
    this__18638.__hash = h__2198__auto____18640;
    return h__2198__auto____18640
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__18641 = this;
  if(this__18641.step > 0) {
    if(this__18641.start + this__18641.step < this__18641.end) {
      return new cljs.core.Range(this__18641.meta, this__18641.start + this__18641.step, this__18641.end, this__18641.step, null)
    }else {
      return null
    }
  }else {
    if(this__18641.start + this__18641.step > this__18641.end) {
      return new cljs.core.Range(this__18641.meta, this__18641.start + this__18641.step, this__18641.end, this__18641.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__18642 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__18643 = this;
  var this__18644 = this;
  return cljs.core.pr_str.call(null, this__18644)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__18645 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__18646 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__18647 = this;
  if(this__18647.step > 0) {
    if(this__18647.start < this__18647.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__18647.start > this__18647.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__18648 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__18648.end - this__18648.start) / this__18648.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__18649 = this;
  return this__18649.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__18650 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__18650.meta, this__18650.start + this__18650.step, this__18650.end, this__18650.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__18651 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__18652 = this;
  return new cljs.core.Range(meta, this__18652.start, this__18652.end, this__18652.step, this__18652.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__18653 = this;
  return this__18653.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__18654 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18654.start + n * this__18654.step
  }else {
    if(function() {
      var and__3822__auto____18655 = this__18654.start > this__18654.end;
      if(and__3822__auto____18655) {
        return this__18654.step === 0
      }else {
        return and__3822__auto____18655
      }
    }()) {
      return this__18654.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__18656 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__18656.start + n * this__18656.step
  }else {
    if(function() {
      var and__3822__auto____18657 = this__18656.start > this__18656.end;
      if(and__3822__auto____18657) {
        return this__18656.step === 0
      }else {
        return and__3822__auto____18657
      }
    }()) {
      return this__18656.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__18658 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__18658.meta)
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
    var temp__3974__auto____18661 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18661) {
      var s__18662 = temp__3974__auto____18661;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__18662), take_nth.call(null, n, cljs.core.drop.call(null, n, s__18662)))
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
    var temp__3974__auto____18669 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____18669) {
      var s__18670 = temp__3974__auto____18669;
      var fst__18671 = cljs.core.first.call(null, s__18670);
      var fv__18672 = f.call(null, fst__18671);
      var run__18673 = cljs.core.cons.call(null, fst__18671, cljs.core.take_while.call(null, function(p1__18663_SHARP_) {
        return cljs.core._EQ_.call(null, fv__18672, f.call(null, p1__18663_SHARP_))
      }, cljs.core.next.call(null, s__18670)));
      return cljs.core.cons.call(null, run__18673, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__18673), s__18670))))
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
      var temp__3971__auto____18688 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____18688) {
        var s__18689 = temp__3971__auto____18688;
        return reductions.call(null, f, cljs.core.first.call(null, s__18689), cljs.core.rest.call(null, s__18689))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____18690 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____18690) {
        var s__18691 = temp__3974__auto____18690;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__18691)), cljs.core.rest.call(null, s__18691))
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
      var G__18694 = null;
      var G__18694__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__18694__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__18694__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__18694__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__18694__4 = function() {
        var G__18695__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__18695 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18695__delegate.call(this, x, y, z, args)
        };
        G__18695.cljs$lang$maxFixedArity = 3;
        G__18695.cljs$lang$applyTo = function(arglist__18696) {
          var x = cljs.core.first(arglist__18696);
          var y = cljs.core.first(cljs.core.next(arglist__18696));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18696)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18696)));
          return G__18695__delegate(x, y, z, args)
        };
        G__18695.cljs$lang$arity$variadic = G__18695__delegate;
        return G__18695
      }();
      G__18694 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18694__0.call(this);
          case 1:
            return G__18694__1.call(this, x);
          case 2:
            return G__18694__2.call(this, x, y);
          case 3:
            return G__18694__3.call(this, x, y, z);
          default:
            return G__18694__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18694.cljs$lang$maxFixedArity = 3;
      G__18694.cljs$lang$applyTo = G__18694__4.cljs$lang$applyTo;
      return G__18694
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__18697 = null;
      var G__18697__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__18697__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__18697__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__18697__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__18697__4 = function() {
        var G__18698__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__18698 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18698__delegate.call(this, x, y, z, args)
        };
        G__18698.cljs$lang$maxFixedArity = 3;
        G__18698.cljs$lang$applyTo = function(arglist__18699) {
          var x = cljs.core.first(arglist__18699);
          var y = cljs.core.first(cljs.core.next(arglist__18699));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18699)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18699)));
          return G__18698__delegate(x, y, z, args)
        };
        G__18698.cljs$lang$arity$variadic = G__18698__delegate;
        return G__18698
      }();
      G__18697 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18697__0.call(this);
          case 1:
            return G__18697__1.call(this, x);
          case 2:
            return G__18697__2.call(this, x, y);
          case 3:
            return G__18697__3.call(this, x, y, z);
          default:
            return G__18697__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18697.cljs$lang$maxFixedArity = 3;
      G__18697.cljs$lang$applyTo = G__18697__4.cljs$lang$applyTo;
      return G__18697
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__18700 = null;
      var G__18700__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__18700__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__18700__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__18700__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__18700__4 = function() {
        var G__18701__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__18701 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__18701__delegate.call(this, x, y, z, args)
        };
        G__18701.cljs$lang$maxFixedArity = 3;
        G__18701.cljs$lang$applyTo = function(arglist__18702) {
          var x = cljs.core.first(arglist__18702);
          var y = cljs.core.first(cljs.core.next(arglist__18702));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18702)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18702)));
          return G__18701__delegate(x, y, z, args)
        };
        G__18701.cljs$lang$arity$variadic = G__18701__delegate;
        return G__18701
      }();
      G__18700 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__18700__0.call(this);
          case 1:
            return G__18700__1.call(this, x);
          case 2:
            return G__18700__2.call(this, x, y);
          case 3:
            return G__18700__3.call(this, x, y, z);
          default:
            return G__18700__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__18700.cljs$lang$maxFixedArity = 3;
      G__18700.cljs$lang$applyTo = G__18700__4.cljs$lang$applyTo;
      return G__18700
    }()
  };
  var juxt__4 = function() {
    var G__18703__delegate = function(f, g, h, fs) {
      var fs__18693 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__18704 = null;
        var G__18704__0 = function() {
          return cljs.core.reduce.call(null, function(p1__18674_SHARP_, p2__18675_SHARP_) {
            return cljs.core.conj.call(null, p1__18674_SHARP_, p2__18675_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__18693)
        };
        var G__18704__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__18676_SHARP_, p2__18677_SHARP_) {
            return cljs.core.conj.call(null, p1__18676_SHARP_, p2__18677_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__18693)
        };
        var G__18704__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__18678_SHARP_, p2__18679_SHARP_) {
            return cljs.core.conj.call(null, p1__18678_SHARP_, p2__18679_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__18693)
        };
        var G__18704__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__18680_SHARP_, p2__18681_SHARP_) {
            return cljs.core.conj.call(null, p1__18680_SHARP_, p2__18681_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__18693)
        };
        var G__18704__4 = function() {
          var G__18705__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__18682_SHARP_, p2__18683_SHARP_) {
              return cljs.core.conj.call(null, p1__18682_SHARP_, cljs.core.apply.call(null, p2__18683_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__18693)
          };
          var G__18705 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__18705__delegate.call(this, x, y, z, args)
          };
          G__18705.cljs$lang$maxFixedArity = 3;
          G__18705.cljs$lang$applyTo = function(arglist__18706) {
            var x = cljs.core.first(arglist__18706);
            var y = cljs.core.first(cljs.core.next(arglist__18706));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18706)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18706)));
            return G__18705__delegate(x, y, z, args)
          };
          G__18705.cljs$lang$arity$variadic = G__18705__delegate;
          return G__18705
        }();
        G__18704 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__18704__0.call(this);
            case 1:
              return G__18704__1.call(this, x);
            case 2:
              return G__18704__2.call(this, x, y);
            case 3:
              return G__18704__3.call(this, x, y, z);
            default:
              return G__18704__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__18704.cljs$lang$maxFixedArity = 3;
        G__18704.cljs$lang$applyTo = G__18704__4.cljs$lang$applyTo;
        return G__18704
      }()
    };
    var G__18703 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__18703__delegate.call(this, f, g, h, fs)
    };
    G__18703.cljs$lang$maxFixedArity = 3;
    G__18703.cljs$lang$applyTo = function(arglist__18707) {
      var f = cljs.core.first(arglist__18707);
      var g = cljs.core.first(cljs.core.next(arglist__18707));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18707)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__18707)));
      return G__18703__delegate(f, g, h, fs)
    };
    G__18703.cljs$lang$arity$variadic = G__18703__delegate;
    return G__18703
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
        var G__18710 = cljs.core.next.call(null, coll);
        coll = G__18710;
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
        var and__3822__auto____18709 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____18709) {
          return n > 0
        }else {
          return and__3822__auto____18709
        }
      }())) {
        var G__18711 = n - 1;
        var G__18712 = cljs.core.next.call(null, coll);
        n = G__18711;
        coll = G__18712;
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
  var matches__18714 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__18714), s)) {
    if(cljs.core.count.call(null, matches__18714) === 1) {
      return cljs.core.first.call(null, matches__18714)
    }else {
      return cljs.core.vec.call(null, matches__18714)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__18716 = re.exec(s);
  if(matches__18716 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__18716) === 1) {
      return cljs.core.first.call(null, matches__18716)
    }else {
      return cljs.core.vec.call(null, matches__18716)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__18721 = cljs.core.re_find.call(null, re, s);
  var match_idx__18722 = s.search(re);
  var match_str__18723 = cljs.core.coll_QMARK_.call(null, match_data__18721) ? cljs.core.first.call(null, match_data__18721) : match_data__18721;
  var post_match__18724 = cljs.core.subs.call(null, s, match_idx__18722 + cljs.core.count.call(null, match_str__18723));
  if(cljs.core.truth_(match_data__18721)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__18721, re_seq.call(null, re, post_match__18724))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__18731__18732 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___18733 = cljs.core.nth.call(null, vec__18731__18732, 0, null);
  var flags__18734 = cljs.core.nth.call(null, vec__18731__18732, 1, null);
  var pattern__18735 = cljs.core.nth.call(null, vec__18731__18732, 2, null);
  return new RegExp(pattern__18735, flags__18734)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__18725_SHARP_) {
    return print_one.call(null, p1__18725_SHARP_, opts)
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
          var and__3822__auto____18745 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____18745)) {
            var and__3822__auto____18749 = function() {
              var G__18746__18747 = obj;
              if(G__18746__18747) {
                if(function() {
                  var or__3824__auto____18748 = G__18746__18747.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____18748) {
                    return or__3824__auto____18748
                  }else {
                    return G__18746__18747.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__18746__18747.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18746__18747)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__18746__18747)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____18749)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____18749
            }
          }else {
            return and__3822__auto____18745
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____18750 = !(obj == null);
          if(and__3822__auto____18750) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____18750
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__18751__18752 = obj;
          if(G__18751__18752) {
            if(function() {
              var or__3824__auto____18753 = G__18751__18752.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____18753) {
                return or__3824__auto____18753
              }else {
                return G__18751__18752.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__18751__18752.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18751__18752)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__18751__18752)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__18773 = new goog.string.StringBuffer;
  var G__18774__18775 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18774__18775) {
    var string__18776 = cljs.core.first.call(null, G__18774__18775);
    var G__18774__18777 = G__18774__18775;
    while(true) {
      sb__18773.append(string__18776);
      var temp__3974__auto____18778 = cljs.core.next.call(null, G__18774__18777);
      if(temp__3974__auto____18778) {
        var G__18774__18779 = temp__3974__auto____18778;
        var G__18792 = cljs.core.first.call(null, G__18774__18779);
        var G__18793 = G__18774__18779;
        string__18776 = G__18792;
        G__18774__18777 = G__18793;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18780__18781 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18780__18781) {
    var obj__18782 = cljs.core.first.call(null, G__18780__18781);
    var G__18780__18783 = G__18780__18781;
    while(true) {
      sb__18773.append(" ");
      var G__18784__18785 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18782, opts));
      if(G__18784__18785) {
        var string__18786 = cljs.core.first.call(null, G__18784__18785);
        var G__18784__18787 = G__18784__18785;
        while(true) {
          sb__18773.append(string__18786);
          var temp__3974__auto____18788 = cljs.core.next.call(null, G__18784__18787);
          if(temp__3974__auto____18788) {
            var G__18784__18789 = temp__3974__auto____18788;
            var G__18794 = cljs.core.first.call(null, G__18784__18789);
            var G__18795 = G__18784__18789;
            string__18786 = G__18794;
            G__18784__18787 = G__18795;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18790 = cljs.core.next.call(null, G__18780__18783);
      if(temp__3974__auto____18790) {
        var G__18780__18791 = temp__3974__auto____18790;
        var G__18796 = cljs.core.first.call(null, G__18780__18791);
        var G__18797 = G__18780__18791;
        obj__18782 = G__18796;
        G__18780__18783 = G__18797;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__18773
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__18799 = cljs.core.pr_sb.call(null, objs, opts);
  sb__18799.append("\n");
  return[cljs.core.str(sb__18799)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__18818__18819 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__18818__18819) {
    var string__18820 = cljs.core.first.call(null, G__18818__18819);
    var G__18818__18821 = G__18818__18819;
    while(true) {
      cljs.core.string_print.call(null, string__18820);
      var temp__3974__auto____18822 = cljs.core.next.call(null, G__18818__18821);
      if(temp__3974__auto____18822) {
        var G__18818__18823 = temp__3974__auto____18822;
        var G__18836 = cljs.core.first.call(null, G__18818__18823);
        var G__18837 = G__18818__18823;
        string__18820 = G__18836;
        G__18818__18821 = G__18837;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__18824__18825 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__18824__18825) {
    var obj__18826 = cljs.core.first.call(null, G__18824__18825);
    var G__18824__18827 = G__18824__18825;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__18828__18829 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__18826, opts));
      if(G__18828__18829) {
        var string__18830 = cljs.core.first.call(null, G__18828__18829);
        var G__18828__18831 = G__18828__18829;
        while(true) {
          cljs.core.string_print.call(null, string__18830);
          var temp__3974__auto____18832 = cljs.core.next.call(null, G__18828__18831);
          if(temp__3974__auto____18832) {
            var G__18828__18833 = temp__3974__auto____18832;
            var G__18838 = cljs.core.first.call(null, G__18828__18833);
            var G__18839 = G__18828__18833;
            string__18830 = G__18838;
            G__18828__18831 = G__18839;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____18834 = cljs.core.next.call(null, G__18824__18827);
      if(temp__3974__auto____18834) {
        var G__18824__18835 = temp__3974__auto____18834;
        var G__18840 = cljs.core.first.call(null, G__18824__18835);
        var G__18841 = G__18824__18835;
        obj__18826 = G__18840;
        G__18824__18827 = G__18841;
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
  pr_str.cljs$lang$applyTo = function(arglist__18842) {
    var objs = cljs.core.seq(arglist__18842);
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
  prn_str.cljs$lang$applyTo = function(arglist__18843) {
    var objs = cljs.core.seq(arglist__18843);
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
  pr.cljs$lang$applyTo = function(arglist__18844) {
    var objs = cljs.core.seq(arglist__18844);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__18845) {
    var objs = cljs.core.seq(arglist__18845);
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
  print_str.cljs$lang$applyTo = function(arglist__18846) {
    var objs = cljs.core.seq(arglist__18846);
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
  println.cljs$lang$applyTo = function(arglist__18847) {
    var objs = cljs.core.seq(arglist__18847);
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
  println_str.cljs$lang$applyTo = function(arglist__18848) {
    var objs = cljs.core.seq(arglist__18848);
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
  prn.cljs$lang$applyTo = function(arglist__18849) {
    var objs = cljs.core.seq(arglist__18849);
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
  printf.cljs$lang$applyTo = function(arglist__18850) {
    var fmt = cljs.core.first(arglist__18850);
    var args = cljs.core.rest(arglist__18850);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18851 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18851, "{", ", ", "}", opts, coll)
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
  var pr_pair__18852 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18852, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__18853 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18853, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____18854 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____18854)) {
        var nspc__18855 = temp__3974__auto____18854;
        return[cljs.core.str(nspc__18855), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____18856 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____18856)) {
          var nspc__18857 = temp__3974__auto____18856;
          return[cljs.core.str(nspc__18857), cljs.core.str("/")].join("")
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
  var pr_pair__18858 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18858, "{", ", ", "}", opts, coll)
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
  var normalize__18860 = function(n, len) {
    var ns__18859 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__18859) < len) {
        var G__18862 = [cljs.core.str("0"), cljs.core.str(ns__18859)].join("");
        ns__18859 = G__18862;
        continue
      }else {
        return ns__18859
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__18860.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__18860.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__18860.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18860.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__18860.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__18860.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__18861 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__18861, "{", ", ", "}", opts, coll)
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
  var this__18863 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__18864 = this;
  var G__18865__18866 = cljs.core.seq.call(null, this__18864.watches);
  if(G__18865__18866) {
    var G__18868__18870 = cljs.core.first.call(null, G__18865__18866);
    var vec__18869__18871 = G__18868__18870;
    var key__18872 = cljs.core.nth.call(null, vec__18869__18871, 0, null);
    var f__18873 = cljs.core.nth.call(null, vec__18869__18871, 1, null);
    var G__18865__18874 = G__18865__18866;
    var G__18868__18875 = G__18868__18870;
    var G__18865__18876 = G__18865__18874;
    while(true) {
      var vec__18877__18878 = G__18868__18875;
      var key__18879 = cljs.core.nth.call(null, vec__18877__18878, 0, null);
      var f__18880 = cljs.core.nth.call(null, vec__18877__18878, 1, null);
      var G__18865__18881 = G__18865__18876;
      f__18880.call(null, key__18879, this$, oldval, newval);
      var temp__3974__auto____18882 = cljs.core.next.call(null, G__18865__18881);
      if(temp__3974__auto____18882) {
        var G__18865__18883 = temp__3974__auto____18882;
        var G__18890 = cljs.core.first.call(null, G__18865__18883);
        var G__18891 = G__18865__18883;
        G__18868__18875 = G__18890;
        G__18865__18876 = G__18891;
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
  var this__18884 = this;
  return this$.watches = cljs.core.assoc.call(null, this__18884.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__18885 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__18885.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__18886 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__18886.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__18887 = this;
  return this__18887.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18888 = this;
  return this__18888.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__18889 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__18903__delegate = function(x, p__18892) {
      var map__18898__18899 = p__18892;
      var map__18898__18900 = cljs.core.seq_QMARK_.call(null, map__18898__18899) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18898__18899) : map__18898__18899;
      var validator__18901 = cljs.core._lookup.call(null, map__18898__18900, "\ufdd0'validator", null);
      var meta__18902 = cljs.core._lookup.call(null, map__18898__18900, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__18902, validator__18901, null)
    };
    var G__18903 = function(x, var_args) {
      var p__18892 = null;
      if(goog.isDef(var_args)) {
        p__18892 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18903__delegate.call(this, x, p__18892)
    };
    G__18903.cljs$lang$maxFixedArity = 1;
    G__18903.cljs$lang$applyTo = function(arglist__18904) {
      var x = cljs.core.first(arglist__18904);
      var p__18892 = cljs.core.rest(arglist__18904);
      return G__18903__delegate(x, p__18892)
    };
    G__18903.cljs$lang$arity$variadic = G__18903__delegate;
    return G__18903
  }();
  atom = function(x, var_args) {
    var p__18892 = var_args;
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
  var temp__3974__auto____18908 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____18908)) {
    var validate__18909 = temp__3974__auto____18908;
    if(cljs.core.truth_(validate__18909.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__18910 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__18910, new_value);
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
    var G__18911__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__18911 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__18911__delegate.call(this, a, f, x, y, z, more)
    };
    G__18911.cljs$lang$maxFixedArity = 5;
    G__18911.cljs$lang$applyTo = function(arglist__18912) {
      var a = cljs.core.first(arglist__18912);
      var f = cljs.core.first(cljs.core.next(arglist__18912));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__18912)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18912))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18912)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__18912)))));
      return G__18911__delegate(a, f, x, y, z, more)
    };
    G__18911.cljs$lang$arity$variadic = G__18911__delegate;
    return G__18911
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__18913) {
    var iref = cljs.core.first(arglist__18913);
    var f = cljs.core.first(cljs.core.next(arglist__18913));
    var args = cljs.core.rest(cljs.core.next(arglist__18913));
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
  var this__18914 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__18914.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__18915 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__18915.state, function(p__18916) {
    var map__18917__18918 = p__18916;
    var map__18917__18919 = cljs.core.seq_QMARK_.call(null, map__18917__18918) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18917__18918) : map__18917__18918;
    var curr_state__18920 = map__18917__18919;
    var done__18921 = cljs.core._lookup.call(null, map__18917__18919, "\ufdd0'done", null);
    if(cljs.core.truth_(done__18921)) {
      return curr_state__18920
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__18915.f.call(null)})
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
    var map__18942__18943 = options;
    var map__18942__18944 = cljs.core.seq_QMARK_.call(null, map__18942__18943) ? cljs.core.apply.call(null, cljs.core.hash_map, map__18942__18943) : map__18942__18943;
    var keywordize_keys__18945 = cljs.core._lookup.call(null, map__18942__18944, "\ufdd0'keywordize-keys", null);
    var keyfn__18946 = cljs.core.truth_(keywordize_keys__18945) ? cljs.core.keyword : cljs.core.str;
    var f__18961 = function thisfn(x) {
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
                var iter__2468__auto____18960 = function iter__18954(s__18955) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__18955__18958 = s__18955;
                    while(true) {
                      if(cljs.core.seq.call(null, s__18955__18958)) {
                        var k__18959 = cljs.core.first.call(null, s__18955__18958);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__18946.call(null, k__18959), thisfn.call(null, x[k__18959])], true), iter__18954.call(null, cljs.core.rest.call(null, s__18955__18958)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2468__auto____18960.call(null, cljs.core.js_keys.call(null, x))
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
    return f__18961.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__18962) {
    var x = cljs.core.first(arglist__18962);
    var options = cljs.core.rest(arglist__18962);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__18967 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__18971__delegate = function(args) {
      var temp__3971__auto____18968 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__18967), args, null);
      if(cljs.core.truth_(temp__3971__auto____18968)) {
        var v__18969 = temp__3971__auto____18968;
        return v__18969
      }else {
        var ret__18970 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__18967, cljs.core.assoc, args, ret__18970);
        return ret__18970
      }
    };
    var G__18971 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__18971__delegate.call(this, args)
    };
    G__18971.cljs$lang$maxFixedArity = 0;
    G__18971.cljs$lang$applyTo = function(arglist__18972) {
      var args = cljs.core.seq(arglist__18972);
      return G__18971__delegate(args)
    };
    G__18971.cljs$lang$arity$variadic = G__18971__delegate;
    return G__18971
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__18974 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__18974)) {
        var G__18975 = ret__18974;
        f = G__18975;
        continue
      }else {
        return ret__18974
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__18976__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__18976 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__18976__delegate.call(this, f, args)
    };
    G__18976.cljs$lang$maxFixedArity = 1;
    G__18976.cljs$lang$applyTo = function(arglist__18977) {
      var f = cljs.core.first(arglist__18977);
      var args = cljs.core.rest(arglist__18977);
      return G__18976__delegate(f, args)
    };
    G__18976.cljs$lang$arity$variadic = G__18976__delegate;
    return G__18976
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
    var k__18979 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__18979, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__18979, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____18988 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____18988) {
      return or__3824__auto____18988
    }else {
      var or__3824__auto____18989 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____18989) {
        return or__3824__auto____18989
      }else {
        var and__3822__auto____18990 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____18990) {
          var and__3822__auto____18991 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____18991) {
            var and__3822__auto____18992 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____18992) {
              var ret__18993 = true;
              var i__18994 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____18995 = cljs.core.not.call(null, ret__18993);
                  if(or__3824__auto____18995) {
                    return or__3824__auto____18995
                  }else {
                    return i__18994 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__18993
                }else {
                  var G__18996 = isa_QMARK_.call(null, h, child.call(null, i__18994), parent.call(null, i__18994));
                  var G__18997 = i__18994 + 1;
                  ret__18993 = G__18996;
                  i__18994 = G__18997;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____18992
            }
          }else {
            return and__3822__auto____18991
          }
        }else {
          return and__3822__auto____18990
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
    var tp__19006 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__19007 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__19008 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__19009 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____19010 = cljs.core.contains_QMARK_.call(null, tp__19006.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__19008.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__19008.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__19006, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__19009.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__19007, parent, ta__19008), "\ufdd0'descendants":tf__19009.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__19008, tag, td__19007)})
    }();
    if(cljs.core.truth_(or__3824__auto____19010)) {
      return or__3824__auto____19010
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
    var parentMap__19015 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__19016 = cljs.core.truth_(parentMap__19015.call(null, tag)) ? cljs.core.disj.call(null, parentMap__19015.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__19017 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__19016)) ? cljs.core.assoc.call(null, parentMap__19015, tag, childsParents__19016) : cljs.core.dissoc.call(null, parentMap__19015, tag);
    var deriv_seq__19018 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__18998_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__18998_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__18998_SHARP_), cljs.core.second.call(null, p1__18998_SHARP_)))
    }, cljs.core.seq.call(null, newParents__19017)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__19015.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__18999_SHARP_, p2__19000_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__18999_SHARP_, p2__19000_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__19018))
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
  var xprefs__19026 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____19028 = cljs.core.truth_(function() {
    var and__3822__auto____19027 = xprefs__19026;
    if(cljs.core.truth_(and__3822__auto____19027)) {
      return xprefs__19026.call(null, y)
    }else {
      return and__3822__auto____19027
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____19028)) {
    return or__3824__auto____19028
  }else {
    var or__3824__auto____19030 = function() {
      var ps__19029 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__19029) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__19029), prefer_table))) {
          }else {
          }
          var G__19033 = cljs.core.rest.call(null, ps__19029);
          ps__19029 = G__19033;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____19030)) {
      return or__3824__auto____19030
    }else {
      var or__3824__auto____19032 = function() {
        var ps__19031 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__19031) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__19031), y, prefer_table))) {
            }else {
            }
            var G__19034 = cljs.core.rest.call(null, ps__19031);
            ps__19031 = G__19034;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____19032)) {
        return or__3824__auto____19032
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____19036 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____19036)) {
    return or__3824__auto____19036
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__19054 = cljs.core.reduce.call(null, function(be, p__19046) {
    var vec__19047__19048 = p__19046;
    var k__19049 = cljs.core.nth.call(null, vec__19047__19048, 0, null);
    var ___19050 = cljs.core.nth.call(null, vec__19047__19048, 1, null);
    var e__19051 = vec__19047__19048;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__19049)) {
      var be2__19053 = cljs.core.truth_(function() {
        var or__3824__auto____19052 = be == null;
        if(or__3824__auto____19052) {
          return or__3824__auto____19052
        }else {
          return cljs.core.dominates.call(null, k__19049, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__19051 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__19053), k__19049, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__19049), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__19053)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__19053
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__19054)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__19054));
      return cljs.core.second.call(null, best_entry__19054)
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
    var and__3822__auto____19059 = mf;
    if(and__3822__auto____19059) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____19059
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2369__auto____19060 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19061 = cljs.core._reset[goog.typeOf(x__2369__auto____19060)];
      if(or__3824__auto____19061) {
        return or__3824__auto____19061
      }else {
        var or__3824__auto____19062 = cljs.core._reset["_"];
        if(or__3824__auto____19062) {
          return or__3824__auto____19062
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____19067 = mf;
    if(and__3822__auto____19067) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____19067
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2369__auto____19068 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19069 = cljs.core._add_method[goog.typeOf(x__2369__auto____19068)];
      if(or__3824__auto____19069) {
        return or__3824__auto____19069
      }else {
        var or__3824__auto____19070 = cljs.core._add_method["_"];
        if(or__3824__auto____19070) {
          return or__3824__auto____19070
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19075 = mf;
    if(and__3822__auto____19075) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____19075
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2369__auto____19076 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19077 = cljs.core._remove_method[goog.typeOf(x__2369__auto____19076)];
      if(or__3824__auto____19077) {
        return or__3824__auto____19077
      }else {
        var or__3824__auto____19078 = cljs.core._remove_method["_"];
        if(or__3824__auto____19078) {
          return or__3824__auto____19078
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____19083 = mf;
    if(and__3822__auto____19083) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____19083
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2369__auto____19084 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19085 = cljs.core._prefer_method[goog.typeOf(x__2369__auto____19084)];
      if(or__3824__auto____19085) {
        return or__3824__auto____19085
      }else {
        var or__3824__auto____19086 = cljs.core._prefer_method["_"];
        if(or__3824__auto____19086) {
          return or__3824__auto____19086
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____19091 = mf;
    if(and__3822__auto____19091) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____19091
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2369__auto____19092 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19093 = cljs.core._get_method[goog.typeOf(x__2369__auto____19092)];
      if(or__3824__auto____19093) {
        return or__3824__auto____19093
      }else {
        var or__3824__auto____19094 = cljs.core._get_method["_"];
        if(or__3824__auto____19094) {
          return or__3824__auto____19094
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____19099 = mf;
    if(and__3822__auto____19099) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____19099
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2369__auto____19100 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19101 = cljs.core._methods[goog.typeOf(x__2369__auto____19100)];
      if(or__3824__auto____19101) {
        return or__3824__auto____19101
      }else {
        var or__3824__auto____19102 = cljs.core._methods["_"];
        if(or__3824__auto____19102) {
          return or__3824__auto____19102
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____19107 = mf;
    if(and__3822__auto____19107) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____19107
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2369__auto____19108 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19109 = cljs.core._prefers[goog.typeOf(x__2369__auto____19108)];
      if(or__3824__auto____19109) {
        return or__3824__auto____19109
      }else {
        var or__3824__auto____19110 = cljs.core._prefers["_"];
        if(or__3824__auto____19110) {
          return or__3824__auto____19110
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____19115 = mf;
    if(and__3822__auto____19115) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____19115
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2369__auto____19116 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____19117 = cljs.core._dispatch[goog.typeOf(x__2369__auto____19116)];
      if(or__3824__auto____19117) {
        return or__3824__auto____19117
      }else {
        var or__3824__auto____19118 = cljs.core._dispatch["_"];
        if(or__3824__auto____19118) {
          return or__3824__auto____19118
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__19121 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__19122 = cljs.core._get_method.call(null, mf, dispatch_val__19121);
  if(cljs.core.truth_(target_fn__19122)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__19121)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__19122, args)
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
  var this__19123 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__19124 = this;
  cljs.core.swap_BANG_.call(null, this__19124.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19124.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19124.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__19124.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__19125 = this;
  cljs.core.swap_BANG_.call(null, this__19125.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__19125.method_cache, this__19125.method_table, this__19125.cached_hierarchy, this__19125.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__19126 = this;
  cljs.core.swap_BANG_.call(null, this__19126.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__19126.method_cache, this__19126.method_table, this__19126.cached_hierarchy, this__19126.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__19127 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__19127.cached_hierarchy), cljs.core.deref.call(null, this__19127.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__19127.method_cache, this__19127.method_table, this__19127.cached_hierarchy, this__19127.hierarchy)
  }
  var temp__3971__auto____19128 = cljs.core.deref.call(null, this__19127.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____19128)) {
    var target_fn__19129 = temp__3971__auto____19128;
    return target_fn__19129
  }else {
    var temp__3971__auto____19130 = cljs.core.find_and_cache_best_method.call(null, this__19127.name, dispatch_val, this__19127.hierarchy, this__19127.method_table, this__19127.prefer_table, this__19127.method_cache, this__19127.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____19130)) {
      var target_fn__19131 = temp__3971__auto____19130;
      return target_fn__19131
    }else {
      return cljs.core.deref.call(null, this__19127.method_table).call(null, this__19127.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__19132 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__19132.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__19132.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__19132.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__19132.method_cache, this__19132.method_table, this__19132.cached_hierarchy, this__19132.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__19133 = this;
  return cljs.core.deref.call(null, this__19133.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__19134 = this;
  return cljs.core.deref.call(null, this__19134.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__19135 = this;
  return cljs.core.do_dispatch.call(null, mf, this__19135.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__19137__delegate = function(_, args) {
    var self__19136 = this;
    return cljs.core._dispatch.call(null, self__19136, args)
  };
  var G__19137 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__19137__delegate.call(this, _, args)
  };
  G__19137.cljs$lang$maxFixedArity = 1;
  G__19137.cljs$lang$applyTo = function(arglist__19138) {
    var _ = cljs.core.first(arglist__19138);
    var args = cljs.core.rest(arglist__19138);
    return G__19137__delegate(_, args)
  };
  G__19137.cljs$lang$arity$variadic = G__19137__delegate;
  return G__19137
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__19139 = this;
  return cljs.core._dispatch.call(null, self__19139, args)
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
  var this__19140 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_19142, _) {
  var this__19141 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__19141.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__19143 = this;
  var and__3822__auto____19144 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____19144) {
    return this__19143.uuid === other.uuid
  }else {
    return and__3822__auto____19144
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__19145 = this;
  var this__19146 = this;
  return cljs.core.pr_str.call(null, this__19146)
};
cljs.core.UUID;
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
      var s__19782 = s;
      var limit__19783 = limit;
      var parts__19784 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__19783, 1)) {
          return cljs.core.conj.call(null, parts__19784, s__19782)
        }else {
          var temp__3971__auto____19785 = cljs.core.re_find.call(null, re, s__19782);
          if(cljs.core.truth_(temp__3971__auto____19785)) {
            var m__19786 = temp__3971__auto____19785;
            var index__19787 = s__19782.indexOf(m__19786);
            var G__19788 = s__19782.substring(index__19787 + cljs.core.count.call(null, m__19786));
            var G__19789 = limit__19783 - 1;
            var G__19790 = cljs.core.conj.call(null, parts__19784, s__19782.substring(0, index__19787));
            s__19782 = G__19788;
            limit__19783 = G__19789;
            parts__19784 = G__19790;
            continue
          }else {
            return cljs.core.conj.call(null, parts__19784, s__19782)
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
  var index__19794 = s.length;
  while(true) {
    if(index__19794 === 0) {
      return""
    }else {
      var ch__19795 = cljs.core._lookup.call(null, s, index__19794 - 1, null);
      if(function() {
        var or__3824__auto____19796 = cljs.core._EQ_.call(null, ch__19795, "\n");
        if(or__3824__auto____19796) {
          return or__3824__auto____19796
        }else {
          return cljs.core._EQ_.call(null, ch__19795, "\r")
        }
      }()) {
        var G__19797 = index__19794 - 1;
        index__19794 = G__19797;
        continue
      }else {
        return s.substring(0, index__19794)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__19801 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____19802 = cljs.core.not.call(null, s__19801);
    if(or__3824__auto____19802) {
      return or__3824__auto____19802
    }else {
      var or__3824__auto____19803 = cljs.core._EQ_.call(null, "", s__19801);
      if(or__3824__auto____19803) {
        return or__3824__auto____19803
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__19801)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__19810 = new goog.string.StringBuffer;
  var length__19811 = s.length;
  var index__19812 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__19811, index__19812)) {
      return buffer__19810.toString()
    }else {
      var ch__19813 = s.charAt(index__19812);
      var temp__3971__auto____19814 = cljs.core._lookup.call(null, cmap, ch__19813, null);
      if(cljs.core.truth_(temp__3971__auto____19814)) {
        var replacement__19815 = temp__3971__auto____19814;
        buffer__19810.append([cljs.core.str(replacement__19815)].join(""))
      }else {
        buffer__19810.append(ch__19813)
      }
      var G__19816 = index__19812 + 1;
      index__19812 = G__19816;
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
      var or__3824__auto____19818 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____19818) {
        return or__3824__auto____19818
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
    var G__19819__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__19820 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__19821 = cljs.core.next.call(null, more);
            s = G__19820;
            more = G__19821;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__19819 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__19819__delegate.call(this, x, xs)
    };
    G__19819.cljs$lang$maxFixedArity = 1;
    G__19819.cljs$lang$applyTo = function(arglist__19822) {
      var x = cljs.core.first(arglist__19822);
      var xs = cljs.core.rest(arglist__19822);
      return G__19819__delegate(x, xs)
    };
    G__19819.cljs$lang$arity$variadic = G__19819__delegate;
    return G__19819
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
    var iter__2468__auto____19848 = function iter__19836(s__19837) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__19837__19843 = s__19837;
        while(true) {
          if(cljs.core.seq.call(null, s__19837__19843)) {
            var vec__19844__19845 = cljs.core.first.call(null, s__19837__19843);
            var k__19846 = cljs.core.nth.call(null, vec__19844__19845, 0, null);
            var v__19847 = cljs.core.nth.call(null, vec__19844__19845, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__19846)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__19847))].join(""), iter__19836.call(null, cljs.core.rest.call(null, s__19837__19843)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2468__auto____19848.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__19851 = cljs.core.last.call(null, args);
    var args__19852 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__19852)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__19851) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__19851))].join("") : params__19851)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__19853) {
    var args = cljs.core.seq(arglist__19853);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max__19696 = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max__19696, cljs.core.remove.call(null, function(p1__19694_SHARP_) {
    return max__19696 === p1__19694_SHARP_
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
    var G__19700__delegate = function(s1, s2, sets) {
      var bubbled_sets__19699 = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets__19699), cljs.core.rest.call(null, bubbled_sets__19699))
    };
    var G__19700 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__19700__delegate.call(this, s1, s2, sets)
    };
    G__19700.cljs$lang$maxFixedArity = 2;
    G__19700.cljs$lang$applyTo = function(arglist__19701) {
      var s1 = cljs.core.first(arglist__19701);
      var s2 = cljs.core.first(cljs.core.next(arglist__19701));
      var sets = cljs.core.rest(cljs.core.next(arglist__19701));
      return G__19700__delegate(s1, s2, sets)
    };
    G__19700.cljs$lang$arity$variadic = G__19700__delegate;
    return G__19700
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
        var G__19704 = s2;
        var G__19705 = s1;
        s1 = G__19704;
        s2 = G__19705;
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
    var G__19706__delegate = function(s1, s2, sets) {
      var bubbled_sets__19703 = clojure.set.bubble_max_key.call(null, function(p1__19697_SHARP_) {
        return-cljs.core.count.call(null, p1__19697_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets__19703), cljs.core.rest.call(null, bubbled_sets__19703))
    };
    var G__19706 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__19706__delegate.call(this, s1, s2, sets)
    };
    G__19706.cljs$lang$maxFixedArity = 2;
    G__19706.cljs$lang$applyTo = function(arglist__19707) {
      var s1 = cljs.core.first(arglist__19707);
      var s2 = cljs.core.first(cljs.core.next(arglist__19707));
      var sets = cljs.core.rest(cljs.core.next(arglist__19707));
      return G__19706__delegate(s1, s2, sets)
    };
    G__19706.cljs$lang$arity$variadic = G__19706__delegate;
    return G__19706
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
    var G__19708__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__19708 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__19708__delegate.call(this, s1, s2, sets)
    };
    G__19708.cljs$lang$maxFixedArity = 2;
    G__19708.cljs$lang$applyTo = function(arglist__19709) {
      var s1 = cljs.core.first(arglist__19709);
      var s2 = cljs.core.first(cljs.core.next(arglist__19709));
      var sets = cljs.core.rest(cljs.core.next(arglist__19709));
      return G__19708__delegate(s1, s2, sets)
    };
    G__19708.cljs$lang$arity$variadic = G__19708__delegate;
    return G__19708
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
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__19710_SHARP_) {
    return cljs.core.select_keys.call(null, p1__19710_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__19718) {
    var vec__19719__19720 = p__19718;
    var old__19721 = cljs.core.nth.call(null, vec__19719__19720, 0, null);
    var new__19722 = cljs.core.nth.call(null, vec__19719__19720, 1, null);
    if(function() {
      var and__3822__auto____19723 = cljs.core.not_EQ_.call(null, old__19721, new__19722);
      if(and__3822__auto____19723) {
        return cljs.core.contains_QMARK_.call(null, m, old__19721)
      }else {
        return and__3822__auto____19723
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new__19722, cljs.core._lookup.call(null, m, old__19721, null)), old__19721)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__19711_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__19711_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik__19725 = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik__19725, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik__19725, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m, p__19735) {
    var vec__19736__19737 = p__19735;
    var k__19738 = cljs.core.nth.call(null, vec__19736__19737, 0, null);
    var v__19739 = cljs.core.nth.call(null, vec__19736__19737, 1, null);
    return cljs.core.assoc.call(null, m, v__19739, k__19738)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto____19756 = cljs.core.seq.call(null, xrel);
      if(and__3822__auto____19756) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto____19756
      }
    }()) {
      var ks__19758 = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__19757__19759 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r__19760 = cljs.core.nth.call(null, vec__19757__19759, 0, null);
      var s__19761 = cljs.core.nth.call(null, vec__19757__19759, 1, null);
      var idx__19762 = clojure.set.index.call(null, r__19760, ks__19758);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found__19763 = idx__19762.call(null, cljs.core.select_keys.call(null, x, ks__19758));
        if(cljs.core.truth_(found__19763)) {
          return cljs.core.reduce.call(null, function(p1__19726_SHARP_, p2__19727_SHARP_) {
            return cljs.core.conj.call(null, p1__19726_SHARP_, cljs.core.merge.call(null, p2__19727_SHARP_, x))
          }, ret, found__19763)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s__19761)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__19764__19765 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r__19766 = cljs.core.nth.call(null, vec__19764__19765, 0, null);
    var s__19767 = cljs.core.nth.call(null, vec__19764__19765, 1, null);
    var k__19768 = cljs.core.nth.call(null, vec__19764__19765, 2, null);
    var idx__19769 = clojure.set.index.call(null, r__19766, cljs.core.vals.call(null, k__19768));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found__19770 = idx__19769.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k__19768)), k__19768));
      if(cljs.core.truth_(found__19770)) {
        return cljs.core.reduce.call(null, function(p1__19728_SHARP_, p2__19729_SHARP_) {
          return cljs.core.conj.call(null, p1__19728_SHARP_, cljs.core.merge.call(null, p2__19729_SHARP_, x))
        }, ret, found__19770)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s__19767)
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
  var and__3822__auto____19773 = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto____19773) {
    return cljs.core.every_QMARK_.call(null, function(p1__19740_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__19740_SHARP_)
    }, set1)
  }else {
    return and__3822__auto____19773
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto____19775 = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto____19775) {
    return cljs.core.every_QMARK_.call(null, function(p1__19771_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__19771_SHARP_)
    }, set2)
  }else {
    return and__3822__auto____19775
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
  var this__19465 = this;
  return goog.getUid(this$)
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__19466 = this;
  var G__19467__19468 = cljs.core.seq.call(null, this__19466.watches);
  if(G__19467__19468) {
    var G__19470__19472 = cljs.core.first.call(null, G__19467__19468);
    var vec__19471__19473 = G__19470__19472;
    var key__19474 = cljs.core.nth.call(null, vec__19471__19473, 0, null);
    var f__19475 = cljs.core.nth.call(null, vec__19471__19473, 1, null);
    var G__19467__19476 = G__19467__19468;
    var G__19470__19477 = G__19470__19472;
    var G__19467__19478 = G__19467__19476;
    while(true) {
      var vec__19479__19480 = G__19470__19477;
      var key__19481 = cljs.core.nth.call(null, vec__19479__19480, 0, null);
      var f__19482 = cljs.core.nth.call(null, vec__19479__19480, 1, null);
      var G__19467__19483 = G__19467__19478;
      f__19482.call(null, key__19481, this$, oldval, newval);
      var temp__3974__auto____19484 = cljs.core.next.call(null, G__19467__19483);
      if(temp__3974__auto____19484) {
        var G__19467__19485 = temp__3974__auto____19484;
        var G__19491 = cljs.core.first.call(null, G__19467__19485);
        var G__19492 = G__19467__19485;
        G__19470__19477 = G__19491;
        G__19467__19478 = G__19492;
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
  var this__19486 = this;
  if(cljs.core.truth_(f)) {
    return this$.watches = cljs.core.assoc.call(null, this__19486.watches, key, f)
  }else {
    return null
  }
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__19487 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__19487.watches, key)
};
crate.binding.SubAtom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__19488 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<SubAtom: "], true), cljs.core._pr_seq.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, this__19488.atm), this__19488.path), opts), ">")
};
crate.binding.SubAtom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__19489 = this;
  return cljs.core.get_in.call(null, cljs.core.deref.call(null, this__19489.atm), this__19489.path)
};
crate.binding.SubAtom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__19490 = this;
  return o === other
};
crate.binding.SubAtom;
crate.binding.subatom = function subatom(atm, path) {
  var path__19506 = cljs.core.coll_QMARK_.call(null, path) ? path : cljs.core.PersistentVector.fromArray([path], true);
  var vec__19505__19507 = cljs.core.instance_QMARK_.call(null, crate.binding.SubAtom, atm) ? cljs.core.PersistentVector.fromArray([atm.atm, cljs.core.concat.call(null, atm.path, path__19506)], true) : cljs.core.PersistentVector.fromArray([atm, path__19506], true);
  var atm__19508 = cljs.core.nth.call(null, vec__19505__19507, 0, null);
  var path__19509 = cljs.core.nth.call(null, vec__19505__19507, 1, null);
  var k__19510 = cljs.core.gensym.call(null, "subatom");
  var sa__19511 = new crate.binding.SubAtom(atm__19508, path__19509, cljs.core.hash.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, atm__19508), path__19509)), null);
  cljs.core.add_watch.call(null, atm__19508, k__19510, function(_19512, _, ov, nv) {
    var latest__19513 = cljs.core.get_in.call(null, nv, path__19509);
    var prev__19514 = cljs.core.get_in.call(null, ov, path__19509);
    var latest_hash__19515 = cljs.core.hash.call(null, latest__19513);
    if(function() {
      var and__3822__auto____19516 = cljs.core.not_EQ_.call(null, sa__19511.prevhash, latest_hash__19515);
      if(and__3822__auto____19516) {
        return cljs.core.not_EQ_.call(null, prev__19514, latest__19513)
      }else {
        return and__3822__auto____19516
      }
    }()) {
      sa__19511.prevhash = latest_hash__19515;
      return cljs.core._notify_watches.call(null, sa__19511, cljs.core.get_in.call(null, ov, path__19509), latest__19513)
    }else {
      return null
    }
  });
  return sa__19511
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
    var G__19517__delegate = function(sa, f, x, y, z, more) {
      return crate.binding.sub_reset_BANG_.call(null, sa, cljs.core.apply.call(null, f, cljs.core.deref.call(null, sa), x, y, z, more))
    };
    var G__19517 = function(sa, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__19517__delegate.call(this, sa, f, x, y, z, more)
    };
    G__19517.cljs$lang$maxFixedArity = 5;
    G__19517.cljs$lang$applyTo = function(arglist__19518) {
      var sa = cljs.core.first(arglist__19518);
      var f = cljs.core.first(cljs.core.next(arglist__19518));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__19518)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__19518))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__19518)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__19518)))));
      return G__19517__delegate(sa, f, x, y, z, more)
    };
    G__19517.cljs$lang$arity$variadic = G__19517__delegate;
    return G__19517
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
    var and__3822__auto____19523 = this$;
    if(and__3822__auto____19523) {
      return this$.crate$binding$bindable$_value$arity$1
    }else {
      return and__3822__auto____19523
    }
  }()) {
    return this$.crate$binding$bindable$_value$arity$1(this$)
  }else {
    var x__2369__auto____19524 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____19525 = crate.binding._value[goog.typeOf(x__2369__auto____19524)];
      if(or__3824__auto____19525) {
        return or__3824__auto____19525
      }else {
        var or__3824__auto____19526 = crate.binding._value["_"];
        if(or__3824__auto____19526) {
          return or__3824__auto____19526
        }else {
          throw cljs.core.missing_protocol.call(null, "bindable.-value", this$);
        }
      }
    }().call(null, this$)
  }
};
crate.binding._on_change = function _on_change(this$, func) {
  if(function() {
    var and__3822__auto____19531 = this$;
    if(and__3822__auto____19531) {
      return this$.crate$binding$bindable$_on_change$arity$2
    }else {
      return and__3822__auto____19531
    }
  }()) {
    return this$.crate$binding$bindable$_on_change$arity$2(this$, func)
  }else {
    var x__2369__auto____19532 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____19533 = crate.binding._on_change[goog.typeOf(x__2369__auto____19532)];
      if(or__3824__auto____19533) {
        return or__3824__auto____19533
      }else {
        var or__3824__auto____19534 = crate.binding._on_change["_"];
        if(or__3824__auto____19534) {
          return or__3824__auto____19534
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
  var this__19535 = this;
  return this__19535.value_func.call(null, cljs.core.deref.call(null, this__19535.atm))
};
crate.binding.atom_binding.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__19536 = this;
  return cljs.core.add_watch.call(null, this__19536.atm, cljs.core.gensym.call(null, "atom-binding"), function() {
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
  var this__19537 = this;
  var G__19538__19539 = cljs.core.seq.call(null, this__19537.watches);
  if(G__19538__19539) {
    var G__19541__19543 = cljs.core.first.call(null, G__19538__19539);
    var vec__19542__19544 = G__19541__19543;
    var key__19545 = cljs.core.nth.call(null, vec__19542__19544, 0, null);
    var f__19546 = cljs.core.nth.call(null, vec__19542__19544, 1, null);
    var G__19538__19547 = G__19538__19539;
    var G__19541__19548 = G__19541__19543;
    var G__19538__19549 = G__19538__19547;
    while(true) {
      var vec__19550__19551 = G__19541__19548;
      var key__19552 = cljs.core.nth.call(null, vec__19550__19551, 0, null);
      var f__19553 = cljs.core.nth.call(null, vec__19550__19551, 1, null);
      var G__19538__19554 = G__19538__19549;
      f__19553.call(null, key__19552, this$, oldval, newval);
      var temp__3974__auto____19555 = cljs.core.next.call(null, G__19538__19554);
      if(temp__3974__auto____19555) {
        var G__19538__19556 = temp__3974__auto____19555;
        var G__19559 = cljs.core.first.call(null, G__19538__19556);
        var G__19560 = G__19538__19556;
        G__19541__19548 = G__19559;
        G__19538__19549 = G__19560;
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
  var this__19557 = this;
  return this$.watches = cljs.core.assoc.call(null, this__19557.watches, key, f)
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__19558 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__19558.watches, key)
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
  var this__19561 = this;
  return cljs.core.map.call(null, "\ufdd0'elem", cljs.core.vals.call(null, this$.stuff))
};
crate.binding.bound_collection.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__19562 = this;
  return cljs.core.add_watch.call(null, this__19562.notif, cljs.core.gensym.call(null, "bound-coll"), function(_19564, _19565, _, p__19563) {
    var vec__19566__19567 = p__19563;
    var event__19568 = cljs.core.nth.call(null, vec__19566__19567, 0, null);
    var el__19569 = cljs.core.nth.call(null, vec__19566__19567, 1, null);
    var v__19570 = cljs.core.nth.call(null, vec__19566__19567, 2, null);
    return func.call(null, event__19568, el__19569, v__19570)
  })
};
crate.binding.bound_collection.prototype.crate$binding$bindable_coll$ = true;
crate.binding.bound_collection;
crate.binding.opt = function opt(bc, k) {
  return bc.opts.call(null, k)
};
crate.binding.bc_add = function bc_add(bc, path, key) {
  var sa__19573 = crate.binding.subatom.call(null, bc.atm, path);
  var elem__19574 = crate.binding.opt.call(null, bc, "\ufdd0'as").call(null, sa__19573);
  bc.stuff = cljs.core.assoc.call(null, bc.stuff, key, cljs.core.ObjMap.fromObject(["\ufdd0'elem", "\ufdd0'subatom"], {"\ufdd0'elem":elem__19574, "\ufdd0'subatom":sa__19573}));
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'add", elem__19574, cljs.core.deref.call(null, sa__19573)], true))
};
crate.binding.bc_remove = function bc_remove(bc, key) {
  var notif__19577 = bc.notif;
  var prev__19578 = bc.stuff.call(null, key);
  bc.stuff = cljs.core.dissoc.call(null, bc.stuff, key);
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'remove", (new cljs.core.Keyword("\ufdd0'elem")).call(null, prev__19578), null], true))
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
      var or__3824__auto____19580 = crate.binding.opt.call(null, bc, "\ufdd0'path");
      if(cljs.core.truth_(or__3824__auto____19580)) {
        return or__3824__auto____19580
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
  __GT_path.cljs$lang$applyTo = function(arglist__19581) {
    var bc = cljs.core.first(arglist__19581);
    var segs = cljs.core.rest(arglist__19581);
    return __GT_path__delegate(bc, segs)
  };
  __GT_path.cljs$lang$arity$variadic = __GT_path__delegate;
  return __GT_path
}();
crate.binding.bc_compare = function bc_compare(bc, neue) {
  var prev__19599 = bc.stuff;
  var pset__19600 = cljs.core.into.call(null, cljs.core.PersistentHashSet.EMPTY, cljs.core.keys.call(null, prev__19599));
  var nset__19601 = crate.binding.__GT_keyed.call(null, neue, crate.binding.opt.call(null, bc, "\ufdd0'keyfn"));
  var added__19602 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, nset__19601, pset__19600));
  var removed__19603 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, pset__19600, nset__19601));
  var G__19604__19605 = cljs.core.seq.call(null, added__19602);
  if(G__19604__19605) {
    var a__19606 = cljs.core.first.call(null, G__19604__19605);
    var G__19604__19607 = G__19604__19605;
    while(true) {
      crate.binding.bc_add.call(null, bc, a__19606, a__19606);
      var temp__3974__auto____19608 = cljs.core.next.call(null, G__19604__19607);
      if(temp__3974__auto____19608) {
        var G__19604__19609 = temp__3974__auto____19608;
        var G__19616 = cljs.core.first.call(null, G__19604__19609);
        var G__19617 = G__19604__19609;
        a__19606 = G__19616;
        G__19604__19607 = G__19617;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__19610__19611 = cljs.core.seq.call(null, removed__19603);
  if(G__19610__19611) {
    var r__19612 = cljs.core.first.call(null, G__19610__19611);
    var G__19610__19613 = G__19610__19611;
    while(true) {
      crate.binding.bc_remove.call(null, bc, r__19612);
      var temp__3974__auto____19614 = cljs.core.next.call(null, G__19610__19613);
      if(temp__3974__auto____19614) {
        var G__19610__19615 = temp__3974__auto____19614;
        var G__19618 = cljs.core.first.call(null, G__19610__19615);
        var G__19619 = G__19610__19615;
        r__19612 = G__19618;
        G__19610__19613 = G__19619;
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
  var bound_coll__delegate = function(atm, p__19620) {
    var vec__19635__19636 = p__19620;
    var path__19637 = cljs.core.nth.call(null, vec__19635__19636, 0, null);
    var opts__19638 = cljs.core.nth.call(null, vec__19635__19636, 1, null);
    var vec__19639__19640 = cljs.core.truth_(opts__19638) ? cljs.core.PersistentVector.fromArray([path__19637, opts__19638], true) : cljs.core.PersistentVector.fromArray([null, path__19637], true);
    var path__19641 = cljs.core.nth.call(null, vec__19639__19640, 0, null);
    var opts__19642 = cljs.core.nth.call(null, vec__19639__19640, 1, null);
    var atm__19643 = cljs.core.not.call(null, path__19641) ? atm : crate.binding.subatom.call(null, atm, path__19641);
    var opts__19644 = cljs.core.assoc.call(null, opts__19642, "\ufdd0'path", path__19641);
    var opts__19645 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__19644)) ? cljs.core.assoc.call(null, opts__19644, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__19644, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__19644), cljs.core.second));
    var bc__19646 = new crate.binding.bound_collection(atm__19643, new crate.binding.notifier(null), opts__19645, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__19643, cljs.core.gensym.call(null, "bound-coll"), function(_19647, _19648, _, neue) {
      return crate.binding.bc_compare.call(null, bc__19646, neue)
    });
    crate.binding.bc_compare.call(null, bc__19646, cljs.core.deref.call(null, atm__19643));
    return bc__19646
  };
  var bound_coll = function(atm, var_args) {
    var p__19620 = null;
    if(goog.isDef(var_args)) {
      p__19620 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound_coll__delegate.call(this, atm, p__19620)
  };
  bound_coll.cljs$lang$maxFixedArity = 1;
  bound_coll.cljs$lang$applyTo = function(arglist__19649) {
    var atm = cljs.core.first(arglist__19649);
    var p__19620 = cljs.core.rest(arglist__19649);
    return bound_coll__delegate(atm, p__19620)
  };
  bound_coll.cljs$lang$arity$variadic = bound_coll__delegate;
  return bound_coll
}();
crate.binding.map_bound = function() {
  var map_bound__delegate = function(as, atm, p__19650) {
    var vec__19660__19661 = p__19650;
    var opts__19662 = cljs.core.nth.call(null, vec__19660__19661, 0, null);
    var opts__19663 = cljs.core.assoc.call(null, opts__19662, "\ufdd0'as", as);
    var atm__19664 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__19663)) ? atm : crate.binding.subatom.call(null, atm, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__19663));
    var opts__19665 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__19663)) ? cljs.core.assoc.call(null, opts__19663, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__19663, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__19663), cljs.core.second));
    var bc__19666 = new crate.binding.bound_collection(atm__19664, new crate.binding.notifier(null), opts__19665, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__19664, cljs.core.gensym.call(null, "bound-coll"), function(_19667, _19668, _, neue) {
      return crate.binding.bc_compare.call(null, bc__19666, neue)
    });
    crate.binding.bc_compare.call(null, bc__19666, cljs.core.deref.call(null, atm__19664));
    return bc__19666
  };
  var map_bound = function(as, atm, var_args) {
    var p__19650 = null;
    if(goog.isDef(var_args)) {
      p__19650 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return map_bound__delegate.call(this, as, atm, p__19650)
  };
  map_bound.cljs$lang$maxFixedArity = 2;
  map_bound.cljs$lang$applyTo = function(arglist__19669) {
    var as = cljs.core.first(arglist__19669);
    var atm = cljs.core.first(cljs.core.next(arglist__19669));
    var p__19650 = cljs.core.rest(cljs.core.next(arglist__19669));
    return map_bound__delegate(as, atm, p__19650)
  };
  map_bound.cljs$lang$arity$variadic = map_bound__delegate;
  return map_bound
}();
crate.binding.binding_QMARK_ = function binding_QMARK_(b) {
  var G__19673__19674 = b;
  if(G__19673__19674) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____19675 = null;
      if(cljs.core.truth_(or__3824__auto____19675)) {
        return or__3824__auto____19675
      }else {
        return G__19673__19674.crate$binding$bindable$
      }
    }())) {
      return true
    }else {
      if(!G__19673__19674.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__19673__19674)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__19673__19674)
  }
};
crate.binding.binding_coll_QMARK_ = function binding_coll_QMARK_(b) {
  var G__19679__19680 = b;
  if(G__19679__19680) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____19681 = null;
      if(cljs.core.truth_(or__3824__auto____19681)) {
        return or__3824__auto____19681
      }else {
        return G__19679__19680.crate$binding$bindable_coll$
      }
    }())) {
      return true
    }else {
      if(!G__19679__19680.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__19679__19680)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__19679__19680)
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
  var bound__delegate = function(atm, p__19682) {
    var vec__19688__19689 = p__19682;
    var func__19690 = cljs.core.nth.call(null, vec__19688__19689, 0, null);
    var func__19692 = function() {
      var or__3824__auto____19691 = func__19690;
      if(cljs.core.truth_(or__3824__auto____19691)) {
        return or__3824__auto____19691
      }else {
        return cljs.core.identity
      }
    }();
    return new crate.binding.atom_binding(atm, func__19692)
  };
  var bound = function(atm, var_args) {
    var p__19682 = null;
    if(goog.isDef(var_args)) {
      p__19682 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound__delegate.call(this, atm, p__19682)
  };
  bound.cljs$lang$maxFixedArity = 1;
  bound.cljs$lang$applyTo = function(arglist__19693) {
    var atm = cljs.core.first(arglist__19693);
    var p__19682 = cljs.core.rest(arglist__19693);
    return bound__delegate(atm, p__19682)
  };
  bound.cljs$lang$arity$variadic = bound__delegate;
  return bound
}();
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
  var G__19209__19210 = cljs.core.seq.call(null, content);
  if(G__19209__19210) {
    var c__19211 = cljs.core.first.call(null, G__19209__19210);
    var G__19209__19212 = G__19209__19210;
    while(true) {
      var child__19213 = c__19211 == null ? null : cljs.core.map_QMARK_.call(null, c__19211) ? function() {
        throw"Maps cannot be used as content";
      }() : cljs.core.string_QMARK_.call(null, c__19211) ? goog.dom.createTextNode(c__19211) : cljs.core.vector_QMARK_.call(null, c__19211) ? crate.compiler.elem_factory.call(null, c__19211) : cljs.core.seq_QMARK_.call(null, c__19211) ? as_content.call(null, parent, c__19211) : cljs.core.truth_(crate.binding.binding_coll_QMARK_.call(null, c__19211)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'coll", c__19211);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__19211)], true))
      }() : cljs.core.truth_(crate.binding.binding_QMARK_.call(null, c__19211)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'text", c__19211);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__19211)], true))
      }() : cljs.core.truth_(c__19211.nodeName) ? c__19211 : cljs.core.truth_(c__19211.get) ? c__19211.get(0) : "\ufdd0'else" ? goog.dom.createTextNode([cljs.core.str(c__19211)].join("")) : null;
      if(cljs.core.truth_(child__19213)) {
        goog.dom.appendChild(parent, child__19213)
      }else {
      }
      var temp__3974__auto____19214 = cljs.core.next.call(null, G__19209__19212);
      if(temp__3974__auto____19214) {
        var G__19209__19215 = temp__3974__auto____19214;
        var G__19216 = cljs.core.first.call(null, G__19209__19215);
        var G__19217 = G__19209__19215;
        c__19211 = G__19216;
        G__19209__19212 = G__19217;
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
  var method_table__2543__auto____19218 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2544__auto____19219 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2545__auto____19220 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2546__auto____19221 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2547__auto____19222 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("dom-binding", function(type, _19223, _) {
    return type
  }, "\ufdd0'default", hierarchy__2547__auto____19222, method_table__2543__auto____19218, prefer_table__2544__auto____19219, method_cache__2545__auto____19220, cached_hierarchy__2546__auto____19221)
}();
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'text", function(_, b, elem) {
  return crate.binding.on_change.call(null, b, function(v) {
    goog.dom.removeChildren(elem);
    return crate.compiler.as_content.call(null, elem, cljs.core.PersistentVector.fromArray([v], true))
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'attr", function(_, p__19224, elem) {
  var vec__19225__19226 = p__19224;
  var k__19227 = cljs.core.nth.call(null, vec__19225__19226, 0, null);
  var b__19228 = cljs.core.nth.call(null, vec__19225__19226, 1, null);
  return crate.binding.on_change.call(null, b__19228, function(v) {
    return crate.compiler.dom_attr.call(null, elem, k__19227, v)
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'style", function(_, p__19229, elem) {
  var vec__19230__19231 = p__19229;
  var k__19232 = cljs.core.nth.call(null, vec__19230__19231, 0, null);
  var b__19233 = cljs.core.nth.call(null, vec__19230__19231, 1, null);
  return crate.binding.on_change.call(null, b__19233, function(v) {
    if(cljs.core.truth_(k__19232)) {
      return crate.compiler.dom_style.call(null, elem, k__19232, v)
    }else {
      return crate.compiler.dom_style.call(null, elem, v)
    }
  })
});
crate.compiler.dom_add = function dom_add(bc, parent, elem, v) {
  var temp__3971__auto____19236 = crate.binding.opt.call(null, bc, "\ufdd0'add");
  if(cljs.core.truth_(temp__3971__auto____19236)) {
    var adder__19237 = temp__3971__auto____19236;
    return adder__19237.call(null, parent, elem, v)
  }else {
    return goog.dom.appendChild(parent, elem)
  }
};
crate.compiler.dom_remove = function dom_remove(bc, elem) {
  var temp__3971__auto____19240 = crate.binding.opt.call(null, bc, "\ufdd0'remove");
  if(cljs.core.truth_(temp__3971__auto____19240)) {
    var remover__19241 = temp__3971__auto____19240;
    return remover__19241.call(null, elem)
  }else {
    return goog.dom.removeNode(elem)
  }
};
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'coll", function(_, bc, parent) {
  return crate.binding.on_change.call(null, bc, function(type, elem, v) {
    var pred__19242__19245 = cljs.core._EQ_;
    var expr__19243__19246 = type;
    if(pred__19242__19245.call(null, "\ufdd0'add", expr__19243__19246)) {
      return crate.compiler.dom_add.call(null, bc, parent, elem, v)
    }else {
      if(pred__19242__19245.call(null, "\ufdd0'remove", expr__19243__19246)) {
        return crate.compiler.dom_remove.call(null, bc, elem)
      }else {
        throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__19243__19246)].join(""));
      }
    }
  })
});
crate.compiler.handle_bindings = function handle_bindings(bs, elem) {
  var G__19266__19267 = cljs.core.seq.call(null, bs);
  if(G__19266__19267) {
    var G__19269__19271 = cljs.core.first.call(null, G__19266__19267);
    var vec__19270__19272 = G__19269__19271;
    var type__19273 = cljs.core.nth.call(null, vec__19270__19272, 0, null);
    var b__19274 = cljs.core.nth.call(null, vec__19270__19272, 1, null);
    var G__19266__19275 = G__19266__19267;
    var G__19269__19276 = G__19269__19271;
    var G__19266__19277 = G__19266__19275;
    while(true) {
      var vec__19278__19279 = G__19269__19276;
      var type__19280 = cljs.core.nth.call(null, vec__19278__19279, 0, null);
      var b__19281 = cljs.core.nth.call(null, vec__19278__19279, 1, null);
      var G__19266__19282 = G__19266__19277;
      crate.compiler.dom_binding.call(null, type__19280, b__19281, elem);
      var temp__3974__auto____19283 = cljs.core.next.call(null, G__19266__19282);
      if(temp__3974__auto____19283) {
        var G__19266__19284 = temp__3974__auto____19283;
        var G__19285 = cljs.core.first.call(null, G__19266__19284);
        var G__19286 = G__19266__19284;
        G__19269__19276 = G__19285;
        G__19266__19277 = G__19286;
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
        var G__19307__19308 = cljs.core.seq.call(null, v);
        if(G__19307__19308) {
          var G__19310__19312 = cljs.core.first.call(null, G__19307__19308);
          var vec__19311__19313 = G__19310__19312;
          var k__19314 = cljs.core.nth.call(null, vec__19311__19313, 0, null);
          var v__19315 = cljs.core.nth.call(null, vec__19311__19313, 1, null);
          var G__19307__19316 = G__19307__19308;
          var G__19310__19317 = G__19310__19312;
          var G__19307__19318 = G__19307__19316;
          while(true) {
            var vec__19319__19320 = G__19310__19317;
            var k__19321 = cljs.core.nth.call(null, vec__19319__19320, 0, null);
            var v__19322 = cljs.core.nth.call(null, vec__19319__19320, 1, null);
            var G__19307__19323 = G__19307__19318;
            dom_style.call(null, elem, k__19321, v__19322);
            var temp__3974__auto____19324 = cljs.core.next.call(null, G__19307__19323);
            if(temp__3974__auto____19324) {
              var G__19307__19325 = temp__3974__auto____19324;
              var G__19327 = cljs.core.first.call(null, G__19307__19325);
              var G__19328 = G__19307__19325;
              G__19310__19317 = G__19327;
              G__19307__19318 = G__19328;
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
    var v__19326 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
      crate.compiler.capture_binding.call(null, "\ufdd0'style", cljs.core.PersistentVector.fromArray([k, v], true));
      return crate.binding.value.call(null, v)
    }() : v;
    return goog.style.setStyle(elem, cljs.core.name.call(null, k), v__19326)
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
        var G__19349__19350 = cljs.core.seq.call(null, attrs);
        if(G__19349__19350) {
          var G__19352__19354 = cljs.core.first.call(null, G__19349__19350);
          var vec__19353__19355 = G__19352__19354;
          var k__19356 = cljs.core.nth.call(null, vec__19353__19355, 0, null);
          var v__19357 = cljs.core.nth.call(null, vec__19353__19355, 1, null);
          var G__19349__19358 = G__19349__19350;
          var G__19352__19359 = G__19352__19354;
          var G__19349__19360 = G__19349__19358;
          while(true) {
            var vec__19361__19362 = G__19352__19359;
            var k__19363 = cljs.core.nth.call(null, vec__19361__19362, 0, null);
            var v__19364 = cljs.core.nth.call(null, vec__19361__19362, 1, null);
            var G__19349__19365 = G__19349__19360;
            dom_attr.call(null, elem, k__19363, v__19364);
            var temp__3974__auto____19366 = cljs.core.next.call(null, G__19349__19365);
            if(temp__3974__auto____19366) {
              var G__19349__19367 = temp__3974__auto____19366;
              var G__19369 = cljs.core.first.call(null, G__19349__19367);
              var G__19370 = G__19349__19367;
              G__19352__19359 = G__19369;
              G__19349__19360 = G__19370;
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
      var v__19368 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'attr", cljs.core.PersistentVector.fromArray([k, v], true));
        return crate.binding.value.call(null, v)
      }() : v;
      elem.setAttribute(cljs.core.name.call(null, k), v__19368)
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
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__19377) {
    var vec__19378__19379 = p__19377;
    var n__19380 = cljs.core.nth.call(null, vec__19378__19379, 0, null);
    var v__19381 = cljs.core.nth.call(null, vec__19378__19379, 1, null);
    if(v__19381 === true) {
      return cljs.core.PersistentVector.fromArray([n__19380, cljs.core.name.call(null, n__19380)], true)
    }else {
      return cljs.core.PersistentVector.fromArray([n__19380, v__19381], true)
    }
  }, cljs.core.filter.call(null, cljs.core.comp.call(null, cljs.core.boolean$, cljs.core.second), map_attrs)))
};
crate.compiler.normalize_element = function normalize_element(p__19382) {
  var vec__19408__19409 = p__19382;
  var tag__19410 = cljs.core.nth.call(null, vec__19408__19409, 0, null);
  var content__19411 = cljs.core.nthnext.call(null, vec__19408__19409, 1);
  if(!function() {
    var or__3824__auto____19412 = cljs.core.keyword_QMARK_.call(null, tag__19410);
    if(or__3824__auto____19412) {
      return or__3824__auto____19412
    }else {
      var or__3824__auto____19413 = cljs.core.symbol_QMARK_.call(null, tag__19410);
      if(or__3824__auto____19413) {
        return or__3824__auto____19413
      }else {
        return cljs.core.string_QMARK_.call(null, tag__19410)
      }
    }
  }()) {
    throw[cljs.core.str(tag__19410), cljs.core.str(" is not a valid tag name.")].join("");
  }else {
  }
  var vec__19414__19416 = cljs.core.re_matches.call(null, crate.compiler.re_tag, cljs.core.name.call(null, tag__19410));
  var ___19417 = cljs.core.nth.call(null, vec__19414__19416, 0, null);
  var tag__19418 = cljs.core.nth.call(null, vec__19414__19416, 1, null);
  var id__19419 = cljs.core.nth.call(null, vec__19414__19416, 2, null);
  var class__19420 = cljs.core.nth.call(null, vec__19414__19416, 3, null);
  var vec__19415__19427 = function() {
    var vec__19421__19422 = clojure.string.split.call(null, tag__19418, /:/);
    var nsp__19423 = cljs.core.nth.call(null, vec__19421__19422, 0, null);
    var t__19424 = cljs.core.nth.call(null, vec__19421__19422, 1, null);
    var ns_xmlns__19425 = crate.compiler.xmlns.call(null, cljs.core.keyword.call(null, nsp__19423));
    if(cljs.core.truth_(t__19424)) {
      return cljs.core.PersistentVector.fromArray([function() {
        var or__3824__auto____19426 = ns_xmlns__19425;
        if(cljs.core.truth_(or__3824__auto____19426)) {
          return or__3824__auto____19426
        }else {
          return nsp__19423
        }
      }(), t__19424], true)
    }else {
      return cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0'xhtml")).call(null, crate.compiler.xmlns), nsp__19423], true)
    }
  }();
  var nsp__19428 = cljs.core.nth.call(null, vec__19415__19427, 0, null);
  var tag__19429 = cljs.core.nth.call(null, vec__19415__19427, 1, null);
  var tag_attrs__19431 = cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.filter.call(null, function(p1__19371_SHARP_) {
    return!(cljs.core.second.call(null, p1__19371_SHARP_) == null)
  }, cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":function() {
    var or__3824__auto____19430 = id__19419;
    if(cljs.core.truth_(or__3824__auto____19430)) {
      return or__3824__auto____19430
    }else {
      return null
    }
  }(), "\ufdd0'class":cljs.core.truth_(class__19420) ? clojure.string.replace.call(null, class__19420, /\./, " ") : null})));
  var map_attrs__19432 = cljs.core.first.call(null, content__19411);
  if(cljs.core.map_QMARK_.call(null, map_attrs__19432)) {
    return cljs.core.PersistentVector.fromArray([nsp__19428, tag__19429, cljs.core.merge.call(null, tag_attrs__19431, crate.compiler.normalize_map_attrs.call(null, map_attrs__19432)), cljs.core.next.call(null, content__19411)], true)
  }else {
    return cljs.core.PersistentVector.fromArray([nsp__19428, tag__19429, tag_attrs__19431, content__19411], true)
  }
};
crate.compiler.parse_content = function parse_content(elem, content) {
  var attrs__19434 = cljs.core.first.call(null, content);
  if(cljs.core.map_QMARK_.call(null, attrs__19434)) {
    crate.compiler.dom_attr.call(null, elem, attrs__19434);
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
  var bindings19445__19446 = crate.compiler.bindings;
  try {
    crate.compiler.bindings = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
    var vec__19448__19449 = crate.compiler.normalize_element.call(null, tag_def);
    var nsp__19450 = cljs.core.nth.call(null, vec__19448__19449, 0, null);
    var tag__19451 = cljs.core.nth.call(null, vec__19448__19449, 1, null);
    var attrs__19452 = cljs.core.nth.call(null, vec__19448__19449, 2, null);
    var content__19453 = cljs.core.nth.call(null, vec__19448__19449, 3, null);
    var elem__19454 = crate.compiler.create_elem.call(null, nsp__19450, tag__19451);
    crate.compiler.dom_attr.call(null, elem__19454, attrs__19452);
    crate.compiler.as_content.call(null, elem__19454, content__19453);
    crate.compiler.handle_bindings.call(null, cljs.core.deref.call(null, crate.compiler.bindings), elem__19454);
    return elem__19454
  }finally {
    crate.compiler.bindings = bindings19445__19446
  }
};
crate.compiler.add_optional_attrs = function add_optional_attrs(func) {
  return function() {
    var G__19463__delegate = function(args) {
      if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, args))) {
        var vec__19459__19460 = cljs.core.apply.call(null, func, cljs.core.rest.call(null, args));
        var tag__19461 = cljs.core.nth.call(null, vec__19459__19460, 0, null);
        var body__19462 = cljs.core.nthnext.call(null, vec__19459__19460, 1);
        if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, body__19462))) {
          return cljs.core.apply.call(null, cljs.core.vector, tag__19461, cljs.core.merge.call(null, cljs.core.first.call(null, body__19462), cljs.core.first.call(null, args)), cljs.core.rest.call(null, body__19462))
        }else {
          return cljs.core.apply.call(null, cljs.core.vector, tag__19461, cljs.core.first.call(null, args), body__19462)
        }
      }else {
        return cljs.core.apply.call(null, func, args)
      }
    };
    var G__19463 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__19463__delegate.call(this, args)
    };
    G__19463.cljs$lang$maxFixedArity = 0;
    G__19463.cljs$lang$applyTo = function(arglist__19464) {
      var args = cljs.core.seq(arglist__19464);
      return G__19463__delegate(args)
    };
    G__19463.cljs$lang$arity$variadic = G__19463__delegate;
    return G__19463
  }()
};
goog.provide("crate.core");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("crate.compiler");
crate.core.group_id = cljs.core.atom.call(null, 0);
crate.core.html = function() {
  var html__delegate = function(tags) {
    var res__19200 = cljs.core.map.call(null, crate.compiler.elem_factory, tags);
    if(cljs.core.truth_(cljs.core.second.call(null, res__19200))) {
      return res__19200
    }else {
      return cljs.core.first.call(null, res__19200)
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
  html.cljs$lang$applyTo = function(arglist__19201) {
    var tags = cljs.core.seq(arglist__19201);
    return html__delegate(tags)
  };
  html.cljs$lang$arity$variadic = html__delegate;
  return html
}();
crate.core.h = crate.util.escape_html;
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
  append.cljs$lang$applyTo = function(arglist__19147) {
    var parent = cljs.core.first(arglist__19147);
    var children = cljs.core.rest(arglist__19147);
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
      var and__3822__auto____19160 = this$;
      if(and__3822__auto____19160) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____19160
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2369__auto____19161 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____19162 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____19161)];
        if(or__3824__auto____19162) {
          return or__3824__auto____19162
        }else {
          var or__3824__auto____19163 = clojure.browser.dom._element["_"];
          if(or__3824__auto____19163) {
            return or__3824__auto____19163
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____19164 = this$;
      if(and__3822__auto____19164) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____19164
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2369__auto____19165 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____19166 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____19165)];
        if(or__3824__auto____19166) {
          return or__3824__auto____19166
        }else {
          var or__3824__auto____19167 = clojure.browser.dom._element["_"];
          if(or__3824__auto____19167) {
            return or__3824__auto____19167
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____19168 = this$;
      if(and__3822__auto____19168) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____19168
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2369__auto____19169 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____19170 = clojure.browser.dom._element[goog.typeOf(x__2369__auto____19169)];
        if(or__3824__auto____19170) {
          return or__3824__auto____19170
        }else {
          var or__3824__auto____19171 = clojure.browser.dom._element["_"];
          if(or__3824__auto____19171) {
            return or__3824__auto____19171
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
  log.cljs$lang$applyTo = function(arglist__19172) {
    var args = cljs.core.seq(arglist__19172);
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
  var tag__19173 = cljs.core.first.call(null, this$);
  var attrs__19174 = cljs.core.second.call(null, this$);
  var children__19175 = cljs.core.drop.call(null, 2, this$);
  if(cljs.core.map_QMARK_.call(null, attrs__19174)) {
    return clojure.browser.dom._element.call(null, tag__19173, attrs__19174, children__19175)
  }else {
    return clojure.browser.dom._element.call(null, tag__19173, null, cljs.core.rest.call(null, this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__19188 = null;
  var G__19188__1 = function(this$) {
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
  var G__19188__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs_or_children, ")");
    var attrs__19176 = cljs.core.first.call(null, attrs_or_children);
    if(cljs.core.map_QMARK_.call(null, attrs__19176)) {
      return clojure.browser.dom._element.call(null, this$, attrs__19176, cljs.core.rest.call(null, attrs_or_children))
    }else {
      return clojure.browser.dom._element.call(null, this$, null, attrs_or_children)
    }
  };
  var G__19188__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs, " ", children, ")");
    var str_attrs__19187 = cljs.core.truth_(function() {
      var and__3822__auto____19177 = cljs.core.map_QMARK_.call(null, attrs);
      if(and__3822__auto____19177) {
        return cljs.core.seq.call(null, attrs)
      }else {
        return and__3822__auto____19177
      }
    }()) ? cljs.core.reduce.call(null, function(o, p__19178) {
      var vec__19179__19180 = p__19178;
      var k__19181 = cljs.core.nth.call(null, vec__19179__19180, 0, null);
      var v__19182 = cljs.core.nth.call(null, vec__19179__19180, 1, null);
      var o__19183 = o == null ? {} : o;
      clojure.browser.dom.log.call(null, "o = ", o__19183);
      clojure.browser.dom.log.call(null, "k = ", k__19181);
      clojure.browser.dom.log.call(null, "v = ", v__19182);
      if(function() {
        var or__3824__auto____19184 = cljs.core.keyword_QMARK_.call(null, k__19181);
        if(or__3824__auto____19184) {
          return or__3824__auto____19184
        }else {
          return cljs.core.string_QMARK_.call(null, k__19181)
        }
      }()) {
        var G__19185__19186 = o__19183;
        G__19185__19186[cljs.core.name.call(null, k__19181)] = v__19182;
        return G__19185__19186
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj.call(null, str_attrs__19187);
    if(cljs.core.seq.call(null, children)) {
      return cljs.core.apply.call(null, goog.dom.createDom, cljs.core.name.call(null, this$), str_attrs__19187, cljs.core.map.call(null, clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name.call(null, this$), str_attrs__19187)
    }
  };
  G__19188 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__19188__1.call(this, this$);
      case 2:
        return G__19188__2.call(this, this$, attrs);
      case 3:
        return G__19188__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__19188
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.call(null, "(element ", tag_or_text, ")");
    return clojure.browser.dom._element.call(null, tag_or_text)
  };
  var element__2 = function() {
    var G__19191__delegate = function(tag, children) {
      clojure.browser.dom.log.call(null, "(element ", tag, " ", children, ")");
      var attrs__19190 = cljs.core.first.call(null, children);
      if(cljs.core.map_QMARK_.call(null, attrs__19190)) {
        return clojure.browser.dom._element.call(null, tag, attrs__19190, cljs.core.rest.call(null, children))
      }else {
        return clojure.browser.dom._element.call(null, tag, null, children)
      }
    };
    var G__19191 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__19191__delegate.call(this, tag, children)
    };
    G__19191.cljs$lang$maxFixedArity = 1;
    G__19191.cljs$lang$applyTo = function(arglist__19192) {
      var tag = cljs.core.first(arglist__19192);
      var children = cljs.core.rest(arglist__19192);
      return G__19191__delegate(tag, children)
    };
    G__19191.cljs$lang$arity$variadic = G__19191__delegate;
    return G__19191
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
  var parent__19194 = goog.dom.getElement(cljs.core.name.call(null, id));
  return goog.dom.removeChildren(parent__19194)
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
  var old_node__19197 = clojure.browser.dom.ensure_element.call(null, old_node);
  var new_node__19198 = clojure.browser.dom.ensure_element.call(null, new_node);
  goog.dom.replaceNode(new_node__19198, old_node__19197);
  return new_node__19198
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
    var and__3822__auto____15193 = this$;
    if(and__3822__auto____15193) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____15193
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2369__auto____15194 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____15195 = clojure.browser.event.event_types[goog.typeOf(x__2369__auto____15194)];
      if(or__3824__auto____15195) {
        return or__3824__auto____15195
      }else {
        var or__3824__auto____15196 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____15196) {
          return or__3824__auto____15196
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__15197) {
    var vec__15198__15199 = p__15197;
    var k__15200 = cljs.core.nth.call(null, vec__15198__15199, 0, null);
    var v__15201 = cljs.core.nth.call(null, vec__15198__15199, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__15200.toLowerCase()), v__15201], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__15202) {
    var vec__15203__15204 = p__15202;
    var k__15205 = cljs.core.nth.call(null, vec__15203__15204, 0, null);
    var v__15206 = cljs.core.nth.call(null, vec__15203__15204, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__15205.toLowerCase()), v__15206], true)
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
goog.provide("hedgehog.core");
goog.require("cljs.core");
goog.require("crate.core");
goog.require("clojure.browser.dom");
goog.require("clojure.browser.event");
hedgehog.core.render = function render(template, new_val) {
  return clojure.browser.dom.replace_node.call(null, clojure.browser.dom.get_element.call(null, "content"), crate.core.html.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div#content", template.call(null, new_val)], true)))
};
hedgehog.core.init = function init(template, state) {
  clojure.browser.dom.insert_at.call(null, document.body, clojure.browser.dom.element.call(null, "\ufdd0'div", cljs.core.ObjMap.fromObject(["\ufdd0'id"], {"\ufdd0'id":"content"})), 0);
  cljs.core.add_watch.call(null, state, null, function(k, a, old_val, new_val) {
    return hedgehog.core.render.call(null, template, new_val)
  });
  return hedgehog.core.render.call(null, template, cljs.core.deref.call(null, state))
};
goog.provide("hedgehog.todos");
goog.require("cljs.core");
goog.require("hedgehog.core");
hedgehog.todos.state = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'todos", "\ufdd0'pending-todo"], {"\ufdd0'todos":cljs.core.PersistentVector.fromArray(["buy milk", "eat lunch", "drink milk"], true), "\ufdd0'pending-todo":"foo bar"}));
hedgehog.todos.add_todo = function add_todo(todo) {
  return cljs.core.swap_BANG_.call(null, hedgehog.todos.state, cljs.core.update_in, cljs.core.PersistentVector.fromArray(["\ufdd0'todos"], true), cljs.core.conj, todo)
};
hedgehog.todos.todo_element = function todo_element(todo) {
  return cljs.core.PersistentVector.fromArray(["\ufdd0'li.todo", todo], true)
};
hedgehog.todos.todos = function todos(state) {
  return cljs.core.PersistentVector.fromArray(["\ufdd0'div#todos", cljs.core.PersistentVector.fromArray(["\ufdd0'ul", cljs.core.map.call(null, hedgehog.todos.todo_element, (new cljs.core.Keyword("\ufdd0'todos")).call(null, state))], true), cljs.core.PersistentVector.fromArray(["\ufdd0'input", cljs.core.ObjMap.fromObject(["\ufdd0'value", "\ufdd0'type"], {"\ufdd0'value":(new cljs.core.Keyword("\ufdd0'pending-todo")).call(null, state), "\ufdd0'type":"text"})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'button", 
  "Add", null], true)], true)
};
hedgehog.core.init.call(null, hedgehog.todos.todos, hedgehog.todos.state);

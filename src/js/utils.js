/* ========================================================================
 * ZUI: utils.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
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

    $.format = function(str, args) {
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

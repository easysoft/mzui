/*!
 * MZUI: standard - v1.0.1 - 2018-01-09
 * Copyright (c) 2018 cnezsoft.com; Licensed MIT
 */

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
        return window.jQuery === $ ? (obj instanceof jQuery) : $.zepto.isZ(obj)
    };

    $.isStr = function(x) {
        return typeof x == 'string';
    };

    $.isNum = function(x) {
        return typeof x == 'number';
    };

    $.TapName = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click';

    if(!$.uuid) $.uuid = 0;
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
                var href = $this.data('url') || $this.attr('href');
                if(href && href !== '#' && href.indexOf('##') < 0) {
                    if(!options.target && /^#[a-z]/i.test(href)) {
                        thisOptions.target = href;
                    } else if(!thisOptions.remote) {
                        thisOptions.remote = href;
                    }
                }
                if(e && options.preventDefault !== false) e.preventDefault();
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
            target = $('<div class="' + STR_DISPLAY + ' ' + STR_HIDDEN + '"/>').attr({id: targetId});
            var $layer = $('#' + layerId);
            if(!$layer.length) $layer = $('<div class="' + STR_DISPLAY + '-layer"/>').attr({id: layerId}).appendTo(STR_BODY);
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
            var $backdrop = options.$backdrop = $('<div class="display-backdrop"/>').attr({
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
                    var bounding = $element[0].getBoundingClientRect();
                    $target.css({position: 'absolute', left: bounding.left, top: bounding.top, width: bounding.width, height: bounding.height});
                } else if(placement.indexOf('beside') === 0) {
                    $target.css({position: 'fixed'});
                    placement = placement.split('-');
                    var $win = $(window);
                    var beside = placement[1] || 'auto', 
                        float = placement[2] || 'center',
                        offset = $element.offset(),
                        bounding = $element[0].getBoundingClientRect(),
                        width = $target.width(),
                        height = $target.height(),
                        wWidth = $win.width(),
                        wHeight = $win.height(),
                        floatStart = float === 'start',
                        floatEnd = float === 'end',
                        top, left;
                    var eTop = bounding.top,
                        eLeft = bounding.left,
                        eWidth = bounding.width,
                        eHeight = bounding.height;

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
            if(!name || name == 'null' || name == 'undefined') name = $this.closest('.' + STR_DISPLAY).attr(dataName);
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
        var directionClass  = options.directionClass;

        that.$container.toggleClass(options.inScrollClass, isInScroll)
            .toggleClass(directionClass + '-down', scrollDirection === 'down')
            .toggleClass(directionClass + '-up', scrollDirection === 'up')
            .toggleClass(directionClass + '-over', scrollTop + that.$.height() >= that.$[0].scrollHeight);

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

        if(dark.luma() > light.luma()) {
            var t = light;
            light = dark;
            dark = t;
        }

        if(this.a < 0.5) return dark;

        if(isUndefined(threshold)) threshold = 0.43;
        else threshold = number(threshold);

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


(function($, undefined, Math){
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
}(CoreLib, undefined, Math));

/* ========================================================================
 * MZUI: ajaxform.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function ($, window, undefined) {
    'use strict';

    var NAME = 'mzui.ajaxform';

    var setAjaxForm = function ($form, options) {
        if (!$form.length || $form.data(NAME)) return;
        $form.data(NAME, 1);

        var callEvent = function (name, data) {
            var result;
            var event = $.Event(name);
            if (!$.isArray(data)) data = [data];
            $form.trigger(event, data);
            result = event.result;
            if (options && $.isFunction(options[name])) {
                result = options[name].apply($form, data);
            }
            return result;
        };

        var showMessage = function (message) {
            var $message = $form.find('.form-message');
            if ($message.length) {
                var $content = $message.find('.content');
                ($content.length ? $content : $message).html(message);
                $message.show();
            } else {
                $.messager.warning(message, { time: 10000 });
            }
        };

        $form.on('submit', function (e) {
            e.preventDefault();

            var form = $form[0];
            var _formData = {};
            $.each($form.serializeArray(), function (idx, item) {
                var _name = item.name,
                    _val = item.value,
                    _formVal = _formData[_name];
                if (_val instanceof FileList) {
                    var _fileVal = [];
                    for (var i = _val.length - 1; i >= 0; --i) {
                        _fileVal.push(_val[i]);
                    }
                    _val = _fileVal;
                }
                if ($.isArray(_val)) {
                    if (_formVal === undefined) {
                        _formVal = _val;
                    } else if ($.isArray(_formVal)) {
                        _formVal.push.apply(_formVal, _val);
                    } else {
                        _val.push(_formVal);
                        _formVal = _val;
                    }
                } else if (_name.lastIndexOf(']') === _name.length - 1) {
                    if (_formVal === undefined) {
                        _formVal = [_val];
                    } else {
                        _formVal.push(_val);
                    }
                } else {
                    _formVal = _val;
                }
                _formData[_name] = _formVal;
            });

            var userSubmitData = callEvent('onSubmit', _formData);
            if (userSubmitData === false) return;
            if (userSubmitData !== undefined) {
                _formData = userSubmitData;
            }

            if (options.dataConverter) {
                _formData = options.dataConverter(_formData);
            }

            var formData = new FormData();
            for (var key in _formData) {
                var _val = _formData[key];
                if ($.isArray(_val)) {
                    for (var i = _val.length - 1; i >= 0; --i) {
                        formData.append(key, _val[i]);
                    }
                } else formData.append(key, _val);
            }

            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');
            $.ajax({
                url: options.url || form.action,
                type: options.type || form.method,
                processData: false,
                contentType: false,
                dataType: options.dataType || $form.data('type') || 'json',
                data: formData,
                success: function (response, status) {
                    var userResponse = callEvent('onResponse', [response, status]);
                    if (userResponse === false) return;
                    if (userResponse !== undefined) {
                        response = userResponse;
                    }
                    try {
                        if (typeof response === 'string') response = $.parseJSON(response);
                        if (callEvent('onSuccess', response) !== false) {
                            if (response.result === 'success') {
                                if (response.message) {
                                    $.messager.success(response.message);
                                    if (response.locate) {
                                        setTimeout(function () { location.href = response.locate; }, 1200);
                                    }
                                } else {
                                    if (response.locate) location.href = response.locate;
                                }
                            } else {
                                var message = response.message || response.reason || response.error;
                                if (message) {
                                    if ($.isPlainObject(message)) {
                                        $.each(message, function (msgId, msg) {
                                            if ($.isArray(msg) && msg.length) {
                                                msg = msg.length > 1 ? ('<ul><li>' + msg.join('</li><li>') + '</li></ul>') : msg[0];
                                            }
                                            var $group = $form.find('#' + msgId + ', [name="' + msgId + '"]').closest('.control');
                                            if ($group.length) {
                                                var $msg = $group.find('.help-text');
                                                if (!$msg.length) {
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
                        }
                    } catch (e) {
                        if (callEvent('onError', ['Error response.']) !== false) {
                            showMessage(response || 'No response.');
                        }
                    }
                    callEvent('onResult', response);
                },
                error: function (xhr, errorType, error) {
                    if (callEvent('onError', [error, errorType, xhr]) !== false) {
                        showMessage('error: ' + error);
                        if (window.v && window.v.lang.timeout) {
                            $.messager.danger(window.v.lang.timeout);
                        }
                    }
                },
                complete: function (xhr, status) {
                    $submitBtn.attr('disabled', null).removeClass('disabled loading');
                    callEvent('onComplete', { xhr: xhr, status: status });
                }
            });
        }).on('change', function (e) {
            $form.find('.form-message').hide();
            $(e.target).closest('.control').removeClass('has-error');
        });

        callEvent('init');
    };

    $.ajaxForm = setAjaxForm;

    $.fn.ajaxform = function (options) {
        return $(this).each(function () {
            var $form = $(this);
            setAjaxForm($form, $.extend($form.data(), options));
        });
    };

    $(function () { $('.ajaxform').ajaxform(); });

}(CoreLib, window, undefined));

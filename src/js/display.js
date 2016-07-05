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

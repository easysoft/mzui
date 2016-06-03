/* ========================================================================
 * ZUI: ajaxaction.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, document, window){
    'use strict';

    var DISABLED = 'disabled';
    var ajaxaction = function(options, $element) {
        // console.log('ajaxaction', options, $element);
        options = $.extend({
            spinner: 'spinner-indicator'
        }, options);

        var callEvent = function(name, event) {
            if(options && $.isFunction(options[name])) {
                return options[name](event);
            }
        };

        if(options.confirm && !confirm(options.confirm)) return;

        if(callEvent('before') === false) return;
        if($element) {
            if($element.hasClass(DISABLED)) return false;
            $element.addClass(DISABLED);
            if(options.spinner) {
                var $spinner = $element.find('.icon-' + options.spinner);
                if($spinner.length) $spinner.removeClass('hidden');
                else $element.prepend('<i class="icon icon-spin icon-' + options.spinner + '"> </i>');
            }
        }

        $[options.method || 'get'](options.url, options.data, function(response, status){
            if(status == 'success') {
                try {
                    response = $.parseJSON(response);
                    if(response.result === 'success') {
                        callEvent('onResultSuccess', response);
                        if(response.message) {
                            $.messager.success(response.message);
                            if(response.locate) {
                                setTimeout(function(){location.href = response.locate;}, 1200);
                            }
                        } else {
                            if(response.locate) location.href = response.locate;
                        }
                    } else {
                        callEvent('onResultFailed', response);
                        if(response.message) {
                            $.messager.show(response.message);
                            if(response.locate) {
                                setTimeout(function(){location.href = response.locate;}, 1200);
                            }
                        }
                    }
                } catch(e) {
                    callEvent('onNoResponse');
                }
                callEvent('onSuccess', response);
            } else {
                callEvent('onError', status);
                if(window.v && window.v.lang.timeout) {
                    $.messager.danger(window.v.lang.timeout);
                }
            }

            if($element) {
                $element.removeClass(DISABLED);
                if(options.spinner) {
                    var $spinner = $element.find('.icon-' + options.spinner);
                    if($spinner.length) $spinner.addClass('hidden');
                }
            }
            callEvent('onComplete', {response: response, status: status});
        });
    };

    $.ajaxaction = ajaxaction; 

    $.fn.ajaxaction = function(options) {
        return this.each(function(){
            var $this   = $(this);
            var thisOption = $.extend({url: $this.attr('href')}, $this.data(), options);
            $this.on(thisOption.trigger || $.TapName, function(e) {
                e.preventDefault();
                ajaxaction(thisOption, $this);
            });
        });
    };

    $(document).on($.TapName, '.ajaxaction, [data-toggle="action"]', function(e) {
        var $this   = $(this);
        var options = $.extend({url: $this.attr('href')}, $this.data(), options);
        e.preventDefault();
        ajaxaction(options, $this);
    });
}(CoreLib, document, window));

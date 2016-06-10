/* ========================================================================
 * ZUI: ajaxform.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, window){
    'use strict';

    var NAME = '.ajaxform';

    var setAjaxForm = function($form, options)
    {
        if(!$form.length || $form.data(NAME)) return;
        $form.data(NAME, 1);

        var callEvent = function(name, event) {
            if(options && $.isFunction(options[name])) {
                return options[name].call(event);
            }
            $form.trigger(name + NAME, event);
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

        $form.submit(function(e) {
            var serializeArray = $form.serializeArray();
            var formData = {};
            $.each(serializeArray, function(idx, item) {
                formData[item.name] = item.value;
            });
            callEvent('onSubmit', formData);
            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');
            $.post($form.attr('action') || window.location.href, $.param(formData), function(response, status){
                if(status == 'success') {
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
                            if(response.message) {
                                if($.isPlainObject(response.message)) {
                                    $.each(response.message, function(msgId, msg) {
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
                                    showMessage(response.message);
                                }
                            }
                        }
                    } catch(e) {
                        showMessage(response || 'No response.');
                    }
                    callEvent('onResult', response);
                } else {
                    showMessage('error: ' + status);
                    callEvent('onError', status);
                    if(window.v && window.v.lang.timeout) {
                        $.messager.danger(window.v.lang.timeout);
                    }
                }
                $submitBtn.attr('disabled', null).removeClass('disabled loading');
                callEvent('onComplete', {response: response, status: status});
            });
            e.preventDefault();
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

}(CoreLib, window));

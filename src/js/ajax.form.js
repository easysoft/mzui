/* ========================================================================
 * ZUI: ajaxform.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
 * ======================================================================== */


(function($, window){
    'use strict';

    var NAME = '.ajaxform';
    var FINGERPRINT = 'Fingerprint';
    var savedFringetprint;

    var checkFingerprint = function($form) {
        var fingerprint = $.getFingerprint();
        var $fingerprint = $form.find('#fingerprint');
        if(!$fingerprint.length) {
            $form.append("<input type='hidden' id='fingerprint'  name='fingerprint' value='" + fingerprint + "'>");
        }
        $fingerprint.val(fingerprint);
    };

    var setSubmitButton = function($form, action) {
        var $btn = $form.find('[type="submit"]');
        var textMethodName = $btn.get(0).tagName === 'INPUT' ? 'val' : 'text';
        var disabled = action === 'disable';
        var loadingText = $btn.data('loading');
        var normalText = disabled ? $btn[textMethodName]() : $btn.data('normal');
        if(disabled) $btn.data('normal', normalText);

        $btn.attr('disabled', disabled ? 'disabled' : null);
        $btn[textMethodName](disabled ? loadingText : normalText);
    };

    var setAjaxForm = function($form, options)
    {
        if(!$form.length || $form.data(NAME)) return;
        $form.data(NAME, 1);

        var callEvent = function(name, event) {
            if(options && $.isFunction(options[name])) {
                return options[name](event);
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

        // check fringetprint
        if(options.checkfingerprint) checkFingerprint($form);

        $form.submit(function(e) {
            var serializeArray = $form.serializeArray();
            var formData = {};
            $.each(serializeArray, function(idx, item) {
                formData[item.name] = item.value;
            });
            callEvent('onSubmit', formData);

            setSubmitButton($form, 'disable');
            $.post($form.attr('action') || window.location.href, $.param(formData), function(response, status){
                if(status == 'success') {
                    try {
                        if(typeof response === 'string') response = $.parseJSON(response);
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
                            if(response.message) {
                                if($.isPlainObject(response.message)) {
                                    $.each(response.message, function(msgId, msg) {
                                        if($.isArray(msg) && msg.length) {
                                            msg = msg.length > 1? ('<ul><li>' + msg.join('</li><li>') + '</li></ul>') : msg[0];
                                        }
                                        var $group = $form.find('#' + msgId + ', [name="' + msgId + '"]').closest('.form-group');
                                        if($group.length) {
                                            var $msg = $group.find('.control-message');
                                            if(!$msg.length) {
                                                $group.append('<div class="control-message">' + msg + '</div>');
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
                    callEvent('onSuccess', response);
                } else {
                    showMessage('error: ' + status);
                    callEvent('onError', status);
                    if(window.v && window.v.lang.timeout) {
                        $.messager.danger(window.v.lang.timeout);
                    }
                }
                setSubmitButton($form);
                callEvent('onComplete', {response: response, status: status});
            });
            e.preventDefault();
        }).on('change', function(e){
            $form.find('.form-message').hide();
            $(e.target).closest('.form-group').removeClass('has-error');
        });
    };

    $.fn.ajaxform = function(options) {
        return $(this).each(function() {
            var $form = $(this);
            setAjaxForm($form, $.extend($form.data(), options));
        });
    };

    $.getFingerprint = function() {
        if(!savedFringetprint) {
            if($.isFunction(window[FINGERPRINT])) savedFringetprint = new window[FINGERPRINT]().get();
            else {
                savedFringetprint = '';
                $.each(navigator, function(key, value) {
                    if(typeof(value) == 'string') savedFringetprint += value.length;
                });
            }
        }
        return savedFringetprint;
    };

    $(function(){$('.ajaxform').ajaxform();});

}(Zepto, window));

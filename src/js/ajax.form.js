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

        $form.on('submit', function(e) {
            e.preventDefault();

            var form = $form[0];
            var formData = new FormData(form);
            callEvent('onSubmit', formData);
            
            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');

            $.ajax({
                url: form.action,
                type: form.method,
                processData: false,
                contentType: false,
                dataType: $form.data('type') || 'json',
                data: formData,
                processData: false,
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

}(CoreLib, window));

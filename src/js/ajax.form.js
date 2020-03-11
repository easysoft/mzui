/* ========================================================================
 * MZUI: ajaxform.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016-2020 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function ($, window, undefined) {
    'use strict';

    var NAME = 'mzui.ajaxform';

    var convertFormDataToObject = function(formData) {
        var object = {};
        $.each(Array.from(formData.keys()), function(index, key) {
            var value = formData.get(key);
            if (!object.hasOwnProperty(key)) {
                object[key] = value;
                return;
            }
            if(!$.isArray(object[key])){
                object[key] = [object[key]];
            }
            object[key].push(value);
        });
        return object;
    };

    var convertObjectToFormData = function(object) {
        if (object instanceof FormData) {
            return object;
        }
        var formData = new FormData();
        $.each(object, function(key, value) {
            if ($.isArray(value)) {
                $.each(value, function(index, val) {
                    formData.append(key, val);
                });
            } else {
                formData.append(key, value);
            }
        });
        return formData;
    };

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

            var formData = convertFormDataToObject(new FormData(form));
            var userSubmitData = callEvent('onSubmit', [formData]);
            if (userSubmitData === false) return;
            if (userSubmitData !== undefined) {
                formData = userSubmitData;
            }

            if (options.dataConverter) {
                formData = options.dataConverter(formData);
            }

            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');
            $.ajax({
                url: options.url || form.action,
                type: options.type || form.method,
                processData: false,
                async: false,
                contentType: false,
                dataType: options.dataType || $form.data('type') || 'json',
                data: convertObjectToFormData(formData),
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
                                var locate = options.locate || response.locate;
                                var locateHandler;
                                if(locate) {
                                    if ((locate === 'parent' || locate === 'top') && window[locate]) {
                                        locateHandler = window[locate].location.reload;
                                    } else if (locate === 'self' || locate === 'reload') {
                                        locateHandler = window.location.reload;
                                    } else {
                                        locateHandler = function() {
                                            window.location.href = locate;
                                        };
                                    }
                                }
                                if (response.message) {
                                    $.messager.success(response.message);
                                    if (locateHandler) {
                                        setTimeout(locateHandler, 1200);
                                    }
                                } else {
                                    if (locateHandler) locateHandler();
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
                    callEvent('onComplete', {xhr: xhr, status: status});
                }
            });
        }).on('change', function (e) {
            $form.find('.form-message').hide();
            $(e.target).closest('.control').removeClass('has-error');
        });

        callEvent('init');
    };

    $.ajaxForm = setAjaxForm;
    $.convertObjectToFormData = convertObjectToFormData;
    $.convertFormDataToObject = convertFormDataToObject;

    $.fn.ajaxform = function (options) {
        return $(this).each(function () {
            var $form = $(this);
            setAjaxForm($form, $.extend($form.data(), options));
        });
    };

    $(function () { $('.ajaxform').ajaxform(); });

}(CoreLib, window, undefined));

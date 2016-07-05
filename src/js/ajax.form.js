/* ========================================================================
 * MZUI: ajaxform.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, window, undefined){
    'use strict';

    var NAME = 'mzui.ajaxform';

    var setAjaxForm = function($form, options)
    {
        if(!$form.length || $form.data(NAME)) return;
        $form.data(NAME, 1);

        var callEvent = function(name, event) {
            if(options && $.isFunction(options[name])) {
                return options[name](event);
            }
            $form.trigger(name + '.' + NAME, event);
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
            var _formData = {};
            $.each($form.serializeArray(), function(idx, item) {
                var _name = item.name, 
                    _val = item.value,
                    _formVal = _formData[_name];
                if(_val instanceof FileList) {
                    var _fileVal = [];
                    for(var i = _val.length - 1; i >= 0; --i) {
                        _fileVal.push(_val[i]);
                    }
                    _val = _fileVal;
                }
                if($.isArray(_val)) {
                    if(_formVal === undefined) {
                        _formVal = _val;
                    } else if($.isArray(_formVal)) {
                        _formVal.push.apply(_formVal, _val);
                    } else {
                        _val.push(_formVal);
                        _formVal = _val;
                    }
                } else if(_name.lastIndexOf(']') === _name.length - 1) {
                    if(_formVal === undefined) {
                        _formVal = [_val];
                    } else {
                        _formVal.push(_val);
                    }
                } else {
                    _formVal = _val;
                }
                _formData[_name] = _formVal;
            });
            callEvent('onSubmit', _formData);

            var formData = new FormData();
            for (var key in _formData) {
                var _val = _formData[key];
                if($.isArray(_val)) {
                    for(var i = _val.length - 1; i >= 0; --i) {
                        formData.append(key, _val[i]);
                    }
                } else formData.append(key, _val);
            }
            var $submitBtn = $form.find('[type="submit"]').attr('disabled', 'disabled').addClass('disabled loading');
            $.ajax({
                url: form.action,
                type: form.method,
                processData: false,
                contentType: false,
                dataType: $form.data('type') || 'json',
                data: formData,
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
                            var message = response.message || response.reason || response.error;
                            if(message) {
                                if($.isPlainObject(message)) {
                                    $.each(message, function(msgId, msg) {
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
                                    showMessage(message);
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

}(CoreLib, window, undefined));

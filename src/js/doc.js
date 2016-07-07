/* ========================================================================
 * MZUI: doc.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

$(function() {
    var $fabNav = $('#fabNav'),
        $partial = $('#partial'),
        $tocList = $('#tocList'),
        $navs = $('#navs'),
        $modalHeading = $('#tocHeading'),
        $headNav = $('#headNav'),
        scrollTopOffset = $headNav.height() * 2 + 10;

    $headNav.display({
        selector: 'a:not(.brand-name)',
        activeClass: 'active',
        target: '#navs',
        trigger: 'click',
        name: 'headNav',
        animate: false,
        show: function() {
            $partial.empty();
            $('body').removeClass('has-index-content');
        },
        displayed: function(options) {
            $('#navs > a[data-display-auto]').trigger('click');
        }
    });

    $navs.display({
        selector: 'a',
        activeClass: 'active',
        target: '#partial',
        trigger: 'click',
        targetZIndex: 'none',
        name: 'navs',
        show: function() {
            $fabNav.addClass('disabled');
        },
        shown: function() {
            $fabNav.removeClass('disabled');
            $tocList.empty();
        },
        displayed: function(options) {
            var $parent = $headNav.children('.active');
            var parentName = $parent.data('pageName');
            var parentTitle = $parent.text();
            var $element = $(options.element);
            var elementName = $element.attr('href').replace('doc/part/', '');
            var gaOptions = {
                hitType: 'pageview', 
                page: window.location.pathname + parentName + '/' + elementName, 
                title: parentTitle + ' > ' + $element.text()
            };
            ga('send', gaOptions);

            $fabNav.toggleClass('hidden', !$partial.find('.section').children('.heading').children('.title').length);
        }
    });

    $('#tocBtn').display({
        triggerMethod: 'toggle',
        target: '#tocModal',
        backdrop: true,
        targetDismiss: true,
        name: 'tocModal',
        show: function() {
            $fabNav.addClass('open').find('.btn').removeClass('primary');
            if($tocList.children().length) return;
            $partial.children('.section').each(function(idx) {
                var $section = $(this);
                var sectionId = 'section-' + idx;
                $section.attr('id', sectionId);
                $tocList.append('<a class="item" data-target="#' + sectionId + '">' + $section.children('.heading').find('.title').text() + '</a>')
            });
            $modalHeading.text($('#navs > .active').text());

        },
        hide: function() {
            $fabNav.removeClass('open').find('.btn').addClass('primary');
        }
    });

    $tocList.on('click', 'a', function(e) {
        var $section = $($(this).data('target'));
        $(window).scrollTop($section.offset().top - scrollTopOffset);
        e.preventDefault();
    });

    $(document).on('display.displayed', function(e, display, $trigger, options) {
        if(window.prettyPrint && options.$target && options.$target.find('.prettyprint').length) {
            window.prettyPrint();
        }
    });

    $(document).on($.TapName, '.btn-begin', function() {
        $('#beginLink').trigger('click');
    });

    if($(window).width() > 1200) {
        $.messager.warning("MZUI 专为移动端设计，在移动设备上访问效果更佳。", {placement: 'top-center', targetZIndex: 3000});
    }
});

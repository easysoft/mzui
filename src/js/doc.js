/* ========================================================================
 * MZUI: doc.js
 * https://github.com/easysoft/mzui
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

$(function() {
    $('#headNav').display({
        selector: 'a:not(.brand-name)',
        activeClass: 'active',
        target: '#navs',
        trigger: 'click',
        name: 'headNav',
        animate: false,
        show: function() {
            $('body').removeClass('has-index-content');
        },
        shown: function() {
            $('#navs > a[data-display-auto]').trigger('click');
        }
    });

    var $fabNav = $('#fabNav'),
        $partial = $('#partial'),
        $tocList = $('#tocList'),
        $navs = $('#navs'),
        $modalHeading = $('#tocHeading'),
        scrollTopOffset = $('#headNav').height() * 2 + 10;

    $navs.display({
        selector: 'a',
        activeClass: 'active',
        target: '#partial',
        trigger: 'click',
        name: 'navs',
        show: function() {
            $fabNav.addClass('disabled');
        },
        shown: function() {
            $fabNav.removeClass('disabled');
            $tocList.empty();
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
        console.log($section.offset().top - scrollTopOffset);
        $(window).scrollTop($section.offset().top - scrollTopOffset);
        e.preventDefault();
    });

    $(document).on('display.displayed', function(e, display, $trigger, options) {
        if(window.prettyPrint && options.$target && options.$target.find('.prettyprint').length) {
            window.prettyPrint();
        }
    });

    $('#beginBtn').on($.TapName, function() {
        $('#beginLink').trigger('click');
    });
});

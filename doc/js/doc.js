/*!
 * mzui - v1.0.0 - 2016-06-09
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 */

$(function() {
    $('#headNav').display({
        selector: 'a:not(.brand-name)',
        activeClass: 'active',
        target: '#navs',
        trigger: 'click',
        animate: false,
        load: true,
        shown: function() {
            $('#navs > a[data-display-auto]').trigger('click');
        }
    });
});

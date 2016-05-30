/* ========================================================================
 * ZUI: skin.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
 * ======================================================================== */


(function($, undefined){
    'use strict';

    var NAME = 'mzui.skin',
        allSkins = {};

    var Skin = function($element, options) {
        var that     = this;
        that.options = options = $.extend({}, Skin.DEFAULT, $element.data(), options);
        that.$       = $element;

        that.paint();
    };

    Skin.prototype.paint = function(skin) {
        var that = this;
        var options = that.options,
            $e = that.$;
        var isPale = that.$.hasClass('pale') || options.pale,
            isOutline = options.outline || $e.hasClass('outline'),
            isTextTint = options.tint || $e.hasClass('text-tint'),
            color, skinName;

        skin = skin === undefined ? options.skin : skin;
        if(isPale === undefined && (that.$.hasClass('dark') || options.dark)) isPale = false;

        if($.isStr(skin) && skin.indexOf(':') > 0) {
            skin = skin.split(':');
            skinName = skin[0];
            skin = skin[1];
            var skinNum = parseInt(skin);
            if(skinNum !== NaN) skin = skinNum;
        }

        if(skin === '' || skin === undefined || skin === 'random') {
            skin = Math.round(Math.random() * 360);
        } else if(allSkins[skin]) {
            skin = allSkins[skin];
        } else if($.isStr(skin) && skin.indexOf('random') === 0) {
            allSkins[skin] = skin = Math.round(Math.random() * 360);
        }

        if(skinName) allSkins[skinName] = skin;

        if(typeof skin === 'number') {
            color = new $.Color({h: (skin * options.hueSpace) % 360, s: options.saturation, l: options.lightness});
        } else {
            color = new $.Color(skin);
        }

        that.color = color;
        if(color.luma() < options.threshold) { //  color is dark color
            if(isPale) {
                that.darkColor = color;
                that.color     = new $.Color($.extend(color.toHsl(), {l: options.paleLight}));
            }
        } else {
            if(isPale === false) {
                that.paleColor = color;
                that.color = new $.Color($.extend(color.toHsl(), {l: options.darkLight}));
            } else {
                isPale = true;
                if(isTextTint) that.darkColor = new $.Color($.extend(color.toHsl(), {l: options.darkLight}));
            }
        }

        var colorCss  = that.color.toCssStr();
        var cssStyle  = {
            backgroundColor: isOutline ? 'transparent' : colorCss,
            borderColor: colorCss,
            color: isOutline ? colorCss : (!isPale ? '#fff' : (isTextTint ? that.darkColor.toCssStr() : ''))
        };

        if(that.$.callEvent(that, 'paint', cssStyle) !== false) $e.css(cssStyle);
    };

    Skin.NAME = NAME;
    Skin.DEFAULT = {
        skin: 'random',
        hueSpace: 47,
        saturation: 0.7,
        lightness: 0.6,
        threshold: 0.5,
        darkLight: 0.4,
        paleLight: 0.92
    };

    Skin.all = allSkins;
    Skin.set = function(name, skin) {
        if($.isPlainObject(name)) {
            $.extend(Skin.all, name, skin);
        } else {
            Skin.all[name] = skin;
        }
        $('[data-skin]').skin('paint');
    };

    $.bindFn('skin', Skin);
    $.Skin = Skin;

    $(function() {
        $('[data-skin]').skin();
    });
}(CoreLib, undefined));

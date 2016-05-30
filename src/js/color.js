/* ========================================================================
 * ZUI: color.js
 * http://zui.sexy
 * ========================================================================
 * Copyright (c) 2014 cnezsoft.com; Licensed MIT
 * ======================================================================== */


!(function($, Math, undefined) {
    'use strict';

    var hexReg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/,
        N255 = 255,
        N360 = 360,
        N100 = 100,
        STR_STRING = 'string',
        STR_OBJECT = 'object';

    var isUndefined = function(x) {
        return x === undefined;
    };

    var isNotUndefined = function(x) {
        return !isUndefined(x);
    };

    var convertToInt = function(x) {
        return parseInt(x);
    };

    var clampNumber = function(x, max) {
        return clamp(number(x), max);
    };

    var convertToRgbInt = function(x) {
        return convertToInt(clampNumber(x, N255));
    };

    /* color */
    var Color = function(r, g, b, a) {
        var that = this;
        that.r = that.g = that.b = 0;
        that.a = 1;

        if(isNotUndefined(a)) that.a = clampNumber(a, 1);
        if(isNotUndefined(r) && isNotUndefined(g) && isNotUndefined(b)) {
            that.r = convertToRgbInt(r);
            that.g = convertToRgbInt(g);
            that.b = convertToRgbInt(b);
        } else if(isNotUndefined(r)) {
            var type = typeof(r);
            if(type == STR_STRING) {
                r = r.toLowerCase();
                if(r === 'transparent') {
                    that.a = 0;
                } else {
                    that.rgb(hexToRgb(r));
                }
            } else if(type == 'number' && isUndefined(g)) {
                that.r = that.g = that.b = convertToRgbInt(r);
            } else if(type == STR_OBJECT && isNotUndefined(r.r)) {
                that.r = convertToRgbInt(r.r);
                if(isNotUndefined(r.g)) that.g = convertToRgbInt(r.g);
                if(isNotUndefined(r.b)) that.b = convertToRgbInt(r.b);
                if(isNotUndefined(r.a)) that.a = clampNumber(r.a, 1);
            } else if(type == STR_OBJECT && isNotUndefined(r.h)) {
                var hsl = {
                    h: clampNumber(r.h, N360),
                    s: 1,
                    l: 1,
                    a: 1
                };
                if(isNotUndefined(r.s)) hsl.s = clampNumber(r.s, 1);
                if(isNotUndefined(r.l)) hsl.l = clampNumber(r.l, 1);
                if(isNotUndefined(r.a)) hsl.a = clampNumber(r.a, 1);

                that.rgb(hslToRgb(hsl));
            }
        }
    };

    Color.prototype.rgb = function(rgb) {
        var that = this;
        if(isNotUndefined(rgb)) {
            if(typeof(rgb) == STR_OBJECT) {
                if(isNotUndefined(rgb.r)) that.r = convertToRgbInt(rgb.r);
                if(isNotUndefined(rgb.g)) that.g = convertToRgbInt(rgb.g);
                if(isNotUndefined(rgb.b)) that.b = convertToRgbInt(rgb.b);
                if(isNotUndefined(rgb.a)) that.a = clampNumber(rgb.a, 1);
            } else {
                var v = convertToInt(number(rgb));
                that.r = v;
                that.g = v;
                that.b = v;
            }
            return that;
        } else return {
            r: that.r,
            g: that.g,
            b: that.b,
            a: that.a
        };
    };

    Color.prototype.hue = function(hue) {
        var that = this;
        var hsl = that.toHsl();

        if(isUndefined(hue)) return hsl.h;
        else {
            hsl.h = clampNumber(hue, N360);
            that.rgb(hslToRgb(hsl));
            return that;
        }
    };

    Color.prototype.darken = function(amount) {
        var that = this;
        var hsl = that.toHsl();

        hsl.l -= amount / N100;
        hsl.l = clamp(hsl.l, 1);

        that.rgb(hslToRgb(hsl));
        return that;
    };

    Color.prototype.clone = function() {
        var that = this;
        return new Color(that.r, that.g, that.b, that.a);
    };

    Color.prototype.lighten = function(amount) {
        return this.darken(-amount);
    };

    Color.prototype.fade = function(amount) {
        this.a = clamp(amount / N100, 1);

        return this;
    };

    // Color.prototype.spin = function(amount) {
    //     var hsl = this.toHsl();
    //     var hue = (hsl.h + amount) % N360;

    //     hsl.h = hue < 0 ? N360 + hue : hue;
    //     return this.rgb(hslToRgb(hsl));
    // };

    Color.prototype.toHsl = function() {
        var that = this;
        var r = that.r / N255,
            g = that.g / N255,
            b = that.b / N255,
            a = that.a;

        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2,
            d = max - min;

        if(max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch(max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return {
            h: h * N360,
            s: s,
            l: l,
            a: a
        };
    };

    Color.prototype.luma = function() {
        var r = this.r / N255,
            g = this.g / N255,
            b = this.b / N255;

        r = (r <= 0.03928) ? r / 12.92 : Math.pow(((r + 0.055) / 1.055), 2.4);
        g = (g <= 0.03928) ? g / 12.92 : Math.pow(((g + 0.055) / 1.055), 2.4);
        b = (b <= 0.03928) ? b / 12.92 : Math.pow(((b + 0.055) / 1.055), 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    Color.prototype.saturate = function(amount) {
        var hsl = this.toHsl();

        hsl.s += amount / N100;
        hsl.s = clamp(hsl.s);

        return this.rgb(hslToRgb(hsl));
    };

    // Color.prototype.desaturate = function(amount) {
    //     return this.saturate(-amount);
    // };

    Color.prototype.contrast = function(dark, light, threshold) {
        if(isUndefined(light)) light = new Color(N255, N255, N255, 1);
        else light = new Color(light);
        if(isUndefined(dark)) dark = new Color(0, 0, 0, 1);
        else dark = new Color(dark);

        if(this.a < 0.5) return dark;

        if(isUndefined(threshold)) threshold = 0.43;
        else threshold = number(threshold);

        if(dark.luma() > light.luma()) {
            var t = light;
            light = dark;
            dark = t;
        }

        if(this.luma() < threshold) {
            return light;
        } else {
            return dark;
        }
    };

    Color.prototype.hexStr = function() {
        var toHexValue = function(x) {
            x = x.toString(16);
            return x.length == 1 ? ('0' + x) : x;
        };
        return '#' + toHexValue(this.r) + toHexValue(this.g) + toHexValue(this.b);
    };

    Color.prototype.toCssStr = function() {
        var that = this;
        if(that.a > 0) {
            if(that.a < 1) {
                return 'rgba(' + that.r + ',' + that.g + ',' + that.b + ',' + that.a + ')';
            } else {
                return that.hexStr();
            }
        } else {
            return 'transparent';
        }
    };

    Color.isColor = isColor;

    /* helpers */
    function hexToRgb(hex) {
        hex = hex.toLowerCase();
        if(hex && hexReg.test(hex)) {
            var i;
            if(hex.length === 4) {
                var hexNew = '#';
                for(i = 1; i < 4; i += 1) {
                    hexNew += hex.slice(i, i + 1).concat(hex.slice(i, i + 1));
                }
                hex = hexNew;
            }

            var hexChange = [];
            for(i = 1; i < 7; i += 2) {
                hexChange.push(convertToInt('0x' + hex.slice(i, i + 2)));
            }
            return {
                r: hexChange[0],
                g: hexChange[1],
                b: hexChange[2],
                a: 1
            };
        } else {
            throw new Error('Wrong hex string! (hex: ' + hex + ')');
        }
    }

    function isColor(hex) {
        return typeof(hex) === STR_STRING && (hex.toLowerCase() === 'transparent' || hexReg.test($.trim(hex.toLowerCase())));
    }

    function hslToRgb(hsl) {
        var h = hsl.h,
            s = hsl.s,
            l = hsl.l,
            a = hsl.a;

        h = (number(h) % N360) / N360;
        s = clampNumber(s);
        l = clampNumber(l);
        a = clampNumber(a);

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        var r = {
            r: hue(h + 1 / 3) * N255,
            g: hue(h) * N255,
            b: hue(h - 1 / 3) * N255,
            a: a
        };

        return r;

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if(h * 6 < 1) {
                return m1 + (m2 - m1) * h * 6;
            } else if(h * 2 < 1) {
                return m2;
            } else if(h * 3 < 2) {
                return m1 + (m2 - m1) * (2 / 3 - h) * 6;
            } else {
                return m1;
            }
        }
    }

    function fit(n, end, start) {
        if(isUndefined(start)) start = 0;
        if(isUndefined(end)) end = N255;

        return Math.min(Math.max(n, start), end);
    }

    function clamp(v, max) {
        return fit(v, max);
    }

    function number(n) {
        if(typeof(n) == 'number') return n;
        return parseFloat(n);
    }

    $.Color = Color;

}(CoreLib, Math, undefined));


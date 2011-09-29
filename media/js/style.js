// Universal Subtitles, universalsubtitles.org
//
// Copyright (C) 2010 Participatory Culture Foundation
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see
// http://www.gnu.org/licenses/agpl-3.0.html.

/**
 * @fileoverview Rewrite of some goog.style that always sets !important,
 *     for use with cleanslatecss.
 */

goog.provide('unisubs.style');

unisubs.style.makeCssPropertyRegex_ = function(property) {
    return new RegExp('\\s*' + property + '\\s*:\\s*[^;]*;?', 'i');
};

unisubs.style.findCssProperty_ = function(css, property) {
    return css.match(unisubs.style.makeCssPropertyRegex_(property));
};

/**
 *
 * @param {Element} elem
 * @param {string} property
 * @param {?string} value or null (to unset)
 */
unisubs.style.setProperty = function(elem, property, value) {
    elem.style.cssText = unisubs.style.setPropertyInString(
        elem.style.cssText, property, value);
};

unisubs.style.setPropertyInString = function(cssString, property, value) {
    var oldDeclaration = unisubs.style.findCssProperty_(
        cssString, property);
    var newDeclaration = 
        goog.isNull(value) ? 
            '' : [property, ':', value, ' !important;'].join('');
    if (oldDeclaration)
        return cssString.replace(oldDeclaration[0], newDeclaration);
    else {
        cssString = goog.string.trim(cssString);
        if (cssString.length > 0 && !goog.string.endsWith(cssString, ';'))
            cssString += ';';
        return cssString + newDeclaration;
    }
};

unisubs.style.makeStylesImportant = function(elem) {
    var css = goog.style.parseStyleAttribute(elem.style.cssText);
    goog.object.forEach(
        css,
        function(value, key) {
            if (value.indexOf("!important") == -1) {
                unisubs.style.setProperty(elem, key, value);
            }
        });
};

/**
 * Sets the width/height values of an element.  If an argument is numeric,
 * or a goog.math.Size is passed, it is assumed to be pixels and will add
 * 'px' after converting it to an integer in string form. (This just sets the
 * CSS width and height properties so it might set content-box or border-box
 * size depending on the box model the browser is using.)
 *
 * @param {Element} element Element to set the size of.
 * @param {string|number|goog.math.Size} w Width of the element, or a
 *     size object.
 * @param {string|number=} opt_h Height of the element. Required if w is not a
 *     size object.
 */
unisubs.style.setSize = function(element, w, opt_h) {
    var wh = unisubs.style.processWidthHeightArgs_(w, opt_h);
    unisubs.style.setWidth(element, /** @type {string|number} */ (wh[0]));
    unisubs.style.setHeight(element, /** @type {string|number} */ (wh[1]));
};

unisubs.style.setSizeInString = function(cssString, w, opt_h) {
    var wh = unisubs.style.processWidthHeightArgs_(w, opt_h);
    cssString = unisubs.style.setPropertyInString(
        cssString, 'width', unisubs.style.getPixelStyleValue_(wh[0]));
    return unisubs.style.setPropertyInString(
        cssString, 'height', unisubs.style.getPixelStyleValue_(wh[1]));
};

unisubs.style.processWidthHeightArgs_ = function(w, opt_h) {
    var h;
    if (w instanceof goog.math.Size) {
        h = w.height;
        w = w.width;
    } else {
        if (opt_h == undefined) {
            throw Error('missing height argument');
        }
        h = opt_h;
    }
    return [w, h];
};

unisubs.style.getPixelStyleValue_ = function(value, round) {
    return goog.isNumber(value) ? 
        ((round ? Math.round(value) : value) + 'px') : value;
};

unisubs.style.setPixelStyleProperty_ = function(property, round, element, value) {
    unisubs.style.setProperty(
        element, property, 
        /** @type {string} */(unisubs.style.getPixelStyleValue_(value)));
};

unisubs.style.setHeight = goog.partial(
    unisubs.style.setPixelStyleProperty_, 'height', true);

unisubs.style.setWidth = goog.partial(
    unisubs.style.setPixelStyleProperty_, 'width', true);

unisubs.style.setPosition = function(el, opt_arg1, opt_arg2) {
    var x, y;
    var buggyGeckoSubPixelPos = goog.userAgent.GECKO &&
        (goog.userAgent.MAC || goog.userAgent.X11) &&
        goog.userAgent.isVersion('1.9');

    if (goog.isDefAndNotNull(opt_arg1) && 
        opt_arg1 instanceof goog.math.Coordinate) {
        x = opt_arg1.x;
        y = opt_arg1.y;
    } else {
        x = opt_arg1;
        y = opt_arg2;
    }

    if (goog.isDefAndNotNull(x))
        unisubs.style.setPixelStyleProperty_(
            'left', buggyGeckoSubPixelPos, el,
            /** @type {number|string} */ (x));
    if (goog.isDefAndNotNull(y))
        unisubs.style.setPixelStyleProperty_(
            'top', buggyGeckoSubPixelPos, el,
            /** @type {number|string} */ (y));
};

unisubs.style.showElement = function(el, display) {
    unisubs.style.setProperty(el, 'display', display ? null : 'none');
};

unisubs.style.setVisibility = function(el, visible) {
    unisubs.style.setProperty(
        el, 'visibility', visible ? 'visible' : 'hidden');
};

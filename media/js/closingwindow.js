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

goog.provide('unisubs.ClosingWindow');

/**
 * @constructor
 * This is a singleton, so use unisubs.ClosingWindow.getInstance() instead.
 */
unisubs.ClosingWindow = function() {
    goog.events.EventTarget.call(this);
    var w = window;
    var oldOnBeforeUnload = w.onbeforeunload,
        oldOnUnload = w.onunload;
    var that = this;
    w.onbeforeunload = function(evt) {
        var ret, oldRet;
        try {
            ret = that.beforeunload_();
        } finally {
            oldRet = oldOnBeforeUnload && oldOnBeforeUnload(evt);
        }
        if (ret != null)
            return ret;
        if (oldRet != null)
            return oldRet;
        // returns undefined.
    };
    w.onunload = function(evt) {
        try {
            that.unload_();
        }
        finally {
            oldOnUnload && oldOnUnload(evt);
            w.onresize = null;
            w.onscroll = null;
            w.onbeforeunload = null;
            w.onunload = null;
        }
    };
};
goog.inherits(unisubs.ClosingWindow, goog.events.EventTarget);
goog.addSingletonGetter(unisubs.ClosingWindow);

unisubs.ClosingWindow.BEFORE_UNLOAD = 'beforeunload';
unisubs.ClosingWindow.UNLOAD = 'unload';

unisubs.ClosingWindow.prototype.beforeunload_ = function() {
    var event = new unisubs.ClosingWindow.BeforeUnloadEvent();
    goog.events.dispatchEvent(this, event);
    return event.message;
};

unisubs.ClosingWindow.prototype.unload_ = function() {
    this.dispatchEvent(unisubs.ClosingWindow.UNLOAD);
};

/**
* @constructor
*
*/
unisubs.ClosingWindow.BeforeUnloadEvent = function() {
    goog.events.Event.call(this, unisubs.ClosingWindow.BEFORE_UNLOAD);
    this.message = null;
};
goog.inherits(unisubs.ClosingWindow.BeforeUnloadEvent, goog.events.Event);

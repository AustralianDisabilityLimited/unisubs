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

goog.provide('unisubs.streamer.StreamSub');

/**
 * @constructor
 */
unisubs.streamer.StreamSub = function(span) {
    goog.events.EventTarget.call(this);
    this.span_ = span;
    this.html_ = span.innerHTML;
    var match = unisubs.streamer.StreamSub.SUBRE_.exec(span.id);
    /**
     * @const
     */
    this.VIDEO_ID = match[1];
    /**
     * @const
     */
    this.SUBTITLE_ID = match[2];
    goog.events.listen(
        this.span_,
        goog.events.EventType.MOUSEOVER,
        goog.bind(this.mouseover_, this));
    goog.events.listen(
        this.span_,
        goog.events.EventType.MOUSEOUT,
        goog.bind(this.mouseout_, this));
    goog.events.listen(
        this.span_,
        goog.events.EventType.CLICK,
        goog.bind(this.click_, this));
};
goog.inherits(unisubs.streamer.StreamSub, goog.events.EventTarget);

unisubs.streamer.StreamSub.SUB_CLICKED = 'subclicked';

unisubs.streamer.StreamSub.highlighted_ = null;
unisubs.streamer.StreamSub.SUBRE_ = /usub\-(\w+)\-(\w+)/;

unisubs.streamer.StreamSub.prototype.display = function(displayed) {
    goog.dom.classes.enable(this.span_, 'unisubs-sub-current', displayed);
};

unisubs.streamer.StreamSub.prototype.getSpan = function() {
    return this.span_;
};

unisubs.streamer.StreamSub.prototype.reset = function() {
    this.span_.innerHTML = this.html_;
};

unisubs.streamer.StreamSub.prototype.mouseover_ = function(e) {
    if (goog.dom.contains(this.span_, e.target) &&
        !goog.dom.contains(this.span_, e.relatedTarget)) {
        if (unisubs.streamer.StreamSub.highlighted_ && 
            this != unisubs.streamer.StreamSub.highlighted_) {
            goog.dom.classes.remove(
                unisubs.streamer.StreamSub.highlighted_.getSpan(),
                'highlighted');
            unisubs.streamer.StreamSub.highlighted_ = null;
        }
        unisubs.streamer.StreamSub.highlighted_ = this;
        goog.dom.classes.add(this.getSpan(), 'highlighted');
    }
};

unisubs.streamer.StreamSub.prototype.mouseout_ = function(e) {
    if (goog.dom.contains(this.span_, e.target) &&
        e.relatedTarget &&
        !goog.dom.contains(this.span_, e.relatedTarget) &&
        this == unisubs.streamer.StreamSub.highlighted_) {
        goog.dom.classes.remove(this.getSpan(), 'highlighted');
        unisubs.streamer.StreamSub.highlighted_ = null;
    }
};

unisubs.streamer.StreamSub.prototype.click_ = function(e) {
    this.dispatchEvent(unisubs.streamer.StreamSub.SUB_CLICKED);
};

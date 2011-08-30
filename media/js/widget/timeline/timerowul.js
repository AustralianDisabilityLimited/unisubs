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

goog.provide('unisubs.timeline.TimeRowUL');

/**
 * @constructor
 * @extends goog.ui.Component
 * @param {number} spacing Spacing between major ticks, in seconds.
 * @param {number} first time for this timerow ul, in seconds.
 */
unisubs.timeline.TimeRowUL = function(spacing, firstTime) {
    goog.ui.Component.call(this);
    this.firstTime_ = firstTime;
    this.spacing_ = spacing;
    this.majorTicks_ = [];
};
goog.inherits(unisubs.timeline.TimeRowUL, goog.ui.Component);
unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS = 15;
unisubs.timeline.TimeRowUL.PX_PER_TICK = 65;
unisubs.timeline.TimeRowUL.DOUBLECLICK = 'timerowdblclick';
unisubs.timeline.TimeRowUL.prototype.createDom = function() {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.setElementInternal($d('ul', 'unisubs-timeline-time'));
    var el = this.getElement();
    unisubs.style.setWidth(
        el,
        unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS *
            unisubs.timeline.TimeRowUL.PX_PER_TICK);
    unisubs.style.setPosition(
        el, this.firstTime_ / this.spacing_ *
            unisubs.timeline.TimeRowUL.PX_PER_TICK,
        null);
    this.majorTicks_ = [];
    var i;
    for (i = 0; i < unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS; i++) {
        var tick = $d('li');
        el.appendChild(tick);
        this.majorTicks_.push(tick);
    }
    this.setFirstTime(this.firstTime_);
};
unisubs.timeline.TimeRowUL.prototype.enterDocument = function() {
    unisubs.timeline.TimeRowUL.superClass_.enterDocument.call(this);
    this.getHandler().listen(
        this.getElement(),
        goog.events.EventType.DBLCLICK,
        this.doubleClicked_);
};
unisubs.timeline.TimeRowUL.prototype.doubleClicked_ = function(e) {
    this.dispatchEvent(
        new unisubs.timeline.TimeRowUL.DoubleClickEvent(
            this.firstTime_ + e.offsetX * this.spacing_ /
                unisubs.timeline.TimeRowUL.PX_PER_TICK));
};
unisubs.timeline.TimeRowUL.prototype.setFirstTime = function(time) {
    time = Math.max(0, time);
    time = Math.floor(time / this.spacing_) * this.spacing_;
    this.firstTime_ = time;
    this.lastTime_ = time + this.spacing_ *
        unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS;
    var i, seconds;
    for (i = 0; i < unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS; i++) {
        seconds = this.firstTime_ + i * this.spacing_;
        goog.dom.setTextContent(
            this.majorTicks_[i],
            unisubs.formatTime(seconds >= 0 ? ('' + seconds) : '', true));
    }
};
unisubs.timeline.TimeRowUL.prototype.getFirstTime = function() {
    return this.firstTime_;
};
unisubs.timeline.TimeRowUL.prototype.getLastTime = function() {
    return this.lastTime_;
};

/**
* @constructor
*/
unisubs.timeline.TimeRowUL.DoubleClickEvent = function(time) {
    this.type = unisubs.timeline.TimeRowUL.DOUBLECLICK;
    this.time = time;
};
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

goog.provide('unisubs.timeline.TimeRow');
/**
* @constructor
* @extends goog.ui.Component
*/
unisubs.timeline.TimeRow = function(timelineInner, spacing) {
    goog.ui.Component.call(this);
    this.timelineInner_ = timelineInner;
    this.spacing_ = spacing;
    this.secondsPerUL_ = spacing * unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS;
    this.pixelsPerUL_ = unisubs.timeline.TimeRowUL.NUM_MAJOR_TICKS *
        unisubs.timeline.TimeRowUL.PX_PER_TICK;
    this.uls_ = [];

    var imagesPath = unisubs.staticURL + 'images/';
    this.openHandStyle_ = goog.style.cursor.getDraggableCursorStyle(
        imagesPath);
    this.closedHandStyle_ = goog.style.cursor.getDraggingCursorStyle(
        imagesPath);
};
goog.inherits(unisubs.timeline.TimeRow, goog.ui.Component);
unisubs.timeline.TimeRow.prototype.createDom = function() {
    unisubs.timeline.TimeRow.superClass_.createDom.call(this);
    var el = this.getElement();
    el.className = 'unisubs-timerow';
    this.ensureVisible(0);

    unisubs.style.setProperty(el, 'cursor', this.openHandStyle_);

    // Dragger has a default action that cannot be overridden.  Kind of pointless
    // to subclass just to override that, so instead the variable is being
    // overwritten.
    this.dragger_ = new goog.fx.Dragger(el);
    this.dragger_.defaultAction = function(x,y) {};
};
unisubs.timeline.TimeRow.prototype.enterDocument = function() {
    unisubs.timeline.Timeline.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(
            this.dragger_,
            goog.fx.Dragger.EventType.BEFOREDRAG,
            goog.bind(this.timelineInner_.beforeDrag, this.timelineInner_)).
        listen(
            this.dragger_,
            goog.fx.Dragger.EventType.START,
            goog.bind(this.timelineInner_.startDrag, this.timelineInner_)).
        listen(
            this.dragger_,
            goog.fx.Dragger.EventType.DRAG,
            goog.bind(this.timelineInner_.onDrag, this.timelineInner_)).
        listen(
            this.dragger_,
            goog.fx.Dragger.EventType.END,
            goog.bind(this.timelineInner_.endDrag, this.timelineInner_));
};
unisubs.timeline.TimeRow.prototype.ensureVisible = function(time) {
    // always reaching 20 seconds into the future.
    var $d =
        goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    while (this.uls_.length * this.secondsPerUL_ < time + 20) {
        var row = new unisubs.timeline.TimeRowUL(
            this.spacing_,
            this.uls_.length * this.secondsPerUL_);
        this.addChild(row, true);
        this.uls_.push(row);
    }
};
unisubs.timeline.TimeRow.prototype.changeCursor = function(closed) {
    unisubs.style.setProperty(
        this.getElement(),
        closed ? this.closedHandStyle_ : this.openHandStyle_);
}
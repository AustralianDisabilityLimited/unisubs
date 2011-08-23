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

goog.provide('unisubs.Spinner');

/**
 * @constructor
 * @extends goog.ui.Component
 *
 * @param {number} value
 * @param {function():number} minFn A function that returns the
 *     min value for this spinner.
 * @param {function():number} maxFn A function that returns the
 *     max value for this spinner.
 * @param {function(number):string} valueExpression
 */
unisubs.Spinner = function(value, minFn, maxFn, valueExpression) {
    goog.ui.Component.call(this);
    this.timer_ = new goog.Timer(100);
    this.speed_ = unisubs.Spinner.INITIAL_SPEED;
    this.counter_ = 0;
    this.value_ = value;
    this.minFn_ = minFn;
    this.maxFn_ = maxFn;
    this.maxStep_ = 0.10;
    this.minStep_ = 0.05;
    this.stepIncrease_ = 0.05;
    this.step_ = this.minStep_;
    this.enabled_ = true;
    this.increment_ = true;
    this.valueExpression_ = valueExpression;
    /**
     * True iff the user has mouse down on an arrow.
     */
    this.activated_ = false;
};
goog.inherits(unisubs.Spinner, goog.ui.Component);

unisubs.Spinner.EventType = {
    /**
     * Dispatched when arrow button is first pressed.
     */
    ARROW_PRESSED: "arrowPressed",
    /**
     * Dispatched when arrow button is let go of, either by
     * mouseup or mouseout
     */
    VALUE_CHANGED: "valueChanged"
};
unisubs.Spinner.INITIAL_SPEED = 4;
unisubs.Spinner.prototype.createDom = function() {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.valueSpan_ = $d('span', 'unisubs-timestamp-time');
    this.upAnchor_ =
        $d('a', {'className': 'unisubs-up', 'href':'#'}, "Up");
    this.downAnchor_ =
        $d('a', {'className': 'unisubs-down', 'href':'#'}, "Down");
    this.setElementInternal(
        $d('span', null,
           this.valueSpan_,
           $d('span', 'unisubs-changeTime',
              this.upAnchor_,
              this.downAnchor_)));
    this.updateText_();
};
unisubs.Spinner.prototype.enterDocument = function() {
    unisubs.Spinner.superClass_.enterDocument.call(this);
    goog.array.forEach(
        [this.upAnchor_, this.downAnchor_],
        this.addAnchorEventHandlers_, this);
    this.getHandler().listen(this.timer_, goog.Timer.TICK, this.timerTick_);
};
unisubs.Spinner.prototype.addAnchorEventHandlers_ = function(elem) {
    var et = goog.events.EventType;
    this.getHandler().
        listen(elem, et.CLICK, function(e) { e.preventDefault(); }).
        listen(elem, et.MOUSEDOWN, this.mouseDown_).
        listen(elem, et.MOUSEUP, this.mouseUp_).
        listen(elem, et.MOUSEOUT, this.mouseOut_);
};
unisubs.Spinner.prototype.updateText_ = function() {
    var displayValue = 
    unisubs.subtitle.EditableCaption.isTimeUndefined(this.value_) ?
         "" : this.value_;
    goog.dom.setTextContent(this.valueSpan_,
                            this.valueExpression_(displayValue));
};
unisubs.Spinner.prototype.cancelTimer_ = function() {
    this.activated_ = false;
    this.timer_.stop();
    this.speed_ = unisubs.Spinner.INITIAL_SPEED;
    this.counter_ = 0;
    this.step_ = this.minStep_;
    this.dispatchEvent(new unisubs.Spinner.ValueChangedEvent(this.value_));
};
unisubs.Spinner.prototype.timerTick_ = function(event) {
    this.counter_++;
    if (this.speed_ <= 0 || this.counter_ % this.speed_ == 0) {
        if (this.counter_ > 10) {
            this.speed_--;
            this.counter_ = 0;
        }
        if (this.increment_)
            this.increase_();
        else
            this.decrease_();
    }
    if (this.speed_ < 0 && this.step_ < this.maxStep_)
        this.step_ += this.stepIncrease_;
};
unisubs.Spinner.prototype.mouseDown_ = function(event) {
    if (this.enabled_) {
        this.dispatchEvent(unisubs.Spinner.EventType.ARROW_PRESSED);
        this.activated_ = true;
        if (event.target == this.upAnchor_) {
            this.increment_ = true;
            this.increase_();
        }
        else {
            this.increment_ = false;
            this.decrease_();
        }
        this.timer_.start();
    };
};
unisubs.Spinner.prototype.mouseUp_ = function(event) {
    if (this.activated_)
        this.cancelTimer_();
};
unisubs.Spinner.prototype.mouseOut_ = function(event) {
    if (this.activated_)
        this.cancelTimer_();
};
unisubs.Spinner.prototype.setValue = function(value) {
    this.value_ = value;
    this.updateText_();
};
unisubs.Spinner.prototype.decrease_ = function() {
    this.value_ -= this.step_;
    if (this.value_ < this.minFn_()) {
        this.value_ = this.minFn_();
        this.cancelTimer_();
    }
    this.updateText_();
};
unisubs.Spinner.prototype.increase_ = function() {
    this.value_ += this.step_;
    if (this.value_ > this.maxFn_()) {
        this.value_ = this.maxFn_();
        this.cancelTimer_();
    }
    this.updateText_();
};
unisubs.Spinner.prototype.disposeInternal = function() {
    unisubs.Spinner.superClass_.disposeInternal.call(this);
    this.timer_.dispose();
    this.valueExpression_ = null;
};
/**
* @constructor
*/
unisubs.Spinner.ValueChangedEvent = function(value) {
    this.type = unisubs.Spinner.EventType.VALUE_CHANGED;
    this.value = value;
};

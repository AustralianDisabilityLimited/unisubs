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
 * @fileoverview Implementation of a basic slider control.
 *
 * Making this because goog.ui.SliderBase has too many shortcomings: 
 * not able to set the value without triggering the value change event,
 * and there are no events to mark the beginning and end of drags 
 * and animation, which are necessary to use the slider for 
 * video progress. That being said, this is kinda based on 
 * goog.ui.SliderBase.
 */

goog.provide('unisubs.SliderBase');

/**
 * @constructor
 */
unisubs.SliderBase = function(opt_domHelper) {
    goog.ui.Component.call(this, opt_domHelper);
};
goog.inherits(unisubs.SliderBase, goog.ui.Component);

unisubs.SliderBase.EventType = {
    START : 'startinteraction',
    STOP : 'stopinteraction',
    /** Means the progress bar track was clicked. */
    TRACK_CLICKED : 'trackclicked'
};

unisubs.SliderBase.Orientation = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal'
};

unisubs.SliderBase.prototype.orientation =
    unisubs.SliderBase.Orientation.HORIZONTAL;

/**
 * How long the animations should take (in milliseconds).
 * @type {number}
 * @private
 */
unisubs.SliderBase.ANIMATION_INTERVAL_ = 100;

/**
 * The thumb dom element.
 * @type {HTMLDivElement}
 * @protected
 */
unisubs.SliderBase.prototype.thumb;

/**
 * Current value.
 * @private
 */
unisubs.SliderBase.prototype.value_;

unisubs.SliderBase.prototype.minimum_ = 0;
unisubs.SliderBase.prototype.maximum_ = 100;

unisubs.SliderBase.prototype.currentlyInteracting_ = false;

unisubs.SliderBase.prototype.clickToMove_ = true;

/**
 * The Dragger for dragging the thumb.
 * @type {goog.fx.Dragger}
 * @private
 */
unisubs.SliderBase.prototype.dragger_;

/**
 * If we are currently animating the thumb.
 * @private
 * @type {boolean}
 */
unisubs.SliderBase.prototype.isAnimating_ = false;

/**
 * Returns the CSS class applied to the slider element for the given
 * orientation. Subclasses must override this method.
 * @param {unisubs.SliderBase.Orientation} orient The orientation.
 * @return {string} The CSS class applied to slider elements.
 * @protected
 */
unisubs.SliderBase.prototype.getCssClass = goog.abstractMethod;


/** @inheritDoc */
unisubs.SliderBase.prototype.createDom = function() {
    unisubs.SliderBase.superClass_.createDom.call(this);
    var element =
        this.getDomHelper().createDom(
            'div', this.getCssClass(this.orientation_));
    this.decorateInternal(element);
};

/**
 * Subclasses must implement this method and set the thumb 
 * to a non-null value.
 * @type {function() : void}
 * @protected
 */
unisubs.SliderBase.prototype.createThumb = goog.abstractMethod;


/** @inheritDoc */
unisubs.SliderBase.prototype.decorateInternal = function(element) {
    unisubs.SliderBase.superClass_.decorateInternal.call(this, element);
    goog.dom.classes.add(element, this.getCssClass(this.orientation_));
    this.createThumb();
    this.setAriaRoles();
};

unisubs.SliderBase.prototype.enterDocument = function() {
    unisubs.SliderBase.superClass_.enterDocument.call(this);

    this.dragger_ = new goog.fx.Dragger(this.thumb);
    this.dragger_.defaultAction = goog.nullFunction;
    this.getHandler().
        listen(this.dragger_, goog.fx.Dragger.EventType.BEFOREDRAG,
               this.handleBeforeDrag_).
        listen(this.dragger_, goog.fx.Dragger.EventType.END,
               this.handleEndDrag_).
        listen(this.getElement(), goog.events.EventType.MOUSEDOWN,
               this.handleMouseDown_);

    this.getElement().tabIndex = 0;
    this.updateUi_();
};

unisubs.SliderBase.prototype.exitDocument = function() {
    unisubs.SliderBase.superClass_.exitDocument.call(this);
    this.dragger_.dispose();
};

/**
 * Handler for the before drag event. We use the event properties to determine
 * the new value.
 * @param {goog.fx.DragEvent} e  The drag event used to drag the thumb.
 * @private
 */
unisubs.SliderBase.prototype.handleBeforeDrag_ = function(e) {
    var value;
    if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
        var availHeight = this.getElement().clientHeight;
        value = (availHeight - (e.top + this.thumb.offsetHeight / 2)) / 
            availHeight *
            (this.maximum_ - this.minimum_) + this.minimum_;
    } 
    else {
        var availWidth = this.getElement().clientWidth;
        value = ((e.left + this.thumb.offsetWidth / 2) / availWidth) * 
            (this.maximum_ - this.minimum_) +
            this.minimum_;
    }
    value = goog.math.clamp(value, this.minimum_, this.maximum_);
    this.setCurrentlyInteracting_(true);
    this.setValue(value);
};

unisubs.SliderBase.prototype.handleEndDrag_ = function(e) {
    this.setCurrentlyInteracting_(false);
};

unisubs.SliderBase.prototype.setCurrentlyInteracting_ = 
    function(interacting) 
{
    if (interacting == this.currentlyInteracting_)
        return;
    this.currentlyInteracting_ = interacting;
    this.dispatchEvent(interacting ? 
                       unisubs.SliderBase.EventType.START :
                       unisubs.SliderBase.EventType.STOP);
};

/**
 * Handler for the mouse down event.
 * @param {goog.events.Event} e  The mouse event object.
 * @private
 */
unisubs.SliderBase.prototype.handleMouseDown_ = function(e) {
    if (this.getElement().focus)
        this.getElement().focus();

    // Known Element.
    var target = /** @type {Element} */ (e.target);

    if (!goog.dom.contains(this.thumb, target)) {
        if (this.clickToMove_)
            this.animatedSetValue_(this.getValueFromMousePosition_(e));
        else
            this.dispatchEvent(
                new unisubs.SliderBase.TrackClickEvent(
                    this.getValueFromMousePosition_(e)));
    }
};

/**
 * Returns the relative mouse position to the slider.
 * @param {goog.events.Event} e  The mouse event object.
 * @return {number} The relative mouse position to the slider.
 * @private
 */
unisubs.SliderBase.prototype.getRelativeMousePos_ = function(e) {
    var coord = goog.style.getRelativePosition(e, this.getElement());
    if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
        return coord.y;
    } else {
        return coord.x;
    }
};

/**
 * Stores the current mouse position so that it can be used in the timer.
 * @param {goog.events.Event} e  The mouse event object.
 * @private
 */
unisubs.SliderBase.prototype.storeMousePos_ = function(e) {
    this.lastMousePosition_ = this.getRelativeMousePos_(e);
};

/**
 * Returns the value to use for the current mouse position
 * @param {goog.events.Event} e  The mouse event object.
 * @return {number} The value that this mouse position represents.
 * @private
 */
unisubs.SliderBase.prototype.getValueFromMousePosition_ = function(e) {
    if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
        var availH = this.getElement().clientHeight;
        var y = this.getRelativeMousePos_(e);
        return (this.maximum_ - this.minimum_) * 
            (availH - y) / availH + this.minimum_;
    } else {
        var availW = this.getElement().clientWidth;
        var x = this.getRelativeMousePos_(e);
        return (this.maximum_ - this.minimum_) * 
            x / availW + this.minimum_;
    }
};

unisubs.SliderBase.prototype.setValue = function(value, opt_suppressEvents) {
    value = goog.math.clamp(value, this.minimum_, this.maximum_);
    if (value == this.value_)
        return;
    this.value_ = value;
    this.updateUi_();
    if (!opt_suppressEvents)
        this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
};

unisubs.SliderBase.prototype.getValue = function() {
    return this.value_;
};

/**
 * This is called when we need to update the size of the thumb. This happens
 * when first created as well as when the value and the orientation changes.
 * @private
 */
unisubs.SliderBase.prototype.updateUi_ = function() {
    if (this.thumb && !this.isAnimating_) {
        var coord = this.getThumbCoordinateForValue_(this.value_);

        if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
            unisubs.style.setPosition(this.thumb, null, coord.y);
        } else {
            unisubs.style.setPosition(this.thumb, coord.x, null);
        }
    }
};


/**
 * Returns the position to move the handle to for a given value
 * @param {number} val  The value to get the coordinate for.
 * @return {goog.math.Coordinate} Coordinate with either x or y set.
 * @private
 */
unisubs.SliderBase.prototype.getThumbCoordinateForValue_ = function(val) {
    var coord = new goog.math.Coordinate();
    if (this.thumb) {
        var min = this.minimum_;
        var max = this.maximum_;
        
        // This check ensures the ratio never take NaN value, which is possible when
        // the slider min & max are same numbers (i.e. 1).
        var ratio = (val == min && min == max) ? 0 : (val - min) / (max - min);

        if (isNaN(ratio))
            ratio = 0;
        
        if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
            var thumbHeight = this.thumb.offsetHeight;
            var h = this.getElement().clientHeight;
            var bottom = Math.round(ratio * h);
            coord.y = h - bottom - thumbHeight / 2;
        } else {
            var w = this.getElement().clientWidth;
            var left = Math.round(ratio * w);
            coord.x = left - this.thumb.offsetWidth / 2;
        }
    }
    return coord;
};

/**
 * Sets the value and starts animating the handle towards that position.
 * @param {number} v Value to set and animate to.
 * @private
 */
unisubs.SliderBase.prototype.animatedSetValue_ = function(v) {
    // the value might be out of bounds
    v = goog.math.clamp(v, this.minimum_, this.maximum_);

    if (this.currentAnimation_) {
        this.currentAnimation_.stop(true);
    }

    var end;
    var coord = this.getThumbCoordinateForValue_(v);
    if (this.orientation_ == unisubs.SliderBase.Orientation.VERTICAL) {
        end = [this.thumb.offsetLeft, coord.y];
    } else {
        end = [coord.x, this.thumb.offsetTop];
    }
    var animation = new goog.fx.dom.SlideFrom(
        this.thumb, end, unisubs.SliderBase.ANIMATION_INTERVAL_);
    this.currentAnimation_ = animation;
    this.getHandler().listen(
        animation, goog.fx.Animation.EventType.END,
        this.endAnimation_);

    this.isAnimating_ = true;
    this.setCurrentlyInteracting_(true);
    this.setValue(v);
    animation.play(false);
};


/**
 * Sets the isAnimating_ field to false once the animation is done.
 * @param {goog.fx.AnimationEvent} e Event object passed by the animation
 *     object.
 * @private
 */
unisubs.SliderBase.prototype.endAnimation_ = function(e) {
    this.setCurrentlyInteracting_(false);
    this.isAnimating_ = false;
};


/**
 * Changes the orientation.
 * @param {unisubs.SliderBase.Orientation} orient The orientation.
 */
unisubs.SliderBase.prototype.setOrientation = function(orient) {
    if (this.orientation_ != orient) {
        var oldCss = this.getCssClass(this.orientation_);
        var newCss = this.getCssClass(orient);
        this.orientation_ = orient;
        
        // Update the DOM
        if (this.getElement()) {
            goog.dom.classes.swap(this.getElement(), oldCss, newCss);
            // we need to reset the left and top
            unisubs.style.setProperty(this.thumb, 'left', null);
            unisubs.style.setProperty(this.thumb, 'top', null);
            this.updateUi_();
        }
    }
};

/**
 * @return {unisubs.SliderBase.Orientation} the orientation of the slider.
 */
unisubs.SliderBase.prototype.getOrientation = function() {
  return this.orientation_;
};

unisubs.SliderBase.prototype.isCurrentlyInteracting = function() {
    return this.currentlyInteracting_;
};

/**
 * Set a11y roles and state.
 * @protected
 */
unisubs.SliderBase.prototype.setAriaRoles = function() {
    goog.dom.a11y.setRole(this.getElement(), goog.dom.a11y.Role.SLIDER);
    this.updateAriaStates();
};

unisubs.SliderBase.prototype.setClickToMove = function(clickToMove) {
    this.clickToMove_ = clickToMove;
};

/**
 * Set a11y roles and state when values change.
 * @protected
 */
unisubs.SliderBase.prototype.updateAriaStates = function() {
    var element = this.getElement();
    if (element) {
        goog.dom.a11y.setState(element,
                               goog.dom.a11y.State.VALUEMIN,
                               this.minimum_);
        goog.dom.a11y.setState(element,
                               goog.dom.a11y.State.VALUEMAX,
                               this.maximum_);
        goog.dom.a11y.setState(element,
                               goog.dom.a11y.State.VALUENOW,
                               this.value_);
    }
};

/**
 * @constructor
 */
unisubs.SliderBase.TrackClickEvent = function(value) {
    this.type = unisubs.SliderBase.EventType.TRACK_CLICKED;
    this.value = value;
};

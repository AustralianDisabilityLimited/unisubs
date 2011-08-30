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
 * @fileoverview A model in true MVC sense: dispatches events when model
 *     changes. This keeps disparate parts of the UI which are interested
 *     in model state (e.g. timeline, sync panel, video) informed when
 *     alterations are made to subtitles.
 */

goog.provide('unisubs.subtitle.EditableCaptionSet');

/**
 * @constructor
 * @param {array.<object.<string, *>>} existingJsonCaptions No sort order necessary.
 * @param {boolean=} opt_completed Only meaningful for non-dependent subs.
 * @param {string=} opt_title Only meaningful for translations
 * @param {boolean=} opt_forkedDuringEdits This is a bit ugly, but this parameter should only be used 
 *     when deserializing an EditableCaptionSet from memory after a finish failure. It means that 
 *     during the failed editing session, the EditableCaptionSet got forked.
 */
unisubs.subtitle.EditableCaptionSet = function(existingJsonCaptions, opt_completed, opt_title, opt_forkedDuringEdits)
{
    goog.events.EventTarget.call(this);
    var that = this;
    var c;
    this.captions_ = goog.array.map(
        existingJsonCaptions, function(caption) {
            c = new unisubs.subtitle.EditableCaption(null, caption);
            c.setParentEventTarget(that);
            return c;
        });
    goog.array.sort(
        this.captions_,
        unisubs.subtitle.EditableCaption.orderCompare);
    var i;
    for (i = 1; i < this.captions_.length; i++) {
        this.captions_[i - 1].setNextCaption(this.captions_[i]);
        this.captions_[i].setPreviousCaption(this.captions_[i - 1]);
    }
    this.completed = opt_completed;
    this.title = opt_title;
    this.forkedDuringEdits_ = !!opt_forkedDuringEdits;
};
goog.inherits(unisubs.subtitle.EditableCaptionSet, goog.events.EventTarget);

unisubs.subtitle.EditableCaptionSet.EventType = {
    CLEAR_ALL: 'clearall',
    CLEAR_TIMES: 'cleartimes',
    ADD: 'addsub',
    DELETE: 'deletesub'
};

/**
 * Always in ascending order by start time.
 */
unisubs.subtitle.EditableCaptionSet.prototype.captionsWithTimes =
    function()
{
    return goog.array.filter(
        this.captions_, function(c) { return c.getStartTime() != -1; });
};
/**
 * Always in ascending order by start time.
 */
unisubs.subtitle.EditableCaptionSet.prototype.timelineCaptions =
    function()
{
    return goog.array.filter(
        this.captions_,
        function(c) {
            return c.getStartTime() != -1 ||
                (c.getPreviousCaption() != null &&
                 c.getPreviousCaption().getStartTime() != -1) ||
                (c.getPreviousCaption() == null &&
                 c.getStartTime() == -1);
        });
};
unisubs.subtitle.EditableCaptionSet.prototype.clear = function() {
    var caption;
    while (this.captions_.length > 0) {
        caption = this.captions_.pop();
    }
    this.dispatchEvent(
        unisubs.subtitle.EditableCaptionSet.EventType.CLEAR_ALL);
};
unisubs.subtitle.EditableCaptionSet.prototype.clearTimes = function() {
    goog.array.forEach(this.captions_, function(c) { c.clearTimes(); });

    this.dispatchEvent(
        unisubs.subtitle.EditableCaptionSet.EventType.CLEAR_TIMES);
};
unisubs.subtitle.EditableCaptionSet.prototype.count = function() {
    return this.captions_.length;
};
unisubs.subtitle.EditableCaptionSet.prototype.caption = function(index) {
    return this.captions_[index];
};
unisubs.subtitle.EditableCaptionSet.prototype.makeJsonSubs = function() {
    return goog.array.map(this.captions_, function(c) { return c.json; });
};
unisubs.subtitle.EditableCaptionSet.prototype.nonblankSubtitles = function() {
    return goog.array.filter(
        this.captions_, function(c) { return c.getTrimmedText() != ''; });
};
unisubs.subtitle.EditableCaptionSet.prototype.identicalTo = function(otherCaptionSet) {
    var myNonblanks = this.nonblankSubtitles();
    var otherNonblanks = otherCaptionSet.nonblankSubtitles();
    if (myNonblanks.length != otherNonblanks.length)
        return false;
    for (var i = 0; i < myNonblanks.length; i++)
        if (!myNonblanks[i].identicalTo(otherNonblanks[i]))
            return false;
    return true;
};

unisubs.subtitle.EditableCaptionSet.prototype.addNewDependentTranslation = 
    function(subOrder, subtitleID)
{
    var c = new unisubs.subtitle.EditableCaption(
        null, 
        { 'subtitle_id': subtitleID,
          'text': '',
          'sub_order': subOrder });
    this.captions_.push(c);
    return c;
};


/**
 *
 * @param {Number} nextSubOrder The next subtitle's subOrder
 *     (returned by EditableCaption#getSubOrder())
 */
unisubs.subtitle.EditableCaptionSet.prototype.insertCaption =
    function(nextSubOrder)
{
    var index = this.findSubIndex_(nextSubOrder);
    var nextSub = this.captions_[index];
    prevSub = nextSub.getPreviousCaption();
    var order = ((prevSub ? prevSub.getSubOrder() : 0.0) +
                 nextSub.getSubOrder()) / 2.0;
    var c = new unisubs.subtitle.EditableCaption(order);
    unisubs.SubTracker.getInstance().trackAdd(c.getCaptionID());
    goog.array.insertAt(this.captions_, c, index);
    if (prevSub) {
        prevSub.setNextCaption(c);
        c.setPreviousCaption(prevSub);
    }
    c.setNextCaption(nextSub);
    nextSub.setPreviousCaption(c);
    this.setTimesOnInsertedSub_(c, prevSub, nextSub);
    c.setParentEventTarget(this);
    this.dispatchEvent(
        new unisubs.subtitle.EditableCaptionSet.CaptionEvent(
            unisubs.subtitle.EditableCaptionSet.EventType.ADD,
            c));
    return c;
};
unisubs.subtitle.EditableCaptionSet.prototype.setTimesOnInsertedSub_ =
    function(insertedSub, prevSub, nextSub)
{
    var startTime = -1, endTime = -1;
    if (nextSub.getStartTime() != -1) {
        startTime = nextSub.getStartTime();
        endTime = (nextSub.getEndTime() + nextSub.getStartTime()) / 2.0;
    }
    else if (prevSub && prevSub.getEndTime() != -1) {
        startTime = prevSub.getEndTime();
    }
    if (startTime != -1) {
        insertedSub.setStartTime(startTime);
        if (endTime != -1)
            insertedSub.setEndTime(endTime);
    }
};
/**
 *
 * @param {unisubs.subtitle.EditableCaption} caption
 */
unisubs.subtitle.EditableCaptionSet.prototype.deleteCaption = function(caption) {
    var index = this.findSubIndex_(caption.getSubOrder());
    var sub = this.captions_[index];
    var prevSub = sub.getPreviousCaption();
    var nextSub = sub.getNextCaption();
    goog.array.removeAt(this.captions_, index);
    if (prevSub)
        prevSub.setNextCaption(nextSub);
    if (nextSub)
        nextSub.setPreviousCaption(prevSub);
    this.dispatchEvent(
        new unisubs.subtitle.EditableCaptionSet.CaptionEvent(
            unisubs.subtitle.EditableCaptionSet.EventType.DELETE,
            sub));
};
unisubs.subtitle.EditableCaptionSet.prototype.findSubIndex_ = function(order) {
    return goog.array.binarySearch(
        this.captions_, 42,
        function(x, caption) {
            return order - caption.getSubOrder();
        });
};
unisubs.subtitle.EditableCaptionSet.prototype.addNewCaption = function(opt_dispatchEvent) {
    var lastSubOrder = 0.0;
    if (this.captions_.length > 0)
        lastSubOrder = this.captions_[this.captions_.length - 1].getSubOrder();
    var c = new unisubs.subtitle.EditableCaption(lastSubOrder + 1.0);
    unisubs.SubTracker.getInstance().trackAdd(c.getCaptionID());    

    c.setParentEventTarget(this);
    this.captions_.push(c);
    if (this.captions_.length > 1) {
        var previousCaption = this.captions_[this.captions_.length - 2];
        previousCaption.setNextCaption(c);
        c.setPreviousCaption(previousCaption);
    }
    if (opt_dispatchEvent) {
        this.dispatchEvent(
            new unisubs.subtitle.EditableCaptionSet.CaptionEvent(
                unisubs.subtitle.EditableCaptionSet.EventType.ADD,
                c));
    }
    return c;
};
/**
 * Find the last subtitle with a start time at or before time.
 * @param {number} time
 * @return {?unisubs.subtitle.EditableCaption} null if before first
 *     sub start time, or last subtitle with start time
 *     at or before playheadTime.
 */
unisubs.subtitle.EditableCaptionSet.prototype.findLastForTime =
    function(time)
{
    var i;
    // TODO: write unit test then get rid of linear search in future.
    for (i = 0; i < this.captions_.length; i++)
        if (this.captions_[i].getStartTime() != -1 &&
            this.captions_[i].getStartTime() <= time &&
            (i == this.captions_.length - 1 ||
             this.captions_[i + 1].getStartTime() == -1 ||
             this.captions_[i + 1].getStartTime() > time))
            return this.captions_[i];
    return null;
};

/**
 * Used for both add and delete.
 * @constructor
 * @param {unisubs.subtitle.EditableCaptionSet.EventType} type of event
 * @param {unisubs.subtitle.EditableCaption} Caption the event applies to.
 */
unisubs.subtitle.EditableCaptionSet.CaptionEvent =
    function(type, caption)
{
    this.type = type;
    /**
     * @type {unisubs.subtitle.EditableCaption}
     */
    this.caption = caption;
};

/*
 * @return {boolean} True if one or more captions have no time data, 
 * except for the last one, whose end time (only) can be undefined.
 */
unisubs.subtitle.EditableCaptionSet.prototype.needsSync = function() {
    return goog.array.some(goog.array.slice(this.captions_, 0, -1), function(x){ 
        return x.needsSync();
    }) || this.captions_[this.captions_.length -1].getStartTime() == 
        unisubs.subtitle.EditableCaption.TIME_UNDEFINED;
};

unisubs.subtitle.EditableCaptionSet.prototype.fork = function(originalSubtitleState) {
    var subMap = this.makeMap();
    var translatedSub;
    goog.array.forEach(
        originalSubtitleState.SUBTITLES,
        function(origSub) {
            translatedSub = subMap[origSub['subtitle_id']];
            if (translatedSub) {
                translatedSub.fork(origSub);
            }
        });
    goog.array.sort(
        this.captions_,
        unisubs.subtitle.EditableCaption.orderCompare);
    this.forkedDuringEdits_ = true;
};

unisubs.subtitle.EditableCaptionSet.prototype.wasForkedDuringEdits = function() {
    return this.forkedDuringEdits_;
};

unisubs.subtitle.EditableCaptionSet.prototype.makeMap = function() {
    var map = {};
    goog.array.forEach(
        this.captions_, 
        function(c) {
            map[c.getCaptionID()] = c;
        });
    return map;
};
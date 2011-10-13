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

goog.provide('unisubs.timeline.SubtitleSet');
/**
* @constructor
* @param {unisubs.subtitle.EditableCaptionSet} editableCaptionSet
* @param {unisubs.player.AbstractVideoPlayer} videoPlayer
*/
unisubs.timeline.SubtitleSet = function(editableCaptionSet, videoPlayer) {
    goog.events.EventTarget.call(this);
    this.eventHandler_ = new goog.events.EventHandler(this);
    this.editableCaptionSet_ = editableCaptionSet;
    this.videoPlayer_ = videoPlayer;
    this.createSubsToDisplay_();
    var et = unisubs.subtitle.EditableCaptionSet.EventType;
    this.eventHandler_.
        listen(
            this.editableCaptionSet_,
            unisubs.subtitle.EditableCaption.CHANGE,
            this.captionChange_).
        listen(
            this.editableCaptionSet_,
            [et.CLEAR_TIMES, et.ADD, et.DELETE],
            this.subsEdited_);
};
goog.inherits(unisubs.timeline.SubtitleSet, goog.events.EventTarget);

unisubs.timeline.SubtitleSet.DISPLAY_NEW = 'displaynew';
unisubs.timeline.SubtitleSet.CLEAR_TIMES = 'cleartimes';
unisubs.timeline.SubtitleSet.REMOVE = 'remove';

unisubs.timeline.SubtitleSet.prototype.getSubsToDisplay = function() {
    return this.subsToDisplay_;
};

unisubs.timeline.SubtitleSet.prototype.createSubsToDisplay_ = function() {
    if (this.subsToDisplay_)
        this.disposeSubsToDisplay_();
    var that = this;
    this.subsToDisplay_ = goog.array.map(
        this.editableCaptionSet_.timelineCaptions(),
        function(c) {
            return new unisubs.timeline.Subtitle(
                c, that.videoPlayer_);
        });
    var i;
    for (i = 0; i < this.subsToDisplay_.length - 1; i++)
        this.subsToDisplay_[i].setNextSubtitle(
            this.subsToDisplay_[i + 1]);
};

unisubs.timeline.SubtitleSet.prototype.subsEdited_ = function(e) {
    var et = unisubs.subtitle.EditableCaptionSet.EventType;
    if (e.type == et.CLEAR_TIMES) {
        this.createSubsToDisplay_();
        this.dispatchEvent(unisubs.timeline.SubtitleSet.CLEAR_TIMES);
    }
    else if (e.type == et.ADD) {
        this.insertCaption_(e.caption);
    }
    else if (e.type == et.DELETE) {
        this.deleteCaption_(e.caption);
    }
};

unisubs.timeline.SubtitleSet.prototype.deleteCaption_ = function(caption) {
    var subOrder = caption.getSubOrder();
    var index = goog.array.binarySearch(
        this.subsToDisplay_, 42,
        function(x, sub) { return subOrder - sub.getEditableCaption().getSubOrder(); });
    if (index >= 0) {
        var sub = this.subsToDisplay_[index];
        var previousSub = index > 0 ?
            this.subsToDisplay_[index - 1] : null;
        var nextIsNew = false;
        var nextSub = index < this.subsToDisplay_.length - 1 ?
            this.subsToDisplay_[index + 1] : null;
        goog.array.removeAt(this.subsToDisplay_, index);
        this.dispatchEvent(new unisubs.timeline.SubtitleSet.RemoveEvent(sub));
        if (sub.getEditableCaption().getStartTime() == -1) {
            // we just removed the last unsynced subtitle.
            var nextCaption = caption.getNextCaption();
            if (nextCaption != null) {
                nextSub = new unisubs.timeline.Subtitle(
                    nextCaption, this.videoPlayer_);
                this.subsToDisplay_.push(nextSub);
                nextIsNew = true;
            }
        }
        if (previousSub != null)
            previousSub.setNextSubtitle(nextSub);
        sub.dispose();
        if (nextIsNew)
            this.dispatchEvent(
                new unisubs.timeline.SubtitleSet.DisplayNewEvent(nextSub));
    }
};

unisubs.timeline.SubtitleSet.prototype.insertCaption_ = function(caption) {
    if (!this.isInsertable_(caption))
        return;
    var newSub = new unisubs.timeline.Subtitle(
        caption, this.videoPlayer_);
    var index = goog.array.binarySearch(
        this.subsToDisplay_, newSub,
        unisubs.timeline.Subtitle.orderCompare);
    var insertionPoint = -index - 1;
    var previousSub = insertionPoint > 0 ?
        this.subsToDisplay_[insertionPoint - 1] : null;
    var nextSub = insertionPoint < this.subsToDisplay_.length ?
        this.subsToDisplay_[insertionPoint] : null;
    if (previousSub != null)
        previousSub.setNextSubtitle(newSub);
    if (nextSub != null) {
        if (caption.getStartTime() == -1) {
            goog.array.removeAt(this.subsToDisplay_, insertionPoint);
            this.dispatchEvent(new unisubs.timeline.SubtitleSet.RemoveEvent(nextSub));
            nextSub.dispose();
        }
        else
            newSub.setNextSubtitle(nextSub);
    }
    goog.array.insertAt(this.subsToDisplay_, newSub, insertionPoint);
    this.dispatchEvent(
        new unisubs.timeline.SubtitleSet.DisplayNewEvent(newSub));
};

unisubs.timeline.SubtitleSet.prototype.isInsertable_ = function(caption) {
    return caption.getStartTime() != -1 ||
        caption.getPreviousCaption() == null ||
        (caption.getPreviousCaption() != null &&
         caption.getPreviousCaption().getStartTime() != -1);
};

unisubs.timeline.SubtitleSet.prototype.captionChange_ = function(e) {
    if (e.timesFirstAssigned && e.target.getNextCaption() != null) {
        var newSub = new unisubs.timeline.Subtitle(
            e.target.getNextCaption(), this.videoPlayer_);
        var lastSub = null;
        if (this.subsToDisplay_.length > 0)
            lastSub = this.subsToDisplay_[this.subsToDisplay_.length - 1];
        this.subsToDisplay_.push(newSub);
        if (lastSub != null)
            lastSub.setNextSubtitle(newSub);
        this.dispatchEvent(
            new unisubs.timeline.SubtitleSet.DisplayNewEvent(newSub));
    }
};

unisubs.timeline.SubtitleSet.prototype.getEditableCaptionSet = function() {
    return this.editableCaptionSet_;
};

unisubs.timeline.SubtitleSet.prototype.disposeSubsToDisplay_ = function() {
    goog.array.forEach(this.subsToDisplay_, function(s) { s.dispose(); });
};

unisubs.timeline.SubtitleSet.prototype.disposeInternal = function() {
    unisubs.timeline.SubtitleSet.superClass_.disposeInternal.call(this);
    this.eventHandler_.dispose();
    this.disposeSubsToDisplay_();
};

/**
* @constructor
*
*/
unisubs.timeline.SubtitleSet.DisplayNewEvent = function(subtitle) {
    this.type = unisubs.timeline.SubtitleSet.DISPLAY_NEW;
    this.subtitle = subtitle;
};

/**
* @constructor
*
*/
unisubs.timeline.SubtitleSet.RemoveEvent = function(subtitle) {
    this.type = unisubs.timeline.SubtitleSet.REMOVE;
    this.subtitle = subtitle;
};

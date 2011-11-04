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

goog.provide('unisubs.timeline.Timeline');
goog.require('goog.fx.Dragger');
goog.require('goog.style.cursor');

/**
 * @constructor
 * @extends goog.ui.Component
 *
 * @param {number} spacing The space, in seconds, between two
 *     major ticks.
 * @param {unisubs.timeline.SubtitleSet} subtitleSet
 */
unisubs.timeline.Timeline = function(spacing, subtitleSet, videoPlayer, readOnly) {
    goog.ui.Component.call(this);
    this.spacing_ = spacing;
    this.subtitleSet_ = subtitleSet;
    this.videoPlayer_ = videoPlayer;
    this.readOnly_ = readOnly;
};
goog.inherits(unisubs.timeline.Timeline, goog.ui.Component);
unisubs.timeline.Timeline.prototype.createDom = function() {
    unisubs.timeline.Timeline.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    var el = this.getElement();
    el.className = 'unisubs-timeline';
    el.appendChild($d('div', 'top', ' '));
    this.timelineInner_ = new unisubs.timeline.TimelineInner(
        this, this.spacing_, this.subtitleSet_, this.readOnly_);
    this.addChild(this.timelineInner_, true);
    el.appendChild($d('div', 'marker'));
};
/**
 * Useful for when times are cleared.
 */
unisubs.timeline.Timeline.prototype.reset_ = function() {
    this.removeChild(this.timelineInner_, true);
    this.timelineInner_.dispose();
    this.timelineInner_ = new unisubs.timeline.TimelineInner(
        this, this.spacing_, this.subtitleSet_, this.readOnly_);
    this.addChild(this.timelineInner_, true);
};
unisubs.timeline.Timeline.prototype.enterDocument = function() {
    unisubs.timeline.Timeline.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(
            this.videoPlayer_,
            unisubs.player.AbstractVideoPlayer.EventType.TIMEUPDATE,
            this.videoTimeUpdate_).
        listen(
            this.timelineInner_,
            goog.object.getValues(
                unisubs.timeline.TimelineSub.EventType),
            this.timelineSubEdit_).
        listen(
            this.timelineInner_,
            unisubs.timeline.TimeRowUL.DOUBLECLICK,
            this.timeRowDoubleClick_).
        listen(
            this.subtitleSet_,
            unisubs.timeline.SubtitleSet.CLEAR_TIMES,
            this.reset_);
    this.initTime_();
};
unisubs.timeline.Timeline.prototype.timeRowDoubleClick_ = function(e) {
    this.videoPlayer_.setPlayheadTime(e.time);
    this.videoPlayer_.play();
};
unisubs.timeline.Timeline.prototype.timelineSubEdit_ = function(e) {
    var et = unisubs.timeline.TimelineSub.EventType;
    if (e.type == et.START_EDITING)
        this.videoPlayer_.pause();
};
unisubs.timeline.Timeline.prototype.videoTimeUpdate_ = function(e) {
    this.setTime_(this.videoPlayer_.getPlayheadTime());
};
unisubs.timeline.Timeline.prototype.initTime_ = function() {
    this.ensureWidth_();
    if (this.width_)
        this.videoTimeUpdate_();
    else
        goog.Timer.callOnce(goog.bind(this.initTime_, this));
};
unisubs.timeline.Timeline.prototype.ensureWidth_ = function() {
    if (!this.width_) {
        var size = goog.style.getSize(this.getElement());
        this.width_ = size.width;
    }
};
unisubs.timeline.Timeline.prototype.setTime_ = function(time) {
    this.ensureWidth_();
    this.timelineInner_.setTime(
        time, this.width_ / 2,
        this.videoPlayer_.getDuration());
};
unisubs.timeline.Timeline.prototype.getTime_ = function() {
    this.ensureWidth_();
    return this.timelineInner_.getTime();
};
unisubs.timeline.Timeline.prototype.beforeDrag = function(e) {
    // Returns false if a timeline subtitle's start or end time is being
    // changed, to keep the timeline from jumping around.
    return !unisubs.timeline.TimelineSub.isCurrentlyEditing();
};
unisubs.timeline.Timeline.prototype.startDrag = function(e) {
    this.wasPlaying_ = this.videoPlayer_.isPlaying();
    this.videoPlayer_.pause();
    this.oldLeft_ = this.timelineInner_.getLeft();
};
unisubs.timeline.Timeline.prototype.onDrag = function(e) {
    this.ensureWidth_();
    this.timelineInner_.setLeft(e.left + this.oldLeft_, this.width_ / 2,
                                this.videoPlayer_.getDuration());
};
unisubs.timeline.Timeline.prototype.endDrag = function(e) {
    this.oldLeft_ = null;
    this.videoPlayer_.setPlayheadTime(this.timelineInner_.getTime(), true);
    if (this.wasPlaying_) {
        this.videoPlayer_.play();
    }
};

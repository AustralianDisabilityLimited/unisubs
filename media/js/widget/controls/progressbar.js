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

goog.provide('unisubs.controls.ProgressBar');
/**
* @constructor
* @extends goog.ui.Component
*/
unisubs.controls.ProgressBar = function(videoPlayer) {
    goog.ui.Component.call(this);
    this.videoPlayer_ = videoPlayer;
    this.videoDuration_ = 0;
};
goog.inherits(unisubs.controls.ProgressBar, goog.ui.Component);

unisubs.controls.ProgressBar.prototype.createDom = function() {
    this.setElementInternal(
        this.getDomHelper().createDom('span', 'unisubs-progress'));
    this.bufferedBar_ = new unisubs.controls.BufferedBar(
        this.videoPlayer_);
    this.addChild(this.bufferedBar_, true);
    this.played_ = new goog.ui.Component();
    this.addChild(this.played_, true);
    this.played_.getElement().className = 'unisubs-played';
    this.progressSlider_ = new unisubs.controls.ProgressSlider();
    this.addChild(this.progressSlider_, true);
};

unisubs.controls.ProgressBar.prototype.enterDocument = function() {
    unisubs.controls.ProgressBar.superClass_.enterDocument.call(this);
    var et = unisubs.player.AbstractVideoPlayer.EventType;
    this.getHandler().
        listen(
            this.videoPlayer_, et.TIMEUPDATE, this.videoTimeUpdate_).
        listen(
            this.progressSlider_,
            goog.ui.Component.EventType.CHANGE,
            this.progressSliderUpdate_).
        listen(
            this.progressSlider_,
            goog.object.getValues(unisubs.SliderBase.EventType),
            this.progressSliderInteracting_);
};

unisubs.controls.ProgressBar.prototype.progressSliderInteracting_ =
    function(event)
{
    var et = unisubs.SliderBase.EventType;
    if (event.type == et.START) {
        this.pausedAtStart_ = this.videoPlayer_.isPaused();
        this.videoPlayer_.pause(true);
    }
    else if (event.type == et.STOP && !this.pausedAtStart_)
        this.videoPlayer_.play(true);
    else if (event.type == et.TRACK_CLICKED)
        this.setVideoPlayheadTime_(event.value);
};

unisubs.controls.ProgressBar.prototype.progressSliderUpdate_ =
    function(event)
{
    this.setVideoPlayheadTime_(this.progressSlider_.getValue());
    this.updatePlayedBar_(this.progressSlider_.getValue() / 100);
};

unisubs.controls.ProgressBar.prototype.setVideoPlayheadTime_ =
    function(progValue)
{
    if (!this.hasDuration_())
        return;
    this.videoPlayer_.setPlayheadTime(
        this.videoDuration_ * progValue / 100);
};

unisubs.controls.ProgressBar.prototype.videoTimeUpdate_ = function(event) {
    if (!this.hasDuration_())
        return;
    if (!this.progressSlider_.isCurrentlyInteracting()) {
        this.progressSlider_.setValue(
            100 * this.videoPlayer_.getPlayheadTime() / this.videoDuration_,
            true);
        this.updatePlayedBar_(
            this.videoPlayer_.getPlayheadTime() / this.videoDuration_);
    }
};
unisubs.controls.ProgressBar.prototype.hasDuration_ = function() {
    if (this.videoDuration_ == 0) {
        this.videoDuration_ = this.videoPlayer_.getDuration();
        if (this.videoDuration_ == 0)
            return false;
    }
    return true;
};
unisubs.controls.ProgressBar.prototype.updatePlayedBar_ = function(ratio) {
    if (!this.barWidth_ && this.bufferedBar_) {
        var barSize = goog.style.getSize(this.bufferedBar_.getElement());
        this.barWidth_ = barSize.width;
    }
    if (this.barWidth_) {
        unisubs.style.setWidth(this.played_.getElement(),
                                this.barWidth_ * ratio);
    }
};

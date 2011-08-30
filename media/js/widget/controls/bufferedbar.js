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

goog.provide('unisubs.controls.BufferedBar');
/**
* @constructor
* @extends goog.ui.Component
*/
unisubs.controls.BufferedBar = function(videoPlayer) {
    goog.ui.Component.call(this);
    this.bufferedRangeDivs_ = [];
    this.videoPlayer_ = videoPlayer;
    this.videoDuration_ = 0;
    this.width_ = 0;
};
goog.inherits(unisubs.controls.BufferedBar, goog.ui.Component);

unisubs.controls.BufferedBar.prototype.createDom = function() {
    this.setElementInternal(
	this.getDomHelper().createDom('div', 'unisubs-buffered-container'));
};

unisubs.controls.BufferedBar.prototype.enterDocument = function() {
    unisubs.controls.BufferedBar.superClass_.enterDocument.call(this);
    this.getHandler().listen(this.videoPlayer_,
			     unisubs.video.AbstractVideoPlayer.EventType.PROGRESS,
			     this.onVideoProgress_);
};

unisubs.controls.BufferedBar.prototype.hasWidth_ = function() {
    if (this.width_ == 0) {
        var size = goog.style.getSize(this.getElement());
        this.width_ = size.width;
        if (this.width_ == 0)
            return false;
    }
    return true;
};

unisubs.controls.BufferedBar.prototype.hasDuration_ = function() {
    if (this.videoDuration_ == 0) {
	this.videoDuration_ = this.videoPlayer_.getDuration();
	if (this.videoDuration_ == 0)
            return false;
    }
    return true;
};

unisubs.controls.BufferedBar.prototype.onVideoProgress_ = function() {
    if (!this.hasWidth_() || !this.hasDuration_())
        return;
    if (this.bufferedRangeDivs_.length !=
	this.videoPlayer_.getBufferedLength())
    {
	while (this.bufferedRangeDivs_.length <
	       this.videoPlayer_.getBufferedLength())
	{
	    var bufferedDiv = this.getDomHelper().createDom(
		'div', 'unisubs-buffered');
	    this.getElement().appendChild(bufferedDiv);
	    this.bufferedRangeDivs_.push(bufferedDiv);
	}
	while (this.videoPlayer_.getBufferedLength() >
	       this.bufferedRangeDivs_.length)
	    this.getElement().removeChild(this.bufferedRangeDivs_.pop());
    }
    for (var i = 0; i < this.bufferedRangeDivs_.length; i++) {
        unisubs.style.setPosition(
            this.bufferedRangeDivs_[i],
	    this.width_ *
	        this.videoPlayer_.getBufferedStart(i) /
	        this.videoDuration_, 
            null);
        unisubs.style.setWidth(
	    this.bufferedRangeDivs_[i],
	    this.width_ *
	        (this.videoPlayer_.getBufferedEnd(i) -
	         this.videoPlayer_.getBufferedStart(i)) /
	        this.videoDuration_);
    }
};
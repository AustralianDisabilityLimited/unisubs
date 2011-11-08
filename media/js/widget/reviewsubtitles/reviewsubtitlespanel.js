// Universal Subtitles, universalsubtitles.org
//
// Copyright (C) 2011 Participatory Culture Foundation
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

goog.provide('unisubs.reviewsubtitles.ReviewSubtitlesPanel');

/**
 * @constructor
 * @param {unisubs.subtitle.EditableCaptionSet} subtitles The subtitles
 *     for the video, so far.
 * @param {unisubs.player.AbstractVideoPlayer} videoPlayer
 * @param {unisubs.CaptionManager} Caption manager, already containing subtitles
 *     with start_time set.
 */
unisubs.reviewsubtitles.ReviewSubtitlesPanel = function(subtitles, videoPlayer, serverModel, captionManager) {
    goog.ui.Component.call(this);
    /**
     * @type {unisubs.subtitle.EditableCaptionSet}
     */
    this.subtitles_ = subtitles;

    this.videoPlayer_ = videoPlayer;
    /**
     * @protected
     */
    this.serverModel = serverModel;
    this.captionManager_ = captionManager;
    this.videoStarted_ = false;
    this.downSub_ = null;
    this.downPlayheadTime_ = -1;
};
goog.inherits(unisubs.reviewsubtitles.ReviewSubtitlesPanel, goog.ui.Component);

unisubs.reviewsubtitles.ReviewSubtitlesPanel.prototype.enterDocument = function() {
    unisubs.reviewsubtitles.ReviewSubtitlesPanel.superClass_.enterDocument.call(this);
    var handler = this.getHandler();
    handler.listen(this.captionManager_, unisubs.CaptionManager.CAPTION, this.captionReached_);
};
unisubs.reviewsubtitles.ReviewSubtitlesPanel.prototype.createDom = function() {
    unisubs.reviewsubtitles.ReviewSubtitlesPanel.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());

    this.getElement().appendChild(this.contentElem_ = $d('div'));

    this.subtitleList_ = new unisubs.subtitle.SubtitleList(
        this.videoPlayer_, this.subtitles_, true, false, true);
    this.addChild(this.subtitleList_, true);
};
unisubs.reviewsubtitles.ReviewSubtitlesPanel.prototype.captionReached_ = function(event) {
    var editableCaption = event.caption;
    this.subtitleList_.clearActiveWidget();
    if (editableCaption !== null) {
        this.subtitleList_.setActiveWidget(editableCaption.getCaptionID());
    }
};
unisubs.reviewsubtitles.ReviewSubtitlesPanel.prototype.disposeInternal = function() {
    unisubs.reviewsubtitles.ReviewSubtitlesPanel.superClass_.disposeInternal.call(this);
    if (this.rightPanel_) {
        this.rightPanel_.dispose();
    }
};

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

goog.provide('unisubs.streamer.StreamerController');


unisubs.streamer.StreamerController = function(videoPlayer, streamBox) {
    this.videoPlayer_ = videoPlayer;
    this.streamBox_ = streamBox;
};

unisubs.streamer.StreamerController.prototype.initializeState = function(result) {
    unisubs.widget.WidgetController.makeGeneralSettings(result);
    var subtitleState = new unisubs.widget.SubtitleState.fromJSON(
        result['subtitles']);
    var captionSet = new unisubs.subtitle.EditableCaptionSet(
        subtitleState.SUBTITLES);
    this.subMap_ = captionSet.makeMap();
    this.captionManager_ = 
        new unisubs.CaptionManager(this.videoPlayer_, captionSet);
    this.eventHandler_ = new goog.events.EventHandler(this);
    this.eventHandler_.
        listen(this.captionManager_,
               unisubs.CaptionManager.CAPTION,
               this.captionReached_).
        listen(this.streamBox_,
               unisubs.streamer.StreamSub.SUB_CLICKED,
               this.subClicked_);
};

unisubs.streamer.StreamerController.prototype.subClicked_ = function(e) {
    var editableCaption = this.subMap_[e.target.SUBTITLE_ID];
    this.videoPlayer_.setPlayheadTime(editableCaption.getStartTime());
    this.streamBox_.displaySub(e.target.SUBTITLE_ID);
};

unisubs.streamer.StreamerController.prototype.captionReached_ = function(event) {
    var c = event.caption;
    this.streamBox_.displaySub(c ? c.getCaptionID() : null);
};
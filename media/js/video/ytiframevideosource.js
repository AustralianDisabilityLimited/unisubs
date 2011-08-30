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

goog.provide('unisubs.video.YTIFrameVideoSource');

/**
 * @constructor
 */
unisubs.video.YTIFrameVideoSource = function(youtubeVideoID, opt_videoConfig) {
    unisubs.video.YoutubeVideoSource.call(this, youtubeVideoID, opt_videoConfig);
};
goog.inherits(unisubs.video.YTIFrameVideoSource, unisubs.video.YoutubeVideoSource);

unisubs.video.YTIFrameVideoSource.prototype.createPlayerInternal = function(forDialog) {
    return new unisubs.video.YTIFrameVideoPlayer(
        new unisubs.video.YTIFrameVideoSource(
            this.getYoutubeVideoID(), this.getVideoConfig()),
        forDialog);
};

unisubs.video.YTIFrameVideoSource.forURL = function(videoURL, opt_videoConfig) {
    var videoID = unisubs.video.YoutubeVideoSource.extractVideoID(videoURL);
    if (videoID)
        return new unisubs.video.YTIFrameVideoSource(
            videoID, opt_videoConfig);
    else
        return null;
};
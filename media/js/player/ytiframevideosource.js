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

goog.provide('unisubs.player.YTIFrameVideoSource');

/**
 * @constructor
 */
unisubs.player.YTIFrameVideoSource = function(youtubeVideoID, opt_videoConfig) {
    unisubs.player.YoutubeVideoSource.call(this, youtubeVideoID, opt_videoConfig);
};
goog.inherits(unisubs.player.YTIFrameVideoSource, unisubs.player.YoutubeVideoSource);

unisubs.player.YTIFrameVideoSource.prototype.createPlayerInternal = function(forDialog) {
    return new unisubs.player.YTIFrameVideoPlayer(
        new unisubs.player.YTIFrameVideoSource(
            this.getYoutubeVideoID(), this.getVideoConfig()),
        forDialog);
};

unisubs.player.YTIFrameVideoSource.forURL = function(videoURL, opt_videoConfig) {
    var videoID = unisubs.player.YoutubeVideoSource.extractVideoID(videoURL);
    if (videoID)
        return new unisubs.player.YTIFrameVideoSource(
            videoID, opt_videoConfig);
    else
        return null;
};

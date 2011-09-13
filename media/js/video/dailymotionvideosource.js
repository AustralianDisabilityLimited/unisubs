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

goog.provide('unisubs.video.DailymotionVideoSource');

/**
 * @constructor
 * @implements {unisubs.video.VideoSource}
 */
unisubs.video.DailymotionVideoSource = function(videoID, videoURL) {
    this.videoID_ = videoID;
    this.videoURL_ = videoURL;
    this.uuid_ = unisubs.randomString();
};

unisubs.video.DailymotionVideoSource.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.video.DailymotionVideoSource.prototype.createControlledPlayer = function() {
    return new unisubs.video.ControlledVideoPlayer(this.createPlayer_(true));
};

unisubs.video.DailymotionVideoSource.prototype.createPlayer_ = function(chromeless) {
    return new unisubs.video.DailymotionVideoPlayer(
        new unisubs.video.DailymotionVideoSource(this.videoID_, this.videoURL_), 
        chromeless);
};

unisubs.video.DailymotionVideoSource.prototype.getVideoId = function() {
    return this.videoID_;
};

unisubs.video.DailymotionVideoSource.prototype.getUUID = function() {
    return this.uuid_;
};

unisubs.video.DailymotionVideoSource.prototype.getVideoURL = function() {
    return this.videoURL_;
};

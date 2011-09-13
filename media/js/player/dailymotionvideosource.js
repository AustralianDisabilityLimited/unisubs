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

goog.provide('unisubs.player.DailymotionVideoSource');

/**
 * @constructor
 * @implements {unisubs.player.MediaSource}
 */
unisubs.player.DailymotionVideoSource = function(videoID, videoURL) {
    this.videoID_ = videoID;
    this.videoURL_ = videoURL;
    this.uuid_ = unisubs.randomString();
};

unisubs.player.DailymotionVideoSource.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.player.DailymotionVideoSource.prototype.createControlledPlayer = function() {
    return new unisubs.player.ControlledVideoPlayer(this.createPlayer_(true));
};

unisubs.player.DailymotionVideoSource.prototype.createPlayer_ = function(chromeless) {
    return new unisubs.player.DailymotionVideoPlayer(
        new unisubs.player.DailymotionVideoSource(this.videoID_, this.videoURL_), 
        chromeless);
};

unisubs.player.DailymotionVideoSource.prototype.getVideoId = function() {
    return this.videoID_;
};

unisubs.player.DailymotionVideoSource.prototype.getUUID = function() {
    return this.uuid_;
};

unisubs.player.DailymotionVideoSource.prototype.getVideoURL = function() {
    return this.videoURL_;
};

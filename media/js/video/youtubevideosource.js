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

goog.provide('unisubs.video.YoutubeVideoSource');

/**
 * @constructor
 * @implements {unisubs.video.VideoSource}
 * @param {string} youtubeVideoID Youtube video id
 * @param {Object.<string, *>=} opt_videoConfig Params to use for 
 *     youtube query string, plus optional 'width' and 'height' 
 *     parameters.
 */
unisubs.video.YoutubeVideoSource = function(youtubeVideoID, opt_videoConfig) {
    this.youtubeVideoID_ = youtubeVideoID;
    this.uuid_ = unisubs.randomString();
    this.videoConfig_ = opt_videoConfig;
};

unisubs.video.YoutubeVideoSource.extractVideoID = function(videoURL) {
    var videoIDExtract = /(?:v[\/=]|embed\/)([0-9a-zA-Z\-\_]+)/i.exec(videoURL);
    return videoIDExtract ? videoIDExtract[1] : null;
}

unisubs.video.YoutubeVideoSource.forURL = 
    function(videoURL, opt_videoConfig) 
{
    var videoID = unisubs.video.YoutubeVideoSource.extractVideoID(videoURL);
    if (videoID)
        return new unisubs.video.YoutubeVideoSource(
            videoID, opt_videoConfig);
    else
        return null;
};

unisubs.video.YoutubeVideoSource.isYoutube = function(videoURL) {
    return /^\s*https?:\/\/([^\.]+\.)?youtube/i.test(videoURL);
};

unisubs.video.YoutubeVideoSource.prototype.createPlayer = function() {
    return this.createPlayerInternal(false);
};

unisubs.video.YoutubeVideoSource.prototype.createControlledPlayer = 
    function() 
{
    return new unisubs.video.ControlledVideoPlayer(this.createPlayerInternal(true));
};

/**
 * @protected
 */
unisubs.video.YoutubeVideoSource.prototype.createPlayerInternal = function(forDialog) {
    return new unisubs.video.YoutubeVideoPlayer(
        new unisubs.video.YoutubeVideoSource(
            this.youtubeVideoID_, this.videoConfig_), 
        forDialog);
};

unisubs.video.YoutubeVideoSource.prototype.getYoutubeVideoID = function() {
    return this.youtubeVideoID_;
};

unisubs.video.YoutubeVideoSource.prototype.getUUID = function() {
    return this.uuid_;
};

unisubs.video.YoutubeVideoSource.prototype.getVideoConfig = function() {
    return this.videoConfig_;
};

unisubs.video.YoutubeVideoSource.prototype.setVideoConfig = function(config) {
    this.videoConfig_ = config;
};

unisubs.video.YoutubeVideoSource.prototype.sizeFromConfig = function() {
    if (this.videoConfig_ && this.videoConfig_['width'] && 
        this.videoConfig_['height']) {
        return new goog.math.Size(
            parseInt(this.videoConfig_['width']), parseInt(this.videoConfig_['height']));
    }
    else {
        return null;
    }
};

unisubs.video.YoutubeVideoSource.prototype.getVideoURL = function() {
    return "http://www.youtube.com/watch?v=" + this.youtubeVideoID_;
};

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

goog.provide('unisubs.video.Html5VideoSource');

/**
 * @constructor
 * @implements {unisubs.video.VideoSource}
 * @param {string} videoURL
 * @param {unisubs.video.Html5VideoType} videoType
 * @param {Object.<string, string>=} opt_videoConfig Attributes to use for 
 *     video element, plus optional 'click_to_play' parameter
 */
unisubs.video.Html5VideoSource = function(videoURL, videoType, opt_videoConfig) {
    this.videoURL_ = videoURL;
    this.videoType_ = videoType;
    this.videoConfig_ = opt_videoConfig;
    this.alternateSources_ = [];
};

unisubs.video.Html5VideoSource.forURL = function(videoURL, opt_videoConfig) {
    var queryStringIndex = videoURL.indexOf('?');
    if (queryStringIndex > -1)
        videoURL = videoURL.substring(0, queryStringIndex);
    var vt = unisubs.video.Html5VideoType;
    var videoType = null;
    if (/\.ogv$|\.ogg$/i.test(videoURL))
        videoType = vt.OGG;
    else if (/\.mp4$|\.m4v$/i.test(videoURL))
        videoType = vt.H264;
    else if (/\.webm$/i.test(videoURL))
        videoType = vt.WEBM;
    if (videoType != null)
        return new unisubs.video.Html5VideoSource(
            videoURL, videoType, opt_videoConfig);
    else
        return null;
};

unisubs.video.Html5VideoSource.prototype.isBestVideoSource = function() {
    if (this.videoType_ == unisubs.video.Html5VideoType.H264 && 
        (unisubs.video.supportsOgg() || unisubs.video.supportsWebM()))
        return false;
    return unisubs.video.supportsVideoType(this.videoType_);
};

unisubs.video.Html5VideoSource.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.video.Html5VideoSource.prototype.createControlledPlayer = 
    function() 
{
    return new unisubs.video.ControlledVideoPlayer(
        this.createPlayer_(true));
};

unisubs.video.Html5VideoSource.prototype.createPlayer_ = 
    function(forSubDialog) 
{
    if (this.videoType_ == unisubs.video.Html5VideoType.H264 && 
        !unisubs.video.supportsH264())
        return new unisubs.video.FlvVideoPlayer(this, forSubDialog);
    else {
        var newSource = new unisubs.video.Html5VideoSource(
            this.videoURL_, this.videoType_, this.videoConfig_);
        newSource.setAlternateSources(this.alternateSources_);
        return new unisubs.video.Html5VideoPlayer(
            newSource, forSubDialog);
    }
};

unisubs.video.Html5VideoSource.prototype.getFlvURL = function() {
    if (this.videoType_ != unisubs.video.Html5VideoType.H264)
        throw new Error();
    return this.videoURL_;
};

unisubs.video.Html5VideoSource.prototype.getVideoURL = function() {
    return this.videoURL_;
};

unisubs.video.Html5VideoSource.prototype.getVideoType = function() {
    return this.videoType_;
};

unisubs.video.Html5VideoSource.prototype.getVideoConfig = function() {
    return this.videoConfig_;
};

unisubs.video.Html5VideoSource.prototype.setVideoConfig = function(config) {
    this.videoConfig_ = config;
};

unisubs.video.Html5VideoSource.prototype.getAlternateURLs = function() {
    if (this.alternateSources_)
        return goog.array.map(
            this.alternateSources_, 
            function(source) { return source.getVideoURL(); });
    else
        return [];
};

unisubs.video.Html5VideoSource.prototype.setAlternateSources = function(sources) {
    this.alternateSources_ = sources;
};
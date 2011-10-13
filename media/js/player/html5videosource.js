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

goog.provide('unisubs.player.Html5VideoSource');

/**
 * @constructor
 * @implements {unisubs.player.MediaSource}
 * @param {string} videoURL
 * @param {unisubs.player.Html5VideoType} videoType
 * @param {Object.<string, string>=} opt_videoConfig Attributes to use for 
 *     video element, plus optional 'click_to_play' parameter
 */
unisubs.player.Html5VideoSource = function(videoURL, videoType, opt_videoConfig) {
    this.videoURL_ = videoURL;
    this.videoType_ = videoType;
    this.videoConfig_ = opt_videoConfig;
    this.alternateSources_ = [];
};

unisubs.player.Html5VideoSource.forURL = function(videoURL, opt_videoConfig) {
    var queryStringIndex = videoURL.indexOf('?');
    if (queryStringIndex > -1)
        videoURL = videoURL.substring(0, queryStringIndex);
    var vt = unisubs.player.Html5VideoType;
    var videoType = null;
    if (/\.ogv$|\.ogg$/i.test(videoURL))
        videoType = vt.OGG;
    else if (/\.mp4$|\.m4v$/i.test(videoURL))
        videoType = vt.H264;
    else if (/\.webm$/i.test(videoURL))
        videoType = vt.WEBM;
    if (videoType != null)
        return new unisubs.player.Html5VideoSource(
            videoURL, videoType, opt_videoConfig);
    else
        return null;
};

unisubs.player.Html5VideoSource.prototype.isBestVideoSource = function() {
    if (this.videoType_ == unisubs.player.Html5VideoType.H264 && 
        (unisubs.player.supportsOgg() || unisubs.player.supportsWebM()))
        return false;
    return unisubs.player.supportsVideoType(this.videoType_);
};

unisubs.player.Html5VideoSource.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.player.Html5VideoSource.prototype.createControlledPlayer = 
    function() 
{
    return new unisubs.player.ControlledVideoPlayer(
        this.createPlayer_(true));
};

unisubs.player.Html5VideoSource.prototype.createPlayer_ = 
    function(forSubDialog) 
{
    if (this.videoType_ == unisubs.player.Html5VideoType.H264 && 
        !unisubs.player.supportsH264())
        return new unisubs.player.FlvVideoPlayer(this, forSubDialog);
    else {
        var newSource = new unisubs.player.Html5VideoSource(
            this.videoURL_, this.videoType_, this.videoConfig_);
        newSource.setAlternateSources(this.alternateSources_);
        return new unisubs.player.Html5VideoPlayer(
            newSource, forSubDialog);
    }
};

unisubs.player.Html5VideoSource.prototype.getFlvURL = function() {
    if (this.videoType_ != unisubs.player.Html5VideoType.H264)
        throw new Error();
    return this.videoURL_;
};

unisubs.player.Html5VideoSource.prototype.getVideoURL = function() {
    return this.videoURL_;
};

unisubs.player.Html5VideoSource.prototype.getVideoType = function() {
    return this.videoType_;
};

unisubs.player.Html5VideoSource.prototype.getVideoConfig = function() {
    return this.videoConfig_;
};

unisubs.player.Html5VideoSource.prototype.setVideoConfig = function(config) {
    this.videoConfig_ = config;
};

unisubs.player.Html5VideoSource.prototype.getAlternateURLs = function() {
    if (this.alternateSources_)
        return goog.array.map(
            this.alternateSources_, 
            function(source) { return source.getVideoURL(); });
    else
        return [];
};

unisubs.player.Html5VideoSource.prototype.setAlternateSources = function(sources) {
    this.alternateSources_ = sources;
};

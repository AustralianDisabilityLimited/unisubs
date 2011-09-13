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

/**
 * @fileoverview An interface for a video source
 *
 */

goog.provide('unisubs.player.MediaSource');

/**
 *
 * @interface
 */
unisubs.player.MediaSource = function() {};

/**
 * Creates a player for the page, not the widget.
 * @return {unisubs.player.AbstractVideoPlayer} 
 */
unisubs.player.MediaSource.prototype.createPlayer = function() {};
/**
 * Creates a player for the widget.
 * @return {unisubs.player.ControlledVideoPlayer}
 */
unisubs.player.MediaSource.prototype.createControlledPlayer = function() {};

/**
 * @return {string}
 */
unisubs.player.MediaSource.prototype.getVideoURL = function() {};

/**
 *
 * @param {Array} videoSpecs This is an array in which each element is either 
 *   a string (for a url) or an object with properties "url" and "config".
 * @return {?unisubs.player.MediaSource} video source, or null if none found.
 */
unisubs.player.MediaSource.bestVideoSource = function(videoSpecs) {
    var videoSources = goog.array.map(videoSpecs, function(spec) {
        return unisubs.player.MediaSource.videoSourceForSpec_(spec);
    });
    var vt = unisubs.player.Html5VideoType;
    var preferenceOrdering = [vt.OGG, vt.WEBM, vt.H264];
    for (var i = 0; i < preferenceOrdering.length; i++) {
        if (unisubs.player.supportsVideoType(preferenceOrdering[i])) {
            var videoSource = unisubs.player.MediaSource.html5VideoSource_(
                videoSources, preferenceOrdering[i]);
            if (videoSource != null)
                return videoSource;
        }
    }
    // browser does not support any available html5 formats. Return a flash format.
    var videoSource = goog.array.find(
        videoSources,
        function(v) { return !(v instanceof unisubs.player.Html5VideoSource); });
    if (videoSource != null)
        return videoSource;
    // if we got this far, first return mp4 for player fallback. then return anything.
    var videoSource = unisubs.player.MediaSource.html5VideoSource_(
        videoSources, vt.H264);
    if (videoSource != null)
        return videoSource;
    return videoSources.length > 0 ? videoSources[0] : null;
};

unisubs.player.MediaSource.videoSourceForSpec_ = function(videoSpec) {
    if (goog.isString(videoSpec))
        return unisubs.player.MediaSource.videoSourceForURL(
            videoSpec);
    else
        return unisubs.player.MediaSource.videoSourceForURL(
            videoSpec['url'], videoSpec['config']);
};

unisubs.player.MediaSource.html5VideoSource_ = function(videoSources, videoType) {
    return goog.array.find(
        videoSources, 
        function(v) { 
            return (v instanceof unisubs.player.Html5VideoSource) && 
                v.getVideoType() == videoType; 
        });
};

/**
 * Returns null if we can't get VideoSource without asking the server
 * for more info.
 *
 */
unisubs.player.MediaSource.videoSourceForURL = function(videoURL, opt_videoConfig) {
    var blipFileGetRegex = /^\s*https?:\/\/([^\.]+\.)*blip\.tv\/file\/get\//;
    if (unisubs.player.YoutubeVideoSource.isYoutube(videoURL)) {
        var videoSource = null;
        if (unisubs.supportsIFrameMessages()) {
            videoSource = unisubs.player.YTIFrameVideoSource.forURL(
                videoURL, opt_videoConfig);
        }
        else {
            videoSource = unisubs.player.YoutubeVideoSource.forURL(
                videoURL, opt_videoConfig);
        }
        if (videoSource != null)
            return videoSource;
    }
    else if (/^\s*https?:\/\/([^\.]+\.)?vimeo/.test(videoURL)) {
        var videoIDExtract = /vimeo.com\/([0-9]+)/i.exec(videoURL);
        if (videoIDExtract)
            return new unisubs.player.VimeoVideoSource(
                videoIDExtract[1], videoURL, opt_videoConfig);
    }
    else if (/^\s*https?:\/\/([^\.]+\.)?dailymotion/.test(videoURL)) {
        var videoIDExtract = /dailymotion.com\/video\/([0-9a-z]+)/i.exec(videoURL);
        if (videoIDExtract)
            return new unisubs.player.DailymotionVideoSource(
                videoIDExtract[1], videoURL);
    }
    else if (/^\s*https?:\/\/([^\.]+\.)?blip\.tv/.test(videoURL) &&
             !blipFileGetRegex.test(videoURL)) {
        return new unisubs.player.BlipTVPlaceholder(videoURL);
    }
    else if (/\.flv$|\.mov$/i.test(videoURL)) {
        return new unisubs.player.FlvVideoSource(videoURL, opt_videoConfig);
    }
    else if (unisubs.player.BrightcoveVideoSource.isBrightcove(videoURL)) {
        return unisubs.player.BrightcoveVideoSource.forURL(videoURL);
    }
    else {
        var videoSource = 
            unisubs.player.Html5VideoSource.forURL(videoURL, opt_videoConfig);
        if (videoSource != null)
            return videoSource;
    }
    
    throw new Error("Unrecognized video url " + videoURL);
};

/**
 * @deprecated Use unisubs.player.YoutubeVideoSource.isYoutube
 */
unisubs.player.MediaSource.isYoutube = function(videoURL) {
    return unisubs.player.YoutubeVideoSource.isYoutube(videoURL);
};

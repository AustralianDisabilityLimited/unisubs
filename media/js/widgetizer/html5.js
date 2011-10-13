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

goog.provide('unisubs.widgetizer.HTML5');

/**
 * @constructor
 *
 */
unisubs.widgetizer.HTML5 = function() {
    unisubs.widgetizer.VideoPlayerMaker.call(this);
};
goog.inherits(unisubs.widgetizer.HTML5, 
              unisubs.widgetizer.VideoPlayerMaker);

unisubs.widgetizer.HTML5.prototype.makeVideoPlayers = function() {
    var videoElements = this.unwidgetizedVideos_();
    var videoPlayers = [];
    for (var i = 0; i < videoElements.length; i++) {
        var videoSource = this.makeVideoSource_(videoElements[i]);
        if (videoSource) {
            var videoPlayer = videoSource.createPlayer();
            videoPlayer.decorate(videoElements[i]);
            videoPlayers.push(videoPlayer);
        }
    }
    return videoPlayers;
};

unisubs.widgetizer.HTML5.prototype.unwidgetizedVideos_ = function() {
    return this.filterUnwidgetized(
        document.getElementsByTagName('video'));
};

unisubs.widgetizer.HTML5.prototype.makeVideoSource_ = 
    function(videoElement) 
{
    var sources = [];
    if (videoElement.src)
        sources.push(this.makeVideoSourceForURL_(videoElement.src));
    else {
        var sourceElements = videoElement.getElementsByTagName('source');
        for (var i = 0; i < sourceElements.length; i++)
            sources.push(this.makeVideoSourceForURL_(sourceElements[i].src));
    }
    for (var i = 0; i < sources.length; i++)
        if (unisubs.player.supportsVideoType(sources[i].getVideoType())) {
            var alternateSources = [];
            for (var j = 0; j < sources.length; j++)
                if (j != i)
                    alternateSources.push(sources[j]);
            sources[i].setAlternateSources(alternateSources);
            return sources[i];
        }
    return null;
};

unisubs.widgetizer.HTML5.prototype.makeVideoSourceForURL_ = function(urlString) {
    var uri = new goog.Uri(urlString);
    if (!uri.hasDomain())
        uri = new goog.Uri(window.location).resolve(uri);
    return unisubs.player.Html5VideoSource.forURL(uri.toString());
};

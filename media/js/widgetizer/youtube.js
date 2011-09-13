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

goog.provide('unisubs.widgetizer.Youtube');

/**
 * @constructor
 *
 */
unisubs.widgetizer.Youtube = function() {
    unisubs.widgetizer.VideoPlayerMaker.call(this);
    /**
     * @const
     */
    this.ON_YT_SITE = unisubs.widgetizer.Youtube.onYTSite();
};
goog.inherits(unisubs.widgetizer.Youtube,
              unisubs.widgetizer.VideoPlayerMaker);

unisubs.widgetizer.Youtube.onYTSite = function() {
    return window.location.hostname.match(/youtube\.com$/) != null;
};

unisubs.widgetizer.Youtube.prototype.logger_ =
    goog.debug.Logger.getLogger('unisubs.widgetizer.Youtube');

unisubs.widgetizer.Youtube.prototype.makeVideoPlayers = function() {
    var elements = this.unwidgetizedElements_();
    var videoPlayers = [];
    for (var i = 0; i < elements.length; i++) {
        var decoratable = this.isDecoratable_(elements[i]);
        var videoSource = this.makeVideoSource_(
            elements[i], !decoratable);
        var videoPlayer = videoSource.createPlayer();
        videoPlayers.push(videoPlayer);
        if (decoratable)
            videoPlayer.decorate(elements[i]);
        else
            this.replaceVideoElement_(videoPlayer, elements[i]);
    }
    return videoPlayers;
};

unisubs.widgetizer.Youtube.prototype.isDecoratable_ = function(element) {
    return unisubs.Flash.findFlashParam(element, 'allowscriptaccess') == 'always' &&
        unisubs.Flash.swfURL(element).match(/enablejsapi=1/i) &&
        goog.array.contains(['transparent', 'opaque'], 
                            unisubs.Flash.findFlashParam(element, 'wmode'));
};

unisubs.widgetizer.Youtube.prototype.makeVideoSource_ = 
    function(element, includeConfig) 
{
    var url = unisubs.Flash.swfURL(element);
    var config = null;
    if (includeConfig) {
        config = {};
        var uri = new goog.Uri(url, true);
        var params = uri.getQueryData().getKeys();
        for (var i = 0; i < params.length; i++)
            config[params[i]] = uri.getParameterValue(params[i]);
        if (unisubs.Flash.findFlashParam(element, 'width') && 
            unisubs.Flash.findFlashParam(element, 'height')) {
            config['width'] = unisubs.Flash.findFlashParam(element, 'width');
            config['height'] = unisubs.Flash.findFlashParam(element, 'height');
        }
        else if (element.style.width && element.style.height) {
            config['width'] = parseInt(element.style['width']) + '';
            config['height'] = parseInt(element.style['height']) + '';
        }
    }
    var youtubePageURL = this.ON_YT_SITE ? window.location.href : url;
    return unisubs.player.YoutubeVideoSource.forURL(
        youtubePageURL, config);
};

unisubs.widgetizer.Youtube.prototype.replaceVideoElement_ = 
    function(player, element) 
{
    // this might get extracted to superclass as soon as we include 
    // players other than youtube.
    if (element.nodeName == "EMBED" && element.parentNode.nodeName == "OBJECT")
        element = element.parentNode;
    var nextNode = goog.dom.getNextElementSibling(element);
    var parent = element.parentNode;
    goog.dom.removeNode(element);
    if (nextNode)
        player.renderBefore(nextNode);
    else
        player.render(parent);
};

unisubs.widgetizer.Youtube.prototype.isFlashElementAPlayer = function(element) {
    return unisubs.player.YoutubeVideoSource.isYoutube(
        unisubs.Flash.swfURL(element));
};

unisubs.widgetizer.Youtube.prototype.unwidgetizedElements_ = function() {
    if (this.ON_YT_SITE) {
        var moviePlayer = goog.dom.getElement('movie_player');
        var elements = moviePlayer ? [moviePlayer] : [];
        return this.filterUnwidgetized(elements);
    }
    return unisubs.widgetizer.Youtube.superClass_.
        unwidgetizedFlashElements.call(this);
};

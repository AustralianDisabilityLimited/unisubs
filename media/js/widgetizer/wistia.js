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

goog.provide('unisubs.widgetizer.Wistia');

/**
 * @constructor
 *
 */
unisubs.widgetizer.Wistia = function() {
    unisubs.widgetizer.VideoPlayerMaker.call(this);
};
goog.inherits(unisubs.widgetizer.Wistia,
              unisubs.widgetizer.VideoPlayerMaker);

unisubs.widgetizer.Wistia.prototype.makeVideoPlayers = function() {
    var elements = this.unwidgetizedElements_();
    return  goog.array.map(
        elements,
        function(elem) {
            var videoPlayer = new unisubs.player.WistiaVideoPlayer();
            videoPlayer.decorate(elem);
            return videoPlayer;
        },
        this);
};

unisubs.widgetizer.Wistia.prototype.videoURLForElement_ = function(elem) {
    var flashVars = unisubs.Flash.flashVars(elem);
    var queryData = new goog.Uri.QueryData(flashVars);
    return queryData.get("videoUrl", null);
};

unisubs.widgetizer.Wistia.prototype.isFlashElementAPlayer = function(element) {
    var videoURLString = this.videoURLForElement_(element);
    if (!goog.isNull(videoURLString)) {
        var uri = new goog.Uri(videoURLString);
        return /wistia\.com/.test(uri.getDomain());
    }
    else {
        return false;
    }
};

unisubs.widgetizer.Wistia.prototype.unwidgetizedElements_ = function() {
    return unisubs.widgetizer.Wistia.superClass_.
        unwidgetizedFlashElements.call(this);
};
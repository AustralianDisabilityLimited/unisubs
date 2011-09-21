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

goog.provide('unisubs.player.OoyalaPlayer');

/**
 * @constructor
 * @param {unisubs.player.OoyalaVideoSource} videoSource
 */
unisubs.player.OoyalaPlayer = function(videoSource) {
    unisubs.player.FlashVideoPlayer.call(this, videoSource);
    this.videoSource_ = videoSource;
};
goog.inherits(unisubs.player.OoyalaPlayer, unisubs.player.FlashVideoPlayer);

unisubs.player.YoutubeVideoPlayer.readyAPIIDs_ = new goog.structs.Set();

unisubs.player.OoyalaPlayer.prototype.widgetize = function(callback, playerId, eventName) {
    
};

unisubs.player.OoyalaPlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.OoyalaPlayer.superClass_.decorateInternal.call(this, elem);
    
};

unisubs.player.OoyalaPlayer.Event_ = {
    API_READY: "apiReady",
    METADATA_READY: "meta"
};
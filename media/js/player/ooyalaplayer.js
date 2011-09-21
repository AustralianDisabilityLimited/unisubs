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
unisubs.player.OoyalaPlayer = function(videoSource, playerID) {
    unisubs.player.AbstractVideoPlayer.call(this, videoSource);
    this.videoSource_ = videoSource;
};
goog.inherits(unisubs.player.OoyalaPlayer, unisubs.player.AbstractVideoPlayer);

unisubs.player.OoyalaPlayer.readyPlayerIDs_ = new goog.structs.Set();
/**
 * mapping of playerID -> player.
 */
unisubs.player.OoyalaPlayer.players_ = {};

unisubs.player.OoyalaPlayer.callbackMade = function(playerID, eventName, eventParams) {
    if (eventName == unisubs.player.OoyalaPlayer.Event_.API_READY &&
        !unisubs.player.OoyalaPlayer.readyPlayerIDs_.contains(playerID))
    {
        unisubs.player.OoyalaPlayer.readyPlayerIDs_.add(playerID);
        var player = new unisubs.player.OoyalaPlayer(null, playerID);
        player.decorate(goog.dom.getElement(playerID));
        unisubs.player.OoyalaPlayer.players_[playerID] = player;
        return player;
    }
    else {
        unisubs.player.OoyalaPlayer.players_[playerID].callback(eventName, eventParams);
    }
};

unisubs.player.OoyalaPlayer.prototype.callback = function(eventName, eventParams) {
    
};

unisubs.player.OoyalaPlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.OoyalaPlayer.superClass_.decorateInternal.call(this, elem);
    
};

unisubs.player.OoyalaPlayer.Event_ = {
    API_READY: "apiReady",
    METADATA_READY: "meta",
    STATE_CHANGED: "stateChanged",
    PLAYHEAD_TIME_CHANGED: "playheadTimeChanged"
};
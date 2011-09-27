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

goog.provide('unisubs.player.BrightcoveLitePlayer');

/**
 * @constructor
 */
unisubs.player.BrightcoveLitePlayer = function(experienceID) {
    unisubs.player.AbstractVideoPlayer.call(this, null);
    this.experienceID_ = experienceID;
    this.logger_ = goog.debug.Logger.getLogger(
        "unisubs.player.BrightcoveLitePlayer");
    this.playheadTimer_ = new goog.Timer(100);
};
goog.inherits(unisubs.player.BrightcoveLitePlayer, unisubs.player.AbstractVideoPlayer);

unisubs.player.BrightcoveLitePlayer.readyExperienceIDs_ = new goog.structs.Set();

/**
 * mapping of playerID -> player.
 */
unisubs.player.BrightcoveLitePlayer.players_ = {};

unisubs.player.BrightcoveLitePlayer.templateReady = function(experienceID) {
    if (!unisubs.player.BrightcoveLitePlayer.readyExperienceIDs_.contains(experienceID)) {
        unisubs.player.BrightcoveLitePlayer.readyExperienceIDs_.add(experienceID);
        var player = new unisubs.player.BrightcoveLitePlayer(experienceID);
        player.decorate(goog.dom.getElement(experienceID));
        return player;
    }
    return null;
};

unisubs.player.BrightcoveLitePlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.BrightcoveLitePlayer.superClass_.decorateInternal.call(this, elem);
    this.player_ = goog.dom.getElement(this.experienceID_);
    this.playerSize_ = goog.style.getSize(this.getElement());
    if (goog.DEBUG) {
        this.logger_.info("player size is " + this.playerSize_);
    }
    this.bcExp_ = window['brightcove']['getExperience'](this.experienceID_);
    this.modVP_ = this.bcExp_["getModule"](window["APIModules"]["VIDEO_PLAYER"]);
    this.getHandler().listen(
        this.playheadTimer_,
        goog.Timer.TICK,
        goog.bind(this.dispatchEvent, this, 
                  unisubs.player.AbstractVideoPlayer.EventType.TIMEUPDATE));
    this.modVP_.addEventListener(
        window["BCMediaEvent"]["PLAY"],
        goog.bind(this.onPlay_, this));
};

unisubs.player.BrightcoveLitePlayer.prototype.getPlayheadTime = function() {
    return this.modVP_["getVideoPosition"]();
};

unisubs.player.BrightcoveLitePlayer.prototype.onPlay_ = function(e) {
    if (goog.DEBUG) {
        this.logger_.info("playing");
    }
    this.playheadTimer_.start();
};

unisubs.player.BrightcoveLitePlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};

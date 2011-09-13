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

goog.provide('unisubs.player.BrightcoveVideoSource');
/**
 * @constructor
 * @implements {unisubs.player.MediaSource}
 * @param {string} playerID Brightcove player id
 * @param {string} playerKey Brightcove player key
 * @param {string} videoID Brightcove video id* 
 * @param {Object.<string, *>=} opt_videoConfig Params to use for 
 *     brightCove query string, plus optional 'width' and 'height' 
 *     parameters.
 */
unisubs.player.BrightcoveVideoSource = function(playerID, playerKey, videoID, opt_videoConfig) {
    this.playerID_ = playerID;
    this.videoID_ = videoID;
    this.playerKey_ = playerKey;
    this.uuid_ = unisubs.randomString();
    this.videoConfig_ = opt_videoConfig;
};

/* @const
 * @type {string} 
 */
unisubs.player.BrightcoveVideoSource.BASE_DOMAIN = "brightcove.com";

unisubs.player.BrightcoveVideoSource.forURL = 
    function(videoURL, opt_videoConfig) 
{
    
    if (unisubs.player.BrightcoveVideoSource.isBrightcove(videoURL)){
        var uri = new goog.Uri(videoURL);
        var playerKey = uri.getParameterValue("bckey");
        var videoID = uri.getParameterValue("bctid");
        var playerID;
        try{
             playerID =  /bcpid([\d])+/.exec(videoURL)[0].substring(5);
        }catch(e){
            
        }
        if (!opt_videoConfig){
            opt_videoConfig = {};
        }
        opt_videoConfig["uri"] = videoURL;
        if (playerID){
            return new unisubs.player.BrightcoveVideoSource(
                playerID, playerKey, videoID, opt_videoConfig);    
        }
        
    }
    return null;
};

unisubs.player.BrightcoveVideoSource.isBrightcove = function(videoURL) {
    var uri = new goog.Uri(videoURL);
    return   goog.string.caseInsensitiveEndsWith(
        uri.getDomain(),
        unisubs.player.BrightcoveVideoSource.BASE_DOMAIN);
};

unisubs.player.BrightcoveVideoSource.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.player.BrightcoveVideoSource.prototype.createControlledPlayer = 
    function() 
{
    return new unisubs.player.ControlledVideoPlayer(this.createPlayer_(true));
};

unisubs.player.BrightcoveVideoSource.prototype.createPlayer_ = function(forDialog) {
    return new unisubs.player.BrightcoveVideoPlayer(
        new unisubs.player.BrightcoveVideoSource(
            this.playerID_, this.playerKey_, this.videoID_, this.videoConfig_), 
        forDialog);
};

unisubs.player.BrightcoveVideoSource.prototype.getPlayerID = function() {
    return this.playerID_;
};

unisubs.player.BrightcoveVideoSource.prototype.getVideoID = function() {
    return this.videoID_;
};

unisubs.player.BrightcoveVideoSource.prototype.getPlayerKey = function() {
     return this.playerKey_;
};

unisubs.player.BrightcoveVideoSource.prototype.getUUID = function() {
    return this.uuid_;
};

unisubs.player.BrightcoveVideoSource.prototype.getVideoConfig = function() {
    return this.videoConfig_;
};

unisubs.player.BrightcoveVideoSource.prototype.setVideoConfig = function(config) {
    this.videoConfig_ = config;
};


unisubs.player.BrightcoveVideoSource.prototype.getVideoURL = function() {
    return this.videoConfig_["url"];
};

unisubs.player.BrightcoveVideoSource.EMBED_SOURCE = "http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1";
unisubs.player.BrightcoveVideoSource.prototype.toString = function() {
    return "BrightcoveVideoSource " + this.videoID_;
}

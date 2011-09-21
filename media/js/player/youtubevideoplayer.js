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

goog.provide('unisubs.player.YoutubeVideoPlayer');

/**
 * @constructor
 * @param {unisubs.player.YoutubeVideoSource} videoSource
 * @param {boolean=} opt_forDialog
 */
unisubs.player.YoutubeVideoPlayer = function(videoSource, opt_forDialog) {
    unisubs.player.FlashVideoPlayer.call(this, videoSource);
    this.videoSource_ = videoSource;
    this.playerAPIID_ = [videoSource.getUUID(),
                         '' + new Date().getTime()].join('');
    this.playerElemID_ = videoSource.getUUID() + "_ytplayer";
    this.eventFunction_ = 'event' + videoSource.getUUID();
    this.forDialog_ = !!opt_forDialog;

    unisubs.player.YoutubeVideoPlayer.players_.push(this);

    this.playerSize_ = null;
    this.player_ = null;
    /**
     * Array of functions to execute once player is ready.
     */
    this.commands_ = [];
    this.swfEmbedded_ = false;
    this.progressTimer_ = new goog.Timer(
        unisubs.player.AbstractVideoPlayer.PROGRESS_INTERVAL);
    this.timeUpdateTimer_ = new goog.Timer(
        unisubs.player.AbstractVideoPlayer.TIMEUPDATE_INTERVAL);
    goog.mixin(unisubs.player.YoutubeVideoPlayer.prototype,
               unisubs.player.YoutubeBaseMixin.prototype);
};
goog.inherits(unisubs.player.YoutubeVideoPlayer, unisubs.player.FlashVideoPlayer);

unisubs.player.YoutubeVideoPlayer.players_ = [];
unisubs.player.YoutubeVideoPlayer.readyAPIIDs_ = new goog.structs.Set();

unisubs.player.YoutubeVideoPlayer.prototype.logger_ = 
    goog.debug.Logger.getLogger('unisubs.player.YoutubeVideoPlayer');

/**
 * @override
 */
unisubs.player.YoutubeVideoPlayer.prototype.isFlashElementReady = function(elem) {
    return elem['playVideo'];
};

unisubs.player.YoutubeVideoPlayer.prototype.windowReadyAPIIDsContains_ = function(apiID) {
    // this is activated if a widgetizer user has inserted the widgetizerprimer
    // into the HEAD of their document.
    var arr = window['unisubs_readyAPIIDs'];
    return arr && goog.array.contains(arr, apiID);
};

unisubs.player.YoutubeVideoPlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.YoutubeVideoPlayer.superClass_.decorateInternal.call(this, elem);
    this.swfEmbedded_ = true;
    var apiidMatch = /playerapiid=([^&]+)/.exec(unisubs.Flash.swfURL(elem));
    this.playerAPIID_ = apiidMatch ? apiidMatch[1] : '';
    if (unisubs.player.YoutubeVideoPlayer.readyAPIIDs_.contains(this.playerAPIID_) ||
        this.windowReadyAPIIDsContains_(this.playerAPIID_))
        this.onYouTubePlayerReady_(this.playerAPIID_);
    this.playerSize_ = goog.style.getSize(this.getElement());
    this.setDimensionsKnownInternal();
    if (goog.DEBUG) {
        this.logger_.info("In decorateInternal, a containing element size of " + 
                          this.playerSize_);
    }
};

/**
 * @override
 */
unisubs.player.YoutubeVideoPlayer.prototype.setFlashPlayerElement = function(elem) {
    this.player_ = elem;
    window[this.eventFunction_] = goog.bind(this.playerStateChange_, this);
    this.player_.addEventListener(
        'onStateChange', this.eventFunction_);
};

unisubs.player.YoutubeVideoPlayer.prototype.createDom = function() {
    unisubs.player.YoutubeVideoPlayer.superClass_.createDom.call(this);
    var sizeFromConfig = this.videoSource_.sizeFromConfig();
    if (!this.forDialog_ && sizeFromConfig)
        this.playerSize_ = sizeFromConfig;
    else
        this.playerSize_ = this.forDialog_ ?
        unisubs.player.AbstractVideoPlayer.DIALOG_SIZE :
        unisubs.player.AbstractVideoPlayer.DEFAULT_SIZE;
    this.setDimensionsKnownInternal();
};

unisubs.player.YoutubeVideoPlayer.prototype.enterDocument = function() {
    unisubs.player.YoutubeVideoPlayer.superClass_.enterDocument.call(this);
    if (!this.swfEmbedded_) {
        this.swfEmbedded_ = true;
        var videoSpan = this.getDomHelper().createDom('span');
        videoSpan.id = unisubs.randomString();
        this.getElement().appendChild(videoSpan);
        var params = { 'allowScriptAccess': 'always', 
                       'wmode' : 'opaque', 
                       'allowFullScreen': 'true' };
        var atts = { 'id': this.playerElemID_, 
                     'style': unisubs.style.setSizeInString(
                         '', this.playerSize_) };
        var uri;
        if (this.forDialog_)
            uri = new goog.Uri('http://www.youtube.com/apiplayer');
        else
            uri = new goog.Uri(
                'http://www.youtube.com/v/' +
                    this.videoSource_.getYoutubeVideoID());
        this.addQueryString_(uri);
        window["swfobject"]["embedSWF"](
            uri.toString(), videoSpan.id, 
            this.playerSize_.width + '', 
            this.playerSize_.height + '', 
            "8", null, null, params, atts);
    }
    this.getHandler().
        listen(this.progressTimer_, goog.Timer.TICK, this.progressTick_).
        listen(this.timeUpdateTimer_, goog.Timer.TICK, this.timeUpdateTick_);
    this.progressTimer_.start();
};
unisubs.player.YoutubeVideoPlayer.prototype.addQueryString_ = function(uri) {
    var config = this.videoSource_.getVideoConfig();
    if (!this.forDialog_ && config) {
        for (var prop in config)
            if (prop != 'width' && prop != 'height')
                uri.setParameterValue(prop, config[prop])
    }
    uri.setParameterValue('enablejsapi', '1').
        setParameterValue('version', '3').
        setParameterValue('playerapiid', this.playerAPIID_);
    if (this.forDialog_)
        uri.setParameterValue('disablekb', '1');
};
unisubs.player.YoutubeVideoPlayer.prototype.exitDocument = function() {
    unisubs.player.YoutubeVideoPlayer.superClass_.exitDocument.call(this);
    this.progressTimer_.stop();
    this.timeUpdateTimer_.stop();
};
unisubs.player.YoutubeVideoPlayer.prototype.onYouTubePlayerReady_ =
    function(playerAPIID)
{
    if (goog.DEBUG) {
        this.logger_.info(
            "onYouTubePlayerReady_ called with an id of " + playerAPIID +
                ". My id is " + this.playerAPIID_ + ".");
    }
    if (playerAPIID != this.playerAPIID_)
        return;
    if (!this.isDecorated()) {
        this.player_ = goog.dom.getElement(this.playerElemID_);
        unisubs.style.setSize(this.player_, this.playerSize_);
        if (this.forDialog_)
            this.player_['cueVideoById'](this.videoSource_.getYoutubeVideoID());
        goog.array.forEach(this.commands_, function(cmd) { cmd(); });
        this.commands_ = [];
        window[this.eventFunction_] = goog.bind(this.playerStateChange_, this);
        this.player_.addEventListener('onStateChange', this.eventFunction_);
    }
    else {
        if (goog.DEBUG) {
            this.logger_.info("In playerReady, a containing element size of " + 
                              goog.style.getSize(this.getElement()));
            this.logger_.info("In playerReady, a sizing element size of " + 
                              goog.style.getSize(this.getElement()));
        }
        this.tryDecoratingAll();
    }
};
unisubs.player.YoutubeVideoPlayer.prototype.needsIFrame = function() {
    return goog.userAgent.LINUX;
};
unisubs.player.YoutubeVideoPlayer.prototype.disposeInternal = function() {
    unisubs.player.YoutubeVideoPlayer.superClass_.disposeInternal.call(this);
    this.progressTimer_.dispose();
    this.timeUpdateTimer_.dispose();
};
unisubs.player.YoutubeVideoPlayer.prototype.getVideoElement = function() {
    return goog.dom.getElement(this.playerElemID_);
};
/**
 * http://code.google.com/apis/youtube/js_api_reference.html#getPlayerState
 * @enum
 */
unisubs.player.YoutubeVideoPlayer.State_ = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    VIDEO_CUED: 5
};

unisubs.player.YoutubeVideoPlayer.logger_ = 
    goog.debug.Logger.getLogger('unisubs.player.YoutubeVideoPlayerStatic');

unisubs.player.YoutubeVideoPlayer.registerReady = function(playerID) {
    if (!unisubs.player.YoutubeVideoPlayer.readyAPIIDs_.contains(playerID)) {
        unisubs.player.YoutubeVideoPlayer.readyAPIIDs_.add(playerID);
        goog.array.forEach(
            unisubs.player.YoutubeVideoPlayer.players_,
            function(p) { p.onYouTubePlayerReady_(playerID); });
    }
};

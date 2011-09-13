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

goog.provide('unisubs.video.DailymotionVideoPlayer');

/**
 * @constructor
 * @param {unisubs.video.DailymotionVideoSource} videoSource
 * @param {boolean=} opt_chromeless
 */
unisubs.video.DailymotionVideoPlayer = function(videoSource, opt_chromeless) {
    unisubs.video.AbstractVideoPlayer.call(this, videoSource);
    this.videoSource_ = videoSource;
    this.chromeless_ = !!opt_chromeless;

    this.player_ = null;
    this.playerAPIID_ = [videoSource.getUUID(),
                         '' + new Date().getTime()].join('');
    this.playerElemID_ = videoSource.getUUID() + "_dailymotionplayer";
    this.eventFunction_ = 'event' + videoSource.getUUID();

    var readyFunc = goog.bind(this.onDailymotionPlayerReady_, this);
    var dmReady = "onDailymotionPlayerReady";
    if (window[dmReady]) {
        var oldReady = window[dmReady];
        window[dmReady] = function(playerAPIID) {
            oldReady(playerAPIID);
            readyFunc(playerAPIID);
        };
    }
    else
        window[dmReady] = readyFunc;

    /**
     * Array of functions to execute once player is ready.
     */
    this.commands_ = [];
    this.swfEmbedded_ = false;
    this.progressTimer_ = new goog.Timer(
        unisubs.video.AbstractVideoPlayer.PROGRESS_INTERVAL);
    this.timeUpdateTimer_ = new goog.Timer(
        unisubs.video.AbstractVideoPlayer.TIMEUPDATE_INTERVAL);
};
goog.inherits(unisubs.video.DailymotionVideoPlayer, unisubs.video.AbstractVideoPlayer);

unisubs.video.DailymotionVideoPlayer.WIDTH = 400;
unisubs.video.DailymotionVideoPlayer.HEIGHT = 300;

unisubs.video.DailymotionVideoPlayer.prototype.enterDocument = function() {
    unisubs.video.DailymotionVideoPlayer.superClass_.enterDocument.call(this);
    if (!this.swfEmbedded_) {
        this.swfEmbedded_ = true;
        var videoDiv = this.getDomHelper().createDom('div');
        videoDiv.id = unisubs.randomString();
        this.getElement().appendChild(videoDiv);
        var params = { 'allowScriptAccess': 'always', 'wmode' : 'opaque' };
        var atts = { 'id': this.playerElemID_,
                     'style': unisubs.style.setSizeInString(
                         '', this.getVideoSize()) };
        var baseURL = 'http://www.dailymotion.com/swf';
        var queryString =
            ['?chromeless=', this.chromeless_ ? 1 : 0,
             '&enableApi=1',
             '&playerapiid=', this.playerAPIID_].join('');
        this.setDimensionsKnownInternal();
        window["swfobject"]["embedSWF"](
            [baseURL, queryString].join(''),
            videoDiv.id, unisubs.video.DailymotionVideoPlayer.WIDTH,
            unisubs.video.DailymotionVideoPlayer.HEIGHT, "8",
            null, null, params, atts);
    }
    this.getHandler().
        listen(this.progressTimer_, goog.Timer.TICK, this.progressTick_);
    this.getHandler().
        listen(this.timeUpdateTimer_, goog.Timer.TICK, this.timeUpdateTick_);
};
unisubs.video.DailymotionVideoPlayer.prototype.exitDocument = function() {
    unisubs.video.DailymotionVideoPlayer.superClass_.exitDocument.call(this);
    this.progressTimer_.stop();
    this.timeUpdateTimer_.stop();
};

unisubs.video.DailymotionVideoPlayer.prototype.getPlayheadTimeInternal = function() {
    return this.player_ ? this.player_['getCurrentTime']() : 0;
};

unisubs.video.DailymotionVideoPlayer.prototype.progressTick_ = function(e) {
    if (this.getDuration() > 0)
        this.dispatchEvent(
            unisubs.video.AbstractVideoPlayer.EventType.PROGRESS);
};

unisubs.video.DailymotionVideoPlayer.prototype.timeUpdateTick_ = function(e) {
    if (this.getDuration() > 0)
        this.sendTimeUpdateInternal();
};

unisubs.video.DailymotionVideoPlayer.prototype.getDuration = function() {
    return this.player_ && this.player_['getDuration'] ? this.player_['getDuration']() : 0;
};

unisubs.video.DailymotionVideoPlayer.prototype.getBufferedLength = function() {
    return this.player_ ? 1 : 0;
};
unisubs.video.DailymotionVideoPlayer.prototype.getBufferedStart = function(index) {
    if (!this.player_) return 0;
    
    var startBytes = this.player_['getVideoStartBytes']();
    var totalBytes = this.player_['getVideoBytesTotal']();
    return this.getDuration() * (1.0 * startBytes / (startBytes + totalBytes));
};
unisubs.video.DailymotionVideoPlayer.prototype.getBufferedEnd = function(index) {
    if (!this.player_) return 0;
    
    var startBytes = this.player_['getVideoStartBytes']();
    var totalBytes = this.player_['getVideoBytesTotal']();
    var loadedBytes = this.player_['getVideoBytesLoaded']();
    return this.getDuration() *
        (1.0 * (startBytes + loadedBytes) / (startBytes + totalBytes));
};

unisubs.video.DailymotionVideoPlayer.prototype.getVolume = function() {
    return this.player_ ? this.player_['getVolume']() / 100.0 : 0;
};
unisubs.video.DailymotionVideoPlayer.prototype.setVolume = function(volume) {
    if (this.player_) {
        this.player_['setVolume'](100 * volume);
    }
    else
        this.commands_.push(goog.bind(this.setVolume, this, volume));
};

unisubs.video.DailymotionVideoPlayer.prototype.setPlayheadTime = function(playheadTime , skipsUpdateEvent) {
    if (this.player_) {
        // FIXME: temp workaround for http://bugzilla.pculture.org/show_bug.cgi?id=14834
        playheadTime = Math.max(playheadTime, 1);
        this.player_['seekTo'](playheadTime);
        if (!skipsUpdateEvent)this.sendTimeUpdateInternal();
    }
    else
        this.commands_.push(goog.bind(this.setPlayheadTime, this, playheadTime));
};

unisubs.video.DailymotionVideoPlayer.prototype.getVideoSize = function() {
    return new goog.math.Size(unisubs.video.DailymotionVideoPlayer.WIDTH,
                              unisubs.video.DailymotionVideoPlayer.HEIGHT);
};

unisubs.video.DailymotionVideoPlayer.prototype.isPausedInternal = function() {
    return this.getPlayerState_() == unisubs.video.DailymotionVideoPlayer.State_.PAUSED;
};
unisubs.video.DailymotionVideoPlayer.prototype.isPlayingInternal = function() {
    return this.getPlayerState_() == unisubs.video.DailymotionVideoPlayer.State_.PLAYING;
};
unisubs.video.DailymotionVideoPlayer.prototype.videoEndedInternal = function() {
    return this.getPlayerState_() == unisubs.video.DailymotionVideoPlayer.State_.ENDED;
};
unisubs.video.DailymotionVideoPlayer.prototype.playInternal = function() {
    if (this.player_) {
        this.player_['playVideo']();
        this.timeUpdateTimer_.start();
    }
    else
        this.commands_.push(goog.bind(this.playInternal, this));
};
unisubs.video.DailymotionVideoPlayer.prototype.pauseInternal = function() {
    if (this.player_) {
        this.player_['pauseVideo']();
        this.timeUpdateTimer_.stop();
    }
    else
        this.commands_.push(goog.bind(this.pauseInternal, this));
};

unisubs.video.DailymotionVideoPlayer.prototype.stopLoadingInternal = function() {
    if (this.player_) {
        this.player_['stopVideo']();
        return true;
    }
    else {
        this.commands_.push(goog.bind(this.stopLoadingInternal, this));
        return false;
    }
};
unisubs.video.DailymotionVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    if (this.player_) {
        this.player_['cueVideoById'](this.videoSource_.getVideoId());
        this.setPlayheadTime(playheadTime);
	this.setLoadingStopped(false);
    }
    else
        this.commands_.push(goog.bind(this.resumeLoadingInternal, this, playheadTime));
};

unisubs.video.DailymotionVideoPlayer.prototype.playerStateChange_ = function(newState) {
    var s = unisubs.video.DailymotionVideoPlayer.State_;
    var et = unisubs.video.AbstractVideoPlayer.EventType;
    if (newState == s.PLAYING) {
        this.dispatchEvent(et.PLAY);
        this.timeUpdateTimer_.start();
    }
    else if (newState == s.PAUSED) {
        this.dispatchEvent(et.PAUSE);
        this.timeUpdateTimer_.stop();
    }
    else if (newState == s.ENDED)
        this.dispatchEndedEvent();
};

unisubs.video.DailymotionVideoPlayer.prototype.getPlayerState_ = function() {
    return this.player_ ? this.player_['getPlayerState']() : -1;
};

unisubs.video.DailymotionVideoPlayer.prototype.onDailymotionPlayerReady_ = 
    function(playerAPIID) {
    if (playerAPIID == this.playerAPIID_) {
        this.player_ = goog.dom.$(this.playerElemID_);
        this.player_['cueVideoById'](this.videoSource_.getVideoId());
        goog.array.forEach(this.commands_, function(cmd) { cmd(); });
        this.commands_ = [];
        window[this.eventFunction_] = goog.bind(this.playerStateChange_, this);
        this.progressTimer_.start();
        this.player_['addEventListener']('onStateChange', this.eventFunction_);
    }
};

unisubs.video.DailymotionVideoPlayer.prototype.disposeInternal = function() {
    unisubs.video.DailymotionVideoPlayer.superClass_.disposeInternal.call(this);
    this.progressTimer_.dispose();
    this.timeUpdateTimer_.dispose();
};

unisubs.video.DailymotionVideoPlayer.prototype.needsIFrame = function() {
    return goog.userAgent.LINUX;
};

/**
 * http://www.dailymotion.com/us/doc/api/player/javascript_api
 */
unisubs.video.DailymotionVideoPlayer.State_ = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    VIDEO_CUED: 5
};

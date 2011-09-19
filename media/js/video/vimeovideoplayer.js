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

goog.provide('unisubs.video.VimeoVideoPlayer');

/**
 * @constructor
 * @param {unisubs.video.VimeoVideoSource} videoSource
 * @param {boolean=} opt_forDialog
 */
unisubs.video.VimeoVideoPlayer = function(videoSource, opt_forDialog) {
    unisubs.video.AbstractVideoPlayer.call(this, videoSource);
    this.videoSource_ = videoSource;
    this.forDialog_ = !!opt_forDialog;

    this.player_ = null;
    this.playerAPIID_ = [videoSource.getUUID(),
                         '' + new Date().getTime()].join('');
    this.playerElemID_ = videoSource.getUUID() + "_vimeoplayer";
    this.eventFunction_ = 'event' + videoSource.getUUID();

    this.loadedFraction_ = 0;

    var readyFunc = goog.bind(this.onVimeoPlayerReady_, this);
    var vpReady = "vimeo_player_loaded";
    if (window[vpReady]) {
        var oldReady = window[vpReady];
        window[vpReady] = function(playerAPIID) {
            oldReady(playerAPIID);
            readyFunc(playerAPIID);
        };
    }
    else
        window[vpReady] = readyFunc;

    this.playerSize_ = null;
    this.player_ = null;
    /**
     * Array of functions to execute once player is ready.
     */
    this.commands_ = [];
    this.swfEmbedded_ = false;
    this.timeUpdateTimer_ = new goog.Timer(
        unisubs.video.AbstractVideoPlayer.TIMEUPDATE_INTERVAL);
};
goog.inherits(unisubs.video.VimeoVideoPlayer, unisubs.video.AbstractVideoPlayer);

unisubs.video.VimeoVideoPlayer.prototype.createDom = function() {
    // FIXME: this is copied directly from youtube video player.
    unisubs.video.VimeoVideoPlayer.superClass_.createDom.call(this);
    var sizeFromConfig = this.sizeFromConfig_();
    if (!this.forDialog_ && sizeFromConfig)
        this.playerSize_ = sizeFromConfig;
    else
        this.playerSize_ = this.forDialog_ ?
        unisubs.video.AbstractVideoPlayer.DIALOG_SIZE :
        unisubs.video.AbstractVideoPlayer.DEFAULT_SIZE;
};

unisubs.video.VimeoVideoPlayer.prototype.enterDocument = function() {
    unisubs.video.VimeoVideoPlayer.superClass_.enterDocument.call(this);
    if (!this.swfEmbedded_) {
        this.swfEmbedded_ = true;
        var videoSpan = this.getDomHelper().createDom('span');
        videoSpan.id = unisubs.randomString();
        this.getElement().appendChild(videoSpan);
        var params = { 'allowScriptAccess': 'always', 
                       'wmode' : 'opaque',
                       'allowfullscreen': 'true'};
        var atts = { 'id': this.playerElemID_,
                     'style': unisubs.style.setSizeInString(
                         '', this.playerSize_) };
        this.setDimensionsKnownInternal();
        var swfURL = this.createSWFURL_();
        window["swfobject"]["embedSWF"](
            this.createSWFURL_(),
            videoSpan.id, this.playerSize_.width + '',
            this.playerSize_.height + '', "8",
            null, null, params, atts);
    }
    this.getHandler().
        listen(this.timeUpdateTimer_, goog.Timer.TICK, this.timeUpdateTick_);
};

unisubs.video.VimeoVideoPlayer.prototype.createSWFURL_ = function() {
    var baseQuery = {};
    var config = this.videoSource_.getVideoConfig();
    if (!this.forDialog_ && config)
        baseQuery = config;
    goog.object.extend(
        baseQuery, {
            'js_api': '1',
            'width': this.playerSize_.width,
            'height': this.playerSize_.height,
            'clip_id': this.videoSource_.getVideoId(),
            'js_swf_id': this.playerAPIID_
        });
    return 'http://vimeo.com/moogaloop.swf?' +
        goog.Uri.QueryData.createFromMap(baseQuery).toString();
};

unisubs.video.VimeoVideoPlayer.prototype.exitDocument = function() {
    unisubs.video.VimeoVideoPlayer.superClass_.exitDocument.call(this);
    this.timeUpdateTimer_.stop();
};

unisubs.video.VimeoVideoPlayer.prototype.sizeFromConfig_ = function() {
    // FIXME: duplicates same method in youtube player
    var config = this.videoSource_.getVideoConfig();
    if (config && config['width'] && config['height'])
        return new goog.math.Size(
            parseInt(config['width']), parseInt(config['height']));
    else
        return null;
};

unisubs.video.VimeoVideoPlayer.prototype.getPlayheadTimeInternal = function() {
    return this.swfLoaded_ ? this.player_['api_getCurrentTime']() : 0;
};

unisubs.video.VimeoVideoPlayer.prototype.timeUpdateTick_ = function(e) {
    if (this.getDuration() > 0)
        this.sendTimeUpdateInternal();
};

unisubs.video.VimeoVideoPlayer.prototype.getDuration = function() {
    return this.player_['api_getDuration']();
};

unisubs.video.VimeoVideoPlayer.prototype.getBufferedLength = function() {
    return this.player_ ? 1 : 0;
};
unisubs.video.VimeoVideoPlayer.prototype.getBufferedStart = function(index) {
    // vimeo seems to only buffer from the start
    return 0;
};
unisubs.video.VimeoVideoPlayer.prototype.getBufferedEnd = function(index) {
    return this.loadedFraction_ * this.getDuration();
};
unisubs.video.VimeoVideoPlayer.prototype.getVolume = function() {
    return this.player_ ? this.player_['api_getVolume']() : 0.5;
};
unisubs.video.VimeoVideoPlayer.prototype.setVolume = function(volume) {
    if (this.player_) {
        this.player_['api_setVolume'](volume * 100);
    }
    else
        this.commands_.push(goog.bind(this.setVolume, this, volume));
};

unisubs.video.VimeoVideoPlayer.prototype.setPlayheadTime = function(playheadTime) {
    if (this.player_) {
        this.player_['api_seekTo'](playheadTime);
        this.sendTimeUpdateInternal();
    }
    else
        this.commands_.push(goog.bind(this.setPlayheadTime, this, playheadTime));
};

unisubs.video.VimeoVideoPlayer.prototype.getVideoSize = function() {
    return new goog.math.Size(unisubs.video.VimeoVideoPlayer.WIDTH,
                              unisubs.video.VimeoVideoPlayer.HEIGHT);
};

unisubs.video.VimeoVideoPlayer.prototype.isPausedInternal = function() {
    return !this.isPlaying_;
};
unisubs.video.VimeoVideoPlayer.prototype.isPlayingInternal = function() {
    return this.isPlaying_;
};
unisubs.video.VimeoVideoPlayer.prototype.videoEndedInternal = function() {
    return this.getPlayheadTime() == this.getDuration();
};
unisubs.video.VimeoVideoPlayer.prototype.playInternal = function() {
    if (this.swfLoaded_)
        this.player_['api_play']();
    else
        this.commands_.push(goog.bind(this.playInternal, this));
};
unisubs.video.VimeoVideoPlayer.prototype.pauseInternal = function() {
    if (this.swfLoaded_)
        this.player_['api_pause']();
    else
        this.commands_.push(goog.bind(this.pauseInternal, this));
};

unisubs.video.VimeoVideoPlayer.prototype.stopLoadingInternal = function() {
    this.pause();
};
unisubs.video.VimeoVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    this.play();
};



unisubs.video.VimeoVideoPlayer.prototype.onVimeoPlayerReady_ = function(swf_id) {
    if (swf_id != this.playerAPIID_)
        return;

    this.player_ = goog.dom.$(this.playerElemID_);
    this.swfLoaded_ = true;
    goog.array.forEach(this.commands_, function(cmd) { cmd(); });
    this.commands_ = [];
    
    var that = this;

    var randomString = unisubs.randomString();

    var onLoadingFn = "onVimeoLoa" + randomString;
    window[onLoadingFn] = function(data, swf_id) {
        that.loadedFraction_ = data;
        that.dispatchEvent(unisubs.video.AbstractVideoPlayer.EventType.PROGRESS);
    };
    this.player_['api_addEventListener']('onLoading', onLoadingFn);

    var onFinishFn = "onVimeoFin" + randomString;
    window[onFinishFn] = function(data, swf_id) {
        that.dispatchEndedEvent();
    };
    this.player_['api_addEventListener']('onFinish', onFinishFn);

    var onPlayFn = "onVimeoPla" + randomString;
    window[onPlayFn] = function(swfID) {
        that.isPlaying_ = true;
        that.timeUpdateTimer_.start();
    };
    this.player_['api_addEventListener']('onPlay', onPlayFn);

    var onPauseFn = "onVimeoPau" + randomString;
    window[onPauseFn] = function(swfID) {
        that.isPlaying_ = false;
        that.timeUpdatetimer_.stop();
    };
    this.player_['api_addEventListener']('onPause', onPauseFn);
};

unisubs.video.VimeoVideoPlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};

unisubs.video.VimeoVideoPlayer.prototype.disposeInternal = function() {
    unisubs.video.VimeoVideoPlayer.superClass_.disposeInternal.call(this);
    this.timeUpdateTimer_.dispose();
};

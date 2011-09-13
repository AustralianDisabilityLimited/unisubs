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

goog.provide('unisubs.video.FlvVideoPlayer');

/**
 * @constructor
 */
unisubs.video.FlvVideoPlayer = function(videoSource, opt_forDialog) {
    unisubs.video.AbstractVideoPlayer.call(this, videoSource);

    this.forDialog_ = !!opt_forDialog;
    this.videoSource_ = videoSource;
    this.swfEmbedded_ = false;
    this.swfLoaded_ = false;
    this.playerSize_ = null;
    this.player_ = null;
    /**
     * 
     */
    this.commands_ = [];
    this.progressTimer_ = new goog.Timer(
        unisubs.video.AbstractVideoPlayer.PROGRESS_INTERVAL);
    this.timeUpdateTimer_ = new goog.Timer(
        unisubs.video.AbstractVideoPlayer.TIMEUPDATE_INTERVAL);
};
goog.inherits(unisubs.video.FlvVideoPlayer,
              unisubs.video.AbstractVideoPlayer);

unisubs.video.FlvVideoPlayer.prototype.createDom = function() {
    unisubs.video.FlvVideoPlayer.superClass_.createDom.call(this);
    var sizeFromConfig = this.sizeFromConfig_();
    if (!this.forDialog_ && sizeFromConfig)
        this.playerSize_ = sizeFromConfig;
    else
        this.playerSize_ = this.forDialog_ ?
        unisubs.video.AbstractVideoPlayer.DIALOG_SIZE :
        unisubs.video.AbstractVideoPlayer.DEFAULT_SIZE;
};

unisubs.video.FlvVideoPlayer.prototype.enterDocument = function() {
    unisubs.video.FlvVideoPlayer.superClass_.enterDocument.call(this);
    if (!this.swfEmbedded_) {
        this.swfEmbedded_ = true;
        var videoDiv = this.getDomHelper().createDom('div');
        videoDiv.id = unisubs.randomString();
        this.getElement().appendChild(videoDiv);
        this.setDimensionsKnownInternal();
        var flashEmbedParams = {
            'src': unisubs.staticURL() + 'flowplayer/flowplayer-3.2.2.swf',
            'width': this.playerSize_.width + '',
            'height': this.playerSize_.height + '',
            'wmode': 'opaque'
        };
        var that = this;
        var config = {
            'playlist': [{ 
                'url': this.videoSource_.getFlvURL(), 
                'autoPlay': false
            }],
            'onLoad': function() {
                that.swfFinishedLoading_();
            }
        };
        this.addPlugins_(config);
        this.player_ = $f(
            videoDiv.id, flashEmbedParams, config);
    }
    this.getHandler().
        listen(this.progressTimer_, goog.Timer.TICK, this.progressTick_).
        listen(this.timeUpdateTimer_, goog.Timer.TICK, this.timeUpdateTick_);
    this.progressTimer_.start();
};

unisubs.video.FlvVideoPlayer.prototype.addPlugins_ = function(playerConfig) {
    var plugins;
    if (this.forDialog_)
        plugins = { 'controls' : null };
    else {
        var config = this.videoSource_.getVideoConfig();
        if (config) {
            plugins = goog.object.filter(
                config, 
                function(val, key, obj) {
                    return key != 'width' && key != 'height';
                });
        }
    }
    if (plugins)
        playerConfig['plugins'] = plugins;
};

unisubs.video.FlvVideoPlayer.prototype.sizeFromConfig_ = function() {
    var config = this.videoSource_.getVideoConfig();
    if (config && config['width'] && config['height'])
        return new goog.math.Size(
            parseInt(config['width']), parseInt(config['height']));
    else
        return null;
};

unisubs.video.FlvVideoPlayer.prototype.exitDocument = function() {
    unisubs.video.FlvVideoPlayer.superClass_.exitDocument.call(this);
    this.timeUpdateTimer_.stop();
    this.progressTimer_.stop();
};

unisubs.video.FlvVideoPlayer.prototype.swfFinishedLoading_ = function() {
    unisubs.style.setSize(
        goog.dom.getFirstElementChild(this.player_['getParent']()), 
        this.playerSize_)
    this.swfLoaded_ = true;
    goog.array.forEach(this.commands_, function(c) { c(); });
    this.commands_ = [];
    var that = this;
    this.getClip_()['onStart'](function() {
        that.onPlay_();
    });
    this.getClip_()['onResume'](function() {
        that.onPlay_();
    });
    this.getClip_()['onPause'](function() {
        that.onPause_();
    });
    this.getClip_()['onFinish'](function() {
        that.dispatchEndedEvent();
    });
};

unisubs.video.FlvVideoPlayer.prototype.progressTick_ = function(e) {
    if (this.getDuration() > 0) {
        this.refreshStatus_();
        if (this.status_['bufferEnd'] >= this.getDuration() - 0.10)
            this.progressTimer_.stop();
        this.dispatchEvent(unisubs.video.AbstractVideoPlayer.EventType.PROGRESS);
    }
};

unisubs.video.FlvVideoPlayer.prototype.refreshStatus_ = function() {
    this.status_ = this.player_['getStatus']();
};

unisubs.video.FlvVideoPlayer.prototype.timeUpdateTick_ = function(e) {
    if (this.getDuration() > 0)
        this.sendTimeUpdateInternal();
};

unisubs.video.FlvVideoPlayer.prototype.onPlay_ = function() {
    this.dispatchEvent(unisubs.video.AbstractVideoPlayer.EventType.PLAY);
    this.timeUpdateTimer_.start();
};

unisubs.video.FlvVideoPlayer.prototype.onPause_ = function() {
    this.dispatchEvent(unisubs.video.AbstractVideoPlayer.EventType.PAUSE);
    this.timeUpdateTimer_.stop();
};

unisubs.video.FlvVideoPlayer.prototype.getClip_ = function() {
    return this.player_['getClip'](0);
};

unisubs.video.FlvVideoPlayer.prototype.getBufferedLength = function() {
    return this.getDuration() > 0 ? 1 : 0;
};

unisubs.video.FlvVideoPlayer.prototype.getBufferedStart = function(index) {
    if (!this.status_)
        this.refreshStatus_();
    return this.status_['bufferStart'];
};

unisubs.video.FlvVideoPlayer.prototype.getBufferedEnd = function(index) {
    if (!this.status_)
        this.refreshStatus_();
    return this.status_['bufferEnd'];
};

unisubs.video.FlvVideoPlayer.prototype.getDuration = function() {
    if (!this.duration_) {
        this.duration_ = this.swfLoaded_ ? this.getClip_()['fullDuration'] : 0;
        if (isNaN(this.duration_))
            this.duration_ = 0;
    }
    return this.duration_;
};

unisubs.video.FlvVideoPlayer.prototype.getVolume = function() {
    return this.swfLoaded_ ? (this.player_['getVolume']() / 100) : 0;
};

unisubs.video.FlvVideoPlayer.prototype.setVolume = function(vol) {
    if (this.swfLoaded_)
        this.player_['setVolume'](vol * 100);
    else
        this.commands_.push(goog.bind(this.setVolume_, this, vol));
};

unisubs.video.FlvVideoPlayer.prototype.isPausedInternal = function() {
    return this.swfLoaded_ ? this.player_['isPaused']() : false;
};

unisubs.video.FlvVideoPlayer.prototype.videoEndedInternal = function() {
    return this.swfLoaded_ ? (this.player_['getState']() == 5) : false;
};

unisubs.video.FlvVideoPlayer.prototype.isPlayingInternal = function() {
    return this.swfLoaded_ ? this.player_['isPlaying']() : false;
};

unisubs.video.FlvVideoPlayer.prototype.playInternal = function() {
    if (this.swfLoaded_) {
        if (!this.isPlaying())
            this.player_['play']();
    }
    else
        this.commands_.push(goog.bind(this.playInternal, this));
};

unisubs.video.FlvVideoPlayer.prototype.pauseInternal = function() {
    if (this.swfLoaded_)
        this.player_['pause']();
    else
        this.commands_.push(goog.bind(this.pauseInternal, this));
};

unisubs.video.FlvVideoPlayer.prototype.stopLoadingInternal = function() {
    if (this.swfLoaded_) {
        this.player_['stopBuffering']();
	this.setLoadingStopped(true);
	return true;
    }
    else {
        this.commands_.push(goog.bind(this.stopLoadingInternal, this));
	return false;
    }
};

unisubs.video.FlvVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    if (this.swfLoaded_) {
        this.player_['startBuffering']();
	this.setLoadingStopped(false);
    }
    else
        this.commands_.push(goog.bind(this.resumeLoadingInternal, this, playheadTime));
};

unisubs.video.FlvVideoPlayer.prototype.getPlayheadTimeInternal = function() {
    return this.swfLoaded_ ? this.player_['getTime']() : 0;
};

unisubs.video.FlvVideoPlayer.prototype.setPlayheadTime = function(time, skipsUpdateEvent) {
    if (this.swfLoaded_) {
        this.player_['seek'](time);
        if (!skipsUpdateEvent)this.sendTimeUpdateInternal();
    }
    else
        this.commands_.push(goog.bind(this.setPlayheadTime, this, time));
};

unisubs.video.FlvVideoPlayer.prototype.needsIFrame = function() {
    return goog.userAgent.LINUX;
};

unisubs.video.FlvVideoPlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};

unisubs.video.FlvVideoPlayer.prototype.disposeInternal = function() {
    unisubs.video.FlvVideoPlayer.superClass_.disposeInternal.call(this);
    this.progressTimer_.dispose();
    this.timeUpdateTimer_.dispose();
};

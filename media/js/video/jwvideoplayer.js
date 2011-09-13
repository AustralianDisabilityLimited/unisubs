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

goog.provide('unisubs.video.JWVideoPlayer');

/**
 * @constructor
 * @param {unisubs.video.YoutubeVideoSource} videoSource
 */
unisubs.video.JWVideoPlayer = function(videoSource) {
    unisubs.video.FlashVideoPlayer.call(this, videoSource);
    this.logger_ = goog.debug.Logger.getLogger('unisubs.video.JWPlayer');
    this.stateListener_ = 'jwevent' + unisubs.randomString();
    this.timeListener_ = 'jwtime' + unisubs.randomString();
    this.playheadTime_ = 0;
    unisubs.video.JWVideoPlayer.players_.push(this);
};
goog.inherits(unisubs.video.JWVideoPlayer, 
              unisubs.video.FlashVideoPlayer);

unisubs.video.JWVideoPlayer.players_ = [];
unisubs.video.JWVideoPlayer.playerReadyCalled_ = false;

unisubs.video.JWVideoPlayer.prototype.onJWPlayerReady_ = function(elem) {
    if (goog.DEBUG) {
        this.logger_.info('player ready');
    }
    this.tryDecoratingAll();
};

unisubs.video.JWVideoPlayer.prototype.decorateInternal = function(elem) {
    unisubs.video.JWVideoPlayer.superClass_.decorateInternal.call(this, elem);
    this.playerSize_ = goog.style.getSize(this.getElement());
    this.setDimensionsKnownInternal();
    if (goog.DEBUG) {
        this.logger_.info(
            "playerReadyCalled_: " +
                unisubs.video.JWVideoPlayer.playerReadyCalled_);
    }
    if (unisubs.video.JWVideoPlayer.playerReadyCalled_)
        this.onJWPlayerReady_();
};

unisubs.video.JWVideoPlayer.prototype.isFlashElementReady = function(elem) {
    return elem['addModelListener'];
};

unisubs.video.JWVideoPlayer.prototype.setFlashPlayerElement = function(element) {
    this.player_ = element;
    this.playerSize_ = goog.style.getSize(this.player_);
    this.setDimensionsKnownInternal();
    window[this.stateListener_] = goog.bind(this.playerStateChanged_, this);
    window[this.timeListener_] = goog.bind(this.playerTimeChanged_, this);
    this.player_['addModelListener']('STATE', this.stateListener_);
    this.player_['addModelListener']('TIME', this.timeListener_);
};
unisubs.video.JWVideoPlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};
unisubs.video.JWVideoPlayer.prototype.playerStateChanged_ = function(data) {
    var newState = data['newstate'];
    if (goog.DEBUG) {
        this.logger_.info('statechanged: ' + newState);
    }
    var et = unisubs.video.AbstractVideoPlayer.EventType;
    var s = unisubs.video.JWVideoPlayer.State_;
    if (newState == s.PLAYING) {
        this.dispatchEvent(et.PLAY);
    } else if (newState == s.PAUSED) {
        this.dispatchEvent(et.PAUSE);
    } else if (newState == s.COMPLETED) {
        this.dispatchEndedEvent();
    }
};
unisubs.video.JWVideoPlayer.prototype.playerTimeChanged_ = function(data) {
    this.playheadTime_ = data['position'];
    if (!this.duration_)
        this.duration_ = data['duration'];    
    this.dispatchEvent(
        unisubs.video.AbstractVideoPlayer.EventType.TIMEUPDATE);
};
unisubs.video.JWVideoPlayer.prototype.exitDocument = function() {
    unisubs.video.JWVideoPlayer.superClass_.exitDocument.call(this);
    this.player_['removeModelListener']('STATE', this.stateListener_);
    this.player_['removeModelListener']('TIME', this.timeListener_);
};
unisubs.video.JWVideoPlayer.prototype.getDuration = function() {
    return this.duration_;
};
unisubs.video.JWVideoPlayer.prototype.isPausedInternal = function() {
    // TODO: write me
};
unisubs.video.JWVideoPlayer.prototype.videoEndedInternal = function() {
    // TODO: write me
};
unisubs.video.JWVideoPlayer.prototype.isPausedInternal = function() {
    // TODO: write me
};
unisubs.video.JWVideoPlayer.prototype.playInternal = function() {
    this.sendEvent_('play', ['true']);
};
unisubs.video.JWVideoPlayer.prototype.pauseInternal = function() {
    this.sendEvent_('play', ['false']);
};
unisubs.video.JWVideoPlayer.prototype.stopLoadingInternal = function() {
    // TODO: implement this for real.
    this.pause();
    if (goog.DEBUG) {
        this.logger_.info('stopLoadingInternal called');
    }
};
unisubs.video.JWVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    // TODO: implement this for real at some point.
    if (goog.DEBUG) {
        this.logger_.info('resumeLoadingInternal called');
    }
};
unisubs.video.JWVideoPlayer.prototype.getPlayheadTime = function() {
    return this.playheadTime_;
};
unisubs.video.JWVideoPlayer.prototype.needsIFrame = function() {
    return goog.userAgent.LINUX;
};
unisubs.video.JWVideoPlayer.prototype.getVideoElement = function() {
    return this.player_;
};
unisubs.video.JWVideoPlayer.prototype.isPlayingInternal = function() {
    return this.player_['getConfig']()['state'] == 
        unisubs.video.JWVideoPlayer.State_.PLAYING;
};
unisubs.video.JWVideoPlayer.prototype.sendEvent_ = function(event, args) {
    // TODO: prob check to see if this.player_ exists yet; if not, queue the
    // command.
    if (goog.DEBUG) {
        this.logger_.info(
            'sendEvent_ called with ' + event + ' and args ' +
                args.join(', '));
    }
    this.player_['sendEvent'].apply(this.player_, goog.array.concat(event, args));
};

unisubs.video.JWVideoPlayer.State_ = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED'
};

unisubs.video.JWVideoPlayer.logger_ = 
    goog.debug.Logger.getLogger('unisubs.video.JWVideoPlayerStatic');

(function() {
    var jwReady = "playerReady";
    var oldReady = window[jwReady] || goog.nullFunction;
    window[jwReady] = function(obj) {
        try {
            oldReady(obj);
        }
        catch (e) {
            // don't care
        }
        unisubs.video.JWVideoPlayer.playerReadyCalled_ = true;
        if (goog.DEBUG) {
            unisubs.video.JWVideoPlayer.logger_.info(
                "Number of players: " + 
                    unisubs.video.JWVideoPlayer.players_.length);
        }
        goog.array.forEach(
            unisubs.video.JWVideoPlayer.players_, 
            function(p) { p.onJWPlayerReady_(); });
    };
})();

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

goog.provide('unisubs.player.JWVideoPlayer');

/**
 * @constructor
 * @param {unisubs.player.YoutubeVideoSource} videoSource
 */
unisubs.player.JWVideoPlayer = function(videoSource) {
    unisubs.player.FlashVideoPlayer.call(this, videoSource);
    this.logger_ = goog.debug.Logger.getLogger('unisubs.player.JWPlayer');
    this.stateListener_ = 'jwevent' + unisubs.randomString();
    this.timeListener_ = 'jwtime' + unisubs.randomString();
    this.playheadTime_ = 0;
    unisubs.player.JWVideoPlayer.players_.push(this);
};
goog.inherits(unisubs.player.JWVideoPlayer, 
              unisubs.player.FlashVideoPlayer);

unisubs.player.JWVideoPlayer.players_ = [];
unisubs.player.JWVideoPlayer.playerReadyCalled_ = false;

unisubs.player.JWVideoPlayer.prototype.onJWPlayerReady_ = function(elem) {
    if (goog.DEBUG) {
        this.logger_.info('player ready');
    }
    this.tryDecoratingAll();
};

unisubs.player.JWVideoPlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.JWVideoPlayer.superClass_.decorateInternal.call(this, elem);
    this.playerSize_ = goog.style.getSize(this.getElement());
    this.setDimensionsKnownInternal();
    if (goog.DEBUG) {
        this.logger_.info(
            "playerReadyCalled_: " +
                unisubs.player.JWVideoPlayer.playerReadyCalled_);
    }
    if (unisubs.player.JWVideoPlayer.playerReadyCalled_)
        this.onJWPlayerReady_();
};

unisubs.player.JWVideoPlayer.prototype.isFlashElementReady = function(elem) {
    return elem['addModelListener'];
};

unisubs.player.JWVideoPlayer.prototype.setFlashPlayerElement = function(element) {
    this.player_ = element;
    this.playerSize_ = goog.style.getSize(this.player_);
    this.setDimensionsKnownInternal();
    window[this.stateListener_] = goog.bind(this.playerStateChanged_, this);
    window[this.timeListener_] = goog.bind(this.playerTimeChanged_, this);
    this.player_['addModelListener']('STATE', this.stateListener_);
    this.player_['addModelListener']('TIME', this.timeListener_);
};
unisubs.player.JWVideoPlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};
unisubs.player.JWVideoPlayer.prototype.playerStateChanged_ = function(data) {
    var newState = data['newstate'];
    if (goog.DEBUG) {
        this.logger_.info('statechanged: ' + newState);
    }
    var et = unisubs.player.AbstractVideoPlayer.EventType;
    var s = unisubs.player.JWVideoPlayer.State_;
    if (newState == s.PLAYING) {
        this.dispatchEvent(et.PLAY);
    } else if (newState == s.PAUSED) {
        this.dispatchEvent(et.PAUSE);
    } else if (newState == s.COMPLETED) {
        this.dispatchEndedEvent();
    }
};
unisubs.player.JWVideoPlayer.prototype.playerTimeChanged_ = function(data) {
    this.playheadTime_ = data['position'];
    if (!this.duration_)
        this.duration_ = data['duration'];    
    this.dispatchEvent(
        unisubs.player.AbstractVideoPlayer.EventType.TIMEUPDATE);
};
unisubs.player.JWVideoPlayer.prototype.exitDocument = function() {
    unisubs.player.JWVideoPlayer.superClass_.exitDocument.call(this);
    this.player_['removeModelListener']('STATE', this.stateListener_);
    this.player_['removeModelListener']('TIME', this.timeListener_);
};
unisubs.player.JWVideoPlayer.prototype.getDuration = function() {
    return this.duration_;
};
unisubs.player.JWVideoPlayer.prototype.isPausedInternal = function() {
    // TODO: write me
};
unisubs.player.JWVideoPlayer.prototype.videoEndedInternal = function() {
    // TODO: write me
};
unisubs.player.JWVideoPlayer.prototype.isPausedInternal = function() {
    // TODO: write me
};
unisubs.player.JWVideoPlayer.prototype.playInternal = function() {
    this.sendEvent_('play', ['true']);
};
unisubs.player.JWVideoPlayer.prototype.pauseInternal = function() {
    this.sendEvent_('play', ['false']);
};
unisubs.player.JWVideoPlayer.prototype.stopLoadingInternal = function() {
    // TODO: implement this for real.
    this.pause();
    if (goog.DEBUG) {
        this.logger_.info('stopLoadingInternal called');
    }
};
unisubs.player.JWVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    // TODO: implement this for real at some point.
    if (goog.DEBUG) {
        this.logger_.info('resumeLoadingInternal called');
    }
};
unisubs.player.JWVideoPlayer.prototype.getPlayheadTime = function() {
    return this.playheadTime_;
};
unisubs.player.JWVideoPlayer.prototype.needsIFrame = function() {
    return goog.userAgent.LINUX;
};
unisubs.player.JWVideoPlayer.prototype.getVideoElement = function() {
    return this.player_;
};
unisubs.player.JWVideoPlayer.prototype.isPlayingInternal = function() {
    return this.player_['getConfig']()['state'] == 
        unisubs.player.JWVideoPlayer.State_.PLAYING;
};
unisubs.player.JWVideoPlayer.prototype.sendEvent_ = function(event, args) {
    // TODO: prob check to see if this.player_ exists yet; if not, queue the
    // command.
    if (goog.DEBUG) {
        this.logger_.info(
            'sendEvent_ called with ' + event + ' and args ' +
                args.join(', '));
    }
    this.player_['sendEvent'].apply(this.player_, goog.array.concat(event, args));
};

unisubs.player.JWVideoPlayer.State_ = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED'
};

unisubs.player.JWVideoPlayer.logger_ = 
    goog.debug.Logger.getLogger('unisubs.player.JWVideoPlayerStatic');

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
        unisubs.player.JWVideoPlayer.playerReadyCalled_ = true;
        if (goog.DEBUG) {
            unisubs.player.JWVideoPlayer.logger_.info(
                "Number of players: " + 
                    unisubs.player.JWVideoPlayer.players_.length);
        }
        goog.array.forEach(
            unisubs.player.JWVideoPlayer.players_, 
            function(p) { p.onJWPlayerReady_(); });
    };
})();

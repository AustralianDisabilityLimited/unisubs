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

goog.provide('unisubs.player.Html5MediaPlayer');

/**
 * @constructor
 * @param {unisubs.player.Html5VideoSource} videoSource
 * @param {boolean} forDialog
 */
unisubs.player.Html5MediaPlayer = function(mediaSource, forDialog) {
    unisubs.player.AbstractVideoPlayer.call(this, mediaSource);

    /**
     * @protected
     */
    this.mediaSource = mediaSource;
    /**
     * @protected
     */
    this.mediaElem = null;

    // only used in FF, since they don't support W3 buffered spec yet.
    this.mediaLoaded_ = 0;
    this.mediaTotal_ = 0;
    /**
     * @protected
     */
    this.forDialog = forDialog;
    this.playToClick_ = false;

    this.progressThrottle_ = new goog.Throttle(
        this.mediaProgress_,
        unisubs.player.AbstractVideoPlayer.PROGRESS_INTERVAL,
        this);
    this.timeUpdateThrottle_ = new goog.Throttle(
        this.sendTimeUpdateInternal,
        unisubs.player.AbstractVideoPlayer.TIMEUPDATE_INTERVAL,
        this);
    this.playedOnce_ = false;
};
goog.inherits(unisubs.player.Html5MediaPlayer,
              unisubs.player.AbstractVideoPlayer);

unisubs.player.Html5MediaPlayer.logger_ =
    goog.debug.Logger.getLogger('Html5MediaPlayer');

unisubs.player.Html5MediaPlayer.prototype.enterDocument = function() {
    unisubs.player.Html5MediaPlayer.superClass_.enterDocument.call(this);
    if (!this.mediaElem)
        return;
    this.getHandler().
        listen(this.mediaElem, 'play', this.mediaPlaying_).
        listen(this.mediaElem, 'pause', this.mediaPaused_).
        listen(this.mediaElem, 'progress', this.mediaProgressListener_).
        listen(this.mediaElem, 'loadedmetadata', this.setDimensionsKnownInternal).
        listen(this.mediaElem, 'timeupdate', this.sendTimeUpdate_).
        listen(this.mediaElem, 'ended', this.dispatchEndedEvent).
        listenOnce(this.mediaElem, 'click', this.playerClickedInternal);
    if (this.mediaElem['readyState'] >= this.mediaElem['HAVE_METADATA']) {
        this.setDimensionsKnownInternal();
    }
    this.restorePreviousVolume_();
};


unisubs.player.Html5MediaPlayer.prototype.playerClickedInternal = function(e) {
    // subclasses can override to do thangs
};

unisubs.player.Html5MediaPlayer.prototype.sendTimeUpdate_ = function() {
    if (this.playedOnce_)
        this.timeUpdateThrottle_.fire();
};

unisubs.player.Html5MediaPlayer.prototype.setVideoSize = function(width, height) {
    unisubs.style.setSize(this.mediaElem, width, height);
};

unisubs.player.Html5MediaPlayer.prototype.mediaPlaying_ = function(event) {
    this.playedOnce_ = true;
    this.dispatchEvent(unisubs.player.AbstractVideoPlayer.EventType.PLAY);
};

unisubs.player.Html5MediaPlayer.prototype.mediaPaused_ = function(event) {
    this.dispatchEvent(unisubs.player.AbstractVideoPlayer.EventType.PAUSE);
};

unisubs.player.Html5MediaPlayer.prototype.mediaProgressListener_ =
    function(event)
{
    if (event.getBrowserEvent()['loaded'] && event.getBrowserEvent()['total']) {
        this.mediaLoaded_ = event.getBrowserEvent()['loaded'];
        this.mediaTotal_ = event.getBrowserEvent()['total'];
        if (this.mediaTotal_ == -1)
            this.mediaTotal_ = this.mediaLoaded_;
    }
    this.progressThrottle_.fire();
};

unisubs.player.Html5MediaPlayer.prototype.mediaProgress_ = function() {
    this.dispatchEvent(unisubs.player.AbstractVideoPlayer.EventType.PROGRESS);
};

unisubs.player.Html5MediaPlayer.prototype.getVolume = function() {
    return this.mediaElem['volume'];
};
unisubs.player.Html5MediaPlayer.prototype.setVolume = function(volume) {
    this.mediaElem['volume'] = volume;
    unisubs.player.Html5MediaPlayer.superClass_.setVolume.call(this, volume);
    
};
unisubs.player.Html5MediaPlayer.prototype.getBufferedLength = function() {
    if (this.mediaElem['buffered'])
        return this.mediaElem['buffered']['length'];
    else
        return this.mediaTotal_ == 0 ? 0 : 1;
};
unisubs.player.Html5MediaPlayer.prototype.getBufferedStart = function(index) {
    if (this.mediaElem['buffered'])
        return this.mediaElem['buffered']['start'](index);
    else
        return 0;
};
unisubs.player.Html5MediaPlayer.prototype.getBufferedEnd = function(index) {
    if (this.mediaElem['buffered'])
        return this.mediaElem['buffered']['end'](index);
    else if (this.mediaTotal_ != 0 && this.getDuration() != 0)
        return this.getDuration() * this.mediaLoaded_ / this.mediaTotal_;
    else
        return 0;
};
unisubs.player.Html5MediaPlayer.prototype.getDuration = function() {
    var duration = this.mediaElem['duration'];
    return isNaN(duration) ? 0 : duration;
};
unisubs.player.Html5MediaPlayer.prototype.isPausedInternal = function() {
    return this.mediaElem['paused'];
};

unisubs.player.Html5MediaPlayer.prototype.videoEndedInternal = function() {
    return this.mediaElem['ended'];
};

unisubs.player.Html5MediaPlayer.prototype.isPlayingInternal = function() {
    var readyState = this.getReadyState_();
    var RS = unisubs.player.Html5MediaPlayer.ReadyState_;
    return (readyState == RS.HAVE_FUTURE_DATA ||
            readyState == RS.HAVE_ENOUGH_DATA) &&
           !this.isPaused() && !this.videoEnded();
};

unisubs.player.Html5MediaPlayer.prototype.playInternal = function() {
    this.mediaElem['play']();
};

unisubs.player.Html5MediaPlayer.prototype.pauseInternal = function() {
    this.mediaElem['pause']();
};

unisubs.player.Html5MediaPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    this.mediaElem['src'] = this.mediaSource.getVideoURL();
    this.setLoadingStopped(false);
    this.setPlayheadTime(playheadTime);
    this.pause();
};

unisubs.player.Html5MediaPlayer.prototype.getPlayheadTimeInternal = function() {
    return this.mediaElem["currentTime"];
};

unisubs.player.Html5MediaPlayer.prototype.setPlayheadTime = function(playheadTime, skipsUpdateEvent) {
    try {
        this.mediaElem["currentTime"] = playheadTime;
    } catch(e) {
        // this might fail if we have not loaded metadata yet
    }
    
};

unisubs.player.Html5MediaPlayer.prototype.getVideoSize = function() {
    return goog.style.getSize(this.mediaElem);
};

unisubs.player.Html5MediaPlayer.prototype.getVideoElements = function() {
    return [this.mediaElem];
};

unisubs.player.Html5MediaPlayer.prototype.getReadyState_ = function() {
    return this.mediaElem["readyState"];
};

unisubs.player.Html5MediaPlayer.prototype.disposeInternal = function() {
    unisubs.player.Html5MediaPlayer.superClass_.disposeInternal.call(this);
    this.progressThrottle_.dispose();
    this.timeUpdateThrottle_.dispose();
};

/**
 * See http://www.w3.org/TR/html5/video.html#dom-media-have_nothing
 * @enum
 */
unisubs.player.Html5MediaPlayer.ReadyState_ = {
    HAVE_NOTHING  : 0,
    HAVE_METADATA : 1,
    HAVE_CURRENT_DATA : 2,
    HAVE_FUTURE_DATA : 3,
    HAVE_ENOUGH_DATA : 4
};

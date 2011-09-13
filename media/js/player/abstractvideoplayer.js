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

goog.provide('unisubs.player.AbstractVideoPlayer');

/**
 * Abstract base class for video player implementations. Any video player 
 * used with unisubs must implement the abstract methods defined by this 
 * class.
 * @constructor
 */
unisubs.player.AbstractVideoPlayer = function(videoSource) {
    goog.ui.Component.call(this);
    this.videoSource_ = videoSource;
    this.noUpdateEvents_ = false;
    this.dimensionsKnown_ = false;
    this.isLoadingStopped_ = false;
    /**
     * If the video's loading is stopped (i.e., it is no longer buffering),
     * we may have had to alter the video source or playhead time to force
     * the buffering to actually cease.  While stopped, this variable will
     * store the playhead time we were previously at, so it can be restored.
     * @type{number}
     */
    this.storedPlayheadTime_ = 0;
    /*
     * @type {unisubs.player.CaptionView}
     */
    this.captionView_ = null;

    /*
     * type {int} The duration, in seconds for this video
     */
    this.duration_ = 0;
    unisubs.player.AbstractVideoPlayer.players.push(this);
    if (goog.DEBUG) {
        unisubs.player.AbstractVideoPlayer.logger_.info(
            'players length is now ' + unisubs.player.AbstractVideoPlayer.players.length);
    }
};
goog.inherits(unisubs.player.AbstractVideoPlayer, goog.ui.Component);
unisubs.player.AbstractVideoPlayer.PROGRESS_INTERVAL = 500;
unisubs.player.AbstractVideoPlayer.TIMEUPDATE_INTERVAL = 80;

/*
  We store the latest volume set on a cookie, so that a regular user 
  doesn't have to reset the volume for each edit, this is the identifier
  for that volume 
*/
unisubs.player.AbstractVideoPlayer.VOLUME_SETTING_NAME  = "lastestVolume";

if (goog.DEBUG) {
    unisubs.player.AbstractVideoPlayer.logger_ = 
        goog.debug.Logger.getLogger('AbstractVideoPlayer');
}

unisubs.player.AbstractVideoPlayer.players = [];

/**
 *
 * Used for flash-based video players that don't have a size specified.
 */
unisubs.player.AbstractVideoPlayer.DEFAULT_SIZE = new goog.math.Size(480, 360);
/**
 *
 * Used for all video players in the dialog.
 */
unisubs.player.AbstractVideoPlayer.DIALOG_SIZE = new goog.math.Size(400, 300);


unisubs.player.AbstractVideoPlayer.prototype.createDom = function() {
    this.setElementInternal(this.getDomHelper().createElement('span'));
    goog.dom.classes.add(this.getElement(), 'unisubs.playerplayer');
};

unisubs.player.AbstractVideoPlayer.prototype.getPlayheadFn = function() {
    return goog.bind(this.getPlayheadTime, this);
};
unisubs.player.AbstractVideoPlayer.prototype.isPaused = function() {
    if (this.isLoadingStopped_)
	throw new "can't check if paused, loading is stopped";
    return this.isPausedInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.isPausedInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.isPlaying = function() {
    if (this.isLoadingStopped_)
	throw new "can't check if playing, loading is stopped";
    return this.isPlayingInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.isPlayingInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.videoEnded = function() {
    if (this.isLoadingStopped_)
	throw new "can't check if video ended, loading is stopped";
    return this.videoEndedInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.videoEndedInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.play = function(opt_suppressEvent) {
    if (this.isLoadingStopped_)
	throw new "can't play, loading is stopped";
    if (!opt_suppressEvent)
        this.dispatchEvent(
            unisubs.player.AbstractVideoPlayer.EventType.PLAY_CALLED);
    this.playInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.playInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.pause = function(opt_suppressEvent) {
    if (this.isLoadingStopped_)
	throw new "can't pause, loading is stopped";
    if (!opt_suppressEvent)
        this.dispatchEvent(
            unisubs.player.AbstractVideoPlayer.EventType.PAUSE_CALLED);
    this.pauseInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.pauseInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.togglePause = function() {
    if (this.isLoadingStopped_)
	throw new "can't toggle pause, loading is stopped";

    if (!this.isPlaying())
        this.play();
    else
        this.pause();
};
unisubs.player.AbstractVideoPlayer.prototype.isLoadingStopped = function() {
  return this.isLoadingStopped_;  
};
/**
 * @protected
 */
unisubs.player.AbstractVideoPlayer.prototype.setLoadingStopped = function(isLoadingStopped) {
  this.isLoadingStopped_ = isLoadingStopped;  
};
unisubs.player.AbstractVideoPlayer.prototype.stopLoading = function() {
    if (!this.isLoadingStopped_) {
	this.pause();
	this.storedPlayheadTime_ = this.getPlayheadTime();
	if (this.stopLoadingInternal()) {
	    this.isLoadingStopped_ = true;
	}
    }
};
unisubs.player.AbstractVideoPlayer.prototype.stopLoadingInternal = goog.abstractMethod;
unisubs.player.AbstractVideoPlayer.prototype.resumeLoading = function() {
    if (this.isLoadingStopped_) {
	this.resumeLoadingInternal(this.storedPlayheadTime_);
	this.storedPlayheadTime_ = null;
    }
};
unisubs.player.AbstractVideoPlayer.prototype.resumeLoadingInternal = function(playheadTime) {
    goog.abstractMethod();
};
/**
 * @protected
 * Must be called by subclasses once they know their dimensions.
 */
unisubs.player.AbstractVideoPlayer.prototype.setDimensionsKnownInternal = function() {
    this.dimensionsKnown_ = true;
    unisubs.style.setSize(this.getElement(), this.getVideoSize());
    this.dispatchEvent(
        unisubs.player.AbstractVideoPlayer.EventType.DIMENSIONS_KNOWN);
};

unisubs.player.AbstractVideoPlayer.prototype.createCaptionView = function(){
    if(!this.captionView_){
        this.captionView_ = new unisubs.player.CaptionView(this.needsIFrame());
        var offset =  goog.style.getPosition(this.getElement());
        var size = this.getVideoSize();
        var box = new goog.math.Rect(offset.x, offset.y,  
                                 size.width, size.height );
        this.captionView_.setUpPositioning(box);
        this.captionView_.createDom();
        var videoOffsetParent = this.getElement().offsetParent || goog.dom.getOwnerDocument(this.getElement()).body;
        goog.dom.appendChild(videoOffsetParent, this.captionView_.getElement());
        
    }
};

unisubs.player.AbstractVideoPlayer.prototype.areDimensionsKnown = function() {
    return this.dimensionsKnown_;
};
unisubs.player.AbstractVideoPlayer.prototype.getPlayheadTime = function() {
    if (this.isLoadingStopped_)
	return this.storedPlayheadTime_;
    return this.getPlayheadTimeInternal();
};
unisubs.player.AbstractVideoPlayer.prototype.getPlayheadTimeInternal = goog.abstractMethod;
/**
 * 
 *
 */
unisubs.player.AbstractVideoPlayer.prototype.playWithNoUpdateEvents = 
    function(timeToStart, secondsToPlay) 
{
    this.noUpdateEvents_ = true;
    if (this.noUpdatePreTime_ == null)
        this.noUpdatePreTime_ = this.getPlayheadTime();
    this.setPlayheadTime(timeToStart);
    this.play();
    this.noUpdateStartTime_ = timeToStart;
    this.noUpdateEndTime_ = timeToStart + secondsToPlay;
};
/**
 * @protected
 */
unisubs.player.AbstractVideoPlayer.prototype.dispatchEndedEvent = function() {
    this.dispatchEvent(unisubs.player.AbstractVideoPlayer.EventType.PLAY_ENDED);
};
unisubs.player.AbstractVideoPlayer.prototype.sendTimeUpdateInternal = 
    function() 
{
    if (!this.noUpdateEvents_)
        this.dispatchEvent(
            unisubs.player.AbstractVideoPlayer.EventType.TIMEUPDATE);
    else {
        if (this.ignoreTimeUpdate_)
            return;
        if (this.getPlayheadTime() >= this.noUpdateEndTime_) {
            this.ignoreTimeUpdate_ = true;
            this.setPlayheadTime(this.noUpdatePreTime_);
            this.noUpdatePreTime_ = null;
            this.pause();
            this.ignoreTimeUpdate_ = false;
            this.noUpdateEvents_ = false;
        }
    }
}
/**
 * @returns {number} video duration in seconds. Returns 0 if duration isn't
 *     available yet.
 */
unisubs.player.AbstractVideoPlayer.prototype.getDuration = goog.abstractMethod;
/**
 * @returns {int} Number of buffered ranges.
 */
unisubs.player.AbstractVideoPlayer.prototype.getBufferedLength = goog.abstractMethod;
/**
 * @returns {number} Start of buffered range with index
 */
unisubs.player.AbstractVideoPlayer.prototype.getBufferedStart = function(index) {
    goog.abstractMethod();
};
unisubs.player.AbstractVideoPlayer.prototype.getBufferedEnd = function(index) {
    goog.abstractMethod();
};
/**
 * @return {number} 0.0 to 1.0
 */
unisubs.player.AbstractVideoPlayer.prototype.getVolume = goog.abstractMethod;
/**
 * @return {Array.<Element>} Video elements on the page represented by this player.
 *     Sometimes for a flash-based player, this is two elements: the object and the
 *     embed.
 */
unisubs.player.AbstractVideoPlayer.prototype.getVideoElements = goog.abstractMethod;

unisubs.player.AbstractVideoPlayer.prototype.videoElementsContain = function(elem) {
    return goog.array.contains(this.getVideoElements(), elem);
};

/**
 * 
 * @param {number} volume A number between 0.0 and 1.0
 */
unisubs.player.AbstractVideoPlayer.prototype.setVolume = function(volume) {
    this.rememberVolume_(volume);
};

unisubs.player.AbstractVideoPlayer.prototype.rememberVolume_ = function (volume){
    unisubs.UserSettings.setFloatValue(unisubs.player.AbstractVideoPlayer.VOLUME_SETTING_NAME, volume)
}

unisubs.player.AbstractVideoPlayer.prototype.fetchLastSetVolume_ = function (volume){
    return unisubs.UserSettings.getFloatValue(unisubs.player.AbstractVideoPlayer.VOLUME_SETTING_NAME,  1)
}

unisubs.player.AbstractVideoPlayer.prototype.restorePreviousVolume_ = function (){
    var vol = this.fetchLastSetVolume_();
    this.setVolume(vol);
}

unisubs.player.AbstractVideoPlayer.prototype.getVideoSource = function() {
    return this.videoSource_;
};
/*
 * @param {Number} playheadTime The time (in seconds) to move the playhead to.
 * @param {bool=} skipsUpdateEvent If true will not dispatch the event 
 * broadcasting that * the player has changed position. This is useful because 
 * this event might fire before the player reaches the target (playheadTime)
 * time and still fire on the current (former) time. In this case, for example, 
 * the timeline might be taken to former time.
 */
unisubs.player.AbstractVideoPlayer.prototype.setPlayheadTime = function(playheadTime, skipsUpdateEvent) {
    goog.abstractMethod();
};

/**
 *
 * @param {String} text Caption text to display in video. null for blank.
 */
unisubs.player.AbstractVideoPlayer.prototype.showCaptionText = function(text) {
    if (goog.DEBUG) {
        unisubs.player.AbstractVideoPlayer.logger_.info(
            'showing sub: ' + text);
    }
    this.captionView_ || this.createCaptionView();
    this.captionView_.setCaptionText(text);
};

/**
 * Override for video players that need to show an iframe behind captions for 
 * certain browsers (e.g. flash on linux/ff)
 * @protected
 */
unisubs.player.AbstractVideoPlayer.prototype.needsIFrame = function() {
    return false;
};

/**
 * Override for video players cannot be shown chromeless or can't be easily
 * detected (eg. brighcove player)
 * @protected
 * @returns {bool} If the video playe is chromeless
 */
unisubs.player.AbstractVideoPlayer.prototype.isChromeless = function() {
    return true;
};

/**
 *
 * @protected
 * @return {goog.math.Size} size of the video
 */
unisubs.player.AbstractVideoPlayer.prototype.getVideoSize = goog.abstractMethod;

/**
 * Video player events
 * @enum {string}
 */
unisubs.player.AbstractVideoPlayer.EventType = {
    /** dispatched when playback starts or resumes. */
    PLAY : 'videoplay',
    PLAY_CALLED : 'videoplaycalled',
    /** dispatched when the video finishes playing. */
    PLAY_ENDED : 'videoplayended',
    /** dispatched when playback is paused. */
    PAUSE : 'videopause',
    PAUSE_CALLED : 'videopausecalled',
    /** dispatched when media data is fetched */
    PROGRESS : 'videoprogress',
    /** 
     * dispatched when playhead time changes, either as a result 
     *  of normal playback or otherwise. 
     */
    TIMEUPDATE : 'videotimeupdate',
    /**
     * dispatched when video dimensions are known.
     */
    DIMENSIONS_KNOWN: 'dimensionsknown'
};

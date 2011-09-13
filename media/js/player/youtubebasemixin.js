unisubs.video.YoutubeBaseMixin = function() {};

unisubs.video.YoutubeBaseMixin.prototype.progressTick_ = function(e) {
    if (this.getDuration() > 0)
        this.dispatchEvent(
            unisubs.video.AbstractVideoPlayer.EventType.PROGRESS);
};
unisubs.video.YoutubeBaseMixin.prototype.timeUpdateTick_ = function(e) {
    if (this.getDuration() > 0)
        this.sendTimeUpdateInternal();
};
unisubs.video.YoutubeBaseMixin.prototype.playerStateChange_ = function(newState) {
    var s = unisubs.video.YoutubeVideoPlayer.State_;
    var et = unisubs.video.AbstractVideoPlayer.EventType;
    if (goog.DEBUG) {
        this.logger_.info("player new state is " + newState);
    }
    if (newState == s.PLAYING) {
        this.dispatchEvent(et.PLAY);
        this.timeUpdateTimer_.start();
        this.paused_ = false;
    }
    else if (newState == s.PAUSED) {
        this.dispatchEvent(et.PAUSE);
        this.timeUpdateTimer_.stop();
    }
    else if (newState == s.ENDED)
        this.dispatchEndedEvent();
};
unisubs.video.YoutubeBaseMixin.prototype.getBufferedLength = function() {
    return this.getDuration() > 0  ? 1 : 0;
};
unisubs.video.YoutubeBaseMixin.prototype.getBufferedStart = function(index) {
    var startBytes = this.getStartBytes_();
    return this.getDuration() * startBytes / (startBytes + this.getBytesTotal_());
};
unisubs.video.YoutubeBaseMixin.prototype.getBufferedEnd = function(index) {
    var startBytes = this.getStartBytes_();
    return this.getDuration() *
        (startBytes + this.player_['getVideoBytesLoaded']()) /
        (startBytes + this.getBytesTotal_());
};
unisubs.video.YoutubeBaseMixin.prototype.getStartBytes_ = function() {
    return this.player_ ? this.player_['getVideoStartBytes']() : 0;
};
unisubs.video.YoutubeBaseMixin.prototype.getBytesTotal_ = function() {
    return this.player_ ? this.player_['getVideoBytesTotal']() : 0;
};
unisubs.video.YoutubeBaseMixin.prototype.getDuration = function() {
    if (!this.duration_) {
        this.duration_ = 
            (this.player_ && this.player_['getDuration']) ? 
                this.player_['getDuration']() : 0;
        if (this.duration_ <= 0)
            this.duration_ = 0;
    }
    return this.duration_;
};
unisubs.video.YoutubeBaseMixin.prototype.getVolume = function() {
    return this.player_ ? (this.player_['getVolume']() / 100) : 0;
};
unisubs.video.YoutubeBaseMixin.prototype.setVolume = function(vol) {
    if (this.player_)
        this.player_['setVolume'](vol * 100);
    else
        this.commands_.push(goog.bind(this.setVolume_, this, vol));
};
unisubs.video.YoutubeBaseMixin.prototype.isPausedInternal = function() {
    return this.getPlayerState_() == unisubs.video.YoutubeVideoPlayer.State_.PAUSED;
};
unisubs.video.YoutubeBaseMixin.prototype.videoEndedInternal = function() {
    return this.getPlayerState_() == unisubs.video.YoutubeVideoPlayer.State_.ENDED;
};
unisubs.video.YoutubeBaseMixin.prototype.isPlayingInternal = function() {
    return this.getPlayerState_() == unisubs.video.YoutubeVideoPlayer.State_.PLAYING;
};
unisubs.video.YoutubeBaseMixin.prototype.playInternal = function () {
    if (this.player_)
        this.player_['playVideo']();
    else
        this.commands_.push(goog.bind(this.playInternal, this));
};
unisubs.video.YoutubeBaseMixin.prototype.pauseInternal = function() {
    if (this.player_) {
        this.paused_ = true;
        this.pausePlayheadTime_ = null;
        this.player_['pauseVideo']();
    }
    else
        this.commands_.push(goog.bind(this.pauseInternal, this));
};
unisubs.video.YoutubeBaseMixin.prototype.stopLoadingInternal = function() {
    if (this.player_) {
        this.player_['stopVideo']();
	this.setLoadingStopped(true);
	return true;	
    }
    else {
	this.commands_.push(goog.bind(this.stopLoadingInternal, this));
	return false;
    }
};
unisubs.video.YoutubeBaseMixin.prototype.resumeLoadingInternal = function(playheadTime) {
    if (this.player_) {
        this.player_['cueVideoById'](this.videoSource_.getYoutubeVideoID(), playheadTime);
	this.setLoadingStopped(false);
    }
    else
        this.commands_.push(goog.bind(this.resumeLoadingInternal, this, playheadTime));
};
unisubs.video.YoutubeBaseMixin.prototype.getPlayheadTime = function() {
    if (this.player_) { 
        if (this.paused_ && !goog.isNull(this.pausePlayheadTime_)) {
            return this.pausePlayheadTime_;
        }
        else {
            return this.player_['getCurrentTime']();
        }
    } else {
        return 0;
    }
};

unisubs.video.YoutubeBaseMixin.prototype.setPlayheadTime = function(playheadTime, skipsUpdateEvent)
{
    if (this.player_) {
        this.player_['seekTo'](playheadTime, true);
        if (!skipsUpdateEvent) {
            if (this.paused_) {
                this.pausePlayheadTime_ = playheadTime;
            }
            this.sendTimeUpdateInternal();
        }
    }
    else
        this.commands_.push(goog.bind(this.setPlayheadTime,
                                      this, playheadTime));
};
unisubs.video.YoutubeBaseMixin.prototype.getPlayerState_ = function() {
    return this.player_ ? this.player_['getPlayerState']() : -1;
};
unisubs.video.YoutubeBaseMixin.prototype.getVideoSize = function() {
    if (goog.DEBUG) {
        this.logger_.info('getVideoSize returning ' + this.playerSize_);
    }
    return this.playerSize_;
};

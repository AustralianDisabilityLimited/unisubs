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

goog.provide('unisubs.subtitle.SyncPanel');

/**
 * @constructor
 * @param {unisubs.subtitle.EditableCaptionSet} subtitles The subtitles
 *     for the video, so far.
 * @param {unisubs.player.AbstractVideoPlayer} videoPlayer
 * @param {unisubs.CaptionManager} Caption manager, already containing subtitles
 *     with start_time set.
 */
unisubs.subtitle.SyncPanel = function(subtitles, videoPlayer,
                                       serverModel, captionManager) {
    goog.ui.Component.call(this);
    /**
     * @type {unisubs.subtitle.EditableCaptionSet}
     */
    this.subtitles_ = subtitles;

    this.videoPlayer_ = videoPlayer;
    /**
     * @protected
     */
    this.serverModel = serverModel;
    this.captionManager_ = captionManager;
    this.videoStarted_ = false;
    this.downSub_ = null;
    this.downPlayheadTime_ = -1;
    this.downHeld_ = false;
    this.keyEventsSuspended_ = false;
};
goog.inherits(unisubs.subtitle.SyncPanel, goog.ui.Component);

unisubs.subtitle.SyncPanel.prototype.enterDocument = function() {
    unisubs.subtitle.SyncPanel.superClass_.enterDocument.call(this);
    var handler = this.getHandler();
    handler.listen(this.captionManager_,
                   unisubs.CaptionManager.CAPTION,
                   this.captionReached_).
        listen(document, goog.events.EventType.KEYDOWN, this.handleKeyDown_).
        listen(document, goog.events.EventType.KEYUP, this.handleKeyUp_);
};
unisubs.subtitle.SyncPanel.prototype.createDom = function() {
    unisubs.subtitle.SyncPanel.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.getElement().appendChild(this.contentElem_ = $d('div'));
    this.addChild(this.subtitleList_ = new unisubs.subtitle.SubtitleList(
        this.videoPlayer_, this.subtitles_, true, false, false), true);
};
unisubs.subtitle.SyncPanel.prototype.getRightPanel = function() {
    if (!this.rightPanel_) {
        this.rightPanel_ = this.createRightPanelInternal();
        this.getHandler().
            listen(
                this.rightPanel_,
                unisubs.RightPanel.EventType.LEGENDKEY,
                this.handleLegendKeyPress_).
            listen(
                this.rightPanel_,
                unisubs.RightPanel.EventType.RESTART,
                this.startOverClicked_);
    }
    return this.rightPanel_;
};
unisubs.subtitle.SyncPanel.prototype.createRightPanelInternal = function() {
    var helpContents = new unisubs.RightPanel.HelpContents(
        "Syncing",
        ["Congratulations, you finished the hard part (all that typing)!",
         ["Now, to line up your subtitles to the video, tap the DOWN ARROW right ",
          "when each subtitle should appear."].join(''),
         "Tap DOWN to begin, tap it for the first subtitle, and so on.",
         ["Don't worry about small mistakes. We can correct them in the ",
          "next step. If you need to start over, click \"restart\" ",
          "below."].join('')],
        3, 1);
    var extraHelp = 
        ["Press play, then tap this button or the down arrow when the next subtitle should appear."];
    return new unisubs.RightPanel(
        this.serverModel, helpContents, extraHelp,
        this.makeKeySpecsInternal(), true, "Done?",
        "Next Step: Reviewing");
};
unisubs.subtitle.SyncPanel.prototype.makeKeySpecsInternal = function() {
    var KC = goog.events.KeyCodes;
    return [
        new unisubs.RightPanel.KeySpec(
            'unisubs-begin', 'unisubs-down', 'down',
            'Tap when next subtitle should appear', KC.DOWN, 0),
        new unisubs.RightPanel.KeySpec(
            'unisubs-play', 'unisubs-tab', 'tab', 'Play/Pause', KC.TAB, 0),
        new unisubs.RightPanel.KeySpec(
            'unisubs-skip', 'unisubs-control', 'shift\n+\ntab',
            'Skip Back 8 Seconds', KC.TAB,
            unisubs.RightPanel.KeySpec.Modifier.SHIFT)
    ];

};
unisubs.subtitle.SyncPanel.prototype.suspendKeyEvents = function(suspended) {
    this.keyEventsSuspended_ = suspended;
};
unisubs.subtitle.SyncPanel.prototype.handleLegendKeyPress_ = function(event) {
    if (event.keyCode == goog.events.KeyCodes.DOWN) {
        if (event.keyEventType == goog.events.EventType.MOUSEDOWN &&
            !this.currentlyEditingSubtitle_())
            this.downPressed_();
        else if (event.keyEventType == goog.events.EventType.MOUSEUP &&
                this.downHeld_)
            this.downReleased_();
    }
};
unisubs.subtitle.SyncPanel.prototype.handleKeyDown_ = function(event) {
    if (this.keyEventsSuspended_)
        return;
    if (event.keyCode == goog.events.KeyCodes.DOWN && 
        !this.currentlyEditingSubtitle_()) {
        event.preventDefault();
        this.downPressed_();
        this.rightPanel_.setKeyDown(event.keyCode, 0, true);
    }
    else if (event.keyCode == goog.events.KeyCodes.SPACE &&
        !this.currentlyEditingSubtitle_()) {
        event.preventDefault();
        this.spacePressed_();
        this.rightPanel_.setKeyDown(goog.events.KeyCodes.TAB, 0, true);
    }
};
unisubs.subtitle.SyncPanel.prototype.handleKeyUp_ = function(event) {
    if (event.keyCode == goog.events.KeyCodes.DOWN && this.downHeld_) {
        event.preventDefault();
        this.downReleased_();
        this.rightPanel_.setKeyDown(event.keyCode, 0, false);
    }
    else if (event.keyCode == goog.events.KeyCodes.SPACE &&
             !this.currentlyEditingSubtitle_())
        this.rightPanel_.setKeyDown(goog.events.KeyCodes.TAB, 0, false);
};
unisubs.subtitle.SyncPanel.prototype.spacePressed_ = function() {
    this.videoPlayer_.togglePause();
}
unisubs.subtitle.SyncPanel.prototype.downPressed_ = function() {
    if (this.videoPlayer_.isPlaying()) {
        if (this.downHeld_)
            return;
        this.captionManager_.disableCaptionEvents(true);
        this.downHeld_ = true;
        this.videoStarted_ = true;
        this.downPlayheadTime_ =
            this.videoPlayer_.getPlayheadTime();
        this.downSub_ =
            this.subtitles_.findLastForTime(this.downPlayheadTime_);
    }
    else if (this.videoPlayer_.isPaused() && !this.videoStarted_) {
        this.videoPlayer_.play();
        this.videoStarted_ = true;
    }
};
unisubs.subtitle.SyncPanel.prototype.downReleased_ = function() {
    this.captionManager_.disableCaptionEvents(false);
    this.downHeld_ = false;
    var playheadTime = this.videoPlayer_.getPlayheadTime();

    if (this.downSub_ == null ||
        !this.downSub_.isShownAt(this.downPlayheadTime_)) {
        // pressed down before first sub or in between subs.
        var nextSub = null;
        if (this.downSub_ == null && this.subtitles_.count() > 0)
            nextSub = this.subtitles_.caption(0);
        if (this.downSub_)
            nextSub = this.downSub_.getNextCaption();
        if (nextSub != null)
            nextSub.setStartTime(playheadTime);
    }
    else if (this.downSub_.isShownAt(playheadTime) &&
             this.downSub_.getNextCaption())
        this.downSub_.getNextCaption().setStartTime(playheadTime);
    else
        this.downSub_.setEndTime(playheadTime);

    this.downSub_ = null;
    this.downPlayheadTime_ = -1;
};
unisubs.subtitle.SyncPanel.prototype.startOverClicked_ = function() {
    var answer =
        confirm("Are you sure you want to start over? All timestamps " +
                "will be deleted.");
    if (answer) {
        this.subtitles_.clearTimes();
        this.videoPlayer_.setPlayheadTime(0);
    }
};
unisubs.subtitle.SyncPanel.prototype.currentlyEditingSubtitle_ = function() {
    return this.subtitleList_.isCurrentlyEditing();
};
unisubs.subtitle.SyncPanel.prototype.captionReached_ = function(event) {
    var editableCaption = event.caption;
    this.subtitleList_.clearActiveWidget();
    if (editableCaption != null)
        this.subtitleList_.setActiveWidget(editableCaption.getCaptionID());
};
unisubs.subtitle.SyncPanel.prototype.disposeInternal = function() {
    unisubs.subtitle.SyncPanel.superClass_.disposeInternal.call(this);
    if (this.rightPanel_)
        this.rightPanel_.dispose();
};

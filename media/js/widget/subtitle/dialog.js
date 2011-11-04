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

goog.provide('unisubs.subtitle.Dialog');

/**
 * @constructor
 * @param {unisubs.subtitle.ServerModel} serverModel
 * @param {unisubs.widget.SubtitleState} subtitles existing subtitles
 */
unisubs.subtitle.Dialog = function(videoSource, serverModel,
                                    subtitles, opt_opener,
                                    opt_skipFinished) {
    unisubs.Dialog.call(this, videoSource);
    unisubs.SubTracker.getInstance().start(false);
    this.serverModel_ = serverModel;
    this.opener_ = opt_opener;
    this.skipFinished_ = !!opt_skipFinished;
    this.captionSet_ = this.serverModel_.getCaptionSet();
    this.captionManager_ =
        new unisubs.CaptionManager(
            this.getVideoPlayerInternal(), this.captionSet_);
    this.serverModel_ = serverModel;
    this.serverModel_.init();
    /**
     * @type {?boolean} True iff we pass into FINISHED state.
     */
    this.saved_ = false;
    /**
     *
     * @type {?unisubs.subtitle.Dialog.State_}
     */
    this.state_ = null;
    this.currentSubtitlePanel_ = null;
    this.rightPanelListener_ = new goog.events.EventHandler(this);
    this.doneButtonEnabled_ = true;

    /**
     * @type {unisubs.widget.SubtitleState}
     */
    this.subtitles_ = subtitles;

    this.keyEventsSuspended_ = false;
};
goog.inherits(unisubs.subtitle.Dialog, unisubs.Dialog);

/**
 *
 * @enum
 */
unisubs.subtitle.Dialog.State_ = {
    TRANSCRIBE: 0,
    SYNC: 1,
    REVIEW: 2,
    FINISHED: 3
};
unisubs.subtitle.Dialog.prototype.captionReached_ = function(event) {
    var c = event.caption;
    this.getVideoPlayerInternal().showCaptionText(c ? c.getText() : '');
};
unisubs.subtitle.Dialog.prototype.createDom = function() {
    unisubs.subtitle.Dialog.superClass_.createDom.call(this);
    this.enterState_(unisubs.subtitle.Dialog.State_.TRANSCRIBE);
};
unisubs.subtitle.Dialog.prototype.showDownloadLink_ = function() {
    var that = this;
    this.getRightPanelInternal().showDownloadLink(
        function() { 
            return that.captionSet_.makeJsonSubs();
        });
};
unisubs.subtitle.Dialog.prototype.enterDocument = function() {
    unisubs.subtitle.Dialog.superClass_.enterDocument.call(this);
    unisubs.Dialog.translationDialogOpen = false;
    var doc = this.getDomHelper().getDocument();
    this.getHandler().
        listen(
            doc,
            goog.events.EventType.KEYDOWN,
            this.handleKeyDown_, true).
        listen(
            doc,
            goog.events.EventType.KEYUP,
            this.handleKeyUp_).
        listen(
            this.captionManager_,
            unisubs.CaptionManager.CAPTION,
            this.captionReached_);
};
unisubs.subtitle.Dialog.prototype.setExtraClass_ = function() {
    var extraClasses = goog.array.map(
        ['transcribe', 'sync', 'review', 'finished'],
        function(suffix) { return 'unisubs-modal-widget-' + suffix; });
    var currentClass = "";
    var s = unisubs.subtitle.Dialog.State_;
    if (this.state_ == s.TRANSCRIBE)
        currentClass = extraClasses[0];
    else if (this.state_ == s.SYNC)
        currentClass = extraClasses[1];
    else if (this.state_ == s.REVIEW)
        currentClass = extraClasses[2];
    else if (this.state_ == s.FINISHED)
        currentClass = extraClasses[3];
    goog.array.remove(extraClasses, currentClass);
    goog.dom.classes.addRemove(this.getContentElement(), extraClasses, currentClass);
};
unisubs.subtitle.Dialog.prototype.setState_ = function(state) {
    this.state_ = state;

    this.suspendKeyEvents_(false);

    var s = unisubs.subtitle.Dialog.State_;

    this.setExtraClass_();

    var nextSubPanel = this.makeCurrentStateSubtitlePanel_();
    var captionPanel = this.getCaptioningAreaInternal();
    captionPanel.removeChildren(true);
    captionPanel.addChild(nextSubPanel, true);

    var rightPanel = nextSubPanel.getRightPanel();
    this.setRightPanelInternal(rightPanel);

    this.getTimelinePanelInternal().removeChildren(true);

    this.disposeCurrentPanels_();
    this.currentSubtitlePanel_ = nextSubPanel;

    var et = unisubs.RightPanel.EventType;
    this.rightPanelListener_.
        listen(
            rightPanel, et.LEGENDKEY, this.handleLegendKeyPress_).
        listen(
            rightPanel, et.DONE, this.handleDoneKeyPress_).
        listen(
            rightPanel, et.SAVEANDEXIT, this.handleSaveAndExitKeyPress_).
        listen(
            rightPanel, et.GOTOSTEP, this.handleGoToStep_);
    if (state == s.SYNC || state == s.REVIEW) {
        rightPanel.showBackLink(
            state == s.SYNC ? "Back to Typing" : "Back to Sync");
        this.rightPanelListener_.listen(
            rightPanel, et.BACK, this.handleBackKeyPress_);
        this.timelineSubtitleSet_ =
            new unisubs.timeline.SubtitleSet(
                this.captionSet_, this.getVideoPlayerInternal());
        this.getTimelinePanelInternal().addChild(
            new unisubs.timeline.Timeline(
                1, this.timelineSubtitleSet_,
                this.getVideoPlayerInternal(), false), true);
    }
    if (state == s.REVIEW)
        this.showDownloadLink_();

    var videoPlayer = this.getVideoPlayerInternal();
    if (this.isInDocument()) {
        videoPlayer.pause();
        videoPlayer.setPlayheadTime(0);
    }
};
unisubs.subtitle.Dialog.prototype.suspendKeyEvents_ = function(suspended) {
    this.keyEventsSuspended_ = suspended;
    if (this.currentSubtitlePanel_)
        this.currentSubtitlePanel_.suspendKeyEvents(suspended);
};
unisubs.subtitle.Dialog.prototype.setFinishedState_ = function() {
    if (this.skipFinished_)
        this.setVisible(false);
    if (!unisubs.isFromDifferentDomain()) {
        window.location.assign(this.serverModel_.getPermalink() + '?saved=true');
        return;
    }
    this.state_ = unisubs.subtitle.Dialog.State_.FINISHED;
    this.setExtraClass_();
    var sharePanel = new unisubs.subtitle.SharePanel(
        this.serverModel_);
    this.setRightPanelInternal(sharePanel);
    this.getTimelinePanelInternal().removeChildren(true);
    this.getCaptioningAreaInternal().removeChildren(true);
    var bottomContainer = this.getBottomPanelContainerInternal();
    var bottomFinishedPanel = new unisubs.subtitle.BottomFinishedPanel(
        this, this.serverModel_.getPermalink());
    bottomContainer.addChild(bottomFinishedPanel, true);

    var videoPlayer = this.getVideoPlayerInternal();
    if (this.isInDocument()) {
        // TODO: make video player stop loading here?
        videoPlayer.pause();
        videoPlayer.setPlayheadTime(0);
    }
};
unisubs.subtitle.Dialog.prototype.handleGoToStep_ = function(event) {
    this.setState_(event.stepNo);
};
unisubs.subtitle.Dialog.prototype.handleKeyDown_ = function(event) {
    if (this.keyEventsSuspended_)
        return;
    var s = unisubs.subtitle.Dialog.State_;
    if (event.keyCode == goog.events.KeyCodes.TAB) {
        if (event.shiftKey) {
            this.skipBack_();
            this.getRightPanelInternal().setKeyDown(event.keyCode,
                unisubs.RightPanel.KeySpec.Modifier.SHIFT, true);
        }
        else {
            this.togglePause_();
            this.getRightPanelInternal().setKeyDown(event.keyCode, 0, true);
        }
        event.preventDefault();
    }
};
unisubs.subtitle.Dialog.prototype.handleKeyUp_ = function(event) {
    if (event.keyCode == goog.events.KeyCodes.TAB) {
        var modifier = 0;
        if (event.shiftKey)
            modifier = unisubs.RightPanel.KeySpec.Modifier.SHIFT;
        this.getRightPanelInternal().setKeyDown(event.keyCode, modifier, false);
    }
    else if (event.keyCode == goog.events.KeyCodes.SHIFT) {
        // if shift is released before tab, we still need to untoggle the legend
        this.getRightPanelInternal().setKeyDown(goog.events.KeyCodes.TAB,
            unisubs.RightPanel.KeySpec.Modifier.SHIFT, false);
    }
};
unisubs.subtitle.Dialog.prototype.handleBackKeyPress_ = function(event) {
    var s = unisubs.subtitle.Dialog.State_;
    if (this.state_ == s.SYNC)
        this.setState_(s.TRANSCRIBE);
    else if (this.state_ == s.REVIEW)
        this.setState_(s.SYNC);
};
unisubs.subtitle.Dialog.prototype.handleLegendKeyPress_ = function(event) {
    if (event.keyCode == goog.events.KeyCodes.TAB &&
        event.keyEventType == goog.events.EventType.CLICK) {
        if (event.modifiers == unisubs.RightPanel.KeySpec.Modifier.SHIFT)
            this.skipBack_();
        else
            this.togglePause_();
    }
};
unisubs.subtitle.Dialog.prototype.handleSaveAndExitKeyPress_ = function(event) {    
    if (!this.doneButtonEnabled_) {
        return;
    }
    this.saveWork(false);
};
unisubs.subtitle.Dialog.prototype.handleDoneKeyPress_ = function(event) {
    if (!this.doneButtonEnabled_)
        return;
    if (this.state_ == unisubs.subtitle.Dialog.State_.REVIEW)
        this.saveWork(false);
    else
        this.enterState_(this.nextState_());
};

unisubs.subtitle.Dialog.prototype.isWorkSaved = function() {
    return this.saved_ || !this.serverModel_.anySubtitlingWorkDone();
};

unisubs.subtitle.Dialog.prototype.saveWorkInternal = function(closeAfterSave) {
    if (this.captionSet_.needsSync()) {
        this.saveWorkImpl_(closeAfterSave, false);
    } else {
        unisubs.subtitle.CompletedDialog.show(
            !!this.subtitles_.IS_COMPLETE,
            goog.bind(this.saveWorkImpl_, this, 
                      closeAfterSave));    
    }
    
};

unisubs.subtitle.Dialog.prototype.onWorkSaved = function(closeAfterSave, isComplete){
    this.saved_ = true;
    unisubs.widget.ResumeEditingRecord.clear();
    if (this.finishFailDialog_) {
        this.finishFailDialog_.setVisible(false);
        this.finishFailDialog_ = null;
    }
    if (closeAfterSave)
        this.setVisible(false);
    else {
        this.doneButtonEnabled_ = true;
        this.setFinishedState_();
    }
};

unisubs.subtitle.Dialog.prototype.saveWorkImpl_ = function(closeAfterSave, isComplete) {
    this.doneButtonEnabled_ = false;
    this.getRightPanelInternal().showLoading(true);
    this.captionSet_.completed = isComplete;
    var that = this;
    this.serverModel_.finish(
        function(serverMsg){
            unisubs.subtitle.OnSavedDialog.show(serverMsg, function(){
                that.onWorkSaved(closeAfterSave, isComplete);
            })
            
        },
        function(opt_status) {
            if (that.finishFailDialog_)
                that.finishFailDialog_.failedAgain(opt_status);
            else
                that.finishFailDialog_ = unisubs.finishfaildialog.Dialog.show(
                    that.captionSet_, opt_status,
                    goog.bind(that.saveWorkImpl_, that, 
                              closeAfterSave, isComplete));
        },
        function() {
            that.doneButtonEnabled_ = true;
            that.getRightPanelInternal().showLoading(false);
        });
};

unisubs.subtitle.Dialog.prototype.enterState_ = function(state) {
    var skipHowto = unisubs.UserSettings.getBooleanValue(unisubs.UserSettings.Settings.SKIP_HOWTO_VIDEO);

    if (!skipHowto) {
        this.showHowToForState_(state);
    } else {
        this.showGuidelinesForState_(state);
    }
};

unisubs.subtitle.Dialog.prototype.showGuidelinesForState_ = function(state) {
    var s = unisubs.subtitle.Dialog.State_;
    if (state !== s.TRANSCRIBE || !unisubs.guidelines['subtitle']) {
        this.setState_(state);
        return;
    }

    this.suspendKeyEvents_(true);
    this.getVideoPlayerInternal().pause();

    var guidelinesPanel = new unisubs.GuidelinesPanel(unisubs.guidelines['subtitle']);
    this.showTemporaryPanel(guidelinesPanel);
    this.displayingGuidelines_ = true;

    var that = this;
    this.getHandler().listenOnce(guidelinesPanel, unisubs.GuidelinesPanel.CONTINUE, function(e) {
        goog.Timer.callOnce(function() {
            that.displayingGuidelines_ = false;
            that.hideTemporaryPanel();
            that.setState_(state);
        });
    });
};
unisubs.subtitle.Dialog.prototype.showHowToForState_ = function(state) {
    this.suspendKeyEvents_(true);
    this.getVideoPlayerInternal().pause();
    var s = unisubs.subtitle.Dialog.State_;
    var vc = unisubs.HowToVideoPanel.VideoChoice;
    var videoChoice;
    if (state == s.TRANSCRIBE)
        videoChoice = vc.TRANSCRIBE;
    else if (state == s.SYNC)
        videoChoice = vc.SYNC;
    else if (state == s.REVIEW)
        videoChoice = vc.REVIEW;
    var howToPanel = new unisubs.HowToVideoPanel(videoChoice);
    this.showTemporaryPanel(howToPanel);
    this.displayingHowTo_ = true;
    var that = this;
    this.getHandler().listenOnce(
        howToPanel, unisubs.HowToVideoPanel.CONTINUE,
        function(e) {
            goog.Timer.callOnce(function() {
                that.displayingHowTo_ = false;
                that.hideTemporaryPanel();
                that.showGuidelinesForState_(state);
            });
        });
};

unisubs.subtitle.Dialog.prototype.skipBack_ = function() {
    var videoPlayer = this.getVideoPlayerInternal();
    var now = videoPlayer.getPlayheadTime();
    videoPlayer.setPlayheadTime(Math.max(now - 8, 0));
    videoPlayer.play();
};
unisubs.subtitle.Dialog.prototype.togglePause_ = function() {
    this.getVideoPlayerInternal().togglePause();
};
unisubs.subtitle.Dialog.prototype.makeCurrentStateSubtitlePanel_ = function() {
    var s = unisubs.subtitle.Dialog.State_;
    if (this.state_ == s.TRANSCRIBE)
        return new unisubs.subtitle.TranscribePanel(
            this.captionSet_,
            this.getVideoPlayerInternal(),
            this.serverModel_);
    else if (this.state_ == s.SYNC)
        return new unisubs.subtitle.SyncPanel(
            this.captionSet_,
            this.getVideoPlayerInternal(),
            this.serverModel_,
            this.captionManager_);
    else if (this.state_ == s.REVIEW)
        return new unisubs.subtitle.ReviewPanel(
            this.captionSet_,
            this.getVideoPlayerInternal(),
            this.serverModel_,
            this.captionManager_);
};
unisubs.subtitle.Dialog.prototype.nextState_ = function() {
    var s = unisubs.subtitle.Dialog.State_;
    if (this.state_ == s.TRANSCRIBE)
        return s.SYNC;
    else if (this.state_ == s.SYNC)
        return s.REVIEW;
    else if (this.state_ == s.REVIEW)
        return s.FINISHED;
};
unisubs.subtitle.Dialog.prototype.showLoginNag_ = function() {
    // not doing anything here right now.
};
/**
 * Did we ever pass into finished state?
 */
unisubs.subtitle.Dialog.prototype.isSaved = function() {
    return this.saved_;
};
unisubs.subtitle.Dialog.prototype.disposeCurrentPanels_ = function() {
    if (this.currentSubtitlePanel_) {
        this.currentSubtitlePanel_.dispose();
        this.currentSubtitlePanel_ = null;
    }
    this.rightPanelListener_.removeAll();
    if (this.timelineSubtitleSet_ != null) {
        this.timelineSubtitleSet_.dispose();
        this.timelineSubtitleSet_ = null;
    }
};
unisubs.subtitle.Dialog.prototype.disposeInternal = function() {
    unisubs.subtitle.Dialog.superClass_.disposeInternal.call(this);
    this.disposeCurrentPanels_();
    this.captionManager_.dispose();
    this.serverModel_.dispose();
    this.rightPanelListener_.dispose();
    this.captionSet_.dispose();
};
unisubs.subtitle.Dialog.prototype.addTranslationsAndClose = function() {
    // Adam hypothesizes that this will get called 0 times except in testing
    unisubs.Tracker.getInstance().trackPageview('Adding_translations_on_close');
    var oldReturnURL = unisubs.returnURL;
    unisubs.returnURL = null;
    this.setVisible(false);
    unisubs.returnURL = oldReturnURL;
    var that = this;
    if (this.opener_) {
        unisubs.widget.ChooseLanguageDialog.show(
            true,
            function(subLanguage, originalLanguage, forked) {
                that.opener_.openDialog(
                    null, subLanguage, null, 
                    unisubs.isForkedLanguage(subLanguage));
            });
    }
};

unisubs.subtitle.Dialog.prototype.getServerModel = function(){
    return this.serverModel_;
}

unisubs.subtitle.Dialog.prototype.makeJsonSubs =  function (){
    return this.captionSet_.makeJsonSubs();
}

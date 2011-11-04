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

goog.provide('unisubs.Dialog');

/**
 * @constructor
 *
 */
unisubs.Dialog = function(videoSource) {
    goog.ui.Dialog.call(this, 'unisubs-modal-widget', true);
    this.setBackgroundElementOpacity(0.8);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.setEscapeToCancel(false);
    /**
     * This only becomes non-null on finish, when the server sends back 
     * new contents for the drop-down menu.
     * @type {unisubs.widget.DropDownContents}
     */
    this.dropDownContents_ = null;
    this.controlledVideoPlayer_ = videoSource.createControlledPlayer();
    this.videoPlayer_ = this.controlledVideoPlayer_.getPlayer();
    this.timelinePanel_ = null;
    this.captioningArea_ = null;
    this.rightPanelContainer_ = null;
    this.rightPanel_ = null;
    this.bottomPanelContainer_ = null;
    this.idleTimer_ = new goog.Timer(60000);
    this.idleTimer_.start();
    this.minutesIdle_ = 0;
    this.ignoreLock_ = unisubs.mode === 'review';
};
goog.inherits(unisubs.Dialog, goog.ui.Dialog);

/* @const {int}
 * Number of minutes until the idle dialog is show
 */
unisubs.Dialog.MINUTES_TILL_WARNING = 5;

/* @const {int}
 * Number of seconds after the idle dialog is show that
 * the current user session will be suspended. 
 */
unisubs.Dialog.SECONDS_TILL_FREEZE = 120;

/**
 * Set by whichever dialog is open. Since only one dialog is open on a page,
 * it is okay to make this global.
 */
unisubs.Dialog.translationDialogOpen = false;

unisubs.Dialog.prototype.createDom = function() {
    unisubs.Dialog.superClass_.createDom.call(this);
    var leftColumn = new goog.ui.Component();
    leftColumn.addChild(this.controlledVideoPlayer_, true);
    leftColumn.getElement().className = 'unisubs-left';
    leftColumn.addChild(this.timelinePanel_ = new goog.ui.Component(), true);
    leftColumn.addChild(this.captioningArea_ = new goog.ui.Component(), true);
    this.captioningArea_.getElement().className = 'unisubs-captioningArea';
    this.addChild(leftColumn, true);
    this.addChild(
        this.rightPanelContainer_ = new goog.ui.Component(), true);
    this.rightPanelContainer_.getElement().className = 'unisubs-right';
    this.getContentElement().appendChild(this.getDomHelper().createDom(
        'div', 'unisubs-clear'));
    this.addChild(
        this.bottomPanelContainer_ = new goog.ui.Component(), true);
};
unisubs.Dialog.prototype.enterDocument = function() {
    unisubs.Dialog.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(unisubs.ClosingWindow.getInstance(),
               unisubs.ClosingWindow.BEFORE_UNLOAD,
               this.onBeforeWindowUnload_).
        listen(unisubs.userEventTarget,
               unisubs.EventType.LOGIN,
               this.updateLoginState).
        listen(goog.dom.getDocumentScrollElement(),
               [goog.events.EventType.KEYDOWN,
                goog.events.EventType.MOUSEMOVE], 
               this.userIsNotIdle_).
        listen(this.idleTimer_,
               goog.Timer.TICK,
               this.idleTimerTick_);
};

unisubs.Dialog.prototype.userIsNotIdle_ = function() {
    this.minutesIdle_ = 0;
};

unisubs.Dialog.prototype.idleTimerTick_ = function() {
    this.minutesIdle_++;
    if (this.minutesIdle_ >= unisubs.Dialog.MINUTES_TILL_WARNING) {
        this.showIdleWarning_();
    }
};

unisubs.Dialog.prototype.showIdleWarning_ = function() {
    this.idleTimer_.stop();
    if (this.ignoreLock_) {
        return;
    }
    var serverModel = this.getServerModel();
    if (!serverModel) {
        return;
    }
    var dropLockDialog = new unisubs.widget.DropLockDialog(
        serverModel, this.makeJsonSubs());
    this.getHandler().listen(
        dropLockDialog,
        goog.ui.Dialog.EventType.AFTER_HIDE,
        this.dropLockDialogHidden_);
    dropLockDialog.setVisible(true);
};

unisubs.Dialog.prototype.dropLockDialogHidden_ = function(e) {
    var dialog = e.target;
    if (dialog.didLoseSession())
        this.hideDialogImpl_();
    else
        this.idleTimer_.start();
};

/**
 * Used to display a temporary overlay, for example the instructional
 * video panel in between subtitling steps.
 * @protected
 * @param {goog.ui.Component} panel Something with absolute positioning
 *
 */
unisubs.Dialog.prototype.showTemporaryPanel = function(panel) {
    this.hideTemporaryPanel();
    this.temporaryPanel_ = panel;
    this.addChild(panel, true);
};
/**
 * Hides and disposes the panel displayed in showTemporaryPanel.
 * @protected
 */
unisubs.Dialog.prototype.hideTemporaryPanel = function() {
    if (this.temporaryPanel_) {
        this.temporaryPanel_.stopVideo();
        this.removeChild(this.temporaryPanel_, true);
        this.temporaryPanel_.dispose();
        this.temporaryPanel_ = null;
    }
};

unisubs.Dialog.prototype.getVideoPlayerInternal = function() {
    return this.videoPlayer_;
};
unisubs.Dialog.prototype.getTimelinePanelInternal = function() {
    return this.timelinePanel_;
};
unisubs.Dialog.prototype.getCaptioningAreaInternal = function() {
    return this.captioningArea_;
};
unisubs.Dialog.prototype.setRightPanelInternal = function(rightPanel) {
    this.rightPanel_ = rightPanel;
    this.rightPanelContainer_.removeChildren(true);
    this.rightPanelContainer_.addChild(rightPanel, true);
};
unisubs.Dialog.prototype.getRightPanelInternal = function() {
    return this.rightPanel_;
};
unisubs.Dialog.prototype.getBottomPanelContainerInternal = function() {
    return this.bottomPanelContainer_;
};
unisubs.Dialog.prototype.updateLoginState = function() {
    this.rightPanel_.updateLoginState();
};
/**
 * Returns true if there's no work, or if there has been work
 * but it was saved.
 * @protected
 */
unisubs.Dialog.prototype.isWorkSaved = goog.abstractMethod;
/**
 * This corresponds to the finish button. It is not called during periodic saves.
 * @protected
 * @param {boolean} closeAfterSave
 */
unisubs.Dialog.prototype.saveWork = function(closeAfterSave) {
    unisubs.Tracker.getInstance().trackPageview('Submits_final_work_in_widget');
    if (unisubs.IS_NULL) {
        this.saved_ = true;
        var message = "Congratulations, you have completed a demo. There is a web full of videos waiting for your translations, enjoy!";
        //This should likely have a nicer modal
        alert(message);
        this.setVisible(false);
        return;
    }
    if (unisubs.currentUsername == null && !unisubs.isLoginAttemptInProgress())
        unisubs.login(function(loggedIn) {
            if (!loggedIn) {
                alert("We had a problem logging you in. You might want to check " +
                      "your web connection and try again.\n\nYou can also download " +
                      "your subtitles using the download button in the lower right corner " +
                      "of the dialog and email them to widget-logs@universalsubtitles.org.");
            }
        });
    else
        this.saveWorkInternal(closeAfterSave);
};
unisubs.Dialog.prototype.saveWorkInternal = function(closeAfterSave) {
    goog.abstractMethod();
};
unisubs.Dialog.prototype.onBeforeWindowUnload_ = function(event) {
    if (!this.isWorkSaved())
        event.message = "You have unsaved work.";
};
unisubs.Dialog.prototype.setVisible = function(visible) {
    if (visible) {
        unisubs.Dialog.superClass_.setVisible.call(this, true);
        goog.dom.getDocumentScrollElement().scrollTop = 0;
    }
    else {
        if (this.isWorkSaved()) {
            this.hideDialogImpl_();
        }
        else {
            this.showSaveWorkDialog_();
        }
    }
};
/**
 * @protected
 * @param {unisubs.widget.DropDownContents} dropDownContents
 */
unisubs.Dialog.prototype.setDropDownContentsInternal = function(dropDownContents) {
    this.dropDownContents_ = dropDownContents;
};
unisubs.Dialog.prototype.getDropDownContents = function() {
    return this.dropDownContents_;
};
unisubs.Dialog.prototype.showSaveWorkDialog_ = function() {
    var that = this;
    var unsavedWarning = new unisubs.UnsavedWarning(function(submit) {
        if (submit)
            that.saveWork(true);
        else {
            that.hideDialogImpl_(false);
        }
    });
    unsavedWarning.setVisible(true);
};

unisubs.Dialog.prototype.getServerModel = goog.abstractMethod;

/**
 * @protected
 */
unisubs.Dialog.prototype.hideToFork = function() {
    // we just want to hide translation dialog to switch to subtitling dialog
    // because of a fork. so skip releasing the lock and changing the location.
    unisubs.Dialog.superClass_.setVisible.call(this, false);
};

unisubs.Dialog.prototype.hideDialogImpl_ = function() {
    var serverModel = this.getServerModel();
    if (serverModel){
        var args = {};
        args['session_pk'] = serverModel.getSessionPK();
        unisubs.Rpc.call("release_lock", args);    
    }
    if (unisubs.returnURL != null) {
        goog.Timer.callOnce(function() {
            window.location.replace(unisubs.returnURL);
        });
    }
    unisubs.Dialog.superClass_.setVisible.call(this, false);
};

unisubs.Dialog.prototype.makeJsonSubs = goog.abstractMethod;

unisubs.Dialog.prototype.disposeInternal = function() {
    unisubs.Dialog.superClass_.disposeInternal.call(this);
    this.videoPlayer_.dispose();
    this.idleTimer_.dispose();
};

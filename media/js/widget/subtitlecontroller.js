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

goog.provide('unisubs.widget.SubtitleController');

/**
 * @constructor
 */
unisubs.widget.SubtitleController = function(
    videoID, videoURL, playController, videoTab, dropDown) 
{
    this.videoID_ = videoID;
    this.videoURL_ = videoURL;
    this.videoTab_ = videoTab;
    this.dropDown_ = dropDown;
    this.playController_ = playController;
    this.playController_.setSubtitleController(this);
    this.handler_ = new goog.events.EventHandler(this);
    this.dialogOpener_ = new unisubs.widget.SubtitleDialogOpener(
        videoID, videoURL, this.playController_.getVideoSource(),
        function(loading) {
            if (loading)
                videoTab.showLoading();
            else
                videoTab.stopLoading();
        },
        goog.bind(playController.stopForDialog, playController));

    /**
     * Show a request subtitles button as a nudge.
     * It will get overwritten by the Improve Subtitles button.
     */
    if (!this.dropDown_.hasSubtitles()) {
        /*
        this.videoTab_.updateNudge(
            'Request Subtitles',
            goog.bind(this.openRequestSubtitlesDialog,
                      this));
        
        this.videoTab_.showNudge(true);
         */
    }

    this.handler_.listenOnce(
        this.dialogOpener_,
        goog.ui.Dialog.EventType.AFTER_HIDE,
        this.subtitleDialogClosed_);
    var s = unisubs.widget.DropDown.Selection;
    this.handler_.
        listen(
            dropDown,
            s.ADD_LANGUAGE,
            this.openNewLanguageDialog).
        listen(
            dropDown,
            s.IMPROVE_SUBTITLES,
            this.improveSubtitles).
       listen(
            dropDown,
            s.REQUEST_SUBTITLES,
            this.requestSubtitles_).
       listen(
            videoTab.getAnchorElem(), 'click',
            this.videoAnchorClicked_
        );
};

unisubs.widget.SubtitleController.prototype.videoAnchorClicked_ = 
    function(e) 
{
    e.preventDefault();
    unisubs.Tracker.getInstance().trackPageview('videoTabClicked');
    var resumeEditingRecord = null;
    if (unisubs.supportsLocalStorage()) {
        resumeEditingRecord = unisubs.widget.ResumeEditingRecord.fetch();
    }
    var that = this;
    if (goog.isDefAndNotNull(resumeEditingRecord) &&
        goog.isDefAndNotNull(resumeEditingRecord.getSavedSubtitles()) && 
        resumeEditingRecord.getVideoID() == this.videoID_) {
        var resumeDialog = new unisubs.ResumeDialog(
            resumeEditingRecord,
            function(resume) {
                if (resume) {
                    that.openWidgetResume_();
                    
                }
                else {
                    that.videoAnchorClickedImpl_();
                }
            });
        resumeDialog.setVisible(true);
    }
    else {
        this.videoAnchorClickedImpl_();
    }
};

unisubs.widget.SubtitleController.prototype.openWidgetResume_ = function() {
    var config = {
        'videoID': this.videoID_,
        'videoURL': this.videoURL_,
        'effectiveVideoURL': this.playController_.getVideoSource().getVideoURL(),
        'returnURL': window.location.href
    };
    var uri = new goog.Uri(unisubs.siteURL() + '/onsite_widget_resume/');
    uri.setParameterValue(
        'config',
        goog.json.serialize(config));
    window.location.assign(uri.toString());
};

unisubs.widget.SubtitleController.prototype.videoAnchorClickedImpl_ = function() {
    if (!this.dropDown_.hasSubtitles())
        this.openSubtitleDialog();
    else
        this.dropDown_.toggleShow();
};

unisubs.widget.SubtitleController.prototype.improveSubtitles = function() {
    var state  = this.playController_.getSubtitleState();
    this.dialogOpener_.openDialogOrRedirect(
        new unisubs.widget.OpenDialogArgs(
            state.LANGUAGE,
            null,
            state.LANGUAGE_PK,
            state.BASE_LANGUAGE_PK),
        this.playController_.getVideoSource().getVideoURL());
};

/**
 * Corresponds to "request subtitles" in menu.
 */
unisubs.widget.SubtitleController.prototype.requestSubtitles_ = function() {
    this.openRequestSubtitlesDialog();
};

/**
 * Corresponds to "add new subs" in menu.
 */
unisubs.widget.SubtitleController.prototype.openSubtitleDialog = 
    function() 
{
    var state  = this.playController_.getSubtitleState();
    this.openNewLanguageDialog(state);
};

unisubs.widget.SubtitleController.prototype.openNewLanguageDialog = 
    function(opt_langState) 
{
    this.dialogOpener_.showStartDialog(
        this.playController_.getVideoSource().getVideoURL(), opt_langState);
};

unisubs.widget.SubtitleController.prototype.subtitleDialogClosed_ = function(e) {
    var dropDownContents = e.target.getDropDownContents();
    this.playController_.dialogClosed();
    this.videoTab_.showContent(
        this.dropDown_.hasSubtitles(),
        this.playController_.getSubtitleState());
    this.dropDown_.setCurrentSubtitleState(
        this.playController_.getSubtitleState());
    if (dropDownContents != null) {
        this.dropDown_.updateContents(dropDownContents);
    }
};

/**
 * Opens the request subtitles dialog.
 */
unisubs.widget.SubtitleController.prototype.openRequestSubtitlesDialog = function()
{
    unisubs.login();
    if (unisubs.isLoginAttemptInProgress()) {
        //Logging in
        return;
    }
    else{
        // Create a new request Dialog
        var dialog = new unisubs.RequestDialog(this.videoID_);
        dialog.setVisible(true);
    }
}

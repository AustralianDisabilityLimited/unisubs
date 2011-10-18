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

goog.provide('unisubs.translate.Dialog');

/**
 * @constructor
 * 
 */
unisubs.translate.Dialog = function(opener, 
                                     serverModel,
                                     videoSource, 
                                     subtitleState, 
                                     standardSubState) {
    unisubs.Dialog.call(this, videoSource);
    unisubs.SubTracker.getInstance().start(true);
    this.opener_ = opener;
    this.subtitleState_ = subtitleState;
    this.standardSubState_ = standardSubState;

    this.serverModel_ = serverModel;
    this.serverModel_.init();
    this.saved_ = false;
};
goog.inherits(unisubs.translate.Dialog, unisubs.Dialog);
unisubs.translate.Dialog.prototype.createDom = function() {
    unisubs.translate.Dialog.superClass_.createDom.call(this);
    this.translationPanel_ = new unisubs.translate.TranslationPanel(
        this.serverModel_.getCaptionSet(), this.standardSubState_);
    this.getCaptioningAreaInternal().addChild(
        this.translationPanel_, true);
    var rightPanel = this.createRightPanel_();
    this.setRightPanelInternal(rightPanel);
    this.getHandler().
        listen(
            rightPanel, unisubs.RightPanel.EventType.DONE,
            this.handleDoneKeyPress_).
        listen(
            rightPanel, unisubs.RightPanel.EventType.SAVEANDEXIT,
            this.handleSaveAndExitKeyPress_);
    goog.dom.classes.add(this.getContentElement(),
                         'unisubs-modal-widget-translate');
    this.showGuidelines_();
};
unisubs.translate.Dialog.prototype.showGuidelines_ = function() {
    if (!unisubs.guidelines['translate']) {
        return;
    }

    var guidelinesPanel = new unisubs.GuidelinesPanel(unisubs.guidelines['translate']);
    this.showTemporaryPanel(guidelinesPanel);
    this.displayingGuidelines_ = true;

    var that = this;
    this.getHandler().listenOnce(guidelinesPanel, unisubs.GuidelinesPanel.CONTINUE, function(e) {
        goog.Timer.callOnce(function() {
            that.displayingGuidelines_ = false;
            that.hideTemporaryPanel();
        });
    });
};
unisubs.translate.Dialog.prototype.createRightPanel_ = function() {
    var title = this.subtitleState_.VERSION > 0 ? 
        "Editing Translation" : "Adding a New Translation";
    var helpContents = new unisubs.RightPanel.HelpContents(
        title,
        [["Thanks for volunteering to translate! Your translation will be available to ",
"everyone  watching the video in our widget."].join(''),
         ["Please translate each line, one by one, in the white  ", 
          "space below each line."].join(''),
         ["If you need to rearrange the order of words or split a phrase ",
          "differently, that's okay."].join(''),
         ["As you're translating, you can use the \"TAB\" key to advance to ",
          "the next line, and \"Shift-TAB\" to go back."].join('')
        ]);
    var extraHelp = [
        ["Google Translate", "http://translate.google.com/"],
        ["List of dictionaries", "http://yourdictionary.com/languages.html"],
        ["Firefox spellcheck dictionaries", 
         "https://addons.mozilla.org/en-US/firefox/browse/type:3"]
    ];
    return new unisubs.translate.TranslationRightPanel(
        this,
        this.serverModel_, helpContents, extraHelp, [], false, "Done?", 
        "Submit final translation", "Resources for Translators");
};
unisubs.translate.Dialog.prototype.handleSaveAndExitKeyPress_ = function(e) {
    e.preventDefault();
    this.saveWork(true);
};
unisubs.translate.Dialog.prototype.handleDoneKeyPress_ = function(event) {
    this.saveWork(true);
    event.preventDefault();
};
unisubs.translate.Dialog.prototype.isWorkSaved = function() {
    return this.saved_ || !this.serverModel_.anySubtitlingWorkDone();
};
unisubs.translate.Dialog.prototype.enterDocument = function() {
    unisubs.translate.Dialog.superClass_.enterDocument.call(this);
    unisubs.Dialog.translationDialogOpen = true;
    var that = this;
    this.getRightPanelInternal().showDownloadLink(
        function() {
            return that.makeJsonSubs();
        });
};
unisubs.translate.Dialog.prototype.saveWorkInternal = function(closeAfterSave) {
    var that = this;
    this.getRightPanelInternal().showLoading(true);
    this.serverModel_.finish(
        function(serverMsg){
            unisubs.subtitle.OnSavedDialog.show(serverMsg, function(){
                that.onWorkSaved(closeAfterSave);
            })
        },
        function(opt_status) {
            if (that.finishFailDialog_)
                that.finishFailDialog_.failedAgain(opt_status);
            else
                that.finishFailDialog_ = unisubs.finishfaildialog.Dialog.show(
                    that.serverModel_.getCaptionSet(), opt_status,
                    goog.bind(that.saveWorkInternal, that, closeAfterSave));
        });
};
unisubs.translate.Dialog.prototype.onWorkSaved = function() {
    if (this.finishFailDialog_) {
        this.finishFailDialog_.setVisible(false);
        this.finishFailDialog_ = null;
    }
    unisubs.widget.ResumeEditingRecord.clear();
    this.getRightPanelInternal().showLoading(false);
    this.saved_ = true;
    this.setVisible(false);
}

unisubs.translate.Dialog.prototype.disposeInternal = function() {
    unisubs.translate.Dialog.superClass_.disposeInternal.call(this);
    this.serverModel_.dispose();
};
/**
 * Tries translate subtitles with BingTranslator
 */
unisubs.translate.Dialog.prototype.translateViaBing = function(){
    //I don't know how better call this. I think it should be incapsulated in translationList_,
    //but have chain of function calls can confuse.
    this.translationPanel_.getTranslationList().translateViaBing(
        this.standardSubState_.LANGUAGE, this.subtitleState_.LANGUAGE);
};

unisubs.translate.Dialog.prototype.getStandardLanguage = function(){
    return this.standardSubState_.LANGUAGE;
};

unisubs.translate.Dialog.prototype.getSubtitleLanguage = function(){
    return this.subtitleState_.LANGUAGE;
};

unisubs.translate.Dialog.prototype.getServerModel = function(){
    return this.serverModel_;
}

unisubs.translate.Dialog.prototype.makeJsonSubs =  function (){
    return this.serverModel_.getCaptionSet().makeJsonSubs();
};

unisubs.translate.Dialog.prototype.forkAndClose = function() {
    var dialog = new unisubs.translate.ForkDialog(
        goog.bind(this.forkImpl_, this));
    dialog.setVisible(true);
};

unisubs.translate.Dialog.prototype.forkImpl_ = function() {
    this.subtitleState_.fork();
    this.serverModel_.fork(this.standardSubState_);
    this.hideToFork();
    this.opener_.openSubtitlingDialog(
        this.serverModel_,
        this.subtitleState_);
};

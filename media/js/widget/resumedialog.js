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

goog.provide('unisubs.ResumeDialog');

/**
 * @constructor
 * @param {unisubs.widget.ResumeEditingRecord} resumeEditingRecord
 * @param {function(boolean)} callback Passes true for resume, false otherwise.
 *
 */
unisubs.ResumeDialog = function(resumeEditingRecord, callback) {
    goog.ui.Dialog.call(this, 'unisubs-modal-lang', true);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.resumeEditingRecord_ = resumeEditingRecord;
    this.callback_ = callback;
};
goog.inherits(unisubs.ResumeDialog, goog.ui.Dialog);

unisubs.ResumeDialog.prototype.createDom = function() {
    unisubs.ResumeDialog.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());
    var el = this.getContentElement();
    var language = 
        unisubs.languageNameForCode(
            this.resumeEditingRecord_.getOpenDialogArgs().LANGUAGE);
    this.cancelButton_ =
        $d('a',
           {'href':'#',
            'className': 'unisubs-green-button unisubs-big'},
           'Cancel');
    this.okButton_ =
        $d('a',
           {'href':'#',
            'className': 'unisubs-green-button unisubs-big'},
           'OK');
    var clearDiv = $d('div');
    unisubs.style.setProperty(clearDiv, 'clear', 'both');
    clearDiv.innerHTML = "&nbsp;";
    goog.dom.append(
        el,
        $d('h3', null, 'Resume editing?'),
        $d('p', null, 'You have saved ' + language + ' subtitles for this video. Would you like to resume editing those subtitles? Warning: clicking Cancel will erase your saved subs.'),
        this.cancelButton_, this.okButton_, clearDiv);
};

unisubs.ResumeDialog.prototype.enterDocument = function() {
    unisubs.ResumeDialog.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(
            this.cancelButton_,
            goog.events.EventType.CLICK,
            this.cancelClicked_).
        listen(
            this.okButton_,
            goog.events.EventType.CLICK,
            this.okClicked_);
};

unisubs.ResumeDialog.prototype.cancelClicked_ = function(e) {
    e.preventDefault();
    if (this.okWasClicked_) {
        return;
    }
    unisubs.widget.ResumeEditingRecord.clear();
    this.setVisible(false);
    this.callback_(false);
};

unisubs.ResumeDialog.prototype.okClicked_ = function(e) {
    e.preventDefault();
    if (this.okWasClicked_) {
        return;
    }
    this.okWasClicked_ = true;
    goog.dom.setTextContent(
        this.okButton_, "Loading...");
    goog.dom.classes.add(
        this.okButton_, "unisubs-button-disabled");
    this.callback_(true);
};

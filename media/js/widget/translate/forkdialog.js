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

goog.provide('unisubs.translate.ForkDialog');

/**
 * @constructor
 * @param {function()} finishedCallback Called iff the user decides to go ahead and fork.
 */
unisubs.translate.ForkDialog = function(finishedCallback) {
    goog.ui.Dialog.call(this, 'unisubs-forkdialog', true);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.finishedCallback_ = finishedCallback;
};
goog.inherits(unisubs.translate.ForkDialog, goog.ui.Dialog);

unisubs.translate.ForkDialog.prototype.createDom = function() {
    unisubs.translate.ForkDialog.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.getElement().appendChild(
        $d('div', null,
           $d('p', null, 'Are you sure you want to edit timing?'),
           $d('p', null, 
              'Advanced users only!  Most subtitles should keep original ' +
              'timing. You can edit this timing on the original language ' +
              'subtitle page. ' +
              'If unsure, click cancel now.'),
           $d('p', null,
              'If you continue, you should finish all translations first ' +
              '(the original text will not be visible on the next screen).')));
    this.cancelButton_ =
        $d('a',
           {'href':'#',
            'className': 'unisubs-green-button unisubs-big'},
           'Cancel');
    this.okButton_ =
        $d('a',
           {'href':'#',
            'className': 'unisubs-green-button unisubs-big'},
           'Continue');
    this.getElement().appendChild(this.cancelButton_);
    this.getElement().appendChild(this.okButton_);
    var clearDiv = $d('div');
    unisubs.style.setProperty(clearDiv, 'clear', 'both');
    clearDiv.innerHTML = "&nbsp;";
    this.getElement().appendChild(clearDiv);
};

unisubs.translate.ForkDialog.prototype.enterDocument = function() {
    unisubs.translate.ForkDialog.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(this.okButton_,
               'click',
               this.linkClicked_).
        listen(this.cancelButton_,
               'click',
               this.linkClicked_);
};

unisubs.translate.ForkDialog.prototype.linkClicked_ = function(e) {
    e.preventDefault();
    this.setVisible(false);
    if (e.target == this.okButton_) {
        this.finishedCallback_();
    }
};

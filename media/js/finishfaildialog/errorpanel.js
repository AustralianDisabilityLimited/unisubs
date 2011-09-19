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

/**
 * @fileoverview Meant to be used in unisubs.finishfaildialog.Dialog. 
 *    Corresponds to 'error' state of that dialog.
 */

goog.provide('unisubs.finishfaildialog.ErrorPanel');

/**
 * @constructor
 */
unisubs.finishfaildialog.ErrorPanel = function(captionSet) {
    goog.ui.Component.call(this);
    this.captionSet_ = captionSet;
};
goog.inherits(unisubs.finishfaildialog.ErrorPanel, goog.ui.Component);

unisubs.finishfaildialog.ErrorPanel.prototype.createDom = function() {
    unisubs.finishfaildialog.ErrorPanel.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.downloadSubsLink_ = 
        $d('a', {'href': '#'}, 'Download your subtitles to save your work.');
    this.downloadErrorReportLink_ =
        $d('a', {'href': '#'}, 'Send error report.');
    goog.dom.append(
        this.getElement(),
        $d('p', null, 'We failed to save your subtitles. Don\'t worry, your work is not lost. You can save it now on your computer and upload it to the server any time later.'),
        $d('p', null, this.downloadSubsLink_));
};

unisubs.finishfaildialog.ErrorPanel.prototype.enterDocument = function() {
    unisubs.finishfaildialog.ErrorPanel.superClass_.enterDocument.call(this);
    this.getHandler()
        .listen(
            this.downloadSubsLink_, 'click',
            this.downloadSubsClicked_);
};

unisubs.finishfaildialog.ErrorPanel.prototype.downloadSubsClicked_ = function(e) {
    e.preventDefault();
    unisubs.finishfaildialog.CopyDialog.showForSubs(
        this.captionSet_.makeJsonSubs());
};

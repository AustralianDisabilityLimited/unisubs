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

goog.provide('unisubs.UnsavedWarning');

/**
 * @constructor
 * @param {function(boolean)} callback Called with true 
 *     to submit subs, false otherwise.
 */
unisubs.UnsavedWarning = function(callback) {
    goog.ui.Dialog.call(this, null, true);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.callback_ = callback;
    this.submitChosen_ = false;
};
goog.inherits(unisubs.UnsavedWarning, goog.ui.Dialog);

unisubs.UnsavedWarning.prototype.createDom = function() {
    unisubs.UnsavedWarning.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    var e = this.getElement();
    e.className = 'unisubs-warning';
    e.appendChild($d('h2', null, 'Submit subtitles?'));
    e.appendChild($d('p', null, 'Do you want to save your work for others to build on? If you were messing around or testing, please discard.'));
    this.discardLink_ = $d('a', {'className': 'unisubs-link', 'href':'#'}, 'Discard');
    this.submitLink_ = $d('a', {'className': 'unisubs-link', 'href': '#'}, 'Submit subtitles');
    e.appendChild($d('div', 'unisubs-buttons', this.discardLink_, this.submitLink_));
};

unisubs.UnsavedWarning.prototype.enterDocument = function() {
    unisubs.UnsavedWarning.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(this.discardLink_, 'click', this.linkClicked_).
        listen(this.submitLink_, 'click', this.linkClicked_);
};

unisubs.UnsavedWarning.prototype.linkClicked_ = function(e) {
    e.preventDefault();
    this.submitChosen_ = e.target == this.submitLink_;
    this.setVisible(false);    
};

unisubs.UnsavedWarning.prototype.setVisible = function(visible) {
    if (!visible)
        this.callback_(this.submitChosen_);
    unisubs.UnsavedWarning.superClass_.setVisible.call(this, visible);
};

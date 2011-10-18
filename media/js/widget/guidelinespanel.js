// Universal Subtitles, universalsubtitles.org
//
// Copyright (C) 2011 Participatory Culture Foundation
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

goog.provide('unisubs.GuidelinesPanel');

/**
 * @constructor
 * @param {String} guidelineText
 */
unisubs.GuidelinesPanel = function(guidelineText) {
    goog.ui.Component.call(this);
    this.guidelineText_ = guidelineText;
};
goog.inherits(unisubs.GuidelinesPanel, goog.ui.Component);

unisubs.GuidelinesPanel.CONTINUE = 'continue';

unisubs.GuidelinesPanel.prototype.getContentElement = function() {
    return this.contentElement_;
};

unisubs.GuidelinesPanel.prototype.createDom = function() {
    unisubs.GuidelinesPanel.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());

    this.contentElement_ = $d('div');

    var el = this.getElement();
    el.className = 'unisubs-guidelinespanel';
    el.appendChild(this.contentElement_);

    this.guidelineHeader_ = $d('h2', null, 'Guidelines');
    el.appendChild(this.guidelineHeader_);

    this.guidelineEl_ = $d('div', null, goog.dom.htmlToDocumentFragment(this.guidelineText_));
    el.appendChild(this.guidelineEl_);

    this.continueLink_ = $d('a', {'className': 'unisubs-done', 'href': '#'},
                            $d('span', null, 'Continue'));
    el.appendChild(this.continueLink_);
};

unisubs.GuidelinesPanel.prototype.enterDocument = function() {
    unisubs.GuidelinesPanel.superClass_.enterDocument.call(this);
    this.getHandler().listen(this.continueLink_, 'click', this.continue_);
};

unisubs.GuidelinesPanel.prototype.continue_ = function(e) {
    e.preventDefault();
    this.dispatchEvent(unisubs.GuidelinesPanel.CONTINUE);
};

unisubs.GuidelinesPanel.prototype.disposeInternal = function() {
    unisubs.GuidelinesPanel.superClass_.disposeInternal.call(this);
};

unisubs.GuidelinesPanel.prototype.stopVideo = function() {};

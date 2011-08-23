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

goog.provide('unisubs.translate.TitleTranslation');

/**
 * @constructor
 * @param {string} video title
 */
unisubs.translate.TitleTranslationWidget = function(videoTitle, captionSet) {
    goog.ui.Component.call(this);
    this.originalVideoTitle_ = videoTitle || '';
    this.captionSet_ = captionSet;
};
goog.inherits(unisubs.translate.TitleTranslationWidget, goog.ui.Component);

unisubs.translate.TitleTranslationWidget.prototype.createDom = function() {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());

    this.setElementInternal(
        $d('li', null,
           $d('div', null,
              $d('span', 'unisubs-title unisubs-title-notime', 'TITLE: '+this.originalVideoTitle_),
              this.loadingIndicator_ = $d('span', 'unisubs-loading-indicator', 'loading...')
           ),
           this.translateInput_ = $d('textarea', 'unisubs-translateField')
        )
    );

    this.getHandler().listen(
        this.translateInput_, goog.events.EventType.BLUR,
        this.inputLostFocus_);
};

unisubs.translate.TitleTranslationWidget.prototype.showLoadingIndicator = function(){
    unisubs.style.showElement(this.loadingIndicator_, true);
};

unisubs.translate.TitleTranslationWidget.prototype.hideLoadingIndicator = function(){
    unisubs.style.showElement(this.loadingIndicator_, false);
};

unisubs.translate.TitleTranslationWidget.prototype.getOriginalValue = function(){
    return this.originalVideoTitle_;
};

unisubs.translate.TitleTranslationWidget.prototype.isEmpty = function(){
    return ! goog.string.trim(this.translateInput_.value);
};

unisubs.translate.TitleTranslationWidget.prototype.setTranslation = function(value){
    this.translateInput_.value = value;
    this.inputLostFocus_();
};

unisubs.translate.TitleTranslationWidget.prototype.setTranslationContent = 
    unisubs.translate.TitleTranslationWidget.prototype.setTranslation;

unisubs.translate.TitleTranslationWidget.prototype.inputLostFocus_ = function(event) {
    this.captionSet_.title = this.translateInput_.value;
};
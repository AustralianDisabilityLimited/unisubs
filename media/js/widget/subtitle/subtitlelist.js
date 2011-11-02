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

goog.provide('unisubs.subtitle.SubtitleList');
 /**
 * @constructor
 * @extends goog.ui.Component
 *
 * @param {unisubs.subtitle.EditableCaptionSet} captionSet
 */
unisubs.subtitle.SubtitleList = function(videoPlayer, captionSet,
                                          displayTimes, opt_showBeginMessage,
                                          readOnly) {
    goog.ui.Component.call(this);
    this.videoPlayer_ = videoPlayer;
    this.captionSet_ = captionSet;
    this.readOnly_ = readOnly;
    this.displayTimes_ = displayTimes;
    this.currentActiveSubtitle_ = null;
    /**
     * A map of captionID to unisubs.subtitle.SubtitleWidget
     */
    this.subtitleMap_ = {};
    this.currentlyEditing_ = false;
    this.showBeginMessage_ = opt_showBeginMessage ? true : false;
    this.showingBeginMessage_ = false;
    /**
     * The last subtitle displayed.
     * @type {?unisubs.subtitle.SubtitleWidget}
     */
    this.lastSub_ = null;
    this.lastSubMouseHandler_ = new goog.events.EventHandler(this);
};
goog.inherits(unisubs.subtitle.SubtitleList, goog.ui.Component);
unisubs.subtitle.SubtitleList.prototype.createDom = function() {
    var dh = this.getDomHelper();
    var $d = goog.bind(dh.createDom, dh);
    var $t = goog.bind(dh.createTextNode, dh);

    var list_class = 'unisubs-titlesList';
    if (this.readOnly_) {
        list_class += ' read-only';
    }
    this.setElementInternal($d('ul', list_class));

    if (this.captionSet_.count() === 0 && this.showBeginMessage_) {
        this.showingBeginMessage_ = true;
        goog.dom.classes.add(this.getElement(), 'unisubs-beginTab');
        this.getElement().appendChild(
            $d('li', 'unisubs-beginTabLi',
               $t('To begin, press TAB to play'),
               $d('br'),
               $t('and start typing!')));
    } else {
        this.readOnly_ || this.addAddButton_();
        var i;
        for (i = 0; i < this.captionSet_.count(); i++)
            this.addSubtitle(this.captionSet_.caption(i), false, true);
        this.setLastSub_();
    }
};
unisubs.subtitle.SubtitleList.prototype.addAddButton_ = function() {
    this.addSubtitleButton_ = new unisubs.subtitle.AddSubtitleWidget();
    this.addChild(this.addSubtitleButton_, true);
    this.addSubtitleButton_.showLink(false);
    if (this.isInDocument())
        this.listenForAdd_();
};
unisubs.subtitle.SubtitleList.prototype.listenForAdd_ = function() {
    this.getHandler().listen(this.addSubtitleButton_,
                             unisubs.subtitle.AddSubtitleWidget.ADD,
                             this.addSubtitleClicked_);
    var et = goog.events.EventType;
    this.getHandler().
        listen(this.addSubtitleButton_.getElement(),
               et.MOUSEOVER,
               this.onAddSubMouseover_).
        listen(this.addSubtitleButton_.getElement(),
               et.MOUSEOUT,
               this.onAddSubMouseout_);
};
unisubs.subtitle.SubtitleList.prototype.enterDocument = function() {
    unisubs.subtitle.SubtitleList.superClass_.enterDocument.call(this);
    var et = unisubs.subtitle.EditableCaptionSet.EventType;
    this.getHandler().
        listen(
            this.captionSet_,
            et.CLEAR_ALL,
            this.captionsCleared_).
        listen(
            this.captionSet_,
            et.CLEAR_TIMES,
            this.captionTimesCleared_).
        listen(
            this.captionSet_,
            et.ADD,
            this.captionInserted_).
        listen(
            this.captionSet_,
            et.DELETE,
            this.captionDeleted_);
    if (this.addSubtitleButton_ && !this.readOnly_) {
        this.listenForAdd_();
    }
};
unisubs.subtitle.SubtitleList.prototype.captionsCleared_ = function(event) {
    this.subtitleMap_ = {};
    while (this.getChildCount() > 1)
        this.removeChildAt(0, true);
};
unisubs.subtitle.SubtitleList.prototype.captionDeleted_ = function(e) {
    var widget = this.subtitleMap_[e.caption.getCaptionID()];
    delete this.subtitleMap_[e.caption.getCaptionID()];
    this.removeChild(widget, true);
};
unisubs.subtitle.SubtitleList.prototype.captionTimesCleared_ = function(e) {
    var subtitleWidgets = goog.object.getValues(this.subtitleMap_);
    goog.array.forEach(subtitleWidgets, function(w) { w.clearTimes(); });
};
unisubs.subtitle.SubtitleList.prototype.createNewSubWidget_ =
    function(editableCaption)
{
    return new unisubs.subtitle.SubtitleWidget(
        editableCaption,
        this.captionSet_,
        goog.bind(this.setCurrentlyEditing_, this),
        this.displayTimes_,
        this.readOnly_);
};
/**
 *
 * @param {unisubs.subtitle.EditableCaption} subtitle
 *
 */
unisubs.subtitle.SubtitleList.prototype.addSubtitle =
    function(subtitle, opt_scrollDown, opt_dontSetLastSub)
{
    if (this.showingBeginMessage_) {
        goog.dom.removeChildren(this.getElement());
        goog.dom.classes.remove(this.getElement(), 'unisubs-beginTab');
        this.showingBeginMessage_ = false;
        this.readOnly_ || this.addAddButton_();
    }
    var dest_offset = this.getChildCount() - (this.readOnly_ ? 0 : 1);
    var subtitleWidget = this.createNewSubWidget_(subtitle);
    this.addChildAt(subtitleWidget, dest_offset, true);
    this.subtitleMap_[subtitle.getCaptionID()] = subtitleWidget;
    if (opt_scrollDown && typeof(opt_scrollDown) == 'boolean')
        this.scrollToCaption(subtitle.getCaptionID());
    if (!opt_dontSetLastSub)
        this.setLastSub_();
};
unisubs.subtitle.SubtitleList.prototype.captionInserted_ = function(e) {
    var addedCaption = e.caption;
    var subtitleWidget = this.createNewSubWidget_(addedCaption);
    var nextCaption = addedCaption.getNextCaption();
    if (nextCaption != null) {
        var nextWidget = this.subtitleMap_[nextCaption.getCaptionID()];
        this.addChildAt(subtitleWidget, this.indexOfChild(nextWidget), true);
    }
    else {
        this.addChildAt(subtitleWidget, this.getChildCount() - 1, true);
        this.setLastSub_();
    }
    this.subtitleMap_[addedCaption.getCaptionID()] = subtitleWidget;
    subtitleWidget.switchToEditMode();
};
unisubs.subtitle.SubtitleList.prototype.setLastSub_ = function() {
    var subWidget = null;
    if (this.getChildCount() > 1)
        subWidget = this.getChildAt(this.getChildCount() - 2);
    if (subWidget == this.lastSub_)
        return;
    this.lastSubMouseHandler_.removeAll();
    if (subWidget != null && !this.readOnly_) {
        var et = goog.events.EventType;
        this.lastSubMouseHandler_.
            listen(subWidget.getElement(),
                   et.MOUSEOVER,
                   this.onAddSubMouseover_).
            listen(subWidget.getElement(),
                   et.MOUSEOUT,
                   this.onAddSubMouseout_);
    }
};
unisubs.subtitle.SubtitleList.prototype.onAddSubMouseover_ = function(e) {
    this.addSubtitleButton_.showLink(true);
};
unisubs.subtitle.SubtitleList.prototype.onAddSubMouseout_ = function(e) {
    if (this.isAddSubMouseout_(e.relatedTarget))
        this.addSubtitleButton_.showLink(false);
};
unisubs.subtitle.SubtitleList.prototype.isAddSubMouseout_ = function(relatedTarget) {
    if (!relatedTarget)
        return false;
    return ((this.lastSub_ == null ||
             !goog.dom.contains(this.lastSub_.getElement(),
                                relatedTarget)) &&
            !goog.dom.contains(this.addSubtitleButton_.getElement(),
                               relatedTarget));
};
unisubs.subtitle.SubtitleList.prototype.addSubtitleClicked_ = function(e) {
    this.captionSet_.addNewCaption(true);
};
unisubs.subtitle.SubtitleList.prototype.clearActiveWidget = function() {
    if (this.currentActiveSubtitle_ != null) {
        this.currentActiveSubtitle_.setActive(false);
        this.currentActiveSubtitle_ = null;
    }
};
/**
 * @param {boolean} taller
 */
unisubs.subtitle.SubtitleList.prototype.setTaller = function(taller) {
    goog.dom.classes.enable(this.getElement(), 'taller', taller);
};
unisubs.subtitle.SubtitleList.prototype.setActiveWidget = function(captionID) {
    if (!this.subtitleMap_[captionID])
        return;
    this.scrollToCaption(captionID);
    this.clearActiveWidget();
    var subtitleWidget = this.subtitleMap_[captionID];
    subtitleWidget.setActive(true);
    this.currentActiveSubtitle_ = subtitleWidget;
};
unisubs.subtitle.SubtitleList.prototype.getActiveWidget = function() {
    return this.currentActiveSubtitle_;
};
unisubs.subtitle.SubtitleList.prototype.scrollToCaption = function(captionID) {
    var subtitleWidget = this.subtitleMap_[captionID];
    if (subtitleWidget)
        goog.style.scrollIntoContainerView(
            subtitleWidget.getElement(),
            this.getElement(), true);
};
unisubs.subtitle.SubtitleList.prototype.setCurrentlyEditing_ =
    function(editing, timeChanged, subtitleWidget)
{
    this.currentlyEditing_ = editing;
    if (editing) {
        this.videoPlayer_.pause();
    }
    else {
        var subStartTime = subtitleWidget.getSubtitle().getStartTime();
        if (timeChanged) {
            this.videoPlayer_.playWithNoUpdateEvents(subStartTime, 2);
        }
    }
};
unisubs.subtitle.SubtitleList.prototype.isCurrentlyEditing = function() {
    return this.currentlyEditing_;
};



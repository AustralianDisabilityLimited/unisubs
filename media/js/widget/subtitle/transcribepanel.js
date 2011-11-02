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

goog.provide('unisubs.subtitle.TranscribePanel');

/**
 * @constructor
 * @extends goog.ui.Component
 *
 * @param {unisubs.subtitle.EditableCaptionSet} captions
 * @param {unisubs.VideoPlayer} videoPlayer Used to update subtitle
 *     preview on top of the video
 * @param {unisubs.ServerModel} serverModel Used to create RightPanel, which
 *     needs access to server to login.
 */
unisubs.subtitle.TranscribePanel = function(captionSet, videoPlayer, serverModel) {
    goog.ui.Component.call(this);

    this.captionSet_ = captionSet;
    this.videoPlayer_ = videoPlayer;
    this.serverModel_ = serverModel;

    /**
     * @type {?goog.events.KeyHandler}
     * @private
     */
    this.keyHandler_ = null;
    this.keyEventsSuspended_ = false;
};
goog.inherits(unisubs.subtitle.TranscribePanel, goog.ui.Component);

unisubs.subtitle.TranscribePanel.PlayMode = {
    PLAY_STOP : 'pl',
    AUTOPAUSE : 'au',
    NO_AUTOPAUSE : 'no'
};

unisubs.subtitle.TranscribePanel.prototype.getContentElement = function() {
    return this.contentElem_;
};

unisubs.subtitle.TranscribePanel.prototype.createDom = function() {
    unisubs.subtitle.TranscribePanel.superClass_.createDom.call(this);
    this.addElems_(this.getElement());
};
unisubs.subtitle.TranscribePanel.prototype.decorateInternal = function(el) {
    unisubs.subtitle.TranscribePanel.superClass_.decorateInternal.call(this, el);
    this.addElems_(el);
};
unisubs.subtitle.TranscribePanel.prototype.addElems_ = function(el) {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.getElement().appendChild(this.contentElem_ = $d('div'));
    this.addChild(this.lineEntry_ = new unisubs.subtitle.TranscribeEntry(
        this.videoPlayer_), true);
    this.addChild(this.subtitleList_ = new unisubs.subtitle.SubtitleList(
        this.videoPlayer_, this.captionSet_, false, true, false), true);
    this.setPlayMode(unisubs.UserSettings.getStringValue(
        unisubs.UserSettings.Settings.VIDEO_SPEED_MODE) ||
                     unisubs.subtitle.TranscribePanel.PlayMode.PLAY_STOP);
};
unisubs.subtitle.TranscribePanel.prototype.suspendKeyEvents = function(suspended) {
    this.keyEventsSuspended_ = suspended;
};
unisubs.subtitle.TranscribePanel.prototype.getRightPanel =
    function(serverModel)
{
    if (!this.rightPanel_) {
        this.rightPanel_ = this.createRightPanel_();
        this.listenToRightPanel_();
    }
    return this.rightPanel_;
};
unisubs.subtitle.TranscribePanel.prototype.listenToRightPanel_ = function() {
    if (this.rightPanel_ && this.isInDocument()) {
        this.getHandler().listen(this.rightPanel_,
                                 unisubs.RightPanel.EventType.RESTART,
                                 this.startOverClicked);
        var that = this;
        this.getHandler().listen(
            this.rightPanel_,
            unisubs.subtitle.TranscribeRightPanel.PLAYMODE_CHANGED,
            function(event) {
                that.setPlayMode(event.mode);
            });
    }
};
unisubs.subtitle.TranscribePanel.prototype.createRightPanel_ = function() {
    var helpContents = new unisubs.RightPanel.HelpContents(
        "Typing",
        [["Thanks for making subtitles!! It's easy to learn ",
          "and actually fun to do."].join(''),
         ["While you watch the video, type everything people ",
          "say and all important text that appears ",
          "on-screen."].join(''),
         ["Use the key controls below to pause and jump back, ",
          "which will help you keep up."].join('')],
         3, 0);
    var extraHelp = [
        "Press play, then type everything people say in the text " +
            "entry below the video.",
        "Don't let subtitles get too long. Hit Enter for a new line."
    ];
    var KC = goog.events.KeyCodes;
    var keySpecs = [
        new unisubs.RightPanel.KeySpec(
            'unisubs-play', 'unisubs-tab', 'tab', 'Play/Pause', KC.TAB, 0),
        new unisubs.RightPanel.KeySpec(
            'unisubs-skip', 'unisubs-control', 'shift\n+\ntab',
            'Skip Back 8 Seconds', KC.TAB,
            unisubs.RightPanel.KeySpec.Modifier.SHIFT)
    ];
    return new unisubs.subtitle.TranscribeRightPanel(
        this.serverModel_, helpContents, extraHelp, keySpecs,
        true, "Done?", "Next Step: Syncing");
};
unisubs.subtitle.TranscribePanel.prototype.enterDocument = function() {
    unisubs.subtitle.TranscribePanel.superClass_.enterDocument.call(this);
    this.getHandler().listen(this.lineEntry_,
                             unisubs.subtitle.TranscribeEntry.NEWTITLE,
                             this.newTitle_);
    this.getHandler().listen(this.videoPlayer_,
                             unisubs.player.AbstractVideoPlayer.EventType.PLAY,
                             this.videoPlaying_);
    this.listenToRightPanel_();
};
unisubs.subtitle.TranscribePanel.prototype.videoPlaying_ = function(event) {
    this.lineEntry_.focus();
};
unisubs.subtitle.TranscribePanel.prototype.newTitle_ = function(event) {
    var newEditableCaption = this.captionSet_.addNewCaption();
    this.subtitleList_.addSubtitle(newEditableCaption, true);
    newEditableCaption.setText(event.title, true);
};
/**
 *
 * @param {boolean} mode True to turn repeat on, false to turn it off.
 */
unisubs.subtitle.TranscribePanel.prototype.setPlayMode = function(mode) {
    this.lineEntry_.setPlayMode(mode);
};

unisubs.subtitle.TranscribePanel.prototype.startOverClicked = function() {
    var answer = confirm(
        "Are you sure you want to start over? All subtitles will be deleted.");
    if (answer) {
        this.captionSet_.clear();
        this.videoPlayer_.setPlayheadTime(0);
    }
};

unisubs.subtitle.TranscribePanel.prototype.disposeInternal = function() {
    unisubs.subtitle.TranscribePanel.superClass_.disposeInternal.call(this);
    if (this.rightPanel_)
        this.rightPanel_.dispose();
};

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

goog.provide('unisubs.subtitle.TranscribeRightPanel');
/**
* @constructor
* @extends unisubs.RightPanel
*/
unisubs.subtitle.TranscribeRightPanel = function(serverModel,
                                                  helpContents,
                                                  extraHelp,
                                                  legendKeySpecs,
                                                  showRestart,
                                                  doneStrongText,
                                                  doneText) {
    unisubs.RightPanel.call(this, serverModel, helpContents, extraHelp,
                             legendKeySpecs,
                             showRestart, doneStrongText, doneText);
};
goog.inherits(unisubs.subtitle.TranscribeRightPanel, unisubs.RightPanel);

unisubs.subtitle.TranscribeRightPanel.PLAYMODE_CHANGED = 'modechanged';

unisubs.subtitle.TranscribeRightPanel.prototype.playModeText_ = function(playMode) {
    var pm = unisubs.subtitle.TranscribePanel.PlayMode;
    if (playMode == pm.NO_AUTOPAUSE)
        return "Expert: no automatic pausing (use TAB key)";
    else if (playMode == pm.AUTOPAUSE)
        return "Recommended: magical autopause (just keep typing!)";
    else if (playMode == pm.PLAY_STOP)
        return "Beginner: play 8 seconds, then pause";
};

unisubs.subtitle.TranscribeRightPanel.prototype.appendLegendContentsInternal =
    function($d, legendDiv)
{
    unisubs.subtitle.TranscribeRightPanel.superClass_
        .appendLegendContentsInternal.call(this, $d, legendDiv);
    this.playModeSelect_ = $d('select');

    var pm = unisubs.subtitle.TranscribePanel.PlayMode;
    var speed = unisubs.UserSettings.getStringValue(
        unisubs.UserSettings.Settings.VIDEO_SPEED_MODE) || pm.PLAY_STOP;
    var select = this.playModeSelect_;
    var pm = unisubs.subtitle.TranscribePanel.PlayMode;
    var text = goog.bind(this.playModeText_, this);
    goog.array.forEach(
        [pm.PLAY_STOP, pm.AUTOPAUSE, pm.NO_AUTOPAUSE],
        function(opt) {
            var attrs = { 'value': opt };
            if (opt == speed)
                attrs['selected'] = 'selected';
            select.appendChild(
                $d('option', attrs, text(opt)));
        });
    legendDiv.appendChild($d('div', 'unisubs-speedmode',
                             $d('h4', null, 'Speed Mode'),
                             select));
    this.setButtonText_();
};

unisubs.subtitle.TranscribeRightPanel.prototype.enterDocument = function() {
    unisubs.subtitle.TranscribeRightPanel.superClass_.enterDocument.call(this);
    this.getHandler().listen(this.playModeSelect_,
                             goog.events.EventType.CHANGE,
                             this.playModeChanged_);
};

unisubs.subtitle.TranscribeRightPanel.prototype.setButtonText_ = function() {
    var kc = goog.events.KeyCodes;
    if (this.playModeSelect_.value ==
        unisubs.subtitle.TranscribePanel.PlayMode.PLAY_STOP) {
        this.setButtonTextInternal(kc.TAB, unisubs.RightPanel.KeySpec.Modifier.SHIFT,
                                   "Re-play last 8 seconds");
        this.setButtonTextInternal(kc.TAB, 0, "Play next 8 seconds");
        this.enableButtonClassInternal(kc.TAB, 0, '-beginner', true);
    }
    else {
        this.setButtonTextInternal(kc.TAB, unisubs.RightPanel.KeySpec.Modifier.SHIFT);
        this.setButtonTextInternal(kc.TAB, 0);
        this.enableButtonClassInternal(kc.TAB, 0, '-beginner', false);
    }
};

unisubs.subtitle.TranscribeRightPanel.prototype.playModeChanged_ = function(event) {
    this.setButtonText_();
    unisubs.UserSettings.setStringValue(
        unisubs.UserSettings.Settings.VIDEO_SPEED_MODE,
        this.playModeSelect_.value);
    this.dispatchEvent(
        new unisubs.subtitle.TranscribeRightPanel.PlayModeChangeEvent(
            this.playModeSelect_.value));
};

/**
* @constructor
*/
unisubs.subtitle.TranscribeRightPanel.PlayModeChangeEvent = function(mode) {
    this.type = unisubs.subtitle.TranscribeRightPanel.PLAYMODE_CHANGED;
    this.mode = mode;
};
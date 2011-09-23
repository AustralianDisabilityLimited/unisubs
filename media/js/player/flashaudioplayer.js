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

goog.provide('unisubs.player.FlashAudioPlayer');

/**
 * @constructor
 */
unisubs.player.FlashAudioPlayer = function(mediaSource, opt_forDialog) {
    unisubs.player.FlvVideoPlayer.call(this, mediaSource, opt_forDialog);
    this.forDialog_ = !!opt_forDialog;
};
goog.inherits(unisubs.player.FlashAudioPlayer, unisubs.player.FlvVideoPlayer);

unisubs.player.FlashAudioPlayer.prototype.createDom = function() {
    unisubs.player.FlashAudioPlayer.superClass_.createDom.call(this);
    this.playerSize = this.forDialog_ ? 
        unisubs.player.AbstractVideoPlayer.DIALOG_SIZE :
        unisubs.player.AbstractVideoPlayer.DEFAULT_SIZE;
};

unisubs.player.FlashAudioPlayer.prototype.getDuration = function() {
    // see http://flowplayer.org/forum/8/37767
    // http://code.google.com/p/flowplayer-core/issues/detail?id=187
    // this is a temporary monkey-patch.
    return 10000;
};
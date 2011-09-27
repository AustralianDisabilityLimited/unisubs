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

goog.provide('unisubs.player.Html5AudioPlayer');

/**
 * @constructor
 * @param {unisubs.player.Html5AudioSource} audioSource
 * @param {boolean=} opt_forDialog
 */
unisubs.player.Html5AudioPlayer = function(mediaSource, opt_forDialog) {
    unisubs.player.Html5MediaPlayer.call(this, mediaSource);    
    this.forDialog_ = !!opt_forDialog;
};
goog.inherits(unisubs.player.Html5AudioPlayer,
              unisubs.player.Html5MediaPlayer);

unisubs.player.Html5AudioPlayer.prototype.createDom = function() {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.mediaElem = this.createAudioElement_($d);
    var containingDiv = $d('div', 'unisubs-audio-player', this.mediaElem);
    this.setElementInternal(containingDiv);
    // FIXME: duplicated in FlashAudioPlayer
    unisubs.style.setSize(
        containingDiv,
        this.forDialog_ ? 
            unisubs.player.AbstractVideoPlayer.DIALOG_SIZE :
            unisubs.player.AbstractVideoPlayer.DEFAULT_SIZE);
    unisubs.style.setSize(
        this.mediaElem,
        this.forDialog_ ? 
            unisubs.player.AbstractVideoPlayer.DIALOG_SIZE :
            unisubs.player.AbstractVideoPlayer.DEFAULT_SIZE);
};

unisubs.player.Html5AudioPlayer.prototype.createAudioElement_ = function($d) {
    var params = { 'autobuffer': 'true' };
    if (!this.forDialog_) {
        params['controls'] = 'true';
    }
    return $d('audio', params, $d('source', {'src': this.mediaSource.getVideoURL() }));
};

unisubs.player.Html5AudioPlayer.prototype.stopLoadingInternal = function() {
    // TODO: replace this with an actual URL
    this.mediaElem['src'] = '';
    return true;
};

unisubs.player.Html5AudioPlayer.prototype.getVideoSize = function() {
    return goog.style.getSize(this.getElement());
};

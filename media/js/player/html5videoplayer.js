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

goog.provide('unisubs.player.Html5VideoPlayer');

/**
 * @constructor
 * @param {unisubs.player.Html5VideoSource} videoSource
 * @param {boolean} forDialog
 */
unisubs.player.Html5VideoPlayer = function(videoSource, forDialog) {
    unisubs.player.Html5MediaPlayer.call(this, videoSource, forDialog);
};
goog.inherits(unisubs.player.Html5VideoPlayer,
              unisubs.player.Html5MediaPlayer);

/**
 * @override
 */
unisubs.player.Html5VideoPlayer.prototype.createDom = function() {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    if (unisubs.player.supportsVideoType(
        this.mediaSource.getVideoType())) {
        this.mediaElem = this.createVideoElement_($d);
        this.setElementInternal(this.mediaElem);
        if (this.forDialog)
            unisubs.style.setSize(
                this.mediaElem,
                unisubs.player.AbstractVideoPlayer.DIALOG_SIZE);
    }
    else {
        var el = $d('div');
        this.setElementInternal(el);
        unisubs.style.setSize(el, 400, 300);
        unisubs.style.setProperty(el, 'line-height', '300px');
        el.innerHTML = 
            "Sorry, your browser can't play HTML5/" + 
            this.videoSource_.getVideoType() + " video. " +
            "<a href='http://getfirefox.com'>Get Firefox</a>.";       
    }
};

unisubs.player.Html5VideoPlayer.prototype.createVideoElement_ = 
    function($d) 
{
    var params = { 'autobuffer': 'true' };
    if (!this.forDialog) {
        if (this.mediaSource.getVideoConfig()) {
            var config = this.mediaSource.getVideoConfig();
            if (config['play_to_click']) {
                this.playToClick_ = true;
                goog.object.remove(config, 'play_to_click');
            }
            goog.object.extend(params, config);
        }
        params['controls'] = 'true';
    }
    return $d('video', params,
              $d('source', {'src': this.videoSource_.getVideoURL()}));
};


/**
 * @override
 * @param {Element} element Video element to decorate.
 */
unisubs.player.Html5VideoPlayer.prototype.decorateInternal = function(element) {
    unisubs.player.Html5VideoPlayer.superClass_.decorateInternal.call(
        this, element);
    if (element.nodeName != 'VIDEO')
        throw Error(goog.ui.Component.Error.DECORATE_INVALID);
    this.mediaElem = element;
};

unisubs.player.Html5VideoPlayer.prototype.playerClickedInternal = function(e) {
    if (this.playToClick_ && !this.playedOnce_) {
        e.preventDefault();
        this.play();
    }
};

unisubs.player.Html5VideoPlayer.prototype.stopLoadingInternal = function() {
    // TODO: replace this with an actual URL
    this.mediaElem['src'] = 'http://holmeswilson.org/tinyblank.ogv';
    return true;
};
unisubs.player.Html5VideoPlayer.prototype.getVideoSize = function() {
    return goog.style.getSize(this.mediaElem);
};

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

goog.provide('unisubs.player.FlashVideoPlayer');

/**
 * @constructor
 */
unisubs.player.FlashVideoPlayer = function(videoSource) {
    unisubs.player.AbstractVideoPlayer.call(this, videoSource);
    this.embed_ = null;
    this.object_ = null;
    this.decorateTimer_ = null;
    this.decorateAttemptCount_ = 0;
    this.decorated_ = false;
    this.successfullyDecorated_ = false;
};
goog.inherits(unisubs.player.FlashVideoPlayer,
              unisubs.player.AbstractVideoPlayer);

unisubs.player.FlashVideoPlayer.prototype.logger_ = 
    goog.debug.Logger.getLogger('unisubs.player.FlashVideoPlayer');

/**
 * @override
 * @param {Element} Either object or embed. Must be decoratable. For example, 
 *     for youtube, enablejsapi=1. For any video player, wmode must be set.
 *
 */
unisubs.player.FlashVideoPlayer.prototype.decorateInternal = function(element) {
    this.decorated_ = true;
    var embedSize = new goog.math.Size(0, 0), 
        objectSize = new goog.math.Size(0, 0);
    var objectAndEmbed = this.findElements_(element);
    if (objectAndEmbed[0]) {
        this.object_ = objectAndEmbed[0];
        objectSize = goog.style.getSize(this.object_);
    }
    if (objectAndEmbed[1]) {
        this.embed_ = objectAndEmbed[1];
        embedSize = goog.style.getSize(this.embed_);
    }
    var elementToUse = objectSize.height > embedSize.height ? 
        this.object_ : this.embed_;
    unisubs.player.FlashVideoPlayer.superClass_.decorateInternal.call(
        this, elementToUse);
};

/**
 * @protected
 * Clients can call this several times for the same player without it decorating
 * twice.
 */
unisubs.player.FlashVideoPlayer.prototype.tryDecoratingAll = function(e) {
    if (!this.decorated_ || this.successfullyDecorated_)
        return;
    if (!this.tryDecorating_(this.object_))
        this.successfullyDecorated_ = this.tryDecorating_(this.embed_);
    else
        this.successfullyDecorated_ = true;
    if (goog.DEBUG) {
        this.logger_.info("successfully decorated: " + 
                          this.successfullyDecorated_);
    }
};

unisubs.player.FlashVideoPlayer.prototype.isFlashElementReady = goog.abstractMethod;

unisubs.player.FlashVideoPlayer.prototype.setFlashPlayerElement = goog.abstractMethod;

unisubs.player.FlashVideoPlayer.prototype.tryDecorating_ = function(element) {
    if (!goog.isDefAndNotNull(element)) {
        return false;
    }
    else if (this.isFlashElementReady(element)) {
        this.setFlashPlayerElement(element);
        return true;
    }
    else {
        return false;
    }
};

unisubs.player.FlashVideoPlayer.prototype.logExternalInterfaceError_ = function() {
    unisubs.Rpc.call(
        'log_youtube_ei_failure', { 'page_url': window.location.href });
};

unisubs.player.FlashVideoPlayer.prototype.findElements_ = function(element) {
    var object = null, embed = null;
    if (element.nodeName == "EMBED") {
        embed = element;
        if (embed.parentNode.nodeName == "OBJECT")
            object = embed.parentNode;
    }
    else {
        object = element;
        embed = goog.dom.findNode(
            object, 
            function(e) { return e.nodeName == "EMBED"; });
    }
    return [object, embed];
};

unisubs.player.FlashVideoPlayer.prototype.getVideoElement = goog.abstractMethod;

unisubs.player.FlashVideoPlayer.prototype.isDecorated = function() {
    return this.decorated_;
};

unisubs.player.FlashVideoPlayer.prototype.getVideoElements = function() {
    var objectAndEmbed = null;
    if (this.decorated_) {
        objectAndEmbed = [this.object_, this.embed_];
    }
    else {
        var videoElem = this.getVideoElement();
        if (videoElem)
            objectAndEmbed = this.findElements_(videoElem);
    }
    if (objectAndEmbed) {
        var elems = [];
        if (objectAndEmbed[0])
            elems.push(objectAndEmbed[0]);
        if (objectAndEmbed[1])
            elems.push(objectAndEmbed[1]);
        return elems;
    }
    else
        return [];
};

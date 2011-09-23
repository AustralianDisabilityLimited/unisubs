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

goog.provide('unisubs.player.WistiaVideoPlayer');

/**
 * @constructor
 */
unisubs.player.WistiaVideoPlayer = function() {
    unisubs.player.FlashVideoPlayer.call(this, null);
};
goog.inherits(unisubs.player.WistiaVideoPlayer,
              unisubs.player.FlashVideoPlayer);

unisubs.player.WistiaVideoPlayer.prototype.getPlayheadTime = function() {
    return this.getElement()["getCurrentTime"]();
};

unisubs.player.WistiaVideoPlayer.prototype.decorateInternal = function(elem) {
    unisubs.player.WistiaVideoPlayer.superClass_.decorateInternal.call(this, elem);
    this.playerSize_ = goog.style.getSize(this.getElement());
    this.setDimensionsKnownInternal();
    this.playheadTimeTimer_ = new goog.Timer(100);
    this.getHandler().listen(
        this.playheadTimeTimer_,
        goog.Timer.TICK,
        goog.bind(this.dispatchEvent, this, 
                  unisubs.player.AbstractVideoPlayer.EventType.TIMEUPDATE));
    this.playheadTimeTimer_.start();
};

unisubs.player.WistiaVideoPlayer.prototype.getVideoSize = function() {
    return this.playerSize_;
};
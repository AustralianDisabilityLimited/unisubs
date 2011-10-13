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

/**
 * @fileoverview An interface for a media source
 *
 */

goog.provide('unisubs.player.MP3Source');

/**
 *
 * @constructor
 */
unisubs.player.MP3Source = function(mp3url) {
    this.mp3URL_ = mp3url;
};

unisubs.player.MP3Source.forURL = function(url) {
    if (unisubs.player.MP3Source.isMP3URL(url)) {
        return new unisubs.player.MP3Source(url);
    }
    else {
        return null;
    }
};

unisubs.player.MP3Source.isMP3URL = function(url) {
    return /\.mp3$/i.test(url);
};

unisubs.player.MP3Source.prototype.isBestVideoSource = function() {
    return true;
};

unisubs.player.MP3Source.prototype.createPlayer = function() {
    return this.createPlayer_(false);
};

unisubs.player.MP3Source.prototype.createControlledPlayer = 
    function() 
{
    return new unisubs.player.ControlledVideoPlayer(
        this.createPlayer_(true));
};

unisubs.player.MP3Source.prototype.canPlayAudioNatively_ = function() {
    // FIXME: minor duplication with unisubs.player.supports_
    var audio = goog.dom.createElement('audio');
    return !!(audio['canPlayType'] && 
              audio['canPlayType']('audio/mpeg').replace(/no/, ''));
};

unisubs.player.MP3Source.prototype.createPlayer_ = 
    function(forSubDialog) 
{
    if (this.canPlayAudioNatively_()) {
        return new unisubs.player.Html5AudioPlayer(this, forSubDialog);
    }
    else {
        return new unisubs.player.FlashAudioPlayer(this, forSubDialog);
    }
};

unisubs.player.MP3Source.prototype.getVideoURL = function() {
    return this.mp3URL_;
};

unisubs.player.MP3Source.prototype.getFlvURL = function() {
    return this.getVideoURL();
};

unisubs.player.MP3Source.prototype.getVideoConfig = function() {
    return null;
};
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

goog.provide('unisubs.player');

unisubs.player.Html5VideoType = {
    H264: 'H264',
    OGG: 'Ogg',
    WEBM: 'WebM'
};

unisubs.player.supportsVideo = function() {
    return !!goog.dom.createElement('video')['canPlayType'];
};

unisubs.player.supportsVideoType = function(html5VideoType) {
    var vt = unisubs.player.Html5VideoType;
    switch (html5VideoType) {
    case vt.H264:
        return unisubs.player.supportsH264();
    case vt.OGG:
        return unisubs.player.supportsOgg();
    case vt.WEBM:
        return unisubs.player.supportsWebM();
    default:
        throw "unknown type";
    }
};

unisubs.player.supports_ = function(playType) {
    var video = goog.dom.createElement('video');
    return !!(video['canPlayType'] &&
              video['canPlayType'](playType).replace(/no/, ''));
};

unisubs.player.supportsH264 = function() {
    return unisubs.player.supports_(
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
};

unisubs.player.supportsOgg = function() {
    return unisubs.player.supports_(
        'video/ogg; codecs="theora, vorbis"');
};

unisubs.player.supportsWebM = function() {
    return unisubs.player.supports_(
        'video/webm; codecs="vp8, vorbis"');
};

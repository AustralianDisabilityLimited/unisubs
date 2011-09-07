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

goog.provide('unisubs.streamer.StreamerDecorator');

/**
 * @private
 * @constructor
 * @param {unisubs.video.AbstractVideoPlayer} videoPlayer
 */
unisubs.streamer.StreamerDecorator = function(videoPlayer) {
    
};

/**
 *
 * @param {unisubs.video.AbstractVideoPlayer} videoPlayer should already
 *     be attached to page.
 */
unisubs.streamer.StreamerDecorator.decorate = function(videoPlayer) {
    return new unisubs.streamer.StreamerDecorator(videoPlayer);
};
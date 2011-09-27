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

goog.provide('unisubs.player.OoyalaVideoSource');

/**
 * @constructor
 * @implements {unisubs.player.MediaSource}
 */
unisubs.player.OoyalaVideoSource = function(embedCode) {
    this.embedCode_ = embedCode;
};

unisubs.player.OoyalaVideoSource.prototype.createPlayer = function() {
    return new unisubs.player.OoyalaPlayer(this);
};

unisubs.player.OoyalaVideoSource.prototype.createControlledPlayer = function() {
    // not implemented on purpose. maybe in future.
};

unisubs.player.OoyalaVideoSource.prototype.getVideoURL = function() {
    return this.embedCode_;
};

unisubs.player.OoyalaVideoSource.prototype.getEmbedCode = function() {
    return this.embedCode_;
};
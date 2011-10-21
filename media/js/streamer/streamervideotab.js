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

goog.provide('unisubs.widget.StreamerVideoTab');

/**
 * @constructor
 * @param {Element} anchorElement
 * @implements {unisubs.widget.VideoTab}
 */
unisubs.streamer.StreamerVideoTab = function(anchorElement) {
    this.anchorElement_ = anchorElement;
};

unisubs.streamer.StreamerVideoTab.prototype.showLoading = function() {
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.stopLoading = function() {
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.showContent = 
    function(hasSubtitles, opt_playSubState) 
{
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.showError = function() {
    // maybe do something in future.
    if (goog.DEBUG) {
        console.log("there was an error, yo");
    }
};

unisubs.streamer.StreamerVideoTab.prototype.createShareButton = 
    function(shareURL, newWindow) 
{
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.updateNudge =
    function(text, fn) 
{
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.showNudge = function(show) {
    // maybe do something in future.
};

unisubs.streamer.StreamerVideoTab.prototype.getAnchorElem = function() {
    return this.anchorElement_;
};

unisubs.streamer.StreamerVideoTab.prototype.getElement = function() {
    return this.anchorElement_;
};
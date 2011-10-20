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

goog.provide('unisubs.widget.HangingVideoTab');

/**
 * @interface
 */
unisubs.widget.VideoTab = function() {};

unisubs.widget.VideoTab.prototype.showLoading = function() {};
unisubs.widget.VideoTab.prototype.stopLoading = function() {};
unisubs.widget.VideoTab.prototype.showContent = 
    function(hasSubtitles, opt_playSubState) {};
unisubs.widget.VideoTab.prototype.updateNudge = function(text, fn) {};
unisubs.widget.VideoTab.prototype.showNudge = function(show) {};
unisubs.widget.VideoTab.prototype.getAnchorElem = function() {};
unisubs.widget.VideoTab.prototype.getElement = function() {};
unisubs.widget.VideoTab.prototype.showError = function() {};
/**
 * @param shareURL {goog.URI} The url for the 'share' link.
 * @param newWindow {bool=} If true will open on new window.
 */
unisubs.widget.VideoTab.prototype.createShareButton = 
    function(shareURL, newWindow) {};
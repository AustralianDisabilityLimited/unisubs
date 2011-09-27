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

goog.provide('unisubs.widgetizer.SoundCloud');

/**
 * @constructor
 *
 */
unisubs.widgetizer.SoundCloud = function() {
    unisubs.widgetizer.VideoPlayerMaker.call(this);
};
goog.inherits(unisubs.widgetizer.SoundCloud,
              unisubs.widgetizer.VideoPlayerMaker);

unisubs.widgetizer.SoundCloud.prototype.makeVideoPlayers = function() {
    var videoElements = this.unwidgetizedElements_();
    return goog.array.map(
        videoElements,
        function(elem) {
            var player = new unisubs.player.SoundCloudPlayer();
            player.decorate(elem);
            return player;
        });
};

unisubs.widgetizer.SoundCloud.prototype.unwidgetizedElements_ = function() {
    var elements = this.filterUnwidgetized(
        goog.dom.getElementsByTagNameAndClass('div', 'sc-player'));
    // using some stupid heuristics to make sure any divs on the page
    // with css class sc-player are in fact soundcloud players
    elements = goog.array.filter(
        elements,
        function(elem) {
            var children = goog.dom.getChildren(elem);
            return children[0].className == "sc-artwork-list";
        });
    return elements;
};
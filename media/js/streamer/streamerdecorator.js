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
 * @param {unisubs.player.AbstractVideoPlayer} videoPlayer
 */
unisubs.streamer.StreamerDecorator.makeStreamer_ = function(videoPlayer) {
    var streamBox = new unisubs.streamer.StreamBox();
    var videoElem = videoPlayer.getElement();
    var captionBoxElem = 
        unisubs.streamer.StreamerDecorator.getUnisubsElem_(videoElem);
    streamBox.decorate(captionBoxElem);
    var controller = new unisubs.streamer.StreamerController(
        videoPlayer, streamBox);
    var args = {
        'video_url': videoPlayer.getVideoSource().getVideoURL(),
        'is_remote': unisubs.isFromDifferentDomain()
    };
    unisubs.Rpc.call(
        'show_widget', args,
        goog.bind(controller.initializeState, controller));
};

unisubs.streamer.StreamerDecorator.makeOverlayStreamer_ = function(videoPlayer) {
    
};

unisubs.streamer.StreamerDecorator.getUnisubsElem_ = function(videoPlayer) {
    // TODO: walk dom to get this in the future in case there's more than one per page.
    var elems = goog.dom.getElementsByTagNameAndClass(
        'div', 'unisubs-substreamer');
    return elems.length > 0 ? elems[0] : null;
};

unisubs.streamer.StreamerDecorator.getSTElem_ = function(videoPlayer) {
    // TODO: walk dom to get this in the future in case there's more than one per page.
    var elems = goog.dom.getElementsByTagNameAndClass(
        'div', 'STembedWrapper');
    return elems.length > 0 ? elems[0] : null;
};

/**
 *
 * @param {unisubs.player.AbstractVideoPlayer} videoPlayer should already
 *     be attached to page.
 */
unisubs.streamer.StreamerDecorator.decorate = function(videoPlayer) {
    if (unisubs.streamer.StreamerDecorator.getUnisubsElem_(videoPlayer)) {
        unisubs.streamer.StreamerDecorator.makeStreamer_(videoPlayer);
    }
    else {
        unisubs.streamer.StreamerDecorator.makeOverlayStreamer_(videoPlayer);
    }
};

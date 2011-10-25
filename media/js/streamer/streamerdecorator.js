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
 * This makes the streamer, not the overlay thing.
 * @param {unisubs.player.AbstractVideoPlayer} videoPlayer
 */
unisubs.streamer.StreamerDecorator.makeStreamer_ = function(videoPlayer) {
    var streamBox = new unisubs.streamer.StreamBox();
    var videoElem = videoPlayer.getElement();
    var captionBoxElem = 
        unisubs.streamer.StreamerDecorator.getUnisubsStreamerElem_(videoElem);
    streamBox.decorate(captionBoxElem);
    unisubs.streamer.StreamerDecorator.makeStreamer(videoPlayer, streamBox);
};

unisubs.streamer.StreamerDecorator.makeStreamer = function(
    videoPlayer, streamBox, opt_initialState, opt_setSubsOnLoad) 
{
    var controller = new unisubs.widget.WidgetController(
        videoPlayer.getVideoSource().getVideoURL(), 
        videoPlayer, 
        streamBox.getVideoTab(),
        true);
    var args = {
        'video_url': videoPlayer.getVideoSource().getVideoURL(),
        'is_remote': unisubs.isFromDifferentDomain()
    };
    controller.setCaptionDisplayStrategy(
        function(caption) {
            streamBox.displaySub(caption ? caption.getCaptionID() : null);
        });
    var subClicked = function(e) {
        var editableCaption = controller.getPlayController().getSubMap()[
            e.target.SUBTITLE_ID];
        videoPlayer.setPlayheadTime(editableCaption.getStartTime());
        streamBox.displaySub(e.target.SUBTITLE_ID);
    };
    goog.events.listen(
        streamBox,
        unisubs.streamer.StreamSub.SUB_CLICKED,
        subClicked);
    goog.events.listen(
        controller,
        unisubs.widget.PlayController.LANGUAGE_CHANGED,
        function(e) {
            streamBox.setSubtitles(e.target.getSubtitlesJSON());
        });
    var initializeState = function(state) {
        if (opt_setSubsOnLoad) {
            streamBox.setSubtitles(
                unisubs.widget.SubtitleState.fromJSON(state['subtitles']).SUBTITLES);
        }
        controller.initializeState(state);
    };
    if (!opt_initialState) {
        unisubs.Rpc.call('show_widget', args, initializeState);
    }
    else {
        initializeState();
    }
};

unisubs.streamer.StreamerDecorator.makeOverlayStreamer_ = function(videoPlayer) {
    var controller = new unisubs.streamer.OverlayController(
        videoPlayer, unisubs.streamer.StreamerDecorator.getSpeakerTextElem_());
};

unisubs.streamer.StreamerDecorator.getUnisubsStreamerElem_ = function(videoPlayer) {
    // TODO: walk dom to get this in the future in case there's more than one per page.
    var elems = goog.dom.getElementsByTagNameAndClass(
        'div', 'unisubs-substreamer');
    return elems.length > 0 ? elems[0] : null;
};

unisubs.streamer.StreamerDecorator.getSpeakerTextElem_ = function(videoPlayer) {
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
    if (unisubs.streamer.StreamerDecorator.getUnisubsStreamerElem_(videoPlayer)) {
        unisubs.streamer.StreamerDecorator.makeStreamer_(videoPlayer);
    }
    else if (unisubs.streamer.StreamerDecorator.getSpeakerTextElem_(videoPlayer)) {
        unisubs.streamer.StreamerDecorator.makeOverlayStreamer_(videoPlayer);
    }
    else {
        var streamBox = new unisubs.streamer.StreamBox();
        var nextElem = goog.dom.getNextElementSibling(videoPlayer.getElement());
        if (nextElem) {
            streamBox.renderBefore(nextElem);
        }
        else {
            streamBox.render(videoPlayer.getElement().parentNode);
        }
        unisubs.streamer.StreamerDecorator.makeStreamer(
            videoPlayer, streamBox, null, true);
    }
};

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

goog.provide('unisubs.streamer.OverlayController');

/**
 * @constructor
 */
unisubs.streamer.OverlayController = function(videoPlayer, stElement) {
    this.videoPlayer_ = videoPlayer;
    this.stElement_ = stElement;
    var subtitleJSON = this.makeSubtitleJson_();
    var captionSet = new unisubs.subtitle.EditableCaptionSet(
        subtitleJSON);
    var captionManager = new unisubs.CaptionManager(
        videoPlayer, captionSet);
    var eventHandler = new goog.events.EventHandler(this);
    eventHandler.
        listen(captionManager,
               unisubs.CaptionManager.CAPTION,
               this.captionReached_);
};

unisubs.streamer.OverlayController.prototype.makeSubtitleJson_ = function() {
    var captionElems = goog.dom.getElementsByTagNameAndClass(
        "span", "STtranscriptContent", this.stElement_);
    var subs = goog.array.map(
        captionElems,
        function(elem) {
            return { 
                "subtitle_id": unisubs.randomString(),
                "text": goog.dom.getTextContent(elem),
                "start_time": parseInt(elem.getAttribute("name")) / 1000
            };
        });
    goog.array.sort(subs, function(s, t) { 
        return goog.array.defaultCompare(s['start_time'], t['start_time']); 
    });
    for (var i = 0; i < subs.length; i++) {
        subs[i]['sub_order'] = i + 1;
        if (i < subs.length - 1) {
            subs[i]['end_time'] = subs[i + 1]['start_time'];
        }
        else {
            subs[i]['end_time'] = -1;
        }
    }
    return subs;
};

unisubs.streamer.OverlayController.prototype.captionReached_ = 
    function(event) 
{
    this.videoPlayer_.showCaptionText(
        (event.caption ? event.caption.getText() : ""));
};
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

goog.provide('unisubs.streamer.StreamSub');

/**
 * @constructor
 */
unisubs.streamer.StreamSub = function(span) {
    this.span_ = span;
    var match = unisubs.streamer.StreamSub.SUBRE_.match(span.id);
    /**
     * @const
     */
    this.VIDEO_ID = match[1];
    /**
     * @const
     */
    this.SUBTITLE_ID = match[2];
};

unisubs.streamer.StreamSub.SUBRE_ = /USsub\-(\w+)\-(\w+)/;


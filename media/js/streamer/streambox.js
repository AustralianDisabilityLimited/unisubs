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

goog.provide('unisubs.streamer.StreamBox');

/**
 * @constructor
 */
unisubs.streamer.StreamBox = function() {
    goog.events.EventTarget.call(this);
    this.subMap_ = null;
    this.displayedSub_ = null;
};
goog.inherits(unisubs.streamer.StreamBox, goog.events.EventTarget);

unisubs.streamer.StreamBox.prototype.decorate = function(elem) {
    this.elem_ = elem;
    this.transcriptElem_ = goog.dom.getElementsByTagNameAndClass(
        'div', 'unisubs-transcript', elem)[0];
    this.searchInput_ = new goog.ui.LabelInput();
    this.searchInput_.decorate(goog.dom.getElementsByTagNameAndClass(
        'input', 'unisubs-search', elem)[0]);
    goog.events.listen(
        this.searchInput_.getElement(),
        goog.events.EventType.KEYUP,
        goog.bind(this.handleSearchKey_, this));
    var subSpans = goog.dom.getElementsByTagNameAndClass(
        'span', 'unisubs-sub', elem);
    this.subs_ = goog.array.map(
        subSpans, function(s) { 
            return new unisubs.streamer.StreamSub(s); 
        });
    this.subMap_ = new goog.structs.Map();
    goog.array.forEach(this.subs_, function(s) { 
        s.setParentEventTarget(this);
        this.subMap_.set(s.SUBTITLE_ID, s); 
    }, this);
};

unisubs.streamer.StreamBox.prototype.handleSearchKey_ = function(e) {
    goog.array.forEach(
        this.subs_, 
        function(s) { s.reset(); });
    var searchText = this.searchInput_.getValue();
    if (searchText != "") {
        goog.dom.annotate.annotateTerms(
            this.transcriptElem_, [[searchText, false]],
            function(number, str) {
                return '<span class="unisubs-search">' + str + '</span>';
            }, true);
    }
};

unisubs.streamer.StreamBox.prototype.displaySub = function(subtitleID) {
    if (this.displayedSub_) {
        this.displayedSub_.display(false);
        this.displayedSub_ = null;
    }
    if (subtitleID) {
        var sub = this.subMap_.get(subtitleID);
        if (sub) {
            sub.display(true);
            this.scrollIntoView_(sub);
            this.displayedSub_ = sub;
        }
    }
};

unisubs.streamer.StreamBox.prototype.scrollIntoView_ = function(streamSub) {
    goog.style.scrollIntoContainerView(
        streamSub.getSpan(), this.transcriptElem_, true);
};

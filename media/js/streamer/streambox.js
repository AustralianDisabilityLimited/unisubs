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
    goog.ui.Component.call(this);
    this.subMap_ = null;
    this.displayedSub_ = null;
};
goog.inherits(unisubs.streamer.StreamBox, goog.ui.Component);

unisubs.streamer.StreamBox.prototype.createDom = function() {
    unisubs.streamer.StreamBox.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.transcriptElem_ = $d('div', 'unisubs-transcript');
    var substreamerElem = 
        $d('div', 'unisubs-substreamer',
           $d('div', 'unisubs-substreamer-controls', 
              $d('ul', null, 
                 $d('li', null,
                    $d('a', { 'href': '#' },
                       $d('img', { 'src': 'http://f.cl.ly/items/390R0c261l0u431c0j35/unisubs.png' } ))))),
           this.transcriptElem_);
    goog.dom.append(this.getElement(), substreamerElem);
};

unisubs.streamer.StreamBox.prototype.setSubtitles = function(subtitles) {
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    var subSpans = goog.array.map(
        subtitles,
        function(s) {
            return $d(
                'span', 
                { 'className': 'unisubs-sub',
                  'id': 'usub-a-' + s['subtitle_id'] },
                s['text']);
        });
    goog.dom.append(this.transcriptElem_, subSpans);
    this.makeSubsAndSubMap_(subSpans);
};

unisubs.streamer.StreamBox.prototype.decorateContainer = function(elem) {
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
    this.makeSubsAndSubMap_(subSpans);
};

unisubs.streamer.StreamBox.prototype.makeSubsAndSubMap_ = function(subSpans) {
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
        if (searchText.length > 1) {
            this.scrollToFirstAnnotated_();
        }
    }
};

unisubs.streamer.StreamBox.prototype.annotatedIsInView_ = function(annotatedSpan) {
    var elementPos = goog.style.getPageOffset(annotatedSpan);
    var containerPos = goog.style.getPageOffset(this.transcriptElem_);
    return (elementPos.y >= containerPos.y && 
            elementPos.y + annotatedSpan.offsetHeight <
            containerPos.y + this.transcriptElem_.clientHeight);
};

unisubs.streamer.StreamBox.prototype.scrollToFirstAnnotated_ = function() {
    var annotatedTerms = goog.dom.getElementsByTagNameAndClass(
        'span', 'unisubs-search', this.transcriptElem_);
    if (annotatedTerms.length > 0) {
        var firstAnnotated = annotatedTerms[0];
        if (!this.annotatedIsInView_(firstAnnotated)) {
            goog.style.scrollIntoContainerView(
                firstAnnotated, this.transcriptElem_, true);
        }
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

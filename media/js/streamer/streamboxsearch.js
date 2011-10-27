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

goog.provide('unisubs.streamer.StreamBoxSearch');

/**
 * @constructor

 */
unisubs.streamer.StreamBoxSearch = function() {
    goog.ui.Component.call(this);
};
goog.inherits(unisubs.streamer.StreamBoxSearch, goog.ui.Component);

/**
 * @param {Element} transcriptElem
 * @param {goog.ui.LabelInput} searchInput
 * @param {Array.<unisubs.streamer.StreamSub>} streamSubs
 */
unisubs.streamer.StreamBoxSearch.prototype.setTranscriptElemAndSubs = 
    function(transcriptElem, streamSubs) 
{
    this.transcriptElem_ = transcriptElem;
    this.subs_ = streamSubs;
};

/**
 * elem must have a very particular internal structure. It has to contain exactly
 * four elements: an input box, a "previous" link, a "next" link, and a span to
 * show result counts.
 *
 * CZ: I've changed the structure of the markup here, and have altered the code
 * below to match it. elem now contains a div (children[0]) with two children
 * of its own—the search input (grandchildren[0]) and the results span
 * (grandchildren[1])—and then the prev/next results links (children[1] and 
 * children[2], respectively)
 */
unisubs.streamer.StreamBoxSearch.prototype.decorateInternal = function(elem) {
    unisubs.streamer.StreamBoxSearch.superClass_.decorateInternal.call(this, elem);
    var children = goog.dom.getChildren(elem);
    var grandchildren = goog.dom.getChildren(children[0]);
    this.searchInput_ = new goog.ui.LabelInput();
    this.searchInput_.decorate(grandchildren[0]);
    this.previousResultLink_ = children[1];
    this.nextResultLink_ = children[2];
    this.resultCountElem_ = grandchildren[1];
};

unisubs.streamer.StreamBoxSearch.prototype.enterDocument = function() {
    unisubs.streamer.StreamBoxSearch.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(
            this.searchInput_.getElement(),
            goog.events.EventType.KEYUP,
            this.handleSearchKey_).
        listen(
            this.previousResultLink_,
            goog.events.EventType.CLICK,
            this.navLinkClicked_).
        listen(
            this.nextResultLink_,
            goog.events.EventType.CLICK,
            this.navLinkClicked_);
};

unisubs.streamer.StreamBoxSearch.prototype.navLinkClicked_ = function(e) {
    e.preventDefault();
    if (e.target == this.previousResultLink_ && this.termIndex_ > 0) {
        this.showSearchedTerm_(this.termIndex_ - 1);
    }
    else if (e.target == this.nextResultLink_ && 
             this.termIndex_ < this.annotatedTerms_.length - 1) {
        this.showSearchedTerm_(this.termIndex_ + 1);
    }
};

unisubs.streamer.StreamBoxSearch.prototype.showSearchTools_ = function(show) {
    unisubs.style.setVisibility(this.resultCountElem_, show);
};

unisubs.streamer.StreamBoxSearch.prototype.handleSearchKey_ = function(e) {
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
        this.annotatedTerms_ = goog.dom.getElementsByTagNameAndClass(
            'span', 'unisubs-search', this.transcriptElem_);
    }
    else {
        this.annotatedTerms_ = [];
    }
    this.showSearchTools_(this.annotatedTerms_.length > 0);
    if (this.annotatedTerms_.length > 0) {
        this.showSearchedTerm_(0);
    }
};

unisubs.streamer.StreamBoxSearch.prototype.annotatedIsInView_ = function(annotatedSpan) {
    var elementPos = goog.style.getPageOffset(annotatedSpan);
    var containerPos = goog.style.getPageOffset(this.transcriptElem_);
    return (elementPos.y >= containerPos.y && 
            elementPos.y + annotatedSpan.offsetHeight <
            containerPos.y + this.transcriptElem_.clientHeight);
};

/**
 * @param {int} termIndex Should be between 0 and this.annotatedTerms_.length - 1, inclusive.
 */
unisubs.streamer.StreamBoxSearch.prototype.showSearchedTerm_ = function(termIndex) {
    this.termIndex_ = termIndex;
    var annotated = this.annotatedTerms_[termIndex];
    if (this.highlightedAnnotation_) {
        goog.dom.classes.remove(this.highlightedAnnotation_, 'highlighted-search');
    }
    this.highlightedAnnotation_ = annotated;
    goog.dom.classes.add(annotated, 'highlighted-search');
    goog.dom.setTextContent(
        this.resultCountElem_, 
        (termIndex + 1) + "/" + this.annotatedTerms_.length);
    this.setNavEnabled_(this.previousResultLink_, termIndex > 0);
    this.setNavEnabled_(this.nextResultLink_, 
                        termIndex < this.annotatedTerms_.length - 1);
    if (!this.annotatedIsInView_(annotated)) {
        goog.style.scrollIntoContainerView(
            annotated, this.transcriptElem_, true);
    }
};

unisubs.streamer.StreamBoxSearch.prototype.setNavEnabled_ = function(link, enabled) {
    goog.dom.classes.enable(link, 'disabled', !enabled);
};

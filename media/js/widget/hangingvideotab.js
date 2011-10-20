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
 * @constructor
 * @param {boolean=} opt_forAnchoring If true, will add a style that gives 
 *     the tab absolute position.
 * @implements {unisubs.widget.VideoTab}
 */
unisubs.widget.HangingVideoTab = function(opt_forAnchoring) {
    goog.ui.Component.call(this);
    this.anchorElem_ = null;
    this.imageElem_ = null;
    this.spanElem_ = null;
    this.nudgeElem_ = null;
    this.nudgeSpanElem_ = null;
    this.nudgeClickCallback_ = null;
    this.shareSpanElem_ = null;
    this.shareElem_ = null;
    this.forAnchoring_ = !!opt_forAnchoring;
    this.spinnerGifURL_ = unisubs.imageAssetURL('spinner.gif');
    this.logoURL_ = unisubs.imageAssetURL('small_logo.png');
    this.imageLoader_ = new goog.net.ImageLoader();
    this.imageLoader_.addImage('spinner', this.spinnerGifURL_);
    this.imageLoader_.addImage('small_logo', this.logoURL_);
    this.imageLoader_.start();
};
goog.inherits(unisubs.widget.HangingVideoTab, goog.ui.Component);

unisubs.widget.HangingVideoTab.prototype.createDom = function() {
    unisubs.widget.HangingVideoTab.superClass_.createDom.call(this);
    goog.dom.classes.add(
        this.getElement(), 
        "cleanslate", "unisubs-videoTab", 'unisubs-videoTab-' + 
            (this.forAnchoring_ ? 'anchoring' : 'static'));
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.imageElem_ = $d('img', {'alt': 'small logo'});
    this.spanElem_ = $d('span', 'unisubs-tabTextchoose');
    this.anchorElem_ = 
        $d('a', {'className': 'unisubs-subtitleMeLink', 'href':'javascript:void(0);'},
           this.imageElem_, this.spanElem_);
    this.nudgeSpanElem_ = $d('span', 'unisubs-tabTextfinish', 'NUDGE TEXT');
    this.nudgeElem_ = $d('a', {'href':'#'}, this.nudgeSpanElem_);
    goog.dom.append(this.getElement(),
                    this.anchorElem_, this.nudgeElem_);
};

unisubs.widget.HangingVideoTab.prototype.enterDocument = function() {
    unisubs.widget.HangingVideoTab.superClass_.enterDocument.call(this);
    this.showNudge(false);
    this.getHandler().
        listen(this.nudgeElem_, 'click', this.nudgeClicked_);
};

unisubs.widget.HangingVideoTab.prototype.getAnchorElem = function() {
    return this.anchorElem_;
};

unisubs.widget.HangingVideoTab.prototype.showLoading = function() {
    this.imageElem_.src = this.spinnerGifURL_;
    goog.dom.setTextContent(this.spanElem_, "Loading");
};

/**
* Shows the error message on the video tab and never attaches
* any interaction handlers on the widget.
* @param {str=} msg An optional message explaining what went wrong
**/
unisubs.widget.HangingVideoTab.prototype.showError = function(msg) {
    this.imageElem_.src = this.logoURL_;
    goog.dom.setTextContent(this.spanElem_, msg || "Subs Unavailable");
    this.getHandler().listen(
        this.anchorElem_,
        'click',
        function(e) {
            e.preventDefault();
        });
};

/**
 * Just stops loading. If state has changed, stop loading by
 * calling showContent instead.
 *
 */
unisubs.widget.HangingVideoTab.prototype.stopLoading = function() {
    this.imageElem_.src = this.logoURL_;
    if (this.text_)
        goog.dom.setTextContent(this.spanElem_, this.text_);
};

/**
 * Stops loading, and shows text appropriate for content.
 * @param {boolean} hasSubtitles Do subs currently exist for this video?
 * @param {unisubs.widget.SubtitleState=} opt_playSubState Subtitles 
 *     that are currently loaded to play in widget.
 */
unisubs.widget.HangingVideoTab.prototype.showContent = function(
    hasSubtitles, opt_playSubState) 
{
    this.imageElem_.src = this.logoURL_;
    var text;
    if (opt_playSubState)
        text = opt_playSubState.LANGUAGE ? 
            unisubs.languageNameForCode(opt_playSubState.LANGUAGE) :
            "Original Language";
    else
        text = hasSubtitles ? "Select Language" : "Subtitle Me";
    this.text_ = text;
    goog.dom.setTextContent(this.spanElem_, text);
};

unisubs.widget.HangingVideoTab.prototype.nudgeClicked_ = function(e) {
    e.preventDefault();
    unisubs.Tracker.getInstance().trackPageview('Clicks_Improve_Subtitles_or_translation');
    if (this.nudgeClickCallback_)
        this.nudgeClickCallback_();
};

unisubs.widget.HangingVideoTab.prototype.showNudge = function(shows) {
    unisubs.style.setVisibility(this.nudgeElem_, shows);
    unisubs.style.setVisibility(this.nudgeSpanElem_, shows);
     if (shows){
         unisubs.style.setProperty(this.nudgeElem_, 'width', null);
        
     }else{
         unisubs.style.setWidth(this.nudgeElem_, 0);
     }
    return;
};

/*
 * Creates the share button next to the 'subtitle me', only if 
 * this is an off site widget. When clicked will be taken to the
 * url provided.
 * @param shareURL {goog.URI} The url for the 'share' link.
 * @param newWindow {bool=} If true will open on new window.
 */
unisubs.widget.HangingVideoTab.prototype.createShareButton = function (shareURL, newWindow) {
    // users can make share button never show by setting UNISUBS_HIDESHARE.
    // see https://www.pivotaltracker.com/story/show/13700869
    if (!unisubs.isEmbeddedInDifferentDomain() || window['UNISUBS_HIDESHARE']) {
        // no point in taking to the unisubs site if we're here already
        return;
    }
    if(!this.shareElem_){
        var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
        this.shareSpanElem_ = $d('span', {'href':'', 'class':'unisubs-tabTextShare'}, 'Share');
        this.shareElem_ = $d('a', {'href':'', 'class':''}, this.shareSpanElem_);
        this.getElement().appendChild(this.shareElem_);    
    }
    var target= newWindow ? "_blank" : "_self";
    goog.dom.setProperties(this.shareElem_, {"href": shareURL.toString(), "target":target});
};

unisubs.widget.HangingVideoTab.prototype.updateNudge = function(text, fn) {
    goog.dom.setTextContent(this.nudgeSpanElem_, text);
    this.nudgeClickCallback_ = fn;
};
unisubs.widget.HangingVideoTab.prototype.show = function(shown) {
    unisubs.style.showElement(this.getElement(), shown);
};
unisubs.widget.HangingVideoTab.prototype.disposeInternal = function() {
    unisubs.widget.HangingVideoTab.superClass_.disposeInternal.call(this);
    this.imageLoader_.dispose();
};

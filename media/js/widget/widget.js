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

goog.provide('unisubs.widget.Widget');

/**
 * @constructor
 * @param {Object} widgetConfig parameter documentation is currenty in embed.js.
 */
unisubs.widget.Widget = function(widgetConfig) {
    goog.ui.Component.call(this);

    /**
     * @type {string}
     */
    this.videoURL_ = widgetConfig['video_url'];
    this.alternateVideoURLs_ = widgetConfig['alternate_video_urls'];
    this.forceFormat_ = !!widgetConfig['force_format'];
    this.videoConfig_ = widgetConfig['video_config'];
    this.streamer_ = widgetConfig['streamer'];
    /**
     * If true, this is the equivalent of clicking on "Add subtitles" 
     * if base state is null, or equivalent of clicking on "Improve 
     * these subtitles" if base state is not null.
     * @type {boolean}
     */
    this.subtitleImmediately_ = 
        !!widgetConfig['subtitle_immediately'];
    /**
     * If true, this is the equivalent of clicking on 
     * "Add New Translation"
     * @type {boolean}
     */
    this.translateImmediately_ =
        !!widgetConfig['translate_immediately'];
    var baseState = widgetConfig['base_state'];
    if (baseState)
        this.baseState_ = new unisubs.widget.BaseState(baseState);

    unisubs.widget.Widget.widgetsCreated_.push(this);
};
goog.inherits(unisubs.widget.Widget, goog.ui.Component);

unisubs.widget.Widget.prototype.createDom = function() {
    this.setElementInternal(this.getDomHelper().createElement('span'));
    this.addWidget_(this.getElement());
};

/*
 * @Type {Array} All widget instances created on this page.
 */
unisubs.widget.Widget.widgetsCreated_ = [];

/* Gets all widgets created on this page.
 * @return {Array} All widgets created on this page.
 * The array is cloned, so end user code can loop, filter and otherwise 
 * modify the array without compromising our global registry.
 */
unisubs.widget.Widget.getAllWidgets = function(){
    return unisubs.widget.Widget.widgetsCreated_.slice(0);
};

/* Get the last widget on this page with the given video URL.
 * @param {String} url The video url to find widgets for.
 * Note that it will only contain the last widget with a given URL. 
 * If a page contains X widgets with the same video url, 
 * only the last one will be fetched from this call (even if their
 * other configs differ). To get all widgets on the page, use 
 * the unisubs.widgets.Widget.getAllWidgetsByURL method.
 * @return {unisubs.widgets.Widget} The widget (or undefined if not found).
 */
unisubs.widget.Widget.getWidgetByURL = function(url){
    return unisubs.widget.Widget.getAllWidgetsByURL(url)[0];
};

/* Get the last widget on this page with the given video URL.
 * @param {String} url The video url to find widgets for.
 * @return {Array} An array with zero or more widgets with the given URL. 
 */
unisubs.widget.Widget.getAllWidgetsByURL = function(url){
    if (!url){
        return [];
    }
    var filtered =  goog.array.filter(unisubs.widget.Widget.widgetsCreated_, function(x){
        return x.videoURL_ == url;
    });
    return filtered;
};

/**
 * @param {HTMLDivElement} el Just a blank div with class unisubs-widget.
 */
unisubs.widget.Widget.prototype.decorateInternal = function(el) {
    unisubs.widget.Widget.superClass_.decorateInternal.call(this, el);
    this.addWidget_(el);
};

unisubs.widget.Widget.prototype.createVideoPlayer_ = function(videoSource) {
    this.videoPlayer_ = videoSource.createPlayer();
    this.addChildAt(this.videoPlayer_, 0, true);
    this.setVideoDimensions_();
};

unisubs.widget.Widget.prototype.findVideoSource_ = function() {
    if (this.alternateVideoURLs_ && this.alternateVideoURLs_.length > 0) {
        var mainVideoSpec = this.videoURL_;
        if (this.videoConfig_)
            mainVideoSpec = { 'url': this.videoURL_, 
                              'config': this.videoConfig_ };
        return unisubs.player.MediaSource.bestVideoSource(
            goog.array.concat(mainVideoSpec, this.alternateVideoURLs_));
    }
    else
        return unisubs.player.MediaSource.videoSourceForURL(
            this.videoURL_, this.videoConfig_);
};

unisubs.widget.Widget.prototype.isVideoSourceImmediatelyUsable_ = 
    function() 
{
    if (this.videoSource_ instanceof unisubs.player.BlipTVPlaceholder)
        return false;
    if (this.forceFormat_ || goog.isDefAndNotNull(this.alternateVideoURLs_))
        return true;
    else {
        return !(this.videoSource_ instanceof unisubs.player.Html5VideoSource)
                || unisubs.player.supportsVideo();
    }
};

unisubs.widget.Widget.prototype.addVideoLoadingPlaceholder_ = 
    function(el) 
{
    this.videoPlaceholder_ = this.getDomHelper().createDom(
        'div', 'unisubs-videoLoading', 'Loading...');
    goog.dom.appendChild(el, this.videoPlaceholder_);
};

unisubs.widget.Widget.prototype.addWidget_ = function(el) {
    try {
        this.videoSource_ = this.findVideoSource_();
    }
    catch (err) {
        // TODO: format this more.
        el.innerHTML = err.message;
        return;
    }
    if (this.isVideoSourceImmediatelyUsable_())
        this.createVideoPlayer_(this.videoSource_);
    else
        this.addVideoLoadingPlaceholder_(el);
    if (this.streamer_) {
        this.streamBox_ = new unisubs.streamer.StreamBox();
        var streamerContainer = new goog.ui.Component();
        this.addChild(streamerContainer, true);
        streamerContainer.addChild(this.streamBox_, true);
        // TODO: show loading?
    }
    else {
        this.videoTab_ = new unisubs.widget.VideoTab();
        var videoTabContainer = new goog.ui.Component();
        this.addChild(videoTabContainer, true);
        videoTabContainer.addChild(this.videoTab_, true);
        videoTabContainer.getElement().className = 
            'unisubs-videoTab-container';
        this.videoTab_.showLoading();
    }
    var args = {
        'video_url': this.videoURL_,
        'is_remote': unisubs.isFromDifferentDomain()
    };
    if (this.baseState_)
        args['base_state'] = this.baseState_.ORIGINAL_PARAM;
    console.log('calling show_widget');
    unisubs.Rpc.call(
        'show_widget', args, 
        goog.bind(this.initializeState_, this),
        goog.bind(this.showWidgetError_, this));
    unisubs.Tracker.getInstance().trackEvent(
        "Widget displayed",
        window.location.href,
        this.videoSource_.getVideoURL());
};

unisubs.widget.Widget.prototype.showWidgetError_ = function() {
    // call to show_widget timed out.
    if (!this.isVideoSourceImmediatelyUsable_()) {
        // waiting for video source from server.
        if (this.videoSource_ instanceof unisubs.player.BlipTVPlaceholder) {
            // out of luck.
            
        }
        else {
            this.createVideoPlayer_(this.videoSource_);            
        }
    }
    if (this.videoTab_) {
        this.videoTab_.showError();
    }
};

unisubs.widget.Widget.prototype.initializeState_ = function(result) {
    if (result && !result["error_msg"]) {
        if (!this.isVideoSourceImmediatelyUsable_()) {
            goog.dom.removeNode(this.videoPlaceholder_);
            var videoSource = unisubs.player.MediaSource.bestVideoSource(
                result['video_urls']);
            if (goog.typeOf(videoSource) == goog.typeOf(this.videoSource_) &&
                this.videoConfig_)
                videoSource.setVideoConfig(this.videoConfig_);
            this.videoSource_ = videoSource;
            this.createVideoPlayer_(this.videoSource_);
        }
    }
    if (this.streamer_) {
        this.initializeStateStreamer_(result);
    }
    else {
        this.initializeStateTab_(result);
    }
};

unisubs.widget.Widget.prototype.initializeStateTab_ = function(result) {
    if (!result || result["error_msg"]) {
        // this happens, for example, for private youtube videos.
        this.videoTab_.showError(result["error_msg"]);
        return;
    }

    this.controller_ = new unisubs.widget.WidgetController(
        this.videoURL_, this.videoPlayer_, this.videoTab_);
    this.controller_.initializeState(result);

    var subController = this.controller_.getSubtitleController();

    if (this.subtitleImmediately_)
        goog.Timer.callOnce(
            goog.bind(subController.openSubtitleDialog, subController));
    else if (this.translateImmediately_)
        goog.Timer.callOnce(
            goog.bind(subController_.openNewLanguageDialog, 
                      subController_));    
};

unisubs.widget.Widget.prototype.initializeStateStreamer_ = function(result) {
    var subtitleState = unisubs.widget.SubtitleState.fromJSON(
        result['subtitles']);
    this.streamBox_.setSubtitles(subtitleState.SUBTITLES);
    var controller = new unisubs.streamer.StreamerController(
        this.videoPlayer_, this.streamBox_);
    controller.initializeState(result);
};

unisubs.widget.Widget.prototype.enterDocument = function() {
    unisubs.widget.Widget.superClass_.enterDocument.call(this);
    this.setVideoDimensions_();
};

unisubs.widget.Widget.prototype.setVideoDimensions_ = function() {
    if (!this.isInDocument() || !this.videoPlayer_)
        return;
    if (this.videoPlayer_.areDimensionsKnown())
        this.videoDimensionsKnown_();
    else
        this.getHandler().listen(
            this.videoPlayer_,
            unisubs.player.AbstractVideoPlayer.EventType.DIMENSIONS_KNOWN,
            this.videoDimensionsKnown_);
};

unisubs.widget.Widget.prototype.videoDimensionsKnown_ = function() {
    unisubs.style.setWidth(
        this.getElement(),
        Math.round(this.videoPlayer_.getVideoSize().width));
};

/**
 * Select a menu item. Either called by selecting 
 * a menu item or programmatically by js on the page.
 */
unisubs.widget.Widget.prototype.selectMenuItem = function(selection, opt_languageCode) {
    var s = unisubs.widget.DropDown.Selection;
    var subController = this.controller_.getSubtitleController();
    var playController = this.controller_.getPlayController();

    if (selection == s.ADD_LANGUAGE)
        subController.openNewLanguageDialog();
    else if (selection == s.IMPROVE_SUBTITLES)
        subController.openSubtitleDialog();
    else if (selection == s.SUBTITLE_HOMEPAGE)
        alert('subtitle homepage');
    else if (selection == s.SUBTITLES_OFF)
        playController.turnOffSubs();
    else if (selection == s.LANGUAGE_SELECTED){
        playController.languageSelected(opt_languageCode);
    }
        
};

unisubs.widget.Widget.prototype.playAt = function(time) {
    this.videoPlayer_.setPlayheadTime(time);
    this.videoPlayer_.play();
};

unisubs.widget.Widget.prototype.play = function() {
    this.videoPlayer_.play();
};

unisubs.widget.Widget.prototype.pause = function() {
    this.videoPlayer_.pause();
};

unisubs.widget.Widget.prototype.openMenu = function (){
    this.controller_.openMenu();
}

unisubs.widget.Widget.exportJSSameDomain_ = function(){

    goog.exportSymbol(
        "unisubs.widget.SameDomainEmbed.embed", 
        unisubs.widget.SameDomainEmbed.embed);
    
    goog.exportSymbol(
        "unisubs.player.supportsVideo", unisubs.player.supportsVideo);
    goog.exportSymbol(
        "unisubs.player.supportsH264", unisubs.player.supportsH264);
    goog.exportSymbol(
        "unisubs.player.supportsOgg", unisubs.player.supportsOgg);
    goog.exportSymbol(
        "unisubs.player.supportsWebM", unisubs.player.supportsWebM);
        
    // these are here to guarantee backwareds compatibility,
    // should be removed once we are sure partners do not need this
    
    goog.exportSymbol(
        "mirosubs.widget.SameDomainEmbed.embed", 
        unisubs.widget.SameDomainEmbed.embed);

    goog.exportSymbol(
        "mirosubs.video.supportsVideo", unisubs.player.supportsVideo);
    goog.exportSymbol(
        "mirosubs.video.supportsH264", unisubs.player.supportsH264);
    goog.exportSymbol(
        "mirosubs.video.supportsOgg", unisubs.player.supportsOgg);
    goog.exportSymbol(
        "mirosubs.video.supportsWebM", unisubs.player.supportsWebM);
};

unisubs.widget.Widget.exportJSCrossDomain_ = function(){
        if (!unisubs.widget.CrossDomainEmbed){
            unisubs.widget.CrossDomainEmbed = {};
        } 
        unisubs.widget.CrossDomainEmbed.Type = {
            EMBED_SCRIPT : 1,
            WIDGETIZER : 2,
            BOOKMARKLET : 3,
            EXTENSION : 4
        };

        goog.exportSymbol(
            'unisubs.widget.CrossDomainEmbed.embed',
            unisubs.widget.CrossDomainEmbed.embed);
            
        // these are here to guarantee backwareds compatibility,
        // should be removed once we are sure partners do not need this
        goog.exportSymbol(
            'unisubs.widget.CrossDomainEmbed.embed',
            unisubs.widget.CrossDomainEmbed.embed);
            
};

unisubs.widget.Widget.exportFireKeySequence = function() {
    goog.exportSymbol(
        'unisubs.widget.fireKeySequence',
        goog.testing.events.fireNonAsciiKeySequence);

    // these are here to guarantee backwareds compatibility,
    // should be removed once we are sure partners do not need this

    goog.exportSymbol(
        'mirosubs.widget.fireKeySequence',
        goog.testing.events.fireNonAsciiKeySequence);
    
};

/*
 * @param {bool} isCrossDomain Is is a cross domain embed?
 */
unisubs.widget.Widget.exportJSSymbols = function(isCrossDomain){
    // these should be exported in all cases:
    goog.exportProperty(
        unisubs.widget.Widget.prototype,
        "play",
        unisubs.widget.Widget.prototype.play );
    goog.exportProperty(
        unisubs.widget.Widget.prototype,
        "pause",
        unisubs.widget.Widget.prototype.pause );
    goog.exportProperty(
        unisubs.widget.Widget.prototype,
        "playAt",
        unisubs.widget.Widget.prototype.playAt );
    goog.exportProperty(
        unisubs.widget.Widget.prototype,
        "openMenu",
        unisubs.widget.Widget.prototype.openMenu );

    goog.exportProperty(
        unisubs.widget.Widget.prototype,
        "selectMenuItem",
        unisubs.widget.Widget.prototype.selectMenuItem);

    unisubs.widget.Widget.exportFireKeySequence();

    goog.exportSymbol(
        "unisubs.widget.Widget.getWidgetByURL",
        unisubs.widget.Widget.getWidgetByURL);
    goog.exportSymbol(
        "unisubs.widget.Widget.getAllWidgets",
        unisubs.widget.Widget.getAllWidgets);

    goog.exportSymbol(
        "unisubs.widget.DropDown.Selection",
        unisubs.widget.DropDown.Selection);
    var s = unisubs.widget.DropDown.Selection;
    s['IMPROVE_SUBTITLES'] = s.IMPROVE_SUBTITLES;
    s['LANGUAGE_SELECTED'] = s.LANGUAGE_SELECTED;
    s['ADD_LANGUAGE'] = s.ADD_LANGUAGE;
    s['SUBTITLES_OFF'] = s.SUBTITLES_OFF;
    
    if (isCrossDomain) {
        unisubs.widget.Widget.exportJSCrossDomain_();
    } else {
        unisubs.widget.Widget.exportJSSameDomain_();
    }
};

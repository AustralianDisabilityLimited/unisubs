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

goog.provide('unisubs.widget.WidgetDecorator');

/**
 * @private
 * @constructor
 * @param {unisubs.video.AbstractVideoPlayer} videoPlayer
 */
unisubs.widget.WidgetDecorator = function(videoPlayer) {
    this.videoPlayer_ = videoPlayer;
    this.videoTab_ = new unisubs.widget.VideoTab(true);
    this.videoTab_.render();
    this.videoTab_.show(false);
    this.videoTab_.showLoading();
    this.handler_ = new goog.events.EventHandler(this);
    if (this.videoPlayer_.areDimensionsKnown())
        this.videoDimensionsKnown_();
    else
        this.handler_.listen(
            this.videoPlayer_,
            unisubs.video.AbstractVideoPlayer.EventType.DIMENSIONS_KNOWN,
            this.videoDimensionsKnown_);
    this.controller_ = new unisubs.widget.WidgetController(
        this.videoPlayer_.getVideoSource().getVideoURL(),
        this.videoPlayer_,
        this.videoTab_);
    var args = {
        'video_url': videoPlayer.getVideoSource().getVideoURL(),
        'is_remote': unisubs.isFromDifferentDomain()
    };
    if (this.videoPlayer_.getVideoSource() instanceof 
        unisubs.video.Html5VideoSource)
        args['additional_video_urls'] = 
            this.videoPlayer_.getVideoSource().getAlternateURLs();
    unisubs.Rpc.call(
        'show_widget', args, 
        goog.bind(this.controller_.initializeState, 
                  this.controller_),
        goog.bind(this.videoTab_.showError, 
                  this.videoTab_));

    unisubs.widget.Widget.widgetsCreated_.push(this);
};

/**
 *
 * @param {unisubs.video.AbstractVideoPlayer} videoPlayer should already
 *     be attached to page.
 */
unisubs.widget.WidgetDecorator.decorate = function(videoPlayer) {
    return new unisubs.widget.WidgetDecorator(videoPlayer);
};

unisubs.widget.WidgetDecorator.prototype.videoDimensionsKnown_ = function() {
    unisubs.attachToLowerLeft(
        this.videoPlayer_.getElement(),
        this.videoTab_.getElement());
    // we're doing this because there might be several videos on the page
    // that are pushing things down on the page as they load
    this.dimensionsTimer_ = new goog.Timer(500);
    this.handler_.listen(this.dimensionsTimer_,
                         goog.Timer.TICK,
                         this.repositionTimerTick_);
    this.repositionCount_ = 0;
    this.dimensionsTimer_.start();
    // also listen for page resize.
    var vsm = new goog.dom.ViewportSizeMonitor();
    this.handler_.listen(
        vsm, goog.events.EventType.RESIZE,
        this.reposition_);
};
unisubs.widget.WidgetDecorator.prototype.repositionTimerTick_ =
    function(event) 
{
    this.reposition_();
    this.repositionCount_++;
    if (this.repositionCount_ > 80) // 40 seconds
        this.dimensionsTimer_.stop();
};
unisubs.widget.WidgetDecorator.prototype.reposition_ = function() {
    unisubs.repositionToLowerLeft(
        this.videoPlayer_.getElement(),
        this.videoTab_.getElement());
};

unisubs.widget.WidgetDecorator.prototype.playAt = function(time) {
    this.videoPlayer_.setPlayheadTime(time);
    this.videoPlayer_.play();
};

unisubs.widget.WidgetDecorator.prototype.play = function() {
    this.videoPlayer_.play();
};

unisubs.widget.WidgetDecorator.prototype.pause = function() {
    this.videoPlayer_.pause();
};

unisubs.widget.WidgetDecorator.prototype.openMenu = function() {
    this.controller_.openMenu();
};

unisubs.widget.WidgetDecorator.exportJSSymbols = function(){
    goog.exportProperty(
        unisubs.widget.WidgetDecorator.prototype,
        "play",
        unisubs.widget.WidgetDecorator.prototype.play );
    goog.exportProperty(
        unisubs.widget.WidgetDecorator.prototype,
        "pause",
        unisubs.widget.WidgetDecorator.prototype.pause );
    goog.exportProperty(
        unisubs.widget.WidgetDecorator.prototype,
        "playAt",
        unisubs.widget.WidgetDecorator.prototype.playAt );

    goog.exportProperty(
        unisubs.widget.WidgetDecorator.prototype,
        "openMenu",
        unisubs.widget.WidgetDecorator.prototype.openMenu );

    goog.exportSymbol(
        "unisubs.widget.Widget.getWidgetByURL",
        unisubs.widget.Widget.getWidgetByURL);
   goog.exportSymbol(
        "unisubs.widget.Widget.getAllWidgets",
        unisubs.widget.Widget.getAllWidgets);
        
    // these are here to guarantee backwareds compatibility,
    // should be removed once we are sure partners do not need this
    
     goog.exportSymbol(
         "mirosubs.widget.Widget.getWidgetByURL",
         unisubs.widget.Widget.getWidgetByURL);
    goog.exportSymbol(
         "mirosubs.widget.Widget.getAllWidgets",
         unisubs.widget.Widget.getAllWidgets);
        
}

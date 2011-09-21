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

goog.provide('unisubs.Widgetizer');

/**
 * @constructor
 * This is a singleton, so don't call this method directly.
 */
unisubs.Widgetizer = function() {
    unisubs.siteConfig = unisubs.Config.siteConfig;
    var myURI = new goog.Uri(window.location);
    var DEBUG_WIN_NAME = 'unisubsdebuggingmain';
    if (goog.DEBUG) {
        var debugWindow = new goog.debug.FancyWindow(DEBUG_WIN_NAME);
        debugWindow.setEnabled(true);
        debugWindow.init();
        unisubs.DEBUG = true;
    }
    this.makers_ = [
        new unisubs.widgetizer.Youtube(),
        new unisubs.widgetizer.HTML5(),
        new unisubs.widgetizer.JWPlayer(),
        new unisubs.widgetizer.YoutubeIFrame()
    ];
    this.logger_ = goog.debug.Logger.getLogger('unisubs.Widgetizer');
    var uri = new goog.Uri(window.location);
    unisubs.Tracker.getInstance().trackEvent(
        "Widgetizer",
        uri.getDomain(),
        uri.toString());
};
goog.addSingletonGetter(unisubs.Widgetizer);



/**
 * Converts all videos in the page to unisubs widgets.
 *
 */
unisubs.Widgetizer.prototype.widgetize = function() {
    window["unisubsPlayerReady"] = 
        goog.bind(this.unisubsPlayerReady_, this);
    this.initListenedPlayers_();
    if (unisubs.LoadingDom.getInstance().isDomLoaded()) {
        this.onLoaded_();
    }
    else {
        goog.events.listenOnce(
            unisubs.LoadingDom.getInstance(),
            unisubs.LoadingDom.DOMLOAD,
            this.onLoaded_, false, this);
    }
};

unisubs.Widgetizer.prototype.onLoaded_ = function() {
    this.addHeadCss();
    this.widgetizeAttemptTimer_ = new goog.Timer(1000);
    this.widgetizeAttemptCount_ = 0;
    goog.events.listen(
        this.widgetizeAttemptTimer_,
        goog.Timer.TICK,
        goog.bind(this.findAndWidgetizeElements_, this));
    this.widgetizeAttemptTimer_.start();
};

unisubs.Widgetizer.prototype.unisubsPlayerReady_ = function(code, args) {
    var videoPlayer;
    if (code == "y") {
        unisubs.player.YoutubeVideoPlayer.registerReady.apply(
            null, args);
    }
    else if (code == "o") {
        videoPlayer = unisubs.player.OoyalaPlayer.callbackMade.apply(
            null, args);
    }
    if (videoPlayer) {
        this.decorateVideoPlayer_(videoPlayer);
    }
};

unisubs.Widgetizer.prototype.initListenedPlayers_ = function() {
    goog.array.forEach(
        window["unisubsReady"],
        function(ready) {
            this.unisubsPlayerReady_(ready[0], ready[1]);
        }, 
        this);
    // for legacy purposes with widgetizerprimer
    goog.array.forEach(
        window['unisubs_readyAPIIDs'],
        function(playerID) {
            this.unisubsPlayerReady_("y", [playerID]);
        }, this);
};

unisubs.Widgetizer.prototype.findAndWidgetizeElements_ = function() {
    this.widgetizeAttemptCount_++;
    if (this.widgetizeAttemptCount_ > 5) {
        this.widgetizeAttemptTimer_.stop();
        return;
    }
    if (goog.DEBUG) {
        this.logger_.info('finding and widgetizing elements');
    }
    var videoPlayers = [];
    for (var i = 0; i < this.makers_.length; i++)
        goog.array.extend(
            videoPlayers, 
            this.makers_[i].makeVideoPlayers());
    if (goog.DEBUG) {
        this.logger_.info('found ' + videoPlayers.length + 
                          ' new video players on the page');
    }
    goog.array.forEach(videoPlayers, this.decorateVideoPlayer_, this);
};

unisubs.Widgetizer.prototype.decorateVideoPlayer_ = function(videoPlayer) {
    if (unisubs.usingStreamer()) {
        unisubs.streamer.StreamerDecorator.decorate(videoPlayer);
    }
    else {
        unisubs.widget.WidgetDecorator.decorate(videoPlayer);
    }
};

unisubs.Widgetizer.prototype.addHeadCss = function() {
    if (!window.MiroCSSLoading) {
        window.MiroCSSLoading = true;
        var head = document.getElementsByTagName('head')[0];
        var css = document.createElement('link');
        css.type = 'text/css';
        css.rel = 'stylesheet';
        css.href = unisubs.Config.siteConfig['staticURL'] + 
            'css/unisubs-widget.css';
        css.media = 'screen';
        head.appendChild(css);
    }
};

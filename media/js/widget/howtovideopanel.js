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

goog.provide('unisubs.HowToVideoPanel');

/**
 * @constructor
 * @param {unisubs.HowToVideoPanel.VideoChoice} videoChoice
 */
unisubs.HowToVideoPanel = function(videoChoice) {
    goog.ui.Component.call(this);
    if (unisubs.player.supportsOgg())
        this.videoPlayer_ = 
            (new unisubs.player.Html5VideoSource(
                videoChoice.videos.ogg, 
                unisubs.player.Html5VideoType.OGG)).createPlayer();
    else if (unisubs.player.supportsH264())
        this.videoPlayer_ = 
            (new unisubs.player.Html5VideoSource(
                videoChoice.videos.h264, 
                unisubs.player.Html5VideoType.H264)).createPlayer();
    else
        this.videoPlayer_ = (new unisubs.player.YoutubeVideoSource(
            videoChoice.videos.yt)).createPlayer();
    this.howToImageURL_ = unisubs.imageAssetURL(videoChoice.image);
    this.usingHtml5Video_ = 
        unisubs.player.supportsOgg() ||
        unisubs.player.supportsH264();
};
goog.inherits(unisubs.HowToVideoPanel, goog.ui.Component);

unisubs.HowToVideoPanel.CONTINUE = 'continue';
unisubs.HowToVideoPanel.VideoChoice = {
    TRANSCRIBE: {
        videos: {
            ogg: 'http://blip.tv/file/get/Miropcf-tutorialstep1573.ogv',
            h264: 'http://blip.tv/file/get/Miropcf-tutorialstep1328.mp4',
            yt: '0MCpmace_lc'
        },
        image: 'howto-step1.png'
    },
    SYNC: {
        videos: {
            ogg: 'http://blip.tv/file/get/Miropcf-tutorialstep2876.ogv',
            h264: 'http://blip.tv/file/get/Miropcf-tutorialstep2530.mp4',
            yt: 'bkwiFF-I2nI'
        },
        image: 'howto-step2.png'
    },
    REVIEW: {
        videos: {
            ogg: 'http://blip.tv/file/get/Miropcf-tutorialstep3571.ogv',
            h264: 'http://blip.tv/file/get/Miropcf-tutorialstep3146.mp4',
            yt: 'Y5vGEGKMkMk'
        },
        image: 'howto-step3.png'
    }
};

unisubs.HowToVideoPanel.HTML5_VIDEO_SIZE_ =
    new goog.math.Size(512, 384);

unisubs.HowToVideoPanel.prototype.getContentElement = function() {
    return this.contentElement_;
};

unisubs.HowToVideoPanel.prototype.createDom = function() {
    unisubs.HowToVideoPanel.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    this.contentElement_ = $d('div');
    var el = this.getElement();
    el.className = 'unisubs-howtopanel';
    el.appendChild(this.contentElement_);
    this.skipVideosSpan_ = $d('span', 'goog-checkbox-unchecked');
    el.appendChild($d('div', null, this.skipVideosSpan_,
                      goog.dom.createTextNode(' Skip these videos')));
    this.continueLink_ = 
        $d('a', 
           {'className': 'unisubs-done', 
            'href': '#'}, 
           $d('span', null, 'Continue'))
    el.appendChild(this.continueLink_);
    var vidPlayer = new goog.ui.Component();
    vidPlayer.addChild(this.videoPlayer_, true);
    this.howToImage_ = $d('img', 
                          {'src': this.howToImageURL_, 
                           'className': 'unisubs-howto-image'});
    vidPlayer.getElement().appendChild(this.howToImage_);
    this.addChild(vidPlayer, true);
    vidPlayer.getElement().className = 'unisubs-howto-videocontainer';
    var videoSize;
    if (this.usingHtml5Video_) {
        var viewportSize = goog.dom.getViewportSize();
        var videoTop = 
            Math.max(0, goog.style.getClientLeftTop(
                this.videoPlayer_.getElement()).y);
        videoSize = unisubs.HowToVideoPanel.HTML5_VIDEO_SIZE_;
        if (videoTop + videoSize.height > viewportSize.height - 60) {
            var newVideoHeight = 
                Math.max(270, viewportSize.height - videoTop - 60);
            var newVideoWidth = 
                videoSize.width * newVideoHeight / videoSize.height;
            videoSize = new goog.math.Size(
                newVideoWidth, newVideoHeight);
        }
        this.videoPlayer_.setVideoSize(videoSize.width, videoSize.height);
    }
    else
        videoSize = this.videoPlayer_.getVideoSize();
    unisubs.style.setSize(vidPlayer.getElement(), videoSize.width, videoSize.height);
    unisubs.style.setSize(this.howToImage_, videoSize.width, videoSize.height);
};

unisubs.HowToVideoPanel.prototype.enterDocument = function() {
    unisubs.HowToVideoPanel.superClass_.enterDocument.call(this);
    if (!this.skipVideosCheckbox_) {
        this.skipVideosCheckbox_ = new goog.ui.Checkbox();
        this.skipVideosCheckbox_.decorate(this.skipVideosSpan_);
        this.skipVideosCheckbox_.setLabel(
            this.skipVideosCheckbox_.getElement().parentNode);
        this.skipVideosCheckbox_.setChecked(goog.ui.Checkbox.State.UNCHECKED);
    }
    this.getHandler().listen(this.skipVideosCheckbox_,
                             goog.ui.Component.EventType.CHANGE,
                             this.skipVideosCheckboxChanged_);
    this.getHandler().listen(this.continueLink_, 'click', this.continue_);
    this.getHandler().listen(this.howToImage_, 'click', this.startPlaying_);
};

unisubs.HowToVideoPanel.prototype.startPlaying_ = function(e) {
    e.preventDefault();
    goog.dom.removeNode(this.howToImage_);
    this.videoPlayer_.play();
};

unisubs.HowToVideoPanel.prototype.skipVideosCheckboxChanged_ = function(e) {
    unisubs.UserSettings.setBooleanValue(
        unisubs.UserSettings.Settings.SKIP_HOWTO_VIDEO,
        this.skipVideosCheckbox_.isChecked());
};

unisubs.HowToVideoPanel.prototype.continue_ = function(e) {
    e.preventDefault();
    this.dispatchEvent(unisubs.HowToVideoPanel.CONTINUE);
};

unisubs.HowToVideoPanel.prototype.stopVideo = function() {
    this.videoPlayer_.pause();
    this.videoPlayer_.dispose();
};

unisubs.HowToVideoPanel.prototype.disposeInternal = function() {
    unisubs.HowToVideoPanel.superClass_.disposeInternal.call(this);
};

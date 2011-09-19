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

goog.provide('unisubs.subtitle.SharePanel');

/**
* @constructor
* @extends goog.ui.Component
*/
unisubs.subtitle.SharePanel = function(serverModel) {
    goog.ui.Component.call(this);
    this.serverModel_ = serverModel;
};
goog.inherits(unisubs.subtitle.SharePanel, goog.ui.Component);
unisubs.subtitle.SharePanel.prototype.createDom = function() {
    unisubs.subtitle.SharePanel.superClass_.createDom.call(this);
    this.getElement().className = 'unisubs-share';

    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());
    var $t = goog.bind(this.getDomHelper().createTextNode, this.getDomHelper());

    this.getElement().appendChild(
        $d('img', {'src': unisubs.imageAssetURL('blue_triangle.png'),
                   'className':'unisubs-blueTriangle'}));
    this.createShareSection_($d, $t);
    this.createEmbedSection_($d, $t);
    this.createPermalinkSection_($d, $t);
};
unisubs.subtitle.SharePanel.prototype.createShareSection_ = function($d, $t) {
    this.getElement().appendChild($d('h2', null, 'Share your subtitles'));
    this.getElement().appendChild(
        $d('p', null,
           $t('Now everyone can watch the video with subtitles-- try it!'),
           $d('br'),
           $t('Then tell the world and invite your friends to help translate:')));
    this.getElement().appendChild(this.createShareList_($d, $t));
};
unisubs.subtitle.SharePanel.prototype.createShareList_ = function($d, $t) {
    this.facebookLink_ = $d('a', {'href':'#'}, 'Post to Facebook');
    this.twitterLink_ = $d('a',
                           {'href':this.makeTwitterURL_(),
                            'target':'share_subs_on_twitter'},
                           'Post to Twitter');
    this.emailLink_ = $d('a', {'href':'#'}, 'Email to friends');
    return $d('ul', null,
              $d('li', 'unisubs-facebook', this.facebookLink_),
              $d('li', 'unisubs-twitter-share', this.twitterLink_),
              $d('li', 'unisubs-friends', this.emailLink_));
};
unisubs.subtitle.SharePanel.prototype.createEmbedSection_ = function($d, $t) {
    this.embedCodeInput_ = $d('input', {'type':'text'});

    var embedCode = this.serverModel_.getEmbedCode();
    this.embedCodeInput_['value'] = embedCode;

    var flashSpan = $d('span');
    flashSpan.innerHTML = unisubs.Clippy.getHTML(embedCode);
    this.getElement().appendChild($d('h3', null, 'Embed this video in your site'));
    this.getElement().appendChild($d('p', 'unisubs-embed',
                                     this.embedCodeInput_,
                                     flashSpan));
};
unisubs.subtitle.SharePanel.prototype.createPermalinkSection_ = function($d, $t) {
    this.getElement().appendChild($d('h3', null, 'Permalink'));
    this.getElement().appendChild(
        $d('a',
           {'className':'unisubs-permalink',
            'href':this.serverModel_.getPermalink()},
           this.serverModel_.getPermalink()));
};
unisubs.subtitle.SharePanel.prototype.enterDocument = function() {
    unisubs.subtitle.SharePanel.superClass_.enterDocument.call(this);
    var that = this;
    this.getHandler()
        .listen(this.embedCodeInput_, ['focus', 'click'],
                             this.focusEmbed_)
        .listen(this.emailLink_, 'click',
                this.emailLinkClicked_)
        .listen(this.facebookLink_, 'click',
                this.facebookLinkClicked_);
};
unisubs.subtitle.SharePanel.prototype.focusEmbed_ = function() {
    var that = this;
    goog.Timer.callOnce(function() {
        that.embedCodeInput_.select();
    });
};

unisubs.subtitle.SharePanel.EMAIL_TEXT =
    "I just added subtitles to this video using the Universal Subtitles alpha.\n\n" +
    "It's still experimental and just for testing, but if you'd like to " +
    "check it out or try it yourself, here's the link: LINK";

unisubs.subtitle.SharePanel.prototype.emailLinkClicked_ = function(e) {
    e.preventDefault();
    window.open(this.makeEmailURL_(),
                unisubs.randomString(),
                'scrollbars=yes,width=900,height=600');
};

unisubs.subtitle.SharePanel.prototype.makeEmailURL_ = function() {
    return "/videos/email_friend?text=" +
        encodeURIComponent(
            unisubs.subtitle.SharePanel.EMAIL_TEXT.replace(
                "LINK", this.serverModel_.getPermalink()));
};

unisubs.subtitle.SharePanel.prototype.facebookLinkClicked_ = function(e) {
    e.preventDefault();
    window.open(this.makeFacebookURL_(),
                unisubs.randomString(),
                'scrollbars=yes,status=0,width=560,height=400');
};

unisubs.subtitle.SharePanel.SHORT_MESSAGE_PREFIX_ =
    'Just added #subtitles to this video using the @universalsubs alpha';

unisubs.subtitle.SharePanel.prototype.makeFacebookURL_ = function() {
    var queryData = new goog.Uri.QueryData();
    queryData.set('u', this.serverModel_.getPermalink());
    queryData.set('t', unisubs.subtitle.SharePanel.SHORT_MESSAGE_PREFIX_);
    return 'http://www.facebook.com/sharer.php?' + queryData.toString();
};

unisubs.subtitle.SharePanel.prototype.makeTwitterURL_ = function() {
    var queryData = new goog.Uri.QueryData();
    var message = unisubs.subtitle.SharePanel.SHORT_MESSAGE_PREFIX_ +
        ': ' + this.serverModel_.getPermalink();
    queryData.set('status', message);
    return 'http://twitter.com/home/?' + queryData.toString();
};
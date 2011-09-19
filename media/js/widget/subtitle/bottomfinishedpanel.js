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

goog.provide('unisubs.subtitle.BottomFinishedPanel');

/**
 * @constructor
 */
unisubs.subtitle.BottomFinishedPanel = function(dialog, permalink) {
    goog.ui.Component.call(this);
    this.dialog_ = dialog;
    this.permalink_ = permalink;
};
goog.inherits(unisubs.subtitle.BottomFinishedPanel, goog.ui.Component);

unisubs.subtitle.BottomFinishedPanel.prototype.createDom = function() {
    unisubs.subtitle.BottomFinishedPanel.superClass_.createDom.call(this);
    var elem = this.getElement();
    var $d = goog.bind(this.getDomHelper().createDom, this.getDomHelper());

    var transBox = $d('div', 'unisubs-translating');

    if (unisubs.isFromDifferentDomain()) {
        
        this.closeLink_ = 
            $d('a', 
               {'className': 'unisubs-otherClose', 'href':'#'}, 
               $d('span'),
               "Close and return to site");
        var otherDiv = 
            $d('div', 'unisubs-otherButtons',
               this.closeLink_,
               this.getDomHelper().createTextNode("|"),
               $d('a',
                  {'className': 'unisubs-goBack',
                   'href': this.permalink_},
                  "Go to Universal Subtitles video homepage"));
        elem.appendChild(otherDiv);
    }
    elem.appendChild(transBox);
    this.addTranslationLink_ = 
        $d('a', 
           {'className':'unisubs-done', 'href':'#'}, 
           'Add a Translation Now');
    this.askAFriendLink_ = 
        $d('a', 
           {'className':'unisubs-done', 
            'href':'#'},
           'Ask a Friend to Translate');
    transBox.appendChild(
        $d('div', 'unisubs-buttons',
           this.addTranslationLink_,
           this.askAFriendLink_));
    transBox.appendChild(
        $d('p', null,
           ['Your subtitles are now ready to be translated -- by you ',
            'and by others.  The best way to get translation help is ',
            'to reach out to your friends or people in your community ',
            'or orgnization.'].join('')));
    transBox.appendChild(
        $d('p', null,
           ["Do you know someone who speaks a language that you’d like ",
            "to translate into?"].join('')));
};
unisubs.subtitle.BottomFinishedPanel.prototype.enterDocument = function() {
    unisubs.subtitle.BottomFinishedPanel.superClass_.enterDocument.call(this);
    this.getHandler().
        listen(this.addTranslationLink_, 'click',
               this.addTranslationClicked_).
        listen(this.askAFriendLink_, 'click',
               this.askAFriendClicked_);
    if (this.closeLink_)
        this.getHandler().listen(
            this.closeLink_, 'click',
            this.closeClicked_);
};
unisubs.subtitle.BottomFinishedPanel.prototype.closeClicked_ = 
    function(event) 
{
    event.preventDefault();
    this.dialog_.setVisible(false);
};
unisubs.subtitle.BottomFinishedPanel.prototype.addTranslationClicked_ =
    function(event)
{
    event.preventDefault();
    this.dialog_.addTranslationsAndClose();
};

unisubs.subtitle.BottomFinishedPanel.prototype.askAFriendClicked_ = function(e) {
    e.preventDefault();
    window.open(
        this.makeAskFriendURL_(),
        unisubs.randomString(),
        'scrollbars=yes,width=900,height=600');
};

unisubs.subtitle.BottomFinishedPanel.ASK_A_FRIEND_TEXT_ = 
    "Hey-- I just created subtitles using universalsubtitles.org, and I was hoping " +
    "you'd be able to use your awesome language skills to translate them.  It's " +
    "easy, and it would be a huge help to me. ";

unisubs.subtitle.BottomFinishedPanel.prototype.makeAskFriendURL_ =
    function()
{
    var queryData = new goog.Uri.QueryData();
    var message = unisubs.subtitle.BottomFinishedPanel.ASK_A_FRIEND_TEXT_ +
        this.permalink_ + "?translate_immediately=true";
    queryData.set('text', message);
    return unisubs.siteURL() + '/videos/email_friend/?' + queryData.toString();
};
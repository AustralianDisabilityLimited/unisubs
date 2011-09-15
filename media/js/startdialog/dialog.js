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

goog.provide('unisubs.startdialog.Dialog');

/**
 * @constructor
 * @param {string} videoID
 * @param {?unisubs.widget.SubtitleState} initialLanguageState The state 
 * for the initial lang to be displayed.
 * @param {function(?string, string, ?number, ?number, function())} 
 * callback When OK button is 
 *     clicked, this will be called with: arg0: original language. This is
 *     non-null if and only if the user is presented with the original language
 *     dropdown in the dialog. arg1: to language: the code for the language 
 *     to which we are translating. arg2: to language subtitle id, if they selected 
 * an existing subtitlelanguage. arg3: from subtitle language id: the id for the 
 * SubtitleLanguage to translate from. This will be null iff the user intends to make 
 *     forked/original. arg4: function to close the dialog.
 */
unisubs.startdialog.Dialog = function(videoID, initialLanguageState, callback) {
    goog.ui.Dialog.call(this, 'unisubs-modal-lang', true);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.videoID_ = videoID;
    this.fetchCompleted_ = false;
    this.model_ = null;
    this.initialLanguageState_ = initialLanguageState;
    this.callback_ = callback;
};
goog.inherits(unisubs.startdialog.Dialog, goog.ui.Dialog);

unisubs.startdialog.Dialog.FORK_VALUE = 'forkk';

unisubs.startdialog.Dialog.prototype.createDom = function() {
    unisubs.startdialog.Dialog.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom, 
                       this.getDomHelper());
    var el = this.getElement();
    el.appendChild(
        $d('h3', null, 'Create subtitles'));
    this.contentDiv_ = $d('div', null, "Loading...");
    el.appendChild(this.contentDiv_);
};

unisubs.startdialog.Dialog.prototype.enterDocument = function() {
    unisubs.startdialog.Dialog.superClass_.enterDocument.call(this);
    this.connectEvents_();
};

unisubs.startdialog.Dialog.prototype.setVisible = function(visible) {
    unisubs.startdialog.Dialog.superClass_.setVisible.call(this, visible);
    if (visible)
        unisubs.Rpc.call(
            'fetch_start_dialog_contents',
            { 'video_id': this.videoID_ },
            goog.bind(this.responseReceived_, this));
};



unisubs.startdialog.Dialog.prototype.makeDropdown_ = 
    function($d, contents, opt_className) 
{
var options = [];
    for (var i = 0; i < contents.length; i++){
         options.push($d('option', {'value': contents[i][0]}, contents[i][1]));
    }
    return $d('select', (opt_className || null), options);
};

unisubs.startdialog.Dialog.prototype.responseReceived_ = function(jsonResult) {
    this.fetchCompleted_ = true;
    this.model_ = new unisubs.startdialog.Model(jsonResult, this.initialLanguageState_);
    goog.dom.removeChildren(this.contentDiv_);
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());
    this.addOriginalLanguageSection_($d);
    this.addToLanguageSection_($d);
    this.addFromLanguageSection_($d);
    this.setFromContents_();
    this.warningElem_ = $d('p', 'warning');
    goog.dom.append(this.contentDiv_, this.warningElem_);
    goog.style.showElement(this.warningElem_, false);
    this.okButton_ = 
        $d('a', 
           {'href':'#', 
            'className': "unisubs-green-button unisubs-big"}, 
           'Continue');
    goog.dom.append(this.contentDiv_, this.okButton_);
    var clearDiv = $d('div');
    unisubs.style.setProperty(clearDiv, 'clear', 'both');
    clearDiv.innerHTML = "&nbsp;";
    this.contentDiv_.appendChild(clearDiv);
    this.reposition();
    this.connectEvents_();
    this.maybeShowWarning_();
};

unisubs.startdialog.Dialog.prototype.setFromContents_ = function() {
    var fromLanguages = this.model_.fromLanguages();
    goog.style.showElement(
        this.fromLanguageSection_, fromLanguages.length > 0);
    if (fromLanguages.length > 0) {
        var fromLanguageContents = goog.array.map(
            this.model_.fromLanguages(),
            function(l) {
                return [l.PK + '', l.toString()];
            });
        fromLanguageContents.push(
            [unisubs.startdialog.Dialog.FORK_VALUE,
             "Direct from video (more work)"]);
        var $d = goog.bind(this.getDomHelper().createDom,
                           this.getDomHelper());
        this.fromLanguageDropdown_ = this.makeDropdown_(
            $d, fromLanguageContents, "from-language");
        goog.dom.removeChildren(this.fromContainer_);
        this.fromContainer_.appendChild(this.fromLanguageDropdown_);
        this.getHandler().listen(
            this.fromLanguageDropdown_,
            goog.events.EventType.CHANGE,
            this.fromLanguageChanged_);
    }
    else {
        this.fromLanguageDropdown_ = null;
    }
};

unisubs.startdialog.Dialog.prototype.addToLanguageSection_ = function($d) {
    var toLanguageContents = goog.array.map(
        this.model_.toLanguages(),
        function(l) {
            return [l.KEY, l.toString(), l.LANGUAGE];
        });
    this.toLanguageDropdown_ = this.makeDropdown_(
        $d, toLanguageContents, "to-language");
    this.toLanguageDropdown_.value = this.model_.getSelectedLanguage().KEY;
    this.contentDiv_.appendChild(
        $d('p', null, 
           $d('span', null, 'Subtitle into: '),
           this.toLanguageDropdown_));
};

unisubs.startdialog.Dialog.prototype.addFromLanguageSection_ = function($d) {
    this.fromContainer_ = $d('span');
    this.fromLanguageSection_ =
        $d('div', null,
           $d('p', null,
              $d('span', null, 'Translate from: '),
              this.fromContainer_));
    this.contentDiv_.appendChild(this.fromLanguageSection_);
};

unisubs.startdialog.Dialog.prototype.addOriginalLanguageSection_ = function($d) {
    if (this.model_.originalLanguageShown()) {
        this.originalLangDropdown_ = this.makeDropdown_(
            $d, unisubs.languages, "original-language");
        this.originalLangDropdown_.value = 'en';
        this.model_.selectOriginalLanguage('en');
        this.contentDiv_.appendChild(
            $d('p', null, 
               $d('span', null, 'This video is in: '), 
               this.originalLangDropdown_));
    }
    else
        this.contentDiv_.appendChild(
            $d('p', null, "This video is in " + 
               unisubs.languageNameForCode(
                   this.model_.getOriginalLanguage())));
};

unisubs.startdialog.Dialog.prototype.connectEvents_ = function() {
    if (!this.isInDocument() || !this.fetchCompleted_)
        return;
    this.getHandler().
        listen(
            this.toLanguageDropdown_,
            goog.events.EventType.CHANGE,
            this.toLanguageChanged_).
        listen(
            this.okButton_,
            goog.events.EventType.CLICK,
            this.okClicked_);
    if (this.originalLangDropdown_)
        this.getHandler().listen(
            this.originalLangDropdown_,
            goog.events.EventType.CHANGE,
            this.originalLangChanged_);
};

unisubs.startdialog.Dialog.prototype.originalLangChanged_ = function(e) {
    this.model_.selectOriginalLanguage(this.originalLangDropdown_.value);
    this.setFromContents_();
};


unisubs.startdialog.Dialog.prototype.toLanguageChanged_ = function(e) {
    this.model_.selectLanguage(this.toLanguageDropdown_.value);
    this.setFromContents_();
    this.maybeShowWarning_();
};

unisubs.startdialog.Dialog.prototype.fromLanguageChanged_ = function(e) {
    this.maybeShowWarning_();
};

unisubs.startdialog.Dialog.prototype.maybeShowWarning_ = function() {
    var warning = null;
    if (this.fromLanguageDropdown_ && 
        this.fromLanguageDropdown_.value != 
        unisubs.startdialog.Dialog.FORK_VALUE)
        warning = this.warningMessage_();
    this.showWarning_(warning);
};

unisubs.startdialog.Dialog.prototype.showWarning_ = function(warning) {
    goog.dom.setTextContent(this.warningElem_, warning || '');
    goog.style.showElement(this.warningElem_, !!warning);
};

unisubs.startdialog.Dialog.prototype.warningMessage_ = function() {
    /**
     * @type {unisubs.startdialog.ToLanguage}
     */
    var toLanguage = this.model_.getSelectedLanguage();
    /**
     * @type {unisubs.startdialog.VideoLanguageLanguage}
     */
    var fromLanguage = this.model_.findFromForPK(
        parseInt(this.fromLanguageDropdown_.value));
    if (toLanguage.translationStartsFromScratch(fromLanguage)) {
        var message = "";
        if (toLanguage.VIDEO_LANGUAGE.DEPENDENT) {
            message = "The " + toLanguage.LANGUAGE_NAME + 
                " subtitles you selected were translated from " + 
                toLanguage.VIDEO_LANGUAGE.getStandardLang().languageName() + 
                ". ";
        }
        var bestLanguages = this.model_.bestLanguages(
            toLanguage.LANGUAGE, fromLanguage.LANGUAGE);
        if (bestLanguages != null) {
            message += "There is a better choice for translating into " +
                toLanguage.LANGUAGE_NAME + " from " + 
                fromLanguage.languageName() + ". ";            
        }
        else {
            message += "If you're translating into " + toLanguage.LANGUAGE_NAME + 
                " from " + fromLanguage.languageName() + ", you'll need to " +
                "start from scratch.";
        }
        return message;
    }
    return null;
};

unisubs.startdialog.Dialog.prototype.okClicked_ = function(e) {
    e.preventDefault();
    if (this.okHasBeenClicked_)
        return;
    this.okHasBeenClicked_ = true;
    var fromLanguageID = null;
    if (this.fromLanguageDropdown_ && 
        this.fromLanguageDropdown_.value != 
            unisubs.startdialog.Dialog.FORK_VALUE)
        fromLanguageID = parseInt(this.fromLanguageDropdown_.value);
    var toLanguage = this.model_.toLanguageForKey(
        this.toLanguageDropdown_.value);
    var that = this;
    this.callback_(
        this.model_.originalLanguageShown() ? 
            this.originalLangDropdown_.value : null,
        toLanguage.LANGUAGE,
        toLanguage.VIDEO_LANGUAGE ? toLanguage.VIDEO_LANGUAGE.PK : null,
        fromLanguageID,
        function() { that.setVisible(false); });
    goog.dom.setTextContent(this.okButton_, "Loading...");
    goog.dom.classes.add(this.okButton_, "unisubs-button-disabled");
};

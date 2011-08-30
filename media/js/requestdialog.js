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

goog.provide('unisubs.RequestDialog');

/**
 * @constructor
 * @param {string} videoID
 */
unisubs.RequestDialog = function(videoID) {
    goog.ui.Dialog.call(this, 'unisubs-modal-lang', true);
    this.setButtonSet(null);
    this.setDisposeOnHide(true);
    this.videoID_ = videoID;
    this.langMenuCount_ = 0;

    // Stores the languages of the user
    this.myLanguages_ = [];
    // Stores all availalbe languages for requesting subtitles.
    this.allLanguages_ = [];
    // Stores languages being requested
    this.requestLanguages_ = [];
    // Stores if the request should be tracked by the user
    this.track_ = true;
    // Stores the description for the request
    this.description_ = null;
    /**
     * Placeholder language option
     * @const
     * @type {string}
     */
    this.EMPTY_LANG_ = 'Select a language';
    /**
     * Message shown to user if they don't select a language
     * @const
     * @type {string}
     */
    this.EMPTY_LANG_WARNING_ = 'Please select a language to continue';
    /**
     * Message shown to user if they don't enter a description
     * @const
     * @type {string}
     */
    this.EMPTY_DESC_WARNING_ = 'Please provide a reason for your request';
    /**
     * Label for tracking request checkbox
     * @const
     * @type {string}
     */
    this.TRACK_REQUEST_LABEL_ = 'Subscribe to updates about this video';
    /**
     * The default content of request description text area
     * @const
     * @type {string}
     */
    this.DESCRIPTION_INITIAL_ = 'Tell us why you\'re requesting these subtitles';
    /**
     * Displayed on a successfull request submission
     * @const
     * @type {string}
     */
    this.SUBMISSION_CONFIRM_ = 'Your request has been submitted. Thanks!';
    /**
     * Error to be shown when the response from server is negetive
     * @const
     * @type {string}
     */
    this.SUBMIT_ERROR_ = 'We weren\'t able to process your request. Please try again.';
};
goog.inherits(unisubs.RequestDialog, goog.ui.Dialog);

unisubs.RequestDialog.prototype.createDom = function() {
    unisubs.RequestDialog.superClass_.createDom.call(this);
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());
    var el = this.getContentElement();
    this.headingDiv_ = $d('h3', null, 'Request subtitles');
    this.loadingDiv_ = $d('p', null, 'Loading...')
    this.contentDiv_ = $d('div', {'className':'unisubs-request-div'}, this.loadingDiv_);
    goog.dom.append(el, this.headingDiv_, this.contentDiv_);
};

unisubs.RequestDialog.prototype.enterDocument = function() {
    unisubs.RequestDialog.superClass_.enterDocument.call(this);
    this.connectEvents_();
};

unisubs.RequestDialog.prototype.setVisible = function(visible) {
    unisubs.startdialog.Dialog.superClass_.setVisible.call(this, visible);
    if (visible)
        unisubs.Rpc.call(
            'fetch_request_dialog_contents',
            { 'video_id': this.videoID_ },
            goog.bind(this.responseReceived_, this));
};

/**
 * Create a language select dropdown
 */
unisubs.RequestDialog.prototype.makeDropdown_ = function($d){
    var options = [];
    contents = this.allLanguages_
    options.push($d('option', {'value': ''}, this.EMPTY_LANG_));
    for (var i = 0; i < contents.length; i++){
         options.push($d('option', {'value': contents[i][0]}, contents[i][1]));
    }
    return $d('select', {'id':'unisubs-requestlang-'+ ++this.langMenuCount_}, options);
};

/**
 * Adds two dropdown to the dialog contents.
 * Each call creats two dropdowns.
 */
unisubs.RequestDialog.prototype.addDropdowns_ = function($d){
    goog.dom.append(this.langDiv_, this.makeDropdown_($d));
};

/**
 * Add the rest of the fields (tracking request, description) to the
 * form.
 */
unisubs.RequestDialog.prototype.addMetaForm_ = function($d){
    this.metaDiv_ = $d('div');
    this.checkBox_ = $d('input', {'type':'checkbox', 'checked':true, 'id':'unisubs-request-track'});
    this.checkBoxLabel_ = $d('label', {'for':'unisubs-request-track'}, this.TRACK_REQUEST_LABEL_);
    this.descriptionText_ = $d('textarea', { 'id':'unisubs-request-description' }, this.DESCRIPTION_INITIAL_);
    goog.dom.append(this.metaDiv_, this.descriptionText_,
                    this.checkBox_, this.checkBoxLabel_);
    goog.dom.append(this.contentDiv_, this.metaDiv_);
}

unisubs.RequestDialog.prototype.responseReceived_ = function(jsonResult) {
    this.fetchCompleted_ = true;

    //The data required to create the form
    this.myLanguages_ = jsonResult['my_languages'];
    this.allLanguages_ = jsonResult['all_languages'];
    // we need to sort on actul lang name, not lang code 
    // .i.e Spanish (es) should come after Danish (da)
    goog.array.sort( this.allLanguages_, function(a,b){
            return goog.array.defaultCompare(a[1], b[1]);
    });
    //Filter out duplicates from myLanguages list
    goog.array.removeDuplicates(this.myLanguages_);
    this.myLanguages_ = goog.array.filter(
        this.myLanguages_, function(l) {
            return !!unisubs.languageNameForCode(l);
        });

    // Create a Request object which will store the request relevent info.
    goog.dom.removeChildren(this.contentDiv_);
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());

    // Create the form
    this.warningElem_ = $d('p', 'warning');
    this.langDiv_ = $d('div', {'class':'unisubs-request-langs'}, $d('p', null, 'Your request will be submitted to our community of volunteers.'));
    this.addLangButton_ =
    $d('a',
           {'href':'#',
            'className': "unisubs-request-addlang"},
            'Add another language');
    this.okButton_ =
    $d('a',
           {'href':'#',
            'className': "unisubs-green-button unisubs-big",
            'style':'clear:both;'},
           'Request');
    this.closeButton_ =
    $d('a',
           {'href':'#',
            'className': "unisubs-green-button unisubs-big",
            'style':'clear:both;'},
           'Close');

    goog.dom.append(this.contentDiv_, this.warningElem_);
    goog.dom.append(this.contentDiv_, this.langDiv_);
    goog.style.showElement(this.warningElem_, false);
    this.addDropdowns_($d);
    goog.dom.append(this.contentDiv_, this.addLangButton_);
    this.addMetaForm_($d);
    goog.dom.append(this.contentDiv_, this.okButton_);
    this.clearDiv = $d('div');
    unisubs.style.setProperty(this.clearDiv, 'clear', 'both');
    this.clearDiv.innerHTML = "&nbsp;";
    this.contentDiv_.appendChild(this.clearDiv);
    this.reposition();
    this.connectEvents_();
};

unisubs.RequestDialog.prototype.connectEvents_ = function() {
    if (!this.isInDocument() || !this.fetchCompleted_)
        return;
    this.getHandler().
        listen(
            this.okButton_,
            goog.events.EventType.CLICK,
            this.okClicked_).
        listen(
            this.addLangButton_,
            goog.events.EventType.CLICK,
            this.addLangClicked_).
        listen(
            this.closeButton_,
            goog.events.EventType.CLICK,
            this.closeClicked_);
};

unisubs.RequestDialog.prototype.okClicked_ = function(e) {
    e.preventDefault();
    if (this.okHasBeenClicked_)
        goog.style.showElement(this.warningElem_, false);

    this.okHasBeenClicked_ = true;

    // Stores the languages selected from the select box in the model
    for (i = 1; i <= this.langMenuCount_; i++){
        var e = document.getElementById('unisubs-requestlang-' + i);
        var lang = e.options[e.selectedIndex].value
        if (lang){
            this.requestLanguages_.push(lang);
        }
    }

    // Submit the request if at least one language is there
    if (this.requestLanguages_.length > 0){
        var track = document.getElementById('unisubs-request-track').checked;
        var description = document.getElementById('unisubs-request-description').value;
        this.track_ = track;
        if (description != this.DESCRIPTION_INITIAL_){
            this.description_ = description;
            this.submitRequest(goog.bind(this.requestCallback_,
                                  this));
        } else {
            goog.dom.setTextContent(this.warningElem_, this.EMPTY_DESC_WARNING_);
            goog.style.showElement(this.warningElem_, true);
        }
    }
    else{
        goog.dom.setTextContent(this.warningElem_, this.EMPTY_LANG_WARNING_);
        goog.style.showElement(this.warningElem_, true);
    }
};


/**
 * Add more languages to the form
 */
unisubs.RequestDialog.prototype.addLangClicked_ = function(e) {
    e.preventDefault();
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());
    this.addDropdowns_($d);
    this.reposition();
};

/**
 * Close the request dialog
 */
unisubs.RequestDialog.prototype.closeClicked_ = function(e) {
    e.preventDefault();
    this.setVisible(false);
};

/**
 * Callback after a request has been posted.  
 * Notifies about successful or unsuccessful request
 */
unisubs.RequestDialog.prototype.requestCallback_ = function(jsonResult) {
    // If response has a key status, set to true, hide the dialog
    if (jsonResult["status"]){
        // Recreate the dialog with thank you message
        var $d = goog.bind(this.getDomHelper().createDom,
                           this.getDomHelper());
        goog.dom.removeChildren(this.contentDiv_);
        this.confirmDiv_ = $d('p', null, this.SUBMISSION_CONFIRM_);
        this.volunteerDiv_ = $d('p', null, 'Want to pitch in yourself? Visit our ',
                                $d('a', {"href": unisubs.siteURL() + '/volunteer/requested/' },
                                   "requests page"), '!');

        this.contentDiv_.appendChild(this.confirmDiv_);
        this.contentDiv_.appendChild(this.volunteerDiv_);
        this.contentDiv_.appendChild(this.closeButton_);
        this.contentDiv_.appendChild(this.clearDiv);
    }
    else{
        goog.dom.setTextContent(this.warningElem_, this.SUBMIT_ERROR_);
        goog.style.showElement(this.warningElem_, true);
    }
};

/**
 * Submit the request data generated by the form to the server.
 */
unisubs.RequestDialog.prototype.submitRequest = function(){
    var $d = goog.bind(this.getDomHelper().createDom,
                       this.getDomHelper());
    goog.dom.removeChildren(this.contentDiv_);
    this.contentDiv_.appendChild($d('div', {'className':'unisubs-request-div'}, this.loadingDiv_));

    unisubs.Rpc.call(
            'submit_subtitle_request',
            {
                'video_id':this.videoID_,
                'request_languages':this.requestLanguages_,
                'track_request':this.track_,
                'description':this.description_
            },
            goog.bind(this.requestCallback_, this));
};

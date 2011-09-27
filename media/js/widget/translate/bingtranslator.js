// Universal Subtitles, universalsubtitles.org
//
// Copyright (C) 2011 Participatory Culture Foundation
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


goog.require("goog.json");
goog.require("goog.net.Jsonp");
goog.provide('unisubs.translate.BingTranslator');
goog.provide('unisubs.translate.BingTranslator.Transaction');

unisubs.translate.BingTranslator.TRANSACTION_ID = 0;

/**
 * @constructor
 */
unisubs.translate.BingTranslator.Transaction = function() {
    ++unisubs.translate.BingTranslator.TRANSACTION_ID;
    this.id = unisubs.translate.BingTranslator.TRANSACTION_ID;
    this.actions = [];
    this.withError = false;
};

unisubs.translate.BingTranslator.Transaction.prototype.add = function(toTranslate, fromLang, toLang, widgets, callback){
    if (toTranslate.length > 0){
        this.actions.push([toTranslate, fromLang, toLang, this.getCallback_(widgets, callback)]);
    }
};

unisubs.translate.BingTranslator.Transaction.prototype.onError = function(response){
    if (!this.withError){
        this.withError = true;
        alert('Cannot complete automated translation. Error: "'+response['responseDetails']+'".');
    }
};

unisubs.translate.BingTranslator.Transaction.prototype.getCallback_ = function(widgets, callback) {
    var transaction = this;

    if (widgets.length && widgets[0].showLoadingIndicator) {
        goog.array.forEach(widgets, function(w){
            w.showLoadingIndicator();
        });
    }

    return function(response) {
        if (widgets.length && widgets[0].hideLoadingIndicator) {
            goog.array.forEach(widgets, function(w){
                w.hideLoadingIndicator();
            });
        }
        if (response) {
            var encoded = [];
            for (var i=0, len=response.length; i<len; i++) {
                encoded.push(response[i].TranslatedText);
            }

            callback(encoded, widgets);
        } else {
            transaction.onError(response);
            callback([], widgets, response['responseDetails']);
        }
    };
};

unisubs.translate.BingTranslator.Transaction.prototype.start = function(){
    for (var i=0, len=this.actions.length; i<len; i++){
        unisubs.translate.BingTranslator.translate.apply(null, this.actions[i]);
    }
};

/**
 * Bing app ID.
 * @const
 * @type {string}
 * @private
 */
unisubs.translate.BingTranslator.bingAppId_ = 'B97A24C0E08728B33D41E853C50D405E50E46563';

/**
 * Uri for jsonp handler
 * @type {goog.Uri}
 */
unisubs.translate.BingTranslator.baseUri_ = new goog.Uri("http://api.microsofttranslator.com/V2/Ajax.svc/TranslateArray");

/**
 * Jsonp handler for Bing Translator API
 * @type {goog.net.Jsonp}
 */
unisubs.translate.BingTranslator.jsonp = new goog.net.Jsonp(unisubs.translate.BingTranslator.baseUri_, 'oncomplete');

/**
 * Maximum length of the request to Bing
 * @type {number}
 */
unisubs.translate.BingTranslator.queryMaxLen = 10000;

/**
 * Look up the Bing language code for the given language code.
 * @param {string} lang Language code to look up
 * @return {string}
 */
unisubs.translate.BingTranslator.findLang = function(lang) {
    if (lang === 'zh-cn') {
        return 'zh-CHS';
    } else if (lang === 'zh-tw') {
        return 'zh-CHT';
    } else {
        return lang;
    }
};

/**
 * Send request to Bing Translating API
 * @param {Array.<string>} texts Array of strings to translate
 * @param {string=} fromLang Language code of text to translate, left empty for auto-detection
 * @param {string} toLang Language code for language of result
 * @param {function({Object})} callback Callback
 */
unisubs.translate.BingTranslator.translate = function(texts, fromLang, toLang, callback) {
    var textArrayString = goog.json.serialize(texts);
    var from = fromLang ? unisubs.translate.BingTranslator.findLang(fromLang) : '';
    var to = unisubs.translate.BingTranslator.findLang(toLang);

    unisubs.translate.BingTranslator.jsonp.send({
        'appId': unisubs.translate.BingTranslator.bingAppId_,
        'texts': textArrayString,
        'from': from,
        'to': to
    }, callback, function() {
        // TODO: show pretty error
        // Translating service is unavailable. Try later.
    });
};

/**
 * Find the effective length of the request for the given strings to translate.
 * @param {Array.<string>} texts Strings to translate
 * @return {number}
 */
unisubs.translate.BingTranslator.effectiveTextLength = function(texts) {
    return (200                       // request overhead
            + (4 * texts.length) + 2  // json encoding overhead
            + texts.join('').length); // length of strings
};

/**
 * Transalte subtitles from widgets with BingTranslator.translate
 * @param {Array.<unisubs.translate.TranslationWidget>} needTranslating
 * @param {?string} fromLang Language code of text to translate, left empty for auto-detection
 * @param {string} toLang Language code for language of result
 * @param {function(Array.<string>, Array.<unisubs.translate.TranslationWidget>, ?string)} callback
 */
unisubs.translate.BingTranslator.translateWidgets =
function(needTranslating, fromLang, toLang, callback) {
    var ml = unisubs.translate.BingTranslator.queryMaxLen;
    var translate = unisubs.translate.BingTranslator.translate;
    var effectiveLen = unisubs.translate.BingTranslator.effectiveTextLength;

    // ml = 1000; // for debugging multiple requests

    /**
     * Array of subtitles to translate in one request(max length < BingTranslator.queryMaxLen)
     * @type {Array.<string>}
     */
    var toTranslate = [];
    /**
     * Widgets with subtitles to translate in one request
     * @type {Array.<unisubs.translate.TranslationWidget>}
     */
    var widgetsToTranslate = [];
    var transaction = new unisubs.translate.BingTranslator.Transaction();

    goog.array.forEach(needTranslating, function(w) {
        /**
         * @type {string}
         */
        var t = w.getOriginalValue();

        toTranslate.push(t);
        widgetsToTranslate.push(w);

        if (effectiveLen(toTranslate) >= ml) {
            toTranslate.pop();
            widgetsToTranslate.pop();

            transaction.add(toTranslate, fromLang, toLang, widgetsToTranslate, callback);

            if (t.length > ml) {
                toTranslate = widgetsToTranslate = [];
            } else {
                toTranslate = [t];
                widgetsToTranslate = [w];
            }
        }
    });
    if (toTranslate.length) {
        transaction.add(toTranslate, fromLang, toLang, widgetsToTranslate, callback);
    }
    transaction.start();
};

unisubs.translate.BingTranslator.isTranslateable = function() {
    if (!unisubs.translate.BingTranslator.Languages_ ) {
        /*
         * @private
         */
        unisubs.translate.BingTranslator.Languages_ = new goog.structs.Set([
            'ar', 'cs', 'da', 'de', 'en', 'et', 'fi', 'fr', 'nl', 'el', 'he',
            'ht', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'no', 'pl', 'pt',
            'ro', 'es', 'ru', 'sk', 'sl', 'sv', 'th', 'tr', 'uk', 'vi',
            'zh-cn', 'zh-tw', '']);
    }
    return unisubs.translate.BingTranslator.Languages_.containsAll(arguments);
};

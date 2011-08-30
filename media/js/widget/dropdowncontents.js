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

goog.provide('unisubs.widget.DropDownContents');

/**
 * @constructor
 */
unisubs.widget.DropDownContents = function(languages, myLanguages,  isModerated) {
    /**
     * @type {Array.<unisubs.startdialog.VideoLanguage>}
     */
    this.LANGUAGES = goog.array.map(languages, function(l) {
        return new unisubs.startdialog.VideoLanguage(l);
    });
    var allToLower = function(arr) {
        return goog.array.map(arr, function(i) { return i.toLowerCase(); });
    };
    /**
     * @type {Array.<string>} 
     */
    this.LANGUAGE_CODES_ = allToLower(
        goog.array.map(languages, function(l) { 
            return l['language']; 
        }));
    /**
     * @type {Array.<string>}
     */
    this.MY_LANGUAGES = allToLower(myLanguages);
    /**
     * @type {bool}
     */
    this.IS_MODERATED = isModerated;
};

unisubs.widget.DropDownContents.prototype.shouldShowRequestLink = function() {
    var allMyLanguagesMissing = goog.array.every(
        this.MY_LANGUAGES,
        function(l) {
            return !goog.array.contains(this.LANGUAGE_CODES_, l);
        },
        this);
    return this.LANGUAGES.length <= 3 || allMyLanguagesMissing;
        
};
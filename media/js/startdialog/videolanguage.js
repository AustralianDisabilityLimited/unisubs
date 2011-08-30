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

goog.provide('unisubs.startdialog.VideoLanguage');

/**
 * @constructor
 */
unisubs.startdialog.VideoLanguage = function(json) {
    this.PK = json['pk'];
    this.LANGUAGE = json['language'];
    this.DEPENDENT = json['dependent'];
    this.IS_COMPLETE = json['is_complete'];
    this.PERCENT_DONE = json['percent_done'];
    this.STANDARD_PK = json['standard_pk'];
    this.SUBTITLE_COUNT = json['subtitle_count'];
    this.IN_PROGRESS = json['in_progress'];
};

unisubs.startdialog.VideoLanguage.prototype.languageName = function() {
    return this.LANGUAGE ? 
        unisubs.languageNameForCode(this.LANGUAGE) : "Original";
};

unisubs.startdialog.VideoLanguage.prototype.toString = function() {
    var name = this.languageName();

    if (!this.DEPENDENT && this.SUBTITLE_COUNT > 0)
        name += (this.IS_COMPLETE ? " (100%)" : " (incomplete)");
    else if (this.DEPENDENT && this.PERCENT_DONE > 0)
        name += " (" + this.PERCENT_DONE + "%)";
    return name + (this.IN_PROGRESS ? " (in progress)" : "");
};

unisubs.startdialog.VideoLanguage.prototype.completionStatus = function() {
    return "(" +
        (this.DEPENDENT ? (this.PERCENT_DONE + "%") : 
         (this.SUBTITLE_COUNT + " lines")) + ")";
};

unisubs.startdialog.VideoLanguage.prototype.setAll = function(all) {
    this.allLangs_ = all;
    if (this.STANDARD_PK)
        this.standardLang_ = goog.array.find(
            this.allLangs_, 
            function(lang) { return lang.PK == this.STANDARD_PK; },
            this);
};

/**
 * @returns {?unisubs.startdialog.VideoLanguage}
 */
unisubs.startdialog.VideoLanguage.prototype.getStandardLang = function() {
    return this.standardLang_;
};

unisubs.startdialog.VideoLanguage.prototype.isDependentAndNonempty = function(partial) {
    if (partial)
        return this.DEPENDENT && this.PERCENT_DONE > 0 && this.PERCENT_DONE < 100;
    else
        return this.DEPENDENT && this.PERCENT_DONE == 100;
};

unisubs.startdialog.VideoLanguage.prototype.isEmpty = function() {
    return this.DEPENDENT && this.PERCENT_DONE == 0;
};

unisubs.startdialog.VideoLanguage.prototype.isDependable = function() {
    if (this.DEPENDENT)
        return this.getStandardLang() && this.getStandardLang().IS_COMPLETE && this.PERCENT_DONE > 10;
    else
        return this.IS_COMPLETE;
};

unisubs.startdialog.VideoLanguage.prototype.canBenefitFromTranslation = 
    function(toTranslateFrom) 
{
    if (!this.DEPENDENT)
        return false;
    if (toTranslateFrom.DEPENDENT)
        return this.STANDARD_PK == toTranslateFrom.STANDARD_PK;
    else
        return this.STANDARD_PK == toTranslateFrom.PK;
};

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

goog.provide('unisubs.startdialog.ToLanguage');

/**
 * @constructor
 */
unisubs.startdialog.ToLanguage = function(ranking, opt_videoLanguage, opt_language) {
    var languageCode = opt_videoLanguage ? opt_videoLanguage.LANGUAGE : opt_language;
    this.LANGUAGE = languageCode;
    this.KEY = languageCode + (opt_videoLanguage ? ('' + opt_videoLanguage.PK) : '');
    this.LANGUAGE_NAME = unisubs.languageNameForCode(languageCode);
    this.RANKING = ranking;
    this.VIDEO_LANGUAGE = opt_videoLanguage;
};

unisubs.startdialog.ToLanguage.prototype.toString = function() {
    if (this.VIDEO_LANGUAGE)
        return this.VIDEO_LANGUAGE.toString();
    else
        return this.LANGUAGE_NAME;
};

/**
 * @param {unisubs.startdialog.VideoLanguage} fromLanguage
 */
unisubs.startdialog.ToLanguage.prototype.translationStartsFromScratch = 
    function(fromLanguage) 
{
    if (!this.VIDEO_LANGUAGE || this.VIDEO_LANGUAGE.isEmpty())
        return false;
    if (!this.VIDEO_LANGUAGE.DEPENDENT)
        return true;
    if (!this.VIDEO_LANGUAGE.canBenefitFromTranslation(fromLanguage))
        return true;
    return false;
};

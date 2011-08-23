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

goog.provide('unisubs.widget.BaseState');

/**
 * @fileoverview Provides a strongly-typed version of base state params 
 *     passed in from page
 *
 */


/**
 * @constructor
 * @param {Object} baseStateParam parameter from the embed code on the page.
 */
unisubs.widget.BaseState = function(baseStateParam) {
    this.LANGUAGE = baseStateParam['language_code'];
    this.LANGUAGE_PK = baseStateParam['language_pk'];
    if (typeof(this.LANGUAGE) == 'undefined')
        this.LANGUAGE = null;
    this.REVISION = baseStateParam['revision'];
    if (typeof(this.REVISION) == 'undefined')
        this.REVISION = null;
    this.START_PLAYING = !!baseStateParam['start_playing'];
    this.ORIGINAL_PARAM = baseStateParam;
};

unisubs.widget.BaseState.createParams = function(opt_language, opt_revision) {
    var params = {};
    if (opt_language != null)
        params['language'] = opt_language;
    if (opt_revision != null)
        params['revision'] = opt_revision;
    return params;
};

/**
 * Either language code, or null for native language.
 * @type {?string}
 */
unisubs.widget.BaseState.prototype.LANGUAGE = null;

/**
 * Either the revision number, or null for most recent revision.
 * @type {?number}
 */
unisubs.widget.BaseState.prototype.REVISION = null;

/**
 * The original parameter object from javascript on page.
 * @type {?object}
 */
unisubs.widget.BaseState.prototype.ORIGINAL_PARAM = null;

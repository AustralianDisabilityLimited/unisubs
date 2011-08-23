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

goog.provide('unisubs.api.ServerModel');

/**
 * @constructor
 */
unisubs.api.ServerModel = function(config) {
    this.config_ = config;
    /**
     * @type {function(string)} Gets called with json array 
     *     of all subs when subs are saved.
     */
    this.save_ = config['save'];
    /**
     * @type {string} Permalink to video page.
     */
    this.permalink_ = config['permalink'];
    /**
     * @type {function()} Login function
     */
    this.login_ = config['login'];
    /**
     * @type {string}
     */
    this.embedCode_ = config['embedCode'];
};

unisubs.api.ServerModel.prototype.init = function(unitOfWork) {
    // no-op
};

unisubs.api.ServerModel.prototype.finish = function(
    jsonSubs, callback, opt_cancelCallback) {
    this.save_(jsonSubs, callback, opt_cancelCallback);
};

/**
 * Instances implementing this interface must extend goog.Disposable
 */
unisubs.api.ServerModel.prototype.dispose = function() {
    // no-op
};

unisubs.api.ServerModel.prototype.getEmbedCode = function() {
    return this.embedCode_;
};

unisubs.api.ServerModel.prototype.currentUsername = function() {
    return unisubs.currentUsername;
};

unisubs.api.ServerModel.prototype.logIn = function() {
    this.login_();
};

unisubs.api.ServerModel.prototype.getPermalink = function() {
    return this.permalink_;
};
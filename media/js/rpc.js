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


goog.provide('unisubs.Rpc');

/**
 * In milliseconds
 * @type {number}
 */
unisubs.Rpc.TIMEOUT_ = 30000;

if (goog.DEBUG) {
    unisubs.Rpc.logger_ =
        goog.debug.Logger.getLogger('unisubs.Rpc');
}

unisubs.Rpc.baseURL = function() {
    return [unisubs.siteURL(), 
            '/widget/',
            unisubs.IS_NULL ? 'null_' : '',
            'rpc/'].join('');
};

unisubs.Rpc.callXhr_ = function(methodName, serializedArgs, opt_callback, opt_errorCallback) {
    goog.net.XhrIo.send(
        [unisubs.Rpc.baseURL(), 'xhr/', methodName].join(''),
        function(event) {
            if (!event.target.isSuccess()) {
                var status = null;
                if (event.target.getLastErrorCode() != goog.net.ErrorCode.TIMEOUT)
                    status = event.target.getStatus();
                if (opt_errorCallback)
                    opt_errorCallback(status);
            }
            else {
                unisubs.Rpc.logResponse_(
                    methodName, 
                    event.target.getResponseText());
                if (opt_callback)
                    opt_callback(event.target.getResponseJson());
            }
        },
        "POST", 
        unisubs.Rpc.encodeKeyValuePairs_(serializedArgs),
        null, unisubs.Rpc.TIMEOUT_);
};

unisubs.Rpc.encodeKeyValuePairs_ = function(serializedArgs) {
    var queryData = new goog.Uri.QueryData();
    for (var param in serializedArgs)
        queryData.set(param, serializedArgs[param]);
    return queryData.toString();
};

unisubs.Rpc.callWithJsonp_ = function(methodName, serializedArgs, opt_callback, opt_errorCallback) {
    var jsonp = new goog.net.Jsonp(
        [unisubs.Rpc.baseURL(), 'jsonp/', methodName].join(''));
    jsonp.setRequestTimeout(unisubs.Rpc.TIMEOUT_);
    jsonp.send(
        serializedArgs,
        function(result) {
            if (unisubs.DEBUG)
                unisubs.Rpc.logResponse_(
                    methodName, goog.json.serialize(result));
            if (opt_callback)
                opt_callback(result);
        },
        function(errorPayload) {
            if (opt_errorCallback)
                opt_errorCallback();
        });
};

unisubs.Rpc.logCall_ = function(methodName, args, channel) {
    if (goog.DEBUG) {
        unisubs.Rpc.logger_.info(
            ['calling ', methodName, ' with ', channel,
             ': ', goog.json.serialize(args)].join(''));
    }
};

unisubs.Rpc.logResponse_ = function(methodName, response) {
    if (goog.DEBUG) {
        if (unisubs.DEBUG)
            unisubs.Rpc.logger_.info(
                [methodName, ' response: ', response].join(''));
    }
};

/**
 *
 * @param {function(?number)=} opt_errorCallback Gets called on error. 
 *     Will include http code if there was a server error and a 
 *     descriptive strategy is used
 * @param {boolean=} opt_forceDescriptive This forces a call strategy 
 *     that returns an http code to opt_errorCallback on server error.
 *     Right now, this means that cross-domain uses CrossDomainRpc instead
 *     of rpc.
 */
unisubs.Rpc.call = 
    function(methodName, args, opt_callback, opt_errorCallback, opt_forceDescriptive) 
{
    var s = goog.json.serialize;
    var serializedArgs = {};
    var arg;
    var totalSize = 0;
    for (var param in args) {
        arg = s(args[param]);
        serializedArgs[param] = arg;
        totalSize += arg.length;
    }
    var callType = ''
    if (unisubs.isEmbeddedInDifferentDomain()) {
        goog.asserts.assert(!opt_forceDescriptive);
        callType = 'jsonp';
        unisubs.Rpc.callWithJsonp_(
            methodName, serializedArgs, 
            opt_callback, opt_errorCallback);
    } else {
        callType = 'xhr';
        unisubs.Rpc.callXhr_(
            methodName, serializedArgs, 
            opt_callback, opt_errorCallback);
    }
    unisubs.Rpc.logCall_(methodName, args, callType);
};


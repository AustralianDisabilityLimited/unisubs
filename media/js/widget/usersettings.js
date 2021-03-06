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

goog.provide('unisubs.UserSettings');

/**
 * @fileoverview To be expanded in the future.
 */

unisubs.UserSettings = {};

unisubs.UserSettings.Settings = {
    SKIP_HOWTO_VIDEO: 'skiphowto',
    VIDEO_SPEED_MODE: 'videospeedmode'
};

unisubs.UserSettings.setBooleanValue = function(setting, value) {
    if (goog.net.cookies.isEnabled())
        goog.net.cookies.set(setting, value ? "1" : "0", 86400 * 365 * 2);
};

unisubs.UserSettings.getBooleanValue = function(setting) {
    if (goog.net.cookies.isEnabled())
        return goog.net.cookies.get(setting) == "1";
    else
        return false;
};

unisubs.UserSettings.setStringValue = function(setting, value) {
    if (goog.net.cookies.isEnabled())
        goog.net.cookies.set(setting, value, 86400 * 365 * 2);
};

unisubs.UserSettings.getStringValue = function(setting) {
    if (goog.net.cookies.isEnabled())
        return goog.net.cookies.get(setting);
    else
        return null;
};

unisubs.UserSettings.setFloatValue = function(setting, value) {
    if (goog.net.cookies.isEnabled())
        goog.net.cookies.set(setting, value);
};

unisubs.UserSettings.getFloatValue = function(setting, ifNanVal) {
    var val = null;
    if (goog.net.cookies.isEnabled()){
        val = parseFloat(goog.net.cookies.get(setting));
        if (isNaN(val) && goog.isDefAndNotNull(ifNanVal)){
            val =  ifNanVal;
        }

    }
    return val;    
};

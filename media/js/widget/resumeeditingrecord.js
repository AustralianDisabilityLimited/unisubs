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

goog.provide('unisubs.widget.ResumeEditingRecord');

/**
 * @constructor
 */
unisubs.widget.ResumeEditingRecord = function(videoID, sessionPK, openDialogArgs) {
    this.videoID_ = videoID;
    this.sessionPK_ = sessionPK;
    this.openDialogArgs_ = openDialogArgs;
};

unisubs.widget.ResumeEditingRecord.STORAGE_KEY_ = "_unisubs_editing";
unisubs.widget.ResumeEditingRecord.VERSION_ = 1;

unisubs.widget.ResumeEditingRecord.prototype.getVideoID = function() {
    return this.videoID_;
};

unisubs.widget.ResumeEditingRecord.prototype.getOpenDialogArgs = function() {
    return this.openDialogArgs_;
};

unisubs.widget.ResumeEditingRecord.prototype.matches = function(videoID, openDialogArgs) {
    return videoID == this.videoID_ &&
        this.openDialogArgs_.matches(openDialogArgs);
};

unisubs.widget.ResumeEditingRecord.prototype.save = function() {
    // Important note: if you ever change these serialized fields, also
    // change unisubs.widget.ResumeEditingRecord.VERSION_.
    // That way new releases won't break saved subs in users' 
    // browsers -- it will simply invalidate them.
    unisubs.saveInLocalStorage(
        unisubs.widget.ResumeEditingRecord.STORAGE_KEY_,
        goog.json.serialize({
            'version': unisubs.widget.ResumeEditingRecord.VERSION_,
            'videoID': this.videoID_,
            'sessionPK': this.sessionPK_,
            'openDialogArgs': this.openDialogArgs_.toObject()
        }));
        
};

unisubs.widget.ResumeEditingRecord.prototype.getSavedSubtitles = function() {
    if (!this.savedSubtitles_) {
        var savedSubtitles = unisubs.widget.SavedSubtitles.fetchLatest();
        if (savedSubtitles && savedSubtitles.SESSION_PK == this.sessionPK_)
            this.savedSubtitles_ = savedSubtitles;
        else
            this.savedSubtitles_ = null;
    }
    return this.savedSubtitles_;
};

unisubs.widget.ResumeEditingRecord.clear = function() {
    unisubs.removeFromLocalStorage(
        unisubs.widget.ResumeEditingRecord.STORAGE_KEY_);
};

unisubs.widget.ResumeEditingRecord.fetch = function() {
    var jsonText = unisubs.fetchFromLocalStorage(
        unisubs.widget.ResumeEditingRecord.STORAGE_KEY_);
    if (jsonText) {
        var obj = goog.json.parse(jsonText);
        if (goog.isDefAndNotNull(obj['version']) &&
            obj['version'] == unisubs.widget.ResumeEditingRecord.VERSION_) {
            return new unisubs.widget.ResumeEditingRecord(
                obj['videoID'],
                obj['sessionPK'], 
                unisubs.widget.OpenDialogArgs.fromObject(
                    obj['openDialogArgs']));
        }
        else {
            return null;
        }
    }
    else {
        return null;
    }
};
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

goog.provide('unisubs.widget.SavedSubtitles');

/**
 * @constructor
 * @param {!number} sessionPK
 * @param {!unisubs.subtitle.EditableCaptionSet} captionSet
 */
unisubs.widget.SavedSubtitles = function(sessionPK, captionSet) {
    /**
     * @const
     * @type {!number}
     */
    this.SESSION_PK = sessionPK;
    /**
     * @const
     * @type {!unisubs.subtitle.EditableCaptionSet}
     */
    this.CAPTION_SET = captionSet;
};

unisubs.widget.SavedSubtitles.STORAGEKEY_ = '_unisubs_work';
unisubs.widget.SavedSubtitles.VERSION_ = 1;

unisubs.widget.SavedSubtitles.prototype.serialize = function() {
    // Important note: if you ever change these serialized fields, also
    // change unisubs.widget.SavedSubtitles.VERSION_.
    // That way new releases won't break saved subs in users' 
    // browsers -- it will simply invalidate them.
    return goog.json.serialize(
        { 'version': unisubs.widget.SavedSubtitles.VERSION_,
          'sessionPK': this.SESSION_PK,
          'title': this.CAPTION_SET.title,
          'isComplete': this.CAPTION_SET.completed,
          'forked': this.CAPTION_SET.wasForkedDuringEdits(),
          'captionSet': this.CAPTION_SET.makeJsonSubs() });
};

unisubs.widget.SavedSubtitles.deserialize = function(json) {
    var obj = goog.json.parse(json);
    if (goog.isDefAndNotNull(obj['version']) &&
        obj['version'] == unisubs.widget.SavedSubtitles.VERSION_) {
        return new unisubs.widget.SavedSubtitles(
            obj['sessionPK'], 
            new unisubs.subtitle.EditableCaptionSet(
                obj['captionSet'], obj['isComplete'], obj['title'], 
                obj['forked']));
    }
    else {
        return null;
    }
};

unisubs.widget.SavedSubtitles.saveInitial = function(savedSubs) {
    unisubs.widget.SavedSubtitles.save_(0, savedSubs);
};

unisubs.widget.SavedSubtitles.saveLatest = function(savedSubs) {
    unisubs.widget.SavedSubtitles.save_(1, savedSubs);
};

unisubs.widget.SavedSubtitles.fetchInitial = function() {
    return unisubs.widget.SavedSubtitles.fetchSaved_(0);
};

unisubs.widget.SavedSubtitles.fetchLatest = function() {
    return unisubs.widget.SavedSubtitles.fetchSaved_(1);
};

unisubs.widget.SavedSubtitles.save_ = function(index, savedSubs) {
    var key = unisubs.widget.SavedSubtitles.STORAGEKEY_ + index;
    var value = savedSubs.serialize();
    unisubs.saveInLocalStorage(key, value);
};

unisubs.widget.SavedSubtitles.fetchSaved_ = function(index) {
    var savedSubsText = unisubs.fetchFromLocalStorage(
        unisubs.widget.SavedSubtitles.STORAGEKEY_ + index);
    if (savedSubsText)
        return unisubs.widget.SavedSubtitles.deserialize(savedSubsText);
    else
        return null;
};

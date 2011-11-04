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

goog.provide('unisubs.reviewsubtitles.ReviewSubtitlesRightPanel');


/**
 * @constructor
 * @extends unisubs.RightPanel
 */
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel = function(
    serverModel, helpContents, legendKeySpecs, showRestart, doneStrongText, doneText) {
    unisubs.RightPanel.call(this, serverModel, helpContents, null,
                            legendKeySpecs, showRestart, doneStrongText, doneText);

    this.showSaveExit = false;
    this.showDoneButton = false;
};
goog.inherits(unisubs.reviewsubtitles.ReviewSubtitlesRightPanel, unisubs.RightPanel);

/**
 * Values for approval stages.
 * @const
 * @type {object}
 * @private
 */
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.APPROVAL_STAGES_ = {
    'In Progress': 10,
    'Approved': 20,
    'Rejected': 30
};

unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.appendMiddleContentsInternal = function($d, el) {
    el.appendChild($d('label', {'class': 'unisubs-review-notes-label', 'for': 'unisubs-review-notes'}, 'Notes'));

    this.bodyInput_ = $d('textarea', {'class': 'unisubs-review-notes', 'id': 'unisubs-review-notes', 'name': 'notes'});
    el.appendChild(this.bodyInput_);

    var that = this;
    this.serverModel_.fetchReviewData(unisubs.task_id, function(body) {
        goog.dom.forms.setValue(that.bodyInput_, body);
    });

    el.appendChild($d('hr'));

    this.reassignLink_ = $d('a', {'href': unisubs.team_url}, 'reassign this task');
    this.editedVersionLink_ = $d('a', {'href': '#'}, 'submit an edited version');

    el.appendChild($d('p', null,
                      'You can also ',
                      this.reassignLink_,
                      ' to someone else, or ',
                      this.editedVersionLink_,
                      ' yourself.',
                      ' If you submit a new version it will also be subject to review.'
                  ));

    var handler = this.getHandler();
    handler.listen(this.reassignLink_, 'click', this.reassignLinkClicked_);
    handler.listen(this.editedVersionLink_, 'click', this.editedVersionLinkClicked_);
};
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.appendCustomButtonsInternal = function($d, el) {
    this.approveButton_ = $d('a', {'class': 'unisubs-done'}, 'Approve');
    this.sendBackButton_ = $d('a', {'class': 'unisubs-done'}, 'Send Back');

    el.appendChild(this.sendBackButton_);
    el.appendChild(this.approveButton_);

    var handler = this.getHandler();
    handler.listen(this.approveButton_, 'click', this.approveButtonClicked_);
    handler.listen(this.sendBackButton_, 'click', this.sendBackButtonClicked_);
};

unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.approveButtonClicked_ = function(e){
    e.preventDefault();

    this.serverModel_.finishReview({
        'task_id': unisubs.task_id,
        'body': goog.dom.forms.getValue(this.bodyInput_),
        'approved': unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.APPROVAL_STAGES_['Approved']});
};
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.sendBackButtonClicked_ = function(e){
    e.preventDefault();

    this.serverModel_.finishReview({
        'task_id': unisubs.task_id,
        'body': goog.dom.forms.getValue(this.bodyInput_),
        'approved': unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.APPROVAL_STAGES_['Rejected']});
};
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.reassignLinkClicked_ = function(e){
};
unisubs.reviewsubtitles.ReviewSubtitlesRightPanel.prototype.editedVersionLinkClicked_ = function(e){
    e.preventDefault();

    alert("o hai");
};

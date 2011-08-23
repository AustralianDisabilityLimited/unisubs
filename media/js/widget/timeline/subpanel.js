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

goog.provide('unisubs.timeline.SubPanel');

/**
 * @constructor
 * @param {number} spacing Space between major ticks, in seconds.
 */
unisubs.timeline.SubPanel = function(spacing) {
    goog.ui.Component.call(this);
    this.pixelsPerSecond_ = unisubs.timeline.TimeRowUL.PX_PER_TICK / spacing;    
};
goog.inherits(unisubs.timeline.SubPanel, goog.ui.Component);
unisubs.timeline.SubPanel.prototype.createDom = function() {
    unisubs.timeline.SubPanel.superClass_.createDom.call(this);
    this.getElement().className = 'unisubs-subpanel';
    var i, div;
    var el = this.getElement();
    for (i = 0; i < 1000; i++) {
        div = document.createElement('div');
        unisubs.style.setPosition(div, i * this.pixelsPerSecond_ * 5, null);
        unisubs.style.setWidth(this.pixelsPerSecond_ * 2.5);
        div.innerHTML = '' + i;
        el.appendChild(div);
    }
};

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

goog.provide('unisubs.Extension');

/**
 * @constructor
 */
unisubs.Extension = function() {
    this.shown_ = false;
    var element = document.createElement('unisubsExtensionLoaded');
    document.documentElement.appendChild(element);
    var evt = document.createEvent('Events');
    evt.initEvent("unisubsExtensionLoadedEvent", true, false);
    element.dispatchEvent(evt);
    this.show_(evt.target.getAttribute('enabled') == 'true');
};
goog.addSingletonGetter(unisubs.Extension);

unisubs.Extension.prototype.show_ = function(enabled) {
    if (this.shown_)
        return;
    this.shown_ = true;
    // I just removed the videosExist method from Widgetizer, since it no longer makes sense.
    // When this is worked on again, this should first check for widgetizedVideos, then
    // subscribe to an event from Widgetizer that gets fired whenever a new widgetized 
    // video is found on the page.
    if (unisubs.Widgetizer.getInstance().videosExist())
        this.addElementToPage_(enabled);
    if (enabled)
        unisubs.Widgetizer.getInstance().widgetize();
};

unisubs.Extension.prototype.addElementToPage_ = function(enabled) {
    this.enabled_ = enabled;
    unisubs.Widgetizer.getInstance().addHeadCss();
    var $d = goog.dom.createDom;
    var $t = goog.dom.createTextNode;
    this.enableLink_ = this.createEnableLink_($d);
    this.reportProblemLink_ = this.createReportProblemLink_($d);
    this.learnMoreLink_ = this.createLearnMoreLink_($d);
    this.enabledSpan_ = $d('span', null, this.enabledSpanText_());
    this.element_ = $d('div', 'unisubs-extension' + 
                       (enabled ? ' unisubs-extension-enabled' : ''),
                       $d('span', null, 'Universal Subtitles Addon '),
                       this.enabledSpan_,
                       $d('span', null, ' '),
                       this.enableLink_,
                       $t(' / '),
                       this.reportProblemLink_,
                       $t(' / '),
                       this.learnMoreLink_);
    document.body.appendChild(this.element_);
    goog.events.listen(this.enableLink_, 'click',
                       this.enableClicked_, false, this);
};

unisubs.Extension.prototype.enableClicked_ = function(e) {
    e.preventDefault();
    this.enabled_ = !this.enabled_;
    goog.dom.setTextContent(this.enableLink_, this.enableLinkText_());
    goog.dom.setTextContent(this.enabledSpan_, this.enabledSpanText_());
    goog.dom.classes.enable(
        this.element_, 'unisubs-extension-enabled', this.enabled_);

    if (!this.toggleElement_) {
        this.toggleElement_ = document.createElement('unisubsExtensionToggled');
        document.documentElement.appendChild(this.toggleElement_);
    }
    this.toggleElement_.setAttribute(
        'enabled', this.enabled_ ? 'true' : 'false');
    var evt = document.createEvent('Events');
    evt.initEvent("unisubsExtensionToggledEvent", true, false);
    this.toggleElement_.dispatchEvent(evt);

    if (this.enabled_)
        unisubs.Widgetizer.getInstance().widgetize();
};

unisubs.Extension.prototype.createEnableLink_ = function($d) {
    return $d('a', {'href':'#'}, this.enableLinkText_());
};

unisubs.Extension.prototype.enableLinkText_ = function() {
    return this.enabled_ ? 'disable' : 'enable';
};

unisubs.Extension.prototype.enabledSpanText_ = function() {
    return this.enabled_ ? "Enabled!" : "Disabled";
};

unisubs.Extension.prototype.createReportProblemLink_ = function($d) {
    var message = 
        'I had a problem with the Universal Subtitles Firefox ' +
        'extension on this page: ' + 
        window.location.href;
    var uri = new goog.Uri(unisubs.Config.siteConfig['siteURL'] + 
                           '/videos/site_feedback/');
    uri.setParameterValue('text', message);
    return $d('a', {'href': uri.toString(), 
                    'target': unisubs.randomString()},
              'report problem');
};

unisubs.Extension.prototype.createLearnMoreLink_ = function($d) {
    return $d('a', {'href': 'http://universalsubtitles.org', 
                    'target': unisubs.randomString()},
              'learn more');
};

(function() {
    var extension = unisubs.Extension.getInstance();
    window['unisubs'] = {};
    window['unisubs']['showExtension'] = function(enabled) {
        extension.show(enabled);
    };
})();

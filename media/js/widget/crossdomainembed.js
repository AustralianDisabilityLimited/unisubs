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

goog.provide('unisubs.widget.CrossDomainEmbed');

unisubs.widget.CrossDomainEmbed = {};

unisubs.widget.CrossDomainEmbed.embed = 
    function(widgetDiv, widgetConfig, siteConfig) 
{
    unisubs.siteConfig = siteConfig;
    if (goog.DEBUG) {
        if (widgetConfig['debug_js']) {
            var debugWindow = new goog.debug.FancyWindow('main');
            debugWindow.setEnabled(true);
            debugWindow.init();
            unisubs.DEBUG = true;
        }
    }
    unisubs.IS_NULL = !!widgetConfig['null_widget'];
    var widget = new unisubs.widget.Widget(widgetConfig);
    widget.decorate(widgetDiv);
};

unisubs.widget.Widget.exportJSSymbols(true);

var m = window["unisubsToEmbed"];
if (typeof(m) != 'undefined'){
    for (var i = 0; i < m.length; i++){
        unisubs.widget.CrossDomainEmbed.embed(m[i][0], m[i][1], m[i][2]);
    }
}

window['unisubsCrossDomainLoaded'] = true;

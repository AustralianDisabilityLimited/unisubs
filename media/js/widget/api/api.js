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

goog.provide('unisubs.api');

/**
 * Opens the subtitling dialog for clients which provide their 
 * own server model, e.g. Wikimedia.
 * @param {Object} config Defined in the API documentation.
 */
unisubs.api.openDialog = function(config) {
    unisubs.siteConfig = unisubs.Config.siteConfig;
    if (config['staticURL'])
        unisubs.Config.siteConfig['staticURL'] = config['staticURL'];
    var subtitles = config['subtitles'];
    var closeListener = config['closeListener'];
    var videoURL = config['videoURL'];
    var videoSource = new unisubs.player.Html5VideoSource(
        videoURL, unisubs.player.Html5VideoType.OGG);
    var serverModel = new unisubs.api.ServerModel(config);
    var subDialog = new unisubs.subtitle.Dialog(
        videoSource, serverModel, 
        unisubs.widget.SubtitleState.fromJSONSubs(subtitles), 
        null,
        config['skipFinished']);
    unisubs.currentUsername = config['username'];
    subDialog.setVisible(true);
    goog.events.listenOnce(
        subDialog,
        goog.ui.Dialog.EventType.AFTER_HIDE,
        closeListener);
    return {
        "close": function() { subDialog.setVisible(false); }
    };
};

/**
 * Used to open the dialog from the on-site widget page for Firefox bug. In this
 * case, general settings can be passed in from the page, so we don't bother
 * asking the server for them.
 * In near future, will also use this to open dialog for team actions.
 * @param {boolean} askLanguage Should we ask the user for the language first?
 * @param {Object} config Arguments for the dialog: videoURL to be used 
 *     in embed code, video url for the video player, version no, language 
 *     code, original language code if set, and fork. These are currently 
 *     set in SubtitleController#startEditing_.
 * @param {Object} generalSettings See WidgetController.makeGeneralSettings
 *     for more info.
 */ 
unisubs.api.openUnisubsDialogWithSettings = 
    function(askLanguage, config, generalSettings) 
{
    if (goog.DEBUG) {
        var debugWindow = new goog.debug.FancyWindow('main');
        debugWindow.setEnabled(true);
        debugWindow.init();             
        unisubs.DEBUG = true;
    }
    unisubs.widget.WidgetController.makeGeneralSettings(generalSettings);
    if (config['returnURL']) {
        unisubs.returnURL = config['returnURL'];
    }
    if (config['guidelines']) {
        unisubs.guidelines = config['guidelines'];
    }
    if (config['team_url']) {
        unisubs.team_url = config['team_url'];
    }
    if (config['mode']) {
        unisubs.mode = config['mode'];
    }
    if (config['task']) {
        unisubs.task_id = config['task'];
    }
    unisubs.IS_NULL = !!config['nullWidget'];
    var videoSource = 
        unisubs.player.MediaSource.videoSourceForURL(
            config['effectiveVideoURL']);
    var opener = new unisubs.widget.SubtitleDialogOpener(
        config['videoID'], config['videoURL'], videoSource);
    if (!askLanguage) {
        opener.openDialog(
            new unisubs.widget.OpenDialogArgs(
                config['languageCode'], 
                config['originalLanguageCode'], 
                config['subLanguagePK'], 
                config['baseLanguagePK']));
    }
    else
        opener.showStartDialog();
};

/**
 * Used for opening sub dialog at /onsite_widget_resume/.
 */
unisubs.api.openUnisubsDialogForResume = function(config, generalSettings) {
    if (goog.DEBUG) {
        var debugWindow = new goog.debug.FancyWindow('main');
        debugWindow.setEnabled(true);
        debugWindow.init();             


        unisubs.DEBUG = true;
    }
    unisubs.widget.WidgetController.makeGeneralSettings(generalSettings);
    if (config['returnURL'])
        unisubs.returnURL = config['returnURL'];
    var videoSource = unisubs.player.MediaSource.videoSourceForURL(
        config['effectiveVideoURL']);
    var opener = new unisubs.widget.SubtitleDialogOpener(
        config['videoID'], config['videoURL'], videoSource);
    opener.resumeEditing();
};

/**
 * This is currently used to open the subtitle dialog 
 * from the Team Detail page. Main difference with 
 * unisubs.api.openUnisubsDialogWithSettings is that 
 * this one will redirect to onsite_widget page if on FF.
 * @param {string} videoID
 * @param {string} videoURL
 * @param {Object} generalSettings See WidgetController.makeGeneralSettings
 *     for more info
 */
unisubs.api.openUnisubsDialogOnsite = function(videoID, videoURL, generalSettings) {
    unisubs.widget.WidgetController.makeGeneralSettings(generalSettings);
    var videoSource = unisubs.player.MediaSource.videoSourceForURL(
        videoURL);
    var opener = new unisubs.widget.SubtitleDialogOpener(
        videoID, videoURL, videoSource);
    opener.showStartDialog();
};

/**
 * For JWPlayer API.
 */
unisubs.api.openUnisubsDialog = function(videoURL) {
    // TODO: you might want to be getting an array of videourls back from
    // the server and then choosing the best one for effectiveVideoURL.
    unisubs.Rpc.call(
        'fetch_video_id_and_settings',
        { 'video_url': videoURL },
        function(response) {
            unisubs.api.openUnisubsDialogWithSettings(
                true,
                {'videoURL': videoURL,
                 'effectiveVideoURL': videoURL,
                 'videoID': response['video_id'],
                 'originalLanguageSubtitled': 
                     response['is_original_language_subtitled'],
                 'baseVersionNo': null },
                response['general_settings']);
        });
};

unisubs.api.loggedIn = function(username) {
    unisubs.loggedIn(username);
};

unisubs.api.embed = function(elementID, widgetConfig) {
    unisubs.siteConfig = unisubs.Config.siteConfig;
    var widget = new unisubs.widget.Widget(widgetConfig);
    widget.decorate(goog.dom.getElement(elementID));
};

goog.exportSymbol(
    'unisubs.api.openDialog',
    unisubs.api.openDialog);

goog.exportSymbol(
    'unisubs.api.openUnisubsDialogWithSettings',
    unisubs.api.openUnisubsDialogWithSettings);

goog.exportSymbol(
    'unisubs.api.openUnisubsDialogForResume',
    unisubs.api.openUnisubsDialogForResume);

goog.exportSymbol(
    'unisubs.api.openUnisubsDialog',
    unisubs.api.openUnisubsDialog);

goog.exportSymbol(
    'unisubs.api.openUnisubsDialogOnsite',
    unisubs.api.openUnisubsDialogOnsite);

goog.exportSymbol(
    'unisubs.api.toSRT',
    unisubs.SRTWriter.toSRT);

goog.exportSymbol(
    'unisubs.api.loggedIn',
    unisubs.api.loggedIn);
goog.exportSymbol(
    'unisubs.api.embed',
    unisubs.api.embed);
        
// these are here to guarantee backwareds compatibility,
// should be removed once we are sure partners do not need this
goog.exportSymbol(
    'mirosubs.api.embed',
    unisubs.api.embed);

goog.exportSymbol(
    'mirosubs.api.openDialog',
    unisubs.api.openDialog);

goog.exportSymbol(
    'mirosubs.api.openUnisubsDialogWithSettings',
    unisubs.api.openUnisubsDialogWithSettings);

goog.exportSymbol(
    'mirosubs.api.openUnisubsDialog',
    unisubs.api.openUnisubsDialog);

goog.exportSymbol(
    'mirosubs.api.openUnisubsDialogOnsite',
    unisubs.api.openUnisubsDialogOnsite);

goog.exportSymbol(
    'mirosubs.api.toSRT',
    unisubs.SRTWriter.toSRT);

goog.exportSymbol(
    'mirosubs.api.loggedIn',
    unisubs.api.loggedIn);

goog.exportSymbol(
    'mirosubs.api.embed',
    unisubs.api.embed);

unisubs.widget.Widget.exportFireKeySequence();

window["UnisubsApiLoaded"] = true;

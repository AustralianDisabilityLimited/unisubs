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

goog.provide('unisubs');

/**
 * @define {boolean} REPORT_ANALYTICS is provided so that a build that 
 * excludes analytics reporting. Right now this is useful for Mozilla --
 * see https://bugzilla.mozilla.org/show_bug.cgi?id=669911#c8
 */
unisubs.REPORT_ANALYTICS = true;

unisubs.usingStreamer = function() {
    return !!window['UNISUBS_STREAMER'];
};

/**
 * If a widget is embedded in a different domain, this is set by
 * unisubs.widget.CrossDomainEmbed. It has two properties: siteURL
 * and staticURL. It is non-null iff the widget is embedded in a 
 * different domain.
 */
unisubs.siteConfig = null;

/**
 * Set when widget gets initial state from server, if user is logged in.
 * @type {string}
 */
unisubs.currentUsername = null;

/**
 * URL to which the page should return after widget dialog closes.
 * This is a temporary setting to solve 
 * http://bugzilla.pculture.org/show_bug.cgi?id=13694 .
 * Only set for on-site widgets opened for Firefox workaround due
 * to video frame/background css performance problem.
 * @type {?string}
 */
unisubs.returnURL = null;

/**
 * @type {?object}
 */
unisubs.guidelines = {};

/**
 * @type {?string}
 */
unisubs.team_url = '';

/**
 * @type {?object}
 */
unisubs.mode = null;

/**
 * Current version of embed code. Set when widget gets inital 
 * state from server. Corresponds to value in settings.EMBED_JS_VERSION
 * in Django settings.py file.
 * @type {string}
 */
unisubs.embedVersion = null;

/**
 * Set when widget gets initial state from server. All available languages.
 * Each member is a two-element array, with language code first then 
 * language name.
 * @type {Array.<Array>}
 */
unisubs.languages = null;

/**
 * editing lock expiration, in seconds. set in initial loading.
 * @type {number}
 * @const
 */
unisubs.LOCK_EXPIRATION = 0;

/**
 * Set when widget gets initial state from server. All available languages.
 * Each member is a two-element array, with language code first then 
 * language name.
 * @type {Array.<Array>}
 */
unisubs.metadataLanguages = null;

unisubs.languageMap_ = null;

/**
 * some languages, like metadata languages, are forked by default.
 *
 */
unisubs.isForkedLanguage = function(languageCode) {
    return null != goog.array.find(
        unisubs.metadataLanguages,
        function(lang) { return lang[0] == languageCode; });
};

unisubs.languageNameForCode = function(code) {
    if (unisubs.languageMap_ == null) {
        unisubs.languageMap_ = {};
        for (var i = 0; i < unisubs.languages.length; i++)
            unisubs.languageMap_[unisubs.languages[i][0]] = 
                unisubs.languages[i][1];
        for (var i = 0; i < unisubs.metadataLanguages.length; i++)
            unisubs.languageMap_[unisubs.metadataLanguages[i][0]] =
                unisubs.metadataLanguages[i][1];
    }
    return unisubs.languageMap_[code];
};

unisubs.dateString = function() {
    return new Date().toUTCString();
};

/**
 * Does not include trailing slash.
 */
unisubs.siteURL = function() {
    return unisubs.siteConfig ? unisubs.siteConfig['siteURL'] : 
        (window.location.protocol + '//' + window.location.host);
};

/**
 * Includes trailing slash.
 */
unisubs.staticURL = function() {
    return unisubs.siteConfig ? 
        unisubs.siteConfig['staticURL'] : window['STATIC_URL'];
};

unisubs.imageAssetURL = function(imageFileName) {
    return [unisubs.staticURL(), 'images/', imageFileName].join('');
};

/**
 * Set during loading. If true, this means we are supposed to open the fancy 
 * debug window. Note that the window will not open if goog.DEBUG is false 
 * (we set this to false in an option passed to the compiler for production)
 */
unisubs.DEBUG = false;

/**
 * Set during loading.
 */
unisubs.IS_NULL = false;

unisubs.EventType = {
    LOGIN : 'login',
    LOGOUT : 'logout'
};

unisubs.userEventTarget = new goog.events.EventTarget();
unisubs.loginAttemptInProgress_ = false;

/**
 *
 * @param opt_finishFn {function(boolean)=} Called when login process
 *     completes. Passed true if logged in successfully, false otherwise.
 * @param opt_message {String} Optional message to show at the top of the
 *     login dialog.
 */
unisubs.login = function(opt_finishFn, opt_message) {
    if (unisubs.currentUsername != null) {
        if (opt_finishFn)
            opt_finishFn(true);
        return;
    }
    var loginDialog = new unisubs.LoginDialog(opt_finishFn, opt_message);
    loginDialog.setVisible(true);
};

unisubs.LoginPopupType = {
    TWITTER: [
        '/widget/twitter_login/',
        'location=0,status=0,width=800,height=400'
    ],
    OPENID: [
        '/socialauth/openid/?next=/widget/close_window/',
        'scrollbars=yes,location=0,status=0,resizable=yes'
    ],
    GOOGLE: [
        '/socialauth/gmail_login/?next=/widget/close_window/',
        'scrollbars=yes,location=0,status=0,resizable=yes'
    ],
    FACEBOOK: [
        '/widget/facebook_login/?next=/widget/close_window/',
        'location=0,status=0,width=1000,height=450'
    ],
    NATIVE: [
        '/auth/login/?next=/widget/close_window/',
        'scrollbars=yes,location=0,status=0,resizable=yes'
    ]
};

/**
 * @param {unisubs.LoginPopupType} loginPopupType
 * @param {function(boolean)=} opt_finishFn Will be called with true if
 *     logged in, false otherwise.
 * @param {function()=} opt_errorFn Will be called if post-call to
 *     fetch user info errors out.
 */
unisubs.openLoginPopup = function(loginPopupType, opt_finishFn, opt_errorFn) {
    var loginWin = window.open(unisubs.siteURL() + loginPopupType[0],
                               unisubs.randomString(),
                               loginPopupType[1]);
    var timer = new goog.Timer(250);
    goog.events.listen(
        timer, goog.Timer.TICK,
        function(e) {
            if (loginWin.closed) {
                timer.dispose();
                unisubs.postPossiblyLoggedIn_(opt_finishFn, opt_errorFn);
            }
        });
    timer.start();
    return loginWin;
};
unisubs.postPossiblyLoggedIn_ = function(opt_finishFn, opt_errorFn) {
    unisubs.Rpc.call(
        'get_my_user_info', {},
        function(result) {
            unisubs.loginAttemptInProgress_ = false;
            if (result['logged_in'])
                unisubs.loggedIn(result['username']);
            if (opt_finishFn)
                opt_finishFn(result['logged_in']);
        },
        function() {
            if (opt_errorFn)
                opt_errorFn();
        });
};

unisubs.loggedIn = function(username) {
    unisubs.currentUsername = username;
    unisubs.userEventTarget.dispatchEvent(
        new unisubs.LoginEvent(unisubs.currentUsername));
};

unisubs.isLoginAttemptInProgress = function() {
    return unisubs.loginAttemptInProgress_ ||
        unisubs.LoginDialog.isCurrentlyShown();
};

unisubs.createAccount = function() {
    unisubs.loginAttemptInProgress_ = true;
    unisubs.openLoginPopup(unisubs.LoginPopupType.NATIVE);
};

unisubs.logout = function() {
    unisubs.Rpc.call('logout', {}, function(result) {
        unisubs.currentUsername = null;
        unisubs.userEventTarget.dispatchEvent(unisubs.EventType.LOGOUT);
    });
};

unisubs.formatTime = function(time, opt_excludeMs) {
    var intTime = parseInt(time);

    var timeString = '';
    var hours = (intTime / 3600) | 0;
    if (hours > 0)
        timeString += (hours + ':');
    var minutes = ((intTime / 60) | 0) % 60;
    if (minutes > 0 || hours > 0) {
        if (hours > 0)
            timeString += (goog.string.padNumber(minutes, 2) + ':');
        else
            timeString += (minutes + ':');
    }
    var seconds = intTime % 60;
    if (minutes > 0 || hours > 0)
        timeString += goog.string.padNumber(seconds, 2);
    else
        timeString += seconds;
    if (!opt_excludeMs) {
        var frac = parseInt(time * 100) % 100;
        timeString += ('.' + goog.string.padNumber(frac, 2));
    }
    return timeString;
};

unisubs.randomString = function() {
    var sb = [], i;
    for (i = 0; i < 10; i++)
        sb.push((10 + ~~(Math.random() * 26)).toString(36));
    return sb.join('') + (new Date().getTime() % 100000000);
};

/**
 *
 * @param {Element} topElem
 * @param {Element} bottomElem should have display: hidden when 
 *     this is called.
 */
unisubs.attachToLowerLeft = function(topElem, bottomElem) {
    // This is a little hacky so that we can position with minimal
    // flicker.
    unisubs.style.setVisibility(bottomElem, false);
    unisubs.style.showElement(bottomElem, true);
    unisubs.repositionToLowerLeft(topElem, bottomElem);
    unisubs.style.setVisibility(bottomElem, true);
};

unisubs.repositionToLowerLeft = function(anchorElement, movableElement) {
    // a lot of this code is from goog.positioning.positionAtAnchor.
    
    // Ignore offset for the BODY element unless its position is non-static.
    // For cases where the offset parent is HTML rather than the BODY (such as in
    // IE strict mode) there's no need to get the position of the BODY as it
    // doesn't affect the page offset.
    var moveableParentTopLeft;
    var parent = movableElement.offsetParent;
    if (parent) {
        var isBody = parent.tagName == goog.dom.TagName.HTML ||
            parent.tagName == goog.dom.TagName.BODY;
        if (!isBody ||
            goog.style.getComputedPosition(parent) != 'static') {
            // Get the top-left corner of the parent, in page coordinates.
            moveableParentTopLeft = goog.style.getPageOffset(parent);

            if (!isBody) {
                moveableParentTopLeft = goog.math.Coordinate.difference(
                    moveableParentTopLeft,
                    new goog.math.Coordinate(
                        parent.scrollLeft, parent.scrollTop));
            }
        }
    }

    // here is where this significantly differs from goog.positioning.atAnchor.
    var anchorRect = goog.style.getBounds(anchorElement);

    // Translate anchorRect to be relative to movableElement's page.
    goog.style.translateRectForAnotherFrame(
        anchorRect,
        goog.dom.getDomHelper(anchorElement),
        goog.dom.getDomHelper(movableElement));

    var absolutePos = new goog.math.Coordinate(
        anchorRect.left, anchorRect.top + anchorRect.height);

    // Translate absolutePos to be relative to the offsetParent.
    if (moveableParentTopLeft) {
        absolutePos =
            goog.math.Coordinate.difference(absolutePos, moveableParentTopLeft);
    }

    goog.positioning.positionAtCoordinate(
        absolutePos, movableElement, goog.positioning.Corner.TOP_LEFT);
    unisubs.style.makeStylesImportant(movableElement);
};

/**
 * Checks whether we are embedded in a non-PCF domain.
 */
unisubs.isEmbeddedInDifferentDomain = function() {
    return unisubs.siteConfig != null;
};

unisubs.isReturnURLInDifferentDomain = function() {
    if (!unisubs.returnURL)
        return false;
    var uri = new goog.Uri(unisubs.returnURL);
    var myURI = new goog.Uri(window.location);
    if (goog.DEBUG) {
        unisubs.logger_.info("unisubs.returnURL is " + unisubs.returnURL);
        unisubs.logger_.info(
            "isReturnURLInDifferentDomain call: comparing " + 
                uri.getDomain() + " against " + myURI.getDomain());
    }
    return uri.hasDomain() && 
        uri.getDomain().toLowerCase() != 
        myURI.getDomain().toLowerCase();
};

unisubs.isFromDifferentDomain = function() {
    
    return unisubs.isEmbeddedInDifferentDomain() || 
        unisubs.isReturnURLInDifferentDomain();
};

/**
 * @constructor
 */
unisubs.LoginEvent = function(username) {
    this.type = unisubs.EventType.LOGIN;
    this.username = username;
};

unisubs.getSubtitleHomepageURL = function(videoID) {
    return [unisubs.siteURL(), "/videos/", videoID].join('');
};

unisubs.getVolunteerPageURL = function(){
    return [unisubs.siteURL(), "/videos/volunteer/"].join('');
}

unisubs.createLinkButton = function($d, text, opt_className) {
    var atts = { 'href': 'javascript:void(0);' };
    if (opt_className)
        atts['className'] = opt_className;
    return $d('a', atts, text);
};

unisubs.supportsIFrameMessages = function() {
    return !!window['postMessage'];
};

unisubs.storage_ = window['localStorage'];

unisubs.supportsLocalStorage = function() {
    if (goog.isDefAndNotNull(unisubs.storage_)) {
        return goog.isDefAndNotNull(unisubs.storage_['getItem']);
    }
    else {
        return false;
    }
};

unisubs.saveInLocalStorage = function(key, value) {
    if (goog.DEBUG) {
        unisubs.logger_.info(
            "Saving local storage, key: " + key + 
                " and value " + value);
    }
    unisubs.storage_['setItem'](key, value);
};

unisubs.fetchFromLocalStorage = function(key) {
    if (goog.DEBUG) {
        unisubs.logger_.info(
            "Fetching local storage, key: " + key + 
                " and value " + 
                unisubs.storage_['getItem'](key));
    }
    return unisubs.storage_['getItem'](key);
};

unisubs.removeFromLocalStorage = function(key) {
    if (goog.DEBUG) {
        unisubs.logger_.info("Removing " + key + " from localStorage.");
    }
    unisubs.storage_['removeItem'](key);
};

unisubs.addScript = function(src, opt_async, opt_checkFn, opt_callbackFn) {
    if (opt_checkFn && opt_callbackFn) {
        var timer = new goog.Timer(250);
        goog.events.listen(
            timer,
            goog.Timer.TICK,
            function(e) {
                if (opt_checkFn()) {
                    timer.stop();
                    timer.dispose();
                    opt_callbackFn();
                }
            });
        timer.start();
    }
    var tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.src = src;
    if (opt_async)
        tag.async = true;
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

if (goog.DEBUG) {
    unisubs.logger_ = goog.debug.Logger.getLogger('unisubs');
}

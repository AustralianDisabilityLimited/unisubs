{% extends "jstesting/base_test.html" %}
{% block testscript %}

/**
 * @type {unisubs.subtitle.MSServerModel}
 */
var _serverModel;

function makeJsonSubs() {
    var jsonSubs = [];
    for (var i = 0; i < 100; i++) {
        jsonSubs.push({
            "subtitle_id": "a" + i,
            "text": "text" + i,
            "start_time": i * 2,
            "end_time": i * 2 + 1,
            "sub_order": i + 1
        });
    }
    return jsonSubs;
}

function makeJsonTranslations() {
    var jsonSubs = [];
    for (var i = 0; i < 100; i++) {
        jsonSubs.push({
            "subtitle_id": "a" + i,
            "text": "transtext" + i
        });
    }
    return jsonSubs;
}

function makeEditableCaptionSet(opt_notComplete) {
    return new unisubs.subtitle.EditableCaptionSet(
        makeJsonSubs(), !opt_notComplete);
}

function makeTransCaptionSet() {
    return new unisubs.subtitle.EditableCaptionSet(
        makeJsonTranslations());
}

function successCallback() {
    
}

function failureCallback() {

}

function setUp() {
    unisubs.REPORT_ANALYTICS = false;
    unisubs.SubTracker.getInstance().start(false);
    unisubs.testing.TimerStub.timers = [];
    unisubs.testing.calls = [];
    goog.Timer = unisubs.testing.TimerStub;
    unisubs.Rpc.call = unisubs.testing.rpcCallStub;
}

function makeServerModel(forTrans) {
    var editableCaptionSet = forTrans ? 
        makeTransCaptionSet() : makeEditableCaptionSet();
    var savedSubs = new unisubs.widget.SavedSubtitles(
        150, editableCaptionSet);
    unisubs.widget.SavedSubtitles.saveInitial(savedSubs);
    _serverModel = new unisubs.subtitle.MSServerModel(
        150,
        2,
        "http://www.youtube.com/watch?v=ArQCkbP07Ao",
        editableCaptionSet);
    _serverModel.init();
}

function testWorkDone() {
    makeServerModel(false);
    var captionSet = _serverModel.getCaptionSet();
    assertFalse(_serverModel.anySubtitlingWorkDone());
    var caption = captionSet.caption(2);
    var oldText = caption.getText();
    caption.setText('ccc');
    assertTrue(_serverModel.anySubtitlingWorkDone());
    caption.setText(oldText);
    assertFalse(_serverModel.anySubtitlingWorkDone());
    caption.setText('   ' + oldText + '   ');
    assertFalse(_serverModel.anySubtitlingWorkDone());
}

function testMakeSubsBlank() {
    makeServerModel(false);
    // if all subs are blank, zero-length subs will be saved.
    var captionSet = _serverModel.getCaptionSet();
    for (var i = 0; i < 100; i++)
        captionSet.caption(i).setText('  ');
    _serverModel.finish(successCallback, failureCallback)
    assertEquals(1, unisubs.testing.calls.length);
    var call = unisubs.testing.calls[0];
    assertEquals('finished_subtitles', call.methodName);
    var args = call.args;
    assertEquals(0, args['subtitles'].length);
    assertEquals(undefined, args['new_title']);
    assertEquals(undefined, args['completed']);
}

function testFinishedNoChanges() {
    makeServerModel(false);
    _serverModel.finish(successCallback, failureCallback);
    assertEquals(0, unisubs.testing.calls.length);
}

function testFinishedNoChanges2() {
    makeServerModel(false);
    _serverModel.finish(successCallback, failureCallback);
    assertEquals(0, unisubs.testing.calls.length);
}

function testFinishedOnlyChange() {
    makeServerModel(false);
    _serverModel.getCaptionSet().completed = false;
    _serverModel.finish(successCallback, failureCallback);
    assertEquals(1, unisubs.testing.calls.length);
    var call = unisubs.testing.calls[0];
    var args = call.args;
    assertEquals(undefined, args['subtitles']);
    assertEquals(undefined, args['new_title']);
    assertEquals(false, args['completed']);
}

function testFork() {
    makeServerModel(true);
    var stdSubsJson = {
        'subtitles': makeJsonSubs(),
        'forked': true
    }
    var standardSubState = new unisubs.widget.SubtitleState(
        stdSubsJson);
    _serverModel.fork(standardSubState);
    var captionSet = _serverModel.getCaptionSet();
    var caption = captionSet.caption(1);
    assertEquals(2, caption.getStartTime());
    caption.setText('ccc');
    _serverModel.finish(successCallback, failureCallback);
    var call = unisubs.testing.calls[0];
    var args = call.args;
    assertEquals(true, args['forked']);
}

function testForkCloseThenOpen() {
    makeServerModel(true);
    var stdSubsJson = {
        'subtitles': makeJsonSubs(),
        'forked': true
    }
    var standardSubState = new unisubs.widget.SubtitleState(
        stdSubsJson);
    _serverModel.fork(standardSubState);
    var savedSubs = unisubs.widget.SavedSubtitles.fetchLatest();
    assertEquals(true, savedSubs.CAPTION_SET.wasForkedDuringEdits());
}

{% endblock %}
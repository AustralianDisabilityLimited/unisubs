{% comment %} This has to be included in a onLoad handler ! {% endcomment %}
var APPROVE_MARKER = "moderation-set-button";
var LOADING_TEXT = "wait ...";
var batchURLS = [];
var rejectionMarkerClass = "reject-version";
var showsRejectionNotification = false;
var disabledClass = "disabled";
goog.require("unisubs.subtitle.ConfirmRejectiondDialog");



function updatePendingCount(num, absolute){
    var count = num;
    if (!absolute){
        count = parseInt($(".active .badgy ").text()) + count ;
    }
    $(".active .badgy ").text(count );
}

function hideRow(row){
    row.fadeOut(500, function(){
        var myTable = $(this).parents("table");
        $(this).remove();
        var numLangs = $("tr", myTable).length;
        // if it's the last one, we still heave the header
        if (numLangs == 1 ){
            // the header
            $(myTable).slideDown( 400, function(){
                $(this).parents(".video-container").remove();
            });
        }
    });    
}

function updateModPane(el, data){
    hideRow($(el).parents("tr"));
}

/**
 * Updates the ajax response on the video history panel. We need to change
 * the button (if we've just rejected a revision, we can now approve it) , 
 * and also the status icon under 'Most recent'
 */
function updateHistoryPanel(el, data){
    var newBT = $(data.new_button_html);
    $(el).before(newBT);
    $(el).remove();
    newBT.slideDown(200,function(){
        prepareApproveButton(0, this);
    });
    var statusHolder = $(newBT).parents("tr");
    $("div.moderation-status-icon", statusHolder).replaceWith(data.status_icon_html);

}


function showMessageFromResponse(response){
    var message = response.data.msg || "An error ocurred, we're working on getting this fixes asap.";
    jQuery['jGrowl'](message, {'life': 10000});    
}
/*
 * Shows the message from response. If the element is passed.
 * we've succeeded, in which case we remove the row for this language, 
 * and if this was the last language for that video, we remove that also, 
 * and recrement the moderation pending notice.
 * 
 */
function onApproveDone(el, response, isRejection){
    if (response.success){
        if (!isRejection || showsRejectionNotification)
        showMessageFromResponse(response);
    }
    if (el){
        var parentContainer = $(el).parents("tr.moderation-row");
        if (parentContainer.length && parentContainer.hasClass("moderation-panel-row")){
            updateModPane(el, response.data);
        }else if (parentContainer.hasClass("revision-history-row")){
            updateHistoryPanel(el, response.data);
        }
        updatePendingCount(response.data.pending_count, true);
    }
    var replacesWithResponseButton = $(el).data("render_server_button");
    if (replacesWithResponseButton){
        var target = $(el).parents(".moderation-toolbar-remove");
        if (target){
            var newel = $(response.data.new_toolbar_html);
            $(target).replaceWith(newel);
            ajaxifyApproveButtons(newel);
        }
        
    }else{
        $(el).remove();
    }
}

function restoreText(el){
    $(el).text($(el).data("previousLabel"));
}

function setButtonState(el, enabled){
    if (enabled){
        $(el).removeClass(disabledClass);
        $(el).css("opacity", 1);
        restoreText(el);
    }else{
        $(el).addClass(disabledClass);
        $(el).data("previousLabel",  $(el).text());
        $(el).text(LOADING_TEXT);
        $(el).css("opacity", 0.5);
    }
}

function isEnabled(el){
    return !$(el).hasClass(disabledClass);
}

function sendModeration(el, extra){
    if (!isEnabled(el)){
        return;
    }
    setButtonState(el, false);
    var url = $(el).attr('href');
    $(el).attr('#');
    var btn = $(el);
    var isRejection = $(el).hasClass(rejectionMarkerClass);
    $(el).data("")
    $.ajax( {
        url: url,
        dataType: 'json',
        type: "POST",
        data:extra,        
        success: function(response){
            //restoreText(btn);
            setButtonState(btn, true);
            onApproveDone(el, response, isRejection);
        },
        error: function(response){
            onApproveDone(null, response);
        }
    });
}

function prepareApproveButton(i, el){
    $(el).click( function(e){
        e.preventDefault();
        if ($(this).hasClass("disabled")){
            return false;
        }
        var requiresDialogClass = $(el).attr("data-confirmdialog");
        if (requiresDialogClass){
            var d = new (goog.getObjectByName(requiresDialogClass))(function(x){
                sendModeration(el, x);
            });
            d.setVisible(true);
        }else{
            sendModeration(el);
        }
        return false;
    });
    if (window.UNISUBS_MOD_REPLACE_HTML_BUTTON){
        $(el).data("render_server_button", true);
    }
}

function ajaxifyApproveButtons(el){
    $("." + APPROVE_MARKER, el).each(prepareApproveButton);

}
ajaxifyApproveButtons();
window.ajaxifyApproveButtons = ajaxifyApproveButtons;

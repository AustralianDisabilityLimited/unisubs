{% comment %} must be inside a jquerys load event {%endcomment%}
{% load i18n %}

var formDiv = $("<div class='msg_modal_wrap language_modal clearfix visibility-form-container' data-modal='visibility-form' id='visibility-form'><a href='#close' class='close'>{% trans 'Close' %} </a></div>");
var shown = false;
var loadingMarkup = '<img class="placeholder" align="absmiddle" width="256" height1="30" src="{{ STATIC_URL }}images/ajax-loader.gif"/>';
function showVisibilityForm(url, reqType){
    var data = "";
    if ($(".visibility-form-container").length > 0){
        data = $("form.video-vis").serialize();
    }
    formDiv.children().remove();
    formDiv.append($(loadingMarkup));
    $.ajax({
        url: url,
        type:reqType,
        data: data,
        success: function(res){
            if ($(".visibility-form-container").length == 0) {
                $("body").append(formDiv);
            }
            formDiv.children().remove();
            formDiv.append(res);
            if (!shown){
              formDiv.mod();                
            }
            shown = true;
            $("form", formDiv).submit(function(){
              showVisibilityForm(url, "POST");
              return false;  
            });
            var messageDiv = $("span.message", formDiv);
            if (messageDiv.length){
                messageDiv.hide().fadeIn();
            }
        }
    })
}

function initVisForm(){
      formDiv.append($(loadingMarkup));  
  $(".video-visibility-form-show").click(function(e){
     e.preventDefault();
      // first time we show the form, we want to use GET
      showVisibilityForm($(this).attr("href"), "GET");
     return false;
  });
    $(formDiv).bind("close-modal", function(e,l){
        shown = false;
    })
}

initVisForm();


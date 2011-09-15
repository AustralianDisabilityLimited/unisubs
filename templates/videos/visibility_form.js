{% comment %} must be inside a jquerys load event {%endcomment%}

var formDiv = $("<div class='visibility-form-container' data-modal='visibility-form' ></div>");
function showVisibilityForm(url){
    $.ajax({
        url: url,
        type:"POST",
        success: function(res){
            if ($(".visibility-form-container").length == 0) {
                $("body").append(formDiv);
            }
            formDiv.children().remove();
            formDiv.append(res);
            $("form", formDiv).submit(function(){
                showVisibilityForm(url);
                return false;  
            })
        }
    })
}

function attachShowFormButton(){
  $(".video-visibility-form-show").click(function(e){
     e.preventDefault();
     showVisibilityForm($(this).attr("href"));
     return false;
  });
}

attachShowFormButton();

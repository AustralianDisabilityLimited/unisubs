(function(){
    
   var EDIT_SELECTOR = ".edit-role" ;
    
    var EditRoleDialog = Class.$extend({
        __init__:function(pk, teamSlug){
            this.pk = pk;
            this.teamSlug = teamSlug;
            this.el = ich.editRoleDialog(this);
            this.hide = _.bind(this.hide, this);
            $("a.close", this.el).click(this.hide);
        },
        loadInfo: function(){
            
            TeamsApiV2.member_role_info(
                this.teamSlug,
                this.pk,
                _.bind(this.show, this)
                )
        },
        show: function(res){
            console.log(res)
            $(this.el).show();
            $(this.el).css({
                width:"200px",
                height:"200px",
                position:"absolute",
                left:"200px",
                top:"200px",
                "background-color": "grey"
            });
            $("body").append(this.el);
        },
        hide:function(e){
            if (e){
                e.preventDefault();
            }
            $(this.el).remove();
        }
    });
    function onEditClicked(e){
        e.preventDefault();
        var pk = $(e.target).data("member-pk");
        var teamSlug = $(e.target).data("team-slug");
        var dialog = new EditRoleDialog(pk, teamSlug);
        dialog.loadInfo();
        console.log(dialog)
    };
    function bootstrapButton(el){
        $(el).click(function(e){
            onEditClicked(e);
            return false;
        });
    }

    $(EDIT_SELECTOR).each(function(i,o){
        bootstrapButton(o);
    });
})();

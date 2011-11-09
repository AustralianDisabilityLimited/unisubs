var TEAM_SLUG = "{{team.slug}}";

function captureEnterSubmit(form, callback){
    $(form).keypress(function(e){
        if (e.keyCode == 13){
            callback();
            return false;
        }
    });
}

var AsyncPanel = Class.$extend({
    load: function (url){
        var oldEl = $(this.el).children().remove();
        $(this.el).innerHTML(icanhaz.IMAGE_PRELOADER);
        $.ajax(url, {
            success: function(res){
                $(this.el).innerHTML(oldEl)
                this.onLoadDone(res);
            }
        });
    }
});

/**
 * Very barebones, just copies over data passed to the
 * constuctor with possible filter fuctions before assinging 
 * (e.g. for assignging default values or doing type conversion.
 * Also has some lightway semantics on isNew (a la backbone) and isDeleted
 **/
var BaseModel = Class.$extend({
    __init__:function(data, filters){
        this.update(data, filters);
    },
    update: function(data, filters){
        if (!data){
            return
        }
        _.each(_.keys(data), function(key){
            this[key] = filters && filters[key]? 
                filters[key](data[key]) :
                data[key];
        }, this);
    },
    isNew: function(){
        return ! _.isNumber(this.pk);
    },
    delete: function(){
        delete this['pk'];
        this.isDeleted=true
    },
    toObject: function(){
        var data = {};
        _.each(_.keys(this), function(key){
            if (!_.isFunction(this[key])){
                data[key] = this[key];
            }
        }, this);
        return data;
    }
});

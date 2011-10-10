var ACTIVE_CLASS  =- "current";
var PANEL_MARKER = "panel-";

var MENU_SELECTOR = ".sub-settings-panel";
var CONTAINER_SELECTOR = ".panel-holder";
var TEAM_SLUG = "{{team.slug}}";
var ON_PROJECT_SAVED = "onProjectSaved";

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

var ProjectModel = Class.$extend({
    __init__: function(data){
        this.teamSlug = TEAM_SLUG;
        this.update(data);
    },
    update: function(data){
        this.name = data.name;
        this.slug = data.slug;
        this.description = data.description;
        this.pk = data.pk;
    }
});

var TaskModel = Class.$extend({
    __init__: function(data) {
        this.pk = data.pk;
        this.language = data.language;
        this.languageDisplay = data.language_display;
        this.teamVideo = data.team_video;
        this.teamVideoDisplay = data.team_video_display;
        this.teamVideoUrl = data.team_video_url;
        this.assignee = data.assignee;
        this.completed = data.completed;
        this.type = data.type;
        this.teamSlug = TEAM_SLUG;
        this.steps = function() {
            var step = { 'Subtitle': 0,
                         'Translate': 1,
                         'Review': 2,
                         'Approve': 3
            }[this.type];

            return _.map(_.range(0, 4), function(i) {
                return { 'done': i < step ? true : false };
            });
        };
        this.stepDisplay = {
            'Subtitle': 'Needs Subtitles',
            'Translate': 'Needs Translation',
            'Review': 'Needs Review',
            'Approve': 'Needs Approval'
        }[this.type];
    }
});

var ProjectEditPanel = Class.$extend({
     __init__: function(pModel){
         this.model = pModel;
         this.el = ich.projectEditPanel(pModel);
         this.onSaveClicked = _.bind(this.onSaveClicked, this);
         this.onDeleteClicked = _.bind(this.onDeleteClicked, this);
         this.onChangeProjectReturned = _.bind(this.onChangeProjectReturned, this);
         $(".project-delete", this.el).click(this.onDeleteClicked);
         $(".project-save", this.el).click(this.onSaveClicked);
         
    },
    getValuesFromForm: function(form){
        var inputs = $(':input', form);

        var values = {};
        inputs.each(function() {
            values[this.name] = $(this).val() || null;
        });
        return values;

    },
    onSaveClicked: function(e){
        e.preventDefault();
        var values = this.getValuesFromForm($("form", this.el));
        TeamsApiV2.project_edit(
            TEAM_SLUG,
            values.pk,
            values.name,
            values.slug,
            values.description,
            values.order ,
            this.onChangeProjectReturned
        )
        return false;
    },
    onChangeProjectReturned: function(data){
        var res = data;
        if (res && res.success){
            $.jGrowl(res.msg);
            if (res.obj){
                this.model.update(res.obj);
                this.el.trigger(ON_PROJECT_SAVED, this.model);
                
            }
            // show errors
        }else{
            $.jGrowl.error(data.result.message);
            if(data.result && data.result.errors){

            }
        }
    },
    onDeleteClicked: function(e){
        e.preventDefault();
        
        return false;
    }
    
});

var ProjectListItem = Class.$extend({
    __init__:function(model){
        var vel = this.el = ich.projectListItem(model);
        this.model = model;
        $("a", this.el).click(function(e){
            e.preventDefault();
            vel.trigger("onEditRequested", model)
            return false;
        })
    },

})
var ProjectSelectionButton = Class.$extend({
    __init__: function(pModel){
        this.model = pModel;

    }
});

var ProjectPanel  = AsyncPanel.$extend({
    __init__: function(){
        this.onProjectListLoaded = _.bind(this.onProjectListLoaded, this);
        this.onNewProjectClicked = _.bind(this.onNewProjectClicked, this);
        this.onProjectSaved = _.bind(this.onProjectSaved, this);
        this.onEditRequested = _.bind(this.onEditRequested, this);
        this.el = ich.projectPanel();
        $("a.project-add", this.el).click(this.onNewProjectClicked);
        scope = this;
        TeamsApiV2.project_list(TEAM_SLUG, null, this.onProjectListLoaded);
        this.projects = [];
        
    },
    addProject: function(pModel){
        var isNew = true;
        _.each(this.projects, function(m){
            if (pModel.pk == m.pk ){
                isNew = false;
            }
        });
        if (isNew){
            this.projects.push(pModel);
        }
    },
    renderProjectList: function(){
        var projectListing = $(".projects.listing", this.el);
        $("li", projectListing).remove();
        _.each(this.projects, function(x){
            var item = new ProjectListItem(x)
            projectListing.append(item.el);
            item.el.bind("onEditRequested", this.onEditRequested)
        }, this);
    },
    onEditRequested: function(e, model){
        e.preventDefault();
        this.projectEditPanel  = new ProjectEditPanel(model);
        this.el.prepend(this.projectEditPanel.el);
        this.projectEditPanel.el.bind(ON_PROJECT_SAVED, this.onProjectSaved)
        return false;
    },
    onProjectListLoaded: function(data){
        _.each(data, function(x){
            this.addProject(new ProjectModel(x))
        }, this);
        this.renderProjectList();
    },
    
    onNewProjectClicked : function(e){
        e.preventDefault();
        this.projectEditPanel  = new ProjectEditPanel(new ProjectModel({}));
        this.el.append(this.projectEditPanel.el);
        this.projectEditPanel.el.bind(ON_PROJECT_SAVED, this.onProjectSaved)
        return false;
    },
    onProjectSaved: function(e, p){
        this.projectEditPanel.el.unbind(ON_PROJECT_SAVED);
        this.projectEditPanel.el.remove();
        this.addProject(p);
        this.renderProjectList();
        
    }
});

var TasksPanel  = AsyncPanel.$extend({
    __init__: function() {
        // Bind functions
        this.onTasksListLoaded = _.bind(this.onTasksListLoaded, this);
        this.onTasksLanguagesListLoaded = _.bind(this.onTasksLanguagesListLoaded, this);
        this.onLanguageFilterChange = _.bind(this.onLanguageFilterChange, this);

        // Render template
        this.el = ich.tasksPanel();

        // Bind events
        $("select#id_task_language", this.el).change(this.onLanguageFilterChange);

        // Initialize data
        this.tasks = [];
        TeamsApiV2.tasks_list(TEAM_SLUG, {}, this.onTasksListLoaded);

        this.languages = [];
        TeamsApiV2.tasks_languages_list(TEAM_SLUG, this.onTasksLanguagesListLoaded);
    },

    addTask: function(tModel){
        var isNew = true;
        _.each(this.tasks, function(m){
            if (tModel.pk == m.pk ){
                isNew = false;
            }
        });
        if (isNew) {
            this.tasks.push(tModel);
        }
    },

    renderTasksList: function(){
        var tasksListing = $(".tasks.listing", this.el);

        $("li", tasksListing).remove();

        _.each(this.tasks, function(t) {
            tasksListing.append(ich.tasksListItem(t));
        });
    },
    renderTasksLanguagesList: function(){
        var langs = $("select#id_task_language", this.el);
        $("option", langs).remove();

        langs.append(ich.tasksLanguageOption({language: "", language_display: ""}));

        _.each(this.languages, function(l) {
            langs.append(ich.tasksLanguageOption(l));
        });
    },

    onTasksListLoaded: function(data) {
        this.tasks = [];
        _.each(data, function(t) {
            this.addTask(new TaskModel(t));
        }, this);
        this.renderTasksList();
    },
    onTasksLanguagesListLoaded: function(data) {
        this.languages = data;
        this.renderTasksLanguagesList();
    },
    onLanguageFilterChange: function(e) {
        e.preventDefault();
        var filter = $('select#id_task_language').val();
        TeamsApiV2.tasks_list(TEAM_SLUG, {language: filter}, this.onTasksListLoaded);
    }
});

var TabMenuItem = Class.$extend({
    __init__: function (data){
        this.el = ich.subMenuItem(data)[0];
        this.buttonEl = $("a", this.el)[0];
        this.klass = data.klass;
        this.panelEl = $(data.painelSelector);
    },
    markActive: function(isActive){
        if (isActive){
            $(this.el).addClass(ACTIVE_CLASS);
        }else{
            $(this.el).removeClass(ACTIVE_CLASS);
        }
    },
    showPanel: function(shows){
        if (shows){
            $(this.panelEl).show();
            if(this.klass){
                return  new this.klass();
            }
        }else{
            $(this.panelEl).hide();
        }
        return null;
    }
});

var TabViewer = Class.$extend({
    __init__: function(buttons, menuContainer, panelContainer){
        this.menuItems = _.map(buttons, function(x){
            var item = new TabMenuItem(x);
            $(menuContainer).append(item.el);
            return item;
        })
            
        $(menuContainer).click(_.bind(this.onClick, this));
        this.panelContainer = panelContainer;
    },
    openDefault: function(){
        $(this.menuItems[0].buttonEl).trigger("click");
    },
    onClick: function(e){
        e.preventDefault();
        var scope = this;
        if (this.currentItem){
            this.currentItem.showPanel(false);
            this.currentItem.markActive(false);
            if (this.currentKlass){
                this.currentKlass.el.hide();
            }
        }
        _.each(this.menuItems, function(x){
            if (x.buttonEl == e.target){
                x.markActive(true);
                this.currentKlass = x.showPanel(true);
                if (this.currentKlass){
                    this.panelContainer.append(this.currentKlass.el);
                }
                
                scope.currentItem = x;
            }

            return;
        }, this);
        
    }
});

function boostrapTabs(){
    var buttons = [
        {label:"Basic Settings", panelSelector:".panel-basic", klass:null},
        {label:"Guidelines and messages", panelSelector:".panel-guidelines", klass:null},
        {label:"Display Settings", panelSelector:".panel-display", klass:null},
        {label:"Projects", panelSelector:".panel-projects", klass:ProjectPanel},
        {label:"Tasks", panelSelector:".panel-tasks", klass:TasksPanel}
    ];
    var viewer = new TabViewer(buttons, $(".sub-settings-panel"), $(CONTAINER_SELECTOR));
    viewer.openDefault();
    
}

boostrapTabs();

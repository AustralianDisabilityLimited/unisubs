var PERFORM_TASK_URL = "{% url teams:perform_task %}";
var USER_CAN_ASSIGN_TASK = {% if user_can_assign_tasks %}true{% else %}false{% endif %};
var USER_CAN_DELETE_TASK = {% if user_can_delete_tasks %}true{% else %}false{% endif %};

// Tasks ----------------------------------------------------------------------
var TaskModel = Class.$extend({
    __init__: function(data) {
        this.pk = data.pk;
        this.language = data.language;
        this.languageDisplay = data.language_display;
        this.teamVideo = data.team_video;
        this.teamVideoDisplay = data.team_video_display;
        this.teamVideoUrl = data.team_video_url;
        this.assignee = data.assignee;
        this.assigneeDisplay = data.assignee_display;
        this.completed = data.completed;
        this.type = data.type;
        this.ghost = data.ghost;
        this.teamSlug = TEAM_SLUG;
        this.performAllowed = data.perform_allowed;
        this.performUrl = PERFORM_TASK_URL;
        this.assignAllowed = USER_CAN_ASSIGN_TASK;
        this.deleteAllowed = USER_CAN_DELETE_TASK;
        this.steps = function() {
            var step = { 'Subtitle': 0,
                         'Translate': 2,
                         'Review': 4,
                         'Approve': 6
            }[this.type];
            if (this.assignee) {
                step += 1
            }

            return _.map(_.range(0, 7), function(i) {
                return { 'done': i < step ? true : false };
            });
        };
        if (this.assignee) {
            this.stepDisplay = {
                'Subtitle': 'Subtitling in Progress',
                'Translate': 'Translation in Progress',
                'Review': 'Review in Progress',
                'Approve': 'Approval in Progress'
            }[this.type];
        } else {
            this.stepDisplay = {
                'Subtitle': 'Needs Subtitles',
                'Translate': 'Needs Translation',
                'Review': 'Needs Review',
                'Approve': 'Needs Approval'
            }[this.type];
        }
    }
});
var TaskListItem = Class.$extend({
    __init__: function(model, parent) {
        // Rebind functions
        this.onPerformClick = _.bind(this.onPerformClick, this);
        this.onAssignClick = _.bind(this.onAssignClick, this);
        this.onAssignSubmit = _.bind(this.onAssignSubmit, this);
        this.onDeleteClick = _.bind(this.onDeleteClick, this);

        this.onTaskDeleted = _.bind(this.onTaskDeleted, this);
        this.onTaskAssigned = _.bind(this.onTaskAssigned, this);

        this.render = _.bind(this.render, this);

        // Store data
        this.model = model;

        // Render template
        this.el = $("<li></li>");
        this.render();
    },

    render: function() {
        $(this.el).html(ich.tasksListItem(this.model));

        // Bind events
        $("a.perform", this.el).click(this.onPerformClick);
        $("a.action-delete", this.el).click(this.onDeleteClick);
        $("a.action-assign", this.el).click(this.onAssignClick);
        $("a.action-assign-submit", this.el).click(this.onAssignSubmit);
    },

    onPerformClick: function(e) {
        e.preventDefault();
        $(e.target).closest('form').submit();
    },
    onAssignClick: function(e) {
        e.preventDefault();
        $(e.target).hide();
        $(e.target).siblings('.assignee-choice').fadeIn('fast');
    },
    onAssignSubmit: function(e) {
        e.preventDefault();

        var assignee_id = $(e.target).closest('form').find('select').val();
        if (assignee_id !== "") {
            if (this.model.type === "Translate") {
                TeamsApiV2.task_translate_assign(this.model.teamVideo, this.model.language, assignee_id, this.onTaskAssigned);
            } else {
                TeamsApiV2.task_assign(this.model.pk, assignee_id, this.onTaskAssigned);
            }
        }
    },
    onDeleteClick: function(e) {
        e.preventDefault();
        TeamsApiV2.task_delete(this.model.pk, this.onTaskDeleted);
    },
    onTaskDeleted: function(data) {
        this.el.remove();
        this.parent.removeTask(this);
    },
    onTaskAssigned: function(data) {
        if (data && data.error) {
            $.jGrowl(data.error);
        } else {
            this.model = new TaskModel(data);
            this.render();
        }
    }
});
var TasksLanguagesList = Class.$extend({
    __init__: function(languages, parent) {
        // Rebind functions
        this.render = _.bind(this.render, this);
        this.getValue = _.bind(this.getValue, this);
        this.onLanguageFilterChange = _.bind(this.onLanguageFilterChange, this);

        // Store data
        this.languages = languages;
        this.parent = parent;

        // Render template
        this.render();
    },

    render: function() {
        // Clear old root element
        this.el && this.el.remove();
        this.el = ich.tasksLanguagesList({});

        // Add each language option
        _.each(this.languages, function(lang) {
            this.el.append(ich.tasksLanguagesListOption(lang));
        }, this);

        // Bind events
        $(this.el).change(this.onLanguageFilterChange);
    },

    getValue: function() {
        return this.el.val();
    },

    onLanguageFilterChange: function(e) {
        e.preventDefault();
        this.parent.reloadTasks();
    }
});
var TasksTypesList = Class.$extend({
    __init__: function(parent) {
        // Rebind functions
        this.render = _.bind(this.render, this);
        this.onTypeClick = _.bind(this.onTypeClick, this);
        this.getValue = _.bind(this.getValue, this);

        // Store data
        this.parent = parent;

        // Render template
        this.render();
    },

    render: function() {
        // Create element
        this.el = ich.tasksTypesList({});

        // Bind events
        $('li.type', this.el).click(this.onTypeClick);
    },

    getValue: function() {
        return $('.selected input', this.el).val();
    },

    onTypeClick: function(e) {
        e.preventDefault();

        if ($(e.target).hasClass('selected')) {
            return;
        }

        // Clear language dropdown and mark the target as selected.
        $('select#id_task_language').val('');
        $('.type', this.el).removeClass('selected');
        $(e.target).addClass('selected');

        this.parent.reloadTasks();
    }
});
var TasksPanel = AsyncPanel.$extend({
    __init__: function() {
        // Rebind functions
        this.onTasksListLoaded = _.bind(this.onTasksListLoaded, this);
        this.onTasksLanguagesListLoaded = _.bind(this.onTasksLanguagesListLoaded, this);

        this.getFilters = _.bind(this.getFilters, this);
        this.removeTask = _.bind(this.removeTask, this);
        this.reloadTasks = _.bind(this.reloadTasks, this);

        // Render template
        this.el = ich.tasksPanel();

        this.typesList = new TasksTypesList(this);
        $('#tasks_type_filter', this.el).append(this.typesList.el);

        // Initialize data
        this.tasks = [];
        TeamsApiV2.tasks_list(TEAM_SLUG, {}, this.onTasksListLoaded);

        TeamsApiV2.tasks_languages_list(TEAM_SLUG, this.onTasksLanguagesListLoaded);
    },

    reloadTasks: function() {
        TeamsApiV2.tasks_list(TEAM_SLUG, this.getFilters(), this.onTasksListLoaded);
    },

    renderTasksList: function() {
        var tasksListing = $('.tasks.listing', this.el);

        $('li', tasksListing).remove();

        _.each(this.tasks, function(task) {
            tasksListing.append(task.el);
        });
    },

    onTasksListLoaded: function(data) {
        this.tasks = _.map(data, function(t) {
            return new TaskListItem(new TaskModel(t), this);
        }, this);
        this.renderTasksList();
    },
    onTasksLanguagesListLoaded: function(data) {
        this.languagesList = new TasksLanguagesList(data, this);
        $('#tasks_language_filter', this.el).append(this.languagesList.el);
    },

    getFilters: function() {
        return { language: this.languagesList.getValue(),
                 type: this.typesList.getValue() };
    },

    removeTask: function(task) {
        this.tasks = _.without(this.tasks, task);
    }
});

// Main -----------------------------------------------------------------------
function bootstrap() {
    var panel = new TasksPanel();
    $('.panel-holder').append(panel.el);
    panel.el.show();
}
bootstrap();

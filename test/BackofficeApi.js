var Mosaic = require('..');
var P = Mosaic.P;
var Class = Mosaic.Class;
var _ = require('underscore');

/** Backoffice API. It has no dependencies on Express or other frameworks. */
var BackofficeApi = Mosaic.Class.extend({});
_.extend(BackofficeApi, {
    SESSION_ID : '124',
    USER_INFO : {
        firstName : 'John',
        lastName : 'Smith',
        age : 33,
        login : 'John',
        password : 'Smith'
    },
});
_.extend(BackofficeApi.prototype, {

    /** Initializes this object and creates an empty index of projects. */
    initialize : function(options) {
        this.options = options || {};
        this.projects = {};
    },

    /**
     * Checks login/password pair and return an error if there is no such
     * credentials. This method accepts only this login/password pair:
     * login:'John', password:'Smith'.
     */
    login : function(params) {
        var that = this;
        return P.then(function() {
            params = params || {};
            if (params.login !== BackofficeApi.USER_INFO.login || // 
            params.password !== BackofficeApi.USER_INFO.password) {
                that.throwError(401, 'Bad credentials');
            }
            // Creates and returns a new session identifier.
            return {
                sessionId : BackofficeApi.SESSION_ID,
                user : BackofficeApi.USER_INFO
            };
        });
    },

    /**
     * Log-out the currently logged user. Fails if the user is not logged in.
     */
    logout : function(params) {
        var that = this;
        return P.then(function() {
            params = that._checkSession(params);
            return {
                msg : 'You are logged out.'
            };
        });
    },

    /**
     * Returns information about the logged user.
     */
    userInfo : function(params) {
        var that = this;
        return P.then(function() {
            params = that._checkSession(params);
            return BackofficeApi.USER_INFO;
        });
    },

    // ------------------------------------------------------------------------
    // Project management

    /** Creates and returns a new project with the specified name */
    createProject : function(params) {
        var that = this;
        return P.then(function() {
            params = that._checkSession(params);
            // TODO: Check access rights for modifications
            var projectName = params.name;
            if (!projectName) {
                that.throwError(501, 'Project name is not defined');
            }
            var project = {
                name : projectName,
                id : _.uniqueId('project-')
            };
            that.projects[project.id] = project;
            return project;
        });
    },

    /** Returns a list of all projects. */
    listProjects : function(params) {
        var that = this;
        return P.then(function() {
            params = that._checkSession(params);
            return _.values(that.projects);
        });
    },

    /**
     * Returns information about a project corresponding to the specified
     * identifier.
     */
    getProjectInfo : function(params) {
        var that = this;
        return P.then(function() {
            params = that._checkSession(params);
            var projectId = params.projectId;
            if (!projectId) {
                that.throwError(501, 'Project identifier is not defined');
            }
            var project = that.projects[projectId];
            if (!project) {
                that.throwError(404, 'Project with ' + //
                'the specified identifier ' + //
                'was not found. ID: ' + projectId);
            }
            return project;
        });
    },

    /** Saves an existing project with new parameters. */
    saveProjectInfo : function(params) {
        var that = this;
        return P.then(function() {
            // TODO: Check access rights for modifications
            return that.getProjectInfo(params).then(function(project) {
                project.name = params.name;
                project.description = params.description;
                return project;
            });
        });
    },

    // ------------------------------------------------------------------------
    // Utility methods

    /** Throws an exception with the specified code and message. */
    throwError : function(code, msg) {
        var err = Mosaic.Errors.newError(msg).code(code);
        throw err;
    },

    /** An utility method used to centralize session verification. */
    _checkSession : function(params) {
        var that = this;
        params = params || {};
        if (params.sessionId != BackofficeApi.SESSION_ID) {
            that.throwError(403, 'Forbidden');
        }
        return params;
    }
});

module.exports = BackofficeApi;

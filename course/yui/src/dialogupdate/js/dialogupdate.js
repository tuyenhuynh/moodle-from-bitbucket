/**
 * The activity setting up and update dialogue for courses.
 *
 * @module moodle-course-dialogupdate
 */

var CSS = {
    PANELCONTENT : '#panelContentUpdate',
    FORMOPPONENT : '#mform1',
    FORMCONTAINER : '#panelContentUpdate #mform1',
    SUBMITBUTTON2: '#panelContentUpdate .hidden  #id_submitbutton2',
    SUBMITBUTTON: '#panelContentUpdate .hidden  #id_submitbutton',
    CANCELBUTTON: '#panelContentUpdate .hidden  #id_cancel',
    CANCELBUTTON2: '#panelContentUpdate .yui3-widget-hd .yui3-button.yui3-button-close',
    COURSEVIEW : '#page-course-view-weeks',
    FORM : 'mform1',
    INITBUTTON : 'a.editing_update.menu-action.cm-edit-action',
    DUPLICATEBUTTON : 'a.editing_duplicate.menu-action.cm-edit-action',
    JSVALIDATE: 'head script[src="http://localhost/moodle/course/moduvjs.js"]',
    JSFORM: 'head script[src="http://localhost/moodle/course/modujs.js"]',
    SECTION: '#panelContentUpdate input[name="section"]',
    MODULENAME: '#panelContentUpdate input[name="modulename"]'
};

var DIALOGNAME = 'course-dialogupdate';

/**
 * The activity setting up and update dialogue for courses.
 *
 * @constructor
 * @class M.course.modchooser
 * @extends Y.Base
 */
var DIALOG = function() {
    DIALOG.superclass.constructor.apply(this, arguments);
};
Y.extend(DIALOG, Y.Base, {
    /**
     * Update reaction on "Save and return to course"
     *
     * @method change_submit
     */
    change_submit: function() {
        Y.on('domready', function() {
            Y.one(CSS.SUBMITBUTTON2).on('click', this.submit_click,this);
        },this);
    },
    /**
     * Reaction on click "Save and return to course",
     * validate form and update course if it's posible
     *
     * @method submit_click
     * @param {event} e event object
     */
    submit_click: function (e) {
        e.preventDefault();
        // Disable submit buttons to say moodle, what action we do.
        Y.one(CSS.CANCELBUTTON).set('disabled', 'disabled');
        if (Y.one(CSS.SUBMITBUTTON) !== null) {
            Y.one(CSS.SUBMITBUTTON).set('disabled', 'disabled');
        }
        // AJAX post form request to server side.
        var cfg = {
            method: "post",
            on: {
                success: this.post_success
            },
            arguments: this,
            form: { id:CSS.FORM}
        };
        Y.io(M.cfg.wwwroot + "/course/modedit.php?isformajax=2", cfg);
    },
    /**
     * Helper function, it handle response of submit form.",
     * if no errors, update course view, else show form with errors.
     *
     * @method post_success
     * @param {Int} id identification number of current transaction
     * @param {object} o response object
     * @param {object} self dialog object
     */
    post_success : function (id, o, self) {
        if(o.responseText.indexOf(CSS.FORM) === -1) {
            var url = document.URL;
            var query = {};
            var a = url.substr(url.search("id")).split('&');
            for (var i in a) {
                var b = a[i].split('=');
                b[1] = b[1].search('#section') != -1?b[1].substr(0,b[1].search('#section')):b[1];
                query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
            }
            var string = '#section-' + Y.one(CSS.SECTION).get('value');
            var cfg = {
                on: {
                    success: self.update_course
                },
                arguments: [this, string]
            };
            url = M.cfg.wwwroot + "/course/view.php?id=" + query.id;
            Y.io(url, cfg);
        } else {
            self.show_form(id,o);
        }
    },
     /**
     * Helper function, update course view, else show form with errors.
     *
     * @method update_course
     * @param {Int} id identification number of current transaction
     * @param {object} o response object
     */
    update_course : function (id, o, params) {
        // Update course view
        document.open();
        document.write(o.responseText);
        document.close();
        var s = new Y.Anim({
                node: Y.UA.gecko ? 'html' : 'body',
                to: { scrollTop: Y.one(params[1]).getY() },
                duration: 0.5,
                easing: Y.Easing.easeBoth});
        s.run();
    },
    /**
     * Show form for setting up and update dialogue for courses.
     *
     * @method show_form
     * @param {Int} id identification number of current transaction
     * @param {object} o response object
     */
    show_form: function (x, o, strings) {
        // Remove old panel if it exist
        var module;
        if (Y.one(CSS.PANELCONTENT) !== null) {
            module = Y.one(CSS.MODULENAME).get('value');
            if (typeof(strings) === 'undefined') {
                strings = Y.one(CSS.PANELCONTENT).one('[name=' + module + ']').get('value');
            }
            Y.one(CSS.PANELCONTENT).remove();
        }
        var opponents = Y.all(CSS.FORMOPPONENT);
        for (var i = 0; i < opponents.size(); i++) {
            opponents.item(i).remove();
        }
        if (Y.one(CSS.JSVALIDATE) !== null) {
            Y.one(CSS.JSVALIDATE).remove();
            Y.one(CSS.JSFORM).remove();
        }
        // Create panel and append it to page
        var panelContent = Y.Node.create('<div>');
        panelContent.set('id','panelContentUpdate');
        Y.one(CSS.COURSEVIEW).appendChild(panelContent);
        panelContent.setContent(o.responseText);
        Y.one(CSS.FORMCONTAINER).setStyle("height","500");
        Y.one(CSS.FORMCONTAINER).setStyle("overflow","auto");

        // Load addition js libraryes.
        Y.Get.js(M.cfg.wwwroot + "/lib/javascript-static.js");
        Y.Get.js(M.cfg.wwwroot + "/course/moduvjs.js");
        Y.Get.js(M.cfg.wwwroot + "/course/modujs.js");

        // Create panel object
        module = Y.one(CSS.MODULENAME).get('value');
        if (typeof(strings) === 'object') {
            strings = strings[1][module];
        }
        var name = Y.Node.create('<input>');
        name.set('name',module);
        name.set('value',strings);
        Y.one(CSS.PANELCONTENT).one('[style="display: none;"]').append(name);
        var panel = new Y.Panel({
            srcNode      : CSS.PANELCONTENT,
            headerContent: 'Edit ' +  strings,
            width        : 1000,
            zIndex       : 5,
            centered     : true,
            modal        : true,
            visible      : false,
            render       : true,
            plugins      : []
        });
        // Move panel down, if it partially visible
        if (Y.one(CSS.PANELCONTENT).getY() < 50) {
            Y.one(CSS.PANELCONTENT).setY(50);
        }
        //Show panel
        panel.show();
        var s = new Y.Anim({
            node: Y.UA.gecko ? 'html' : 'body',
            to: { scrollTop: panelContent.getY() },
            duration: 0.5,
            easing: Y.Easing.easeBoth});
        s.run();
        // Set reaction on "Cancel"
        Y.fire('domready');
        Y.one(CSS.CANCELBUTTON).on('click', function (e1) {
            e1.preventDefault();
            panel.hide();
        });
        Y.one(CSS.CANCELBUTTON2).on('click', function (e1) {
            e1.preventDefault();
            panel.hide();
        });
    },
    /**
     * Reaction on click "Save and return to course",
     * validate form and update course if it's posible
     *
     * @method submit_click
     * @param {event} e event object
     * @param {object} self dialogue object
     */
    on_click: function (e,params) {
        e.preventDefault();
        // AJAX request to get information to form
        var url = this.get('href') + '&isformajax=2';
        var cfg = {
            on: {
                success: params[0].show_form
            },
            arguments: params
        };
        Y.io(url, cfg);
    },
    /**
     * Set up the activity form.
     *
     * @method init
     */
    init : function(){
        M.course.coursebase.register_module(this);
    },
    /**
     * Set up dialog.
     *
     * @method setupDialog
     */
    setupDialog: function(e,params) {
        if(typeof(e['_event']) !== 'undefined' && typeof(params) !== 'undefined' && params[0] == Y.all(CSS.INITBUTTON).size()) {
            Y.later(500,this,this.setupDialog,[e,params]);
        }
        else {
            e = typeof(params) !== 'undefined'? params[1]:e;
            var nodelist = Y.all(CSS.INITBUTTON);
            for (var i = 0; i < nodelist.size(); i++) {
                nodelist.item(i).detach('click');
                nodelist.item(i).on('click',this.on_click,nodelist.item(i),[this,e]);
            }
            this.setupDuplicate(e);
        }
    },
    /**
     * Set up duplicate menu item
     *
     * @method setupDuplicate
     */
    setupDuplicate: function(strings) {
        var nodelist = Y.all(CSS.DUPLICATEBUTTON);
        var count = Y.all(CSS.INITBUTTON).size();
        for (var i = 0; i < nodelist.size(); i++) {
            nodelist.item(i).once('click',this.setupDialog,this,[count,strings]);
        }
    }
},
{
    NAME : DIALOGNAME,
    ATTRS : {
        /**
         * The maximum height (in pixels) of the activity chooser.
         *
         * @attribute maxheight

         * @type Number
         * @default 800
         */
        maxheight : {
            value : 800
        }
    }
});
M.course = M.course || {};
M.course.dialogupdate = function(config) {
    return new DIALOG(config);
};

YUI.add('moodle-course-dialogadd', function (Y, NAME) {

/**
 * The activity chooser dialogue for courses.
 *
 * @module moodle-course-modchooser
 */

var CSS = {
    PANELCONTENT : '#panelContentAdd',
    FORMOPPONENT : '#mform1',
    FORMCONTAINER : '#panelContentAdd #mform1',
    SUBMITBUTTON: '#panelContentAdd .hidden .felement.fgroup #id_submitbutton',
    SUBMITBUTTON2: '#panelContentAdd .hidden .felement.fgroup #id_submitbutton2',
    CANCELBUTTON: '#panelContentAdd .hidden .felement.fgroup #id_cancel',
    CANCELBUTTON2: '#panelContentAdd .yui3-widget-hd .yui3-button.yui3-button-close',
    COURSEVIEW : '#page-course-view-weeks',
    FORM : 'mform1',
    URL : '.moodle-dialogue-base #chooserform input[type=hidden][name=jump]',
    HEADER : '.moodle-dialogue-base #chooserform .option.selected .typename',
    INITBUTTON : '.moodle-dialogue-base .submitbutton[type=submit][value=Add]',
    JSVALIDATE: 'head script[src="http://localhost/moodle/course/modavjs.js"]',
    JSFORM: 'head script[src="http://localhost/moodle/course/modajs.js"]',
    SECTION: '#panelContentAdd input[name="section"]'
};

var DIALOGNAME = 'course-dialogadd';

/**
 * The activity chooser dialogue for courses.
 *
 * @constructor
 * @class M.course.dialogadd
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
            form: { id: CSS.FORM}
        };
        Y.io(M.cfg.wwwroot + "/course/modedit.php?isformajax=1", cfg);
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
    show_form: function (x, o, params) {
        // Remove old panel if it exist
        if (Y.one(CSS.PANELCONTENT) !== null) {
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
        panelContent.set('id','panelContentAdd');
        Y.one(CSS.COURSEVIEW).appendChild(panelContent);
        panelContent.setContent(o.responseText);
        Y.one(CSS.FORMCONTAINER).setStyle("height","500");
        Y.one(CSS.FORMCONTAINER).setStyle("overflow","auto");

        // Load addition js libraryes.
        Y.Get.js(M.cfg.wwwroot + "/lib/javascript-static.js");
        Y.Get.js(M.cfg.wwwroot + "/course/modavjs.js");
        Y.Get.js(M.cfg.wwwroot + "/course/modajs.js");

        // Create panel object
        var panel = new Y.Panel({
            srcNode      : CSS.PANELCONTENT,
            headerContent: 'Add ' + params[1],
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
        panel.show();
        var s = new Y.Anim({
            node: Y.UA.gecko ? 'html' : 'body',
            to: { scrollTop: panelContent.getY() },
            duration: 0.5,
            easing: Y.Easing.easeBoth});
        s.run();
        Y.fire('domready');
        Y.one(CSS.CANCELBUTTON).on('click', function (e1) {
            e1.preventDefault();
            panel.hide();
        },this);
	/*Y.one(CSS.CANCELBUTTON2).on('click', function (e1) {
            e1.preventDefault();
            panel.hide();
        });*/
    },
    /**
     * Reaction on click "Save and return to course",
     * validate form and update course if it's posible
     *
     * @method on_click
     * @param {event} e event object
     * @param {object} self dialogue object
     */
    on_click: function (e) {
        e.preventDefault();
	var text = Y.one(CSS.HEADER).get('text');
        var url;
        var cfg = {
            on: {
                success: this.show_form
            },
            arguments: [this, text]
        };
        url = Y.one(CSS.URL).get('value') + "&isformajax=1";
        Y.io(url,cfg);
    },
    /**
     * Set up the activity form.
     *
     * @method init
     */
    init: function(){
        M.course.coursebase.register_module(this);
    },
    /**
     * Set up dialog.
     *
     * @method setupDialog
     */
    setupDialog: function() {
        Y.one(CSS.INITBUTTON).once('click', this.on_click,this);
    },
    /**
     * Disable dialog.
     *
     * @method detachDialog
     */
    detachDialog: function() {
        Y.one(CSS.INITBUTTON).detach('click', this.on_click);
    }
},
{
    NAME : DIALOGNAME,
    ATTRS : {
        maxheight : {
            value : 800
        }
    }
});
M.course = M.course || {};
M.course.dialogadd = function(config) {
    return new DIALOG(config);
};


}, '@VERSION@', {"requires": ["io-base", "io-form", "anim", "moodle-course-coursebase"]});

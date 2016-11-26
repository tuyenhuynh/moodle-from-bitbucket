YUI.add('moodle-course-dialogupdate', function (Y, NAME) {

    /**
     * The activity setting up and update dialogue for courses.
     *
     * @module moodle-course-dialogupdate
     */

    var CSS = {
        PANELCONTENT    : '#panelContentUpdate',
        PANELHEADER     : "#panelContentUpdate .yui3-widget-hd",
        FORMOPPONENT    : '#mform1',
        FORMCONTAINER   : '#panelContentUpdate #mform1',
        SUBMITBUTTON2   : '#panelContentUpdate .hidden  #id_submitbutton2',
        SUBMITBUTTON    : '#panelContentUpdate .hidden  #id_submitbutton',
        CANCELBUTTON    : '#panelContentUpdate .hidden  #id_cancel',
        CANCELBUTTON2   : '#panelContentUpdate .yui3-widget-hd .yui3-button.yui3-button-close',
        COURSEVIEW      : '#page-course-view-weeks',
        FORM            : 'mform1',
        INITBUTTON      : 'a.editing_update.menu-action.cm-edit-action',
        DUPLICATEBUTTON : 'a.editing_duplicate.menu-action.cm-edit-action',
        SESSKEY         : "#panelContentUpdate form#mform1 input[name=sesskey]",
        COURSEID        : "#panelContentUpdate form#mform1 input[name=course]",
        UPDATE          : "#panelContentUpdate form#mform1 input[name=update]", 
        MODULENAME      : '#panelContentAdd form#mform1 input[type=hidden][name=modulename]'
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
            get_query_params: function(url) {
                var params = {};
                var url = document.URL;
                var a = url.substr(url.search("\\?")+1).split('&');
                for (var i in a) {
                    var b = a[i].split('=');
                    params[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
                }
                return params;
            },
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
                var validatorName = 'validate_mod_' + modulename + '_mod_form';   
                if(eval(validatorName)()){
                    e.preventDefault();
                    // Disable submit buttons to say moodle, what action we do.
                    Y.one(CSS.CANCELBUTTON).set('disabled', 'disabled');
                    if (Y.one(CSS.SUBMITBUTTON) !== null) {
                        Y.one(CSS.SUBMITBUTTON).set('disabled', 'disabled');
                    }

                    var courseId = Y.one(CSS.COURSEID).get("value");
                    var sesskey = Y.one(CSS.SESSKEY).get("value");
                    var update = Y.one(CSS.UPDATE).get("value");
                    alert(update); 
                    // AJAX post form request to server side.
                    var cfg = {
                        method: "post",
                        on: {
                            success: this.post_success

                        },
                        arguments: this,
                        form: { id:CSS.FORM}
                    };
                    
                    Y.io(M.cfg.wwwroot + "/course/rest.php?class=updatemodule&courseId=" + courseId + "&sesskey=" + sesskey + "&update=" + update, cfg);
                }
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
                    var cfg = {
                        on: {
                            success: self.update_course
                        }
                    };
                    var params = {};
                    var courseUrl = document.URL;
                    var a = courseUrl.substr(courseUrl.indexOf('?')+1).split('&');
                    for (var i in a) {
                        var b = a[i].split('=');
                        params[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
                    }
                    Y.io(M.cfg.wwwroot + "/course/view.php?id=" + params.id, cfg);
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
            update_course : function (id, o) {
                // Update course view
                document.open();
                document.write(o.responseText);
                document.close();
            },
            /**
             * Show form for setting up and update dialogue for courses.
             *
             * @method show_form
             * @param {Int} id identification number of current transaction
             * @param {object} o response object
             */
            show_form: function (x, o) {

                var responseObject = JSON.parse(o.responseText);

                //Remove old panel if it exist
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
                panelContent.set('id','panelContentUpdate');
                Y.one(CSS.COURSEVIEW).appendChild(panelContent);
                panelContent.setContent(responseObject.html);
                Y.one(CSS.FORMCONTAINER).setStyle("height","80%");
                Y.one(CSS.FORMCONTAINER).setStyle("padding-left","30px");
                Y.one(CSS.FORMCONTAINER).setStyle("padding-right","30px");
                Y.one(CSS.FORMCONTAINER).setStyle("overflow","auto");

                // Create panel object
                var panel = new Y.Panel({
                    srcNode      : CSS.PANELCONTENT,
                    headerContent: 'Edit',
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
                Y.one(CSS.PANELCONTENT).setStyle("padding-bottom", "10px");
                Y.one(CSS.PANELCONTENT).setStyle("border-radius", "10px");
                Y.one(CSS.PANELHEADER).setStyle("border-radius", "10px 10px 0px 0px");
                
                //Show panel
                panel.show();
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

                // execute the response script
                var scriptElement = document.createElement('script');
                scriptElement.textContent = responseObject.script;
                document.body.appendChild(scriptElement);

            },
            /**
             * Reaction on click "Save and return to course",
             * validate form and update course if it's posible
             *
             * @method submit_click
             * @param {event} e event object
             * @param {object} self dialogue object
             */
            on_click: function (e,self) {
                e.preventDefault();
                // AJAX request to get information to form
                var cfg = {
                    on: {
                        success: self.show_form
                    },
                    arguments: self
                };
                var params = {};
                var courseUrl = document.URL;
                var a = courseUrl.substr(courseUrl.search("\\?")+1).split('&');
                for (var i in a) {
                    var b = a[i].split('=');
                    params[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
                }
                var url = this.get('href');
                Y.io(M.cfg.wwwroot + '/course/rest.php'+
                    url.substr(url.indexOf('?')) + '&class=updatemodule&courseId='+params.id, cfg);
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
            setupDialog: function(e,c) {
                if(typeof(e) !== 'undefined' && c == Y.all(CSS.INITBUTTON).size()) {
                    Y.later(500,this,this.setupDialog,[e,c]);
                }
                else {
                    var nodelist = Y.all(CSS.INITBUTTON);
                    for (var i = 0; i < nodelist.size(); i++) {
                        nodelist.item(i).detach('click');
                        nodelist.item(i).on('click',this.on_click,nodelist.item(i),this);
                    }
                    this.setupDuplicate();
                }
            },
            /**
             * Set up duplicate menu item
             *
             * @method setupDuplicate
             */
            setupDuplicate: function() {
                var nodelist = Y.all(CSS.DUPLICATEBUTTON);
                var count = Y.all(CSS.INITBUTTON).size();
                for (var i = 0; i < nodelist.size(); i++) {
                    nodelist.item(i).once('click',this.setupDialog,this,count);
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


}, '@VERSION@', {"requires": ["io-base", "io-form"]});

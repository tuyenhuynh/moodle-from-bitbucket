YUI.add('moodle-course-dialogadd', function (Y, NAME) {

    /**
     * The activity chooser dialogue for courses.
     *
     * @module moodle-course-modchooser
     */

    var CSS = {
        PANELCONTENT    : '#panelContentAdd',
        PANELHEADER     : "#panelContentAdd .yui3-widget-hd",
        FORMOPPONENT    : '#mform1',
        FORMCONTAINER   : '#panelContentAdd #mform1',
        SUBMITBUTTON    : '#panelContentAdd .felement .fitem #id_submitbutton',
        SUBMITBUTTON2   : '#panelContentAdd .felement .fitem #id_submitbutton2',
        CANCELBUTTON    : '#panelContentAdd .felement .fitem #id_cancel',
        CANCELBUTTON2   : '#panelContentAdd .yui3-widget-hd .yui3-button.yui3-button-close',
        COURSEVIEW      : '#page-course-view-topics',
        FORM            : 'mform1',
        URL             : '.moodle-dialogue-base #chooserform input[type=hidden][name=jump]',
        HEADER          : '.moodle-dialogue-base #chooserform .option.selected .typename',
        INITBUTTON      : '.moodle-dialogue-base .submitbutton[type=submit][name=submitbutton]',
        COURSEIDINPUT   : '#panelContentAdd form#mform1 input[type=hidden][name=course]', 
        MODULENAME      : '#panelContentAdd form#mform1 input[type=hidden][name=modulename]', 
        SECTION         : '#panelContentAdd form#mform1 input[type=hidden][name=section]'
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

            section: 0, 
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
                var modulename = Y.one(CSS.MODULENAME).get('value');
                var validatorName = 'validate_mod_' + modulename + '_mod_form';  
                if(eval(validatorName)()){
                    e.preventDefault();
                    // Disable submit buttons to say moodle, what action we do.
                    Y.one(CSS.CANCELBUTTON).set('disabled', 'disabled');
                    if (Y.one(CSS.SUBMITBUTTON) !== null) {
                        Y.one(CSS.SUBMITBUTTON).set('disabled', 'disabled');
                    }
                    var courseId = Y.one(CSS.COURSEIDINPUT).get("value");
                    // AJAX post form request to server side.
                    var cfg = {
                        method: "post",
                        on: {
                            success: this.post_success
                        },
                        arguments: this,
                        form: { id: CSS.FORM}
                    };
                    Y.io(M.cfg.wwwroot + "/course/rest.php?class=addmod&courseId="+courseId, cfg);  
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
                    var url = document.URL;     
                    var query = {};
                    var a = url.substr(url.search("\\?")+1).split('&');
                    for (var i in a) {
                        var b = a[i].split('=');
                        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
                    }
                    var cfg = {
                        on: {
                            success: self.update_course
                        }
                    };
                    var id = query.id; 
                    if(id.indexOf('#') > 0) {
                       id = id.split('#')[0];      
                    }    
                    this.section = Y.one(CSS.SECTION).get('value'); 
                    Y.io(M.cfg.wwwroot + "/course/view.php?id=" + query.id, cfg);

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
                window.location.hash = "#section-" + this.section; 
            },
            /**
             * Show form for setting up and update dialogue for courses.
             *
             * @method show_form
             * @param {Int} id identification number of current transaction
             * @param {object} res response object
             */
            show_form: function (id, o, params) {
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

                var responseObject = JSON.parse(o.responseText);
                panelContent.setContent(responseObject.html);
                Y.one(CSS.FORMCONTAINER).setStyle("height","500");
                Y.one(CSS.FORMCONTAINER).setStyle("padding-left","30px");
                Y.one(CSS.FORMCONTAINER).setStyle("padding-right","30px");
                Y.one(CSS.FORMCONTAINER).setStyle("overflow","auto");  
                // Create panel object
                panel = new Y.Panel({
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
                Y.one(CSS.PANELCONTENT).setStyle("padding-bottom", "10px");
                Y.one(CSS.PANELCONTENT).setStyle("border-radius", "10px");
                Y.one(CSS.PANELHEADER).setStyle("border-radius", "10px 10px 0px 0px");
                Y.fire('domready');
                Y.one(CSS.CANCELBUTTON).on('click', function (e1) {
                    e1.preventDefault();
                    panel.hide();
                },this);

                // execute the response script
                var scriptElement = document.createElement('script');
                scriptElement.textContent = responseObject.script;
                document.body.appendChild(scriptElement);
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
                var original_url = Y.one(CSS.URL).get('value');
                var query_string = original_url.substring(original_url.indexOf('?'));
                url = M.cfg.wwwroot + "/course/rest.php" + query_string + '&class=addmod';
                url = url.replace("?id=", "?courseId=");
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


}, '@VERSION@', {"requires": ["io-base", "io-form"]});
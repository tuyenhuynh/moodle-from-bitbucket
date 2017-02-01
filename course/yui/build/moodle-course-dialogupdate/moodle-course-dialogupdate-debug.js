YUI.add('moodle-course-dialogupdate', function (Y, NAME) {

    /**
     * The activity setting up and update dialogue for courses.
     *
     * @module moodle-course-dialogupdate
     */

    var CSS = {
        BODY            : 'body', 
        PANELCONTENT    : '#panelContentUpdate',
        PANELHEADER     : "#panelContentUpdate .yui3-widget-hd",
        FORMOPPONENT    : '#mform1',
        FORMCONTAINER   : '#panelContentUpdate #mform1',
        SUBMITBUTTON2   : '#panelContentUpdate #id_submitbutton2',
        SUBMITBUTTON    : '#panelContentUpdate #id_submitbutton',
        CANCELBUTTON    : '#panelContentUpdate #id_cancel',
        CANCELBUTTON2   : '#panelContentUpdate .yui3-widget-hd .yui3-button.yui3-button-close',
        COURSEVIEW      : '#page-course-view-topics',
        FORM            : 'mform1',
        INITBUTTON      : 'a.editing_update.menu-action.cm-edit-action',
        DUPLICATEBUTTON : 'a.editing_duplicate.menu-action.cm-edit-action',
        COURSEID        : '#panelContentUpdate form#mform1 input[name=course]',
        UPDATE          : '#panelContentUpdate form#mform1 input[name=update]', 
        MODULETYPE      : '#panelContentUpdate form#mform1 input[name=modulename]', 
        MODULETITLE      : '#panelContentUpdate form#mform1 input[name=name]', 
        MODULEDESCRIPTION      : '#panelContentUpdate form#mform1 div#id_introeditoreditable', 
        SHOWDESCRIPTION      : '#panelContentUpdate form#mform1 input[name=showdescription]', 
        MODULETLABEL      : '#panelContentUpdate form#mform1 input[name=label]', 
        WIDGETMASK :    '.yui3-widget-mask', 
        SECTION         : '#panelContentUpdate form#mform1 input[name=section]', 

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
                e.preventDefault(); 
                var moduleType  = Y.one(CSS.MODULETYPE).get("value"); 
                var validatorName = 'validate_mod_' + moduleType + '_mod_form';   
                if(clientSideValidator()){
                    
                    // Disable submit buttons to say moodle, what action we do.
                    Y.one(CSS.CANCELBUTTON).set('disabled', 'disabled');
                    if (Y.one(CSS.SUBMITBUTTON) !== null) {
                        Y.one(CSS.SUBMITBUTTON).set('disabled', 'disabled');
                    }

                    var courseId = Y.one(CSS.COURSEID).get("value");
                    var update = Y.one(CSS.UPDATE).get("value");
                    var section = Y.one(CSS.SECTION).get("value");
                    window.section = section;  
                    // AJAX post form request to server side.
                    var cfg = {
                        method: "post",
                        on: {
                            success: function(id, o, self) {
                                var moduleTitle = Y.one(CSS.MODULETITLE);
                                var moduleDescription = Y.one(CSS.MODULEDESCRIPTION);
                                var showDescription = Y.one(CSS.SHOWDESCRIPTION);
                                var moduleLabel = Y.one(CSS.MODULELABEL); 
                                self.post_success(id, o, self, 
                                    {
                                        moduleTitle: moduleTitle, 
                                        moduleDescription: moduleDescription, 
                                        showDescription: showDescription, 
                                        moduleLabel: moduleLabel
                                    }); 
                            }
                        },
                        arguments: this,
                        form: { id:CSS.FORM}
                    }; 
                    Y.io(M.cfg.wwwroot + "/course/rest.php?class=updatemod&courseId=" + courseId  + "&update=" + update, cfg);                    
                }else {
                    alert('invalid input'); 
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
            post_success : function (id, o, self, data) {
                var titleNode = selectedNodeContainer.get('previousSibling').get('children').item(0).get('children').item('0');
                var descriptionNode = selectedNodeContainer.get('previousSibling').get('children').item(0).get('children').item('0').get('children').item('1');
                if(data.moduleTitle) {
                    titleNode.set('innerHTML', data.moduleTitle.get('value')); 
                }

                Y.one(CSS.PANELCONTENT).remove(); 
                Y.one(CSS.WIDGETMASK).remove(); 
                window.location.hash = '#section-' + window.section; 
            },

            /**
             * Show form for setting up and update dialogue for courses.
             *
             * @method show_form
             * @param {Int} id identification number of current transaction
             * @param {object} o response object
             */
            show_form: function (html, js, module_type) { 
                var panelContent = Y.one(CSS.PANELCONTENT); 
                if (panelContent !== null) {
                    panelContent.remove();
                }
                var opponents = Y.all(CSS.FORMOPPONENT);
                for (var i = 0; i < opponents.size(); i++) {
                    opponents.item(i).remove();
                }
                var jsValidate = Y.one(CSS.JSVALIDATE); 
                if (jsValidate !== null) {
                    jsValidate.remove();
                    Y.one(CSS.JSFORM).remove();
                }
                // Create panel and append it to page
                var panelContentNode = Y.Node.create('<div>');
                panelContentNode.set('id','panelContentUpdate');
                Y.one(CSS.BODY).appendChild(panelContentNode);

                panelContentNode.setContent(html);
                var formContainer = Y.one(CSS.FORMCONTAINER) ; 
                formContainer.setStyle("height","500");
                formContainer.setStyle("padding-left","30px");
                formContainer.setStyle("padding-right","30px");
                formContainer.setStyle("overflow","auto");  
                // Create panel object
                panel = new Y.Panel({
                    srcNode      : CSS.PANELCONTENT,
                    headerContent: 'Update ' + module_type,
                    width        : 1000,
                    zIndex       : 1035,
                    centered     : true,
                    modal        : true,
                    visible      : false,
                    render       : true,
                    plugins      : []
                });
                // Move panel down, if it partially visible
                panelContent = Y.one(CSS.PANELCONTENT);
                if (panelContent.getY() < 50) {
                    panelContent.setY(50);
                }

                panel.show();
                panelContent.setStyle("padding-bottom", "10px");
                panelContent.setStyle("border-radius", "10px");
                panelContent.setStyle("top", "0px");
                Y.one(CSS.PANELHEADER).setStyle("border-radius", "10px 10px 0px 0px");
                Y.fire('domready');
                Y.one(CSS.CANCELBUTTON).on('click', function (e1) {
                    e1.preventDefault();
                    panel.hide();
                },this);

                //inject validator to windows
                var moduleType = Y.one(CSS.MODULETYPE).get('value');
                var validatorName = "validate_mod_" + moduleType + "_mod_form";
                var formListenerDecl = "document.getElementById('mform1').addEventListener"; 
                js = 'skipClientValidation=false;' + js;
                js = js.replace(formListenerDecl, 'window.clientSideValidator=' + validatorName + ';\n' + formListenerDecl);     
                js+= 'Y.use("moodle-course-dialogupdate", function() {M.course.dialogupdate().change_submit();})';
                // execute the response script
                var scriptElement = document.createElement('script');
                scriptElement.textContent = js;
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
                var obj = {};
                var courseUrl = document.URL;
                var tokens = courseUrl.substr(courseUrl.indexOf('?')+1).split('&');
                for (var i in tokens) {
                    var token = tokens[i].split('=');
                    obj[decodeURIComponent(token[0])] = decodeURIComponent(token[1]);
                }
                var targetUrl = e._currentTarget.href.split('#')[0];
                tokens = targetUrl.substr(targetUrl.indexOf("?")+1).split('&');
                for (var i in tokens) {
                    var token = tokens[i].split('=');
                    obj[decodeURIComponent(token[0])] = decodeURIComponent(token[1]);
                }
                var selectedNodeContainer = Y.one('a.editing_update.menu-action.cm-edit-action[href=' + targetUrl + ']');
                
                for(i = 0 ; i < 5 ; ++i) {
                    selectedNodeContainer = selectedNodeContainer.ancestor(); 
                } 
                window.selectedNodeContainer = selectedNodeContainer; 
                
                require(['core/fragment'], function(fragment){
                    var params = { update : obj.update, sr: obj.sr};
                    fragment.loadFragment('mod_' + obj.module_type, 'update_' + obj.module_type, obj.contextid, params)// return a promise (project of deferred)
                        .then(function(html, js) {
                            self.show_form(html, js, obj.module_type); 
                        });                    
                });
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
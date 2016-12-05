<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Provide interface for topics AJAX course formats
 *
 * @copyright 1999 Martin Dougiamas  http://dougiamas.com
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @package course
 */

if (!defined('AJAX_SCRIPT')) {
    define('AJAX_SCRIPT', true);
}
require_once("../config.php");
require_once("lib.php");
require_once($CFG->libdir.'/filelib.php');
require_once($CFG->libdir.'/gradelib.php');
require_once($CFG->libdir.'/completionlib.php');
require_once($CFG->libdir.'/plagiarismlib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once(__DIR__ . '/../config.php');
require_once($CFG->dirroot.'/course/lib.php');

// Initialise ALL the incoming parameters here, up front.
$courseid   = required_param('courseId', PARAM_INT);
$class      = required_param('class', PARAM_ALPHA);
$field      = optional_param('field', '', PARAM_ALPHA);
$instanceid = optional_param('instanceId', 0, PARAM_INT);
$sectionid  = optional_param('sectionId', 0, PARAM_INT);
$beforeid   = optional_param('beforeId', 0, PARAM_INT);
$value      = optional_param('value', 0, PARAM_INT);
$column     = optional_param('column', 0, PARAM_ALPHA);
$id         = optional_param('id', 0, PARAM_INT);
$summary    = optional_param('summary', '', PARAM_RAW);
$sequence   = optional_param('sequence', '', PARAM_SEQUENCE);
$visible    = optional_param('visible', 0, PARAM_INT);
$pageaction = optional_param('action', '', PARAM_ALPHA); // Used to simulate a DELETE command
$title      = optional_param('title', '', PARAM_TEXT);

$PAGE->set_url('/course/rest.php', array('courseId' => $courseid, 'class' => $class));

//NOTE: when making any changes here please make sure it is using the same access control as course/mod.php !!
$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
// Check user is logged in and set contexts if we are dealing with resource

if (in_array($class, array('resource'))) {
    $cm = get_coursemodule_from_id(null, $id, $course->id, false, MUST_EXIST);
    require_login($course, false, $cm);
    $modcontext = context_module::instance($cm->id);
} else {
    require_login($course);
}

$coursecontext = context_course::instance($course->id);
require_sesskey();

echo $OUTPUT->header(); // send headers

// OK, now let's process the parameters and do stuff
// MDL-10221 the DELETE method is not allowed on some web servers, so we simulate it with the action URL param
$requestmethod = $_SERVER['REQUEST_METHOD'];
if ($pageaction == 'DELETE') {
    $requestmethod = 'DELETE';
}

switch($requestmethod) {

    case 'GET': 
        switch($class) {
            case 'addmod': 
                $section = required_param('section', PARAM_INT);
                $add     = required_param('add', PARAM_TEXT);
                list($module, $context, $cw, $cm, $data) = prepare_new_moduleinfo_data($course, $add, $section);
                $data->return = 0;
                $data->sr = $sectionreturn;
                $data->add = $add;
                
                if (!empty($type)) { //TODO: hopefully will be removed in 2.0
                    $data->type = $type;
                }

                $sectionname = get_section_name($course, $cw);
                $fullmodulename = get_string('modulename', $module->name);

                if ($data->section && $course->format != 'site') {
                    $heading = new stdClass();
                    $heading->what = $fullmodulename;
                    $heading->to   = $sectionname;
                    $pageheading = get_string('addinganewto', 'moodle', $heading);
                } else {
                    $pageheading = get_string('addinganew', 'moodle', $fullmodulename);
                }
                $navbaraddition = $pageheading;

                $modmoodleform = "$CFG->dirroot/mod/$module->name/mod_form.php";
                if (file_exists($modmoodleform)) {
                    require_once($modmoodleform);
                } else {
                    print_error('noformdesc');
                }

                $mformclassname = 'mod_'.$module->name.'_mod_form';
                $mform = new $mformclassname($data, $cw->section, $cm, $course);
                $mform->set_data($data);

                $streditinga = get_string('editinga', 'moodle', $fullmodulename);
                $strmodulenameplural = get_string('modulenameplural', $module->name);

                if (!empty($cm->id)) {
                    $context = context_module::instance($cm->id);
                } else {
                    $context = context_course::instance($course->id);
                }

                $streditinga = get_string('editinga', 'moodle', $fullmodulename);
                $strmodulenameplural = get_string('modulenameplural', $module->name);

                if (!empty($cm->id)) {
                    $context = context_module::instance($cm->id);
                } else {
                    $context = context_course::instance($course->id);
                }

                ob_start();
                //Get the script generated by Form API and delete buffer's content (turns off output buffering)
                $mform->display();
                $formhtml = ob_get_clean();

                if(strpos($formhtml, '<script>') !== false) {
                    $outputparts = explode('<script>', $formhtml);
                    $html = $outputparts[0];
                    $script = str_replace('</script>', '', $outputparts[1]);
                }else {
                    $html = $formhtml;
                }

                //Get the M.yui.loader call which includes the Javascript libraries
                $headcode = $PAGE->requires->get_head_code($PAGE, $OUTPUT);
                $cfgpos = strpos($headcode, 'M.cfg');
                $loaderpos = strpos($headcode, 'M.yui.loader');
                $script .= substr($headcode, $cfgpos, $loaderpos - $cfgpos);

                //Get the initialization calls for those libraries
                $endcode = $PAGE->requires->get_end_code();
                
                $firstscript = strpos($endcode, "</script>"); 
                $endcode = substr($endcode, $firstscript + 9); 
                
                $script .= preg_replace('/<\/?(script|link)[^>]*>/', '', $endcode);
                $script .= '//<![CDATA[
                M.yui.add_module({"core_filepicker":{"name":"core_filepicker","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/repository\/filepicker.js","requires":["base","node","node-event-simulate","json","async-queue","io-base","io-upload-iframe","io-form","yui2-treeview","panel","cookie","datatable","datatable-sort","resize-plugin","dd-plugin","escape","moodle-core_filepicker"]},"mathjax":{"name":"mathjax","fullpath":"https:\/\/cdn.mathjax.org\/mathjax\/2.7-latest\/MathJax.js?delayStartupUntil=configured"},"core_dndupload":{"name":"core_dndupload","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/dndupload.js","requires":["node","event","json","core_filepicker"]},"form_filemanager":{"name":"form_filemanager","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/filemanager.js","requires":["moodle-core-notification-dialogue","core_filepicker","base","io-base","node","json","core_dndupload","panel","resize-plugin","dd-plugin"]},"mform":{"name":"mform","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/form.js","requires":["base","node"]}});
                    //]]>
                    ';
                $script .= 'Y.use("moodle-course-dialogadd", function() {M.course.dialogadd().change_submit();})';
                $pattern = "/(validate_mod_" . $data->add . '_mod_form)' . ';/';
                preg_match($pattern,$endcode, $matches); 
                $validator = 'window.' .  $matches[1] .'='. $matches[0];
                $validator_call = "document.getElementById('mform1').addEventListener";
                $script = str_replace($validator_call, $validator . "\n" . $validator_call, $script);
                echo json_encode(array('html' => $html, 'script' => $script));
                break;
            case 'updatemod':
                $update     = required_param('update', PARAM_TEXT);

                // Select the "Edit settings" from navigation.
                navigation_node::override_active_url(new moodle_url('/course/modedit.php', array('update' => $update, 'return' => 1)));

                // Check the course module exists.
                $cm = get_coursemodule_from_id('', $update, 0, false, MUST_EXIST);

                // Check the course exists.
                $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

                // require_login
                require_login($course, false, $cm); // needed to setup proper $COURSE

                list($cm, $context, $module, $data, $cw) = get_moduleinfo_data($cm, $course);
                $data->return = $return;
                $data->sr = $sectionreturn;
                $data->update = $update;

                $sectionname = get_section_name($course, $cw);
                $fullmodulename = get_string('modulename', $module->name);

                if ($data->section && $course->format != 'site') {
                    $heading = new stdClass();
                    $heading->what = $fullmodulename;
                    $heading->in   = $sectionname;
                    $pageheading = get_string('updatingain', 'moodle', $heading);
                } else {
                    $pageheading = get_string('updatinga', 'moodle', $fullmodulename);
                }
                $navbaraddition = null;
                
                $modmoodleform = "$CFG->dirroot/mod/$module->name/mod_form.php";
                if (file_exists($modmoodleform)) {
                    require_once($modmoodleform);
                } else {
                    print_error('noformdesc');
                }

                $mformclassname = 'mod_'.$module->name.'_mod_form';
                $mform = new $mformclassname($data, $cw->section, $cm, $course);
                $mform->set_data($data);

                $streditinga = get_string('editinga', 'moodle', $fullmodulename);
                $strmodulenameplural = get_string('modulenameplural', $module->name);

                if (!empty($cm->id)) {
                    $context = context_module::instance($cm->id);
                } else {
                    $context = context_course::instance($course->id);
                }
                ob_start();
                //Get the script generated by Form API and delete buffer's content (turns off output buffering)
                $mform->display();
                $formhtml = ob_get_clean();

                if(strpos($formhtml, '<script>') !== false) {
                    $outputparts = explode('<script>', $formhtml);
                    $html = $outputparts[0];
                    $script = str_replace('</script>', '', $outputparts[1]);
                }else {
                    $html = $formhtml;
                }

                //Get the M.yui.loader call which includes the Javascript libraries
                $headcode = $PAGE->requires->get_head_code($PAGE, $OUTPUT);
                $cfgpos = strpos($headcode, 'M.cfg');
                $loaderpos = strpos($headcode, 'M.yui.loader');
                $script .= substr($headcode, $cfgpos, $loaderpos - $cfgpos);

                //Get the initialization calls for those libraries
                $endcode = $PAGE->requires->get_end_code();
                
                $firstscript = strpos($endcode, "</script>"); 
                $endcode = substr($endcode, $firstscript + strlen("</script>")); 
                $script .= preg_replace('/<\/?(script|link)[^>]*>/', '', $endcode);
                $script .= '//<![CDATA[
                    M.yui.add_module({"core_filepicker":{"name":"core_filepicker","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/repository\/filepicker.js","requires":["base","node","node-event-simulate","json","async-queue","io-base","io-upload-iframe","io-form","yui2-treeview","panel","cookie","datatable","datatable-sort","resize-plugin","dd-plugin","escape","moodle-core_filepicker"]},"mathjax":{"name":"mathjax","fullpath":"https:\/\/cdn.mathjax.org\/mathjax\/2.7-latest\/MathJax.js?delayStartupUntil=configured"},"core_dndupload":{"name":"core_dndupload","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/dndupload.js","requires":["node","event","json","core_filepicker"]},"form_filemanager":{"name":"form_filemanager","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/filemanager.js","requires":["moodle-core-notification-dialogue","core_filepicker","base","io-base","node","json","core_dndupload","panel","resize-plugin","dd-plugin"]},"mform":{"name":"mform","fullpath":"http:\/\/localhost\/moodle\/lib\/javascript.php\/-1\/lib\/form\/form.js","requires":["base","node"]}});
                    //]]>
                    ';
                $script .= 'Y.use("moodle-course-dialogupdate", function() {M.course.dialogupdate().change_submit();})';
                $pattern = "/(validate_mod_" . $module->name . '_mod_form)' . ';/';
                preg_match($pattern,$endcode, $matches); 
                $validator = 'window.' .  $matches[1] .'='. $matches[0];
                $validator_call = "document.getElementById('mform1').addEventListener";
                $script = str_replace($validator_call, $validator . "\n" . $validator_call, $script);
                $file = fopen('test.js',  "w");
                fwrite($file, $module->name);
                fclose($file);   
                echo json_encode(array('html' => $html, 'script' => $script));
                break;
        }
        break;
    case 'POST':

        switch ($class) {
            case 'section':

                if (!$DB->record_exists('course_sections', array('course' => $course->id, 'section' => $id))) {
                    throw new moodle_exception('AJAX commands.php: Bad Section ID '.$id);
                }

                switch ($field) {
                    case 'visible':
                        require_capability('moodle/course:sectionvisibility', $coursecontext);
                        $resourcestotoggle = set_section_visible($course->id, $id, $value);
                        echo json_encode(array('resourcestotoggle' => $resourcestotoggle));
                        break;

                    case 'move':
                        require_capability('moodle/course:movesections', $coursecontext);
                        move_section_to($course, $id, $value);
                        // See if format wants to do something about it
                        $response = course_get_format($course)->ajax_section_move();
                        if ($response !== null) {
                            echo json_encode($response);
                        }
                        break;
                }
                break;

            case 'resource':
                switch ($field) {
                    case 'visible':
                        require_capability('moodle/course:activityvisibility', $modcontext);
                        set_coursemodule_visible($cm->id, $value);
                        \core\event\course_module_updated::create_from_cm($cm, $modcontext)->trigger();
                        break;

                    case 'duplicate':
                        require_capability('moodle/course:manageactivities', $coursecontext);
                        require_capability('moodle/backup:backuptargetimport', $coursecontext);
                        require_capability('moodle/restore:restoretargetimport', $coursecontext);
                        if (!course_allowed_module($course, $cm->modname)) {
                            throw new moodle_exception('No permission to create that activity');
                        }
                        $sr = optional_param('sr', null, PARAM_INT);
                        $result = mod_duplicate_activity($course, $cm, $sr);
                        echo json_encode($result);
                        break;

                    case 'groupmode':
                        require_capability('moodle/course:manageactivities', $modcontext);
                        set_coursemodule_groupmode($cm->id, $value);
                        \core\event\course_module_updated::create_from_cm($cm, $modcontext)->trigger();
                        break;

                    case 'indent':
                        require_capability('moodle/course:manageactivities', $modcontext);
                        $cm->indent = $value;
                        if ($cm->indent >= 0) {
                            $DB->update_record('course_modules', $cm);
                            rebuild_course_cache($cm->course);
                        }
                        break;

                    case 'move':
                        require_capability('moodle/course:manageactivities', $modcontext);
                        if (!$section = $DB->get_record('course_sections', array('course' => $course->id, 'section' => $sectionid))) {
                            throw new moodle_exception('AJAX commands.php: Bad section ID '.$sectionid);
                        }

                        if ($beforeid > 0){
                            $beforemod = get_coursemodule_from_id('', $beforeid, $course->id);
                            $beforemod = $DB->get_record('course_modules', array('id' => $beforeid));
                        } else {
                            $beforemod = NULL;
                        }

                        $isvisible = moveto_module($cm, $section, $beforemod);
                        echo json_encode(array('visible' => (bool) $isvisible));
                        break;
                }
                break;

            case 'course':
                switch($field) {
                    case 'marker':
                        require_capability('moodle/course:setcurrentsection', $coursecontext);
                        course_set_marker($course->id, $value);
                        break;
                }
                break;
            case 'addmod':
                $section = required_param('section', PARAM_INT);
                $add     = required_param('add', PARAM_TEXT);
                list($module, $context, $cw, $cm, $data) = prepare_new_moduleinfo_data($course, $add, $section);
                $data->return = 0;
                $data->sr = $sectionreturn;
                $data->add = $add;
                
                if (!empty($type)) { //TODO: hopefully will be removed in 2.0
                    $data->type = $type;
                }

                $sectionname = get_section_name($course, $cw);
                $fullmodulename = get_string('modulename', $module->name);

                if ($data->section && $course->format != 'site') {
                    $heading = new stdClass();
                    $heading->what = $fullmodulename;
                    $heading->to   = $sectionname;
                    $pageheading = get_string('addinganewto', 'moodle', $heading);
                } else {
                    $pageheading = get_string('addinganew', 'moodle', $fullmodulename);
                }
                $navbaraddition = $pageheading;

                $modmoodleform = "$CFG->dirroot/mod/$module->name/mod_form.php";
                if (file_exists($modmoodleform)) {
                    require_once($modmoodleform);
                } else {
                    print_error('noformdesc');
                }

                $mformclassname = 'mod_'.$module->name.'_mod_form';
                $mform = new $mformclassname($data, $cw->section, $cm, $course);
                $mform->set_data($data);
                $fromform = $mform->get_data();
                // Convert the grade pass value - we may be using a language which uses commas,
                // rather than decimal points, in numbers. These need to be converted so that
                // they can be added to the DB.
                if (isset($fromform->gradepass)) {
                    $fromform->gradepass = unformat_float($fromform->gradepass);
                }
                if (!empty($fromform->add)) {
                    $fromform = add_moduleinfo($fromform, $course, $mform);
                } else {
                    print_error('invaliddata');
                }
                break;

            case 'updatemod': 
                $update     = required_param('update', PARAM_TEXT);

                // Select the "Edit settings" from navigation.
                navigation_node::override_active_url(new moodle_url('/course/modedit.php', array('update' => $update, 'return' => 1)));

                // Check the course module exists.
                $cm = get_coursemodule_from_id('', $update, 0, false, MUST_EXIST);

                // Check the course exists.
                $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

                // require_login
                require_login($course, false, $cm); // needed to setup proper $COURSE

                list($cm, $context, $module, $data, $cw) = get_moduleinfo_data($cm, $course);
                $data->return = $return;
                $data->sr = $sectionreturn;
                $data->update = $update;

                $sectionname = get_section_name($course, $cw);
                $fullmodulename = get_string('modulename', $module->name);

                if ($data->section && $course->format != 'site') {
                    $heading = new stdClass();
                    $heading->what = $fullmodulename;
                    $heading->in   = $sectionname;
                    $pageheading = get_string('updatingain', 'moodle', $heading);
                } else {
                    $pageheading = get_string('updatinga', 'moodle', $fullmodulename);
                }
                $navbaraddition = null;
                
                $modmoodleform = "$CFG->dirroot/mod/$module->name/mod_form.php";
                if (file_exists($modmoodleform)) {
                    require_once($modmoodleform);
                } else {
                    print_error('noformdesc');
                }

                $mformclassname = 'mod_'.$module->name.'_mod_form';
                $mform = new $mformclassname($data, $cw->section, $cm, $course);
                $mform->set_data($data);

                $fromform = $mform->get_data();
                // Convert the grade pass value - we may be using a language which uses commas,
                // rather than decimal points, in numbers. These need to be converted so that
                // they can be added to the DB.
                if (isset($fromform->gradepass)) {
                    $fromform->gradepass = unformat_float($fromform->gradepass);
                }
                if (!empty($fromform->update)) {
                    list($cm, $fromform) = update_moduleinfo($cm, $fromform, $course, $mform);
                } else if (!empty($fromform->add)) {
                    $fromform = add_moduleinfo($fromform, $course, $mform);
                } else {
                    print_error('invaliddata');
                }
                break;
        }
        break;

    case 'DELETE':
        switch ($class) {
            case 'resource':
                require_capability('moodle/course:manageactivities', $modcontext);
                course_delete_module($cm->id);
                break;
        }
        break;
}

/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import SchoolYears from './pages/SchoolYears';
import Students from './pages/Students';
import Sections from './pages/Sections';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import Grading from './pages/Grading';
import Form137 from './pages/Form137';
import HealthRecords from './pages/HealthRecords';
import Enrollment from './pages/Enrollment';
import Scheduling from './pages/Scheduling';
import Violations from './pages/Violations';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';
import AdminSettings from './pages/AdminSettings';
import ParentPortal from './pages/ParentPortal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "SchoolYears": SchoolYears,
    "Students": Students,
    "Sections": Sections,
    "Subjects": Subjects,
    "Attendance": Attendance,
    "Grading": Grading,
    "Form137": Form137,
    "HealthRecords": HealthRecords,
    "Enrollment": Enrollment,
    "Scheduling": Scheduling,
    "Violations": Violations,
    "Analytics": Analytics,
    "UserManagement": UserManagement,
    "AdminSettings": AdminSettings,
    "ParentPortal": ParentPortal,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
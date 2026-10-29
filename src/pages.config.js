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
import About from './pages/About';
import BrainDump from './pages/BrainDump';
import Chat from './pages/Chat';
import DoneGallery from './pages/DoneGallery';
import EnergyMap from './pages/EnergyMap';
import FocusNow from './pages/FocusNow';
import Home from './pages/Home';
import Logbook from './pages/Logbook';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Shelf from './pages/Shelf';
import TimeTracking from './pages/TimeTracking';
import TimeBlocks from './pages/TimeBlocks';
import TaskMap from './pages/TaskMap';
import Coaching from './pages/Coaching';
import UpgradePlan from './pages/UpgradePlan';
import __Layout from './Layout.jsx';

export const PAGES = {
    "About": About,
    "BrainDump": BrainDump,
    "Chat": Chat,
    "DoneGallery": DoneGallery,
    "EnergyMap": EnergyMap,
    "FocusNow": FocusNow,
    "Home": Home,
    "Logbook": Logbook,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Settings": Settings,
    "Shelf": Shelf,
    "TimeTracking": TimeTracking,
    "TimeBlocks": TimeBlocks,
    "TaskMap": TaskMap,
    "Coaching": Coaching,
    "UpgradePlan": UpgradePlan,
}

export const pagesConfig = {
    mainPage: "FocusNow",
    Pages: PAGES,
    Layout: __Layout,
};
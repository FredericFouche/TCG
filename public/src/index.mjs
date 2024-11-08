import {Sidebar} from './components/ui/Sidebar.mjs';
import {Dashboard} from './components/ui/Dashboard.mjs';
import {Shop} from './components/ui/Shop.mjs';
import {CurrencySystem} from './core/currency/CurrencySystem.mjs';
import {CurrencyDisplay} from './components/ui/CurrencyDisplay.mjs';
import {AutoClickDisplay} from "./components/ui/AutoClickDisplay.mjs";
import {AutoClickManager} from "./features/auto-clicker/AutoClickManager.mjs";
import {NotificationSystem} from './utils/NotificationSystem.mjs';
import {Toast} from './components/ui/Toast.mjs';
import {AchievementDisplay} from "./components/ui/AchievementDisplay.mjs";
import {AchievementSystem} from './features/achievements/AchievementSystem.mjs'; // Ajout de l'import

const currencySystem = new CurrencySystem();
currencySystem.load();

const autoClickManager = new AutoClickManager(currencySystem);
autoClickManager.load();

const notificationSystem = NotificationSystem.getInstance();

const achievementSystem = new AchievementSystem();
const savedAchievements = localStorage.getItem('achievements');
if (savedAchievements) {
    achievementSystem.load(JSON.parse(savedAchievements));
}

window.currencySystem = currencySystem;
window.autoClickManager = autoClickManager;
window.achievementSystem = achievementSystem;

autoClickManager.addGenerator('Basic', 1, 10, 1);
autoClickManager.addGenerator('Advanced', 10, 100, 10);
autoClickManager.addGenerator('Pro', 100, 1000, 100);

notificationSystem.on(NotificationSystem.EVENTS.SHOW_NOTIFICATION, ({type, message}) => {
    Toast.show(message, type);
});

const sidebar = new Sidebar();
let currentModule = null;

sidebar.on('navigate', (event) => {
    if (currentModule?.destroy) {
        currentModule.destroy();
    }

    const {route} = event;
    switch (route) {
        case 'dashboard':
            currentModule = new Dashboard(currencySystem);
            currentModule.init();
            break;
        case 'shop':
            currentModule = new Shop();
            currentModule.init();
            break;
        case 'autoclickers':
            currentModule = new AutoClickDisplay();
            currentModule.init();
            break;
        case 'achievements':
            currentModule = new AchievementDisplay();
            currentModule.init();
            break;
        default:
            console.log(`Route ${route} non implémentée`);
    }
});

// Affichage global de la monnaie
const currencyDisplay = new CurrencyDisplay(currencySystem);
currencyDisplay.mount();

currencySystem.load();


setInterval(() => {
    const achievementSave = window.achievementSystem.save();
    localStorage.setItem('achievements', JSON.stringify(achievementSave));
}, 60000);
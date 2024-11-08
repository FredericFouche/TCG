// index.mjs
import {Sidebar} from './components/ui/Sidebar.mjs';
import {Dashboard} from './components/ui/Dashboard.mjs';
import {Shop} from './components/ui/Shop.mjs';
import {CurrencySystem} from './core/currency/CurrencySystem.mjs';
import {CurrencyDisplay} from './components/ui/CurrencyDisplay.mjs';
import {AutoClickDisplay} from "./components/ui/AutoClickDisplay.mjs";
import {AutoClickManager} from "./features/auto-clicker/AutoClickManager.mjs";

const currencySystem = new CurrencySystem();
currencySystem.load();

const autoClickManager = new AutoClickManager(currencySystem);
autoClickManager.load();

window.currencySystem = currencySystem;
window.autoClickManager = autoClickManager;

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
        default:
            console.log(`Route ${route} non implémentée`);
    }
});

// Affichage global de la monnaie
const currencyDisplay = new CurrencyDisplay(currencySystem);
currencyDisplay.mount();

currencySystem.load();
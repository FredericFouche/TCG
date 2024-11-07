// index.mjs
import { Sidebar } from './components/ui/Sidebar.mjs';
import { Dashboard } from './components/ui/Dashboard.mjs';
import { Shop } from './components/ui/Shop.mjs';
import { CurrencySystem } from './core/currency/CurrencySystem.mjs';
import { CurrencyDisplay } from './components/ui/CurrencyDisplay.mjs';

// Création des systèmes globaux
const currencySystem = new CurrencySystem();
currencySystem.load();

window.currencySystem = currencySystem;

// Instance de la sidebar
const sidebar = new Sidebar();
let currentModule = null;

// Écoute des événements de navigation
sidebar.on('navigate', (event) => {
    // Nettoyage du module précédent si existe
    if (currentModule?.destroy) {
        currentModule.destroy();
    }

    // Gestion de la navigation
    const { route } = event;
    switch(route) {
        case 'dashboard':
            // Passer le currencySystem au Dashboard
            currentModule = new Dashboard(currencySystem);
            currentModule.init();
            break;
        case 'shop':
            currentModule = new Shop();
            currentModule.init();
            break;
        default:
            console.log(`Route ${route} non implémentée`);
    }
});

const currencyDisplay = new CurrencyDisplay(currencySystem);
currencyDisplay.mount();

currencySystem.load();
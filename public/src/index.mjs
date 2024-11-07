import { Sidebar } from './components/ui/Sidebar.mjs';
import { Dashboard } from './components/ui/Dashboard.mjs';

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
            currentModule = new Dashboard();
            currentModule.init();
            break;
        // autres routes à venir...
        default:
            console.log(`Route ${route} non implémentée`);
    }
});

const mainContent = document.getElementById('mainContent');

// Écoute l'événement de toggle de la sidebar
sidebar.on('toggle', ({ isCollapsed }) => {
    if (isCollapsed) {
        mainContent.classList.add('expanded');
    } else {
        mainContent.classList.remove('expanded');
    }
});

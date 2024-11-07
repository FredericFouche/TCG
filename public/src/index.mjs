import { Sidebar } from './components/ui/Sidebar.mjs';

const sidebar = new Sidebar();

// Écoute des événements de navigation
sidebar.on('navigate', ({ route }) => {
    console.log('Navigation vers:', route);
    // Ici on pourra gérer le changement de contenu
    switch(route) {
        case 'dashboard':
            // Charger le dashboard
            break;
        case 'shop':
            // Charger la boutique
            break;
        case 'boosters':
            // Charger la section boosters
            break;
        case 'collection':
            // Charger la section Collection
            break;
        case 'market':
            // Charger la section marché
            break;
        case 'autoClickers':
            // Charger la section autoClickers
            break;
        case 'achievements':
            // Charger la section achievements
            break;
    }
});
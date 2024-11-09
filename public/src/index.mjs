import {Sidebar} from './components/ui/Sidebar.mjs';
import {Dashboard} from './components/ui/Dashboard.mjs';
import {Shop} from './components/shop/Shop.mjs';
import {CurrencySystem} from './core/currency/CurrencySystem.mjs';
import {CurrencyDisplay} from './components/ui/CurrencyDisplay.mjs';
import {AutoClickDisplay} from "./components/ui/AutoClickDisplay.mjs";
import {AutoClickManager} from "./features/auto-clicker/AutoClickManager.mjs";
import {NotificationSystem} from './utils/NotificationSystem.mjs';
import {SaveManager} from './utils/SaveManager.mjs';
import {Toast} from './components/ui/Toast.mjs';
import {AchievementDisplay} from "./components/ui/AchievementDisplay.mjs";
import {AchievementSystem} from './features/achievements/AchievementSystem.mjs';
import {TutorialManager} from './features/tutorial/TutorialManager.mjs';
import {CardSystem} from './core/cards/CardSystem.mjs';
import {BoosterSystem} from './core/booster/BoosterSystem.mjs';
import {BoosterDisplay} from './components/ui/BoostersDisplay.mjs';
import {CollectionSystem} from './core/collection/CollectionSystem.mjs';
import {CollectionDisplay} from './components/ui/CollectionDisplay.mjs';

const initializeSystems = () => {
    console.group('🎮 Initialisation des systèmes');

    // 1. Système de notification en premier (inchangé)
    console.log('🔔 Initialisation du système de notification');
    const notificationSystem = NotificationSystem.getInstance();
    window.notificationSystem = notificationSystem;

    // 2. Configuration des notifications toast (inchangé)
    console.log('🎯 Configuration du listener de notifications');
    const notificationHandler = ({type, message}) => {
        console.log('📬 Notification reçue:', {type, message});
        Toast.show(message, type);
    };
    notificationSystem.on(NotificationSystem.EVENTS.SHOW_NOTIFICATION, notificationHandler);

    // 3. Systèmes de base
    console.log('🏗️ Création des systèmes principaux');
    const currencySystem = new CurrencySystem();
    const autoClickManager = new AutoClickManager(currencySystem);
    const achievementSystem = new AchievementSystem();

    // Important : Créer et assigner CardSystem avant CollectionSystem
    console.log('🎴 Initialisation du système de cartes');
    const cardSystem = new CardSystem();
    window.cardSystem = cardSystem;  // Assignation immédiate pour CollectionSystem

    console.log('📦 Initialisation des systèmes de boosters et collection');
    const boosterSystem = new BoosterSystem(cardSystem);
    const collectionSystem = new CollectionSystem(cardSystem);

    // 4. Système de sauvegarde
    console.log('💾 Initialisation du système de sauvegarde');
    const saveManager = new SaveManager(notificationSystem);

    // 5. Exposition globale des systèmes
    window.currencySystem = currencySystem;
    window.autoClickManager = autoClickManager;
    window.achievementSystem = achievementSystem;
    window.boosterSystem = boosterSystem;
    window.saveManager = saveManager;
    window.collectionSystem = collectionSystem;

    // 6. Configuration des listeners de sauvegarde
    console.log('🔄 Configuration des événements de sauvegarde');
    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_PURCHASED, () => saveManager.saveAll());
    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_OPENED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_ADDED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_BOUGHT, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.PRODUCTION_UPDATED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.TICK, () => saveManager.saveAll());
    achievementSystem.on(AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED, () => saveManager.saveAll());
    achievementSystem.on(AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS, () => saveManager.saveAll());

    // Ajout des listeners pour les cartes et la collection
    cardSystem.on(CardSystem.EVENTS.CARD_ADDED, () => saveManager.saveAll());
    cardSystem.on(CardSystem.EVENTS.CARD_REMOVED, () => saveManager.saveAll());
    collectionSystem.on(CollectionSystem.EVENTS.STATS_UPDATED, () => saveManager.saveAll());

    // 7. Configuration des callbacks de la boutique (inchangé)
    window.shopCallbacks = {
        onPurchase: ({itemId, cost, effect}) => {
            if (effect.type === 'boosterPack') {
                const booster = boosterSystem.purchaseBooster(effect.boosterType, currencySystem);
                if (booster) {
                    notificationSystem.showSuccess(`Booster ${effect.boosterType} acheté !`);
                }
            }
        },
        canAfford: (cost) => currencySystem.canSpend(cost),
        getCurrentLevel: () => 1
    };

    // 8. Chargement des données sauvegardées
    console.log('📂 Vérification des sauvegardes...');
    if (saveManager.hasSaveData()) {
        console.log('🔄 Chargement des données existantes');
        setTimeout(() => {
            saveManager.loadAll();
            // Test du système de notification après chargement
            setTimeout(() => {
                notificationSystem.showSuccess('Partie chargée avec succès !');
            }, 100);
        }, 0);
    } else {
        console.log('🆕 Nouvelle partie détectée');
        setTimeout(() => {
            notificationSystem.showSuccess('Bienvenue dans votre nouvelle partie !');
        }, 100);
    }

    // 9. Configuration des sauvegardes
    window.addEventListener('beforeunload', () => {
        console.log('👋 Sauvegarde avant de quitter...');
        saveManager.saveAll();
    });

    console.log('✅ Initialisation terminée');
    console.groupEnd();

    return {
        notificationSystem,
        currencySystem,
        autoClickManager,
        achievementSystem,
        saveManager,
        cardSystem,
        boosterSystem,
        collectionSystem
    };
};

const initializeGenerators = () => {
    console.log('Initialisation des générateurs...');
    console.log(autoClickManager.hasGenerators);
    if (!window.autoClickManager.hasGenerators) {
        console.log('Initialisation des générateurs de base');
        window.autoClickManager.addGenerator('Basic', 1, 10, 'Générateur basique');
        window.autoClickManager.addGenerator('Advanced', 8, 100, 'Générateur avancé');
        window.autoClickManager.addGenerator('Pro', 47, 1000, 'Générateur pro');
        window.autoClickManager.addGenerator('Elite', 260, 10000, 'Générateur élite');
    }
};


// Configuration de la sauvegarde automatique
setInterval(() => saveManager.saveAll(), 60000);
window.addEventListener('beforeunload', () => saveManager.saveAll());


// Configuration de la sidebar et gestion des routes
const setupSidebar = () => {
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
                if (!localStorage.getItem('hasVisitedBefore')) {
                    setTimeout(() => {
                        const tutorial = new TutorialManager();
                        window.tutorialManager = tutorial;
                        tutorial.start();
                    }, 500);
                    localStorage.setItem('hasVisitedBefore', 'true');
                }
                break;
            case 'shop':
                currentModule = new Shop('mainContent', window.shopCallbacks);
                currentModule.init();
                break;
            case 'autoclickers':
                currentModule = new AutoClickDisplay(window.autoClickManager);
                currentModule.init();
                break;
            case 'achievements':
                currentModule = new AchievementDisplay();
                currentModule.init();
                break;
            case 'boosters':
                currentModule = new BoosterDisplay('mainContent');
                currentModule.init();
                currentModule.attachEventListeners();
                break;
            case 'collection':
                currentModule = new CollectionDisplay('mainContent');
                currentModule.init();
                break;
            default:
                console.log(`Route ${route} non implémentée`);
        }
    });

    sidebar.on('tutorial-requested', () => {
        if (window.tutorialManager) {
            window.tutorialManager.reset();
        } else {
            const tutorial = new TutorialManager();
            window.tutorialManager = tutorial;
            tutorial.start();
        }
    });

    return sidebar;
};

const initializeApp = () => {
    // 1. Initialiser les systèmes de base
    const systems = initializeSystems();

    // 2. Charger les données ou initialiser les générateurs
    if (systems.saveManager.hasSaveData()) {
        console.log('Chargement des données sauvegardées...');
        systems.saveManager.loadAll();
    } else {
        console.log('Première visite, initialisation des générateurs...');
        initializeGenerators();
    }

    // 4. Initialisation de l'interface
    const currencyDisplay = new CurrencyDisplay(systems.currencySystem);
    currencyDisplay.mount();

    // 5. Configuration et démarrage de la sidebar
    const sidebar = setupSidebar();
    sidebar.emit('navigate', {route: 'dashboard'});
};

// Démarrage de l'application
initializeApp();
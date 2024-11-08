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


const initializeSystems = () => {
    // 1. Système de notification en premier
    console.log('🔔 Initialisation du système de notification');
    const notificationSystem = NotificationSystem.getInstance();
    window.notificationSystem = notificationSystem;

    // 2. Configuration des notifications toast avec logs
    console.log('🎯 Configuration du listener de notifications');
    const notificationHandler = ({type, message}) => {
        console.log('📬 Notification reçue:', {type, message});
        Toast.show(message, type);
    };
    notificationSystem.on(NotificationSystem.EVENTS.SHOW_NOTIFICATION, notificationHandler);

    // Vérification que le listener est bien attaché
    console.log('🔍 Nombre de listeners:',
        notificationSystem.listenerCount(NotificationSystem.EVENTS.SHOW_NOTIFICATION));

    // Test du système de notification
    console.log('🧪 Test du système de notification');
    setTimeout(() => {
        notificationSystem.showSuccess('Système de notification initialisé');
    }, 100);

    // 3. Systèmes de base
    const currencySystem = new CurrencySystem();
    const autoClickManager = new AutoClickManager(currencySystem);
    const achievementSystem = new AchievementSystem();
    const cardSystem = new CardSystem();
    const boosterSystem = new BoosterSystem(cardSystem);

    // 4. Système de sauvegarde (dépend des autres systèmes)
    const saveManager = new SaveManager(notificationSystem);

    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_PURCHASED, () => saveManager.saveAll());
    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_OPENED, () => saveManager.saveAll());

    // 5. Exposition globale des systèmes
    window.currencySystem = currencySystem;
    window.autoClickManager = autoClickManager;
    window.achievementSystem = achievementSystem;
    window.cardSystem = cardSystem;
    window.boosterSystem = boosterSystem;
    window.saveManager = saveManager;

    // Configuration des callbacks de la boutique
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

    return {
        notificationSystem,
        currencySystem,
        autoClickManager,
        achievementSystem,
        saveManager,
        cardSystem,
        boosterSystem
    };
};

const initializeGenerators = () => {
    autoClickManager.addGenerator('Basic', 1, 10, 'Générateur basique');
    autoClickManager.addGenerator('Advanced', 8, 100, 'Générateur avancé');
    autoClickManager.addGenerator('Pro', 47, 1000, 'Générateur pro');
    autoClickManager.addGenerator('Elite', 260, 10000, 'Générateur élite');
};

// Configuration de la sauvegarde automatique
const setupAutoSave = (saveManager) => {
    setInterval(() => {
        saveManager.saveAll();
    }, 60000);

    window.addEventListener('beforeunload', () => {
        saveManager.saveAll();
    });
};

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
                currentModule = new AutoClickDisplay();
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


// Initialisation de l'application
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

    // 3. Configuration de la sauvegarde
    setupAutoSave(systems.saveManager);

    // 4. Initialisation de l'interface
    const currencyDisplay = new CurrencyDisplay(systems.currencySystem);
    currencyDisplay.mount();

    // 5. Configuration et démarrage de la sidebar
    const sidebar = setupSidebar();
    sidebar.emit('navigate', {route: 'dashboard'});
};

// Démarrage de l'application
initializeApp();
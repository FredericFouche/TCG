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
import {Keyboard} from './features/kbd/kbd.mjs';

const initializeSystems = async () => {
    console.group('🎮 Initialisation des systèmes');

    const notificationSystem = NotificationSystem.getInstance();
    window.notificationSystem = notificationSystem;

    const notificationHandler = ({type, message}) => {
        console.log('📬 Notification reçue:', {type, message});
        Toast.show(message, type);
    };
    notificationSystem.on(NotificationSystem.EVENTS.SHOW_NOTIFICATION, notificationHandler);

    const currencySystem = new CurrencySystem();
    const autoClickManager = new AutoClickManager(currencySystem);
    const achievementSystem = new AchievementSystem();
    const cardSystem = new CardSystem();
    window.cardSystem = cardSystem;

    const defaultGenerators = [
        ['Basic', 1, 10, 'Générateur basique'],
        ['Advanced', 8, 100, 'Générateur avancé'],
        ['Pro', 47, 1000, 'Générateur pro'],
        ['Elite', 260, 10000, 'Générateur élite']
    ];

    console.log('🎮 Initialisation des générateurs de base');
    defaultGenerators.forEach(([id, prod, cost, desc]) => {
        autoClickManager.addGenerator(id, prod, cost, desc);
    });

    const boosterSystem = new BoosterSystem(cardSystem);
    const collectionSystem = new CollectionSystem(cardSystem);
    const saveManager = new SaveManager(notificationSystem);

    window.currencySystem = currencySystem;
    window.autoClickManager = autoClickManager;
    window.achievementSystem = achievementSystem;
    window.boosterSystem = boosterSystem;
    window.saveManager = saveManager;
    window.collectionSystem = collectionSystem;

    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_PURCHASED, () => saveManager.saveAll());
    boosterSystem.on(BoosterSystem.EVENTS.BOOSTER_OPENED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_ADDED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.GENERATOR_BOUGHT, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.PRODUCTION_UPDATED, () => saveManager.saveAll());
    autoClickManager.on(AutoClickManager.EVENTS.TICK, () => saveManager.saveAll());
    achievementSystem.on(AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED, () => saveManager.saveAll());
    achievementSystem.on(AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS, () => saveManager.saveAll());
    cardSystem.on(CardSystem.EVENTS.CARD_ADDED, () => saveManager.saveAll());
    cardSystem.on(CardSystem.EVENTS.CARD_REMOVED, () => saveManager.saveAll());
    collectionSystem.on(CollectionSystem.EVENTS.STATS_UPDATED, () => saveManager.saveAll());

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

    if (saveManager.hasSaveData()) {
        await saveManager.loadAll();
        console.log('État des générateurs après chargement:', autoClickManager.generators);
    } else {
        notificationSystem.showSuccess('Bienvenue dans votre nouvelle partie !');
    }

    window.addEventListener('beforeunload', () => saveManager.saveAll(true));

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

const initializeApp = async () => {
    try {
        const systems = await initializeSystems();
        const currencyDisplay = new CurrencyDisplay(systems.currencySystem);
        currencyDisplay.mount();

        const sidebar = setupSidebar();
        sidebar.emit('navigate', {route: 'dashboard'});

        const kbd = new Keyboard();
        kbd.on('navigate', ({route}) => sidebar.emit('navigate', {route}));

        setInterval(() => systems.saveManager.saveAll(), 60000);
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        window.notificationSystem?.showError('Erreur lors de l\'initialisation du jeu');
    }
};

initializeApp().catch(console.error);
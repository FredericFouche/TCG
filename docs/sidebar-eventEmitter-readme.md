# Documentation Sidebar & EventEmitter

## Architecture Event-Driven

Ce projet utilise une architecture event-driven basée sur le pattern Observer via une implémentation d'EventEmitter. Cette documentation explique en détail l'interaction entre la Sidebar et l'EventEmitter.

## Classes Principales

### EventEmitter (src/utils/EventEmitter.mjs)

La classe de base qui fournit le mécanisme de gestion des événements.

```javascript
class EventEmitter {
    constructor() {
        this.events = {}; // Stockage des événements et callbacks
    }

    // Abonnement à un événement
    on(event, callback) {...}

    // Émission d'un événement
    emit(event, data) {...}

    // Désabonnement d'un événement
    off(event, callback) {...}
}
```

### Sidebar (src/components/ui/Sidebar.mjs)

La Sidebar hérite d'EventEmitter pour gérer les événements de navigation et de toggle.

```javascript
class Sidebar extends EventEmitter {
    #isCollapsed = false;
    #activeRoute = 'dashboard';
    #elements = {};
    #eventHandlers = new Map();
    
    constructor(containerId) {...}
}
```

## Flux des Événements

### 1. Initialisation

```javascript
// index.mjs
import { Sidebar } from './components/ui/Sidebar.mjs';

const sidebar = new Sidebar();
```

Lors de l'initialisation :
1. Le constructeur de `EventEmitter` est appelé via `super()`
2. La structure DOM est créée
3. Les event listeners sont attachés
4. L'événement initial 'navigate' est émis avec la route par défaut 'dashboard'

### 2. Événements Émis

La Sidebar émet deux types d'événements :

#### Événement 'navigate'
```javascript
// Dans Sidebar.mjs
navigateTo(route) {
    this.#activeRoute = route;
    // Mise à jour du DOM...
    this.emit('navigate', { route: this.#activeRoute });
}
```

Payload de l'événement :
```javascript
{
    route: string // 'dashboard', 'shop', 'boosters', etc.
}
```

#### Événement 'toggle'
```javascript
// Dans Sidebar.mjs
toggle() {
    this.#isCollapsed = !this.#isCollapsed;
    // Mise à jour du DOM...
    this.emit('toggle', { isCollapsed: this.#isCollapsed });
}
```

Payload de l'événement :
```javascript
{
    isCollapsed: boolean
}
```

### 3. Écoute des Événements

```javascript
// Dans votre code d'application
sidebar.on('navigate', ({ route }) => {
    // Gérer le changement de route
    console.log(`Navigation vers: ${route}`);
});

sidebar.on('toggle', ({ isCollapsed }) => {
    // Gérer l'état collapsed/expanded
    console.log(`Sidebar ${isCollapsed ? 'fermée' : 'ouverte'}`);
});
```

## Cycle de Vie Complet

1. **Création**
   ```javascript
   const sidebar = new Sidebar();
   ```

2. **Initialisation**
   - Héritage d'EventEmitter
   - Création de la structure DOM
   - Attachement des event listeners DOM
   - Émission de l'événement 'navigate' initial

3. **Interactions Utilisateur**
   - Clic sur un item de menu → `navigateTo()` → émission de 'navigate'
   - Clic sur le bouton toggle → `toggle()` → émission de 'toggle'

4. **Réactions aux Événements**
   ```javascript
   sidebar.on('navigate', ({ route }) => {
       // Mise à jour du contenu principal
       switch(route) {
           case 'dashboard':
               // Afficher dashboard
               break;
           case 'shop':
               // Afficher boutique
               break;
           // etc.
       }
   });
   ```

5. **Nettoyage**
   ```javascript
   // Destruction propre du composant
   sidebar.destroy();
   ```

## Bonnes Pratiques

1. **Toujours désabonner les événements**
   ```javascript
   const handleNavigation = ({ route }) => {...};
   sidebar.on('navigate', handleNavigation);
   
   // Plus tard
   sidebar.off('navigate', handleNavigation);
   ```

2. **Utiliser des constantes pour les noms d'événements**
   ```javascript
   const EVENTS = {
       NAVIGATE: 'navigate',
       TOGGLE: 'toggle'
   };
   ```

3. **Vérifier la validité des routes**
   ```javascript
   const VALID_ROUTES = ['dashboard', 'shop', 'boosters', ...];
   navigateTo(route) {
       if (!VALID_ROUTES.includes(route)) return;
       // ...
   }
   ```

## Avantages de cette Architecture

1. **Découplage**
   - La Sidebar ne connaît pas les composants qui l'écoutent
   - Les composants peuvent réagir aux changements sans être couplés

2. **Extensibilité**
   - Ajout facile de nouveaux événements
   - Ajout facile de nouveaux listeners

3. **Testabilité**
   - Tests unitaires faciles avec mock des événements
   - Tests d'intégration via les événements émis

4. **Maintenance**
   - Code modulaire et organisé
   - Responsabilités bien séparées
   - Flux de données clair et prévisible

## Exemple d'Utilisation dans les Tests

```javascript
describe('Sidebar', () => {
    let sidebar;
    let navigationSpy;

    beforeEach(() => {
        sidebar = new Sidebar();
        navigationSpy = jest.fn();
        sidebar.on('navigate', navigationSpy);
    });

    test('should emit navigate event with correct route', () => {
        sidebar.navigateTo('shop');
        expect(navigationSpy).toHaveBeenCalledWith({ route: 'shop' });
    });
});
```

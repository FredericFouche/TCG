# Système de Monnaie et Affichage

## Description
Cette implémentation met en place les fondations du système économique du jeu avec un affichage persistant de la monnaie et une intégration dans le dashboard.

## Composants Principaux

### CurrencySystem (core/currency/CurrencySystem.mjs)
Gère toute la logique liée à la monnaie du jeu.

#### Fonctionnalités
- Gestion basique de la monnaie (ajout/retrait)
- Système de multiplicateurs
- Formatage automatique des montants (K, M, B)
- Sauvegarde/Chargement dans le localStorage
- Système d'événements pour les mises à jour

#### Événements
- `CURRENCY_UPDATED`: Émis lors de chaque modification du montant
- `MULTIPLIER_UPDATED`: Émis lors des changements de multiplicateur

### CurrencyDisplay (components/ui/CurrencyDisplay.mjs)
Composant UI affichant la monnaie du joueur de manière persistante.

#### Caractéristiques
- Affichage fixe en haut à droite
- Mise à jour automatique via les événements
- Styles responsifs
- Animation lors des mises à jour

### Dashboard (components/ui/Dashboard.mjs)
Module principal du jeu intégrant les interactions avec le système de monnaie.

#### Intégration
- Utilise window.currencySystem pour la communication
- S'abonne aux événements de mise à jour
- Gère le bouton de clic principal
- Maintient son propre état local

## Architecture et Choix Techniques

### Pattern Observer
- Utilisation d'EventEmitter pour la communication entre composants
- Découplage entre la logique (CurrencySystem) et l'affichage (CurrencyDisplay)

### Gestion Globale
- CurrencySystem accessible globalement via window.currencySystem
- Un seul point de vérité pour l'état de la monnaie
- Évite les duplications d'affichage et de logique

### Séparation des Responsabilités
- Core: Logique métier pure (CurrencySystem)
- UI: Composants d'affichage (CurrencyDisplay)
- Modules: Logique spécifique aux fonctionnalités (Dashboard)

## Structure des Fichiers
```
src/
├── core/
│   └── currency/
│       └── CurrencySystem.mjs
├── components/
│   └── ui/
│       ├── CurrencyDisplay.mjs
│       └── Dashboard.mjs
└── utils/
    └── EventEmitter.mjs
```

## Utilisation

### Initialisation
```javascript
import { CurrencySystem } from './core/currency/CurrencySystem.mjs';
import { CurrencyDisplay } from './components/ui/CurrencyDisplay.mjs';

const currencySystem = new CurrencySystem();
window.currencySystem = currencySystem;

const currencyDisplay = new CurrencyDisplay(currencySystem);
currencyDisplay.mount();

currencySystem.load();
```

### Intégration dans un Module
```javascript
constructor() {
    this.#currencyUpdateCallback = (data) => {
        this.#state.currency = data.newValue;
        this.#updateUI();
    };
}

init() {
    window.currencySystem?.on(
        CurrencySystem.EVENTS.CURRENCY_UPDATED,
        this.#currencyUpdateCallback
    );
}

destroy() {
    window.currencySystem?.off(
        CurrencySystem.EVENTS.CURRENCY_UPDATED,
        this.#currencyUpdateCallback
    );
}
```

## CSS
Les styles du CurrencyDisplay sont définis dans un fichier CSS séparé pour une meilleure maintenabilité :
```css
.currency-display {
    position: fixed;
    top: 1rem;
    right: 1rem;
    /* ... autres styles ... */
}
```

## Prochaines Étapes
- [ ] Implémentation des bonus temporaires
- [ ] Système de prestige
- [ ] Animations avancées pour les gains
- [ ] Historique des transactions

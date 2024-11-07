# TCG (Trading Card Game)

## Structure du Projet
```
TCG/
├── public/
│   └── src/
│       ├── core/
│       │   └── currency/
│       │       └── CurrencySystem.mjs
│       ├── features/
│       │   └── auto-clicker/
│       │       └── AutoClickManager.mjs
│       └── utils/
│           └── EventEmitter.mjs
└── tests/
    ├── index.html
    └── index.test.mjs
```

## Composants Implémentés

### 1. CurrencySystem (Core)
Système de gestion de la monnaie du jeu avec les fonctionnalités suivantes :
- Gestion basique de la monnaie (ajout/retrait)
- Système de multiplicateurs
- Formatage automatique (K, M, B)
- Sauvegarde/Chargement
- Émission d'événements pour les changements

### 2. AutoClickManager (Feature)
Gestionnaire de générateurs automatiques avec :
- Système de générateurs multiples
- Coûts croissants (formule: baseCost * (1.15 ^ level))
- Production automatique par seconde
- Sauvegarde/Chargement de l'état
- Gestion des événements

### 3. EventEmitter (Utils)
Système d'événements permettant :
- Communication entre les modules
- Pattern Observer/Pub-Sub
- Découplage des composants

## Tests
Mise en place d'un système de tests personnalisé avec :
- Framework de test léger et autonome
- Support des tests asynchrones
- Gestion des suites de tests séparées
- Rapport de tests formaté
- Hooks (beforeEach)

### Couverture des Tests
- **CurrencySystem**: 9 tests ✅
- **AutoClickManager**: 8 tests ✅

## Architecture
- Modules ES6
- Pattern Observer
- Programmation orientée objet
- Classes privées (#)
- Système événementiel

## Prochaines Étapes
1. Implémentation du Shop
2. Système de Boosters
3. Gestion des Cartes
4. Interface utilisateur

## Comment Exécuter
1. Ouvrir le projet avec VSCode
2. Installer l'extension "Live Server"
3. Lancer les tests en ouvrant `tests/index.html` avec Live Server

## Technologies Utilisées
- Vanilla JavaScript
- ES6+ Modules
- LocalStorage pour la persistance
- Pattern Observer/Pub-Sub

## Notes de Développement
- Utilisation exclusive des modules ES6 (.mjs)
- Pas de dépendances externes
- Tests modulaires et indépendants

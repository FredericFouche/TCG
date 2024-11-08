# Système d'Auto-Clickers

Ce module implémente un système de générateurs automatiques de monnaie pour notre TCG, suivant le pattern des jeux incrémentaux.

## Architecture

Le système est composé de trois parties principales :

1. **AutoClickManager** : Gère la logique des générateurs
2. **AutoClickDisplay** : Gère l'interface utilisateur
3. **Intégration avec CurrencySystem** : Gère la production de monnaie

### Événements

Le système utilise un pattern Observer via EventEmitter pour la communication :

```javascript
static EVENTS = {
    GENERATOR_BOUGHT: 'generator:bought',    // Quand un générateur est acheté
    GENERATOR_UPGRADED: 'generator:upgraded', // Quand un générateur est amélioré
    TICK: 'generator:tick'                   // Production périodique
}
```

## Utilisation

### Initialisation

```javascript
// Dans index.mjs
window.autoClickManager = new AutoClickManager(window.currencySystem);

// Ajout de générateurs
autoClickManager.addGenerator('Basic', 1, 10);    // id, production/sec, coût
autoClickManager.addGenerator('Better', 5, 50);   
autoClickManager.addGenerator('Best', 10, 100);   
```

### Structure d'un Générateur

```javascript
{
    id: string,              // Identifiant unique
    level: number,           // Niveau actuel
    baseProduction: number,  // Production de base par seconde
    baseCost: number,        // Coût initial
    currentProduction: number, // Production actuelle (baseProduction * level)
    lastPurchaseCost: number  // Dernier coût d'achat
}
```

### API AutoClickManager

- `addGenerator(id, baseProduction, baseCost)` : Ajoute un nouveau générateur
- `buyGenerator(id)` : Achète/améliore un générateur
- `start(tickRate = 1000)` : Démarre la production
- `stop()` : Arrête la production
- `save()/load()` : Gestion de la sauvegarde

### Formules

- Coût d'amélioration : `baseCost * (1.15 ^ level)`
- Production : `baseProduction * level`

## Interface Utilisateur

L'AutoClickDisplay gère l'affichage et les interactions :

- Affichage de la production totale
- Liste des générateurs disponibles
- Boutons d'achat/amélioration
- Mise à jour en temps réel

## Tests

Un ensemble complet de tests unitaires est disponible :

```bash
# Ouvrir dans le navigateur
tests/testrunner.html
```

## Exemple Complet

```javascript
// Initialisation
const currencySystem = new CurrencySystem();
const autoClickManager = new AutoClickManager(currencySystem);

// Ajout de générateurs
autoClickManager.addGenerator('Basic', 1, 10);
autoClickManager.addGenerator('Advanced', 5, 50);

// Achat de générateurs
autoClickManager.buyGenerator('Basic'); // niveau 1
autoClickManager.buyGenerator('Basic'); // niveau 2

// Écoute des événements
autoClickManager.on(AutoClickManager.EVENTS.TICK, (data) => {
    console.log(`Production: ${data.production}/sec`);
});
```

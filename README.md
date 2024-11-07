# Trading Card Game Clicker

Un jeu de collection de cartes à collectionner (TCG) basé sur un système de clicker/idle game. Combine les mécaniques addictives des jeux incrémentaux avec la collection de cartes.

## 🎮 Caractéristiques

### Core Systems
- **Système de Monnaie**
  - Monnaie principale ("Coins") générée par les clics et générateurs
  - Multiplicateurs et bonus temporaires

- **Collection de Cartes**
  - 5 niveaux de rareté (Common à Legendary)
  - Système de duplication
  - Albums et récompenses de collection
  - Valeurs dynamiques basées sur la rareté

- **Système de Boosters**
  - Plusieurs types de packs (Basic, Premium, Special Edition)
  - Système de pitié garantissant des cartes rares
  - Distribution équilibrée des raretés
  - Animations d'ouverture

### Fonctionnalités Avancées
- **Marché des Cartes**
  - Système d'offre et demande
  - Historique des prix
  - Files d'attente pour les transactions
  - Taxes de transaction

- **Progression**
  - Système de niveau joueur
  - Achievements débloquables
  - Récompenses de progression
  - Statistiques détaillées

- **Générateurs Automatiques**
  - Génération passive de monnaie
  - Système d'amélioration
  - Multiplicateurs permanents
  - Bonus de collection

## 🏗️ Architecture

### Structure du Projet
```
TCG/
├── public/
│   ├── src/  
│       ├── core/          # Systèmes principaux
│       ├── features/      # Fonctionnalités additionnelles
│       ├── data/         # Gestion des données
│       ├── utils/        # Utilitaires
│       ├── constants/    # Configuration
│       ├── components/   # Interface utilisateur
│       ├── services/     # Services
│       ├── store/        # Gestion d'état
│       └── workers/      # Web Workers
```

### Technologies
- Vanilla JavaScript (ES6+ Modules)
- Architecture événementielle (Event-Driven)
- Pattern Observer pour la communication
- LocalStorage pour la sauvegarde
- Web Workers pour les calculs complexes

## 🔄 Game Loop
1. Les joueurs génèrent de la monnaie via des clics manuels et des générateurs automatiques
2. La monnaie peut être dépensée dans la boutique pour des boosters
3. Les boosters donnent des cartes de différentes raretés
4. Les cartes peuvent être:
   - Collectionnées pour des bonus
   - Vendues sur le marché
   - Utilisées pour améliorer les générateurs

## 🎯 Objectifs de Design
- Interface utilisateur réactive et fluide
- Progression satisfaisante et équilibrée
- Mécaniques de collection engageantes
- Performance optimisée pour les longues sessions
- Sauvegarde fiable des données

## 📊 Systèmes Techniques
- Lazy loading des ressources
- Pagination des listes
- Cache des données fréquentes
- Throttling des sauvegardes
- Gestion optimisée de la mémoire

## État Actuel
- ✅ Architecture de base mise en place
- ✅ Système de navigation (Sidebar) fonctionnel
- ✅ Pattern Observer implémenté
- ✅ Dashboard en cours de développement
- 🔄 Système de cartes en développement

## Prochaines Étapes
1. Finalisation du Dashboard avec logique de jeu
2. Implémentation des modules Shop et Collection
3. Système de persistence des données
4. Développement complet du système de cartes

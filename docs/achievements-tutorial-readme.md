# Système d'Achievements et Tutorial

Cette PR ajoute deux fonctionnalités majeures au jeu : un système d'achievements et un tutoriel interactif.

## 🏆 Système d'Achievements

### Architecture

Le système d'achievements est composé de deux parties principales :

1. **AchievementSystem** (core)
   - Gestion de la logique des achievements
   - Système de progression et de déverrouillage
   - Sauvegarde/chargement de l'état
   - Émission d'événements via EventEmitter

2. **AchievementDisplay** (UI)
   - Affichage des achievements dans l'interface
   - Mise à jour réactive via le pattern Observer
   - Animation des achievements débloqués
   - Gestion de la progression visuelle

### Caractéristiques

- Support des achievements progressifs (avec niveaux)
- Système de récompenses automatique
- Sauvegarde automatique
- Affichage du prochain objectif
- Indicateurs visuels de progression
- Animations de déblocage

### Utilisation

```javascript
// Création d'un achievement
achievementSystem.registerAchievement({
    id: 'first-clicks',
    title: 'Premiers Pas',
    description: 'Commencez à cliquer',
    levels: [
        { threshold: 10, reward: 100 },
        { threshold: 100, reward: 500 },
        { threshold: 1000, reward: 2000 }
    ]
});

// Mise à jour de la progression
achievementSystem.updateProgress('first-clicks', currentClicks);
```

## 🎮 Système de Tutorial

### Architecture

Le système de tutorial utilise une approche modale avec progression par étapes :

1. **TutorialManager** (core)
   - Gestion des étapes du tutorial
   - Conditions de progression
   - Highlight des éléments UI
   - Sauvegarde de l'état

### Caractéristiques

- Tutorial interactif guidé par les actions
- Modales centrées avec progression visuelle
- Système de highlight des éléments importants
- Support des conditions de progression (clics, achats, etc.)
- Persistance de l'état (tutorial complété)

### Étapes du Tutorial

1. Introduction au jeu
2. Système de clics et monnaie
3. Générateurs automatiques
4. Système de boosters
5. Achievements

### Intégration dans la Sidebar

- Bouton dédié pour relancer le tutorial
- Accès permanent via le menu

## 🔄 Pattern Observer & Communication

Les deux systèmes utilisent le pattern Observer via la classe EventEmitter pour :
- Découpler la logique métier de l'interface
- Permettre des mises à jour réactives
- Faciliter l'extensibilité

### Types d'événements

```javascript
// Achievements
ACHIEVEMENT_UNLOCKED: 'achievement-unlocked'
ACHIEVEMENT_PROGRESS: 'achievement-progress'

// Tutorial
TUTORIAL_STEP_COMPLETED: 'tutorial-step-completed'
TUTORIAL_COMPLETED: 'tutorial-completed'
```

## 💾 Persistance

- Sauvegarde automatique des achievements toutes les 60 secondes
- Sauvegarde de l'état du tutorial dans le localStorage
- Support de la réinitialisation des données

## 🎨 UI/UX

- Animations fluides pour les transitions
- Feedback visuel pour les actions importantes
- Design responsive et adaptatif
- Support du thème global de l'application

## 🔜 Prochaines étapes

- [ ] Ajout de nouveaux achievements
- [ ] Statistiques détaillées de progression
- [ ] Système de badges/médailles
- [ ] Tutorial avancé pour les fonctionnalités complexes


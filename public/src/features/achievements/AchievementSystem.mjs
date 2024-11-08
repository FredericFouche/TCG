import { EventEmitter } from '../../utils/EventEmitter.mjs';
import { NotificationSystem } from '../../utils/NotificationSystem.mjs';

export class AchievementSystem extends EventEmitter {
    static EVENTS = {
        ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
        ACHIEVEMENT_PROGRESS: 'achievement-progress'
    };

    #achievements;
    #unlockedAchievements;
    #notifications;

    constructor() {
        super();
        this.#achievements = new Map();
        this.#unlockedAchievements = new Set();
        this.#notifications = NotificationSystem.getInstance();
        this.#initializeBaseAchievements();
    }

    #initializeBaseAchievements() {
        // Achievements liés à la monnaie
        this.registerAchievement({
            id: 'first-coins',
            title: 'Premier pas',
            description: 'Gagner vos premiers 100 coins',
            condition: (currency) => currency >= 100,
            reward: 10,
            type: 'currency'
        });

        this.registerAchievement({
            id: 'millionaire',
            title: 'Millionnaire',
            description: 'Accumuler 1,000,000 coins',
            condition: (currency) => currency >= 1000000,
            reward: 1000,
            type: 'currency'
        });

        // Achievements liés aux générateurs
        this.registerAchievement({
            id: 'first-generator',
            title: 'Automatisation',
            description: 'Acheter votre premier générateur',
            condition: (generators) => generators.some(g => g.level > 0),
            reward: 50,
            type: 'generator'
        });

        this.registerAchievement({
            id: 'generator-master',
            title: 'Maître des Générateurs',
            description: 'Avoir 10 niveaux sur tous les générateurs',
            condition: (generators) => generators.every(g => g.level >= 10),
            reward: 5000,
            type: 'generator'
        });

        // Achievements progressifs
        this.registerProgressiveAchievement({
            id: 'collector',
            title: 'Collectionneur',
            description: 'Collecter des cartes uniques',
            levels: [
                { requirement: 10, reward: 100 },
                { requirement: 50, reward: 500 },
                { requirement: 100, reward: 2000 },
            ],
            getCurrentValue: (collection) => collection.getUniqueCardsCount(),
            type: 'collection'
        });
    }

    registerAchievement({id, title, description, condition, reward, type}) {
        this.#achievements.set(id, {
            id,
            title,
            description,
            condition,
            reward,
            type,
            isProgressive: false
        });
    }

    registerProgressiveAchievement({id, title, description, levels, getCurrentValue, type}) {
        this.#achievements.set(id, {
            id,
            title,
            description,
            levels,
            getCurrentValue,
            type,
            isProgressive: true,
            currentLevel: 0
        });
    }

    checkAchievement(achievementId, value) {
        const achievement = this.#achievements.get(achievementId);
        if (!achievement || this.#unlockedAchievements.has(achievementId)) return;

        if (achievement.isProgressive) {
            this.#checkProgressiveAchievement(achievement, value);
        } else if (achievement.condition(value)) {
            this.#unlockAchievement(achievement);
        }
    }

    #checkProgressiveAchievement(achievement, value) {
        const currentValue = achievement.getCurrentValue(value);
        const nextLevel = achievement.levels[achievement.currentLevel];

        if (nextLevel && currentValue >= nextLevel.requirement) {
            this.#unlockProgressiveLevel(achievement, nextLevel);
            achievement.currentLevel++;
            
            // Émettre l'événement de progression
            this.emit(AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS, {
                achievement,
                level: achievement.currentLevel,
                nextLevel: achievement.levels[achievement.currentLevel]
            });
        }
    }


    #unlockAchievement(achievement) {
        this.#unlockedAchievements.add(achievement.id);

        // Notification via le système de toast
        this.#notifications.showSuccess(
            `🏆 Achievement débloqué : ${achievement.title}\nRécompense : ${achievement.reward} coins`
        );

        // Émettre l'événement de déblocage
        this.emit(AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED, {
            achievement,
            reward: achievement.reward
        });

        // Ajouter la récompense à la monnaie du joueur
        if (window.currencySystem) {
            window.currencySystem.addCurrency(achievement.reward); // Changé de add à addCurrency
        }
    }

    #unlockProgressiveLevel(achievement, level) {
        this.#notifications.showSuccess(
            `🏆 ${achievement.title} - Niveau ${achievement.currentLevel + 1}\nRécompense : ${level.reward} coins`
        );

        if (window.currencySystem) {
            window.currencySystem.addCurrency(level.reward); // Changé aussi ici
        }
    }

    // Méthodes de sauvegarde/chargement
    save() {
        return {
            unlockedAchievements: Array.from(this.#unlockedAchievements),
            progressiveStates: Array.from(this.#achievements.entries())
                .filter(([_, achievement]) => achievement.isProgressive)
                .map(([id, achievement]) => ({
                    id,
                    currentLevel: achievement.currentLevel
                }))
        };
    }

    load(saveData) {
        if (saveData.unlockedAchievements) {
            this.#unlockedAchievements = new Set(saveData.unlockedAchievements);
        }
        
        if (saveData.progressiveStates) {
            for (const state of saveData.progressiveStates) {
                const achievement = this.#achievements.get(state.id);
                if (achievement && achievement.isProgressive) {
                    achievement.currentLevel = state.currentLevel;
                }
            }
        }
    }

    // Méthodes utilitaires
    getAchievementProgress(achievementId) {
        const achievement = this.#achievements.get(achievementId);
        if (!achievement) return null;

        return {
            isUnlocked: this.#unlockedAchievements.has(achievementId),
            currentLevel: achievement.isProgressive ? achievement.currentLevel : null,
            totalLevels: achievement.isProgressive ? achievement.levels.length : null
        };
    }

    getAllAchievements() {
        return Array.from(this.#achievements.values()).map(achievement => ({
            ...achievement,
            isUnlocked: this.#unlockedAchievements.has(achievement.id),
            currentLevel: achievement.isProgressive ? achievement.currentLevel : null
        }));
    }
}

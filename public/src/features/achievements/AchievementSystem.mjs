import { EventEmitter } from '../../utils/EventEmitter.mjs';
import { NotificationSystem } from '../../utils/NotificationSystem.mjs';

export class AchievementSystem extends EventEmitter {
    static EVENTS = {
        ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
        ACHIEVEMENT_PROGRESS: 'achievement-progress',
        ACHIEVEMENTS_LOADED: 'achievements-loaded'
    };

    #achievements;
    #unlockedAchievements;
    #notifications;
    #checkIntervalId;

    constructor() {
        super();
        this.#achievements = new Map();
        this.#unlockedAchievements = new Set();
        this.#notifications = NotificationSystem.getInstance();
        this.#initializeBaseAchievements();
        this.#startPeriodicCheck();
    }

    #initializeBaseAchievements() {
        // Achievements liés à la monnaie
        this.registerAchievement({
            id: 'first-coins',
            title: 'Premier pas',
            description: 'Gagner vos premiers 100 ¤',
            condition: (currency) => typeof currency === 'number' && currency >= 100,
            reward: 10,
            type: 'currency'
        });

        this.registerAchievement({
            id: 'millionaire',
            title: 'Le milli',
            description: 'Accumuler 1,000,000 ¤',
            condition: (currency) => typeof currency === 'number' && currency >= 1000000,
            reward: 1000,
            type: 'currency'
        });

        // Achievements liés aux générateurs
        this.registerAchievement({
            id: 'first-generator',
            title: 'Automatisation',
            description: 'Acheter votre premier générateur',
            condition: (generators) => Array.isArray(generators) && generators.some(g => g && g.level > 0),
            reward: 50,
            type: 'generator'
        });

        this.registerAchievement({
            id: 'generator-master',
            title: 'Maître des Générateurs',
            description: 'Avoir 10 niveaux sur tous les générateurs',
            condition: (generators) => Array.isArray(generators) && generators.length > 0 && generators.every(g => g && g.level >= 10),
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
            getCurrentValue: (collection) => collection && typeof collection.getUniqueCardsCount === 'function' ? collection.getUniqueCardsCount() : 0,
            type: 'collection'
        });
    }

    #startPeriodicCheck() {
        // Vérification périodique des achievements
        this.#checkIntervalId = setInterval(() => {
            this.#checkAllAchievements();
        }, 5000); // Vérifie toutes les 5 secondes
    }

    #checkAllAchievements() {
        if (!window.currencySystem || !window.autoClickManager) return;

        const currency = window.currencySystem.currency;
        const generators = window.autoClickManager.generators;

        // Vérifier les achievements de type currency
        this.#achievements.forEach(achievement => {
            if (this.#unlockedAchievements.has(achievement.id)) return;

            try {
                switch (achievement.type) {
                    case 'currency':
                        if (currency !== undefined) {
                            this.checkAchievement(achievement.id, currency);
                        }
                        break;
                    case 'generator':
                        if (generators && Array.isArray(generators)) {
                            this.checkAchievement(achievement.id, generators);
                        }
                        break;
                    case 'collection':
                        if (window.collectionSystem) {
                            this.checkAchievement(achievement.id, window.collectionSystem);
                        }
                        break;
                }
            } catch (error) {
                console.error(`Erreur lors de la vérification de l'achievement ${achievement.id}:`, error);
            }
        });
    }

    destroy() {
        if (this.#checkIntervalId) {
            clearInterval(this.#checkIntervalId);
        }
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

            this.emit(AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS, {
                achievement,
                level: achievement.currentLevel,
                nextLevel: achievement.levels[achievement.currentLevel]
            });
        }
    }

    #unlockAchievement(achievement) {
        this.#unlockedAchievements.add(achievement.id);

        this.#notifications.showSuccess(
            `🏆 Achievement débloqué : ${achievement.title}\nRécompense : ${achievement.reward} ¤`
        );

        this.emit(AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED, {
            achievement,
            reward: achievement.reward
        });

        if (window.currencySystem) {
            window.currencySystem.add(achievement.reward);
        }
    }

    #unlockProgressiveLevel(achievement, level) {
        this.#notifications.showSuccess(
            `🏆 ${achievement.title} - Niveau ${achievement.currentLevel + 1}\nRécompense : ${level.reward} ¤`
        );

        if (window.currencySystem) {
            window.currencySystem.add(level.reward);
        }
    }

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
        if (!saveData) return false;

        try {
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

            this.emit(AchievementSystem.EVENTS.ACHIEVEMENTS_LOADED);
            this.#checkAllAchievements();
            return true;
        } catch (error) {
            console.error('Failed to load achievements:', error);
            return false;
        }
    }

    getAllAchievements() {
        return Array.from(this.#achievements.values()).map(achievement => ({
            ...achievement,
            isUnlocked: this.#unlockedAchievements.has(achievement.id),
            currentLevel: achievement.isProgressive ? achievement.currentLevel : null
        }));
    }

    getAchievementProgress(achievementId) {
        const achievement = this.#achievements.get(achievementId);
        if (!achievement) return null;

        return {
            isUnlocked: this.#unlockedAchievements.has(achievementId),
            currentLevel: achievement.isProgressive ? achievement.currentLevel : null,
            totalLevels: achievement.isProgressive ? achievement.levels.length : null
        };
    }
}
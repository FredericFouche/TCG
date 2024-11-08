import {AchievementSystem} from '../../features/achievements/AchievementSystem.mjs';
// AchievementDisplay.mjs
export class AchievementDisplay {
    #container;
    #achievementSystem;
    #boundEvents = [];

    constructor(containerId = 'achievement-container') {
        if (!window.achievementSystem) {
            throw new Error('AchievementSystem must be initialized before AchievementDisplay');
        }

        this.#container = document.getElementById('mainContent');
        if (!this.#container) {
            throw new Error('Main content container not found');
        }

        this.#achievementSystem = window.achievementSystem;
    }

    init() {
        this.#bindEvents();
        this.render();
    }

    destroy() {
        // Nettoyer les événements
        this.#boundEvents.forEach(({event, handler}) => {
            this.#achievementSystem.off(event, handler);
        });
        this.#boundEvents = [];

        // Nettoyer le contenu
        if (this.#container) {
            this.#container.innerHTML = '';
        }
    }

    #bindEvents() {
        // Écouter les nouveaux achievements
        const unlockHandler = ({achievement}) => this.render();
        this.#achievementSystem.on(
            AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED,
            unlockHandler
        );
        this.#boundEvents.push({
            event: AchievementSystem.EVENTS.ACHIEVEMENT_UNLOCKED,
            handler: unlockHandler
        });

        // Écouter la progression des achievements
        const progressHandler = ({achievement}) => this.render();
        this.#achievementSystem.on(
            AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS,
            progressHandler
        );
        this.#boundEvents.push({
            event: AchievementSystem.EVENTS.ACHIEVEMENT_PROGRESS,
            handler: progressHandler
        });
    }

    render() {
        const achievements = this.#achievementSystem.getAllAchievements();

        this.#container.innerHTML = `
            <div class="achievements-panel">
                <h2 class="achievements-title">Achievements</h2>
                <div class="achievements-grid">
                    ${achievements.map(achievement => this.#renderAchievement(achievement)).join('')}
                </div>
            </div>
        `;
    }

    #renderAchievement(achievement) {
        const progress = this.#achievementSystem.getAchievementProgress(achievement.id);
        const unlockedClass = progress.isUnlocked ? 'achievement-unlocked' : '';

        let progressHtml = '';
        if (achievement.isProgressive && progress.totalLevels) {
            const progressPercent = (progress.currentLevel / progress.totalLevels) * 100;
            progressHtml = `
                <div class="achievement-progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    <span>${progress.currentLevel}/${progress.totalLevels}</span>
                </div>
            `;
        }

        return `
            <div class="achievement-card ${unlockedClass}">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    ${progressHtml}
                </div>
                <div class="achievement-reward">
                    Récompense: ${this.#formatReward(achievement)}
                </div>
            </div>
        `;
    }

    #formatReward(achievement) {
        if (achievement.isProgressive) {
            return achievement.levels.map(level =>
                `${level.reward} coins (niveau ${achievement.levels.indexOf(level) + 1})`
            ).join(', ');
        }
        return `${achievement.reward} coins`;
    }
}
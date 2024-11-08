// src/components/ui/Sidebar.mjs
import { EventEmitter } from '../../utils/EventEmitter.mjs';

export class Sidebar extends EventEmitter {
    #isCollapsed = false;
    #activeRoute = 'dashboard';
    #elements = {};
    #eventHandlers = new Map();
    #menuItems = [
        { route: 'dashboard', icon: 'fa-home', text: 'Dashboard' },
        { route: 'shop', icon: 'fa-store', text: 'Boutique' },
        { route: 'boosters', icon: 'fa-box-open', text: 'Boosters' },
        { route: 'collection', icon: 'fa-layer-group', text: 'Collection' },
        { route: 'market', icon: 'fa-shopping-cart', text: 'Marché' },
        { route: 'autoclickers', icon: 'fa-robot', text: 'Auto Clickers' },
        { route: 'achievements', icon: 'fa-trophy', text: 'Achievements' },
        { route: 'stats', icon: 'fa-chart-line', text: 'Statistiques' }
    ];

    constructor(containerId = 'sidebar') {
        super();
        this.#elements.sidebar = document.getElementById(containerId);
        if (!this.#elements.sidebar) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        this.#init();
    }

    #init() {
        this.#createStructure();
        this.#bindEvents();
        this.emit('navigate', { route: this.#activeRoute });
    }

    #createStructure() {
        const menuItemsHTML = this.#menuItems
            .map(item => `
                <li class="menu-item${item.route === this.#activeRoute ? ' active' : ''}" 
                    data-route="${item.route}">
                    <div class="menu-icon-container">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <span class="menu-text">${item.text}</span>
                </li>
            `).join('');

        this.#elements.sidebar.innerHTML = `
            <div class="sidebar-header">
                <span class="sidebar-title">TCG Game</span>
                <button class="toggle-btn">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            <ul class="menu-list">
                ${menuItemsHTML}
            </ul>
            <div class="sidebar-footer">
                <button class="tutorial-btn">
                    <div class="menu-icon-container">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <span class="menu-text">Tutoriel</span>
                </button>
            </div>
        `;

        this.#elements.toggleBtn = this.#elements.sidebar.querySelector('.toggle-btn');
        this.#elements.menuItems = this.#elements.sidebar.querySelectorAll('.menu-item');
        this.#elements.tutorialBtn = this.#elements.sidebar.querySelector('.tutorial-btn');
        this.#elements.mainContent = document.getElementById('mainContent');
    }

    #bindEvents() {
        // Toggle sidebar
        this.#eventHandlers.set('toggle', () => this.toggle());
        this.#elements.toggleBtn.addEventListener('click',
            this.#eventHandlers.get('toggle'));

        // Navigation
        this.#elements.menuItems.forEach(item => {
            const route = item.dataset.route;
            this.#eventHandlers.set(`navigate_${route}`, () => this.navigateTo(route));
            item.addEventListener('click', this.#eventHandlers.get(`navigate_${route}`));
        });

        this.#eventHandlers.set('tutorial', () => this.emit('tutorial-requested'));
        this.#elements.tutorialBtn.addEventListener('click',
            this.#eventHandlers.get('tutorial'));
    }

    #unbindEvents() {
        this.#elements.toggleBtn.removeEventListener('click',
            this.#eventHandlers.get('toggle'));

        this.#elements.menuItems.forEach(item => {
            const route = item.dataset.route;
            item.removeEventListener('click',
                this.#eventHandlers.get(`navigate_${route}`));
        });

        this.#elements.tutorialBtn?.removeEventListener('click',
            this.#eventHandlers.get('tutorial'));

        this.#eventHandlers.clear();
    }

    toggle() {
        this.#isCollapsed = !this.#isCollapsed;
        this.#elements.sidebar.classList.toggle('collapsed');
        this.#elements.mainContent?.classList.toggle('expanded');
        this.emit('toggle', { isCollapsed: this.#isCollapsed });
    }

    navigateTo(route) {
        this.#activeRoute = route;
        this.#elements.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });
        this.emit('navigate', { route: this.#activeRoute });
    }

    getState() {
        return {
            isCollapsed: this.#isCollapsed,
            activeRoute: this.#activeRoute
        };
    }

    destroy() {
        this.#unbindEvents();
        this.#elements = {};
    }
}
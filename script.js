        // WatchVault - Enhanced Application with GitHub Sync
        class WatchVault {
            constructor() {
                this.items = [];
                this.currentFilter = 'all';
                this.currentCategory = 'all';
                this.searchQuery = '';
                this.editingId = null;
                this.priority = 0;

                // GitHub Config - Default to your repo
                this.token = localStorage.getItem('watchvault_token') || '';
                this.repoName = localStorage.getItem('watchvault_repo') || 'skillerious/WhatToWatch';
                this.dataPath = localStorage.getItem('watchvault_datapath') || 'data/watchlist.json';
                this.fileSha = null;

                // TMDB Config
                this.tmdbKey = localStorage.getItem('watchvault_tmdb') || '';
                this.tmdbSearchTimeout = null;
                this.selectedPoster = '';
                this.selectedTmdbId = '';
                this.selectedOverview = '';
                this.tmdbOverviewPending = new Set();
                this.tmdbOverviewFetchActive = false;

                // Preferences
                this.autoSync = localStorage.getItem('watchvault_autosync') !== 'false';
                this.showDates = localStorage.getItem('watchvault_showdates') !== 'false';
                this.viewMode = localStorage.getItem('watchvault_view') || 'grid';

                this.init();
            }

            async init() {
                this.cacheElements();
                this.bindEvents();
                this.loadPreferences();
                await this.loadData();
                this.hideLoading();
            }

            loadPreferences() {
                // Apply compact view
                if (localStorage.getItem('watchvault_compact') === 'true') {
                    document.body.classList.add('compact-view');
                }
                // Apply animations preference
                if (localStorage.getItem('watchvault_animations') === 'false') {
                    document.body.classList.add('no-animations');
                }
                this.setViewMode(this.viewMode);
            }

            cacheElements() {
                this.addBtn = document.getElementById('addBtn');
                this.fabBtn = document.getElementById('fabBtn');
                this.emptyAddBtn = document.getElementById('emptyAddBtn');
                this.settingsBtn = document.getElementById('settingsBtn');
                this.modalClose = document.getElementById('modalClose');
                this.cancelBtn = document.getElementById('cancelBtn');
                this.saveBtn = document.getElementById('saveBtn');
                this.settingsClose = document.getElementById('settingsClose');
                this.saveTokenBtn = document.getElementById('saveTokenBtn');
                this.exportBtn = document.getElementById('exportBtn');
                this.importBtn = document.getElementById('importBtn');
                this.hamburgerBtn = document.getElementById('hamburgerBtn');
                this.mobileAddBtn = document.getElementById('mobileAddBtn');
                this.mobileSettingsBtn = document.getElementById('mobileSettingsBtn');

                this.cardsGrid = document.getElementById('cardsGrid');
                this.emptyState = document.getElementById('emptyState');
                this.loadingOverlay = document.getElementById('loadingOverlay');
                this.toastContainer = document.getElementById('toastContainer');
                this.mobileMenu = document.getElementById('mobileMenu');

                this.itemModal = document.getElementById('itemModal');
                this.itemForm = document.getElementById('itemForm');
                this.modalTitle = document.getElementById('modalTitle');

                this.itemTitle = document.getElementById('itemTitle');
                this.itemCategory = document.getElementById('itemCategory');
                this.itemStatus = document.getElementById('itemStatus');
                this.itemYear = document.getElementById('itemYear');
                this.itemTags = document.getElementById('itemTags');
                this.itemNotes = document.getElementById('itemNotes');
                this.itemId = document.getElementById('itemId');
                this.itemRating = document.getElementById('itemRating');
                this.itemDateCompleted = document.getElementById('itemDateCompleted');
                this.itemSeason = document.getElementById('itemSeason');
                this.itemPoster = document.getElementById('itemPoster');
                this.itemTmdbId = document.getElementById('itemTmdbId');
                this.priorityInput = document.getElementById('priorityInput');
                this.dateCompletedRow = document.getElementById('dateCompletedRow');
                this.tmdbResults = document.getElementById('tmdbResults');

                this.settingsPanel = document.getElementById('settingsPanel');
                this.settingsBackdrop = document.getElementById('settingsBackdrop');
                this.githubToken = document.getElementById('githubToken');
                this.repoNameInput = document.getElementById('repoName');
                this.dataPathInput = document.getElementById('dataPath');
                this.tmdbKeyInput = document.getElementById('tmdbKey');
                this.tokenDisplay = document.getElementById('tokenDisplay');
                this.tokenStatus = document.getElementById('tokenStatus');
                this.importFile = document.getElementById('importFile');

                // New settings elements
                this.settingsTabs = document.querySelectorAll('.settings-tab');
                this.settingsTabContents = document.querySelectorAll('.settings-tab-content');
                this.connectionCard = document.getElementById('connectionCard');
                this.connectionStatus = document.getElementById('connectionStatus');
                this.connectionDetail = document.getElementById('connectionDetail');
                this.testConnectionBtn = document.getElementById('testConnectionBtn');
                this.toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
                this.toggleTmdbVisibility = document.getElementById('toggleTmdbVisibility');
                this.clearDataBtn = document.getElementById('clearDataBtn');
                this.autoSyncToggle = document.getElementById('autoSyncToggle');
                this.showDatesToggle = document.getElementById('showDatesToggle');
                this.compactViewToggle = document.getElementById('compactViewToggle');
                this.animationsToggle = document.getElementById('animationsToggle');
                this.defaultCategory = document.getElementById('defaultCategory');
                this.defaultStatus = document.getElementById('defaultStatus');

                this.syncIndicator = document.getElementById('syncIndicator');
                this.syncDot = document.getElementById('syncDot');
                this.syncText = document.getElementById('syncText');

                this.searchInput = document.getElementById('searchInput');
                this.filterBtns = document.querySelectorAll('.filter-btn');
                this.categoryPills = document.querySelectorAll('.category-pill');
                this.viewToggleBtns = document.querySelectorAll('.view-btn');
                this.mobileViewBtns = document.querySelectorAll('[data-mobile-view]');
            }

            bindEvents() {
                [this.addBtn, this.fabBtn, this.emptyAddBtn, this.mobileAddBtn].forEach(btn => {
                    btn?.addEventListener('click', () => {
                        this.closeMobileMenu();
                        this.openModal();
                    });
                });

                this.hamburgerBtn?.addEventListener('click', () => this.toggleMobileMenu());

                this.mobileSettingsBtn?.addEventListener('click', () => {
                    this.closeMobileMenu();
                    this.openSettings();
                });

                document.querySelectorAll('[data-mobile-filter]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('[data-mobile-filter]').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.currentFilter = btn.dataset.mobileFilter;
                        this.render();
                        this.filterBtns.forEach(b => {
                            b.classList.toggle('active', b.dataset.filter === this.currentFilter);
                        });
                    });
                });

                document.querySelectorAll('[data-mobile-category]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.currentCategory = btn.dataset.mobileCategory;
                        this.render();
                        this.closeMobileMenu();
                        this.categoryPills.forEach(p => {
                            p.classList.toggle('active', p.dataset.category === this.currentCategory);
                        });
                    });
                });

                this.viewToggleBtns.forEach(btn => {
                    btn.addEventListener('click', () => this.setViewMode(btn.dataset.view));
                });

                this.mobileViewBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.setViewMode(btn.dataset.mobileView);
                        this.closeMobileMenu();
                    });
                });

                this.modalClose?.addEventListener('click', () => this.closeModal());
                this.cancelBtn?.addEventListener('click', () => this.closeModal());
                this.itemModal?.addEventListener('click', (e) => {
                    if (e.target === this.itemModal) this.closeModal();
                });
                this.itemForm?.addEventListener('submit', (e) => this.handleSubmit(e));

                this.itemStatus?.addEventListener('change', (e) => {
                    this.dateCompletedRow.style.display = e.target.value === 'watched' ? 'grid' : 'none';
                    if (e.target.value === 'watched' && !this.itemDateCompleted.value) {
                        this.itemDateCompleted.value = new Date().toISOString().split('T')[0];
                    }
                });

                this.priorityInput?.querySelectorAll('.priority-star').forEach(star => {
                    star.addEventListener('click', () => this.setPriority(parseInt(star.dataset.value)));
                    star.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.setPriority(parseInt(star.dataset.value));
                        }
                    });
                });

                this.itemTitle?.addEventListener('input', (e) => this.handleTmdbSearch(e.target.value));
                this.itemTitle?.addEventListener('focus', () => {
                    if (this.tmdbResults?.children.length > 0) {
                        this.tmdbResults.classList.add('active');
                    }
                });
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.tmdb-search-container')) {
                        this.tmdbResults?.classList.remove('active');
                    }
                });

                this.settingsBtn?.addEventListener('click', () => this.openSettings());
                this.settingsClose?.addEventListener('click', () => this.closeSettings());
                this.settingsBackdrop?.addEventListener('click', () => this.closeSettings());
                this.saveTokenBtn?.addEventListener('click', () => this.saveSettings());
                this.exportBtn?.addEventListener('click', () => this.exportData());
                this.importBtn?.addEventListener('click', () => this.importFile?.click());
                this.importFile?.addEventListener('change', (e) => this.handleImport(e));

                // Settings tabs
                this.settingsTabs.forEach(tab => {
                    tab.addEventListener('click', () => this.switchSettingsTab(tab.dataset.tab));
                });

                // Test connection
                this.testConnectionBtn?.addEventListener('click', () => this.testConnection());

                // Toggle password visibility
                this.toggleTokenVisibility?.addEventListener('click', () => {
                    this.toggleInputVisibility(this.githubToken, this.toggleTokenVisibility);
                });
                this.toggleTmdbVisibility?.addEventListener('click', () => {
                    this.toggleInputVisibility(this.tmdbKeyInput, this.toggleTmdbVisibility);
                });

                // Clear all data
                this.clearDataBtn?.addEventListener('click', () => this.clearAllData());

                // Preference toggles
                this.autoSyncToggle?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_autosync', e.target.checked);
                    this.autoSync = e.target.checked;
                });
                this.showDatesToggle?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_showdates', e.target.checked);
                    this.showDates = e.target.checked;
                    this.render();
                });
                this.compactViewToggle?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_compact', e.target.checked);
                    document.body.classList.toggle('compact-view', e.target.checked);
                });
                this.animationsToggle?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_animations', e.target.checked);
                    document.body.classList.toggle('no-animations', !e.target.checked);
                });
                this.defaultCategory?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_defaultcategory', e.target.value);
                });
                this.defaultStatus?.addEventListener('change', (e) => {
                    localStorage.setItem('watchvault_defaultstatus', e.target.value);
                });

                this.searchInput?.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value.toLowerCase();
                    this.render();
                });

                this.filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.filterBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.currentFilter = btn.dataset.filter;
                        this.render();
                    });
                });

                this.categoryPills.forEach(pill => {
                    pill.addEventListener('click', () => {
                        this.categoryPills.forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                        this.currentCategory = pill.dataset.category;
                        this.render();
                    });
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeModal();
                        this.closeSettings();
                        this.closeMobileMenu();
                    }
                    if (e.key === 'n' && (e.ctrlKey || e.metaKey) && !this.itemModal?.classList.contains('active')) {
                        e.preventDefault();
                        this.openModal();
                    }
                });
            }

            toggleMobileMenu() {
                this.hamburgerBtn?.classList.toggle('active');
                this.mobileMenu?.classList.toggle('active');
                document.body.style.overflow = this.mobileMenu?.classList.contains('active') ? 'hidden' : '';
            }

            closeMobileMenu() {
                this.hamburgerBtn?.classList.remove('active');
                this.mobileMenu?.classList.remove('active');
                document.body.style.overflow = '';
            }

            async handleTmdbSearch(query) {
                if (!this.tmdbKey || query.length < 2) {
                    this.tmdbResults?.classList.remove('active');
                    return;
                }

                clearTimeout(this.tmdbSearchTimeout);
                this.tmdbSearchTimeout = setTimeout(async () => {
                    try {
                        const type = this.itemCategory.value === 'tv' || this.itemCategory.value === 'anime' ? 'tv' : 'movie';
                        const response = await fetch(
                            `https://api.themoviedb.org/3/search/${type}?api_key=${this.tmdbKey}&query=${encodeURIComponent(query)}&page=1`
                        );
                        const data = await response.json();

                        if (data.results && data.results.length > 0) {
                            this.tmdbResults.innerHTML = data.results.slice(0, 6).map(item => {
                                const title = item.title || item.name;
                                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : '';

                                return `
                                    <div class="tmdb-result-item" data-title="${this.escapeHtml(title)}"
                                         data-year="${year}" data-poster="${item.poster_path || ''}" data-tmdb-id="${item.id}"
                                         data-overview="${encodeURIComponent(item.overview || '')}">
                                        <div class="tmdb-result-poster">
                                            ${poster ? `<img src="${poster}" alt="">` : '🎬'}
                                        </div>
                                        <div class="tmdb-result-info">
                                            <div class="tmdb-result-title">${this.escapeHtml(title)}</div>
                                            <div class="tmdb-result-year">${year || 'Unknown'}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('');

                            this.tmdbResults.querySelectorAll('.tmdb-result-item').forEach(item => {
                                item.addEventListener('click', () => {
                                    this.itemTitle.value = item.dataset.title;
                                    this.itemYear.value = item.dataset.year;
                                    this.selectedPoster = item.dataset.poster;
                                    this.selectedTmdbId = item.dataset.tmdbId;
                                    this.selectedOverview = item.dataset.overview ? decodeURIComponent(item.dataset.overview) : '';
                                    this.itemPoster.value = this.selectedPoster;
                                    this.itemTmdbId.value = this.selectedTmdbId;
                                    this.tmdbResults.classList.remove('active');
                                });
                            });

                            this.tmdbResults.classList.add('active');
                        } else {
                            this.tmdbResults.classList.remove('active');
                        }
                    } catch (error) {
                        console.error('TMDB search error:', error);
                    }
                }, 300);
            }

            async loadData() {
                if (this.token && this.repoName) {
                    try {
                        this.updateSyncStatus('syncing');
                        const response = await fetch(
                            `https://api.github.com/repos/${this.repoName}/contents/${this.dataPath}`,
                            {
                                headers: {
                                    'Authorization': `token ${this.token}`,
                                    'Accept': 'application/vnd.github.v3+json'
                                }
                            }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            this.fileSha = data.sha;
                            const content = atob(data.content);
                            this.items = JSON.parse(content);
                            this.updateTokenDisplay(true);
                            this.updateSyncStatus('synced');
                            this.render();
                            return;
                        } else if (response.status === 404) {
                            this.updateSyncStatus('synced');
                        }
                    } catch (error) {
                        console.error('GitHub load error:', error);
                        this.updateSyncStatus('error');
                    }
                }

                const stored = localStorage.getItem('watchvault_items');
                if (stored) {
                    this.items = JSON.parse(stored);
                }

                this.updateTokenDisplay(!!this.token);
                if (!this.token) {
                    this.updateSyncStatus('local');
                }
                this.render();
            }

            async saveData() {
                localStorage.setItem('watchvault_items', JSON.stringify(this.items));

                if (this.token && this.repoName) {
                    try {
                        this.updateSyncStatus('syncing');

                        const content = btoa(unescape(encodeURIComponent(JSON.stringify(this.items, null, 2))));
                        const payload = {
                            message: `Update watchlist - ${new Date().toISOString()}`,
                            content: content,
                            branch: 'main'
                        };

                        if (this.fileSha) {
                            payload.sha = this.fileSha;
                        }

                        const response = await fetch(
                            `https://api.github.com/repos/${this.repoName}/contents/${this.dataPath}`,
                            {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `token ${this.token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/vnd.github.v3+json'
                                },
                                body: JSON.stringify(payload)
                            }
                        );

                        if (response.ok) {
                            const data = await response.json();
                            this.fileSha = data.content.sha;
                            this.updateSyncStatus('synced');
                        } else {
                            const errorData = await response.json();
                            console.error('GitHub API Error:', errorData);
                            throw new Error(errorData.message || 'Sync failed');
                        }
                    } catch (error) {
                        console.error('GitHub sync error:', error);
                        this.updateSyncStatus('error');
                        this.showToast('Saved locally, GitHub sync failed', 'error');
                    }
                }
            }

            updateSyncStatus(status) {
                if (!this.syncDot) return;
                this.syncDot.className = 'sync-dot';
                switch (status) {
                    case 'synced':
                        this.syncDot.classList.add('synced');
                        this.syncText.textContent = 'Synced';
                        break;
                    case 'syncing':
                        this.syncDot.classList.add('syncing');
                        this.syncText.textContent = 'Syncing...';
                        break;
                    case 'error':
                        this.syncText.textContent = 'Sync Error';
                        break;
                    default:
                        this.syncText.textContent = 'Local Only';
                }
            }

            render() {
                const filtered = this.getFilteredItems();
                this.updateStats();
                this.updateCategoryCounts();

                if (this.items.length === 0) {
                    this.cardsGrid.innerHTML = '';
                    this.emptyState.style.display = 'block';
                    return;
                }

                this.emptyState.style.display = 'none';

                if (filtered.length === 0) {
                    this.cardsGrid.innerHTML = `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <div class="empty-icon">🔍</div>
                            <h2 class="empty-title">No Results</h2>
                            <p class="empty-text">Try adjusting your search or filters</p>
                        </div>
                    `;
                    return;
                }

                this.cardsGrid.innerHTML = filtered.map((item, index) => this.renderCard(item, index)).join('');
                this.bindCardEvents();
                if (this.viewMode === 'list' && this.tmdbKey) {
                    this.ensureTmdbOverviews(filtered);
                }
            }

            renderCard(item, index) {
                const statusLabels = { towatch: 'To Watch', watching: 'Watching', watched: 'Watched' };
                const categoryIcons = { movie: '🎬', tv: '📺', anime: '🎌', documentary: '🎥', other: '✨' };

                const stars = Array(5).fill(0).map((_, i) =>
                    `<span class="star ${i < item.priority ? 'filled' : ''}">★</span>`
                ).join('');

                const tags = item.tags?.length ?
                    `<div class="card-tags">${item.tags.slice(0, 3).map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}</div>` : '';

                const posterUrl = item.poster ? `https://image.tmdb.org/t/p/w200${item.poster}` : '';

                const dateCompleted = item.dateCompleted
                    ? `<div class="date-completed">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Completed ${this.formatDate(item.dateCompleted)}
                       </div>`
                    : '';

                const ratingDisplay = item.rating ? `<span>⭐ ${item.rating}/10</span>` : '';
                const updatedLabel = item.status === 'watched' ? 'Completed' : 'Updated';
                const updatedDate = item.status === 'watched'
                    ? (item.dateCompleted || item.updatedAt || item.createdAt)
                    : (item.updatedAt || item.createdAt);
                const updatedValue = updatedDate ? this.formatDate(updatedDate) : 'N/A';
                const listTags = item.tags?.length
                    ? item.tags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')
                    : '';
                const listDetails = `
                    <div class="list-details">
                        <div class="list-detail">
                            <div class="list-detail-label">Year</div>
                            <div class="list-detail-value">${item.year ? this.escapeHtml(item.year) : 'N/A'}</div>
                        </div>
                        <div class="list-detail">
                            <div class="list-detail-label">Rating</div>
                            <div class="list-detail-value">${item.rating ? `${item.rating}/10` : 'Unrated'}</div>
                        </div>
                        <div class="list-detail">
                            <div class="list-detail-label">Priority</div>
                            <div class="list-detail-value">${item.priority ? `${item.priority}/5` : 'None'}</div>
                        </div>
                        <div class="list-detail">
                            <div class="list-detail-label">Season/Episode</div>
                            <div class="list-detail-value">${item.season ? this.escapeHtml(item.season) : 'N/A'}</div>
                        </div>
                        <div class="list-detail">
                            <div class="list-detail-label">${updatedLabel}</div>
                            <div class="list-detail-value">${updatedValue}</div>
                        </div>
                        ${listTags ? `<div class="list-detail full"><div class="list-detail-label">Tags</div><div class="list-detail-value"><div class="list-tags">${listTags}</div></div></div>` : ''}
                    </div>
                `;
                const listPremise = item.overview
                    ? `
                        <div class="list-premise">
                            <div class="list-premise-label">Premise</div>
                            <p class="list-premise-text">${this.escapeHtml(item.overview)}</p>
                        </div>
                      `
                    : '';

                return `
                    <article class="item-card" style="animation-delay: ${index * 0.03}s" data-id="${item.id}">
                        <div class="card-poster-section">
                            <div class="card-poster">
                                ${posterUrl
                                    ? `<img src="${posterUrl}" alt="${this.escapeHtml(item.title)}" loading="lazy">`
                                    : `<span class="card-poster-placeholder">${categoryIcons[item.category] || '🎬'}</span>`
                                }
                            </div>
                            <div class="card-info">
                                <span class="card-status status-${item.status}">${statusLabels[item.status]}</span>
                                <span class="card-category">
                                    ${categoryIcons[item.category]} ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </span>
                                <h3 class="card-title">${this.escapeHtml(item.title)}</h3>
                                <div class="card-meta">
                                    ${item.year ? `<span>📅 ${item.year}</span>` : ''}
                                    ${ratingDisplay}
                                    <span class="priority-stars">${stars}</span>
                                </div>
                                ${item.season ? `<div class="card-meta"><span>📺 ${this.escapeHtml(item.season)}</span></div>` : ''}
                                ${dateCompleted}
                            </div>
                        </div>
                        <div class="card-body">
                            ${listDetails}
                            ${listPremise}
                            ${item.notes ? `<p class="card-notes">${this.escapeHtml(item.notes)}</p>` : ''}
                            ${tags}
                            <div class="card-actions">
                                <button class="action-btn edit-btn" data-id="${item.id}" aria-label="Edit">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                                <button class="action-btn success status-btn" data-id="${item.id}" aria-label="Change status">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    ${item.status === 'watched' ? 'Rewatch' : item.status === 'watching' ? 'Done' : 'Start'}
                                </button>
                                <button class="action-btn danger delete-btn" data-id="${item.id}" aria-label="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }

            formatDate(dateStr) {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            bindCardEvents() {
                this.cardsGrid.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.editItem(btn.dataset.id));
                });

                this.cardsGrid.querySelectorAll('.status-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.cycleStatus(btn.dataset.id));
                });

                this.cardsGrid.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.deleteItem(btn.dataset.id));
                });
            }

            getFilteredItems() {
                return this.items.filter(item => {
                    const matchesFilter = this.currentFilter === 'all' || item.status === this.currentFilter;
                    const matchesCategory = this.currentCategory === 'all' || item.category === this.currentCategory;
                    const matchesSearch = !this.searchQuery ||
                        item.title.toLowerCase().includes(this.searchQuery) ||
                        item.notes?.toLowerCase().includes(this.searchQuery) ||
                        item.tags?.some(t => t.toLowerCase().includes(this.searchQuery));

                    return matchesFilter && matchesCategory && matchesSearch;
                }).sort((a, b) => {
                    if (a.status === 'watched' && b.status === 'watched') {
                        return new Date(b.dateCompleted || 0) - new Date(a.dateCompleted || 0);
                    }
                    if (b.priority !== a.priority) return b.priority - a.priority;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            }

            updateStats() {
                const total = this.items.length;
                const towatch = this.items.filter(i => i.status === 'towatch').length;
                const watching = this.items.filter(i => i.status === 'watching').length;
                const watched = this.items.filter(i => i.status === 'watched').length;

                document.getElementById('statTotal').textContent = total;
                document.getElementById('statToWatch').textContent = towatch;
                document.getElementById('statWatching').textContent = watching;
                document.getElementById('statWatched').textContent = watched;
            }

            updateCategoryCounts() {
                document.getElementById('countAll').textContent = this.items.length;
                document.getElementById('countMovie').textContent = this.items.filter(i => i.category === 'movie').length;
                document.getElementById('countTv').textContent = this.items.filter(i => i.category === 'tv').length;
                document.getElementById('countAnime').textContent = this.items.filter(i => i.category === 'anime').length;
                document.getElementById('countDocumentary').textContent = this.items.filter(i => i.category === 'documentary').length;
                document.getElementById('countOther').textContent = this.items.filter(i => i.category === 'other').length;
            }

            getTmdbTypeForItem(item) {
                return ['tv', 'anime'].includes(item.category) ? 'tv' : 'movie';
            }

            async ensureTmdbOverviews(items) {
                if (this.tmdbOverviewFetchActive || !this.tmdbKey) return;

                const pending = items.filter(item =>
                    item.tmdbId && !item.overview && !this.tmdbOverviewPending.has(item.tmdbId)
                );

                if (pending.length === 0) return;

                this.tmdbOverviewFetchActive = true;
                let updated = false;

                try {
                    for (const item of pending) {
                        const overview = await this.fetchTmdbOverview(item);
                        if (overview) {
                            item.overview = overview;
                            updated = true;
                        }
                    }
                } finally {
                    this.tmdbOverviewFetchActive = false;
                }

                if (updated) {
                    await this.saveData();
                    this.render();
                }
            }

            async fetchTmdbOverview(item) {
                if (!item.tmdbId || !this.tmdbKey) return '';

                if (this.tmdbOverviewPending.has(item.tmdbId)) return '';
                this.tmdbOverviewPending.add(item.tmdbId);

                try {
                    const type = this.getTmdbTypeForItem(item);
                    const response = await fetch(
                        `https://api.themoviedb.org/3/${type}/${item.tmdbId}?api_key=${this.tmdbKey}`
                    );

                    if (!response.ok) return '';

                    const data = await response.json();
                    return data.overview || '';
                } catch (error) {
                    console.error('TMDB detail error:', error);
                    return '';
                } finally {
                    this.tmdbOverviewPending.delete(item.tmdbId);
                }
            }

            setViewMode(view) {
                const nextView = view === 'list' ? 'list' : 'grid';
                this.viewMode = nextView;
                localStorage.setItem('watchvault_view', nextView);
                document.body.classList.toggle('list-view', nextView === 'list');

                this.viewToggleBtns.forEach(btn => {
                    const isActive = btn.dataset.view === nextView;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-pressed', isActive);
                });

                this.mobileViewBtns.forEach(btn => {
                    const isActive = btn.dataset.mobileView === nextView;
                    btn.classList.toggle('active', isActive);
                });
            }

            openModal(item = null) {
                this.editingId = item?.id || null;
                this.modalTitle.textContent = item ? 'Edit Item' : 'Add New Item';

                this.itemForm.reset();
                this.setPriority(item?.priority || 0);
                this.selectedPoster = item?.poster || '';
                this.selectedTmdbId = item?.tmdbId || '';
                this.selectedOverview = item?.overview || '';
                this.tmdbResults?.classList.remove('active');

                if (item) {
                    this.itemTitle.value = item.title;
                    this.itemCategory.value = item.category;
                    this.itemStatus.value = item.status;
                    this.itemYear.value = item.year || '';
                    this.itemRating.value = item.rating || '';
                    this.itemTags.value = item.tags?.join(', ') || '';
                    this.itemNotes.value = item.notes || '';
                    this.itemDateCompleted.value = item.dateCompleted || '';
                    this.itemSeason.value = item.season || '';
                    this.itemPoster.value = item.poster || '';
                    this.itemTmdbId.value = item.tmdbId || '';

                    this.dateCompletedRow.style.display = item.status === 'watched' ? 'grid' : 'none';
                } else {
                    this.dateCompletedRow.style.display = 'none';
                }

                this.itemModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                setTimeout(() => this.itemTitle.focus(), 100);
            }

            closeModal() {
                this.itemModal?.classList.remove('active');
                document.body.style.overflow = '';
                this.editingId = null;
            }

            setPriority(value) {
                this.priority = value;
                this.priorityInput?.querySelectorAll('.priority-star').forEach((star, index) => {
                    star.classList.toggle('active', index < value);
                    star.setAttribute('aria-checked', index < value);
                });
            }

            async handleSubmit(e) {
                e.preventDefault();

                const tags = this.itemTags.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t);

                const status = this.itemStatus.value;
                const existingItem = this.editingId ? this.items.find(i => i.id === this.editingId) : null;

                const itemData = {
                    id: this.editingId || this.generateId(),
                    title: this.itemTitle.value.trim(),
                    category: this.itemCategory.value,
                    status: status,
                    year: this.itemYear.value.trim(),
                    priority: this.priority,
                    rating: this.itemRating.value ? parseInt(this.itemRating.value) : null,
                    tags,
                    notes: this.itemNotes.value.trim(),
                    poster: this.itemPoster.value || this.selectedPoster,
                    tmdbId: this.itemTmdbId.value || this.selectedTmdbId,
                    overview: this.selectedOverview || existingItem?.overview || '',
                    season: this.itemSeason.value.trim(),
                    dateCompleted: status === 'watched' ? (this.itemDateCompleted.value || new Date().toISOString().split('T')[0]) : null,
                    createdAt: existingItem?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (this.editingId) {
                    const index = this.items.findIndex(i => i.id === this.editingId);
                    if (index > -1) this.items[index] = itemData;
                    this.showToast('Item updated successfully');
                } else {
                    this.items.unshift(itemData);
                    this.showToast('Added to your watchlist');
                }

                await this.saveData();
                this.render();
                this.closeModal();
            }

            editItem(id) {
                const item = this.items.find(i => i.id === id);
                if (item) this.openModal(item);
            }

            async cycleStatus(id) {
                const item = this.items.find(i => i.id === id);
                if (!item) return;

                const statusOrder = ['towatch', 'watching', 'watched'];
                const currentIndex = statusOrder.indexOf(item.status);
                const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

                item.status = newStatus;
                item.updatedAt = new Date().toISOString();

                if (newStatus === 'watched' && !item.dateCompleted) {
                    item.dateCompleted = new Date().toISOString().split('T')[0];
                } else if (newStatus !== 'watched') {
                    item.dateCompleted = null;
                }

                await this.saveData();
                this.render();

                const statusLabels = { towatch: 'To Watch', watching: 'Watching', watched: 'Watched' };
                this.showToast(`Marked as ${statusLabels[newStatus]}`);
            }

            async deleteItem(id) {
                if (!confirm('Delete this item from your watchlist?')) return;

                this.items = this.items.filter(i => i.id !== id);
                await this.saveData();
                this.render();
                this.showToast('Item deleted');
            }

            openSettings() {
                // Populate form values
                this.githubToken.value = this.token;
                this.repoNameInput.value = this.repoName;
                this.dataPathInput.value = this.dataPath;
                this.tmdbKeyInput.value = this.tmdbKey;

                // Update connection status card
                this.updateConnectionCard();

                // Update settings stats
                this.updateSettingsStats();

                // Load preference toggles
                this.autoSyncToggle.checked = localStorage.getItem('watchvault_autosync') !== 'false';
                this.showDatesToggle.checked = localStorage.getItem('watchvault_showdates') !== 'false';
                this.compactViewToggle.checked = localStorage.getItem('watchvault_compact') === 'true';
                this.animationsToggle.checked = localStorage.getItem('watchvault_animations') !== 'false';

                // Load default values
                const defaultCat = localStorage.getItem('watchvault_defaultcategory') || 'movie';
                const defaultStat = localStorage.getItem('watchvault_defaultstatus') || 'towatch';
                if (this.defaultCategory) this.defaultCategory.value = defaultCat;
                if (this.defaultStatus) this.defaultStatus.value = defaultStat;

                // Reset to first tab
                this.switchSettingsTab('sync');

                this.settingsPanel?.classList.add('active');
                this.settingsBackdrop?.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            closeSettings() {
                this.settingsPanel?.classList.remove('active');
                this.settingsBackdrop?.classList.remove('active');
                document.body.style.overflow = '';
            }

            switchSettingsTab(tabId) {
                this.settingsTabs.forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.tab === tabId);
                });
                this.settingsTabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${tabId}`);
                });
            }

            updateConnectionCard() {
                if (!this.connectionCard) return;

                if (this.token && this.repoName) {
                    this.connectionCard.classList.remove('not-connected', 'error');
                    this.connectionStatus.textContent = 'Connected';
                    this.connectionDetail.textContent = this.repoName;
                } else {
                    this.connectionCard.classList.add('not-connected');
                    this.connectionCard.classList.remove('error');
                    this.connectionStatus.textContent = 'Not Connected';
                    this.connectionDetail.textContent = 'Configure token to enable sync';
                }
            }

            updateSettingsStats() {
                const total = this.items.length;
                const watched = this.items.filter(i => i.status === 'watched').length;
                const watching = this.items.filter(i => i.status === 'watching').length;
                const towatch = this.items.filter(i => i.status === 'towatch').length;

                const statTotal = document.getElementById('settingsStatTotal');
                const statWatched = document.getElementById('settingsStatWatched');
                const statWatching = document.getElementById('settingsStatWatching');
                const statToWatch = document.getElementById('settingsStatToWatch');

                if (statTotal) statTotal.textContent = total;
                if (statWatched) statWatched.textContent = watched;
                if (statWatching) statWatching.textContent = watching;
                if (statToWatch) statToWatch.textContent = towatch;
            }

            async testConnection() {
                if (!this.token || !this.repoName) {
                    this.showToast('Please enter token and repository first', 'error');
                    return;
                }

                this.testConnectionBtn?.classList.add('spinning');

                try {
                    const response = await fetch(
                        `https://api.github.com/repos/${this.repoName}`,
                        {
                            headers: {
                                'Authorization': `token ${this.token}`,
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        }
                    );

                    if (response.ok) {
                        const repo = await response.json();
                        this.connectionCard?.classList.remove('not-connected', 'error');
                        this.connectionStatus.textContent = 'Connected';
                        this.connectionDetail.textContent = repo.full_name;
                        this.showToast('Connection successful!');
                    } else if (response.status === 401) {
                        throw new Error('Invalid token');
                    } else if (response.status === 404) {
                        throw new Error('Repository not found');
                    } else {
                        throw new Error('Connection failed');
                    }
                } catch (error) {
                    this.connectionCard?.classList.remove('not-connected');
                    this.connectionCard?.classList.add('error');
                    this.connectionStatus.textContent = 'Connection Failed';
                    this.connectionDetail.textContent = error.message;
                    this.showToast(error.message, 'error');
                } finally {
                    this.testConnectionBtn?.classList.remove('spinning');
                }
            }

            toggleInputVisibility(input, button) {
                if (!input || !button) return;

                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';

                // Update icon
                const eyeOpen = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                const eyeClosed = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

                button.innerHTML = isPassword ? eyeClosed : eyeOpen;
            }

            async clearAllData() {
                if (!confirm('Are you sure you want to delete ALL items from your library? This cannot be undone!')) {
                    return;
                }

                if (!confirm('This will permanently delete ' + this.items.length + ' items. Are you absolutely sure?')) {
                    return;
                }

                this.items = [];
                await this.saveData();
                this.render();
                this.updateSettingsStats();
                this.showToast('All data has been cleared');
            }

            async saveSettings() {
                this.token = this.githubToken.value.trim();
                this.repoName = this.repoNameInput.value.trim();
                this.dataPath = this.dataPathInput.value.trim() || 'data/watchlist.json';
                this.tmdbKey = this.tmdbKeyInput.value.trim();

                localStorage.setItem('watchvault_token', this.token);
                localStorage.setItem('watchvault_repo', this.repoName);
                localStorage.setItem('watchvault_datapath', this.dataPath);
                localStorage.setItem('watchvault_tmdb', this.tmdbKey);

                if (this.token && this.repoName) {
                    this.showToast('Syncing with GitHub...');
                    this.fileSha = null;
                    await this.loadData();
                    await this.saveData();
                    this.updateConnectionCard();
                    this.showToast('Settings saved and synced!');
                } else {
                    this.showToast('Settings saved');
                    this.updateSyncStatus('local');
                    this.updateConnectionCard();
                }

                this.updateTokenDisplay(!!this.token);
                this.closeSettings();
            }

            updateTokenDisplay(hasToken) {
                if (hasToken && this.repoName) {
                    this.tokenDisplay?.classList.remove('not-set');
                    if (this.tokenStatus) this.tokenStatus.textContent = 'Connected';
                } else {
                    this.tokenDisplay?.classList.add('not-set');
                    if (this.tokenStatus) this.tokenStatus.textContent = 'Not configured';
                }
            }

            exportData() {
                const exportData = {
                    version: '2.0',
                    exportedAt: new Date().toISOString(),
                    items: this.items
                };
                const data = JSON.stringify(exportData, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `watchvault-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Data exported');
            }

            async handleImport(e) {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const data = JSON.parse(text);

                    const items = Array.isArray(data) ? data : (data.items || []);

                    if (!Array.isArray(items)) {
                        throw new Error('Invalid format');
                    }

                    const existingIds = new Set(this.items.map(i => i.id));
                    const newItems = items.filter(item => !existingIds.has(item.id));

                    this.items = [...newItems, ...this.items];
                    await this.saveData();
                    this.render();
                    this.showToast(`Imported ${newItems.length} items`);
                } catch (error) {
                    this.showToast('Import failed - invalid file', 'error');
                }

                e.target.value = '';
            }

            showToast(message, type = 'success') {
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.innerHTML = `
                    <span>${type === 'success' ? '✓' : '⚠'}</span>
                    <span>${message}</span>
                `;
                this.toastContainer?.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }

            hideLoading() {
                setTimeout(() => {
                    this.loadingOverlay?.classList.add('hidden');
                }, 400);
            }

            generateId() {
                return `wv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new WatchVault();
        });
    

// Painel de Debug para visualizar logs e status dos módulos
const DebugPanel = {
    isOpen: false,
    updateInterval: null,

    init() {
        this.createPanel();
        this.setupKeyboardShortcut();
        Logger.info('DebugPanel', 'Debug Panel inicializado - Use Ctrl+Shift+D para abrir');
    },

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: #1a1a1a;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            transition: right 0.3s ease;
            overflow-y: auto;
            border-left: 2px solid #00ff00;
            box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        `;

        panel.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #333; background: #0a0a0a;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="color: #00ff00; margin: 0;">🐛 Debug Panel</h3>
                    <div>
                        <button onclick="DebugPanel.exportLogs()" style="background: #1a4a1a; color: #00ff00; border: 1px solid #00ff00; padding: 5px; margin-right: 5px; cursor: pointer;">Export</button>
                        <button onclick="DebugPanel.clearLogs()" style="background: #4a1a1a; color: #ff0000; border: 1px solid #ff0000; padding: 5px; margin-right: 5px; cursor: pointer;">Clear</button>
                        <button onclick="DebugPanel.close()" style="background: #333; color: #fff; border: 1px solid #666; padding: 5px; cursor: pointer;">×</button>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <select id="debug-filter-level" onchange="DebugPanel.updateLogs()" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 2px;">
                        <option value="">Todos os níveis</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>
                    <select id="debug-filter-module" onchange="DebugPanel.updateLogs()" style="background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 2px;">
                        <option value="">Todos os módulos</option>
                    </select>
                </div>
            </div>

            <div id="debug-stats" style="background: #111; padding: 10px; margin-bottom: 20px; border: 1px solid #333;"></div>
            <div id="debug-modules" style="background: #111; padding: 10px; margin-bottom: 20px; border: 1px solid #333;"></div>
            <div id="debug-logs" style="max-height: 400px; overflow-y: auto;"></div>
        `;

        document.body.appendChild(panel);
    },

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + D para abrir/fechar debug panel
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        const panel = document.getElementById('debug-panel');
        panel.style.right = '0px';
        this.isOpen = true;
        this.updateAll();

        // Atualizar a cada 2 segundos
        this.updateInterval = setInterval(() => {
            this.updateAll();
        }, 2000);

        Logger.debug('DebugPanel', 'Painel de debug aberto');
    },

    close() {
        const panel = document.getElementById('debug-panel');
        panel.style.right = '-400px';
        this.isOpen = false;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        Logger.debug('DebugPanel', 'Painel de debug fechado');
    },

    updateAll() {
        this.updateStats();
        this.updateModules();
        this.updateLogs();
        this.updateFilters();
    },

    updateStats() {
        if (!Logger) return;

        const stats = Logger.getStats();
        if (!stats) return;

        const statsContainer = document.getElementById('debug-stats');
        statsContainer.innerHTML = `
            <h4 style="color: #00ff00; margin: 0 0 10px 0;">📊 Estatísticas</h4>
            <div>Total de logs: ${stats.total}</div>
            <div style="margin-top: 5px;">Por nível:</div>
            ${Object.entries(stats.byLevel).map(([level, count]) => 
                `<div style="margin-left: 10px; color: ${this.getLevelColor(level)};">
                    ${level}: ${count}
                </div>`
            ).join('')}
        `;
    },

    updateModules() {
        const modulesContainer = document.getElementById('debug-modules');
        const modules = [
            { name: 'Logger', obj: window.Logger },
            { name: 'AppState', obj: window.AppState },
            { name: 'Navigation', obj: window.Navigation },
            { name: 'ApiService', obj: window.ApiService },
            { name: 'Dashboard', obj: window.Dashboard },
            { name: 'Movements', obj: window.Movements },
            { name: 'Modal', obj: window.Modal }
        ];

        modulesContainer.innerHTML = `
            <h4 style="color: #00ff00; margin: 0 0 10px 0;">🔧 Status dos Módulos</h4>
            ${modules.map(({ name, obj }) => {
                const status = obj ? '✅' : '❌';
                const color = obj ? '#00ff00' : '#ff0000';
                const hasInit = obj && typeof obj.init === 'function' ? ' (init)' : '';
                return `<div style="color: ${color};">${status} ${name}${hasInit}</div>`;
            }).join('')}
        `;
    },

    // Atualizar logs
    updateLogs() {
        try {
            if (typeof Logger === 'undefined' || typeof Logger.getLogs !== 'function') {
                const logsContainer = document.getElementById('debug-logs');
                logsContainer.innerHTML = '<p>Logger não disponível ou método getLogs não existe</p>';
                return;
            }

            const levelFilter = document.getElementById('debug-filter-level').value;
            const moduleFilter = document.getElementById('debug-filter-module').value;

            const logs = Logger.getLogs().filter(log => {
                if (levelFilter && log.level !== levelFilter) return false;
                if (moduleFilter && log.module !== moduleFilter) return false;
                return true;
            });

            const logsContainer = document.getElementById('debug-logs');
            logsContainer.innerHTML = logs.slice(-50).map(log => `
                <div style="border-bottom: 1px solid #333; padding: 5px; color: ${this.getLevelColor(log.level)};">
                    <div style="font-size: 10px; color: #666;">[${log.timestamp.substring(11, 19)}]</div>
                    <div><strong>${log.level}</strong> [${log.module}] ${log.message}</div>
                    ${log.data ? `<div style="color: #999; font-size: 10px; margin-left: 20px;">${typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}</div>` : ''}
                </div>
            `).join('');

            logsContainer.scrollTop = logsContainer.scrollHeight;
        } catch (error) {
            console.error('Erro ao atualizar logs:', error);
            const logsContainer = document.getElementById('debug-logs');
            if (logsContainer) {
                logsContainer.innerHTML = '<p>Erro ao carregar logs</p>';
            }
        }
    },

    updateFilters() {
        if (!Logger) return;

        const stats = Logger.getStats();
        if (!stats) return;

        const moduleSelect = document.getElementById('debug-filter-module');
        const currentValue = moduleSelect.value;

        moduleSelect.innerHTML = '<option value="">Todos os módulos</option>';
        Object.keys(stats.byModule).forEach(module => {
            const option = document.createElement('option');
            option.value = module;
            option.textContent = `${module} (${stats.byModule[module]})`;
            if (module === currentValue) option.selected = true;
            moduleSelect.appendChild(option);
        });
    },

    getLevelColor(level) {
        const colors = {
            DEBUG: '#6b7280',
            INFO: '#059669',
            WARN: '#d97706',
            ERROR: '#dc2626'
        };
        return colors[level] || '#fff';
    },

    exportLogs() {
        if (Logger) {
            Logger.exportLogs();
        }
    },

    clearLogs() {
        if (Logger && confirm('Tem certeza que deseja limpar todos os logs?')) {
            Logger.clearLogs();
            this.updateAll();
        }
    }
};

// Disponibilizar globalmente
window.DebugPanel = DebugPanel;
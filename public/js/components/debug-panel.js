// Debug Panel para desenvolvimento
const DebugPanel = {
    isOpen: false,
    panelElement: null,

    init() {
        try {
            this.criarPainel();
            this.configurarAtalhos();
            Logger.debug('DebugPanel', 'Debug panel inicializado');
        } catch (error) {
            console.error('Erro ao inicializar DebugPanel:', error);
        }
    },

    criarPainel() {
        // Remover painel existente se houver
        const existing = document.getElementById('debug-panel');
        if (existing) {
            existing.remove();
        }

        this.panelElement = document.createElement('div');
        this.panelElement.id = 'debug-panel';
        this.panelElement.className = 'debug-panel';
        this.panelElement.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: #1f2937;
            color: #f9fafb;
            z-index: 10000;
            transition: right 0.3s ease;
            overflow-y: auto;
            box-shadow: -4px 0 8px rgba(0,0,0,0.3);
            font-family: 'Courier New', monospace;
            font-size: 12px;
        `;

        this.panelElement.innerHTML = `
            <div style="padding: 1rem; border-bottom: 1px solid #374151;">
                <h3 style="margin: 0; color: #60a5fa;">🔧 Debug Panel</h3>
                <small style="color: #9ca3af;">Ctrl+Shift+D para alternar</small>
            </div>
            <div id="debug-content" style="padding: 1rem;">
                <div id="debug-loading">Carregando...</div>
            </div>
        `;

        document.body.appendChild(this.panelElement);
    },

    configurarAtalhos() {
        document.addEventListener('keydown', (e) => {
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
        this.isOpen = true;
        this.panelElement.style.right = '0';
        this.updateAll();
        Logger.debug('DebugPanel', 'Painel de debug aberto');
    },

    close() {
        this.isOpen = false;
        this.panelElement.style.right = '-400px';
        Logger.debug('DebugPanel', 'Painel de debug fechado');
    },

    updateAll() {
        const content = document.getElementById('debug-content');
        if (!content) return;

        try {
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">📊 Estado da Aplicação</h4>
                    ${this.updateAppState()}
                </div>

                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">🔄 Módulos Carregados</h4>
                    ${this.updateModules()}
                </div>

                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">📝 Logs Recentes</h4>
                    ${this.updateLogs()}
                </div>

                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">🛠️ Ações</h4>
                    ${this.createActions()}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div style="color: #ef4444;">Erro ao atualizar debug panel: ${error.message}</div>`;
        }
    },

    updateAppState() {
        try {
            const state = window.AppState ? AppState.getDebugInfo() : {};
            return `
                <div style="background: #374151; padding: 0.75rem; border-radius: 4px; font-size: 11px;">
                    <div>Token: ${state.hasToken ? '✅' : '❌'}</div>
                    <div>Usuário: ${state.hasUsuario ? '✅' : '❌'}</div>
                    <div>AIH Atual: ${state.hasAIH ? '✅' : '❌'}</div>
                    <div>Tela Anterior: ${state.telaAnterior || 'Nenhuma'}</div>
                    <div>Glosas Pendentes: ${state.glosasPendentes || 0}</div>
                </div>
            `;
        } catch (error) {
            return `<div style="color: #ef4444;">Erro: ${error.message}</div>`;
        }
    },

    updateModules() {
        const modules = ['Logger', 'ApiService', 'Navigation', 'Dashboard', 'Movements'];
        return `
            <div style="background: #374151; padding: 0.75rem; border-radius: 4px; font-size: 11px;">
                ${modules.map(mod => {
                    const exists = window[mod] !== undefined;
                    return `<div>${mod}: ${exists ? '✅' : '❌'}</div>`;
                }).join('')}
            </div>
        `;
    },

    updateLogs() {
        try {
            if (!window.Logger || typeof Logger.getRecentLogs !== 'function') {
                return '<div style="color: #9ca3af;">Logger não disponível</div>';
            }

            const logs = Logger.getRecentLogs(10);
            return `
                <div style="background: #374151; padding: 0.75rem; border-radius: 4px; max-height: 200px; overflow-y: auto;">
                    ${logs.length ? logs.map(log => 
                        `<div style="font-size: 10px; margin-bottom: 2px; color: ${this.getLogColor(log.level)};">
                            [${log.timestamp}] ${log.level} [${log.module}] ${log.message}
                        </div>`
                    ).join('') : '<div style="color: #9ca3af;">Nenhum log disponível</div>'}
                </div>
            `;
        } catch (error) {
            return `<div style="color: #ef4444;">Erro ao carregar logs: ${error.message}</div>`;
        }
    },

    getLogColor(level) {
        const colors = {
            ERROR: '#ef4444',
            WARN: '#f59e0b',
            INFO: '#10b981',
            DEBUG: '#6b7280'
        };
        return colors[level] || '#9ca3af';
    },

    createActions() {
        return `
            <div style="display: grid; gap: 0.5rem;">
                <button onclick="DebugPanel.clearLogs()" style="background: #ef4444; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    🗑️ Limpar Logs
                </button>
                <button onclick="DebugPanel.reloadApp()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    🔄 Recarregar Aplicação
                </button>
                <button onclick="DebugPanel.exportDebugInfo()" style="background: #10b981; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    📋 Exportar Info Debug
                </button>
            </div>
        `;
    },

    clearLogs() {
        if (window.Logger && typeof Logger.clearLogs === 'function') {
            Logger.clearLogs();
            this.updateAll();
        }
    },

    exportDebugInfo() {
        try {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                appState: window.AppState ? AppState.getDebugInfo() : null,
                url: window.location.href,
                userAgent: navigator.userAgent,
                modules: ['Logger', 'ApiService', 'Navigation', 'Dashboard', 'Movements'].reduce((acc, mod) => {
                    acc[mod] = window[mod] !== undefined;
                    return acc;
                }, {}),
                logs: window.Logger && typeof Logger.getRecentLogs === 'function' ? Logger.getRecentLogs(50) : []
            };

            const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-info-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Erro ao exportar informações de debug: ' + error.message);
        }
    },

    reloadApp() {
        window.location.reload();
    }
};

// Disponibilizar globalmente
window.DebugPanel = DebugPanel;
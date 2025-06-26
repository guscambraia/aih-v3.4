
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
            const sections = [
                this.criarSecaoEstado(),
                this.criarSecaoModulos(),
                this.criarSecaoLogs(),
                this.criarSecaoAPI(),
                this.criarSecaoAcoes()
            ];

            content.innerHTML = sections.join('');
        } catch (error) {
            content.innerHTML = `<div style="color: #ef4444;">Erro ao atualizar debug panel: ${error.message}</div>`;
        }
    },

    criarSecaoEstado() {
        let estadoInfo = 'Estado não disponível';
        
        try {
            if (window.AppState) {
                const estado = {
                    token: AppState.token ? 'Presente' : 'Ausente',
                    usuario: AppState.usuario ? AppState.usuario.nome : 'Não logado',
                    aihAtual: AppState.aihAtual ? AppState.aihAtual.numero_aih : 'Nenhuma',
                    telaAnterior: AppState.telaAnterior || 'Nenhuma'
                };
                estadoInfo = Object.entries(estado)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('<br>');
            }
        } catch (error) {
            estadoInfo = `Erro: ${error.message}`;
        }

        return `
            <div class="debug-section">
                <h4 style="color: #fbbf24; margin-bottom: 0.5rem;">📊 Estado da Aplicação</h4>
                <div style="background: #374151; padding: 0.5rem; border-radius: 4px; font-size: 11px;">
                    ${estadoInfo}
                </div>
            </div>
        `;
    },

    criarSecaoModulos() {
        const modulos = [
            'Logger', 'AppState', 'Navigation', 'ApiService', 'Modal',
            'Dashboard', 'Movements', 'AIHManagement', 'Glosas', 'Search', 'Reports'
        ];

        const statusModulos = modulos.map(nome => {
            const status = window[nome] ? 
                (typeof window[nome].init === 'function' ? '✅' : '⚠️') : 
                '❌';
            return `${status} ${nome}`;
        }).join('<br>');

        return `
            <div class="debug-section">
                <h4 style="color: #34d399; margin-bottom: 0.5rem;">🧩 Módulos</h4>
                <div style="background: #374151; padding: 0.5rem; border-radius: 4px; font-size: 11px;">
                    ${statusModulos}
                </div>
            </div>
        `;
    },

    criarSecaoLogs() {
        let logsInfo = 'Logs não disponíveis';
        
        try {
            if (window.Logger && typeof Logger.getLogs === 'function') {
                const logs = Logger.getLogs();
                const ultimosLogs = logs.slice(0, 5);
                
                if (ultimosLogs.length > 0) {
                    logsInfo = ultimosLogs.map(log => 
                        `[${log.timestamp}] ${log.level} ${log.category}: ${log.message}`
                    ).join('<br>');
                } else {
                    logsInfo = 'Nenhum log disponível';
                }
            }
        } catch (error) {
            logsInfo = `Erro ao obter logs: ${error.message}`;
        }

        return `
            <div class="debug-section">
                <h4 style="color: #a78bfa; margin-bottom: 0.5rem;">📝 Últimos Logs</h4>
                <div style="background: #374151; padding: 0.5rem; border-radius: 4px; font-size: 10px; max-height: 150px; overflow-y: auto;">
                    ${logsInfo}
                </div>
            </div>
        `;
    },

    criarSecaoAPI() {
        const telaAtual = document.querySelector('.tela.ativa')?.id || 'Nenhuma';
        const token = localStorage.getItem('token') ? 'Presente' : 'Ausente';
        
        return `
            <div class="debug-section">
                <h4 style="color: #fb7185; margin-bottom: 0.5rem;">🌐 API & Navegação</h4>
                <div style="background: #374151; padding: 0.5rem; border-radius: 4px; font-size: 11px;">
                    Tela Atual: ${telaAtual}<br>
                    Token: ${token}<br>
                    URL: ${window.location.pathname}
                </div>
            </div>
        `;
    },

    criarSecaoAcoes() {
        return `
            <div class="debug-section">
                <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">⚡ Ações Rápidas</h4>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <button onclick="DebugPanel.limparLogs()" style="background: #dc2626; color: white; border: none; padding: 0.25rem; border-radius: 3px; cursor: pointer; font-size: 10px;">
                        Limpar Logs
                    </button>
                    <button onclick="DebugPanel.exportarLogs()" style="background: #059669; color: white; border: none; padding: 0.25rem; border-radius: 3px; cursor: pointer; font-size: 10px;">
                        Exportar Logs
                    </button>
                    <button onclick="DebugPanel.recarregarPagina()" style="background: #0d9488; color: white; border: none; padding: 0.25rem; border-radius: 3px; cursor: pointer; font-size: 10px;">
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
    },

    limparLogs() {
        if (window.Logger && typeof Logger.clearLogs === 'function') {
            Logger.clearLogs();
            this.updateAll();
        }
    },

    exportarLogs() {
        if (window.Logger && typeof Logger.exportLogs === 'function') {
            Logger.exportLogs();
        }
    },

    recarregarPagina() {
        window.location.reload();
    }
};

// Disponibilizar globalmente
window.DebugPanel = DebugPanel;

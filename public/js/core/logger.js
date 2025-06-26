
// Sistema de Logs para Debug e Monitoramento
const Logger = {
    // Configurações
    config: {
        enableConsole: true,
        enableStorage: true,
        maxStoredLogs: 1000,
        logLevel: 'DEBUG' // DEBUG, INFO, WARN, ERROR
    },

    // Níveis de log
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    // Inicializar logger
    init() {
        this.setupGlobalErrorHandlers();
        this.log('INFO', 'Logger', 'Sistema de logs inicializado');
    },

    // Log principal
    log(level, module, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            module,
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        // Verificar se deve logar baseado no nível
        if (this.levels[level] >= this.levels[this.config.logLevel]) {
            // Console
            if (this.config.enableConsole) {
                this.logToConsole(logEntry);
            }

            // Storage local
            if (this.config.enableStorage) {
                this.logToStorage(logEntry);
            }
        }
    },

    // Log para console com cores
    logToConsole(entry) {
        const colors = {
            DEBUG: 'color: #6b7280',
            INFO: 'color: #059669',
            WARN: 'color: #d97706',
            ERROR: 'color: #dc2626; font-weight: bold'
        };

        const style = colors[entry.level] || '';
        const prefix = `[${entry.timestamp.split('T')[1].split('.')[0]}] ${entry.level} [${entry.module}]`;
        
        if (entry.data) {
            console.log(`%c${prefix} ${entry.message}`, style, entry.data);
        } else {
            console.log(`%c${prefix} ${entry.message}`, style);
        }
    },

    // Log para localStorage
    logToStorage(entry) {
        try {
            let logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push(entry);

            // Manter apenas os últimos N logs
            if (logs.length > this.config.maxStoredLogs) {
                logs = logs.slice(-this.config.maxStoredLogs);
            }

            localStorage.setItem('app_logs', JSON.stringify(logs));
        } catch (err) {
            console.error('Erro ao salvar log no storage:', err);
        }
    },

    // Configurar handlers globais de erro
    setupGlobalErrorHandlers() {
        // Erros JavaScript não capturados
        window.addEventListener('error', (event) => {
            this.log('ERROR', 'Global', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Promises rejeitadas não capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.log('ERROR', 'Global', 'Unhandled Promise Rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });

        // Interceptar chamadas de API para log
        this.interceptFetch();
    },

    // Interceptar fetch para logar requisições
    interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            const startTime = Date.now();

            this.log('DEBUG', 'API', `Requisição iniciada: ${options.method || 'GET'} ${url}`);

            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - startTime;

                if (response.ok) {
                    this.log('DEBUG', 'API', `Requisição bem-sucedida: ${response.status} ${url} (${duration}ms)`);
                } else {
                    this.log('WARN', 'API', `Requisição com erro: ${response.status} ${url} (${duration}ms)`);
                }

                return response;
            } catch (error) {
                const duration = Date.now() - startTime;
                this.log('ERROR', 'API', `Requisição falhou: ${url} (${duration}ms)`, error);
                throw error;
            }
        };
    },

    // Métodos de conveniência
    debug(module, message, data) {
        this.log('DEBUG', module, message, data);
    },

    info(module, message, data) {
        this.log('INFO', module, message, data);
    },

    warn(module, message, data) {
        this.log('WARN', module, message, data);
    },

    error(module, message, data) {
        this.log('ERROR', module, message, data);
    },

    // Log específico para navegação
    navigation(action, from, to, data = null) {
        this.log('INFO', 'Navigation', `${action}: ${from} → ${to}`, data);
    },

    // Log específico para módulos
    moduleLoad(moduleName, success = true, error = null) {
        if (success) {
            this.log('INFO', 'Module', `Módulo carregado: ${moduleName}`);
        } else {
            this.log('ERROR', 'Module', `Falha ao carregar módulo: ${moduleName}`, error);
        }
    },

    // Exportar logs
    exportLogs() {
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `app_logs_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.log('INFO', 'Logger', 'Logs exportados com sucesso');
        } catch (err) {
            this.log('ERROR', 'Logger', 'Erro ao exportar logs', err);
        }
    },

    // Limpar logs
    clearLogs() {
        localStorage.removeItem('app_logs');
        this.log('INFO', 'Logger', 'Logs limpos');
    },

    // Obter estatísticas dos logs
    getStats() {
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            const stats = {
                total: logs.length,
                byLevel: {},
                byModule: {},
                recent: logs.slice(-10)
            };

            logs.forEach(log => {
                stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
                stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
            });

            return stats;
        } catch (err) {
            this.log('ERROR', 'Logger', 'Erro ao obter estatísticas', err);
            return null;
        }
    },

    // Filtrar logs
    filterLogs(filters = {}) {
        try {
            let logs = JSON.parse(localStorage.getItem('app_logs') || '[]');

            if (filters.level) {
                logs = logs.filter(log => log.level === filters.level);
            }

            if (filters.module) {
                logs = logs.filter(log => log.module === filters.module);
            }

            if (filters.since) {
                const since = new Date(filters.since);
                logs = logs.filter(log => new Date(log.timestamp) >= since);
            }

            if (filters.search) {
                logs = logs.filter(log => 
                    log.message.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            return logs;
        } catch (err) {
            this.log('ERROR', 'Logger', 'Erro ao filtrar logs', err);
            return [];
        }
    }
};

// Disponibilizar globalmente
window.Logger = Logger;

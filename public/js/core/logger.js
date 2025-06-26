// Sistema de logging centralizado e robusto
const Logger = {
    logs: [],
    maxLogs: 1000,
    isInitialized: false,

    // Inicializar o logger
    init() {
        try {
            this.isInitialized = true;
            this.setupGlobalErrorHandling();
            this.info('Logger', '📝 Sistema de logging inicializado');
            console.log('📝 Logger inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar Logger:', error);
        }
    },

    // Configurar captura global de erros
    setupGlobalErrorHandling() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            this.error('Global', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : 'N/A'
            });
        });

        // Capturar promises rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Global', 'Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    },

    // Adicionar log à lista
    addLog(level, category, message, data = null) {
        if (!this.isInitialized) {
            console.warn('Logger não inicializado, usando console.log');
            console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data);
            return;
        }

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp,
            level: level.toUpperCase(),
            category,
            message,
            data: data ? JSON.stringify(data, null, 2) : null,
            fullTimestamp: new Date().toISOString()
        };

        this.logs.unshift(logEntry);

        // Limitar número de logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Log no console com cores
        this.logToConsole(level, category, message, data, timestamp);
    },

    // Log colorido no console
    logToConsole(level, category, message, data, timestamp) {
        const colors = {
            debug: '#6b7280',
            info: '#059669', 
            warn: '#d97706',
            error: '#dc2626; font-weight: bold'
        };

        const color = colors[level] || '#374151';
        const prefix = `%c[${timestamp}] ${level.toUpperCase()} [${category}] ${message}`;

        if (data) {
            console.log(prefix, `color: ${color}`, data);
        } else {
            console.log(prefix, `color: ${color}`);
        }
    },

    // Métodos de logging
    debug(category, message, data = null) {
        this.addLog('debug', category, message, data);
    },

    info(category, message, data = null) {
        this.addLog('info', category, message, data);
    },

    warn(category, message, data = null) {
        this.addLog('warn', category, message, data);
    },

    error(category, message, data = null) {
        this.addLog('error', category, message, data);
    },

    // Logs específicos do sistema
    moduleLoad(moduleName, success, error = null) {
        if (success) {
            this.info('Module', `✅ ${moduleName} carregado com sucesso`);
        } else {
            this.error('Module', `❌ Falha ao carregar ${moduleName}`, error);
        }
    },

    navigation(action, from, to) {
        this.info('Navigation', `${action}: ${from} → ${to}`);
    },

    apiCall(method, endpoint, duration, success = true) {
        const message = `${method} ${endpoint} (${duration}ms)`;
        if (success) {
            this.debug('API', `Requisição bem-sucedida: ${message}`);
        } else {
            this.warn('API', `Requisição falhou: ${message}`);
        }
    },

    // Obter logs (MÉTODO NECESSÁRIO PARA DEBUG PANEL)
    getLogs() {
        return [...this.logs];
    },

    // Filtrar logs
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level.toUpperCase());
    },

    getLogsByCategory(category) {
        return this.logs.filter(log => log.category === category);
    },

    // Limpar logs
    clearLogs() {
        this.logs = [];
        this.info('Logger', 'Logs limpos');
    },

    // Exportar logs
    exportLogs() {
        const logsText = this.logs.map(log => {
            let line = `[${log.timestamp}] ${log.level} [${log.category}] ${log.message}`;
            if (log.data) {
                line += `\nDados: ${log.data}`;
            }
            return line;
        }).join('\n\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Estatísticas dos logs
    getStats() {
        const levels = {};
        const categories = {};

        this.logs.forEach(log => {
            levels[log.level] = (levels[log.level] || 0) + 1;
            categories[log.category] = (categories[log.category] || 0) + 1;
        });

        return {
            total: this.logs.length,
            levels,
            categories,
            oldestLog: this.logs[this.logs.length - 1]?.timestamp,
            newestLog: this.logs[0]?.timestamp
        };
    }
};

// Disponibilizar globalmente
window.Logger = Logger;
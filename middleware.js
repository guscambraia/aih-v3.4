const rateLimit = {};
const securityLogs = [];

// Rate limiting
const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // máximo de requisições por janela

    if (!rateLimit[ip]) {
        rateLimit[ip] = { count: 1, firstRequest: now };
    } else {
        if (now - rateLimit[ip].firstRequest > windowMs) {
            rateLimit[ip] = { count: 1, firstRequest: now };
        } else {
            rateLimit[ip].count++;
        }
    }

    if (rateLimit[ip].count > maxRequests) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', `${rateLimit[ip].count} requests`, ip);
        return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 15 minutos.' });
    }

    next();
};

// Validação de entrada
const validateInput = (req, res, next) => {
    // Validar tamanho do corpo da requisição
    if (req.body && JSON.stringify(req.body).length > 1024 * 1024) { // 1MB
        return res.status(413).json({ error: 'Payload muito grande' });
    }

    // Sanitizar strings
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Remove caracteres perigosos
                req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                req.body[key] = req.body[key].replace(/javascript:/gi, '');
                req.body[key] = req.body[key].replace(/on\w+\s*=/gi, '');
            }
        }
    }

    next();
};

// Limpar rate limit para um IP específico
const clearRateLimit = (ip) => {
    delete rateLimit[ip];
};

// Log de eventos de segurança
const logSecurityEvent = (type, details, ip) => {
    const event = {
        timestamp: new Date().toISOString(),
        type,
        details,
        ip,
        userAgent: ''
    };

    securityLogs.push(event);

    // Manter apenas os últimos 1000 logs
    if (securityLogs.length > 1000) {
        securityLogs.shift();
    }

    console.log(`🔒 Evento de segurança: ${type} - ${details} - IP: ${ip}`);
};

// Monitoramento de comportamento suspeito
const suspiciousActivityTracker = {};

const detectSuspiciousActivity = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();
    const minute = Math.floor(now / 60000);

    if (!suspiciousActivityTracker[ip]) {
        suspiciousActivityTracker[ip] = { requests: [], errors: 0, lastReset: minute };
    }

    const tracker = suspiciousActivityTracker[ip];

    // Reset a cada minuto
    if (minute > tracker.lastReset) {
        tracker.requests = [];
        tracker.errors = 0;
        tracker.lastReset = minute;
    }

    tracker.requests.push(now);

    // Remover requisições antigas (últimos 60 segundos)
    tracker.requests = tracker.requests.filter(time => now - time < 60000);

    // Detectar padrões suspeitos
    if (tracker.requests.length > 100) { // Mais de 100 req/min
        logSecurityEvent('MUITAS_REQUISICOES', `${tracker.requests.length} req/min`, ip);
    }

    // Verificar User-Agent suspeito
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousUA = [
        'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp', 'curl', 'wget'
    ];

    if (suspiciousUA.some(ua => userAgent.toLowerCase().includes(ua))) {
        logSecurityEvent('USER_AGENT_SUSPEITO', userAgent, ip);
    }

    // Monitorar endpoints sensíveis
    const sensitiveEndpoints = ['/api/admin/', '/api/backup', '/api/export'];
    if (sensitiveEndpoints.some(endpoint => req.path.includes(endpoint))) {
        logSecurityEvent('ACESSO_ENDPOINT_SENSIVEL', req.path, ip);
    }

    next();
};

// Obter logs de segurança
const getSecurityLogs = () => {
    return securityLogs.slice(-100); // Últimos 100 logs
};

module.exports = {
    rateLimitMiddleware,
    validateInput,
    clearRateLimit,
    detectSuspiciousActivity,
    getSecurityLogs,
    logSecurityEvent
};
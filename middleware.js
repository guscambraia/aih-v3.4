
const rateLimit = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 500; // requests por janela (aumentado para desenvolvimento)

// Rate limiting simples
const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();
    
    // Exempletar IPs locais e de desenvolvimento
    const exemptIPs = ['127.0.0.1', '::1', 'localhost'];
    const isLocal = exemptIPs.some(exemptIP => ip.includes(exemptIP)) || 
                   ip.startsWith('192.168.') || 
                   ip.startsWith('10.');
    
    if (isLocal && process.env.NODE_ENV !== 'production') {
        return next();
    }
    
    if (!rateLimit[ip]) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return next();
    }
    
    if (now > rateLimit[ip].resetTime) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return next();
    }
    
    if (rateLimit[ip].count >= MAX_REQUESTS) {
        console.log(`Rate limit excedido para IP: ${ip} (${rateLimit[ip].count}/${MAX_REQUESTS})`);
        return res.status(429).json({ 
            error: 'Muitas requisições. Tente novamente em alguns minutos.',
            resetTime: Math.ceil((rateLimit[ip].resetTime - now) / 1000 / 60) // minutos restantes
        });
    }
    
    rateLimit[ip].count++;
    next();
};

// Validação de entrada
const validateInput = (req, res, next) => {
    // Sanitizar strings
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>]/g, ''); // Remover tags básicas
    };
    
    // Sanitizar recursivamente
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'string' ? sanitizeString(obj) : obj;
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    };
    
    req.body = sanitizeObject(req.body);
    next();
};

// Função para limpar rate limit (útil para desenvolvimento)
const clearRateLimit = (ip = null) => {
    if (ip) {
        delete rateLimit[ip];
        console.log(`Rate limit limpo para IP: ${ip}`);
    } else {
        Object.keys(rateLimit).forEach(key => delete rateLimit[key]);
        console.log('Rate limit limpo para todos os IPs');
    }
};

// Limpeza periódica do rate limit
setInterval(() => {
    const now = Date.now();
    for (const ip in rateLimit) {
        if (now > rateLimit[ip].resetTime) {
            delete rateLimit[ip];
        }
    }
}, RATE_LIMIT_WINDOW);

module.exports = { rateLimitMiddleware, validateInput, clearRateLimit };

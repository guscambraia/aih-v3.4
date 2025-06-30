const express = require('express');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');
const { initDB, run, get, all, runTransaction, validateAIH, validateMovimentacao, clearCache, getDbStats, createBackup } = require('./database');
const { verificarToken, login, cadastrarUsuario, loginAdmin, alterarSenhaAdmin, listarUsuarios, excluirUsuario } = require('./auth');
const { rateLimitMiddleware, validateInput, clearRateLimit, detectSuspiciousActivity, getSecurityLogs } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de segurança e otimização
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limitar tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicar rate limiting globalmente
app.use(rateLimitMiddleware);

// Detectar atividade suspeita
app.use(detectSuspiciousActivity);

// Validação de entrada
app.use('/api', validateInput);

// Headers de segurança
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

app.use(express.static('public'));

// Log de requisições para debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Inicializar banco
initDB();

// Inicializar sistema de manutenção
const { scheduleMaintenance } = require('./cleanup');
scheduleMaintenance();

// Inicializar monitoramento
const { logPerformance } = require('./monitor');
setTimeout(logPerformance, 30000); // Log inicial após 30s

// Backup automático diário
const scheduleBackups = () => {
    const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

    const performBackup = async () => {
        try {
            console.log('🔄 Iniciando backup automático...');
            const backupPath = await createBackup();
            console.log(`✅ Backup automático concluído: ${backupPath}`);
        } catch (err) {
            console.error('❌ Erro no backup automático:', err);
        }
    };

    // Primeiro backup após 1 hora
    setTimeout(performBackup, 60 * 60 * 1000);

    // Backups subsequentes a cada 24 horas
    setInterval(performBackup, BACKUP_INTERVAL);

    console.log('📅 Backup automático agendado (diário)');
};

scheduleBackups();

// Middleware para logs
const logAcao = async (usuarioId, acao) => {
    await run('INSERT INTO logs_acesso (usuario_id, acao) VALUES (?, ?)', [usuarioId, acao]);
};

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
    try {
        console.log('Tentativa de login:', req.body?.nome);
        const { nome, senha } = req.body;

        if (!nome || !senha) {
            return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
        }

        const result = await login(nome, senha);
        await logAcao(result.usuario.id, 'Login');
        console.log('Login bem-sucedido:', result.usuario.nome);
        res.json(result);
    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(401).json({ error: err.message });
    }
});

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
    try {
        console.log('Tentativa de login admin:', req.body?.usuario);
        const { usuario, senha } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        const result = await loginAdmin(usuario, senha);
        console.log('Login admin bem-sucedido:', result.admin.usuario);
        res.json(result);
    } catch (err) {
        console.error('Erro no login admin:', err.message);
        res.status(401).json({ error: err.message });
    }
});

// Listar usuários (apenas admin)
app.get('/api/admin/usuarios', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const usuarios = await listarUsuarios();
        res.json({ usuarios });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cadastrar usuário (apenas admin)
app.post('/api/admin/usuarios', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { nome, matricula, senha } = req.body;
        const usuario = await cadastrarUsuario(nome, matricula, senha);
        res.json({ success: true, usuario });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Excluir usuário (apenas admin)
app.delete('/api/admin/usuarios/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        await excluirUsuario(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Alterar senha do administrador
app.post('/api/admin/alterar-senha', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { novaSenha } = req.body;
        await alterarSenhaAdmin(novaSenha);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Dashboard aprimorado com filtro por competência
app.get('/api/dashboard', verificarToken, async (req, res) => {
    try {
        // Pegar competência da query ou usar atual
        const competencia = req.query.competencia || getCompetenciaAtual();

        // 1. AIH em processamento na competência
        // (entrada_sus - saida_hospital) na competência específica
        const entradasSUS = await get(`
            SELECT COUNT(DISTINCT m.aih_id) as count 
            FROM movimentacoes m
            WHERE m.tipo = 'entrada_sus' 
            AND m.competencia = ?
        `, [competencia]);

        const saidasHospital = await get(`
            SELECT COUNT(DISTINCT m.aih_id) as count 
            FROM movimentacoes m
            WHERE m.tipo = 'saida_hospital' 
            AND m.competencia = ?
        `, [competencia]);

        const emProcessamentoCompetencia = (entradasSUS.count || 0) - (saidasHospital.count || 0);

        // 2. AIH finalizadas na competência (status 1 e 4)
        const finalizadasCompetencia = await get(`
            SELECT COUNT(*) as count 
            FROM aihs 
            WHERE status IN (1, 4) 
            AND competencia = ?
        `, [competencia]);

        // 3. AIH com pendências/glosas na competência (status 2 e 3)
        const comPendenciasCompetencia = await get(`
            SELECT COUNT(*) as count 
            FROM aihs 
            WHERE status IN (2, 3) 
            AND competencia = ?
        `, [competencia]);

        // 4. Total geral de entradas SUS vs saídas Hospital (desde o início)
        const totalEntradasSUS = await get(`
            SELECT COUNT(DISTINCT aih_id) as count 
            FROM movimentacoes 
            WHERE tipo = 'entrada_sus'
        `);

        const totalSaidasHospital = await get(`
            SELECT COUNT(DISTINCT aih_id) as count 
            FROM movimentacoes 
            WHERE tipo = 'saida_hospital'
        `);

        const totalEmProcessamento = (totalEntradasSUS.count || 0) - (totalSaidasHospital.count || 0);

        // 5. Total de AIHs finalizadas desde o início (status 1 e 4)
        const totalFinalizadasGeral = await get(`
            SELECT COUNT(*) as count 
            FROM aihs 
            WHERE status IN (1, 4)
        `);

        // 6. Total de AIHs cadastradas desde o início
        const totalAIHsGeral = await get(`
            SELECT COUNT(*) as count 
            FROM aihs
        `);

        // Dados adicionais para contexto
        const totalAIHsCompetencia = await get(`
            SELECT COUNT(*) as count 
            FROM aihs 
            WHERE competencia = ?
        `, [competencia]);

        // Lista de competências disponíveis
        const competenciasDisponiveis = await all(`
            SELECT DISTINCT competencia 
            FROM aihs 
            ORDER BY 
                CAST(SUBSTR(competencia, 4, 4) AS INTEGER) DESC,
                CAST(SUBSTR(competencia, 1, 2) AS INTEGER) DESC
        `);

        // Estatísticas de valores para a competência
        const valoresGlosasPeriodo = await get(`
            SELECT 
                SUM(valor_inicial) as valor_inicial_total,
                SUM(valor_atual) as valor_atual_total,
                AVG(valor_inicial - valor_atual) as media_glosa
            FROM aihs 
            WHERE competencia = ?
        `, [competencia]);

        res.json({
            competencia_selecionada: competencia,
            competencias_disponiveis: competenciasDisponiveis.map(c => c.competencia),

            // Métricas da competência
            em_processamento_competencia: emProcessamentoCompetencia,
            finalizadas_competencia: finalizadasCompetencia.count,
            com_pendencias_competencia: comPendenciasCompetencia.count,
            total_aihs_competencia: totalAIHsCompetencia.count,

            // Métricas gerais (desde o início)
            total_entradas_sus: totalEntradasSUS.count,
            total_saidas_hospital: totalSaidasHospital.count,
            total_em_processamento_geral: totalEmProcessamento,
            total_finalizadas_geral: totalFinalizadasGeral.count,
            total_aihs_geral: totalAIHsGeral.count,

            // Valores financeiros da competência
            valores_competencia: {
                inicial: valoresGlosasPeriodo.valor_inicial_total || 0,
                atual: valoresGlosasPeriodo.valor_atual_total || 0,
                media_glosa: valoresGlosasPeriodo.media_glosa || 0
            }
        });
    } catch (err) {
        console.error('Erro no dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Helper para obter competência atual
const getCompetenciaAtual = () => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
};

// Buscar AIH
app.get('/api/aih/:numero', verificarToken, async (req, res) => {
    try {
        const aih = await get(
            'SELECT * FROM aihs WHERE numero_aih = ?',
            [req.params.numero]
        );

        if (!aih) {
            return res.status(404).json({ error: 'AIH não encontrada' });
        }

        const atendimentos = await all(
            'SELECT numero_atendimento FROM atendimentos WHERE aih_id = ?',
            [aih.id]
        );

        const movimentacoes = await all(
            'SELECT * FROM movimentacoes WHERE aih_id = ? ORDER BY data_movimentacao DESC',
            [aih.id]
        );

        const glosas = await all(
            'SELECT * FROM glosas WHERE aih_id = ? AND ativa = 1',
            [aih.id]
        );

        res.json({
            ...aih,
            atendimentos: atendimentos.map(a => a.numero_atendimento),
            movimentacoes,
            glosas
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cadastrar AIH com transação robusta
app.post('/api/aih', verificarToken, async (req, res) => {
    try {
        const dadosAIH = { ...req.body };

        console.log('📝 Dados recebidos no servidor:', { 
            numero_aih: dadosAIH.numero_aih, 
            valor_inicial: dadosAIH.valor_inicial, 
            competencia: dadosAIH.competencia, 
            atendimentos: dadosAIH.atendimentos, 
            tipo_atendimentos: typeof dadosAIH.atendimentos,
            eh_array: Array.isArray(dadosAIH.atendimentos)
        });

        // Validações rigorosas usando função específica
        const validationErrors = validateAIH(dadosAIH);
        if (validationErrors.length > 0) {
            console.log('❌ Erros de validação:', validationErrors);
            return res.status(400).json({ error: validationErrors.join(', ') });
        }

        const { numero_aih, valor_inicial, competencia, atendimentos } = dadosAIH;

        // Processar atendimentos - aceitar array, string ou objeto
        let atendimentosProcessados = [];

        if (typeof atendimentos === 'string') {
            atendimentosProcessados = atendimentos.split(/[,\n\r]/)
                .map(a => a.trim())
                .filter(a => a && a.length > 0 && a.length <= 50); // Limitar tamanho
        } else if (Array.isArray(atendimentos)) {
            atendimentosProcessados = atendimentos
                .map(a => String(a).trim())
                .filter(a => a && a.length > 0 && a.length <= 50);
        } else if (typeof atendimentos === 'object' && atendimentos !== null) {
            atendimentosProcessados = Object.values(atendimentos)
                .map(a => String(a).trim())
                .filter(a => a && a.length > 0 && a.length <= 50);
        }

        console.log('🔄 Atendimentos processados:', atendimentosProcessados);

        if (atendimentosProcessados.length === 0) {
            console.log('❌ Nenhum atendimento válido encontrado');
            return res.status(400).json({ error: 'Pelo menos um número de atendimento válido deve ser informado' });
        }

        if (atendimentosProcessados.length > 100) {
            return res.status(400).json({ error: 'Muitos atendimentos informados (máximo 100)' });
        }

        // Verificar se já existe (com cache para performance)
        const existe = await get('SELECT id FROM aihs WHERE numero_aih = ?', [numero_aih], true);
        if (existe) {
            console.log('❌ AIH já existe');
            return res.status(400).json({ error: 'AIH já cadastrada' });
        }

        // Usar transação para garantir consistência
        const operations = [
            {
                sql: `INSERT INTO aihs (numero_aih, valor_inicial, valor_atual, competencia, usuario_cadastro_id, status) 
                      VALUES (?, ?, ?, ?, ?, 3)`,
                params: [numero_aih, parseFloat(valor_inicial), parseFloat(valor_inicial), competencia, req.usuario.id]
            }
        ];

        const results = await runTransaction(operations);
        const aihId = results[0].id;

        // Inserir atendimentos em lote (mais eficiente)
        const atendimentosOperations = atendimentosProcessados.map(atend => ({
            sql: 'INSERT INTO atendimentos (aih_id, numero_atendimento) VALUES (?, ?)',
            params: [aihId, atend.trim()]
        }));

        if (atendimentosOperations.length > 0) {
            await runTransaction(atendimentosOperations);
        }

        // Primeira movimentação (entrada SUS) - OBRIGATÓRIA
        await run(
            `INSERT INTO movimentacoes (aih_id, tipo, usuario_id, valor_conta, competencia, status_aih, observacoes, data_movimentacao) 
             VALUES (?, 'entrada_sus', ?, ?, ?, 3, ?, CURRENT_TIMESTAMP)`,
            [aihId, req.usuario.id, parseFloat(valor_inicial), competencia, 'Entrada inicial da AIH na Auditoria SUS']
        );

        // Log de auditoria
        await logAcao(req.usuario.id, `Cadastrou AIH ${numero_aih}`);

        // Limpar cache relacionado
        clearCache('aihs');
        clearCache('dashboard');

        console.log(`✅ AIH ${numero_aih} cadastrada com sucesso - ID: ${aihId} - Atendimentos: ${atendimentosProcessados.length}`);

        res.json({ 
            success: true, 
            id: aihId, 
            numero_aih, 
            atendimentos_inseridos: atendimentosProcessados.length,
            valor_inicial: parseFloat(valor_inicial),
            competencia 
        });

    } catch (err) {
        console.error('❌ Erro ao cadastrar AIH:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao cadastrar AIH' });
    }
});

// Obter próxima movimentação possível
app.get('/api/aih/:id/proxima-movimentacao', verificarToken, async (req, res) => {
    try {
        const aihId = req.params.id;

        // Buscar última movimentação
        const ultimaMovimentacao = await get(
            'SELECT tipo FROM movimentacoes WHERE aih_id = ? ORDER BY data_movimentacao DESC LIMIT 1',
            [aihId]
        );

        let proximoTipo, proximaDescricao, explicacao;

        if (!ultimaMovimentacao) {
            // Primeira movimentação sempre é entrada SUS
            proximoTipo = 'entrada_sus';
            proximaDescricao = 'Entrada na Auditoria SUS';
            explicacao = 'Esta é a primeira movimentação da AIH. Deve ser registrada como entrada na Auditoria SUS.';
        } else if (ultimaMovimentacao.tipo === 'entrada_sus') {
            // Se última foi entrada SUS, próxima deve ser saída hospital
            proximoTipo = 'saida_hospital';
            proximaDescricao = 'Saída para Auditoria Hospital';
            explicacao = 'A última movimentação foi entrada na Auditoria SUS. A próxima deve ser saída para Auditoria Hospital.';
        } else {
            // Se última foi saída hospital, próxima deve ser entrada SUS
            proximoTipo = 'entrada_sus';
            proximaDescricao = 'Entrada na Auditoria SUS';
            explicacao = 'A última movimentação foi saída para Hospital. A próxima deve ser entrada na Auditoria SUS.';
        }

        res.json({
            proximo_tipo: proximoTipo,
            descricao: proximaDescricao,
            explicacao: explicacao,
            ultima_movimentacao: ultimaMovimentacao?.tipo || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buscar última movimentação com profissionais para pré-seleção
app.get('/api/aih/:id/ultima-movimentacao', verificarToken, async (req, res) => {
    try {
        const aihId = req.params.id;

        // Buscar última movimentação com todos os dados dos profissionais
        const ultimaMovimentacao = await get(
            `SELECT * FROM movimentacoes 
             WHERE aih_id = ? AND 
                   (prof_medicina IS NOT NULL OR prof_enfermagem IS NOT NULL OR 
                    prof_fisioterapia IS NOT NULL OR prof_bucomaxilo IS NOT NULL)
             ORDER BY data_movimentacao DESC LIMIT 1`,
            [aihId]
        );

        if (!ultimaMovimentacao) {
            return res.json({ 
                success: true, 
                movimentacao: null, 
                message: 'Nenhuma movimentação anterior com profissionais encontrada' 
            });
        }

        res.json({
            success: true,
            movimentacao: {
                prof_medicina: ultimaMovimentacao.prof_medicina,
                prof_enfermagem: ultimaMovimentacao.prof_enfermagem,
                prof_fisioterapia: ultimaMovimentacao.prof_fisioterapia,
                prof_bucomaxilo: ultimaMovimentacao.prof_bucomaxilo,
                data_movimentacao: ultimaMovimentacao.data_movimentacao,
                tipo: ultimaMovimentacao.tipo
            }
        });
    } catch (err) {
        console.error('Erro ao buscar última movimentação:', err);
        res.status(500).json({ error: err.message });
    }
});

// Nova movimentação
app.post('/api/aih/:id/movimentacao', verificarToken, async (req, res) => {
    try {
        const aihId = req.params.id;
        const {
            tipo, status_aih, valor_conta, competencia,
            prof_medicina, prof_enfermagem, prof_fisioterapia, prof_bucomaxilo, observacoes
        } = req.body;

        // Validação de profissionais obrigatórios
        const errosValidacao = [];

        // Enfermagem é SEMPRE obrigatória
        if (!prof_enfermagem || prof_enfermagem.trim() === '') {
            errosValidacao.push('Profissional de Enfermagem é obrigatório');
        }

        // Pelo menos um entre Medicina ou Bucomaxilo deve ser preenchido
        const temMedicina = prof_medicina && prof_medicina.trim() !== '';
        const temBucomaxilo = prof_bucomaxilo && prof_bucomaxilo.trim() !== '';

        if (!temMedicina && !temBucomaxilo) {
            errosValidacao.push('É necessário informar pelo menos um profissional de Medicina ou Cirurgião Bucomaxilo');
        }

        if (errosValidacao.length > 0) {
            return res.status(400).json({ 
                error: `Profissionais obrigatórios não informados: ${errosValidacao.join('; ')}` 
            });
        }

        // Validar se o tipo está correto conforme a sequência
        const ultimaMovimentacao = await get(
            'SELECT tipo FROM movimentacoes WHERE aih_id = ? ORDER BY data_movimentacao DESC LIMIT 1',
            [aihId]
        );

        let tipoPermitido;
        if (!ultimaMovimentacao) {
            tipoPermitido = 'entrada_sus';
        } else if (ultimaMovimentacao.tipo === 'entrada_sus') {
            tipoPermitido = 'saida_hospital';
        } else {
            tipoPermitido = 'entrada_sus';
        }

        if (tipo !== tipoPermitido) {
            return res.status(400).json({ 
                error: `Tipo de movimentação inválido. Esperado: ${tipoPermitido}, recebido: ${tipo}` 
            });
        }

        // Inserir movimentação
        await run(
            `INSERT INTO movimentacoes 
             (aih_id, tipo, usuario_id, valor_conta, competencia, 
              prof_medicina, prof_enfermagem, prof_fisioterapia, prof_bucomaxilo, status_aih, observacoes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [aihId, tipo, req.usuario.id, valor_conta, competencia,
             prof_medicina, prof_enfermagem, prof_fisioterapia, prof_bucomaxilo, status_aih, observacoes]
        );

        // Atualizar AIH
        await run(
            'UPDATE aihs SET status = ?, valor_atual = ? WHERE id = ?',
            [status_aih, valor_conta, aihId]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Glosas
app.get('/api/aih/:id/glosas', verificarToken, async (req, res) => {
    try {
        const glosas = await all(
            'SELECT * FROM glosas WHERE aih_id = ? AND ativa = 1',
            [req.params.id]
        );
        res.json({ glosas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/aih/:id/glosas', verificarToken, async (req, res) => {
    try {
        const { linha, tipo, profissional, quantidade } = req.body;

        // Validar dados obrigatórios
        if (!linha || !tipo || !profissional) {
            return res.status(400).json({ error: 'Linha, tipo e profissional são obrigatórios' });
        }

        const result = await run(
            'INSERT INTO glosas (aih_id, linha, tipo, profissional, quantidade) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, linha, tipo, profissional, quantidade || 1]
        );

        // Log da ação
        await logAcao(req.usuario.id, `Adicionou glosa na AIH ID ${req.params.id}: ${linha} - ${tipo}`);

        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error('Erro ao adicionar glosa:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/glosas/:id', verificarToken, async (req, res) => {
    try {
        await run('UPDATE glosas SET ativa = 0 WHERE id = ?', [req.params.id]);

        // Log da ação
        await logAcao(req.usuario.id, `Removeu glosa ID ${req.params.id}`);

        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao remover glosa:', err);
        res.status(500).json({ error: err.message });
    }
});

// Tipos de Glosa
app.get('/api/tipos-glosa', verificarToken, async (req, res) => {
    try {
        const tipos = await all('SELECT * FROM tipos_glosa ORDER BY descricao');
        res.json({ tipos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tipos-glosa', verificarToken, async (req, res) => {
    try {
        const { descricao } = req.body;
        const result = await run('INSERT INTO tipos_glosa (descricao) VALUES (?)', [descricao]);
        res.json({ success: true, id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tipos-glosa/:id', verificarToken, async (req, res) => {
    try {
        await run('DELETE FROM tipos_glosa WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Pesquisa avançada
app.post('/api/pesquisar', verificarToken, async (req, res) => {
    try {
        const { filtros } = req.body;
        let sql = `SELECT a.*, COUNT(g.id) as total_glosas 
                   FROM aihs a 
                   LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1 
                   WHERE 1=1`;
        const params = [];

        // Filtro especial para AIHs em processamento por competência
        if (filtros.em_processamento_competencia) {
            const competencia = filtros.em_processamento_competencia;

            // Buscar AIHs que tiveram entrada SUS mas não saída hospital na competência específica
            sql = `
                SELECT a.*, COUNT(g.id) as total_glosas 
                FROM aihs a 
                LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1 
                WHERE a.id IN (
                    SELECT DISTINCT m1.aih_id 
                    FROM movimentacoes m1 
                    WHERE m1.tipo = 'entrada_sus' 
                    AND m1.competencia = ?
                    AND m1.aih_id NOT IN (
                        SELECT DISTINCT m2.aih_id 
                        FROM movimentacoes m2 
                        WHERE m2.tipo = 'saida_hospital' 
                        AND m2.competencia = ?
                    )
                )
            `;
            params.push(competencia, competencia);
        }
        // Filtro especial para AIHs em processamento geral
        else if (filtros.em_processamento_geral) {
            sql = `
                SELECT a.*, COUNT(g.id) as total_glosas 
                FROM aihs a 
                LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1 
                WHERE a.id IN (
                    SELECT DISTINCT m1.aih_id 
                    FROM movimentacoes m1 
                    WHERE m1.tipo = 'entrada_sus' 
                    AND m1.aih_id NOT IN (
                        SELECT DISTINCT m2.aih_id 
                        FROM movimentacoes m2 
                        WHERE m2.tipo = 'saida_hospital'
                    )
                )
            `;
        }
        else {
            // Filtros normais
            if (filtros.status?.length) {
                sql += ` AND a.status IN (${filtros.status.map(() => '?').join(',')})`;
                params.push(...filtros.status);
            }

            if (filtros.competencia) {
                sql += ' AND a.competencia = ?';
                params.push(filtros.competencia);
            }

            if (filtros.data_inicio) {
                sql += ' AND a.criado_em >= ?';
                params.push(filtros.data_inicio);
            }

            if (filtros.data_fim) {
                sql += ' AND a.criado_em <= ?';
                params.push(filtros.data_fim + ' 23:59:59');
            }

            if (filtros.valor_min) {
                sql += ' AND a.valor_atual >= ?';
                params.push(filtros.valor_min);
            }

            if (filtros.valor_max) {
                sql += ' AND a.valor_atual <= ?';
                params.push(filtros.valor_max);
            }

            if (filtros.numero_aih) {
                sql += ' AND a.numero_aih LIKE ?';
                params.push(`%${filtros.numero_aih}%`);
            }

            if (filtros.numero_atendimento) {
                sql += ` AND a.id IN (
                    SELECT DISTINCT aih_id FROM atendimentos 
                    WHERE numero_atendimento LIKE ?
                )`;
                params.push(`%${filtros.numero_atendimento}%`);
            }

            if (filtros.profissional) {
                sql += ` AND a.id IN (
                    SELECT DISTINCT aih_id FROM movimentacoes 
                    WHERE prof_medicina LIKE ? OR prof_enfermagem LIKE ? 
                    OR prof_fisioterapia LIKE ? OR prof_bucomaxilo LIKE ?
                )`;
                const prof = `%${filtros.profissional}%`;
                params.push(prof, prof, prof, prof);
            }
        }

        sql += ' GROUP BY a.id ORDER BY a.criado_em DESC';

        const resultados = await all(sql, params);
        res.json({ resultados });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profissionais
app.get('/api/profissionais', verificarToken, async (req, res) => {
    try {
        const profissionais = await all('SELECT * FROM profissionais');
        res.json({ profissionais });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profissionais', verificarToken, async (req, res) => {
    try {
        const { nome, especialidade } = req.body;
        const result = await run(
            'INSERT INTO profissionais (nome, especialidade) VALUES (?, ?)',
            [nome, especialidade]
        );
        res.json({ success: true, id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/profissionais/:id', verificarToken, async (req, res) => {
    try {
        await run('DELETE FROM profissionais WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Limpar rate limit (apenas para desenvolvimento)
app.post('/api/admin/clear-rate-limit', verificarToken, (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { ip } = req.body;
        clearRateLimit(ip);
        res.json({ success: true, message: 'Rate limit limpo com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Estatísticas do sistema (admin)
app.get('/api/admin/stats', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const stats = await getDbStats();
        res.json({ success: true, stats });
    } catch (err) {
        console.error('Erro ao obter estatísticas:', err);
        res.status(500).json({ error: err.message });
    }
});

// Logs de segurança (admin)
app.get('/api/admin/security-logs', verificarToken, (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const logs = getSecurityLogs();
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Limpar cache manualmente (admin)
app.post('/api/admin/clear-cache', verificarToken, (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { pattern } = req.body;
        clearCache(pattern);
        res.json({ success: true, message: 'Cache limpo com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Backup manual (admin)
app.post('/api/admin/backup', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const backupPath = await createBackup();
        res.json({ success: true, message: 'Backup criado com sucesso', path: backupPath });
    } catch (err) {
        console.error('Erro ao criar backup:', err);
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const stats = await getDbStats();
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                total_aihs: stats?.total_aihs || 0,
                db_size: stats?.db_size_mb || 0,
                connections: stats?.pool_connections || 0
            }
        };

        res.json(health);
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            timestamp: new Date().toISOString(),
            error: err.message 
        });
    }
});

// Backup do banco de dados SQLite
app.get('/api/backup', verificarToken, async (req, res) => {
    try {
        const fs = require('fs');
        const dbPath = path.join(__dirname, 'db', 'aih.db');

        // Verificar se o arquivo existe
        if (!fs.existsSync(dbPath)) {
            return res.status(404).json({ error: 'Arquivo de banco de dados não encontrado' });
        }

        // Fazer checkpoint do WAL antes do backup para garantir consistência
        await run("PRAGMA wal_checkpoint(FULL)");

        const nomeArquivo = `backup-aih-${new Date().toISOString().split('T')[0]}.db`;

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Usar createReadStream para arquivos grandes
        const fileStream = fs.createReadStream(dbPath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('Erro ao fazer backup:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Erro ao fazer backup do banco de dados' });
            }
        });

        console.log(`Backup do banco iniciado: ${nomeArquivo}`);

    } catch (err) {
        console.error('Erro no backup:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erro interno ao fazer backup' });
        }
    }
});

// Backup completo programático (para admins)
app.post('/api/admin/backup-completo', verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const backupPath = await createBackup();
        res.json({ 
            success: true, 
            message: 'Backup completo criado com sucesso', 
            path: backupPath,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Erro ao criar backup completo:', err);
        res.status(500).json({ error: err.message });
    }
});

// Export completo de todos os dados da base
app.get('/api/export/:formato', verificarToken, async (req, res) => {
    try {
        console.log(`Iniciando exportação completa em formato: ${req.params.formato}`);

        // Buscar TODOS os dados da base de dados
        const aihs = await all(`
            SELECT a.*, 
                   COUNT(DISTINCT g.id) as total_glosas,
                   GROUP_CONCAT(DISTINCT at.numero_atendimento, ', ') as atendimentos,
                   u.nome as usuario_cadastro_nome,
                   COUNT(DISTINCT m.id) as total_movimentacoes
            FROM aihs a
            LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1
            LEFT JOIN atendimentos at ON a.id = at.aih_id
            LEFT JOIN usuarios u ON a.usuario_cadastro_id = u.id
            LEFT JOIN movimentacoes m ON a.id = m.aih_id
            GROUP BY a.id
            ORDER BY a.criado_em DESC
        `);

        // Buscar todas as movimentações
        const movimentacoes = await all(`
            SELECT m.*, u.nome as usuario_nome, a.numero_aih
            FROM movimentacoes m
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            LEFT JOIN aihs a ON m.aih_id = a.id
            ORDER BY m.data_movimentacao DESC
        `);

        // Buscar todas as glosas ativas
        const glosas = await all(`
            SELECT g.*, a.numero_aih
            FROM glosas g
            LEFT JOIN aihs a ON g.aih_id = a.id
            WHERE g.ativa = 1
            ORDER BY g.criado_em DESC
        `);

        // Buscar todos os usuários
        const usuarios = await all(`
            SELECT id, nome, matricula, criado_em
            FROM usuarios
            ORDER BY criado_em DESC
        `);

        // Buscar todos os profissionais
        const profissionais = await all(`
            SELECT * FROM profissionais
            ORDER BY nome
        `);

        // Buscar tipos de glosa
        const tiposGlosa = await all(`
            SELECT * FROM tipos_glosa
            ORDER BY descricao
        `);

        const nomeBase = `export-completo-aih-${new Date().toISOString().split('T')[0]}`;

        if (req.params.formato === 'json') {
            // Export JSON estruturado completo
            const dadosCompletos = {
                metadata: {
                    exportado_em: new Date().toISOString(),
                    usuario_export: req.usuario.nome,
                    versao_sistema: '2.0',
                    total_aihs: aihs.length,
                    total_movimentacoes: movimentacoes.length,
                    total_glosas_ativas: glosas.length,
                    total_usuarios: usuarios.length,
                    total_profissionais: profissionais.length
                },
                aihs: aihs.map(a => ({
                    ...a,
                    atendimentos: a.atendimentos ? a.atendimentos.split(', ') : [],
                    status_descricao: getStatusExcel(a.status)
                })),
                movimentacoes: movimentacoes.map(m => ({
                    ...m,
                    tipo_descricao: m.tipo === 'entrada_sus' ? 'Entrada na Auditoria SUS' : 'Saída para Auditoria Hospital',
                    status_descricao: getStatusExcel(m.status_aih)
                })),
                glosas: glosas,
                usuarios: usuarios,
                profissionais: profissionais,
                tipos_glosa: tiposGlosa
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.json"`);
            res.setHeader('Cache-Control', 'no-cache');
            return res.json(dadosCompletos);

        } else if (req.params.formato === 'excel') {
            // Excel com múltiplas abas para todos os dados
            const workbook = XLSX.utils.book_new();

            // Aba 1: AIHs
            const dadosAIHs = aihs.map((a, index) => {
                const diferenca = (a.valor_inicial || 0) - (a.valor_atual || 0);
                return {
                    'ID': a.id,
                    'Número AIH': a.numero_aih || '',
                    'Valor Inicial': a.valor_inicial || 0,
                    'Valor Atual': a.valor_atual || 0,
                    'Diferença (Glosas)': diferenca,
                    'Percentual Glosa': a.valor_inicial > 0 ? ((diferenca / a.valor_inicial) * 100).toFixed(2) + '%' : '0%',
                    'Status Código': a.status,
                    'Status Descrição': getStatusExcel(a.status),
                    'Competência': a.competencia || '',
                    'Total Glosas': a.total_glosas || 0,
                    'Total Movimentações': a.total_movimentacoes || 0,
                    'Atendimentos': a.atendimentos || '',
                    'Usuário Cadastro': a.usuario_cadastro_nome || '',
                    'Data Criação': new Date(a.criado_em).toLocaleDateString('pt-BR'),
                    'Hora Criação': new Date(a.criado_em).toLocaleTimeString('pt-BR')
                };
            });
            const wsAIHs = XLSX.utils.json_to_sheet(dadosAIHs);
            XLSX.utils.book_append_sheet(workbook, wsAIHs, 'AIHs');

            // Aba 2: Movimentações
            const dadosMovimentacoes = movimentacoes.map(m => ({
                'ID': m.id,
                'AIH ID': m.aih_id,
                'Número AIH': m.numero_aih || '',
                'Tipo': m.tipo === 'entrada_sus' ? 'Entrada SUS' : 'Saída Hospital',
                'Data/Hora': new Date(m.data_movimentacao).toLocaleString('pt-BR'),
                'Usuário': m.usuario_nome || '',
                'Valor Conta': m.valor_conta || 0,
                'Competência': m.competencia || '',
                'Prof. Medicina': m.prof_medicina || '',
                'Prof. Enfermagem': m.prof_enfermagem || '',
                'Prof. Fisioterapia': m.prof_fisioterapia || '',
                'Prof. Bucomaxilo': m.prof_bucomaxilo || '',
                'Status AIH': getStatusExcel(m.status_aih),
                'Observações': m.observacoes || ''
            }));
            const wsMovimentacoes = XLSX.utils.json_to_sheet(dadosMovimentacoes);
            XLSX.utils.book_append_sheet(workbook, wsMovimentacoes, 'Movimentações');

            // Aba 3: Glosas
            const dadosGlosas = glosas.map(g => ({
                'ID': g.id,
                'AIH ID': g.aih_id,
                'Número AIH': g.numero_aih || '',
                'Linha': g.linha,
                'Tipo': g.tipo,
                'Profissional': g.profissional,
                'Quantidade': g.quantidade || 1,
                'Ativa': g.ativa ? 'Sim' : 'Não',
                'Data Criação': new Date(g.criado_em).toLocaleDateString('pt-BR'),
                'Hora Criação': new Date(g.criado_em).toLocaleTimeString('pt-BR')
            }));
            const wsGlosas = XLSX.utils.json_to_sheet(dadosGlosas);
            XLSX.utils.book_append_sheet(workbook, wsGlosas, 'Glosas');

            // Aba 4: Usuários
            const dadosUsuarios = usuarios.map(u => ({
                'ID': u.id,
                'Nome': u.nome,
                'Matrícula': u.matricula || '',
                'Data Criação': new Date(u.criado_em).toLocaleDateString('pt-BR'),
                'Hora Criação': new Date(u.criado_em).toLocaleTimeString('pt-BR')
            }));
            const wsUsuarios = XLSX.utils.json_to_sheet(dadosUsuarios);
            XLSX.utils.book_append_sheet(workbook, wsUsuarios, 'Usuários');

            // Aba 5: Profissionais
            if (profissionais.length > 0) {
                const wsProfissionais = XLSX.utils.json_to_sheet(profissionais);
                XLSX.utils.book_append_sheet(workbook, wsProfissionais, 'Profissionais');
            }

            // Aba 6: Tipos de Glosa
            if (tiposGlosa.length > 0) {
                const wsTiposGlosa = XLSX.utils.json_to_sheet(tiposGlosa);
                XLSX.utils.book_append_sheet(workbook, wsTiposGlosa, 'Tipos de Glosa');
            }

            // Aba 7: Resumo Estatísticas
            const resumo = {
                'Total de AIHs': aihs.length,
                'Total de Movimentações': movimentacoes.length,
                'Total de Glosas Ativas': glosas.length,
                'Total de Usuários': usuarios.length,
                'Total de Profissionais': profissionais.length,
                'Valor Total Inicial': aihs.reduce((sum, a) => sum + (a.valor_inicial || 0), 0).toFixed(2),
                'Valor Total Atual': aihs.reduce((sum, a) => sum + (a.valor_atual || 0), 0).toFixed(2),
                'Total de Perdas (Glosas)': (aihs.reduce((sum, a) => sum + (a.valor_inicial || 0), 0) - aihs.reduce((sum, a) => sum + (a.valor_atual || 0), 0)).toFixed(2),
                'AIHs com Glosas': aihs.filter(a => a.total_glosas > 0).length,
                'Percentual AIHs com Glosas': aihs.length > 0 ? ((aihs.filter(a => a.total_glosas > 0).length / aihs.length) * 100).toFixed(2) + '%' : '0%',
                'Status 1 (Aprovação Direta)': aihs.filter(a => a.status === 1).length,
                'Status 2 (Aprovação Indireta)': aihs.filter(a => a.status === 2).length,
                'Status 3 (Em Discussão)': aihs.filter(a => a.status === 3).length,
                'Status 4 (Finalizada Pós-Discussão)': aihs.filter(a => a.status === 4).length,
                'Data/Hora Exportação': new Date().toLocaleString('pt-BR')
            };
            const wsResumo = XLSX.utils.json_to_sheet([resumo]);
            XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo Estatísticas');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.xlsx"`);
            res.setHeader('Cache-Control', 'no-cache');
            return res.send(buffer);

        } else {
            return res.status(400).json({ error: 'Formato não suportado. Use: json ou excel' });
        }

    } catch (err) {
        console.error('Erro na exportação completa:', err);
        return res.status(500).json({ error: 'Erro interno ao exportar dados: ' + err.message });
    }
});

// Endpoint para exportação de dados personalizados (resultados de pesquisa)
app.post('/api/export/:formato', verificarToken, async (req, res) => {
    try {
        const { dados, titulo, tipo } = req.body;

        if (!dados || !Array.isArray(dados) || dados.length === 0) {
            return res.status(400).json({ error: 'Dados não fornecidos ou inválidos' });
        }

        const nomeArquivo = `${tipo || 'exportacao'}-${new Date().toISOString().split('T')[0]}`;

        if (req.params.formato === 'excel') {
            // Criar workbook Excel
            const worksheet = XLSX.utils.json_to_sheet(dados);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, titulo || 'Dados');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });

            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}.xls`);
            return res.send(buffer);
        } else if (req.params.formato === 'csv') {
            // Criar CSV
            const cabecalhos = Object.keys(dados[0]);
            const csv = [
                cabecalhos.join(','),
                ...dados.map(item => 
                    cabecalhos.map(header => `"${(item[header] || '').toString().replace(/"/g, '""')}"`).join(',')
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}.csv`);
            return res.send('\ufeff' + csv); // BOM para UTF-8
        } else {
            return res.status(400).json({ error: 'Formato não suportado' });
        }
    } catch (err) {
        console.error('Erro na exportação personalizada:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Helper para status no Excel
const getStatusExcel = (status) => {
    const statusMap = {
        1: 'Finalizada com aprovação direta',
        2: 'Ativa com aprovação indireta',
        3: 'Ativa em discussão',
        4: 'Finalizada após discussão'
    };
    return statusMap[status] || 'Desconhecido';
};

// Relatórios aprimorados com filtros por período
app.post('/api/relatorios/:tipo', verificarToken, async (req, res) => {
    try {
        const tipo = req.params.tipo;
        const { data_inicio, data_fim, competencia } = req.body;
        let resultado = {};

        // Construir filtros de período
        let filtroWhere = '';
        let params = [];

        if (competencia) {
            filtroWhere = ' AND competencia = ?';
            params.push(competencia);
        } else if (data_inicio && data_fim) {
            filtroWhere = ' AND DATE(criado_em) BETWEEN ? AND ?';
            params.push(data_inicio, data_fim);
        } else if (data_inicio) {
            filtroWhere = ' AND DATE(criado_em) >= ?';
            params.push(data_inicio);
        } else if (data_fim) {
            filtroWhere = ' AND DATE(criado_em) <= ?';
            params.push(data_fim);
        }

        switch(tipo) {
            case 'tipos-glosa-periodo':
                resultado = await all(`
                    SELECT g.tipo, COUNT(*) as total_ocorrencias, 
                           SUM(g.quantidade) as quantidade_total,
                           GROUP_CONCAT(DISTINCT g.profissional) as profissionais
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.tipo
                    ORDER BY total_ocorrencias DESC
                `, params);
                break;

            case 'aihs-profissional-periodo':
                // AIHs auditadas por profissional no período
                let sqlAihs = `
                    SELECT 
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN m.prof_medicina
                            WHEN m.prof_enfermagem IS NOT NULL THEN m.prof_enfermagem
                            WHEN m.prof_fisioterapia IS NOT NULL THEN m.prof_fisioterapia
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN m.prof_bucomaxilo
                        END as profissional,
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN 'Medicina'
                            WHEN m.prof_enfermagem IS NOT NULL THEN 'Enfermagem'
                            WHEN m.prof_fisioterapia IS NOT NULL THEN 'Fisioterapia'
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN 'Bucomaxilo'
                        END as especialidade,
                        COUNT(DISTINCT m.aih_id) as total_aihs_auditadas,
                        COUNT(*) as total_movimentacoes
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE (m.prof_medicina IS NOT NULL 
                       OR m.prof_enfermagem IS NOT NULL 
                       OR m.prof_fisioterapia IS NOT NULL 
                       OR m.prof_bucomaxilo IS NOT NULL)
                `;

                if (competencia) {
                    sqlAihs += ' AND m.competencia = ?';
                } else if (data_inicio && data_fim) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) BETWEEN ? AND ?';
                } else if (data_inicio) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) >= ?';
                } else if (data_fim) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) <= ?';
                }

                sqlAihs += ` GROUP BY profissional, especialidade
                            ORDER BY total_aihs_auditadas DESC`;

                resultado = await all(sqlAihs, params);
                break;

            case 'glosas-profissional-periodo':
                // Glosas por profissional no período
                resultado = await all(`
                    SELECT g.profissional,
                           COUNT(*) as total_glosas,
                           SUM(g.quantidade) as quantidade_total,
                           GROUP_CONCAT(DISTINCT g.tipo) as tipos_glosa,
                           COUNT(DISTINCT g.tipo) as tipos_diferentes
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.profissional
                    ORDER BY total_glosas DESC
                `, params);
                break;

            case 'valores-glosas-periodo':
                // Análise financeira das glosas no período
                const valoresGlosasPeriodo = await get(`
                    SELECT 
                        COUNT(DISTINCT a.id) as aihs_com_glosas,
                        SUM(a.valor_inicial) as valor_inicial_total,
                        SUM(a.valor_atual) as valor_atual_total,
                        SUM(a.valor_inicial - a.valor_atual) as total_glosas,
                        AVG(a.valor_inicial - a.valor_atual) as media_glosa_por_aih,
                        MIN(a.valor_inicial - a.valor_atual) as menor_glosa,
                        MAX(a.valor_inicial - a.valor_atual) as maior_glosa
                    FROM aihs a
                    WHERE EXISTS (SELECT 1 FROM glosas g WHERE g.aih_id = a.id AND g.ativa = 1)
                    ${filtroWhere}
                `, params);

                const totalAihsPeriodo = await get(`
                    SELECT COUNT(*) as total,
                           SUM(valor_inicial) as valor_inicial_periodo,
                           SUM(valor_atual) as valor_atual_periodo
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                `, params);

                resultado = {
                    ...valoresGlosasPeriodo,
                    total_aihs_periodo: totalAihsPeriodo.total,
                    valor_inicial_periodo: totalAihsPeriodo.valor_inicial_periodo,
                    valor_atual_periodo: totalAihsPeriodo.valor_atual_periodo,
                    percentual_aihs_com_glosas: totalAihsPeriodo.total > 0 ? 
                        ((valoresGlosasPeriodo.aihs_com_glosas / totalAihsPeriodo.total) * 100).toFixed(2) : 0
                };
                break;

            case 'estatisticas-periodo':
                // Estatísticas gerais do período
                const stats = await get(`
                    SELECT 
                        COUNT(*) as total_aihs,
                        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as aprovacao_direta,
                        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as aprovacao_indireta,
                        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as em_discussao,
                        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as finalizada_pos_discussao,
                        AVG(valor_inicial) as valor_medio_inicial,
                        AVG(valor_atual) as valor_medio_atual,
                        SUM(valor_inicial) as valor_total_inicial,
                        SUM(valor_atual) as valor_total_atual
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                `, params);

                const totalGlosasPeriodo = await get(`
                    SELECT COUNT(*) as total_glosas,
                           COUNT(DISTINCT aih_id) as aihs_com_glosas
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                `, params);

                const movimentacoesPeriodo = await get(`
                    SELECT 
                        COUNT(*) as total_movimentacoes,
                        SUM(CASE WHEN tipo = 'entrada_sus' THEN 1 ELSE 0 END) as entradas_sus,
                        SUM(CASE WHEN tipo = 'saida_hospital' THEN 1 ELSE 0 END) as saidas_hospital
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE 1=1 ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                `, params);

                resultado = {
                    ...stats,
                    ...totalGlosasPeriodo,
                    ...movimentacoesPeriodo,
                    diferenca_valores: (stats.valor_total_inicial || 0) - (stats.valor_total_atual || 0),
                    percentual_glosas: stats.total_aihs > 0 ? 
                        ((totalGlosasPeriodo.aihs_com_glosas / stats.total_aihs) * 100).toFixed(2) : 0
                };
                break;

            // Manter relatórios existentes para compatibilidade
            case 'acessos':
                resultado = await all(`
                    SELECT u.nome, COUNT(l.id) as total_acessos, 
                           MAX(l.data_hora) as ultimo_acesso
                    FROM logs_acesso l
                    JOIN usuarios u ON l.usuario_id = u.id
                    WHERE l.acao = 'Login'
                    GROUP BY u.id
                    ORDER BY total_acessos DESC
                `);
                break;

            case 'glosas-profissional':
                resultado = await all(`
                    SELECT profissional, COUNT(*) as total_glosas,
                           SUM(quantidade) as total_itens
                    FROM glosas
                    WHERE ativa = 1
                    GROUP BY profissional
                    ORDER BY total_glosas DESC
                `);
                break;

            case 'aihs-profissional':
                resultado = await all(`
                    SELECT 
                        COALESCE(prof_medicina, prof_enfermagem, prof_fisioterapia, prof_bucomaxilo) as profissional,
                        COUNT(DISTINCT aih_id) as total_aihs,
                        COUNT(*) as total_movimentacoes
                    FROM movimentacoes
                    WHERE prof_medicina IS NOT NULL 
                       OR prof_enfermagem IS NOT NULL 
                       OR prof_fisioterapia IS NOT NULL 
                       OR prof_bucomaxilo IS NOT NULL
                    GROUP BY profissional
                    ORDER BY total_aihs DESC
                `);
                break;

            case 'aprovacoes':
                resultado = await all(`
                    SELECT 
                        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as aprovacao_direta,
                        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as aprovacao_indireta,
                        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as em_discussao,
                        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as finalizada_pos_discussão,
                        COUNT(*) as total
                    FROM aihs
                `);
                break;

            case 'tipos-glosa':
                resultado = await all(`
                    SELECT tipo, COUNT(*) as total, SUM(quantidade) as quantidade_total
                    FROM glosas
                    WHERE ativa = 1
                    GROUP BY tipo
                    ORDER BY total DESC
                `);
                break;

            case 'fluxo-movimentacoes':
                // Análise de fluxo de movimentações por período
                const fluxoEntradas = await get(`
                    SELECT COUNT(DISTINCT m.aih_id) as total_entradas
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE m.tipo = 'entrada_sus' ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                `, params);

                const fluxoSaidas = await get(`
                    SELECT COUNT(DISTINCT m.aih_id) as total_saidas
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE m.tipo = 'saida_hospital' ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                `, params);

                const fluxoPorMes = await all(`
                    SELECT 
                        strftime('%Y-%m', m.data_movimentacao) as mes,
                        SUM(CASE WHEN m.tipo = 'entrada_sus' THEN 1 ELSE 0 END) as entradas,
                        SUM(CASE WHEN m.tipo = 'saida_hospital' THEN 1 ELSE 0 END) as saidas
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE 1=1 ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                    GROUP BY mes
                    ORDER BY mes DESC
                `, params);

                resultado = {
                    total_entradas_sus: fluxoEntradas.total_entradas || 0,
                    total_saidas_hospital: fluxoSaidas.total_saidas || 0,
                    diferenca_fluxo: (fluxoEntradas.total_entradas || 0) - (fluxoSaidas.total_saidas || 0),
                    fluxo_mensal: fluxoPorMes
                };
                break;

            case 'produtividade-auditores':
                // Análise detalhada de produtividade dos auditores
                resultado = await all(`
                    SELECT 
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN m.prof_medicina
                            WHEN m.prof_enfermagem IS NOT NULL THEN m.prof_enfermagem
                            WHEN m.prof_fisioterapia IS NOT NULL THEN m.prof_fisioterapia
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN m.prof_bucomaxilo
                        END as profissional,
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN 'Medicina'
                            WHEN m.prof_enfermagem IS NOT NULL THEN 'Enfermagem'
                            WHEN m.prof_fisioterapia IS NOT NULL THEN 'Fisioterapia'
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN 'Bucomaxilo'
                        END as especialidade,
                        COUNT(DISTINCT m.aih_id) as aihs_auditadas,
                        COUNT(*) as movimentacoes_realizadas,
                        AVG(m.valor_conta) as valor_medio_auditado,
                        COUNT(DISTINCT g.id) as glosas_identificadas
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1
                    WHERE (m.prof_medicina IS NOT NULL OR m.prof_enfermagem IS NOT NULL 
                           OR m.prof_fisioterapia IS NOT NULL OR m.prof_bucomaxilo IS NOT NULL)
                    ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                    GROUP BY profissional, especialidade
                    ORDER BY aihs_auditadas DESC
                `, params);
                break;

            case 'analise-valores-glosas':
                // Análise financeira detalhada das glosas
                const analiseValoresGlosas = await get(`
                    SELECT 
                        COUNT(DISTINCT a.id) as aihs_com_glosas,
                        COUNT(g.id) as total_glosas,
                        SUM(a.valor_inicial) as valor_inicial_total,
                        SUM(a.valor_atual) as valor_atual_total,
                        SUM(a.valor_inicial - a.valor_atual) as valor_total_glosas,
                        AVG(a.valor_inicial - a.valor_atual) as media_glosa_por_aih,
                        MIN(a.valor_inicial - a.valor_atual) as menor_impacto,
                        MAX(a.valor_inicial - a.valor_atual) as maior_impacto
                    FROM aihs a
                    LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1
                    WHERE EXISTS (SELECT 1 FROM glosas gg WHERE gg.aih_id = a.id AND gg.ativa = 1)
                    ${filtroWhere}
                `, params);

                const glosasFrequentes = await all(`
                    SELECT 
                        g.tipo,
                        COUNT(*) as ocorrencias,
                        SUM(a.valor_inicial - a.valor_atual) as impacto_financeiro,
                        AVG(a.valor_inicial - a.valor_atual) as impacto_medio
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.tipo
                    ORDER BY impacto_financeiro DESC
                `, params);

                resultado = {
                    resumo_financeiro: analiseValoresGlosas,
                    glosas_por_impacto: glosasFrequentes
                };
                break;

            case 'performance-competencias':
                // Performance comparativa entre competências
                resultado = await all(`
                    SELECT 
                        a.competencia,
                        COUNT(*) as total_aihs,
                        COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN a.id END) as aihs_com_glosas,
                        SUM(a.valor_inicial) as valor_inicial_competencia,
                        SUM(a.valor_atual) as valor_atual_competencia,
                        SUM(a.valor_inicial - a.valor_atual) as total_glosas_competencia,
                        AVG(a.valor_inicial - a.valor_atual) as media_glosa_competencia,
                        SUM(CASE WHEN a.status IN (1, 4) THEN 1 ELSE 0 END) as aihs_finalizadas,
                        SUM(CASE WHEN a.status IN (2, 3) THEN 1 ELSE 0 END) as aihs_pendentes
                    FROM aihs a
                    LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY a.competencia
                    ORDER BY a.competencia DESC
                `, params);
                break;

            case 'ranking-glosas-frequentes':
                // Ranking das glosas mais frequentes e impactantes
                resultado = await all(`
                    SELECT 
                        g.tipo as tipo_glosa,
                        g.linha as linha_glosa,
                        COUNT(*) as frequencia,
                        COUNT(DISTINCT g.aih_id) as aihs_afetadas,
                        COUNT(DISTINCT g.profissional) as profissionais_envolvidos,
                        GROUP_CONCAT(DISTINCT g.profissional) as lista_profissionais,
                        SUM(a.valor_inicial - a.valor_atual) as impacto_financeiro_total,
                        AVG(a.valor_inicial - a.valor_atual) as impacto_financeiro_medio
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.tipo, g.linha
                    ORDER BY frequencia DESC, impacto_financeiro_total DESC
                `, params);
                break;

            case 'analise-temporal-cadastros':
                // Análise temporal de cadastros e finalizações
                resultado = await all(`
                    SELECT 
                        DATE(a.criado_em) as data_cadastro,
                        COUNT(*) as aihs_cadastradas,
                        SUM(a.valor_inicial) as valor_total_cadastrado,
                        COUNT(CASE WHEN a.status IN (1, 4) THEN 1 END) as finalizadas_no_dia,
                        AVG(a.valor_inicial) as valor_medio_aih
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY DATE(a.criado_em)
                    ORDER BY data_cadastro DESC
                `, params);
                break;

            case 'comparativo-auditorias':
                // Comparativo entre auditoria SUS e Hospital
                const movimentacoesPorTipo = await all(`
                    SELECT 
                        m.tipo as tipo_movimentacao,
                        COUNT(*) as total_movimentacoes,
                        COUNT(DISTINCT m.aih_id) as aihs_movimentadas,
                        AVG(m.valor_conta) as valor_medio,
                        SUM(m.valor_conta) as valor_total,
                        COUNT(DISTINCT m.prof_medicina) as prof_medicina_distintos,
                        COUNT(DISTINCT m.prof_enfermagem) as prof_enfermagem_distintos,
                        COUNT(DISTINCT m.prof_fisioterapia) as prof_fisio_distintos,
                        COUNT(DISTINCT m.prof_bucomaxilo) as prof_buco_distintos
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE 1=1 ${filtroWhere.replace('competencia', 'm.competencia').replace('criado_em', 'm.data_movimentacao')}
                    GROUP BY m.tipo
                `, params);

                resultado = movimentacoesPorTipo;
                break;

            case 'detalhamento-status':
                // Detalhamento completo por status das AIHs
                resultado = await all(`
                    SELECT 
                        CASE a.status
                            WHEN 1 THEN 'Finalizada com aprovação direta'
                            WHEN 2 THEN 'Ativa com aprovação indireta'
                            WHEN 3 THEN 'Ativa em discussão'
                            WHEN 4 THEN 'Finalizada após discussão'
                            ELSE 'Status desconhecido'
                        END as status_descricao,
                        a.status as status_codigo,
                        COUNT(*) as quantidade_aihs,
                        SUM(a.valor_inicial) as valor_inicial_total,
                        SUM(a.valor_atual) as valor_atual_total,
                        SUM(a.valor_inicial - a.valor_atual) as diferenca_valores,
                        AVG(a.valor_inicial) as valor_inicial_medio,
                        AVG(a.valor_atual) as valor_atual_medio,
                        COUNT(DISTINCT g.id) as total_glosas,
                        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM aihs WHERE 1=1 ${filtroWhere})), 2) as percentual
                    FROM aihs a
                    LEFT JOIN glosas g ON a.id = g.aih_id AND g.ativa = 1
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY a.status
                    ORDER BY a.status
                `, params);
                break;

            case 'analise-financeira':
                // Análise financeira completa
                const analiseFinanceira = await get(`
                    SELECT 
                        COUNT(*) as total_aihs,
                        SUM(a.valor_inicial) as valor_inicial_geral,
                        SUM(a.valor_atual) as valor_atual_geral,
                        SUM(a.valor_inicial - a.valor_atual) as perdas_glosas,
                        AVG(a.valor_inicial) as valor_inicial_medio,
                        AVG(a.valor_atual) as valor_atual_medio,
                        AVG(a.valor_inicial - a.valor_atual) as perda_media_por_aih,
                        MIN(a.valor_inicial) as menor_valor_inicial,
                        MAX(a.valor_inicial) as maior_valor_inicial,
                        MIN(a.valor_atual) as menor_valor_atual,
                        MAX(a.valor_atual) as maior_valor_atual
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                `, params);

                const faixasValor = await all(`
                    SELECT 
                        CASE 
                            WHEN a.valor_inicial <= 1000 THEN 'Até R$ 1.000'
                            WHEN a.valor_inicial <= 5000 THEN 'R$ 1.001 - R$ 5.000'
                            WHEN a.valor_inicial <= 10000 THEN 'R$ 5.001 - R$ 10.000'
                            WHEN a.valor_inicial <= 50000 THEN 'R$ 10.001 - R$ 50.000'
                            ELSE 'Acima de R$ 50.000'
                        END as faixa_valor,
                        COUNT(*) as quantidade,
                        SUM(a.valor_inicial) as valor_total_faixa,
                        SUM(a.valor_inicial - a.valor_atual) as glosas_faixa
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY faixa_valor
                    ORDER BY MIN(a.valor_inicial)
                `, params);

                resultado = {
                    resumo_geral: analiseFinanceira,
                    distribuicao_por_faixa: faixasValor
                };
                break;

            case 'eficiencia-processamento':
                // Análise de eficiência de processamento
                resultado = await all(`
                    SELECT 
                        a.competencia,
                        COUNT(*) as aihs_competencia,
                        AVG(JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(a.criado_em)) as tempo_medio_dias,
                        COUNT(CASE WHEN a.status IN (1, 4) THEN 1 END) as finalizadas,
                        COUNT(CASE WHEN a.status IN (2, 3) THEN 1 END) as em_andamento,
                        COUNT(DISTINCT m.id) as total_movimentacoes,
                        ROUND(COUNT(DISTINCT m.id) * 1.0 / COUNT(*), 2) as movimentacoes_por_aih
                    FROM aihs a
                    LEFT JOIN movimentacoes m ON a.id = m.aih_id
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY a.competencia
                    ORDER BY a.competencia DESC
                `, params);
                break;

            case 'cruzamento-profissional-glosas':
                // Cruzamento entre profissionais e tipos de glosa
                resultado = await all(`
                    SELECT 
                        g.profissional,
                        g.tipo as tipo_glosa,
                        COUNT(*) as ocorrencias,
                        COUNT(DISTINCT g.aih_id) as aihs_afetadas,
                        SUM(a.valor_inicial - a.valor_atual) as impacto_financeiro
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.profissional, g.tipo
                    ORDER BY g.profissional, ocorrencias DESC
                `, params);
                break;

            case 'distribuicao-valores':
                // Distribuição detalhada de valores
                resultado = await all(`
                    SELECT 
                        CASE 
                            WHEN a.valor_inicial <= 500 THEN '≤ R$ 500'
                            WHEN a.valor_inicial <= 1000 THEN 'R$ 501-1.000'
                            WHEN a.valor_inicial <= 2000 THEN 'R$ 1.001-2.000'
                            WHEN a.valor_inicial <= 5000 THEN 'R$ 2.001-5.000'
                            WHEN a.valor_inicial <= 10000 THEN 'R$ 5.001-10.000'
                            WHEN a.valor_inicial <= 20000 THEN 'R$ 10.001-20.000'
                            ELSE '> R$ 20.000'
                        END as faixa_valor,
                        COUNT(*) as quantidade_aihs,
                        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM aihs WHERE 1=1 ${filtroWhere})), 2) as percentual,
                        SUM(a.valor_inicial) as valor_inicial_faixa,
                        SUM(a.valor_atual) as valor_atual_faixa,
                        SUM(a.valor_inicial - a.valor_atual) as glosas_faixa,
                        AVG(a.valor_inicial) as valor_inicial_medio_faixa,
                        AVG(a.valor_atual) as valor_atual_medio_faixa
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                    GROUP BY faixa_valor
                    ORDER BY MIN(a.valor_inicial)
                `, params);
                break;

            case 'analise-preditiva':
                const mediaTempo = await get(`
                    SELECT AVG(JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(criado_em)) as media_dias
                    FROM aihs WHERE status IN (1, 4)
                `);

                const tendenciaGlosas = await all(`
                    SELECT strftime('%Y-%m', criado_em) as mes, COUNT(*) as total
                    FROM glosas
                    WHERE ativa = 1
                    GROUP BY mes
                    ORDER BY mes DESC
                    LIMIT 6
                `);

                const valorMedioGlosa = await get(`
                    SELECT AVG(a.valor_inicial - a.valor_atual) as valor_medio
                    FROM aihs a
                    WHERE EXISTS (SELECT 1 FROM glosas g WHERE g.aih_id = a.id AND g.ativa = 1)
                `);

                resultado = {
                    tempo_medio_processamento: Math.round(mediaTempo.media_dias || 0),
                    tendencia_glosas: tendenciaGlosas,
                    valor_medio_glosa: valorMedioGlosa.valor_medio || 0,
                    previsao: "Com base nos dados, espera-se manter a média de processamento"
                };
                break;
        }

        res.json({ tipo, resultado, filtros: { data_inicio, data_fim, competencia } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exportar histórico de movimentações de uma AIH
app.get('/api/aih/:id/movimentacoes/export/:formato', verificarToken, async (req, res) => {
    try {
        const aihId = req.params.id;
        const formato = req.params.formato;

        console.log(`📊 Exportando histórico da AIH ID ${aihId} em formato ${formato}`);

        // Buscar dados da AIH
        const aih = await get('SELECT numero_aih FROM aihs WHERE id = ?', [aihId]);
        if (!aih) {
            console.log(`❌ AIH com ID ${aihId} não encontrada`);
            return res.status(404).json({ error: 'AIH não encontrada' });
        }

        // Buscar movimentações com detalhes
        const movimentacoes = await all(`
            SELECT 
                m.*,
                u.nome as usuario_nome
            FROM movimentacoes m
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.aih_id = ?
            ORDER BY m.data_movimentacao DESC
        `, [aihId]);

        console.log(`📋 Encontradas ${movimentacoes.length} movimentações para a AIH ${aih.numero_aih}`);

        if (movimentacoes.length === 0) {
            return res.status(404).json({ error: 'Nenhuma movimentação encontrada para esta AIH' });
        }

        const nomeArquivo = `historico-movimentacoes-AIH-${aih.numero_aih}-${new Date().toISOString().split('T')[0]}`;

        if (formato === 'csv') {
            const cabecalhos = 'Data,Tipo,Status,Valor,Competencia,Prof_Medicina,Prof_Enfermagem,Prof_Fisioterapia,Prof_Bucomaxilo,Usuario,Observacoes';
            const linhas = movimentacoes.map(m => {
                const data = new Date(m.data_movimentacao).toLocaleString('pt-BR');
                const tipo = m.tipo === 'entrada_sus' ? 'Entrada SUS' : 'Saída Hospital';
                const status = getStatusExcel(m.status_aih);
                const valor = (m.valor_conta || 0).toFixed(2);
                const competencia = m.competencia || '';
                const profMed = m.prof_medicina || '';
                const profEnf = m.prof_enfermagem || '';
                const profFisio = m.prof_fisioterapia || '';
                const profBuco = m.prof_bucomaxilo || '';
                const usuario = m.usuario_nome || '';
                const obs = (m.observacoes || '').replace(/"/g, '""');

                return `"${data}","${tipo}","${status}","R$ ${valor}","${competencia}","${profMed}","${profEnf}","${profFisio}","${profBuco}","${usuario}","${obs}"`;
            });

            const csv = [cabecalhos, ...linhas].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.csv"`);
            res.setHeader('Cache-Control', 'no-cache');
            res.send('\ufeff' + csv); // BOM para UTF-8

        } else if (formato === 'xlsx') {
            const dadosFormatados = movimentacoes.map((m, index) => ({
                'Sequência': index + 1,
                'Data/Hora': new Date(m.data_movimentacao).toLocaleString('pt-BR'),
                'Tipo de Movimentação': m.tipo === 'entrada_sus' ? 'Entrada na Auditoria SUS' : 'Saída para Auditoria Hospital',
                'Status da AIH': getStatusExcel(m.status_aih),
                'Valor da Conta': `R$ ${(m.valor_conta || 0).toFixed(2)}`,
                'Competência': m.competencia || 'Não informada',
                'Profissional Medicina': m.prof_medicina || 'Não informado',
                'Profissional Enfermagem': m.prof_enfermagem || 'Não informado',
                'Profissional Fisioterapia': m.prof_fisioterapia || 'Não informado',
                'Profissional Bucomaxilo': m.prof_bucomaxilo || 'Não informado',
                'Usuário Responsável': m.usuario_nome || 'Sistema',
                'Observações': m.observacoes || 'Nenhuma observação'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);

            // Configurar largura das colunas
            worksheet['!cols'] = [
                { wch: 10 }, // Sequência
                { wch: 20 }, // Data/Hora
                { wch: 25 }, // Tipo
                { wch: 25 }, // Status
                { wch: 15 }, // Valor
                { wch: 12 }, // Competência
                { wch: 20 }, // Prof Medicina
                { wch: 20 }, // Prof Enfermagem
                { wch: 20 }, // Prof Fisioterapia
                { wch: 20 }, // Prof Bucomaxilo
                { wch: 20 }, // Usuário
                { wch: 30 }  // Observações
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `Movimentações AIH ${aih.numero_aih}`);

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });

            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.xls"`);
            res.setHeader('Cache-Control', 'no-cache');
            res.send(buffer);

        } else {
            return res.status(400).json({ error: 'Formato não suportado. Use "csv" ou "xlsx"' });
        }

        console.log(`✅ Histórico da AIH ${aih.numero_aih} exportado com sucesso em formato ${formato}`);

    } catch (err) {
        console.error('❌ Erro ao exportar histórico:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao exportar histórico' });
    }
});

// Exportar relatórios com filtros por período
app.post('/api/relatorios/:tipo/export', verificarToken, async (req, res) => {
    try {
        const tipo = req.params.tipo;
        const { data_inicio, data_fim, competencia } = req.body;
        let dados = [];
        let nomeArquivo = `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}`;

        // Construir filtros de período
        let filtroWhere = '';
        let params = [];

        if (competencia) {
            filtroWhere = ' AND competencia = ?';
            params.push(competencia);
            nomeArquivo += `-${competencia.replace('/', '-')}`;
        } else if (data_inicio && data_fim) {
            filtroWhere = ' AND DATE(criado_em) BETWEEN ? AND ?';
            params.push(data_inicio, data_fim);
            nomeArquivo += `-${data_inicio}-a-${data_fim}`;
        } else if (data_inicio) {
            filtroWhere = ' AND DATE(criado_em) >= ?';
            params.push(data_inicio);
            nomeArquivo += `-a-partir-${data_inicio}`;
        } else if (data_fim) {
            filtroWhere = ' AND DATE(criado_em) <= ?';
            params.push(data_fim);
            nomeArquivo += `-ate-${data_fim}`;
        }

        switch(tipo) {
            case 'tipos-glosa-periodo':
                dados = await all(`
                    SELECT 
                        g.tipo as 'Tipo de Glosa',
                        COUNT(*) as 'Total Ocorrencias', 
                        SUM(g.quantidade) as 'Quantidade Total',
                        GROUP_CONCAT(DISTINCT g.profissional) as 'Profissionais Envolvidos'
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.tipo
                    ORDER BY COUNT(*) DESC
                `, params);
                break;

            case 'aihs-profissional-periodo':
                let sqlAihs = `
                    SELECT 
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN m.prof_medicina
                            WHEN m.prof_enfermagem IS NOT NULL THEN m.prof_enfermagem
                            WHEN m.prof_fisioterapia IS NOT NULL THEN m.prof_fisioterapia
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN m.prof_bucomaxilo
                        END as 'Profissional',
                        CASE 
                            WHEN m.prof_medicina IS NOT NULL THEN 'Medicina'
                            WHEN m.prof_enfermagem IS NOT NULL THEN 'Enfermagem'
                            WHEN m.prof_fisioterapia IS NOT NULL THEN 'Fisioterapia'
                            WHEN m.prof_bucomaxilo IS NOT NULL THEN 'Bucomaxilo'
                        END as 'Especialidade',
                        COUNT(DISTINCT m.aih_id) as 'Total AIHs Auditadas',
                        COUNT(*) as 'Total Movimentacoes'
                    FROM movimentacoes m
                    JOIN aihs a ON m.aih_id = a.id
                    WHERE (m.prof_medicina IS NOT NULL 
                       OR m.prof_enfermagem IS NOT NULL 
                       OR m.prof_fisioterapia IS NOT NULL 
                       OR m.prof_bucomaxilo IS NOT NULL)
                `;

                if (competencia) {
                    sqlAihs += ' AND m.competencia = ?';
                } else if (data_inicio && data_fim) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) BETWEEN ? AND ?';
                } else if (data_inicio) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) >= ?';
                } else if (data_fim) {
                    sqlAihs += ' AND DATE(m.data_movimentacao) <= ?';
                }

                sqlAihs += ` GROUP BY Profissional, Especialidade
                            ORDER BY COUNT(DISTINCT m.aih_id) DESC`;

                dados = await all(sqlAihs, params);
                break;

            case 'glosas-profissional-periodo':
                dados = await all(`
                    SELECT 
                        g.profissional as 'Profissional',
                        COUNT(*) as 'Total Glosas',
                        SUM(g.quantidade) as 'Quantidade Total',
                        GROUP_CONCAT(DISTINCT g.tipo) as 'Tipos de Glosa',
                        COUNT(DISTINCT g.tipo) as 'Tipos Diferentes'
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                    GROUP BY g.profissional
                    ORDER BY COUNT(*) DESC
                `, params);
                break;

            case 'valores-glosas-periodo':
                const dadosValoresGlosas = await get(`
                    SELECT 
                        COUNT(DISTINCT a.id) as aihs_com_glosas,
                        SUM(a.valor_inicial) as valor_inicial_total,
                        SUM(a.valor_atual) as valor_atual_total,
                        SUM(a.valor_inicial - a.valor_atual) as total_glosas,
                        AVG(a.valor_inicial - a.valor_atual) as media_glosa_por_aih,
                        MIN(a.valor_inicial - a.valor_atual) as menor_glosa,
                        MAX(a.valor_inicial - a.valor_atual) as maior_glosa
                    FROM aihs a
                    WHERE EXISTS (SELECT 1 FROM glosas g WHERE g.aih_id = a.id AND g.ativa = 1)
                    ${filtroWhere}
                `, params);

                dados = [{
                    'AIHs com Glosas': dadosValoresGlosas.aihs_com_glosas || 0,
                    'Valor Inicial Total': `R$ ${(dadosValoresGlosas.valor_inicial_total || 0).toFixed(2)}`,
                    'Valor Atual Total': `R$ ${(dadosValoresGlosas.valor_atual_total || 0).toFixed(2)}`,
                    'Total de Glosas': `R$ ${(dadosValoresGlosas.total_glosas || 0).toFixed(2)}`,
                    'Média por AIH': `R$ ${(dadosValoresGlosas.media_glosa_por_aih || 0).toFixed(2)}`,
                    'Menor Glosa': `R$ ${(dadosValoresGlosas.menor_glosa || 0).toFixed(2)}`,
                    'Maior Glosa': `R$ ${(dadosValoresGlosas.maior_glosa || 0).toFixed(2)}`
                }];
                break;

            case 'estatisticas-periodo':
                const stats = await get(`
                    SELECT 
                        COUNT(*) as total_aihs,
                        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as aprovacao_direta,
                        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as aprovacao_indireta,
                        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as em_discussao,
                        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as finalizada_pos_discussao,
                        AVG(valor_inicial) as valor_medio_inicial,
                        AVG(valor_atual) as valor_medio_atual,
                        SUM(valor_inicial) as valor_total_inicial,
                        SUM(valor_atual) as valor_total_atual
                    FROM aihs a
                    WHERE 1=1 ${filtroWhere}
                `, params);

                const totalGlosasPeriodo = await get(`
                    SELECT COUNT(*) as total_glosas,
                           COUNT(DISTINCT aih_id) as aihs_com_glosas
                    FROM glosas g
                    JOIN aihs a ON g.aih_id = a.id
                    WHERE g.ativa = 1 ${filtroWhere}
                `, params);

                dados = [{
                    'Total AIHs': stats.total_aihs || 0,
                    'Aprovação Direta': stats.aprovacao_direta || 0,
                    'Aprovação Indireta': stats.aprovacao_indireta || 0,
                    'Em Discussão': stats.em_discussao || 0,
                    'Finalizada Pós-Discussão': stats.finalizada_pos_discussao || 0,
                    'Total Glosas': totalGlosasPeriodo.total_glosas || 0,
                    'AIHs com Glosas': totalGlosasPeriodo.aihs_com_glosas || 0,
                    'Valor Médio Inicial': `R$ ${(stats.valor_medio_inicial || 0).toFixed(2)}`,
                    'Valor Médio Atual': `R$ ${(stats.valor_medio_atual || 0).toFixed(2)}`,
                    'Valor Total Inicial': `R$ ${(stats.valor_total_inicial || 0).toFixed(2)}`,
                    'Valor Total Atual': `R$ ${(stats.valor_total_atual || 0).toFixed(2)}`,
                    'Diferença Total': `R$ ${((stats.valor_total_inicial || 0) - (stats.valor_total_atual || 0)).toFixed(2)}`
                }];
                break;

            // Relatórios originais (sem filtros)
            case 'acessos':
                dados = await all(`
                    SELECT u.nome as Usuario, COUNT(l.id) as 'Total Acessos', 
                           MAX(l.data_hora) as 'Ultimo Acesso'
                    FROM logs_acesso l
                    JOIN usuarios u ON l.usuario_id = u.id
                    WHERE l.acao = 'Login'
                    GROUP BY u.id
                    ORDER BY COUNT(l.id) DESC
                `);
                break;

            case 'glosas-profissional':
                dados = await all(`
                    SELECT profissional as Profissional, 
                           COUNT(*) as 'Total Glosas',
                           SUM(quantidade) as 'Quantidade Total'
                    FROM glosas
                    WHERE ativa = 1
                    GROUP BY profissional
                    ORDER BY COUNT(*) DESC
                `);
                break;

            case 'aihs-profissional':
                dados = await all(`
                    SELECT 
                        COALESCE(prof_medicina, prof_enfermagem, prof_fisioterapia, prof_bucomaxilo) as Profissional,
                        COUNT(DISTINCT aih_id) as 'Total AIHs',
                        COUNT(*) as 'Total Movimentacoes'
                    FROM movimentacoes
                    WHERE prof_medicina IS NOT NULL 
                       OR prof_enfermagem IS NOT NULL 
                       OR prof_fisioterapia IS NOT NULL 
                       OR prof_bucomaxilo IS NOT NULL
                    GROUP BY Profissional
                    ORDER BY COUNT(DISTINCT aih_id) DESC
                `);
                break;

            case 'aprovacoes':
                const aprovacoes = await get(`
                    SELECT 
                        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as aprovacao_direta,
                        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as aprovacao_indireta,
                        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as em_discussao,
                        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as finalizada_pos_discussão,
                        COUNT(*) as total
                    FROM aihs
                `);
                dados = [
                    { Tipo: 'Aprovação Direta', Quantidade: aprovacoes.aprovacao_direta, Percentual: ((aprovacoes.aprovacao_direta/aprovacoes.total)*100).toFixed(1) + '%' },
                    { Tipo: 'Aprovação Indireta', Quantidade: aprovacoes.aprovacao_indireta, Percentual: ((aprovacoes.aprovacao_indireta/aprovacoes.total)*100).toFixed(1) + '%' },
                    { Tipo: 'Em Discussão', Quantidade: aprovacoes.em_discussao, Percentual: ((aprovacoes.em_discussao/aprovacoes.total)*100).toFixed(1) + '%' },
                    { Tipo: 'Finalizada Pós-Discussão', Quantidade: aprovacoes.finalizada_pos_discussao, Percentual: ((aprovacoes.finalizada_pos_discussao/aprovacoes.total)*100).toFixed(1) + '%' }
                ];
                break;

            case 'tipos-glosa':
                dados = await all(`
                    SELECT tipo as 'Tipo de Glosa', 
                           COUNT(*) as 'Total Ocorrencias', 
                           SUM(quantidade) as 'Quantidade Total'
                    FROM glosas
                    WHERE ativa = 1
                    GROUP BY tipo
                    ORDER BY COUNT(*) DESC
                `);
                break;
        }

        if (dados.length === 0) {
            return res.status(404).json({ error: 'Nenhum dado encontrado' });
        }

        // Criar Excel real (XLS compatível)
        const worksheet = XLSX.utils.json_to_sheet(dados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, tipo.charAt(0).toUpperCase() + tipo.slice(1));

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });

        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}.xls`);
        res.send(buffer);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Servir SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
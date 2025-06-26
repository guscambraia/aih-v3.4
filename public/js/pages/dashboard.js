
// Módulo do Dashboard
const Dashboard = {
    competenciaAtual: null,

    // Inicializar o dashboard
    init() {
        try {
            Logger.debug('Dashboard', 'Inicializando módulo Dashboard');
            this.competenciaAtual = this.obterCompetenciaAtual();
            Logger.moduleLoad('Dashboard', true);
            Logger.info('Dashboard', '✅ Dashboard inicializado');
        } catch (error) {
            Logger.moduleLoad('Dashboard', false, error);
            Logger.error('Dashboard', 'Erro na inicialização', error);
        }
    },

    // Obter competência atual (MM/YYYY)
    obterCompetenciaAtual() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        return `${mes}/${ano}`;
    },

    // Carregar dados do dashboard
    async carregar(competenciaSelecionada = null) {
        try {
            Logger.info('Dashboard', 'Iniciando carregamento do dashboard');
            
            const competencia = competenciaSelecionada || this.competenciaAtual;
            Logger.debug('Dashboard', `Carregando dados para competência: ${competencia}`);

            Logger.debug('Dashboard', 'Fazendo requisição para API');
            
            // Usar ApiService se disponível, senão usar método de fallback
            let dados;
            if (window.ApiService && typeof window.ApiService.get === 'function') {
                dados = await ApiService.get('/dashboard', { competencia });
            } else {
                Logger.warn('Dashboard', 'ApiService não disponível, usando fetch direto');
                dados = await this.fetchDashboard(competencia);
            }

            Logger.debug('Dashboard', 'Dados recebidos da API', dados);

            this.renderizarDashboard(dados);
            this.criarSeletorCompetencia(dados.competencias_disponiveis, competencia);
            this.criarResumoFinanceiro(dados);
            
            Logger.info('Dashboard', 'Dashboard carregado com sucesso');

        } catch (error) {
            Logger.error('Dashboard', 'Erro ao carregar dashboard', error);
            this.mostrarErroDashboard(error);
        }
    },

    // Método de fallback para fetch direto
    async fetchDashboard(competencia) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard?competencia=${encodeURIComponent(competencia)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        return await response.json();
    },

    // Renderizar cards do dashboard
    renderizarDashboard(dados) {
        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) {
            Logger.error('Dashboard', 'Container .dashboard não encontrado');
            return;
        }

        dashboard.innerHTML = `
            <!-- Card 1: Em Processamento na Competência -->
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <h3>Em Processamento</h3>
                <p class="stat-number">${dados.em_processamento_competencia}</p>
                <p class="stat-subtitle">AIHs em análise em ${dados.competencia_selecionada}</p>
                <p class="stat-detail">Entradas SUS - Saídas Hospital</p>
            </div>

            <!-- Card 2: Finalizadas na Competência -->
            <div class="stat-card success">
                <div class="stat-icon">✅</div>
                <h3>Finalizadas</h3>
                <p class="stat-number">${dados.finalizadas_competencia}</p>
                <p class="stat-subtitle">AIHs concluídas em ${dados.competencia_selecionada}</p>
                <p class="stat-detail">Status 1 e 4</p>
            </div>

            <!-- Card 3: Com Pendências na Competência -->
            <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <h3>Com Pendências</h3>
                <p class="stat-number">${dados.com_pendencias_competencia}</p>
                <p class="stat-subtitle">AIHs com glosas em ${dados.competencia_selecionada}</p>
                <p class="stat-detail">Status 2 e 3</p>
            </div>

            <!-- Card 4: Total Geral em Processamento -->
            <div class="stat-card info">
                <div class="stat-icon">🏥</div>
                <h3>Total em Processamento</h3>
                <p class="stat-number">${dados.total_em_processamento_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Total: ${dados.total_entradas_sus} entradas - ${dados.total_saidas_hospital} saídas</p>
            </div>

            <!-- Card 5: Total Finalizadas -->
            <div class="stat-card success" style="border-left: 4px solid #10b981;">
                <div class="stat-icon">🎯</div>
                <h3>Total Finalizadas</h3>
                <p class="stat-number">${dados.total_finalizadas_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">AIHs concluídas (Status 1 e 4)</p>
            </div>

            <!-- Card 6: Total Geral Cadastradas -->
            <div class="stat-card" style="border-left: 4px solid #6366f1;">
                <div class="stat-icon">📈</div>
                <h3>Total Cadastradas</h3>
                <p class="stat-number">${dados.total_aihs_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Todas as AIHs do sistema</p>
            </div>
        `;

        // Animar números
        setTimeout(() => this.animarNumeros(), 100);
    },

    // Criar seletor de competência
    criarSeletorCompetencia(competenciasDisponiveis, competenciaAtual) {
        let seletorContainer = document.querySelector('.seletor-competencia-container');
        
        if (!seletorContainer) {
            const dashboardContainer = document.querySelector('.dashboard');
            if (dashboardContainer) {
                seletorContainer = document.createElement('div');
                seletorContainer.className = 'seletor-competencia-container';
                dashboardContainer.parentNode.insertBefore(seletorContainer, dashboardContainer);
            }
        }

        if (seletorContainer) {
            seletorContainer.innerHTML = `
                <div class="seletor-competencia">
                    <label for="selectCompetencia">Competência:</label>
                    <select id="selectCompetencia" onchange="Dashboard.carregar(this.value)">
                        ${competenciasDisponiveis.map(comp => 
                            `<option value="${comp}" ${comp === competenciaAtual ? 'selected' : ''}>${comp}</option>`
                        ).join('')}
                    </select>
                    <span class="competencia-info">📅 Visualizando dados de ${competenciaAtual}</span>
                </div>
            `;
        }
    },

    // Criar resumo financeiro
    criarResumoFinanceiro(dados) {
        let resumoFinanceiro = document.querySelector('.resumo-financeiro');
        
        if (!resumoFinanceiro) {
            const dashboardContainer = document.querySelector('.dashboard');
            if (dashboardContainer) {
                resumoFinanceiro = document.createElement('div');
                resumoFinanceiro.className = 'resumo-financeiro';
                dashboardContainer.parentNode.insertBefore(resumoFinanceiro, dashboardContainer.nextSibling);
            }
        }

        if (resumoFinanceiro && dados.valores_competencia) {
            resumoFinanceiro.innerHTML = `
                <h3>💰 Resumo Financeiro - ${dados.competencia_selecionada}</h3>
                <div class="resumo-cards">
                    <div class="resumo-card">
                        <span class="resumo-label">Valor Inicial Total</span>
                        <span class="resumo-valor">R$ ${dados.valores_competencia.inicial.toFixed(2)}</span>
                    </div>
                    <div class="resumo-card">
                        <span class="resumo-label">Valor Atual Total</span>
                        <span class="resumo-valor">R$ ${dados.valores_competencia.atual.toFixed(2)}</span>
                    </div>
                    <div class="resumo-card">
                        <span class="resumo-label">Média de Glosas</span>
                        <span class="resumo-valor" style="color: var(--danger)">R$ ${dados.valores_competencia.media_glosa.toFixed(2)}</span>
                    </div>
                    <div class="resumo-card">
                        <span class="resumo-label">Total de AIHs</span>
                        <span class="resumo-valor">${dados.total_aihs_competencia}</span>
                    </div>
                </div>
            `;
        }
    },

    // Animar números dos cards
    animarNumeros() {
        const numeros = document.querySelectorAll('.stat-number');
        numeros.forEach(elemento => {
            const valorFinal = parseInt(elemento.textContent) || 0;
            let valorAtual = 0;
            const incremento = valorFinal / 30;

            const timer = setInterval(() => {
                valorAtual += incremento;
                if (valorAtual >= valorFinal) {
                    valorAtual = valorFinal;
                    clearInterval(timer);
                }
                elemento.textContent = Math.round(valorAtual);
            }, 30);
        });
    },

    // Mostrar erro no dashboard
    mostrarErroDashboard(error) {
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.innerHTML = `
                <div class="erro-dashboard" style="text-align: center; padding: 2rem; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px;">
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Erro ao carregar dashboard</h3>
                    <p style="color: #7f1d1d; margin-bottom: 1rem;">${error.message}</p>
                    <button onclick="Dashboard.carregar()" style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }
};

// Disponibilizar globalmente
window.Dashboard = Dashboard;

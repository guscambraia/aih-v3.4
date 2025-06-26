
const Dashboard = {
    // Inicializar módulo
    init() {
        console.log('✅ Dashboard inicializado');
        // Não precisa fazer nada específico na inicialização
        // O carregamento será feito quando necessário
    },

    // Carregar dashboard
    async carregar(competenciaSelecionada = null) {
        try {
            // Se não foi passada competência, usar a atual
            const competencia = competenciaSelecionada || this.getCompetenciaAtual();

            // Buscar dados do dashboard com a competência
            const dados = await api(`/dashboard?competencia=${competencia}`);

            this.criarSeletorCompetencia(dados, competencia);
            this.atualizarCards(dados, competencia);
            this.criarResumoFinanceiro(dados, competencia);
            this.animarNumeros();

        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
            this.mostrarErro();
        }
    },

    criarSeletorCompetencia(dados, competencia) {
        let seletorContainer = document.querySelector('.seletor-competencia-container');
        if (!seletorContainer) {
            const dashboardContainer = document.querySelector('.dashboard');
            seletorContainer = document.createElement('div');
            seletorContainer.className = 'seletor-competencia-container';
            dashboardContainer.parentNode.insertBefore(seletorContainer, dashboardContainer);
        }

        seletorContainer.innerHTML = `
            <div class="seletor-competencia">
                <label for="selectCompetencia">Competência:</label>
                <select id="selectCompetencia" onchange="Dashboard.carregar(this.value)">
                    ${dados.competencias_disponiveis.map(comp => 
                        `<option value="${comp}" ${comp === competencia ? 'selected' : ''}>${comp}</option>`
                    ).join('')}
                </select>
                <span class="competencia-info">📅 Visualizando dados de ${competencia}</span>
            </div>
        `;
    },

    atualizarCards(dados, competencia) {
        const dashboard = document.querySelector('.dashboard');
        dashboard.innerHTML = `
            <!-- Card 1: Em Processamento na Competência -->
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <h3>Em Processamento</h3>
                <p class="stat-number" id="emProcessamentoCompetencia">${dados.em_processamento_competencia}</p>
                <p class="stat-subtitle">AIHs em análise em ${competencia}</p>
                <p class="stat-detail">Entradas SUS - Saídas Hospital</p>
            </div>

            <!-- Card 2: Finalizadas na Competência -->
            <div class="stat-card success">
                <div class="stat-icon">✅</div>
                <h3>Finalizadas</h3>
                <p class="stat-number" id="finalizadasCompetencia">${dados.finalizadas_competencia}</p>
                <p class="stat-subtitle">AIHs concluídas em ${competencia}</p>
                <p class="stat-detail">Status 1 e 4</p>
            </div>

            <!-- Card 3: Com Pendências na Competência -->
            <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <h3>Com Pendências</h3>
                <p class="stat-number" id="comPendenciasCompetencia">${dados.com_pendencias_competencia}</p>
                <p class="stat-subtitle">AIHs com glosas em ${competencia}</p>
                <p class="stat-detail">Status 2 e 3</p>
            </div>

            <!-- Card 4: Total Geral em Processamento -->
            <div class="stat-card info">
                <div class="stat-icon">🏥</div>
                <h3>Total em Processamento</h3>
                <p class="stat-number" id="totalProcessamentoGeral">${dados.total_em_processamento_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Total: ${dados.total_entradas_sus} entradas - ${dados.total_saidas_hospital} saídas</p>
            </div>

            <!-- Card 5: Total Finalizadas (Histórico Geral) -->
            <div class="stat-card success" style="border-left: 4px solid #10b981;">
                <div class="stat-icon">🎯</div>
                <h3>Total Finalizadas</h3>
                <p class="stat-number" id="totalFinalizadasGeral">${dados.total_finalizadas_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">AIHs concluídas (Status 1 e 4)</p>
            </div>

            <!-- Card 6: Total Geral Cadastradas -->
            <div class="stat-card" style="border-left: 4px solid #6366f1;">
                <div class="stat-icon">📈</div>
                <h3>Total Cadastradas</h3>
                <p class="stat-number" id="totalAIHsGeral">${dados.total_aihs_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Todas as AIHs do sistema</p>
            </div>
        `;
    },

    criarResumoFinanceiro(dados, competencia) {
        const resumoFinanceiro = document.createElement('div');
        resumoFinanceiro.className = 'resumo-financeiro';
        resumoFinanceiro.innerHTML = `
            <h3>💰 Resumo Financeiro - ${competencia}</h3>
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

        const dashboardContainer = document.querySelector('.dashboard');
        const resumoExistente = document.querySelector('.resumo-financeiro');
        if (resumoExistente) {
            resumoExistente.remove();
        }
        dashboardContainer.parentNode.insertBefore(resumoFinanceiro, dashboardContainer.nextSibling);
    },

    animarNumeros() {
        const numeros = document.querySelectorAll('.stat-number');
        numeros.forEach(elemento => {
            const valorFinal = parseInt(elemento.textContent);
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

    mostrarErro() {
        document.querySelector('.dashboard').innerHTML = `
            <div class="erro-dashboard">
                <p>⚠️ Erro ao carregar dados do dashboard</p>
                <button onclick="Dashboard.carregar()">Tentar novamente</button>
            </div>
        `;
    },

    getCompetenciaAtual() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        return `${mes}/${ano}`;
    }
};

// Disponibilizar globalmente
window.Dashboard = Dashboard;

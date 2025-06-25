
const Reports = {
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Event listeners para botões de relatórios são definidos inline no HTML
        // ou podem ser adicionados aqui se necessário
    },

    async gerarRelatorio(tipo) {
        try {
            // Capturar filtros de período
            const dataInicio = document.getElementById('relatorioDataInicio')?.value || '';
            const dataFim = document.getElementById('relatorioDataFim')?.value || '';
            const competencia = document.getElementById('relatorioCompetencia')?.value || '';

            const filtros = {
                data_inicio: dataInicio,
                data_fim: dataFim,
                competencia: competencia
            };

            // Usar POST para enviar filtros
            const response = await API.call(`/relatorios/${tipo}`, {
                method: 'POST',
                body: JSON.stringify(filtros)
            });

            const container = document.getElementById('resultadoRelatorio');

            // Mostrar período selecionado
            let periodoTexto = '';
            if (competencia) {
                periodoTexto = `Competência: ${competencia}`;
            } else if (dataInicio && dataFim) {
                periodoTexto = `Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`;
            } else if (dataInicio) {
                periodoTexto = `A partir de: ${new Date(dataInicio).toLocaleDateString('pt-BR')}`;
            } else if (dataFim) {
                periodoTexto = `Até: ${new Date(dataFim).toLocaleDateString('pt-BR')}`;
            } else {
                periodoTexto = 'Todos os períodos';
            }

            let conteudo = this.gerarConteudoRelatorio(tipo, response.resultado, periodoTexto);

            container.innerHTML = conteudo;
            container.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            alert('Erro ao gerar relatório: ' + err.message);
        }
    },

    gerarConteudoRelatorio(tipo, dados, periodoTexto) {
        switch(tipo) {
            case 'tipos-glosa-periodo':
                return `
                    <div class="relatorio-content">
                        <h3>
                            📊 Tipos de Glosa Mais Comuns - ${periodoTexto}
                            <button onclick="Reports.exportarRelatorio('${tipo}')" class="btn-success" style="font-size: 0.875rem;">
                                Exportar Excel
                            </button>
                        </h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo de Glosa</th>
                                    <th>Total de Ocorrências</th>
                                    <th>Quantidade Total</th>
                                    <th>Profissionais Envolvidos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dados.map(r => `
                                    <tr>
                                        <td>${r.tipo}</td>
                                        <td>${r.total_ocorrencias}</td>
                                        <td>${r.quantidade_total}</td>
                                        <td style="font-size: 0.875rem;">${r.profissionais.split(',').slice(0, 3).join(', ')}${r.profissionais.split(',').length > 3 ? '...' : ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

            case 'estatisticas-periodo':
                const stats = dados;
                const totalStats = stats.total_aihs || 1;
                return `
                    <div class="relatorio-content">
                        <h3>
                            📈 Estatísticas do Período - ${periodoTexto}
                            <button onclick="Reports.exportarRelatorio('${tipo}')" class="btn-success" style="font-size: 0.875rem;">
                                Exportar Excel
                            </button>
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                            <div class="stat-card">
                                <h4>Total de AIHs</h4>
                                <p class="stat-number">${stats.total_aihs}</p>
                                <p class="stat-subtitle">No período selecionado</p>
                            </div>
                            <div class="stat-card success">
                                <h4>Aprovação Direta</h4>
                                <p class="stat-number">${stats.aprovacao_direta}</p>
                                <p class="stat-subtitle">${((stats.aprovacao_direta/totalStats)*100).toFixed(1)}%</p>
                            </div>
                            <div class="stat-card warning">
                                <h4>Em Discussão</h4>
                                <p class="stat-number">${stats.em_discussao}</p>
                                <p class="stat-subtitle">${((stats.em_discussao/totalStats)*100).toFixed(1)}%</p>
                            </div>
                            <div class="stat-card info">
                                <h4>Total de Glosas</h4>
                                <p class="stat-number">${stats.total_glosas}</p>
                                <p class="stat-subtitle">${stats.percentual_glosas}% das AIHs</p>
                            </div>
                        </div>
                    </div>
                `;

            case 'valores-glosas-periodo':
                return `
                    <div class="relatorio-content">
                        <h3>
                            💰 Análise Financeira de Glosas - ${periodoTexto}
                            <button onclick="Reports.exportarRelatorio('${tipo}')" class="btn-success" style="font-size: 0.875rem;">
                                Exportar Excel
                            </button>
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                            <div class="stat-card">
                                <h4>Total AIHs com Glosas</h4>
                                <p class="stat-number">${dados.aihs_com_glosas || 0}</p>
                                <p class="stat-subtitle">${dados.percentual_aihs_com_glosas}% do total</p>
                            </div>
                            <div class="stat-card">
                                <h4>Valor Total de Glosas</h4>
                                <p class="stat-number">R$ ${(dados.total_glosas || 0).toFixed(2)}</p>
                                <p class="stat-subtitle">Diferença entre inicial e atual</p>
                            </div>
                            <div class="stat-card">
                                <h4>Média por AIH com Glosa</h4>
                                <p class="stat-number">R$ ${(dados.media_glosa_por_aih || 0).toFixed(2)}</p>
                                <p class="stat-subtitle">Valor médio de glosa</p>
                            </div>
                            <div class="stat-card">
                                <h4>Maior Glosa</h4>
                                <p class="stat-number">R$ ${(dados.maior_glosa || 0).toFixed(2)}</p>
                                <p class="stat-subtitle">Menor: R$ ${(dados.menor_glosa || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                `;

            default:
                return `<p>Relatório do tipo ${tipo} não implementado.</p>`;
        }
    },

    async exportarRelatorio(tipo) {
        try {
            // Capturar filtros de período para relatórios filtrados
            const dataInicio = document.getElementById('relatorioDataInicio')?.value || '';
            const dataFim = document.getElementById('relatorioDataFim')?.value || '';
            const competencia = document.getElementById('relatorioCompetencia')?.value || '';

            const filtros = {
                data_inicio: dataInicio,
                data_fim: dataFim,
                competencia: competencia
            };

            const response = await fetch(`/api/relatorios/${tipo}/export`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AppState.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filtros)
            });

            if (!response.ok) {
                throw new Error('Erro ao exportar relatório');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Nome do arquivo com período se aplicável
            let nomeArquivo = `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}`;
            if (competencia) {
                nomeArquivo += `-${competencia.replace('/', '-')}`;
            } else if (dataInicio && dataFim) {
                nomeArquivo += `-${dataInicio}-a-${dataFim}`;
            }
            nomeArquivo += '.xls';

            a.href = url;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('Erro ao exportar relatório: ' + err.message);
        }
    },

    limparFiltros() {
        document.getElementById('relatorioDataInicio').value = '';
        document.getElementById('relatorioDataFim').value = '';
        document.getElementById('relatorioCompetencia').value = '';
        document.getElementById('resultadoRelatorio').innerHTML = '';
    }
};

// Disponibilizar globalmente
window.Reports = Reports;

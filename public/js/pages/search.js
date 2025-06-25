
const Search = {
    init() {
        this.setupEventListeners();
        this.carregarProfissionaisSelects();
    },

    setupEventListeners() {
        // Busca rápida por AIH
        document.getElementById('buscaRapidaAIH')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarPorAIH();
            }
        });

        // Busca rápida por atendimento
        document.getElementById('buscaRapidaAtendimento')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarPorAtendimento();
            }
        });

        // Pesquisa avançada
        document.getElementById('formPesquisa')?.addEventListener('submit', (e) => {
            this.pesquisarAvancada(e);
        });
    },

    async buscarPorAIH() {
        const numeroAIH = document.getElementById('buscaRapidaAIH').value.trim();

        if (!numeroAIH) {
            alert('Por favor, digite o número da AIH');
            return;
        }

        try {
            const aih = await API.call(`/aih/${numeroAIH}`);
            AppState.setAihAtual(aih);

            if (aih.status === 1 || aih.status === 4) {
                const continuar = await Modal.confirmar(
                    'AIH Finalizada',
                    'Esta AIH está finalizada. É uma reassinatura/reapresentação?'
                );

                if (!continuar) {
                    document.getElementById('buscaRapidaAIH').value = '';
                    return;
                }
            }

            this.mostrarInfoAIH(aih);
        } catch (err) {
            if (err.message.includes('não encontrada')) {
                alert(`AIH ${numeroAIH} não encontrada no sistema.`);
            } else {
                alert('Erro ao buscar AIH: ' + err.message);
            }
            document.getElementById('buscaRapidaAIH').value = '';
        }
    },

    async buscarPorAtendimento() {
        const numeroAtendimento = document.getElementById('buscaRapidaAtendimento').value.trim();

        if (!numeroAtendimento) {
            alert('Por favor, digite o número do atendimento');
            return;
        }

        try {
            const response = await API.call('/pesquisar', {
                method: 'POST',
                body: JSON.stringify({ 
                    filtros: { numero_atendimento: numeroAtendimento }
                })
            });

            const container = document.getElementById('resultadosPesquisa');

            if (response.resultados.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: #fef3c7; border-radius: 8px; margin-top: 2rem;">
                        <h3 style="color: #92400e;">❌ Nenhum resultado encontrado</h3>
                        <p style="color: #78350f;">O número de atendimento "${numeroAtendimento}" não foi encontrado em nenhuma AIH.</p>
                    </div>
                `;
                return;
            }

            // Se encontrou apenas uma AIH, abrir diretamente
            if (response.resultados.length === 1) {
                const aih = await API.call(`/aih/${response.resultados[0].numero_aih}`);
                AppState.setAihAtual(aih);
                this.mostrarInfoAIH(aih);
                return;
            }

            // Se encontrou múltiplas AIHs, mostrar lista
            this.exibirResultados(response.resultados, `Atendimento "${numeroAtendimento}" encontrado`);
            document.getElementById('buscaRapidaAtendimento').value = '';

        } catch (err) {
            alert('Erro ao buscar por atendimento: ' + err.message);
            document.getElementById('buscaRapidaAtendimento').value = '';
        }
    },

    async pesquisarAvancada(e) {
        e.preventDefault();

        const status = Array.from(document.querySelectorAll('#formPesquisa input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));

        const filtros = {
            numero_aih: document.getElementById('pesquisaNumeroAIH').value,
            numero_atendimento: document.getElementById('pesquisaNumeroAtendimento').value,
            status,
            competencia: document.getElementById('pesquisaCompetencia').value,
            data_inicio: document.getElementById('pesquisaDataInicio').value,
            data_fim: document.getElementById('pesquisaDataFim').value,
            valor_min: document.getElementById('pesquisaValorMin').value,
            valor_max: document.getElementById('pesquisaValorMax').value,
            profissional: document.getElementById('pesquisaProfissional').value
        };

        // Remover filtros vazios
        Object.keys(filtros).forEach(key => {
            if (!filtros[key] || (Array.isArray(filtros[key]) && filtros[key].length === 0)) {
                delete filtros[key];
            }
        });

        try {
            const response = await API.call('/pesquisar', {
                method: 'POST',
                body: JSON.stringify({ filtros })
            });

            if (response.resultados.length === 0) {
                this.exibirSemResultados();
                return;
            }

            this.exibirResultados(response.resultados, 'Resultados da Pesquisa');
        } catch (err) {
            alert('Erro na pesquisa: ' + err.message);
        }
    },

    exibirResultados(resultados, titulo) {
        const container = document.getElementById('resultadosPesquisa');

        container.innerHTML = `
            <div style="background: #d1fae5; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
                <h3 style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; color: #065f46;">
                    <span>📊 ${titulo}</span>
                    <span style="background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem;">
                        ${resultados.length} AIH(s) encontrada(s)
                    </span>
                </h3>
            </div>

            <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                ${resultados.map(r => `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
                                display: flex; justify-content: space-between; align-items: center; 
                                transition: all 0.3s; cursor: pointer; border: 2px solid transparent;"
                         onmouseover="this.style.borderColor='#6366f1'; this.style.transform='translateY(-2px)'"
                         onmouseout="this.style.borderColor='transparent'; this.style.transform='translateY(0)'"
                         onclick="Search.abrirAIH('${r.numero_aih}')">
                        <div>
                            <h4 style="color: #1e293b; margin-bottom: 0.5rem;">AIH ${r.numero_aih}</h4>
                            <div style="display: flex; gap: 2rem; color: #64748b; font-size: 0.875rem;">
                                <span>📅 ${r.competencia}</span>
                                <span>💰 R$ ${r.valor_atual.toFixed(2)}</span>
                                <span>📆 ${new Date(r.criado_em).toLocaleDateString('pt-BR')}</span>
                                ${r.total_glosas > 0 ? `<span>⚠️ ${r.total_glosas} glosa(s)</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <span class="status-badge status-${r.status}">${this.getStatusDescricao(r.status)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 2rem;">
                <button onclick="Exports.exportarResultados('csv')" class="btn-success">
                    📄 Exportar CSV
                </button>
                <button onclick="Exports.exportarResultados('excel')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    📊 Exportar Excel
                </button>
                <button onclick="Exports.exportarResultados('json')" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                    🔧 Exportar JSON
                </button>
                <button onclick="window.print()" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
                    🖨️ Imprimir
                </button>
                <button onclick="Search.limparFiltros()" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                    🗑️ Limpar e Nova Pesquisa
                </button>
            </div>
        `;
    },

    exibirSemResultados() {
        const container = document.getElementById('resultadosPesquisa');
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; background: #fef3c7; border-radius: 8px; margin-top: 2rem;">
                <h3 style="color: #92400e;">❌ Nenhum resultado encontrado</h3>
                <p style="color: #78350f;">Nenhuma AIH foi encontrada com os filtros especificados.</p>
                <button onclick="Search.limparFiltros()" style="margin-top: 1rem; background: #f59e0b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                    Limpar Filtros
                </button>
            </div>
        `;
    },

    async abrirAIH(numero) {
        try {
            const aih = await API.call(`/aih/${numero}`);
            AppState.setAihAtual(aih);
            this.mostrarInfoAIH(aih);
        } catch (err) {
            alert('Erro ao abrir AIH: ' + err.message);
        }
    },

    mostrarInfoAIH(aih) {
        // Usar o módulo AIHManagement para mostrar informações
        if (window.AIHManagement) {
            AIHManagement.mostrarInfoAIH(aih);
        } else {
            Navigation.mostrarTela('telaInfoAIH');
        }
    },

    limparFiltros() {
        document.getElementById('formPesquisa').reset();
        document.getElementById('resultadosPesquisa').innerHTML = '';

        // Limpar também os checkboxes
        document.querySelectorAll('#formPesquisa input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Limpar busca rápida
        document.getElementById('buscaRapidaAIH').value = '';
        document.getElementById('buscaRapidaAtendimento').value = '';
    },

    async carregarProfissionaisSelects() {
        try {
            const response = await API.call('/profissionais');
            const profissionais = response.profissionais;

            // Preencher select de pesquisa
            const pesquisaProf = document.getElementById('pesquisaProfissional');
            if (pesquisaProf) {
                pesquisaProf.innerHTML = '<option value="">Todos os profissionais</option>';
                profissionais.forEach(prof => {
                    pesquisaProf.innerHTML += `<option value="${prof.nome}">${prof.nome} - ${prof.especialidade}</option>`;
                });
            }
        } catch (err) {
            console.error('Erro ao carregar profissionais:', err);
        }
    },

    getStatusDescricao(status) {
        const descricoes = {
            1: 'Finalizada com aprovação direta',
            2: 'Ativa com aprovação indireta',
            3: 'Ativa em discussão',
            4: 'Finalizada após discussão'
        };
        return descricoes[status] || 'Desconhecido';
    }
};

// Disponibilizar globalmente
window.Search = Search;

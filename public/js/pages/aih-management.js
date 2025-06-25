
const AIHManagement = {
    init() {
        this.setupEventListeners();
        this.preencherCompetenciaAtual();
    },

    setupEventListeners() {
        // Buscar AIH
        document.getElementById('formBuscarAIH').addEventListener('submit', (e) => {
            this.buscarAIH(e);
        });

        // Cadastrar AIH
        document.getElementById('formCadastroAIH').addEventListener('submit', (e) => {
            this.cadastrarAIH(e);
        });

        // Adicionar atendimento
        document.getElementById('btnAddAtendimento').addEventListener('click', () => {
            this.adicionarCampoAtendimento();
        });

        // Nova movimentação
        document.getElementById('btnNovaMovimentacao').addEventListener('click', () => {
            Navigation.irParaMovimentacao();
        });
    },

    async buscarAIH(e) {
        e.preventDefault();

        const numero = document.getElementById('numeroBuscarAIH').value;

        try {
            const aih = await API.call(`/aih/${numero}`);
            AppState.setAihAtual(aih);

            if (aih.status === 1 || aih.status === 4) {
                const continuar = await Modal.confirmar(
                    'AIH Finalizada',
                    'Esta AIH está finalizada. É uma reassinatura/reapresentação?'
                );

                if (!continuar) {
                    document.getElementById('numeroBuscarAIH').value = '';
                    return;
                }
            }

            this.mostrarInfoAIH(aih);
        } catch (err) {
            if (err.message.includes('não encontrada')) {
                // Nova AIH
                document.getElementById('cadastroNumeroAIH').value = numero;
                document.getElementById('cadastroNumeroAIH').removeAttribute('readonly');
                AppState.setTelaAnterior('telaInformarAIH');
                Navigation.mostrarTela('telaCadastroAIH');
                setTimeout(() => this.garantirCampoAtendimento(), 100);
            } else {
                alert('Erro: ' + err.message);
            }
        }
    },

    async cadastrarAIH(e) {
        e.preventDefault();

        const numeroAIH = document.getElementById('cadastroNumeroAIH').value.trim();

        // Validação do número da AIH
        if (numeroAIH.length !== 13) {
            const continuar = await Modal.confirmar(
                'Atenção - Número da AIH',
                `O número da AIH informado tem ${numeroAIH.length} dígitos, mas o padrão são 13 dígitos. Deseja continuar o cadastro mesmo assim?`
            );

            if (!continuar) return;
        }

        // Coleta dos atendimentos
        const atendimentosInputs = document.querySelectorAll('#atendimentosContainer .atendimento-input');
        const atendimentos = [];

        for (const input of atendimentosInputs) {
            const valor = input.value ? input.value.trim() : '';
            if (valor && valor.length > 0) {
                atendimentos.push(valor);
            }
        }

        if (atendimentos.length === 0) {
            alert('Informe pelo menos um número de atendimento');
            return;
        }

        try {
            const dados = {
                numero_aih: numeroAIH,
                valor_inicial: parseFloat(document.getElementById('cadastroValor').value),
                competencia: document.getElementById('cadastroCompetencia').value,
                atendimentos: atendimentos
            };

            await API.call('/aih', {
                method: 'POST',
                body: JSON.stringify(dados)
            });

            alert('AIH cadastrada com sucesso!');
            this.limparFormularioCadastro();

            // Buscar a AIH recém-cadastrada
            const aih = await API.call(`/aih/${dados.numero_aih}`);
            AppState.setAihAtual(aih);
            this.mostrarInfoAIH(aih);
        } catch (err) {
            console.error('Erro detalhado:', err);
            alert('Erro ao cadastrar: ' + err.message);
        }
    },

    mostrarInfoAIH(aih) {
        const content = document.getElementById('infoAIHContent');

        // Calcular diferença de valor
        const diferencaValor = aih.valor_inicial - aih.valor_atual;
        const percentualDiferenca = ((diferencaValor / aih.valor_inicial) * 100).toFixed(1);

        content.innerHTML = `
            <div class="info-card">
                <h3>📋 AIH ${aih.numero_aih}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <p><strong>Status:</strong> <span class="status-badge status-${aih.status}">${this.getStatusDescricao(aih.status)}</span></p>
                    <p><strong>Competência:</strong> ${aih.competencia}</p>
                    <p><strong>Valor Inicial:</strong> R$ ${aih.valor_inicial.toFixed(2)}</p>
                    <p><strong>Valor Atual:</strong> R$ ${aih.valor_atual.toFixed(2)}</p>
                    <p><strong>Diferença:</strong> <span style="color: ${diferencaValor > 0 ? '#ef4444' : '#10b981'}">
                        R$ ${Math.abs(diferencaValor).toFixed(2)} (${percentualDiferenca}%)
                    </span></p>
                    <p><strong>Atendimentos:</strong> ${aih.atendimentos.length}</p>
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Números de Atendimento:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                        ${aih.atendimentos.map(at => `
                            <span style="background: #e0e7ff; color: #4f46e5; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">
                                ${at}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-top: 2rem;">
                <h4 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        📊 Histórico de Movimentações
                        <span style="background: #6366f1; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem;">
                            ${aih.movimentacoes.length}
                        </span>
                    </span>
                    <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                        <button onclick="Exports.exportarHistoricoMovimentacoes('csv')" 
                                style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                                       color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                       cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;">
                            📄 CSV
                        </button>
                        <button onclick="Exports.exportarHistoricoMovimentacoes('xlsx')" 
                                style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); 
                                       color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                       cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;">
                            📊 Excel (XLS)
                        </button>
                    </div>
                </h4>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Valor</th>
                            <th>Profissionais</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${aih.movimentacoes.map(mov => {
                            const profissionais = [];
                            if (mov.prof_medicina) profissionais.push(`Med: ${mov.prof_medicina}`);
                            if (mov.prof_enfermagem) profissionais.push(`Enf: ${mov.prof_enfermagem}`);
                            if (mov.prof_fisioterapia) profissionais.push(`Fis: ${mov.prof_fisioterapia}`);
                            if (mov.prof_bucomaxilo) profissionais.push(`Buco: ${mov.prof_bucomaxilo}`);

                            return `
                                <tr>
                                    <td>${new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <span style="display: flex; align-items: center; gap: 0.5rem;">
                                            ${mov.tipo === 'entrada_sus' ? '📥' : '📤'}
                                            ${mov.tipo === 'entrada_sus' ? 'Entrada SUS' : 'Saída Hospital'}
                                        </span>
                                    </td>
                                    <td><span class="status-badge status-${mov.status_aih}">${this.getStatusDescricao(mov.status_aih)}</span></td>
                                    <td>R$ ${(mov.valor_conta || 0).toFixed(2)}</td>
                                    <td style="font-size: 0.875rem;">${profissionais.join(' | ') || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            ${aih.glosas.length > 0 ? `
                <div style="margin-top: 2rem; background: #fef3c7; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <h4 style="color: #92400e; margin-bottom: 1rem;">
                        ⚠️ Glosas Ativas (${aih.glosas.length})
                    </h4>
                    <div style="display: grid; gap: 0.75rem;">
                        ${aih.glosas.map(g => `
                            <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${g.linha}</strong> - ${g.tipo}
                                    <span style="color: #64748b; font-size: 0.875rem; margin-left: 1rem;">
                                        Por: ${g.profissional}
                                    </span>
                                </div>
                                <span style="font-size: 0.75rem; color: #92400e;">
                                    ${new Date(g.criado_em).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        Navigation.mostrarTela('telaInfoAIH');
    },

    adicionarCampoAtendimento() {
        const container = document.getElementById('atendimentosContainer');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'atendimento-input';
        input.placeholder = 'Número do atendimento';
        container.appendChild(input);
    },

    garantirCampoAtendimento() {
        const container = document.getElementById('atendimentosContainer');
        if (container.children.length === 0) {
            this.adicionarCampoAtendimento();
        }
    },

    limparFormularioCadastro() {
        document.getElementById('formCadastroAIH').reset();
        document.getElementById('cadastroNumeroAIH').value = '';
        document.getElementById('cadastroNumeroAIH').removeAttribute('readonly');

        const container = document.getElementById('atendimentosContainer');
        container.innerHTML = '';
        this.adicionarCampoAtendimento();

        document.getElementById('cadastroCompetencia').value = this.getCompetenciaAtual();
    },

    preencherCompetenciaAtual() {
        const campo = document.getElementById('cadastroCompetencia');
        if (campo && !campo.value) {
            campo.value = this.getCompetenciaAtual();
        }
    },

    getCompetenciaAtual() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        return `${mes}/${ano}`;
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
window.AIHManagement = AIHManagement;

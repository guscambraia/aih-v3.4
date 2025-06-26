const Movements = {
    init() {
        this.setupEventListeners();
        console.log('✅ Movements inicializado');
    },

    setupEventListeners() {
        const btnNovaMovimentacao = document.getElementById('btnNovaMovimentacao');
        if (btnNovaMovimentacao) {
            btnNovaMovimentacao.addEventListener('click', () => {
                Navigation.irParaMovimentacao();
            });
        }

        const btnGerenciarGlosas = document.getElementById('btnGerenciarGlosas');
        if (btnGerenciarGlosas) {
            btnGerenciarGlosas.addEventListener('click', () => {
                AppState.setTelaAnterior('telaMovimentacao');
                Navigation.mostrarTela('telaPendencias');

                setTimeout(() => {
                    if (window.Glosas && window.Glosas.carregar) {
                        window.Glosas.carregar();
                    }
                }, 100);
            });
        }

        const formMovimentacao = document.getElementById('formMovimentacao');
        if (formMovimentacao) {
            formMovimentacao.addEventListener('submit', (e) => {
                this.salvarMovimentacao(e);
            });
        }
    },

    async carregarDados() {
        if (!AppState.aihAtual) {
            alert('Nenhuma AIH selecionada');
            Navigation.voltarTelaPrincipal();
            return;
        }

        try {
            // Carregar próxima movimentação
            await this.carregarProximaMovimentacao();

            // Carregar profissionais
            await this.carregarProfissionais();

            // Carregar glosas
            await this.carregarGlosas();

            // Preencher dados iniciais
            this.preencherDadosIniciais();

        } catch (err) {
            console.error('Erro ao carregar dados da movimentação:', err);
            alert('Erro ao carregar dados: ' + err.message);
        }
    },

    async carregarProximaMovimentacao() {
        try {
            if (AppState.aihAtual) {
                const proximaMovResult = await api(`/aih/${AppState.aihAtual.id}/proxima-movimentacao`);

                // Mostrar informações sobre próxima movimentação
                document.getElementById('infoProximaMovimentacao').innerHTML = `
                    <div style="background: #e0f2fe; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4>📝 Próxima Movimentação</h4>
                        <p><strong>Tipo:</strong> ${proximaMovResult.descricao}</p>
                        <p><strong>Explicação:</strong> ${proximaMovResult.explicacao}</p>
                    </div>
                `;

                // Definir tipo automaticamente
                AppState.setProximoTipoMovimentacao(proximaMovResult.tipo);
            }
        } catch (err) {
            console.error('Erro ao carregar próxima movimentação:', err);
        }
    },

    async carregarProfissionais() {
        try {
            const response = await api('/profissionais');

            // Preencher selects de profissionais
            const selects = ['movMedicina', 'movEnfermagem', 'movFisioterapia', 'movBucomaxilo'];

            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Selecione...</option>';
                    response.forEach(prof => {
                        const option = document.createElement('option');
                        option.value = prof.nome;
                        option.textContent = prof.nome;
                        select.appendChild(option);
                    });
                }
            });

            // Pré-selecionar profissionais baseado na última movimentação
            this.preencherProfissionaisSugeridos();

        } catch (err) {
            console.error('Erro ao carregar profissionais:', err);
        }
    },

    preencherProfissionaisSugeridos() {
        if (!AppState.aihAtual || !AppState.aihAtual.movimentacoes || AppState.aihAtual.movimentacoes.length === 0) {
            return;
        }

        // Pegar a última movimentação
        const ultimaMovimentacao = AppState.aihAtual.movimentacoes[0];

        // Sugerir os mesmos profissionais da última movimentação
        const campos = [
            { campo: 'movMedicina', valor: ultimaMovimentacao.prof_medicina },
            { campo: 'movEnfermagem', valor: ultimaMovimentacao.prof_enfermagem },
            { campo: 'movFisioterapia', valor: ultimaMovimentacao.prof_fisioterapia },
            { campo: 'movBucomaxilo', valor: ultimaMovimentacao.prof_bucomaxilo }
        ];

        campos.forEach(({ campo, valor }) => {
            const select = document.getElementById(campo);
            if (select && valor) {
                select.value = valor;
            }
        });
    },

    async carregarGlosas() {
        try {
            const response = await api(`/aih/${AppState.aihAtual.id}/glosas`);
            this.exibirGlosas(response.glosas);
            AppState.setGlosasPendentes(response.glosas);
        } catch (err) {
            console.error('Erro ao carregar glosas:', err);
            this.exibirGlosas([]);
        }
    },

    exibirGlosas(glosas) {
        const container = document.getElementById('glosasPendentesContainer');

        if (!glosas || glosas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 2rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <p>Nenhuma glosa ou pendência ativa</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="color: #92400e; margin-bottom: 1rem;">
                    ⚠️ Glosas/Pendências Ativas (${glosas.length})
                </h4>
                <div style="display: grid; gap: 0.75rem;">
                    ${glosas.map(g => `
                        <div style="background: white; padding: 1rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
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
        `;
    },

    preencherDadosIniciais() {
        if (!AppState.aihAtual) return;

        // Preencher campos com dados da AIH
        document.getElementById('movValor').value = AppState.aihAtual.valor_atual;
        document.getElementById('movCompetencia').value = AppState.aihAtual.competencia;

        // Mostrar informações da AIH
        document.getElementById('infoAIHMovimentacao').innerHTML = `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4>📋 AIH ${AppState.aihAtual.numero_aih}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
                    <p><strong>Status Atual:</strong> <span class="status-badge status-${AppState.aihAtual.status}">${this.getStatusDescricao(AppState.aihAtual.status)}</span></p>
                    <p><strong>Valor Atual:</strong> R$ ${AppState.aihAtual.valor_atual.toFixed(2)}</p>
                </div>
            </div>
        `;
    },

    async salvarMovimentacao() {
        try {
            // Validar campos obrigatórios
            const status = parseInt(document.getElementById('movStatus').value);
            const valor = parseFloat(document.getElementById('movValor').value);
            const competencia = document.getElementById('movCompetencia').value;

            if (!status || !valor || !competencia) {
                alert('Preencha todos os campos obrigatórios');
                return;
            }

            // Confirmar ação
            const confirmar = await Modal.confirmar(
                'Confirmar Movimentação',
                'Tem certeza que deseja salvar esta movimentação?'
            );

            if (!confirmar) return;

            // Preparar dados
            const dados = {
                tipo: AppState.proximoTipoMovimentacao || 'entrada_sus',
                status_aih: status,
                valor_conta: valor,
                competencia: competencia,
                prof_medicina: document.getElementById('movMedicina').value || null,
                prof_enfermagem: document.getElementById('movEnfermagem').value || null,
                prof_fisioterapia: document.getElementById('movFisioterapia').value || null,
                prof_bucomaxilo: document.getElementById('movBucomaxilo').value || null,
                observacoes: document.getElementById('movObservacoes').value || null
            };

            // Salvar movimentação
            await api(`/aih/${AppState.aihAtual.id}/movimentacao`, {
                method: 'POST',
                body: JSON.stringify(dados)
            });

            alert('Movimentação salva com sucesso!');

             // Recarregar AIH
             const aih = await api(`/aih/${AppState.aihAtual.numero_aih}`);
             AppState.setAihAtual(aih);

            // Voltar para informações da AIH
            Navigation.voltarTelaAnterior();

        } catch (err) {
            console.error('Erro ao salvar movimentação:', err);
            alert('Erro ao salvar movimentação: ' + err.message);
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
window.Movements = Movements;
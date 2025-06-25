
const Glosas = {
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Adicionar nova glosa
        document.getElementById('formNovaGlosa').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarGlosa();
        });

        // Salvar e voltar
        document.getElementById('btnSalvarGlosas').addEventListener('click', () => {
            this.salvarEVoltar();
        });

        // Voltar sem salvar
        document.getElementById('btnVoltarGlosas').addEventListener('click', () => {
            Navigation.voltarTelaAnterior();
        });
    },

    async carregar() {
        if (!AppState.aihAtual) {
            alert('Nenhuma AIH selecionada');
            Navigation.voltarTelaPrincipal();
            return;
        }

        try {
            // Mostrar informações da AIH
            this.mostrarInfoAIH();
            
            // Carregar glosas atuais
            await this.carregarGlosas();
            
            // Focar no primeiro campo
            setTimeout(() => {
                document.getElementById('glosaLinha').focus();
            }, 100);
            
        } catch (err) {
            console.error('Erro ao carregar glosas:', err);
            alert('Erro ao carregar dados: ' + err.message);
        }
    },

    mostrarInfoAIH() {
        document.getElementById('infoAIHGlosas').innerHTML = `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4>📋 Gerenciando Glosas - AIH ${AppState.aihAtual.numero_aih}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
                    <p><strong>Status:</strong> <span class="status-badge status-${AppState.aihAtual.status}">${this.getStatusDescricao(AppState.aihAtual.status)}</span></p>
                    <p><strong>Valor Atual:</strong> R$ ${AppState.aihAtual.valor_atual.toFixed(2)}</p>
                </div>
            </div>
        `;
    },

    async carregarGlosas() {
        try {
            const response = await ApiService.carregarGlosas(AppState.aihAtual.id);
            this.exibirListaGlosas(response.glosas);
            AppState.setGlosasPendentes(response.glosas);
        } catch (err) {
            console.error('Erro ao carregar glosas:', err);
            this.exibirListaGlosas([]);
        }
    },

    exibirListaGlosas(glosas) {
        const container = document.getElementById('listaGlosasPendentes');
        
        if (!glosas || glosas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 2rem; background: #f8fafc; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <p>Nenhuma glosa ou pendência ativa para esta AIH</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="background: #fef3c7; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="color: #92400e; margin-bottom: 1rem;">
                    ⚠️ Glosas/Pendências Ativas (${glosas.length})
                </h4>
                <div style="display: grid; gap: 1rem;">
                    ${glosas.map(g => `
                        <div style="background: white; padding: 1rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1f2937;">
                                    ${g.linha} - ${g.tipo}
                                </div>
                                <div style="color: #64748b; font-size: 0.875rem; margin-top: 0.25rem;">
                                    Profissional: ${g.profissional}
                                </div>
                                <div style="color: #6b7280; font-size: 0.75rem; margin-top: 0.25rem;">
                                    Criado em: ${new Date(g.criado_em).toLocaleDateString('pt-BR')} às ${new Date(g.criado_em).toLocaleTimeString('pt-BR')}
                                </div>
                            </div>
                            <button onclick="Glosas.removerGlosa(${g.id})" 
                                    style="background: #ef4444; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; margin-left: 1rem;"
                                    title="Remover glosa">
                                🗑️
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async adicionarGlosa() {
        try {
            const linha = document.getElementById('glosaLinha').value.trim();
            const tipo = document.getElementById('glosaTipo').value.trim();
            const profissional = document.getElementById('glosaProfissional').value.trim();
            const quantidade = parseInt(document.getElementById('glosaQuantidade').value) || 1;

            if (!linha || !tipo || !profissional) {
                alert('Preencha todos os campos da glosa');
                return;
            }

            // Adicionar múltiplas glosas se quantidade > 1
            for (let i = 0; i < quantidade; i++) {
                const dados = {
                    linha: quantidade > 1 ? `${linha} (${i + 1}/${quantidade})` : linha,
                    tipo,
                    profissional
                };

                await ApiService.adicionarGlosa(AppState.aihAtual.id, dados);
            }

            // Limpar formulário
            document.getElementById('formNovaGlosa').reset();
            document.getElementById('glosaQuantidade').value = 1;

            // Recarregar lista
            await this.carregarGlosas();

            // Mostrar confirmação
            const mensagem = quantidade > 1 
                ? `${quantidade} glosas/pendências adicionadas com sucesso!`
                : 'Glosa/pendência adicionada com sucesso!';
            
            alert(mensagem);

            // Focar no primeiro campo para facilitar adição de mais glosas
            document.getElementById('glosaLinha').focus();

        } catch (err) {
            console.error('Erro ao adicionar glosa:', err);
            alert('Erro ao adicionar glosa: ' + err.message);
        }
    },

    async removerGlosa(glosaId) {
        try {
            const confirmar = await Modal.confirmar(
                'Remover Glosa',
                'Tem certeza que deseja remover esta glosa/pendência?'
            );

            if (!confirmar) return;

            await ApiService.removerGlosa(glosaId);

            // Recarregar lista
            await this.carregarGlosas();

            alert('Glosa/pendência removida com sucesso!');

        } catch (err) {
            console.error('Erro ao remover glosa:', err);
            alert('Erro ao remover glosa: ' + err.message);
        }
    },

    async salvarEVoltar() {
        try {
            // Atualizar AIH com glosas mais recentes
            if (AppState.aihAtual) {
                const aihAtualizada = await ApiService.buscarAIH(AppState.aihAtual.numero_aih);
                AppState.setAihAtual(aihAtualizada);
            }

            // Voltar para tela anterior
            Navigation.voltarTelaAnterior();

            // Se voltou para movimentação, atualizar glosas
            if (AppState.telaAnterior === 'telaMovimentacao') {
                setTimeout(async () => {
                    if (window.Movements && window.Movements.carregarGlosas) {
                        await window.Movements.carregarGlosas();
                    }
                }, 200);
            }

        } catch (err) {
            console.error('Erro ao atualizar dados:', err);
            Navigation.voltarTelaAnterior();
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
window.Glosas = Glosas;

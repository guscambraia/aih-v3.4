
// Componente de Tabelas Dinâmicas
const Tables = {
    // Criar tabela de AIHs
    criarTabelaAIHs(aihs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!aihs || aihs.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhuma AIH encontrada</p>';
            return;
        }

        const tabela = `
            <table class="tabela-dados">
                <thead>
                    <tr>
                        <th>AIH</th>
                        <th>Paciente</th>
                        <th>Status</th>
                        <th>Competência</th>
                        <th>Valor</th>
                        <th>Última Movimentação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${aihs.map(aih => `
                        <tr onclick="Navigation.irParaInfoAIH(${JSON.stringify(aih).replace(/"/g, '&quot;')})">
                            <td>${aih.numero_aih}</td>
                            <td>${aih.nome_paciente}</td>
                            <td>
                                <span class="status-badge status-${aih.status_aih}">
                                    ${this.getStatusDescricao(aih.status_aih)}
                                </span>
                            </td>
                            <td>${aih.competencia}</td>
                            <td>${this.formatarMoeda(aih.valor_conta)}</td>
                            <td>${this.formatarData(aih.data_ultima_movimentacao)}</td>
                            <td>
                                <button onclick="event.stopPropagation(); Navigation.irParaInfoAIH(${JSON.stringify(aih).replace(/"/g, '&quot;')})" class="btn-pequeno">
                                    Ver Detalhes
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tabela;
    },

    // Criar tabela de movimentações
    criarTabelaMovimentacoes(movimentacoes, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!movimentacoes || movimentacoes.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhuma movimentação encontrada</p>';
            return;
        }

        const tabela = `
            <table class="tabela-dados">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Usuário</th>
                        <th>Valor</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    ${movimentacoes.map(mov => `
                        <tr>
                            <td>${this.formatarDataHora(mov.data_movimentacao)}</td>
                            <td>
                                <span class="tipo-badge tipo-${mov.tipo}">
                                    ${this.getTipoDescricao(mov.tipo)}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge status-${mov.status_aih}">
                                    ${this.getStatusDescricao(mov.status_aih)}
                                </span>
                            </td>
                            <td>${mov.usuario_nome || 'N/A'}</td>
                            <td>${this.formatarMoeda(mov.valor_conta)}</td>
                            <td class="observacoes-cell" title="${mov.observacoes || ''}">
                                ${mov.observacoes ? (mov.observacoes.length > 50 ? 
                                    mov.observacoes.substring(0, 50) + '...' : 
                                    mov.observacoes) : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tabela;
    },

    // Criar tabela de glosas
    criarTabelaGlosas(glosas, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!glosas || glosas.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhuma glosa encontrada</p>';
            return;
        }

        const tabela = `
            <table class="tabela-dados">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${glosas.map(glosa => `
                        <tr>
                            <td>${glosa.tipo_descricao}</td>
                            <td>${this.formatarMoeda(glosa.valor_glosa)}</td>
                            <td>
                                <span class="status-badge status-glosa-${glosa.status}">
                                    ${glosa.status === 'ativa' ? 'Ativa' : 'Resolvida'}
                                </span>
                            </td>
                            <td>${this.formatarData(glosa.data_glosa)}</td>
                            <td>
                                <button onclick="Glosas.editarGlosa(${glosa.id})" class="btn-pequeno">
                                    Editar
                                </button>
                                ${glosa.status === 'ativa' ? 
                                    `<button onclick="Glosas.resolverGlosa(${glosa.id})" class="btn-pequeno btn-success">
                                        Resolver
                                    </button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tabela;
    },

    // Utilitários de formatação
    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';
        return parseFloat(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    formatarData(data) {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    },

    formatarDataHora(data) {
        if (!data) return '-';
        return new Date(data).toLocaleString('pt-BR');
    },

    getStatusDescricao(status) {
        const descricoes = {
            1: 'Finalizada com aprovação direta',
            2: 'Ativa com aprovação indireta',
            3: 'Ativa em discussão',
            4: 'Finalizada após discussão'
        };
        return descricoes[status] || 'Desconhecido';
    },

    getTipoDescricao(tipo) {
        const descricoes = {
            'entrada_sus': 'Entrada SUS',
            'saida_hospital': 'Saída Hospital',
            'movimentacao': 'Movimentação'
        };
        return descricoes[tipo] || tipo;
    }
};

// Disponibilizar globalmente
window.Tables = Tables;

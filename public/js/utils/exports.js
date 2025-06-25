
const Exports = {
    async fazerBackup() {
        try {
            const response = await fetch('/api/backup', {
                headers: {
                    'Authorization': `Bearer ${AppState.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao fazer backup');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-aih-${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            document.getElementById('modal').classList.remove('ativo');
        } catch (err) {
            alert('Erro ao fazer backup: ' + err.message);
        }
    },

    async exportarDados(formato) {
        try {
            const response = await fetch(`/api/export/${formato}`, {
                headers: {
                    'Authorization': `Bearer ${AppState.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao exportar dados');
            }

            let filename = `export-aih-${new Date().toISOString().split('T')[0]}`;
            let blob;

            if (formato === 'json') {
                const data = await response.json();
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename += '.json';
            } else if (formato === 'excel') {
                blob = await response.blob();
                filename += '.xls';
            } else {
                blob = await response.blob();
                filename += '.csv';
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Fechar modal se estiver aberto
            const modal = document.getElementById('modal');
            if (modal && modal.classList.contains('ativo')) {
                modal.classList.remove('ativo');
            }
        } catch (err) {
            alert('Erro ao exportar: ' + err.message);
        }
    },

    exportarResultados(formato) {
        this.exportarDados(formato);
    },

    async exportarHistoricoMovimentacoes(formato) {
        if (!AppState.aihAtual || !AppState.aihAtual.id) {
            alert('Não há AIH selecionada para exportar.');
            return;
        }

        try {
            // Para CSV, usar método local simples
            if (formato === 'csv') {
                if (!AppState.aihAtual.movimentacoes || AppState.aihAtual.movimentacoes.length === 0) {
                    alert('Não há movimentações para exportar.');
                    return;
                }

                // Preparar dados para CSV
                const dadosCSV = AppState.aihAtual.movimentacoes.map(mov => ({
                    Data: new Date(mov.data_movimentacao).toLocaleDateString('pt-BR'),
                    Tipo: this.getTipoDescricao(mov.tipo),
                    Status: this.getStatusDescricao(mov.status_aih),
                    Valor: mov.valor_conta ? `R$ ${mov.valor_conta.toFixed(2)}` : 'R$ 0,00',
                    Competencia: mov.competencia || '-',
                    'Prof. Medicina': mov.prof_medicina || '-',
                    'Prof. Enfermagem': mov.prof_enfermagem || '-',
                    'Prof. Fisioterapia': mov.prof_fisioterapia || '-',
                    'Prof. Bucomaxilo': mov.prof_bucomaxilo || '-',
                    Observações: mov.observacoes || '-'
                }));

                // Criar CSV
                const csvHeaders = Object.keys(dadosCSV[0]).join(',');
                const csvRows = dadosCSV.map(row => 
                    Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
                );
                const csvContent = [csvHeaders, ...csvRows].join('\n');

                // Download CSV
                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `historico-movimentacoes-AIH-${AppState.aihAtual.numero_aih}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

            } else if (formato === 'xlsx') {
                // Para Excel, usar endpoint do servidor
                const response = await fetch(`/api/aih/${AppState.aihAtual.id}/movimentacoes/export/xlsx`, {
                    headers: {
                        'Authorization': `Bearer ${AppState.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erro ao exportar para Excel');
                }

                // Download do Excel
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `historico-movimentacoes-AIH-${AppState.aihAtual.numero_aih}-${new Date().toISOString().split('T')[0]}.xls`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

        } catch (error) {
            console.error('Erro ao exportar histórico de movimentações:', error);
            alert('Erro ao exportar histórico de movimentações: ' + error.message);
        }
    },

    getTipoDescricao(tipo) {
        switch (tipo) {
            case 'entrada_sus':
                return 'Entrada na Auditoria SUS';
            case 'saida_hospital':
                return 'Saída para o Hospital';
            default:
                return 'Tipo Desconhecido';
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
window.Exports = Exports;

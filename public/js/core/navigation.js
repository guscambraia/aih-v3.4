
// Módulo de navegação entre telas
const Navigation = {
    // Mostrar tela específica
    mostrarTela(telaId) {
        try {
            // Esconder todas as telas
            document.querySelectorAll('.tela').forEach(tela => {
                tela.classList.remove('ativa');
            });
            
            // Mostrar tela solicitada
            const telaAlvo = document.getElementById(telaId);
            if (telaAlvo) {
                telaAlvo.classList.add('ativa');
                console.log(`Navegou para tela: ${telaId}`);
            } else {
                console.error(`Tela não encontrada: ${telaId}`);
            }
        } catch (error) {
            console.error('Erro ao navegar para tela:', error);
        }
    },

    // Voltar para tela principal (dashboard)
    voltarTelaPrincipal() {
        this.mostrarTela('telaPrincipal');
        // Aguardar renderização e carregar dashboard
        setTimeout(() => {
            if (window.Dashboard && window.Dashboard.carregar) {
                window.Dashboard.carregar();
            }
        }, 100);
    },

    // Voltar para tela anterior
    voltarTelaAnterior() {
        try {
            if (AppState.telaAnterior) {
                this.mostrarTela(AppState.telaAnterior);

                // Lógica específica baseada na tela anterior
                if (AppState.telaAnterior === 'telaMovimentacao') {
                    // Recarregar dados de movimentação
                    setTimeout(() => {
                        if (window.Movimentacao && window.Movimentacao.carregarDados) {
                            window.Movimentacao.carregarDados();
                        }
                    }, 100);
                } else if (AppState.telaAnterior === 'telaInfoAIH' && AppState.aihAtual) {
                    // Recarregar AIH atualizada
                    ApiService.buscarAIH(AppState.aihAtual.numero_aih)
                        .then(aih => {
                            AppState.setAihAtual(aih);
                            if (window.InfoAIH && window.InfoAIH.mostrar) {
                                window.InfoAIH.mostrar(aih);
                            }
                        })
                        .catch(err => {
                            console.error('Erro ao recarregar AIH:', err);
                            this.mostrarTela(AppState.telaAnterior);
                        });
                }
            } else {
                // Se não há tela anterior, voltar ao dashboard
                console.log('Nenhuma tela anterior definida, voltando ao dashboard');
                this.voltarTelaPrincipal();
            }
        } catch (error) {
            console.error('Erro ao voltar para tela anterior:', error);
            // Fallback: sempre tentar voltar ao dashboard
            this.voltarTelaPrincipal();
        }
    },

    // Navegar para tela com contexto
    irPara(telaId, configurarContexto = null) {
        // Salvar tela atual como anterior
        const telaAtual = document.querySelector('.tela.ativa');
        if (telaAtual) {
            AppState.setTelaAnterior(telaAtual.id);
        }

        // Mostrar nova tela
        this.mostrarTela(telaId);

        // Configurar contexto se fornecido
        if (configurarContexto && typeof configurarContexto === 'function') {
            setTimeout(configurarContexto, 100);
        }
    },

    // Atalhos para telas específicas
    irParaInformarAIH() {
        this.mostrarTela('telaInformarAIH');
    },

    irParaBuscar() {
        this.mostrarTela('telaPesquisa');
    },

    irParaConfiguracoes() {
        this.mostrarTela('telaConfiguracoes');
        // Carregar dados de configurações
        setTimeout(() => {
            if (window.Configuracoes && window.Configuracoes.carregar) {
                window.Configuracoes.carregar();
            }
        }, 100);
    },

    irParaRelatorios() {
        this.mostrarTela('telaRelatorios');
        document.getElementById('resultadoRelatorio').innerHTML = '';
    },

    // Navegação com AIH
    irParaInfoAIH(aih) {
        AppState.setAihAtual(aih);
        this.mostrarTela('telaInfoAIH');
        
        if (window.InfoAIH && window.InfoAIH.mostrar) {
            window.InfoAIH.mostrar(aih);
        }
    },

    irParaMovimentacao() {
        AppState.setTelaAnterior('telaInfoAIH');
        this.mostrarTela('telaMovimentacao');
        
        setTimeout(() => {
            if (window.Movimentacao && window.Movimentacao.carregarDados) {
                window.Movimentacao.carregarDados();
            }
        }, 100);
    },

    irParaPendencias() {
        AppState.setTelaAnterior('telaMovimentacao');
        this.mostrarTela('telaPendencias');
        
        setTimeout(() => {
            if (window.Glosas && window.Glosas.carregar) {
                window.Glosas.carregar();
            }
        }, 100);
    },

    // Logout
    logout() {
        AppState.clear();
        this.mostrarTela('telaLogin');
    }
};

// Exportar para uso global
window.Navigation = Navigation;

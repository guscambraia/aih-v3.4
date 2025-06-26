// Módulo de navegação centralizado
const Navigation = {
    telaAnterior: null,

    init() {
        try {
            this.setupEventListeners();
            Logger.moduleLoad('Navigation', true);
        } catch (error) {
            Logger.moduleLoad('Navigation', false, error);
        }
    },

    // Configurar event listeners para navegação
    setupEventListeners() {
        try {
            // Botões de voltar
            document.querySelectorAll('.btn-voltar').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.voltarTelaAnterior();
                });
            });

            // Botão home
            const btnHome = document.getElementById('btnHome');
            if (btnHome) {
                btnHome.addEventListener('click', () => {
                    this.voltarTelaPrincipal();
                });
                Logger.debug('Navigation', 'Event listener do botão home configurado');
            } else {
                Logger.warn('Navigation', 'Botão home não encontrado');
            }
        } catch (error) {
            Logger.error('Navigation', 'Erro ao configurar event listeners', error);
        }
    },

    // Função principal para mostrar telas
    mostrarTela(telaId) {
        const telaAtual = this.obterTelaAtual();

        try {
            Logger.navigation('mostrarTela', telaAtual, telaId);

            // Validar se a tela existe
            const telaSolicitada = document.getElementById(telaId);
            if (!telaSolicitada) {
                Logger.error('Navigation', `Tela não encontrada: ${telaId}`);
                return false;
            }

            // Ocultar todas as telas
            document.querySelectorAll('.tela').forEach(tela => {
                tela.classList.remove('ativa');
            });

            // Mostrar tela solicitada
            telaSolicitada.classList.add('ativa');
            Logger.info('Navigation', `Navegação bem-sucedida para: ${telaId}`);

            // Executar callbacks específicos da tela
            this.executarCallbackTela(telaId);

            return true;
        } catch (error) {
            Logger.error('Navigation', `Erro na navegação para ${telaId}`, error);
            return false;
        }
    },

    // Obter tela atual
    obterTelaAtual() {
        const telaAtiva = document.querySelector('.tela.ativa');
        return telaAtiva ? telaAtiva.id : 'nenhuma';
    },

    // Executar callbacks específicos para cada tela
    executarCallbackTela(telaId) {
        Logger.debug('Navigation', `Executando callback para tela: ${telaId}`);

        try {
            switch(telaId) {
                case 'telaPrincipal':
                    if (window.Dashboard && typeof window.Dashboard.carregar === 'function') {
                        setTimeout(() => {
                            try {
                                window.Dashboard.carregar();
                                Logger.debug('Navigation', 'Dashboard.carregar executado');
                            } catch (error) {
                                Logger.error('Navigation', 'Erro ao executar Dashboard.carregar', error);
                            }
                        }, 100);
                    } else {
                        Logger.warn('Navigation', 'Dashboard não disponível ou método carregar não existe');
                    }
                    break;

                case 'telaMovimentacao':
                    if (window.Movements && typeof window.Movements.carregarDados === 'function') {
                        setTimeout(() => {
                            try {
                                window.Movements.carregarDados();
                                Logger.debug('Navigation', 'Movements.carregarDados executado');
                            } catch (error) {
                                Logger.error('Navigation', 'Erro ao executar Movements.carregarDados', error);
                            }
                        }, 100);
                    } else {
                        Logger.warn('Navigation', 'Movements não disponível ou método carregarDados não existe');
                    }
                    break;

                case 'telaPendencias':
                    if (window.Glosas && typeof window.Glosas.carregar === 'function') {
                        setTimeout(() => {
                            try {
                                window.Glosas.carregar();
                                Logger.debug('Navigation', 'Glosas.carregar executado');
                            } catch (error) {
                                Logger.error('Navigation', 'Erro ao executar Glosas.carregar', error);
                            }
                        }, 100);
                    } else {
                        Logger.warn('Navigation', 'Glosas não disponível ou método carregar não existe');
                    }
                    break;

                default:
                    Logger.debug('Navigation', `Nenhum callback específico para tela: ${telaId}`);
            }
        } catch (error) {
            Logger.error('Navigation', `Erro ao executar callback para ${telaId}`, error);
        }
    },

    // Voltar para tela principal
    voltarTelaPrincipal() {
        const telaAtual = this.obterTelaAtual();
        Logger.navigation('voltarTelaPrincipal', telaAtual, 'telaPrincipal');
        this.mostrarTela('telaPrincipal');
    },

    // Voltar para tela anterior
    voltarTelaAnterior() {
        const telaAtual = this.obterTelaAtual();

        if (this.telaAnterior) {
            Logger.navigation('voltarTelaAnterior', telaAtual, this.telaAnterior);
            const telaDestino = this.telaAnterior;
            this.telaAnterior = null;
            this.mostrarTela(telaDestino);
        } else {
            Logger.warn('Navigation', 'Nenhuma tela anterior definida, voltando ao dashboard');
            this.voltarTelaPrincipal();
        }
    },

    // Definir tela anterior
    setTelaAnterior(telaId) {
        Logger.debug('Navigation', `Definindo tela anterior: ${telaId}`);
        this.telaAnterior = telaId;
    },

    // Ir para movimentação
    irParaMovimentacao() {
        Logger.debug('Navigation', 'Tentando ir para movimentação');

        if (!AppState.aihAtual) {
            Logger.warn('Navigation', 'Tentativa de ir para movimentação sem AIH selecionada');
            alert('Nenhuma AIH selecionada');
            return false;
        }

        this.telaAnterior = 'telaInfoAIH';
        Logger.info('Navigation', `Indo para movimentação - AIH: ${AppState.aihAtual.numero_aih}`);
        return this.mostrarTela('telaMovimentacao');
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

// Módulo de estado centralizado da aplicação
const AppState = {
    // Estado da aplicação
    state: {
        token: localStorage.getItem('token'),
        usuario: null,
        admin: null,
        aihAtual: null,
        telaAnterior: null,
        glosasPendentes: [],
        proximoTipoMovimentacao: null
    },

    // Inicializar
    init() {
        try {
            this.carregarEstado();
            Logger.moduleLoad('AppState', true);
        } catch (error) {
            Logger.moduleLoad('AppState', false, error);
        }
    },

    // Carregar estado do localStorage
    carregarEstado() {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        
        if (token) {
            this.state.token = token;
        }

        Logger.debug('AppState', 'Estado carregado', { token: !!token, userType });
    },

    // Getters
    get token() { return this.state.token; },
    get usuario() { return this.state.usuario; },
    get admin() { return this.state.admin; },
    get aihAtual() { return this.state.aihAtual; },
    get telaAnterior() { return this.state.telaAnterior; },
    get glosasPendentes() { return this.state.glosasPendentes; },
    get proximoTipoMovimentacao() { return this.state.proximoTipoMovimentacao; },

    // Setters com logs
    setToken(token) {
        this.state.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
        Logger.debug('AppState', 'Token atualizado', { hasToken: !!token });
    },

    setUsuario(usuario) {
        this.state.usuario = usuario;
        Logger.debug('AppState', 'Usuário definido', { nome: usuario?.nome });
    },

    setAdmin(admin) {
        this.state.admin = admin;
        Logger.debug('AppState', 'Admin definido', { usuario: admin?.usuario });
    },

    setAihAtual(aih) {
        this.state.aihAtual = aih;
        Logger.debug('AppState', 'AIH atual definida', { numero: aih?.numero_aih, status: aih?.status });
    },

    setTelaAnterior(tela) {
        this.state.telaAnterior = tela;
        Logger.debug('AppState', 'Tela anterior definida', { tela });
    },

    setGlosasPendentes(glosas) {
        this.state.glosasPendentes = glosas;
        Logger.debug('AppState', 'Glosas pendentes atualizadas', { quantidade: glosas?.length || 0 });
    },

    setProximoTipoMovimentacao(tipo) {
        this.state.proximoTipoMovimentacao = tipo;
        Logger.debug('AppState', 'Próximo tipo de movimentação definido', { tipo });
    },

    // Limpar estado (logout)
    clear() {
        this.state = {
            token: null,
            usuario: null,
            admin: null,
            aihAtual: null,
            telaAnterior: null,
            glosasPendentes: [],
            proximoTipoMovimentacao: null
        };
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        Logger.info('AppState', 'Estado limpo (logout)');
    },

    // Debug - obter estado completo
    getDebugInfo() {
        return {
            hasToken: !!this.state.token,
            hasUsuario: !!this.state.usuario,
            hasAdmin: !!this.state.admin,
            hasAIH: !!this.state.aihAtual,
            telaAnterior: this.state.telaAnterior,
            glosasPendentes: this.state.glosasPendentes?.length || 0,
            proximoTipo: this.state.proximoTipoMovimentacao
        };
    }
};

// Exportar para uso global
window.AppState = AppState;

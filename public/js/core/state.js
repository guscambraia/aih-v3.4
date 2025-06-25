
// Estado centralizado da aplicação
const AppState = {
    // Estado atual
    data: {
        token: localStorage.getItem('token'),
        usuario: null,
        aihAtual: null,
        telaAnterior: null,
        glosasPendentes: []
    },

    // Getters
    get token() { return this.data.token; },
    get usuario() { return this.data.usuario; },
    get aihAtual() { return this.data.aihAtual; },
    get telaAnterior() { return this.data.telaAnterior; },
    get glosasPendentes() { return this.data.glosasPendentes; },

    // Setters com validação
    setToken(token) {
        this.data.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    },

    setUsuario(usuario) {
        this.data.usuario = usuario;
    },

    setAihAtual(aih) {
        this.data.aihAtual = aih;
    },

    setTelaAnterior(tela) {
        this.data.telaAnterior = tela;
    },

    setGlosasPendentes(glosas) {
        this.data.glosasPendentes = glosas;
    },

    // Limpar estado (logout)
    clear() {
        this.data = {
            token: null,
            usuario: null,
            aihAtual: null,
            telaAnterior: null,
            glosasPendentes: []
        };
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
    },

    // Estado de admin
    admin: null,
    setAdmin(admin) {
        this.admin = admin;
    }
};

// Exportar para uso global
window.AppState = AppState;

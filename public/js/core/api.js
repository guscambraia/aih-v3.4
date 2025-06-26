
// Módulo centralizado de comunicação com a API
const ApiService = {
    // Função principal de requisição
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        const startTime = Date.now();
        
        Logger.debug('API', `Iniciando requisição: ${method} ${endpoint}`);
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(AppState.token && { 'Authorization': `Bearer ${AppState.token}` }),
                ...options.headers
            }
        };

        try {
            const response = await fetch(`/api${endpoint}`, config);
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                Logger.warn('API', `Resposta não OK: ${response.status} ${method} ${endpoint} (${duration}ms)`);
                
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { error: `HTTP ${response.status}` };
                }
                
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const data = await response.json();
            Logger.debug('API', `Requisição bem-sucedida: ${method} ${endpoint} (${duration}ms)`);
            
            return data;
        } catch (err) {
            const duration = Date.now() - startTime;
            Logger.error('API', `Erro na requisição: ${method} ${endpoint} (${duration}ms)`, err);
            throw err;
        }
    },

    // Métodos HTTP específicos
    async get(endpoint, params = {}) {
        const queryString = Object.keys(params).length > 0 
            ? '?' + new URLSearchParams(params).toString() 
            : '';
        return this.request(`${endpoint}${queryString}`);
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Métodos específicos do sistema
    async login(nome, senha) {
        const result = await this.post('/login', { nome, senha });
        AppState.setToken(result.token);
        AppState.setUsuario(result.usuario);
        localStorage.setItem('userType', 'user');
        return result;
    },

    async loginAdmin(usuario, senha) {
        const result = await this.post('/admin/login', { usuario, senha });
        AppState.setToken(result.token);
        AppState.setAdmin(result.admin);
        localStorage.setItem('userType', 'admin');
        return result;
    },

    async buscarAIH(numero) {
        const aih = await this.get(`/aih/${numero}`);
        AppState.setAihAtual(aih);
        return aih;
    },

    async cadastrarAIH(dados) {
        return this.post('/aih', dados);
    },

    async criarMovimentacao(aihId, dados) {
        return this.post(`/aih/${aihId}/movimentacao`, dados);
    },

    async carregarGlosas(aihId) {
        const response = await this.get(`/aih/${aihId}/glosas`);
        AppState.setGlosasPendentes(response.glosas);
        return response;
    },

    async adicionarGlosa(aihId, dados) {
        return this.post(`/aih/${aihId}/glosas`, dados);
    },

    async removerGlosa(glosaId) {
        return this.delete(`/glosas/${glosaId}`);
    },

    async carregarDashboard(competencia = null) {
        const params = competencia ? { competencia } : {};
        return this.get('/dashboard', params);
    },

    async pesquisar(filtros) {
        return this.post('/pesquisar', { filtros });
    },

    async carregarProfissionais() {
        return this.get('/profissionais');
    },

    async gerarRelatorio(tipo, filtros = {}) {
        return this.post(`/relatorios/${tipo}`, filtros);
    }
};

// Exportar para uso global
window.ApiService = ApiService;

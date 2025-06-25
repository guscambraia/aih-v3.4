
const Login = {
    // Inicializar eventos de login
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Login normal
        document.getElementById('formLogin').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Link para gerenciar usuários
        document.getElementById('linkGerenciarUsuarios').addEventListener('click', (e) => {
            e.preventDefault();
            Navigation.mostrarTela('telaAdminUsuarios');
        });

        // Voltar para login
        document.getElementById('linkVoltarLogin').addEventListener('click', (e) => {
            e.preventDefault();
            Navigation.mostrarTela('telaLogin');
        });

        // Login de administrador
        document.getElementById('formLoginAdmin').addEventListener('submit', (e) => {
            this.handleLoginAdmin(e);
        });
    },

    async handleLogin(e) {
        e.preventDefault();

        try {
            const nome = document.getElementById('loginUsuario').value;
            const senha = document.getElementById('loginSenha').value;

            const result = await API.call('/login', {
                method: 'POST',
                body: JSON.stringify({ nome, senha })
            });

            AppState.setToken(result.token);
            AppState.setUsuario(result.usuario);
            AppState.setAdmin(null); // Limpar admin
            localStorage.setItem('token', result.token);
            localStorage.setItem('userType', 'user');

            document.getElementById('nomeUsuario').textContent = result.usuario.nome;
            Navigation.mostrarTela('telaPrincipal');
            
            // Carregar dashboard
            setTimeout(() => {
                if (window.Dashboard && window.Dashboard.carregar) {
                    window.Dashboard.carregar();
                }
            }, 100);
        } catch (err) {
            alert('Erro no login: ' + err.message);
        }
    },

    async handleLoginAdmin(e) {
        e.preventDefault();

        try {
            const usuario = document.getElementById('adminUsuario').value;
            const senha = document.getElementById('adminSenha').value;

            const result = await API.call('/admin/login', {
                method: 'POST',
                body: JSON.stringify({ usuario, senha })
            });

            AppState.setToken(result.token);
            AppState.setAdmin(result.admin);
            AppState.setUsuario(null); // Limpar usuário normal
            localStorage.setItem('token', result.token);
            localStorage.setItem('userType', 'admin');

            Navigation.mostrarTela('telaGestaoUsuarios');
            
            // Carregar usuários
            setTimeout(() => {
                if (window.AdminUsuarios && window.AdminUsuarios.carregar) {
                    window.AdminUsuarios.carregar();
                }
            }, 100);
        } catch (err) {
            alert('Erro no login de administrador: ' + err.message);
        }
    },

    // Logout
    logout() {
        AppState.clear();
        Navigation.mostrarTela('telaLogin');
    }
};

// Disponibilizar globalmente
window.Login = Login;

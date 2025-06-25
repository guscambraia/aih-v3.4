
// Módulo de Configurações
const Config = {
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Formulário de novo profissional
        document.getElementById('formNovoProfissional').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarProfissional();
        });

        // Formulário de novo tipo de glosa
        document.getElementById('formNovoTipoGlosa').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarTipoGlosa();
        });

        // Formulário de novo usuário (se admin)
        const formNovoUsuario = document.getElementById('formNovoUsuario');
        if (formNovoUsuario) {
            formNovoUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                this.adicionarUsuario();
            });
        }

        // Formulário de alterar senha admin
        const formAlterarSenha = document.getElementById('formAlterarSenhaAdmin');
        if (formAlterarSenha) {
            formAlterarSenha.addEventListener('submit', (e) => {
                e.preventDefault();
                this.alterarSenhaAdmin();
            });
        }
    },

    async carregar() {
        try {
            await Promise.all([
                this.carregarProfissionais(),
                this.carregarTiposGlosa()
            ]);

            // Carregar dados de admin se for admin
            if (AppState.usuario && AppState.usuario.is_admin) {
                await this.carregarUsuarios();
            }
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
            Helpers.mostrarToast('Erro ao carregar configurações', 'error');
        }
    },

    async carregarProfissionais() {
        try {
            const response = await API.call('/profissionais');
            const container = document.getElementById('listaProfissionais');

            container.innerHTML = response.profissionais.map(prof => `
                <div class="config-item">
                    <span><strong>${prof.nome}</strong> - ${prof.especialidade}</span>
                    <button onclick="Config.excluirProfissional(${prof.id}, '${prof.nome}')" 
                            class="btn-danger btn-pequeno">
                        Excluir
                    </button>
                </div>
            `).join('') || '<p class="sem-dados">Nenhum profissional cadastrado</p>';
        } catch (err) {
            console.error('Erro ao carregar profissionais:', err);
        }
    },

    async adicionarProfissional() {
        try {
            const dados = {
                nome: document.getElementById('profNome').value.trim(),
                especialidade: document.getElementById('profEspecialidade').value
            };

            // Validar dados
            if (!dados.nome) {
                Helpers.mostrarToast('Nome é obrigatório', 'error');
                return;
            }

            await API.call('/profissionais', {
                method: 'POST',
                body: JSON.stringify(dados)
            });

            Helpers.mostrarToast('Profissional adicionado com sucesso!', 'success');
            document.getElementById('formNovoProfissional').reset();
            this.carregarProfissionais();
        } catch (err) {
            console.error('Erro ao adicionar profissional:', err);
            Helpers.mostrarToast('Erro ao adicionar profissional: ' + err.message, 'error');
        }
    },

    async excluirProfissional(id, nome) {
        const confirmar = await Modal.confirmar(
            'Excluir Profissional',
            `Tem certeza que deseja excluir o profissional "${nome}"?`
        );

        if (!confirmar) return;

        try {
            await API.call(`/profissionais/${id}`, { method: 'DELETE' });
            Helpers.mostrarToast('Profissional excluído com sucesso!', 'success');
            this.carregarProfissionais();
        } catch (err) {
            console.error('Erro ao excluir profissional:', err);
            Helpers.mostrarToast('Erro ao excluir profissional: ' + err.message, 'error');
        }
    },

    async carregarTiposGlosa() {
        try {
            const response = await API.call('/tipos-glosa');
            const container = document.getElementById('listaTiposGlosa');

            container.innerHTML = response.tipos.map(tipo => `
                <div class="config-item">
                    <span>${tipo.descricao}</span>
                    <button onclick="Config.excluirTipoGlosa(${tipo.id}, '${tipo.descricao}')" 
                            class="btn-danger btn-pequeno">
                        Excluir
                    </button>
                </div>
            `).join('') || '<p class="sem-dados">Nenhum tipo de glosa cadastrado</p>';
        } catch (err) {
            console.error('Erro ao carregar tipos de glosa:', err);
        }
    },

    async adicionarTipoGlosa() {
        try {
            const descricao = document.getElementById('tipoGlosaDescricao').value.trim();

            if (!descricao) {
                Helpers.mostrarToast('Descrição é obrigatória', 'error');
                return;
            }

            await API.call('/tipos-glosa', {
                method: 'POST',
                body: JSON.stringify({ descricao })
            });

            Helpers.mostrarToast('Tipo de glosa adicionado com sucesso!', 'success');
            document.getElementById('formNovoTipoGlosa').reset();
            this.carregarTiposGlosa();
        } catch (err) {
            console.error('Erro ao adicionar tipo de glosa:', err);
            Helpers.mostrarToast('Erro ao adicionar tipo de glosa: ' + err.message, 'error');
        }
    },

    async excluirTipoGlosa(id, descricao) {
        const confirmar = await Modal.confirmar(
            'Excluir Tipo de Glosa',
            `Tem certeza que deseja excluir o tipo "${descricao}"?`
        );

        if (!confirmar) return;

        try {
            await API.call(`/tipos-glosa/${id}`, { method: 'DELETE' });
            Helpers.mostrarToast('Tipo de glosa excluído com sucesso!', 'success');
            this.carregarTiposGlosa();
        } catch (err) {
            console.error('Erro ao excluir tipo de glosa:', err);
            Helpers.mostrarToast('Erro ao excluir tipo de glosa: ' + err.message, 'error');
        }
    },

    async carregarUsuarios() {
        try {
            const response = await API.call('/admin/usuarios');
            const container = document.getElementById('listaUsuarios');

            if (container) {
                container.innerHTML = response.usuarios.map(u => `
                    <div class="config-item">
                        <div>
                            <strong>${u.nome}</strong> - Matrícula: ${u.matricula}
                            <br>
                            <small class="text-muted">
                                Cadastrado em: ${Formatters.formatarData(u.criado_em)}
                            </small>
                        </div>
                        <button onclick="Config.excluirUsuario(${u.id}, '${u.nome}')" 
                                class="btn-danger btn-pequeno">
                            Excluir
                        </button>
                    </div>
                `).join('') || '<p class="sem-dados">Nenhum usuário cadastrado</p>';
            }
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
        }
    },

    async adicionarUsuario() {
        try {
            const dados = {
                nome: document.getElementById('novoUsuarioNome').value.trim(),
                matricula: document.getElementById('novoUsuarioMatricula').value.trim(),
                senha: document.getElementById('novoUsuarioSenha').value
            };

            // Validar dados
            const erros = Validators.validarFormulario(dados, {
                nome: { obrigatorio: true, nome: 'Nome', minimo: 3 },
                matricula: { obrigatorio: true, nome: 'Matrícula', minimo: 3 },
                senha: { obrigatorio: true, nome: 'Senha', minimo: 4 }
            });

            if (erros.length > 0) {
                Helpers.mostrarToast(erros[0], 'error');
                return;
            }

            await API.call('/admin/usuarios', {
                method: 'POST',
                body: JSON.stringify(dados)
            });

            Helpers.mostrarToast('Usuário cadastrado com sucesso!', 'success');
            document.getElementById('formNovoUsuario').reset();
            this.carregarUsuarios();
        } catch (err) {
            console.error('Erro ao cadastrar usuário:', err);
            Helpers.mostrarToast('Erro ao cadastrar usuário: ' + err.message, 'error');
        }
    },

    async excluirUsuario(id, nome) {
        const confirmar = await Modal.confirmar(
            'Excluir Usuário',
            `Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`
        );

        if (!confirmar) return;

        try {
            await API.call(`/admin/usuarios/${id}`, { method: 'DELETE' });
            Helpers.mostrarToast('Usuário excluído com sucesso!', 'success');
            this.carregarUsuarios();
        } catch (err) {
            console.error('Erro ao excluir usuário:', err);
            Helpers.mostrarToast('Erro ao excluir usuário: ' + err.message, 'error');
        }
    },

    async alterarSenhaAdmin() {
        try {
            const novaSenha = document.getElementById('novaSenhaAdmin').value;
            const confirmarSenha = document.getElementById('confirmarSenhaAdmin').value;

            if (novaSenha !== confirmarSenha) {
                Helpers.mostrarToast('As senhas não coincidem!', 'error');
                return;
            }

            if (novaSenha.length < 4) {
                Helpers.mostrarToast('A senha deve ter pelo menos 4 caracteres!', 'error');
                return;
            }

            const confirmar = await Modal.confirmar(
                'Alterar Senha',
                'Tem certeza que deseja alterar a senha do administrador?'
            );

            if (!confirmar) return;

            await API.call('/admin/alterar-senha', {
                method: 'POST',
                body: JSON.stringify({ novaSenha })
            });

            Helpers.mostrarToast('Senha alterada com sucesso!', 'success');
            document.getElementById('formAlterarSenhaAdmin').reset();
        } catch (err) {
            console.error('Erro ao alterar senha:', err);
            Helpers.mostrarToast('Erro ao alterar senha: ' + err.message, 'error');
        }
    }
};

// Disponibilizar globalmente
window.Config = Config;

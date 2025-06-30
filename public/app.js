// Estado da aplicação
let state = {
    token: localStorage.getItem('token'),
    usuario: null,
    aihAtual: null,
    telaAnterior: null,
    glosasPendentes: []
};

// Verificar se há token válido ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    if (state.token) {
        try {
            // Tentar validar o token fazendo uma requisição simples
            const userType = localStorage.getItem('userType');

            if (userType === 'admin') {
                // Para admin, ir direto para tela de gestão
                mostrarTela('telaGestaoUsuarios');
                carregarUsuarios();
            } else {
                // Para usuário normal, validar token e ir para dashboard
                await carregarDashboard();
                mostrarTela('telaPrincipal');
            }
        } catch (err) {
            console.log('Token inválido, redirecionando para login');
            state.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            mostrarTela('telaLogin');
        }
    } else {
        mostrarTela('telaLogin');
    }
});

// API Helper
const api = async (endpoint, options = {}) => {
    const config = {
        method: 'GET',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
            ...options.headers
        }
    };

    try {
        const response = await fetch(`/api${endpoint}`, config);

        // Verificar se a resposta é JSON válida
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Resposta não é JSON:', text);
            throw new Error('Resposta inválida do servidor');
        }

        if (!response.ok) {
            throw new Error(data.error || `Erro HTTP ${response.status}`);
        }

        return data;
    } catch (err) {
        console.error('Erro API:', err);
        throw err;
    }
};

// Navegação
const mostrarTela = (telaId) => {
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('ativa');
    });
    document.getElementById(telaId).classList.add('ativa');
};

const voltarTelaPrincipal = () => {
    mostrarTela('telaPrincipal');
    carregarDashboard();
};

const voltarTelaAnterior = () => {
    try {
        if (state.telaAnterior) {
            mostrarTela(state.telaAnterior);

            // Se voltando para tela de movimentação, recarregar dados para atualizar glosas
            if (state.telaAnterior === 'telaMovimentacao') {
                // Usar setTimeout para garantir que a tela foi renderizada
                setTimeout(() => {
                    carregarDadosMovimentacao();
                }, 100);
            }
            // Se voltando para tela de informações AIH, recarregar AIH atualizada
            else if (state.telaAnterior === 'telaInfoAIH' && state.aihAtual) {
                api(`/aih/${state.aihAtual.numero_aih}`)
                    .then(aih => {
                        state.aihAtual = aih;
                        mostrarInfoAIH(aih);
                    })
                    .catch(err => {
                        console.error('Erro ao recarregar AIH:', err);
                        // Se der erro, pelo menos mostrar a tela anterior
                        mostrarTela(state.telaAnterior);
                    });
            }
        } else {
            // Se não há tela anterior, voltar ao dashboard
            console.log('Nenhuma tela anterior definida, voltando ao dashboard');
            mostrarTela('telaPrincipal');
            carregarDashboard();
        }
    } catch (error) {
        console.error('Erro ao voltar para tela anterior:', error);
        // Fallback: sempre tentar voltar ao dashboard
        mostrarTela('telaPrincipal');
        carregarDashboard();
    }
};

// Modal
const mostrarModal = (titulo, mensagem) => {
    return new Promise((resolve) => {
        const modalTitulo = document.getElementById('modalTitulo');
        const modalMensagem = document.getElementById('modalMensagem');
        const modal = document.getElementById('modal');
        const btnSim = document.getElementById('modalBtnSim');
        const btnNao = document.getElementById('modalBtnNao');

        if (!modalTitulo || !modalMensagem || !modal || !btnSim || !btnNao) {
            console.error('Elementos do modal não encontrados. Usando confirm nativo.');
            resolve(confirm(`${titulo}\n\n${mensagem}`));
            return;
        }

        modalTitulo.textContent = titulo;
        modalMensagem.textContent = mensagem;
        modal.classList.add('ativo');

        const fecharModal = (resultado) => {
            modal.classList.remove('ativo');
            btnSim.removeEventListener('click', simHandler);
            btnNao.removeEventListener('click', naoHandler);
            resolve(resultado);
        };

        const simHandler = () => fecharModal(true);
        const naoHandler = () => fecharModal(false);

        btnSim.addEventListener('click', simHandler);
        btnNao.addEventListener('click', naoHandler);
    });
};

// Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
        submitButton.textContent = 'Entrando...';
        submitButton.disabled = true;

        const nome = document.getElementById('loginUsuario').value.trim();
        const senha = document.getElementById('loginSenha').value;

        if (!nome || !senha) {
            throw new Error('Por favor, preencha todos os campos');
        }

        const result = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ nome, senha })
        });

        if (result && result.token && result.usuario) {
            state.token = result.token;
            state.usuario = result.usuario;
            state.admin = null; // Limpar admin
            localStorage.setItem('token', result.token);
            localStorage.setItem('userType', 'user');

            // Atualizar interface
            const nomeUsuarioElement = document.getElementById('nomeUsuario');
            if (nomeUsuarioElement) {
                nomeUsuarioElement.textContent = result.usuario.nome;
            }

            console.log('Login realizado com sucesso:', result.usuario.nome);

            // Redirecionar para tela principal
            mostrarTela('telaPrincipal');
            await carregarDashboard();
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (err) {
        console.error('Erro no login:', err);
        alert('Erro no login: ' + err.message);
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Link para gerenciar usuários
document.getElementById('linkGerenciarUsuarios').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarTela('telaAdminUsuarios');
});

// Voltar para login
document.getElementById('linkVoltarLogin').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarTela('telaLogin');
});

// Login de administrador
document.getElementById('formLoginAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
        submitButton.textContent = 'Entrando...';
        submitButton.disabled = true;

        const usuario = document.getElementById('adminUsuario').value.trim();
        const senha = document.getElementById('adminSenha').value;

        if (!usuario || !senha) {
            throw new Error('Por favor, preencha todos os campos');
        }

        const result = await api('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ usuario, senha })
        });

        if (result && result.token && result.admin) {
            state.token = result.token;
            state.admin = result.admin;
            state.usuario = null; // Limpar usuário normal
            localStorage.setItem('token', result.token);
            localStorage.setItem('userType', 'admin');

            console.log('Login de admin realizado com sucesso');

            mostrarTela('telaGestaoUsuarios');
            await carregarUsuarios();
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (err) {
        console.error('Erro no login de administrador:', err);
        alert('Erro no login de administrador: ' + err.message);
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Voltar para login principal
window.voltarLogin = () => {
    state.token = null;
    state.admin = null;
    state.usuario = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    mostrarTela('telaLogin');
};

// Carregar lista de usuários
const carregarUsuarios = async () => {
    try {
        const response = await api('/admin/usuarios');
        const container = document.getElementById('listaUsuarios');

        if (response && response.usuarios && Array.isArray(response.usuarios)) {
            container.innerHTML = response.usuarios.map(u => `
                <div class="glosa-item">
                    <div>
                        <strong>${u.nome}</strong> - Matrícula: ${u.matricula}
                        <br>
                        <span style="color: #64748b; font-size: 0.875rem;">
                            Cadastrado em: ${new Date(u.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    <button onclick="excluirUsuario(${u.id}, '${u.nome}')" class="btn-danger" style="padding: 0.5rem 1rem;">
                        Excluir
                    </button>
                </div>
            `).join('') || '<p>Nenhum usuário cadastrado</p>';
        } else {
            container.innerHTML = '<p>Erro ao carregar usuários</p>';
        }
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        const container = document.getElementById('listaUsuarios');
        if (container) {
            container.innerHTML = '<p>Erro ao carregar usuários. Tente novamente.</p>';
        }
    }
};

// Excluir usuário
window.excluirUsuario = async (id, nome) => {
    const confirmar = await mostrarModal(
        'Excluir Usuário',
        `Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    try {
        await api(`/admin/usuarios/${id}`, { method: 'DELETE' });
        alert('Usuário excluído com sucesso!');
        carregarUsuarios();
    } catch (err) {
        alert('Erro ao excluir usuário: ' + err.message);
    }
};

// Adicionar novo usuário
document.getElementById('formNovoUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const dados = {
            nome: document.getElementById('novoUsuarioNome').value,
            matricula: document.getElementById('novoUsuarioMatricula').value,
            senha: document.getElementById('novoUsuarioSenha').value
        };

        await api('/admin/usuarios', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('Usuário cadastrado com sucesso!');
        document.getElementById('formNovoUsuario').reset();
        carregarUsuarios();
    } catch (err) {
        alert('Erro ao cadastrar usuário: ' + err.message);
    }
});

// Alterar senha do administrador
document.getElementById('formAlterarSenhaAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaSenha = document.getElementById('novaSenhaAdmin').value;
    const confirmarSenha = document.getElementById('confirmarSenhaAdmin').value;

    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    if (novaSenha.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return;
    }

    const confirmar = await mostrarModal(
        'Alterar Senha',
        'Tem certeza que deseja alterar a senha do administrador?'
    );

    if (!confirmar) return;

    try {
        await api('/admin/alterar-senha', {
            method: 'POST',
            body: JSON.stringify({ novaSenha })
        });

        alert('Senha do administrador alterada com sucesso!');
        document.getElementById('formAlterarSenhaAdmin').reset();
    } catch (err) {
        alert('Erro ao alterar senha: ' + err.message);
    }
});

// Logout
document.getElementById('btnSair').addEventListener('click', () => {
    state.token = null;
    state.usuario = null;
    state.admin = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    mostrarTela('telaLogin');
});

// Helpers
const getStatusDescricao = (status) => {
    const descricoes = {
        1: '✅ Finalizada - Aprovação Direta (SUS aprovado)',
        2: '🔄 Ativa - Aprovação Indireta (Aguardando hospital)',
        3: '⚠️ Ativa - Em Discussão (Divergências identificadas)',
        4: '✅ Finalizada - Após Discussão (Resolvida)'
    };
    return descricoes[status] || '❓ Status Desconhecido';
};

// Obter competência atual
const getCompetenciaAtual = () => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
};

// Animar números
const animarNumero = (elementId, valorFinal) => {
    const elemento = document.getElementById(elementId);
    const valorInicial = parseInt(elemento.textContent) || 0;
    const duracao = 1000; // 1 segundo
    const incremento = (valorFinal - valorInicial) / (duracao / 16);
    let valorAtual = valorInicial;

    const timer = setInterval(() => {
        valorAtual += incremento;
        if ((incremento > 0 && valorAtual >= valorFinal) || 
            (incremento < 0 && valorAtual <= valorFinal)) {
            valorAtual = valorFinal;
            clearInterval(timer);
        }
        elemento.textContent = Math.round(valorAtual);
    }, 16);
};

// Dashboard aprimorado com seletor de competência
const carregarDashboard = async (competenciaSelecionada = null) => {
    try {
        // Se não foi passada competência, usar a atual
        const competencia = competenciaSelecionada || getCompetenciaAtual();

        // Buscar dados do dashboard com a competência
        const dados = await api(`/dashboard?competencia=${competencia}`);

        // Criar/atualizar seletor de competência
        let seletorContainer = document.querySelector('.seletor-competencia-container');
        if (!seletorContainer) {
            // Criar container do seletor apenas se não existir
            const dashboardContainer = document.querySelector('.dashboard');
            seletorContainer = document.createElement('div');
            seletorContainer.className = 'seletor-competencia-container';
            dashboardContainer.parentNode.insertBefore(seletorContainer, dashboardContainer);
        }

        // Sempre atualizar o conteúdo do seletor
        seletorContainer.innerHTML = `
            <div class="seletor-competencia">
                <label for="selectCompetencia">Competência:</label>
                <select id="selectCompetencia" onchange="carregarDashboard(this.value)">
                    ${dados.competencias_disponiveis.map(comp => 
                        `<option value="${comp}" ${comp === competencia ? 'selected' : ''}>${comp}</option>`
                    ).join('')}
                </select>
                <span class="competencia-info">📅 Visualizando dados de ${competencia}</span>
            </div>
        `;

        // Atualizar cards do dashboard
        const dashboard = document.querySelector('.dashboard');
        dashboard.innerHTML = `
            <!-- Card 1: Em Processamento na Competência -->
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <h3>Em Processamento</h3>
                <p class="stat-number" id="emProcessamentoCompetencia">${dados.em_processamento_competencia}</p>
                <p class="stat-subtitle">AIHs em análise em ${competencia}</p>
                <p class="stat-detail">Entradas SUS - Saídas Hospital</p>
            </div>

            <!-- Card 2: Finalizadas na Competência -->
            <div class="stat-card success">
                <div class="stat-icon">✅</div>
                <h3>Finalizadas</h3>
                <p class="stat-number" id="finalizadasCompetencia">${dados.finalizadas_competencia}</p>
                <p class="stat-subtitle">AIHs concluídas em ${competencia}</p>
                <p class="stat-detail">Status 1 e 4</p>
            </div>

            <!-- Card 3: Com Pendências na Competência -->
            <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <h3>Com Pendências</h3>
                <p class="stat-number" id="comPendenciasCompetencia">${dados.com_pendencias_competencia}</p>
                <p class="stat-subtitle">AIHs com glosas em ${competencia}</p>
                <p class="stat-detail">Status 2 e 3</p>
            </div>

            <!-- Card 4: Total Geral em Processamento -->
            <div class="stat-card info">
                <div class="stat-icon">🏥</div>
                <h3>Total em Processamento</h3>
                <p class="stat-number" id="totalProcessamentoGeral">${dados.total_em_processamento_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Total: ${dados.total_entradas_sus} entradas - ${dados.total_saidas_hospital} saídas</p>
            </div>

            <!-- Card 5: Total Finalizadas (Histórico Geral) -->
            <div class="stat-card success" style="border-left: 4px solid #10b981;">
                <div class="stat-icon">🎯</div>
                <h3>Total Finalizadas</h3>
                <p class="stat-number" id="totalFinalizadasGeral">${dados.total_finalizadas_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">AIHs concluídas (Status 1 e 4)</p>
            </div>

            <!-- Card 6: Total Geral Cadastradas -->
            <div class="stat-card" style="border-left: 4px solid #6366f1;">
                <div class="stat-icon">📈</div>
                <h3>Total Cadastradas</h3>
                <p class="stat-number" id="totalAIHsGeral">${dados.total_aihs_geral}</p>
                <p class="stat-subtitle">Desde o início do sistema</p>
                <p class="stat-detail">Todas as AIHs do sistema</p>
            </div>
        `;

        // Adicionar seção de resumo financeiro
        const resumoFinanceiro = document.createElement('div');
        resumoFinanceiro.className = 'resumo-financeiro';
        resumoFinanceiro.innerHTML = `
            <h3>💰 Resumo Financeiro - ${competencia}</h3>
            <div class="resumo-cards">
                <div class="resumo-card">
                    <span class="resumo-label">Valor Inicial Total</span>
                    <span class="resumo-valor">R$ ${dados.valores_competencia.inicial.toFixed(2)}</span>
                </div>
                <div class="resumo-card">
                    <span class="resumo-label">Valor Atual Total</span>
                    <span class="resumo-valor">R$ ${dados.valores_competencia.atual.toFixed(2)}</span>
                </div>
                <div class="resumo-card">
                    <span class="resumo-label">Média de Glosas</span>
                    <span class="resumo-valor" style="color: var(--danger)">R$ ${dados.valores_competencia.media_glosa.toFixed(2)}</span>
                </div>
                <div class="resumo-card">
                    <span class="resumo-label">Total de AIHs</span>
                    <span class="resumo-valor">${dados.total_aihs_competencia}</span>
                </div>
            </div>
        `;

        // Adicionar após o dashboard
        const dashboardContainer = document.querySelector('.dashboard');
        const resumoExistente = document.querySelector('.resumo-financeiro');
        if (resumoExistente) {
            resumoExistente.remove();
        }
        dashboardContainer.parentNode.insertBefore(resumoFinanceiro, dashboardContainer.nextSibling);

        // Animar números (opcional)
        animarNumeros();

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        // Mostrar mensagem de erro no dashboard
        document.querySelector('.dashboard').innerHTML = `
            <div class="erro-dashboard">
                <p>⚠️ Erro ao carregar dados do dashboard</p>
                <button onclick="carregarDashboard()">Tentar novamente</button>
            </div>
        `;
    }
};

// Carregar dados para movimentação
const carregarDadosMovimentacao = async () => {
    try {
        // Carregar profissionais para os selects
        const profissionais = await api('/profissionais');

        if (profissionais && profissionais.profissionais) {
            const especialidades = {
                'Medicina': 'movProfMedicina',
                'Enfermagem': 'movProfEnfermagem', 
                'Fisioterapia': 'movProfFisioterapia',
                'Bucomaxilo': 'movProfBucomaxilo'
            };

            // Limpar e preencher selects de profissionais
            Object.entries(especialidades).forEach(([especialidade, selectId]) => {
                const select = document.getElementById(selectId);
                if (select) {
                    // Verificar se existe primeira opção, senão criar
                    const primeiraOpcao = select.querySelector('option');
                    const opcaoInicial = primeiraOpcao ? primeiraOpcao.outerHTML : `<option value="">Selecione - ${especialidade}</option>`;
                    select.innerHTML = opcaoInicial;

                    // Adicionar profissionais da especialidade
                    profissionais.profissionais
                        .filter(p => p.especialidade === especialidade)
                        .forEach(prof => {
                            const option = document.createElement('option');
                            option.value = prof.nome;
                            option.textContent = prof.nome;
                            select.appendChild(option);
                        });
                }
            });
        }

        // Carregar glosas atuais se existirem
        if (state.aihAtual && state.aihAtual.id) {
            const glosas = await api(`/aih/${state.aihAtual.id}/glosas`);

            const listaGlosas = document.getElementById('listaGlosas');
            if (listaGlosas && glosas && glosas.glosas) {
                if (glosas.glosas.length > 0) {
                    listaGlosas.innerHTML = `
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 1rem;">
                            <h5 style="color: #92400e; margin-bottom: 0.5rem;">
                                ⚠️ Glosas Ativas (${glosas.glosas.length})
                            </h5>
                            ${glosas.glosas.map(g => `
                                <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: white; border-radius: 4px;">
                                    <strong>${g.linha}</strong> - ${g.tipo}
                                    <span style="color: #64748b; font-size: 0.875rem; margin-left: 1rem;">
                                        Por: ${g.profissional}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    listaGlosas.innerHTML = `
                        <p style="color: #64748b; font-style: italic;">
                            Nenhuma glosa ativa para esta AIH
                        </p>
                    `;
                }
            }
        }

        // Mostrar status atual da AIH
        const statusAtualDiv = document.getElementById('statusAtualAIH');
        if (statusAtualDiv && state.aihAtual) {
            statusAtualDiv.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="color: #0284c7; margin-bottom: 0.5rem;">📋 Status Atual da AIH</h4>
                    <p style="margin: 0;">
                        <strong>AIH:</strong> ${state.aihAtual.numero_aih} | 
                        <strong>Status:</strong> <span class="status-badge status-${state.aihAtual.status}">${getStatusDescricao(state.aihAtual.status)}</span> | 
                        <strong>Valor Atual:</strong> R$ ${state.aihAtual.valor_atual.toFixed(2)}
                    </p>
                </div>
            `;
        }

        // Mostrar lembrete sobre status
        const lembreteDiv = document.getElementById('lembreteStatus');
        if (lembreteDiv) {
            lembreteDiv.innerHTML = `
                <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h5 style="color: #92400e; margin-bottom: 0.5rem;">💡 Lembrete sobre Status</h5>
                    <ul style="margin: 0; padding-left: 1.5rem; color: #92400e;">
                        <li><strong>Status 1:</strong> Finalizada com aprovação direta</li>
                        <li><strong>Status 2:</strong> Ativa com aprovação indireta</li>
                        <li><strong>Status 3:</strong> Ativa em discussão</li>
                        <li><strong>Status 4:</strong> Finalizada após discussão</li>
                    </ul>
                </div>
            `;
        }

    } catch (err) {
        console.error('Erro ao carregar dados da movimentação:', err);
        alert('Erro ao carregar dados: ' + err.message);
    }
};

// Função auxiliar para animar os números
const animarNumeros = () => {
    const numeros = document.querySelectorAll('.stat-number');
    numeros.forEach(elemento => {
        const valorFinal = parseInt(elemento.textContent);
        let valorAtual = 0;
        const incremento = valorFinal / 30;

        const timer = setInterval(() => {
            valorAtual += incremento;
            if (valorAtual >= valorFinal) {
                valorAtual = valorFinal;
                clearInterval(timer);
            }
            elemento.textContent = Math.round(valorAtual);
        }, 30);
    });
};

// Mostrar informações da AIH
const mostrarInfoAIH = (aih) => {
    const content = document.getElementById('infoAIHContent');

    // Calcular diferença de valor
    const diferencaValor = aih.valor_inicial - aih.valor_atual;
    const percentualDiferenca = ((diferencaValor / aih.valor_inicial) * 100).toFixed(1);
    const valorGlosas = aih.valor_inicial - aih.valor_atual;

    content.innerHTML = `
        <div class="info-card">
            <h3>📋 AIH ${aih.numero_aih}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                <p><strong>Status:</strong> <span class="status-badge status-${aih.status}">${getStatusDescricao(aih.status)}</span></p>
                <p><strong>Competência:</strong> ${aih.competencia}</p>
                <p><strong>Valor Inicial:</strong> R$ ${aih.valor_inicial.toFixed(2)}</p>
                <p><strong>Valor Atual:</strong> R$ ${aih.valor_atual.toFixed(2)}</p>
                <p><strong>Diferença:</strong> <span style="color: ${diferencaValor > 0 ? '#ef4444' : '#10b981'}">
                    R$ ${Math.abs(diferencaValor).toFixed(2)} (${percentualDiferenca}%)
                </span></p>
                <p><strong>Atendimentos:</strong> ${aih.atendimentos.length}</p>
            </div>
            <div style="margin-top: 1rem;">
                <strong>Números de Atendimento:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${aih.atendimentos.map(at => `
                        <span style="background: #e0e7ff; color: #4f46e5; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">
                            ${at}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>

        <div style="margin-top: 2rem;">
            <h4 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                    📊 Histórico de Movimentações
                    <span style="background: #6366f1; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem;">
                        ${aih.movimentacoes.length}
                    </span>
                </span>
                <div style="display: flex; gap: 0.5rem; margin-left: auto; flex-wrap: wrap;">
                    <button onclick="exportarHistoricoMovimentacoes('csv')" 
                            style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                                   color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                   cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;
                                   transition: all 0.2s ease; min-width: 80px; justify-content: center;"
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        📄 CSV
                    </button>
                    <button onclick="exportarHistoricoMovimentacoes('xlsx')" 
                            style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); 
                                   color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                   cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;
                                   transition: all 0.2s ease; min-width: 100px; justify-content: center;"
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        📊 Excel (XLS)
                    </button>
                </div>
            </h4>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Valor</th>
                        <th>Profissionais</th>
                    </tr>
                </thead>
                <tbody>
                    ${aih.movimentacoes.map(mov => {
                        const profissionais = [];
                        if (mov.prof_medicina) profissionais.push(`Med: ${mov.prof_medicina}`);
                        if (mov.prof_enfermagem) profissionais.push(`Enf: ${mov.prof_enfermagem}`);
                        if (mov.prof_fisioterapia) profissionais.push(`Fis: ${mov.prof_fisioterapia}`);
                        if (mov.prof_bucomaxilo) profissionais.push(`Buco: ${mov.prof_bucomaxilo}`);

                        return `
                            <tr>
                                <td>${new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                                        ${mov.tipo === 'entrada_sus' ? '📥' : '📤'}
                                        ${mov.tipo === 'entrada_sus' ? 'Entrada SUS' : 'Saída Hospital'}
                                    </span>
                                </td>
                                <td><span class="status-badge status-${mov.status_aih}">${getStatusDescricao(mov.status_aih)}</span></td>
                                <td>```text
R$ ${(mov.valor_conta || 0).toFixed(2)}</td>
                                <td style="font-size: 0.875rem;">${profissionais.join(' | ') || '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${aih.glosas.length > 0 ? `
            <div style="margin-top: 2rem; background: #fef3c7; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <h4 style="color: #92400e; margin-bottom: 1rem;">
                    ⚠️ Glosas Ativas (${aih.glosas.length})
                </h4>
                <div style="display: grid; gap: 0.75rem;">
                    ${aih.glosas.map(g => `
                        <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${g.linha}</strong> - ${g.tipo}
                                <span style="color: #64748b; font-size: 0.875rem; margin-left: 1rem;">
                                    Por: ${g.profissional}
                                </span>
                            </div>
                            <span style="font-size: 0.75rem; color: #92400e;">
                                ${new Date(g.criado_em).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    mostrarTela('telaInfoAIH');
};

// Menu Principal
document.getElementById('btnInformarAIH').addEventListener('click', () => {
    mostrarTela('telaInformarAIH');
});

document.getElementById('btnBuscarAIH').addEventListener('click', () => {
    mostrarTela('telaPesquisa');
});

document.getElementById('btnBackup').addEventListener('click', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <h3>🗄️ Backup e Exportação</h3>
        <p>Escolha uma opção:</p>
        <div style="display: grid; gap: 1rem; margin-top: 2rem;">
            <button onclick="fazerBackup()" 
                    style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                           padding: 1.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">💾</span>
                <div style="text-align: left;">
                    <strong>Backup Completo</strong>
                    <br>
                    <span style="font-size: 0.875rem; opacity: 0.9;">Baixar banco de dados SQLite</span>
                </div>
            </button>
            <button onclick="exportarDados('csv')" 
                    style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                           padding: 1.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">📄</span>
                <div style="text-align: left;">
                    <strong>Exportar CSV</strong>
                    <br>
                    <span style="font-size: 0.875rem; opacity: 0.9;">Dados em formato planilha</span>
                </div>
            </button>
            <button onclick="exportarDados('json')" 
                    style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                           padding: 1.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">📊</span>
                <div style="text-align: left;">
                    <strong>Exportar JSON</strong>
                    <br>
                    <span style="font-size: 0.875rem; opacity: 0.9;">Dados estruturados</span>
                </div>
            </button>
            <button onclick="document.getElementById('modal').classList.remove('ativo')" 
                    style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
                Cancelar
            </button>
        </div>
    `;

    modal.classList.add('ativo');
});

document.getElementById('btnConfiguracoes').addEventListener('click', () => {
    mostrarTela('telaConfiguracoes');
    carregarProfissionais();
    carregarTiposGlosaConfig();
});

// Buscar AIH
document.getElementById('formBuscarAIH').addEventListener('submit', async (e) => {
    e.preventDefault();

    const numero = document.getElementById('numeroBuscarAIH').value;

    try {
        const aih = await api(`/aih/${numero}`);
        state.aihAtual = aih;

        if (aih.status === 1 || aih.status === 4) {
            const continuar = await mostrarModal(
                'AIH Finalizada',
                'Esta AIH está finalizada. É uma reassinatura/reapresentação?'
            );

            if (!continuar) {
                document.getElementById('numeroBuscarAIH').value = '';
                return;
            }
        }

        mostrarInfoAIH(aih);
    } catch (err) {
        if (err.message.includes('não encontrada')) {
            // Nova AIH
            document.getElementById('cadastroNumeroAIH').value = numero;
            document.getElementById('cadastroNumeroAIH').removeAttribute('readonly');
            state.telaAnterior = 'telaInformarAIH';
            mostrarTela('telaCadastroAIH');
            // Garantir que sempre tenha pelo menos um campo de atendimento
            setTimeout(garantirCampoAtendimento, 100);
        } else {
            alert('Erro: ' + err.message);
        }
    }
});

// Cadastrar AIH
document.getElementById('btnAddAtendimento').addEventListener('click', () => {
    const container = document.getElementById('atendimentosContainer');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'atendimento-input';
    input.placeholder = 'Número do atendimento';
    container.appendChild(input);
});

// Garantir que sempre tenha pelo menos um campo de atendimento
const garantirCampoAtendimento = () => {
    const container = document.getElementById('atendimentosContainer');
    if (container) {
        const inputs = container.querySelectorAll('.atendimento-input');
        if (inputs.length === 0) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'atendimento-input';
            input.placeholder = 'Número do atendimento';
            container.appendChild(input);
        }
    }
};

// Cadastrar AIH
document.getElementById('formCadastroAIH').addEventListener('submit', async (e) => {
    e.preventDefault();

    const numeroAIH = document.getElementById('cadastroNumeroAIH').value.trim();

    // Validação do número da AIH (deve ter 13 dígitos)
    if (numeroAIH.length !== 13) {
        const continuar = await mostrarModal(
            'Atenção - Número da AIH',
            `O número da AIH informado tem ${numeroAIH.length} dígitos, mas o padrão são 13 dígitos. Deseja continuar o cadastro mesmo assim?`
        );

        if (!continuar) {
            return;
        }
    }

    // Coleta CORRIGIDA dos atendimentos
    const atendimentosInputs = document.querySelectorAll('#atendimentosContainer .atendimento-input');
    const atendimentos = [];

    // Usar for...of para garantir que percorra todos os elementos
    for (const input of atendimentosInputs) {
        const valor = input.value ? input.value.trim() : '';
        if (valor && valor.length > 0) {
            atendimentos.push(valor);
            console.log('Atendimento adicionado:', valor);
        }
    }

    console.log('Total de inputs encontrados:', atendimentosInputs.length);
    console.log('Atendimentos coletados:', atendimentos);
    console.log('Quantidade de atendimentos:', atendimentos.length);

    if (atendimentos.length === 0) {
        alert('Informe pelo menos um número de atendimento');
        return;
    }

    try {
        const dados = {
            numero_aih: numeroAIH,
            valor_inicial: parseFloat(document.getElementById('cadastroValor').value),
            competencia: document.getElementById('cadastroCompetencia').value,
            atendimentos: atendimentos
        };

        console.log('Dados que serão enviados:', JSON.stringify(dados, null, 2));

        const result = await api('/aih', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('AIH cadastrada com sucesso!');

        // Limpar formulário após sucesso
        document.getElementById('formCadastroAIH').reset();

        // Limpar especificamente o campo do número da AIH
        document.getElementById('cadastroNumeroAIH').value = '';
        document.getElementById('cadastroNumeroAIH').removeAttribute('readonly');

        // Limpar container de atendimentos e adicionar um campo limpo
        const container = document.getElementById('atendimentosContainer');
        container.innerHTML = '';
        const novoInput = document.createElement('input');
        novoInput.type = 'text';
        novoInput.className = 'atendimento-input';
        novoInput.placeholder = 'Número do atendimento';
        container.appendChild(novoInput);

        // Voltar para a tela de informar AIH
        mostrarTela('telaInformarAIH');

    } catch (err) {
        console.error('Erro ao cadastrar AIH:', err);
        alert('Erro ao cadastrar AIH: ' + err.message);
    }
});

// Configurar competência padrão no campo
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const competenciaAtual = `${mes}/${ano}`;

    const campoCadastroCompetencia = document.getElementById('cadastroCompetencia');
    if (campoCadastroCompetencia && !campoCadastroCompetencia.value) {
        campoCadastroCompetencia.value = competenciaAtual;
    }
});

// Adicionar funcionalidades que estavam faltando
window.fazerBackup = async () => {
    try {
        const link = document.createElement('a');
        link.href = '/api/backup';
        link.download = `backup-aih-${new Date().toISOString().split('T')[0]}.db`;
        link.click();

        document.getElementById('modal').classList.remove('ativo');
        alert('Backup iniciado! O download começará em instantes.');
    } catch (err) {
        alert('Erro ao fazer backup: ' + err.message);
    }
};

window.exportarDados = async (formato) => {
    try {
        const link = document.createElement('a');
        link.href = `/api/export/${formato}`;
        link.download = `export-aih-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xls' : formato}`;
        link.click();

        document.getElementById('modal').classList.remove('ativo');
        alert(`Exportação ${formato.toUpperCase()} iniciada! O download começará em instantes.`);
    } catch (err) {
        alert('Erro ao exportar: ' + err.message);
    }
};

// Busca rápida por AIH
window.buscarPorAIH = async () => {
    const numeroAIH = document.getElementById('buscaRapidaAIH').value.trim();

    if (!numeroAIH) {
        alert('Por favor, digite o número da AIH');
        return;
    }

    // Mostrar indicador de carregamento
    const botao = document.querySelector('.busca-card button');
    const textoOriginal = botao.textContent;
    botao.textContent = 'Buscando...';
    botao.disabled = true;

    try {
        const aih = await api(`/aih/${numeroAIH}`);
        state.aihAtual = aih;

        if (aih.status === 1 || aih.status === 4) {
            const continuar = await mostrarModal(
                'AIH Finalizada',
                'Esta AIH está finalizada. É uma reassinatura/reapresentação?'
            );

            if (!continuar) {
                document.getElementById('buscaRapidaAIH').value = '';
                return;
            }
        }

        state.telaAnterior = 'telaPesquisa';
        mostrarInfoAIH(aih);
    } catch (err) {
        if (err.message.includes('não encontrada')) {
            const cadastrar = confirm(`AIH ${numeroAIH} não encontrada. Deseja cadastrá-la?`);
            if (cadastrar) {
                document.getElementById('cadastroNumeroAIH').value = numeroAIH;
                state.telaAnterior = 'telaPesquisa';
                mostrarTela('telaCadastroAIH');
                setTimeout(garantirCampoAtendimento, 100);
            } else {
                document.getElementById('buscaRapidaAIH').value = '';
            }
        } else {
            alert('Erro ao buscar AIH: ' + err.message);
            console.error('Erro detalhado:', err);
        }
    } finally {
        // Restaurar botão
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }
};

// Busca por número de atendimento
window.buscarPorAtendimento = async () => {
    const numeroAtendimento = document.getElementById('buscaRapidaAtendimento').value.trim();

    if (!numeroAtendimento) {
        alert('Por favor, digite o número do atendimento');
        return;
    }

    // Mostrar indicador de carregamento
    const botoes = document.querySelectorAll('.busca-card button');
    const botaoAtendimento = botoes[1]; // Segundo botão
    const textoOriginal = botaoAtendimento.textContent;
    botaoAtendimento.textContent = 'Buscando...';
    botaoAtendimento.disabled = true;

    try {
        const response = await api('/pesquisar', {
            method: 'POST',
            body: JSON.stringify({
                filtros: {
                    numero_atendimento: numeroAtendimento
                }
            })
        });

        console.log('Resposta da busca por atendimento:', response);

        if (response.resultados && response.resultados.length > 0) {
            exibirResultadosPesquisa(response.resultados);
            // Limpar campo após busca bem-sucedida
            document.getElementById('buscaRapidaAtendimento').value = '';
        } else {
            alert('Nenhuma AIH encontrada com este número de atendimento');
            // Limpar container de resultados
            const container = document.getElementById('resultadosPesquisa');
            if (container) {
                container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum resultado encontrado</p>';
            }
        }
    } catch (err) {
        alert('Erro ao buscar por atendimento: ' + err.message);
        console.error('Erro detalhado:', err);
        // Limpar container de resultados em caso de erro
        const container = document.getElementById('resultadosPesquisa');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 2rem;">Erro na pesquisa. Tente novamente.</p>';
        }
    } finally {
        // Restaurar botão
        botaoAtendimento.textContent = textoOriginal;
        botaoAtendimento.disabled = false;
    }
};

// Função para exibir resultados da pesquisa
const exibirResultadosPesquisa = (resultados) => {
    const container = document.getElementById('resultadosPesquisa');

    if (!container) {
        console.error('Container de resultados não encontrado');
        return;
    }

    if (!resultados || resultados.length === 0) {
        container.innerHTML = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2rem; text-align: center; margin-top: 2rem;">
                <h3 style="color: #64748b; margin-bottom: 1rem;">📭 Nenhum resultado encontrado</h3>
                <p style="color: #64748b;">Tente ajustar os critérios de busca ou verifique se os dados estão corretos.</p>
            </div>
        `;
        return;
    }

    // Armazenar resultados globalmente para exportação
    window.ultimosResultadosPesquisa = resultados;

    container.innerHTML = `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <h3 style="color: #0369a1; margin: 0;">📊 Resultados da Pesquisa (${resultados.length})</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="exportarResultadosPesquisa('csv')" class="btn-success" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        📄 Exportar CSV
                    </button>
                    <button onclick="exportarResultadosPesquisa('excel')" class="btn-success" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        📊 Exportar Excel
                    </button>
                    <button onclick="limparResultados()" class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        🗑️ Limpar Resultados
                    </button>
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">AIH</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Status</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Competência</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Valor Inicial</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Valor Atual</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Glosas</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultados.map((aih, index) => `
                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
                                <td style="padding: 1rem; font-weight: 500; color: #1e293b;">${aih.numero_aih || 'N/A'}</td>
                                <td style="padding: 1rem;"><span class="status-badge status-${aih.status}">${getStatusDescricao(aih.status)}</span></td>
                                <td style="padding: 1rem; color: #64748b;">${aih.competencia || 'N/A'}</td>
                                <td style="padding: 1rem; color: #059669; font-weight: 500;">R$ ${(aih.valor_inicial || 0).toFixed(2)}</td>
                                <td style="padding: 1rem; color: ${(aih.valor_atual < aih.valor_inicial) ? '#dc2626' : '#059669'}; font-weight: 500;">R$ ${(aih.valor_atual || 0).toFixed(2)}</td>
                                <td style="padding: 1rem; text-align: center;">
                                    <span style="background: ${(aih.total_glosas > 0) ? '#fef3c7' : '#f0fdf4'}; color: ${(aih.total_glosas > 0) ? '#92400e' : '#166534'}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">
                                        ${aih.total_glosas || 0}
                                    </span>
                                </td>
                                <td style="padding: 1rem;">
                                    <button onclick="visualizarAIH('${aih.numero_aih}')" 
                                            style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                                                   color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                                   cursor: pointer; font-weight: 500; transition: all 0.2s;">
                                        👁️ Ver Detalhes
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Função para visualizar AIH dos resultados
window.visualizarAIH = async (numeroAIH) => {
    try {
        const aih = await api(`/aih/${numeroAIH}`);
        state.aihAtual = aih;
        state.telaAnterior = 'telaPesquisa';
        mostrarInfoAIH(aih);
    } catch (err) {
        alert('Erro ao carregar AIH: ' + err.message);
    }
};

// Navegação para relatórios
document.getElementById('btnRelatorios').addEventListener('click', () => {
    mostrarTela('telaRelatorios');
    carregarRelatorios();
});

// Carregar opções de relatórios
const carregarRelatorios = () => {
    const container = document.getElementById('opcoesRelatorios');

    container.innerHTML = `
        <div class="relatorios-grid">
            <div class="relatorio-card" onclick="gerarRelatorio('acessos')">
                <div class="relatorio-icon">👥</div>
                <h4>Relatório de Acessos</h4>
                <p>Usuários e frequência de acessos</p>
            </div>

            <div class="relatorio-card" onclick="gerarRelatorio('aprovacoes')">
                <div class="relatorio-icon">✅</div>
                <h4>Relatório de Aprovações</h4>
                <p>Distribuição por status de aprovação</p>
            </div>

            <div class="relatorio-card" onclick="gerarRelatorio('glosas-profissional')">
                <div class="relatorio-icon">⚠️</div>
                <h4>Glosas por Profissional</h4>
                <p>Glosas identificadas por auditor</p>
            </div>

            <div class="relatorio-card" onclick="gerarRelatorio('aihs-profissional')">
                <div class="relatorio-icon">🏥</div>
                <h4>AIHs por Profissional</h4>
                <p>Produtividade por auditor</p>
            </div>

            <div class="relatorio-card" onclick="gerarRelatorio('tipos-glosa')">
                <div class="relatorio-icon">📊</div>
                <h4>Tipos de Glosa</h4>
                <p>Ranking dos tipos mais frequentes</p>
            </div>

            <div class="relatorio-card" onclick="mostrarRelatoriosPeriodo()">
                <div class="relatorio-icon">📅</div>
                <h4>Relatórios por Período</h4>
                <p>Análises com filtros de data</p>
            </div>
        </div>
    `;
};

// Gerar relatório
window.gerarRelatorio = async (tipo) => {
    try {
        const response = await api(`/relatorios/${tipo}`, {
            method: 'POST',
            body: JSON.stringify({})
        });

        exibirRelatorio(tipo, response.resultado);
    } catch (err) {
        alert('Erro ao gerar relatório: ' + err.message);
    }
};

// Exibir relatório
const exibirRelatorio = (tipo, dados) => {
    const container = document.getElementById('resultadoRelatorio');
    let html = `<h3>📊 ${getTituloRelatorio(tipo)}</h3>`;

    if (Array.isArray(dados)) {
        html += `
            <div style="margin-bottom: 1rem;">
                <button onclick="exportarRelatorio('${tipo}')" class="btn-success">
                    📊 Exportar Excel
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        ${Object.keys(dados[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${dados.map(item => `
                        <tr>
                            ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        html += `<pre>${JSON.stringify(dados, null, 2)}</pre>`;
    }

    container.innerHTML = html;
};

// Obter título do relatório
const getTituloRelatorio = (tipo) => {
    const titulos = {
        'acessos': 'Relatório de Acessos',
        'aprovacoes': 'Relatório de Aprovações',
        'glosas-profissional': 'Glosas por Profissional',
        'aihs-profissional': 'AIHs por Profissional',
        'tipos-glosa': 'Tipos de Glosa'
    };
    return titulos[tipo] || 'Relatório';
};

// Exportar relatório
window.exportarRelatorio = (tipo) => {
    const link = document.createElement('a');
    link.href = `/api/relatorios/${tipo}/export`;
    link.download = `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
};

// Mostrar relatórios com filtro de período
window.mostrarRelatoriosPeriodo = () => {
    const container = document.getElementById('resultadoRelatorio');

    container.innerHTML = `
        <h3>📅 Relatórios por Período</h3>
        <div class="filtros-periodo">
            <div class="filtro-item">
                <label>Data Início:</label>
                <input type="date" id="dataInicioPeriodo">
            </div>
            <div class="filtro-item">
                <label>Data Fim:</label>
                <input type="date" id="dataFimPeriodo">
            </div>
            <div class="filtro-item">
                <label>Competência:</label>
                <input type="text" id="competenciaPeriodo" placeholder="MM/AAAA">
            </div>
        </div>

        <div class="relatorios-periodo-grid">
            <button onclick="gerarRelatorioPeriodo('estatisticas-periodo')" class="relatorio-periodo-btn">
                📊 Estatísticas Gerais
            </button>
            <button onclick="gerarRelatorioPeriodo('valores-glosas-periodo')" class="relatorio-periodo-btn">
                💰 Análise Financeira
            </button>
            <button onclick="gerarRelatorioPeriodo('tipos-glosa-periodo')" class="relatorio-periodo-btn">
                ⚠️ Tipos de Glosa
            </button>
            <button onclick="gerarRelatorioPeriodo('aihs-profissional-periodo')" class="relatorio-periodo-btn">
                👨‍⚕️ Produtividade Profissionais
            </button>
        </div>

        <div id="resultadoRelatorioPeriodo"></div>
    `;
};

// Gerar relatório com período
window.gerarRelatorioPeriodo = async (tipo) => {
    try {
        const dataInicio = document.getElementById('dataInicioPeriodo').value;
        const dataFim = document.getElementById('dataFimPeriodo').value;
        const competencia = document.getElementById('competenciaPeriodo').value;

        const response = await api(`/relatorios/${tipo}`, {
            method: 'POST',
            body: JSON.stringify({
                data_inicio: dataInicio,
                data_fim: dataFim,
                competencia: competencia
            })
        });

        exibirRelatorioPeriodo(tipo, response.resultado, { dataInicio, dataFim, competencia });
    } catch (err) {
        alert('Erro ao gerar relatório: ' + err.message);
    }
};

// Exibir relatório com período
const exibirRelatorioPeriodo = (tipo, dados, filtros) => {
    const container = document.getElementById('resultadoRelatorioPeriodo');
    let html = `
        <h4>📊 ${getTituloRelatorio(tipo)}</h4>
        <p><strong>Período:</strong> ${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Fim'} 
           ${filtros.competencia ? `| Competência: ${filtros.competencia}` : ''}</p>
        <div style="margin-bottom: 1rem;">
            <button onclick="exportarRelatorioPeriodo('${tipo}', ${JSON.stringify(filtros).replace(/"/g, '&quot;')})" class="btn-success">
                📊 Exportar Excel
            </button>
        </div>
    `;

    if (Array.isArray(dados)) {
        html += `
            <table>
                <thead>
                    <tr>
                        ${Object.keys(dados[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${dados.map(item => `
                        <tr>
                            ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        html += `<pre>${JSON.stringify(dados, null, 2)}</pre>`;
    }

    container.innerHTML = html;
};

// Exportar relatório com período
window.exportarRelatorioPeriodo = (tipo, filtros) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/relatorios/${tipo}/export`;
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(filtros);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

// Função para carregar glosas
const carregarGlosas = async () => {
    if (!state.aihAtual) return;

    try {
        const [glosas, tipos, profissionais] = await Promise.all([
            api(`/aih/${state.aihAtual.id}/glosas`),
            api('/tipos-glosa'),
            api('/profissionais')
        ]);

        // Atualizar glosas atuais
        const container = document.getElementById('glosasAtuais');
        if (container && glosas.glosas) {
            container.innerHTML = `
                <h4>📋 Glosas Atuais</h4>
                ${glosas.glosas.length > 0 ? glosas.glosas.map(g => `
                    <div class="glosa-item">
                        <div>
                            <strong>${g.linha}</strong> - ${g.tipo}
                            <br>
                            <span style="color: #64748b;">Por: ${g.profissional}</span>
                        </div>
                        <button onclick="removerGlosa(${g.id})" class="btn-danger">Remover</button>
                    </div>
                `).join('') : '<p>Nenhuma glosa ativa</p>'}
            `;
        }

        // Preencher select de tipos de glosa
        const tipoSelect = document.getElementById('glosaTipo');
        if (tipoSelect && tipos.tipos) {
            tipoSelect.innerHTML = '<option value="">Selecione o tipo de pendência/glosa</option>';
            tipos.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.descricao;
                option.textContent = tipo.descricao;
                tipoSelect.appendChild(option);
            });
        }

        // Preencher select de profissionais
        const profSelect = document.getElementById('glosaProfissional');
        if (profSelect && profissionais.profissionais) {
            profSelect.innerHTML = '<option value="">Selecione o profissional</option>';
            profissionais.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.nome;
                option.textContent = `${prof.nome} (${prof.especialidade})`;
                profSelect.appendChild(option);
            });
        }

    } catch (err) {
        console.error('Erro ao carregar glosas:', err);
    }
};

// Função para limpar filtros (corrigindo erro do console)
window.limparFiltros = () => {
    // Limpar campos da pesquisa avançada
    const campos = [
        'pesquisaNumeroAIH', 'pesquisaNumeroAtendimento', 'pesquisaDataInicio', 
        'pesquisaDataFim', 'pesquisaCompetencia', 'pesquisaValorMin', 
        'pesquisaValorMax', 'pesquisaProfissional'
    ];

    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) campo.value = '';
    });

    // Desmarcar todos os checkboxes de status
    document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = false);

    // Limpar resultados
    const container = document.getElementById('resultadosPesquisa');
    if (container) {
        container.innerHTML = '';
    }

    alert('Filtros limpos com sucesso!');
};

// Função para limpar filtros de relatórios
window.limparFiltrosRelatorio = () => {
    const campos = ['relatorioDataInicio', 'relatorioDataFim', 'relatorioCompetencia'];
    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) campo.value = '';
    });
    alert('Filtros de relatórios limpos!');
};

// Função para limpar resultados
window.limparResultados = () => {
    const container = document.getElementById('resultadosPesquisa');
    if (container) {
        container.innerHTML = '';
    }

    // Limpar resultados armazenados
    window.ultimosResultadosPesquisa = null;

    // Também limpar os campos de busca rápida
    document.getElementById('buscaRapidaAIH').value = '';
    document.getElementById('buscaRapidaAtendimento').value = '';
};

// Função para exportar resultados da pesquisa
window.exportarResultadosPesquisa = async (formato) => {
    if (!window.ultimosResultadosPesquisa || window.ultimosResultadosPesquisa.length === 0) {
        alert('Nenhum resultado disponível para exportação');
        return;
    }

    try {
        // Criar dados formatados para exportação
        const dadosExportacao = window.ultimosResultadosPesquisa.map(aih => ({
            'Número AIH': aih.numero_aih || '',
            'Status': getStatusDescricao(aih.status),
            'Competência': aih.competencia || '',
            'Valor Inicial': `R$ ${(aih.valor_inicial || 0).toFixed(2)}`,
            'Valor Atual': `R$ ${(aih.valor_atual || 0).toFixed(2)}`,
            'Diferença': `R$ ${((aih.valor_inicial || 0) - (aih.valor_atual || 0)).toFixed(2)}`,
            'Total Glosas': aih.total_glosas || 0,
            'Cadastrado em': new Date(aih.criado_em).toLocaleDateString('pt-BR')
        }));

        const dataAtual = new Date().toISOString().split('T')[0];

        if (formato === 'csv') {
            // Gerar CSV
            const cabecalhos = Object.keys(dadosExportacao[0]);
            const linhasCsv = [
                cabecalhos.join(','),
                ...dadosExportacao.map(linha => 
                    cabecalhos.map(cabecalho => `"${linha[cabecalho]}"`).join(',')
                )
            ];

            const csvContent = '\ufeff' + linhasCsv.join('\n'); // BOM para UTF-8
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `resultados-pesquisa-${dataAtual}.csv`;
            link.click();

            URL.revokeObjectURL(link.href);

        } else if (formato === 'excel') {
            // Para Excel, vamos usar a API do servidor
            const response = await fetch('/api/export/excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    dados: dadosExportacao,
                    titulo: 'Resultados da Pesquisa',
                    tipo: 'resultados-pesquisa'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `resultados-pesquisa-${dataAtual}.xls`;
                link.click();
                URL.revokeObjectURL(link.href);
            } else {
                throw new Error('Erro ao gerar arquivo Excel');
            }
        }

        alert(`Exportação ${formato.toUpperCase()} realizada com sucesso!`);

    } catch (err) {
        console.error('Erro na exportação:', err);
        alert('Erro ao exportar resultados: ' + err.message);
    }
};

// Função para limpar filtros
const limparFiltros = () => {
    // Limpar filtros da pesquisa avançada
    document.getElementById('pesquisaNumeroAIH').value = '';
    document.getElementById('pesquisaNumeroAtendimento').value = '';
    document.getElementById('pesquisaCompetencia').value = '';
    document.getElementById('pesquisaDataInicio').value = '';
    document.getElementById('pesquisaDataFim').value = '';
    document.getElementById('pesquisaValorMin').value = '';
    document.getElementById('pesquisaValorMax').value = '';
    document.getElementById('pesquisaProfissional').value = '';

    // Desmarcar todos os checkboxes de status
    document.querySelectorAll('input[name="status"]').forEach(cb => cb.checked = false);

    // Limpar resultados se existirem
    const resultados = document.getElementById('resultadosPesquisa');
    if (resultados) {
        resultados.innerHTML = '';
    }

    console.log('Filtros limpos');
};

// Pesquisa avançada
document.getElementById('formPesquisa').addEventListener('submit', async (e) => {
    e.preventDefault();

    const filtros = {
        status: Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => parseInt(cb.value)),
        competencia: document.getElementById('pesquisaCompetencia').value,
        data_inicio: document.getElementById('pesquisaDataInicio').value,
        data_fim: document.getElementById('pesquisaDataFim').value,
        valor_min: document.getElementById('pesquisaValorMin').value,
        valor_max: document.getElementById('pesquisaValorMax').value,
        numero_aih: document.getElementById('pesquisaNumeroAIH').value,
        numero_atendimento: document.getElementById('pesquisaNumeroAtendimento').value,
        profissional: document.getElementById('pesquisaProfissional').value
    };

    // Remover filtros vazios
    Object.keys(filtros).forEach(key => {
        if (!filtros[key] || (Array.isArray(filtros[key]) && filtros[key].length === 0)) {
            delete filtros[key];
        }
    });

    try {
        const response = await api('/pesquisar', {
            method: 'POST',
            body: JSON.stringify({ filtros })
        });

        exibirResultadosPesquisa(response.resultados);
    } catch (err) {
        alert('Erro na pesquisa: ' + err.message);
    }
});

// Exportar histórico de movimentações
window.exportarHistoricoMovimentacoes = async (formato) => {
    if (!state.aihAtual) {
        alert('Nenhuma AIH selecionada');
        return;
    }

    try {
        // Mostrar indicador de carregamento
        const botoes = document.querySelectorAll('button[onclick*="exportarHistoricoMovimentacoes"]');
        botoes.forEach(btn => {
            btn.disabled = true;
            btn.textContent = btn.textContent.replace('📄', '⏳').replace('📊', '⏳');
        });

        const response = await fetch(`/api/aih/${state.aihAtual.id}/movimentacoes/export/${formato}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        // Criar blob com o conteúdo da resposta
        const blob = await response.blob();

        // Determinar o nome do arquivo e tipo MIME
        let fileName, mimeType;
        if (formato === 'csv') {
            fileName = `historico-movimentacoes-AIH-${state.aihAtual.numero_aih}-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv;charset=utf-8';
        } else if (formato === 'xlsx') {
            fileName = `historico-movimentacoes-AIH-${state.aihAtual.numero_aih}-${new Date().toISOString().split('T')[0]}.xls`;
            mimeType = 'application/vnd.ms-excel';
        } else {
            throw new Error('Formato não suportado');
        }

        // Criar link de download
        const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;

        // Adicionar ao DOM temporariamente e clicar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpar URL do blob
        window.URL.revokeObjectURL(url);

        alert(`Histórico exportado com sucesso em formato ${formato.toUpperCase()}!`);

    } catch (err) {
        console.error('Erro ao exportar histórico:', err);
        alert(`Erro ao exportar histórico: ${err.message}`);
    } finally {
        // Restaurar botões
        setTimeout(() => {
            const botoes = document.querySelectorAll('button[onclick*="exportarHistoricoMovimentacoes"]');
            botoes.forEach(btn => {
                btn.disabled = false;
                if (btn.textContent.includes('CSV')) {
                    btn.textContent = '📄 CSV';
                } else if (btn.textContent.includes('Excel')) {
                    btn.textContent = '📊 Excel (XLS)';
                }
            });
        }, 1000);
    }
};

// Adicionar funcionalidades de configuração
const carregarProfissionais = async () => {
    try {
        const response = await api('/profissionais');
        const container = document.getElementById('listaProfissionais');

        if (response && response.profissionais) {
            container.innerHTML = response.profissionais.map(prof => `
                <div class="glosa-item">
                    <div>
                        <strong>${prof.nome}</strong> - ${prof.especialidade}
                    </div>
                    <button onclick="excluirProfissional(${prof.id})" class="btn-danger">Excluir</button>
                </div>
            `).join('') || '<p>Nenhum profissional cadastrado</p>';
        }
    } catch (err) {
        console.error('Erro ao carregar profissionais:', err);
    }
};

const carregarTiposGlosaConfig = async () => {
    try {
        const response = await api('/tipos-glosa');
        const container = document.getElementById('listaTiposGlosa');

        if (response && response.tipos) {
            container.innerHTML = response.tipos.map(tipo => `
                <div class="glosa-item">
                    <div>${tipo.descricao}</div>
                    <button onclick="excluirTipoGlosa(${tipo.id})" class="btn-danger">Excluir</button>
                </div>
            `).join('') || '<p>Nenhum tipo de glosa cadastrado</p>';
        }
    } catch (err) {
        console.error('Erro ao carregar tipos de glosa:', err);
    }
};

// Event listener para Nova Movimentação
document.getElementById('btnNovaMovimentacao').addEventListener('click', async () => {
    if (!state.aihAtual) {
        alert('Nenhuma AIH selecionada');
        return;
    }

    try {
        // Buscar próxima movimentação possível
        const proximaMovimentacao = await api(`/aih/${state.aihAtual.id}/proxima-movimentacao`);

        // Definir tela anterior
        state.telaAnterior = 'telaInfoAIH';

        // Ir para tela de movimentação
        mostrarTela('telaMovimentacao');

        // Carregar dados da movimentação
        await carregarDadosMovimentacao();

        // Configurar campos com base na próxima movimentação
        if (proximaMovimentacao) {
            const tipoSelect = document.getElementById('movTipo');
            const explicacaoDiv = document.getElementById('explicacaoMovimentacao');

            if (tipoSelect) {
                tipoSelect.value = proximaMovimentacao.proximo_tipo;
                tipoSelect.disabled = true; // Bloquear alteração
            }

            if (explicacaoDiv) {
                explicacaoDiv.innerHTML = `
                    <div style="background: #e0f2fe; border: 1px solid #0284c7; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h4 style="color: #0284c7; margin-bottom: 0.5rem;">
                            ℹ️ ${proximaMovimentacao.descricao}
                        </h4>
                        <p style="color: #0369a1; margin: 0;">
                            ${proximaMovimentacao.explicacao}
                        </p>
                    </div>
                `;
            }
        }

        // Preencher competência padrão
        const competenciaField = document.getElementById('movCompetencia');
        if (competenciaField && !competenciaField.value) {
            competenciaField.value = getCompetenciaAtual();
        }

        // Preencher valor atual da AIH
        const valorField = document.getElementById('movValor');
        if (valorField && state.aihAtual.valor_atual) {
            valorField.value = state.aihAtual.valor_atual;
        }

    } catch (err) {
        console.error('Erro ao iniciar nova movimentação:', err);
        alert('Erro ao iniciar nova movimentação: ' + err.message);
    }
});

// Event listeners para configurações
document.getElementById('formNovoProfissional').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const dados = {
            nome: document.getElementById('profNome').value,
            especialidade: document.getElementById('profEspecialidade').value
        };

        await api('/profissionais', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('Profissional adicionado com sucesso!');
        document.getElementById('formNovoProfissional').reset();
        carregarProfissionais();
    } catch (err) {
        alert('Erro ao adicionar profissional: ' + err.message);
    }
});

document.getElementById('formNovoTipoGlosa').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const dados = {
            descricao: document.getElementById('tipoGlosaDescricao').value
        };

        await api('/tipos-glosa', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('Tipo de glosa adicionado com sucesso!');
        document.getElementById('formNovoTipoGlosa').reset();
        carregarTiposGlosaConfig();
    } catch (err) {
        alert('Erro ao adicionar tipo de glosa: ' + err.message);
    }
});

window.excluirProfissional = async (id) => {
    const confirmar = confirm('Tem certeza que deseja excluir este profissional?');
    if (!confirmar) return;

    try {
        await api(`/profissionais/${id}`, { method: 'DELETE' });
        alert('Profissional excluído com sucesso!');
        carregarProfissionais();
    } catch (err) {
        alert('Erro ao excluir profissional: ' + err.message);
    }
};

window.excluirTipoGlosa = async (id) => {
    const confirmar = confirm('Tem certeza que deseja excluir este tipo de glosa?');
    if (!confirmar) return;

    try {
        await api(`/tipos-glosa/${id}`, { method: 'DELETE' });
        alert('Tipo de glosa excluído com sucesso!');
        carregarTiposGlosaConfig();
    } catch (err) {
        alert('Erro ao excluir tipo de glosa: ' + err.message);
    }
};

// Event listeners para movimentação
document.getElementById('btnCancelarMovimentacao')?.addEventListener('click', () => {
    voltarTelaAnterior();
});

document.getElementById('btnGerenciarGlosas')?.addEventListener('click', () => {
    state.telaAnterior = 'telaMovimentacao';
    mostrarTela('telaPendencias');
    carregarGlosas();
});

// Função para validar profissionais obrigatórios
const validarProfissionaisObrigatorios = () => {
    const profEnfermagem = document.getElementById('movProfEnfermagem').value.trim();
    const profMedicina = document.getElementById('movProfMedicina').value.trim();
    const profBucomaxilo = document.getElementById('movProfBucomaxilo').value.trim();

    const erros = [];

    // Validação 1: Enfermagem é SEMPRE obrigatória
    if (!profEnfermagem) {
        erros.push('• Profissional de Enfermagem é obrigatório');
    }

    // Validação 2: Pelo menos um entre Medicina ou Bucomaxilo deve ser selecionado
    if (!profMedicina && !profBucomaxilo) {
        erros.push('• É necessário selecionar pelo menos um profissional de Medicina OU Cirurgião Bucomaxilo');
    }

    return erros;
};

// Formulário de movimentação
document.getElementById('formMovimentacao')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.aihAtual) {
        alert('Nenhuma AIH selecionada');
        return;
    }

    // Validar profissionais obrigatórios
    const errosValidacao = validarProfissionaisObrigatorios();
    if (errosValidacao.length > 0) {
        const mensagemErro = `❌ Profissionais Auditores Obrigatórios não preenchidos:\n\n${errosValidacao.join('\n')}\n\n📋 Regra: Enfermagem é SEMPRE obrigatório + pelo menos um entre Medicina ou Cirurgião Bucomaxilo.\n\n🔬 Fisioterapia é opcional.`;
        alert(mensagemErro);
        return;
    }

    try {
        const dados = {
            tipo: document.getElementById('movTipo').value,
            status_aih: parseInt(document.getElementById('movStatus').value),
            valor_conta: parseFloat(document.getElementById('movValor').value),
            competencia: document.getElementById('movCompetencia').value,
            prof_medicina: document.getElementById('movProfMedicina').value || null,
            prof_enfermagem: document.getElementById('movProfEnfermagem').value || null,
            prof_fisioterapia: document.getElementById('movProfFisioterapia').value || null,
            prof_bucomaxilo: document.getElementById('movProfBucomaxilo').value || null,
            observacoes: document.getElementById('movObservacoes').value || null
        };

        await api(`/aih/${state.aihAtual.id}/movimentacao`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('Movimentação salva com sucesso!');

        // Recarregar AIH atualizada
        const aihAtualizada = await api(`/aih/${state.aihAtual.numero_aih}`);
        state.aihAtual = aihAtualizada;

        // Voltar para informações da AIH
        mostrarInfoAIH(aihAtualizada);

    } catch (err) {
        console.error('Erro ao salvar movimentação:', err);
        alert('Erro ao salvar movimentação: ' + err.message);
    }
});

// Formulário para adicionar nova glosa
document.getElementById('formNovaGlosa')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.aihAtual || !state.aihAtual.id) {
        alert('Nenhuma AIH selecionada');
        return;
    }

    try {
        const dados = {
            linha: document.getElementById('glosaLinha').value,
            tipo: document.getElementById('glosaTipo').value,
            profissional: document.getElementById('glosaProfissional').value,
            quantidade: parseInt(document.getElementById('glosaQuantidade').value) || 1
        };

        await api(`/aih/${state.aihAtual.id}/glosas`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        alert('Glosa adicionada com sucesso!');
        document.getElementById('formNovaGlosa').reset();
        carregarGlosas();
    } catch (err) {
        alert('Erro ao adicionar glosa: ' + err.message);
    }
});

// Remover glosa
window.removerGlosa = async (id) => {
    const confirmar = await mostrarModal(
        'Remover Glosa',
        'Tem certeza que deseja remover esta glosa/pendência?'
    );

    if (!confirmar) return;

    try {
        await api(`/glosas/${id}`, { method: 'DELETE' });
        alert('Glosa removida com sucesso!');
        carregarGlosas();
    } catch (err) {
        alert('Erro ao remover glosa: ' + err.message);
    }
};

// Salvar glosas e voltar
document.getElementById('btnSalvarGlosas')?.addEventListener('click', () => {
    voltarTelaAnterior();
});
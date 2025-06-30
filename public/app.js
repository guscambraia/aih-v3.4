
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
        1: 'Finalizada com aprovação direta',
        2: 'Ativa com aprovação indireta',
        3: 'Ativa em discussão',
        4: 'Finalizada após discussão'
    };
    return descricoes[status] || 'Desconhecido';
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
                <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                    <button onclick="exportarHistoricoMovimentacoes('csv')" 
                            style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                                   color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                   cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;">
                        📄 CSV
                    </button>
                    <button onclick="exportarHistoricoMovimentacoes('xlsx')" 
                            style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); 
                                   color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                                   cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem;">
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
                                <td>R$ ${(mov.valor_conta || 0).toFixed(2)}</td>
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


// Módulo de modal para confirmações e alertas
const Modal = {
    // Mostrar modal de confirmação
    async confirmar(titulo, mensagem) {
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
    },

    // Modal personalizado com conteúdo HTML
    async personalizado(conteudoHTML) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal');
            const modalContent = modal.querySelector('.modal-content');

            modalContent.innerHTML = conteudoHTML;
            modal.classList.add('ativo');

            // Adicionar listener para fechar
            const fecharModal = (resultado = null) => {
                modal.classList.remove('ativo');
                resolve(resultado);
            };

            // Permitir fechar clicando fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    fecharModal();
                }
            });

            // Expor função de fechar globalmente
            window.fecharModal = fecharModal;
        });
    },

    // Modal de seleção de opções
    async selecionar(titulo, opcoes = []) {
        const opcoesHTML = opcoes.map((opcao, index) => `
            <button onclick="window.fecharModal('${opcao.valor || index}')" 
                    style="background: ${opcao.cor || '#6366f1'}; color: white; 
                           border: none; padding: 1rem; margin: 0.5rem; 
                           border-radius: 6px; cursor: pointer; font-size: 1rem;">
                ${opcao.icone || ''} ${opcao.texto}
            </button>
        `).join('');

        const conteudo = `
            <h3>${titulo}</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem;">
                ${opcoesHTML}
                <button onclick="window.fecharModal(null)" 
                        style="background: #64748b; color: white; border: none; 
                               padding: 1rem; border-radius: 6px; cursor: pointer;">
                    Cancelar
                </button>
            </div>
        `;

        return this.personalizado(conteudo);
    },

    // Fechar modal
    fechar() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('ativo');
        }
    }
};

// Exportar para uso global
window.Modal = Modal;

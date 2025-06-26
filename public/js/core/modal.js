// Módulo de modal centralizado
const Modal = {
    init() {
        Logger.moduleLoad('Modal', true);
    },

    // Modal de confirmação
    confirmar(titulo, mensagem) {
        return new Promise((resolve) => {
            try {
                const modalTitulo = document.getElementById('modalTitulo');
                const modalMensagem = document.getElementById('modalMensagem');
                const modal = document.getElementById('modal');
                const btnSim = document.getElementById('modalBtnSim');
                const btnNao = document.getElementById('modalBtnNao');

                if (!modalTitulo || !modalMensagem || !modal || !btnSim || !btnNao) {
                    Logger.warn('Modal', 'Elementos do modal não encontrados, usando confirm nativo');
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
                    Logger.debug('Modal', 'Modal fechado', { resultado });
                    resolve(resultado);
                };

                const simHandler = () => fecharModal(true);
                const naoHandler = () => fecharModal(false);

                btnSim.addEventListener('click', simHandler);
                btnNao.addEventListener('click', naoHandler);

                Logger.debug('Modal', 'Modal exibido', { titulo, mensagem });
            } catch (error) {
                Logger.error('Modal', 'Erro ao exibir modal', error);
                resolve(confirm(`${titulo}\n\n${mensagem}`));
            }
        });
    },

    // Modal de alerta
    alerta(titulo, mensagem) {
        try {
            const modalTitulo = document.getElementById('modalTitulo');
            const modalMensagem = document.getElementById('modalMensagem');
            const modal = document.getElementById('modal');
            const btnSim = document.getElementById('modalBtnSim');
            const btnNao = document.getElementById('modalBtnNao');

            if (!modalTitulo || !modalMensagem || !modal || !btnSim || !btnNao) {
                Logger.warn('Modal', 'Elementos do modal não encontrados, usando alert nativo');
                alert(`${titulo}\n\n${mensagem}`);
                return;
            }

            modalTitulo.textContent = titulo;
            modalMensagem.textContent = mensagem;
            btnSim.textContent = 'OK';
            btnNao.style.display = 'none';
            modal.classList.add('ativo');

            const fecharModal = () => {
                modal.classList.remove('ativo');
                btnSim.removeEventListener('click', fecharModal);
                btnSim.textContent = 'Sim';
                btnNao.style.display = 'block';
                Logger.debug('Modal', 'Modal de alerta fechado');
            };

            btnSim.addEventListener('click', fecharModal);
            Logger.debug('Modal', 'Modal de alerta exibido', { titulo, mensagem });
        } catch (error) {
            Logger.error('Modal', 'Erro ao exibir modal de alerta', error);
            alert(`${titulo}\n\n${mensagem}`);
        }
    }
};

// Exportar para uso global
window.Modal = Modal;
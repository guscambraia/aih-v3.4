
// Funções Auxiliares Gerais
const Helpers = {
    // Debounce para otimizar pesquisas
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Gerar ID único
    gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Copiar para clipboard
    async copiarParaClipboard(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = texto;
            document.body.appendChild(textArea);
            textArea.select();
            const sucesso = document.execCommand('copy');
            document.body.removeChild(textArea);
            return sucesso;
        }
    },

    // Mostrar notificação toast
    mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensagem;
        
        // Adicionar estilos inline caso não existam no CSS
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '4px',
            color: 'white',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Cores por tipo
        const cores = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = cores[tipo] || cores.info;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remover após duração
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duracao);
    },

    // Download de arquivo
    downloadArquivo(dados, nomeArquivo, tipo = 'text/plain') {
        const blob = new Blob([dados], { type: tipo });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    // Ordenar array de objetos
    ordenarPor(array, campo, decrescente = false) {
        return array.sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];

            // Tratar valores nulos
            if (valorA === null) valorA = '';
            if (valorB === null) valorB = '';

            // Tratar datas
            if (this.isData(valorA)) {
                valorA = new Date(valorA);
                valorB = new Date(valorB);
            }

            // Tratar números
            if (typeof valorA === 'string' && !isNaN(valorA)) {
                valorA = parseFloat(valorA);
                valorB = parseFloat(valorB);
            }

            // Comparar
            if (valorA < valorB) return decrescente ? 1 : -1;
            if (valorA > valorB) return decrescente ? -1 : 1;
            return 0;
        });
    },

    // Verificar se é data
    isData(valor) {
        return valor instanceof Date || 
               (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor));
    },

    // Filtrar array
    filtrarArray(array, filtros) {
        return array.filter(item => {
            return Object.keys(filtros).every(chave => {
                const valorItem = item[chave];
                const valorFiltro = filtros[chave];

                if (!valorFiltro) return true; // Filtro vazio = todos passam

                // Filtro de texto (busca parcial, case-insensitive)
                if (typeof valorFiltro === 'string') {
                    return valorItem && 
                           valorItem.toString().toLowerCase()
                               .includes(valorFiltro.toLowerCase());
                }

                // Filtro exato
                return valorItem === valorFiltro;
            });
        });
    },

    // Agrupar array por campo
    agruparPor(array, campo) {
        return array.reduce((grupos, item) => {
            const chave = item[campo];
            if (!grupos[chave]) {
                grupos[chave] = [];
            }
            grupos[chave].push(item);
            return grupos;
        }, {});
    },

    // Calcular estatísticas básicas
    calcularEstatisticas(array, campo) {
        if (!array.length) return null;

        const valores = array
            .map(item => parseFloat(item[campo]))
            .filter(valor => !isNaN(valor));

        if (!valores.length) return null;

        const soma = valores.reduce((acc, val) => acc + val, 0);
        const media = soma / valores.length;
        const min = Math.min(...valores);
        const max = Math.max(...valores);

        return {
            soma,
            media,
            min,
            max,
            count: valores.length
        };
    },

    // Remover duplicatas de array
    removerDuplicatas(array, campo = null) {
        if (!campo) {
            return [...new Set(array)];
        }

        const vistos = new Set();
        return array.filter(item => {
            const valor = item[campo];
            if (vistos.has(valor)) {
                return false;
            }
            vistos.add(valor);
            return true;
        });
    },

    // Formatar bytes
    formatarBytes(bytes, decimais = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimais < 0 ? 0 : decimais;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    // Aguardar tempo
    aguardar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Retry automático
    async retry(fn, tentativas = 3, delay = 1000) {
        for (let i = 0; i < tentativas; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === tentativas - 1) throw error;
                await this.aguardar(delay);
            }
        }
    }
};

// Disponibilizar globalmente
window.Helpers = Helpers;

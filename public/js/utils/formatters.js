
// Utilitários de Formatação
const Formatters = {
    // Formatar CPF
    formatarCPF(cpf) {
        if (!cpf) return '';
        const limpo = cpf.replace(/\D/g, '');
        return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatar CNS
    formatarCNS(cns) {
        if (!cns) return '';
        const limpo = cns.replace(/\D/g, '');
        return limpo.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    },

    // Formatar telefone
    formatarTelefone(telefone) {
        if (!telefone) return '';
        const limpo = telefone.replace(/\D/g, '');
        if (limpo.length === 11) {
            return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (limpo.length === 10) {
            return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    },

    // Formatar moeda
    formatarMoeda(valor) {
        if (valor === null || valor === undefined) return 'R$ 0,00';
        return parseFloat(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Formatar número AIH
    formatarNumeroAIH(numero) {
        if (!numero) return '';
        const limpo = numero.toString().replace(/\D/g, '');
        // Formato: XXXX XXXX XXXX XXXX (16 dígitos)
        return limpo.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    },

    // Formatar data
    formatarData(data) {
        if (!data) return '-';
        const dataObj = new Date(data);
        return dataObj.toLocaleDateString('pt-BR');
    },

    // Formatar data e hora
    formatarDataHora(data) {
        if (!data) return '-';
        const dataObj = new Date(data);
        return dataObj.toLocaleString('pt-BR');
    },

    // Formatar competência
    formatarCompetencia(competencia) {
        if (!competencia) return '';
        const limpo = competencia.replace(/\D/g, '');
        if (limpo.length >= 6) {
            return limpo.replace(/(\d{2})(\d{4})/, '$1/$2');
        }
        return competencia;
    },

    // Capitalizar nome
    capitalizarNome(nome) {
        if (!nome) return '';
        return nome.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },

    // Truncar texto
    truncarTexto(texto, limite = 50) {
        if (!texto) return '';
        if (texto.length <= limite) return texto;
        return texto.substring(0, limite) + '...';
    },

    // Remover acentos
    removerAcentos(texto) {
        if (!texto) return '';
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    // Converter para slug
    converterParaSlug(texto) {
        if (!texto) return '';
        return this.removerAcentos(texto)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    // Calcular idade
    calcularIdade(dataNascimento) {
        if (!dataNascimento) return null;
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    },

    // Validar e formatar número
    formatarNumero(valor, decimais = 2) {
        if (isNaN(valor)) return '0';
        return parseFloat(valor).toFixed(decimais);
    }
};

// Disponibilizar globalmente
window.Formatters = Formatters;

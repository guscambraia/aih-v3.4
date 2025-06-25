
// Componente de Formulários e Validações
const Forms = {
    // Validar CPF
    validarCPF(cpf) {
        if (!cpf) return false;
        
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        
        let soma1 = 0, soma2 = 0;
        for (let i = 0; i < 9; i++) {
            soma1 += parseInt(cpf[i]) * (10 - i);
            soma2 += parseInt(cpf[i]) * (11 - i);
        }
        
        const digito1 = ((soma1 * 10) % 11) % 10;
        soma2 += digito1 * 2;
        const digito2 = ((soma2 * 10) % 11) % 10;
        
        return parseInt(cpf[9]) === digito1 && parseInt(cpf[10]) === digito2;
    },

    // Validar CNS (Cartão Nacional de Saúde)
    validarCNS(cns) {
        if (!cns) return false;
        
        cns = cns.replace(/[^\d]/g, '');
        if (cns.length !== 15) return false;
        
        // Validação simplificada do CNS
        let soma = 0;
        for (let i = 0; i < 15; i++) {
            soma += parseInt(cns[i]) * (15 - i);
        }
        
        return soma % 11 === 0;
    },

    // Validar formulário de AIH
    validarFormularioAIH(dados) {
        const erros = [];

        if (!dados.numero_aih || dados.numero_aih.length < 10) {
            erros.push('Número da AIH deve ter pelo menos 10 dígitos');
        }

        if (!dados.nome_paciente || dados.nome_paciente.trim().length < 3) {
            erros.push('Nome do paciente deve ter pelo menos 3 caracteres');
        }

        if (dados.cpf_paciente && !this.validarCPF(dados.cpf_paciente)) {
            erros.push('CPF do paciente inválido');
        }

        if (dados.cns_paciente && !this.validarCNS(dados.cns_paciente)) {
            erros.push('CNS do paciente inválido');
        }

        if (!dados.competencia || !dados.competencia.match(/^\d{2}\/\d{4}$/)) {
            erros.push('Competência deve estar no formato MM/AAAA');
        }

        if (dados.valor_conta && (isNaN(dados.valor_conta) || dados.valor_conta < 0)) {
            erros.push('Valor da conta deve ser um número positivo');
        }

        return erros;
    },

    // Aplicar máscaras de input
    aplicarMascaras() {
        // Máscara para CPF
        document.querySelectorAll('input[data-mask="cpf"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        });

        // Máscara para CNS
        document.querySelectorAll('input[data-mask="cns"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
                e.target.value = value;
            });
        });

        // Máscara para competência
        document.querySelectorAll('input[data-mask="competencia"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d)/, '$1/$2');
                e.target.value = value;
            });
        });

        // Máscara para moeda
        document.querySelectorAll('input[data-mask="currency"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = (parseInt(value) / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
                e.target.value = value;
            });
        });
    },

    // Limpar formulário
    limparFormulario(formularioId) {
        const form = document.getElementById(formularioId);
        if (form) {
            form.reset();
            // Limpar também campos personalizados
            form.querySelectorAll('.campo-erro').forEach(campo => {
                campo.classList.remove('campo-erro');
            });
        }
    },

    // Destacar campos com erro
    destacarErros(campos) {
        // Limpar erros anteriores
        document.querySelectorAll('.campo-erro').forEach(campo => {
            campo.classList.remove('campo-erro');
        });

        // Destacar novos erros
        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.classList.add('campo-erro');
            }
        });
    }
};

// Disponibilizar globalmente
window.Forms = Forms;

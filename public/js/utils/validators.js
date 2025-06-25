
// Utilitários de Validação
const Validators = {
    // Validar CPF
    validarCPF(cpf) {
        if (!cpf) return false;
        
        const limpo = cpf.replace(/[^\d]+/g, '');
        if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;
        
        let soma1 = 0, soma2 = 0;
        for (let i = 0; i < 9; i++) {
            soma1 += parseInt(limpo[i]) * (10 - i);
            soma2 += parseInt(limpo[i]) * (11 - i);
        }
        
        const digito1 = ((soma1 * 10) % 11) % 10;
        soma2 += digito1 * 2;
        const digito2 = ((soma2 * 10) % 11) % 10;
        
        return parseInt(limpo[9]) === digito1 && parseInt(limpo[10]) === digito2;
    },

    // Validar CNS
    validarCNS(cns) {
        if (!cns) return false;
        const limpo = cns.replace(/[^\d]/g, '');
        return limpo.length === 15;
    },

    // Validar email
    validarEmail(email) {
        if (!email) return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validar telefone
    validarTelefone(telefone) {
        if (!telefone) return false;
        const limpo = telefone.replace(/[^\d]/g, '');
        return limpo.length >= 10 && limpo.length <= 11;
    },

    // Validar data
    validarData(data) {
        if (!data) return false;
        const dataObj = new Date(data);
        return !isNaN(dataObj.getTime());
    },

    // Validar competência (MM/AAAA)
    validarCompetencia(competencia) {
        if (!competencia) return false;
        const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
        return regex.test(competencia);
    },

    // Validar número AIH
    validarNumeroAIH(numero) {
        if (!numero) return false;
        const limpo = numero.toString().replace(/\D/g, '');
        return limpo.length >= 10 && limpo.length <= 16;
    },

    // Validar valor monetário
    validarValorMonetario(valor) {
        if (valor === null || valor === undefined || valor === '') return false;
        const numerico = parseFloat(valor);
        return !isNaN(numerico) && numerico >= 0;
    },

    // Validar senha
    validarSenha(senha, minimo = 4) {
        if (!senha) return false;
        return senha.length >= minimo;
    },

    // Validar campo obrigatório
    validarObrigatorio(valor) {
        return valor !== null && valor !== undefined && valor.toString().trim() !== '';
    },

    // Validar length mínimo
    validarTamanhoMinimo(valor, minimo) {
        if (!valor) return false;
        return valor.toString().trim().length >= minimo;
    },

    // Validar length máximo
    validarTamanhoMaximo(valor, maximo) {
        if (!valor) return true; // Campo vazio é válido para máximo
        return valor.toString().trim().length <= maximo;
    },

    // Validar apenas números
    validarApenasNumeros(valor) {
        if (!valor) return false;
        return /^\d+$/.test(valor.toString());
    },

    // Validar apenas letras
    validarApenasLetras(valor) {
        if (!valor) return false;
        return /^[a-zA-ZÀ-ÿ\s]+$/.test(valor.toString());
    },

    // Validar range numérico
    validarRange(valor, min, max) {
        const num = parseFloat(valor);
        if (isNaN(num)) return false;
        return num >= min && num <= max;
    },

    // Validar formulário completo
    validarFormulario(dados, regras) {
        const erros = [];

        for (const campo in regras) {
            const valor = dados[campo];
            const regra = regras[campo];

            // Validar obrigatório
            if (regra.obrigatorio && !this.validarObrigatorio(valor)) {
                erros.push(`${regra.nome || campo} é obrigatório`);
                continue;
            }

            // Se campo não é obrigatório e está vazio, pular outras validações
            if (!regra.obrigatorio && !this.validarObrigatorio(valor)) {
                continue;
            }

            // Validar tipo específico
            if (regra.tipo) {
                switch (regra.tipo) {
                    case 'cpf':
                        if (!this.validarCPF(valor)) {
                            erros.push(`${regra.nome || campo} inválido`);
                        }
                        break;
                    case 'cns':
                        if (!this.validarCNS(valor)) {
                            erros.push(`${regra.nome || campo} inválido`);
                        }
                        break;
                    case 'email':
                        if (!this.validarEmail(valor)) {
                            erros.push(`${regra.nome || campo} inválido`);
                        }
                        break;
                    case 'telefone':
                        if (!this.validarTelefone(valor)) {
                            erros.push(`${regra.nome || campo} inválido`);
                        }
                        break;
                    case 'data':
                        if (!this.validarData(valor)) {
                            erros.push(`${regra.nome || campo} inválida`);
                        }
                        break;
                    case 'competencia':
                        if (!this.validarCompetencia(valor)) {
                            erros.push(`${regra.nome || campo} deve estar no formato MM/AAAA`);
                        }
                        break;
                    case 'numero_aih':
                        if (!this.validarNumeroAIH(valor)) {
                            erros.push(`${regra.nome || campo} inválido`);
                        }
                        break;
                    case 'valor':
                        if (!this.validarValorMonetario(valor)) {
                            erros.push(`${regra.nome || campo} deve ser um valor positivo`);
                        }
                        break;
                }
            }

            // Validar tamanho mínimo
            if (regra.minimo && !this.validarTamanhoMinimo(valor, regra.minimo)) {
                erros.push(`${regra.nome || campo} deve ter pelo menos ${regra.minimo} caracteres`);
            }

            // Validar tamanho máximo
            if (regra.maximo && !this.validarTamanhoMaximo(valor, regra.maximo)) {
                erros.push(`${regra.nome || campo} deve ter no máximo ${regra.maximo} caracteres`);
            }
        }

        return erros;
    }
};

// Disponibilizar globalmente
window.Validators = Validators;

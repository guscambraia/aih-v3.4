
# 📡 API Endpoints - Sistema AIH (Versão Modular)

## 🔐 Autenticação

### POST /api/login
**Descrição:** Autentica usuário no sistema
```json
Request: { 
    "nome": "usuario", 
    "senha": "senha123" 
}

Response: { 
    "success": true,
    "token": "jwt_token_aqui", 
    "usuario": {
        "id": 1,
        "nome": "usuario"
    }
}

Error: {
    "error": true,
    "message": "Credenciais inválidas"
}
```

### POST /api/cadastrar
**Descrição:** Cadastra novo usuário (apenas admin)
```json
Request: { 
    "nome": "novo_usuario", 
    "senha": "senha123" 
}

Response: { 
    "success": true, 
    "message": "Usuário criado com sucesso",
    "userId": 2
}
```

### GET /api/verificar-token
**Descrição:** Valida token JWT
```json
Response: {
    "valid": true,
    "usuario": { "id": 1, "nome": "usuario" }
}
```

## 📊 Dashboard e Estatísticas

### GET /api/dashboard
**Descrição:** Estatísticas gerais do sistema
```json
Response: {
    "success": true,
    "data": {
        "total_cadastradas": 150,
        "em_processamento": 45,
        "por_status": {
            "1": 30,  // Finalizada aprovação direta
            "2": 25,  // Ativa aprovação indireta  
            "3": 20,  // Ativa em discussão
            "4": 75   // Finalizada após discussão
        },
        "valor_total": 450000.00,
        "valor_medio": 3000.00,
        "competencias": ["01/2024", "02/2024", "03/2024"]
    }
}
```

### GET /api/dashboard-por-competencia/:competencia
**Descrição:** Estatísticas filtradas por competência
```json
Response: {
    "success": true,
    "data": {
        "competencia": "03/2024",
        "total_aihs": 45,
        "valor_total": 135000.00,
        "distribuicao_status": { ... },
        "glosas_ativas": 12
    }
}
```

### GET /api/resumo-financeiro
**Descrição:** Resumo financeiro detalhado
```json
Response: {
    "success": true,
    "data": {
        "valor_total_inicial": 500000.00,
        "valor_total_atual": 475000.00,
        "diferenca": -25000.00,
        "percentual_reducao": 5.0,
        "por_status": {
            "1": { "valor": 200000.00, "quantidade": 30 },
            "2": { "valor": 150000.00, "quantidade": 25 },
            "3": { "valor": 75000.00, "quantidade": 20 },
            "4": { "valor": 50000.00, "quantidade": 75 }
        }
    }
}
```

## 🏥 Gestão de AIH

### GET /api/aih/:numero
**Descrição:** Busca AIH por número
```json
Response: {
    "success": true,
    "data": {
        "id": 1,
        "numero_aih": "1234567890123",
        "valor_inicial": 1500.00,
        "valor_atual": 1200.00,
        "status": 2,
        "competencia": "12/2024",
        "atendimentos": ["A001", "A002", "A003"],
        "observacoes": "Observações gerais da AIH",
        "criado_em": "2024-01-15T10:30:00Z",
        "usuario_cadastro": "usuario1",
        "movimentacoes": [...],
        "glosas": [...],
        "estatisticas": {
            "total_movimentacoes": 3,
            "glosas_ativas": 2,
            "dias_em_processamento": 15
        }
    }
}

Error: {
    "error": true,
    "message": "AIH não encontrada"
}
```

### POST /api/aih
**Descrição:** Cadastra nova AIH
```json
Request: {
    "numero_aih": "1234567890123",
    "valor_inicial": 1500.00,
    "competencia": "12/2024",
    "atendimentos": ["A001", "A002"],
    "observacoes": "Observações iniciais"
}

Response: { 
    "success": true, 
    "id": 1,
    "message": "AIH cadastrada com sucesso"
}

Validações:
- numero_aih: 13 dígitos, único
- valor_inicial: > 0
- competencia: formato MM/YYYY
- atendimentos: array não vazio
```

### PUT /api/aih/:id
**Descrição:** Atualiza dados da AIH
```json
Request: {
    "valor_inicial": 1600.00,
    "observacoes": "Observações atualizadas"
}

Response: {
    "success": true,
    "message": "AIH atualizada com sucesso"
}
```

### GET /api/aih/:id/historico-completo
**Descrição:** Histórico detalhado da AIH
```json
Response: {
    "success": true,
    "data": {
        "aih": { ... },
        "historico": [
            {
                "tipo": "cadastro",
                "data": "2024-01-15T10:30:00Z",
                "usuario": "usuario1",
                "detalhes": "AIH cadastrada"
            },
            {
                "tipo": "movimentacao",
                "data": "2024-01-16T14:20:00Z",
                "usuario": "usuario2",
                "detalhes": "Entrada na auditoria SUS"
            }
        ]
    }
}
```

## 🔄 Movimentações

### GET /api/aih/:id/proxima-movimentacao
**Descrição:** Determina próxima movimentação possível
```json
Response: {
    "success": true,
    "data": {
        "tipo_sugerido": "saida_hospital",
        "status_atual": 2,
        "pode_finalizar": true,
        "glosas_pendentes": 1,
        "sugestoes": {
            "competencia": "12/2024",
            "profissionais": {
                "medicina": "Dr. Silva",
                "enfermagem": "Enf. Maria"
            }
        }
    }
}
```

### POST /api/aih/:id/movimentacao
**Descrição:** Registra nova movimentação
```json
Request: {
    "tipo": "entrada_sus",
    "status_aih": 2,
    "valor_conta": 1200.00,
    "competencia": "12/2024",
    "prof_medicina": "Dr. Silva",
    "prof_enfermagem": "Enf. Maria",
    "prof_fisioterapia": null,
    "prof_bucomaxilo": "Dr. Santos",
    "observacoes": "Movimentação normal"
}

Response: {
    "success": true,
    "movimentacao_id": 15,
    "message": "Movimentação registrada com sucesso"
}
```

### POST /api/aih/:id/movimentacao-completa
**Descrição:** Registra movimentação com glosas em uma transação
```json
Request: {
    "movimentacao": { ... },
    "glosas": [
        {
            "linha": "Material cirúrgico",
            "tipo": "Quantidade excessiva",
            "profissional": "Dr. Silva",
            "quantidade": 2
        }
    ]
}

Response: {
    "success": true,
    "movimentacao_id": 15,
    "glosas_criadas": 2,
    "message": "Movimentação e glosas registradas"
}
```

### GET /api/movimentacoes/recentes
**Descrição:** Últimas movimentações do sistema
```json
Response: {
    "success": true,
    "data": [
        {
            "id": 15,
            "aih_numero": "1234567890123",
            "tipo": "entrada_sus",
            "data_movimentacao": "2024-01-16T14:20:00Z",
            "usuario": "usuario2",
            "status_aih": 2
        }
    ]
}
```

## 🔍 Glosas e Pendências

### GET /api/aih/:id/glosas
**Descrição:** Lista glosas da AIH
```json
Response: {
    "success": true,
    "data": {
        "glosas": [
            {
                "id": 1,
                "linha": "Material cirúrgico",
                "tipo": "Quantidade excessiva",
                "profissional": "Dr. Silva",
                "quantidade": 2,
                "ativa": true,
                "criado_em": "2024-01-16T15:00:00Z",
                "observacoes": "Revisão necessária"
            }
        ],
        "resumo": {
            "total": 5,
            "ativas": 3,
            "resolvidas": 2
        }
    }
}
```

### POST /api/aih/:id/glosas
**Descrição:** Adiciona nova glosa
```json
Request: {
    "linha": "Material cirúrgico",
    "tipo": "Quantidade excessiva",
    "profissional": "Dr. Silva",
    "quantidade": 1,
    "observacoes": "Observações da glosa"
}

Response: {
    "success": true,
    "glosa_id": 25,
    "message": "Glosa adicionada com sucesso"
}
```

### PUT /api/glosas/:id
**Descrição:** Atualiza glosa
```json
Request: {
    "ativa": false,
    "observacoes": "Glosa resolvida após discussão"
}

Response: {
    "success": true,
    "message": "Glosa atualizada"
}
```

### DELETE /api/glosas/:id
**Descrição:** Remove glosa
```json
Response: { 
    "success": true,
    "message": "Glosa removida com sucesso"
}
```

### GET /api/glosas/estatisticas
**Descrição:** Estatísticas de glosas
```json
Response: {
    "success": true,
    "data": {
        "total_glosas": 150,
        "ativas": 45,
        "por_tipo": {
            "Quantidade excessiva": 30,
            "Procedimento inadequado": 15
        },
        "por_profissional": {
            "Dr. Silva": 25,
            "Dr. Santos": 20
        },
        "tendencia_mensal": [...]
    }
}
```

## 🔎 Pesquisa Avançada

### POST /api/pesquisar
**Descrição:** Pesquisa avançada com filtros
```json
Request: {
    "filtros": {
        "status": [2, 3],
        "competencia": "12/2024",
        "data_inicio": "2024-12-01",
        "data_fim": "2024-12-31",
        "profissional": "Dr. Silva",
        "valor_min": 1000.00,
        "valor_max": 5000.00,
        "tem_glosas": true,
        "numero_aih": "123456",
        "numero_atendimento": "A001"
    },
    "ordenacao": {
        "campo": "data_movimentacao",
        "direcao": "DESC"
    },
    "paginacao": {
        "page": 1,
        "limit": 50
    }
}

Response: {
    "success": true,
    "data": {
        "items": [...],
        "total": 150,
        "page": 1,
        "limit": 50,
        "totalPages": 3,
        "hasNext": true,
        "hasPrev": false
    }
}
```

### GET /api/pesquisa-rapida/:termo
**Descrição:** Busca rápida por termo
```json
Response: {
    "success": true,
    "data": {
        "aihs": [...],
        "atendimentos": [...],
        "total_encontrados": 15
    }
}
```

## 👨‍⚕️ Profissionais

### GET /api/profissionais
**Descrição:** Lista todos os profissionais
```json
Response: {
    "success": true,
    "data": {
        "profissionais": [
            {
                "id": 1,
                "nome": "Dr. Silva",
                "especialidade": "Medicina"
            }
        ],
        "por_especialidade": {
            "Medicina": 15,
            "Enfermagem": 10,
            "Fisioterapia": 5,
            "Bucomaxilo": 3
        }
    }
}
```

### POST /api/profissionais
**Descrição:** Adiciona novo profissional
```json
Request: { 
    "nome": "Dr. Costa", 
    "especialidade": "Medicina" 
}

Response: {
    "success": true,
    "profissional_id": 20,
    "message": "Profissional adicionado"
}
```

### PUT /api/profissionais/:id
**Descrição:** Atualiza profissional
```json
Request: {
    "nome": "Dr. Costa Silva",
    "especialidade": "Medicina"
}

Response: {
    "success": true,
    "message": "Profissional atualizado"
}
```

### DELETE /api/profissionais/:id
**Descrição:** Remove profissional
```json
Response: {
    "success": true,
    "message": "Profissional removido"
}

Warning: {
    "warning": true,
    "message": "Profissional tem movimentações associadas",
    "can_delete": false
}
```

### GET /api/profissionais/:id/estatisticas
**Descrição:** Estatísticas do profissional
```json
Response: {
    "success": true,
    "data": {
        "profissional": { ... },
        "total_aihs": 45,
        "total_movimentacoes": 78,
        "distribuicao_status": { ... },
        "periodo_ativo": {
            "primeira_movimentacao": "2024-01-01",
            "ultima_movimentacao": "2024-03-15"
        }
    }
}
```

## 📋 Tipos de Glosa

### GET /api/tipos-glosa
**Descrição:** Lista tipos de glosa
```json
Response: {
    "success": true,
    "data": {
        "tipos": [
            {
                "id": 1,
                "descricao": "Quantidade excessiva"
            }
        ]
    }
}
```

### POST /api/tipos-glosa
**Descrição:** Adiciona tipo de glosa
```json
Request: {
    "descricao": "Procedimento não autorizado"
}

Response: {
    "success": true,
    "tipo_id": 15,
    "message": "Tipo de glosa adicionado"
}
```

### DELETE /api/tipos-glosa/:id
**Descrição:** Remove tipo de glosa
```json
Response: {
    "success": true,
    "message": "Tipo removido com sucesso"
}
```

## 📊 Relatórios

### GET /api/relatorios/:tipo
**Tipos disponíveis:** acessos, glosas-profissional, aihs-profissional, aprovacoes, tipos-glosa, analise-preditiva

**Parâmetros de query:**
- `data_inicio`: Data início (YYYY-MM-DD)
- `data_fim`: Data fim (YYYY-MM-DD)
- `competencia`: Competência específica (MM/YYYY)
- `formato`: json (padrão) | csv | excel

```json
Response: {
    "success": true,
    "data": {
        "titulo": "Relatório de Aprovações",
        "periodo": "01/12/2024 a 31/12/2024",
        "dados": [...],
        "resumo": { ... },
        "gerado_em": "2024-01-16T16:00:00Z"
    }
}
```

### POST /api/relatorios/customizado
**Descrição:** Gera relatório customizado
```json
Request: {
    "campos": ["numero_aih", "status", "valor_atual"],
    "filtros": { ... },
    "agrupamento": "status",
    "funcoes": ["count", "sum", "avg"]
}

Response: {
    "success": true,
    "data": {
        "relatorio": [...],
        "metadados": { ... }
    }
}
```

## 📤 Exportações

### GET /api/export/:formato
**Formatos:** csv, excel, json
**Descrição:** Exporta dados completos do sistema

```json
Query Parameters:
- filtros: JSON com filtros
- campos: Campos a exportar
- limite: Máximo de registros

Response: Arquivo para download
Headers: Content-Disposition: attachment; filename="export.csv"
```

### GET /api/export/aih/:id/historico
**Descrição:** Exporta histórico específico da AIH
```json
Response: Arquivo Excel com:
- Dados da AIH
- Histórico de movimentações  
- Glosas associadas
- Gráficos de evolução
```

### POST /api/export/pesquisa-avancada
**Descrição:** Exporta resultado de pesquisa avançada
```json
Request: {
    "filtros": { ... },
    "formato": "excel",
    "incluir": ["movimentacoes", "glosas"]
}

Response: Arquivo para download
```

## 💾 Backup e Manutenção

### GET /api/backup
**Descrição:** Download do banco de dados completo
```
Response: Arquivo SQLite para download
Headers: Content-Disposition: attachment; filename="backup-YYYYMMDD.db"
```

### POST /api/backup/restaurar
**Descrição:** Restaura backup (apenas admin)
```json
Request: FormData com arquivo .db

Response: {
    "success": true,
    "message": "Backup restaurado com sucesso",
    "registros_importados": 1500
}
```

### GET /api/sistema/status
**Descrição:** Status do sistema
```json
Response: {
    "success": true,
    "data": {
        "versao": "2.0.0",
        "banco": {
            "tamanho_mb": 2.5,
            "total_registros": 1500,
            "ultima_manutencao": "2024-01-15T10:00:00Z"
        },
        "performance": {
            "tempo_resposta_medio": 150,
            "uptime": 172800,
            "memoria_usada": "45MB"
        }
    }
}
```

### POST /api/sistema/manutencao
**Descrição:** Executa manutenção do banco
```json
Response: {
    "success": true,
    "acoes_executadas": [
        "Logs antigos removidos: 500 registros",
        "Banco otimizado (VACUUM)",
        "Índices recriados"
    ],
    "tamanho_anterior": "3.2MB",
    "tamanho_atual": "2.5MB"
}
```

## 📈 Logs e Auditoria

### GET /api/logs/usuario/:id
**Descrição:** Logs de ações do usuário
```json
Response: {
    "success": true,
    "data": {
        "logs": [
            {
                "id": 100,
                "acao": "LOGIN",
                "data_hora": "2024-01-16T16:00:00Z",
                "detalhes": "{\"ip\": \"192.168.1.100\"}"
            }
        ],
        "resumo": {
            "total_acoes": 50,
            "ultima_acao": "2024-01-16T16:00:00Z",
            "acoes_mais_comuns": { ... }
        }
    }
}
```

### GET /api/logs/aih/:id
**Descrição:** Logs relacionados à AIH específica
```json
Response: {
    "success": true,
    "data": {
        "aih": { ... },
        "logs": [
            {
                "acao": "AIH_CRIADA",
                "usuario": "usuario1",
                "data_hora": "2024-01-15T10:30:00Z"
            }
        ]
    }
}
```

### GET /api/logs/sistema
**Descrição:** Logs gerais do sistema (apenas admin)
```json
Response: {
    "success": true,
    "data": {
        "logs_recentes": [...],
        "estatisticas": {
            "total_logins": 150,
            "total_aihs_criadas": 45,
            "total_movimentacoes": 89
        }
    }
}
```

## 🔧 Middlewares Utilizados

### verificarToken
**Descrição:** Valida JWT em rotas protegidas
```javascript
Headers: {
    "Authorization": "Bearer jwt_token_aqui"
}

Adiciona ao req:
- req.userId: ID do usuário
- req.usuario: Dados do usuário
```

### logAcao
**Descrição:** Registra ação no log
```javascript
// Automaticamente registra:
// - Usuário que executou
// - Ação realizada  
// - Timestamp
// - Detalhes da requisição
```

### validarDados
**Descrição:** Valida dados de entrada
```javascript
// Valida conforme esquema definido
// Retorna 400 Bad Request se inválido
```

## ⚡ Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado (token inválido/expirado)
- **403**: Forbidden (sem permissão)
- **404**: Não encontrado
- **409**: Conflito (dados duplicados)
- **422**: Dados inválidos (validação)
- **500**: Erro interno do servidor

## 🔄 Rate Limiting

Implementado rate limiting básico:
- **Login**: 5 tentativas por minuto por IP
- **API Geral**: 100 requisições por minuto por usuário
- **Exports**: 10 por hora por usuário

## 📝 Versionamento da API

Todas as rotas são versionadas com prefixo `/api/v1/` (atual: v1)
Headers de resposta incluem:
- `X-API-Version`: 1.0
- `X-RateLimit-Remaining`: Requisições restantes
- `X-Response-Time`: Tempo de resposta em ms

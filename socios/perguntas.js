/* AUVRIUN · Questionário societário · Versão 1 */
window.AUVRIUN_SURVEY = {
  "version": 1,
  "company": "AUVRIUN",
  "unassigned": "A definir em conjunto",
  "sections": [
    {
      "id": "bloco_1",
      "title": "Estrutura e capital",
      "description": "Quem é dono de quê e quais serão as obrigações de capital.",
      "questions": [
        {
          "id": "participacao",
          "prompt": "Como serão distribuídas as quotas da sociedade?",
          "help": "Especifiquem os percentuais no comentário se não forem iguais.",
          "options": [
            "Divisão igualitária entre os três",
            "Percentuais diferentes, definidos por contribuição",
            "Percentuais diferentes, definidos por negociação",
            "A definir em conjunto"
          ]
        },
        {
          "id": "capital_inicial",
          "prompt": "Como será definido o capital social inicial?",
          "help": "Indiquem valor e prazo desejados no comentário.",
          "options": [
            "Aporte em dinheiro dos três",
            "Aporte em dinheiro e bens ou direitos avaliados",
            "Capital inicial mínimo, com futuros aportes planejados",
            "A definir em conjunto"
          ]
        },
        {
          "id": "aporte_desigual",
          "prompt": "Se os aportes iniciais forem diferentes, como isso refletirá nas quotas?",
          "help": "Aporte e participação não precisam seguir automaticamente a mesma proporção.",
          "options": [
            "Quotas proporcionais aos aportes",
            "Quotas negociadas independentemente do aporte",
            "Excedente como empréstimo do sócio à empresa",
            "A definir em conjunto"
          ]
        },
        {
          "id": "participacao_trabalho",
          "prompt": "A dedicação de trabalho pode alterar quotas futuras?",
          "help": "Exige instrumento específico e análise jurídica; serviço não integraliza capital de LTDA.",
          "options": [
            "Quotas ficam fixas salvo negociação formal",
            "Prever opção de compra condicionada a metas",
            "Rever participações em datas pré-definidas",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_2",
      "title": "Atuação e responsabilidades",
      "description": "Papel de cada sócio na operação de consultoria.",
      "questions": [
        {
          "id": "funcao",
          "prompt": "Como definir as responsabilidades dos três?",
          "help": "Detalhar funções de cada um no comentário.",
          "options": [
            "Áreas e responsáveis formalmente definidos",
            "Todos compartilham funções com liderança por projeto",
            "Responsabilidades flexíveis definidas em reuniões",
            "A definir em conjunto"
          ]
        },
        {
          "id": "dedicacao",
          "prompt": "Como cobrar dedicação e entregas?",
          "help": "Separar obrigações de trabalho de direitos como quotista.",
          "options": [
            "Carga horária e disponibilidade mínimas",
            "Metas e entregas, sem horas mínimas",
            "Compromissos acordados individualmente",
            "A definir em conjunto"
          ]
        },
        {
          "id": "trabalho_todos",
          "prompt": "Qual será o envolvimento esperado de cada sócio?",
          "help": "Pode haver sócio que atua apenas no comercial ou na gestão.",
          "options": [
            "Os três trabalham regularmente",
            "Atuação diferente conforme área e disponibilidade",
            "Um ou mais poderão ser apenas investidores",
            "A definir em conjunto"
          ]
        },
        {
          "id": "prestacao_contas",
          "prompt": "Como acompanhar o trabalho e os resultados?",
          "help": "Escolher uma rotina simples de governança.",
          "options": [
            "Reunião e relatório semanal",
            "Reunião e relatório mensal",
            "Acompanhamento por projeto e reunião sob demanda",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_3",
      "title": "Carteira de clientes",
      "description": "Regras para negócios anteriores e posteriores à sociedade.",
      "questions": [
        {
          "id": "clientes_previos",
          "prompt": "O que acontece com clientes que os sócios já atendiam?",
          "help": "É fundamental identificar e documentar a carteira anterior.",
          "options": [
            "Permanecem fora da AUVRIUN, salvo acordo",
            "São transferidos formalmente quando possível",
            "Decisão individual por cliente e contrato",
            "A definir em conjunto"
          ]
        },
        {
          "id": "clientes_novos",
          "prompt": "A quem pertencem os contratos de clientes captados após a abertura?",
          "help": "Considerar clientes originados pelo relacionamento pessoal de um sócio.",
          "options": [
            "Todos os contratos novos são da AUVRIUN",
            "Regra geral da AUVRIUN, com exceções escritas",
            "Cada projeto define a titularidade comercial",
            "A definir em conjunto"
          ]
        },
        {
          "id": "comissao_captacao",
          "prompt": "Quem traz um novo cliente recebe comissão adicional?",
          "help": "Definir percentual, prazo e base de cálculo depois.",
          "options": [
            "Sim, comissão sobre receita recebida",
            "Sim, comissão sobre margem do projeto",
            "Não, captação faz parte da função remunerada",
            "A definir em conjunto"
          ]
        },
        {
          "id": "cliente_saida",
          "prompt": "Como tratar clientes atendidos por um sócio que sai?",
          "help": "Respeitar os contratos existentes e a liberdade de escolha do cliente.",
          "options": [
            "Contratos e carteira da empresa permanecem na AUVRIUN",
            "Regras de transição negociadas por cliente",
            "Possibilidade de negociação de carteira com compensação",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_4",
      "title": "Comercial e contratos",
      "description": "Quem negocia, aprova preços e assume compromissos.",
      "questions": [
        {
          "id": "assinar_contratos",
          "prompt": "Quem pode assinar propostas e contratos em nome da empresa?",
          "help": "Poder formal e alçadas devem coincidir.",
          "options": [
            "Administrador formal dentro de limites",
            "Qualquer administrador com limites definidos",
            "Duas assinaturas acima de valor definido",
            "A definir em conjunto"
          ]
        },
        {
          "id": "preco",
          "prompt": "Como aprovar a precificação dos serviços?",
          "help": "Definir piso de margem ou tabela-base no comentário.",
          "options": [
            "Responsável comercial respeita tabela e margem",
            "Cada proposta relevante exige aprovação de dois",
            "Preços definidos pelo responsável de cada projeto",
            "A definir em conjunto"
          ]
        },
        {
          "id": "desconto",
          "prompt": "Quem pode conceder descontos?",
          "help": "Sugiram percentual máximo no comentário.",
          "options": [
            "Autonomia até limite predefinido",
            "Qualquer desconto exige aprovação",
            "Desconto mediante justificativa e aprovação por alçada",
            "A definir em conjunto"
          ]
        },
        {
          "id": "escopo",
          "prompt": "Como prevenir conflito sobre o que foi vendido ao cliente?",
          "help": "Protege orçamento, entregáveis, prazos e reajustes.",
          "options": [
            "Proposta e escopo escritos obrigatórios em todo projeto",
            "Obrigatórios somente acima de valor mínimo",
            "Modelo simplificado para serviços recorrentes",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_5",
      "title": "Execução dos serviços",
      "description": "Projetos, remuneração técnica, equipes e riscos.",
      "questions": [
        {
          "id": "distribuicao_projetos",
          "prompt": "Como alocar sócios nos projetos?",
          "help": "Distinguir relacionamento comercial de execução.",
          "options": [
            "Por especialidade e disponibilidade",
            "Por escolha do responsável comercial",
            "Por acordo prévio dos três",
            "A definir em conjunto"
          ]
        },
        {
          "id": "remunerar_execucao",
          "prompt": "Quem efetivamente executa a consultoria recebe remuneração adicional?",
          "help": "Pode haver pagamento por horas, etapa ou projeto, devidamente formalizado.",
          "options": [
            "Sim, por horas ou diárias executadas",
            "Sim, percentual da margem do projeto",
            "Não, somente pró-labore e lucros",
            "A definir em conjunto"
          ]
        },
        {
          "id": "terceirizar",
          "prompt": "Como contratar terceiros ou parceiros para executar serviços?",
          "help": "Definir alçada e aprovação de custos.",
          "options": [
            "Responsável do projeto dentro do orçamento",
            "Aprovação por dois sócios",
            "Aprovação dos três sócios",
            "A definir em conjunto"
          ]
        },
        {
          "id": "prejuizo_projeto",
          "prompt": "Como lidar com prejuízos e retrabalhos de um projeto?",
          "help": "Responsabilidades pessoais precisam respeitar a lei e a análise de culpa.",
          "options": [
            "Risco operacional assumido pela empresa",
            "Análise formal da causa e eventual responsabilização cabível",
            "Reserva financeira preventiva por projeto",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_6",
      "title": "Pró-labore e remuneração",
      "description": "Pagar pelo trabalho e pelo capital sem confundir as duas coisas.",
      "questions": [
        {
          "id": "prolabore_criterio",
          "prompt": "Como definir o pró-labore dos sócios que trabalham?",
          "help": "Pró-labore não é a mesma coisa que lucro.",
          "options": [
            "Mesmo valor para sócios com funções equivalentes",
            "Conforme função, dedicação e responsabilidade",
            "Sem pró-labore no início, sujeito a revisão legal e contábil",
            "A definir em conjunto"
          ]
        },
        {
          "id": "prolabore_inicio",
          "prompt": "Quando começar a pagar pró-labore?",
          "help": "Ajustar o plano ao caixa e às obrigações tributárias.",
          "options": [
            "Desde o primeiro mês de operação",
            "Após atingir receita recorrente mínima",
            "Conforme orçamento aprovado mensalmente",
            "A definir em conjunto"
          ]
        },
        {
          "id": "pagamento_comercial",
          "prompt": "Como combinar remuneração comercial e pró-labore?",
          "help": "Evitar pagar duas vezes pela mesma atividade sem critério.",
          "options": [
            "Comissão comercial separada",
            "Comercial incluído no pró-labore",
            "Modelo híbrido com metas e limites",
            "A definir em conjunto"
          ]
        },
        {
          "id": "reembolso",
          "prompt": "Como reembolsar despesas dos sócios?",
          "help": "Combustível, viagens, refeições, hospedagem e ferramentas.",
          "options": [
            "Comprovantes e política de limites",
            "Orçamento fixo mensal por função",
            "Aprovação prévia de cada despesa",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_7",
      "title": "Lucros e caixa",
      "description": "Quando distribuir resultados e quanto reter.",
      "questions": [
        {
          "id": "dividir_lucro",
          "prompt": "Como distribuir os lucros entre quotistas?",
          "help": "Distribuição diversa das quotas demanda previsão válida e revisão jurídica.",
          "options": [
            "Proporcional às quotas",
            "Proporção definida em acordo, distinta das quotas",
            "Modelo especial por períodos ou metas, conforme lei",
            "A definir em conjunto"
          ]
        },
        {
          "id": "frequencia_lucro",
          "prompt": "Com qual periodicidade distribuir lucros?",
          "help": "Somente havendo resultado e condições legais.",
          "options": [
            "Mensal",
            "Trimestral",
            "Semestral ou anual",
            "A definir em conjunto"
          ]
        },
        {
          "id": "reserva_caixa",
          "prompt": "Qual reserva mínima antes de distribuir lucros?",
          "help": "Baseada em meses de despesas fixas.",
          "options": [
            "Três meses de despesas fixas",
            "Seis meses de despesas fixas",
            "Percentual da receita ou critério de liquidez",
            "A definir em conjunto"
          ]
        },
        {
          "id": "prejuizo",
          "prompt": "O que fazer quando um período dá prejuízo?",
          "help": "Não presumir obrigação pessoal ilimitada dos sócios.",
          "options": [
            "Suspender distribuição e rever despesas",
            "Formar plano de recuperação e orçamento",
            "Avaliar aporte formal mediante aprovação",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_8",
      "title": "Finanças e alçadas",
      "description": "Gastos, movimentações, garantias e controles.",
      "questions": [
        {
          "id": "movimentacao",
          "prompt": "Como movimentar a conta bancária da AUVRIUN?",
          "help": "A conta deve ser da pessoa jurídica.",
          "options": [
            "Administrador autorizado com prestação de contas",
            "Dupla aprovação acima de limite",
            "Duas aprovações em toda transferência relevante",
            "A definir em conjunto"
          ]
        },
        {
          "id": "limite_despesa",
          "prompt": "Qual limite para despesa individual sem aprovação extra?",
          "help": "Informar valor desejado no comentário.",
          "options": [
            "Até R$ 1.000",
            "Até R$ 5.000",
            "Até R$ 10.000",
            "A definir em conjunto"
          ]
        },
        {
          "id": "emprestimos",
          "prompt": "Como aprovar financiamentos, empréstimos e garantias?",
          "help": "Garantias pessoais precisam de consentimento expresso de quem as prestará.",
          "options": [
            "Aprovação unânime dos três",
            "Quórum reforçado conforme contrato e legislação",
            "Proibição inicial de dívida sem revisão do acordo",
            "A definir em conjunto"
          ]
        },
        {
          "id": "transparencia",
          "prompt": "Qual nível de acesso aos números e contratos da empresa?",
          "help": "Sigilo externo não deve impedir fiscalização pelos sócios.",
          "options": [
            "Painel financeiro e contratos para todos",
            "Relatórios mensais completos para todos",
            "Acesso sob solicitação e prestação de contas periódica",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_9",
      "title": "Aportes e crescimento",
      "description": "Quando a empresa precisa de mais capital.",
      "questions": [
        {
          "id": "aporte_futuro",
          "prompt": "Como financiar expansão ou falta de caixa?",
          "help": "Distinguir aporte de capital de empréstimo dos sócios.",
          "options": [
            "Aportes proporcionais aprovados formalmente",
            "Empréstimos voluntários dos sócios",
            "Financiamento externo sujeito a quórum",
            "A definir em conjunto"
          ]
        },
        {
          "id": "socio_nao_aporta",
          "prompt": "E se um sócio não acompanhar um aporte aprovado?",
          "help": "Não prever perda automática de quotas sem base legal.",
          "options": [
            "Negociar empréstimo entre sócios ou à empresa",
            "Avaliar aumento de capital com direito de preferência",
            "Revisar plano e reduzir necessidade de investimento",
            "A definir em conjunto"
          ]
        },
        {
          "id": "emprestimo_socio",
          "prompt": "Empréstimos dos sócios terão quais condições?",
          "help": "Definir juros, correção, vencimento e prioridade de pagamento.",
          "options": [
            "Mesmo critério financeiro para qualquer sócio",
            "Condições aprovadas caso a caso",
            "Preferência por não usar empréstimos entre sócio e empresa",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_10",
      "title": "Administração e votos",
      "description": "Deliberação por quotas, autonomia e impasses.",
      "questions": [
        {
          "id": "administracao",
          "prompt": "Quem administrará legalmente a empresa?",
          "help": "Pode haver um ou mais administradores; definir poderes.",
          "options": [
            "Um administrador designado",
            "Dois administradores com alçadas",
            "Os três como administradores",
            "A definir em conjunto"
          ]
        },
        {
          "id": "votos",
          "prompt": "Como estruturar decisões além dos quóruns legais?",
          "help": "Número de pessoas e percentual das quotas são coisas distintas.",
          "options": [
            "Pela proporção das quotas",
            "Quóruns reforçados para temas estratégicos",
            "Buscar consenso com mecanismo de impasse",
            "A definir em conjunto"
          ]
        },
        {
          "id": "decisoes_reservadas",
          "prompt": "Quais assuntos precisam de aprovação especial?",
          "help": "No comentário, listar os assuntos inegociáveis.",
          "options": [
            "Endividamento, quotas, grandes gastos e venda",
            "Também contratação, pró-labore e contratos relevantes",
            "Todos os assuntos estratégicos definidos em anexo",
            "A definir em conjunto"
          ]
        },
        {
          "id": "impasse",
          "prompt": "Como resolver um empate ou divergência prolongada?",
          "help": "A regra precisa evitar paralisar a operação.",
          "options": [
            "Negociação e mediação com prazo",
            "Mediação e parecer de terceiro independente",
            "Cláusula de saída ou compra de quotas após mediação",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_11",
      "title": "Conduta, concorrência e sigilo",
      "description": "Conflitos de interesse e reputação da sociedade.",
      "questions": [
        {
          "id": "atividade_paralela",
          "prompt": "Um sócio pode prestar consultoria fora da AUVRIUN?",
          "help": "Considerar conflitos com clientes e concorrência.",
          "options": [
            "Sim, com comunicação e ausência de conflito",
            "Somente com autorização escrita",
            "Não em atividades concorrentes durante a sociedade",
            "A definir em conjunto"
          ]
        },
        {
          "id": "concorrencia",
          "prompt": "Como tratar atuação concorrente durante e após a saída?",
          "help": "Limites precisam ser razoáveis e juridicamente válidos.",
          "options": [
            "Restrição somente durante a sociedade",
            "Restrições pós-saída com prazo e escopo definidos",
            "Analisar cada caso e cliente em acordo específico",
            "A definir em conjunto"
          ]
        },
        {
          "id": "confidencialidade",
          "prompt": "Qual proteção aplicar a dados, propostas e metodologias?",
          "help": "Clientes e dados devem ser tratados conforme contratos e LGPD.",
          "options": [
            "Termo de sigilo separado e específico",
            "Cláusula geral de sigilo no acordo",
            "Política completa de segurança e confidencialidade",
            "A definir em conjunto"
          ]
        },
        {
          "id": "conflito_interesse",
          "prompt": "Como agir se um sócio tiver interesse pessoal em uma decisão?",
          "help": "Prever declaração, registro e impedimentos conforme lei.",
          "options": [
            "Declarar interesse e não participar da deliberação quando cabível",
            "Submeter o assunto aos demais e documentar",
            "Exigir parecer independente para transações relacionadas",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_12",
      "title": "Inadimplemento e responsabilidade",
      "description": "Descumprimento, atrasos, dano e tratamento justo.",
      "questions": [
        {
          "id": "descumprimento",
          "prompt": "Como agir diante de obrigações não cumpridas?",
          "help": "Evitar punições automáticas e desproporcionais.",
          "options": [
            "Notificação escrita e prazo para corrigir",
            "Plano de melhoria com metas e prazo",
            "Mediação antes de medidas societárias",
            "A definir em conjunto"
          ]
        },
        {
          "id": "reincidencia",
          "prompt": "Como tratar descumprimento recorrente?",
          "help": "Mudança de função e exclusão têm requisitos diferentes.",
          "options": [
            "Revisar função e remuneração pelo trabalho",
            "Aplicar medidas graduais documentadas",
            "Avaliar medidas legais societárias em último caso",
            "A definir em conjunto"
          ]
        },
        {
          "id": "erro_profissional",
          "prompt": "Como tratar erros graves em consultorias?",
          "help": "Responsabilidade pessoal exige análise jurídica das circunstâncias.",
          "options": [
            "Investigação interna e plano de correção",
            "Contratação de seguro de responsabilidade profissional",
            "Procedimento de responsabilização conforme culpa e lei",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_13",
      "title": "Entrada e saída de sócios",
      "description": "Transferir quotas sem destruir o negócio.",
      "questions": [
        {
          "id": "entrada_novo",
          "prompt": "Como permitir ingresso de novo sócio ou investidor?",
          "help": "Respeitar direitos de preferência e quóruns legais.",
          "options": [
            "Somente por unanimidade quando juridicamente cabível",
            "Conforme quórum societário reforçado",
            "Conforme critérios financeiros e estratégicos previstos",
            "A definir em conjunto"
          ]
        },
        {
          "id": "aviso_saida",
          "prompt": "Quanto aviso um sócio deve dar para sair voluntariamente?",
          "help": "Sujeito a hipóteses e prazos legais aplicáveis.",
          "options": [
            "60 dias ou prazo legal maior",
            "90 dias, se juridicamente aplicável",
            "Prazo negociado com transição de clientes",
            "A definir em conjunto"
          ]
        },
        {
          "id": "avaliacao_saida",
          "prompt": "Como calcular o valor da participação de quem sai?",
          "help": "A apuração deve respeitar normas aplicáveis.",
          "options": [
            "Patrimônio e balanço de determinação",
            "Avaliação econômico-financeira por profissional independente",
            "Fórmula contratual negociada com revisão jurídica",
            "A definir em conjunto"
          ]
        },
        {
          "id": "pagamento_saida",
          "prompt": "Em quanto tempo pagar os haveres do sócio que sai?",
          "help": "Considerar prazos legais, liquidez e proteção da operação.",
          "options": [
            "Até 6 meses, se admissível",
            "Em até 12 parcelas, se admissível",
            "Em até 24 parcelas, se admissível",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_14",
      "title": "Falecimento e incapacidade",
      "description": "Continuidade e relacionamento com herdeiros.",
      "questions": [
        {
          "id": "herdeiros",
          "prompt": "Como lidar com quotas de sócio falecido?",
          "help": "Regras de sucessão e liquidação devem observar a lei.",
          "options": [
            "Apurar e pagar haveres aos herdeiros",
            "Possibilidade de ingresso de herdeiros mediante critérios",
            "Opção de compra pelos remanescentes conforme contrato",
            "A definir em conjunto"
          ]
        },
        {
          "id": "incapacidade",
          "prompt": "O que fazer se um sócio ficar incapaz de trabalhar?",
          "help": "Separar função executiva, quotas e proteção financeira.",
          "options": [
            "Substituir função e manter direitos societários cabíveis",
            "Plano de afastamento e transição",
            "Seguro e regras específicas de substituição",
            "A definir em conjunto"
          ]
        },
        {
          "id": "seguro",
          "prompt": "A sociedade deveria manter seguros de proteção?",
          "help": "Pode incluir RC profissional e vida de sócio-chave.",
          "options": [
            "Seguro de responsabilidade profissional",
            "Seguro adicional para sócios-chave",
            "Avaliar contratação depois do primeiro ano",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_15",
      "title": "Venda, encerramento e transição",
      "description": "O que acontece com a empresa como um todo.",
      "questions": [
        {
          "id": "vender_empresa",
          "prompt": "Como aprovar uma proposta de venda integral da empresa?",
          "help": "Regras de venda conjunta e preço mínimo podem ser negociadas.",
          "options": [
            "Unanimidade, nos limites legais",
            "Quórum reforçado e proteção aos minoritários",
            "Avaliação independente e deliberação conforme acordo",
            "A definir em conjunto"
          ]
        },
        {
          "id": "venda_parcial",
          "prompt": "Como proteger os sócios numa venda parcial de quotas?",
          "help": "Preferência, tag along e drag along precisam de critérios válidos.",
          "options": [
            "Direito de preferência para os demais",
            "Preferência e direito de venda conjunta",
            "Mecanismos mais amplos de venda conjunta em acordo",
            "A definir em conjunto"
          ]
        },
        {
          "id": "encerrar",
          "prompt": "Quando considerar dissolver a empresa?",
          "help": "Distinguir dissolução voluntária de hipóteses legais.",
          "options": [
            "Após tentativas formais de recuperação",
            "Por deliberação com quórum legal",
            "Conforme gatilhos financeiros e legais definidos",
            "A definir em conjunto"
          ]
        },
        {
          "id": "transicao",
          "prompt": "Como garantir a transição dos clientes e arquivos quando alguém sair?",
          "help": "Acesso a e-mails, contratos, documentos e pendências.",
          "options": [
            "Plano escrito com prazos e checklist",
            "Transição acompanhada por administrador",
            "Plano escrito com remuneração de apoio se necessária",
            "A definir em conjunto"
          ]
        }
      ]
    },
    {
      "id": "bloco_16",
      "title": "Formalização e revisão",
      "description": "Como transformar consenso em documentos assinados.",
      "questions": [
        {
          "id": "revisar_acordo",
          "prompt": "Quando revisar as regras societárias?",
          "help": "Revisões periódicas e eventos críticos.",
          "options": [
            "Anualmente",
            "A cada dois anos",
            "Sempre que houver mudança societária relevante",
            "A definir em conjunto"
          ]
        },
        {
          "id": "resolver_conflitos",
          "prompt": "Qual caminho para resolver conflitos sem acordo?",
          "help": "Arbitragem tem custos e regras próprias.",
          "options": [
            "Negociação, mediação e Poder Judiciário",
            "Negociação e mediação antes de arbitragem",
            "Mediação e foro judicial previamente definido",
            "A definir em conjunto"
          ]
        },
        {
          "id": "registros",
          "prompt": "Como registrar decisões importantes?",
          "help": "As regras devem indicar suporte documental e responsáveis.",
          "options": [
            "Atas e aprovações digitais arquivadas",
            "Reuniões mensais com registro de decisões",
            "Livro ou repositório de governança com aprovações",
            "A definir em conjunto"
          ]
        },
        {
          "id": "prioridade",
          "prompt": "Qual é a maior preocupação pessoal com esta sociedade?",
          "help": "Use o comentário para explicar livremente.",
          "options": [
            "Proteção financeira e patrimonial",
            "Equidade na dedicação e remuneração",
            "Controle, transparência e segurança na saída",
            "A definir em conjunto"
          ]
        }
      ]
    }
  ]
};

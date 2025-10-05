import { Lead, Coluna, Pipeline } from "@/types/crm";

export const colunasMock: Coluna[] = [
  {
    id: "novo",
    nome: "Novo",
    cor: "#3B82F6",
    ordem: 1,
    sla: 24,
    wipLimit: 10
  },
  {
    id: "qualificacao",
    nome: "Qualificação",
    cor: "#8B5CF6",
    ordem: 2,
    sla: 48,
    wipLimit: 8
  },
  {
    id: "cotacao",
    nome: "Cotação",
    cor: "#F59E0B",
    ordem: 3,
    sla: 72,
    wipLimit: 6
  },
  {
    id: "proposta",
    nome: "Proposta Enviada",
    cor: "#EF4444",
    ordem: 4,
    sla: 96,
    wipLimit: 5
  },
  {
    id: "negociacao",
    nome: "Negociação",
    cor: "#F97316",
    ordem: 5,
    sla: 120,
    wipLimit: 4
  },
  {
    id: "fechamento",
    nome: "Fechamento",
    cor: "#10B981",
    ordem: 6,
    sla: 48,
    wipLimit: 3
  },
  {
    id: "pos-venda",
    nome: "Pós-venda",
    cor: "#059669",
    ordem: 7,
    wipLimit: 15
  }
];

export const leadsMock: Lead[] = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    empresa: "Empresa ABC Ltda",
    celular: "(11) 99999-1234",
    email: "maria.silva@empresaabc.com.br",
    possuiCnpj: true,
    tipoCnpj: "LTDA",
    quantidadeVidas: 12,
    idades: [34, 32, 28, 25, 45, 42, 38, 36, 29, 31, 33, 27],
    possuiPlano: true,
    planoAtual: "Bradesco Saúde Empresarial",
    valorMedio: 2800,
    hospitaisPreferencia: ["Hospital Sírio-Libanês", "Hospital Albert Einstein"],
    origem: "Instagram",
    informacoes: "Interessada em mudança devido ao aumento de mensalidade atual.",
    uf: "SP",
    cidade: "São Paulo",
    responsavel: "João Silva",
    statusQualificacao: "Qualificado",
    colunaAtual: "novo",
    dataCriacao: new Date("2024-01-15T10:30:00"),
    ultimaAtividade: new Date("2024-01-15T14:20:00"),
    arquivos: [],
    atividades: [
      {
        id: "a1",
        tipo: "Ligação",
        descricao: "Primeiro contato realizado, demonstrou interesse",
        data: new Date("2024-01-15T14:20:00"),
        usuario: "João Silva"
      }
    ]
  },
  {
    id: "2",
    nome: "Carlos Eduardo Oliveira",
    celular: "(11) 98888-5678",
    email: "carlos.eduardo@email.com",
    possuiCnpj: false,
    quantidadeVidas: 4,
    idades: [45, 43, 18, 16],
    possuiPlano: true,
    planoAtual: "Unimed Paulistana",
    valorMedio: 1800,
    hospitaisPreferencia: ["Hospital das Clínicas", "Hospital Oswaldo Cruz"],
    origem: "Indicação",
    informacoes: "Família procurando melhor custo-benefício",
    uf: "SP",
    cidade: "Santos",
    responsavel: "Ana Costa",
    statusQualificacao: "Qualificado",
    colunaAtual: "qualificacao",
    dataCriacao: new Date("2024-01-14T09:15:00"),
    ultimaAtividade: new Date("2024-01-16T16:45:00"),
    arquivos: [],
    atividades: [
      {
        id: "a2",
        tipo: "WhatsApp",
        descricao: "Enviou documentação solicitada",
        data: new Date("2024-01-16T16:45:00"),
        usuario: "Ana Costa"
      }
    ]
  },
  {
    id: "3",
    nome: "Patricia Lima",
    empresa: "Consultoria XYZ MEI",
    celular: "(11) 97777-9012",
    email: "patricia@consultoriaxyz.com.br",
    possuiCnpj: true,
    tipoCnpj: "MEI",
    quantidadeVidas: 2,
    idades: [38, 35],
    possuiPlano: false,
    hospitaisPreferencia: ["Hospital Israelita Albert Einstein"],
    origem: "Site",
    informacoes: "Primeira vez contratando plano de saúde para a empresa",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    responsavel: "Carlos Santos",
    statusQualificacao: "Incompleto",
    colunaAtual: "cotacao",
    dataCriacao: new Date("2024-01-12T11:20:00"),
    ultimaAtividade: new Date("2024-01-17T10:30:00"),
    arquivos: [],
    atividades: [
      {
        id: "a3",
        tipo: "Email",
        descricao: "Enviada cotação inicial",
        data: new Date("2024-01-17T10:30:00"),
        usuario: "Carlos Santos"
      }
    ]
  },
  {
    id: "4",
    nome: "Roberto Fernandes",
    celular: "(11) 96666-3456",
    email: "roberto.fernandes@gmail.com",
    possuiCnpj: false,
    quantidadeVidas: 6,
    idades: [52, 49, 24, 22, 19, 17],
    possuiPlano: true,
    planoAtual: "SulAmérica Saúde",
    valorMedio: 3200,
    hospitaisPreferencia: ["Hospital Sírio-Libanês", "Hospital Samaritano"],
    origem: "Instagram",
    informacoes: "Insatisfeito com atendimento atual",
    uf: "SP",
    cidade: "Campinas",
    responsavel: "João Silva",
    statusQualificacao: "Qualificado",
    colunaAtual: "proposta",
    dataCriacao: new Date("2024-01-10T15:45:00"),
    ultimaAtividade: new Date("2024-01-18T09:15:00"),
    arquivos: [],
    atividades: [
      {
        id: "a4",
        tipo: "Reunião",
        descricao: "Apresentação da proposta via videochamada",
        data: new Date("2024-01-18T09:15:00"),
        usuario: "João Silva"
      }
    ]
  },
  {
    id: "5",
    nome: "Luciana Moreira",
    empresa: "Tecnologia Avançada S.A.",
    celular: "(11) 95555-7890",
    email: "luciana@tecavancada.com.br",
    possuiCnpj: true,
    tipoCnpj: "SA",
    quantidadeVidas: 25,
    idades: Array.from({length: 25}, () => Math.floor(Math.random() * 40) + 25),
    possuiPlano: true,
    planoAtual: "Bradesco Saúde",
    valorMedio: 4500,
    hospitaisPreferencia: ["Hospital Albert Einstein", "Hospital Sírio-Libanês"],
    origem: "Indicação",
    informacoes: "Empresa em crescimento, avaliando migração",
    uf: "SP",
    cidade: "São Paulo",
    responsavel: "Ana Costa",
    statusQualificacao: "Qualificado",
    colunaAtual: "negociacao",
    dataCriacao: new Date("2024-01-08T08:30:00"),
    ultimaAtividade: new Date("2024-01-18T15:20:00"),
    arquivos: [],
    atividades: [
      {
        id: "a5",
        tipo: "Ligação",
        descricao: "Negociação de desconto por volume",
        data: new Date("2024-01-18T15:20:00"),
        usuario: "Ana Costa"
      }
    ]
  },
  {
    id: "6",
    nome: "Fernando Alves",
    celular: "(11) 94444-2468",
    email: "fernando.alves@outlook.com",
    possuiCnpj: false,
    quantidadeVidas: 3,
    idades: [41, 39, 15],
    possuiPlano: false,
    hospitaisPreferencia: ["Hospital das Clínicas"],
    origem: "Site",
    informacoes: "Procura plano básico com boa cobertura",
    uf: "MG",
    cidade: "Belo Horizonte",
    responsavel: "Carlos Santos",
    statusQualificacao: "Qualificado",
    colunaAtual: "fechamento",
    dataCriacao: new Date("2024-01-05T13:10:00"),
    ultimaAtividade: new Date("2024-01-19T11:40:00"),
    arquivos: [],
    atividades: [
      {
        id: "a6",
        tipo: "Email",
        descricao: "Contrato enviado para assinatura digital",
        data: new Date("2024-01-19T11:40:00"),
        usuario: "Carlos Santos"
      }
    ]
  }
];

export const pipelineMock: Pipeline = {
  id: "pipeline-principal",
  nome: "Pipeline Principal - Vendas de Seguros",
  colunas: colunasMock,
  leads: leadsMock
};
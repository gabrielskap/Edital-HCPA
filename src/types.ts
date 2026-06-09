export interface Criteria {
  tipoProva: 'Escrita Objetiva' | 'Títulos' | 'Prática';
  caracter: 'Eliminatório' | 'Classificatório' | 'Eliminatório/Classificatório';
  peso: number;
  notaMinima: number;
  qtdQuestoes: number;
}

export interface Cargo {
  id: string;
  nome: string;
  nivel: 'Superior' | 'Médio' | 'Fundamental';
  vagasAC: number;
  vagasPcD: number;
  vagasNegros: number;
  vagasIndigenas: number;
  salario: number;
  cargaHoraria: number;
  criteria?: Criteria;
}

export interface CronogramaEtapa {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
}

export interface Edital {
  id: number;
  numero: string;
  instituicao: string;
  realizadora: string;
  titulo: string;
  abertura: string;
  encerramento: string;
  vagas: number;
  inscritos: number;
  status: string; // "Em Andamento" | "Encerrado" | "Convocação" | "Recurso"
  tipo?: string; // "Concurso Público" | "Processo Seletivo"
  dataPublicacao?: string;
  cargos?: Cargo[];
  cronograma?: CronogramaEtapa[];
}

export interface Candidato {
  id: number;
  inscricao: string;
  nome: string;
  cpf: string;
  cargo: string;
  edital: string;
  modalidade: string; // "AC" | "PcD" | "Negros"
  nascimento: string;
  email: string;
  telefone: string;
  deficiencia: boolean;
  racial: string;
  status: string; // "Homologado" | "Pendente" | "Indeferido"
  notaEscrita: number;
  notaTitulos: number;
  peso_escrita: number;
  peso_titulos: number;
  nomeSocial?: string;
  cep?: string;
  endereco?: string;
  tipoDeficiencia?: string;
  escolaridade?: string;
}

export interface Convocacao {
  id: number;
  edital: string;
  cargo: string;
  tipo: string; // e.g., "Prova Escrita", "Admissão", "Avaliação Física"
  data: string;
  hora: string;
  local: string;
  convocados: number[]; // Candidatos IDs
  status: string; // "Publicada" | "Concluída"
}

export interface AuditLog {
  id: number;
  dataHora: string;
  usuario: string;
  acao: string;
  modulo: string;
  registro: string;
  ip: string;
  detalhe: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: string; // "Administrador Geral" | "Gestor de Edital" | "Avaliador" | "Operador de Convocação"
  instituicao: string;
  status: string; // "Ativo" | "Inativo"
  ultimoAcesso: string;
}

export type ActiveModule = 'dashboard' | 'editais' | 'candidatos' | 'avaliacoes' | 'convocacoes' | 'auditoria' | 'administracao';

export interface Toast {
  id: string;
  mensagem: string;
  tipo: 'success' | 'error' | 'warning';
}

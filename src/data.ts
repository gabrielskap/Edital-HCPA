import { Edital, Candidato, Convocacao, AuditLog, Usuario } from './types';

export const INITIAL_EDITAIS: Edital[] = [
  { id: 1, numero: "01/2026", instituicao: "HCPA", realizadora: "FAURGS", titulo: "Processo Seletivo Público – Cargos Nível Superior e Médio", abertura: "2026-01-10", encerramento: "2026-02-10", vagas: 45, inscritos: 1240, status: "Em Andamento" },
  { id: 2, numero: "07/2025", instituicao: "HCPA", realizadora: "FAURGS", titulo: "Processo Seletivo Público – Analista de TI e Médicos", abertura: "2025-07-01", encerramento: "2025-08-15", vagas: 12, inscritos: 876, status: "Encerrado" },
  { id: 3, numero: "03/2026", instituicao: "UFMG", realizadora: "FUMARC", titulo: "Concurso Público – Técnicos Administrativos", abertura: "2026-03-01", encerramento: "2026-04-01", vagas: 30, inscritos: 2100, status: "Convocação" },
  { id: 4, numero: "02/2026", instituicao: "UFRGS", realizadora: "FAURGS", titulo: "Processo Seletivo – Enfermeiros e Técnicos de Enfermagem", abertura: "2026-02-01", encerramento: "2026-03-05", vagas: 20, inscritos: 540, status: "Recurso" }
];

export const INITIAL_CANDIDATOS: Candidato[] = [
  { id: 1, inscricao: "2026001001", nome: "Ana Paula Rodrigues", cpf: "123.456.789-01", cargo: "Analista de TI I", edital: "01/2026", modalidade: "AC", nascimento: "1990-05-12", email: "ana.rodrigues@email.com", telefone: "(51) 98765-4321", deficiencia: false, racial: "Branca", status: "Homologado", notaEscrita: 8.4, notaTitulos: 7.0, peso_escrita: 6, peso_titulos: 4 },
  { id: 2, inscricao: "2026001002", nome: "Carlos Eduardo Lima", cpf: "234.567.890-12", cargo: "Médico I", edital: "01/2026", modalidade: "AC", nascimento: "1985-11-23", email: "carlos.lima@email.com", telefone: "(51) 91234-5678", deficiencia: false, racial: "Pardo", status: "Homologado", notaEscrita: 9.2, notaTitulos: 8.5, peso_escrita: 7, peso_titulos: 3 },
  { id: 3, inscricao: "2026001003", nome: "Fernanda Costa Silva", cpf: "345.678.901-23", cargo: "Enfermeiro", edital: "01/2026", modalidade: "PcD", nascimento: "1993-03-08", email: "fernanda.silva@email.com", telefone: "(51) 99887-6543", deficiencia: true, racial: "Branca", status: "Homologado", notaEscrita: 7.6, notaTitulos: 6.0, peso_escrita: 6, peso_titulos: 4 },
  { id: 4, inscricao: "2026001004", nome: "João Marcos Pereira", cpf: "456.789.012-34", cargo: "Técnico de Enfermagem", edital: "01/2026", modalidade: "Negros", nascimento: "1995-07-19", email: "joao.pereira@email.com", telefone: "(51) 97654-3210", deficiencia: false, racial: "Preto", status: "Pendente", notaEscrita: 6.8, notaTitulos: 5.5, peso_escrita: 6, peso_titulos: 4 },
  { id: 5, inscricao: "2026001005", nome: "Mariana Souza Ferreira", cpf: "567.890.123-45", cargo: "Analista de TI I", edital: "01/2026", modalidade: "AC", nascimento: "1988-09-30", email: "mariana.ferreira@email.com", telefone: "(51) 96543-2109", deficiencia: false, racial: "Branca", status: "Homologado", notaEscrita: 5.2, notaTitulos: 4.0, peso_escrita: 6, peso_titulos: 4 },
  { id: 6, inscricao: "2026001006", nome: "Roberto Alves Santos", cpf: "678.901.234-56", cargo: "Médico I", edital: "01/2026", modalidade: "AC", nascimento: "1980-02-14", email: "roberto.santos@email.com", telefone: "(51) 95432-1098", deficiencia: false, racial: "Pardo", status: "Indeferido", notaEscrita: 4.8, notaTitulos: 3.5, peso_escrita: 7, peso_titulos: 3 },
  { id: 7, inscricao: "2026001007", nome: "Patrícia Nunes Oliveira", cpf: "789.012.345-67", cargo: "Enfermeiro", edital: "01/2026", modalidade: "AC", nascimento: "1992-12-05", email: "patricia.oliveira@email.com", telefone: "(51) 94321-0987", deficiencia: false, racial: "Indígena", status: "Homologado", notaEscrita: 8.8, notaTitulos: 9.0, peso_escrita: 6, peso_titulos: 4 }
];

export const INITIAL_CONVOCACOES: Convocacao[] = [
  { id: 1, edital: "01/2026", cargo: "Analista de TI I", tipo: "Prova Escrita", data: "2026-03-15", hora: "09:00", local: "HCPA – Bloco A, Sala 101", convocados: [1, 5], status: "Publicada" },
  { id: 2, edital: "01/2026", cargo: "Médico I", tipo: "Prova Escrita", data: "2026-03-15", hora: "14:00", local: "HCPA – Bloco B, Auditório", convocados: [2, 6], status: "Publicada" },
  { id: 3, edital: "07/2025", cargo: "Técnico de Laboratório", tipo: "Admissão", data: "2026-02-01", hora: "08:00", local: "RH HCPA – Sala 205", convocados: [3], status: "Concluída" }
];

export const INITIAL_LOGS: AuditLog[] = [
  { id: 1, dataHora: "2026-06-08 08:32", usuario: "Admin", acao: "Publicação de Edital", modulo: "Editais", registro: "Edital 01/2026", ip: "192.168.1.10", detalhe: "Edital publicado com 45 vagas" },
  { id: 2, dataHora: "2026-06-08 09:15", usuario: "Avaliador01", acao: "Lançamento de Nota", modulo: "Avaliações", registro: "Candidato 2026001002", ip: "192.168.1.22", detalhe: "Nota Escrita: 9.2 | Nota Títulos: 8.5" },
  { id: 3, dataHora: "2026-06-07 14:45", usuario: "Operador01", acao: "Convocação Gerada", modulo: "Convocações", registro: "Edital 01/2026 – Prova Escrita", ip: "192.168.1.31", detalhe: "7 candidatos convocados para 15/03/2026" },
  { id: 4, dataHora: "2026-06-07 11:20", usuario: "Admin", acao: "Cadastro de Candidato", modulo: "Candidatos", registro: "Candidato 2026001007", ip: "192.168.1.10", detalhe: "Novo candidato cadastrado manualmente" },
  { id: 5, dataHora: "2026-06-06 16:00", usuario: "Admin", acao: "Alteração de Permissão", modulo: "Administração", registro: "Usuário Avaliador01", ip: "192.168.1.10", detalhe: "Perfil alterado de Operador para Avaliador" },
  { id: 6, dataHora: "2026-06-06 10:10", usuario: "Avaliador01", acao: "Publicação de Resultado", modulo: "Avaliações", registro: "Edital 07/2025 – Resultado Preliminar", ip: "192.168.1.22", detalhe: "Resultado publicado para 76 candidatos" },
  { id: 7, dataHora: "2026-06-05 09:00", usuario: "Operador01", acao: "Registro de Recurso", modulo: "Auditoria", registro: "Candidato 2026001006", ip: "192.168.1.31", detalhe: "Recurso interposto contra indeferimento de inscrição" }
];

export const INITIAL_USUARIOS: Usuario[] = [
  { id: 1, nome: "Administrador Sistema", email: "admin@selectpro.gov.br", perfil: "Administrador Geral", instituicao: "HCPA", status: "Ativo", ultimoAcesso: "2026-06-08 08:30" },
  { id: 2, nome: "Beatriz Mendonça", email: "b.mendonca@faurgs.br", perfil: "Gestor de Edital", instituicao: "FAURGS", status: "Ativo", ultimoAcesso: "2026-06-07 17:10" },
  { id: 3, nome: "Lucas Avaliador", email: "l.avaliador@hcpa.edu.br", perfil: "Avaliador", instituicao: "HCPA", status: "Ativo", ultimoAcesso: "2026-06-08 09:10" },
  { id: 4, nome: "Camila Operações", email: "c.ops@hcpa.edu.br", perfil: "Operador de Convocação", instituicao: "HCPA", status: "Inativo", ultimoAcesso: "2026-05-20 13:45" }
];

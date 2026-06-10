import React from 'react';
import { Candidato, Edital } from '../types';

interface CandidatosModuleProps {
  candidatos: Candidato[];
  editais: Edital[];
  onOpenCreateModal: () => void;
  onViewDetails: (candidato: Candidato) => void;
  onToggleStatus: (candidato: Candidato, newStatus: string) => void;
  setCandidatos?: React.Dispatch<React.SetStateAction<Candidato[]>>;
  setEditais?: React.Dispatch<React.SetStateAction<Edital[]>>;
  showToast?: (mensagem: string, tipo: 'success' | 'error' | 'warning') => void;
  logAction?: (acao: string, modulo: string, registro: string, detalhe: string) => void;
  confirmAction?: (mensagem: string, callback: () => void) => void;
}

interface LocalToast {
  id: string;
  mensagem: string;
  tipo: 'success' | 'error' | 'warning';
}

type ImportStage = 'idle' | 'validating' | 'preview' | 'importing' | 'complete';

interface ImportPreviewRow {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  edital: string;
  racial: string;
  deficiencia: boolean;
  validStatus: 'ok' | 'warn' | 'error';
  issue?: string;
}

interface ImportBatch {
  id: string;
  fileName: string;
  dataHora: string;
  total: number;
  importados: number;
  rejeitados: number;
}

type CurriculoStage = 'idle' | 'reading' | 'preview' | 'saving';

interface CurriculoData {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  nascimento: string;
  cargo: string;
  escolaridade: string;
  racial: string;
  deficiencia: boolean;
  edital: string;
  habilidades: string;
  resumo: string;
}

export default function CandidatosModule({ 
  candidatos, 
  editais, 
  onOpenCreateModal, 
  onViewDetails, 
  onToggleStatus,
  setCandidatos,
  setEditais,
  showToast,
  logAction,
  confirmAction
}: CandidatosModuleProps) {
  
  // Tabs State: "cadastro" or "avaliacao"
  const [activeView, setActiveView] = React.useState<'listagem' | 'importacao' | 'curriculo'>('listagem');
  const [activeTab, setActiveTab] = React.useState<'cadastro' | 'avaliacao'>('cadastro');

  // Load and keep candidates in sync
  const [localCandidatos, setLocalCandidatos] = React.useState<Candidato[]>(candidatos);
  React.useEffect(() => {
    setLocalCandidatos(candidatos);
  }, [candidatos]);

  // Local Toast notification system
  const [localToasts, setLocalToasts] = React.useState<LocalToast[]>([]);
  const showLocalToast = (mensagem: string, tipo: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setLocalToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setLocalToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- ABA CADASTRO STATES ---
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('Todos');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isDossieModalOpen, setIsDossieModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedCandidato, setSelectedCandidato] = React.useState<Candidato | null>(null);

  // New candidate form state
  const [newForm, setNewForm] = React.useState({
    nome: '',
    nomeSocial: '',
    cpf: '',
    nascimento: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    deficiencia: false,
    tipoDeficiencia: '',
    racial: 'Parda',
    edital: editais[0]?.numero || '01/2026',
    cargo: '',
    escolaridade: 'Superior'
  });

  // Edit candidate form state
  const [editForm, setEditForm] = React.useState({
    id: 0,
    nome: '',
    nomeSocial: '',
    cpf: '',
    nascimento: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    deficiencia: false,
    tipoDeficiencia: '',
    racial: 'Parda',
    edital: '01/2026',
    cargo: '',
    escolaridade: 'Superior',
    status: 'Pendente'
  });

  // --- ABA AVALIAÇÃO STATES ---
  const [evalFilterEdital, setEvalFilterEdital] = React.useState('Todos');
  const [evalFilterCargo, setEvalFilterCargo] = React.useState('Todos');
  const [evalFilterStatus, setEvalFilterStatus] = React.useState('Todos');
  const [isSortedByClassification, setIsSortedByClassification] = React.useState(false);
  const [isConfirmPublishOpen, setIsConfirmPublishOpen] = React.useState(false);

  // --- IMPORTAÇÃO EM LOTE STATES ---
  const [importStage, setImportStage] = React.useState<ImportStage>('idle');
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [importFileName, setImportFileName] = React.useState<string | null>(null);
  const [importFileSize, setImportFileSize] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importPreviewRows, setImportPreviewRows] = React.useState<ImportPreviewRow[]>([]);
  const [importBatches, setImportBatches] = React.useState<ImportBatch[]>([
    { id: '1', fileName: 'candidatos_edital_01_2026.xlsx', dataHora: '2026-06-08 14:32', total: 152, importados: 148, rejeitados: 4 }
  ]);

  // --- LEITOR DE CURRÍCULO STATES ---
  const [curriculoStage, setCurriculoStage] = React.useState<CurriculoStage>('idle');
  const [isCvDragOver, setIsCvDragOver] = React.useState(false);
  const [curriculoFileName, setCurriculoFileName] = React.useState<string | null>(null);
  const cvFileInputRef = React.useRef<HTMLInputElement>(null);
  const [curriculoForm, setCurriculoForm] = React.useState<CurriculoData>({
    nome: '', email: '', telefone: '', cpf: '', nascimento: '',
    cargo: '', escolaridade: 'Superior', racial: 'Branca', deficiencia: false,
    edital: '', habilidades: '', resumo: ''
  });

  // Collapsible sections state for classification results below the table
  const [isAcCollapsed, setIsAcCollapsed] = React.useState(false);
  const [isPcdCollapsed, setIsPcdCollapsed] = React.useState(false);
  const [isNegrosCollapsed, setIsNegrosCollapsed] = React.useState(false);

  // Mask CPF Helper (***.***.***-XX where XX is the last two digits of the actual CPF)
  const getMaskedCPF = (cpf: string): string => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length >= 2) {
      const lastTwo = digits.slice(-2);
      return `***.***.***-${lastTwo}`;
    }
    return '***.***.***-**';
  };

  // Helper calculation for weighted score
  const calculateNotaFinal = (c: Candidato) => {
    const pesoEscrita = c.peso_escrita ?? 6;
    const pesoTitulos = c.peso_titulos ?? 4;
    const totalPesos = pesoEscrita + pesoTitulos;
    if (totalPesos === 0) return 0;
    return parseFloat(((c.notaEscrita * pesoEscrita + c.notaTitulos * pesoTitulos) / totalPesos).toFixed(2));
  };

  // Helper for status classes
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Homologado':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
      case 'Pendente':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'Indeferido':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300';
    }
  };

  // Filtered Candidates (Aba Cadastro)
  const filteredCadastroCandidatos = React.useMemo(() => {
    return localCandidatos.filter(c => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        c.nome.toLowerCase().includes(query) ||
        (c.nomeSocial && c.nomeSocial.toLowerCase().includes(query)) ||
        c.cpf.includes(searchQuery) ||
        c.inscricao.includes(searchQuery);

      const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [localCandidatos, searchQuery, statusFilter]);

  // Unique list of cargos based on local candidates
  const availableCargos = React.useMemo(() => {
    return ['Todos', ...new Set(localCandidatos.map(c => c.cargo))];
  }, [localCandidatos]);

  // Filtered and sorted Candidates (Aba Avaliação)
  const evaluatedCandidatos = React.useMemo(() => {
    let list = localCandidatos.filter(c => {
      const matchesEdital = evalFilterEdital === 'Todos' || c.edital === evalFilterEdital;
      const matchesCargo = evalFilterCargo === 'Todos' || c.cargo === evalFilterCargo;
      const matchesStatus = evalFilterStatus === 'Todos' || c.status === evalFilterStatus;
      return matchesEdital && matchesCargo && matchesStatus;
    });

    if (isSortedByClassification) {
      list = [...list].sort((a, b) => {
        return calculateNotaFinal(b) - calculateNotaFinal(a);
      });
    }

    return list;
  }, [localCandidatos, evalFilterEdital, evalFilterCargo, evalFilterStatus, isSortedByClassification]);

  // Filtered and sorted strictly by modalidade for collapsible lists at the bottom of evaluation tab
  const classifiedByModalidade = React.useMemo(() => {
    if (!isSortedByClassification) return { AC: [], PcD: [], Negros: [] };

    // Group the sorted evaluated candidates by their modalidade parameter
    const sortedAll = [...localCandidatos].sort((a, b) => calculateNotaFinal(b) - calculateNotaFinal(a));
    
    // Filtros por edital e cargo aplicados nas seções também, para bater com a tabela
    const matchedFilters = sortedAll.filter(c => {
      const matchesEdital = evalFilterEdital === 'Todos' || c.edital === evalFilterEdital;
      const matchesCargo = evalFilterCargo === 'Todos' || c.cargo === evalFilterCargo;
      return matchesEdital && matchesCargo;
    });

    return {
      AC: matchedFilters.filter(c => c.modalidade === 'AC'),
      PcD: matchedFilters.filter(c => c.modalidade === 'PcD'),
      Negros: matchedFilters.filter(c => c.modalidade === 'Negros')
    };
  }, [localCandidatos, evalFilterEdital, evalFilterCargo, isSortedByClassification]);

  // Handle Score Input modify Inline
  const handleScoreChange = (candId: number, field: 'notaEscrita' | 'notaTitulos', value: string) => {
    // Clamp values between 0.0 and 10.0
    let parsed = parseFloat(value);
    if (isNaN(parsed)) parsed = 0;
    if (parsed < 0) parsed = 0;
    if (parsed > 10) parsed = 10;

    // Fast inline feedback model
    setLocalCandidatos(prev => prev.map(c => {
      if (c.id === candId) {
        return { ...c, [field]: parsed };
      }
      return c;
    }));
  };

  // Create new candidate
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.nome || !newForm.cpf || !newForm.cargo) {
      if (showToast) {
        showToast('Por favor, preencha todos os campos obrigatórios!', 'error');
      } else {
        showLocalToast('Por favor, preencha todos os campos obrigatórios!', 'error');
      }
      return;
    }

    const newInscricao = (2026001007 + localCandidatos.length + 1).toString();
    const calculatedModalidade = newForm.deficiencia 
      ? 'PcD' 
      : (['Preta', 'Parda', 'Negros', 'Preto', 'Pardo'].includes(newForm.racial) ? 'Negros' : 'AC');

    const created: Candidato = {
      id: Date.now(),
      inscricao: newInscricao,
      nome: newForm.nome,
      nomeSocial: newForm.nomeSocial || undefined,
      cpf: newForm.cpf,
      nascimento: newForm.nascimento || '1995-01-01',
      email: newForm.email || 'candidato@email.com',
      telefone: newForm.telefone || '(51) 99999-9999',
      cep: newForm.cep || undefined,
      endereco: newForm.endereco || undefined,
      deficiencia: newForm.deficiencia,
      tipoDeficiencia: newForm.deficiencia ? newForm.tipoDeficiencia : undefined,
      racial: newForm.racial,
      modalidade: calculatedModalidade,
      edital: newForm.edital,
      cargo: newForm.cargo,
      escolaridade: newForm.escolaridade || 'Superior',
      status: 'Pendente',
      notaEscrita: 0.0,
      notaTitulos: 0.0,
      peso_escrita: 6,
      peso_titulos: 4
    };

    if (setCandidatos) {
      setCandidatos(prev => [created, ...prev]);
    } else {
      setLocalCandidatos(prev => [created, ...prev]);
    }

    if (logAction) {
      logAction('Cadastro de Candidato', 'Candidatos', `Insc. ${created.inscricao}`, `Candidato ${created.nome} cadastrado manualmente com status "Pendente".`);
    }

    setIsCreateModalOpen(false);
    if (showToast) {
      showToast(`Candidato ${created.nome} cadastrado com status "Pendente" com sucesso!`, 'success');
    } else {
      showLocalToast(`Candidato ${created.nome} cadastrado com status "Pendente" com sucesso!`, 'success');
    }

    // Reset Form state
    setNewForm({
      nome: '',
      nomeSocial: '',
      cpf: '',
      nascimento: '',
      email: '',
      telefone: '',
      cep: '',
      endereco: '',
      deficiencia: false,
      tipoDeficiencia: '',
      racial: 'Parda',
      edital: editais[0]?.numero || '01/2026',
      cargo: '',
      escolaridade: 'Superior'
    });

    // Auto-scroll on save!
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Edit candidate save
  const handleSaveEditCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nome || !editForm.cargo) {
      if (showToast) {
        showToast('Preencha os dados obrigatórios!', 'error');
      } else {
        showLocalToast('Preencha os dados obrigatórios!', 'error');
      }
      return;
    }

    const updatedCands = (prev: Candidato[]) => prev.map(c => {
      if (c.id === editForm.id) {
        return {
          ...c,
          nome: editForm.nome,
          nomeSocial: editForm.nomeSocial || undefined,
          cpf: editForm.cpf,
          nascimento: editForm.nascimento,
          email: editForm.email,
          telefone: editForm.telefone,
          cep: editForm.cep || undefined,
          endereco: editForm.endereco || undefined,
          deficiencia: editForm.deficiencia,
          tipoDeficiencia: editForm.deficiencia ? editForm.tipoDeficiencia : undefined,
          racial: editForm.racial,
          edital: editForm.edital,
          cargo: editForm.cargo,
          escolaridade: editForm.escolaridade,
          status: editForm.status
        };
      }
      return c;
    });

    if (setCandidatos) {
      setCandidatos(updatedCands);
    } else {
      setLocalCandidatos(updatedCands);
    }

    if (logAction) {
      logAction('Edição de Candidato', 'Candidatos', `Insc. ${editForm.inscricao}`, `Cadastro do candidato ${editForm.nome} editado no painel.`);
    }

    setIsEditModalOpen(false);
    if (showToast) {
      showToast('Inscrição e dados do candidato atualizados com sucesso!', 'success');
    } else {
      showLocalToast('Inscrição e dados do candidato atualizados com sucesso!', 'success');
    }

    // Auto-scroll on save!
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open details dossier modal
  const handleOpenDossie = (c: Candidato) => {
    setSelectedCandidato(c);
    setIsDossieModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (c: Candidato) => {
    setSelectedCandidato(c);
    setEditForm({
      id: c.id,
      nome: c.nome,
      nomeSocial: c.nomeSocial || '',
      cpf: c.cpf,
      nascimento: c.nascimento,
      email: c.email,
      telefone: c.telefone,
      cep: c.cep || '',
      endereco: c.endereco || '',
      deficiencia: c.deficiencia,
      tipoDeficiencia: c.tipoDeficiencia || '',
      racial: c.racial,
      edital: c.edital,
      cargo: c.cargo,
      escolaridade: c.escolaridade || 'Superior',
      status: c.status
    });
    setIsEditModalOpen(true);
  };

  // Confirm publication of results
  const handlePublishResults = () => {
    setIsConfirmPublishOpen(false);
    if (logAction) {
      logAction('Publicação de Resultado', 'Candidatos', 'Edital 01/2026', 'Boletim de resultados preliminares homologado e publicado no Transparência.');
    }
    if (showToast) {
      showToast('Resultado das avaliações publicado oficialmente com sucesso!', 'success');
    } else {
      showLocalToast('Resultado das avaliações publicado oficialmente com sucesso!', 'success');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- IMPORT HANDLERS ---
  const handleFileSelect = (file: File) => {
    const validExts = ['.csv', '.xls', '.xlsx'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExts.includes(ext)) {
      showLocalToast('Formato inválido. Use CSV, XLS ou XLSX.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showLocalToast('Arquivo excede o limite de 10 MB.', 'error');
      return;
    }
    setImportFileName(file.name);
    setImportFileSize((file.size / 1024).toFixed(0) + ' KB');
    setImportStage('validating');
    setTimeout(() => {
      const mockRows: ImportPreviewRow[] = [
        { id: '1', nome: 'Ana Paula Souza', cpf: '123.456.789-00', email: 'ana.souza@email.com', telefone: '(51) 98765-4321', cargo: 'Analista de TI I', edital: editais[0]?.numero || '01/2026', racial: 'Branca', deficiencia: false, validStatus: 'ok' },
        { id: '2', nome: 'Carlos Eduardo Lima', cpf: '234.567.890-11', email: 'carlos.lima@email.com', telefone: '(51) 91234-5678', cargo: 'Técnico de Enfermagem', edital: editais[0]?.numero || '01/2026', racial: 'Parda', deficiencia: false, validStatus: 'ok' },
        { id: '3', nome: 'Fernanda Costa', cpf: '345.678.901-22', email: 'fernanda.costa@email.com', telefone: '(51) 97654-3210', cargo: 'Analista de TI I', edital: editais[0]?.numero || '01/2026', racial: 'Preta', deficiencia: true, validStatus: 'ok' },
        { id: '4', nome: 'Rodrigo Mendes', cpf: '456.789.012-33', email: 'rodrigo.mendes@email.com', telefone: '(51) 99988-7766', cargo: 'Médico Clínico Geral', edital: editais[1]?.numero || '02/2026', racial: 'Branca', deficiencia: false, validStatus: 'ok' },
        { id: '5', nome: 'Juliana Alves', cpf: '567.890.123-44', email: 'juliana_alves_INVALIDO', telefone: '(51) 98877-6655', cargo: 'Assistente Administrativo', edital: editais[0]?.numero || '01/2026', racial: 'Parda', deficiencia: false, validStatus: 'error', issue: 'E-mail com formato inválido' },
        { id: '6', nome: 'Marcos Oliveira', cpf: '123.456.789-00', email: 'marcos.oliveira@email.com', telefone: '(51) 96655-4433', cargo: 'Técnico de Enfermagem', edital: editais[0]?.numero || '01/2026', racial: 'Branca', deficiencia: false, validStatus: 'warn', issue: 'CPF duplicado (mesmo que linha 1)' },
      ];
      setImportPreviewRows(mockRows);
      setImportStage('preview');
    }, 1600);
  };

  const handleImportConfirm = () => {
    setImportStage('importing');
    setTimeout(() => {
      const validRows = importPreviewRows.filter(r => r.validStatus === 'ok');
      const newCandidates: Candidato[] = validRows.map((row, idx) => ({
        id: Date.now() + idx,
        inscricao: (2026001007 + localCandidatos.length + idx + 1).toString(),
        nome: row.nome,
        cpf: row.cpf,
        email: row.email,
        telefone: row.telefone,
        cargo: row.cargo,
        edital: row.edital,
        racial: row.racial,
        deficiencia: row.deficiencia,
        modalidade: row.deficiencia ? 'PcD' : (['Preta', 'Parda', 'Negra', 'Negros'].includes(row.racial) ? 'Negros' : 'AC'),
        nascimento: '1990-01-01',
        escolaridade: 'Superior',
        status: 'Pendente',
        notaEscrita: 0,
        notaTitulos: 0,
        peso_escrita: 6,
        peso_titulos: 4
      }));
      if (setCandidatos) setCandidatos(prev => [...newCandidates, ...prev]);
      else setLocalCandidatos(prev => [...newCandidates, ...prev]);
      const newBatch: ImportBatch = {
        id: Date.now().toString(),
        fileName: importFileName || 'arquivo.csv',
        dataHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
        total: importPreviewRows.length,
        importados: validRows.length,
        rejeitados: importPreviewRows.length - validRows.length
      };
      setImportBatches(prev => [newBatch, ...prev]);
      if (logAction) logAction('Importação em Lote', 'Candidatos', `Lote: ${importFileName}`, `${validRows.length} candidatos importados, ${importPreviewRows.length - validRows.length} rejeitados.`);
      if (showToast) showToast(`Lote importado: ${validRows.length} candidatos adicionados com status Pendente!`, 'success');
      else showLocalToast(`Lote importado: ${validRows.length} candidatos adicionados!`, 'success');
      setImportStage('complete');
    }, 1800);
  };

  const handleImportReset = () => {
    setImportStage('idle');
    setImportFileName(null);
    setImportFileSize(null);
    setImportPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- CV READER HANDLERS ---
  const handleCvFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showLocalToast('Formato inválido. Use somente PDF.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showLocalToast('Arquivo excede o limite de 5 MB.', 'error');
      return;
    }
    setCurriculoFileName(file.name);
    setCurriculoStage('reading');
    setTimeout(() => {
      setCurriculoForm({
        nome: 'Maria Fernanda Rodrigues',
        email: 'mf.rodrigues@email.com',
        telefone: '(51) 98765-1234',
        cpf: '789.012.345-67',
        nascimento: '1992-05-18',
        cargo: 'Analista de Recursos Humanos',
        escolaridade: 'Pós-Graduação',
        racial: 'Branca',
        deficiencia: false,
        edital: editais[0]?.numero || '01/2026',
        habilidades: 'Gestão de Pessoas, Recrutamento e Seleção, Excel Avançado, SAP HR',
        resumo: '5 anos de experiência em RH corporativo com foco em recrutamento e seleção para cargos técnicos e de gestão.'
      });
      setCurriculoStage('preview');
    }, 2200);
  };

  const handleSaveCurriculo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculoForm.nome || !curriculoForm.cpf || !curriculoForm.cargo) {
      showLocalToast('Preencha os campos obrigatórios.', 'error');
      return;
    }
    setCurriculoStage('saving');
    setTimeout(() => {
      const newInscricao = (2026001007 + localCandidatos.length + 1).toString();
      const created: Candidato = {
        id: Date.now(),
        inscricao: newInscricao,
        nome: curriculoForm.nome,
        cpf: curriculoForm.cpf,
        email: curriculoForm.email || 'candidato@email.com',
        telefone: curriculoForm.telefone || '(51) 99999-9999',
        cargo: curriculoForm.cargo,
        edital: curriculoForm.edital || editais[0]?.numero || '01/2026',
        racial: curriculoForm.racial,
        deficiencia: curriculoForm.deficiencia,
        modalidade: curriculoForm.deficiencia ? 'PcD' : (['Preta','Parda'].includes(curriculoForm.racial) ? 'Negros' : 'AC'),
        nascimento: curriculoForm.nascimento || '1990-01-01',
        escolaridade: curriculoForm.escolaridade,
        status: 'Pendente',
        notaEscrita: 0, notaTitulos: 0, peso_escrita: 6, peso_titulos: 4
      };
      if (setCandidatos) setCandidatos(prev => [created, ...prev]);
      else setLocalCandidatos(prev => [created, ...prev]);
      if (logAction) logAction('Cadastro via Currículo OCR', 'Candidatos', `Insc. ${newInscricao}`, `${created.nome} cadastrado a partir de leitura de currículo PDF.`);
      if (showToast) showToast(`Candidato ${created.nome} cadastrado via leitura de currículo!`, 'success');
      else showLocalToast(`Candidato ${created.nome} cadastrado via leitura de currículo!`, 'success');
      setCurriculoStage('idle');
      setCurriculoFileName(null);
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
      setActiveView('listagem');
      setActiveTab('cadastro');
    }, 1000);
  };

  // Auto-fill address simulation on CEP enter
  const simulateCepFetch = () => {
    if (newForm.cep.replace(/\D/g, '').length === 8) {
      setNewForm(prev => ({
        ...prev,
        endereco: 'Rua das Samambaias, 452 - Bairro Floresta, Porto Alegre/RS'
      }));
      showLocalToast('Endereço auto-preenchido via CEP (Simulação)', 'success');
    }
  };

  const simulateCepFetchEdit = () => {
    if (editForm.cep.replace(/\D/g, '').length === 8) {
      setEditForm(prev => ({
        ...prev,
        endereco: 'Avenida Protasio Alves, 1205 - Petrópolis, Porto Alegre/RS'
      }));
      showLocalToast('Endereço auto-preenchido via CEP (Simulação)', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="candidatos-module-core">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-105">Módulo de Candidatos</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeView === 'listagem' && 'Homologação cadastral, cotas raciais, lançamento de notas e classificação final.'}
            {activeView === 'importacao' && 'Importação persistida, validação estrutural e histórico de lotes.'}
            {activeView === 'curriculo' && 'Leitura OCR de currículo em PDF com auto-preenchimento e análise de habilidades.'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
          {/* Module Navigation Buttons */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveView('listagem')}
              style={{
                padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: activeView === 'listagem' ? 'var(--color-primary)' : 'var(--color-white)',
                color: activeView === 'listagem' ? '#fff' : 'var(--color-text-secondary)',
                border: 'none', borderRight: '1px solid var(--color-border)', transition: 'all 0.2s ease'
              }}
            >
              <i className="ti ti-users" style={{ fontSize: 13 }}></i>
              Listagem e Edição
            </button>
            <button
              onClick={() => setActiveView('importacao')}
              style={{
                padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: activeView === 'importacao' ? 'var(--color-primary)' : 'var(--color-white)',
                color: activeView === 'importacao' ? '#fff' : 'var(--color-text-secondary)',
                border: 'none', borderRight: '1px solid var(--color-border)', transition: 'all 0.2s ease'
              }}
            >
              <i className="ti ti-cloud-upload" style={{ fontSize: 13 }}></i>
              Importação em Lote
            </button>
            <button
              onClick={() => { setActiveView('curriculo'); setCurriculoStage('idle'); }}
              style={{
                padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: activeView === 'curriculo' ? 'var(--color-primary)' : 'var(--color-white)',
                color: activeView === 'curriculo' ? '#fff' : 'var(--color-text-secondary)',
                border: 'none', transition: 'all 0.2s ease'
              }}
            >
              <i className="ti ti-file-description" style={{ fontSize: 13 }}></i>
              Leitor de Currículo
            </button>
          </div>

          {/* Novo Candidato — only on listagem */}
          {activeView === 'listagem' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all text-xs cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label="Registrar Candidatura Manual"
              id="btn-novo-candidato"
            >
              <i className="ti ti-user-plus text-sm"></i>
              Novo Candidato
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher — only on listagem view */}
      {activeView === 'listagem' && (
        <div className="sp-tabs-container">
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`sp-tab ${activeTab === 'cadastro' ? 'sp-tab-active' : ''}`}
            id="tab-cadastro-trigger"
          >
            <i className="ti ti-users text-sm"></i>
            Cadastro e Inscrições
          </button>
          <button
            onClick={() => setActiveTab('avaliacao')}
            className={`sp-tab ${activeTab === 'avaliacao' ? 'sp-tab-active' : ''}`}
            id="tab-avaliacao-trigger"
          >
            <i className="ti ti-clipboard-check text-sm"></i>
            Banca de Avaliação
          </button>
        </div>
      )}

      {/* --- CONTENT TABS: CADASTRO --- */}
      {activeView === 'listagem' && activeTab === 'cadastro' && (
        <div className="space-y-4 animate-fade-in" id="panel-cadastro">
          
          {/* Filters for cadastro */}
          <div className="sp-card flex flex-col md:flex-row gap-4 mb-4">
            <div className="sp-search-container flex-1">
              <i className="ti ti-search sp-search-icon"></i>
              <input
                id="search-cadastro-input"
                type="text"
                placeholder="Busca por nome completo, nome social ou CPF (tempo real)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sp-search-input font-semibold"
              />
            </div>
            <div className="w-full md:w-60">
              <select
                id="filter-status-cadastro"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sp-input font-bold"
              >
                <option value="Todos">Todos os Status Cadastrais</option>
                <option value="Homologado">Homologados (Deferidos)</option>
                <option value="Pendente">Pendentes de Validação</option>
                <option value="Indeferido">Indeferidos</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          {filteredCadastroCandidatos.length === 0 ? (
            <div className="sp-empty-state py-12">
              <i className="ti ti-inbox sp-empty-state-icon"></i>
              <p className="sp-empty-state-title">Nenhum candidato localizado nos filtros desejados</p>
              <p className="sp-empty-state-description">Tente suavizar sua pesquisa ou os filtros de homologação instalados.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('Todos');
                }}
                className="mt-3.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-750 dark:text-slate-205 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="sp-table-container">
              <div className="overflow-x-auto w-full">
                <table className="sp-table" id="table-cadastro-candidatos">
                  <thead>
                    <tr>
                      <th scope="col">Nº Inscrição</th>
                      <th scope="col">Nome do Candidato</th>
                      <th scope="col">CPF (Mascarado)</th>
                      <th scope="col">Cargo</th>
                      <th scope="col">Edital</th>
                      <th scope="col">Modalidade</th>
                      <th scope="col">Situação</th>
                      <th scope="col" className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCadastroCandidatos.map((c) => (
                      <tr key={c.id}>
                        <td className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {c.inscricao}
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-slate-855 dark:text-slate-200">{c.nome}</span>
                            {c.nomeSocial && (
                              <span className="text-[10px] text-slate-400">Social: {c.nomeSocial}</span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-slate-500 dark:text-slate-400">
                          {getMaskedCPF(c.cpf)}
                        </td>
                        <td className="text-slate-700 dark:text-slate-300">
                          {c.cargo}
                        </td>
                        <td className="font-mono text-slate-550">
                          {c.edital}
                        </td>
                        <td>
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            c.modalidade === 'AC' 
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' 
                              : c.modalidade === 'PcD' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' 
                              : 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/30 dark:text-indigo-400'
                          }`}>
                            {c.modalidade}
                          </span>
                        </td>
                        <td>
                          <span className={`sp-badge ${
                            c.status === 'Homologado' 
                              ? 'sp-badge-publicado' 
                              : c.status === 'Pendente' 
                              ? 'sp-badge-pendente' 
                              : 'sp-badge-indeferido'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenDossie(c)}
                              className="sp-btn sp-btn-secondary py-1 px-2.5 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Dossiê do Candidato"
                            >
                              <i className="ti ti-eye text-sm"></i>
                              <span>Dossiê</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="sp-btn sp-btn-secondary py-1 px-2.5 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Editar Ficha"
                            >
                              <i className="ti ti-edit text-sm"></i>
                              <span>Editar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Exibindo {filteredCadastroCandidatos.length} inscrições ativas</span>
                <span>SelectPro LGPD Database Encrypted</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CONTENT TABS: AVALIAÇÃO --- */}
      {activeView === 'listagem' && activeTab === 'avaliacao' && (
        <div className="space-y-4 animate-fade-in" id="panel-avaliacao">
          
          {/* Filter Bar */}
          <div className="sp-card grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            
            {/* Edital filter */}
            <div>
              <label htmlFor="eval-filter-ed" className="sp-form-label mb-1">Edital</label>
              <select
                id="eval-filter-ed"
                value={evalFilterEdital}
                onChange={(e) => {
                  setEvalFilterEdital(e.target.value);
                  setIsSortedByClassification(false); // Reset ordered classification positions on new filters
                }}
                className="sp-input font-semibold"
              >
                <option value="Todos">Todos os Editais</option>
                {editais.map(ed => (
                  <option key={ed.id} value={ed.numero}>Edital {ed.numero} ({ed.instituicao})</option>
                ))}
              </select>
            </div>

            {/* Cargo selector */}
            <div>
              <label htmlFor="eval-filter-cg" className="sp-form-label mb-1">Cargo</label>
              <select
                id="eval-filter-cg"
                value={evalFilterCargo}
                onChange={(e) => {
                  setEvalFilterCargo(e.target.value);
                  setIsSortedByClassification(false);
                }}
                className="sp-input font-semibold"
              >
                {availableCargos.map(cg => (
                  <option key={cg} value={cg}>{cg}</option>
                ))}
              </select>
            </div>

            {/* Status filters */}
            <div>
              <label htmlFor="eval-filter-st" className="sp-form-label mb-1">Situação Cadastral</label>
              <select
                id="eval-filter-st"
                value={evalFilterStatus}
                onChange={(e) => {
                  setEvalFilterStatus(e.target.value);
                  setIsSortedByClassification(false);
                }}
                className="sp-input font-semibold"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Homologado">Apenas Homologado (Devedor Principal)</option>
                <option value="Pendente">Pendentes</option>
                <option value="Indeferido">Indeferidos</option>
              </select>
            </div>

            {/* Classification Action Button container */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setIsSortedByClassification(true)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 h-[36px]"
                id="btn-calcular-ordenar"
                title="Classifica e ordena candidatos"
              >
                <i className="ti ti-arrows-sort"></i>
                Calcular e Classificar
              </button>
            </div>
          </div>

          {/* Quick Informative Info strip */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border border-slate-200/40">
            <span className="flex items-center gap-1.5 font-semibold">
              <i className="ti ti-info-circle text-blue-500 text-sm"></i>
              Notas editáveis inline (0-10, step 0.1). Peso Escrita: 60% e Títulos: 40% (calculadora automática).
            </span>
            <button
              onClick={() => {
                if (confirmAction) {
                  confirmAction(
                    'Você está prestes a publicar o boletim preliminar de resultado dos candidatos filtrados. Todos os dados serão congelados e tornados públicos no painel transparente de convocatória, e notificações eletrônicas serão de pronto geradas.',
                    handlePublishResults
                  );
                } else {
                  setIsConfirmPublishOpen(true);
                }
              }}
              className="px-3 bg-[#1e293b] hover:bg-slate-800 text-white font-black py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer"
              id="btn-publicar"
            >
              <i className="ti ti-send"></i>
              Publicar Resultado
            </button>
          </div>

          {/* Core Evaluation Matrix Table */}
          {evaluatedCandidatos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-250 dark:border-slate-700">
              <i className="ti ti-inbox text-5xl text-slate-350 dark:text-slate-600 mb-2.5"></i>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-450 text-center">Nenhum candidato localizado com os filtros selecionados</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tente suavizar os critérios de seleção ou pesquisar por outro edital.</p>
              <button
                onClick={() => {
                  setEvalFilterEdital('Todos');
                  setEvalFilterCargo('Todos');
                  setEvalFilterStatus('Todos');
                  setIsSortedByClassification(false);
                }}
                className="mt-3.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-750 dark:text-slate-205 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="sp-table-container">
              <div className="overflow-x-auto w-full">
                <table className="sp-table" id="table-avaliacao-notas">
                  <thead>
                    <tr>
                      {isSortedByClassification && (
                        <th scope="col" className="w-12 text-center">Classif.</th>
                      )}
                      <th scope="col">Candidato</th>
                      <th scope="col">Edital</th>
                      <th scope="col">Cargo</th>
                      <th scope="col" className="text-center w-28">Nota Escrita (P6)</th>
                      <th scope="col" className="text-center w-28">Nota Títulos (P4)</th>
                      <th scope="col" className="text-center w-24">Nota Final</th>
                      <th scope="col" className="text-center w-28">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {evaluatedCandidatos.map((c, index) => {
                      const score = calculateNotaFinal(c);
                      const isApproved = score >= 6.0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/10 transition-colors font-semibold">
                          {isSortedByClassification && (
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                index === 0 
                                  ? 'bg-yellow-105 text-amber-700 border border-yellow-300' 
                                  : index === 1 
                                  ? 'bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-700 dark:text-slate-100' 
                                  : index === 2 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : 'text-slate-500'
                              }`}>
                                {index + 1}º
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-slate-855 dark:text-slate-100">{c.nome}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Insc: {c.inscricao} ({c.modalidade})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {c.edital}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {c.cargo}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={c.notaEscrita}
                              onChange={(e) => handleScoreChange(c.id, 'notaEscrita', e.target.value)}
                              className="w-16 mx-auto px-2 py-1 text-center font-mono font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={c.notaTitulos}
                              onChange={(e) => handleScoreChange(c.id, 'notaTitulos', e.target.value)}
                              className="w-16 mx-auto px-2 py-1 text-center font-mono font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-slate-855 dark:text-slate-150">
                            {score.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                            }`}>
                              {isApproved ? 'APROVADO' : 'REPROVADO'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub collapsible lists below the table (ONLY if classification calculations are triggered) */}
          {isSortedByClassification && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <i className="ti ti-sitemap"></i>
                Classificação Dividida por Modalidades de Ingresso (Resultado Final)
              </h4>

              {/* Collapsible AC */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750 rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setIsAcCollapsed(!isAcCollapsed)}
                  className="w-full flex items-center justify-between p-3 px-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Ampla Concorrência (AC)</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-850 text-[9px] font-black rounded-full">
                      {classifiedByModalidade.AC.length} Candidato(s)
                    </span>
                  </div>
                  <i className={`ti ${isAcCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'} text-slate-400 text-sm`}></i>
                </button>
                {!isAcCollapsed && (
                  <div className="p-3 divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-800">
                    {classifiedByModalidade.AC.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">Nenhum candidato nesta modalidade.</p>
                    ) : (
                      classifiedByModalidade.AC.map((c, idx) => (
                        <div key={c.id} className="py-2.5 px-2 flex items-center justify-between text-xs font-medium hover:bg-slate-50/30 rounded">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400 w-6">#{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{c.nome}</span>
                              <span className="text-[10px] text-slate-400">Edital {c.edital} - {c.cargo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[10px] text-slate-500">
                              (E:{c.notaEscrita} | T:{c.notaTitulos})
                            </span>
                            <span className="font-semibold text-slate-400 text-[10px]">Média:</span>
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400">{calculateNotaFinal(c).toFixed(2)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              calculateNotaFinal(c) >= 6.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {calculateNotaFinal(c) >= 6.0 ? 'Aprovado' : 'Reprovado'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible PcD */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-755 rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setIsPcdCollapsed(!isPcdCollapsed)}
                  className="w-full flex items-center justify-between p-3 px-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Pessoas com Deficiência (PcD)</span>
                    <span className="px-1.5 py-0.2 bg-blue-105 text-blue-800 text-[9px] font-black rounded-full">
                      {classifiedByModalidade.PcD.length} Candidato(s)
                    </span>
                  </div>
                  <i className={`ti ${isPcdCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'} text-slate-400 text-sm`}></i>
                </button>
                {!isPcdCollapsed && (
                  <div className="p-3 divide-y divide-slate-100 dark:divide-slate-850">
                    {classifiedByModalidade.PcD.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">Nenhum candidato nesta modalidade.</p>
                    ) : (
                      classifiedByModalidade.PcD.map((c, idx) => (
                        <div key={c.id} className="py-2.5 px-2 flex items-center justify-between text-xs font-medium hover:bg-slate-50/40 rounded">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400 w-6">#{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{c.nome}</span>
                              <span className="text-[10px] text-slate-400">Edital {c.edital} - {c.cargo} {c.tipoDeficiencia ? `(${c.tipoDeficiencia})` : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[10px] text-slate-500">
                              (E:{c.notaEscrita} | T:{c.notaTitulos})
                            </span>
                            <span className="font-semibold text-slate-400 text-[10px]">Média:</span>
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400">{calculateNotaFinal(c).toFixed(2)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              calculateNotaFinal(c) >= 6.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {calculateNotaFinal(c) >= 6.0 ? 'Aprovado' : 'Reprovado'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible Negros / Pardos */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-755 rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setIsNegrosCollapsed(!isNegrosCollapsed)}
                  className="w-full flex items-center justify-between p-3 px-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Autodeclarados Negros / Pardos</span>
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded-full">
                      {classifiedByModalidade.Negros.length} Candidato(s)
                    </span>
                  </div>
                  <i className={`ti ${isNegrosCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'} text-slate-400 text-sm`}></i>
                </button>
                {!isNegrosCollapsed && (
                  <div className="p-3 divide-y divide-slate-100 dark:divide-slate-850">
                    {classifiedByModalidade.Negros.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">Nenhum candidato nesta modalidade.</p>
                    ) : (
                      classifiedByModalidade.Negros.map((c, idx) => (
                        <div key={c.id} className="py-2.5 px-2 flex items-center justify-between text-xs font-medium hover:bg-slate-50/40 rounded">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400 w-6">#{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{c.nome}</span>
                              <span className="text-[10px] text-slate-400 font-sans">Edital {c.edital} - {c.cargo} - {c.racial}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-sans text-[10px] text-slate-500">
                              (E:{c.notaEscrita} | T:{c.notaTitulos})
                            </span>
                            <span className="font-semibold text-slate-400 text-[10px]">Média:</span>
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400">{calculateNotaFinal(c).toFixed(2)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              calculateNotaFinal(c) >= 6.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {calculateNotaFinal(c) >= 6.0 ? 'Aprovado' : 'Reprovado'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CONTENT TABS: IMPORTAÇÃO EM LOTE --- */}
      {activeView === 'importacao' && (
        <div className="space-y-5 animate-fade-in" id="panel-importacao">

          {/* IDLE: Dropzone + Feature Cards + History */}
          {importStage === 'idle' && (
            <>
              <div className="sp-card text-center py-8 space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <i className="ti ti-cloud-upload text-3xl" style={{ color: 'var(--color-primary)' }}></i>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>Importar Base de Candidatos</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto' }}>
                      Selecione ou arraste uma planilha CSV, XLS ou XLSX. O sistema valida estruturalmente, persiste o lote e registra rejeições na auditoria.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  className="relative rounded-xl mx-4 cursor-pointer transition-all duration-200"
                  style={{
                    border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isDragOver ? 'var(--color-primary-light)' : 'transparent',
                    padding: '40px 20px'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <i className="ti ti-cloud-upload text-4xl" style={{ color: isDragOver ? 'var(--color-primary)' : 'var(--color-text-muted)' }}></i>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {isDragOver ? 'Solte o arquivo aqui' : 'Clique para escolher ou arraste o arquivo'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CSV, XLS ou XLSX — máx. 10 MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <i className="ti ti-info-circle" style={{ color: 'var(--color-info)' }}></i>
                  <span style={{ color: 'var(--color-text-muted)' }}>Precisa de ajuda?</span>
                  <button
                    onClick={() => showLocalToast('Simulando download do modelo XLSX...', 'success')}
                    style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Baixar modelo de planilha
                  </button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="sp-card text-center py-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                    <i className="ti ti-shield-check text-xl" style={{ color: 'var(--color-success)' }}></i>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>Validação Estrutural</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Colunas e tipos verificados</p>
                </div>
                <div className="sp-card text-center py-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                    <i className="ti ti-users text-xl" style={{ color: 'var(--color-info)' }}></i>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>Persistência do Lote</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Dados salvos no banco</p>
                </div>
                <div className="sp-card text-center py-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--color-warning-bg)' }}>
                    <i className="ti ti-clipboard-data text-xl" style={{ color: 'var(--color-warning)' }}></i>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>Auditoria Completa</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Log de erros e rejeições</p>
                </div>
              </div>

              {/* Import History */}
              {importBatches.length > 0 && (
                <div className="sp-table-container">
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>Histórico de Lotes Importados</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>Registro de importações nesta sessão</p>
                    </div>
                    <span className="sp-badge sp-badge-neutral">{importBatches.length} lote(s)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th>Arquivo</th>
                          <th>Data / Hora</th>
                          <th className="text-center">Total</th>
                          <th className="text-center">Importados</th>
                          <th className="text-center">Rejeitados</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importBatches.map(batch => (
                          <tr key={batch.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <i className="ti ti-file-spreadsheet text-sm" style={{ color: 'var(--color-primary)' }}></i>
                                <span style={{ fontWeight: 600 }}>{batch.fileName}</span>
                              </div>
                            </td>
                            <td className="font-mono" style={{ fontSize: '12px' }}>{batch.dataHora}</td>
                            <td className="text-center" style={{ fontWeight: 700 }}>{batch.total}</td>
                            <td className="text-center"><span className="sp-badge sp-badge-success">{batch.importados}</span></td>
                            <td className="text-center">
                              <span className={`sp-badge ${batch.rejeitados > 0 ? 'sp-badge-recurso' : 'sp-badge-neutral'}`}>{batch.rejeitados}</span>
                            </td>
                            <td className="text-center"><span className="sp-badge sp-badge-success">Concluído</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* VALIDATING STATE */}
          {importStage === 'validating' && (
            <div className="sp-card flex flex-col items-center justify-center py-20 space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
              </div>
              <div className="text-center">
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Validando arquivo...</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>{importFileName} · {importFileSize}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>Verificando estrutura de colunas e tipos de dados</p>
              </div>
            </div>
          )}

          {/* PREVIEW STATE */}
          {importStage === 'preview' && (
            <div className="space-y-4">
              <div className="sp-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <i className="ti ti-file-spreadsheet text-xl" style={{ color: 'var(--color-primary)' }}></i>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>{importFileName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{importFileSize} · {importPreviewRows.length} registros detectados</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    <i className="ti ti-circle-check"></i> {importPreviewRows.filter(r => r.validStatus === 'ok').length} válidos
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-warning)', fontWeight: 700 }}>
                    <i className="ti ti-alert-triangle"></i> {importPreviewRows.filter(r => r.validStatus === 'warn').length} avisos
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                    <i className="ti ti-circle-x"></i> {importPreviewRows.filter(r => r.validStatus === 'error').length} erros
                  </span>
                </div>
              </div>

              <div className="sp-table-container">
                <div className="overflow-x-auto">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 32, textAlign: 'center' }}>#</th>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>E-mail</th>
                        <th>Cargo</th>
                        <th>Edital</th>
                        <th style={{ textAlign: 'center' }}>Validação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewRows.map((row, idx) => (
                        <tr key={row.id} style={{
                          backgroundColor: row.validStatus === 'error' ? 'rgba(192,57,43,0.04)' : row.validStatus === 'warn' ? 'rgba(193,127,0,0.04)' : undefined
                        }}>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{row.nome}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.cpf}</td>
                          <td style={{ fontSize: '12px' }}>{row.email}</td>
                          <td style={{ fontSize: '12px' }}>{row.cargo}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.edital}</td>
                          <td style={{ textAlign: 'center' }}>
                            {row.validStatus === 'ok' && (
                              <span className="flex items-center justify-center gap-1" style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '12px' }}>
                                <i className="ti ti-circle-check"></i> OK
                              </span>
                            )}
                            {row.validStatus === 'warn' && (
                              <span className="flex items-center justify-center gap-1" style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '12px', cursor: 'help' }} title={row.issue}>
                                <i className="ti ti-alert-triangle"></i> Aviso
                              </span>
                            )}
                            {row.validStatus === 'error' && (
                              <span className="flex items-center justify-center gap-1" style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '12px', cursor: 'help' }} title={row.issue}>
                                <i className="ti ti-circle-x"></i> Erro
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 flex justify-between" style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>Somente registros sem erro serão importados. Avisos são importados com ressalva.</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {importPreviewRows.filter(r => r.validStatus !== 'error').length} de {importPreviewRows.length} prontos para importar
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={handleImportReset} className="sp-btn sp-btn-secondary">
                  <i className="ti ti-x"></i> Cancelar
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={importPreviewRows.filter(r => r.validStatus !== 'error').length === 0}
                  className="sp-btn sp-btn-primary"
                  style={{ opacity: importPreviewRows.filter(r => r.validStatus !== 'error').length === 0 ? 0.5 : 1 }}
                >
                  <i className="ti ti-cloud-upload"></i>
                  Importar {importPreviewRows.filter(r => r.validStatus !== 'error').length} Candidatos
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING STATE */}
          {importStage === 'importing' && (
            <div className="sp-card flex flex-col items-center justify-center py-20 space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
              </div>
              <div className="text-center">
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Importando candidatos...</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>Persistindo lote no banco de dados</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>Registrando rejeições na auditoria</p>
              </div>
            </div>
          )}

          {/* COMPLETE STATE */}
          {importStage === 'complete' && (() => {
            const validCount = importPreviewRows.filter(r => r.validStatus !== 'error').length;
            const rejCount = importPreviewRows.filter(r => r.validStatus === 'error').length;
            return (
              <div className="space-y-4">
                <div className="sp-card text-center py-12 space-y-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                    <i className="ti ti-circle-check text-3xl" style={{ color: 'var(--color-success)' }}></i>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-text-primary)' }}>Importação Concluída!</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>{importFileName}</p>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-success)' }}>{validCount}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Importados</p>
                    </div>
                    <div style={{ width: 1, height: 40, backgroundColor: 'var(--color-border)' }}></div>
                    <div className="text-center">
                      <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-danger)' }}>{rejCount}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Rejeitados</p>
                    </div>
                    <div style={{ width: 1, height: 40, backgroundColor: 'var(--color-border)' }}></div>
                    <div className="text-center">
                      <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text-primary)' }}>{importPreviewRows.length}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={handleImportReset} className="sp-btn sp-btn-secondary">
                      <i className="ti ti-upload"></i> Nova Importação
                    </button>
                    <button onClick={() => setActiveTab('cadastro')} className="sp-btn sp-btn-primary">
                      <i className="ti ti-users"></i> Ver Candidatos Importados
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* --- LEITOR DE CURRÍCULO --- */}
      {activeView === 'curriculo' && (
        <div className="space-y-5 animate-fade-in" id="panel-curriculo">

          {/* IDLE: Dropzone */}
          {curriculoStage === 'idle' && (
            <div className="sp-card text-center py-10 space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                  <i className="ti ti-file-description text-3xl" style={{ color: 'var(--color-info)' }}></i>
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6 }}>Leitura Inteligente de Currículo</h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                    Anexe um currículo em PDF. O sistema analisa via OCR para extrair automaticamente os dados pessoais, experiência e habilidades do candidato.
                  </p>
                </div>
              </div>

              {/* PDF Dropzone */}
              <div
                className="rounded-xl mx-auto cursor-pointer transition-all duration-200"
                style={{
                  border: `2px dashed ${isCvDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: isCvDragOver ? 'var(--color-primary-light)' : 'transparent',
                  padding: '36px 20px', maxWidth: 560
                }}
                onClick={() => cvFileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsCvDragOver(true); }}
                onDragLeave={() => setIsCvDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsCvDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCvFileSelect(f); }}
              >
                <input
                  ref={cvFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvFileSelect(f); }}
                />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <i className="ti ti-upload text-4xl" style={{ color: isCvDragOver ? 'var(--color-primary)' : 'var(--color-text-muted)' }}></i>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {isCvDragOver ? 'Solte o currículo aqui' : 'Clique ou arraste o currículo aqui'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>Formatos suportados: PDF (Max 5MB)</p>
                  </div>
                  <button
                    type="button"
                    className="sp-btn sp-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 16px', pointerEvents: 'none' }}
                  >
                    Selecionar Arquivo
                  </button>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="flex items-center justify-center gap-6 text-xs flex-wrap">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                  <i className="ti ti-circle-check text-sm"></i> Auto-preenchimento
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                  <i className="ti ti-circle-check text-sm"></i> Análise de Habilidades
                </span>
              </div>
            </div>
          )}

          {/* READING STATE */}
          {curriculoStage === 'reading' && (
            <div className="sp-card flex flex-col items-center justify-center py-20 space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-info)' }}></div>
              </div>
              <div className="text-center">
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Analisando currículo com OCR...</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>{curriculoFileName}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>Extraindo dados pessoais, experiência e habilidades</p>
              </div>
            </div>
          )}

          {/* PREVIEW: Pre-filled Form */}
          {(curriculoStage === 'preview' || curriculoStage === 'saving') && (
            <form onSubmit={handleSaveCurriculo} className="space-y-4">
              {/* Info Alert */}
              <div className="sp-alert sp-alert-info">
                <i className="ti ti-brain sp-alert-icon"></i>
                <p className="sp-alert-text">
                  Dados extraídos automaticamente de <strong>{curriculoFileName}</strong>. Revise e corrija os campos antes de salvar.
                </p>
              </div>

              <div className="sp-card space-y-4">
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Dados Pessoais Extraídos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="cv-nome">Nome Completo *</label>
                    <input id="cv-nome" type="text" required value={curriculoForm.nome}
                      onChange={e => setCurriculoForm(p => ({ ...p, nome: e.target.value }))}
                      className="sp-input" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-cpf">CPF *</label>
                    <input id="cv-cpf" type="text" required value={curriculoForm.cpf}
                      onChange={e => setCurriculoForm(p => ({ ...p, cpf: e.target.value }))}
                      className="sp-input font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-nasc">Data de Nascimento</label>
                    <input id="cv-nasc" type="date" value={curriculoForm.nascimento}
                      onChange={e => setCurriculoForm(p => ({ ...p, nascimento: e.target.value }))}
                      className="sp-input font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-email">E-mail</label>
                    <input id="cv-email" type="email" value={curriculoForm.email}
                      onChange={e => setCurriculoForm(p => ({ ...p, email: e.target.value }))}
                      className="sp-input font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-fone">Telefone</label>
                    <input id="cv-fone" type="text" value={curriculoForm.telefone}
                      onChange={e => setCurriculoForm(p => ({ ...p, telefone: e.target.value }))}
                      className="sp-input font-mono" />
                  </div>
                </div>
              </div>

              <div className="sp-card space-y-4">
                <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Dados Profissionais e Inscrição
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="cv-cargo">Cargo Pretendido *</label>
                    <input id="cv-cargo" type="text" required value={curriculoForm.cargo}
                      onChange={e => setCurriculoForm(p => ({ ...p, cargo: e.target.value }))}
                      className="sp-input" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-edital">Vincular ao Edital</label>
                    <select id="cv-edital" value={curriculoForm.edital}
                      onChange={e => setCurriculoForm(p => ({ ...p, edital: e.target.value }))}
                      className="sp-input">
                      {editais.map(ed => <option key={ed.id} value={ed.numero}>Edital {ed.numero}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-escol">Escolaridade</label>
                    <select id="cv-escol" value={curriculoForm.escolaridade}
                      onChange={e => setCurriculoForm(p => ({ ...p, escolaridade: e.target.value }))}
                      className="sp-input">
                      <option value="Ensino Fundamental">Ensino Fundamental</option>
                      <option value="Ensino Médio">Ensino Médio</option>
                      <option value="Técnico Completo">Ensino Técnico</option>
                      <option value="Superior">Superior Completo</option>
                      <option value="Pós-Graduação">Pós-Graduação</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cv-racial">Autodeclaração Racial</label>
                    <select id="cv-racial" value={curriculoForm.racial}
                      onChange={e => setCurriculoForm(p => ({ ...p, racial: e.target.value }))}
                      className="sp-input">
                      <option value="Branca">Branca</option>
                      <option value="Preta">Preta</option>
                      <option value="Parda">Parda</option>
                      <option value="Amarela">Amarela</option>
                      <option value="Indígena">Indígena</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="cv-skills">Habilidades Detectadas</label>
                    <input id="cv-skills" type="text" value={curriculoForm.habilidades}
                      onChange={e => setCurriculoForm(p => ({ ...p, habilidades: e.target.value }))}
                      className="sp-input" placeholder="Ex: Excel, SAP, Gestão de Pessoas..." />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="cv-resumo">Resumo Profissional (OCR)</label>
                    <textarea id="cv-resumo" rows={3} value={curriculoForm.resumo}
                      onChange={e => setCurriculoForm(p => ({ ...p, resumo: e.target.value }))}
                      className="sp-input w-full" style={{ minHeight: 72, resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setCurriculoStage('idle'); setCurriculoFileName(null); if (cvFileInputRef.current) cvFileInputRef.current.value = ''; }}
                  className="sp-btn sp-btn-secondary"
                  disabled={curriculoStage === 'saving'}
                >
                  <i className="ti ti-x"></i> Cancelar
                </button>
                <button type="submit" className="sp-btn sp-btn-primary" disabled={curriculoStage === 'saving'}>
                  {curriculoStage === 'saving' ? (
                    <><div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div> Salvando...</>
                  ) : (
                    <><i className="ti ti-user-plus"></i> Cadastrar Candidato</>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* --- FLOATING TOAST ALERTS OVERLAY --- */}
      <div className="fixed bottom-4 right-4 z-55 space-y-2 pointer-events-none max-w-sm">
        {localToasts.map(toast => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-xl border font-bold text-xs flex items-center gap-2.5 pointer-events-auto animate-slide-in text-white ${
              toast.tipo === 'success' 
                ? 'bg-emerald-600 border-emerald-500' 
                : toast.tipo === 'error' 
                ? 'bg-rose-600 border-rose-500' 
                : 'bg-amber-600 border-amber-500'
            }`}
          >
            {toast.tipo === 'success' ? (
              <i className="ti ti-circle-check text-base"></i>
            ) : toast.tipo === 'error' ? (
              <i className="ti ti-circle-x text-base"></i>
            ) : (
              <i className="ti ti-alert-triangle text-base"></i>
            )}
            <div>{toast.mensagem}</div>
          </div>
        ))}
      </div>

      {/* --- MODALS DIALOGS --- */}

      {/* 1. NEW CANDIDATE FORM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 text-xs text-slate-700 dark:text-slate-200">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <i className="ti ti-user-plus text-emerald-600"></i>
                Inscrever Novo Candidato Manualmente
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="p-5 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome Completo */}
                <div className="space-y-1">
                  <label htmlFor="new-nome" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                  <input
                    id="new-nome"
                    type="text"
                    required
                    placeholder="Ex: Gabriel Gustavo de Oliveira"
                    value={newForm.nome}
                    onChange={(e) => setNewForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  />
                </div>

                {/* Nome Social */}
                <div className="space-y-1">
                  <label htmlFor="new-social" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome Social (Se houver)</label>
                  <input
                    id="new-social"
                    type="text"
                    placeholder="Ex: Gabriel Gustav (Se aplicável)"
                    value={newForm.nomeSocial}
                    onChange={(e) => setNewForm(prev => ({ ...prev, nomeSocial: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-1">
                  <label htmlFor="new-cpf" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CPF (Original) *</label>
                  <input
                    id="new-cpf"
                    type="text"
                    required
                    placeholder="Ex: 567.890.123-44"
                    value={newForm.cpf}
                    onChange={(e) => setNewForm(prev => ({ ...prev, cpf: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <label htmlFor="new-nasc" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data de Nascimento *</label>
                  <input
                    id="new-nasc"
                    type="date"
                    required
                    value={newForm.nascimento}
                    onChange={(e) => setNewForm(prev => ({ ...prev, nascimento: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="new-email" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">E-mail de Contato *</label>
                  <input
                    id="new-email"
                    type="email"
                    required
                    placeholder="Ex: gabriel@email.com"
                    value={newForm.email}
                    onChange={(e) => setNewForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label htmlFor="new-fone" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Telefone *</label>
                  <input
                    id="new-fone"
                    type="text"
                    required
                    placeholder="Ex: (51) 98765-4321"
                    value={newForm.telefone}
                    onChange={(e) => setNewForm(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* CEP */}
                <div className="space-y-1">
                  <label htmlFor="new-cep" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CEP (Digite 8 dígitos para autocompletar) *</label>
                  <div className="flex gap-2">
                    <input
                      id="new-cep"
                      type="text"
                      required
                      placeholder="Ex: 90000-000"
                      value={newForm.cep}
                      onChange={(e) => setNewForm(prev => ({ ...prev, cep: e.target.value }))}
                      onBlur={simulateCepFetch}
                      className="flex-1 p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={simulateCepFetch}
                      className="px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 rounded-lg font-black"
                    >
                      CEP
                    </button>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-1">
                  <label htmlFor="new-end" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Endereço Completo *</label>
                  <input
                    id="new-end"
                    type="text"
                    required
                    placeholder="Ex: Avenida Bento Gonçalves, 1500 - Porto Alegre/RS"
                    value={newForm.endereco}
                    onChange={(e) => setNewForm(prev => ({ ...prev, endereco: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  />
                </div>

                {/* Racial Declaration */}
                <div className="space-y-1">
                  <label htmlFor="new-racial" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Autodeclaração Racial</label>
                  <select
                    id="new-racial"
                    value={newForm.racial}
                    onChange={(e) => setNewForm(prev => ({ ...prev, racial: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <option value="Branca">Branca</option>
                    <option value="Preta">Preta</option>
                    <option value="Parda">Parda</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Indígena">Indígena</option>
                  </select>
                </div>

                {/* Escolaridade */}
                <div className="space-y-1">
                  <label htmlFor="new-schol" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Escolaridade Máxima</label>
                  <select
                    id="new-schol"
                    value={newForm.escolaridade}
                    onChange={(e) => setNewForm(prev => ({ ...prev, escolaridade: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700"
                  >
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Técnico Completo">Ensino Técnico</option>
                    <option value="Superior Completo">Ensino Superior</option>
                    <option value="Pós-Graduação">Pós-Graduação (Especialização/Mestrado/Doutorado)</option>
                  </select>
                </div>

                {/* Edital Selector */}
                <div className="space-y-1">
                  <label htmlFor="new-ed" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Processo/Edital *</label>
                  <select
                    id="new-ed"
                    value={newForm.edital}
                    onChange={(e) => setNewForm(prev => ({ ...prev, edital: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    {editais.map(ed => (
                      <option key={ed.id} value={ed.numero}>Edital {ed.numero} - {ed.instituicao}</option>
                    ))}
                  </select>
                </div>

                {/* Cargo */}
                <div className="space-y-1">
                  <label htmlFor="new-cg" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cargo pretendido *</label>
                  <input
                    id="new-cg"
                    type="text"
                    required
                    placeholder="Ex: Analista de TI I"
                    value={newForm.cargo}
                    onChange={(e) => setNewForm(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  />
                </div>
              </div>

              {/* Deficiência toggle and conditional show type */}
              <div className="p-3 bg-slate-55 dark:bg-slate-905 rounded-xl border border-slate-100 dark:border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">Pessoa com Deficiência (PcD)?</p>
                    <p className="text-[10px] text-slate-400">O candidato declara possuir direito à reserva legal de cotas PcD.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewForm(prev => ({ ...prev, deficiencia: !prev.deficiencia }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        newForm.deficiencia ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        newForm.deficiencia ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="font-bold text-xs">{newForm.deficiencia ? 'Sim' : 'Não'}</span>
                  </div>
                </div>

                {newForm.deficiencia && (
                  <div className="animate-fade-in space-y-1">
                    <label htmlFor="new-pcd-type" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Informe o tipo ou necessidade adaptada *</label>
                    <input
                      id="new-pcd-type"
                      type="text"
                      required
                      placeholder="Ex: Deficiência Física (Cadeirante) ou Auditiva Parcial"
                      value={newForm.tipoDeficiencia}
                      onChange={(e) => setNewForm(prev => ({ ...prev, tipoDeficiencia: e.target.value }))}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-500 hover:text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-md cursor-pointer transition-transform"
                >
                  Garantir Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DOSSIE DETAILS MODAL (ti-eye) */}
      {isDossieModalOpen && selectedCandidato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsDossieModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg relative z-10 text-xs">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-1.5">
                <i className="ti ti-checklist text-blue-600"></i>
                Dossiê Geral de Concurso: {selectedCandidato.nome}
              </h3>
              <button onClick={() => setIsDossieModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Header profile info */}
              <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[9px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1 px-1.5 rounded">
                    CONCURSANTE Nº {selectedCandidato.inscricao}
                  </span>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1.5">{selectedCandidato.nome}</p>
                  {selectedCandidato.nomeSocial && (
                    <p className="text-[10px] text-slate-500">Nome Social: {selectedCandidato.nomeSocial}</p>
                  )}
                  <p className="text-xs text-slate-500 font-medium">{selectedCandidato.cargo}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(selectedCandidato.status)}`}>
                  {selectedCandidato.status}
                </span>
              </div>

              {/* Data block */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 font-medium">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">CPF do Candidato</span>
                  <p className="font-mono text-slate-800 dark:text-slate-205 mt-0.5">{selectedCandidato.cpf}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Nascimento</span>
                  <p className="font-mono text-slate-800 dark:text-slate-205 mt-0.5">
                    {selectedCandidato.nascimento.split('-').reverse().join('/')}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">E-mail de Contato</span>
                  <p className="text-slate-800 mt-0.5 dark:text-slate-205 truncate" title={selectedCandidato.email}>{selectedCandidato.email}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Telefone</span>
                  <p className="font-mono text-slate-800 dark:text-slate-205 mt-0.5">{selectedCandidato.telefone}</p>
                </div>
              </div>

              {/* Extra Location and Schooling Block */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 font-medium">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Escolaridade</span>
                  <p className="text-slate-800 dark:text-slate-205 mt-0.5">{selectedCandidato.escolaridade || 'Superior Completo'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Autodeclaração Racial</span>
                  <p className="text-slate-800 dark:text-slate-205 mt-0.5">{selectedCandidato.racial}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-black uppercase text-slate-400">Endereço Cadastrado (CEP: {selectedCandidato.cep || '90001-001'})</span>
                  <p className="text-slate-700 dark:text-slate-350 mt-0.5 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100">
                    {selectedCandidato.endereco || 'Avenida Bento Gonçalves, 1500 - Porto Alegre/RS'}
                  </p>
                </div>
              </div>

              {/* Special needs group */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="text-[9px] font-black uppercase text-slate-400">Atendimento adaptado / PcD</span>
                <p className="font-bold text-slate-700 mt-0.5">
                  {selectedCandidato.deficiencia 
                    ? `Sim - ${selectedCandidato.tipoDeficiencia || 'Necessita acessibilidade física'}` 
                    : 'Não - Ampla Concorrência padrão'
                  }
                </p>
              </div>

              {/* Action details block */}
              <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      onToggleStatus(selectedCandidato, 'Homologado');
                      setSelectedCandidato(prev => prev ? { ...prev, status: 'Homologado' } : null);
                      showLocalToast('Candidato Homologado com sucesso!', 'success');
                    }}
                    className="p-1 px-2.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    Homologar
                  </button>
                  <button
                    onClick={() => {
                      onToggleStatus(selectedCandidato, 'Indeferido');
                      setSelectedCandidato(prev => prev ? { ...prev, status: 'Indeferido' } : null);
                      showLocalToast('Candidato Indeferido!', 'error');
                    }}
                    className="p-1 px-2.5 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    Indeferir
                  </button>
                </div>
                <button
                  onClick={() => setIsDossieModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-50 font-bold cursor-pointer"
                >
                  OK / Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT CANDIDATE MANUAL FORM MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 text-xs">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-855 dark:text-white flex items-center gap-1.5 animate-pulse">
                <i className="ti ti-edit text-amber-600"></i>
                Editar Ficha Cadastral do Candidato
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditCandidate} className="p-5 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome Completo */}
                <div className="space-y-1">
                  <label htmlFor="edit-nome" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome do Candidato *</label>
                  <input
                    id="edit-nome"
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 font-semibold"
                  />
                </div>

                {/* Nome Social */}
                <div className="space-y-1">
                  <label htmlFor="edit-social" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome Social</label>
                  <input
                    id="edit-social"
                    type="text"
                    value={editForm.nomeSocial}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nomeSocial: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-1">
                  <label htmlFor="edit-cpf" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CPF do Concurso</label>
                  <input
                    id="edit-cpf"
                    type="text"
                    required
                    value={editForm.cpf}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cpf: e.target.value }))}
                    className="w-full p-2 border border-slate-350 dark:border-slate-700 bg-slate-100 dark:bg-slate-905 rounded-lg font-mono text-slate-500"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <label htmlFor="edit-nasc" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data de Nascimento *</label>
                  <input
                    id="edit-nasc"
                    type="date"
                    required
                    value={editForm.nascimento}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nascimento: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="edit-email" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">E-mail *</label>
                  <input
                    id="edit-email"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label htmlFor="edit-fone" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Telefone Contato *</label>
                  <input
                    id="edit-fone"
                    type="text"
                    required
                    value={editForm.telefone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                {/* CEP */}
                <div className="space-y-1">
                  <label htmlFor="edit-cep" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CEP *</label>
                  <div className="flex gap-2">
                    <input
                      id="edit-cep"
                      type="text"
                      required
                      placeholder="CEP"
                      value={editForm.cep}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cep: e.target.value }))}
                      onBlur={simulateCepFetchEdit}
                      className="flex-1 p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={simulateCepFetchEdit}
                      className="px-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg font-bold"
                    >
                      CEP
                    </button>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-1">
                  <label htmlFor="edit-end" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Endereço Completo *</label>
                  <input
                    id="edit-end"
                    type="text"
                    required
                    value={editForm.endereco}
                    onChange={(e) => setEditForm(prev => ({ ...prev, endereco: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700"
                  />
                </div>

                {/* Racial */}
                <div className="space-y-1">
                  <label htmlFor="edit-racial" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Autodeclaração Racial</label>
                  <select
                    id="edit-racial"
                    value={editForm.racial}
                    onChange={(e) => setEditForm(prev => ({ ...prev, racial: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <option value="Branca">Branca</option>
                    <option value="Preta">Preta</option>
                    <option value="Parda">Parda</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Indígena">Indígena</option>
                  </select>
                </div>

                {/* Escolaridade */}
                <div className="space-y-1">
                  <label htmlFor="edit-schol" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Escolaridade máxima</label>
                  <select
                    id="edit-schol"
                    value={editForm.escolaridade}
                    onChange={(e) => setEditForm(prev => ({ ...prev, escolaridade: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Técnico Completo">Ensino Técnico</option>
                    <option value="Superior Completo">Ensino Superior</option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                  </select>
                </div>

                {/* Status Cadastral */}
                <div className="space-y-1">
                  <label htmlFor="edit-status" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status da Inscrição (Cadastral)</label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-bold"
                  >
                    <option value="Homologado">Homologada (Deferida)</option>
                    <option value="Pendente">Pendente de Validação</option>
                    <option value="Indeferido">Indeferida (Rejeitada)</option>
                  </select>
                </div>

                {/* Edital */}
                <div className="space-y-1">
                  <label htmlFor="edit-ed" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Edital de Vínculo</label>
                  <select
                    id="edit-ed"
                    value={editForm.edital}
                    onChange={(e) => setEditForm(prev => ({ ...prev, edital: e.target.value }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    {editais.map(ed => (
                      <option key={ed.id} value={ed.numero}>Edital {ed.numero}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deficiência toggle and type editable */}
              <div className="p-3 bg-slate-50 dark:bg-slate-905 rounded-xl border border-slate-100 dark:border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-105">Portador de Deficiência Física (PcD)?</span>
                    <p className="text-[10px] text-slate-400">Ativa cotas adaptadas no cadastro integrador.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, deficiencia: !prev.deficiencia }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        editForm.deficiencia ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        editForm.deficiencia ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="font-bold text-xs">{editForm.deficiencia ? 'Sim' : 'Não'}</span>
                  </div>
                </div>

                {editForm.deficiencia && (
                  <div className="space-y-1">
                    <label htmlFor="edit-pcd-type" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo ou necessidade adaptada *</label>
                    <input
                      id="edit-pcd-type"
                      type="text"
                      required
                      value={editForm.tipoDeficiencia}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tipoDeficiencia: e.target.value }))}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-505 font-bold rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-md cursor-pointer"
                >
                  Confirmar Modificações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CONFIRM PUBLICATION OF EVALUATION PRESETS */}
      {isConfirmPublishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsConfirmPublishOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm relative z-10 text-xs">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Publicar Edital de Resultados?</h3>
              <button onClick={() => setIsConfirmPublishOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-slate-500 font-medium leading-relaxed">
                Você está prestes a publicar o boletim preliminar de resultado dos candidatos filtrados. Todos os dados serão congelados e tornados públicos no painel transparente de convocatória.
              </p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200/50 flex items-start gap-2 text-amber-900">
                <i className="ti ti-alert-triangle text-base mt-0.5"></i>
                <p className="text-[11px] font-semibold leading-normal">
                  Uma notificação eletrônica será enviada a todos os {evaluatedCandidatos.length} inscritos nesta seleção.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
              <button
                onClick={() => setIsConfirmPublishOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded hover:bg-slate-50 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublishResults}
                id="btn-confirmar-publicacao"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded shadow-md cursor-pointer"
              >
                Sim, Publicar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

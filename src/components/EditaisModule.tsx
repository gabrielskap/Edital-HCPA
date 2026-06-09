import React, { useState, useMemo } from 'react';
import { Edital, Cargo } from '../types';

interface EditaisModuleProps {
  editais: Edital[];
  setEditais: React.Dispatch<React.SetStateAction<Edital[]>>;
  showToast: (mensagem: string, tipo: 'success' | 'error' | 'warning') => void;
  logAction: (acao: string, modulo: string, registro: string, detalhe: string) => void;
  confirmAction?: (mensagem: string, callback: () => void) => void;
}

// 7 Steps defined for the progress bar
const WIZARD_STAGES = [
  { step: 1, name: 'Identificação' },
  { step: 2, name: 'Cargos' },
  { step: 3, name: 'Benefícios' },
  { step: 4, name: 'Cronograma' },
  { step: 5, name: 'Inscrição' },
  { step: 6, name: 'Critérios' },
  { step: 7, name: 'Revisão' }
];

export interface ProvaCriteriosDraft {
  id: string;
  nome: string;
  carater: 'Eliminatório e classificatório' | 'Classificatório' | 'Eliminatório';
  peso: string;
  composicao: string;
  notaMinima: string;
  pontoCorteAC: string;
  pontoCorteNegros: string;
  pontoCorteIndigenas: string;
  pontoCorteQuilombolas: string;
  pcdTexto: string;
}

export interface TituloItemDraft {
  id: string;
  numero: string;
  titulo: string;
  pontuacao: string;
  valorMaximo: string;
}

interface CargoDraft {
  id: string;
  numeroProcesso: string; // ex: PS 01, PS 02...
  nome: string;          // ex: ANALISTA DE TI I - Cibersegurança
  nivel: 'Superior' | 'Médio' | 'Fundamental' | '';
  cargaHoraria: string;  // ex: 200 horas/mês
  salario: string;       // ex: R$ 12.041,98 por mês
  salarioTipo: 'por mês' | 'por hora' | '';
  vagas: string;         // ex: "1", "2", "C.R."
  preRequisito: string;  // textarea
  descricaoSumaria: string; // textarea
  provas?: ProvaCriteriosDraft[];
  conteudoEscrita?: string;
  titulosItems?: TituloItemDraft[];
  referencias?: string;
}

interface CronogramaEventoDraft {
  id: string;
  data: string;
  evento: string;
}

interface EditalDraft {
  // Etapa 1 — Identificação do Edital
  numero: string;
  tipo: 'DE PROCESSOS SELETIVOS (PS)' | 'CONCURSO PÚBLICO' | '';
  instituicao: string;
  realizadora: string;
  dataPublicacao: string;
  cidade: string;
  estado: string;
  coordenadorNome: string;
  coordenadorCargo: string;

  // Etapa 2 — Cargos e Ocupações
  cargos: CargoDraft[];

  // Etapa 3 — Benefícios
  beneficiosDetalhes: string;
  beneficiosSelecionados: string[];
  outrosBeneficios: string;
  beneficiosTextoCustomizado: string;

  // Etapa 4 — Cronograma
  cronogramaVagas: string;
  cronogramaEventos: CronogramaEventoDraft[];

  // Etapa 5 — Inscrição e Taxas
  regrasInscricao: string;
  urlInscricoes: string;
  taxaSuperior: string;
  taxaMedio: string;
  dataLimitePagamento: string;
  emailDocumentos: string;
  permiteIsencao: boolean;
  textoCadUnico: string;
  textoDoadoresMedula: string;
  dataLimiteIsencao: string;
  permiteNomeSocial: boolean;
  vedaAposentadoEC103: boolean;
  duracaoProva: string;
  cidadeProvas: string;

  // Etapa 6 — Critérios (Vazio por ora, para etapas futuras)
  criteriosEspeciales: string;

  // Etapa 7 — Revisão (Vazio por ora, para etapas futuras)
  revisaoVerificada: boolean;
}

export default function EditaisModule({
  editais,
  setEditais,
  showToast,
  logAction,
  confirmAction
}: EditaisModuleProps) {
  // State for active view of the module: 'list' (directory) | 'wizard' (creation flow) | 'document' (official print view)
  const [activeView, setActiveView] = useState<'list' | 'wizard' | 'document'>('list');
  
  // Selected edital for official document view
  const [selectedEdital, setSelectedEdital] = useState<Edital | null>(null);

  // Initializing "editalDraft" with fields and default values for all steps
  const initialDraft: EditalDraft = {
    numero: '',
    tipo: '',
    instituicao: '',
    realizadora: '',
    dataPublicacao: '',
    cidade: '',
    estado: '',
    coordenadorNome: '',
    coordenadorCargo: '',
    cargos: [],
    
    // Etapa 3 — Benefícios
    beneficiosDetalhes: '',
    beneficiosSelecionados: [
      'Plano de previdência complementar',
      'Seguro de vida em grupo',
      'Vale-alimentação',
      'Refeitório',
      'Creche',
      'Estacionamento',
      'Academia de ginástica'
    ],
    outrosBeneficios: '',
    beneficiosTextoCustomizado: 'Os principais benefícios, opcionais, oferecidos são: Plano de previdência complementar, Seguro de vida em grupo, Vale-alimentação, Refeitório, Creche, Estacionamento, Academia de ginástica.',
    
    // Etapa 4 — Cronograma
    cronogramaVagas: '',
    cronogramaEventos: [
      { id: '1', data: '', evento: 'Período para realização de inscrições, exclusivamente pela internet' },
      { id: '2', data: '', evento: 'Período para solicitação de Atendimento Especial para realização da Prova Escrita' },
      { id: '3', data: '', evento: 'Período para solicitação de isenção da Taxa de Inscrição' },
      { id: '4', data: '', evento: 'Divulgação do resultado da solicitação de isenção da Taxa de Inscrição' },
      { id: '5', data: '', evento: 'Período de recursos quanto ao resultado da solicitação de isenção' },
      { id: '6', data: '', evento: 'Divulgação do resultado dos recursos da solicitação de isenção' },
      { id: '7', data: '', evento: 'Último dia para pagamento da Taxa de Inscrição' },
      { id: '8', data: '', evento: 'Divulgação da Banca Examinadora e da Relação Preliminar das Inscrições Homologadas' },
      { id: '9', data: '', evento: 'Período de recursos quanto à Banca Examinadora e Homologação Preliminar' },
      { id: '10', data: '', evento: 'Divulgação dos locais de provas e resultado dos recursos' },
      { id: '11', data: '', evento: 'Data da Aplicação da Prova Escrita' },
      { id: '12', data: '', evento: 'Divulgação dos gabaritos preliminares da Prova Escrita' },
      { id: '13', data: '', evento: 'Período de recursos quanto aos gabaritos preliminares' },
      { id: '14', data: '', evento: 'Divulgação do resultado preliminar da Prova Escrita' },
      { id: '15', data: '', evento: 'Divulgação da classificação final' }
    ],
    
    // Etapa 5 — Inscrição e Taxas
    regrasInscricao: '',
    urlInscricoes: 'http://portalfaurgs.com.br/concursos',
    taxaSuperior: 'R$ 140,00',
    taxaMedio: 'R$ 82,80',
    dataLimitePagamento: '',
    emailDocumentos: 'concursos.documentos@faurgs.com.br',
    permiteIsencao: true,
    textoCadUnico: 'Estarão isentos de pagamento da taxa de inscrição os candidatos que estiverem inscritos no Cadastro Único para Programas Sociais do Governo Federal (CadÚnico) e forem membros de família de baixa renda, nos termos do Decreto nº 11.016/2022.',
    textoDoadoresMedula: 'Estarão isentos do pagamento da taxa de inscrição os candidatos doadores de medula óssea em entidades reconhecidas pelo Ministério da Saúde, nos termos da Lei nº 13.656/2018.',
    dataLimiteIsencao: '',
    permiteNomeSocial: true,
    vedaAposentadoEC103: true,
    duracaoProva: '3 horas',
    cidadeProvas: 'Porto Alegre, RS',

    criteriosEspeciales: '',
    revisaoVerificada: false
  };

  const [editalDraft, setEditalDraft] = useState<EditalDraft>(initialDraft);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Cargo Form Temporary States (Step 2)
  const [tempCargo, setTempCargo] = useState<CargoDraft>({
    id: '',
    numeroProcesso: '',
    nome: '',
    nivel: '',
    cargaHoraria: '',
    salario: '',
    salarioTipo: 'por mês',
    vagas: '',
    preRequisito: '',
    descricaoSumaria: ''
  });
  
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [cargoErrors, setCargoErrors] = useState<Record<string, string>>({});

  // State to filter the list view
  const [searchTerm, setSearchTerm] = useState('');
  
  // State to track if we are editing an existing edital
  const [editingEditalId, setEditingEditalId] = useState<number | null>(null);

  // State for the status filter in directory
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // State for directory pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State to show high fidelity publish confirmation modal
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Collapsible sections state for Step 7 Review
  const [collapsedReview, setCollapsedReview] = useState<Record<string, boolean>>({
    identificacao: false,
    cargos: false,
    beneficios: false,
    cronograma: false,
    inscricao: false,
    criterios: false
  });

  // State to track expanded cargo in Step 6 criteria accordion
  const [expandedCargoId, setExpandedCargoId] = useState<string | null>(null);

  // Accessibility state for official document view text size
  const [fontScale, setFontScale] = useState<number>(1.0);

  // Clean form input change handler for wizard
  const handleInputChange = (field: keyof EditalDraft, value: any) => {
    setEditalDraft(prev => ({
      ...prev,
      [field]: value
    }));
    // Remove the error status interactively
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Cargo change handler (Step 2)
  const handleCargoChange = (field: keyof CargoDraft, value: any) => {
    setTempCargo(prev => ({
      ...prev,
      [field]: value
    }));
    // Remove error interactively
    if (cargoErrors[field]) {
      setCargoErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Enter creation mode
  const handleStartNewEdital = () => {
    setEditalDraft(initialDraft);
    setWizardStep(1);
    setValidationErrors({});
    setCargoErrors({});
    setEditingCargoId(null);
    setEditingEditalId(null);
    setTempCargo({
      id: '',
      numeroProcesso: '',
      nome: '',
      nivel: '',
      cargaHoraria: '',
      salario: '',
      salarioTipo: 'por mês',
      vagas: '',
      preRequisito: '',
      descricaoSumaria: ''
    });
    setActiveView('wizard');
  };

  // State handlers for benefits (Step 3)
  const handleToggleBeneficio = (beneficio: string) => {
    let novosSelecionados = [...(editalDraft.beneficiosSelecionados || [])];
    if (novosSelecionados.includes(beneficio)) {
      novosSelecionados = novosSelecionados.filter(b => b !== beneficio);
    } else {
      novosSelecionados.push(beneficio);
    }

    // Generate updated custom text automatically based on checked benefits
    let texto = '';
    if (novosSelecionados.length > 0) {
      texto = `Os principais benefícios, opcionais, oferecidos são: ${novosSelecionados.join(', ')}.`;
      if (editalDraft.outrosBeneficios && editalDraft.outrosBeneficios.trim()) {
        texto += ` Outros benefícios: ${editalDraft.outrosBeneficios.trim()}.`;
      }
    } else if (editalDraft.outrosBeneficios && editalDraft.outrosBeneficios.trim()) {
      texto = `Os principais benefícios, opcionais, oferecidos são: ${editalDraft.outrosBeneficios.trim()}.`;
    } else {
      texto = '';
    }

    setEditalDraft(prev => ({
      ...prev,
      beneficiosSelecionados: novosSelecionados,
      beneficiosTextoCustomizado: texto
    }));
  };

  const handleOutrosBeneficiosChange = (val: string) => {
    let texto = '';
    const selecionados = editalDraft.beneficiosSelecionados || [];
    if (selecionados.length > 0) {
      texto = `Os principais benefícios, opcionais, oferecidos são: ${selecionados.join(', ')}.`;
      if (val.trim()) {
        texto += ` Outros benefícios: ${val.trim()}.`;
      }
    } else if (val.trim()) {
      texto = `Os principais benefícios, opcionais, oferecidos são: ${val.trim()}.`;
    } else {
      texto = '';
    }

    setEditalDraft(prev => ({
      ...prev,
      outrosBeneficios: val,
      beneficiosTextoCustomizado: texto
    }));
  };

  // State handlers for cronograma (Step 4)
  const handleCronogramaEventoDataChange = (id: string, value: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cronogramaEventos: (prev.cronogramaEventos || []).map(item =>
        item.id === id ? { ...item, data: value } : item
      )
    }));
  };

  const handleCronogramaEventoTextoChange = (id: string, value: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cronogramaEventos: (prev.cronogramaEventos || []).map(item =>
        item.id === id ? { ...item, evento: value } : item
      )
    }));
  };

  const handleAddCronogramaEvento = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setEditalDraft(prev => ({
      ...prev,
      cronogramaEventos: [
        ...(prev.cronogramaEventos || []),
        { id: newId, data: '', evento: '' }
      ]
    }));
  };

  const handleRemoveCronogramaEvento = (id: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cronogramaEventos: (prev.cronogramaEventos || []).filter(item => item.id !== id)
    }));
  };

  // Add or Update Cargo inside editalDraft
  const handleSaveCargo = () => {
    const errors: Record<string, string> = {};
    if (!tempCargo.numeroProcesso.trim()) errors.numeroProcesso = 'Obrigatório';
    if (!tempCargo.nome.trim()) errors.nome = 'Obrigatório';
    if (!tempCargo.nivel) errors.nivel = 'Obrigatório';
    if (!tempCargo.cargaHoraria.trim()) errors.cargaHoraria = 'Obrigatório';
    if (!tempCargo.salario.trim()) errors.salario = 'Obrigatório';
    if (!tempCargo.vagas) errors.vagas = 'Obrigatório';
    if (!tempCargo.preRequisito.trim()) errors.preRequisito = 'Obrigatório';
    if (!tempCargo.descricaoSumaria.trim()) errors.descricaoSumaria = 'Obrigatório';

    if (Object.keys(errors).length > 0) {
      setCargoErrors(errors);
      showToast('Por favor, preencha todos os campos do cargo.', 'error');
      return;
    }

    if (editingCargoId) {
      // Modify existing cargo
      setEditalDraft(prev => ({
        ...prev,
        cargos: prev.cargos.map(c => c.id === editingCargoId ? { ...tempCargo, id: editingCargoId } : c)
      }));
      setEditingCargoId(null);
      showToast('Cargo atualizado com sucesso!', 'success');
    } else {
      // Create new cargo
      const newCargoId = Math.random().toString(36).substring(2, 9);
      setEditalDraft(prev => ({
        ...prev,
        cargos: [...prev.cargos, { ...tempCargo, id: newCargoId }]
      }));
      showToast('Cargo adicionado à tabela!', 'success');
    }

    // Reset cargo form
    setTempCargo({
      id: '',
      numeroProcesso: '',
      nome: '',
      nivel: '',
      cargaHoraria: '',
      salario: '',
      salarioTipo: 'por mês',
      vagas: '',
      preRequisito: '',
      descricaoSumaria: ''
    });
    setCargoErrors({});
  };

  // Populate Cargo form for editing
  const handleEditCargo = (cargo: CargoDraft) => {
    setTempCargo(cargo);
    setEditingCargoId(cargo.id);
    setCargoErrors({});
  };

  // Remove Cargo from table
  const handleRemoveCargo = (cargoId: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.filter(c => c.id !== cargoId)
    }));
    if (editingCargoId === cargoId) {
      setEditingCargoId(null);
      setTempCargo({
        id: '',
        numeroProcesso: '',
        nome: '',
        nivel: '',
        cargaHoraria: '',
        salario: '',
        salarioTipo: 'por mês',
        vagas: '',
        preRequisito: '',
        descricaoSumaria: ''
      });
    }
    showToast('Cargo removido.', 'warning');
  };

  // Stage 6 — Criteria state management helpers and updaters
  const ensureCargosCriterios = () => {
    let changed = false;
    const updatedCargos = editalDraft.cargos.map(cargo => {
      if (!cargo.provas) {
        changed = true;
        return {
          ...cargo,
          provas: [
            {
              id: 'p-escrita',
              nome: 'ESCRITA',
              carater: 'Eliminatório e classificatório' as const,
              peso: '60',
              composicao: 'Constituída de 25 questões objetivas, valendo 0,40 ponto cada.',
              notaMinima: '6,00 pontos',
              pontoCorteAC: '40',
              pontoCorteNegros: '10',
              pontoCorteIndigenas: '5',
              pontoCorteQuilombolas: '5',
              pcdTexto: 'todos os candidatos aprovados na Prova Escrita'
            },
            {
              id: 'p-titulos',
              nome: 'TÍTULOS',
              carater: 'Classificatório' as const,
              peso: '40',
              composicao: 'Conforme tabela abaixo e subitem 7.16 deste Edital.',
              notaMinima: '-',
              pontoCorteAC: '',
              pontoCorteNegros: '',
              pontoCorteIndigenas: '',
              pontoCorteQuilombolas: '',
              pcdTexto: '-'
            }
          ],
          conteudoEscrita: '- Avaliação da eficácia das estratégias de segurança técnica\n- Configuração de ambientes e controles de segurança em nuvem',
          titulosItems: [
            { id: 't-1', numero: '1', titulo: 'Formação acadêmica reconhecida pelo MEC', pontuacao: '-', valorMaximo: '-' },
            { id: 't-1.1', numero: '1.1', titulo: 'Doutorado', pontuacao: '1,00 ponto', valorMaximo: '2,00 pontos' },
            { id: 't-1.2', numero: '1.2', titulo: 'Mestrado', pontuacao: '0,75 ponto', valorMaximo: '1,50 pontos' }
          ],
          referencias: '- SILVA, João. Segurança em Nuvem. Porto Alegre: Editora Sul, 2024.\n- MEIRELES, Maria. Arquitetura de Sistemas de Segurança. São Paulo: TecPress, 2025.'
        };
      }
      return cargo;
    });
    if (changed) {
      setEditalDraft(prev => ({ ...prev, cargos: updatedCargos }));
    }
  };

  const updateCargoCriteriosField = (cargoId: string, field: keyof CargoDraft, value: any) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => c.id === cargoId ? { ...c, [field]: value } : c)
    }));
  };

  const updateProvaField = (cargoId: string, provaId: string, field: keyof ProvaCriteriosDraft, value: any) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId && c.provas) {
          return {
            ...c,
            provas: c.provas.map(p => p.id === provaId ? { ...p, [field]: value } : p)
          };
        }
        return c;
      })
    }));
  };

  const handleAddProva = (cargoId: string) => {
    const newProva: ProvaCriteriosDraft = {
      id: `p-${Math.random().toString(36).substring(2, 9)}`,
      nome: 'PRÁTICA',
      carater: 'Eliminatório e classificatório',
      peso: '0',
      composicao: 'Constituída de avaliação individual conforme critérios específicos.',
      notaMinima: '6,00 pontos',
      pontoCorteAC: '',
      pontoCorteNegros: '',
      pontoCorteIndigenas: '',
      pontoCorteQuilombolas: '',
      pcdTexto: 'todos os candidatos aprovados'
    };
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId) {
          return {
            ...c,
            provas: [...(c.provas || []), newProva]
          };
        }
        return c;
      })
    }));
  };

  const handleRemoveProva = (cargoId: string, provaId: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId && c.provas) {
          return {
            ...c,
            provas: c.provas.filter(p => p.id !== provaId)
          };
        }
        return c;
      })
    }));
  };

  const updateTituloField = (cargoId: string, tituloId: string, field: keyof TituloItemDraft, value: any) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId && c.titulosItems) {
          return {
            ...c,
            titulosItems: c.titulosItems.map(t => t.id === tituloId ? { ...t, [field]: value } : t)
          };
        }
        return c;
      })
    }));
  };

  const handleAddTitulo = (cargoId: string) => {
    const newTitulo: TituloItemDraft = {
      id: `t-${Math.random().toString(36).substring(2, 9)}`,
      numero: '',
      titulo: '',
      pontuacao: '',
      valorMaximo: ''
    };
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId) {
          return {
            ...c,
            titulosItems: [...(c.titulosItems || []), newTitulo]
          };
        }
        return c;
      })
    }));
  };

  const handleRemoveTitulo = (cargoId: string, tituloId: string) => {
    setEditalDraft(prev => ({
      ...prev,
      cargos: prev.cargos.map(c => {
        if (c.id === cargoId && c.titulosItems) {
          return {
            ...c,
            titulosItems: c.titulosItems.filter(t => t.id !== tituloId)
          };
        }
        return c;
      })
    }));
  };

  // Auto-initialize criteria for cargo drafts when wizard Step 6 is accessed
  React.useEffect(() => {
    if (wizardStep === 6) {
      ensureCargosCriterios();
    }
  }, [wizardStep, editalDraft.cargos]);

  // Validate fields for Step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editalDraft.numero.trim()) errors.numero = 'O número do edital é obrigatório.';
    if (!editalDraft.tipo) errors.tipo = 'O tipo de processo é obrigatório.';
    if (!editalDraft.instituicao.trim()) errors.instituicao = 'A instituição organizadora é obrigatória.';
    if (!editalDraft.realizadora.trim()) errors.realizadora = 'A instituição realizadora é obrigatória.';
    if (!editalDraft.dataPublicacao) errors.dataPublicacao = 'A data de publicação é obrigatória.';
    if (!editalDraft.cidade.trim()) errors.cidade = 'A cidade é obrigatória.';
    if (!editalDraft.estado.trim()) errors.estado = 'O estado é obrigatório.';
    if (!editalDraft.coordenadorNome.trim()) errors.coordenadorNome = 'O nome do coordenador é obrigatório.';
    if (!editalDraft.coordenadorCargo.trim()) errors.coordenadorCargo = 'O cargo do coordenador é obrigatório.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Preencha os campos destacados em vermelho para avançar.', 'error');
      return false;
    }
    return true;
  };

  // Validate fields for Step 2
  const validateStep2 = (): boolean => {
    if (editalDraft.cargos.length === 0) {
      showToast('Você deve adicionar pelo menos um cargo para prosseguir.', 'error');
      return false;
    }
    return true;
  };

  // Handle Wizard forwards
  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (validateStep1()) setWizardStep(2);
    } else if (wizardStep === 2) {
      if (validateStep2()) setWizardStep(3);
    } else if (wizardStep < 7) {
      setWizardStep(prev => prev + 1);
    }
  };

  // Handle Wizard backwards
  const handlePrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(prev => prev - 1);
    }
  };

  // Unified helper to compile Edital object from Draft
  const compileDraftToEdital = (targetStatus: 'Rascunho' | 'Publicado' | 'Em Andamento' | 'Encerrado' | 'Convocação' | 'Recurso', isExistingId?: number | null): Edital => {
    const totalVagasCargos = editalDraft.cargos.reduce((total, c) => {
      const parsed = parseInt(c.vagas, 10);
      return total + (isNaN(parsed) ? 0 : parsed);
    }, 0);

    const generatedCargos: Cargo[] = editalDraft.cargos.map((c, i) => {
      const salaryStrClean = c.salario ? c.salario.replace(/[^\d,]/g, '').replace(',', '.') : '0';
      const parsedSalary = parseFloat(salaryStrClean);
      const chStrClean = c.cargaHoraria ? c.cargaHoraria.replace(/[^\d]/g, '') : '40';
      const parsedCH = parseInt(chStrClean, 10);
      return {
        id: c.id || `c-${Math.random()}`,
        nome: c.nome,
        nivel: (c.nivel as any) || 'Médio',
        vagasAC: isNaN(parseInt(c.vagas, 10)) ? 0 : parseInt(c.vagas, 10),
        vagasPcD: 0,
        vagasNegros: 0,
        vagasIndigenas: 0,
        salario: isNaN(parsedSalary) ? 0 : parsedSalary,
        cargaHoraria: isNaN(parsedCH) ? 40 : parsedCH,
        numeroProcesso: c.numeroProcesso,
        preRequisito: c.preRequisito,
        descricaoSumaria: c.descricaoSumaria,
        salarioTipo: c.salarioTipo,
        vagasStr: c.vagas,
        cargaHorariaStr: c.cargaHoraria,
        salarioStr: c.salario,
        provas: c.provas,
        conteudoEscrita: c.conteudoEscrita,
        titulosItems: c.titulosItems,
        referencias: c.referencias
      } as any;
    });

    const finalId = isExistingId !== undefined && isExistingId !== null ? isExistingId : Date.now();

    return {
      id: finalId,
      numero: editalDraft.numero,
      instituicao: editalDraft.instituicao,
      realizadora: editalDraft.realizadora,
      titulo: `${editalDraft.tipo === 'CONCURSO PÚBLICO' ? 'Concurso Público' : 'Processo Seletivo Público'} Nº ${editalDraft.numero || 'Sem Número'} - ${editalDraft.instituicao}`,
      abertura: new Date().toISOString().substring(0, 10),
      encerramento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      vagas: totalVagasCargos,
      inscritos: isExistingId ? (editais.find(e => e.id === isExistingId)?.inscritos || 0) : 0,
      status: targetStatus,
      tipo: editalDraft.tipo || 'Processo Seletivo',
      dataPublicacao: editalDraft.dataPublicacao || new Date().toISOString().substring(0, 10),
      cargos: generatedCargos,
      cidade: editalDraft.cidade || 'Porto Alegre',
      estado: editalDraft.estado || 'RS',
      coordenadorNome: editalDraft.coordenadorNome || 'Prof. Dr. Francisco Silveira',
      coordenadorCargo: editalDraft.coordenadorCargo || 'Coordenador - Comissão de Seleção HCPA',
      isCustomHCPA: true,
      beneficiosDetalhes: editalDraft.beneficiosTextoCustomizado,
      outrosBeneficios: editalDraft.outrosBeneficios,
      beneficiosSelecionados: editalDraft.beneficiosSelecionados,
      cronogramaEventos: editalDraft.cronogramaEventos,
      urlInscricoes: editalDraft.urlInscricoes,
      taxaSuperior: editalDraft.taxaSuperior,
      taxaMedio: editalDraft.taxaMedio,
      dataLimitePagamento: editalDraft.dataLimitePagamento,
      emailDocumentos: editalDraft.emailDocumentos,
      permiteIsencao: editalDraft.permiteIsencao,
      textoCadUnico: editalDraft.textoCadUnico,
      textoDoadoresMedula: editalDraft.textoDoadoresMedula,
      dataLimiteIsencao: editalDraft.dataLimiteIsencao,
      permiteNomeSocial: editalDraft.permiteNomeSocial,
      vedaAposentadoEC103: editalDraft.vedaAposentadoEC103,
      duracaoProva: editalDraft.duracaoProva,
      cidadeProvas: editalDraft.cidadeProvas
    } as any;
  };

  // Save the edital as a rascunho
  const handleSaveDraft = () => {
    const isExisting = editingEditalId !== null;
    const compiled = compileDraftToEdital('Rascunho', editingEditalId);
    
    if (isExisting) {
      setEditais(prev => prev.map(e => e.id === editingEditalId ? compiled : e));
    } else {
      setEditais(prev => [compiled, ...prev]);
    }

    logAction(
      'Salvar Rascunho',
      'Editais',
      `Edital ${compiled.numero || 'Sem Número'}`,
      `Edital salvo temporariamente como rascunho com ${compiled.cargos.length} cargo(s).`
    );
    showToast(`Edital ${compiled.numero || 'Rascunho'} salvo como rascunho com sucesso!`, 'warning');
    setActiveView('list');
  };

  // Generate Document & transition directly to visualizer
  const handleGenerateDocument = () => {
    const isExisting = editingEditalId !== null;
    const currentStatus = isExisting ? (editais.find(e => e.id === editingEditalId)?.status as any || 'Rascunho') : 'Rascunho';
    const compiled = compileDraftToEdital(currentStatus, editingEditalId);
    
    if (isExisting) {
      setEditais(prev => prev.map(e => e.id === editingEditalId ? compiled : e));
    } else {
      setEditais(prev => [compiled, ...prev]);
    }

    logAction(
      'Gerar Documento',
      'Editais',
      `Edital ${compiled.numero || 'Sem Número'}`,
      `Documento oficial gerado e aberto para rascunho.`
    );
    
    setSelectedEdital(compiled);
    setActiveView('document');
  };

  // Edit an existing edital, reopening the wizard with its data prefilled
  const handleEditEdital = (ed: Edital) => {
    const parsedDraft: EditalDraft = {
      numero: ed.numero,
      tipo: ed.tipo === 'Concurso Público' || ed.tipo === 'CONCURSO PÚBLICO' ? 'CONCURSO PÚBLICO' : 'DE PROCESSOS SELETIVOS (PS)',
      instituicao: ed.instituicao,
      realizadora: ed.realizadora,
      dataPublicacao: ed.dataPublicacao || ed.abertura || '',
      cidade: (ed as any).cidade || 'Porto Alegre',
      estado: (ed as any).estado || 'RS',
      coordenadorNome: (ed as any).coordenadorNome || 'Prof. Dr. Francisco Silveira',
      coordenadorCargo: (ed as any).coordenadorCargo || 'Coordenador - Comissão de Seleção HCPA',
      cargos: (ed.cargos || []).map(cg => ({
        id: cg.id,
        numeroProcesso: (cg as any).numeroProcesso || `PS 01`,
        nome: cg.nome,
        nivel: cg.nivel || 'Médio',
        cargaHoraria: (cg as any).cargaHorariaStr || `${cg.cargaHoraria} horas/mês`,
        salario: (cg as any).salarioStr || `R$ ${cg.salario.toLocaleString('pt-BR')}`,
        salarioTipo: (cg as any).salarioTipo || 'por mês',
        vagas: (cg as any).vagasStr || cg.vagasAC?.toString() || 'C.R.',
        preRequisito: (cg as any).preRequisito || '',
        descricaoSumaria: (cg as any).descricaoSumaria || '',
        provas: (cg as any).provas || [],
        conteudoEscrita: (cg as any).conteudoEscrita || '',
        titulosItems: (cg as any).titulosItems || [],
        referencias: (cg as any).referencias || ''
      })),
      beneficiosDetalhes: (ed as any).beneficiosDetalhes || '',
      beneficiosSelecionados: (ed as any).beneficiosSelecionados || [],
      outrosBeneficios: (ed as any).outrosBeneficios || '',
      beneficiosTextoCustomizado: (ed as any).beneficiosTextoCustomizado || (ed as any).beneficiosDetalhes || '',
      cronogramaVagas: (ed as any).cronogramaVagas || '',
      cronogramaEventos: (ed as any).cronogramaEventos || [],
      regrasInscricao: (ed as any).regrasInscricao || '',
      urlInscricoes: (ed as any).urlInscricoes || 'http://portalfaurgs.com.br/concursos',
      taxaSuperior: (ed as any).taxaSuperior || 'R$ 140,00',
      taxaMedio: (ed as any).taxaMedio || 'R$ 82,80',
      dataLimitePagamento: (ed as any).dataLimitePagamento || '',
      emailDocumentos: (ed as any).emailDocumentos || 'concursos.documentos@faurgs.com.br',
      permiteIsencao: (ed as any).permiteIsencao ?? true,
      textoCadUnico: (ed as any).textoCadUnico || '',
      textoDoadoresMedula: (ed as any).textoDoadoresMedula || '',
      dataLimiteIsencao: (ed as any).dataLimiteIsencao || '',
      permiteNomeSocial: (ed as any).permiteNomeSocial ?? true,
      vedaAposentadoEC103: (ed as any).vedaAposentadoEC103 ?? true,
      duracaoProva: (ed as any).duracaoProva || '3 horas',
      cidadeProvas: (ed as any).cidadeProvas || 'Porto Alegre, RS',
      criteriosEspeciales: (ed as any).criteriosEspeciales || '',
      revisaoVerificada: (ed as any).revisaoVerificada ?? false
    };

    setEditalDraft(parsedDraft);
    setEditingEditalId(ed.id);
    setWizardStep(1);
    setValidationErrors({});
    setCargoErrors({});
    setActiveView('wizard');
  };

  // Clone an existing edital, creating a copy with blank number and rascunho status
  const handleCloneEdital = (ed: Edital) => {
    const parsedDraft: EditalDraft = {
      numero: '',
      tipo: ed.tipo === 'Concurso Público' || ed.tipo === 'CONCURSO PÚBLICO' ? 'CONCURSO PÚBLICO' : 'DE PROCESSOS SELETIVOS (PS)',
      instituicao: ed.instituicao,
      realizadora: ed.realizadora,
      dataPublicacao: ed.dataPublicacao || ed.abertura || '',
      cidade: (ed as any).cidade || 'Porto Alegre',
      estado: (ed as any).estado || 'RS',
      coordenadorNome: (ed as any).coordenadorNome || 'Prof. Dr. Francisco Silveira',
      coordenadorCargo: (ed as any).coordenadorCargo || 'Coordenador - Comissão de Seleção HCPA',
      cargos: (ed.cargos || []).map(cg => ({
        id: `c-${Math.random().toString(36).substring(2, 9)}`,
        numeroProcesso: (cg as any).numeroProcesso || `PS 01`,
        nome: cg.nome,
        nivel: cg.nivel || 'Médio',
        cargaHoraria: (cg as any).cargaHorariaStr || `${cg.cargaHoraria} horas/mês`,
        salario: (cg as any).salarioStr || `R$ ${cg.salario.toLocaleString('pt-BR')}`,
        salarioTipo: (cg as any).salarioTipo || 'por mês',
        vagas: (cg as any).vagasStr || cg.vagasAC?.toString() || 'C.R.',
        preRequisito: (cg as any).preRequisito || '',
        descricaoSumaria: (cg as any).descricaoSumaria || '',
        provas: (cg as any).provas || [],
        conteudoEscrita: (cg as any).conteudoEscrita || '',
        titulosItems: (cg as any).titulosItems || [],
        referencias: (cg as any).referencias || ''
      })),
      beneficiosDetalhes: (ed as any).beneficiosDetalhes || '',
      beneficiosSelecionados: (ed as any).beneficiosSelecionados || [],
      outrosBeneficios: (ed as any).outrosBeneficios || '',
      beneficiosTextoCustomizado: (ed as any).beneficiosTextoCustomizado || (ed as any).beneficiosDetalhes || '',
      cronogramaVagas: (ed as any).cronogramaVagas || '',
      cronogramaEventos: (ed as any).cronogramaEventos || [],
      regrasInscricao: (ed as any).regrasInscricao || '',
      urlInscricoes: (ed as any).urlInscricoes || 'http://portalfaurgs.com.br/concursos',
      taxaSuperior: (ed as any).taxaSuperior || 'R$ 140,00',
      taxaMedio: (ed as any).taxaMedio || 'R$ 82,80',
      dataLimitePagamento: (ed as any).dataLimitePagamento || '',
      emailDocumentos: (ed as any).emailDocumentos || 'concursos.documentos@faurgs.com.br',
      permiteIsencao: (ed as any).permiteIsencao ?? true,
      textoCadUnico: (ed as any).textoCadUnico || '',
      textoDoadoresMedula: (ed as any).textoDoadoresMedula || '',
      dataLimiteIsencao: (ed as any).dataLimiteIsencao || '',
      permiteNomeSocial: (ed as any).permiteNomeSocial ?? true,
      vedaAposentadoEC103: (ed as any).vedaAposentadoEC103 ?? true,
      duracaoProva: (ed as any).duracaoProva || '3 horas',
      cidadeProvas: (ed as any).cidadeProvas || 'Porto Alegre, RS',
      criteriosEspeciales: (ed as any).criteriosEspeciales || '',
      revisaoVerificada: (ed as any).revisaoVerificada ?? false
    };

    setEditalDraft(parsedDraft);
    setEditingEditalId(null); // Create new independent ID
    setWizardStep(1);
    setValidationErrors({});
    setCargoErrors({});
    setActiveView('wizard');
    showToast(`Edital clonado! Por favor, insira o novo número de Identificação.`, 'warning');
  };

  // Publish Edital definitivo
  const handlePublishEdital = () => {
    // Check if edital has a valid number
    if (!editalDraft.numero.trim()) {
      showToast('Defina o número do edital na etapa 1 antes de publicar.', 'error');
      setWizardStep(1);
      return;
    }

    setShowPublishConfirm(true);
  };

  // Filter listings by text search and status filter
  const filteredList = useMemo(() => {
    return editais.filter(ed => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        ed.numero.toLowerCase().includes(term) ||
        ed.instituicao.toLowerCase().includes(term) ||
        ed.titulo.toLowerCase().includes(term)
      );

      const matchesStatus = (
        statusFilter === 'Todos' ||
        ed.status.toLowerCase() === statusFilter.toLowerCase()
      );

      return matchesSearch && matchesStatus;
    });
  }, [editais, searchTerm, statusFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredList.length / 5) || 1;
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * 5;
    return filteredList.slice(startIndex, startIndex + 5);
  }, [filteredList, currentPage]);

  // View Document in HCPA layout
  const handleOpenDocView = (ed: Edital) => {
    setSelectedEdital(ed);
    setActiveView('document');
  };

  return (
    <div className="w-full space-y-6" id="editais-root-container">
      
      {/* ----------------- VISTA 1: DIRETÓRIO DE EDITAIS ----------------- */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Editais Oficiais</h1>
              <p className="text-sm text-gray-500">Criação, visualização e estruturação formal de Editais nos padrões HCPA e FAURGS.</p>
            </div>
            <button
              id="btn-novo-edital"
              onClick={handleStartNewEdital}
              className="mt-4 md:mt-0 flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm cursor-pointer"
            >
              <i className="ti ti-plus text-base font-bold"></i>
              Criar Edital (Padrão HCPA)
            </button>
          </div>

          {/* Search & Filter Controls Panel */}
          <div className="sp-card flex flex-col md:flex-row md:items-center gap-4 shadow-xs">
            <div className="sp-search-container flex-1">
              <i className="ti ti-search sp-search-icon"></i>
              <input
                id="search-editais"
                type="text"
                className="sp-search-input font-sans"
                placeholder="Pesquisar por número, título, instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-status" className="sp-form-label mb-0 uppercase tracking-wider whitespace-nowrap block">Filtrar Status:</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sp-input font-sans min-w-36"
              >
                <option value="Todos">Todos os Editais</option>
                <option value="Rascunho">Apenas Rascunhos</option>
                <option value="Publicado">Apenas Publicados</option>
              </select>
            </div>
          </div>

          {/* List Table / Directory view */}
          {editais.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
              <i className="ti ti-folders text-5xl text-gray-300 mb-3"></i>
              <p className="text-gray-700 font-bold text-center">Nenhum edital cadastrado no sistema</p>
              <p className="text-xs text-gray-500 text-center mt-1">Clique em "Criar Edital (Padrão HCPA)" acima para começar.</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
              <i className="ti ti-search-off text-5xl text-amber-500 mb-3"></i>
              <p className="text-gray-700 font-bold text-center">Nenhum edital encontrado</p>
              <p className="text-xs text-gray-500 text-center mt-1">Experimente alterar os filtros de pesquisa ou trocar a seleção do status atual.</p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); }}
                className="mt-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="sp-table-container">
              <div className="overflow-x-auto">
                <table className="sp-table" id="editais-list-table">
                  <thead>
                    <tr>
                      <th scope="col" className="w-32">Número / ID</th>
                      <th scope="col">Status</th>
                      <th scope="col">Instituição / Organizadora</th>
                      <th scope="col">Título do Processo</th>
                      <th scope="col" className="text-center w-24">Vagas</th>
                      <th scope="col" className="text-center w-52">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-750">
                    {paginatedList.map((ed) => (
                      <tr key={ed.id} className="hover:bg-gray-50/70 transition-all">
                        {/* Number */}
                        <td className="font-mono font-bold text-blue-600 bg-blue-50/20">
                          {ed.numero}
                        </td>
                        {/* Status */}
                        <td>
                          {ed.status === 'Rascunho' ? (
                            <span className="sp-badge sp-badge-rascunho">
                              Rascunho
                            </span>
                          ) : (
                            <span className="sp-badge sp-badge-publicado">
                              Publicado
                            </span>
                          )}
                        </td>
                        {/* Institution */}
                        <td className="font-bold text-gray-900">
                          <div className="flex flex-col">
                            <span>{ed.instituicao}</span>
                            <span className="text-[10px] text-gray-400 font-normal">Realização: {ed.realizadora}</span>
                          </div>
                        </td>
                        {/* Title */}
                        <td className="font-medium max-w-xs truncate" title={ed.titulo}>
                          <div className="flex flex-col">
                            <span className="truncate">{ed.titulo}</span>
                            {ed.abertura && <span className="text-[10px] text-gray-400 font-normal">Abertura: {ed.abertura}</span>}
                          </div>
                        </td>
                        {/* Vagas */}
                        <td className="text-center font-mono font-extrabold text-[11px] text-gray-700">
                          {ed.cargos && ed.cargos.length > 0 ? (
                            <span className="bg-gray-100 px-2 py-0.5 rounded border text-gray-800 font-bold" title={`${ed.cargos.length} cargos vinculados`}>
                              {ed.vagas === 0 ? 'C.R.' : ed.vagas}
                            </span>
                          ) : (
                            <span className="text-gray-400">C.R.</span>
                          )}
                        </td>
                        {/* Actions row */}
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Visualizar Doc */}
                            <button
                              type="button"
                              onClick={() => handleOpenDocView(ed)}
                              className="sp-btn-icon sp-btn-icon-view"
                              title="Visualizar Documento HCPA"
                              id={`view-doc-${ed.numero.replace('/', '-')}`}
                            >
                              <i className="ti ti-file-text"></i>
                            </button>

                            {/* Editar Edital */}
                            <button
                              type="button"
                              onClick={() => handleEditEdital(ed)}
                              className="sp-btn-icon sp-btn-icon-edit"
                              title="Editar Edital"
                              id={`edit-edital-${ed.numero.replace('/', '-')}`}
                            >
                              <i className="ti ti-edit"></i>
                            </button>

                            {/* Clonar Edital */}
                            <button
                              type="button"
                              onClick={() => handleCloneEdital(ed)}
                              className="sp-btn-icon sp-btn-icon-clone"
                              title="Clonar Edital (Copiar Estrutura)"
                              id={`clone-edital-${ed.numero.replace('/', '-')}`}
                            >
                              <i className="ti ti-copy"></i>
                            </button>

                            {/* Gerar PDF / Imprimir */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEdital(ed);
                                setActiveView('document');
                                setTimeout(() => {
                                  window.print();
                                }, 600);
                              }}
                              className="sp-btn-icon sp-btn-icon-pdf"
                              title="Gerar PDF / Imprimir"
                              id={`pdf-edital-${ed.numero.replace('/', '-')}`}
                            >
                              <i className="ti ti-printer"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Robust Pagination bar */}
              <div className="bg-gray-50 px-4 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-550 border-collapse" id="editais-pagination-controls">
                <span className="font-semibold text-gray-500">
                  Exibindo <strong>{(currentPage - 1) * 5 + 1}</strong> a <strong>{Math.min(currentPage * 5, filteredList.length)}</strong> de <strong>{filteredList.length}</strong> editais
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`p-2 border rounded-md transition-all cursor-pointer inline-flex items-center justify-center ${
                      currentPage === 1 
                        ? 'text-gray-300 border-gray-150 bg-gray-50 cursor-not-allowed' 
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100 bg-white shadow-xs'
                    }`}
                    title="Página Anterior"
                  >
                    <i className="ti ti-chevron-left font-bold text-xs"></i>
                  </button>
                  
                  <span className="font-bold text-gray-700 px-3 py-1 bg-white border border-gray-200 rounded text-center min-w-[70px] select-none shadow-xs">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={`p-2 border rounded-md transition-all cursor-pointer inline-flex items-center justify-center ${
                      currentPage === totalPages 
                        ? 'text-gray-300 border-gray-150 bg-gray-50 cursor-not-allowed' 
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100 bg-white shadow-xs'
                    }`}
                    title="Próxima Página"
                  >
                    <i className="ti ti-chevron-right font-bold text-xs"></i>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ----------------- VISTA 2: FORMULÁRIO WIZARD (CRIAR EDITAL) ----------------- */}
      {activeView === 'wizard' && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-md space-y-6 max-w-4xl mx-auto text-gray-800">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Formulário de Elaboração</span>
              <h2 className="text-xl font-bold text-gray-900">Novo Edital de Processo Seletivo</h2>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente cancelar? Os dados em memória não serão salvos.')) {
                  setActiveView('list');
                }
              }}
              className="text-xs text-gray-500 hover:text-red-650 font-bold border border-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Cancelar e Sair
            </button>
          </div>

          {/* Stepper progress track bar */}
          <div className="sp-wizard-container relative mb-6 rounded-xl border border-slate-205 select-none font-sans">
            <div className="sp-wizard-steps relative w-full flex items-center justify-between">
              {/* Connector Line behind steps */}
              <div className="absolute top-[14px] left-[5%] right-[5%] h-[2px] bg-slate-200 z-0">
                <div 
                  className="h-full bg-[var(--color-primary)] transition-all duration-300"
                  style={{ width: `${((wizardStep - 1) / 6) * 100}%` }}
                ></div>
              </div>

              {WIZARD_STAGES.map((st, i) => {
                const isActive = wizardStep === st.step;
                const isPassed = wizardStep > st.step;
                
                let stepClass = "sp-wizard-step sp-wizard-step-future";
                if (isActive) stepClass = "sp-wizard-step sp-wizard-step-active";
                else if (isPassed) stepClass = "sp-wizard-step sp-wizard-step-completed";

                return (
                  <div key={st.step} className={stepClass} style={{ zIndex: 2 }}>
                    <div className="sp-wizard-circle">
                      {isPassed ? (
                        <i className="ti ti-check text-sm font-black"></i>
                      ) : (
                        st.step
                      )}
                    </div>
                    <span className="sp-wizard-label hidden sm:inline-block font-bold">
                      {st.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- STEP 1: IDENTIFICAÇÃO DO EDITAL ---------------- */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                <p className="text-xs text-blue-850 font-medium">
                  <strong>Etapa 1: Formatos de Identificação Geral.</strong> Insira os códigos de referência, datas e as autoridades responsáveis pelo edital formalmente. Todos os campos são obrigatórios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID Número do Edital */}
                <div className="space-y-1">
                  <label htmlFor="num-edital" className="text-xs font-bold text-gray-700 block">Número do Edital *</label>
                  <input
                    id="num-edital"
                    type="text"
                    placeholder="Ex: 01/2026"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.numero ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                  />
                  {validationErrors.numero && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.numero}</span>
                  )}
                </div>

                {/* Tipo de Edital */}
                <div className="space-y-1">
                  <label htmlFor="tipo-edital" className="text-xs font-bold text-gray-700 block">Tipo *</label>
                  <select
                    id="tipo-edital"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 font-semibold ${
                      validationErrors.tipo ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                  >
                    <option value="">Selecione o Tipo...</option>
                    <option value="DE PROCESSOS SELETIVOS (PS)">DE PROCESSOS SELETIVOS (PS)</option>
                    <option value="CONCURSO PÚBLICO">CONCURSO PÚBLICO</option>
                  </select>
                  {validationErrors.tipo && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.tipo}</span>
                  )}
                </div>

                {/* Instituição Organizadora */}
                <div className="space-y-1">
                  <label htmlFor="inst-org" className="text-xs font-bold text-gray-700 block">Instituição Organizadora *</label>
                  <input
                    id="inst-org"
                    type="text"
                    placeholder="Ex: HCPA"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.instituicao ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.instituicao}
                    onChange={(e) => handleInputChange('instituicao', e.target.value)}
                  />
                  {validationErrors.instituicao && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.instituicao}</span>
                  )}
                </div>

                {/* Instituição Realizadora */}
                <div className="space-y-1">
                  <label htmlFor="inst-real" className="text-xs font-bold text-gray-700 block">Instituição Realizadora *</label>
                  <input
                    id="inst-real"
                    type="text"
                    placeholder="Ex: FAURGS"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.realizadora ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.realizadora}
                    onChange={(e) => handleInputChange('realizadora', e.target.value)}
                  />
                  {validationErrors.realizadora && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.realizadora}</span>
                  )}
                </div>

                {/* Data de Publicação */}
                <div className="space-y-1">
                  <label htmlFor="data-pub" className="text-xs font-bold text-gray-700 block">Data de Publicação *</label>
                  <input
                    id="data-pub"
                    type="date"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.dataPublicacao ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.dataPublicacao}
                    onChange={(e) => handleInputChange('dataPublicacao', e.target.value)}
                  />
                  {validationErrors.dataPublicacao && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.dataPublicacao}</span>
                  )}
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label htmlFor="cidade" className="text-xs font-bold text-gray-700 block">Cidade *</label>
                    <input
                      id="cidade"
                      type="text"
                      placeholder="Ex: Porto Alegre"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                        validationErrors.cidade ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={editalDraft.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                    />
                    {validationErrors.cidade && (
                      <span className="text-[10px] font-bold text-red-500 block">{validationErrors.cidade}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="estado" className="text-xs font-bold text-gray-700 block">Estado *</label>
                    <input
                      id="estado"
                      type="text"
                      placeholder="Ex: RS"
                      maxLength={2}
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                        validationErrors.estado ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={editalDraft.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                    />
                    {validationErrors.estado && (
                      <span className="text-[10px] font-bold text-red-500 block">{validationErrors.estado}</span>
                    )}
                  </div>
                </div>

                {/* Nome do Coordenador */}
                <div className="space-y-1">
                  <label htmlFor="coord-nome" className="text-xs font-bold text-gray-700 block">Coordenador da Comissão de Seleção *</label>
                  <input
                    id="coord-nome"
                    type="text"
                    placeholder="Ex: Prof. Dr. Francisco Silveira"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.coordenadorNome ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.coordenadorNome}
                    onChange={(e) => handleInputChange('coordenadorNome', e.target.value)}
                  />
                  {validationErrors.coordenadorNome && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.coordenadorNome}</span>
                  )}
                </div>

                {/* Cargo do Coordenador */}
                <div className="space-y-1">
                  <label htmlFor="coord-cargo" className="text-xs font-bold text-gray-700 block">Cargo do Coordenador *</label>
                  <input
                    id="coord-cargo"
                    type="text"
                    placeholder="Ex: Coordenador da Comissão de Seleção HCPA"
                    className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                      validationErrors.coordenadorCargo ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={editalDraft.coordenadorCargo}
                    onChange={(e) => handleInputChange('coordenadorCargo', e.target.value)}
                  />
                  {validationErrors.coordenadorCargo && (
                    <span className="text-[10px] font-bold text-red-500">{validationErrors.coordenadorCargo}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2: CARGOS E OCUPAÇÕES ---------------- */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                <p className="text-xs text-blue-850 font-medium">
                  <strong>Etapa 2: Cadastro de Cargos e Ocupações.</strong> Replique as funções que constarão no edital. Preencha os campos abaixo e clique em <strong>Adicionar Cargo</strong> para popular a tabela dinâmica.
                </p>
              </div>

              {/* Cargo Form Box */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-xs text-gray-950 uppercase tracking-wide border-b border-gray-200 pb-2">
                  {editingCargoId ? 'Editar Detalhes do Cargo' : 'Formulário de Entrada do Cargo'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Numero Processo */}
                  <div className="space-y-1">
                    <label htmlFor="cargo-proc" className="text-xs font-bold text-gray-700 block">Nº Processo Seletivo *</label>
                    <input
                      id="cargo-proc"
                      type="text"
                      placeholder="Ex: PS 01"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-850 ${
                        cargoErrors.numeroProcesso ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.numeroProcesso}
                      onChange={(e) => handleCargoChange('numeroProcesso', e.target.value)}
                    />
                    {cargoErrors.numeroProcesso && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Nome do cargo */}
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="cargo-nome" className="text-xs font-bold text-gray-700 block font-semibold">Nome do Cargo/Ação *</label>
                    <input
                      id="cargo-nome"
                      type="text"
                      placeholder="Ex: ANALISTA DE TI I - Cibersegurança"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-850 ${
                        cargoErrors.nome ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.nome}
                      onChange={(e) => handleCargoChange('nome', e.target.value)}
                    />
                    {cargoErrors.nome && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Nivel de Escolaridade */}
                  <div className="space-y-1">
                    <label htmlFor="cargo-nivel" className="text-xs font-bold text-gray-700 block">Nível *</label>
                    <select
                      id="cargo-nivel"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                        cargoErrors.nivel ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.nivel}
                      onChange={(e) => handleCargoChange('nivel', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Superior">Superior</option>
                      <option value="Médio">Médio</option>
                      <option value="Fundamental">Fundamental</option>
                    </select>
                    {cargoErrors.nivel && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Jornada Semanal / CH Mensal */}
                  <div className="space-y-1">
                    <label htmlFor="cargo-ch" className="text-xs font-bold text-gray-700 block">C.H. Mensal *</label>
                    <input
                      id="cargo-ch"
                      type="text"
                      placeholder="Ex: 200 horas/mês"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-850 ${
                        cargoErrors.cargaHoraria ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.cargaHoraria}
                      onChange={(e) => handleCargoChange('cargaHoraria', e.target.value)}
                    />
                    {cargoErrors.cargaHoraria && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Salário Inicial + Tipo */}
                  <div className="grid grid-cols-3 gap-1">
                    <div className="col-span-2 space-y-1">
                      <label htmlFor="cargo-salario" className="text-[11px] font-bold text-gray-700 block">Salário Inicial *</label>
                      <input
                        id="cargo-salario"
                        type="text"
                        placeholder="R$ 12.041,98"
                        className={`w-full p-2 border rounded-md text-xs bg-white text-gray-850 ${
                          cargoErrors.salario ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={tempCargo.salario}
                        onChange={(e) => handleCargoChange('salario', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cargo-saltipo" className="text-[11px] font-bold text-gray-700 block">Por...</label>
                      <select
                        id="cargo-saltipo"
                        className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white text-gray-800"
                        value={tempCargo.salarioTipo}
                        onChange={(e) => handleCargoChange('salarioTipo', e.target.value)}
                      >
                        <option value="por mês">mês</option>
                        <option value="por hora">hora</option>
                      </select>
                    </div>
                    {cargoErrors.salario && (
                      <span className="col-span-3 text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Vagas */}
                  <div className="space-y-1">
                    <label htmlFor="cargo-vagas" className="text-xs font-bold text-gray-700 block">Vagas *</label>
                    <select
                      id="cargo-vagas"
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-800 ${
                        cargoErrors.vagas ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.vagas}
                      onChange={(e) => handleCargoChange('vagas', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="C.R.">C.R. (Cadastro Reserva)</option>
                      <option value="1">1 vaga</option>
                      <option value="2">2 vagas</option>
                      <option value="3">3 vagas</option>
                      <option value="4">4 vagas</option>
                      <option value="5">5 vagas</option>
                      <option value="6">6 vagas</option>
                      <option value="7">7 vagas</option>
                      <option value="8">8 vagas</option>
                      <option value="9">9 vagas</option>
                      <option value="10">10 vagas</option>
                      <option value="15">15 vagas</option>
                      <option value="20">20 vagas</option>
                    </select>
                    {cargoErrors.vagas && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Pre Requisito Completo */}
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="cargo-req" className="text-xs font-bold text-gray-700 block">Pré-Requisito (Graus, Registro Profissional, etc.) *</label>
                    <textarea
                      id="cargo-req"
                      rows={2}
                      placeholder="Ex: Diploma de graduação em Computação devidamente registrado e registro ativo no conselho."
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-850 ${
                        cargoErrors.preRequisito ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.preRequisito}
                      onChange={(e) => handleCargoChange('preRequisito', e.target.value)}
                    />
                    {cargoErrors.preRequisito && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>

                  {/* Atividades Sumarias do Cargo */}
                  <div className="md:col-span-3 space-y-1">
                    <label htmlFor="cargo-desc" className="text-xs font-bold text-gray-700 block">Descrição Sumária das Atividades *</label>
                    <textarea
                      id="cargo-desc"
                      rows={2}
                      placeholder="Ex: Executar ações preventivas de segurança ciberespacial, monitoramento de incidentes e análise de invasões."
                      className={`w-full p-2 border rounded-md text-sm bg-white text-gray-850 ${
                        cargoErrors.descricaoSumaria ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={tempCargo.descricaoSumaria}
                      onChange={(e) => handleCargoChange('descricaoSumaria', e.target.value)}
                    />
                    {cargoErrors.descricaoSumaria && (
                      <span className="text-[9px] font-bold text-red-500">Campo obrigatório</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  {editingCargoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCargoId(null);
                        setTempCargo({
                          id: '',
                          numeroProcesso: '',
                          nome: '',
                          nivel: '',
                          cargaHoraria: '',
                          salario: '',
                          salarioTipo: 'por mês',
                          vagas: '',
                          preRequisito: '',
                          descricaoSumaria: ''
                        });
                        setCargoErrors({});
                      }}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveCargo}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <i className="ti ti-plus font-extrabold"></i>
                    {editingCargoId ? 'Atualizar Cargo' : 'Adicionar Cargo'}
                  </button>
                </div>
              </div>

              {/* Dynamic Table displaying registered cargos (replicating HCPA layout structure exactly) */}
              <div className="space-y-3">
                <h4 className="text-gray-900 font-bold text-sm">Visualização da Tabela de Cargos Cadastrados (Item 1 do Edital)</h4>
                
                {editalDraft.cargos.length === 0 ? (
                  <p className="text-gray-400 text-xs italic bg-gray-50 p-4 text-center rounded border border-gray-200">
                    Nenhum cargo adicionado a este edital até o momento. Cadastre um cargo no formulário acima.
                  </p>
                ) : (
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300 text-gray-900 font-bold font-mono">
                            <th className="py-2.5 px-3 border-r border-gray-250 text-[11px]">PROCESSO SELETIVO</th>
                            <th className="py-2.5 px-4 border-r border-gray-250">OCUPAÇÃO / FUNÇÃO (Requisitos Obrigatórios)</th>
                            <th className="py-2.5 px-3 border-r border-gray-250 text-center">JORNADA SEMANAL</th>
                            <th className="py-2.5 px-3 border-r border-gray-250 text-right">VALOR INICIAL</th>
                            <th className="py-2.5 px-2 border-r border-gray-250 text-center">VAGAS</th>
                            <th className="py-2.5 px-3 text-center">AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editalDraft.cargos.map((cg) => (
                            <tr key={cg.id} className="hover:bg-gray-50/50 align-top">
                              {/* Processo Seletivo */}
                              <td className="py-3 px-3 border-r border-gray-200 font-mono font-bold text-center whitespace-nowrap">
                                {cg.numeroProcesso}
                              </td>

                              {/* Ocupação / Função / Requisitos */}
                              <td className="py-3 px-4 border-r border-gray-200 space-y-1.5 max-w-sm">
                                <div className="font-bold text-gray-900">{cg.nome}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded inline-block font-mono">
                                  Nível {cg.nivel}
                                </div>
                                <div className="text-gray-600 text-[11px] leading-relaxed">
                                  <strong className="text-gray-900">Requisitos:</strong> {cg.preRequisito}
                                </div>
                                <div className="text-gray-600 text-[11px] leading-relaxed">
                                  <strong className="text-gray-900">Descrição:</strong> {cg.descricaoSumaria}
                                </div>
                              </td>

                              {/* CH */}
                              <td className="py-3 px-3 border-r border-gray-200 text-center font-mono font-medium whitespace-nowrap">
                                {cg.cargaHoraria}
                              </td>

                              {/* Salario */}
                              <td className="py-3 px-3 border-r border-gray-200 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                                {cg.salario} <span className="text-[10px] font-normal text-gray-500 block">{cg.salarioTipo}</span>
                              </td>

                              {/* Vagas */}
                              <td className="py-3 px-2 border-r border-gray-200 text-center font-bold font-mono">
                                {cg.vagas}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditCargo(cg)}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-all cursor-pointer"
                                    title="Editar Cargo"
                                  >
                                    <i className="ti ti-edit text-base"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveCargo(cg.id)}
                                    className="p-1 text-gray-500 hover:text-red-650 hover:bg-gray-100 rounded transition-all cursor-pointer"
                                    title="Remover Cargo"
                                  >
                                    <i className="ti ti-trash text-base"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Automatic footer notes replicating HCPA exactly */}
                    <div className="bg-gray-50 p-3 border-t border-gray-300 text-[10px] text-gray-600 italic leading-relaxed text-justify">
                      * Valor inicial de classe. C.R. = Cadastro de Reserva. Os candidatos aprovados
                      formarão um Cadastro de Reserva cuja contratação estará condicionada à
                      existência e/ou criação de vagas no prazo de validade do Processo Seletivo.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- WIZARD STEPS 3, 4, 5 (CRAFTED) ---------------- */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <strong>Etapa 3 - Dos Benefícios Oficiais do HCPA.</strong> Selecione os benefícios que constarão no edital. O texto descritivo oficial de benefícios será gerado automaticamente para o rascunho de edital finalizada, conforme seus checkboxes, mas permanece editável.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-900 block">Benefícios Oferecidos (Checkboxes)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Plano de previdência complementar',
                    'Seguro de vida em grupo',
                    'Vale-alimentação',
                    'Refeitório',
                    'Creche',
                    'Estacionamento',
                    'Academia de ginástica'
                  ].map((bene) => {
                    const isChecked = editalDraft.beneficiosSelecionados?.includes(bene) ?? false;
                    return (
                      <label
                        key={bene}
                        className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleToggleBeneficio(bene)}
                        />
                        <span className="text-xs">{bene}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-1 pt-2">
                  <label htmlFor="outros-beneficios" className="text-xs font-bold text-gray-700 block">Outros benefícios</label>
                  <input
                    id="outros-beneficios"
                    type="text"
                    placeholder="Ex: Auxílio combustível, Vale-transporte integrado..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800"
                    value={editalDraft.outrosBeneficios || ''}
                    onChange={(e) => handleOutrosBeneficiosChange(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="texto-customizado" className="text-xs font-bold text-gray-700 block font-semibold">
                    Texto customizado de benefícios (Gerado automaticamente, editável)
                  </label>
                  <textarea
                    id="texto-customizado"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 leading-relaxed font-sans"
                    value={editalDraft.beneficiosTextoCustomizado || ''}
                    onChange={(e) => handleInputChange('beneficiosTextoCustomizado', e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    * Nota: Alternar qualquer checkbox acima atualizará este texto automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <strong>Etapa 4 - Cronograma de Eventos.</strong> Defina os prazos e marcos fundamentais do concurso. Você pode escolher uma data calendarizada ou definir como "A definir (*)" individualmente.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Cronograma Dinâmico do Processo</h4>
                  <button
                    type="button"
                    onClick={handleAddCronogramaEvento}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <i className="ti ti-plus font-bold"></i>
                    Adicionar Evento
                  </button>
                </div>

                <div className="border border-gray-250 rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-250 text-gray-900 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-gray-200">ITEM</th>
                          <th className="py-2.5 px-3 w-64 border-r border-gray-200">DATA</th>
                          <th className="py-2.5 px-3 border-r border-gray-200">EVENTO E ATIVIDADES</th>
                          <th className="py-2.5 px-2 text-center w-16">REMOVER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(editalDraft.cronogramaEventos || []).map((ev, index) => {
                          const isADefinir = ev.data === '*';
                          return (
                            <tr key={ev.id} className="hover:bg-gray-50/50 align-middle">
                              <td className="py-2 px-3 text-center border-r border-gray-200 font-mono font-bold text-gray-500">
                                {index + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-gray-200">
                                {isADefinir ? (
                                  <div className="flex items-center justify-between gap-2 p-1 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-[10px] font-mono font-extrabold text-[#2563eb] bg-blue-50 px-1 rounded">* A definir</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCronogramaEventoDataChange(ev.id, '')}
                                      className="text-[10px] text-gray-400 hover:text-[#2563eb] font-bold"
                                    >
                                      Escolher data
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="date"
                                      className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 font-sans"
                                      value={ev.data || ''}
                                      onChange={(e) => handleCronogramaEventoDataChange(ev.id, e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleCronogramaEventoDataChange(ev.id, '*')}
                                      className="text-[10px] text-gray-600 hover:text-blue-600 hover:underline font-bold whitespace-nowrap"
                                      title="Marcar como 'A Definir'"
                                    >
                                      * A definir
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 border-r border-gray-200">
                                <input
                                  type="text"
                                  className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 font-sans font-medium"
                                  placeholder="Nome do Evento"
                                  value={ev.evento || ''}
                                  onChange={(e) => handleCronogramaEventoTextoChange(ev.id, e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCronogramaEvento(ev.id)}
                                  className="p-1 text-gray-400 hover:text-red-650 hover:bg-gray-100 rounded transition-all cursor-pointer"
                                  title="Deletar Evento"
                                >
                                  <i className="ti ti-trash text-sm"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded-lg text-[11px] text-gray-600 leading-relaxed font-sans">
                  <strong>Nota Automática mostrada no edital:</strong>
                  <p className="mt-1 font-serif text-gray-800">
                    "(*) A definir. Todas as divulgações são disponibilizadas no site da FAURGS,{' '}
                    <span className="text-[#2563eb] underline font-sans font-semibold">
                      {editalDraft.urlInscricoes || 'http://portalfaurgs.com.br/concursos'}
                    </span>
                    , após as 17h."
                  </p>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <strong>Etapa 5 - Cláusulas de Inscrição e Taxas.</strong> Mapeie os valores de taxas, os limites temporais de pagamento, os canais de contato e as isenções regulamentares socioeconômicas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* URL de Inscrição */}
                <div className="space-y-1">
                  <label htmlFor="url-insc" className="text-xs font-bold text-gray-700 block">URL do site de inscrições</label>
                  <input
                    id="url-insc"
                    type="text"
                    placeholder="Ex: http://portalfaurgs.com.br/concursos"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                    value={editalDraft.urlInscricoes || ''}
                    onChange={(e) => handleInputChange('urlInscricoes', e.target.value)}
                  />
                </div>

                {/* E-mail Envio de Documentos */}
                <div className="space-y-1">
                  <label htmlFor="email-docs" className="text-xs font-bold text-gray-700 block">E-mail para envio de documentos</label>
                  <input
                    id="email-docs"
                    type="email"
                    placeholder="Ex: concursos.documentos@faurgs.com.br"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                    value={editalDraft.emailDocumentos || ''}
                    onChange={(e) => handleInputChange('emailDocumentos', e.target.value)}
                  />
                </div>

                {/* Taxa Nível Superior */}
                <div className="space-y-1">
                  <label htmlFor="taxa-sup" className="text-xs font-bold text-gray-700 block">Valor da Taxa — Nível Superior</label>
                  <input
                    id="taxa-sup"
                    type="text"
                    placeholder="Ex: R$ 140,00"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans font-mono"
                    value={editalDraft.taxaSuperior || ''}
                    onChange={(e) => handleInputChange('taxaSuperior', e.target.value)}
                  />
                </div>

                {/* Taxa Nível Médio */}
                <div className="space-y-1">
                  <label htmlFor="taxa-med" className="text-xs font-bold text-gray-700 block">Valor da Taxa — Nível Médio</label>
                  <input
                    id="taxa-med"
                    type="text"
                    placeholder="Ex: R$ 82,80"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans font-mono"
                    value={editalDraft.taxaMedio || ''}
                    onChange={(e) => handleInputChange('taxaMedio', e.target.value)}
                  />
                </div>

                {/* Data Limite Pagamento */}
                <div className="space-y-1">
                  <label htmlFor="limite-pagamento" className="text-xs font-bold text-gray-700 block">Data limite de pagamento da taxa</label>
                  <input
                    id="limite-pagamento"
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                    value={editalDraft.dataLimitePagamento || ''}
                    onChange={(e) => handleInputChange('dataLimitePagamento', e.target.value)}
                  />
                </div>

                {/* Duração Prova Escrita */}
                <div className="space-y-1">
                  <label htmlFor="duracao-prova" className="text-xs font-bold text-gray-700 block">Duração da prova escrita</label>
                  <input
                    id="duracao-prova"
                    type="text"
                    placeholder="Ex: 3h, 2h30min a 4h"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                    value={editalDraft.duracaoProva || ''}
                    onChange={(e) => handleInputChange('duracaoProva', e.target.value)}
                  />
                </div>

                {/* Cidade de Realização */}
                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="cidade-provas" className="text-xs font-bold text-gray-700 block">Cidade de realização das provas</label>
                  <input
                    id="cidade-provas"
                    type="text"
                    placeholder="Ex: Porto Alegre, RS"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                    value={editalDraft.cidadeProvas || ''}
                    onChange={(e) => handleInputChange('cidadeProvas', e.target.value)}
                  />
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2 space-y-3">
                  {/* Isenção */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Permite isenção de taxa?</span>
                      <span className="text-[10px] text-gray-500">Isenções de taxa garantidas a membros de famílias hipossuficientes (CadÚnico) e doadores ativos de medula óssea.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('permiteIsencao', !editalDraft.permiteIsencao)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                        editalDraft.permiteIsencao ? 'bg-[#2563eb] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                    </button>
                  </div>

                  {/* Isenção Extended Fields */}
                  {editalDraft.permiteIsencao && (
                    <div className="pl-4 border-l-2 border-blue-500 space-y-3 pt-1">
                      <div className="space-y-1">
                        <label htmlFor="limite-isencao" className="text-xs font-bold text-gray-700 block">Data limite para solicitar isenção</label>
                        <input
                          id="limite-isencao"
                          type="date"
                          className="p-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 font-sans"
                          value={editalDraft.dataLimiteIsencao || ''}
                          onChange={(e) => handleInputChange('dataLimiteIsencao', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="texto-cadunico" className="text-xs font-bold text-gray-700 block font-semibold">Texto Regulador (CadÚnico)</label>
                        <textarea
                          id="texto-cadunico"
                          rows={2}
                          className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 leading-relaxed font-sans"
                          value={editalDraft.textoCadUnico || ''}
                          onChange={(e) => handleInputChange('textoCadUnico', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="texto-doadores" className="text-xs font-bold text-gray-700 block font-semibold">Texto Regulador (Doadores de Medula)</label>
                        <textarea
                          id="texto-doadores"
                          rows={2}
                          className="w-full p-2.5 border border-gray-300 rounded-md text-xs bg-white text-gray-800 leading-relaxed font-sans"
                          value={editalDraft.textoDoadoresMedula || ''}
                          onChange={(e) => handleInputChange('textoDoadoresMedula', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Nome Social */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Permite Nome Social?</span>
                      <span className="text-[10px] text-gray-500">Assegura o direito e homologação para identificação por nome social a candidatos travestis e transexuais.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('permiteNomeSocial', !editalDraft.permiteNomeSocial)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                        editalDraft.permiteNomeSocial ? 'bg-[#2563eb] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                    </button>
                  </div>

                  {/* EC 103 de 2019 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Veda inscrição de ex-empregado aposentado via EC 103/2019?</span>
                      <span className="text-[10px] text-gray-500">Impede o provimento de emprego público para aposentados sob regime próprio ou especial, conforme o texto constitucional da EC 103/2019.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('vedaAposentadoEC103', !editalDraft.vedaAposentadoEC103)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                        editalDraft.vedaAposentadoEC103 ? 'bg-[#2563eb] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 6 && (() => {
            const activeAccordionId = expandedCargoId || (editalDraft.cargos[0]?.id || null);

            return (
              <div className="space-y-6" id="wizard-step-6-container">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg">
                  <p className="text-xs text-blue-805 font-medium leading-relaxed">
                    <strong>Etapa 6 - Critérios de Seleção e Avaliação por Processo Seletivo.</strong> Preencha os detalhes das provas, conteúdo programático, tabelas dinâmicas de títulos e referências para cada cargo cadastrado.
                  </p>
                </div>

                {/* Accordion container */}
                <div className="space-y-4">
                  {editalDraft.cargos.map((cargo, index) => {
                    const isExpanded = activeAccordionId === cargo.id;
                    const provas = cargo.provas || [];
                    const titulosItems = cargo.titulosItems || [];

                    return (
                      <div key={cargo.id} className="border border-gray-250 rounded-xl overflow-hidden bg-white shadow-xs">
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedCargoId(isExpanded ? 'NONE' : cargo.id)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-all text-left font-sans cursor-pointer focus:outline-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="bg-[#2563eb] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {cargo.numeroProcesso || `Cargo ${index + 1}`}
                            </span>
                            <span className="font-bold text-gray-905 text-sm">
                              {cargo.nome}
                            </span>
                            <span className="text-xs text-gray-400">
                               ({cargo.nivel})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-semibold">Configurar critérios</span>
                            <i className={`ti ti-chevron-down text-lg text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                          </div>
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-5 border-t border-gray-200 space-y-8 bg-white">
                            
                            {/* Sub-section A: TABELA DE PROVAS */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="text-xs font-bold text-gray-901 uppercase tracking-wider flex items-center gap-1.5">
                                  <i className="ti ti-checklist text-[#2563eb] text-sm font-extrabold"></i>
                                  a) TABELA DE PROVAS
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => handleAddProva(cargo.id)}
                                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                >
                                  <i className="ti ti-plus font-bold"></i>
                                  Adicionar Tipo de Prova
                                </button>
                              </div>

                              <div className="border border-gray-250 rounded-lg overflow-hidden bg-white">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-250 text-gray-900 font-bold uppercase text-[10px]">
                                        <th className="py-2.5 px-3 w-1/5 border-r border-gray-200">PROVAS</th>
                                        <th className="py-2.5 px-3 w-1/5 border-r border-gray-200">CARÁTER</th>
                                        <th className="py-2.5 px-3 w-1/8 border-r border-gray-200 text-center">PESO</th>
                                        <th className="py-2.5 px-3 w-1/4 border-r border-gray-200">COMPOSIÇÃO DA PROVA</th>
                                        <th className="py-2.5 px-3 border-r border-gray-200">CRITÉRIOS PARA APROVAÇÃO</th>
                                        <th className="py-2.5 px-2 text-center w-10">AÇÃO</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {provas.map((prova) => {
                                        const isEscrita = prova.id === 'p-escrita';
                                        const isTitulos = prova.id === 'p-titulos';

                                        return (
                                          <tr key={prova.id} className="align-middle">
                                            {/* PROVAS Name */}
                                            <td className="py-3 px-3 border-r border-gray-100 font-sans font-bold text-gray-900">
                                              {isEscrita || isTitulos ? (
                                                <span className="text-gray-950 font-extrabold tracking-wide">{prova.nome}</span>
                                              ) : (
                                                <input
                                                  type="text"
                                                  className="w-full p-1.5 border border-gray-300 rounded font-bold uppercase text-xs"
                                                  value={prova.nome}
                                                  onChange={(e) => updateProvaField(cargo.id, prova.id, 'nome', e.target.value)}
                                                />
                                              )}
                                            </td>

                                            {/* CARATER Select */}
                                            <td className="py-3 px-3 border-r border-gray-100">
                                              {isTitulos ? (
                                                <span className="text-xs font-medium text-gray-650 bg-gray-100 px-1.5 py-0.5 rounded">Classificatório</span>
                                              ) : (
                                                <select
                                                  className="w-full p-1.5 border border-gray-300 rounded font-medium text-xs bg-white text-gray-800"
                                                  value={prova.carater}
                                                  onChange={(e) => updateProvaField(cargo.id, prova.id, 'carater', e.target.value as any)}
                                                >
                                                  <option value="Eliminatório e classificatório">Eliminatório e classificatório</option>
                                                  <option value="Classificatório">Classificatório</option>
                                                  <option value="Eliminatório">Eliminatório</option>
                                                </select>
                                              )}
                                            </td>

                                            {/* PESO Input */}
                                            <td className="py-3 px-3 border-r border-gray-100 text-center">
                                              <input
                                                type="number"
                                                className="w-16 p-1.5 border border-gray-300 rounded text-center text-xs font-mono bg-white text-gray-800"
                                                value={prova.peso}
                                                onChange={(e) => updateProvaField(cargo.id, prova.id, 'peso', e.target.value)}
                                              />
                                            </td>

                                            {/* COMPOSICAO Textarea */}
                                            <td className="py-3 px-3 border-r border-gray-100">
                                              <textarea
                                                rows={2}
                                                className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-805 font-sans"
                                                value={prova.composicao}
                                                onChange={(e) => updateProvaField(cargo.id, prova.id, 'composicao', e.target.value)}
                                                placeholder="Composição da prova..."
                                              />
                                            </td>

                                            {/* CRITERIOS DE APROVACAO */}
                                            <td className="py-3 px-3 border-r border-gray-100">
                                              {prova.carater === 'Classificatório' && isTitulos ? (
                                                <div className="text-center text-gray-400 font-mono">-</div>
                                              ) : (
                                                <div className="space-y-2 p-2 bg-gray-50 border border-gray-250 rounded">
                                                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 border-b pb-1 mb-1">Parâmetros de Nota e Cortes</span>
                                                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-500 font-semibold">Nota mínima</label>
                                                      <input
                                                        type="text"
                                                        className="w-full p-1 border border-gray-300 rounded text-xs font-sans bg-white"
                                                        value={prova.notaMinima}
                                                        onChange={(e) => updateProvaField(cargo.id, prova.id, 'notaMinima', e.target.value)}
                                                        placeholder="ex: 6,00 pontos"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-500 font-semibold">Corte Ampla C.</label>
                                                      <input
                                                        type="text"
                                                        className="w-full p-1 border border-gray-300 rounded text-xs font-sans bg-white"
                                                        value={prova.pontoCorteAC}
                                                        onChange={(e) => updateProvaField(cargo.id, prova.id, 'pontoCorteAC', e.target.value)}
                                                        placeholder="ex: 40"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-500">Corte Negros</label>
                                                      <input
                                                        type="text"
                                                        className="w-full p-1 border border-gray-300 rounded text-xs font-sans bg-white"
                                                        value={prova.pontoCorteNegros}
                                                        onChange={(e) => updateProvaField(cargo.id, prova.id, 'pontoCorteNegros', e.target.value)}
                                                        placeholder="ex: 10"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-500">Corte Indígenas</label>
                                                      <input
                                                        type="text"
                                                        className="w-full p-1 border border-gray-300 rounded text-xs font-sans bg-white"
                                                        value={prova.pontoCorteIndigenas}
                                                        onChange={(e) => updateProvaField(cargo.id, prova.id, 'pontoCorteIndigenas', e.target.value)}
                                                        placeholder="ex: 5"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-500">Corte Quilombolas</label>
                                                      <input
                                                        type="text"
                                                        className="w-full p-1 border border-gray-300 rounded text-xs font-sans bg-white"
                                                        value={prova.pontoCorteQuilombolas}
                                                        onChange={(e) => updateProvaField(cargo.id, prova.id, 'pontoCorteQuilombolas', e.target.value)}
                                                        placeholder="ex: 5"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9.5px] text-gray-400 font-extrabold uppercase">Corte PcD</label>
                                                      <input
                                                        type="text"
                                                        disabled
                                                        className="w-full p-1 border border-gray-200 rounded text-[10px] text-gray-500 bg-gray-150 font-sans"
                                                        value={prova.pcdTexto || "todos os candidatos aprovados na Prova Escrita"}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </td>

                                            {/* REMOVE custom trial */}
                                            <td className="py-3 px-2 text-center">
                                              {isEscrita || isTitulos ? (
                                                <span className="text-gray-300 text-xs">-</span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveProva(cargo.id, prova.id)}
                                                  className="p-1 text-gray-400 hover:text-red-650 hover:bg-gray-105 rounded transition-all cursor-pointer"
                                                  title="Remover prova"
                                                >
                                                  <i className="ti ti-trash text-sm"></i>
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* Sub-section B: CONTEÚDO DA PROVA ESCRITA */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-900 block uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                                <i className="ti ti-file-text text-[#2563eb] text-sm"></i>
                                b) CONTEÚDO DA PROVA ESCRITA
                              </label>
                              <textarea
                                rows={5}
                                className="w-full p-3 border border-gray-300 rounded-lg text-xs font-sans leading-relaxed bg-white text-gray-805"
                                placeholder={"Digite cada tópico em uma linha. Ex:\n- Avaliação da eficácia das estratégias de segurança técnica\n- Configuração de ambientes e controles de segurança em nuvem"}
                                value={cargo.conteudoEscrita ?? ''}
                                onChange={(e) => updateCargoCriteriosField(cargo.id, 'conteudoEscrita', e.target.value)}
                              />
                              <p className="text-[11px] text-gray-400 font-sans italic mt-1 bg-gray-50 p-2 border border-gray-200 rounded">
                                * Instrução: Cada linha será exibida com bullet point (•) no documento final.
                              </p>
                            </div>

                            {/* Sub-section C: CONTEÚDO DA PROVA DE TÍTULOS */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b pb-2">
                                <label className="text-xs font-bold text-gray-900 block uppercase tracking-wider flex items-center gap-1.5">
                                  <i className="ti ti-certificate text-[#2563eb] text-sm"></i>
                                  c) CONTEÚDO DA PROVA DE TÍTULOS
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddTitulo(cargo.id)}
                                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                >
                                  <i className="ti ti-plus font-bold"></i>
                                  Adicionar Item
                                </button>
                              </div>

                              <div className="border border-gray-250 rounded-lg overflow-hidden bg-white">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-250 text-gray-900 font-bold uppercase text-[10px]">
                                        <th className="py-2.5 px-3 w-16 border-r border-gray-200 text-center">Nº ITEM</th>
                                        <th className="py-2.5 px-4 border-r border-gray-200 w-1/2">TÍTULOS</th>
                                        <th className="py-2.5 px-3 border-r border-gray-200 text-center w-32">PONTUAÇÃO</th>
                                        <th className="py-2.5 px-3 border-r border-gray-200 text-center w-32">VALOR MÁXIMO</th>
                                        <th className="py-2.5 px-2 text-center w-12">REMOVER</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {titulosItems.map((tit) => {
                                        return (
                                          <tr key={tit.id} className="align-middle">
                                            {/* Numero/Sub-item */}
                                            <td className="py-2 px-3 border-r border-gray-100 text-center">
                                              <input
                                                type="text"
                                                className="w-12 p-1.5 border border-gray-300 rounded text-center text-xs font-mono font-bold bg-white"
                                                value={tit.numero}
                                                onChange={(e) => updateTituloField(cargo.id, tit.id, 'numero', e.target.value)}
                                                placeholder="ex: 1.1"
                                              />
                                            </td>

                                            {/* Titulo text */}
                                            <td className="py-2 px-4 border-r border-gray-100">
                                              <input
                                                type="text"
                                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-sans font-medium bg-white"
                                                value={tit.titulo}
                                                onChange={(e) => updateTituloField(cargo.id, tit.id, 'titulo', e.target.value)}
                                                placeholder="Descrição do título..."
                                              />
                                            </td>

                                            {/* Pontuação */}
                                            <td className="py-2 px-3 border-r border-gray-100 text-center">
                                              <input
                                                type="text"
                                                className="w-24 p-1.5 border border-gray-300 rounded text-center text-xs font-sans bg-white"
                                                value={tit.pontuacao}
                                                onChange={(e) => updateTituloField(cargo.id, tit.id, 'pontuacao', e.target.value)}
                                                placeholder="ex: 1,00 ponto"
                                              />
                                            </td>

                                            {/* Valor Máximo */}
                                            <td className="py-2 px-3 border-r border-gray-100 text-center">
                                              <input
                                                type="text"
                                                className="w-24 p-1.5 border border-gray-300 rounded text-center text-xs font-sans bg-white"
                                                value={tit.valorMaximo}
                                                onChange={(e) => updateTituloField(cargo.id, tit.id, 'valorMaximo', e.target.value)}
                                                placeholder="ex: 2,00 pontos"
                                              />
                                            </td>

                                            {/* Remove button */}
                                            <td className="py-2 px-2 text-center">
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveTitulo(cargo.id, tit.id)}
                                                className="p-1 text-gray-400 hover:text-red-650 hover:bg-gray-100 rounded transition-all cursor-pointer"
                                                title="Remover item de título"
                                              >
                                                <i className="ti ti-trash text-sm"></i>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <p className="text-[10.5px] text-gray-500 font-sans leading-relaxed italic bg-gray-50 p-3 rounded border border-gray-200">
                                <strong>Nota reguladora da titulação:</strong><br />
                                "(*) Para comprovação da experiência profissional, o candidato deverá apresentar declaração da empresa constando o nome do cargo, função, atividades, além do período trabalhado, conforme subitem 7.16.8, alínea k do Edital."
                              </p>
                            </div>

                            {/* Sub-section D: REFERÊNCIAS RECOMENDADAS */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-900 block uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                                <i className="ti ti-books text-[#2563eb] text-sm"></i>
                                d) REFERÊNCIAS RECOMENDADAS
                              </label>
                              <textarea
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg text-xs font-sans leading-relaxed bg-white text-gray-850"
                                placeholder="Digite uma referência bibliográfica por linha."
                              value={cargo.referencias ?? ''}
                              onChange={(e) => updateCargoCriteriosField(cargo.id, 'referencias', e.target.value)}
                            />
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {wizardStep === 7 && (
            <div className="space-y-6">
              {/* Review Header Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#2563eb] p-4 rounded-r-lg">
                <h3 className="font-bold text-blue-900 text-sm">Etapa 7 - Revisão e Geração Final</h3>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Revise minuciosamente todas as seções informativas do Edital oficial. Você poderá voltar instantaneamente para qualquer etapa correspondente clicando em "Editar" para correções precisas.
                </p>
              </div>

              {/* Collapsible Sections Container */}
              <div className="space-y-4">
                
                {/* 1. SEÇÃO IDENTIFICAÇÃO */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, identificacao: !prev.identificacao }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.identificacao ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Identificação"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.identificacao && (
                    <div className="p-4 text-xs space-y-3 bg-white" id="review-identificacao-content">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Número do Edital</span>
                          <strong className="text-gray-800 font-mono text-xs">{editalDraft.numero || 'Não preenchido'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Tipo do Processo</span>
                          <strong className="text-gray-800 text-xs">{editalDraft.tipo || 'Não selecionado'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Data de Publicação</span>
                          <strong className="text-gray-800 font-mono text-xs">
                            {editalDraft.dataPublicacao ? new Date(editalDraft.dataPublicacao + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não fornecida'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Instituição Organizadora</span>
                          <strong className="text-gray-800 text-xs">{editalDraft.instituicao || 'Não preenchido'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Instituição Realizadora</span>
                          <strong className="text-gray-800 text-xs">{editalDraft.realizadora || 'Não preenchido'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Cozinha/Regionalidade</span>
                          <strong className="text-gray-800 text-xs">{editalDraft.cidade || 'Porto Alegre'} - {editalDraft.estado || 'RS'}</strong>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 border-t pt-2 mt-1">
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Coordenador Responsável</span>
                          <span className="text-gray-800 text-xs font-bold">{editalDraft.coordenadorNome || 'Não prenchido'}</span>
                          <span className="text-gray-500 text-xs font-medium ml-1">({editalDraft.coordenadorCargo || 'Coordenador Técnico'})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SEÇÃO CARGOS */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, cargos: !prev.cargos }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.cargos ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Cargos"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.cargos && (
                    <div className="p-4 text-xs bg-white" id="review-cargos-content">
                      {editalDraft.cargos.length === 0 ? (
                        <p className="text-gray-400 italic">Nenhum cargo cadastrado no rascunho.</p>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse font-sans bg-white">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 tracking-wider font-bold">
                                <th scope="col" className="py-2.5 px-3 w-16 text-center">PS</th>
                                <th scope="col" className="py-2.5 px-3">Cargo / Função</th>
                                <th scope="col" className="py-2.5 px-3 text-center">Nível</th>
                                <th scope="col" className="py-2.5 px-3 text-right">Carga Horária</th>
                                <th scope="col" className="py-2.5 px-3 text-right">Salário</th>
                                <th scope="col" className="py-2.5 px-3 text-center">Vagas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 text-gray-700">
                              {editalDraft.cargos.map((cg, i) => (
                                <tr key={cg.id || i} className="hover:bg-gray-55/40">
                                  <td className="py-2 px-3 text-center font-mono font-bold text-blue-600">{cg.numeroProcesso || `PS 0${i+1}`}</td>
                                  <td className="py-2 px-3 font-semibold text-gray-900">{cg.nome || 'Não definido'}</td>
                                  <td className="py-2 px-3 text-center">{cg.nivel}</td>
                                  <td className="py-2 px-3 text-right font-mono text-[11px]">{cg.cargaHoraria}</td>
                                  <td className="py-2 px-3 text-right font-mono text-[11px] font-bold text-gray-900">{cg.salario} <span className="text-[10px] text-gray-400 font-normal">{cg.salarioTipo}</span></td>
                                  <td className="py-2 px-3 text-center font-mono text-[11px] font-extrabold bg-blue-50/20">{cg.vagas || 'C.R.'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. SEÇÃO BENEFÍCIOS */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, beneficios: !prev.beneficios }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.beneficios ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Benefícios"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.beneficios && (
                    <div className="p-4 text-xs space-y-3 bg-white" id="review-beneficios-content">
                      <div>
                        <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider mb-2">Marcados</span>
                        <div className="flex flex-wrap gap-1.5">
                          {editalDraft.beneficiosSelecionados && editalDraft.beneficiosSelecionados.length > 0 ? (
                            editalDraft.beneficiosSelecionados.map((ben, i) => (
                              <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold px-2.5 py-1 rounded-md text-[10.5px]">
                                <i className="ti ti-checklist mr-1 font-bold"></i> {ben}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Nenhum benefício padrão assinalado.</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider mb-1.5">Texto Consolidado (Versão p/ Edital)</span>
                        <p className="p-3 bg-gray-50 border border-gray-200 rounded-lg leading-relaxed text-gray-700 italic">
                          {editalDraft.beneficiosTextoCustomizado || 'Nenhum benefício configurado para exibição.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. SEÇÃO CRONOGRAMA */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, cronograma: !prev.cronograma }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.cronograma ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Cronograma"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.cronograma && (
                    <div className="p-4 text-xs bg-white" id="review-cronograma-content">
                      {!editalDraft.cronogramaEventos || editalDraft.cronogramaEventos.length === 0 ? (
                        <p className="text-gray-400 italic">Nenhum evento registrado no cronograma.</p>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse font-sans bg-white">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 tracking-wider font-bold">
                                <th scope="col" className="py-2.5 px-4 w-36">Previsão / Data</th>
                                <th scope="col" className="py-2.5 px-4">Evento / Atividade Formal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-150 text-gray-700">
                              {editalDraft.cronogramaEventos.map((ev) => (
                                <tr key={ev.id} className="hover:bg-gray-55/30">
                                  <td className="py-2 px-4 font-mono font-bold text-blue-600">
                                    {ev.data === '*' || !ev.data ? '*' : new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="py-2 px-4 font-medium">{ev.evento || 'Evento sem descrição'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. SEÇÃO INSCRIÇÃO */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, inscricao: !prev.inscricao }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.inscricao ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Inscrição"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(5)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.inscricao && (
                    <div className="p-4 text-xs bg-white text-gray-700" id="review-inscricao-content">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">URL do Portal de Inscrições</span>
                          <a href={editalDraft.urlInscricoes} className="text-blue-600 hover:underline font-bold font-mono truncate block" target="_blank" rel="noopener noreferrer">
                            {editalDraft.urlInscricoes}
                          </a>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Taxa de Inscrição (NS/NM)</span>
                          <strong className="text-gray-800 font-mono text-xs">{editalDraft.taxaSuperior} / {editalDraft.taxaMedio}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">E-mail para Envio de Laudos</span>
                          <strong className="text-gray-800 font-mono text-xs break-all">{editalDraft.emailDocumentos}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Data Limite de Pagamento</span>
                          <strong className="text-gray-800 font-mono text-xs">
                            {editalDraft.dataLimitePagamento ? new Date(editalDraft.dataLimitePagamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'A Definir'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Isenção de Taxa (Doador/CadUnico)</span>
                          <strong className="text-gray-800 font-medium text-xs">
                            {editalDraft.permiteIsencao ? `Ativo (Até ${editalDraft.dataLimiteIsencao ? new Date(editalDraft.dataLimiteIsencao + 'T12:00:00').toLocaleDateString('pt-BR') : 'A Definir'})` : 'Desativado'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block uppercase text-[9px] tracking-wider">Políticas Inclusivas / EC103</span>
                          <span className="text-gray-850 font-bold block">
                            Social: {editalDraft.permiteNomeSocial ? 'Sim' : 'Não'} | Veda Aposentado: {editalDraft.vedaAposentadoEC103 ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. SEÇÃO CRITÉRIOS */}
                <div className="border border-gray-250 rounded-lg bg-white overflow-hidden shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCollapsedReview(prev => ({ ...prev, criterios: !prev.criterios }))}
                      className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-blue-600 transition-all cursor-pointer select-none"
                    >
                      <i className={`ti ${collapsedReview.criterios ? 'ti-chevron-right' : 'ti-chevron-down'} text-gray-500 text-base`}></i>
                      <span>Seção "Critérios de Seleção"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(6)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <i className="ti ti-edit"></i> Editar
                    </button>
                  </div>
                  {!collapsedReview.criterios && (
                    <div className="p-4 text-xs space-y-4 bg-white" id="review-criterios-content">
                      {editalDraft.cargos.length === 0 ? (
                        <p className="text-gray-400 italic">Cadastre primeiro cargos no processo.</p>
                      ) : (
                        editalDraft.cargos.map((cg, i) => (
                          <div key={cg.id || i} className="border border-gray-150 p-3.5 rounded-lg bg-gray-50 space-y-2.5">
                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded border border-gray-200">
                              <span className="font-bold text-gray-800 uppercase tracking-wide">{cg.numeroProcesso || `PS 0${i+1}`} - {cg.nome}</span>
                              <span className="text-[10px] bg-blue-105 text-blue-800 border border-blue-200 font-mono font-bold px-2 py-0.5 rounded">Critérios Configurados</span>
                            </div>

                            {/* Provas */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">a) Quadro de Provas Realizadoras</span>
                              {cg.provas && cg.provas.length > 0 ? (
                                <div className="space-y-1">
                                  {cg.provas.map((pv, pIdx) => (
                                    <div key={pv.id || pIdx} className="bg-white p-2 rounded border border-gray-200 text-gray-700 leading-relaxed font-sans text-[11px]">
                                      <div className="flex justify-between font-bold">
                                        <span>PROVA {pv.nome} ({pv.carater})</span>
                                        <span className="text-blue-600 font-mono">Peso: {pv.peso}</span>
                                      </div>
                                      <div className="mt-0.5 text-gray-550">
                                        Nota Mínima: <span className="font-semibold">{pv.notaMinima || 'Não definida'}</span> | PCD Texto: <span className="italic">{pv.pcdTexto}</span>
                                      </div>
                                      {pv.composicao && <div className="text-[10px] text-gray-500 mt-1 italic">Estrutura: {pv.composicao}</div>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic text-[11px]">Sem provas registradas.</p>
                              )}
                            </div>

                            {/* Titulos */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">b) Títulos e Avaliação da Experiência Profissional</span>
                              {cg.titulosItems && cg.titulosItems.length > 0 ? (
                                <div className="bg-white rounded-md border border-gray-200 overflow-hidden text-[10.5px]">
                                  <div className="bg-gray-100 p-1.5 font-bold text-gray-700 flex justify-between border-b">
                                    <span>Item / Descritivo do Título</span>
                                    <span className="font-mono">Unidade / Pontuação Máxima</span>
                                  </div>
                                  {cg.titulosItems.map((tit, tIdx) => (
                                    <div key={tit.id || tIdx} className="p-1.5 flex justify-between border-b last:border-b-0 hover:bg-gray-50">
                                      <span className="font-medium text-gray-700"><span className="font-mono font-bold text-blue-600 mr-1.5">{tit.numero}</span> {tit.titulo}</span>
                                      <span className="font-mono text-gray-600 font-semibold">{tit.pontuacao} (Máx: {tit.valorMaximo})</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic text-[11px]">Sem itens de títulos cadastrados.</p>
                              )}
                            </div>

                            {/* Bibliografia / Referencias */}
                            {cg.referencias && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">c) Bibliografia / Referências recomendadas</span>
                                <p className="p-2 bg-white text-gray-650 rounded border border-gray-200 leading-relaxed font-mono text-[9.5px] whitespace-pre-line max-h-24 overflow-y-auto">
                                  {cg.referencias}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Warning notice before publishing in highlighted yellow (amber) */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-amber-800 text-xs font-semibold leading-relaxed shadow-xs" id="review-warning-message">
                <div className="flex gap-2 items-start">
                  <i className="ti ti-alert-triangle text-amber-600 text-base mt-0.5"></i>
                  <span>
                     Revise todas as informações antes de publicar. Após a publicação, alterações ficam registradas nas Trilhas de Auditoria.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer controls for wizard */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-white gap-4" id="wizard-footer">
            {/* Left side: Previous step button */}
            <button
              id="btn-wizard-anterior"
              type="button"
              onClick={handlePrevStep}
              disabled={wizardStep === 1}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                wizardStep === 1
                  ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-700 border-gray-350 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Anterior
            </button>

            {/* Middle Display: Step display */}
            <span className="text-[10px] sm:text-xs font-bold text-gray-400">
              Etapa {wizardStep} de 7
            </span>

            {/* Right side: Next Step OR the 3 Action buttons for step 7 footer */}
            {wizardStep < 7 ? (
              <button
                id="btn-wizard-proxima"
                type="button"
                onClick={handleNextStep}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                Próxima step
                <i className="ti ti-chevron-right font-extrabold text-sm"></i>
              </button>
            ) : (
              <div className="flex flex-wrap gap-2.5 justify-end">
                {/* 1. Salvar Rascunho */}
                <button
                  id="btn-save-draft"
                  type="button"
                  onClick={handleSaveDraft}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  title="Salvar como rascunho"
                >
                  <i className="ti ti-archive text-sm"></i>
                  Salvar Rascunho
                </button>

                {/* 2. Gerar Documento */}
                <button
                  id="btn-generate-doc"
                  type="button"
                  onClick={handleGenerateDocument}
                  className="bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700 px-4 py-2.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  title="Visualizar documento gerado"
                >
                  <i className="ti ti-file-text text-sm"></i>
                  Gerar Documento
                </button>

                {/* 3. Publicar Edital */}
                <button
                  id="btn-wizard-publicar"
                  type="button"
                  onClick={handlePublishEdital}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Publicar edital em definitivo"
                >
                  Publicar Edital
                  <i className="ti ti-send font-black text-sm"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VISTA 3: VISUALIZADOR DE DOCUMENTO OFICIAL HCPA ----------------- */}
      {activeView === 'document' && selectedEdital && (
        <div className="bg-white p-3 sm:p-6 md:p-10 rounded-xl border border-gray-200 shadow-lg w-full max-w-4xl mx-auto space-y-6 text-black font-sans">
          
          {/* Internal Top Control block for back action, styled with pristine simplicity */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-gray-200">
            <button
              id="btn-retornar"
              onClick={() => setActiveView('list')}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <i className="ti ti-arrow-left text-sm font-bold"></i>
              Voltar ao Diretório
            </button>

            {/* Accessibility Controls */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200" id="reading-accessibility-panel">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 flex items-center gap-1">
                <i className="ti ti-accessibility text-base text-blue-600"></i>
                <span>Acessibilidade:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Diminuir texto"
                  onClick={() => setFontScale(prev => Math.max(0.85, Number((prev - 0.1).toFixed(2))))}
                  disabled={fontScale <= 0.85}
                  className="bg-white border select-none border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-2 py-1 rounded text-xs font-bold h-7 w-8 flex items-center justify-center cursor-pointer"
                >
                  A-
                </button>
                <button
                  type="button"
                  title="Tamanho padrão"
                  onClick={() => setFontScale(1.0)}
                  className={`border px-2.5 py-1 rounded text-xs font-bold h-7 flex items-center justify-center cursor-pointer select-none ${fontScale === 1.0 ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  title="Aumentar texto"
                  onClick={() => setFontScale(prev => Math.min(1.45, Number((prev + 0.1).toFixed(2))))}
                  disabled={fontScale >= 1.45}
                  className="bg-white border select-none border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-2 py-1 rounded text-xs font-bold h-7 w-8 flex items-center justify-center cursor-pointer"
                >
                  A+
                </button>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <i className="ti ti-printer text-sm"></i>
              Imprimir Documento
            </button>
          </div>

          {/* Dynamic Style injection for Reading Accessibility font sizes */}
          <style dangerouslySetInnerHTML={{ __html: `
            #edital-document-paper {
              font-size: ${fontScale}rem !important;
            }
            #edital-document-paper .text-xs, 
            #edital-document-paper .text-\\[12px\\] {
              font-size: calc(12px * ${fontScale}) !important;
            }
            #edital-document-paper .text-\\[11px\\] {
              font-size: calc(11px * ${fontScale}) !important;
            }
            #edital-document-paper .text-\\[10px\\] {
              font-size: calc(10px * ${fontScale}) !important;
            }
            #edital-document-paper .text-\\[9\\.5px\\] {
              font-size: calc(9.5px * ${fontScale}) !important;
            }
            #edital-document-paper .text-\\[9px\\] {
              font-size: calc(9px * ${fontScale}) !important;
            }
            #edital-document-paper .text-sm {
              font-size: calc(14px * ${fontScale}) !important;
            }
            #edital-document-paper .text-md {
              font-size: calc(16px * ${fontScale}) !important;
            }
            #edital-document-paper .text-lg {
              font-size: calc(18px * ${fontScale}) !important;
            }
          ` }} />

          {/* REAL HCPA 01/2026 DOCUMENT BODY */}
          <div id="edital-document-paper" className="bg-[#fcfbf9] w-full p-4 sm:p-8 md:p-12 border border-[#d4cbbe] rounded font-serif text-gray-900 leading-relaxed max-w-3xl mx-auto space-y-6 select-text text-justify relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_10px_20px_rgba(0,0,0,0.05),_0_20px_40px_rgba(0,0,0,0.05),_5px_5px_0px_#f2ede4,_10px_10px_0px_#ebd9c8]">
            
            {/* Crop/Trim marks for print layout */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#c0b5a3] opacity-60"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#c0b5a3] opacity-60"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#c0b5a3] opacity-60"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#c0b5a3] opacity-60"></div>

            {/* Official Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
              <div className="text-[#a89d8c] opacity-[0.035] text-4xl font-sans font-black tracking-[0.2em] uppercase select-none pointer-events-none -rotate-45 whitespace-nowrap">
                DOCUMENTO PRELIMINAR - SELEÇÃO HCPA
              </div>
            </div>

            {/* Double Rule Header Details */}
            <div className="border-t-4 border-double border-black/85 pt-1"></div>

            {/* HCPA Header */}
            <div className="text-center font-sans space-y-1.5 border-b-2 border-black pb-4 text-black relative z-10">
              <h2 className="text-lg font-extrabold tracking-tight">HOSPITAL DE CLÍNICAS DE PORTO ALEGRE</h2>
              <h3 className="text-sm font-bold tracking-tight">PROCESSO SELETIVO PÚBLICO</h3>
              <p className="text-[11px] font-semibold text-gray-600">COMISSÃO DE SELEÇÃO E DESENVOLVIMENTO DE PESSOAL</p>
              <p className="text-[10px] font-mono tracking-wider">EDITAL Nº {selectedEdital.numero || '01/2026'}</p>
            </div>

            {/* Document Intro / Preâmbulo */}
            <div className="space-y-4 text-xs">
              <div className="text-center font-bold text-sm uppercase">
                {selectedEdital.tipo === 'CONCURSO PÚBLICO' ? 'CONCURSO PÚBLICO' : 'PROCESSO SELETIVO PÚBLICO'} Nº {selectedEdital.numero || '01/2026'}
              </div>

              <p className="indent-8 text-[12px] leading-relaxed">
                O Coordenador da Comissão de Seleção do <strong>HOSPITAL DE CLÍNICAS DE PORTO ALEGRE (HCPA)</strong>, no uso de suas atribuições
                legais, torna pública a realização de Processo Seletivo Público, sob a execução técnico-administrativa da
                <strong> {(selectedEdital as any).realizadora || 'FAURGS'}</strong>, destinado ao provimento de cadastro reserva e provimento direto para atuação em suas unidades
                nos termos previstos na legislação vigente e nas instruções contidas neste Edital e Regulamentos anexos.
              </p>

              {/* 1. DAS OCUPAÇÕES */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-sm border-b border-black pb-1 uppercase">1. DAS OCUPAÇÕES E FUNÇÕES DE TRABALHO</h4>
                <p className="text-[11px] leading-relaxed">
                  1.1 Os cargos afetos a este edital, bem como os requisitos de graduação, jornada semanal de trabalho e o vencimento inicial admissional são apresentados de forma consolidada no quadro abaixo:
                </p>

                {/* HCPA TABLE PREVIEW */}
                <div className="overflow-x-auto border border-black my-4 scrollbar-thin">
                  <table className="min-w-[650px] md:w-full text-left text-[11px] border-collapse text-black bg-white">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black font-sans font-bold">
                        <th className="py-2 px-2 border-r border-black text-center text-[10px]">PS</th>
                        <th className="py-2 px-3 border-r border-black">OCUPAÇÃO / FUNÇÃO (Requisitos de Registro)</th>
                        <th className="py-2 px-2 border-r border-black text-center">CARGA HORÁRIA</th>
                        <th className="py-2 px-2 border-r border-black text-right">SALÁRIO DE ENTRADA</th>
                        <th className="py-2 px-2 text-center">VAGAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/80 font-serif">
                      {selectedEdital.cargos && selectedEdital.cargos.length > 0 ? (
                        selectedEdital.cargos.map((cg: any, idx: number) => {
                          const numPS = cg.numeroProcesso || `PS 0${idx + 1}`;
                          const ch = cg.cargaHorariaStr || `${cg.cargaHoraria} horas/mês`;
                          const sal = cg.salarioStr || cg.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                          return (
                            <tr key={cg.id || idx} className="align-top">
                              <td className="py-2 px-2 border-r border-black text-center font-mono font-bold text-[10px]">{numPS}</td>
                              <td className="py-2 px-3 border-r border-black space-y-1">
                                <div className="font-bold font-sans text-[11px]">{cg.nome}</div>
                                <div className="text-[9px] uppercase font-bold text-gray-500 font-sans tracking-wide">Grau {cg.nivel}</div>
                                <p className="text-[10px] italic text-gray-800 leading-relaxed font-sans">{cg.preRequisito || 'Sem restrição.'}</p>
                                <p className="text-[9.5px] text-gray-600 font-sans leading-relaxed">{cg.descricaoSumaria || ''}</p>
                              </td>
                              <td className="py-2 px-2 border-r border-black text-center font-sans">{ch}</td>
                              <td className="py-2 px-2 border-r border-black text-right font-sans font-bold">{sal}</td>
                              <td className="py-2 px-2 text-center font-sans font-bold">{cg.vagasStr || cg.vagasAC || 'C.R.'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center font-sans text-gray-500">Nenhum cargo ativo.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 p-2 text-[9px] text-gray-700 leading-relaxed italic border-t border-black font-sans">
                    * Valor inicial de classe. C.R. = Cadastro de Reserva. Os candidatos aprovados
                    formarão um Cadastro de Reserva cuja contratação estará condicionada à
                    existência e/ou criação de vagas no prazo de validade do Processo Seletivo.
                  </div>
                </div>
              </div>

              {/* 2. DOS BENEFÍCIOS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[12px] border-b border-black pb-1 uppercase">2. DOS BENEFÍCIOS OFERECIDOS</h4>
                <p className="text-[11px] leading-relaxed indent-8">
                  2.1 {selectedEdital.beneficiosDetalhes || (selectedEdital as any).beneficiosTextoCustomizado || 'Os principais benefícios, opcionais, oferecidos são: Plano de previdência complementar, Seguro de vida em grupo, Vale-alimentação, Refeitório, Creche, Estacionamento, Academia de ginástica.'}
                </p>
              </div>

              {/* 3. DO CRONOGRAMA DE EVENTOS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[12px] border-b border-black pb-1 uppercase">3. DO CRONOGRAMA DE EVENTOS</h4>
                <p className="text-[11px] leading-relaxed">
                  3.1 O cronograma de eventos básicos, prazos de homologação e interposição de recursos administrativos obedecerá aos termos descritos no quadro que segue:
                </p>

                <div className="overflow-x-auto border border-black my-3 scrollbar-thin">
                  <table className="min-w-[600px] md:w-full text-left text-[11px] border-collapse bg-white text-black font-sans">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black font-bold">
                        <th className="py-2 px-3 border-r border-black text-center w-12">ITEM</th>
                        <th className="py-2 px-4 border-r border-black w-40">DATA PREVISTA</th>
                        <th className="py-2 px-4">EVENTO / ETAPA DO PROCESSO SELETIVO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-medium text-gray-800 text-[10.5px]">
                      {((selectedEdital as any).cronogramaEventos || [
                        { data: '2026-06-10', evento: 'Período para realização de inscrições, exclusivamente pela internet' },
                        { data: '2026-06-11', evento: 'Período para solicitação de Atendimento Especial para realização da Prova Escrita' },
                        { data: '2026-06-12', evento: 'Período para solicitação de isenção da Taxa de Inscrição' },
                        { data: '2026-06-15', evento: 'Divulgação do resultado da solicitação de isenção da Taxa de Inscrição' },
                        { data: '2026-06-17', evento: 'Período de recursos quanto ao resultado da solicitação de isenção' },
                        { data: '2026-06-19', evento: 'Divulgação do resultado dos recursos da solicitação de isenção' },
                        { data: '2026-06-22', evento: 'Último dia para pagamento da Taxa de Inscrição' },
                        { data: '2026-06-25', evento: 'Divulgação da Banca Examinadora e da Relação Preliminar das Inscrições Homologadas' },
                        { data: '2026-06-26', evento: 'Período de recursos quanto à Banca Examinadora e Homologação Preliminar' },
                        { data: '2026-06-30', evento: 'Divulgação dos locais de provas e resultado dos recursos' },
                        { data: '*', evento: 'Data da Aplicação da Prova Escrita (A definir)' },
                        { data: '*', evento: 'Divulgação dos gabaritos preliminares da Prova Escrita (A definir)' },
                        { data: '*', evento: 'Período de recursos quanto aos gabaritos preliminares (A definir)' },
                        { data: '*', evento: 'Divulgação do resultado preliminar da Prova Escrita (A definir)' },
                        { data: '*', evento: 'Divulgação da classificação final (A definir)' }
                      ]).map((ev: any, idx: number) => {
                        const dataText = ev.data === '*' || !ev.data ? 'A definir (*)' : new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR');
                        return (
                          <tr key={idx} className="align-middle">
                            <td className="py-2 px-3 border-r border-black text-center font-bold font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2 px-4 border-r border-black font-mono">{dataText}</td>
                            <td className="py-2 px-4 font-sans">{ev.evento}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 p-2 text-[9px] text-gray-700 leading-relaxed italic border-t border-black font-sans">
                    (*) A definir. Todas as divulgações são disponibilizadas no site da FAURGS,{' '}
                    <span className="font-bold underline text-blue-600">{selectedEdital.urlInscricoes || (selectedEdital as any).urlInscricoes || 'http://portalfaurgs.com.br/concursos'}</span>
                    , após as 17h.
                  </div>
                </div>
              </div>

              {/* 4. DA INSCRIÇÃO E TAXAS DE INSCRIÇÃO */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[12px] border-b border-black pb-1 uppercase">4. DA INSCRIÇÃO E TAXAS DE INSCRIÇÃO</h4>
                <p className="text-[11px] leading-relaxed indent-8">
                  4.1 As inscrições serão realizadas exclusivamente via Internet, através do portal oficial de concursos no endereço eletrônico{' '}
                  <strong className="underline">{(selectedEdital as any).urlInscricoes || 'http://portalfaurgs.com.br/concursos'}</strong>.
                </p>
                <p className="text-[11px] leading-relaxed indent-8">
                  4.2 O valor recolhido para a taxa de participação será de{' '}
                  <strong>{(selectedEdital as any).taxaSuperior || 'R$ 140,00'}</strong> para os cargos de Nível Superior e{' '}
                  <strong>{(selectedEdital as any).taxaMedio || 'R$ 82,80'}</strong> para os cargos com Escolaridade de Nível Médio, devendo ser quitados até a data de{' '}
                  <strong>{(selectedEdital as any).dataLimitePagamento ? new Date((selectedEdital as any).dataLimitePagamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}</strong>.
                </p>
                
                {((selectedEdital as any).permiteIsencao ?? true) && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] leading-relaxed indent-8">
                      4.3 <strong>Dos Pedidos de Isenção de Taxa:</strong> Os candidatos amparados por legislação federal que comprovem baixa renda ou doação de medula óssea poderão solicitar isenção da taxa respectiva até a data de{' '}
                      <strong>{(selectedEdital as any).dataLimiteIsencao ? new Date((selectedEdital as any).dataLimiteIsencao + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}</strong>, obedecendo às seguintes condições:
                    </p>
                    <div className="pl-6 space-y-1.5 text-[10.5px] italic text-gray-800 leading-relaxed font-sans">
                      <p>
                        a) <strong>CadÚnico:</strong> {(selectedEdital as any).textoCadUnico || 'Estarão isentos de pagamento da taxa de inscrição os candidatos que estiverem inscritos no Cadastro Único para Programas Sociais do Governo Federal (CadÚnico) e forem membros de família de baixa renda, nos termos do Decreto nº 11.016/2022.'}
                      </p>
                      <p>
                        b) <strong>Doadores de Medula:</strong> {(selectedEdital as any).textoDoadoresMedula || 'Estarão isentos do pagamento da taxa de inscrição os candidatos doadores de medula óssea em entidades reconhecidas pelo Ministério da Saúde, nos termos da Lei nº 13.656/2018.'}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-[11px] leading-relaxed indent-8">
                  4.4 <strong>Nome Social:</strong> {((selectedEdital as any).permiteNomeSocial ?? true) ? 'Fica assegurado aos candidatos transgênero e travestis o direito à identificação pelo nome social correspondente com sua identidade de gênero durante todas as etapas do processo seletivo público.' : 'Não haverá procedimentos simplificados de emissão de nome social no ato de inscrição.'}
                </p>

                <p className="text-[11px] leading-relaxed indent-8">
                  4.5 <strong>Vedações Regimentais:</strong> {((selectedEdital as any).vedaAposentadoEC103 ?? true) ? 'Em conformidade com a Emenda Constitucional nº 103 de 2019 (EC 103/2019), é terminantemente vedada a admissão e provimento de emprego público para ex-empregado aposentado com utilização de tempo de contribuição do cargo correspondente.' : 'Não constam vedações adicionais sobre ingresso ou reingresso de aposentados para este certame.'}
                </p>

                <p className="text-[11px] leading-relaxed indent-8 font-sans">
                  4.6 Para fins de dirimir dúvidas institucionais ou envio formal de documentações, os candidatos disporão do endereço corporativo{' '}
                  <strong>{(selectedEdital as any).emailDocumentos || 'concursos.documentos@faurgs.com.br'}</strong>, com provas escritas aplicadas presencialmente em{' '}
                  <strong>{(selectedEdital as any).cidadeProvas || selectedEdital.cidade || 'Porto Alegre, RS'}</strong> sob duração padrão de{' '}
                  <strong>{(selectedEdital as any).duracaoProva || '3 horas'}</strong>.
                </p>
              </div>

              {/* 5. DOS CRITÉRIOS DE SELEÇÃO E PROVAS POR CARGO */}
              <div className="space-y-4 pt-4 border-t border-black/20">
                <h4 className="font-bold text-[12px] border-b border-black pb-1 uppercase">5. DOS CRITÉRIOS DE SELEÇÃO E PROVAS POR CARGO</h4>
                
                {selectedEdital.cargos && selectedEdital.cargos.length > 0 ? (
                  selectedEdital.cargos.map((cg: any, idx: number) => {
                    const numPS = cg.numeroProcesso || `PS 0${idx + 1}`;
                    const provas = cg.provas || [];
                    const tItems = cg.titulosItems || [];
                    const conteudoEscrita = cg.conteudoEscrita || '';
                    const referencias = cg.referencias || '';

                    return (
                      <div key={cg.id || idx} className="space-y-4 pt-2 break-inside-avoid">
                        <div className="font-bold text-xs uppercase bg-gray-100 p-2 border border-black font-sans">
                          {numPS} - {cg.nome} ({cg.nivel})
                        </div>

                        {/* a) Tabela de Provas do Cargo */}
                        <div className="space-y-1.5 pl-4">
                          <strong className="text-[11px] block">a) Do Esquema de Provas e Critérios:</strong>
                          {provas.length > 0 ? (
                            <div className="overflow-x-auto border border-black my-2 scrollbar-thin">
                              <table className="min-w-[650px] md:w-full text-left text-[10px] border-collapse bg-white text-black font-sans">
                                <thead>
                                  <tr className="bg-gray-105 border-b border-black font-bold">
                                    <th className="py-2 px-2 border-r border-black w-24">PROVA</th>
                                    <th className="py-2 px-2 border-r border-black w-28 text-center">CARÁTER</th>
                                    <th className="py-2 px-2 border-r border-black text-center w-12">PESO</th>
                                    <th className="py-2 px-3 border-r border-black">COMPOSIÇÃO</th>
                                    <th className="py-2 px-3">CRITÉRIOS E NOTAS MÍNIMAS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/60">
                                  {provas.map((p: any, pIdx: number) => (
                                    <tr key={p.id || pIdx} className="align-top">
                                      <td className="py-2 px-2 border-r border-black font-bold font-mono">{p.nome}</td>
                                      <td className="py-2 px-2 border-r border-black font-sans text-center text-[9.5px]">{p.carater}</td>
                                      <td className="py-2 px-2 border-r border-black text-center font-mono font-bold">{p.peso}</td>
                                      <td className="py-2 px-3 border-r border-black font-sans text-[9.5px] leading-relaxed">{p.composicao}</td>
                                      <td className="py-2 px-3 font-sans text-[9.5px] leading-relaxed">
                                        {p.carater === 'Classificatório' && p.id === 'p-titulos' ? (
                                          <div className="text-gray-500 italic">Pesagem de títulos conforme tabela do subitem 5.{idx+1}.c</div>
                                        ) : (
                                          <div className="space-y-1 text-gray-900 font-sans">
                                            {p.notaMinima && <div>• Nota Mínima: <span className="font-bold">{p.notaMinima}</span></div>}
                                            {(p.pontoCorteAC || p.pontoCorteNegros || p.pontoCorteIndigenas || p.pontoCorteQuilombolas) && (
                                              <div className="text-[9px] bg-gray-50 p-1 rounded border border-gray-200 mt-1 space-y-0.5">
                                                <div className="font-bold uppercase text-[8px] text-gray-500">Limites de Corte Administrativo:</div>
                                                {p.pontoCorteAC && <div>- Ampla Concorrência: <span className="font-bold">{p.pontoCorteAC}</span> aprovados</div>}
                                                {p.pontoCorteNegros && <div>- Negros: <span className="font-bold">{p.pontoCorteNegros}</span> aprovados</div>}
                                                {p.pontoCorteIndigenas && <div>- Indígenas: <span className="font-bold">{p.pontoCorteIndigenas}</span> aprovados</div>}
                                                {p.pontoCorteQuilombolas && <div>- Quilombolas: <span className="font-bold">{p.pontoCorteQuilombolas}</span> aprovados</div>}
                                                <div>- Pessoa com Deficiência (PcD): <span className="font-bold">{p.pcdTexto || 'todos os aprovados'}</span></div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-[10px] italic text-gray-500">Esquema padrão do Edital aplicável de forma subsidiária.</p>
                          )}
                        </div>

                        {/* b) Conteudo Escrito */}
                        <div className="space-y-1.5 pl-4">
                          <strong className="text-[11px] block">b) Do Conteúdo Programático da Prova Escrita Objetiva:</strong>
                          {conteudoEscrita.trim() ? (
                            <ul className="list-disc pl-6 text-[10.5px] space-y-1 leading-relaxed text-gray-800">
                              {conteudoEscrita.split('\n').map((line: string, lIdx: number) => {
                                const clean = line.replace(/^-\s*/, '').replace(/^•\s*/, '').trim();
                                if (!clean) return null;
                                return <li key={lIdx}>{clean}</li>;
                              })}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-gray-500 italic pl-2">Conteúdo programático básico constante nas normas complementares do HCPA.</p>
                          )}
                        </div>

                        {/* c) Tabela de Titulos */}
                        {tItems.length > 0 && (
                          <div className="space-y-1.5 pl-4">
                            <strong className="text-[11px] block">c) Da Tabela de Titulação Acadêmica:</strong>
                             <div className="overflow-x-auto border border-black my-2 scrollbar-thin">
                              <table className="min-w-[500px] md:w-full text-left text-[10px] border-collapse bg-white text-black font-sans font-medium">
                                <thead>
                                  <tr className="bg-gray-100 border-b border-black font-bold">
                                    <th className="py-1 px-2 border-r border-black w-14 text-center">ITEM</th>
                                    <th className="py-1 px-3 border-r border-black font-bold">TÍTULO / COMPROVAÇÃO DE REQUISITOS</th>
                                    <th className="py-1 px-3 border-r border-black text-center w-24">PONTUAÇÃO</th>
                                    <th className="py-1 px-3 text-center w-24">MÁXIMO</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/60">
                                  {tItems.map((tit: any, titIdx: number) => (
                                    <tr key={tit.id || titIdx} className="align-middle">
                                      <td className="py-1.5 px-2 border-r border-black text-center font-mono font-bold text-[9px]">{tit.numero}</td>
                                      <td className="py-1.5 px-3 border-r border-black font-sans text-[9.5px] leading-relaxed">{tit.titulo}</td>
                                      <td className="py-1.5 px-3 border-r border-black text-center font-sans">{tit.pontuacao}</td>
                                      <td className="py-1.5 px-3 text-center font-sans">{tit.valorMaximo}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="bg-gray-50 p-2 text-[8.5px] text-gray-700 leading-relaxed italic border-t border-black font-sans">
                                (*) Para comprovação da experiência profissional, o candidato deverá apresentar declaração da empresa constando o nome do cargo, função, atividades, além do período trabalhado, conforme subitem 7.16.8, alínea k do Edital.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* d) Referencias */}
                        <div className="space-y-1.5 pl-4">
                          <strong className="text-[11px] block">d) Das Referências Recomendadas:</strong>
                          {referencias.trim() ? (
                            <div className="text-[10px] space-y-1 leading-relaxed text-gray-800 font-sans pl-2 border-l-2 border-black/40">
                              {referencias.split('\n').map((line: string, lIdx: number) => {
                                const clean = line.replace(/^-\s*/, '').replace(/^•\s*/, '').trim();
                                if (!clean) return null;
                                return <p key={lIdx}>{clean}</p>;
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 italic pl-2">Referências gerais sugeridas nos manuais de qualificação do HCPA.</p>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-gray-500 italic pl-4">Critérios globais unificados aplicados aos cargos do processo seletivo.</p>
                )}
              </div>

              {/* Encerramento Formal e Assinatura */}
              <div className="pt-8 space-y-6 text-center font-sans">
                <p className="text-right text-[11px]">
                  {selectedEdital.cidade || 'Porto Alegre'}, {selectedEdital.estado || 'RS'}, {selectedEdital.dataPublicacao || new Date().toLocaleDateString('pt-BR')}.
                </p>

                <div className="pt-6 space-y-1">
                  <div className="w-64 border-b border-black mx-auto mb-1"></div>
                  <strong className="text-[12px] block text-gray-901">{(selectedEdital as any).coordenadorNome || 'Prof. Dr. Francisco Silveira'}</strong>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide block">{(selectedEdital as any).coordenadorCargo || 'Coordenador - Comissão de Seleção HCPA'}</span>
                </div>
              </div>

              {/* Digital Authentication Seal & Signature Stamp */}
              <div className="pt-8 mt-6 border-t border-dashed border-[#bdae99] text-center font-sans space-y-2 text-black/80 relative z-10" id="digital-auth-seal">
                <div className="flex flex-col sm:flex-row justify-between items-center text-[9px] text-[#8c7f6b] gap-2">
                  <span className="font-mono">SHA-256 AUTHENTICATION: 9e3f8a41bc72d159be26cbda77340026e632fa5a7114dca215a774c83da0216b</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                     Assinado Digitalmente • SELEÇÃO HCPA 2026
                  </span>
                </div>
                <div className="flex justify-center items-center gap-3 pt-1">
                  <div className="border border-red-200 bg-red-50/40 text-red-700 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase border-double border-4 inline-block transform -rotate-2 select-none" style={{ fontFamily: 'monospace' }}>
                    PROCESSO HOMOLOGADO
                  </div>
                  <span className="text-[8.5px] font-mono text-[#8c7f6b] italic">
                    ID Transação: {selectedEdital.id || '2026-HCPA-01'}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* High Fidelity Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" id="publish-confirm-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-amber-600">
              <i className="ti ti-alert-triangle text-3xl"></i>
              <h3 className="text-lg font-bold text-gray-901">Confirmar Publicação</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Confirma a publicação oficial do <strong>Edital Nº {editalDraft.numero || 'Rascunho'}</strong>?
            </p>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Esta ação publicará as informações em definitivo. Futuras alterações ou correções de erros materiais deverão ser efetuadas via retificação formal e ficarão integralmente registradas nas Trilhas de Auditoria do sistema.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-amber-800 text-[11px] leading-relaxed">
              <strong>Aviso HCPA:</strong> A publicação gera a versionamento permanente do edital. Futuras retificações devem ser anexadas formalmente.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                id="btn-cancel-publish-modal"
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-150 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-publish-modal"
                type="button"
                onClick={() => {
                  const isExisting = editingEditalId !== null;
                  const compiled = compileDraftToEdital('Publicado', editingEditalId);
                  
                  if (isExisting) {
                    setEditais((prev: any[]) => prev.map(e => e.id === editingEditalId ? compiled : e));
                  } else {
                    setEditais((prev: any[]) => [compiled, ...prev]);
                  }

                  logAction(
                    'Publicação de Edital',
                    'Editais',
                    `Edital ${compiled.numero}`,
                    `Edital definitivo com ${compiled.cargos.length} cargos publicado no padrão oficial.`
                  );
                  showToast(`Edital N° ${compiled.numero} publicado com sucesso!`, 'success');
                  setShowPublishConfirm(false);
                  setActiveView('list');
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <i className="ti ti-check"></i> Sim, Publicar Edital
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

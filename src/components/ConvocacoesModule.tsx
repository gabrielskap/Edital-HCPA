import React, { useState, useEffect } from 'react';
import { Convocacao, Edital, Candidato } from '../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Briefcase, 
  FileText, 
  Check, 
  X, 
  Eye, 
  Plus, 
  FileCheck, 
  Activity, 
  PenTool, 
  UserCheck, 
  ChevronRight, 
  AlertCircle,
  FileCheck2,
  Trash2,
  BookmarkCheck,
  Award,
  Search,
  Filter,
  Users2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info
} from 'lucide-react';

interface ConvocacoesModuleProps {
  convocacoes: Convocacao[];
  editais: Edital[];
  candidatos: Candidato[];
  onCreateConvocacao: (newConv: Omit<Convocacao, 'id'>) => void;
  onViewDetails: (conv: Convocacao) => void;
  presencas?: Record<string, 'Pendente' | 'Presente' | 'Ausente'>;
  setPresencas?: React.Dispatch<React.SetStateAction<Record<string, 'Pendente' | 'Presente' | 'Ausente'>>>;
  setConvocacoes?: React.Dispatch<React.SetStateAction<Convocacao[]>>;
  showToast?: (mensagem: string, tipo: 'success' | 'error' | 'warning') => void;
  logAction?: (acao: string, modulo: string, registro: string, detalhe: string) => void;
  confirmAction?: (mensagem: string, callback: () => void) => void;
}

export default function ConvocacoesModule({ 
  convocacoes, 
  editais, 
  candidatos, 
  onCreateConvocacao, 
  onViewDetails,
  presencas: propPresencas,
  setPresencas: propSetPresencas,
  setConvocacoes,
  showToast,
  logAction,
  confirmAction
}: ConvocacoesModuleProps) {
  
  // Active Tab layout manager: 'presenca' | 'nova' | 'historico'
  const [activeTab, setActiveTab] = useState<'presenca' | 'nova' | 'historico'>('presenca');

  // Search filter states for active convocations list and history timeline
  const [convocacoesSearchTerm, setConvocacoesSearchTerm] = useState('');
  const [historicoSearchTerm, setHistoricoSearchTerm] = useState('');
  
  // Custom filter state by Edital
  const [selectedEditalFilter, setSelectedEditalFilter] = useState('');

  // Local sync of convocations state
  const [localConvocacoes, setLocalConvocacoes] = useState<Convocacao[]>(convocacoes);
  
  // Selection of convocation for roll call / attendance table
  const [selectedConvocacaoId, setSelectedConvocacaoId] = useState<number | null>(null);

  // Form states to create new convocation
  const [formEdital, setFormEdital] = useState(editais[0]?.numero || '');
  const [formCargo, setFormCargo] = useState('');
  const [formTipo, setFormTipo] = useState('Prova Escrita');
  const [formData, setFormData] = useState('2026-06-15');
  const [formHora, setFormHora] = useState('09:00');
  const [formLocal, setFormLocal] = useState('');
  
  // Selection methodology for candidates: "classificacao" or "manual"
  const [generationMethod, setGenerationMethod] = useState<'classificacao' | 'manual'>('classificacao');
  const [qtdConvocados, setQtdConvocados] = useState<number>(3);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  
  // Previews text block buffer
  const [previewTexto, setPreviewTexto] = useState<string | null>(null);

  // Fallback integrated attendance buffer
  const [localPresencas, setLocalPresencas] = useState<Record<string, 'Presente' | 'Ausente' | 'Pendente'>>({
    "1-1": "Presente",
    "1-5": "Pendente",
    "2-2": "Presente",
    "2-6": "Ausente",
    "3-3": "Presente",
  });

  const presencas = propPresencas || localPresencas;
  const setPresencas = propSetPresencas || setLocalPresencas;

  // Sync state transitions of convocations prop
  useEffect(() => {
    setLocalConvocacoes(prev => {
      const merged = [...convocacoes];
      prev.forEach(p => {
        const exists = merged.some(m => m.id === p.id);
        if (!exists) {
          merged.push(p);
        }
      });
      return merged;
    });
  }, [convocacoes]);

  // Set initial selected convocation if none selected
  useEffect(() => {
    if (!selectedConvocacaoId) {
      const publicadas = localConvocacoes.filter(c => c.status === 'Publicada');
      if (publicadas.length > 0) {
        setSelectedConvocacaoId(publicadas[0].id);
      } else if (localConvocacoes.length > 0) {
        setSelectedConvocacaoId(localConvocacoes[0].id);
      }
    }
  }, [localConvocacoes, selectedConvocacaoId]);

  // Adjust selection when edital filter shifts
  useEffect(() => {
    if (selectedEditalFilter) {
      const filtered = localConvocacoes.filter(c => c.status === 'Publicada' && c.edital === selectedEditalFilter);
      if (filtered.length > 0) {
        const isCurrentInFiltered = filtered.some(c => c.id === selectedConvocacaoId);
        if (!isCurrentInFiltered) {
          setSelectedConvocacaoId(filtered[0].id);
        }
      } else {
        setSelectedConvocacaoId(null);
      }
    } else {
      const publicadas = localConvocacoes.filter(c => c.status === 'Publicada');
      if (publicadas.length > 0 && (!selectedConvocacaoId || !publicadas.some(c => c.id === selectedConvocacaoId))) {
        setSelectedConvocacaoId(publicadas[0].id);
      }
    }
  }, [selectedEditalFilter, localConvocacoes]);

  const getEditalDetalhes = (numEdital: string) => {
    return editais.find(e => e.numero === numEdital);
  };

  // Extract unique roles based on candidates associated to selected edital
  const cargosDoEdital = Array.from(new Set(
    candidatos
      .filter(c => c.edital === formEdital)
      .map(c => c.cargo)
  ));

  // Reset default selected role when Edital dropdown transitions
  useEffect(() => {
    if (cargosDoEdital.length > 0 && !cargosDoEdital.includes(formCargo)) {
      setFormCargo(cargosDoEdital[0]);
    } else if (cargosDoEdital.length === 0) {
      setFormCargo('');
    }
  }, [formEdital, cargosDoEdital]);

  // Calculation of final score based on weights
  const getCandidatoNotaFinal = (c: Candidato) => {
    const pesoEscrita = c.peso_escrita ?? 6;
    const pesoTitulos = c.peso_titulos ?? 4;
    const notaFinal = (c.notaEscrita * pesoEscrita + c.notaTitulos * pesoTitulos) / (pesoEscrita + pesoTitulos);
    return Number(notaFinal.toFixed(2));
  };

  // Eligible homologated candidates inside selected edital and cargo
  const eligibleCandidates = candidatos.filter(c => {
    const matchesEdital = c.edital === formEdital;
    const matchesCargo = !formCargo || c.cargo === formCargo;
    const isHomologadoOrActive = c.status === 'Homologado';
    return matchesEdital && matchesCargo && isHomologadoOrActive;
  });

  // Automatically rank and choose top candidates if classified method is set
  useEffect(() => {
    if (generationMethod === 'classificacao') {
      const sorted = [...eligibleCandidates].sort((a, b) => getCandidatoNotaFinal(b) - getCandidatoNotaFinal(a));
      const topIds = sorted.slice(0, qtdConvocados).map(c => c.id);
      setSelectedCandidates(topIds);
    }
  }, [formEdital, formCargo, generationMethod, qtdConvocados, candidatesHash(eligibleCandidates)]);

  function candidatesHash(list: Candidato[]) {
    return list.map(c => c.id).join(',');
  }

  const handleToggleCandidateManual = (id: number) => {
    if (generationMethod === 'manual') {
      setSelectedCandidates(prev => 
        prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
      );
    }
  };

  const selectedConvocacao = localConvocacoes.find(c => c.id === selectedConvocacaoId);

  // Generate Brazillian format institutional document text block
  const gerarTextoComunicado = (): string => {
    const ed = getEditalDetalhes(formEdital);
    const instituicao = ed?.instituicao || "ADMINISTRAÇÃO PÚBLICA";
    const realizadora = ed?.realizadora || "SELECTPRO BANCA GESTORA";
    
    const nomesConvocados = candidatos
      .filter(c => selectedCandidates.includes(c.id))
      .sort((a, b) => getCandidatoNotaFinal(b) - getCandidatoNotaFinal(a))
      .map((c, idx) => `  ${idx + 1}º - ${c.nome} (Vaga: ${c.modalidade} | Nota Ref: ${getCandidatoNotaFinal(c).toFixed(2)})`)
      .join('\n');

    const dataFormatada = formData.split('-').reverse().join('/');

    return `EDITAL DE CONVOCAÇÃO Nº ${Math.floor(Math.random() * 90) + 10}/2026
PROCESSO SELETIVO PÚBLICO – EDITAL ${formEdital}

O Presidente da Comissão Organizadora de Concursos do(a) ${instituicao}, no uso das atribuições legais que lhe são conferidas, CONVOCA os candidatos listados abaixo para comparecerem e realizarem a etapa de "${formTipo.toUpperCase()}", de caráter obrigatório conforme as instruções do edital regulador.

As atividades avaliativas ocorrerão sob as seguintes condições técnicas e estruturais:

DATA DO EVENTO: ${dataFormatada}
HORÁRIO DE APRESENTAÇÃO: ${formHora} horas
LOCAL DO EXAME: ${formLocal || "Não especificado"}

INSTRUÇÕES AOS CANDIDATOS:
1. Recomenda-se a chegada com antecedência mínima de 30 (trinta) minutos do horário fixado, portando documento de identificação original com foto.
2. Não será permitida a entrada de candidatos após o fechamento dos portões de acesso.
3. A ausência ou a não apresentação de documentos válidos de identificação ensejará a eliminação automática e definitiva do certame.

CARGO ALVO: ${formCargo || "Cargos Diversos"}

RELAÇÃO DOS CANDIDATOS CONVOCADOS (POR ORDEM DE CLASSIFICAÇÃO):
${nomesConvocados || "  [Nenhum candidato selecionado para esta convocação]"}

${instituicao}, 08 de junho de 2026.

______________________________________________
Comissão Organizadora de Concursos e Seletivos
Banca Executora (${realizadora})`;
  };

  const handleVisualizarComunicado = () => {
    if (!formLocal) {
      if (showToast) {
        showToast("Por favor, preencha o Local de Atendimento para gerar a pré-visualização.", "warning");
      } else {
        alert("Por favor, preencha o Local de Atendimento para gerar a pré-visualização completa.");
      }
      return;
    }
    const texto = gerarTextoComunicado();
    setPreviewTexto(texto);
  };

  const submitNovaConvocacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEdital || !formTipo || !formData || !formHora || !formLocal) {
      return;
    }
    if (selectedCandidates.length === 0) {
      if (showToast) {
        showToast("Selecione ao menos 1 candidato para finalizar esta convocação.", "error");
      } else {
        alert("Selecione pelo menos 1 candidato para finalizar esta convocação.");
      }
      return;
    }

    const payload: Omit<Convocacao, 'id'> = {
      edital: formEdital,
      cargo: formCargo || 'Todos os Cargos',
      tipo: formTipo,
      data: formData,
      hora: formHora,
      local: formLocal,
      convocados: selectedCandidates,
      status: 'Publicada'
    };

    onCreateConvocacao(payload);

    const novaLocalId = Date.now();
    const novaLocal: Convocacao = {
      id: novaLocalId,
      ...payload
    };

    setLocalConvocacoes(prev => [novaLocal, ...prev]);
    setSelectedConvocacaoId(novaLocalId);

    // Reset forms cleanly
    setFormLocal('');
    setPreviewTexto(null);
    setSelectedCandidates([]);
    setQtdConvocados(3);
    
    if (logAction) {
      logAction("Nova Convocação", "Convocações", `Edital ${payload.edital}`, `Criado evento convocatório para ${payload.cargo}`);
    }

    if (showToast) {
      showToast("Convocação oficial publicada e timbrada gerada com sucesso!", "success");
    }

    // Switch tab to let users see active state
    setActiveTab('presenca');
  };

  const handleUpdatePresenca = (convId: number, candidatoId: number, status: 'Presente' | 'Ausente') => {
    const chave = `${convId}-${candidatoId}`;
    setPresencas(prev => ({
      ...prev,
      [chave]: status
    }));

    if (showToast) {
      showToast(`Presença registrada como ${status} com sucesso!`, "success");
    }

    if (logAction) {
      const cand = candidatos.find(c => c.id === candidatoId);
      logAction("Chamada Presença", "Convocações", cand ? cand.nome : `Candidato #${candidatoId}`, `Status de presença atualizado para ${status}`);
    }
  };

  const getCompareceramCount = (conv: Convocacao) => {
    return conv.convocados.filter(candId => {
      const chave = `${conv.id}-${candId}`;
      return presencas[chave] === 'Presente';
    }).length;
  };

  const getConvocacaoIcon = (tipo: string) => {
    const LowerTipo = tipo.toLowerCase();
    if (LowerTipo.includes('prova')) return <PenTool className="w-5 h-5 text-[var(--color-primary)]" />;
    if (LowerTipo.includes('documento') || LowerTipo.includes('título')) return <FileCheck className="w-5 h-5 text-amber-600" />;
    if (LowerTipo.includes('médic') || LowerTipo.includes('perícia')) return <Activity className="w-5 h-5 text-emerald-600" />;
    return <UserCheck className="w-5 h-5 text-blue-600" />;
  };

  // Stats calculation
  const totalConvsSum = localConvocacoes.length;
  const activeConvsCount = localConvocacoes.filter(c => c.status === 'Publicada').length;
  const closedConvsCount = localConvocacoes.filter(c => c.status === 'Concluída').length;
  
  let totalCandidatesSum = 0;
  let totalPresentSum = 0;
  
  localConvocacoes.forEach(c => {
    totalCandidatesSum += c.convocados.length;
    c.convocados.forEach(candId => {
      const key = `${c.id}-${candId}`;
      if (presencas[key] === 'Presente') {
        totalPresentSum++;
      }
    });
  });

  const generalAttendancePercent = totalCandidatesSum > 0 
    ? Math.round((totalPresentSum / totalCandidatesSum) * 100) 
    : 100;

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in" id="convocacoes-module">
      
      {/* 1. SECTOR HEADER CARD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b border-[var(--color-border)] gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]" id="title-convocacoes">Convocações Oficiais</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Gerenciamento de atos convocatórios, chamadas públicas do certame SelectPro e controle ativo de presenças.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border border-[var(--color-border)] flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Conformidade LGPD & Atos Oficiais
          </span>
        </div>
      </div>

      {/* 2. ANALYTICS & STATS TILES (Visão Executiva - Alinhado com sp-metric-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="convocacoes-stats">
        {/* Card 1: Total Convocatórias */}
        <div className="sp-metric-card sp-metric-card-slate" id="stat-total">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Total Convocatórias</p>
              <h3 className="sp-metric-value mt-1">{totalConvsSum}</h3>
            </div>
            <div className="sp-metric-icon">
              <Users2 className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Volume registrado</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Histórico</span>
          </div>
        </div>

        {/* Card 2: Convocadas Ativas */}
        <div className="sp-metric-card sp-metric-card-amber" id="stat-active">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Convocadas Ativas</p>
              <h3 className="sp-metric-value mt-1">{activeConvsCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-amber-500">
            <span>Fase de presença ativa</span>
            <span className="font-semibold text-amber-600 dark:text-amber-300">Abertas</span>
          </div>
        </div>

        {/* Card 3: Etapas Concluídas */}
        <div className="sp-metric-card sp-metric-card-emerald" id="stat-closed">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Etapas Concluídas</p>
              <h3 className="sp-metric-value mt-1">{closedConvsCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-emerald-500">
            <span>Finalizadas e homologadas</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-300">Concluídas</span>
          </div>
        </div>

        {/* Card 4: Presença Geral */}
        <div className="sp-metric-card sp-metric-card-blue" id="stat-attendance">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Presença Geral</p>
              <h3 className="sp-metric-value mt-1">{generalAttendancePercent}%</h3>
            </div>
            <div className="sp-metric-icon">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-blue-500">
            <span>Taxa do roll-call geral</span>
            <span className="font-semibold text-blue-600 dark:text-blue-300">Média</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE NAVIGATION TABS */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('presenca')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'presenca'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-slate-50/50 dark:bg-slate-800/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Fazer Chamada & Presenças</span>
          {activeConvsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-[var(--color-primary)] text-white rounded-full">
              {activeConvsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('nova')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'nova'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-slate-50/50 dark:bg-slate-800/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Convocação</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'historico'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-slate-50/50 dark:bg-slate-800/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Histórico & Linha do Tempo</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-100 text-[var(--color-text-secondary)] rounded-full font-sans font-medium">
            {totalConvsSum}
          </span>
        </button>
      </div>

      {/* 4. TAB PANELS CONTENTS */}
      
      {/* ------------------------------------------------------------- 
          TAB 1: CALL REGISTRY & ROLL CALL CHUVA 
          ------------------------------------------------------------- */}
      {activeTab === 'presenca' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Active Convocations Grid / Card Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-[var(--color-primary)] rounded-full"></div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Selecione o exame ativo para fazer a chamada</h2>
              </div>
              
              {localConvocacoes.filter(c => c.status === 'Publicada').length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <select
                      value={selectedEditalFilter}
                      onChange={(e) => setSelectedEditalFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-white border border-[var(--color-border)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] shadow-xs cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234a6352' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'></path></svg>")`, backgroundPosition: 'right 10px center', backgroundSize: '12px', backgroundRepeat: 'no-repeat' }}
                      title="Filtrar por Edital"
                    >
                      <option value="">Filtro: Todos Editais</option>
                      {editais.map(ed => (
                        <option key={ed.id} value={ed.numero}>Edital {ed.numero}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Filtrar por tipo, cargo..."
                      value={convocacoesSearchTerm}
                      onChange={(e) => setConvocacoesSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-white border border-[var(--color-border)] rounded-lg text-xs placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] shadow-xs"
                    />
                    {convocacoesSearchTerm && (
                      <button 
                        onClick={() => setConvocacoesSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {localConvocacoes.filter(c => c.status === 'Publicada').length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="w-10 h-10 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Não existem convocações ativas no momento</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Navegue até a aba "Nova Convocação" para criar um chamamento formal.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('nova')}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Criar Convocação Inicial
                </button>
              </div>
            ) : (() => {
              const filtered = localConvocacoes
                .filter(c => c.status === 'Publicada')
                .filter(c => {
                  if (!selectedEditalFilter) return true;
                  return c.edital === selectedEditalFilter;
                })
                .filter(c => {
                  if (!convocacoesSearchTerm) return true;
                  const term = convocacoesSearchTerm.toLowerCase();
                  return (
                    c.tipo.toLowerCase().includes(term) ||
                    c.cargo.toLowerCase().includes(term) ||
                    c.edital.toLowerCase().includes(term) ||
                    c.local.toLowerCase().includes(term)
                  );
                });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white p-10 text-center rounded-xl border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center space-y-2.5 animate-fade-in">
                    <Search className="w-9 h-9 text-slate-300" />
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">Nenhuma convocação ativa atende aos filtros</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Ajuste o termo de busca ou limpe o filtro atual.</p>
                    </div>
                    <button 
                      onClick={() => setConvocacoesSearchTerm('')}
                      className="mt-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in" id="active-convocacoes-list">
                  {filtered.map((conv, index) => {
                    const isSelected = selectedConvocacaoId === conv.id;
                    const totalConvocados = conv.convocados.length;
                    const compareceram = getCompareceramCount(conv);
                    const attendancePercent = totalConvocados > 0 ? Math.round((compareceram / totalConvocados) * 100) : 0;
                    
                    return (
                      <div 
                        key={`${conv.id}-${convocacoesSearchTerm}`}
                        id={`active-card-${conv.id}`}
                        onClick={() => setSelectedConvocacaoId(conv.id)}
                        className={`sp-card group cursor-pointer select-none flex flex-col justify-between transition-all animate-fade-in-up ${
                          isSelected ? 'selected-card' : ''
                        }`}
                        style={{ animationDelay: `${index * 45}ms` }}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] text-[10px] font-mono font-bold border border-[var(--color-border)]">
                              Edital {conv.edital}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide uppercase">
                              {conv.status}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
                              <Calendar className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                              <h3 className="font-bold text-sm truncate" title={conv.tipo}>{conv.tipo}</h3>
                            </div>

                            {/* Progress bar anchored right beneath the title area */}
                            <div className="mt-2.5 mb-3 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[var(--color-text-secondary)]">Presença do Exame</span>
                                <span className="sp-badge sp-badge-success font-mono font-bold">
                                  {attendancePercent}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-300" 
                                  style={{ width: `${attendancePercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Bento style details container - more compact with smaller padding */}
                            <div className="bento-details bg-slate-50/70 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/50 space-y-1.5 text-[10px] text-[var(--color-text-secondary)] mt-2">
                              <div className="flex items-center justify-between">
                                <span className="label text-[var(--color-text-muted)]">Cargo</span>
                                <span className="value font-bold text-[var(--color-text-primary)] text-right truncate max-w-[140px]" title={conv.cargo}>
                                  {conv.cargo}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="label text-[var(--color-text-muted)]">Data / Hora</span>
                                <span className="value font-bold text-[var(--color-text-primary)]">
                                  {conv.data.split('-').reverse().join('/')} às {conv.hora}h
                                </span>
                              </div>
                              <div className="flex items-start justify-between">
                                <span className="label text-[var(--color-text-muted)] shrink-0">Local</span>
                                <span className="value font-bold text-[var(--color-text-primary)] text-right truncate max-w-[140px]" title={conv.local}>
                                  {conv.local}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card bottom action panel */}
                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-light)] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[140px]" title={`${totalConvocados} convocados`}>
                            {totalConvocados} convocados ({compareceram} pres.)
                          </span>
                          <div className="min-h-[26px] flex items-center justify-end flex-shrink-0">
                            {isSelected ? (
                              <span className="inline-flex items-center justify-center gap-1 text-[10px] font-bold text-[var(--color-primary)] px-2.5 py-1 bg-[var(--color-primary-light)]/40 rounded-full border border-[var(--color-primary)]/20 shadow-xs animate-pulse">
                                <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Ativo
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--color-text-muted)] font-bold group-hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-0.5 justify-center px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/10 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                                Fazer Chamada →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* PRESENCE CONTROLS TABLE CARD */}
          {selectedConvocacao && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm" id="tabela-convocados-card">
              <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-primary-light)]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-primary-dark)] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[var(--color-primary)]" />
                    Lista de Roll-Call para Registro de Presença
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-medium">
                    {selectedConvocacao.tipo} (Edital {selectedConvocacao.edital}) — Cargo: {selectedConvocacao.cargo}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-100 font-mono font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                    Total: {selectedConvocacao.convocados.length}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 font-mono font-bold text-emerald-800 border border-emerald-200">
                    Presentes: {getCompareceramCount(selectedConvocacao)}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-rose-100 font-mono font-bold text-rose-800 border border-rose-200">
                    Ausentes: {selectedConvocacao.convocados.length - getCompareceramCount(selectedConvocacao)}
                  </span>
                </div>
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="sp-table" id="table-presenca-realtime">
                  <thead>
                    <tr>
                      <th className="py-3.5 px-4 text-center w-16">Pos</th>
                      <th className="py-3.5 px-3 w-32">Nº Inscrição</th>
                      <th className="py-3.5 px-3">Nome do Candidato</th>
                      <th className="py-3.5 px-3 w-40 text-center">Modalidade</th>
                      <th className="py-3.5 px-3 w-28 text-center">Nota Final</th>
                      <th className="py-3.5 px-3 w-40 text-center">Status Presença</th>
                      <th className="py-3.5 px-4 text-right w-64">Ações de Chamada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-light)] text-sm">
                    {selectedConvocacao.convocados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)] font-medium">
                          Nenhum candidato listado para esta convocação de etapa.
                        </td>
                      </tr>
                    ) : (
                      selectedConvocacao.convocados.map((candId, index) => {
                        const cand = candidatos.find(c => c.id === candId);
                        if (!cand) return null;

                        const chavePresenca = `${selectedConvocacao.id}-${cand.id}`;
                        const statusPresenca = presencas[chavePresenca] || 'Pendente';

                        return (
                          <tr key={cand.id} className="hover:bg-[var(--color-primary-light)]/20 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-center text-[var(--color-text-secondary)]">{index + 1}º</td>
                            <td className="py-4 px-3 font-mono font-semibold text-[var(--color-text-primary)]">{cand.inscricao}</td>
                            <td className="py-4 px-3 font-bold text-[var(--color-text-primary)]">
                              {cand.nome}
                            </td>
                            <td className="py-4 px-3 text-center">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                {cand.modalidade}
                              </span>
                            </td>
                            <td className="py-4 px-3 font-mono text-center font-bold text-[var(--color-primary-dark)]">
                              {getCandidatoNotaFinal(cand).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`sp-badge ${
                                statusPresenca === 'Presente' ? 'sp-badge-ativo'
                                : statusPresenca === 'Ausente' ? 'sp-badge-encerrado'
                                : 'sp-badge-pendente'
                              }`}>
                                {statusPresenca}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePresenca(selectedConvocacao.id, cand.id, 'Presente')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-250 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                                  title="Confirmar Presença"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Presente
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePresenca(selectedConvocacao.id, cand.id, 'Ausente')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-250 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                                  title="Registrar Ausência"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  Ausente
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE TABLE-CARDS RESPONSIVE VIEW */}
              <div className="md:hidden divide-y divide-[var(--color-border-light)]">
                {selectedConvocacao.convocados.length === 0 ? (
                  <div className="p-8 text-center text-[var(--color-text-muted)] font-medium">
                    Nenhum candidato listado para este evento convocatório.
                  </div>
                ) : (
                  selectedConvocacao.convocados.map((candId, index) => {
                    const cand = candidatos.find(c => c.id === candId);
                    if (!cand) return null;

                    const chavePresenca = `${selectedConvocacao.id}-${cand.id}`;
                    const statusPresenca = presencas[chavePresenca] || 'Pendente';

                    return (
                      <div key={cand.id} className="p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Inscrição: {cand.inscricao}</span>
                            <h4 className="font-bold text-sm text-[var(--color-text-primary)] mt-0.5">{cand.nome}</h4>
                          </div>
                          <span className="font-mono font-bold text-xs bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                            {index + 1}º
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                          <div>
                            <span className="block text-[10px] text-[var(--color-text-muted)]">Modalidade</span>
                            <span className="font-semibold">{cand.modalidade}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[var(--color-text-muted)]">Nota Final</span>
                            <span className="font-bold text-[var(--color-primary-dark)]">{getCandidatoNotaFinal(cand).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)] gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            statusPresenca === 'Presente' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : statusPresenca === 'Ausente' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {statusPresenca}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdatePresenca(selectedConvocacao.id, cand.id, 'Presente')}
                              className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[40px]"
                              title="Registrar Presença"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePresenca(selectedConvocacao.id, cand.id, 'Ausente')}
                              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer min-h-[40px]"
                              title="Registrar Ausência"
                            >
                              <X className="w-4 h-4 text-rose-600" />
                              Ausente
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- 
          TAB 2: CREATE NEW CONVOCATION WORKSPACE 
          ------------------------------------------------------------- */}
      {activeTab === 'nova' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="nova-convocacao-form-card">
          
          {/* Left Column Settings (Form Setup) - 5 Cols on Large */}
          <div className="sp-card lg:col-span-5">
            <div className="border-b border-[var(--color-border-light)] pb-3 flex items-center gap-2 mb-4">
              <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Criar Nova Chamada Convocatória</h3>
                <p className="text-[11px] text-[var(--color-text-secondary)]">Publique uma nova publicação formal com candidatos convocados</p>
              </div>
            </div>

            <form onSubmit={submitNovaConvocacao} className="space-y-4">

              <div className="space-y-1.5">
                <label htmlFor="form-ed">Edital Regulador *</label>
                <select id="form-ed" required className="w-full sp-input"
                  value={formEdital} onChange={(e) => setFormEdital(e.target.value)}>
                  {editais.map(ed => (
                    <option key={ed.id} value={ed.numero}>Edital {ed.numero} - {ed.instituicao}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-cg">Cargo Pretendido *</label>
                <select id="form-cg" required className="w-full sp-input"
                  value={formCargo} onChange={(e) => setFormCargo(e.target.value)}>
                  {cargosDoEdital.length === 0 ? (
                    <option value="">Sem candidatos para este edital</option>
                  ) : (
                    cargosDoEdital.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-tp">Tipo da Etapa *</label>
                <select id="form-tp" required className="w-full sp-input"
                  value={formTipo} onChange={(e) => setFormTipo(e.target.value)}>
                  <option value="Prova Escrita">Prova Escrita Objetiva</option>
                  <option value="Entrega de Documentos">Entrega de Documentos / Títulos</option>
                  <option value="Avaliação Médica">Avaliação Médica / Perícia</option>
                  <option value="Admissão">Ato de Admissão / Posse</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="form-dt">Data do Evento *</label>
                  <input id="form-dt" type="date" required className="w-full sp-input font-mono font-bold"
                    value={formData} onChange={(e) => setFormData(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="form-hr">Horário Previsto *</label>
                  <input id="form-hr" type="time" required className="w-full sp-input font-mono font-bold"
                    value={formHora} onChange={(e) => setFormHora(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="form-lc">Local Completo do Exame *</label>
                <textarea id="form-lc" required rows={2}
                  placeholder="Ex: Sala de Recursos Humanos, Bloco D, Sala 101 - Hospital de Clínicas"
                  className="w-full sp-input" style={{ resize: 'vertical' }}
                  value={formLocal} onChange={(e) => setFormLocal(e.target.value)} />
              </div>

              {/* Metodologia */}
              <div className="space-y-2 border-t border-[var(--color-border-light)] pt-3">
                <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Metodologia de Seleção</span>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {[
                    { value: 'classificacao', label: 'Por Classificação Legal', desc: 'Classifica automaticamente os candidatos de maior nota final' },
                    { value: 'manual', label: 'Selecionar Manualmente', desc: 'Marque manualmente os candidatos da lista de homologados' },
                  ].map(opt => (
                    <label key={opt.value}
                      className="flex items-center gap-2 py-2.5 px-3 border border-[var(--color-border)] rounded-lg cursor-pointer hover:bg-[var(--color-primary-light)] transition-colors"
                      style={{ textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}>
                      <input type="radio" name="gen-method"
                        checked={generationMethod === opt.value}
                        onChange={() => { setGenerationMethod(opt.value as any); setSelectedCandidates([]); }}
                        className="accent-[var(--color-primary)] w-4 h-4 cursor-pointer shrink-0" />
                      <div>
                        <span className="block font-bold text-[var(--color-text-primary)] text-xs">{opt.label}</span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {generationMethod === 'classificacao' && (
                  <div className="space-y-2 bg-[var(--color-primary-light)] p-3 rounded-lg border border-[var(--color-border)] animate-slide-up">
                    <label htmlFor="inp-qtd">Quantidade de vagas para convocação:</label>
                    <div className="flex items-center gap-3">
                      <input id="inp-qtd" type="number" min={1} max={eligibleCandidates.length || 10}
                        className="sp-input font-mono font-bold text-center"
                        style={{ width: '80px' }}
                        value={qtdConvocados}
                        onChange={(e) => setQtdConvocados(Math.max(1, Number(e.target.value)))} />
                      <span className="text-[11px] text-[var(--color-text-secondary)]">
                        (Maiores notas de {eligibleCandidates.length} cand. aptos)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--color-border-light)]">
                <button type="button" onClick={handleVisualizarComunicado}
                  disabled={!formLocal || selectedCandidates.length === 0}
                  className="sp-btn sp-btn-secondary gap-1.5 justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                  <Eye className="w-4 h-4" />
                  Visualizar PDF
                </button>
                <button type="submit"
                  disabled={selectedCandidates.length === 0}
                  className="sp-btn sp-btn-primary gap-1.5 justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                  <FileCheck2 className="w-4 h-4" />
                  Publicar Edital
                </button>
              </div>

            </form>
          </div>

          {/* Right Column Workspace (Candidates selection & Timbrated preview) - 7 Cols on Large */}
          <div className="lg:col-span-7 space-y-6">

            {/* Candidate List preview space */}
            <div className="sp-card">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-light)] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Candidatos no Edital Convocado ({eligibleCandidates.length})</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">Apenas candidatos homologados de cargo selecionado são elegíveis</p>
                </div>
                {generationMethod === 'manual' && eligibleCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = eligibleCandidates.map(c => c.id);
                      setSelectedCandidates(prev => 
                        prev.length === allIds.length ? [] : allIds
                      );
                    }}
                    className="text-xs text-[var(--color-primary)] hover:underline font-bold bg-[var(--color-primary-light)] px-2.5 py-1 rounded"
                  >
                    {selectedCandidates.length === eligibleCandidates.length ? 'Limpar Seleção' : 'Selecionar Todos'}
                  </button>
                )}
              </div>

              {eligibleCandidates.length === 0 ? (
                <div className="py-12 p-4 text-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">Sem candidatos qualificados encontrados</p>
                  <p className="text-[11px]">Certifique-se de que existem candidatos com situação "Homologado" para este edital e cargo.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--color-border-light)] pr-2 space-y-1">
                  {eligibleCandidates.map((c, index) => {
                    const isChecked = selectedCandidates.includes(c.id);
                    const ranknum = index + 1;
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => handleToggleCandidateManual(c.id)}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-[var(--color-primary-light)] border border-[var(--color-border)]'
                            : 'hover:bg-[var(--color-bg)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {generationMethod === 'manual' ? (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // click handler on container handles state sync
                              className="accent-[var(--color-primary)] h-4 w-4 shrink-0 rounded"
                            />
                          ) : (
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-mono text-xs font-bold ${
                              isChecked 
                                ? 'bg-[var(--color-primary)] text-white' 
                                : 'bg-slate-100 text-[var(--color-text-secondary)]'
                            }`}>
                              {ranknum}
                            </span>
                          )}
                          
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--color-text-primary)] text-xs truncate">{c.nome}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)] font-medium">Insc: <span className="font-mono font-semibold">{c.inscricao}</span> | Vaga: {c.modalidade}</p>
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap pl-4">
                          <span className="block text-[11px] font-bold text-[var(--color-primary-dark)] font-mono">Nota Final: {getCandidatoNotaFinal(c).toFixed(2)}</span>
                          {isChecked && (
                            <span className="sp-badge sp-badge-ativo" style={{ fontSize: '9px', padding: '2px 7px' }}>CONVOCADO</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timbrated PDF Previewer layout */}
            <div className="sp-card overflow-hidden" style={{ padding: 0 }}>
              <div className="bg-[var(--color-primary)] text-white p-4 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-[var(--color-accent)]" />
                  Pré-visualização do Documento Oficial Publicado
                </span>
                
                {previewTexto && (
                  <button 
                    onClick={() => setPreviewTexto(null)} 
                    className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
                    title="Fechar pré-visualização"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div style={{ padding: '20px 24px' }}>
                {previewTexto ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-lg overflow-x-auto max-h-[350px] overflow-y-auto">
                      <pre className="font-mono text-[10px] text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                        {previewTexto}
                      </pre>
                    </div>
                    <div className="sp-alert sp-alert-warning text-[11px]">
                      <i className="sp-alert-icon ti ti-info-circle"></i>
                      <span className="sp-alert-text">Este diário de chamadas oficial está pronto para publicação eletrônica. Clicar em "Publicar Edital" finalizará este ato administrativo.</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-12 h-12 text-[var(--color-border)] animate-bounce" />
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">Painel do Comunicado Vazio</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Preencha o local e selecione candidatos para gerar a pré-visualização timbrada.</p>
                    </div>
                    <button type="button"
                      disabled={!formLocal || selectedCandidates.length === 0}
                      onClick={handleVisualizarComunicado}
                      className="sp-btn sp-btn-secondary mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      Gerar Visualização do Documento
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- 
          TAB 3: TIMELINE / HISTORIC ATOS 
          ------------------------------------------------------------- */}
      {activeTab === 'historico' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-4.5 bg-[var(--color-primary)] rounded-full"></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Cronologia de Histórico Convocatório</h3>
              </div>
              
              {localConvocacoes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <select
                      value={selectedEditalFilter}
                      onChange={(e) => setSelectedEditalFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-white border border-[var(--color-border)] rounded-lg text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] shadow-xs cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234a6352' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'></path></svg>")`, backgroundPosition: 'right 10px center', backgroundSize: '12px', backgroundRepeat: 'no-repeat' }}
                      title="Filtrar por Edital"
                    >
                      <option value="">Filtro: Todos Editais</option>
                      {editais.map(ed => (
                        <option key={ed.id} value={ed.numero}>Edital {ed.numero}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Buscar no histórico..."
                      value={historicoSearchTerm}
                      onChange={(e) => setHistoricoSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-white border border-[var(--color-border)] rounded-lg text-xs placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] shadow-xs"
                    />
                    {historicoSearchTerm && (
                      <button 
                        onClick={() => setHistoricoSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {localConvocacoes.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-text-muted)] flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Nenhum evento registrado no sistema.</p>
              </div>
            ) : (() => {
              const filtered = localConvocacoes
                .filter(c => {
                  if (!selectedEditalFilter) return true;
                  return c.edital === selectedEditalFilter;
                })
                .filter(c => {
                  if (!historicoSearchTerm) return true;
                  const term = historicoSearchTerm.toLowerCase();
                  return (
                    c.tipo.toLowerCase().includes(term) ||
                    c.cargo.toLowerCase().includes(term) ||
                    c.edital.toLowerCase().includes(term) ||
                    c.local.toLowerCase().includes(term) ||
                    c.status.toLowerCase().includes(term)
                  );
                });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-[var(--color-text-muted)] flex flex-col items-center justify-center space-y-2.5 animate-fade-in">
                    <Search className="w-9 h-9 text-slate-300" />
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">Nenhum evento histórico encontrado</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Ajuste os filtros ou limpe para ver o histórico completo.</p>
                    </div>
                    <button 
                      onClick={() => { setHistoricoSearchTerm(''); setSelectedEditalFilter(''); }}
                      className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                );
              }

              return (
                <div className="sp-timeline-container ml-3 space-y-6">
                  {filtered.map((conv, idx) => {
                    const totalConvocados = conv.convocados.length;
                    const compareceram = getCompareceramCount(conv);
                    const rate = totalConvocados > 0 ? Math.round((compareceram / totalConvocados) * 100) : 0;

                    return (
                      <div 
                        key={`${conv.id}-${historicoSearchTerm}`} 
                        className="sp-timeline-item select-none animate-fade-in-up" 
                        id={`timeline-item-${conv.id}`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        {/* Indicador na linha de tempo */}
                        <div className="sp-timeline-point sp-timeline-point-normal" />

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 p-4 rounded-xl border border-[var(--color-border)] shadow-xs hover:border-[var(--color-primary)] transition-colors">
                          
                          {/* Lado Esquerdo: Tipo, Edital e Data */}
                          <div className="md:col-span-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {getConvocacaoIcon(conv.tipo)}
                              <span className="font-extrabold text-sm text-[var(--color-text-primary)]" title={conv.tipo}>{conv.tipo}</span>
                            </div>
                            <p className="text-xs font-mono font-bold text-[var(--color-primary)]">Processo Seletivo - Edital {conv.edital}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                              {conv.data.split('-').reverse().join('/')} às {conv.hora}h
                            </p>
                          </div>

                          {/* Lado Central: Cargo & Local */}
                          <div className="md:col-span-5 text-xs space-y-1">
                            <p className="font-bold text-[var(--color-text-primary)] text-sm flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                              {conv.cargo}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic flex items-center gap-1 pl-1">
                              <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                              <span>Local: {conv.local}</span>
                            </p>
                          </div>

                          {/* Lado Direito: Estatísticas de Comparecimento e Badge */}
                          <div className="md:col-span-3 text-right flex flex-col justify-center items-start md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-[var(--color-border-light)]">
                            <div className="flex md:flex-col justify-between w-full md:w-auto md:items-end">
                              <span className="text-xs font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                                {compareceram} de {totalConvocados} Presentes
                              </span>
                              <span className="font-mono font-extrabold text-xs text-[var(--color-primary-dark)] ml-2 md:ml-0 md:mt-0.5">
                                {rate}% comparecimento
                              </span>
                            </div>
                            
                            <div className="w-32 md:w-40 bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-300" 
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            
                            <span className={`sp-badge mt-3 ${
                              conv.status === 'Concluída' ? 'sp-badge-neutral' : 'sp-badge-ativo'
                            }`}>
                              {conv.status}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>
      )}

    </div>
  );
}

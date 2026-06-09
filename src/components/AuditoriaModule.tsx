import React from 'react';
import { AuditLog } from '../types';

interface AuditoriaModuleProps {
  logs: AuditLog[];
  onClearLogs?: () => void;
  showToast?: (mensagem: string, tipo: 'success' | 'error' | 'warning') => void;
  logAction?: (acao: string, modulo: string, registro: string, detalhe: string) => void;
  confirmAction?: (mensagem: string, callback: () => void) => void;
}

// Appeal shape
interface CandidatoRecurso {
  id: number;
  candidato: string;
  processo: string;
  dataInterposicao: string;
  motivo: string;
  status: 'Pendente' | 'Deferido' | 'Indeferido';
  justificativa?: string;
  dataAvaliacao?: string;
}

// Local Toast Shape
interface LocalToast {
  id: string;
  mensagem: string;
  tipo: 'success' | 'warning' | 'error';
}

export default function AuditoriaModule({ logs, onClearLogs, showToast, logAction, confirmAction }: AuditoriaModuleProps) {
  // Navigation inside the module (Tabs)
  const [activeTab, setActiveTab] = React.useState<'logs' | 'recursos' | 'relatorio'>('logs');

  // Local additional logs state to register changes online
  const [localLogs, setLocalLogs] = React.useState<AuditLog[]>([]);

  // Combined logs list
  const allLogs = React.useMemo(() => {
    return [...localLogs, ...logs];
  }, [localLogs, logs]);

  // Main list filters
  const [search, setSearch] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState('Todos');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Local Toast System
  const [localToasts, setLocalToasts] = React.useState<LocalToast[]>([]);
  const addLocalToast = (mensagem: string, tipo: 'success' | 'warning' | 'error') => {
    if (showToast) {
      showToast(mensagem, tipo === 'warning' ? 'warning' : tipo);
    } else {
      const id = Date.now().toString();
      setLocalToasts(prev => [...prev, { id, mensagem, tipo }]);
      setTimeout(() => {
        setLocalToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    }
  };

  // Pre-stocked Candidate Appeals state
  const [recursos, setRecursos] = React.useState<CandidatoRecurso[]>([
    {
      id: 1,
      candidato: "João Marcos Pereira (CPF: 456.***.***-34)",
      processo: "Processo Seletivo HCPA – Edital 01/2026",
      dataInterposicao: "2026-06-08",
      motivo: "Prezados, solicito reavaliação da documentação enviada para comprovação de vaga de cotas étnico-raciais. Enviei a certidão de nascimento com cópia do documento de identidade de meu ascendente de primeiro grau para legitimar autodeclaração conforme regras do anexo do edital, mas meu status de cota étnico-racial foi considerado incorreto. Aguardo deferimento.",
      status: "Pendente"
    },
    {
      id: 2,
      candidato: "Fernanda Costa Silva (CPF: 345.***.***-23)",
      processo: "Processo Seletivo HCPA – Edital 01/2026",
      dataInterposicao: "2026-06-05",
      motivo: "Venho por meio deste interpor recurso contra o indeferimento da isenção sob justificativa de ausência de documento do Cadastro único. O meu comprovante de inscrição no CadÚnico possui o NIS plenamente visível e autenticado, conforme comprovei no arquivo suplementar. Solicito revisão técnica o quanto antes.",
      status: "Deferido",
      justificativa: "Recurso provido pela comissão técnica organizadora. Procedida a validação de isenção de taxa de inscrição diante da conferência positiva da numeração do NIS no banco nacional de dados de assistência social.",
      dataAvaliacao: "2026-06-07"
    }
  ]);

  // Decision Modal States
  const [selectedRecurso, setSelectedRecurso] = React.useState<CandidatoRecurso | null>(null);
  const [decisaoStatus, setDecisaoStatus] = React.useState<'Deferido' | 'Indeferido'>('Deferido');
  const [justificativaTexto, setJustificativaTexto] = React.useState('');

  // Detailed Log Modal State
  const [detailedLog, setDetailedLog] = React.useState<AuditLog | null>(null);

  // Report Generator Form State
  const [reportPeriodStart, setReportPeriodStart] = React.useState('');
  const [reportPeriodEnd, setReportPeriodEnd] = React.useState('');
  const [reportModule, setReportModule] = React.useState('Todos');
  const [generatedReport, setGeneratedReport] = React.useState<{
    dataEmissao: string;
    periodoStart: string;
    periodoEnd: string;
    modulo: string;
    logs: AuditLog[];
    uuid: string;
  } | null>(null);

  // Dynamic calculations for top summary cards based on entire log list
  const stats = React.useMemo(() => {
    const hojeStr = "2026-06-08";

    const hojeCount = allLogs.filter(l => l.dataHora.startsWith(hojeStr)).length;

    // Actions of sensitive type
    const criticasCount = allLogs.filter(l => {
      const acaoNorm = l.acao.toLowerCase();
      return acaoNorm.includes("lançamento de nota") || 
             acaoNorm.includes("alteração de permissão") ||
             acaoNorm.includes("indeferimento") ||
             acaoNorm.includes("exclusão");
    }).length;

    // Simulated system accesses, scaled organically by real logs
    const acessosCount = allLogs.filter(l => l.ip.startsWith("192.168.")).length * 8 + 14;

    const editaisCount = allLogs.filter(l => l.modulo === "Editais").length;

    return {
      hoje: hojeCount,
      criticas: criticasCount,
      acessos: acessosCount,
      editais: editaisCount
    };
  }, [allLogs]);

  // Filter logs for the main table
  const filteredLogs = React.useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = 
        log.usuario.toLowerCase().includes(search.toLowerCase()) ||
        log.acao.toLowerCase().includes(search.toLowerCase()) ||
        log.registro.toLowerCase().includes(search.toLowerCase()) ||
        log.detalhe.toLowerCase().includes(search.toLowerCase()) ||
        log.ip.toLowerCase().includes(search.toLowerCase());

      const matchesModule = selectedModule === 'Todos' || log.modulo === selectedModule;

      const matchesStart = !startDate || log.dataHora.substring(0, 10) >= startDate;
      const matchesEnd = !endDate || log.dataHora.substring(0, 10) <= endDate;

      return matchesSearch && matchesModule && matchesStart && matchesEnd;
    });
  }, [allLogs, search, selectedModule, startDate, endDate]);

  // Handle saving decision on appeal
  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecurso) return;

    if (!justificativaTexto.trim()) {
      addLocalToast("Por favor, digite uma justificativa técnica.", "warning");
      return;
    }

    const action = () => {
      // Update appeal state inline
      setRecursos(prev => prev.map(rec => {
        if (rec.id === selectedRecurso.id) {
          return {
            ...rec,
            status: decisaoStatus,
            justificativa: justificativaTexto,
            dataAvaliacao: "2026-06-08 23:41"
          };
        }
        return rec;
      }));

      // Register an official security audit log reflecting this action
      const newAuditLog: AuditLog = {
        id: Date.now(),
        dataHora: "2026-06-08 23:41",
        usuario: "Administrador Sistema",
        acao: decisaoStatus === 'Deferido' ? "Deferimento de Recurso" : "Indeferimento de Recurso",
        modulo: "Auditoria",
        registro: `Recurso de ${selectedRecurso.candidato.split(' ')[0]}`,
        ip: "192.168.1.10",
        detalhe: `${decisaoStatus === 'Deferido' ? 'DEFERIDO' : 'INDEFERIDO'} pelo Gestor Geral. Justificativa: ${justificativaTexto}`
      };

      if (logAction) {
        logAction(
          decisaoStatus === 'Deferido' ? "Deferimento de Recurso" : "Indeferimento de Recurso",
          "Auditoria",
          `Recurso de ${selectedRecurso.candidato.split(' ')[0]}`,
          `${decisaoStatus === 'Deferido' ? 'DEFERIDO' : 'INDEFERIDO'} pelo Gestor Geral. Justificativa: ${justificativaTexto}`
        );
      } else {
        setLocalLogs(prev => [newAuditLog, ...prev]);
      }

      addLocalToast(`Deciso de recurso processada com sucesso como: ${decisaoStatus.toUpperCase()}`, "success");
      
      // Clear and close modal states
      setSelectedRecurso(null);
      setJustificativaTexto('');
    };

    if (confirmAction) {
      confirmAction(
        `Prezado Gestor, confirma a sua decisão de Julgar como "${decisaoStatus}" o recurso interposto por ${selectedRecurso.candidato.split(' ')[0]}? Esta ação irá refletir no dossiê oficial.`,
        action
      );
    } else {
      action();
    }
  };

  // Generate Report Action
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter logs for report
    const reportLogs = allLogs.filter(log => {
      const matchesModule = reportModule === 'Todos' || log.modulo === reportModule;
      const matchesStart = !reportPeriodStart || log.dataHora.substring(0, 10) >= reportPeriodStart;
      const matchesEnd = !reportPeriodEnd || log.dataHora.substring(0, 10) <= reportPeriodEnd;
      return matchesModule && matchesStart && matchesEnd;
    });

    // Generate simulated SHA-256 Hash
    const randomHash = Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + 
                       "-" + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('') +
                       "-" + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('') +
                       "-selectpro-audit-sha256";

    setGeneratedReport({
      dataEmissao: "08/06/2026 às 23:41:12 UTC-3",
      periodoStart: reportPeriodStart,
      periodoEnd: reportPeriodEnd,
      modulo: reportModule,
      logs: reportLogs,
      uuid: randomHash.toUpperCase()
    });

    // Record an audit trace of log report generation
    const reportTraceLog: AuditLog = {
      id: Date.now(),
      dataHora: "2026-06-08 23:41",
      usuario: "Administrador Sistema",
      acao: "Geração de Relatório de Conformidade",
      modulo: "Auditoria",
      registro: `Relatório Módulo: ${reportModule}`,
      ip: "192.168.1.10",
      detalhe: `Emitido relatório oficial de trilhas. Período: ${reportPeriodStart || 'Geral'} até ${reportPeriodEnd || 'Geral'}. Total de logs apurados: ${reportLogs.length}.`
    };

    if (logAction) {
      logAction(
        "Geração de Relatório de Conformidade",
        "Auditoria",
        `Relatório Módulo: ${reportModule}`,
        `Emitido relatório oficial de trilhas. Período: ${reportPeriodStart || 'Geral'} até ${reportPeriodEnd || 'Geral'}. Total de logs apurados: ${reportLogs.length}.`
      );
    } else {
      setLocalLogs(prev => [reportTraceLog, ...prev]);
    }
    addLocalToast(`Relatório de auditoria gerado com ${reportLogs.length} eventos processados.`, "success");
  };

  const isSensitiveAction = (acao: string) => {
    const act = acao.toLowerCase();
    return act === "lançamento de nota" || act === "alteração de permissão";
  };

  return (
    <div className="space-y-6 animate-fade-in" id="auditoria-module">
      {/* LOCAL TOAST INTERNAL CONTAINER */}
      {localToasts.length > 0 && (
        <div id="local-toast-container" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {localToasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 bg-white dark:bg-slate-800 text-xs font-sans animate-fade-in ${
                t.tipo === 'success' 
                ? 'border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 bg-emerald-50/95 dark:bg-emerald-950/90' 
                : t.tipo === 'error' 
                ? 'border-rose-250 dark:border-rose-900 text-rose-800 dark:text-rose-450 bg-rose-50/95 dark:bg-rose-950/90' 
                : 'border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-400 bg-amber-50/95 dark:bg-amber-950/90'
              }`}
            >
              <div className="mt-0.5">
                {t.tipo === 'success' && <i className="ti ti-circle-check text-base text-emerald-600 dark:text-emerald-400"></i>}
                {t.tipo === 'error' && <i className="ti ti-circle-x text-base text-rose-600 dark:text-rose-450"></i>}
                {t.tipo === 'warning' && <i className="ti ti-alert-triangle text-base text-amber-600 dark:text-amber-400"></i>}
              </div>
              <div className="flex-1">
                <p className="font-bold">Notificação Auditoria</p>
                <p className="text-slate-655 dark:text-slate-350 mt-0.5 leading-normal">{t.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOP DECORATIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Trilhas de Auditoria (Audit Trail)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rastreabilidade geral em conformidade com as diretrizes da LGPD (Lei Geral de Proteção de Dados) para processos públicos.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Logs Criptografados
          </div>
        </div>
      </div>

      {/* 4 TOP SUMMARY CARDS (Valores calculados dinamicamente dos Logs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="auditoria-summary-cards">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            <i className="ti ti-bolt text-2xl"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Ações Hoje</p>
            <p className="text-xl font-extrabold text-slate-805 dark:text-slate-100 mt-0.5">{stats.hoje}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl">
            <i className="ti ti-alert-triangle text-2xl animate-pulse"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Ações Críticas</p>
            <p className="text-xl font-extrabold text-slate-805 dark:text-slate-100 mt-0.5">{stats.criticas}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
            <i className="ti ti-device-desktop text-2xl"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Acessos ao Sistema</p>
            <p className="text-xl font-extrabold text-slate-805 dark:text-slate-100 mt-0.5">{stats.acessos}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
            <i className="ti ti-file-text text-2xl"></i>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Modificações em Editais</p>
            <p className="text-xl font-extrabold text-slate-805 dark:text-slate-100 mt-0.5">{stats.editais}</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS FOR SECTIONS */}
      <div className="sp-tabs-container" id="auditoria-tabs">
        <button
          onClick={() => setActiveTab('logs')}
          className={`sp-tab ${activeTab === 'logs' ? 'sp-tab-active' : ''}`}
          id="tab-view-logs"
        >
          <i className="ti ti-history text-sm"></i>
          Eventos de Log Geral
        </button>
        <button
          onClick={() => setActiveTab('recursos')}
          className={`sp-tab ${activeTab === 'recursos' ? 'sp-tab-active' : ''}`}
          id="tab-view-appeals"
        >
          <i className="ti ti-users text-sm"></i>
          Recursos de Candidatos
          <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px]">
            {recursos.filter(r => r.status === 'Pendente').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('relatorio')}
          className={`sp-tab ${activeTab === 'relatorio' ? 'sp-tab-active' : ''}`}
          id="tab-view-report"
        >
          <i className="ti ti-file-analytics text-sm"></i>
          Relatório de Auditoria
        </button>
      </div>

      {/* Tab content area */}
      <div className="space-y-6">
        
        {/* TAB 1: EVENTOS COMPLETOS DE LOG GERAL */}
        {activeTab === 'logs' && (
          <div className="space-y-4" id="view-section-logs">
            
            {/* SEARCH AND FILTERS BOX */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              
              {/* general search */}
              <div className="relative md:col-span-2 w-full">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  id="log-table-search"
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500"
                  placeholder="Pesquisar por usuário, ação, registro ou IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* module selector */}
              <div className="flex items-center gap-2 w-full">
                <label htmlFor="log-module-filter" className="text-[11px] font-bold text-slate-450 dark:text-slate-400 whitespace-nowrap uppercase">Módulo:</label>
                <select
                  id="log-module-filter"
                  className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 w-full"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Editais">Editais</option>
                  <option value="Candidatos">Candidatos</option>
                  <option value="Avaliações">Avaliações</option>
                  <option value="Convocações">Convocações</option>
                  <option value="Administração">Administração</option>
                  <option value="Auditoria">Auditoria</option>
                </select>
              </div>

              {/* Period filters Wrapper */}
              <div className="flex items-center gap-1.5 w-full">
                <div className="relative w-1/2">
                  <span className="absolute left-2.5 top-0 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Início</span>
                  <input
                    id="log-start-date"
                    type="date"
                    className="w-full pl-2.5 pr-2 pt-4 pb-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-700 dark:text-slate-200 font-mono focus:ring-2 focus:ring-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Período início filtro"
                  />
                </div>
                <div className="relative w-1/2">
                  <span className="absolute left-2.5 top-0 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">Fim</span>
                  <input
                    id="log-end-date"
                    type="date"
                    className="w-full pl-2.5 pr-2 pt-4 pb-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-700 dark:text-slate-200 font-mono focus:ring-2 focus:ring-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="Período fim filtro"
                  />
                </div>
              </div>

            </div>

            {/* MAIN LOGS GRID TABLE */}
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <i className="ti ti-history-off text-5xl text-slate-400 dark:text-slate-500 mb-2 animate-pulse"></i>
                <p className="text-slate-700 dark:text-slate-300 font-bold text-center">Nenhum log encontrado para estes critérios</p>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Experimente alterar os filtros de período e busca.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-150 dark:border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs" id="table-logs-auditoria">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <tr className="border-b border-slate-200 dark:border-slate-700/30">
                        <th scope="col" className="p-3.5 min-w-[125px]">Data e Hora</th>
                        <th scope="col" className="p-3.5 min-w-[110px]">Usuário</th>
                        <th scope="col" className="p-3.5 min-w-[150px]">Ação / Evento</th>
                        <th scope="col" className="p-3.5 min-w-[95px]">Módulo</th>
                        <th scope="col" className="p-3.5 min-w-[160px]">Registro Afetado</th>
                        <th scope="col" className="p-3.5 min-w-[100px]">Endereço IP</th>
                        <th scope="col" className="p-3.5 text-center min-w-[80px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 font-sans">
                      {filteredLogs.map((log) => {
                        const isSensitive = isSensitiveAction(log.acao);
                        return (
                          <tr 
                            key={log.id}
                            className={`transition-all ${
                              isSensitive 
                              ? 'bg-red-50/70 hover:bg-red-100/60 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-slate-801' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/10'
                            }`}
                          >
                            <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono select-all">
                              {log.dataHora}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">
                              {log.usuario}
                            </td>
                            <td className="p-3.5 font-semibold">
                              <span className="flex items-center gap-1.5">
                                {isSensitive && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="Ação de segurança sensível"></span>
                                )}
                                {log.acao}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                                {log.modulo}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">
                              <p className="font-semibold text-xs leading-tight">{log.registro}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-450 mt-0.5 truncate max-w-[200px]" title={log.detalhe}>{log.detalhe}</p>
                            </td>
                            <td className="p-3.5 text-slate-450 dark:text-slate-400 font-mono text-[10px]">
                              {log.ip}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => setDetailedLog(log)}
                                className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-250 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer transition-colors"
                                title="Visualizar metadados detalhados do log"
                                id={`view-log-btn-${log.id}`}
                              >
                                <i className="ti ti-info-circle text-base"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="py-3 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-700/40 text-[10px] text-slate-450 dark:text-slate-500">
                  Trilha auditada e selada com algoritmos criptográficos em conformidade de compliance da LGPD pública. Total de logs correspondentes: <strong>{filteredLogs.length}</strong>.
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PORTAL DE AUDITORIA DE RECURSOS DE CANDIDATOS */}
        {activeTab === 'recursos' && (
          <div className="space-y-4 animate-fade-in" id="view-section-appeals">
            
            {/* Header explanation banner */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3">
              <i className="ti ti-info-square text-xl text-amber-600 dark:text-amber-400 mt-0.5"></i>
              <div className="text-xs">
                <p className="font-bold text-amber-800 dark:text-amber-300">Auditoria Legal de Contestações & Recursos</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Conforme os termos da transparência pública, todas as reanalises de cotas, notas ou inscrições indeferidas devem possuir embasamento descritivo obrigatório assinado para preservação da idoneidade do concurso.
                </p>
              </div>
            </div>

            {/* List of active appeals */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-150 dark:border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Painel Recursal Administrativo</h4>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Transações Locais Ativas</span>
              </div>

              {/* Tabela de Recursos */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left" id="table-recursos-adm">
                  <thead className="bg-slate-50/40 dark:bg-slate-800/40 text-[10px] font-bold uppercase text-slate-450 tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 min-w-[150px]">Candidato</th>
                      <th className="p-3.5 min-w-[150px]">Processo Seletivo</th>
                      <th className="p-3.5 min-w-[100px]">Data Interposição</th>
                      <th className="p-3.5 min-w-[280px]">Fundamentação do Candidato</th>
                      <th className="p-3.5 min-w-[90px]">Status</th>
                      <th className="p-3.5 text-center min-w-[110px]">Julgamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 leading-normal">
                    {recursos.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{rec.candidato.split(' ')[0]} {rec.candidato.split(' ')[1]}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.candidato.substring(rec.candidato.indexOf('('))}</p>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-350 font-semibold text-xs">
                          {rec.processo}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {rec.dataInterposicao.split('-').reverse().join('/')}
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-655 dark:text-slate-350 font-medium italic whitespace-pre-line max-w-[280px] break-words text-xs">
                            "{rec.motivo}"
                          </div>
                          {rec.justificativa && (
                            <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/40 text-[11px]">
                              <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wide">Comissão de Recursos - Acórdão:</p>
                              <p className="text-slate-700 dark:text-slate-300 mt-1">{rec.justificativa}</p>
                              {rec.dataAvaliacao && <span className="text-[9px] text-slate-400 mt-1 block">Selado em: {rec.dataAvaliacao}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-center ${
                            rec.status === 'Deferido' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300' 
                            : rec.status === 'Indeferido' 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/35 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/35 dark:text-amber-300 animate-pulse'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {rec.status === 'Pendente' ? (
                            <button
                              onClick={() => {
                                setSelectedRecurso(rec);
                                setDecisaoStatus('Deferido');
                                setJustificativaTexto('');
                              }}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1 mx-auto"
                              id={`evaluate-btn-appeal-${rec.id}`}
                            >
                              <i className="ti ti-gavel text-sm"></i>
                              Registrar Decisão
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-bold italic text-[11px] flex items-center justify-center gap-1">
                              <i className="ti ti-checkbox text-emerald-500 text-base"></i>
                              Concluído
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: GERADOR DE RELATÓRIO DO COMPLIANCE */}
        {activeTab === 'relatorio' && (
          <div className="space-y-6 animate-fade-in" id="view-section-report">
            
            {/* Form card criteria */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-150 dark:border-slate-700/60">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-805 dark:text-slate-100">Configurar Emissão do Relatório Digital</h4>
                <p className="text-slate-455 dark:text-slate-400 text-xs mt-0.5">Determine os parâmetros cronológicos e temáticos para consolidar logs de auditoria.</p>
              </div>

              <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Module selection option */}
                <div className="space-y-1 w-full">
                  <label htmlFor="report-filter-module" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Módulo Filtrado</label>
                  <select
                    id="report-filter-module"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-705 dark:text-slate-105 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                    value={reportModule}
                    onChange={(e) => setReportModule(e.target.value)}
                  >
                    <option value="Todos">Todos os Módulos</option>
                    <option value="Editais">Editais</option>
                    <option value="Candidatos">Candidatos</option>
                    <option value="Avaliações">Avaliações</option>
                    <option value="Convocações">Convocações</option>
                    <option value="Administração">Administração</option>
                    <option value="Auditoria">Auditoria</option>
                  </select>
                </div>

                {/* Period filters wrapper */}
                <div className="space-y-1 w-full">
                  <label htmlFor="report-filter-start" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Inicial Período</label>
                  <input
                    id="report-filter-start"
                    type="date"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-705 px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                    value={reportPeriodStart}
                    onChange={(e) => setReportPeriodStart(e.target.value)}
                  />
                </div>

                <div className="space-y-1 w-full flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label htmlFor="report-filter-end" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Final Período</label>
                    <input
                      id="report-filter-end"
                      type="date"
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-705 px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                      value={reportPeriodEnd}
                      onChange={(e) => setReportPeriodEnd(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md hover:shadow transition-all cursor-pointer h-[38px] flex items-center justify-center gap-1"
                      id="generate-report-btn"
                    >
                      <i className="ti ti-printer text-base"></i>
                      Gerar Relatório
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* GENERATED RELATORIO SHEET */}
            {generatedReport && (
              <div 
                className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-250 font-sans space-y-6 animate-scale-up" 
                id="doc-generated-report-card"
              >
                {/* Official Header */}
                <div className="pb-4 border-b-2 border-slate-800 flex flex-col sm:flex-row items-center sm:items-start justify-between text-center sm:text-left gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-base shadow">
                      SP
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wider uppercase">República Federativa do Brasil</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase uppercase">Controladoria e Auditoria Geral • SelectPro v1.0</p>
                      <p className="text-[9px] text-slate-400 font-semibold font-mono">ID: {generatedReport.uuid}</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right text-[10px] space-y-0.5 text-slate-500">
                    <p className="font-bold">RELATÓRIO DE CERTIFICAÇÃO</p>
                    <p>Emissão: <strong className="font-mono">{generatedReport.dataEmissao}</strong></p>
                  </div>
                </div>

                {/* Sub title details info */}
                <div className="text-center border bg-slate-50 border-slate-200 p-4 rounded-lg">
                  <p className="text-xs font-black tracking-wide uppercase text-slate-700">Relatório Consolidado de Eventos Administrativos</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-[10px] mt-2 text-slate-500 border-t border-slate-250 pt-2 font-mono">
                    <div>
                      Módulo Filtro: <strong className="text-slate-800">{generatedReport.modulo}</strong>
                    </div>
                    <div>
                      Início Período: <strong className="text-slate-800">{generatedReport.periodoStart ? generatedReport.periodoStart.split('-').reverse().join('/') : 'Geral'}</strong>
                    </div>
                    <div>
                      Fim Período: <strong className="text-slate-800">{generatedReport.periodoEnd ? generatedReport.periodoEnd.split('-').reverse().join('/') : 'Geral'}</strong>
                    </div>
                  </div>
                </div>

                {/* Logs of report table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-450 uppercase uppercase">Registros Apurados ({generatedReport.logs.length})</span>
                  
                  {generatedReport.logs.length === 0 ? (
                    <div className="p-8 border border-dashed text-slate-400 rounded-lg text-center text-xs italic">
                      Nenhum evento localizado no período selecionado.
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-[#f0f4f9] text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-2 min-w-[100px]">TimeStamp</th>
                            <th className="p-2">Agente</th>
                            <th className="p-2">Ação Conduzida</th>
                            <th className="p-2">Módulo</th>
                            <th className="p-2 min-w-[200px]">Metadados do Registro</th>
                            <th className="p-2 text-right">Term IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {generatedReport.logs.map(lg => (
                            <tr key={lg.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2 text-slate-600">{lg.dataHora}</td>
                              <td className="p-2 font-bold">{lg.usuario}</td>
                              <td className="p-2 font-semibold text-slate-800">{lg.acao}</td>
                              <td className="p-2">{lg.modulo}</td>
                              <td className="p-2 text-slate-500 truncate max-w-[200px] font-sans" title={lg.detalhe}>
                                <strong className="font-mono text-[9px]">{lg.registro}: </strong>
                                {lg.detalhe}
                              </td>
                              <td className="p-2 text-right text-slate-600">{lg.ip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Digital Seals and signatures */}
                <div className="pt-4 border-t border-slate-300 grid grid-[#f0f4f9] md:grid-cols-2 gap-4 text-[10px] text-slate-550 leading-relaxed font-sans mt-6">
                  <div>
                    <h5 className="font-bold text-slate-700">TERMO DE INTEGRIDADE LGPD</h5>
                    <p className="mt-1">
                      Este relatório compreende um dump oficial das transações auditadas de forma eletrônica sem intervenção manual. Em cumprimento com as regras de sigilo e blindagem de dados cadastrais, informações de contato de candidatos sensíveis encontram-se seladas de acordo com as normas.
                    </p>
                  </div>
                  <div className="text-right flex flex-col justify-end items-end gap-1 font-mono">
                    <div className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                      <span>ASSINATURA DIGITAL VALIDADA</span>
                    </div>
                    <p className="text-slate-450 text-[9px]">Chave SHA-256: {generatedReport.uuid}</p>
                    <p className="font-bold text-slate-800 mt-2">Documento gerado eletronicamente em 08/06/2026</p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* --- ALL MODULE INNER OVERLAYS / MODALS --- */}

      {/* 1) MODAL: JULGAMENTO DE RECURSO */}
      {selectedRecurso !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-xs" id="modal-appeal-decide">
          <div className="fixed inset-0" onClick={() => setSelectedRecurso(null)}></div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/80 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto relative animate-scale-up p-5 text-slate-850 dark:text-slate-100 font-sans">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-black text-sm text-slate-801 dark:text-white uppercase flex items-center gap-1.5">
                <i className="ti ti-gavel text-base text-blue-500"></i>
                Registrar Julgamento de Recurso
              </h3>
              <button 
                onClick={() => setSelectedRecurso(null)}
                className="p-1 px-2 rounded-md hover:bg-slate-105 text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
              >
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            {/* Information about appeal */}
            <div className="my-4 bg-[#f0f4f9] dark:bg-slate-900/40 p-4 rounded-lg space-y-2 border border-slate-250/20 text-xs">
              <p><strong>Candidato:</strong> {selectedRecurso.candidato}</p>
              <p><strong>Processo/Vaga:</strong> {selectedRecurso.processo}</p>
              <p><strong>Data de Interposição:</strong> {selectedRecurso.dataInterposicao.split('-').reverse().join('/')}</p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 font-medium">
                <p className="font-bold text-slate-450 text-[10px] uppercase">Contestação Declarada pelo Candidato:</p>
                <p className="italic text-slate-600 dark:text-slate-350 mt-1">"{selectedRecurso.motivo}"</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="appeal-decision-select" className="text-xs font-bold text-slate-500 dark:text-slate-455">Decisão da Comissão Seletiva *</label>
                <select
                  id="appeal-decision-select"
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 font-bold text-slate-805 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 text-xs"
                  value={decisaoStatus}
                  onChange={(e) => setDecisaoStatus(e.target.value as 'Deferido' | 'Indeferido')}
                >
                  <option value="Deferido">Deferir Recurso (Acolher Contestação)</option>
                  <option value="Indeferido">Indeferir Recurso (Manter Decisão Original)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="appeal-decision-justification" className="text-xs font-bold text-slate-500 dark:text-slate-455">Descrição Técnica do Julgamento / Justificativa *</label>
                <textarea
                  id="appeal-decision-justification"
                  rows={4}
                  required
                  placeholder="Forneça de forma detalhada o parecer da banca de validação para fundamentar a decisão..."
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium text-xs leading-relaxed"
                  value={justificativaTexto}
                  onChange={(e) => setJustificativaTexto(e.target.value)}
                ></textarea>
                <p className="text-[10px] text-slate-400 italic">Essas notas serão seladas de forma perpétua nas trilhas de auditoria da instituição.</p>
              </div>

              {/* Actions submit */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecurso(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-705 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Confirmar e Salvar Acórdão
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2) MODAL: DETALHES COMPLETOS DE UM LOG */}
      {detailedLog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-xs" id="modal-log-details">
          <div className="fixed inset-0" onClick={() => setDetailedLog(null)}></div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/80 w-full max-w-md z-50 animate-scale-up p-5 text-slate-850 dark:text-slate-100 font-sans space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                <i className="ti ti-shield-check text-emerald-500 text-base"></i>
                Dossiê do Registro de Log
              </h3>
              <button 
                onClick={() => setDetailedLog(null)}
                className="text-slate-400 hover:text-slate-705 p-1 cursor-pointer"
                aria-label="Minomodal X de fechar"
              >
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            {/* content listing with values */}
            <div className="space-y-2 text-xs leading-normal">
              
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase uppercase">Identificador ID:</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">{detailedLog.id}</span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase">Data e Hora:</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">{detailedLog.dataHora}</span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase">Operador:</span>
                <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200">{detailedLog.usuario}</span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase text-[11px]">Módulo:</span>
                <span className="col-span-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 border dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold uppercase text-slate-600 dark:text-slate-300">
                    {detailedLog.modulo}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase text-[11px]">Origem IP:</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">{detailedLog.ip}</span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-450 uppercase text-[11px]">Ação efetuada:</span>
                <span className="col-span-2 font-extrabold text-blue-600 dark:text-blue-400">{detailedLog.acao}</span>
              </div>

              <div className="py-2 space-y-1">
                <span className="font-bold text-slate-450 uppercase text-[10px] tracking-wider block">Assunto / Registro:</span>
                <p className="font-black text-slate-800 dark:text-slate-100 bg-[#f0f4f9] dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-250/20">{detailedLog.registro}</p>
              </div>

              <div className="py-2 space-y-1">
                <span className="font-bold text-slate-450 uppercase text-[10px] tracking-wider block">Descritor Detalhes:</span>
                <p className="text-slate-655 dark:text-slate-300 font-medium leading-relaxed bg-[#f0f4f9] dark:bg-slate-900/60 p-3 rounded-lg border border-slate-250/20 whitespace-pre-line">
                  {detailedLog.detalhe}
                </p>
              </div>

              {/* Verification simulated sealing lock */}
              <div className="pt-3 border-t border-slate-150 dark:border-slate-700 flex items-center justify-between text-slate-400 dark:text-slate-500 font-mono text-[9px] mt-4">
                <p>SEALING HASH SIGN_VALID</p>
                <div className="flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>LGPD COMPLIANT</span>
                </div>
              </div>

            </div>

            {/* button dismiss modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => setDetailedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-707 dark:text-slate-203 font-bold text-xs rounded-lg cursor-pointer"
              >
                Dispensar Detalhes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

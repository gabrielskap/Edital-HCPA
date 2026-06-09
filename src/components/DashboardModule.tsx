import React, { useState, useEffect, useRef } from 'react';
import { Edital, Candidato, Convocacao, AuditLog } from '../types';

interface DashboardProps {
  editais: Edital[];
  candidatos: Candidato[];
  convocacoes: Convocacao[];
  logs: AuditLog[];
  onNavigate: (module: any) => void;
}

export default function DashboardModule({ editais, candidatos, convocacoes, logs, onNavigate }: DashboardProps) {
  // Modal state for active edital details
  const [selectedEdital, setSelectedEdital] = useState<Edital | null>(null);

  // States to keep track of CDN script load and theme alignment
  const [chartJsLoaded, setChartJsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Canvas Refs for chart rendering
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances references to ensure correct cleanup/rebuilds
  const barChartInstanceRef = useRef<any>(null);
  const doughnutChartInstanceRef = useRef<any>(null);

  // 1. Calculations
  const activeEditaisCount = editais.filter(e => e.status === 'Em Andamento').length;
  const totalCandidatosCount = candidatos.length;
  const pendingConvocationsCount = convocacoes.filter(c => c.status === 'Publicada').length;
  const closedEditaisCount = editais.filter(e => e.status === 'Encerrado').length;

  // 2. Track dark mode class mutations to adjust chart colors in real-time
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 3. Robust Loading of Chart.js CDN with single-script safety checks
  useEffect(() => {
    let isMounted = true;

    if ((window as any).Chart) {
      setChartJsLoaded(true);
      return;
    }

    const id = 'chartjs-cdn-script';
    let script = document.getElementById(id) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      if (isMounted) setChartJsLoaded(true);
    };

    script.addEventListener('load', handleLoad);

    return () => {
      isMounted = false;
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  // 4. Chart Rendering/Updates on changes of data, load state, and active theme
  useEffect(() => {
    if (!chartJsLoaded) return;

    const Chart = (window as any).Chart;
    if (!Chart) return;

    // Responsive color styles suited for the current active theme
    const textColor = isDark ? '#cbd5e1' : '#475569'; // slate-300 vs slate-600
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.07)';

    // --- CHART A: Horizontal Bar - Inscrições por Edital ---
    if (barCanvasRef.current) {
      if (barChartInstanceRef.current) {
        barChartInstanceRef.current.destroy();
      }

      // Prepare labels (numero) and values (inscritos)
      const barLabels = editais.map(e => `Edital ${e.numero}`);
      const barData = editais.map(e => e.inscritos);
      barChartInstanceRef.current = new Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Inscritos',
            data: barData,
            backgroundColor: 'rgba(26, 107, 58, 0.75)',
            borderColor: 'rgba(26, 107, 58, 1)',
            hoverBackgroundColor: 'rgba(26, 107, 58, 0.9)',
            hoverBorderColor: 'rgba(26, 107, 58, 1)',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 16,
            maxBarThickness: 24,
          }]
        },
        options: {
          indexAxis: 'y', // Makes the bar chart horizontal
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#e2e8f0',
              padding: 10,
              cornerRadius: 6,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 }
            }
          },
          scales: {
            x: {
              grid: {
                color: gridColor,
              },
              ticks: {
                color: textColor,
                font: { size: 10 }
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                color: textColor,
                font: { size: 10, weight: 'bold' }
              }
            }
          }
        }
      });
    }

    // --- CHART B: Doughnut - Status das Inscrições ---
    if (doughnutCanvasRef.current) {
      if (doughnutChartInstanceRef.current) {
        doughnutChartInstanceRef.current.destroy();
      }

      doughnutChartInstanceRef.current = new Chart(doughnutCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Homologadas', 'Pendentes', 'Indeferidas'],
          datasets: [{
            data: [72, 18, 10],
            backgroundColor: [
              'rgba(26, 107, 58, 0.8)',
              'rgba(217, 119, 6, 0.8)',
              'rgba(220, 38, 38, 0.8)'
            ],
            hoverBackgroundColor: [
              'rgba(26, 107, 58, 0.95)',
              'rgba(217, 119, 6, 0.95)',
              'rgba(220, 38, 38, 0.95)'
            ],
            borderWidth: 1.5,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: textColor,
                boxWidth: 10,
                padding: 12,
                font: { size: 11, weight: 'bold' }
              }
            },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#0f172a',
              padding: 10,
              cornerRadius: 6,
              callbacks: {
                label: (context: any) => ` ${context.label}: ${context.raw}%`
              }
            }
          },
          cutout: '62%'
        }
      });
    }

    // Cleanup instances when component unmounts or variables trigger rebuild
    return () => {
      if (barChartInstanceRef.current) {
        barChartInstanceRef.current.destroy();
        barChartInstanceRef.current = null;
      }
      if (doughnutChartInstanceRef.current) {
        doughnutChartInstanceRef.current.destroy();
        doughnutChartInstanceRef.current = null;
      }
    };
  }, [chartJsLoaded, editais, isDark]);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-module">
      {/* Upper Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Visão Geral</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rastreabilidade, contingência e inteligência em tempo real para concursos públicos.</p>
        </div>
        <div className="mt-4 md:mt-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
          Painel Monitorado de Processos
        </div>
      </div>

      {/* LINHA 1: Cards de métricas (4 colunas) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Estatísticas Rápidas">
        
        {/* Card 1: Total de Editais Ativos */}
        <div className="sp-metric-card sp-metric-card-blue">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Editais Ativos</p>
              <h3 className="sp-metric-value mt-1">{activeEditaisCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <i className="ti ti-file-text text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="sp-metric-variation-positive flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
              <i className="ti ti-trending-up"></i> +12%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">vs mês anterior</span>
          </div>
        </div>

        {/* Card 2: Total de Candidatos */}
        <div className="sp-metric-card sp-metric-card-emerald">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Total de Candidatos</p>
              <h3 className="sp-metric-value mt-1">{totalCandidatosCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <i className="ti ti-users text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="sp-metric-variation-positive flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
              <i className="ti ti-trending-up"></i> +12%
            </span>
            <span className="text-[10px] text-slate-400 font-medium font-sans">vs mês anterior</span>
          </div>
        </div>

        {/* Card 3: Convocações Pendentes */}
        <div className="sp-metric-card sp-metric-card-amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Convocações Pendentes</p>
              <h3 className="sp-metric-value mt-1">{pendingConvocationsCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <i className="ti ti-bell text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="sp-metric-variation-positive flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
              <i className="ti ti-trending-up"></i> +12%
            </span>
            <span className="text-[10px] text-slate-400 font-medium font-sans">vs mês anterior</span>
          </div>
        </div>

        {/* Card 4: Processos Encerrados */}
        <div className="sp-metric-card sp-metric-card-slate">
          <div className="flex items-start justify-between">
            <div>
              <p className="sp-metric-label">Processos Encerrados</p>
              <h3 className="sp-metric-value mt-1">{closedEditaisCount}</h3>
            </div>
            <div className="sp-metric-icon">
              <i className="ti ti-check text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="sp-metric-variation-positive flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
              <i className="ti ti-trending-up"></i> +12%
            </span>
            <span className="text-[10px] text-slate-400 font-medium font-sans">vs mês anterior</span>
          </div>
        </div>

      </section>

      {/* LINHA 2: Gráficos (usando Chart.js via CDN) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Análise e Gráficos do Sistema">
        
        {/* Card Gráfico 1: Inscrições por Edital */}
        <div className="sp-card flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-50 dark:border-slate-700/50 mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Inscrições por Edital
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Visão do montante acumulado de inscritos homologados ou ativos por edital.</p>
          </div>
          <div className="relative h-64 w-full flex items-center justify-center">
            {chartJsLoaded ? (
              <canvas ref={barCanvasRef} id="bar-chart-inscritos"></canvas>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-slate-250 border-t-[#22c55e] animate-spin"></div>
                <span className="text-xs text-slate-400 font-medium">Carregando Canvas...</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Gráfico 2: Distribuição por Modalidade */}
        <div className="sp-card flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-50 dark:border-slate-700/50 mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Distribuição por Modalidade
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Percentual de inscritos segmentados por políticas afirmativas e cotas de ampla concorrência.</p>
          </div>
          <div className="relative h-64 w-full flex items-center justify-center">
            {chartJsLoaded ? (
              <canvas ref={doughnutCanvasRef} id="doughnut-chart-modalidades"></canvas>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-slate-250 border-t-[#22c55e] animate-spin"></div>
                <span className="text-xs text-slate-400 font-medium">Carregando Canvas...</span>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* LINHA 3 & COLUNA LATERAL DE ALERTAS: Grid Layout para Tabela de Processos Recentes e Alertas */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Detalhes de Processos e Avisos de Segurança">
        
        {/* Tabela de processos recentes (ocupa 2 colunas no desktop) */}
        <div className="sp-card lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-50 dark:border-slate-700/50 mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-705 dark:text-slate-200">Processos Seletivos Recentes</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Visão consolidada de editais sob governança ativa do sistema.</p>
              </div>
              <button 
                onClick={() => onNavigate('editais')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                Ver módulo →
              </button>
            </div>

            <div className="sp-table-container">
              <table className="sp-table" id="table-processos-recentes">
                <thead>
                  <tr>
                    <th scope="col">Nº Edital</th>
                    <th scope="col">Instituição</th>
                    <th scope="col">Vagas</th>
                    <th scope="col">Inscritos</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {editais.map((edital) => {
                    return (
                      <tr key={edital.id}>
                        <td className="font-mono font-bold text-slate-900 dark:text-slate-100">{edital.numero}</td>
                        <td className="font-semibold">{edital.instituicao}</td>
                        <td className="font-mono">{edital.vagas}</td>
                        <td className="font-mono text-slate-500 dark:text-slate-400">{edital.inscritos}</td>
                        <td>
                          <span className={`sp-badge ${
                            edital.status === "Em Andamento" 
                              ? "sp-badge-em-andamento"
                              : edital.status === "Encerrado"
                              ? "sp-badge-encerrado"
                              : edital.status === "Convocação"
                              ? "sp-badge-convocacao"
                              : "sp-badge-recurso"
                          }`}>
                            {edital.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => setSelectedEdital(edital)}
                            className="sp-btn sp-btn-secondary py-1 px-2.5"
                            title={`Ver detalhes do Edital ${edital.numero}`}
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 mt-4 text-[10px] text-slate-400">
            * Dados autogerados com persistência em cache e monitoramento estrito do comitê estadual.
          </div>
        </div>

        {/* Coluna lateral — Alertas */}
        <div className="sp-card flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-50 dark:border-slate-700/50 mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-705 dark:text-slate-205 flex items-center gap-1.5">
                <i className="ti ti-alert-triangle text-amber-500"></i>
                Alertas Críticos
              </h4>
              <span className="sp-badge sp-badge-recurso">Ativos (3)</span>
            </div>

            {/* List of 3 simulated alerts with warning icon, text, and date/time */}
            <div className="space-y-3.5">
              
              {/* Alert 1 */}
              <div className="bg-[#fefce8] dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded-r-xl transition-all hover:bg-amber-100/30 dark:hover:bg-amber-950/30">
                <div className="flex gap-2.5 items-start">
                  <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                    <i className="ti ti-alert-octagon text-base"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Encerramento de Impugnação</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">
                      O prazo estatutário de impugnação do Edital 01/2026 encerra-se impreterivelmente hoje às 23:59.
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1 w-full block text-right font-medium">Hoje, às 23:59</span>
                  </div>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="bg-[#fefce8] dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded-r-xl transition-all hover:bg-amber-100/30 dark:hover:bg-amber-950/30">
                <div className="flex gap-2.5 items-start">
                  <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                    <i className="ti ti-alert-circle text-base"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ajuste de Banca Auditora</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">
                      Nova portaria vinculou membros avaliadores preliminares de títulos para monitorar o Edital 03/2026.
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1 w-full block text-right font-medium">08/06/2026 às 18:30</span>
                  </div>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="bg-[#fefce8] dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded-r-xl transition-all hover:bg-amber-100/30 dark:hover:bg-amber-950/30">
                <div className="flex gap-2.5 items-start">
                  <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                    <i className="ti ti-alert-triangle text-base"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Candidatos Pendentes</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">
                      Atenção: Existem 45 candidatos que permanecem sob análise pendente de homologação há mais de 48 horas.
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1 w-full block text-right font-medium">08/06/2026 às 14:15</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-700/50 leading-tight">
            Consulte a assessoria jurídica para prorrogações extraordinárias de editais públicos.
          </p>
        </div>

      </section>

      {/* --- DASHBOARD-SPECIFIC MULTI-MODAL DETAILS BACKDROP --- */}
      {selectedEdital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="dashboard-details-modal">
          {/* Click Backdrop to close */}
          <div className="absolute inset-0" onClick={() => setSelectedEdital(null)}></div>
          
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700/50 w-full max-w-lg z-55 overflow-hidden animate-scale-up text-xs text-slate-700 dark:text-slate-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-750 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Dossiê de Processo Seletivo</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">Edital {selectedEdital.numero}</h4>
              </div>
              <button 
                onClick={() => setSelectedEdital(null)} 
                className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-550 hover:bg-slate-200 dark:hover:bg-slate-600"
                title="Fechar modal"
              >
                <i className="ti ti-x text-md"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 font-sans">
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Título / Objeto</span>
                <p className="font-bold text-slate-850 dark:text-slate-100 text-xs py-1 px-2 rounded-md bg-slate-50 dark:bg-slate-900 leading-snug">
                  {selectedEdital.titulo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Instituição Contratante</span>
                  <p className="font-bold text-slate-800 dark:text-white text-xs">{selectedEdital.instituicao}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Banca Realizadora</span>
                  <p className="font-bold text-slate-800 dark:text-white text-xs">{selectedEdital.realizadora}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-t border-b border-slate-100 dark:border-slate-700/50">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Vagas totais</span>
                  <span className="font-mono text-base font-black text-slate-800 dark:text-slate-105">{selectedEdital.vagas}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Total Inscritos</span>
                  <span className="font-mono text-base font-black text-slate-800 dark:text-slate-105">{selectedEdital.inscritos}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-55/10 text-blue-800 border-blue-200 dark:text-blue-300 dark:border-blue-800">
                    {selectedEdital.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Abertura</span>
                  <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {selectedEdital.abertura.split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Encerramento</span>
                  <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {selectedEdital.encerramento.split('-').reverse().join('/')}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-750 flex justify-end gap-2 bg-slate-50/30 dark:bg-slate-900/10">
              <button 
                onClick={() => setSelectedEdital(null)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

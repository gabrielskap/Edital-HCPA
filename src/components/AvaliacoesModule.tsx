import React from 'react';
import { Candidato, Edital } from '../types';

interface AvaliacoesModuleProps {
  candidatos: Candidato[];
  editais: Edital[];
  onSaveScores: (candidatoId: number, scores: { notaEscrita: number; notaTitulos: number; peso_escrita: number; peso_titulos: number }) => void;
}

export default function AvaliacoesModule({ candidatos, editais, onSaveScores }: AvaliacoesModuleProps) {
  const [selectedEdital, setSelectedEdital] = React.useState(editais[0]?.numero || 'Todos');
  const [activeCandidato, setActiveCandidato] = React.useState<Candidato | null>(null);
  
  // Note inputs state
  const [notaEscrita, setNotaEscrita] = React.useState<number>(0);
  const [notaTitulos, setNotaTitulos] = React.useState<number>(0);
  const [pesoEscrita, setPesoEscrita] = React.useState<number>(6);
  const [pesoTitulos, setPesoTitulos] = React.useState<number>(4);

  // Sync state when active candidate changes
  React.useEffect(() => {
    if (activeCandidato) {
      setNotaEscrita(activeCandidato.notaEscrita);
      setNotaTitulos(activeCandidato.notaTitulos);
      setPesoEscrita(activeCandidato.peso_escrita);
      setPesoTitulos(activeCandidato.peso_titulos);
    }
  }, [activeCandidato]);

  // List of candidates matching the chosen edital
  const filteredCandidatos = candidatos.filter(c => {
    return selectedEdital === 'Todos' || c.edital === selectedEdital;
  });

  const calculateMedia = (esc: number, tit: number, pEsc: number, pTit: number) => {
    const totalP = pEsc + pTit;
    if (totalP === 0) return '0.00';
    return ((esc * pEsc + tit * pTit) / totalP).toFixed(2);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidato) return;
    
    // Save to App State
    onSaveScores(activeCandidato.id, {
      notaEscrita: Number(notaEscrita),
      notaTitulos: Number(notaTitulos),
      peso_escrita: Number(pesoEscrita),
      peso_titulos: Number(pesoTitulos)
    });
    
    // Update local preview state
    setActiveCandidato({
      ...activeCandidato,
      notaEscrita: Number(notaEscrita),
      notaTitulos: Number(notaTitulos),
      peso_escrita: Number(pesoEscrita),
      peso_titulos: Number(pesoTitulos)
    });
    
    // Auto scroll to top of section as requested
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="avaliacoes-module">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Avaliações e Notas</h1>
          <p className="text-sm text-slate-550 dark:text-slate-400">Inserção de notas da prova escrita, contagem de pontos de títulos e cálculo de média ponderada.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <label htmlFor="eval-edital-select" className="sr-only">Selecione o Edital</label>
          <select
            id="eval-edital-select"
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 px-3 py-2 text-sm font-bold shadow-xs focus:ring-2 focus:ring-blue-500"
            value={selectedEdital}
            onChange={(e) => {
              setSelectedEdital(e.target.value);
              setActiveCandidato(null); // Clear selected candidate
            }}
          >
            <option value="Todos">Todos os Editais</option>
            {editais.map(ed => (
              <option key={ed.id} value={ed.numero}>Edital {ed.numero} - {ed.instituicao}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tabela de Candidatos Filtrada */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/50 lg:col-span-7 overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Candidatos do Edital</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{filteredCandidatos.length} inscritos</span>
          </div>
          
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left text-xs" id="avaliacoes-table">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 font-bold uppercase py-2">
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <th scope="col" className="p-3">Candidato</th>
                  <th scope="col" className="p-3">Prov. Escrita</th>
                  <th scope="col" className="p-3">Títulos</th>
                  <th scope="col" className="p-3">Média</th>
                  <th scope="col" className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredCandidatos.map(c => {
                  const media = calculateMedia(c.notaEscrita, c.notaTitulos, c.peso_escrita, c.peso_titulos);
                  const isCurrent = activeCandidato?.id === c.id;
                  
                  return (
                    <tr 
                      key={c.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/10 cursor-pointer ${isCurrent ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => setActiveCandidato(c)}
                    >
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-205">
                        <p>{c.nome}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-450 font-normal">Nº {c.inscricao} • {c.cargo}</p>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.notaEscrita.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">(P{c.peso_escrita})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.notaTitulos.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">(P{c.peso_titulos})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {media}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCandidato(c);
                          }}
                          className={`px-2 py-1 text-[11px] font-bold rounded ${
                            isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          } cursor-pointer`}
                          aria-label={`Editar notas de ${c.nome}`}
                        >
                          Lançar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-440">
            Selecione uma linha ou clique em "Lançar" para editar as notas de forma integrada.
          </div>
        </div>

        {/* Formulário de Editor de Notas */}
        <div className="lg:col-span-5">
          {activeCandidato === null ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/60 p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <i className="ti ti-clipboard-text text-4xl text-slate-400 dark:text-slate-500 mb-3 animate-pulse"></i>
              <p className="font-bold text-slate-655 dark:text-slate-350 text-sm">Nenhum candidato selecionado</p>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
                Clique em um candidato da tabela para abrir o lançador de notas.
              </p>
            </div>
          ) : (
            <form 
              onSubmit={handleApply}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-150 dark:border-slate-700/50 p-6 space-y-5 animate-fade-in"
            >
              <div className="border-b border-slate-100 dark:border-slate-700/50 pb-3 flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Lançador de Notas</p>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-105 mt-0.5">{activeCandidato.nome}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargo: {activeCandidato.cargo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCandidato(null)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 rounded-full"
                  aria-label="Minimizar lançador de notas"
                >
                  <i className="ti ti-x text-lg"></i>
                </button>
              </div>

              {/* Média Ponderada Visual */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/50 shadow-inner">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase dark:text-slate-400">Média Calculada (Parcial)</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Peso Escrita: {pesoEscrita} | Peso Títulos: {pesoTitulos}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {calculateMedia(notaEscrita, notaTitulos, pesoEscrita, pesoTitulos)}
                  </span>
                </div>
              </div>

              {/* Campo Nota Escrita */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="input-nota-escrita" className="font-bold text-slate-700 dark:text-slate-350">Nota da Prova Escrita (0 a 10)</label>
                  <span className="font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    Val: {Number(notaEscrita).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="input-nota-escrita"
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    className="flex-1 accent-[#2563eb]"
                    value={notaEscrita}
                    onChange={(e) => setNotaEscrita(Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-250 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    value={notaEscrita}
                    onChange={(e) => {
                      const v = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                      setNotaEscrita(v);
                    }}
                    aria-label="Nota Escrita digitação rápida"
                  />
                </div>
              </div>

              {/* Campo Nota Títulos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="input-nota-titulos" className="font-bold text-slate-700 dark:text-slate-350">Nota de Títulos (0 a 10)</label>
                  <span className="font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    Val: {Number(notaTitulos).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="input-nota-titulos"
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    className="flex-1 accent-[#2563eb]"
                    value={notaTitulos}
                    onChange={(e) => setNotaTitulos(Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-250 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    value={notaTitulos}
                    onChange={(e) => {
                      const v = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                      setNotaTitulos(v);
                    }}
                    aria-label="Nota Títulos digitação rápida"
                  />
                </div>
              </div>

              {/* Grid de Pesos de Avaliação */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <div className="space-y-1">
                  <label htmlFor="weight-written" className="text-xs font-bold text-slate-500 dark:text-slate-400">Peso Escrita</label>
                  <input
                    id="weight-written"
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold font-mono py-1.5 px-3 rounded-lg"
                    value={pesoEscrita}
                    onChange={(e) => setPesoEscrita(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="weight-titles" className="text-xs font-bold text-slate-500 dark:text-slate-400">Peso Títulos</label>
                  <input
                    id="weight-titles"
                    type="number"
                    min="0"
                    max="10"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold font-mono py-1.5 px-3 rounded-lg"
                    value={pesoTitulos}
                    onChange={(e) => setPesoTitulos(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Botões do Painel */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActiveCandidato(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 text-xs rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-bold shadow-md cursor-pointer"
                  aria-label="Registrar Notas da Sessão"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

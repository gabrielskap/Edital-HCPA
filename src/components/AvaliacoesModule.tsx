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
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [notaEscrita, setNotaEscrita] = React.useState(0);
  const [notaTitulos, setNotaTitulos] = React.useState(0);
  const [pesoEscrita, setPesoEscrita] = React.useState(6);
  const [pesoTitulos, setPesoTitulos] = React.useState(4);

  React.useEffect(() => {
    if (activeCandidato) {
      setNotaEscrita(activeCandidato.notaEscrita);
      setNotaTitulos(activeCandidato.notaTitulos);
      setPesoEscrita(activeCandidato.peso_escrita);
      setPesoTitulos(activeCandidato.peso_titulos);
    }
  }, [activeCandidato]);

  React.useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const filteredCandidatos = candidatos.filter(c =>
    selectedEdital === 'Todos' || c.edital === selectedEdital
  );

  const calcMedia = (esc: number, tit: number, pEsc: number, pTit: number) => {
    const total = pEsc + pTit;
    return total === 0 ? 0 : (esc * pEsc + tit * pTit) / total;
  };

  const mediaBadgeClass = (val: number) =>
    val >= 7
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : val >= 5
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      : val > 0
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  const scoreColor = (val: number) =>
    val >= 7 ? 'text-emerald-600' : val >= 5 ? 'text-amber-600' : 'text-rose-500';

  const openModal = (c: Candidato) => {
    setActiveCandidato(c);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveCandidato(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidato) return;
    onSaveScores(activeCandidato.id, {
      notaEscrita: Number(notaEscrita),
      notaTitulos: Number(notaTitulos),
      peso_escrita: Number(pesoEscrita),
      peso_titulos: Number(pesoTitulos),
    });
    closeModal();
  };

  const liveMedia = calcMedia(notaEscrita, notaTitulos, pesoEscrita, pesoTitulos);

  return (
    <div className="space-y-5 animate-fade-in" id="avaliacoes-module">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Avaliações e Notas</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Lançamento de notas e cálculo de média ponderada por candidato.
          </p>
        </div>
        <select
          id="eval-edital-select"
          aria-label="Selecione o Edital"
          className="w-full sm:w-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={selectedEdital}
          onChange={e => setSelectedEdital(e.target.value)}
        >
          <option value="Todos">Todos os Editais</option>
          {editais.map(ed => (
            <option key={ed.id} value={ed.numero}>Edital {ed.numero} – {ed.instituicao}</option>
          ))}
        </select>
      </div>

      {/* ── Tabela de candidatos ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-150 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-700/60 text-slate-450 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th scope="col" className="p-4">Candidato</th>
                <th scope="col" className="p-4 hidden md:table-cell">Cargo</th>
                <th scope="col" className="p-4 text-center">Prov. Escrita</th>
                <th scope="col" className="p-4 text-center hidden sm:table-cell">Títulos</th>
                <th scope="col" className="p-4 text-center">Média</th>
                <th scope="col" className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
              {filteredCandidatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                    Nenhum candidato encontrado para o edital selecionado.
                  </td>
                </tr>
              ) : (
                filteredCandidatos.map(c => {
                  const media = calcMedia(c.notaEscrita, c.notaTitulos, c.peso_escrita, c.peso_titulos);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/10 transition-colors cursor-pointer"
                      onClick={() => openModal(c)}
                    >
                      {/* Nome */}
                      <td className="p-4 font-bold text-slate-850 dark:text-slate-100">
                        {c.nome}
                        <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                          Nº {c.inscricao}
                        </p>
                      </td>

                      {/* Cargo */}
                      <td className="p-4 hidden md:table-cell">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">
                          {c.cargo}
                        </span>
                      </td>

                      {/* Prova Escrita */}
                      <td className="p-4 text-center font-mono font-semibold text-slate-650 dark:text-slate-300">
                        {c.notaEscrita.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">(P{c.peso_escrita})</span>
                      </td>

                      {/* Títulos */}
                      <td className="p-4 text-center font-mono font-semibold text-slate-650 dark:text-slate-300 hidden sm:table-cell">
                        {c.notaTitulos.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">(P{c.peso_titulos})</span>
                      </td>

                      {/* Média badge */}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] font-mono ${mediaBadgeClass(media)}`}>
                          {media.toFixed(2)}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); openModal(c); }}
                          className="text-slate-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--color-primary-mid)] p-1 rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={`Lançar notas de ${c.nome}`}
                          aria-label={`Lançar notas de ${c.nome}`}
                        >
                          <i className="ti ti-edit text-base"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        {filteredCandidatos.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-900/30 text-[11px] text-slate-400 dark:text-slate-500">
            {filteredCandidatos.length} candidato{filteredCandidatos.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {filteredCandidatos.filter(c => c.notaEscrita > 0 || c.notaTitulos > 0).length} avaliados
            </span>
            &nbsp;·&nbsp;
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {filteredCandidatos.filter(c => calcMedia(c.notaEscrita, c.notaTitulos, c.peso_escrita, c.peso_titulos) >= 6).length} aprovados (≥ 6.0)
            </span>
          </div>
        )}
      </div>

      {/* ── Modal: Lançador de Notas ── */}
      {isModalOpen && activeCandidato !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="fixed inset-0" onClick={closeModal} />

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-205 dark:border-slate-700/60 w-full max-w-md z-55 overflow-hidden animate-scale-up text-xs font-sans">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <i className="ti ti-clipboard-text text-[var(--color-primary)]"></i>
                Lançador de Notas
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Fechar"
              >
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Candidato (read-only) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                  Candidato
                </label>
                <div className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold">
                  {activeCandidato.nome}
                  <span className="text-slate-400 font-normal ml-2 text-[11px]">— {activeCandidato.cargo}</span>
                </div>
              </div>

              {/* Nota Escrita */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-nota-escrita" className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                    Prova Escrita (0 a 10)
                  </label>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {Number(notaEscrita).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="modal-nota-escrita"
                    type="range" min="0" max="10" step="0.1"
                    className="flex-1 accent-[var(--color-primary)]"
                    value={notaEscrita}
                    onChange={e => setNotaEscrita(Number(e.target.value))}
                  />
                  <input
                    type="number" min="0" max="10" step="0.1"
                    className="w-16 border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={notaEscrita}
                    onChange={e => setNotaEscrita(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                    aria-label="Valor nota escrita"
                  />
                </div>
              </div>

              {/* Nota Títulos */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-nota-titulos" className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                    Nota de Títulos (0 a 10)
                  </label>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {Number(notaTitulos).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="modal-nota-titulos"
                    type="range" min="0" max="10" step="0.1"
                    className="flex-1 accent-[var(--color-primary)]"
                    value={notaTitulos}
                    onChange={e => setNotaTitulos(Number(e.target.value))}
                  />
                  <input
                    type="number" min="0" max="10" step="0.1"
                    className="w-16 border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={notaTitulos}
                    onChange={e => setNotaTitulos(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                    aria-label="Valor nota títulos"
                  />
                </div>
              </div>

              {/* Pesos */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="modal-peso-escrita" className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                    Peso Escrita
                  </label>
                  <input
                    id="modal-peso-escrita"
                    type="number" min="1" max="10"
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-bold font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={pesoEscrita}
                    onChange={e => setPesoEscrita(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="modal-peso-titulos" className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                    Peso Títulos
                  </label>
                  <input
                    id="modal-peso-titulos"
                    type="number" min="0" max="10"
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-bold font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={pesoTitulos}
                    onChange={e => setPesoTitulos(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Média calculada */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-150 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                  Média Calculada (Parcial)
                </span>
                <span className={`text-lg font-black font-mono ${scoreColor(liveMedia)}`}>
                  {liveMedia.toFixed(2)}
                </span>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Salvar Nota
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

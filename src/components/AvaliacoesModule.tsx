import React from 'react';
import { Candidato, Edital } from '../types';

interface AvaliacoesModuleProps {
  candidatos: Candidato[];
  editais: Edital[];
  onSaveScores: (candidatoId: number, scores: { notaEscrita: number; notaTitulos: number; peso_escrita: number; peso_titulos: number }) => void;
}

const mediaBadgeClass = (val: number) =>
  val >= 7 ? 'sp-badge sp-badge-success'
  : val >= 5 ? 'sp-badge sp-badge-pendente'
  : val > 0  ? 'sp-badge sp-badge-encerrado'
  : 'sp-badge sp-badge-neutral';

const scoreColor = (val: number) =>
  val >= 7 ? 'text-emerald-600' : val >= 5 ? 'text-amber-600' : 'text-rose-500';

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

  const openModal = (c: Candidato) => { setActiveCandidato(c); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setActiveCandidato(null); };

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

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 py-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <i className="ti ti-clipboard-text text-[var(--color-primary)]"></i>
            Avaliações e Notas
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Lançamento de notas e cálculo de média ponderada por candidato.
          </p>
        </div>
        <select
          id="eval-edital-select"
          aria-label="Selecione o Edital"
          value={selectedEdital}
          onChange={e => setSelectedEdital(e.target.value)}
          className="w-full sm:w-auto sp-input"
          style={{ maxWidth: '280px' }}
        >
          <option value="Todos">Todos os Editais</option>
          {editais.map(ed => (
            <option key={ed.id} value={ed.numero}>Edital {ed.numero} – {ed.instituicao}</option>
          ))}
        </select>
      </div>

      {/* Tabela de candidatos */}
      <div className="sp-table-container">
        <div className="overflow-x-auto">
          <table className="sp-table" id="table-avaliacao-notas">
            <thead>
              <tr>
                <th scope="col">Candidato</th>
                <th scope="col" className="hidden md:table-cell">Cargo</th>
                <th scope="col" style={{ textAlign: 'center' }}>Prov. Escrita</th>
                <th scope="col" style={{ textAlign: 'center' }} className="hidden sm:table-cell">Títulos</th>
                <th scope="col" style={{ textAlign: 'center' }}>Média</th>
                <th scope="col" style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)] font-bold italic">
                    Nenhum candidato encontrado para o edital selecionado.
                  </td>
                </tr>
              ) : (
                filteredCandidatos.map(c => {
                  const media = calcMedia(c.notaEscrita, c.notaTitulos, c.peso_escrita, c.peso_titulos);
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openModal(c)}>
                      <td className="font-bold text-[var(--color-text-primary)]">
                        {c.nome}
                        <p className="text-[10px] font-normal text-[var(--color-text-muted)] mt-0.5 font-mono">
                          Nº {c.inscricao}
                        </p>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="sp-badge sp-badge-neutral font-mono uppercase">
                          {c.cargo}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="font-mono font-semibold text-[var(--color-text-secondary)]">
                        {c.notaEscrita.toFixed(1)}
                        <span className="text-[10px] font-normal text-[var(--color-text-muted)] ml-0.5">(P{c.peso_escrita})</span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="font-mono font-semibold text-[var(--color-text-secondary)] hidden sm:table-cell">
                        {c.notaTitulos.toFixed(1)}
                        <span className="text-[10px] font-normal text-[var(--color-text-muted)] ml-0.5">(P{c.peso_titulos})</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${mediaBadgeClass(media)} font-mono`}>
                          {media.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); openModal(c); }}
                          className="sp-btn-icon sp-btn-icon-edit"
                          title={`Lançar notas de ${c.nome}`}
                          aria-label={`Lançar notas de ${c.nome}`}
                        >
                          <i className="ti ti-edit text-sm"></i>
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
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] text-[11px] text-[var(--color-text-muted)]">
            {filteredCandidatos.length} candidato{filteredCandidatos.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
            <span className="text-emerald-600 font-semibold">
              {filteredCandidatos.filter(c => c.notaEscrita > 0 || c.notaTitulos > 0).length} avaliados
            </span>
            &nbsp;·&nbsp;
            <span className="font-semibold text-[var(--color-text-primary)]">
              {filteredCandidatos.filter(c => calcMedia(c.notaEscrita, c.notaTitulos, c.peso_escrita, c.peso_titulos) >= 6).length} aprovados (≥ 6.0)
            </span>
          </div>
        )}
      </div>

      {/* Modal: Lançador de Notas */}
      {isModalOpen && activeCandidato !== null && (
        <div className="sp-modal-overlay" id="modal-container-lancador-notas">
          <div className="fixed inset-0" onClick={closeModal} />

          <div className="sp-modal-container" style={{ maxWidth: '460px' }}>

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-clipboard-text" style={{ color: 'var(--color-primary)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Lançador de Notas</h3>
              </div>
              <button type="button" onClick={closeModal} className="sp-modal-close" aria-label="Fechar">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="sp-modal-body space-y-4">

                {/* Candidato (read-only) */}
                <div className="space-y-1.5">
                  <label>Candidato</label>
                  <div className="w-full sp-input font-semibold" style={{ cursor: 'default' }}>
                    {activeCandidato.nome}
                    <span className="text-[var(--color-text-muted)] font-normal ml-2 text-[11px]">
                      — {activeCandidato.cargo}
                    </span>
                  </div>
                </div>

                {/* Nota Escrita */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-nota-escrita">Prova Escrita (0 a 10)</label>
                    <span className="font-mono font-bold text-[var(--color-text-primary)] text-xs">
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
                      className="sp-input font-mono font-bold text-center"
                      style={{ width: '72px' }}
                      value={notaEscrita}
                      onChange={e => setNotaEscrita(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                      aria-label="Valor nota escrita"
                    />
                  </div>
                </div>

                {/* Nota Títulos */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-nota-titulos">Nota de Títulos (0 a 10)</label>
                    <span className="font-mono font-bold text-[var(--color-text-primary)] text-xs">
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
                      className="sp-input font-mono font-bold text-center"
                      style={{ width: '72px' }}
                      value={notaTitulos}
                      onChange={e => setNotaTitulos(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                      aria-label="Valor nota títulos"
                    />
                  </div>
                </div>

                {/* Pesos */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-peso-escrita">Peso Escrita</label>
                    <input
                      id="modal-peso-escrita"
                      type="number" min="1" max="10"
                      className="w-full sp-input font-bold font-mono text-center"
                      value={pesoEscrita}
                      onChange={e => setPesoEscrita(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="modal-peso-titulos">Peso Títulos</label>
                    <input
                      id="modal-peso-titulos"
                      type="number" min="0" max="10"
                      className="w-full sp-input font-bold font-mono text-center"
                      value={pesoTitulos}
                      onChange={e => setPesoTitulos(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                </div>

                {/* Média calculada */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
                    Média Calculada (Parcial)
                  </span>
                  <span className={`text-lg font-black font-mono ${scoreColor(liveMedia)}`}>
                    {liveMedia.toFixed(2)}
                  </span>
                </div>

              </div>

              <div className="sp-modal-footer">
                <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="sp-btn sp-btn-primary" id="salvar-nota-btn">
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

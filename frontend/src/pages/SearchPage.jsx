import React, { useState } from 'react';
import { Search, FolderOpen, FileText, ArrowRight, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import { searchAll, errMsg } from '../api/client';
import { statusLabel, statusPill, docTypeLabel } from '../labels';
import { Alert, Spinner, Empty, cx, fmtDate } from '../components/ui';

const SUGGESTIONS = ['FIR 104', 'BNS 64', 'Vikram Sethi', 'Sector 15', 'DL 8C AB 4421', 'POCSO'];

export default function SearchPage({ onOpenCase }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (e, customQ) => {
    e?.preventDefault();
    const query = (customQ !== undefined ? customQ : q).trim();
    if (query.length < 2) return;
    if (customQ !== undefined) setQ(query);
    try {
      setBusy(true);
      setError('');
      setRes(await searchAll(query));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const mark = (text) => {
    if (!text) return null;
    const query = q.trim().toLowerCase();
    const i = text.toLowerCase().indexOf(query);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-amber-400/30 text-amber-300 font-bold px-1 rounded">
          {text.slice(i, i + query.length)}
        </mark>
        {text.slice(i + query.length)}
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary border border-primary/25 text-xs font-bold mb-2">
          <Sparkles size={13} />
          <span>FULL-TEXT & METADATA FORENSIC SEARCH</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Investigative Search Engine
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Query across FIR numbers, jurisdictions, statutory offences, names of accused, seized digital exhibits, and OCR-extracted document text.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={run} className="space-y-2.5">
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-11 py-3 text-base rounded-xl shadow-sm"
              autoFocus
              placeholder="Search by FIR, accused name, vehicle number, BNS section, or OCR text snippet…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary px-6 rounded-xl text-sm font-bold shadow-md"
            disabled={busy || q.trim().length < 2}
          >
            {busy ? <Spinner size={16} /> : <Search size={16} />}
            <span>Search</span>
          </button>
        </div>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Quick suggestions:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => run(e, s)}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && <Alert kind="danger">{error}</Alert>}

      {/* Results Deck */}
      {res && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Matched Cases */}
          <section className="card">
            <div className="card-header bg-surface/40">
              <div className="card-title text-sm">
                <FolderOpen size={16} className="text-primary" />
                <span>Matched Cases</span>
                <span className="pill pill-neutral font-mono text-[11px]">{res.cases.length}</span>
              </div>
            </div>
            <div className="p-3.5 space-y-2.5">
              {res.cases.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No case dossiers match this query.</div>
              )}
              {res.cases.map((c) => (
                <button
                  key={c.case_id}
                  onClick={() => onOpenCase(c.case_id)}
                  className="w-full text-left rounded-xl border border-border hover:border-primary/60 hover:bg-card-hover p-4 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition">
                      {mark(c.fir_number)}
                    </span>
                    <span className={cx('pill text-[10.5px]', statusPill(c.case_status))}>
                      {statusLabel(c.case_status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mark(c.police_station)} · {mark(c.acts_sections)}
                  </div>
                  {c.accused_names?.length > 0 && (
                    <div className="text-xs mt-1.5 text-foreground/90">
                      <span className="text-muted-foreground font-semibold">Accused:</span> {mark(c.accused_names.join(', '))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Matched Documents */}
          <section className="card">
            <div className="card-header bg-surface/40">
              <div className="card-title text-sm">
                <FileText size={16} className="text-primary" />
                <span>Matched Exhibits & Files</span>
                <span className="pill pill-neutral font-mono text-[11px]">{res.documents.length}</span>
              </div>
            </div>
            <div className="p-3.5 space-y-2.5">
              {res.documents.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No digital files match this query.</div>
              )}
              {res.documents.map((d) => (
                <button
                  key={d.document_id}
                  onClick={() => onOpenCase(d.case_id)}
                  className="w-full text-left rounded-xl border border-border hover:border-primary/60 hover:bg-card-hover p-4 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition truncate">
                      {mark(d.title)}
                    </span>
                    <span className="pill pill-neutral text-[10px] font-mono shrink-0">
                      {docTypeLabel(d.doc_type)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="font-mono text-primary font-semibold">{d.fir_number}</span>
                    <span>·</span>
                    <span>{fmtDate(d.created_at, false)}</span>
                  </div>
                  {d.snippet && (
                    <div className="text-xs text-muted-foreground mt-2.5 leading-relaxed bg-surface/60 p-2.5 rounded-lg border border-border/60">
                      “…{mark(d.snippet)}…”
                    </div>
                  )}
                  <div className="text-xs text-primary mt-2.5 flex items-center gap-1 font-semibold group-hover:underline">
                    <span>Inspect Case Dossier</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {!res && !busy && (
        <Empty
          icon={Search}
          title="Type at least two characters to search the records"
          body="Queries are scoped to your clearance. In women-safety cases, FSL examiners and public prosecutors query only the Sec 72 BNS protected copies."
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { HistoryItem, ThemeConfig } from '../types/calculator';
import { Trash2, Copy, Check, Download, FileText, CornerDownLeft, Edit3 } from 'lucide-react';

interface TapeHistoryProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onUpdateNote: (id: string, note: string) => void;
  theme: ThemeConfig;
  className?: string;
}

export const TapeHistory: React.FC<TapeHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  onUpdateNote,
  theme,
  className = '',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const copyResult = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.result);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyAllTape = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (h) =>
          `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.expression} = ${h.result}${
            h.note ? ` (${h.note})` : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const rows = [
      ['Timestamp', 'Mode', 'Expression', 'Result', 'Note'],
      ...history.map((h) => [
        new Date(h.timestamp).toISOString(),
        h.mode,
        `"${h.expression.replace(/"/g, '""')}"`,
        `"${h.result.replace(/"/g, '""')}"`,
        `"${(h.note || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnica_calc_tape_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditNote = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(item.id);
    setTempNote(item.note || '');
  };

  const saveNote = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateNote(id, tempNote);
    setEditingNoteId(null);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden ${className}`}>
      {/* Tape Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Calculation Tape
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            ({history.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <>
              <button
                onClick={copyAllTape}
                title="Copy full tape to clipboard"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors focus:outline-none cursor-pointer"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={exportCSV}
                title="Export Tape to CSV"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors focus:outline-none cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearHistory}
                title="Clear all tape history"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors focus:outline-none cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tape Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              =
            </div>
            <p className="text-xs font-medium text-slate-400">Tape is clear</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              Every calculation is audited here. Click entries to restore values or add notes.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectHistory(item)}
              className="group p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700/80 transition-all cursor-pointer relative text-left"
            >
              {/* Meta row: mode + time */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="capitalize text-slate-400">{item.mode}</span>
                <span className="tabular-nums">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Expression */}
              <div className="text-xs text-slate-400 font-mono break-all line-clamp-2">
                {item.expression}
              </div>

              {/* Result row */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40">
                <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                  = {item.result}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEditNote(item, e)}
                    title={item.note ? 'Edit memo' : 'Add memo'}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => copyResult(item, e)}
                    title="Copy result"
                    className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-700/60 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Memo Note if exists or if editing */}
              {editingNoteId === item.id ? (
                <form onSubmit={(e) => saveNote(item.id, e)} className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Add memo (e.g. Rent, Taxes)..."
                      className="w-full text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : item.note ? (
                <div className="mt-1.5 text-[11px] text-amber-300/80 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30 flex items-center justify-between">
                  <span>Note: {item.note}</span>
                </div>
              ) : null}

              {/* Hover indicator */}
              <div className="absolute right-2 top-2 hidden group-hover:flex items-center text-[10px] text-cyan-400/80 font-mono gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
                <span>Load</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { Download, Upload, AlertTriangle, FileJson } from 'lucide-react';

export default function Eksporto() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await apiFetch('/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Turniri u eksportua!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Importimi do të zëvendësojë TË GJITHA të dhënat aktuale! Vazhdo?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiFetch('/export/import', { method: 'POST', body: JSON.stringify(data) });
      toast.success('Të dhënat u importuan me sukses!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error(e.message || 'Gabim gjatë importit');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="font-bebas text-3xl text-white tracking-wider mb-6">EKSPORTO / IMPORTO</h1>

      <div className="space-y-4">
        <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Download size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Eksporto Turnirin</h3>
              <p className="text-sm text-gray-500 mt-0.5">Shkarko të gjitha të dhënat si skedar JSON. Përdor për backup ose transferim.</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all"
          >
            <Download size={16} />
            {exporting ? 'Duke eksportuar...' : 'Eksporto Turnirin'}
          </button>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
              <Upload size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Importo Turnirin</h3>
              <p className="text-sm text-gray-500 mt-0.5">Ngarko skedar JSON dhe zëvendëso të dhënat aktuale.</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">Kujdes: Importimi do të fshijë dhe zëvendësojë TË GJITHA të dhënat aktuale!</p>
          </div>

          <label className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 ${importing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-white font-bold rounded-xl py-3 text-sm transition-all`}>
            <Upload size={16} />
            {importing ? 'Duke importuar...' : 'Zgjedh skedar JSON'}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-3">
          <FileJson size={16} className="text-gray-500 mt-0.5 shrink-0" />
          <div className="text-xs text-gray-500">
            <p className="font-medium text-gray-400 mb-1">Formati i skedarit:</p>
            <p>Skedari JSON përmban: ekipet, raundet, ndeshjet dhe editorët.</p>
            <p className="mt-1">Fjalëkalimet e adminit nuk eksportohen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

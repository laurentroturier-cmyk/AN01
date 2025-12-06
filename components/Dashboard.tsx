import React, { useMemo, useState } from 'react';
import { AnalysisResult, SupplierOffer } from '../types';
import { Trophy, TrendingDown, Target, FileText, ArrowLeft, Download, Award, ShieldCheck, Wallet, Loader2, User, Users, Calendar, Percent, Briefcase, AlertCircle, X, ChevronsRight, Euro, BarChart3, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DashboardProps {
  data: AnalysisResult;
  onReset: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Non spécifié';
    // Try to detect Excel serial date if it's a raw number string
    if (!isNaN(Number(dateStr)) && Number(dateStr) > 40000) {
         const date = new Date((Number(dateStr) - (25567 + 2)) * 86400 * 1000);
         return date.toLocaleDateString('fr-FR');
    }
    return dateStr;
};

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const { metadata, offers, stats } = data;
  const [isExporting, setIsExporting] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SupplierOffer | null>(null);

  // Filters state
  const [nameFilter, setNameFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  // Prepare chart data
  const chartData = useMemo(() => {
    return offers.map(o => ({
      name: o.name,
      Technique: o.scoreTechnical,
      Financier: o.scoreFinancial,
      Total: o.scoreFinal,
      Montant: o.amountTTC
    })).sort((a, b) => b.Total - a.Total);
  }, [offers]);

  // Filter offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
        const matchesName = offer.name.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesPrice = priceFilter ? offer.amountTTC <= Number(priceFilter) : true;
        return matchesName && matchesPrice;
    }).sort((a, b) => a.rankFinal - b.rankFinal);
  }, [offers, nameFilter, priceFilter]);

  const handleExportClick = () => {
    setShowExportConfirm(true);
  };

  const performExportPDF = () => {
    setShowExportConfirm(false);
    setIsExporting(true);
    const element = document.getElementById('dashboard-container');
    
    // Configuration optimisée pour A4 Paysage
    const opt = {
      margin: [10, 10, 15, 10], // Haut, Gauche, Bas, Droite en mm
      filename: `Afpa_Analyse_${metadata.consultationNo || 'AN01'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // Meilleure résolution
        useCORS: true, 
        letterRendering: true,
        scrollY: 0, // Force le rendu depuis le haut
        ignoreElements: (element: Element) => element.hasAttribute('data-ignore-pdf')
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Évite de couper les éléments (graphiques, lignes de tableau)
    };

    // Use specific window property for library
    const html2pdf = (window as any).html2pdf;

    if (html2pdf && element) {
      // Force un fond blanc pour l'export
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = '#ffffff';

      html2pdf().set(opt).from(element).save().then(() => {
        element.style.backgroundColor = originalBg;
        setIsExporting(false);
      }).catch((err: any) => {
        console.error("Erreur export PDF:", err);
        element.style.backgroundColor = originalBg;
        setIsExporting(false);
      });
    } else {
      console.warn('html2pdf not loaded, falling back to print');
      window.print();
      setIsExporting(false);
    }
  };

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-50 pb-12 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm print:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
                onClick={onReset} 
                data-ignore-pdf="true"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-lime-600">Afpa</span> Analytics
                </h1>
                <p className="text-xs text-slate-500 truncate max-w-md">{metadata.description || 'Analyse d\'offres'}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Référence</p>
                <p className="text-sm font-medium text-slate-700">{metadata.consultationNo || 'N/A'}</p>
             </div>
             <button 
                onClick={handleExportClick} 
                disabled={isExporting}
                data-ignore-pdf="true"
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-lime-700 hover:bg-lime-50 rounded-lg transition-colors font-medium text-sm"
             >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>{isExporting ? 'Export...' : 'Exporter PDF'}</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Winner Section - avoid break inside */}
        <section className="bg-gradient-to-r from-lime-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden break-inside-avoid page-break-inside-avoid">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-12 -translate-y-6">
                <Trophy className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        <Award className="w-4 h-4" />
                        <span>Meilleure offre recommandée</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-1">{stats.selectedSupplierName}</h2>
                    <p className="text-lime-100 text-lg opacity-90">Note globale: <span className="font-bold">{offers.find(o => o.name === stats.selectedSupplierName)?.scoreFinal.toFixed(2)}/100</span></p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[160px]">
                         <p className="text-lime-100 text-sm mb-1">Montant Retenu (TTC)</p>
                         <p className="text-2xl font-bold">{formatCurrency(stats.selectedOfferAmount)}</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[160px]">
                         <p className="text-lime-100 text-sm mb-1">Gain vs Moyenne</p>
                         <div className="flex items-end gap-2">
                             <p className="text-2xl font-bold">{stats.savingPercent.toFixed(1)}%</p>
                             <span className="text-sm opacity-80 mb-1">({formatCurrency(stats.savingVsAverage)})</span>
                         </div>
                     </div>
                </div>
            </div>
        </section>

        {/* Info & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 break-inside-avoid">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Finances</span>
                </div>
                <div>
                    <p className="text-xs text-slate-400">Moyenne des offres</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(stats.averageOffer)}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Offre Max</p>
                    <p className="text-sm font-semibold text-slate-600">{formatCurrency(stats.maxOffer)}</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm break-inside-avoid lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Fiche Signalétique</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <User className="w-3 h-3" />
                            <p className="text-xs uppercase font-bold">Demandeur</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate" title={metadata.requester}>{metadata.requester || '-'}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Briefcase className="w-3 h-3" />
                            <p className="text-xs uppercase font-bold">Acheteur</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate" title={metadata.buyer}>{metadata.buyer || '-'}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            <p className="text-xs uppercase font-bold">Valideur Tech.</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate" title={metadata.technician}>{metadata.technician || '-'}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            <p className="text-xs uppercase font-bold">Délai Décision</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{formatDate(metadata.decisionDate)}</p>
                    </div>
                     <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Percent className="w-3 h-3" />
                            <p className="text-xs uppercase font-bold">Taux TVA</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{metadata.vatRate > 0 ? `${metadata.vatRate}%` : 'Non détecté'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid page-break-inside-avoid">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Répartition des Notes (Technique vs Financier)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{fill: '#f1f5f9'}}
                            />
                            <Legend />
                            <Bar dataKey="Technique" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Note Technique (/40)" />
                            <Bar dataKey="Financier" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Note Financière (/60)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm break-inside-avoid page-break-inside-avoid flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Comparaison des Prix</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k€`} width={60} />
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <ReferenceLine y={stats.averageOffer} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Moyenne", position: "insideTopRight", fill: "#f59e0b", fontSize: 12 }} />
                            <Bar dataKey="Montant" radius={[4, 4, 0, 0]} name="Montant TTC">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === stats.selectedSupplierName ? '#84cc16' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Calcul des gains */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-lime-600" />
                        Calcul des Gains Potentiels
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-lime-50 rounded-lg border border-lime-100">
                            <p className="text-xs text-lime-600 font-semibold uppercase mb-1">Économie vs Moyenne</p>
                            <p className="text-lg font-bold text-lime-800">{formatCurrency(stats.savingVsAverage)}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gain en Pourcentage</p>
                            <p className="text-lg font-bold text-blue-800">{stats.savingPercent.toFixed(2)}%</p>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
                         <span>Offre retenue : <strong>{formatCurrency(stats.selectedOfferAmount)}</strong></span>
                         <span>Moyenne : <strong>{formatCurrency(stats.averageOffer)}</strong></span>
                    </div>
                </div>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid">
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">Classement Détaillé</h3>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
                        {filteredOffers.length} / {offers.length}
                    </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3" data-ignore-pdf="true">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Filtrer par nom..." 
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 w-full sm:w-64"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="number" 
                            placeholder="Montant max..." 
                            value={priceFilter}
                            onChange={(e) => setPriceFilter(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 w-full sm:w-40"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-200">Rang</th>
                            <th className="p-4 font-semibold border-b border-slate-200">Fournisseur</th>
                            <th className="p-4 font-semibold border-b border-slate-200 text-right">Note Globale</th>
                            <th className="p-4 font-semibold border-b border-slate-200 text-right">Note Tech.</th>
                            <th className="p-4 font-semibold border-b border-slate-200 text-right">Note Fin.</th>
                            <th className="p-4 font-semibold border-b border-slate-200 text-right">Montant TTC</th>
                            <th className="p-4 font-semibold border-b border-slate-200 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOffers.length > 0 ? (
                            filteredOffers.map((offer) => (
                                <tr 
                                  key={offer.id} 
                                  onClick={() => setSelectedOffer(offer)}
                                  className={`group hover:bg-slate-50 transition-colors cursor-pointer break-inside-avoid page-break-inside-avoid ${
                                      offer.rankFinal === 1 
                                      ? 'bg-lime-50 shadow-sm ring-1 ring-inset ring-lime-200 relative z-10' 
                                      : ''
                                  }`}
                                >
                                    <td className="p-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                            offer.rankFinal === 1 ? 'bg-lime-600 text-white shadow-sm' : 
                                            offer.rankFinal === 2 ? 'bg-slate-100 text-slate-600' : 
                                            offer.rankFinal === 3 ? 'bg-orange-50 text-orange-700' : 'text-slate-400'
                                        }`}>
                                            {offer.rankFinal === 1 ? <Trophy className="w-4 h-4" /> : offer.rankFinal}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 group-hover:text-lime-700 transition-colors">
                                        <div className="flex items-center gap-2">
                                            {offer.name}
                                            {offer.rankFinal === 1 && (
                                                <span className="inline-flex items-center text-xs font-medium text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full border border-lime-200">
                                                    <Award className="w-3 h-3 mr-1" />
                                                    Lauréat
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-800">{offer.scoreFinal.toFixed(2)}</td>
                                    <td className="p-4 text-right text-slate-600">{offer.scoreTechnical.toFixed(2)}</td>
                                    <td className="p-4 text-right text-slate-600">{offer.scoreFinancial.toFixed(2)}</td>
                                    <td className="p-4 text-right font-mono text-slate-700">{formatCurrency(offer.amountTTC)}</td>
                                    <td className="p-4 text-center">
                                        <ChevronsRight className="w-5 h-5 text-slate-300 group-hover:text-lime-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                    Aucune offre ne correspond à vos critères de recherche.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* Detail Slide-over Panel */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex justify-end" data-ignore-pdf="true">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedOffer(null)}
            />
            
            {/* Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Panel Header */}
                <div className={`p-6 border-b ${selectedOffer.rankFinal === 1 ? 'bg-gradient-to-r from-lime-50 to-emerald-50 border-lime-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            selectedOffer.rankFinal === 1 ? 'bg-lime-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                            <Trophy className="w-3 h-3" />
                            Rang {selectedOffer.rankFinal}
                        </span>
                        <button 
                            onClick={() => setSelectedOffer(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedOffer.name}</h3>
                    {selectedOffer.rankFinal === 1 && (
                         <p className="text-lime-700 text-sm font-medium flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Meilleure offre recommandée
                         </p>
                    )}
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Note Globale</span>
                             </div>
                             <p className="text-3xl font-bold text-slate-800">{selectedOffer.scoreFinal.toFixed(2)}<span className="text-lg text-slate-400 font-normal">/100</span></p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Euro className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Montant TTC</span>
                             </div>
                             <p className="text-xl font-bold text-slate-800 break-all">{formatCurrency(selectedOffer.amountTTC)}</p>
                        </div>
                    </div>

                    {/* Scores Detail */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            Détail des notes
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium">Technique</span>
                                    <span className="font-bold text-slate-800">{selectedOffer.scoreTechnical.toFixed(2)} <span className="text-slate-400 text-xs">/ 40</span></span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${(selectedOffer.scoreTechnical / 40) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium">Financier</span>
                                    <span className="font-bold text-slate-800">{selectedOffer.scoreFinancial.toFixed(2)} <span className="text-slate-400 text-xs">/ 60</span></span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${(selectedOffer.scoreFinancial / 60) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparative Analysis */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <TrendingDown className="w-4 h-4 text-slate-500" />
                            Analyse comparative
                        </h4>
                        
                        <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-600">Positionnement Prix</span>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${selectedOffer.amountTTC <= stats.averageOffer ? 'text-green-600' : 'text-red-500'}`}>
                                        {selectedOffer.amountTTC <= stats.averageOffer ? '-' : '+'}
                                        {Math.abs(((selectedOffer.amountTTC - stats.averageOffer) / stats.averageOffer) * 100).toFixed(1)}%
                                    </span>
                                    <p className="text-[10px] text-slate-400">vs Moyenne marché</p>
                                </div>
                             </div>

                             {selectedOffer.rankFinal !== 1 && (
                                 <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <span className="text-sm text-slate-600">Écart vs Leader</span>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-slate-700">
                                            {formatCurrency(selectedOffer.amountTTC - stats.selectedOfferAmount)}
                                        </span>
                                        <p className="text-[10px] text-slate-400">de surcoût</p>
                                    </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={() => setSelectedOffer(null)}
                        className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Fermer le détail
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showExportConfirm && (
        <div 
            data-ignore-pdf="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-lime-100 rounded-full">
                            <Download className="w-6 h-6 text-lime-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Confirmer l'exportation</h3>
                    </div>
                    <button 
                        onClick={() => setShowExportConfirm(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <p className="text-slate-600 mb-6">
                    Vous êtes sur le point de générer un rapport PDF de cette analyse. Voulez-vous continuer ?
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setShowExportConfirm(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={performExportPDF}
                        className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Générer le PDF
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
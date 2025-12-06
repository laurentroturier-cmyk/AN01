import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '../services/parser';
import { AnalysisResult } from '../types';

interface FileUploadProps {
  onAnalysisComplete: (data: AnalysisResult) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onAnalysisComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate progress for better UX
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Random increment between 5 and 15
        return Math.min(90, prev + Math.random() * 10 + 5);
      });
    }, 200);

    try {
      // Artificial delay to ensure user sees the start of the process
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await parseExcelFile(file);
      
      clearInterval(timer);
      setProgress(100);

      // Short delay to show 100% complete state
      setTimeout(() => {
        onAnalysisComplete(result);
      }, 600);

    } catch (err: any) {
      clearInterval(timer);
      setLoading(false);
      setProgress(0);
      console.error(err);
      setError(err.message || "Erreur lors de l'analyse du fichier.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Analyse des fichiers AN01</h1>
        <p className="text-slate-500 text-lg">
          Importez votre fichier Excel (AN01) pour générer automatiquement le tableau de bord.
        </p>
      </div>

      <div
        className={`relative w-full max-w-xl p-12 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center min-h-[320px] ${
          isDragging
            ? 'border-lime-500 bg-lime-50 scale-105'
            : 'border-slate-300 hover:border-lime-400 bg-white'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleChange}
        />

        {loading ? (
            <div className="w-full max-w-xs flex flex-col items-center animate-in fade-in duration-300">
                <div className="mb-6 relative">
                     {progress === 100 ? (
                         <div className="p-4 bg-lime-100 rounded-full text-lime-600 animate-bounce">
                             <FileCheck className="w-10 h-10" />
                         </div>
                     ) : (
                         <Loader2 className="w-12 h-12 text-lime-600 animate-spin" />
                     )}
                </div>
                
                <div className="w-full flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    <span>{progress === 100 ? 'Terminé' : 'Traitement en cours'}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200">
                    <div 
                        className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-4 font-medium animate-pulse">
                    Extraction des données et calcul des classements...
                </p>
            </div>
        ) : (
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-lime-50 rounded-full group-hover:bg-lime-100 transition-colors duration-300 ring-4 ring-lime-50/50">
                   <FileSpreadsheet className="w-12 h-12 text-lime-600" />
                </div>
                
                <div className="text-center">
                    <p className="text-xl font-medium text-slate-700 mb-1">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-sm text-slate-400 mb-6">Supporte les formats .XLSX et .XLS</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-xl shadow-lg shadow-lime-200 hover:shadow-lime-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Parcourir mes fichiers
                    </button>
                </div>
            </div>
        )}

        {error && !loading && (
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-center text-sm flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { AnalysisResult } from './types';

function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {!analysisData ? (
        <FileUpload onAnalysisComplete={setAnalysisData} />
      ) : (
        <Dashboard 
          data={analysisData} 
          onReset={() => setAnalysisData(null)} 
        />
      )}
    </div>
  );
}

export default App;
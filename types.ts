export interface SupplierOffer {
  id: number;
  name: string; // Raison sociale
  rankFinal: number;
  scoreFinal: number; // Note sur 100
  rankFinancial: number;
  scoreFinancial: number; // Note sur 60
  rankTechnical: number;
  scoreTechnical: number; // Note sur 40
  amountTTC: number; // Montant TTC
}

export interface TenderMetadata {
  consultationNo: string;
  description: string;
  buyer: string; // Acheteur
  requester: string; // Demandeur
  technician: string; // Valideur technique
  decisionDate: string; // Délai maxi décision
  vatRate: number; // Taux de TVA (en pourcentage, ex: 20)
}

export interface FinancialStats {
  averageOffer: number;
  minOffer: number;
  maxOffer: number;
  selectedOfferAmount: number;
  selectedSupplierName: string;
  savingVsAverage: number;
  savingPercent: number;
}

export interface AnalysisResult {
  metadata: TenderMetadata;
  offers: SupplierOffer[];
  stats: FinancialStats;
}
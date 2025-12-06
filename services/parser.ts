import * as XLSX from 'xlsx';
import { AnalysisResult, SupplierOffer, TenderMetadata, FinancialStats } from '../types';

/**
 * Helper to clean currency strings like "1 036 593,62 €" to numbers
 */
const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove spaces, € symbols, and replace comma with dot
  const cleanStr = val.toString().replace(/\s|€/g, '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
};

const parseScore = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(',', '.')) || 0;
};

const parsePercentage = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') {
        // Excel stores 20% as 0.2
        return val < 1 ? Math.round(val * 100) : val;
    }
    // Handle string "20%" or "20"
    const str = val.toString().replace('%', '').replace(',', '.').trim();
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    // Heuristic: if < 1 likely decimal representation (0.2), else percentage (20)
    return num < 1 ? Math.round(num * 100) : num;
};

export const parseExcelFile = async (file: File): Promise<AnalysisResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 1. Find the target sheet (AN01)
        let sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('AN01'));
        if (!sheetName) {
            // Fallback: try the first sheet if AN01 isn't explicitly named
            sheetName = workbook.SheetNames[0];
        }

        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays for easier iteration
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // 2. Extract Metadata
        const metadata: TenderMetadata = {
          consultationNo: '',
          description: '',
          buyer: '',
          requester: '',
          technician: '',
          decisionDate: '',
          vatRate: 0
        };

        // --- EXPLICIT CELL EXTRACTION (User Request) ---
        // H9 corresponds to Row 8 (index), Column 7 (index) (A=0 ... H=7)
        if (jsonData.length > 8 && jsonData[8][7] !== undefined) {
            metadata.vatRate = parsePercentage(jsonData[8][7]);
        }

        // --- HEURISTIC EXTRACTION (Fallback & Other Fields) ---
        for (let i = 0; i < 20 && i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row) continue;
          
          const rowStr = row.join(' ').toLowerCase();
          
          // Helper to find value next to label
          const getValue = (keyword: string): string => {
             const idx = row.findIndex(c => c && c.toString().toLowerCase().includes(keyword));
             if (idx !== -1 && row[idx + 1]) return row[idx + 1].toString();
             // Fallback to column 1 if text is in column 0
             if (row[0] && row[0].toString().toLowerCase().includes(keyword) && row[1]) return row[1].toString();
             return '';
          };

          if (rowStr.includes('consultation') && !metadata.consultationNo) metadata.consultationNo = row.find(c => c && c.toString().includes('AOO')) || getValue('consultation') || '';
          if (rowStr.includes('description') && !metadata.description) metadata.description = getValue('description');
          if (rowStr.includes('acheteur') && !metadata.buyer) metadata.buyer = getValue('acheteur');
          if (rowStr.includes('demandeur') && !metadata.requester) metadata.requester = getValue('demandeur');
          if (rowStr.includes('valideur') && !metadata.technician) metadata.technician = getValue('valideur');
          if (rowStr.includes('délai') && !metadata.decisionDate) metadata.decisionDate = getValue('délai');
          
          // Fallback TVA if H9 was empty
          if (metadata.vatRate === 0 && rowStr.includes('tva')) {
             const cell = row.find(c => {
                 if (typeof c === 'number') return true;
                 if (typeof c === 'string' && (c.includes('%') || !isNaN(parseFloat(c)))) return true;
                 return false;
             });
             if (cell) metadata.vatRate = parsePercentage(cell);
          }
        }

        // 3. Find Table Start
        let headerRowIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.some((cell: any) => cell && cell.toString().toLowerCase().includes('raison sociale'))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Structure du tableau non reconnue (Colonne 'Raison sociale' manquante)");
        }

        // 4. Extract Offers
        const offers: SupplierOffer[] = [];
        let currentRow = headerRowIndex + 2; // Skip main header and sub header

        while (currentRow < jsonData.length) {
          const row = jsonData[currentRow];
          
          // Stop if row is empty or we hit the "Calcul des gains" section
          if (!row || row.length === 0 || !row[0] || row[0].toString().toLowerCase().includes('calcul des gains')) {
            break;
          }

          if(row[1]) {
            offers.push({
                id: currentRow,
                name: row[0],
                rankFinal: parseInt(row[1]) || 0,
                scoreFinal: parseScore(row[2]),
                rankFinancial: parseInt(row[3]) || 0,
                scoreFinancial: parseScore(row[4]),
                rankTechnical: parseInt(row[5]) || 0,
                scoreTechnical: parseScore(row[6]),
                amountTTC: parseCurrency(row[7])
            });
          }
          currentRow++;
        }

        if (offers.length === 0) {
           throw new Error("Aucune offre trouvée dans le tableau.");
        }

        // 5. Calculate Stats
        const sortedOffers = [...offers].sort((a, b) => a.rankFinal - b.rankFinal);
        const winner = sortedOffers[0];
        const amounts = offers.map(o => o.amountTTC);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);

        const stats: FinancialStats = {
          averageOffer: avg,
          minOffer: min,
          maxOffer: max,
          selectedOfferAmount: winner.amountTTC,
          selectedSupplierName: winner.name,
          savingVsAverage: avg - winner.amountTTC,
          savingPercent: ((avg - winner.amountTTC) / avg) * 100
        };

        resolve({ metadata, offers, stats });

      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
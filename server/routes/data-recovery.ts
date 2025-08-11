import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

const router = Router();

interface RecoveryProgress {
  currentColumn: string;
  totalColumns: number;
  completedColumns: number;
  totalRows: number;
  processedRows: number;
  estimatedTimeRemaining: string;
  status: 'initializing' | 'processing' | 'completed' | 'error';
}

interface ColumnData {
  name: string;
  arabicName: string;
  processedRows: number;
  totalRows: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  sampleData: any[];
}

// Global state for recovery process
let recoveryState: {
  progress: RecoveryProgress;
  columns: ColumnData[];
  previewData: any[];
} = {
  progress: {
    currentColumn: 'A',
    totalColumns: 13,
    completedColumns: 0,
    totalRows: 0, // سيتم تحديثها من الملف الجديد
    processedRows: 0,
    estimatedTimeRemaining: 'حساب الوقت...',
    status: 'initializing'
  },
  columns: [
    { name: 'A', arabicName: 'وحدة القياس (UOM)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'B', arabicName: 'رقم البند (LINE_ITEM)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'C', arabicName: 'رقم القطعة (PART_NO)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'D', arabicName: 'الوصف (DESCRIPTION)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'E', arabicName: 'رقم طلب التسعير (RFQ_NUMBER)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'F', arabicName: 'تاريخ طلب التسعير (DATE/RFQ)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'G', arabicName: 'كمية طلب التسعير (QTY_OF_RFQ)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'H', arabicName: 'سعر طلب التسعير (PRICE_OF_RFQ)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'I', arabicName: 'تاريخ الاستجابة (RESPONSE_DATE)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'J', arabicName: 'رقم طلب الشراء (PO_NUMBER)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'K', arabicName: 'تاريخ طلب الشراء (DATE_OF_PO)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'L', arabicName: 'كمية طلب الشراء (QUANTITY_OF_PO)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] },
    { name: 'M', arabicName: 'سعر طلب الشراء (PRICE_OF_PO)', processedRows: 0, totalRows: 0, status: 'pending', sampleData: [] }
  ],
  previewData: []
};

// Sample data for each column based on the images provided
const sampleDataByColumn = {
  'A': ['Set', 'Meter', 'Piece', 'Box', 'Roll'], // UOM
  'B': [1, 2, 3, 4, 5], // LINE_ITEM
  'C': ['2102029', 'WITH 4 OUTLET', '410A', 'A9R81440'], // PART_NO
  'D': ['LEFT BRACKET FOR A/C CARRIER', 'RIGHT BRACKET FOR A/C', 'ENERGIZER BATTERY'], // DESCRIPTION
  'E': ['25R', '26R', '27R'], // RFQ_NUMBER
  'F': ['3/8/2023', '9/8/2023', '12/8/2023', '14/8/2023'], // REQUEST_DATE
  'G': [15, 73, 76, 48, 53], // QUANTITY
  'H': [811, 976, 1001, 802, 102], // PRICE
  'I': ['10/8/2023', '16/8/2023', '19/8/2023', '21/8/2023'], // RESPONSE_DATE
  'J': ['4500000123', '4500000124', '4500000125', '4500000126'], // PO_NUMBER
  'K': ['10/8/2023', '16/8/2023', '19/8/2023', '21/8/2023'], // PO_DATE
  'L': [15, 73, 76, 48], // PO_QUANTITY
  'M': [811, 976, 1001, 802] // PO_PRICE
};

// Start recovery process
router.post('/start', async (req, res) => {
  try {
    recoveryState.progress.status = 'processing';
    recoveryState.progress.completedColumns = 0;
    recoveryState.progress.processedRows = 0;
    
    // Reset all columns to pending
    recoveryState.columns.forEach(col => {
      col.status = 'pending';
      col.processedRows = 0;
      col.sampleData = [];
    });

    // Start processing in background using real data
    runDataExtraction();

    res.json({ 
      success: true, 
      message: 'بدء عملية استرداد البيانات',
      progress: recoveryState.progress 
    });
  } catch (error) {
    console.error('Error starting recovery:', error);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في بدء عملية الاسترداد' 
    });
  }
});

// Get recovery progress
router.get('/progress', (req, res) => {
  res.json({
    progress: recoveryState.progress,
    columns: recoveryState.columns,
    preview: recoveryState.previewData.slice(0, 100) // Send first 100 rows for preview
  });
});

// Load and display the real extracted data
async function runDataExtraction() {
  try {
    // Load the latest Excel data processed from the most recent file
    const latestDataPath = path.join(process.cwd(), 'attached_assets', 'latest_excel_data_processed.json');
    const realData = JSON.parse(await fs.readFile(latestDataPath, 'utf8'));
    
    console.log('✅ تم تحميل البيانات من آخر ملف Excel:', realData.length, 'سجل');
    
    // تحديث إجمالي الصفوف (طرح 1 لأن الصف الأول عناوين)
    const actualDataRows = realData.length - 1;
    recoveryState.progress.totalRows = actualDataRows;
    recoveryState.columns.forEach(col => {
      col.totalRows = actualDataRows;
    });
    
    // Process each column to show realistic progress
    for (let colIndex = 0; colIndex < recoveryState.columns.length; colIndex++) {
      const column = recoveryState.columns[colIndex];
      
      // Update current column
      recoveryState.progress.currentColumn = column.name;
      column.status = 'processing';
      
      // Get sample data from structured records
      const columnMapping: { [key: string]: string } = {
        'A': 'uom',
        'B': 'lineItem', 
        'C': 'partNo',
        'D': 'description',
        'E': 'rfq.number',
        'F': 'rfq.date',
        'G': 'rfq.quantity',
        'H': 'rfq.price',
        'I': 'rfq.responseDate',
        'J': 'po.number',
        'K': 'po.date',
        'L': 'po.quantity',
        'M': 'po.price'
      };
      
      const fieldPath = columnMapping[column.name];
      
      // Simulate processing time for realism
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Extract sample data using field path
      column.sampleData = realData
        .map(row => {
          if (fieldPath.includes('.')) {
            const [obj, field] = fieldPath.split('.');
            return row[obj]?.[field];
          }
          return row[fieldPath];
        })
        .filter(value => value !== null && value !== undefined)
        .slice(0, 10);
      
      // Update row counts (excluding header row)
      const actualDataRows = realData.length - 1;
      column.processedRows = actualDataRows;
      recoveryState.progress.processedRows = (colIndex + 1) * actualDataRows;
      
      // Mark column as completed
      column.status = 'completed';
      recoveryState.progress.completedColumns = colIndex + 1;
    }
    
    // Format preview data for display - skip header row and show meaningful data
    const dataWithoutHeader = realData.slice(1); // تجاهل صف العناوين
    recoveryState.previewData = dataWithoutHeader.slice(0, 20).map((record, index) => ({
      // Format data to match frontend expectations (column names as keys)
      'A': record.uom || '-',
      'B': record.lineItem || '-', 
      'C': record.partNo || '-',
      'D': record.description?.substring(0, 50) || '-',
      'E': record.rfq?.number || '-',
      'F': record.rfq?.date || '-',
      'G': record.rfq?.quantity || '-',
      'H': record.rfq?.price || '-',
      'I': record.rfq?.responseDate || '-',
      'J': record.po?.number || '-',
      'K': record.po?.date || '-',
      'L': record.po?.quantity || '-',
      'M': record.po?.price || '-'
    }));
    
    recoveryState.progress.status = 'completed';
    recoveryState.progress.estimatedTimeRemaining = 'مكتمل';
    
    console.log('✅ اكتمل تحميل جميع البيانات الحقيقية');
    
  } catch (error) {
    console.error('❌ خطأ في تحميل البيانات الحقيقية:', error);
    recoveryState.progress.status = 'error';
  }
}

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours} ساعة ${minutes % 60} دقيقة`;
  } else if (minutes > 0) {
    return `${minutes} دقيقة ${seconds % 60} ثانية`;
  } else {
    return `${seconds} ثانية`;
  }
}

export default router;
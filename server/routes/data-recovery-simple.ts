import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

// Global state for recovery process
let recoveryState = {
  progress: {
    currentColumn: 'A',
    totalColumns: 13,
    completedColumns: 0,
    totalRows: 5449,
    processedRows: 0,
    estimatedTimeRemaining: 'جاري الحساب...',
    status: 'initializing' as 'initializing' | 'processing' | 'completed' | 'error'
  },
  columns: [
    { name: 'A', arabicName: 'وحدة القياس (UOM)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'B', arabicName: 'رقم البند (LINE_ITEM)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'C', arabicName: 'رقم القطعة (PART_NO)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'D', arabicName: 'الوصف (DESCRIPTION)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'E', arabicName: 'رقم طلب التسعير (RFQ_NUMBER)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'F', arabicName: 'تاريخ الطلب (REQUEST_DATE)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'G', arabicName: 'الكمية (QUANTITY)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'H', arabicName: 'السعر (PRICE)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'I', arabicName: 'تاريخ الاستجابة (RESPONSE_DATE)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'J', arabicName: 'رقم أمر الشراء (PO_NUMBER)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'K', arabicName: 'تاريخ أمر الشراء (PO_DATE)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'L', arabicName: 'كمية أمر الشراء (PO_QUANTITY)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] },
    { name: 'M', arabicName: 'سعر أمر الشراء (PO_PRICE)', processedRows: 0, totalRows: 5449, status: 'pending' as 'pending' | 'processing' | 'completed' | 'error', sampleData: [] as any[] }
  ],
  previewData: [] as any[]
};

// Start recovery process
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 بدء عملية استرداد البيانات...');
    
    // Reset state
    recoveryState.progress.status = 'processing';
    recoveryState.progress.completedColumns = 0;
    recoveryState.progress.processedRows = 0;
    
    // Reset all columns to pending
    recoveryState.columns.forEach(col => {
      col.status = 'pending';
      col.processedRows = 0;
      col.sampleData = [];
    });

    // Start processing in background
    processDataRecovery();

    res.json({ 
      success: true, 
      message: 'بدء عملية استرداد البيانات',
      progress: recoveryState.progress 
    });
  } catch (error) {
    console.error('خطأ في بدء الاسترداد:', error);
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

// Process data recovery using real extracted files
async function processDataRecovery() {
  try {
    console.log('📂 تحميل البيانات من الملفات المستخرجة...');
    
    const attachedAssetsPath = path.join(process.cwd(), 'attached_assets');
    
    // Column mapping for file loading
    const columnMapping = {
      'A': 'UOM',
      'B': 'LINE_ITEM', 
      'C': 'PART_NO',
      'D': 'DESCRIPTION',
      'E': 'RFQ_NUMBER',
      'F': 'REQUEST_DATE',
      'G': 'QUANTITY',
      'H': 'PRICE',
      'I': 'RESPONSE_DATE',
      'J': 'PO_NUMBER',
      'K': 'PO_DATE',
      'L': 'PO_QUANTITY',
      'M': 'PO_PRICE'
    };

    // Initialize combined data array
    const combinedData: any[] = [];
    
    // Load each column's data
    for (let i = 0; i < recoveryState.columns.length; i++) {
      const column = recoveryState.columns[i];
      const columnLetter = column.name;
      const columnName = columnMapping[columnLetter as keyof typeof columnMapping];
      
      try {
        recoveryState.progress.currentColumn = columnLetter;
        column.status = 'processing';
        
        const columnFilePath = path.join(attachedAssetsPath, `column_${columnLetter}_${columnName}.json`);
        
        // Load column data
        const columnDataContent = await fs.readFile(columnFilePath, 'utf-8');
        const columnData = JSON.parse(columnDataContent);
        
        // Update column statistics
        const nonEmptyCount = columnData.filter((item: any) => item !== null && item !== '').length;
        column.processedRows = nonEmptyCount;
        column.sampleData = columnData.filter((item: any) => item !== null && item !== '').slice(0, 5);
        column.status = 'completed';
        
        // Combine data for first column or merge with existing
        if (i === 0) {
          // Initialize combined data with first column
          for (let row = 0; row < columnData.length; row++) {
            combinedData[row] = {
              [columnLetter]: columnData[row]
            };
          }
        } else {
          // Merge with existing data
          for (let row = 0; row < Math.min(columnData.length, combinedData.length); row++) {
            if (combinedData[row]) {
              combinedData[row][columnLetter] = columnData[row];
            }
          }
        }
        
        console.log(`✅ العمود ${columnLetter}: ${nonEmptyCount.toLocaleString()} بيانات من ${columnData.length.toLocaleString()}`);
        
        // Update progress
        recoveryState.progress.completedColumns = i + 1;
        recoveryState.progress.processedRows = recoveryState.progress.completedColumns * 5449;
        
        // Small delay for UI updates
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ خطأ في تحميل العمود ${columnLetter}:`, error);
        column.status = 'error';
      }
    }
    
    // Set preview data
    recoveryState.previewData = combinedData;
    
    // Mark process as completed
    recoveryState.progress.status = 'completed';
    recoveryState.progress.estimatedTimeRemaining = 'مكتمل';
    recoveryState.progress.processedRows = 5449 * 13;
    
    // Save combined data
    try {
      const outputPath = path.join(attachedAssetsPath, 'recovered_data_complete_5449.json');
      await fs.writeFile(outputPath, JSON.stringify(combinedData, null, 2));
      console.log(`💾 تم حفظ البيانات الكاملة: ${outputPath}`);
    } catch (saveError) {
      console.error('❌ خطأ في حفظ البيانات:', saveError);
    }
    
    console.log('🎉 تم اكتمال عملية استرداد البيانات بنجاح!');
    console.log(`📊 إجمالي البيانات المستردة: ${combinedData.length.toLocaleString()} صف × 13 عمود = ${(combinedData.length * 13).toLocaleString()} خلية`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية استرداد البيانات:', error);
    recoveryState.progress.status = 'error';
    recoveryState.progress.estimatedTimeRemaining = 'خطأ في العملية';
  }
}

export default router;
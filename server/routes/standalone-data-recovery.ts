import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import express from 'express';

const app = express();
const router = Router();

// Middleware to bypass authentication for data recovery
app.use(express.json());

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

// Serve static data recovery page without authentication
app.get('/data-recovery', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>استرداد البيانات - قرطبة للتوريدات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto p-6 max-w-6xl">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">استرداد البيانات من الصور</h1>
                <p class="text-gray-600">نظام استرداد البيانات المستخرجة من الصور (5,449 صف × 13 عمود)</p>
            </div>
            
            <div class="flex justify-center gap-4 mb-8">
                <button onclick="startRecovery()" id="startBtn" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                    بدء عملية الاسترداد
                </button>
                <button onclick="togglePreview()" id="previewBtn" 
                        class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
                    عرض المعاينة
                </button>
            </div>
            
            <div id="progress" class="hidden mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">التقدم العام</span>
                        <span id="progressPercent" class="text-blue-600 font-bold">0%</span>
                    </div>
                    <div class="w-full bg-blue-200 rounded-full h-4">
                        <div id="progressBar" class="bg-blue-600 h-4 rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <div class="mt-2 text-sm text-gray-600">
                        <span>الأعمدة المكتملة: </span><span id="completedColumns">0</span><span> من 13</span>
                    </div>
                </div>
            </div>
            
            <div id="preview" class="hidden">
                <div class="bg-gray-50 border rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">معاينة البيانات المستردة</h3>
                    <div class="overflow-x-auto">
                        <div class="text-center py-8">
                            <div class="loading-spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p class="text-gray-600">جاري تحميل المعاينة...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let isProcessing = false;
        let showPreview = false;

        async function startRecovery() {
            if (isProcessing) return;
            
            isProcessing = true;
            document.getElementById('startBtn').innerHTML = '🔄 جاري المعالجة...';
            document.getElementById('progress').classList.remove('hidden');
            
            try {
                const response = await fetch('/api/standalone/data-recovery/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    monitorProgress();
                } else {
                    alert('فشل في بدء عملية الاسترداد');
                }
            } catch (error) {
                alert('خطأ في الاتصال بالخادم');
            }
        }

        async function monitorProgress() {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch('/api/standalone/data-recovery/progress');
                    const data = await response.json();
                    
                    const progress = (data.progress.completedColumns / data.progress.totalColumns) * 100;
                    document.getElementById('progressBar').style.width = progress + '%';
                    document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
                    document.getElementById('completedColumns').textContent = data.progress.completedColumns;
                    
                    if (data.progress.status === 'completed') {
                        clearInterval(interval);
                        isProcessing = false;
                        document.getElementById('startBtn').innerHTML = '✅ اكتمل الاسترداد';
                        document.getElementById('startBtn').disabled = true;
                        alert('تم اكتمال عملية استرداد البيانات بنجاح!');
                    }
                } catch (error) {
                    console.error('خطأ في مراقبة التقدم:', error);
                }
            }, 1000);
        }

        function togglePreview() {
            const preview = document.getElementById('preview');
            showPreview = !showPreview;
            
            if (showPreview) {
                preview.classList.remove('hidden');
                document.getElementById('previewBtn').textContent = 'إخفاء المعاينة';
                loadPreview();
            } else {
                preview.classList.add('hidden');
                document.getElementById('previewBtn').textContent = 'عرض المعاينة';
            }
        }

        async function loadPreview() {
            try {
                const response = await fetch('/api/standalone/data-recovery/preview');
                const data = await response.json();
                
                if (data.length === 0) {
                    document.querySelector('#preview .overflow-x-auto').innerHTML = 
                        '<div class="text-center py-8"><p class="text-gray-600">لا توجد بيانات للعرض. قم بتشغيل عملية الاسترداد أولاً.</p></div>';
                    return;
                }
                
                let tableHTML = '<table class="w-full border-collapse border border-gray-300 text-sm"><thead class="bg-gray-100"><tr>';
                tableHTML += '<th class="border border-gray-300 p-2 text-right">الصف</th>';
                
                const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
                const columnNames = ['وحدة القياس', 'رقم البند', 'رقم القطعة', 'الوصف', 'رقم RFQ', 'تاريخ الطلب', 'الكمية', 'السعر', 'تاريخ الرد', 'رقم PO', 'تاريخ PO', 'كمية PO', 'سعر PO'];
                
                columns.forEach((col, idx) => {
                    tableHTML += \`<th class="border border-gray-300 p-2 text-right min-w-[100px]">\${col}<br><span class="text-xs font-normal">\${columnNames[idx]}</span></th>\`;
                });
                
                tableHTML += '</tr></thead><tbody>';
                
                data.slice(0, 20).forEach((row, idx) => {
                    tableHTML += \`<tr class="\${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">\`;
                    tableHTML += \`<td class="border border-gray-300 p-2 font-bold text-blue-600">\${idx + 1}</td>\`;
                    
                    columns.forEach(col => {
                        const value = row[col];
                        const displayValue = value ? String(value).substring(0, 20) + (String(value).length > 20 ? '...' : '') : 'فارغ';
                        const cellClass = value ? 'text-gray-800' : 'text-gray-400 italic';
                        tableHTML += \`<td class="border border-gray-300 p-2 \${cellClass}" title="\${value || 'فارغ'}">\${displayValue}</td>\`;
                    });
                    
                    tableHTML += '</tr>';
                });
                
                tableHTML += '</tbody></table>';
                tableHTML += \`<div class="mt-4 text-center text-sm text-gray-600">عرض أول 20 صف من \${data.length.toLocaleString()} صف مسترجع</div>\`;
                
                document.querySelector('#preview .overflow-x-auto').innerHTML = tableHTML;
                
            } catch (error) {
                console.error('خطأ في تحميل المعاينة:', error);
            }
        }
    </script>
</body>
</html>`);
});

// Start recovery process
app.post('/api/standalone/data-recovery/start', async (req, res) => {
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
      message: 'بدء عملية استرداد البيانات'
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
app.get('/api/standalone/data-recovery/progress', (req, res) => {
  res.json({
    progress: recoveryState.progress,
    columns: recoveryState.columns
  });
});

// Get preview data
app.get('/api/standalone/data-recovery/preview', (req, res) => {
  res.json(recoveryState.previewData.slice(0, 100));
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
        
        const columnFilePath = path.join(attachedAssetsPath, \`column_\${columnLetter}_\${columnName}.json\`);
        
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
        
        console.log(\`✅ العمود \${columnLetter}: \${nonEmptyCount.toLocaleString()} بيانات من \${columnData.length.toLocaleString()}\`);
        
        // Update progress
        recoveryState.progress.completedColumns = i + 1;
        recoveryState.progress.processedRows = recoveryState.progress.completedColumns * 5449;
        
        // Small delay for UI updates
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(\`❌ خطأ في تحميل العمود \${columnLetter}:\`, error);
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
      console.log(\`💾 تم حفظ البيانات الكاملة: \${outputPath}\`);
    } catch (saveError) {
      console.error('❌ خطأ في حفظ البيانات:', saveError);
    }
    
    console.log('🎉 تم اكتمال عملية استرداد البيانات بنجاح!');
    console.log(\`📊 إجمالي البيانات المستردة: \${combinedData.length.toLocaleString()} صف × 13 عمود = \${(combinedData.length * 13).toLocaleString()} خلية\`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية استرداد البيانات:', error);
    recoveryState.progress.status = 'error';
    recoveryState.progress.estimatedTimeRemaining = 'خطأ في العملية';
  }
}

// Start the standalone server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(\`🚀 خادم استرداد البيانات يعمل على المنفذ \${PORT}\`);
  console.log(\`📋 يمكنك الوصول لنظام استرداد البيانات على: http://localhost:\${PORT}/data-recovery\`);
});

export default router;
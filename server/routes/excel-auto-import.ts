// حل بديل: نقطة نهاية جديدة للاستيراد التلقائي السريع
import type { Express, Request, Response } from "express";
import { autoMapColumns, formatMappingResults } from "../excelAutoMapper";

export function registerAutoImportRoutes(app: Express, requireAuth: any, requireRole: any, logActivity: any) {
  
  // 🚀 نقطة نهاية الاستيراد التلقائي السريع
  app.post("/api/import/quotations/auto", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;
      
      if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return res.status(400).json({ message: "Excel data is required" });
      }

      console.log("🚀 Auto-import starting with", excelData.length, "rows");
      
      // الخطوة 1: استخراج أسماء الأعمدة
      const excelColumns = Object.keys(excelData[0]);
      console.log("📋 Available columns:", excelColumns);
      
      // الخطوة 2: المطابقة التلقائية الذكية
      const mappingResult = autoMapColumns(excelColumns);
      console.log("🤖 Auto-mapping result:");
      console.log(formatMappingResults(mappingResult));
      
      // الخطوة 3: معالجة البيانات مباشرة
      const processedData = excelData.map((row: any, index: number) => {
        // تحويل التواريخ من تنسيق Excel
        const convertExcelDate = (serialDate: any): string => {
          if (!serialDate || isNaN(serialDate)) return '';
          const utc_days = Math.floor(serialDate - 25569);
          const utc_value = utc_days * 86400;
          const date_info = new Date(utc_value * 1000);
          const year = date_info.getFullYear();
          const month = String(date_info.getMonth() + 1).padStart(2, '0');
          const day = String(date_info.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const mapping = mappingResult.columnMapping;
        
        return {
          rowIndex: index + 1,
          lineNumber: index + 1,
          requestNumber: row[mapping.rfqNumber] || `REQ-${Date.now()}-${index + 1}`,
          customRequestNumber: row[mapping.rfqNumber] || '',
          requestDate: convertExcelDate(row[mapping.requestDate]),
          expiryDate: convertExcelDate(row[mapping.expiryDate]),
          status: 'pending',
          clientName: row[mapping.clientName] || 'غير محدد',
          itemNumber: '',
          kItemId: '',
          partNumber: row[mapping.partNumber] || '',
          lineItem: row[mapping.lineItem] || '',
          description: row[mapping.description] || '',
          unit: row[mapping.unit] || 'غير محدد',
          category: '',
          brand: '',
          quantity: Number(row[mapping.quantity]) || 0,
          unitPrice: Number(row[mapping.unitPrice]) || 0,
          totalPrice: (Number(row[mapping.quantity]) || 0) * (Number(row[mapping.unitPrice]) || 0),
          currency: 'EGP',
          aiStatus: 'pending',
          aiMatchedItemId: null
        };
      });

      // فلترة البيانات الصالحة فقط
      const validData = processedData.filter(row => 
        row.lineItem && row.partNumber && row.description && row.quantity > 0
      );

      console.log(`✅ Processed ${processedData.length} rows, ${validData.length} valid`);
      
      await logActivity(req, "auto_import_preview", "quotations", req.session.user!.id, 
        `Auto-mapped ${validData.length} quotation records with ${mappingResult.confidence}% confidence`);

      res.json({
        previewData: validData,
        totalRows: validData.length,
        mappingResult,
        autoMappingUsed: true,
        confidence: mappingResult.confidence,
        message: `تم استيراد ${validData.length} سجل تلقائياً بثقة ${mappingResult.confidence}%`
      });

    } catch (error) {
      console.error("Error in auto-import:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 🔧 نقطة نهاية لاختبار المطابقة التلقائية فقط
  app.post("/api/import/quotations/test-mapping", requireAuth, requireRole(['it_admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;
      
      if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return res.status(400).json({ message: "Excel data is required" });
      }

      const excelColumns = Object.keys(excelData[0]);
      const mappingResult = autoMapColumns(excelColumns);
      
      console.log("🧪 Testing mapping for columns:", excelColumns);
      console.log(formatMappingResults(mappingResult));

      res.json({
        excelColumns,
        mappingResult,
        formattedResult: formatMappingResults(mappingResult)
      });

    } catch (error) {
      console.error("Error in test-mapping:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
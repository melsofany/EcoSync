import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

// Get RFQ-PO linking analysis
router.get('/analysis', async (req, res) => {
  try {
    // Load structured data and statistics
    const structuredDataPath = path.join(process.cwd(), 'attached_assets', 'structured_data_with_linking_5449.json');
    const statisticsPath = path.join(process.cwd(), 'attached_assets', 'linking_statistics.json');
    
    const structuredData = JSON.parse(await fs.readFile(structuredDataPath, 'utf8'));
    const statistics = JSON.parse(await fs.readFile(statisticsPath, 'utf8'));
    
    // Analyze RFQ to PO flow
    const rfqAnalysis = {};
    const poAnalysis = {};
    
    structuredData.forEach(record => {
      const rfqNum = record.rfq?.number;
      const poNum = record.po?.number;
      
      if (rfqNum) {
        if (!rfqAnalysis[rfqNum]) {
          rfqAnalysis[rfqNum] = {
            rfqNumber: rfqNum,
            totalItems: 0,
            linkedItems: 0,
            uniquePOs: new Set(),
            totalRfqValue: 0,
            totalPoValue: 0,
            items: []
          };
        }
        
        rfqAnalysis[rfqNum].totalItems++;
        rfqAnalysis[rfqNum].totalRfqValue += record.rfq.price || 0;
        
        if (record.linkStatus.isLinked) {
          rfqAnalysis[rfqNum].linkedItems++;
          rfqAnalysis[rfqNum].uniquePOs.add(poNum);
          rfqAnalysis[rfqNum].totalPoValue += record.po.price || 0;
        }
        
        rfqAnalysis[rfqNum].items.push({
          rowNumber: record.rowNumber,
          partNo: record.partNo,
          description: record.description,
          rfqQuantity: record.rfq.quantity,
          rfqPrice: record.rfq.price,
          poQuantity: record.po.quantity,
          poPrice: record.po.price,
          isLinked: record.linkStatus.isLinked
        });
      }
    });
    
    // Convert Set to Array for JSON serialization
    Object.values(rfqAnalysis).forEach(rfq => {
      rfq.uniquePOs = Array.from(rfq.uniquePOs);
      rfq.linkingRate = (rfq.linkedItems / rfq.totalItems * 100).toFixed(1) + '%';
      rfq.valueDifference = rfq.totalPoValue - rfq.totalRfqValue;
      rfq.valueDifferencePercentage = rfq.totalRfqValue > 0 ? 
        ((rfq.valueDifference / rfq.totalRfqValue) * 100).toFixed(1) + '%' : '0%';
    });
    
    res.json({
      statistics,
      rfqAnalysis: Object.values(rfqAnalysis),
      summary: {
        totalRfqs: Object.keys(rfqAnalysis).length,
        averageLinkingRate: (Object.values(rfqAnalysis).reduce((sum, rfq) => 
          sum + (rfq.linkedItems / rfq.totalItems), 0) / Object.keys(rfqAnalysis).length * 100).toFixed(1) + '%',
        totalRfqValue: Object.values(rfqAnalysis).reduce((sum, rfq) => sum + rfq.totalRfqValue, 0),
        totalPoValue: Object.values(rfqAnalysis).reduce((sum, rfq) => sum + rfq.totalPoValue, 0)
      }
    });
    
  } catch (error) {
    console.error('Error in linking analysis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في تحليل الربط' 
    });
  }
});

// Get detailed view of specific RFQ
router.get('/rfq/:rfqNumber', async (req, res) => {
  try {
    const { rfqNumber } = req.params;
    
    const structuredDataPath = path.join(process.cwd(), 'attached_assets', 'structured_data_with_linking_5449.json');
    const structuredData = JSON.parse(await fs.readFile(structuredDataPath, 'utf8'));
    
    const rfqRecords = structuredData.filter(record => record.rfq?.number === rfqNumber);
    
    if (rfqRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `لم يتم العثور على طلب التسعير ${rfqNumber}` 
      });
    }
    
    res.json({
      rfqNumber,
      totalItems: rfqRecords.length,
      records: rfqRecords
    });
    
  } catch (error) {
    console.error('Error getting RFQ details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في جلب تفاصيل طلب التسعير' 
    });
  }
});

export default router;
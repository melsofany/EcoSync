#!/usr/bin/env tsx

import { UnificationMonitorAPI } from './server/unification-monitor-api';

async function testMonitor() {
  try {
    console.log('🔍 اختبار صفحة المراقبة...');
    
    const monitor = new UnificationMonitorAPI();
    
    // إعداد مستمعين للأحداث
    monitor.on('log', (data) => {
      console.log(`[${new Date().toLocaleTimeString()}] ${data.message}`);
    });
    
    monitor.on('stats', (stats) => {
      console.log(`📊 الإحصائيات: معالج: ${stats.processed}, موحد: ${stats.unified}, إجمالي: ${stats.total}`);
    });
    
    // قراءة الإحصائيات الأولية
    console.log('📋 قراءة الإحصائيات الأولية...');
    const initialStats = await monitor.getInitialStats();
    console.log('✅ الإحصائيات الأولية:', initialStats);
    
    // بدء عملية التوحيد
    console.log('🚀 بدء عملية التوحيد...');
    await monitor.startRealTimeUnification();
    
  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
  }
}

testMonitor();
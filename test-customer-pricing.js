// اختبار حفظ تسعير العميل

async function testCustomerPricing() {
  const testData = {
    itemNumber: 'P-0000017',
    rfqNumber: '25R000057',
    customerPrice: '155.00',
    customerUnitPrice: '155.00',
    quantity: '1',
    partNumber: 'TL-6002-WHITE',
    lineItem: '',
    description: 'Sensor, TL-6002-White, Load cell 100kg',
    uom: 'EACH',
    requestDate: '2025-01-01',
    expiryDate: '2025-02-01',
    clientName: 'شركة الاختبار',
    totalPrice: '155.00',
    priceWithVat: '176.70',
    profit: '20.00',
    profitMargin: '12.90',
    employeeName: 'Test User'
  };

  console.log('🚀 بدء اختبار حفظ تسعير العميل...');
  console.log('📋 البيانات المرسلة:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:5000/api/customer-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3AL-0fGGRTxVkCiJQJKqo0r9hEQwRiJHQl.aQnZ7EGH5qsKAOKCMEHB5oNRALqGiLqSbWrflJzIaKw'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ نجح الحفظ:', result);
    } else {
      console.log('❌ فشل الحفظ:', result);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error);
  }
}

// تشغيل الاختبار
testCustomerPricing();
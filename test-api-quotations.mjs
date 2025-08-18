// Test API to check if 25R000057 is returned
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🔍 Testing /api/quotations endpoint...\n');
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Ahmed',
        password: 'Ahmed123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    // Extract cookie from login response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful\n');
    
    // Get quotations
    const response = await fetch('http://localhost:5000/api/quotations', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const quotations = await response.json();
    
    console.log(`📋 Total quotations received: ${quotations.length}`);
    
    // Search for 25R000057
    const target = quotations.find(q => 
      q.requestNumber === '25R000057' || 
      q.customRequestNumber === '25R000057'
    );
    
    if (target) {
      console.log('\n✅ Found 25R000057:');
      console.log('  - ID:', target.id);
      console.log('  - Request Number:', target.requestNumber);
      console.log('  - Custom Request Number:', target.customRequestNumber);
      console.log('  - Client Name:', target.clientName);
      console.log('  - Request Date:', target.requestDate);
      console.log('  - Status:', target.status);
      console.log('  - Total Items:', target.totalItems);
      console.log('  - Responsible Employee:', target.responsibleEmployee);
    } else {
      console.log('\n❌ 25R000057 not found in API response');
      
      // Show sample of what's returned
      console.log('\nFirst 5 quotations:');
      quotations.slice(0, 5).forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.requestNumber || q.customRequestNumber} - ${q.clientName}`);
      });
      
      // Search for similar numbers
      const similar = quotations.filter(q => 
        (q.requestNumber || '').includes('25R00005') ||
        (q.customRequestNumber || '').includes('25R00005')
      );
      
      if (similar.length > 0) {
        console.log('\nSimilar RFQ numbers:');
        similar.forEach(q => {
          console.log(`  - ${q.requestNumber || q.customRequestNumber}: ${q.clientName}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
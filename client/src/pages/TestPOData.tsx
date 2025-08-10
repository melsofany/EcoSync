import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function TestPOData() {
  const [itemId, setItemId] = useState('37ea4faa-9674-4586-b834-1fb3c96fce7a'); // P-000364
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/test-po-data', itemId],
    enabled: !!itemId
  });

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">اختبار بيانات أوامر الشراء</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">معرف الصنف:</label>
        <input
          type="text"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="border rounded px-3 py-2 w-96"
          placeholder="أدخل معرف الصنف"
        />
      </div>

      {isLoading && <div>جاري التحميل...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          خطأ: {error.message}
        </div>
      )}
      
      {data && (
        <div className="space-y-4">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <h3 className="font-bold">نتائج الاختبار:</h3>
            <p>معرف الصنف: {data.itemId}</p>
            <p>إجمالي السجلات: {data.totalRecords}</p>
          </div>
          
          {data.totalRecords > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-4 py-2">رقم أمر الشراء</th>
                    <th className="border px-4 py-2">رقم العرض</th>
                    <th className="border px-4 py-2">المورد</th>
                    <th className="border px-4 py-2">السعر</th>
                    <th className="border px-4 py-2">الكمية</th>
                    <th className="border px-4 py-2">تاريخ الطلب</th>
                    <th className="border px-4 py-2">العملة</th>
                    <th className="border px-4 py-2">المصدر</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 font-mono text-blue-600">
                        {record.poNumber}
                      </td>
                      <td className="border px-4 py-2 font-mono text-blue-600">
                        {record.quotationNumber}
                      </td>
                      <td className="border px-4 py-2">{record.supplierName}</td>
                      <td className="border px-4 py-2 text-right">
                        {record.unitPrice ? Number(record.unitPrice).toLocaleString() : '-'}
                      </td>
                      <td className="border px-4 py-2 text-center">{record.quantity}</td>
                      <td className="border px-4 py-2">
                        {record.orderDate ? new Date(record.orderDate).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="border px-4 py-2">{record.currency}</td>
                      <td className="border px-4 py-2">{record.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {data.totalRecords === 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              لا توجد سجلات أوامر شراء لهذا الصنف
            </div>
          )}
        </div>
      )}
    </div>
  );
}
#!/usr/bin/env python3
"""
تحليل بند محدد في ملف Excel الأصلي
"""
import json
import pandas as pd
from collections import Counter

def analyze_specific_item():
    try:
        print('🔍 تحليل البند 0666.001.GENRAL.0027...')
        
        # قراءة ملف Excel الأصلي
        with open('attached_assets/complete_excel_data.json', 'r', encoding='utf-8') as f:
            raw_content = f.read()
        
        # استبدال NaN بـ null
        clean_content = raw_content.replace('NaN', 'null')
        data = json.loads(clean_content)
        
        data_array = data.get('DATA', data)
        print(f'📊 إجمالي الصفوف في Excel: {len(data_array)}')
        
        target_item = "0666.001.GENRAL.0027"
        matching_rows = []
        
        # البحث عن البند في كل الأعمدة
        for index, row in enumerate(data_array):
            if isinstance(row, dict):
                for column_name, value in row.items():
                    if value and str(value).strip() == target_item:
                        matching_rows.append({
                            'row_index': index,
                            'column_name': column_name,
                            'item_code': value,
                            'rfq_number': row.get('Unnamed: 5') or row.get('F'),
                            'po_number': row.get('Unnamed: 11') or row.get('L'),
                            'quantity': row.get('Unnamed: 6') or row.get('G'),
                            'description': row.get('Unnamed: 3') or row.get('D'),
                            'line_item': row.get('Unnamed: 1') or row.get('B')
                        })
        
        print(f'\n📋 النتائج:')
        print(f'   - إجمالي الصفوف التي تحتوي على البند: {len(matching_rows)}')
        
        if matching_rows:
            print(f'\n🔍 أول 5 صفوف:')
            for i, row in enumerate(matching_rows[:5]):
                print(f'   {i+1}. الصف {row["row_index"]}:')
                print(f'      - العمود: {row["column_name"]}')
                print(f'      - كود البند: {row["item_code"]}')
                print(f'      - RFQ: {row["rfq_number"] or "غير محدد"}')
                print(f'      - PO: {row["po_number"] or "غير محدد"}')
                print(f'      - الكمية: {row["quantity"] or "غير محدد"}')
                desc = row["description"] or "غير محدد"
                if len(str(desc)) > 50:
                    desc = str(desc)[:50] + "..."
                print(f'      - الوصف: {desc}')
                print()
            
            # إحصائيات طلبات التسعير الفريدة
            unique_rfqs = set(row['rfq_number'] for row in matching_rows 
                            if row['rfq_number'] and str(row['rfq_number']).strip() != 'null')
            
            unique_pos = set(row['po_number'] for row in matching_rows 
                           if row['po_number'] and str(row['po_number']).strip() != 'null')
            
            print(f'📊 الإحصائيات:')
            print(f'   - طلبات التسعير الفريدة: {len(unique_rfqs)}')
            print(f'   - أوامر الشراء الفريدة: {len(unique_pos)}')
            print(f'   - إجمالي السجلات: {len(matching_rows)}')
            
            print(f'\n📋 طلبات التسعير الفريدة:')
            rfq_counter = Counter(row['rfq_number'] for row in matching_rows 
                                if row['rfq_number'] and str(row['rfq_number']).strip() != 'null')
            
            for rfq, count in list(rfq_counter.most_common(10)):
                print(f'   - {rfq}: {count} سجل')
            
            # حفظ التحليل
            analysis_result = {
                'target_item': target_item,
                'total_excel_rows': len(data_array),
                'matching_rows_count': len(matching_rows),
                'unique_rfqs': list(unique_rfqs),
                'unique_pos': list(unique_pos),
                'rfq_counts': dict(rfq_counter.most_common()),
                'matching_rows_sample': matching_rows[:10]
            }
            
            with open('attached_assets/specific_item_analysis.json', 'w', encoding='utf-8') as f:
                json.dump(analysis_result, f, indent=2, ensure_ascii=False)
            
            print(f'\n✅ تم حفظ التحليل في: attached_assets/specific_item_analysis.json')
            print(f'🎯 الخلاصة: البند موجود في {len(matching_rows)} سجل في ملف Excel')
            print(f'🎯 موزع على {len(unique_rfqs)} طلب تسعير فريد')
        
        else:
            print(f'❌ لم يتم العثور على البند {target_item} في ملف Excel')
            
    except Exception as e:
        print(f'❌ خطأ في التحليل: {e}')

if __name__ == '__main__':
    analyze_specific_item()
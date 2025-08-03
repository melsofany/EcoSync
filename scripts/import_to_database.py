#!/usr/bin/env python3
"""
استيراد البيانات من ملف JSON إلى قاعدة البيانات
"""
import json
import sys
import os
from datetime import datetime
import re

def clean_date(date_str):
    """تنظيف وتحويل التواريخ"""
    if not date_str or date_str.strip() == '' or str(date_str).lower() == 'nan':
        return None
    
    try:
        # جرب أشكال مختلفة للتاريخ
        date_str = str(date_str).strip()
        
        # إزالة الوقت إذا كان موجود
        if ' ' in date_str:
            date_str = date_str.split(' ')[0]
        
        # تحويل التاريخ
        for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y']:
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except:
                continue
        
        return None
    except:
        return None

def clean_number(num_str):
    """تنظيف الأرقام"""
    if not num_str or str(num_str).lower() == 'nan' or str(num_str).strip() == '':
        return 0
    
    try:
        # إزالة الفواصل والرموز
        num_str = str(num_str).replace(',', '').replace('$', '').replace('ر.س', '').strip()
        return float(num_str)
    except:
        return 0

def import_excel_data():
    """استيراد البيانات من Excel إلى قاعدة البيانات"""
    
    # قراءة ملف JSON
    with open('attached_assets/excel_import_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"تم تحميل {len(data)} سجل من ملف JSON")
    
    # تصفية البيانات لإزالة الصفوف الفارغة والعناوين
    valid_records = []
    for record in data:
        # تحقق من وجود PART NO و LINE ITEM
        part_no = str(record.get('PART NO') or '').strip()
        line_item = str(record.get('LINE ITEM') or '').strip()
        description = str(record.get('DESCREPTION') or '').strip()
        rfq = str(record.get('RFQ') or '').strip()
        
        # تخطي الصفوف الفارغة أو العناوين
        if (part_no and part_no != 'PART NO' and part_no.lower() != 'nan' and
            line_item and line_item != 'LINE ITEM' and line_item.lower() != 'nan' and
            description and description != 'DESCREPTION' and description.lower() != 'nan'):
            valid_records.append(record)
    
    print(f"عدد السجلات الصالحة: {len(valid_records)}")
    
    # عرض عينة من البيانات
    if valid_records:
        print("\nعينة من البيانات:")
        sample = valid_records[0]
        for key, value in sample.items():
            if value and str(value).lower() != 'nan':
                print(f"{key}: {value}")
    
    # تحضير البيانات للاستيراد
    import_data = {
        'items': [],
        'quotations': [],
        'quotation_items': [],
        'purchase_orders': [],
        'purchase_order_items': []
    }
    
    # معالجة كل سجل
    rfq_map = {}  # خريطة لطلبات التسعير
    item_map = {}  # خريطة للبنود
    po_map = {}   # خريطة لأوامر الشراء
    
    for i, record in enumerate(valid_records[:100]):  # أول 100 سجل للاختبار
        try:
            # بيانات البند
            part_no = str(record.get('PART NO') or '').strip()
            line_item = str(record.get('LINE ITEM') or '').strip()
            description = str(record.get('DESCREPTION') or '').strip()
            uom = str(record.get('UOM') or 'EACH').strip()
            
            if not part_no or not line_item or not description:
                continue
            
            # إنشاء معرف فريد للبند
            item_key = f"{part_no}_{line_item}"
            
            if item_key not in item_map:
                item_data = {
                    'item_number': f"IMPORTED_{i+1:06d}",
                    'part_number': part_no,
                    'line_item': line_item,
                    'description': description,
                    'unit_of_measure': uom,
                    'category': record.get('Catogry', 'GENERAL').strip() or 'GENERAL'
                }
                import_data['items'].append(item_data)
                item_map[item_key] = len(import_data['items']) - 1
            
            # بيانات طلب التسعير
            rfq_number = str(record.get('RFQ') or '').strip()
            if rfq_number and rfq_number not in rfq_map:
                rfq_date = clean_date(record.get('DATE/RFQ'))
                
                rfq_data = {
                    'custom_request_number': rfq_number,
                    'request_date': rfq_date or '2025-01-01',
                    'status': 'completed',
                    'client_name': 'EDC'
                }
                import_data['quotations'].append(rfq_data)
                rfq_map[rfq_number] = len(import_data['quotations']) - 1
            
            # بند طلب التسعير
            if rfq_number:
                qty = clean_number(record.get('QTY', 0))
                price = clean_number(record.get('PRICE/RFQ', 0))
                
                qi_data = {
                    'quotation_index': rfq_map[rfq_number],
                    'item_index': item_map[item_key],
                    'quantity': qty,
                    'unit_price': price,
                    'total_price': qty * price
                }
                import_data['quotation_items'].append(qi_data)
            
            # أمر الشراء (إذا وجد)
            po_number = str(record.get('PO') or '').strip()
            if po_number and po_number.lower() != 'nan':
                if po_number not in po_map:
                    po_date = clean_date(record.get('DATE /PO'))
                    
                    po_data = {
                        'po_number': po_number,
                        'po_date': po_date or '2025-01-01',
                        'status': 'delivered',
                        'client_name': 'EDC'
                    }
                    import_data['purchase_orders'].append(po_data)
                    po_map[po_number] = len(import_data['purchase_orders']) - 1
                
                # بند أمر الشراء
                po_qty = clean_number(record.get('Quantity/PO', 0))
                po_price = clean_number(record.get('PRICE/PO', 0))
                
                if po_qty > 0:
                    poi_data = {
                        'po_index': po_map[po_number],
                        'item_index': item_map[item_key],
                        'quantity': po_qty,
                        'unit_price': po_price,
                        'total_price': po_qty * po_price
                    }
                    import_data['purchase_order_items'].append(poi_data)
        
        except Exception as e:
            print(f"خطأ في معالجة السجل {i}: {e}")
            continue
    
    # إحصائيات
    print(f"\nإحصائيات الاستيراد:")
    print(f"البنود: {len(import_data['items'])}")
    print(f"طلبات التسعير: {len(import_data['quotations'])}")
    print(f"بنود طلبات التسعير: {len(import_data['quotation_items'])}")
    print(f"أوامر الشراء: {len(import_data['purchase_orders'])}")
    print(f"بنود أوامر الشراء: {len(import_data['purchase_order_items'])}")
    
    # حفظ البيانات
    with open('attached_assets/processed_import_data.json', 'w', encoding='utf-8') as f:
        json.dump(import_data, f, ensure_ascii=False, indent=2)
    
    print("تم حفظ البيانات المعالجة في: attached_assets/processed_import_data.json")
    
    return import_data

if __name__ == "__main__":
    import_excel_data()
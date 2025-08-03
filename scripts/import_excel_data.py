#!/usr/bin/env python3
"""
أداة استيراد البيانات من ملف Excel إلى قاعدة البيانات
"""
import pandas as pd
import json
import sys
import os
from datetime import datetime

def clean_and_process_excel(file_path):
    """معالجة ملف Excel وتنظيف البيانات"""
    try:
        # قراءة ملف Excel مع تخطي الصفوف الأولى للعثور على العناوين
        print("محاولة قراءة الملف مع صفوف مختلفة...")
        
        # قراءة من الصف 13 مباشرة كما أشار المستخدم
        print("قراءة البيانات من الصف 13...")
        df = pd.read_excel(file_path, header=12)  # الصف 13 = index 12
        
        print("أعمدة الجدول:")
        for i, col in enumerate(df.columns):
            if i < 20:
                print(f"{i}: {col}")
        
        # تنظيف أسماء الأعمدة
        df.columns = [str(col).strip() for col in df.columns]
        
        # تنظيف البيانات
        records = []
        for index, row in df.iterrows():
            record = {}
            for col in df.columns:
                value = row[col]
                if pd.isna(value) or value == '' or str(value).strip() == '':
                    record[str(col)] = None
                else:
                    record[str(col)] = str(value).strip()
            records.append(record)
        
        # حفظ البيانات
        output_file = 'attached_assets/excel_import_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        
        print(f"\nتم استخراج {len(records)} سجل من الملف")
        print(f"تم حفظ البيانات في: {output_file}")
        
        return records
        
    except Exception as e:
        print(f"خطأ في معالجة الملف: {e}")
        return None

if __name__ == "__main__":
    # البحث عن أحدث ملف Excel
    excel_files = [f for f in os.listdir('attached_assets') if f.endswith('.xlsx')]
    if not excel_files:
        print("لا توجد ملفات Excel في المجلد")
        sys.exit(1)
    
    # اختيار أحدث ملف
    latest_file = max(excel_files, key=lambda x: os.path.getctime(f'attached_assets/{x}'))
    file_path = f'attached_assets/{latest_file}'
    
    print(f"معالجة الملف: {latest_file}")
    
    # معالجة الملف
    data = clean_and_process_excel(file_path)
    
    if data:
        print("تم استخراج البيانات بنجاح!")
    else:
        print("فشل في استخراج البيانات")
        sys.exit(1)
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
        
        # البحث عن الجدول الصحيح
        best_header = None
        best_df = None
        
        for header_row in range(20):
            try:
                df = pd.read_excel(file_path, header=header_row)
                
                # البحث عن عناوين تطابق الصورة المرفقة
                cols_str = ' '.join([str(col).upper() for col in df.columns])
                target_cols = ['TOTAL PO', 'PRICE/PO', 'QTY', 'DATE/PO', 'PO', 'CATEGORY', 'RES.DATE', 'PRICE/RFQ', 'DATE/RFQ', 'RFQ', 'DESCRIPTION', 'PART NO', 'LINE ITEM', 'UOM']
                
                matches = sum(1 for target in target_cols if target in cols_str)
                
                if matches >= 8:  # إذا وجدت 8 عناوين أو أكثر
                    print(f"\nالصف {header_row} - تطابق {matches} عمود:")
                    for i, col in enumerate(df.columns):
                        if i < 25:
                            print(f"{i}: {col}")
                    
                    best_header = header_row
                    best_df = df
                    break
                    
            except Exception as e:
                continue
        
        if best_df is None:
            print("لم يتم العثور على الجدول الصحيح، جرب البحث يدوياً...")
            # جرب صفوف مختلفة وابحث عن صف يحتوي على LC1D32M7
            for header_row in range(30):
                try:
                    df = pd.read_excel(file_path, header=header_row)
                    # ابحث في أول 100 صف عن LC1D32M7
                    found_lc1d32m7 = False
                    for idx in range(min(100, len(df))):
                        row_values = ' '.join([str(val) for val in df.iloc[idx].values if pd.notna(val)])
                        if 'LC1D32M7' in row_values:
                            found_lc1d32m7 = True
                            print(f"وجدت LC1D32M7 في الصف {header_row}, السجل {idx}")
                            break
                    
                    if found_lc1d32m7:
                        print(f"استخدام الصف {header_row} كعناوين:")
                        for i, col in enumerate(df.columns):
                            if i < 20:
                                print(f"{i}: {col}")
                        best_df = df
                        break
                        
                except Exception as e:
                    continue
        
        df = best_df if best_df is not None else df
        
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
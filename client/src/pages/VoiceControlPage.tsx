import React from 'react';
import { VoiceCommand } from '@/components/VoiceCommand';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Globe, Users, Volume2 } from 'lucide-react';

export function VoiceControlPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">الأوامر الصوتية متعددة اللغات</h1>
        <p className="text-gray-600">
          نظام متقدم للتحكم الصوتي يدعم اللهجات العربية المختلفة واللغات المتعددة
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-blue-500" />
              دعم متعدد اللغات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              دعم للعربية بلهجاتها المختلفة والإنجليزية والفرنسية
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">مصري</Badge>
              <Badge variant="outline">خليجي</Badge>
              <Badge variant="outline">شامي</Badge>
              <Badge variant="outline">مغاربي</Badge>
              <Badge variant="outline">English</Badge>
              <Badge variant="outline">Français</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-green-500" />
              تقنية متقدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              استخدام Web Speech API مع تحسينات للهجات المحلية
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">تسجيل مستمر</Badge>
              <Badge variant="outline">نتائج فورية</Badge>
              <Badge variant="outline">دقة عالية</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-500" />
              سهولة الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              أوامر طبيعية وبديهية للعمليات اليومية
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">بحث سريع</Badge>
              <Badge variant="outline">إنشاء مباشر</Badge>
              <Badge variant="outline">تنقل ذكي</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Voice Command Component */}
      <VoiceCommand />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            التفاصيل التقنية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">اللهجات العربية المدعومة:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16">مصري</Badge>
                  تحسينات خاصة للكلمات المصرية المحلية
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16">خليجي</Badge>
                  دعم لهجات الخليج (السعودية، الإمارات، الكويت)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16">شامي</Badge>
                  لهجات بلاد الشام (سوريا، لبنان، الأردن)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16">مغاربي</Badge>
                  لهجات المغرب العربي (المغرب، تونس، الجزائر)
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">الميزات التقنية:</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>التعرف المستمر:</strong> استماع مستمر للأوامر</li>
                <li>• <strong>النتائج المؤقتة:</strong> عرض النص أثناء الكلام</li>
                <li>• <strong>بدائل متعددة:</strong> اقتراح عدة تفسيرات للأمر</li>
                <li>• <strong>تحليل الثقة:</strong> قياس دقة التعرف على الكلام</li>
                <li>• <strong>تنفيذ ذكي:</strong> تحليل المعنى وتنفيذ الإجراء المناسب</li>
                <li>• <strong>ردود صوتية:</strong> تأكيد الأوامر بالصوت</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">ملاحظات الاستخدام:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• يتطلب متصفح حديث يدعم Web Speech API (Chrome, Edge, Safari)</li>
              <li>• قد يطلب المتصفح إذن استخدام الميكروفون في المرة الأولى</li>
              <li>• للحصول على أفضل النتائج، تحدث بوضوح وبصوت معتدل</li>
              <li>• يمكن استخدام الأوامر باللغة العربية أو الإنجليزية</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
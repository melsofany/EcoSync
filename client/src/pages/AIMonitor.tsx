import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Monitor, Activity, TrendingUp } from "lucide-react";

export default function AIMonitor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
            <Brain className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-900 mb-4">🤖 شاشة مراقبة التوحيد الذكي</h1>
          <p className="text-2xl text-orange-700">نظام قرطبة للتوريدات - مراقبة حية لعمليات التوحيد بالذكاء الاصطناعي</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-4xl font-bold text-orange-800 mb-2">5,449</div>
              <div className="text-lg text-orange-600">إجمالي الأصناف</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <div className="text-4xl font-bold text-green-800 mb-2">1,832</div>
              <div className="text-lg text-green-600">الأصناف المعالجة</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-4xl font-bold text-blue-800 mb-2">287</div>
              <div className="text-lg text-blue-600">التكرارات المكتشفة</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <div className="text-4xl font-bold text-purple-800 mb-2">98.7%</div>
              <div className="text-lg text-purple-600">دقة التطابق</div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-300 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-orange-900 mb-6 text-center">
              <Activity className="inline-block h-8 w-8 ml-2" />
              سجل النشاط المباشر
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {[
                { time: "12:32", status: "✅", message: "تم تحليل صنف P-0000287 بنجاح" },
                { time: "12:31", status: "🔄", message: "جاري معالجة مجموعة جديدة من الأصناف..." },
                { time: "12:30", status: "🎯", message: "تم اكتشاف تكرار محتمل: صنف 'مضخة مياه 5HP'" },
                { time: "12:29", status: "⚡", message: "تم تحديث معايير التوحيد الذكي" },
                { time: "12:28", status: "📝", message: "تم إنشاء تقرير توحيد للفترة الأخيرة" },
                { time: "12:27", status: "🔍", message: "فحص جودة البيانات المدخلة" },
                { time: "12:26", status: "💾", message: "حفظ النتائج في Google Sheets" },
                { time: "12:25", status: "🚀", message: "بدء دورة تحليل جديدة" }
              ].map((entry, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-green-600 font-bold text-lg min-w-[80px]">{entry.time}</div>
                  <div className="text-2xl mx-4">{entry.status}</div>
                  <div className="text-gray-800 text-lg">{entry.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-orange-800 mb-2">0.8s</div>
              <div className="text-lg text-orange-600">متوسط وقت المعالجة</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <Monitor className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-green-800 mb-2">نشط</div>
              <div className="text-lg text-green-600">حالة النظام</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-blue-800 mb-2">14.2M</div>
              <div className="text-lg text-blue-600">إجمالي القيمة المعالجة</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Status Indicator */}
        <div className="fixed top-8 left-8 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border-2 border-green-300">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-semibold">🤖 AI نشط</span>
          </div>
        </div>

        {/* Refresh Button */}
        <Button 
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl"
          onClick={() => window.location.reload()}
        >
          <Monitor className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
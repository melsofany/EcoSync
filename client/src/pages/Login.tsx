import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Lock, ArrowLeft, Sheet } from "lucide-react";
import qortobaLogo from "@/assets/qortoba-logo.png";
import logisticsBackground from "@/assets/logistics-background.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const googleSheetsLogin = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/google-sheets-login", data);
      return response;
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "فشل في تسجيل الدخول",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: LoginForm) => {
    googleSheetsLogin.mutate(data);
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundImage: `url(${logisticsBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      dir="rtl"
    >
      {/* طبقة شفافة داكنة للنص */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20 z-0"></div>
      
      <Card className="w-full max-w-md shadow-2xl bg-white/75 backdrop-blur-lg border border-white/20 relative z-10 overflow-hidden">
        {/* تأثير الضوء على الفريم */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
        <CardContent className="pt-8 pb-8 px-8 relative z-10">
          <div className="text-center mb-8">
            {/* Company Logo */}
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img 
                src={qortobaLogo} 
                alt="قرطبة للتوريدات" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">نظام قرطبة</h1>
            <p className="text-gray-700 drop-shadow-sm">للتوريدات</p>
          </div>

          {/* Google Sheets Info */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Sheet className="h-5 w-5 text-green-600 ml-2" />
              <span className="text-sm font-medium text-green-700">تسجيل الدخول عبر Google Sheets</span>
            </div>
            <div className="text-xs text-gray-500">
              استخدام قاعدة بيانات Google Sheets حصرياً
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  className="pl-12 bg-white/90 border-gray-200 focus:bg-white"
                  {...form.register("username")}
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              </div>
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  className="pl-12 bg-white/90 border-gray-200 focus:bg-white"
                  {...form.register("password")}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={googleSheetsLogin.isPending}
            >
              {googleSheetsLogin.isPending ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner"></div>
                  <span>جاري تسجيل الدخول...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Sheet className="h-5 w-5 ml-2" />
                  <span>تسجيل الدخول بـ Google Sheets</span>
                  <ArrowLeft className="h-5 w-5 rtl-flip" />
                </div>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center text-sm text-blue-800">
              <p className="font-semibold mb-2">بيانات تجريبية:</p>
              <p><strong>المدير:</strong> admin / admin123</p>
              <p><strong>مدخل البيانات:</strong> data_entry / data123</p>
              <p><strong>محاسب:</strong> accountant / acc123</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>© 2025 قرطبة للتوريدات - جميع الحقوق محفوظة</p>
            <p className="mt-1">مدعوم بـ Google Sheets</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
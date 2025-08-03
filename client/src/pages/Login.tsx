import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building, User, Lock, ArrowLeft } from "lucide-react";
import qortobaLogo from "@/assets/qortoba-logo.png";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const login = useLogin();
  const [showCredentials, setShowCredentials] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            {/* Company Logo */}
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img 
                src={qortobaLogo} 
                alt="قرطبة للتوريدات" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">نظام قرطبة</h1>
            <p className="text-gray-600">للتوريدات</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  className="pl-12"
                  {...form.register("username")}
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                  className="pl-12"
                  {...form.register("password")}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner"></div>
                  <span>جاري تسجيل الدخول...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="h-5 w-5 rtl-flip" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-sm"
            >
              {showCredentials ? "إخفاء" : "عرض"} بيانات الاختبار
            </Button>

            {showCredentials && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                <div className="font-medium text-gray-700">حسابات الاختبار:</div>
                <div><strong>مدير:</strong> admin / admin123</div>
                <div><strong>تقنية المعلومات:</strong> it_admin / it123</div>
                <div><strong>إدخال البيانات:</strong> data_entry / data123</div>
                <div><strong>المشتريات:</strong> purchasing / purchase123</div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            النسخة 1.0 - جميع الحقوق محفوظة © 2024
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

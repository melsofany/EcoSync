import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building, User, Lock, ArrowLeft, Mail } from "lucide-react";
import qortobaLogo from "@/assets/qortoba-logo.png";
import SupplyChainBackground from "@/components/SupplyChainBackground";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const login = useLogin();
  const [showCredentials, setShowCredentials] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

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

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetMessage("يرجى إدخال البريد الإلكتروني");
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const result = await response.json();
      
      if (response.ok) {
        setResetMessage("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني");
      } else {
        setResetMessage(result.message || "حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    } catch (error) {
      setResetMessage("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      <SupplyChainBackground />
      <div className="relative z-10 w-full flex justify-center">
        <Card className="w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-sm border-0">
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

          {/* Password Reset Section */}
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              نسيت كلمة المرور؟
            </Button>
          </div>

          {showResetPassword && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-blue-800 mb-2">استعادة كلمة المرور</h3>
                <p className="text-sm text-blue-700">أدخل بريدك الإلكتروني لإرسال رابط الاستعادة</p>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-12"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
                
                <Button
                  onClick={handleResetPassword}
                  className="w-full"
                  variant="outline"
                >
                  إرسال رابط الاستعادة
                </Button>
                
                {resetMessage && (
                  <div className={`text-sm text-center p-2 rounded ${
                    resetMessage.includes("تم إرسال") 
                      ? "text-green-700 bg-green-100" 
                      : "text-red-700 bg-red-100"
                  }`}>
                    {resetMessage}
                  </div>
                )}
              </div>
            </div>
          )}

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
            النسخة 1.0 - جميع الحقوق محفوظة لقرطبة للتوريدات © 2025
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

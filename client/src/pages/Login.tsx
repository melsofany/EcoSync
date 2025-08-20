import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building, User, Lock, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import qortobaLogo from "@/assets/qortoba-logo.png";
import logisticsBackground from "@/assets/logistics-background.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const login = useLogin();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  className="pl-12 pr-12 bg-white/90 border-gray-200 focus:bg-white"
                  {...form.register("password")}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
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
            <Link href="/forgot-password">
              <Button
                variant="link"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                نسيت كلمة المرور؟
              </Button>
            </Link>
          </div>



          <div className="mt-6 text-center text-sm text-gray-500">
            النسخة 1.0 - جميع الحقوق محفوظة لقرطبة للتوريدات © 2025
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

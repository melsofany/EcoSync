import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import qortobaLogo from "@/assets/qortoba-logo.png";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setStatus('error');
      setMessage("رابط استعادة كلمة المرور غير صالح");
      return;
    }
    
    setToken(tokenParam);
  }, []);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          newPassword: data.newPassword 
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage("تم تغيير كلمة المرور بنجاح");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || "حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    } catch (error) {
      setStatus('error');
      setMessage("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">تم بنجاح!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">سيتم توجيهك لصفحة الدخول خلال ثوان...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">خطأ</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              العودة لصفحة الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img 
                src={qortobaLogo} 
                alt="قرطبة للتوريدات" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">إعادة تعيين كلمة المرور</h1>
            <p className="text-gray-600">أدخل كلمة المرور الجديدة</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="pl-12"
                  {...form.register("newPassword")}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  className="pl-12"
                  {...form.register("confirmPassword")}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner"></div>
                  <span>جاري التحديث...</span>
                </div>
              ) : (
                "تحديث كلمة المرور"
              )}
            </Button>

            {status === 'error' && message && (
              <div className="text-sm text-center p-2 rounded text-red-700 bg-red-100">
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setLocation('/')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              العودة لصفحة الدخول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

const forgotPasswordSchema = z.object({
  username: z.string()
    .min(1, 'اسم المستخدم مطلوب')
    .trim(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', data);
      
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: 'تم الإرسال بنجاح',
          description: 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        });
      } else {
        toast({
          title: 'خطأ',
          description: response.message || 'حدث خطأ في إرسال البريد الإلكتروني',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('خطأ في طلب إعادة التعيين:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">تم الإرسال بنجاح!</CardTitle>
            <CardDescription className="text-base mt-2">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني المسجل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>تحقق من بريدك الإلكتروني</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>افتح بريدك الإلكتروني المسجل في النظام</li>
                  <li>ابحث عن رسالة من "نظام قرطبة"</li>
                  <li>اضغط على رابط إعادة التعيين في الرسالة</li>
                  <li>الرابط صالح لمدة ساعة واحدة فقط</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">استعادة كلمة المرور</CardTitle>
          <CardDescription>
            أدخل اسم المستخدم الخاص بك وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل اسم المستخدم"
                        disabled={isLoading}
                        autoComplete="username"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Mail className="ml-2 h-4 w-4" />
                    إرسال رابط إعادة التعيين
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            تذكرت كلمة المرور؟
          </div>
          <Link href="/login">
            <Button variant="link" className="text-sm">
              العودة إلى تسجيل الدخول
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
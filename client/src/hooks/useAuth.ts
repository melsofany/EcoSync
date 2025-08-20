import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login, logout, type LoginCredentials, type User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: 1,
    retryDelay: 2000,
    refetchInterval: false,
    refetchOnWindowFocus: true, // تحديث عند العودة للنافذة
    refetchOnReconnect: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
  });

  // سجل البيانات المستلمة
  if (user) {
    console.log('🔐 بيانات المستخدم من API:', {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    });
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      // مسح الكاش القديم أولاً
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // ثم تعيين البيانات الجديدة
      queryClient.setQueryData(["/api/auth/me"], user);
      
      // حفظ بيانات المستخدم في localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ تحديث بيانات المستخدم بعد تسجيل الدخول:', {
        username: user.username,
        fullName: user.fullName,
        role: user.role
      });
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${user.fullName || user.username || 'بك'}`,
      });
      
      // إعادة تحميل الصفحة لضمان تحديث الصلاحيات
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "فشل في تسجيل الدخول",
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      
      // مسح بيانات المستخدم من localStorage
      localStorage.removeItem('user');
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "إلى اللقاء",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message || "فشل في تسجيل الخروج",
        variant: "destructive",
      });
    },
  });
}

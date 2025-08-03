import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden bg-gray-100 hover:bg-gray-200 border border-gray-300 shadow-inner"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
              نظام إدارة التوريدات
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
              مرحباً بك في نظام قرطبة للتوريدات
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
          {/* User Info and Time */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <UserAvatar 
              user={user || { fullName: 'مستخدم', profileImage: null }} 
              size="sm" 
            />
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                {user?.fullName || 'مستخدم'}
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1 space-x-reverse">
                <span>{formatTime(currentTime)}</span>
                <span>-</span>
                <span>{formatDate(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

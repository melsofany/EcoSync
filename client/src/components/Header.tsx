import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationPanel from "./NotificationPanel";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

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
            className="lg:hidden"
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
          {/* Notifications */}
          <NotificationPanel />

          {/* Current Time */}
          <div className="text-xs sm:text-sm text-gray-500 text-center hidden sm:block">
            <div className="font-medium">{formatTime(currentTime)}</div>
            <div className="text-xs">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

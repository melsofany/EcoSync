import { User } from "lucide-react";

interface UserAvatarProps {
  user: {
    fullName: string;
    profileImage?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base"
};

export function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isValidImageUrl = (url: string | null | undefined) => {
    if (!url) return false;
    // Allow local object storage URLs
    if (url.startsWith('/objects/') || url.startsWith('/public-objects/')) {
      return true;
    }
    // Check if URL is a direct image link
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.includes(ext)) && 
           !lowercaseUrl.includes('ibb.co/') && // Exclude ImgBB page links
           (lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://'));
  };

  return (
    <div className={`rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {user.profileImage && isValidImageUrl(user.profileImage) ? (
        <img 
          src={user.profileImage} 
          alt={user.fullName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // إذا فشل تحميل الصورة، إظهار الحروف الأولى
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              // Safe DOM manipulation - create elements instead of using innerHTML
              const span = document.createElement('span');
              span.className = 'text-white font-medium';
              span.textContent = getInitials(user.fullName); // textContent safely escapes content
              parent.innerHTML = ''; // Clear existing content
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        <span className="text-white font-medium">
          {getInitials(user.fullName)}
        </span>
      )}
    </div>
  );
}
import { UserAvatar } from "./UserAvatar";

interface UserDisplayNameProps {
  user: {
    fullName: string;
    username?: string;
    email?: string | null;
    phone?: string | null;
    profileImage?: string | null;
  };
  showAvatar?: boolean;
  showUsername?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function UserDisplayName({ 
  user, 
  showAvatar = true,
  showUsername = true,
  showEmail = false,
  showPhone = false,
  avatarSize = "md",
  layout = "horizontal",
  className = ""
}: UserDisplayNameProps) {
  const isHorizontal = layout === "horizontal";
  
  return (
    <div className={`flex items-center ${isHorizontal ? 'space-x-3 space-x-reverse' : 'flex-col space-y-2'} ${className}`}>
      {showAvatar && (
        <UserAvatar user={user} size={avatarSize} />
      )}
      
      <div className={`${isHorizontal ? '' : 'text-center'}`}>
        <p className="font-medium text-gray-800">{user.fullName}</p>
        {showUsername && user.username && (
          <p className="text-sm text-gray-500">@{user.username}</p>
        )}
        {showEmail && user.email && (
          <p className="text-xs text-gray-400">{user.email}</p>
        )}
        {showPhone && user.phone && (
          <p className="text-xs text-gray-400">{user.phone}</p>
        )}
      </div>
    </div>
  );
}
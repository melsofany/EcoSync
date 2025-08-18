import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileImageUploaderProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

export function ProfileImageUploader({ currentImage, onImageChange, className }: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ في نوع الملف",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار صورة أصغر من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // تحويل الصورة إلى Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // عرض الصورة مباشرة
        setPreviewUrl(base64String);
        onImageChange(base64String);
        
        toast({
          title: "تم رفع الصورة",
          description: "تم تحميل الصورة بنجاح",
        });
        
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "خطأ في قراءة الملف",
          description: "فشل في قراءة الصورة المحددة",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في رفع الصورة",
        description: "حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onImageChange('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* Image Preview */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="الصورة الشخصية"
              className="w-full h-full object-cover"
              onError={() => {
                setPreviewUrl(null);
                onImageChange('');
              }}
            />
          ) : (
            <User className="w-10 h-10 text-gray-400" />
          )}
        </div>

        {/* Upload/Remove Controls */}
        <div className="flex space-x-2 space-x-reverse">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById('profile-image-input')?.click()}
          >
            <Upload className="w-4 h-4 ml-2" />
            {isUploading ? 'جاري الرفع...' : 'رفع صورة'}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeImage}
            >
              <X className="w-4 h-4 ml-2" />
              إزالة
            </Button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="profile-image-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        الصور المدعومة: JPG, PNG, GIF (أقصى حجم: 5 ميجابايت)
      </p>
    </div>
  );
}
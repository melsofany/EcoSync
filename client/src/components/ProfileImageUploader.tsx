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
      // تصغير الصورة قبل تحويلها إلى Base64
      const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // حساب الأبعاد الجديدة مع الحفاظ على النسبة
              if (width > height) {
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = (width * maxHeight) / height;
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);

              // تحويل إلى Base64 بجودة مضغوطة
              const base64 = canvas.toDataURL('image/jpeg', 0.7);
              
              // التحقق من حجم الناتج
              if (base64.length > 45000) {
                // إذا كان كبيراً جداً، قلل الجودة أكثر
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                resolve(compressedBase64);
              } else {
                resolve(base64);
              }
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const base64String = await resizeImage(file, 200, 200);
      
      // عرض الصورة
      setPreviewUrl(base64String);
      onImageChange(base64String);
      
      toast({
        title: "تم رفع الصورة",
        description: "تم تحميل وضغط الصورة بنجاح",
      });
      
      setIsUploading(false);
      
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
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded?: (imageUrl: string) => void;
  className?: string;
}

export default function ProfileImageUploader({ 
  currentImageUrl, 
  onImageUploaded, 
  className = "" 
}: ProfileImageUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create Uppy instance for profile images
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          const response = await apiRequest('/api/profile-images/upload', { method: 'POST' });
          return {
            method: 'PUT' as const,
            url: response.uploadURL,
          };
        },
      })
      .on("complete", async (result) => {
        if (result.successful.length > 0) {
          const uploadedFile = result.successful[0];
          const uploadURL = uploadedFile.uploadURL;
          
          try {
            // Update user profile with new image
            const response = await apiRequest('/api/profile-images/update', {
              method: 'PUT',
              body: JSON.stringify({ imageURL: uploadURL }),
              headers: { 'Content-Type': 'application/json' },
            });

            toast({
              title: "تم تحديث الصورة الشخصية",
              description: "تم رفع الصورة الشخصية بنجاح",
            });

            // Callback to parent component
            if (onImageUploaded) {
              onImageUploaded(response.profileImagePath);
            }

            // Refresh user data
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
            
            setShowModal(false);
          } catch (error) {
            console.error('Error updating profile image:', error);
            toast({
              title: "خطأ في تحديث الصورة",
              description: "حدث خطأ أثناء تحديث الصورة الشخصية",
              variant: "destructive",
            });
          }
        }
      })
  );

  return (
    <div className={className}>
      <Button 
        onClick={() => setShowModal(true)} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        {currentImageUrl ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        {currentImageUrl ? "تغيير الصورة" : "رفع صورة"}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        locale={{
          strings: {
            addMore: "إضافة المزيد",
            addMoreFiles: "إضافة ملفات أخرى",
            addingMoreFiles: "إضافة ملفات أخرى",
            allowAccessDescription: "لتتمكن من التقاط الصور أو تسجيل الفيديو بكاميرا جهازك، يرجى السماح بالوصول للكاميرا لهذا الموقع.",
            allowAccessTitle: "يرجى السماح بالوصول لكاميرا جهازك",
            authenticateWith: "الاتصال بـ %{pluginName}",
            authenticateWithTitle: "يرجى التوثيق مع %{pluginName} لتحديد الملفات",
            back: "رجوع",
            browse: "تصفح",
            browseFiles: "تصفح الملفات",
            cancel: "إلغاء",
            cancelUpload: "إلغاء الرفع",
            chooseFiles: "اختيار الملفات",
            closeModal: "إغلاق النافذة",
            companionError: "فشل الاتصال بـ Companion",
            complete: "مكتمل",
            connectedToInternet: "متصل بالإنترنت",
            copyLink: "نسخ الرابط",
            copyLinkToClipboardFallback: "انسخ الرابط أدناه",
            copyLinkToClipboardSuccess: "تم نسخ الرابط إلى الحافظة",
            createdOn: "تم الإنشاء في %{date}",
            dashboardTitle: "منطقة رفع الملفات",
            dashboardWindowTitle: "نافذة رفع الملفات (اضغط escape للإغلاق)",
            dataUploadedOfTotal: "%{complete} من %{total}",
            done: "تم",
            dropHereOr: "اسحب الملفات هنا أو %{browse}",
            dropHint: "اسحب ملفاتك هنا",
            dropPasteBoth: "اسحب الملفات هنا، الصق أو %{browse}",
            dropPasteFiles: "اسحب الملفات هنا، الصق أو %{browse}",
            dropPasteFolders: "اسحب الملفات هنا، الصق أو %{browse}",
            dropPasteImportBoth: "اسحب الملفات هنا، الصق، %{browse} أو استورد من",
            dropPasteImportFiles: "اسحب الملفات هنا، الصق، %{browse} أو استورد من",
            dropPasteImportFolders: "اسحب الملفات هنا، الصق، %{browse} أو استورد من",
            editFile: "تعديل الملف",
            editing: "تعديل %{file}",
            error: "خطأ",
            errorProcessingUpload: "خطأ في معالجة الرفع",
            files: "ملفات",
            filesUploadedOfTotal: {
              "0": "%{complete} من %{smart_count} ملف تم رفعه",
              "1": "%{complete} من %{smart_count} ملف تم رفعه",
              "2": "%{complete} من %{smart_count} ملفين تم رفعهما",
              "3": "%{complete} من %{smart_count} ملفات تم رفعها",
              "4": "%{complete} من %{smart_count} ملفات تم رفعها"
            },
            filter: "تصفية",
            finishEditingFile: "إنهاء تعديل الملف",
            folderAdded: {
              "0": "تمت إضافة %{smart_count} ملف من %{folder}",
              "1": "تمت إضافة %{smart_count} ملف من %{folder}",
              "2": "تمت إضافة %{smart_count} ملفين من %{folder}",
              "3": "تمت إضافة %{smart_count} ملفات من %{folder}",
              "4": "تمت إضافة %{smart_count} ملفات من %{folder}"
            },
            import: "استيراد",
            importFrom: "استيراد من %{name}",
            loading: "جاري التحميل...",
            logOut: "تسجيل خروج",
            myDevice: "جهازي",
            noFilesFound: "لا توجد ملفات أو مجلدات هنا",
            noInternetConnection: "لا يوجد اتصال بالإنترنت",
            pause: "إيقاف مؤقت",
            pauseUpload: "إيقاف الرفع مؤقتاً",
            paused: "متوقف مؤقتاً",
            poweredBy: "مدعوم بواسطة %{uppy}",
            processingXFiles: {
              "0": "معالجة %{smart_count} ملف",
              "1": "معالجة %{smart_count} ملف",
              "2": "معالجة %{smart_count} ملفين",
              "3": "معالجة %{smart_count} ملفات",
              "4": "معالجة %{smart_count} ملفات"
            },
            removeFile: "إزالة الملف",
            resetFilter: "إعادة تعيين التصفية",
            resume: "استئناف",
            resumeUpload: "استئناف الرفع",
            retry: "إعادة المحاولة",
            retryUpload: "إعادة محاولة الرفع",
            saveChanges: "حفظ التغييرات",
            selectX: {
              "0": "تحديد %{smart_count}",
              "1": "تحديد %{smart_count}",
              "2": "تحديد %{smart_count}",
              "3": "تحديد %{smart_count}",
              "4": "تحديد %{smart_count}"
            },
            smile: "ابتسم!",
            startRecording: "بدء التسجيل",
            stopRecording: "إيقاف التسجيل",
            takePicture: "التقاط صورة",
            timedOut: "انتهت المهلة الزمنية للرفع، جاري إعادة المحاولة...",
            upload: "رفع",
            uploadComplete: "اكتمل الرفع",
            uploadFailed: "فشل الرفع",
            uploadPaused: "تم إيقاف الرفع مؤقتاً",
            uploadXFiles: {
              "0": "رفع %{smart_count} ملف",
              "1": "رفع %{smart_count} ملف",
              "2": "رفع %{smart_count} ملفين",
              "3": "رفع %{smart_count} ملفات",
              "4": "رفع %{smart_count} ملفات"
            },
            uploadXNewFiles: {
              "0": "رفع +%{smart_count} ملف",
              "1": "رفع +%{smart_count} ملف",
              "2": "رفع +%{smart_count} ملفين",
              "3": "رفع +%{smart_count} ملفات",
              "4": "رفع +%{smart_count} ملفات"
            },
            uploading: "جاري الرفع",
            uploadingXFiles: {
              "0": "رفع %{smart_count} ملف",
              "1": "رفع %{smart_count} ملف",
              "2": "رفع %{smart_count} ملفين",
              "3": "رفع %{smart_count} ملفات",
              "4": "رفع %{smart_count} ملفات"
            },
            xFilesSelected: {
              "0": "%{smart_count} ملف محدد",
              "1": "%{smart_count} ملف محدد",
              "2": "%{smart_count} ملفين محددين",
              "3": "%{smart_count} ملفات محددة",
              "4": "%{smart_count} ملفات محددة"
            },
            xMoreFilesAdded: {
              "0": "%{smart_count} ملف إضافي",
              "1": "%{smart_count} ملف إضافي",
              "2": "%{smart_count} ملفين إضافيين",
              "3": "%{smart_count} ملفات إضافية",
              "4": "%{smart_count} ملفات إضافية"
            },
            xTimeLeft: "%{time} متبقي",
            youCanOnlyUploadFileTypes: "يمكنك رفع: %{types} فقط",
            youCanOnlyUploadX: {
              "0": "يمكنك رفع %{smart_count} ملف فقط",
              "1": "يمكنك رفع %{smart_count} ملف فقط",
              "2": "يمكنك رفع %{smart_count} ملفين فقط",
              "3": "يمكنك رفع %{smart_count} ملفات فقط",
              "4": "يمكنك رفع %{smart_count} ملفات فقط"
            },
            youHaveToAtLeastSelectX: {
              "0": "يجب عليك تحديد %{smart_count} ملف على الأقل",
              "1": "يجب عليك تحديد %{smart_count} ملف على الأقل",
              "2": "يجب عليك تحديد %{smart_count} ملفين على الأقل",
              "3": "يجب عليك تحديد %{smart_count} ملفات على الأقل",
              "4": "يجب عليك تحديد %{smart_count} ملفات على الأقل"
            }
          }
        }}
      />
    </div>
  );
}
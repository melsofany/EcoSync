import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Play, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecoveryProgress {
  currentColumn: string;
  totalColumns: number;
  completedColumns: number;
  totalRows: number;
  processedRows: number;
  estimatedTimeRemaining: string;
  status: 'initializing' | 'processing' | 'completed' | 'error';
}

interface ColumnData {
  name: string;
  arabicName: string;
  processedRows: number;
  totalRows: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  sampleData: any[];
}

interface FileInfo {
  name: string;
  size: number;
  modified: string;
}

export default function DataRecoveryStandalone() {
  const [progress, setProgress] = useState<RecoveryProgress | null>(null);
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  // Fetch progress data
  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/data-recovery/progress');
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
        setColumns(data.columns);
        setPreviewData(data.preview || []);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // Fetch available files
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/data-recovery/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Start recovery process
  const startRecovery = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/data-recovery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "تم بدء عملية الاسترداد",
          description: data.message,
        });
        setAutoRefresh(true);
      } else {
        throw new Error('Failed to start recovery');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في بدء عملية الاسترداد",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Download file
  const downloadFile = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/data-recovery/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto-refresh when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && progress?.status === 'processing') {
      interval = setInterval(fetchProgress, 2000);
    } else if (progress?.status === 'completed' || progress?.status === 'error') {
      setAutoRefresh(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, progress?.status]);

  // Initial data fetch
  useEffect(() => {
    fetchProgress();
    fetchFiles();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      error: 'destructive',
      pending: 'outline'
    };
    
    const labels = {
      completed: 'مكتمل',
      processing: 'جاري المعالجة',
      error: 'خطأ',
      pending: 'في الانتظار'
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const overallProgress = progress ? (progress.processedRows / (progress.totalRows * progress.totalColumns)) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">استرداد البيانات</h1>
          <p className="text-muted-foreground">استرداد البيانات من الملفات المستخرجة (5,449 صف × 13 عمود)</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchProgress}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          <Button
            onClick={startRecovery}
            disabled={isStarting || progress?.status === 'processing'}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? 'جاري البدء...' : 'بدء الاسترداد'}
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(progress.status)}
              حالة العملية
            </CardTitle>
            <CardDescription>
              العمود الحالي: {progress.currentColumn} | 
              الأعمدة المكتملة: {progress.completedColumns} من {progress.totalColumns} | 
              الوقت المتبقي: {progress.estimatedTimeRemaining}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم الإجمالي</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            
            {progress.status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  حدث خطأ أثناء عملية الاسترداد. يرجى المحاولة مرة أخرى.
                </AlertDescription>
              </Alert>
            )}
            
            {progress.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  تم اكتمال عملية استرداد البيانات بنجاح! تم معالجة {progress.processedRows.toLocaleString()} خلية.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Columns Status */}
      {columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>حالة الأعمدة</CardTitle>
            <CardDescription>تقدم معالجة كل عمود من البيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div key={column.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">العمود {column.name}</h4>
                    {getStatusBadge(column.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{column.arabicName}</p>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>البيانات:</span>
                      <span>{column.processedRows.toLocaleString()} / {column.totalRows.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(column.processedRows / column.totalRows) * 100} 
                      className="h-1 mt-1"
                    />
                  </div>
                  {column.sampleData.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">عينة: </span>
                      <span className="font-mono">
                        {column.sampleData.slice(0, 3).map(String).join(', ')}
                        {column.sampleData.length > 3 && '...'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الملفات المستخرجة</CardTitle>
            <CardDescription>الملفات المتاحة للتحميل</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الملف</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead>تاريخ التعديل</TableHead>
                  <TableHead>الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-mono text-sm">{file.name}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{new Date(file.modified).toLocaleString('ar-EG')}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => downloadFile(file.name)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        تحميل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>معاينة البيانات</CardTitle>
            <CardDescription>أول 10 صفوف من البيانات المستردة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(col => (
                      <TableHead key={col} className="text-xs">العمود {col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(col => (
                        <TableCell key={col} className="text-xs font-mono max-w-24 truncate">
                          {row[col] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
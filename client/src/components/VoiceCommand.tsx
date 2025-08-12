import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommand {
  id: string;
  text: string;
  confidence: number;
  language: string;
  accent: string;
  timestamp: Date;
  action?: string;
}

interface VoiceSettings {
  language: string;
  accent: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export function VoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'ar-EG', // Arabic (Egypt)
    accent: 'egyptian',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3
  });
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Language and accent configurations
  const languageOptions = [
    { value: 'ar-EG', label: 'العربية - مصر', accent: 'egyptian' },
    { value: 'ar-SA', label: 'العربية - السعودية', accent: 'gulf' },
    { value: 'ar-AE', label: 'العربية - الإمارات', accent: 'gulf' },
    { value: 'ar-LB', label: 'العربية - لبنان', accent: 'levantine' },
    { value: 'ar-SY', label: 'العربية - سوريا', accent: 'levantine' },
    { value: 'ar-JO', label: 'العربية - الأردن', accent: 'levantine' },
    { value: 'ar-MA', label: 'العربية - المغرب', accent: 'maghrebi' },
    { value: 'ar-TN', label: 'العربية - تونس', accent: 'maghrebi' },
    { value: 'en-US', label: 'English - US', accent: 'american' },
    { value: 'en-GB', label: 'English - UK', accent: 'british' },
    { value: 'fr-FR', label: 'Français', accent: 'french' }
  ];

  // Voice command patterns for different actions
  const commandPatterns = {
    arabic: {
      search: ['ابحث عن', 'جد', 'فتش عن', 'اعرض', 'أريد'],
      create: ['أنشئ', 'اعمل', 'أضف', 'جديد'],
      delete: ['احذف', 'امسح', 'أزل'],
      navigate: ['اذهب إلى', 'افتح', 'انتقل'],
      quotation: ['عرض سعر', 'طلب تسعير', 'كوتيشن'],
      purchase: ['أمر شراء', 'طلب شراء', 'بي او'],
      item: ['صنف', 'منتج', 'قطعة'],
      supplier: ['مورد', 'موزع'],
      client: ['عميل', 'زبون']
    },
    english: {
      search: ['search for', 'find', 'look for', 'show me'],
      create: ['create', 'make', 'add', 'new'],
      delete: ['delete', 'remove', 'erase'],
      navigate: ['go to', 'open', 'navigate'],
      quotation: ['quotation', 'quote', 'rfq'],
      purchase: ['purchase order', 'po', 'buy'],
      item: ['item', 'product', 'part'],
      supplier: ['supplier', 'vendor'],
      client: ['client', 'customer']
    }
  };

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = settings.continuous;
      recognition.interimResults = settings.interimResults;
      recognition.maxAlternatives = settings.maxAlternatives;
      recognition.lang = settings.language;

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "🎤 التسجيل الصوتي مفعل",
          description: `الاستماع بـ ${languageOptions.find(l => l.value === settings.language)?.label}`,
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        
        results.forEach((result, index) => {
          if (result.isFinal) {
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;
            
            const command: VoiceCommand = {
              id: `cmd-${Date.now()}-${index}`,
              text: transcript,
              confidence: confidence,
              language: settings.language,
              accent: settings.accent,
              timestamp: new Date(),
              action: analyzeCommand(transcript)
            };

            setCommands(prev => [command, ...prev.slice(0, 9)]);
            executeCommand(command);
          }
        });
      };

      recognition.onerror = (event) => {
        toast({
          title: "❌ خطأ في التسجيل الصوتي",
          description: `خطأ: ${event.error}`,
          variant: "destructive"
        });
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [settings]);

  const analyzeCommand = (text: string): string => {
    const lowercaseText = text.toLowerCase();
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const patterns = isArabic ? commandPatterns.arabic : commandPatterns.english;

    // Analyze command intent
    if (patterns.search.some(pattern => lowercaseText.includes(pattern))) {
      if (patterns.quotation.some(pattern => lowercaseText.includes(pattern))) {
        return 'search_quotations';
      } else if (patterns.purchase.some(pattern => lowercaseText.includes(pattern))) {
        return 'search_purchase_orders';
      } else if (patterns.item.some(pattern => lowercaseText.includes(pattern))) {
        return 'search_items';
      }
      return 'general_search';
    } else if (patterns.create.some(pattern => lowercaseText.includes(pattern))) {
      if (patterns.quotation.some(pattern => lowercaseText.includes(pattern))) {
        return 'create_quotation';
      } else if (patterns.purchase.some(pattern => lowercaseText.includes(pattern))) {
        return 'create_purchase_order';
      }
      return 'create_item';
    } else if (patterns.navigate.some(pattern => lowercaseText.includes(pattern))) {
      return 'navigate';
    }

    return 'unknown';
  };

  const executeCommand = (command: VoiceCommand) => {
    const actionMessages = {
      search_quotations: "🔍 البحث في طلبات التسعير...",
      search_purchase_orders: "🔍 البحث في أوامر الشراء...",
      search_items: "🔍 البحث في الأصناف...",
      create_quotation: "➕ إنشاء طلب تسعير جديد...",
      create_purchase_order: "➕ إنشاء أمر شراء جديد...",
      navigate: "🚀 التنقل في النظام...",
      general_search: "🔍 البحث العام...",
      unknown: "❓ أمر غير مفهوم"
    };

    const message = actionMessages[command.action as keyof typeof actionMessages] || "معالجة الأمر...";
    
    toast({
      title: "🎯 تنفيذ الأمر الصوتي",
      description: message,
    });

    // Here you would implement actual command execution
    // For example: navigate to different pages, trigger searches, etc.
    switch (command.action) {
      case 'search_quotations':
        // Navigate to quotations page or trigger search
        window.location.hash = '/quotations';
        break;
      case 'search_purchase_orders':
        // Navigate to purchase orders page
        window.location.hash = '/purchase-orders';
        break;
      case 'search_items':
        // Navigate to items page
        window.location.hash = '/items';
        break;
      case 'create_quotation':
        // Open create quotation modal or page
        window.location.hash = '/quotations/new';
        break;
      case 'create_purchase_order':
        // Open create purchase order modal or page
        window.location.hash = '/purchase-orders/new';
        break;
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on language
      const voices = speechSynthesis.getVoices();
      const arabicVoice = voices.find(voice => 
        voice.lang.startsWith('ar') || voice.name.includes('Arabic')
      );
      
      if (arabicVoice && settings.language.startsWith('ar')) {
        utterance.voice = arabicVoice;
      }
      
      utterance.lang = settings.language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <p className="text-yellow-800">
            ⚠️ متصفحك لا يدعم التسجيل الصوتي. يرجى استخدام متصفح حديث مثل Chrome أو Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            الأوامر الصوتية متعددة اللغات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اللغة واللهجة</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => {
                  const option = languageOptions.find(opt => opt.value === value);
                  setSettings(prev => ({
                    ...prev,
                    language: value,
                    accent: option?.accent || 'standard'
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللغة واللهجة" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>إعدادات متقدمة</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="continuous"
                    checked={settings.continuous}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, continuous: checked }))
                    }
                  />
                  <Label htmlFor="continuous">تسجيل مستمر</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="interim"
                    checked={settings.interimResults}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, interimResults: checked }))
                    }
                  />
                  <Label htmlFor="interim">نتائج مؤقتة</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? "إيقاف التسجيل" : "بدء التسجيل"}
            </Button>
            
            <Button
              onClick={() => speakText("مرحباً بك في نظام قرطبة للتوريدات")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              اختبار الصوت
            </Button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              جاري الاستماع... تحدث الآن
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الأوامر الصوتية</CardTitle>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              لا توجد أوامر صوتية بعد. ابدأ بقول أمر مثل "ابحث عن طلبات التسعير"
            </p>
          ) : (
            <div className="space-y-3">
              {commands.map((command) => (
                <div
                  key={command.id}
                  className="p-3 border rounded-lg bg-gray-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{command.text}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.round(command.confidence * 100)}%
                      </Badge>
                      <Badge variant="secondary">
                        {command.accent}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>الإجراء: {command.action}</span>
                    <span>{command.timestamp.toLocaleTimeString('ar-EG')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Command Help */}
      <Card>
        <CardHeader>
          <CardTitle>أمثلة على الأوامر الصوتية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">أوامر البحث:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• "ابحث عن طلبات التسعير"</li>
                <li>• "اعرض أوامر الشراء"</li>
                <li>• "جد الأصناف"</li>
                <li>• "Find quotations"</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">أوامر الإنشاء:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• "أنشئ طلب تسعير جديد"</li>
                <li>• "اعمل أمر شراء"</li>
                <li>• "أضف صنف جديد"</li>
                <li>• "Create new quotation"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
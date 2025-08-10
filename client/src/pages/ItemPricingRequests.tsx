import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, DollarSign, Eye, FileText, Calendar, User, Building2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PricingRequest {
  id: string;
  quotationNumber: string;
  clientName: string;
  requestDate: string;
  status: string;
  quantity: number;
  unit: string;
  customerPrice?: number;
  notes?: string;
}

export default function ItemPricingRequests() {
  const params = useParams();
  const [location] = useLocation();
  const itemId = params.itemId;
  
  // Parse query parameters manually from location
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const itemNumber = urlParams.get('itemNumber') || '';
  const itemDescription = urlParams.get('description') || '';
  
  const [filters, setFilters] = useState({
    clientName: "",
    quotationNumber: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  // Fetch pricing requests for this specific item
  const { data: pricingRequests, isLoading } = useQuery({
    queryKey: [`/api/items/${itemId}/pricing-requests`],
    enabled: !!itemId,
  });

  const { data: purchaseOrders, isLoading: isLoadingPO } = useQuery({
    queryKey: [`/api/items/${itemId}/purchase-orders`],
    enabled: !!itemId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      sent_for_pricing: { label: "مرسل للتسعير", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      pricing_received: { label: "تم استلام التسعير", variant: "default" as const, color: "bg-purple-100 text-purple-800" },
      customer_pricing: { label: "تسعير العميل", variant: "default" as const, color: "bg-orange-100 text-orange-800" },
      quoted: { label: "مُرسل العرض", variant: "default" as const, color: "bg-green-100 text-green-800" },
      completed: { label: "مكتمل", variant: "default" as const, color: "bg-emerald-100 text-emerald-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPOStatusBadge = (status: string) => {
    if (!status) return <span className="text-gray-400">لا يوجد</span>;
    
    const statusConfig = {
      pending: { label: "في الانتظار", color: "bg-yellow-100 text-yellow-800" },
      sent: { label: "مرسل", color: "bg-blue-100 text-blue-800" },
      received: { label: "مستلم", color: "bg-green-100 text-green-800" },
      completed: { label: "مكتمل", color: "bg-emerald-100 text-emerald-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Filter the requests based on filter criteria
  const filteredRequests = (pricingRequests || []).filter((request: PricingRequest) => {
    return (
      (!filters.clientName || request.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) &&
      (!filters.quotationNumber || request.quotationNumber.includes(filters.quotationNumber)) &&
      (!filters.status || filters.status === 'all' || request.status === filters.status) &&
      (!filters.startDate || new Date(request.requestDate) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(request.requestDate) <= new Date(filters.endDate))
    );
  });

  const handleViewQuotation = (quotationNumber: string) => {
    window.open(`/quotations/${quotationNumber}`, '_blank');
  };

  const handleViewPurchaseOrder = (poNumber: string | undefined) => {
    if (poNumber) {
      window.open(`/purchase-orders/${poNumber}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل طلبات التسعير...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للأصناف</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">طلبات التسعير للصنف</h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{itemNumber}</span> - {itemDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">
            {filteredRequests.length} طلب تسعير • {(purchaseOrders || []).length} أمر شراء
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
            <span>فلترة النتائج</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">اسم العميل</label>
              <Input
                placeholder="ابحث بالعميل..."
                value={filters.clientName}
                onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">رقم الطلب</label>
              <Input
                placeholder="رقم طلب الشراء..."
                value={filters.quotationNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, quotationNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الحالة</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="sent_for_pricing">تم إرسال للتسعير</SelectItem>
                  <SelectItem value="pricing_received">تم استلام التسعير</SelectItem>
                  <SelectItem value="customer_pricing">تسعير العميل</SelectItem>
                  <SelectItem value="quoted">تم عمل العرض</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">من تاريخ</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            طلبات التسعير وأوامر الشراء المرتبطة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* طلب التسعير */}
                  <TableHead className="text-right bg-blue-50">رقم طلب التسعير</TableHead>
                  <TableHead className="text-right bg-blue-50">العميل</TableHead>
                  <TableHead className="text-right bg-blue-50">تاريخ الطلب</TableHead>
                  <TableHead className="text-right bg-blue-50">الكمية</TableHead>
                  <TableHead className="text-right bg-blue-50">سعر العميل</TableHead>
                  <TableHead className="text-right bg-blue-50">حالة الطلب</TableHead>
                  {/* أمر الشراء من العميل */}
                  <TableHead className="text-right bg-green-50">رقم أمر الشراء</TableHead>
                  <TableHead className="text-right bg-green-50">العميل</TableHead>
                  <TableHead className="text-right bg-green-50">تاريخ الأمر</TableHead>
                  <TableHead className="text-right bg-green-50">قيمة الطلب</TableHead>
                  <TableHead className="text-right bg-green-50">إجمالي الطلب</TableHead>
                  <TableHead className="text-right bg-green-50">حالة الطلب</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isLoadingPO ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      جارٍ تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <span>لا توجد طلبات تسعير لهذا الصنف</span>
                        <span className="text-sm text-gray-400">
                          رقم الصنف: {itemNumber}
                        </span>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                          <p className="font-medium mb-1">ملاحظة:</p>
                          <p>لرؤية طلبات التسعير، جرب الأصناف التالية التي تحتوي على بيانات:</p>
                          <div className="grid grid-cols-1 gap-1 mt-2 font-mono text-xs">
                            <a href="/item-pricing-requests/b6c7722c-524f-4870-b120-8ca6f3db3d66?itemNumber=P-000842" 
                               className="text-blue-600 hover:text-blue-800 underline">
                              P-000842: ATTACH,BATTERY (1562 طلب)
                            </a>
                            <a href="/item-pricing-requests/f945d3e0-9e5f-46eb-a94b-8b69c26a1345?itemNumber=P-000365" 
                               className="text-blue-600 hover:text-blue-800 underline">
                              P-000365: HEATER ITALY (45 طلب)
                            </a>
                            <a href="/item-pricing-requests/672a44ad-5ebc-4987-a785-b868e1b723f3?itemNumber=P-000009" 
                               className="text-blue-600 hover:text-blue-800 underline">
                              P-000009: BRENNENSTUHL CORD (37 طلب)
                            </a>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request: PricingRequest, index: number) => {
                    // Get matching purchase order for this specific quotation number
                    const matchingPO = (purchaseOrders || []).find(po => 
                      po.quotationNumber === request.quotationNumber
                    );
                    
                    return (
                      <TableRow key={request.id} className={`hover:bg-gray-50 ${matchingPO ? 'border-l-4 border-green-400 bg-green-50/10' : 'border-l-4 border-gray-200'}`}>
                        {/* طلب التسعير */}
                        <TableCell className="font-medium text-blue-600 bg-blue-50/50">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{request.quotationNumber}</span>
                            {matchingPO && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-300">
                                🔗 مربوط
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="bg-blue-50/50">{request.clientName}</TableCell>
                        <TableCell className="bg-blue-50/50">{formatDate(request.requestDate)}</TableCell>
                        <TableCell className="bg-blue-50/50">
                          <span className="font-medium">{request.quantity}</span>
                          <span className="text-gray-500 ml-1">{request.unit}</span>
                        </TableCell>
                        <TableCell className="bg-blue-50/50">
                          {request.customerPrice ? (
                            <span className="font-medium text-blue-600">
                              {formatCurrency(request.customerPrice)}
                            </span>
                          ) : (
                            <span className="text-gray-400">لم يحدد</span>
                          )}
                        </TableCell>
                        <TableCell className="bg-blue-50/50">{getStatusBadge(request.status)}</TableCell>
                        
                        {/* أمر الشراء من العميل */}
                        <TableCell className="font-medium text-green-600 bg-green-50/50">
                          {matchingPO?.poNumber ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-green-100 px-2 py-1 rounded">{matchingPO.poNumber}</span>
                              <span className="text-xs text-green-600">← طلب {request.quotationNumber}</span>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-center">
                              <span>لا يوجد أمر شراء</span>
                              <div className="text-xs">لطلب التسعير {request.quotationNumber}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="bg-green-50/50">
                          {matchingPO?.poNumber ? (
                            <span className="text-green-600 font-medium">{request.clientName}</span>
                          ) : (
                            <span className="text-gray-400">لا يوجد عميل</span>
                          )}
                        </TableCell>
                        <TableCell className="bg-green-50/50">
                          {matchingPO?.orderDate ? formatDate(matchingPO.orderDate) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="bg-green-50/50">
                          {matchingPO?.itemUnitPrice ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(parseFloat(matchingPO.itemUnitPrice))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="bg-green-50/50">
                          {matchingPO?.itemTotalPrice ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(parseFloat(matchingPO.itemTotalPrice))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="bg-green-50/50">
                          {matchingPO?.status ? getStatusBadge(matchingPO.status) : (
                            <span className="text-gray-400">لا يوجد</span>
                          )}
                        </TableCell>
                        
                        {/* الإجراءات */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewQuotation(request.quotationNumber)}
                              className="h-8 w-8 p-0"
                              title="عرض طلب التسعير"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            {matchingPO?.poNumber && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPurchaseOrder(matchingPO.poNumber)}
                                className="h-8 w-8 p-0"
                                title="عرض أمر الشراء"
                              >
                                <ShoppingCart className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {filteredRequests.length > 0 && (
            <div className="border-t px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">طلبات التسعير:</span>
                  <span className="font-medium text-blue-600">{filteredRequests.length}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">أوامر الشراء المرتبطة:</span>
                  <span className="font-medium text-green-600">{(purchaseOrders || []).length}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">الطلبات المكتملة:</span>
                  <span className="font-medium text-green-600">
                    {filteredRequests.filter((r: PricingRequest) => r.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">العملاء الفريدين:</span>
                  <span className="font-medium">
                    {new Set(filteredRequests.map((r: PricingRequest) => r.clientName)).size}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">إجمالي الكمية:</span>
                  <span className="font-medium">
                    {filteredRequests.reduce((sum: number, r: PricingRequest) => sum + r.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
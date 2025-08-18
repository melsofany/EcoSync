import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

// Simple component to show LINE ITEM
export function CustomerPricingSimple() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lineItemData, setLineItemData] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load items
  useEffect(() => {
    fetch("/api/items-ready-for-customer-pricing", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("Items loaded:", data);
        setItems(data || []);
      })
      .catch(err => console.error("Error loading items:", err));
  }, []);

  // Load LINE ITEM when item is selected
  const loadLineItem = async (item: any) => {
    setLoading(true);
    setSelectedItem(item);
    setLineItemData("جاري التحميل...");
    
    try {
      // Simple fetch with random parameter to avoid cache
      const response = await fetch(
        `/api/items/${item.id}/comprehensive-data?r=${Math.random()}`,
        { 
          credentials: "include",
          headers: { "Cache-Control": "no-cache" }
        }
      );
      
      if (!response.ok) {
        setLineItemData("خطأ في التحميل");
        return;
      }
      
      const data = await response.json();
      console.log("LINE ITEM Data received:", data);
      
      // Set LINE ITEM directly
      if (data && data.lineItem) {
        setLineItemData(data.lineItem);
        console.log("LINE ITEM set to:", data.lineItem);
      } else {
        setLineItemData("لا يوجد LINE ITEM");
        console.log("No LINE ITEM in data");
      }
    } catch (error) {
      console.error("Error loading LINE ITEM:", error);
      setLineItemData("خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>تسعير العملاء - عرض LINE ITEM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Items list */}
            <div>
              <h3 className="font-bold mb-2">الأصناف الجاهزة للتسعير:</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{item.itemNumber}</p>
                        <p className="text-sm text-gray-600">{item.partNumber}</p>
                      </div>
                      <Button 
                        onClick={() => loadLineItem(item)}
                        variant={selectedItem?.id === item.id ? "default" : "outline"}
                      >
                        عرض LINE ITEM
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LINE ITEM Display */}
            {selectedItem && (
              <div className="mt-6 p-4 border-2 rounded-lg">
                <h3 className="font-bold mb-3">معلومات البند المحدد:</h3>
                <div className="space-y-2">
                  <p><strong>رقم البند:</strong> {selectedItem.itemNumber}</p>
                  <p><strong>رقم القطعة:</strong> {selectedItem.partNumber}</p>
                  
                  {/* LINE ITEM with clear visibility */}
                  <div className="mt-4">
                    <p className="font-bold text-lg mb-2">LINE ITEM:</p>
                    <div 
                      className="p-4 text-center text-xl font-mono rounded-lg"
                      style={{
                        backgroundColor: lineItemData && lineItemData !== "لا يوجد LINE ITEM" ? "#d4f4dd" : "#ffdddd",
                        color: lineItemData && lineItemData !== "لا يوجد LINE ITEM" ? "#008000" : "#ff0000",
                        border: `3px solid ${lineItemData && lineItemData !== "لا يوجد LINE ITEM" ? "#008000" : "#ff0000"}`
                      }}
                    >
                      {loading ? "⏳ جاري التحميل..." : lineItemData || "اضغط على الزر لتحميل LINE ITEM"}
                    </div>
                  </div>

                  {/* Debug info */}
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <p>حالة التحميل: {loading ? "نعم" : "لا"}</p>
                    <p>القيمة المحفوظة: "{lineItemData}"</p>
                    <p>معرف البند: {selectedItem.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerPricingSimple;
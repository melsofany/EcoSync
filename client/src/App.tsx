import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import ChangePassword from "@/pages/ChangePassword";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Quotations from "@/pages/Quotations";
import QuotationDetail from "@/pages/QuotationDetail";
import CreateQuotation from "@/pages/CreateQuotation";
import Items from "@/pages/Items";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import Clients from "@/pages/Clients";
import Suppliers from "@/pages/Suppliers";
import SupplierPricing from "@/pages/SupplierPricing";
import CustomerPricing from "@/pages/CustomerPricingNew";
import CreatePurchaseOrder from "@/pages/CreatePurchaseOrder";
import ItemPricingRequests from "@/pages/ItemPricingRequests";
import ItemDataSheet from "@/pages/ItemDataSheet";

import NotFound from "@/pages/not-found";
import TelegramBot from "@/pages/TelegramBot";
import { TelegramBotManagement } from "@/pages/TelegramBotManagement";
import { TelegramUsersDashboard } from "@/pages/TelegramUsersDashboard";
import DataRecoveryPage from "@/pages/DataRecoveryPage";
import DatabaseStoragePage from "@/pages/DatabaseStoragePage";
import { VoiceControlPage } from "@/pages/VoiceControlPage";
import DataUnification from "@/pages/DataUnification";
import UnificationMonitor from "@/pages/UnificationMonitor";
import UnificationProgress from "@/pages/UnificationProgress";
import UserManagement from "@/pages/UserManagement";
import GeneralAdmin from "@/pages/GeneralAdmin";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل النظام...</h2>
          <p className="text-gray-500">قرطبة للتوريدات</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/quotations" component={Quotations} />
        <Route path="/quotations/create" component={CreateQuotation} />
        <Route path="/quotations/:id" component={QuotationDetail} />
        <Route path="/items" component={Items} />
        <Route path="/item-pricing-requests/:itemId" component={ItemPricingRequests} />
        <Route path="/items/:itemId/data-sheet" component={ItemDataSheet} />
        <Route path="/clients" component={Clients} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/supplier-pricing" component={SupplierPricing} />
        <Route path="/customer-pricing" component={CustomerPricing} />
        <Route path="/purchase-orders" component={PurchaseOrders} />
        <Route path="/create-purchase-order" component={CreatePurchaseOrder} />
        <Route path="/reports" component={Reports} />
        <Route path="/admin" component={GeneralAdmin} />
        <Route path="/telegram-bot" component={TelegramBotManagement} />
        <Route path="/telegram-users" component={TelegramUsersDashboard} />
        <Route path="/data-recovery" component={DataRecoveryPage} />
        <Route path="/database-storage" component={DatabaseStoragePage} />
        <Route path="/voice-control" component={VoiceControlPage} />
        <Route path="/data-unification" component={DataUnification} />
        <Route path="/unification-monitor" component={UnificationMonitor} />
        <Route path="/unification-progress" component={UnificationProgress} />
        <Route path="/user-management" component={UserManagement} />

        <Route path="/change-password" component={ChangePassword} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

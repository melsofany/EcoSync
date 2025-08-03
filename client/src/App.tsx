import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { PermissionGuard } from "@/components/PermissionGuard";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Quotations from "@/pages/Quotations";
import QuotationDetail from "@/pages/QuotationDetail";
import Items from "@/pages/Items";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import Clients from "@/pages/Clients";
import Suppliers from "@/pages/Suppliers";
import SupplierPricing from "@/pages/SupplierPricing";
import CustomerPricing from "@/pages/CustomerPricingNew";
import CreatePurchaseOrder from "@/pages/CreatePurchaseOrder";
import TestDataEntry from "@/pages/TestDataEntry";
import NotFound from "@/pages/not-found";

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
        <Route path="/quotations">
          <PermissionGuard resource="quotations" action="read">
            <Quotations />
          </PermissionGuard>
        </Route>
        <Route path="/quotations/:id">
          <PermissionGuard resource="quotations" action="read">
            <QuotationDetail />
          </PermissionGuard>
        </Route>
        <Route path="/items">
          <PermissionGuard resource="items" action="read">
            <Items />
          </PermissionGuard>
        </Route>
        <Route path="/clients">
          <PermissionGuard resource="clients" action="read">
            <Clients />
          </PermissionGuard>
        </Route>
        <Route path="/suppliers">
          <PermissionGuard resource="suppliers" action="read">
            <Suppliers />
          </PermissionGuard>
        </Route>
        <Route path="/supplier-pricing">
          <PermissionGuard resource="suppliers" action="read">
            <SupplierPricing />
          </PermissionGuard>
        </Route>
        <Route path="/customer-pricing">
          <PermissionGuard resource="clients" action="read">
            <CustomerPricing />
          </PermissionGuard>
        </Route>
        <Route path="/purchase-orders">
          <PermissionGuard resource="purchaseOrders" action="read">
            <PurchaseOrders />
          </PermissionGuard>
        </Route>
        <Route path="/create-purchase-order">
          <PermissionGuard resource="purchaseOrders" action="create">
            <CreatePurchaseOrder />
          </PermissionGuard>
        </Route>
        <Route path="/reports">
          <PermissionGuard resource="reports" action="read">
            <Reports />
          </PermissionGuard>
        </Route>
        <Route path="/admin">
          <PermissionGuard resource="users" action="read" fallback={
            <PermissionGuard resource="systemSettings" action="read">
              <Admin />
            </PermissionGuard>
          }>
            <Admin />
          </PermissionGuard>
        </Route>
        <Route path="/test-permissions" component={TestDataEntry} />
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

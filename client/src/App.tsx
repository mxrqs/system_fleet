import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import UsersPage from "./pages/AppUsers";
import MyOrdersPage from "./pages/MyOrders";
import ManageOrdersPage from "./pages/ManageOrders";
import MaintenancePlansPage from "./pages/MaintenancePlans";
import OrderDetailPage from "./pages/OrderDetail";
import InventoryPage from "./pages/Inventory";
import MaintenanceAlertsPage from "./pages/MaintenanceAlerts";
import NewOsRequestPage from "./pages/NewOsRequest";
import NewOcRequestPage from "./pages/NewOcRequest";
import ExpenseGroupsPage from "./pages/ExpenseGroupsPage";
import ChecklistPage from "./pages/Checklist";
import ContractsPage from "./pages/Contracts";
import AppUsersPage from "./pages/AppUsers";
import SuppliersPage from "./pages/Suppliers";
import FleetPage from "./pages/Fleet";
import FleetDetailsPage from "./pages/FleetDetails";
import MaintenanceOrdersPage from "./pages/MaintenanceOrders";
import PurchaseOrdersPage from "./pages/PurchaseOrders";
import PlaceholderPage from "./pages/PlaceholderPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Solicitações / legado */}
      <Route path="/new-os" component={NewOsRequestPage} />
      <Route path="/new-oc" component={NewOcRequestPage} />
      <Route path="/my-orders" component={MyOrdersPage} />
      <Route path="/expense-groups" component={ExpenseGroupsPage} />
      <Route path="/orders" component={ManageOrdersPage} />
      <Route path="/orders/:id" component={OrderDetailPage} />

      {/* Geral */}
      <Route path="/reports">
        <PlaceholderPage
          title="Relatórios"
          description="Dashboards gerais de OS, OC, estoque, frota, contratos e custos."
        />
      </Route>

      {/* Operação */}
      <Route path="/maintenance-orders" component={MaintenanceOrdersPage} />
      <Route path="/maintenance-plans" component={MaintenancePlansPage} />
      <Route path="/maintenance" component={MaintenanceAlertsPage} />
      <Route path="/checklist" component={ChecklistPage} />
      <Route path="/fleet" component={FleetPage} />
      <Route path="/fleet/:id" component={FleetDetailsPage} />

      {/* Estoque */}
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/material-requests">
        <PlaceholderPage
          title="Requisições"
          description="Área para acompanhar pedidos de material, separação, entrega e cancelamento."
        />
      </Route>

      {/* Financeiro */}
      <Route path="/purchase-orders" component={PurchaseOrdersPage} />

      <Route path="/suppliers" component={SuppliersPage} />

      <Route path="/costs">
        <PlaceholderPage
          title="Custos"
          description="Análise financeira por contrato, veículo, fornecedor, período e tipo de serviço."
        />
      </Route>

      <Route path="/invoices">
        <PlaceholderPage
          title="Notas Fiscais"
          description="Controle de notas fiscais, anexos, vencimentos e vínculo com ordens de compra."
        />
      </Route>

      {/* Administração */}
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/app-users" component={AppUsersPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/settings">
        <PlaceholderPage
          title="Configurações"
          description="Parâmetros gerais, permissões, modelos de PDF, categorias e regras do sistema."
        />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

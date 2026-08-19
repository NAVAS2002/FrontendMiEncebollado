import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Checkout from "./pages/cashier/Checkout";
import CashierLogin from "./pages/cashier/CashierLogin";
import CashSessionPage from "./pages/cashier/CashSessionPage";
import Dashboard from "./pages/cashier/Dashboard";
import OrdersBoard from "./pages/cashier/OrdersBoard";
import Payments from "./pages/cashier/Payments";
import Devices from "./pages/cashier/admin/Devices";
import Floor from "./pages/cashier/admin/Floor";
import Menu from "./pages/cashier/admin/Menu";
import Settings from "./pages/cashier/admin/Settings";
import Users from "./pages/cashier/admin/Users";
import DevicePairing from "./pages/waiter/DevicePairing";
import ProductCustomize from "./pages/waiter/ProductCustomize";
import TableMap from "./pages/waiter/TableMap";
import TableOrder from "./pages/waiter/TableOrder";
import TakeAway from "./pages/waiter/TakeAway";
import WaiterLogin from "./pages/waiter/WaiterLogin";
import { AuthProvider } from "./state/AuthContext";
import { CartProvider } from "./state/CartContext";
import { MenuProvider } from "./state/MenuContext";
import { RealtimeProvider } from "./state/RealtimeContext";

function WaiterArea() {
  return (
    <MenuProvider>
      <CartProvider>
        <Routes>
          <Route path="mesas" element={<TableMap />} />
          <Route path="mesa/:tableId" element={<TableOrder />} />
          <Route path="llevar" element={<TakeAway />} />
          <Route path="producto/:productId" element={<ProductCustomize />} />
          <Route path="*" element={<Navigate to="/mesero/mesas" replace />} />
        </Routes>
      </CartProvider>
    </MenuProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/mesero/emparejar" element={<DevicePairing />} />
          <Route path="/mesero/login" element={<WaiterLogin />} />
          <Route path="/caja/login" element={<CashierLogin />} />

          <Route element={<ProtectedRoute roles={["WAITER", "ADMIN"]} redirectTo="/mesero/login" />}>
            <Route path="/mesero/*" element={<WaiterArea />} />
          </Route>

          <Route element={<ProtectedRoute roles={["CASHIER", "ADMIN"]} redirectTo="/caja/login" />}>
            <Route path="/caja/pedidos" element={<OrdersBoard />} />
            <Route path="/caja/pedido/:orderId" element={<Checkout />} />
            <Route path="/caja/pagos" element={<Payments />} />
            <Route path="/caja/sesion" element={<CashSessionPage />} />
            <Route path="/caja/reportes" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} redirectTo="/caja/login" />}>
            <Route path="/caja/admin/dispositivos" element={<Devices />} />
            <Route path="/caja/admin/usuarios" element={<Users />} />
            <Route path="/caja/admin/secciones" element={<Floor />} />
            <Route path="/caja/admin/catalogo" element={<Menu />} />
            <Route path="/caja/admin/configuracion" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RealtimeProvider>
    </AuthProvider>
  );
}

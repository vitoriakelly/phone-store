import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { Layout } from '../components/Layout';
import { CreateDevice } from '../pages/CreateDevice';
import { Dashboard } from '../pages/Dashboard';
import { DeviceDetails } from '../pages/DeviceDetails';
import { Devices } from '../pages/Devices';
import { EditDevice } from '../pages/EditDevice';
import { RegisterSale } from '../pages/RegisterSale';
import { Sales } from '../pages/Sales';
import { SaleDetails } from '../pages/SaleDetails';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/dispositivos"
          element={<Devices />}
        />

        <Route
          path="/dispositivos/cadastrar"
          element={<CreateDevice />}
        />

        <Route
          path="/dispositivos/:id/editar"
          element={<EditDevice />}
        />

        <Route
          path="/dispositivos/:id/vender"
          element={<RegisterSale />}
        />

        <Route
          path="/dispositivos/:id"
          element={<DeviceDetails />}
        />

        <Route
          path="/vendas"
          element={<Sales />}
        />
        <Route
          path="/vendas/:id"
          element={<SaleDetails />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
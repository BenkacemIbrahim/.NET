import { Navigate, Route, Routes } from "react-router-dom";
import {
  AdminGuard,
  BookingsPage,
  CalendarPage,
  DashboardPage,
  LoginPage,
  SchedulePage,
  ServicesPage,
  SettingsPage,
  StaffPage,
} from "./pages/admin";
import { PublicBookingPage } from "./pages/public-booking";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/book/northstar-health" replace />}
      />
      <Route path="/book/:tenantSlug" element={<PublicBookingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminGuard />}>
        <Route index element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

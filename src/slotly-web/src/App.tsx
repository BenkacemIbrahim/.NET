import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Skeleton } from "./components/ui/skeleton";

const admin = () => import("./pages/admin");
const AdminGuard = lazy(() => admin().then((m) => ({ default: m.AdminGuard })));
const BookingsPage = lazy(() =>
  admin().then((m) => ({ default: m.BookingsPage })),
);
const DashboardPage = lazy(() =>
  admin().then((m) => ({ default: m.DashboardPage })),
);
const LoginPage = lazy(() => admin().then((m) => ({ default: m.LoginPage })));
const SchedulePage = lazy(() =>
  admin().then((m) => ({ default: m.SchedulePage })),
);
const ServicesPage = lazy(() =>
  admin().then((m) => ({ default: m.ServicesPage })),
);
const SettingsPage = lazy(() =>
  admin().then((m) => ({ default: m.SettingsPage })),
);
const StaffPage = lazy(() => admin().then((m) => ({ default: m.StaffPage })));
const CalendarPage = lazy(() => import("./pages/calendar-page"));
const LandingPage = lazy(() =>
  import("./pages/landing").then((m) => ({ default: m.LandingPage })),
);
const PublicBookingPage = lazy(() =>
  import("./pages/public-booking").then((m) => ({
    default: m.PublicBookingPage,
  })),
);

export default function App() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl p-6">
          <Skeleton className="h-96" />
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
    </Suspense>
  );
}

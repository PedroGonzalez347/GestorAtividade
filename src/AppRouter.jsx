import { useApp } from "./context/AppProvider";
import { Layout } from "./components/SharedComponents";
import AdminPanel from "./pages/AdminPanel";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import DisciplinesPage from "./pages/DisciplinesPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TasksPage from "./pages/TasksPage";

export default function AppRouter() {
  const { currentUser, page } = useApp();

  if (!currentUser) {
    if (page === "register") return <RegisterPage />;
    return <LoginPage />;
  }

  const pages = {
    dashboard: <DashboardPage />,
    disciplines: <DisciplinesPage />,
    tasks: <TasksPage />,
    calendar: <CalendarPage />,
    profile: <ProfilePage />,
    admin: <AdminPanel />,
  };

  return <Layout>{pages[page] || <DashboardPage />}</Layout>;
}

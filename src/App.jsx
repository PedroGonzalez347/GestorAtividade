import AppProvider from "./context/AppProvider";
import AppRouter from "./AppRouter";
import { Toast } from "./components/SharedComponents";

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <Toast />
    </AppProvider>
  );
}

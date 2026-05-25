import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import TrackerPage from "@/pages/TrackerPage";
import DashboardPage from "@/pages/DashboardPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AuthProvider>
      <div className="flex flex-col md:flex-row min-h-screen w-full">
        <Navigation />
        <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <Route path="/tracker" component={TrackerPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/reset-password" component={ResetPasswordPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </AuthProvider>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;

import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import AdminRoutes from "@/pages/admin";
import PatientRoutes from "@/pages/patient";
import NotFound from "@/pages/NotFound";

function Root() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role === "patient") return <Redirect to="/patient" />;
  if (user) return <Redirect to="/admin" />;
  return <Login />;
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Root} />
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      <Route path="/patient" component={PatientRoutes} />
      <Route path="/patient/:rest*" component={PatientRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

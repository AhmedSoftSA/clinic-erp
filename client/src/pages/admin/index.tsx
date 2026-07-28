import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/shared/AdminLayout";
import { PulseLine } from "@/components/shared/PulseLine";
import Dashboard from "@/pages/admin/Dashboard";
import Appointments from "@/pages/admin/Appointments";
import Patients from "@/pages/admin/Patients";
import Queue from "@/pages/admin/Queue";
import Invoices from "@/pages/admin/Invoices";
import Settings from "@/pages/admin/Settings";
import Users from "@/pages/admin/Users";
import Doctors from "@/pages/Doctors";
import NotFound from "@/pages/NotFound";

const STAFF_ROLES = ["admin", "doctor", "staff"];

export default function AdminRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <PulseLine className="h-6 w-14 text-pine" live />
      </div>
    );
  }

  if (!user || !STAFF_ROLES.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/queue" component={Queue} />
        <Route path="/admin/appointments" component={Appointments} />
        <Route path="/admin/patients" component={Patients} />
        <Route path="/admin/users" component={Users} />
        <Route path="/admin/doctors" component={Doctors} />
        <Route path="/admin/invoices" component={Invoices} />
        <Route path="/admin/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

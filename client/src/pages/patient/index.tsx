import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { PatientLayout } from "@/components/shared/PatientLayout";
import { PulseLine } from "@/components/shared/PulseLine";
import Dashboard from "@/pages/patient/Dashboard";
import BookAppointment from "@/pages/patient/BookAppointment";
import MyAppointments from "@/pages/patient/MyAppointments";
import QueueStatus from "@/pages/patient/QueueStatus";
import MedicalFile from "@/pages/patient/MedicalFile";
import Reports from "@/pages/patient/Reports";
import Invoices from "@/pages/patient/Invoices";
import Doctors from "@/pages/Doctors";
import NotFound from "@/pages/NotFound";

export default function PatientRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <PulseLine className="h-6 w-14 text-pine" live />
      </div>
    );
  }

  if (!user || user.role !== "patient") {
    return <Redirect to="/" />;
  }

  return (
    <PatientLayout>
      <Switch>
        <Route path="/patient" component={Dashboard} />
        <Route path="/patient/doctors" component={Doctors} />
        <Route path="/patient/book" component={BookAppointment} />
        <Route path="/patient/appointments" component={MyAppointments} />
        <Route path="/patient/queue" component={QueueStatus} />
        <Route path="/patient/medical-file" component={MedicalFile} />
        <Route path="/patient/reports" component={Reports} />
        <Route path="/patient/invoices" component={Invoices} />
        <Route component={NotFound} />
      </Switch>
    </PatientLayout>
  );
}

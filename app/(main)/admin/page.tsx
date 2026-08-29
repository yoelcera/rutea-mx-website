import { AdminGateContent } from "@/components/admin_gate/admin_gate";
import { AdminAuthProvider } from "@/hooks/use_admin_auth";
import { AdminWidthToggle } from "./admin_width_toggle";

export const metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminWidthToggle>
        <AdminGateContent />
      </AdminWidthToggle>
    </AdminAuthProvider>
  );
}

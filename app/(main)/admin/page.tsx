import { AdminGate } from "@/components/admin_gate/admin_gate";
import { AdminWidthToggle } from "./admin_width_toggle";

export const metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminWidthToggle>
      <AdminGate />
    </AdminWidthToggle>
  );
}

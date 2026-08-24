import { AdminGate } from "@/components/admin_gate/admin_gate";
import { Section } from "@/components/section/section";

export const metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Section title="Panel de Administrador">
      <AdminGate />
    </Section>
  );
}

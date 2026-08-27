import { WhiteBodyBackground } from "./white_body_background";

export default function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WhiteBodyBackground />
      {children}
    </>
  );
}

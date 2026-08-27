import styles from "./contact_layout.module.css";
import { WhiteBodyBackground } from "./white_body_background";

export default function ContactPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WhiteBodyBackground />
      <div className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </div>
    </>
  );
}

import { APP_ID } from "@/constants";
import AppleLogo from "@/public/app_view/apple_logo.svg";
import styles from "./download_action_button.module.css";

interface DownloadActionButtonProps {
  href?: string;
  label?: string;
  size?: "small" | "medium" | "large";
}

export function DownloadActionButton({
  href = `https://apps.apple.com/app/id${APP_ID}`,
  label = "Descargar",
  size = "small",
}: DownloadActionButtonProps) {
  let appleLogoSize;

  switch (size) {
    case "small":
      appleLogoSize = 18;
      break;
    case "medium":
      appleLogoSize = 20;
      break;
    case "large":
      appleLogoSize = 24;
      break;
    default:
      appleLogoSize = 18;
  }
  return (
    <a
      href={href}
      className={`${styles.downloadActionButton} ${styles[size]}`}
      target="_blank"
    >
      <div className={styles.label}>
        <div className={styles.appleLogo}>
          <AppleLogo width={appleLogoSize} height={appleLogoSize} />
        </div>
        <div className={styles.downloadLabel}>{label}</div>
      </div>
    </a>
  );
}

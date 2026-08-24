import { APP_ID } from "@/constants";
import AndroidLogo from "@/public/app_view/android_logo.svg";
import AppleLogo from "@/public/app_view/apple_logo.svg";
import styles from "./download_action_button.module.css";

const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.xera.ruteamx";

interface DownloadActionButtonProps {
  href?: string;
  label?: string;
  size?: "small" | "medium" | "large";
  platform?: "ios" | "android";
  showLabel?: boolean;
}

export function DownloadActionButton({
  href,
  label = "Descargar",
  size = "small",
  platform = "ios",
  showLabel = true,
}: DownloadActionButtonProps) {
  const resolvedHref =
    href ?? (platform === "ios" ? `https://apps.apple.com/app/id${APP_ID}` : ANDROID_STORE_URL);

  let logoSize;

  switch (size) {
    case "small":
      logoSize = 18;
      break;
    case "medium":
      logoSize = 20;
      break;
    case "large":
      logoSize = 24;
      break;
    default:
      logoSize = 18;
  }

  const Logo = platform === "ios" ? AppleLogo : AndroidLogo;
  const logoClassName = platform === "ios" ? styles.appleLogo : styles.androidLogo;

  return (
    <a
      href={resolvedHref}
      className={`${styles.downloadActionButton} ${styles[size]} ${
        showLabel ? "" : styles.iconOnly
      }`}
      target="_blank"
      aria-label={showLabel ? undefined : label}
    >
      <div className={styles.label}>
        <div className={logoClassName}>
          <Logo width={logoSize} height={logoSize} />
        </div>
        {showLabel && <div className={styles.downloadLabel}>{label}</div>}
      </div>
    </a>
  );
}

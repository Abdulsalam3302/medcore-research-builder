export function Spinner({ dark }: { dark?: boolean }) {
  return <span className={`spin ${dark ? "spin-dark" : ""}`} aria-hidden />;
}

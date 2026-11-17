export default function RootLoading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <div className="route-loading-inner">
        <span className="route-loading-dot" />
        <span className="route-loading-dot" />
        <span className="route-loading-dot" />
      </div>
    </div>
  );
}
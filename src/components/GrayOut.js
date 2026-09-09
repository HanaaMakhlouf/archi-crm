export default function GrayOut({ disabled, reason, children }) {
  if (!disabled) return children;
  return (
    <div className="grayout-wrapper">
      <div className="grayout-content">
        {children}
      </div>
      {reason && (
        <div className="grayout-reason">
          <span>🔒</span>
          {reason}
        </div>
      )}
    </div>
  );
}

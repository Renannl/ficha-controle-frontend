export default function PermissionItem({
  checked,
  onChange,
  icon: Icon,
  label,
}) {
  return (
    <label className={`perm-item ${checked ? "active" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />

      <span className="perm-icon">
        <Icon size={16} />
      </span>

      <span className="perm-text">{label}</span>
    </label>
  );
}

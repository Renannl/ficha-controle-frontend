import PermissionItem from "./PermissionItem";

export default function PermissionGroup({
  title,
  permissions,
  selectedPermissions,
  onToggle,
  gridStyle = {},
}) {
  return (
    <div className="permission-group">
      <label className="field-label mb-3 block">{title}</label>

      <div className="permissions-grid mb-4" style={gridStyle}>
        {permissions.map((perm) => (
          <PermissionItem
            key={perm.key}
            checked={selectedPermissions.includes(perm.key)}
            onChange={() => onToggle(perm.key)}
            icon={perm.icon}
            label={perm.label}
          />
        ))}
      </div>
    </div>
  );
}

import { PenLine } from "lucide-react";
import SignatureBlock from "./SignatureBlock";
import SignatureFinalize from "./SignatureFinalize";

const ROLES = [
  { key: "tecnico", label: "Técnico" },
  { key: "supervisor", label: "Supervisor de Produção" },
  { key: "qualidade", label: "Responsável pela Qualidade" },
];

export default function SignatureSection({
  ficha,
  assinaturas,
  onSign,
  onNameChange,
  onFinalizar,
}) {
  return (
    <div className="signatures-section">
      <div
        className="card mb-3"
        style={{
          padding: 0,
          overflow: "visible",
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      >
        <div
          className="section-header"
          style={{
            padding: "0 0 12px",
            marginBottom: 16,
          }}
        >
          <div className="section-icon">
            <PenLine size={18} />
          </div>

          <div>
            <h2>Assinaturas</h2>
            <p>Técnico, Supervisor e Responsável pela Qualidade</p>
          </div>
        </div>
      </div>

      {ROLES.map((role) => (
        <SignatureBlock
          key={role.key}
          role={role}
          sig={assinaturas?.[role.key] ?? {}}
          onNameChange={onNameChange}
          onSign={onSign}
        />
      ))}

      <SignatureFinalize onFinalizar={onFinalizar} />
    </div>
  );
}

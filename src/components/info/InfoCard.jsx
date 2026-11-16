import { OPERACOES } from "../../data/fichaTemplate";
import InfoDocumentSection from "./InfoDocumentSection";
import InfoEquipmentSection from "./InfoEquipmentSection";
import InfoPlanningSection from "./InfoPlanningSection";
import OperationInfoBanner from "./OperationInfoBanner";

export default function InfoCard({
  ficha,
  onChange,
  onOperacaoChange,
  onTipoPainelChange,
  sessoesTrabalho,
  podeEditarFicha,
}) {
  const operacaoAtual = OPERACOES[ficha.operacao];
  const handle = (field) => (e) => onChange(field, e.target.value);

  const clienteTravado = ficha.colecao?.cliente ?? ficha.cliente ?? "";
  const dadosFicha = ficha?.dados || {};
  const isCCM = ficha?.tipoPainel === "ccm" || dadosFicha?.tipoPainel === "ccm";

  return (
    <div className="info-section">
      <InfoDocumentSection ficha={ficha} handle={handle} isCCM={isCCM} />

      <InfoEquipmentSection
        ficha={ficha}
        handle={handle}
        clienteTravado={clienteTravado}
      />

      <InfoPlanningSection
        ficha={ficha}
        handle={handle}
        operacaoAtual={operacaoAtual}
        onOperacaoChange={onOperacaoChange}
        onTipoPainelChange={onTipoPainelChange}
        sessoes={sessoesTrabalho}
        disabled={!podeEditarFicha}
      />

      <OperationInfoBanner />
    </div>
  );
}

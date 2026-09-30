import TafEquipamentos from "./TafEquipamentos";
import TafMegger from "./TafMegger";
import TafHiPot from "./TafHiPot";
import TafObservacoes from "./TafObservacoes";
import TafDadosGerais from "./TafDadosGerais";

export default function TafPanel({ ficha, onUpdate }) {
  if (!ficha.tafData) return null;

  const { tafData } = ficha;

  const handleChange = (path, value) => {
    const keys = path.split(".");
    const newData =
      typeof structuredClone === "function"
        ? structuredClone(tafData)
        : JSON.parse(JSON.stringify(tafData));

    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    onUpdate({
      tafData: newData,
    });
  };

  const toggleInstrumento = (id) => {
    const atual = tafData.instrumentosSelecionados || [];

    const novaLista = atual.includes(id)
      ? atual.filter((x) => x !== id)
      : [...atual, id];

    onUpdate({
      tafData: {
        ...tafData,
        instrumentosSelecionados: novaLista,
      },
    });
  };

  return (
    <div className="taf-panel animate-fadeIn">
      <TafDadosGerais
        ficha={ficha}
        tafData={tafData}
        onUpdate={onUpdate}
        handleChange={handleChange}
      />

      <TafEquipamentos
        selecionados={tafData.instrumentosSelecionados || []}
        onToggle={toggleInstrumento}
      />

      <TafMegger tafData={tafData} handleChange={handleChange} />

      <TafHiPot tafData={tafData} handleChange={handleChange} />

      <TafObservacoes
        observacoes={ficha.observacoes}
        onChange={(value) =>
          onUpdate({
            observacoes: value,
          })
        }
      />
    </div>
  );
}

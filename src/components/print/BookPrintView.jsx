import { useEffect, useRef } from "react";
import PrintView from "./PrintView";

export default function BookPrintView({ fichas, onAllReady }) {
  const readyCount = useRef(0);
  const prevFichas = useRef(null);

  useEffect(() => {
    if (prevFichas.current !== fichas) {
      prevFichas.current = fichas;
      readyCount.current = 0;
    }
  }, [fichas]);

  function handleReady() {
    readyCount.current += 1;
    if (readyCount.current >= (fichas?.length || 0)) {
      onAllReady?.();
    }
  }

  return (
    <div id="book-print-root">
      {fichas.map((ficha) => (
        <div key={ficha.dbId ?? ficha.id} className="book-report-wrapper">
          <PrintView ficha={ficha} isBook={true} onDataReady={handleReady} />
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { authFetch } from "../services/apiClient";

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await authFetch("/configuracoes");

        if (!res) {
          if (!cancelado) {
            setConfiguracoes({ excluir_ficha: false });
          }
          return;
        }

        const data = await res.json();

        if (!cancelado) {
          setConfiguracoes(data);
        }
      } catch {
        if (!cancelado) {
          setConfiguracoes({ excluir_ficha: false });
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return { configuracoes, loading };
}

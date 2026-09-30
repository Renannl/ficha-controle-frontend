import { useCallback, useRef } from "react";
import { uploadFoto } from "../services/uploadService";

export function usePhotoUpload(ficha) {
  const fichaRef = useRef(ficha);
  fichaRef.current = ficha;

  const handlePhotoUpload = useCallback(async (file) => {
    if (!file) return null;

    try {
      const reader = new FileReader();

      return await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const img = new Image();

          img.onload = async () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            const maxSize = 2048;

            if (width > height && width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              async (blob) => {
                try {
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                  });
                  const url = await uploadFoto(compressedFile, fichaRef.current);
                  resolve(url);
                } catch (err) {
                  reject(err);
                }
              },
              "image/jpeg",
              0.92,
            );
          };

          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao processar imagem");
      return null;
    }
  }, []);

  return { handlePhotoUpload };
}

import React from "react";

interface ImagePreviewOverlayProps {
  imageUrl: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ImagePreviewOverlay: React.FC<ImagePreviewOverlayProps> = ({
  imageUrl,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative max-w-md w-full mx-4 rounded-lg bg-background p-4 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Pré-visualizar foto</h2>

        <div className="mb-4 flex justify-center">
          <img
            src={imageUrl}
            alt="Pré-visualização"
            className="max-h-[60vh] rounded-md object-contain"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewOverlay;

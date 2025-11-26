import React, { useState } from "react";
import ImagePreviewOverlay from "@/components/ui/ImagePreviewOverlay";

const Teste = () => {
  // foto confirmada (mostrada no avatar)
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // foto que está em pré-visualização
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // controla se o modal de preview está aberto
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    // seta a imagem no preview e abre o modal
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleCancelPreview = () => {
    // fecha modal e descarta a URL de preview
    setIsPreviewOpen(false);
    setPreviewUrl(null);
  };

  const handleConfirmPreview = () => {
    // confirma a foto, usa no avatar
    if (previewUrl) {
      setFotoPerfil(previewUrl);
    }
    setIsPreviewOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Teste de foto de perfil</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />


      {/* Modal de preview */}
      {isPreviewOpen && previewUrl && (
        <ImagePreviewOverlay
          imageUrl={previewUrl}
          onCancel={handleCancelPreview}
          onConfirm={handleConfirmPreview}
        />
      )}
    </div>
  );
};

export default Teste;

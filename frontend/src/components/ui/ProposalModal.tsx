import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadProposalApi } from "@/lib/api";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

export function ProposalModal({ isOpen, onClose, leadId, onSuccess }: ProposalModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      await uploadProposalApi(leadId, file);
      toast({ title: "Sucesso!", description: "Proposta enviada e lead movido." });
      onSuccess(); // Isso vai forçar o Kanban a recarregar
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao enviar arquivo." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Enviar Proposta</DialogTitle>
        </DialogHeader>
        
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
          <Label htmlFor="proposta">Selecione o documento (PDF/Doc)</Label>
          <Input 
            id="proposta" 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" /> Enviar e Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
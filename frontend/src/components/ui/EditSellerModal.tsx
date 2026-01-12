import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, UserCog, Briefcase } from "lucide-react";
import { updateUserApi } from "@/lib/api";

interface EditSellerModalProps {
  seller: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSellerModal({ seller, isOpen, onClose, onSuccess }: EditSellerModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estados Básicos
  const [active, setActive] = useState(true);
  const [cargo, setCargo] = useState("");
  const [perfil, setPerfil] = useState("Vendedor");

  // Estados do Robô
  const [distActive, setDistActive] = useState(true);
  const [minLives, setMinLives] = useState(0);
  const [maxLives, setMaxLives] = useState(9999);
  const [cnpjRule, setCnpjRule] = useState("both");

  // Carrega dados ao abrir
  useEffect(() => {
    if (seller && isOpen) {
      setActive(seller.ativo !== false);
      
      // 👇 CORREÇÃO AQUI:
      // O backend manda 'jobTitle', mas a tabela usa 'cargo'. 
      // Usando || nós garantimos que ele pegue qualquer um dos dois que vier preenchido.
      setCargo(seller.jobTitle || seller.cargo || ""); 

      // Mapeamento inteligente do Perfil (role -> Visual)
      if (seller.role) {
         const roleMap: Record<string, string> = {
            'admin': 'Administrador',
            'financeiro': 'Financeiro',
            'gerente': 'Gerente',
            'vendedor': 'Vendedor'
         };
         setPerfil(roleMap[seller.role] || "Vendedor");
      } else {
         setPerfil(seller.perfil || "Vendedor");
      }
      
      const dist = seller.distribution || {};
      setDistActive(dist.active !== false);
      setMinLives(dist.minLives !== undefined ? dist.minLives : 0);
      setMaxLives(dist.maxLives !== undefined ? dist.maxLives : 9999);
      setCnpjRule(dist.cnpjRule || "both");
    }
  }, [seller, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        active: active,
        cargo: cargo,   // ✅ Envia o Cargo (Texto livre)
        perfil: perfil, // ✅ Envia o Perfil (Admin/Vendedor/Gerente)
        distribution: {
          active: distActive,
          minLives: Number(minLives),
          maxLives: Number(maxLives),
          cnpjRule: cnpjRule
        }
      };

      const userId = seller.id || seller._id;
      await updateUserApi(userId, payload);

      toast({ title: "Sucesso", description: `Dados de ${seller.nome} atualizados!` });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!seller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Editar Vendedor
          </DialogTitle>
          <DialogDescription>Alterando dados e permissões.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* BLOCO 1: DADOS PROFISSIONAIS (NOVO) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm uppercase tracking-wide">Dados Profissionais</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo (Ex: Closer)</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Título do cargo" />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select value={perfil} onValueChange={setPerfil}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* BLOCO 2: LOGIN */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Login Ativo</Label>
              <p className="text-xs text-muted-foreground">Bloquear ou liberar acesso.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <Separator />

          {/* BLOCO 3: ROBÔ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm uppercase tracking-wide">Distribuição de Leads</h4>
            </div>

            <div className="flex items-center justify-between">
              <Label>Receber Leads Automáticos?</Label>
              <Switch checked={distActive} onCheckedChange={setDistActive} />
            </div>

            <div className={`space-y-4 transition-all duration-300 ${!distActive ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mínimo de Vidas</Label>
                  <Input type="number" min="0" value={minLives} onChange={(e) => setMinLives(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Vidas</Label>
                  <Input type="number" min="0" value={maxLives} onChange={(e) => setMaxLives(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Regra de CNPJ</Label>
                <Select value={cnpjRule} onValueChange={setCnpjRule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Aceitar Ambos</SelectItem>
                    <SelectItem value="required">Só COM CNPJ</SelectItem>
                    <SelectItem value="forbidden">Só SEM CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
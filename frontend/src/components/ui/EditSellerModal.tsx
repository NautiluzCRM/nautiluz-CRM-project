import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Settings2, UserCog, Briefcase, Info, CheckCircle2 } from "lucide-react";
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

  // Gera a descrição visual do filtro configurado
  const filterDescription = useMemo(() => {
    if (!distActive) return "Não está recebendo leads automáticos";
    
    const parts: string[] = [];
    
    // Descrição das vidas
    if (minLives === 0 && maxLives >= 9999) {
      parts.push("Qualquer quantidade de vidas");
    } else if (minLives === maxLives) {
      parts.push(`Exatamente ${minLives} vida${minLives !== 1 ? 's' : ''}`);
    } else if (minLives === 0) {
      parts.push(`Até ${maxLives} vidas`);
    } else if (maxLives >= 9999) {
      parts.push(`${minLives}+ vidas`);
    } else {
      parts.push(`Entre ${minLives} e ${maxLives} vidas`);
    }
    
    // Descrição do CNPJ
    if (cnpjRule === 'both') {
      parts.push("com e sem CNPJ");
    } else if (cnpjRule === 'required') {
      parts.push("apenas COM CNPJ");
    } else {
      parts.push("apenas SEM CNPJ");
    }
    
    return parts.join(' ');
  }, [distActive, minLives, maxLives, cnpjRule]);

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

            {/* Prévia do Filtro */}
            <div className={`p-3 rounded-lg border ${distActive ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-muted/30 border-muted'}`}>
              <div className="flex items-start gap-2">
                {distActive ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${distActive ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {distActive ? 'Recebendo leads:' : 'Distribuição desativada'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filterDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Receber Leads Automáticos</Label>
                <p className="text-xs text-muted-foreground">Ativar/desativar distribuição para este vendedor</p>
              </div>
              <Switch checked={distActive} onCheckedChange={setDistActive} />
            </div>

            <div className={`space-y-4 transition-all duration-300 ${!distActive ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mínimo de Vidas</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={minLives} 
                    onChange={(e) => setMinLives(Number(e.target.value))} 
                    placeholder="0"
                  />
                  <p className="text-[10px] text-muted-foreground">Use 0 para sem limite mínimo</p>
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Vidas</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={maxLives} 
                    onChange={(e) => setMaxLives(Number(e.target.value))} 
                    placeholder="9999"
                  />
                  <p className="text-[10px] text-muted-foreground">Use 9999 para sem limite máximo</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Regra de CNPJ</Label>
                <Select value={cnpjRule} onValueChange={setCnpjRule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Com e Sem CNPJ</SelectItem>
                    <SelectItem value="required">Apenas COM CNPJ</SelectItem>
                    <SelectItem value="forbidden">Apenas SEM CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nota sobre fallback */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-[11px] text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    <strong>Rotação inteligente:</strong> Se nenhum vendedor atender aos critérios exatos do lead, 
                    o sistema distribui automaticamente para o próximo vendedor disponível, garantindo que ninguém fique sem leads.
                  </span>
                </p>
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
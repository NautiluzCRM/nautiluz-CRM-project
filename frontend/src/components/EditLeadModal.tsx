import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; 
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { updateLeadApi, fetchUsers } from "@/lib/api";
import { Lead } from "@/types/crm"; 
import { Loader2, CheckCircle2, X, Plus, User, Users, Phone, Mail, MapPin, Building, FileText, Shield } from "lucide-react";
import { formatPhone } from "@/lib/utils";

const FAIXAS_ETARIAS = [
  "0 a 18", "19 a 23", "24 a 28", "29 a 33", "34 a 38",
  "39 a 43", "44 a 48", "49 a 53", "54 a 58", "59 ou mais"
];

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", 
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"
];

const TIPOS_CNPJ = ["MEI", "EI", "SLU", "LTDA", "SS", "SA", "Outros"];

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSuccess: () => void;
  leadToEdit: Lead | null; 
}

export function EditLeadModal({ isOpen, onClose, onCancel, onSuccess, leadToEdit }: EditLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    celular: "",
    origem: "Indicação",
    quantidadeVidas: 1,
    valorMedio: 0,
    possuiCnpj: false,
    tipoCnpj: "", 
    possuiPlano: false,
    planoAtual: "",
    cidade: "",
    uf: "",
    observacoes: ""
  });

  const [hospitais, setHospitais] = useState<string[]>([]);
  const [hospitalInput, setHospitalInput] = useState("");
  const [faixas, setFaixas] = useState<number[]>(Array(10).fill(0));
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  // Carregar lista de usuários
  useEffect(() => {
    async function loadUsers() {
      if (!isOpen) return;
      try {
        const users = await fetchUsers();
        
        // Filtra apenas os ativos
        const activeUsers = users.filter((u: any) => u.ativo);

        // Ordena alfabeticamente pelo nome
        activeUsers.sort((a: any, b: any) => 
          (a.nome || "").localeCompare(b.nome || "")
        );

        setAvailableUsers(activeUsers); 
      } catch (err) {
        console.error("Erro ao buscar usuários", err);
      }
    }
    loadUsers();
  }, [isOpen]);

 // Carregar dados do Lead ao abrir
  useEffect(() => {
    if (isOpen && leadToEdit) {
      // Preenche o formulário básico
      setFormData({
        nome: leadToEdit.nome || "",
        empresa: leadToEdit.empresa || "",
        email: leadToEdit.email || "",
        celular: leadToEdit.celular || "",
        origem: leadToEdit.origem || "Indicação",
        quantidadeVidas: leadToEdit.quantidadeVidas ?? 1,
        valorMedio: leadToEdit.valorMedio ?? 0,
        possuiCnpj: leadToEdit.possuiCnpj || false,
        tipoCnpj: leadToEdit.tipoCnpj || "",
        possuiPlano: leadToEdit.possuiPlano || false,
        planoAtual: leadToEdit.planoAtual || "",
        cidade: leadToEdit.cidade || "",
        uf: leadToEdit.uf || "",
        observacoes: leadToEdit.informacoes || ""
      });
      
      setHospitais(leadToEdit.hospitaisPreferencia || []);
      
      // --- LÓGICA ROBUSTA PARA FAIXAS ETÁRIAS ---
      const f = (leadToEdit as any).faixasEtarias;
      
      // Verifica se existe o objeto E se ele tem alguma chave preenchida (não é vazio)
      const temFaixasNovas = f && Object.keys(f).length > 0;
      
      if (temFaixasNovas) {
        setFaixas([
          f.ate18 || 0,
          f.de19a23 || 0,
          f.de24a28 || 0,
          f.de29a33 || 0,
          f.de34a38 || 0,
          f.de39a43 || 0,
          f.de44a48 || 0,
          f.de49a53 || 0,
          f.de54a58 || 0,
          f.acima59 || 0
        ]);
      } 
      // Se não tiver faixas novas, tenta usar o array antigo 'idades'
      else if (leadToEdit.idades && Array.isArray(leadToEdit.idades) && leadToEdit.idades.length >= 10) {
        setFaixas([...leadToEdit.idades]);
      } else {
        // Se não tiver nada, zera tudo
        setFaixas(Array(10).fill(0));
      }
      // ---------------------------------------------

      // Carregar owners
      const rawIds = (leadToEdit as any).ownersIds;
      if (rawIds && Array.isArray(rawIds)) {
         setSelectedOwners(rawIds);
      } else if ((leadToEdit as any).owners && Array.isArray((leadToEdit as any).owners)) {
         setSelectedOwners((leadToEdit as any).owners.map((o: any) => o.id || o._id || o));
      } else {
         setSelectedOwners([]);
      }
    }
  }, [isOpen, leadToEdit]);

  const handleAddHospital = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    e?.preventDefault();
    if (hospitalInput.trim()) {
      if (!hospitais.includes(hospitalInput.trim())) {
        setHospitais([...hospitais, hospitalInput.trim()]);
      }
      setHospitalInput("");
    }
  };

  const removeHospital = (index: number) => {
    setHospitais(hospitais.filter((_, i) => i !== index));
  };

  const handleFaixaChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const novasFaixas = [...faixas];
    novasFaixas[index] = numValue;
    setFaixas(novasFaixas);
  };

  const handleChange = (field: string, value: any) => {
    // Converte para número se for campo de quantidade de vidas ou valor
    if (field === "quantidadeVidas") {
      const numValue = value === "" ? 0 : parseInt(value, 10) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === "valorMedio") {
      const numValue = value === "" ? 0 : parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleOwner = (userId: string) => {
    setSelectedOwners(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const totalFaixas = faixas.reduce((acc, curr) => acc + curr, 0);
  const isTotalValid = totalFaixas === Number(formData.quantidadeVidas);

 const validateForm = (): boolean => {
    // 1. Validação de Nome (Mantida)
    if (!formData.nome.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório", description: "Preencha o nome completo." });
      return false;
    }

    // 2. Validação de Celular (Mantida)
    if (!formData.celular.trim() || formData.celular.length < 10) {
      toast({ variant: "destructive", title: "Celular inválido", description: "Insira um celular válido." });
      return false;
    }

    // 3. Email (Mantido apenas se preenchido, para evitar erro de formato)
    if (formData.email && formData.email.trim() !== "" && (!formData.email.includes("@") || !formData.email.includes("."))) {
      toast({ variant: "destructive", title: "Email inválido", description: "Insira um email válido." });
      return false;
    }

    // --- REMOVIDO: Cidade, UF, Vidas, Valor, CNPJ e Distribuição ---
    // Agora o formulário aceita salvar mesmo com esses campos vazios ou zerados.

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !leadToEdit) return;
    
    setIsLoading(true);

    try {
      // --- CORREÇÃO AQUI: Montar o objeto para o Backend ---
      const faixasEtariasObj = {
        ate18: faixas[0],
        de19a23: faixas[1],
        de24a28: faixas[2],
        de29a33: faixas[3],
        de34a38: faixas[4],
        de39a43: faixas[5],
        de44a48: faixas[6],
        de49a53: faixas[7],
        de54a58: faixas[8],
        acima59: faixas[9]
      };
      // ----------------------------------------------------

      const leadData: any = {
        ...formData,
        quantidadeVidas: Number(formData.quantidadeVidas),
        valorMedio: Number(formData.valorMedio),
        
        // Enviar o objeto formatado ao invés do array 'idades'
        faixasEtarias: faixasEtariasObj,
        
        hospitaisPreferencia: hospitais,
        owners: selectedOwners,
        pipelineId: (leadToEdit as any).pipelineId,
        stageId: (leadToEdit as any).stageId || (leadToEdit as any).colunaAtual
      };

      await updateLeadApi(leadToEdit.id, leadData);
      toast({ title: "Atualizado!", description: "Lead salvo com sucesso." });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!leadToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1100px] max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-8">
        <DialogHeader className="flex-shrink-0 mb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold">Editar Lead</DialogTitle>
        </DialogHeader>
        
        {/* Formulário com Scroll */}
        <div className="flex-1 overflow-y-auto px-1 sm:px-4 sm:pr-6 space-y-4 sm:space-y-6 py-2 sm:py-4">
          
          {/* SEÇÃO: Dados de Contato */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <User className="h-4 w-4" /> Dados de Contato
            </h3>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 space-y-2">
                <Label htmlFor="nome">Nome Completo </Label>
                <Input id="nome" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="celular" className="flex items-center gap-1"><Phone className="h-3 w-3" /> Celular </Label>
                <Input id="celular" value={formData.celular} onChange={(e) => handleChange("celular", formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="origem" className="flex gap-1">Origem</Label>
                <Select value={formData.origem} onValueChange={(val) => handleChange("origem", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="empresa" className="flex items-center gap-1"><Building className="h-3 w-3" /> Empresa</Label>
                <Input id="empresa" value={formData.empresa} onChange={(e) => handleChange("empresa", e.target.value)} placeholder="Opcional" />
              </div>
              <div className="col-span-8 md:col-span-4 space-y-2">
                <Label htmlFor="cidade" className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Cidade </Label>
                <Input id="cidade" value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} placeholder="Ex: São Paulo" />
              </div>
              <div className="col-span-4 md:col-span-2 space-y-2">
                <Label htmlFor="uf" className="flex gap-1">UF </Label>
                <Select value={formData.uf} onValueChange={(val) => handleChange("uf", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* SEÇÃO: Perfil do Seguro */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Shield className="h-4 w-4" /> Perfil do Seguro
            </h3>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="qtdVidas">Total de Vidas </Label>
                <Input id="qtdVidas" type="number" min="1" value={formData.quantidadeVidas} onChange={(e) => handleChange("quantidadeVidas", e.target.value)} />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="valorMedio">Valor Estimado (R$) </Label>
                <Input id="valorMedio" type="number" step="0.01" value={formData.valorMedio} onChange={(e) => handleChange("valorMedio", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="possuiCnpj">Possui CNPJ?</Label>
                  <Switch id="possuiCnpj" checked={formData.possuiCnpj} onCheckedChange={(c) => handleChange("possuiCnpj", c)} />
                </div>
                {formData.possuiCnpj && (
                  <Select value={formData.tipoCnpj} onValueChange={(val) => handleChange("tipoCnpj", val)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>{TIPOS_CNPJ.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="possuiPlano">Já tem Plano?</Label>
                  <Switch id="possuiPlano" checked={formData.possuiPlano} onCheckedChange={(c) => handleChange("possuiPlano", c)} />
                </div>
                {formData.possuiPlano && (
                  <Input value={formData.planoAtual} onChange={(e) => handleChange("planoAtual", e.target.value)} placeholder="Qual plano?" />
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* SEÇÃO: Distribuição de Vidas por Faixa Etária */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Users className="h-4 w-4" /> Distribuição de Vidas por Faixa Etária
            </h3>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Total Preenchido:</span>
                <Badge variant={isTotalValid ? "default" : "destructive"}>
                  {totalFaixas} / {formData.quantidadeVidas}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {FAIXAS_ETARIAS.map((faixa, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{faixa}</Label>
                    <Input type="number" min="0" value={faixas[idx]} onChange={(e) => handleFaixaChange(idx, e.target.value)} className="h-9" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Separator />

          {/* SEÇÃO: Responsáveis */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Users className="h-4 w-4" /> Responsáveis pelo Lead
            </h3>
            
            <div className="flex items-center justify-between mb-2">
              <Label>Selecione os vendedores</Label>
              <Badge variant="outline">{selectedOwners.length} selecionado(s)</Badge>
            </div>
            
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-muted/10">
              {availableUsers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors border ${selectedOwners.includes(user.id) ? 'bg-primary/10 border-primary/30' : 'bg-card border-transparent hover:bg-muted'}`}
                      onClick={() => toggleOwner(user.id)}
                    >
                      {/* Checkbox visual */}
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedOwners.includes(user.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {selectedOwners.includes(user.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="h-6 w-6">
                          {/* Tenta pegar foto (do map) ou photoUrl (bruto) */}
                          <AvatarImage 
                            src={user.foto || user.photoUrl || ""} 
                            alt={user.nome} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600 font-bold">
                            {user.nome ? user.nome.substring(0, 2).toUpperCase() : "US"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <span className="text-sm truncate select-none">{user.nome}</span>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-4 text-muted-foreground">Carregando usuários...</p>
              )}
            </div>
          </section>

          <Separator />

          {/* SEÇÃO: Informações Adicionais */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <FileText className="h-4 w-4" /> Informações Adicionais
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hospitais de Preferência</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {hospitais.map((h, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {h}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeHospital(i)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={hospitalInput}
                    onChange={(e) => setHospitalInput(e.target.value)}
                    onKeyDown={handleAddHospital}
                    placeholder="Digite e pressione Enter"
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddHospital}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  value={formData.observacoes} 
                  onChange={(e) => handleChange("observacoes", e.target.value)} 
                  className="min-h-[80px]" 
                  placeholder="Insira detalhes adicionais..." 
                />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col gap-3 sm:flex-row sm:justify-end border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
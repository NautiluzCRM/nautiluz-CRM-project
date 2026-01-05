import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; 
import { useToast } from "@/hooks/use-toast";
import { createLeadApi, updateLeadApi, deleteLeadApi, fetchPipelines, fetchStages, fetchUsers } from "@/lib/api";
import { Lead } from "@/types/crm"; 
import { Loader2, AlertCircle, CheckCircle2, MapPin, X, Plus, Trash2, User, Users } from "lucide-react"; 

const FAIXAS_ETARIAS = [
  "0 a 18", "19 a 23", "24 a 28", "29 a 33", "34 a 38",
  "39 a 43", "44 a 48", "49 a 53", "54 a 58", "59 ou mais"
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPOS_CNPJ = ["MEI", "EI", "SLU", "LTDA", "SS", "SA", "Outros"];

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadToEdit?: Lead | null; 
}

export function CreateLeadModal({ isOpen, onClose, onSuccess, leadToEdit }: CreateLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const hoje = new Date().toISOString().split('T')[0];

  // Estados do Formulário
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
    dataCriacao: hoje,
    observacoes: ""
  });

  const [hospitais, setHospitais] = useState<string[]>([]);
  const [hospitalInput, setHospitalInput] = useState("");
  const [faixas, setFaixas] = useState<number[]>(Array(10).fill(0));

  // Estados para Responsáveis (Multi-select)
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  // 1. Carrega lista de usuários ao abrir
  useEffect(() => {
    async function loadUsers() {
      if (!isOpen) return;
      try {
        const users = await fetchUsers();
        setAvailableUsers(users.filter((u: any) => u.ativo)); 
      } catch (err) {
        console.error("Erro ao buscar usuários", err);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar a lista de vendedores." });
      }
    }
    loadUsers();
  }, [isOpen, toast]);

  // 2. Preenche dados na Edição ou Limpa na Criação
  useEffect(() => {
    if (isOpen && leadToEdit) {
      // MODO EDIÇÃO
      setFormData({
        nome: leadToEdit.nome || "",
        empresa: leadToEdit.empresa || "",
        email: leadToEdit.email || "",
        celular: leadToEdit.celular || "",
        origem: leadToEdit.origem || "Indicação",
        quantidadeVidas: leadToEdit.quantidadeVidas || 1,
        valorMedio: leadToEdit.valorMedio || 0,
        possuiCnpj: leadToEdit.possuiCnpj || false,
        tipoCnpj: leadToEdit.tipoCnpj || "",
        possuiPlano: leadToEdit.possuiPlano || false,
        planoAtual: leadToEdit.planoAtual || "",
        cidade: leadToEdit.cidade || "",
        uf: leadToEdit.uf || "",
        dataCriacao: leadToEdit.dataCriacao ? new Date(leadToEdit.dataCriacao).toISOString().split('T')[0] : hoje,
        observacoes: leadToEdit.informacoes || ""
      });
      
      setHospitais(leadToEdit.hospitaisPreferencia || []);
      
      if (leadToEdit.idades && leadToEdit.idades.length === 10) {
        setFaixas([...leadToEdit.idades]);
      } else {
        setFaixas(Array(10).fill(0));
      }

      // --- CORREÇÃO AQUI ---
      // Acessamos 'ownersIds' que criamos no api.ts (que contém só strings)
      // Se não existir, fazemos um map de segurança no array de objetos 'owners'
      const rawIds = (leadToEdit as any).ownersIds;
      
      if (rawIds && Array.isArray(rawIds)) {
         setSelectedOwners(rawIds);
      } else if ((leadToEdit as any).owners && Array.isArray((leadToEdit as any).owners)) {
         // Fallback: Extrai o ID caso venha objeto
         setSelectedOwners((leadToEdit as any).owners.map((o: any) => o.id || o._id || o));
      } else {
         setSelectedOwners([]);
      }

    } else if (isOpen && !leadToEdit) {
      // MODO CRIAÇÃO (Reset)
      setFormData({
        nome: "", empresa: "", email: "", celular: "", origem: "Indicação",
        quantidadeVidas: 1, valorMedio: 0, possuiCnpj: false, tipoCnpj: "",
        possuiPlano: false, planoAtual: "", cidade: "", uf: "", 
        dataCriacao: hoje, observacoes: ""
      });
      setHospitais([]);
      setFaixas(Array(10).fill(0));
      setSelectedOwners([]); 
    }
  }, [isOpen, leadToEdit, hoje]);

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle para selecionar/desmarcar responsáveis
  const toggleOwner = (userId: string) => {
    setSelectedOwners(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleDelete = async () => {
    if (!leadToEdit) return;
    const confirmed = window.confirm("Tem certeza que deseja excluir este lead? Essa ação não pode ser desfeita.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteLeadApi(leadToEdit.id);
      toast({ title: "Excluído!", description: "Lead removido com sucesso." });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalFaixas = faixas.reduce((acc, curr) => acc + curr, 0);
  const isTotalValid = totalFaixas === Number(formData.quantidadeVidas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- Validações ---
    if (!formData.nome.trim()) return toast({ variant: "destructive", title: "Erro", description: "Nome é obrigatório." });
    if (!formData.celular.trim() || formData.celular.length < 10) return toast({ variant: "destructive", title: "Erro", description: "Celular inválido." });
    if (formData.email && (!formData.email.includes("@") || !formData.email.includes("."))) return toast({ variant: "destructive", title: "Erro", description: "Email inválido." });
    if (!formData.cidade.trim()) return toast({ variant: "destructive", title: "Erro", description: "Cidade é obrigatória." });
    if (!formData.uf) return toast({ variant: "destructive", title: "Erro", description: "UF é obrigatória." });
    if (Number(formData.quantidadeVidas) <= 0) return toast({ variant: "destructive", title: "Erro", description: "Vidas deve ser maior que zero." });
    if (Number(formData.valorMedio) <= 0) return toast({ variant: "destructive", title: "Erro", description: "Valor deve ser maior que zero." });
    if (formData.possuiCnpj && !formData.tipoCnpj) return toast({ variant: "destructive", title: "Erro", description: "Selecione o tipo de CNPJ." });
    if (!isTotalValid) return toast({ variant: "destructive", title: "Erro", description: "Distribuição de vidas incorreta." });
    
    setIsLoading(true);

    try {
      const leadData: any = {
        ...formData,
        quantidadeVidas: Number(formData.quantidadeVidas),
        valorMedio: Number(formData.valorMedio),
        idades: faixas,
        hospitaisPreferencia: hospitais,
        owners: selectedOwners // Aqui garantimos que selectedOwners é string[]
      };

      if (leadToEdit) {
        leadData.pipelineId = leadToEdit.pipelineId;
        leadData.stageId = leadToEdit.colunaAtual;
        await updateLeadApi(leadToEdit.id, leadData);
        toast({ title: "Atualizado!", description: "Lead salvo." });
      } else {
        const pipelines = await fetchPipelines();
        if (!pipelines.length) throw new Error("Sem pipeline.");
        leadData.pipelineId = pipelines[0]._id;
        const stages = await fetchStages(leadData.pipelineId);
        if (!stages.length) throw new Error("Sem stages.");
        leadData.stageId = stages[0]._id;
        await createLeadApi(leadData);
        toast({ title: "Criado!", description: "Lead criado." });
      }
      
      setFormData({
        nome: "", empresa: "", email: "", celular: "", origem: "Indicação",
        quantidadeVidas: 1, valorMedio: 0, possuiCnpj: false, tipoCnpj: "",
        possuiPlano: false, planoAtual: "", cidade: "", uf: "", 
        dataCriacao: hoje, observacoes: ""
      });
      setFaixas(Array(10).fill(0));
      setHospitais([]);
      setHospitalInput("");
      setSelectedOwners([]);
      
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-[700px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">{leadToEdit ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2">
          
          {/* Dados Principais */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados de Contato</h4>
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <div className="col-span-12 md:col-span-8 space-y-1.5 sm:space-y-2">
                <Label htmlFor="nome" className="text-xs sm:text-sm">Nome Completo *</Label>
                <Input id="nome" required value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Ex: Maria Silva" className="h-10 text-sm" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-1.5 sm:space-y-2">
                 <Label htmlFor="dataCriacao" className="text-xs sm:text-sm">Data de Entrada</Label>
                 <Input id="dataCriacao" type="date" value={formData.dataCriacao} onChange={(e) => handleChange("dataCriacao", e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-1.5 sm:space-y-2">
                <Label htmlFor="celular" className="text-xs sm:text-sm">Celular *</Label>
                <Input id="celular" value={formData.celular} onChange={(e) => handleChange("celular", e.target.value)} placeholder="(11) 99999-9999" className="h-10 text-sm" />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" className="h-10 text-sm" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-1.5 sm:space-y-2">
                 <Label htmlFor="origem" className="text-xs sm:text-sm">Origem</Label>
                 <Select value={formData.origem} onValueChange={(val) => handleChange("origem", val)}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-8 md:col-span-9 space-y-1.5 sm:space-y-2">
                <Label htmlFor="cidade" className="text-xs sm:text-sm">Cidade *</Label>
                <Input id="cidade" value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} placeholder="Ex: São Paulo" className="h-10 text-sm" />
              </div>
              <div className="col-span-4 md:col-span-3 space-y-1.5 sm:space-y-2">
                <Label htmlFor="uf" className="text-xs sm:text-sm">UF *</Label>
                <Select value={formData.uf} onValueChange={(val) => handleChange("uf", val)}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Dados do Seguro */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Perfil do Seguro</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="qtdVidas" className="text-xs sm:text-sm">Total de Vidas *</Label>
                <Input id="qtdVidas" type="number" min="1" value={formData.quantidadeVidas} onChange={(e) => handleChange("quantidadeVidas", e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                 <Label htmlFor="valorMedio" className="text-xs sm:text-sm">Valor Estimado *</Label>
                 <Input id="valorMedio" type="number" step="0.01" value={formData.valorMedio} onChange={(e) => handleChange("valorMedio", e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1.5 sm:space-y-2">
                <Label htmlFor="empresa" className="text-xs sm:text-sm">Empresa</Label>
                <Input id="empresa" value={formData.empresa} onChange={(e) => handleChange("empresa", e.target.value)} placeholder="Opcional" className="h-10 text-sm" />
              </div>
            </div>

            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Label className="text-[10px] sm:text-xs font-semibold uppercase">Distribuição de Vidas (ANS)</Label>
                <div className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full ${isTotalValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {totalFaixas} / {formData.quantidadeVidas}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {FAIXAS_ETARIAS.map((faixa, index) => (
                  <div key={index} className="space-y-0.5 sm:space-y-1">
                    <label className="text-[8px] sm:text-[10px] text-muted-foreground block text-center truncate">{faixa}</label>
                    <Input type="number" min="0" className="h-7 sm:h-8 text-center text-xs px-1" value={faixas[index] || ""} onChange={(e) => handleFaixaChange(index, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
               <div className="flex flex-col border p-2.5 sm:p-3 rounded-lg gap-2 sm:gap-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="possuiCnpj" className="text-xs sm:text-sm">Possui CNPJ?</Label>
                    <Switch id="possuiCnpj" checked={formData.possuiCnpj} onCheckedChange={(c) => handleChange("possuiCnpj", c)} />
                  </div>
                  {formData.possuiCnpj && (
                    <div className="animate-in slide-in-from-top-2 fade-in">
                      <Select value={formData.tipoCnpj} onValueChange={(val) => handleChange("tipoCnpj", val)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o Tipo" /></SelectTrigger>
                        <SelectContent>{TIPOS_CNPJ.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
               </div>
               <div className="flex flex-col border p-2.5 sm:p-3 rounded-lg gap-2 sm:gap-3 bg-card">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="possuiPlano" className="text-xs sm:text-sm">Já tem Plano?</Label>
                    <Switch id="possuiPlano" checked={formData.possuiPlano} onCheckedChange={(c) => handleChange("possuiPlano", c)} />
                 </div>
                 {formData.possuiPlano && <Input className="h-9 text-sm animate-in slide-in-from-top-2" value={formData.planoAtual} onChange={(e) => handleChange("planoAtual", e.target.value)} placeholder="Qual plano?" />}
               </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Atribuir Responsáveis */}
          <div className="space-y-3 sm:space-y-4">
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label className="flex items-center gap-2 text-xs sm:text-sm"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Responsáveis pelo Lead</Label>
                 <Badge variant="outline" className="text-[10px] sm:text-xs">{selectedOwners.length} selecionado(s)</Badge>
               </div>
               
               <div className="border rounded-md p-2 max-h-28 sm:max-h-32 overflow-y-auto bg-muted/10">
                 {availableUsers.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                     {availableUsers.map((user) => (
                       <div 
                         key={user.id} 
                         className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors border active:scale-[0.98] ${selectedOwners.includes(user.id) ? 'bg-primary/10 border-primary/30' : 'bg-card border-transparent hover:bg-muted'}`}
                         onClick={() => toggleOwner(user.id)}
                       >
                         <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedOwners.includes(user.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {selectedOwners.includes(user.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                         </div>
                         <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                            <div className="bg-slate-200 p-1 rounded-full shrink-0"><User className="h-3 w-3 text-slate-500" /></div>
                            <span className="text-xs sm:text-sm truncate select-none">{user.nome}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-[10px] sm:text-xs text-center py-4 text-muted-foreground">Carregando usuários ou nenhum disponível...</p>
                 )}
               </div>
             </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Observações e Hospitais */}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Hospitais de Preferência</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                {hospitais.map((h, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">{h}<X className="h-3 w-3 cursor-pointer" onClick={() => removeHospital(i)} /></Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={hospitalInput} onChange={(e) => setHospitalInput(e.target.value)} onKeyDown={handleAddHospital} className="flex-1 h-10 text-sm" placeholder="Digite o hospital e pressione Enter" />
                <Button type="button" size="icon" variant="outline" onClick={handleAddHospital} className="h-10 w-10 shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="observacoes" className="text-xs sm:text-sm">Observações</Label>
              <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} className="min-h-[70px] sm:min-h-[80px] text-sm" placeholder="Insira detalhes adicionais..." />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-0">
             <div className="flex-1 flex justify-start">
               {leadToEdit && (
                 <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isLoading} className="gap-2 h-10 w-full sm:w-auto text-sm">
                   {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
                 </Button>
               )}
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
               <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting} className="h-10 flex-1 sm:flex-initial text-sm">Cancelar</Button>
               <Button type="submit" disabled={isLoading || isDeleting || !isTotalValid} className="bg-primary hover:bg-primary-hover text-white h-10 flex-1 sm:flex-initial text-sm">
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {leadToEdit ? "Salvar" : "Criar Lead"}
               </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
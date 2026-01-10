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
import { createLeadApi, fetchPipelines, fetchStages, fetchUsers } from "@/lib/api";
import { Loader2, CheckCircle2, X, Plus, User, Users, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: "Contato", icon: User },
  { id: 2, title: "Seguro", icon: CheckCircle2 },
  { id: 3, title: "Vidas ANS", icon: Users },
  { id: 4, title: "Responsáveis", icon: Users },
  { id: 5, title: "Finalizar", icon: Check }
];

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const hoje = new Date().toISOString().split('T')[0];

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
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

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
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar a lista de vendedores." });
      }
    }
    loadUsers();
  }, [isOpen, toast]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
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
  }, [isOpen, hoje]);

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.nome.trim()) {
          toast({ variant: "destructive", title: "Nome obrigatório", description: "Preencha o nome completo." });
          return false;
        }
        if (!formData.celular.trim() || formData.celular.length < 10) {
          toast({ variant: "destructive", title: "Celular inválido", description: "Insira um celular válido com pelo menos 10 dígitos." });
          return false;
        }
        if (formData.email && (!formData.email.includes("@") || !formData.email.includes("."))) {
          toast({ variant: "destructive", title: "Email inválido", description: "Insira um email válido." });
          return false;
        }
        if (!formData.cidade.trim()) {
          toast({ variant: "destructive", title: "Cidade obrigatória", description: "Preencha a cidade." });
          return false;
        }
        if (!formData.uf) {
          toast({ variant: "destructive", title: "UF obrigatória", description: "Selecione o estado." });
          return false;
        }
        return true;

      case 2:
        if (Number(formData.quantidadeVidas) <= 0) {
          toast({ variant: "destructive", title: "Vidas inválidas", description: "Quantidade deve ser maior que zero." });
          return false;
        }
        if (Number(formData.valorMedio) <= 0) {
          toast({ variant: "destructive", title: "Valor inválido", description: "Valor estimado deve ser maior que zero." });
          return false;
        }
        if (formData.possuiCnpj && !formData.tipoCnpj) {
          toast({ variant: "destructive", title: "Tipo CNPJ obrigatório", description: "Selecione o tipo de CNPJ." });
          return false;
        }
        return true;

      case 3:
        if (!isTotalValid) {
          toast({ variant: "destructive", title: "Distribuição incorreta", description: `Total de vidas deve ser ${formData.quantidadeVidas}.` });
          return false;
        }
        return true;

      case 4:
      case 5:
        return true;

      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const handleSubmit = async () => {
    for (let i = 1; i <= 3; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }
    
    setIsLoading(true);

    try {
      // --- CORREÇÃO AQUI: Montar o objeto 'faixasEtarias' para o Backend ---
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
      // --------------------------------------------------------------------

      const leadData: any = {
        ...formData,
        quantidadeVidas: Number(formData.quantidadeVidas),
        valorMedio: Number(formData.valorMedio),
        
        // Envia o objeto formatado e não o array cru
        faixasEtarias: faixasEtariasObj, 
        
        hospitaisPreferencia: hospitais,
        owners: selectedOwners
      };

      const pipelines = await fetchPipelines();
      if (!pipelines.length) throw new Error("Sem pipeline.");
      leadData.pipelineId = pipelines[0]._id;
      
      const stages = await fetchStages(leadData.pipelineId);
      if (!stages.length) throw new Error("Sem stages.");
      leadData.stageId = stages[0]._id;
      
      await createLeadApi(leadData);
      toast({ title: "Criado!", description: "Lead criado." });
      
      // Resetar Form
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
      setCurrentStep(1);
      
      onSuccess();
      onClose();

    } catch (error: any) {
      setCurrentStep(1);
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          
          <div className="space-y-3 pt-4">
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between px-2">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                    ${currentStep === step.id 
                      ? 'bg-primary text-white ring-4 ring-primary/20' 
                      : currentStep > step.id 
                        ? 'bg-success text-white dark:bg-success/90'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${currentStep === step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 min-h-[400px]">
          {/* STEP 1 */}
          {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" /> Dados de Contato
            </h4>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-8 space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="dataCriacao">Data de Entrada</Label>
                <Input id="dataCriacao" type="date" value={formData.dataCriacao} onChange={(e) => handleChange("dataCriacao", e.target.value)} />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input id="celular" value={formData.celular} onChange={(e) => handleChange("celular", formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <Select value={formData.origem} onValueChange={(val) => handleChange("origem", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-8 md:col-span-9 space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} placeholder="Ex: São Paulo" />
              </div>
              <div className="col-span-4 md:col-span-3 space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={formData.uf} onValueChange={(val) => handleChange("uf", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Perfil do Seguro
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qtdVidas">Total de Vidas *</Label>
                <Input id="qtdVidas" type="number" min="1" value={formData.quantidadeVidas} onChange={(e) => handleChange("quantidadeVidas", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorMedio">Valor Estimado *</Label>
                <Input id="valorMedio" type="number" step="0.01" value={formData.valorMedio} onChange={(e) => handleChange("valorMedio", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" value={formData.empresa} onChange={(e) => handleChange("empresa", e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border">
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

            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="possuiPlano">Já tem Plano?</Label>
                <Switch id="possuiPlano" checked={formData.possuiPlano} onCheckedChange={(c) => handleChange("possuiPlano", c)} />
              </div>
              {formData.possuiPlano && (
                <Input value={formData.planoAtual} onChange={(e) => handleChange("planoAtual", e.target.value)} placeholder="Qual plano?" />
              )}
            </div>
          </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Distribuição de Vidas
            </h4>
            
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Total Preenchido:</span>
                <Badge variant={isTotalValid ? "default" : "destructive"}>
                  {totalFaixas} / {formData.quantidadeVidas}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {FAIXAS_ETARIAS.map((faixa, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-xs">{faixa}</Label>
                    <Input type="number" min="0" value={faixas[idx]} onChange={(e) => handleFaixaChange(idx, e.target.value)} className="h-9" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Responsáveis pelo Lead
            </h4>
            
            <div className="flex items-center justify-between">
              <Label>Selecione os vendedores</Label>
              <Badge variant="outline">{selectedOwners.length} selecionado(s)</Badge>
            </div>
            
            <div className="border rounded-md p-2 max-h-64 overflow-y-auto bg-muted/10">
              {availableUsers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors border ${selectedOwners.includes(user.id) ? 'bg-primary/10 border-primary/30' : 'bg-card border-transparent hover:bg-muted'}`}
                      onClick={() => toggleOwner(user.id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedOwners.includes(user.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {selectedOwners.includes(user.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-slate-200 p-1 rounded-full"><User className="h-3 w-3 text-slate-500" /></div>
                        <span className="text-sm truncate select-none">{user.nome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-4 text-muted-foreground">Carregando usuários...</p>
              )}
            </div>
          </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Check className="h-4 w-4" /> Informações Adicionais
            </h4>
            
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
                className="min-h-[100px]" 
                placeholder="Insira detalhes adicionais..." 
              />
            </div>
          </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            )}
            
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNextStep} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white">
                Próximo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Lead
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
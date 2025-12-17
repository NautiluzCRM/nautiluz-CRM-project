import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; 
import { useToast } from "@/hooks/use-toast";
import { createLeadApi, fetchPipelines, fetchStages } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, MapPin, X, Plus } from "lucide-react"; 

const FAIXAS_ETARIAS = [
  "0 a 18", "19 a 23", "24 a 28", "29 a 33", "34 a 38",
  "39 a 43", "44 a 48", "49 a 53", "54 a 58", "59 ou mais"
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Lista de Naturezas Jurídicas comuns no mercado
const TIPOS_CNPJ = ["MEI", "EI", "SLU", "LTDA", "SS", "SA", "Outros"];

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
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
    tipoCnpj: "", // Armazena o tipo selecionado (MEI, LTDA, etc)
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

  const totalFaixas = faixas.reduce((acc, curr) => acc + curr, 0);
  const isTotalValid = totalFaixas === Number(formData.quantidadeVidas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---

    if (!formData.nome.trim()) {
      toast({ variant: "destructive", title: "Campo Obrigatório", description: "Por favor, preencha o Nome Completo." });
      return;
    }

    if (!formData.celular.trim() || formData.celular.length < 10) {
      toast({ variant: "destructive", title: "Celular Inválido", description: "Informe um número de celular válido com DDD." });
      return;
    }

    if (formData.email && (!formData.email.includes("@") || !formData.email.includes("."))) {
      toast({ variant: "destructive", title: "Email Inválido", description: "O email precisa conter '@' e um domínio (ex: .com)." });
      return;
    }

    if (!formData.cidade.trim()) {
      toast({ variant: "destructive", title: "Localização", description: "O campo Cidade é obrigatório." });
      return;
    }

    if (!formData.uf) {
      toast({ variant: "destructive", title: "Localização", description: "Selecione o Estado (UF)." });
      return;
    }

    if (Number(formData.quantidadeVidas) <= 0) {
      toast({ variant: "destructive", title: "Cotação", description: "A quantidade de vidas deve ser maior que zero." });
      return;
    }

    if (Number(formData.valorMedio) <= 0) {
      toast({ variant: "destructive", title: "Cotação", description: "Informe o Valor Estimado da negociação." });
      return;
    }

    // Validação extra: Se marcou que tem CNPJ, deve escolher o tipo
    if (formData.possuiCnpj && !formData.tipoCnpj) {
      toast({ variant: "destructive", title: "Dados da Empresa", description: "Selecione o Tipo de CNPJ (ex: MEI, LTDA)." });
      return;
    }

    if (!isTotalValid) {
      toast({
        variant: "destructive",
        title: "Divergência de Vidas",
        description: `Você informou ${formData.quantidadeVidas} vidas no total, mas distribuiu ${totalFaixas} nas faixas etárias.`
      });
      return;
    }

    // --- FIM DA VALIDAÇÃO ---

    setIsLoading(true);

    try {
      const pipelines = await fetchPipelines();
      if (!pipelines.length) throw new Error("Nenhum pipeline configurado.");
      const pipelineId = pipelines[0]._id;
      
      const stages = await fetchStages(pipelineId);
      if (!stages.length) throw new Error("Pipeline sem colunas.");
      const firstStageId = stages[0]._id;

      const leadData = {
        ...formData,
        pipelineId,
        stageId: firstStageId,
        quantidadeVidas: Number(formData.quantidadeVidas),
        valorMedio: Number(formData.valorMedio),
        idades: faixas,
        hospitaisPreferencia: hospitais
      };

      await createLeadApi(leadData);

      toast({ title: "Sucesso!", description: "Lead criado com sucesso." });
      
      // Reset Total
      setFormData({
        nome: "", empresa: "", email: "", celular: "", origem: "Indicação",
        quantidadeVidas: 1, valorMedio: 0, possuiCnpj: false, tipoCnpj: "", possuiPlano: false,
        planoAtual: "", cidade: "", uf: "", dataCriacao: hoje, observacoes: ""
      });
      setFaixas(Array(10).fill(0));
      setHospitais([]);
      setHospitalInput("");
      
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          
          {/* Dados Principais */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados de Contato</h4>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-8 space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input 
                  id="nome" required value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                 <Label htmlFor="dataCriacao">Data de Entrada</Label>
                 <Input 
                   id="dataCriacao" type="date" value={formData.dataCriacao}
                   onChange={(e) => handleChange("dataCriacao", e.target.value)}
                 />
              </div>

              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input 
                  id="celular" value={formData.celular}
                  onChange={(e) => handleChange("celular", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="col-span-6 md:col-span-4 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" type="email" value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
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
                <Label htmlFor="cidade" className="flex items-center gap-1">
                   <MapPin className="h-3 w-3" /> Cidade *
                </Label>
                <Input 
                  id="cidade" value={formData.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="col-span-4 md:col-span-3 space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={formData.uf} onValueChange={(val) => handleChange("uf", val)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Dados do Seguro */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Perfil do Seguro</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qtdVidas">Total de Vidas *</Label>
                <Input 
                  id="qtdVidas" type="number" min="1" className="font-bold"
                  value={formData.quantidadeVidas}
                  onChange={(e) => handleChange("quantidadeVidas", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="valorMedio">Valor Estimado (R$) *</Label>
                 <Input 
                   id="valorMedio" type="number" step="0.01"
                   value={formData.valorMedio}
                   onChange={(e) => handleChange("valorMedio", e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input 
                  id="empresa" value={formData.empresa}
                  onChange={(e) => handleChange("empresa", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Grid de Faixas Etárias */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold uppercase">Distribuição por Faixa Etária (ANS)</Label>
                <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${isTotalValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isTotalValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {totalFaixas} / {formData.quantidadeVidas}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {FAIXAS_ETARIAS.map((faixa, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-[10px] text-muted-foreground block text-center truncate">{faixa}</label>
                    <Input 
                      type="number" min="0" className="h-8 text-center text-xs"
                      value={faixas[index] || ""} placeholder="0"
                      onChange={(e) => handleFaixaChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Bloco de CNPJ com Select Condicional */}
               <div className="flex flex-col border p-3 rounded-lg gap-3 bg-card transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="possuiCnpj" className="text-sm cursor-pointer font-medium">Possui CNPJ?</Label>
                    <Switch id="possuiCnpj" checked={formData.possuiCnpj} onCheckedChange={(c) => handleChange("possuiCnpj", c)} />
                  </div>
                  
                  {formData.possuiCnpj && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                       <Select value={formData.tipoCnpj} onValueChange={(val) => handleChange("tipoCnpj", val)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione o Tipo" /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_CNPJ.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
               </div>

               <div className="flex flex-col border p-3 rounded-lg gap-3 bg-card">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="possuiPlano" className="text-sm">Já tem Plano?</Label>
                    <Switch id="possuiPlano" checked={formData.possuiPlano} onCheckedChange={(c) => handleChange("possuiPlano", c)} />
                 </div>
                 {formData.possuiPlano && (
                    <Input 
                      className="h-8 text-sm animate-in slide-in-from-top-2"
                      value={formData.planoAtual}
                      onChange={(e) => handleChange("planoAtual", e.target.value)}
                      placeholder="Qual plano atual?"
                    />
                 )}
               </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Hospitais e Observações */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hospitais de Preferência</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hospitais.map((hospital, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1 text-xs gap-1 hover:bg-secondary/80">
                    {hospital}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeHospital(index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={hospitalInput}
                  onChange={(e) => setHospitalInput(e.target.value)}
                  onKeyDown={handleAddHospital}
                  placeholder="Digite o hospital e pressione Enter"
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddHospital}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Ex: Hospital Sírio-Libanês, Albert Einstein...</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea 
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Insira detalhes adicionais, preferências ou necessidades específicas..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !isTotalValid} className="bg-primary hover:bg-primary-hover text-white">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
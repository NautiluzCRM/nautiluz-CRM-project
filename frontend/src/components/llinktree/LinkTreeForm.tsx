import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; 
import { Loader2, Plus, X, CheckCircle2 } from "lucide-react"; 

const FAIXAS_ETARIAS = [
  "0 a 18", "19 a 23", "24 a 28", "29 a 33", "34 a 38",
  "39 a 43", "44 a 48", "49 a 53", "54 a 58", "59 ou mais"
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPOS_CNPJ = ["MEI", "EI", "SLU", "LTDA", "SS", "SA", "Outros"];

export function LinktreeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    celular: "",
    quantidadeVidas: 1,
    valorMedio: "", 
    possuiCnpj: false,
    tipoCnpj: "", 
    possuiPlano: false,
    planoAtual: "",
    cidade: "",
    uf: "SP", 
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

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalFaixas = faixas.reduce((acc, curr) => acc + curr, 0);
  const isTotalValid = totalFaixas === Number(formData.quantidadeVidas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTotalValid) {
      alert(`A soma das idades (${totalFaixas}) deve ser igual ao total de vidas (${formData.quantidadeVidas})!`);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.nome,
        phone: formData.celular,
        email: formData.email,
        city: formData.cidade,
        state: formData.uf,
        
        livesCount: Number(formData.quantidadeVidas),
        avgPrice: Number(formData.valorMedio) || 0,
        
        hasCnpj: formData.possuiCnpj,
        cnpjType: formData.tipoCnpj,
        
        hasCurrentPlan: formData.possuiPlano,
        currentPlan: formData.planoAtual,
        
        ageBuckets: faixas,
        preferredHospitals: hospitais
      };

      const response = await fetch('http://localhost:3000/public/linktree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 201) {
        setSuccess(true);
      } else {
        console.error("Erro do Backend:", data);
        alert(`Erro ao enviar: ${data.message || 'Verifique os dados.'}`);
      }

    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor. Verifique se o backend está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center border animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitação Recebida!</h2>
          <p className="text-gray-600 mb-6">
            Obrigado, {formData.nome.split(' ')[0]}.<br/>
            Já estamos analisando o melhor plano para o seu perfil.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">Enviar Nova Cotação</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4 md:py-10">
      
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cotação Express</h1>
        <p className="text-gray-500 mt-2">Preencha para receber uma proposta personalizada</p>
      </div>

      <div className="w-full max-w-2xl bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary/5 p-4 border-b">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider text-center">Ficha de Solicitação</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados de Contato</h4>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-12 space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" required value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              
              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="celular">Celular / WhatsApp *</Label>
                <Input id="celular" required value={formData.celular} onChange={(e) => handleChange("celular", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              
              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              
              <div className="col-span-8 md:col-span-9 space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" required value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} placeholder="Ex: São Paulo" />
              </div>
              
              <div className="col-span-4 md:col-span-3 space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Select value={formData.uf} onValueChange={(val) => handleChange("uf", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Perfil do Seguro</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qtdVidas">Total de Vidas *</Label>
                <Input id="qtdVidas" type="number" min="1" value={formData.quantidadeVidas} onChange={(e) => handleChange("quantidadeVidas", e.target.value)} />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="valorMedio">Investimento Previsto (R$)</Label>
                 <Input id="valorMedio" type="number" placeholder="Ex: 1500" value={formData.valorMedio} onChange={(e) => handleChange("valorMedio", e.target.value)} />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold uppercase">Distribuição de Vidas</Label>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${isTotalValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {totalFaixas} / {formData.quantidadeVidas}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {FAIXAS_ETARIAS.map((faixa, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-[10px] text-muted-foreground block text-center truncate">{faixa}</label>
                    <Input 
                      type="number" 
                      min="0" 
                      className="h-8 text-center text-xs border border-gray-400 focus:border-primary" 
                      value={faixas[index] || ""} 
                      onChange={(e) => handleFaixaChange(index, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex flex-col border p-3 rounded-lg gap-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="possuiCnpj">Possui CNPJ?</Label>
                    <Switch id="possuiCnpj" checked={formData.possuiCnpj} onCheckedChange={(c) => handleChange("possuiCnpj", c)} />
                  </div>
                  {formData.possuiCnpj && (
                    <div className="animate-in slide-in-from-top-2 fade-in pt-2">
                      <Select value={formData.tipoCnpj} onValueChange={(val) => handleChange("tipoCnpj", val)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o Tipo" /></SelectTrigger>
                        <SelectContent>{TIPOS_CNPJ.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
               </div>
               
               <div className="flex flex-col border p-3 rounded-lg gap-3 bg-card">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="possuiPlano">Já tem Plano?</Label>
                    <Switch id="possuiPlano" checked={formData.possuiPlano} onCheckedChange={(c) => handleChange("possuiPlano", c)} />
                 </div>
                 {formData.possuiPlano && (
                    <Input className="h-9 text-sm animate-in slide-in-from-top-2 mt-2" value={formData.planoAtual} onChange={(e) => handleChange("planoAtual", e.target.value)} placeholder="Qual operadora?" />
                 )}
               </div>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hospitais de Preferência</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hospitais.map((h, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                    {h} 
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeHospital(i)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={hospitalInput} 
                  onChange={(e) => setHospitalInput(e.target.value)} 
                  onKeyDown={handleAddHospital} 
                  className="flex-1" 
                  placeholder="Digite e pressione Enter" 
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddHospital}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} className="min-h-[80px]" placeholder="Algo mais que devamos saber?" />
            </div>
          </div>

=          <Button type="submit" disabled={isLoading || !isTotalValid} className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90">
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {isLoading ? "Enviando..." : "Solicitar Orçamento Grátis"}
          </Button>

        </form>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        &copy; 2025 Nautiluz CRM. Seus dados estão seguros.
      </p>
    </div>
  );
}
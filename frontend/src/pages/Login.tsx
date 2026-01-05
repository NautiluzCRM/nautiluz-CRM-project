import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { API_URL } from "@/lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados do modal de recuperação de senha
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo ao NAUTILUZ CRM" });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Erro no login",
        description: err?.message || "Não foi possível autenticar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoveryLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar email");
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível enviar o email",
        variant: "destructive",
      });
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setRecoveryEmail(email); // Preenche com o email já digitado
    setEmailSent(false);
    setForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setEmailSent(false);
    setRecoveryEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {/* --- LOGO ALTERADA AQUI --- */}
            {/* Substituí o container da âncora pela Imagem da Logo */}
            <img 
              src="/nautiluz.png" 
              alt="Nautiluz CRM" 
              className="h-24 w-auto object-contain drop-shadow-sm" 
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">NAUTILUZ CRM</h1>
            <p className="text-muted-foreground">Sistema de Gestão de Leads</p>
          </div>
        </div>

        {/* Formulário de Login */}
        <Card className="shadow-card border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Fazer Login
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Digite seus dados para acessar o sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Lembrar-me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:bg-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>Credenciais de teste:</p>
              <div className="font-mono text-xs mt-1 space-y-1">
                <p>admin@nautiluz.com / demo123 (Admin)</p>
                <p>vendas@nautiluz.com / demo123 (Vendedor)</p>
                <p>financeiro@nautiluz.com / demo123 (Financeiro)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 NAUTILUZ - Consultoria em Seguros</p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          {emailSent ? (
            <>
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <DialogTitle className="text-center">Email Enviado!</DialogTitle>
                <DialogDescription className="text-center">
                  Se o email <strong>{recoveryEmail}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                  >
                    Tentar novamente
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCloseForgotPassword}
                    className="flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Esqueceu sua senha?</DialogTitle>
                <DialogDescription>
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:bg-primary-hover"
                    disabled={isRecoveryLoading}
                  >
                    {isRecoveryLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseForgotPassword}
                    className="flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
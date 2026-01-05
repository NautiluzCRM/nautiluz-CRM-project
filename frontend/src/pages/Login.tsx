import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, Mail, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
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
    setRecoveryEmail(email);
    setEmailSent(false);
    setForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setEmailSent(false);
    setRecoveryEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-primary/5 flex flex-col">
      {/* Mobile-first: centered vertically and horizontally */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
          
          {/* Logo e Cabeçalho */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-3 shadow-lg shadow-primary/10">
                <img 
                  src="/nautiluz.png" 
                  alt="Nautiluz CRM" 
                  className="h-16 sm:h-20 w-auto object-contain" 
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                NAUTILUZ CRM
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sistema de Gestão de Leads
              </p>
            </div>
          </div>

          {/* Formulário de Login */}
          <Card className="shadow-xl shadow-primary/5 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2 pt-6 px-4 sm:px-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-center">
                Entrar
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                Digite seus dados para acessar
              </p>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 sm:h-12 text-base"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 sm:h-12 text-base"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
                  <label 
                    htmlFor="remember" 
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <span className="text-sm text-muted-foreground leading-none">
                      Lembrar-me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              {/* Credenciais de teste */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs space-y-1 text-center">
                <p className="text-muted-foreground font-medium mb-2">Credenciais de teste:</p>
                <p className="font-mono">admin@nautiluz.com / demo123</p>
                <p className="font-mono">vendas@nautiluz.com / demo123</p>
                <p className="font-mono">financeiro@nautiluz.com / demo123</p>
              </div>
            </CardContent>
          </Card>

          {/* Rodapé */}
          <p className="text-center text-xs text-muted-foreground">
            © 2025 NAUTILUZ - Consultoria em Seguros
          </p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-xl">
          {emailSent ? (
            <>
              <DialogHeader className="text-center">
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
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Não recebeu? Verifique sua pasta de spam.
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => setEmailSent(false)} className="h-11">
                    Tentar novamente
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCloseForgotPassword}
                    className="h-11 flex items-center justify-center gap-1"
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
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isRecoveryLoading}
                  >
                    {isRecoveryLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseForgotPassword}
                    className="h-11 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
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
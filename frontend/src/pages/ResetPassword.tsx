import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/validate-reset-token?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsTokenValid(true);
        }
      } catch (err) {
        console.error("Error validating token:", err);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao redefinir senha");
      }

      setResetSuccess(true);
      toast({
        title: "Sucesso!",
        description: "Sua senha foi redefinida com sucesso.",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível redefinir a senha",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
        <Card className="shadow-card border-0 w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/nautiluz.png" 
                alt="Nautiluz CRM" 
                className="h-24 w-auto object-contain drop-shadow-sm" 
              />
            </div>
          </div>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Link Inválido ou Expirado</h2>
                <p className="text-muted-foreground">
                  O link de recuperação de senha é inválido ou já expirou. 
                  Por favor, solicite um novo link.
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/recuperar-senha">
                  <Button className="w-full bg-gradient-primary hover:bg-primary-hover">
                    Solicitar Novo Link
                  </Button>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar para o login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/nautiluz.png" 
                alt="Nautiluz CRM" 
                className="h-24 w-auto object-contain drop-shadow-sm" 
              />
            </div>
          </div>

          <Card className="shadow-card border-0">
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Senha Redefinida!</h2>
                <p className="text-muted-foreground">
                  Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                </p>
              </div>

              <Button
                className="w-full bg-gradient-primary hover:bg-primary-hover"
                onClick={() => navigate("/login")}
              >
                Ir para o Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/nautiluz.png" 
              alt="Nautiluz CRM" 
              className="h-24 w-auto object-contain drop-shadow-sm" 
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">NAUTILUZ CRM</h1>
            <p className="text-muted-foreground">Redefinir Senha</p>
          </div>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Criar Nova Senha
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Digite sua nova senha abaixo
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">As senhas não coincidem</p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:bg-primary-hover"
                disabled={isLoading || password !== confirmPassword}
              >
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 NAUTILUZ - Consultoria em Seguros</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

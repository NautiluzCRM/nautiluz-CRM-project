import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
                <h2 className="text-xl font-semibold">Email Enviado!</h2>
                <p className="text-muted-foreground">
                  Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Tentar novamente
                </Button>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para o login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <p className="text-muted-foreground">Recuperação de Senha</p>
          </div>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Esqueceu sua senha?
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Digite seu email e enviaremos um link para redefinir sua senha
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

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:bg-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
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

export default ForgotPassword;

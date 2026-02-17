import { Link, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "@/components/Icons";

export default function CheckoutFailure() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const reason = params.get("reason") || "Pagamento recusado";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          <AlertCircleIcon size="xl" className="text-red-600" />
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Pagamento Não Aprovado
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Desculpe, houve um problema ao processar seu pagamento. Por favor, verifique seus dados e tente novamente.
            </p>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-6">
              <p className="text-sm text-red-800">
                <strong>Motivo:</strong> {reason}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <Link href="/cart">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Voltar ao Carrinho
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Ir para Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-4 max-w-sm space-y-2">
            <p>Se o problema persistir, entre em contato conosco pelo e-mail ou whatsapp.</p>
            <p>Estamos aqui para ajudar!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

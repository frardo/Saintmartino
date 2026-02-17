import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@/components/Icons";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentId = params.get("payment_id");
  const preferenceId = params.get("preference_id");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          <CheckCircleIcon size="xl" className="text-green-600" />
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Pagamento Aprovado! 🎉
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Seu pedido foi processado com sucesso. Você receberá em breve um e-mail de confirmação com os detalhes.
            </p>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-6">
              <p className="text-sm text-green-800">
                <strong>ID do Pagamento:</strong> {paymentId || "Confirmando..."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <Link href="/acompanhar-pedido">
              <Button className="bg-green-600 hover:bg-green-700">
                Acompanhar Pedido
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Continuar Comprando
              </Button>
            </Link>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-4 max-w-sm">
            <p>Obrigado pela sua compra! Nos comprometemos com a qualidade e a excelência.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Link, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "@/components/Icons";

export default function CheckoutPending() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentId = params.get("payment_id");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          <LoaderIcon size="xl" className="text-yellow-600" />
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Pagamento Pendente
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Seu pagamento está sendo processado. Você receberá a confirmação em breve.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
              <p className="text-sm text-yellow-800">
                <strong>ID do Pagamento:</strong> {paymentId || "Processando..."}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Pode levar alguns minutos para processar.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <Link href="/acompanhar-pedido">
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                Acompanhar Pedido
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Ir para Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-4 max-w-sm space-y-2">
            <p>Você receberá um e-mail de confirmação em breve com os detalhes do seu pedido.</p>
            <p>Obrigado pela sua compra!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

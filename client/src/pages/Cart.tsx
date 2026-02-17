import * as React from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, removeItem, updateQuantity, toggleSelection, selectAll, getSelectedTotal, getSelectedItems, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(true);
  const [showTermsError, setShowTermsError] = React.useState(false);

  const handleCheckout = async () => {
    // Always show the modal first - the checkbox starts pre-checked for convenience
    // but user must explicitly accept terms to proceed
    setShowTermsError(true);
    return;
  };

  const handleConfirmCheckout = async () => {
    if (!acceptedTerms) {
      return; // Continue button is disabled if not accepted
    }

    // Close the modal and proceed with checkout
    setShowTermsError(false);

    try {
      setIsCheckingOut(true);
      const selectedItems = getSelectedItems();
      console.log("Sending checkout request with items:", selectedItems);

      const response = await fetch("/api/checkout/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: selectedItems }),
      });

      console.log("Response status:", response.status);
      const contentType = response.headers.get("content-type");
      console.log("Response content-type:", contentType);

      const text = await response.text();
      console.log("Response text:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        alert(`Erro: resposta inválida do servidor. ${text.substring(0, 100)}`);
        return;
      }

      console.log("Parsed data:", data);

      if (data.success && data.checkoutUrl) {
        // Clear cart and redirect to Mercado Pago checkout
        console.log("Redirecting to:", data.checkoutUrl);
        clearCart();
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Checkout failed:", data);
        alert(`Erro ao iniciar o checkout: ${data.message || "Desconhecido"}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(`Erro ao iniciar o checkout: ${error instanceof Error ? error.message : "Desconhecido"}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center gap-6 py-24">
            <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-50" />
            <div className="text-center space-y-2">
              <h1 className="font-serif text-3xl md:text-4xl text-foreground">
                Sacola Vazia
              </h1>
              <p className="text-muted-foreground max-w-sm">
                Não há produtos na sua sacola. Volte e escolha alguns relógios e pulseiras!
              </p>
            </div>
            <Link href="/">
              <Button className="mt-4">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const selectedItems = getSelectedItems();
  const selectedTotal = getSelectedTotal();
  const allSelected = items.length > 0 && items.every(item => item.selected);

  return (
    <div className="min-h-screen bg-background">
      {/* Terms Acceptance Modal */}
      {showTermsError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-foreground to-foreground/90 px-6 py-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-white">Termos de Uso e Compra Segura</h2>
              <button
                onClick={() => setShowTermsError(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Ao prosseguir com a compra, você concorda com os{" "}
                  <a
                    href="/terms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    Termos de Uso e Política de Privacidade
                  </a>{" "}
                  da SAINT MARTINO.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Você reconhece que leu e compreendeu nossos termos, incluindo políticas de devolução, garantia,
                  proteção de dados e conformidade com as leis vigentes brasileiras (Lei Geral de Proteção de Dados - LGPD
                  e Código de Defesa do Consumidor).
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para mais detalhes, consulte nosso documento completo de{" "}
                  <a
                    href="/terms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    Termos de Uso
                  </a>
                  .
                </p>
              </div>

              {/* Acceptance Checkbox */}
              <div className="border-t border-border pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 cursor-pointer rounded border-border"
                  />
                  <span className="text-sm text-foreground font-medium">
                    Concordo com os Termos de Uso e a Política de Privacidade
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowTermsError(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors font-medium text-foreground"
                >
                  Fechar
                </button>
                <button
                  onClick={handleConfirmCheckout}
                  disabled={!acceptedTerms || isCheckingOut}
                  className="flex-1 px-4 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isCheckingOut ? "Processando..." : "Continuar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <svg
                  className="animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" className="opacity-25" />
                  <path d="M12 2a10 10 0 0 1 10 10" className="text-blue-600" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg text-foreground">
                  Preparando seu checkout...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conectando com Mercado Pago
                </p>
              </div>

              {/* Terms of Service */}
              <div className="w-full pt-4 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">
                    Eu aceito os{" "}
                    <a
                      href="/terms.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold"
                    >
                      termos de uso
                    </a>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20">
        <h1 className="font-serif text-4xl md:text-5xl mb-12 text-foreground">
          Sacola de Compras
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select All */}
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => selectAll()}
                className="w-5 h-5 cursor-pointer"
              />
              <label className="flex-1 text-sm font-medium cursor-pointer">
                Selecionar todos os produtos
              </label>
            </div>

            <Separator />

            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {/* Checkbox */}
                  <div className="flex items-start pt-2">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelection(item.product.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  {/* Product Image */}
                  <div className="w-24 h-32 flex-shrink-0">
                    <img
                      src={item.product.imageUrls[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded bg-secondary"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 space-y-2">
                    <Link href={`/product/${item.product.id}`}>
                      <h3 className="font-serif text-lg text-foreground hover:underline decoration-primary/50">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.product.metal} {item.product.stone && `• ${item.product.stone}`}
                    </p>
                    <p className="font-semibold text-lg">
                      R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        × R$ {Number(item.product.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-destructive hover:bg-red-50 rounded transition-colors self-start"
                    title="Remover do carrinho"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-lg p-6 sticky top-20 space-y-6">
              <div>
                <h2 className="font-serif text-2xl mb-4">Resumo</h2>
                <Separator className="mb-4" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos selecionados:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R$ {selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span className="font-medium">Calcular no checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>R$ {selectedTotal.toFixed(2)}</span>
              </div>

              <button
                disabled={selectedItems.length === 0 || isCheckingOut}
                onClick={handleCheckout}
                className="w-full bg-[#262626] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {isCheckingOut ? "Carregando..." : "Ir para Checkout"}
              </button>

              <Link href="/">
                <button className="w-full border-2 border-border text-foreground py-3 text-sm uppercase tracking-widest font-bold hover:bg-secondary transition-colors rounded">
                  Continuar Comprando
                </button>
              </Link>

              <div className="text-xs text-center text-muted-foreground pt-4">
                <p>Frete grátis em pedidos acima de R$ 500</p>
                <p>Devolução em 30 dias</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

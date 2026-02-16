import { Link } from "wouter";
import { Header } from "@/components/Header";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { items, removeItem, updateQuantity, toggleSelection, selectAll, getSelectedTotal, getSelectedItems } = useCart();

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
                disabled={selectedItems.length === 0}
                onClick={() => alert("Redirecionando para checkout...")}
                className="w-full bg-[#262626] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Ir para Checkout
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

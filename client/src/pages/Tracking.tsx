import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, AlertCircle, CheckCircle2, Package, ChevronRight, Truck } from "lucide-react";

interface TrackingStatus {
  status: "pending" | "processing" | "shipped" | "delivered";
  date: string;
  description: string;
}

interface OrderItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

interface OrderTracking {
  orderId: string;
  customerName: string;
  productName: string;
  trackingCode: string;
  currentStatus: "pending" | "processing" | "shipped" | "delivered";
  statuses: TrackingStatus[];
  estimatedDelivery: string;
  items: OrderItem[];
}

export default function Tracking() {
  const search = useSearch();
  const [trackingCode, setTrackingCode] = useState("");
  const [orderData, setOrderData] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-search se houver parâmetro de URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get("code");
    if (code) {
      setTrackingCode(code);
      performSearch(code);
    }
  }, [search]);

  const performSearch = async (code: string) => {
    if (!code.trim()) {
      setError("Por favor, insira um código de rastreamento");
      return;
    }

    setIsLoading(true);
    setError("");
    setOrderData(null);

    try {
      // Tentar buscar pedido real da API
      const response = await fetch(`/api/orders/${code}`);
      if (response.ok) {
        const order = await response.json();

        // Mapear tracking events para o formato esperado
        const statuses: TrackingStatus[] = [];
        if (order.trackingEvents && Array.isArray(order.trackingEvents)) {
          for (const event of order.trackingEvents) {
            let status: "pending" | "processing" | "shipped" | "delivered" = "pending";
            if (["embalado", "saiu_alemanha"].includes(event.status)) {
              status = "processing";
            } else if (["em_transito", "alfandega", "em_transito_br"].includes(event.status)) {
              status = "shipped";
            } else if (event.status === "entregue") {
              status = "delivered";
            }

            statuses.push({
              status,
              date: new Date(order.createdAt).toLocaleDateString("pt-BR"),
              description: `${event.location} - ${event.description}`,
            });
          }
        }

        // Converter para o formato esperado
        const trackingOrder: OrderTracking = {
          orderId: order.id.toString(),
          customerName: order.customerName,
          productName: order.items?.[0]?.name || "Pedido",
          trackingCode: order.id.toString(),
          currentStatus: statuses.length > 0
            ? statuses[statuses.length - 1].status
            : (order.status === "approved" ? "delivered" : "pending"),
          statuses: statuses.length > 0 ? statuses : [
            {
              status: "pending",
              date: new Date(order.createdAt).toLocaleDateString("pt-BR"),
              description: "Pedido recebido e confirmado",
            },
          ],
          estimatedDelivery: `Dia ${order.currentTrackingDay || 0} de ${order.maxTrackingDays || 9}`,
          items: order.items || [],
        };
        setOrderData(trackingOrder);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.log("Pedido real não encontrado, usando dados de exemplo");
    }

    // Fallback para dados mock
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockData: { [key: string]: OrderTracking } = {
      "MP123456": {
        orderId: "MP123456",
        customerName: "João Silva",
        productName: "Relógio Suíço Automático",
        trackingCode: "MP123456",
        currentStatus: "shipped",
        statuses: [
          {
            status: "pending",
            date: "2024-02-10",
            description: "Pedido recebido e confirmado",
          },
          {
            status: "processing",
            date: "2024-02-11",
            description: "Pedido em processamento",
          },
          {
            status: "shipped",
            date: "2024-02-13",
            description: "Pedido enviado via sedex",
          },
          {
            status: "delivered",
            date: "2024-02-17",
            description: "Entrega agendada",
          },
        ],
        estimatedDelivery: "17 de Fevereiro de 2024",
        items: [
          {
            productId: 1,
            name: "Elegância Clássica",
            price: "2890.00",
            quantity: 1,
            imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop",
          },
        ],
      },
      "MP789012": {
        orderId: "MP789012",
        customerName: "Maria Santos",
        productName: "Pulseira de Couro Premium",
        trackingCode: "MP789012",
        currentStatus: "delivered",
        statuses: [
          {
            status: "pending",
            date: "2024-02-05",
            description: "Pedido recebido e confirmado",
          },
          {
            status: "processing",
            date: "2024-02-06",
            description: "Pedido em processamento",
          },
          {
            status: "shipped",
            date: "2024-02-08",
            description: "Pedido enviado via sedex",
          },
          {
            status: "delivered",
            date: "2024-02-12",
            description: "Entregue com sucesso",
          },
        ],
        estimatedDelivery: "2024-02-12",
        items: [
          {
            productId: 2,
            name: "Prata Minimalista",
            price: "890.00",
            quantity: 2,
            imageUrl: "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?q=80&w=800&auto=format&fit=crop",
          },
        ],
      },
    };

    const data = mockData[code.toUpperCase()];

    if (data) {
      setOrderData(data);
    } else {
      setError("Código de rastreamento não encontrado. Verifique se está correto.");
    }

    setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(trackingCode);
  };

  // Auto-advance tracking every 3 seconds when order is displayed
  useEffect(() => {
    if (!orderData) return;

    const autoAdvance = async () => {
      try {
        const response = await fetch(`/api/test/advance-status/${orderData.orderId}`, {
          method: "POST",
        });

        if (response.ok) {
          await performSearch(orderData.orderId);
        }
      } catch (err) {
        console.error("Erro ao avançar status automaticamente:", err);
      }
    };

    const interval = setInterval(autoAdvance, 3000);
    return () => clearInterval(interval);
  }, [orderData]);

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
              Rastrear Pedido
            </h1>
            <p className="text-muted-foreground">
              Digite seu código de rastreamento para acompanhar seu pedido em tempo real
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de rastreamento (ex: MP123456)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="hidden sm:inline">Buscando...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5" />
                    <span className="hidden sm:inline">Rastrear</span>
                  </>
                )}
              </button>
            </div>
          </form>


          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 border border-destructive/50 bg-destructive/10 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Order Tracking Info */}
          {orderData && (
            <div className="space-y-8">
              {/* Order Details */}
              <div className="border border-border rounded-lg p-6 space-y-4">
                <h2 className="font-serif text-2xl font-semibold mb-6">
                  Informações do Pedido
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Código de Rastreamento</p>
                    <p className="font-semibold">{orderData.trackingCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ID do Pedido</p>
                    <p className="font-semibold">{orderData.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nome do Cliente</p>
                    <p className="font-semibold">{orderData.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Produto</p>
                    <p className="font-semibold">{orderData.productName}</p>
                  </div>
                </div>
              </div>

              {/* Produtos do Pedido */}
              <div className="border border-border rounded-lg p-6">
                <h2 className="font-serif text-2xl font-semibold mb-6">Produtos do Pedido</h2>
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <Link key={index} href={`/product/${item.productId}`}>
                      <div className="flex gap-4 items-center p-4 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="font-serif text-lg font-medium hover:underline">{item.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">Quantidade: {item.quantity}</p>
                          <p className="font-semibold text-lg mt-1">
                            R$ {(Number(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <ChevronRight className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div className="border border-border rounded-lg p-6 bg-secondary/50">
                <div className="flex items-start gap-4">
                  {orderData.currentStatus === "delivered" ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <Package className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Status Atual: {getStatusLabel(orderData.currentStatus)}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Entrega estimada: {orderData.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-serif text-xl font-semibold mb-6">Histórico de Rastreamento</h3>
                <div className="space-y-6">
                  {orderData.statuses.map((status, index) => (
                    <div key={index} className="relative">
                      <div className="flex gap-4">
                        {/* Timeline Dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              orderData.statuses
                                .slice(0, index + 1)
                                .some((s) => s.status === status.status)
                                ? "border-green-600 bg-green-600"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                          {index < orderData.statuses.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-300 my-2" />
                          )}
                        </div>

                        {/* Status Content */}
                        <div className="pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                status.status
                              )}`}
                            >
                              {getStatusLabel(status.status)}
                            </span>
                          </div>
                          <p className="font-medium text-foreground">{status.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">{status.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help Section */}
              <div className="border border-border rounded-lg p-6 bg-secondary/50">
                <h3 className="font-serif text-lg font-semibold mb-3">Precisa de ajuda?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Se tiver dúvidas sobre seu pedido, entre em contato conosco através do email
                  ou telefone:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    📧 <a href="mailto:suporte@saintmartino.com" className="text-primary hover:underline">
                      suporte@saintmartino.com
                    </a>
                  </p>
                  <p>
                    📞 <a href="tel:+5511999999999" className="text-primary hover:underline">
                      +55 (11) 9 9999-9999
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!orderData && !error && !isLoading && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-8">
                Digite seu código de rastreamento acima para ver o status do seu pedido
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Códigos de exemplo: MP123456, MP789012
              </p>
              <Link href="/">
                <button className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                  Voltar para Home
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

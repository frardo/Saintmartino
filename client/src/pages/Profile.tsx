import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Package, DollarSign } from "lucide-react";

interface UserAddress {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Favorite {
  id: number;
  name: string;
  price: string;
  imageUrls: string[];
}

export function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary rounded-full animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-serif text-4xl font-semibold mb-8">Minha Conta</h1>

        {/* Profile Info */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user?.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="font-serif text-2xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Membro desde {new Date(user?.createdAt || "").toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Addresses Section */}
          <AddressesSection userId={user?.id} />

          {/* Favorites Section */}
          <FavoritesSection userId={user?.id} />
        </div>

        {/* Orders Section */}
        <OrdersSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AddressesSection({ userId }: { userId?: number }) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [formData, setFormData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/user/addresses"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/addresses");
      return response.json() as Promise<UserAddress[]>;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (addressesData) {
      setAddresses(addressesData);
      if (addressesData.length > 0) {
        const defaultAddr = addressesData.find(a => a.isDefault);
        if (defaultAddr) {
          setFormData({
            street: defaultAddr.street,
            number: defaultAddr.number,
            complement: defaultAddr.complement || "",
            neighborhood: defaultAddr.neighborhood,
            city: defaultAddr.city,
            state: defaultAddr.state,
            zipCode: defaultAddr.zipCode,
          });
        }
      }
    }
  }, [addressesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/user/addresses", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const newAddress = await response.json();
        setAddresses([newAddress]);
      }
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-4">Meu Endereço</h2>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Rua"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
            />
            <Input
              placeholder="Número"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
            />
          </div>
          <Input
            placeholder="Complemento"
            value={formData.complement}
            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Bairro"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              required
            />
            <Input
              placeholder="CEP"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              placeholder="Cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Input
              placeholder="Estado"
              maxLength={2}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando..." : "Salvar Endereço"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function FavoritesSection({ userId }: { userId?: number }) {
  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ["/api/user/favorites"],
    queryFn: async () => {
      const response = await apiRequest("/api/user/favorites");
      return response.json() as Promise<{ favorites: number[] }>;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-semibold mb-4">Meus Favoritos</h2>
        <Card className="p-6">
          <div className="animate-pulse">Carregando...</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold mb-4">Meus Favoritos</h2>
      <Card className="p-6">
        {favoritesData?.favorites && favoritesData.favorites.length > 0 ? (
          <div>
            <p className="text-muted-foreground">
              Você tem {favoritesData.favorites.length} favorito(s)
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">Você ainda não tem favoritos. Explore nossos produtos!</p>
        )}
      </Card>
    </div>
  );
}

function OrdersSection() {
  const { orders, isLoading } = useOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "refunded":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "✓ Aprovado";
      case "pending":
        return "⏳ Pendente";
      case "rejected":
        return "✗ Recusado";
      case "refunded":
        return "↩ Reembolsado";
      default:
        return status;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="font-serif text-2xl font-semibold mb-4">Meus Pedidos</h2>
      {isLoading ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Você ainda não realizou nenhum pedido.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    Número do Pedido
                  </p>
                  <p className="font-semibold text-lg"># {order.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    Data
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    Total
                  </p>
                  <p className="flex items-center gap-2 font-semibold text-lg">
                    <DollarSign className="h-4 w-4" />
                    R$ {parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    Status
                  </p>
                  <p className={`px-3 py-1 rounded font-semibold text-sm inline-block ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </p>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
                  <Package className="h-3 w-3 inline mr-2" />
                  Itens ({order.items?.length || 0})
                </p>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endereço de Entrega */}
              {order.shippingAddress && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                    Endereço de Entrega
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress.street}, {order.shippingAddress.number}
                    {order.shippingAddress.complement && ` - ${order.shippingAddress.complement}`}
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress.neighborhood}, {order.shippingAddress.city} - {order.shippingAddress.state}
                  </p>
                  <p className="text-sm">CEP: {order.shippingAddress.zipCode}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

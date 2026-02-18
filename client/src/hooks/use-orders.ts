import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface OrderItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
}

export interface UserOrder {
  id: number;
  status: string;
  total: string;
  paymentId: string | null;
  paymentMethod: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerCpf: string | null;
  shippingAddress: Record<string, any> | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export function useOrders() {
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["/api/user/orders"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user/orders");
        if (!response.ok) {
          throw new Error("Falha ao buscar pedidos");
        }
        const data = await response.json() as { orders: UserOrder[] };
        return data.orders;
      } catch (err) {
        console.error("❌ Erro ao buscar pedidos:", err);
        throw err;
      }
    },
    retry: 1,
  });

  return {
    orders: ordersData || [],
    isLoading,
    error,
  };
}

import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProducts(filters?: { type?: string; metal?: string; stone?: string; sort?: 'price_asc' | 'price_desc' | 'newest' }) {
  const queryString = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
  
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      // Note: We append queryString manually because the shared route definition expects params in the URL for validation in some setups,
      // but standard fetch needs query string.
      const url = `${api.products.list.path}${queryString}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
  });
}

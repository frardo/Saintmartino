import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shared/schema';

export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  toggleSelection: (productId: number) => void;
  selectAll: () => void;
  clearCart: () => void;
  getTotal: () => number;
  getSelectedTotal: () => number;
  getSelectedItems: () => CartItem[];
}

export const useCart = create<CartStore>(
  persist(
    (set, get) => ({
      items: [],

  addItem: (product, quantity) => {
    set((state) => {
      const existingItem = state.items.find(item => item.product.id === product.id);

      if (existingItem) {
        return {
          items: state.items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { product, quantity, selected: true }],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }));
  },

  toggleSelection: (productId) => {
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId
          ? { ...item, selected: !item.selected }
          : item
      ),
    }));
  },

  selectAll: () => {
    set((state) => ({
      items: state.items.map(item => ({ ...item, selected: true })),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotal: () => {
    return get().items.reduce((total, item) => {
      return total + (Number(item.product.price) * item.quantity);
    }, 0);
  },

  getSelectedTotal: () => {
    return get().items
      .filter(item => item.selected)
      .reduce((total, item) => {
        return total + (Number(item.product.price) * item.quantity);
      }, 0);
  },

      getSelectedItems: () => {
        return get().items.filter(item => item.selected);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

import { z } from 'zod';
import {
  insertProductSchema,
  products,
  insertSiteSettingSchema,
  insertPromotionSchema,
  insertCouponSchema,
  insertBannerSchema,
  type Product,
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        type: z.string().optional(),
        metal: z.string().optional(),
        stone: z.string().optional(),
        sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<Product>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<Product>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<Product>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<Product>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
  siteSettings: {
    list: {
      method: 'GET' as const,
      path: '/api/site-settings' as const,
      responses: {
        200: z.array(z.object({ id: z.number(), key: z.string(), value: z.string() })),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/site-settings/:key' as const,
      input: z.object({ value: z.string() }),
      responses: {
        200: z.object({ id: z.number(), key: z.string(), value: z.string() }),
      },
    },
  },
  promotions: {
    list: {
      method: 'GET' as const,
      path: '/api/promotions' as const,
      responses: {
        200: z.array(z.object({ id: z.number(), code: z.string(), description: z.string().nullable(), discountPercent: z.number(), isActive: z.boolean(), createdAt: z.string() })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/promotions' as const,
      input: insertPromotionSchema,
      responses: {
        201: z.object({ id: z.number(), code: z.string(), description: z.string().nullable(), discountPercent: z.number(), isActive: z.boolean(), createdAt: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/promotions/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  coupons: {
    list: {
      method: 'GET' as const,
      path: '/api/coupons' as const,
      responses: {
        200: z.array(z.object({ id: z.number(), code: z.string(), discountPercent: z.number(), maxUses: z.number().nullable(), usedCount: z.number(), isActive: z.boolean(), createdAt: z.string() })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/coupons' as const,
      input: insertCouponSchema,
      responses: {
        201: z.object({ id: z.number(), code: z.string(), discountPercent: z.number(), maxUses: z.number().nullable(), usedCount: z.number(), isActive: z.boolean(), createdAt: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/coupons/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  banners: {
    list: {
      method: 'GET' as const,
      path: '/api/banners' as const,
      responses: {
        200: z.array(z.object({ id: z.number(), title: z.string(), subtitle: z.string().nullable(), imageUrl: z.string(), ctaText: z.string().nullable(), ctaLink: z.string().nullable(), order: z.number(), isActive: z.boolean(), createdAt: z.string() })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/banners' as const,
      input: insertBannerSchema,
      responses: {
        201: z.object({ id: z.number(), title: z.string(), subtitle: z.string().nullable(), imageUrl: z.string(), ctaText: z.string().nullable(), ctaLink: z.string().nullable(), order: z.number(), isActive: z.boolean(), createdAt: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/banners/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ProductsListResponse = z.infer<typeof api.products.list.responses[200]>;

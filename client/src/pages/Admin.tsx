import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { useProducts } from "@/hooks/use-products";
import {
  useSiteSettings,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateSiteSetting,
  usePromotions,
  useCreatePromotion,
  useDeletePromotion,
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useBanners,
  useCreateBanner,
  useDeleteBanner,
} from "@/hooks/use-admin";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [settingsEdit, setSettingsEdit] = useState<Record<string, string>>({});

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateSiteSetting = useUpdateSiteSetting();
  const createPromotion = useCreatePromotion();
  const deletePromotion = useDeletePromotion();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();

  const openCreateDialog = () => {
    setEditingProduct(undefined);
    setFormOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleProductSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data,
        });
        toast({
          title: "Produto atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await createProduct.mutateAsync(data);
        toast({
          title: "Produto criado",
          description: "O novo produto foi adicionado à sua loja.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar o produto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (deleteConfirm === null) return;
    try {
      await deleteProduct.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
      toast({
        title: "Produto deletado",
        description: "O produto foi removido da sua loja.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao deletar o produto",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      for (const [key, value] of Object.entries(settingsEdit)) {
        if (value.trim()) {
          await updateSiteSetting.mutateAsync({ key, value });
        }
      }
      setSettingsEdit({});
      toast({
        title: "Settings saved",
        description: "Site settings have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const initSettingsEdit = () => {
    if (settings) {
      const edited: Record<string, string> = {};
      settings.forEach((s) => {
        edited[s.key] = s.value;
      });
      setSettingsEdit(edited);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold mb-2">Painel Administrativo</h1>
            <Link href="/" className="text-sm text-primary hover:underline">
              ← Voltar para Loja
            </Link>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="promotions">Promoções</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Produtos</h2>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </div>

            {productsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum produto cadastrado. Crie seu primeiro produto!
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Novo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.imageUrls?.[0] || ""}
                            alt={product.name}
                            className="h-10 w-10 object-cover rounded bg-secondary"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>R$ {Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>
                          {product.discountPercent > 0 ? (
                            <Badge variant="secondary">
                              {product.discountPercent}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell>{product.metal}</TableCell>
                        <TableCell>
                          {product.isNew ? (
                            <Badge>Novo</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Promotions</h2>
              <Button onClick={() => {
                // Simple inline creation for now
                const code = prompt("Promotion code:");
                if (code) {
                  const description = prompt("Description (optional):");
                  const discountPercent = Number(prompt("Discount %:") || "0");
                  if (discountPercent > 0) {
                    createPromotion.mutate({
                      code,
                      description: description || undefined,
                      discountPercent,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    });
                  }
                }
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Promotion
              </Button>
            </div>
            <PromotionsTab usePromotionsHook={usePromotions} useDeletePromotionHook={useDeletePromotion} />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Coupons</h2>
              <Button onClick={() => {
                const code = prompt("Coupon code:");
                if (code) {
                  const discountPercent = Number(prompt("Discount %:") || "0");
                  const maxUses = Number(prompt("Max uses (leave empty for unlimited):") || "");
                  if (discountPercent > 0) {
                    createCoupon.mutate({
                      code,
                      discountPercent,
                      maxUses: maxUses > 0 ? maxUses : undefined,
                      usedCount: 0,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    });
                  }
                }
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Coupon
              </Button>
            </div>
            <CouponsTab useCouponsHook={useCoupons} useDeleteCouponHook={useDeleteCoupon} />
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Banners</h2>
              <Button onClick={() => {
                const title = prompt("Banner title:");
                if (title) {
                  const subtitle = prompt("Subtitle (optional):");
                  const imageUrl = prompt("Image URL:");
                  const ctaText = prompt("CTA text (optional):");
                  const ctaLink = prompt("CTA link (optional):");
                  if (imageUrl) {
                    createBanner.mutate({
                      title,
                      subtitle: subtitle || undefined,
                      imageUrl,
                      ctaText: ctaText || undefined,
                      ctaLink: ctaLink || undefined,
                      order: 0,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    });
                  }
                }
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Banner
              </Button>
            </div>
            <BannersTab useBannersHook={useBanners} useDeleteBannerHook={useDeleteBanner} />
          </TabsContent>

          {/* Site Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="font-serif text-2xl font-semibold">Site Settings</h2>

            {settingsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading settings...
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hero Title
                      </label>
                      <Input
                        value={
                          settingsEdit["hero_title"] ||
                          settings?.find((s) => s.key === "hero_title")?.value ||
                          ""
                        }
                        onChange={(e) =>
                          setSettingsEdit({
                            ...settingsEdit,
                            hero_title: e.target.value,
                          })
                        }
                        placeholder="Modern Heirlooms"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hero Subtitle
                      </label>
                      <Textarea
                        value={
                          settingsEdit["hero_subtitle"] ||
                          settings?.find((s) => s.key === "hero_subtitle")?.value ||
                          ""
                        }
                        onChange={(e) =>
                          setSettingsEdit({
                            ...settingsEdit,
                            hero_subtitle: e.target.value,
                          })
                        }
                        placeholder="Timeless jewelry..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hero Image URL
                      </label>
                      <Input
                        value={
                          settingsEdit["hero_image"] ||
                          settings?.find((s) => s.key === "hero_image")?.value ||
                          ""
                        }
                        onChange={(e) =>
                          setSettingsEdit({
                            ...settingsEdit,
                            hero_image: e.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                      {(settingsEdit["hero_image"] ||
                        settings?.find((s) => s.key === "hero_image")?.value) && (
                        <div className="mt-4">
                          <img
                            src={
                              settingsEdit["hero_image"] ||
                              settings?.find((s) => s.key === "hero_image")?.value ||
                              ""
                            }
                            alt="Hero preview"
                            className="max-h-48 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        if (Object.keys(settingsEdit).length === 0) {
                          initSettingsEdit();
                        } else {
                          handleSaveSettings();
                        }
                      }}
                      disabled={updateSiteSetting.isPending}
                    >
                      {updateSiteSetting.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSubmit={handleProductSubmit}
        isLoading={
          createProduct.isPending || updateProduct.isPending
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Promotions Tab Component
function PromotionsTab({ usePromotionsHook, useDeletePromotionHook }: any) {
  const { data: promotions, isLoading } = usePromotionsHook();
  const deletePromotion = useDeletePromotionHook();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (toDelete === null) return;
    try {
      await deletePromotion.mutateAsync(toDelete);
      setToDelete(null);
      toast({ title: "Promotion deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions?.map((promo: any) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.code}</TableCell>
                <TableCell>{promo.description || "-"}</TableCell>
                <TableCell>{promo.discountPercent}%</TableCell>
                <TableCell>{promo.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(promo.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={toDelete !== null} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Coupons Tab Component
function CouponsTab({ useCouponsHook, useDeleteCouponHook }: any) {
  const { data: coupons, isLoading } = useCouponsHook();
  const deleteCoupon = useDeleteCouponHook();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (toDelete === null) return;
    try {
      await deleteCoupon.mutateAsync(toDelete);
      setToDelete(null);
      toast({ title: "Coupon deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Used / Max</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons?.map((coupon: any) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell>{coupon.discountPercent}%</TableCell>
                <TableCell>{coupon.usedCount} / {coupon.maxUses || "∞"}</TableCell>
                <TableCell>{coupon.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={toDelete !== null} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Banners Tab Component
function BannersTab({ useBannersHook, useDeleteBannerHook }: any) {
  const { data: banners, isLoading } = useBannersHook();
  const deleteBanner = useDeleteBannerHook();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (toDelete === null) return;
    try {
      await deleteBanner.mutateAsync(toDelete);
      setToDelete(null);
      toast({ title: "Banner deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <>
      <div className="space-y-4">
        {banners?.map((banner: any) => (
          <Card key={banner.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{banner.title}</CardTitle>
                  {banner.subtitle && <p className="text-sm text-muted-foreground mt-1">{banner.subtitle}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(banner.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {banner.imageUrl && (
                <img src={banner.imageUrl} alt={banner.title} className="max-h-32 rounded object-cover" />
              )}
              <div className="text-sm space-y-1">
                <p><span className="font-medium">CTA:</span> {banner.ctaText || "-"}</p>
                <p><span className="font-medium">Link:</span> {banner.ctaLink || "-"}</p>
                <p><span className="font-medium">Order:</span> {banner.order}</p>
                <p><span className="font-medium">Status:</span> {banner.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AlertDialog open={toDelete !== null} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { BannerFormDialog } from "@/components/admin/BannerFormDialog";
import { ImagePositioner } from "@/components/ImagePositioner";
import { useProducts } from "@/hooks/use-products";
import { useUploadFile } from "@/hooks/use-upload-file";
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
  const { uploadFile, isUploading } = useUploadFile();
  const heroImageInputRef = useRef<HTMLInputElement>(null);

  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingBanner, setEditingBanner] = useState<any | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [settingsEdit, setSettingsEdit] = useState<Record<string, string>>({});
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [positioningImage, setPositioningImage] = useState<{ url: string; index: number } | null>(null);
  const [imagePositions, setImagePositions] = useState<Record<number, { x: number; y: number; scale: number }>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

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

  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (products && products.length > 0) {
      const allIds = new Set(products.map(p => p.id));
      if (selectedProducts.size === products.length) {
        setSelectedProducts(new Set());
      } else {
        setSelectedProducts(allIds);
      }
    }
  };

  const handleBulkDelete = async () => {
    for (const productId of selectedProducts) {
      await deleteProduct.mutateAsync(productId);
    }
    setSelectedProducts(new Set());
    setBulkDeleteConfirm(false);
    toast({
      title: "Produtos deletados",
      description: `${selectedProducts.size} produtos foram removidos com sucesso.`,
    });
  };

  const openCreateBannerDialog = () => {
    setEditingBanner(undefined);
    setBannerFormOpen(true);
  };

  const openEditBannerDialog = (banner: any) => {
    setEditingBanner(banner);
    setBannerFormOpen(true);
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAuthenticated(data.isAdmin || false);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword("");
        toast({ title: "Bem-vindo!", description: "Você entrou no painel admin." });
      } else {
        const error = await response.json();
        setLoginError(error.message || "Senha incorreta");
      }
    } catch (error) {
      setLoginError("Erro ao fazer login");
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setPassword("");
      toast({ title: "Desconectado", description: "Você saiu do painel admin." });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Load settings into edit form when settings are loaded
  useEffect(() => {
    if (settings && Object.keys(settingsEdit).length === 0) {
      initSettingsEdit();
    }
  }, [settings]);

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

  const handleBannerSubmit = async (data: any) => {
    try {
      await createBanner.mutateAsync(data);
      toast({
        title: "Banner criado",
        description: "O novo banner foi adicionado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar o banner",
        variant: "destructive",
      });
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || heroImages.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 3 imagens para o hero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadedUrl = await uploadFile(file);
      if (uploadedUrl) {
        // Open image positioner
        setPositioningImage({ url: uploadedUrl, index: heroImages.length });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem.",
        variant: "destructive",
      });
    }
  };

  const handlePositionSave = async () => {
    if (!positioningImage) return;

    try {
      // Avoid duplicates - check if image already exists
      if (!heroImages.includes(positioningImage.url)) {
        const newImages = [...heroImages, positioningImage.url];
        setHeroImages(newImages);

        // Save with correct index (count from 1)
        const imageIndex = newImages.length;
        const key = `hero_image_${imageIndex}`;

        console.log(`Saving hero image ${imageIndex}:`, positioningImage.url);
        await updateSiteSetting.mutateAsync({ key, value: positioningImage.url });

        // Save position if adjusted
        if (imagePositions[positioningImage.index]) {
          const posKey = `hero_image_${imageIndex}_position`;
          const pos = imagePositions[positioningImage.index];
          console.log(`Saving position for image ${imageIndex}:`, pos);
          await updateSiteSetting.mutateAsync({
            key: posKey,
            value: JSON.stringify(pos)
          });
        }

        toast({
          title: "Imagem adicionada",
          description: `Imagem ${imageIndex} de 3 foi salva com sucesso.`,
        });
      }
      setPositioningImage(null);
    } catch (error: any) {
      console.error("Error saving image:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar a imagem: " + error.message,
        variant: "destructive",
      });
    }
  };

  const removeHeroImage = async (index: number) => {
    try {
      const newImages = heroImages.filter((_, i) => i !== index);
      setHeroImages(newImages);

      // Clear all hero image entries
      for (let i = 1; i <= 10; i++) {
        await updateSiteSetting.mutateAsync({ key: `hero_image_${i}`, value: "" });
        await updateSiteSetting.mutateAsync({ key: `hero_image_${i}_position`, value: "" });
      }

      // Re-save the remaining images with correct numbering
      for (let i = 0; i < newImages.length; i++) {
        const key = `hero_image_${i + 1}`;
        await updateSiteSetting.mutateAsync({ key, value: newImages[i] });
      }

      toast({
        title: "Imagem removida",
        description: "Imagens reorganizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao remover a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save only text settings (skip hero_image_* keys - they are saved immediately)
      for (const [key, value] of Object.entries(settingsEdit)) {
        if (!key.startsWith("hero_image_") && value.trim()) {
          await updateSiteSetting.mutateAsync({ key, value });
        }
      }

      setSettingsEdit({});
      toast({
        title: "Configurações salvas",
        description: "As configurações do site foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar as configurações",
        variant: "destructive",
      });
    }
  };

  const initSettingsEdit = () => {
    if (settings) {
      const edited: Record<string, string> = {};
      const images: string[] = [];
      settings.forEach((s) => {
        edited[s.key] = s.value;
        if (s.key.startsWith("hero_image_") && s.value && !s.key.includes("_position")) {
          images.push(s.value);
        }
      });
      setSettingsEdit(edited);
      setHeroImages(images);
    }
  };

  const cleanupHeroImages = async () => {
    if (!settings) return;

    try {
      // Collect all non-empty hero images in order
      const validImages: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const setting = settings.find(s => s.key === `hero_image_${i}`);
        if (setting?.value) {
          validImages.push(setting.value);
        }
      }

      // Clear all hero_image_* entries
      for (let i = 1; i <= 10; i++) {
        await updateSiteSetting.mutateAsync({ key: `hero_image_${i}`, value: "" });
        await updateSiteSetting.mutateAsync({ key: `hero_image_${i}_position`, value: "" });
      }

      // Re-save them with correct sequential numbering
      for (let i = 0; i < validImages.length; i++) {
        await updateSiteSetting.mutateAsync({ key: `hero_image_${i + 1}`, value: validImages[i] });
      }

      // Reload
      setHeroImages(validImages);
      toast({
        title: "Limpeza concluída",
        description: `${validImages.length} imagens recompactadas com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao limpar as imagens.",
        variant: "destructive",
      });
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Painel Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Senha de Acesso</label>
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  className="mt-1"
                />
              </div>
              {loginError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              <Link href="/" className="text-primary hover:underline">
                ← Voltar para Loja
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            Sair
          </Button>
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
                {selectedProducts.size > 0 && (
                  <div className="bg-blue-50 border-b p-4 flex items-center justify-between">
                    <span className="font-medium">{selectedProducts.size} produto(s) selecionado(s)</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteConfirm(true)}
                    >
                      Deletar Selecionados
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={products && products.length > 0 && selectedProducts.size === products.length}
                          onChange={selectAllProducts}
                          className="cursor-pointer"
                        />
                      </TableHead>
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
                      <TableRow key={product.id} className={selectedProducts.has(product.id) ? "bg-blue-50" : ""}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>
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
                        <TableCell>{product.material}</TableCell>
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
              <Button onClick={openCreateBannerDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Banner
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
                        placeholder="Relógios de Luxo"
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
                        placeholder="Relógios de precisão suíça para o homem que valoriza qualidade. Materiais nobres, design atemporal e garantia vitalícia."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Imagens do Hero (até 3 para carrossel)
                      </label>
                      <div className="space-y-3">
                        {/* Hero Images Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {heroImages.map((image, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-video overflow-hidden rounded-lg border-2 bg-muted"
                            >
                              <img
                                src={image}
                                alt={`Hero ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeHeroImage(idx)}
                                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          {/* Add More Images Button */}
                          {heroImages.length < 3 && (
                            <button
                              type="button"
                              onClick={() => heroImageInputRef.current?.click()}
                              disabled={isUploading}
                              className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <span className="text-muted-foreground text-sm">+ Adicionar</span>
                            </button>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          ref={heroImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />

                        {/* Info Text */}
                        <p className="text-xs text-muted-foreground">
                          {heroImages.length} de 3 imagens • As imagens vão girar automaticamente no hero
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                      <Button
                        onClick={cleanupHeroImages}
                        disabled={updateSiteSetting.isPending}
                        variant="outline"
                      >
                        Limpar Duplicatas
                      </Button>
                    </div>
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

      {/* Banner Form Dialog */}
      <BannerFormDialog
        open={bannerFormOpen}
        onOpenChange={setBannerFormOpen}
        banner={editingBanner}
        onSubmit={handleBannerSubmit}
        isLoading={createBanner.isPending}
      />

      {/* Image Positioner Dialog */}
      <Dialog open={!!positioningImage} onOpenChange={(open) => !open && setPositioningImage(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar Posição da Imagem do Hero</DialogTitle>
          </DialogHeader>
          {positioningImage && (
            <div className="space-y-4">
              <ImagePositioner
                imageUrl={positioningImage.url}
                onPositionChange={(pos) => {
                  setImagePositions({
                    ...imagePositions,
                    [positioningImage.index]: pos
                  });
                }}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPositioningImage(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePositionSave}>
                  Confirmar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar {selectedProducts.size} Produtos</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {selectedProducts.size} produto(s) selecionado(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Todos
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

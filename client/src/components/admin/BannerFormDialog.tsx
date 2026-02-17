import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useUploadFile } from "@/hooks/use-upload-file";
import { X } from "lucide-react";
import type { Banner } from "@shared/schema";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().min(1, "Image is required"),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  order: z.number().default(0),
});

type FormSchema = z.infer<typeof formSchema>;

export function BannerFormDialog({
  open,
  onOpenChange,
  banner,
  onSubmit,
  isLoading = false,
}: BannerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    banner?.imageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUploadFile();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: banner ? {
      title: banner.title,
      subtitle: banner.subtitle ?? undefined,
      imageUrl: banner.imageUrl,
      ctaText: banner.ctaText ?? undefined,
      ctaLink: banner.ctaLink ?? undefined,
      order: banner.order ?? 0,
    } : {
      order: 0,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (formData: FormSchema) => {
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadFile(imageFile);
        if (!uploadedUrl) {
          throw new Error(`Failed to upload image: ${imageFile.name}`);
        }
        finalImageUrl = uploadedUrl;
      }

      const submitData = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        imageUrl: finalImageUrl,
        ctaText: formData.ctaText || undefined,
        ctaLink: formData.ctaLink || undefined,
        order: formData.order ?? 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await onSubmit(submitData);
      form.reset();
      setImagePreview(null);
      setImageFile(null);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Coleção Premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Descricao..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormItem>
              <FormLabel>Imagem do Banner</FormLabel>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative w-full h-48 overflow-hidden rounded-lg border-2 bg-muted">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 z-10"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {!imagePreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <span className="text-muted-foreground text-sm">Clique para fazer upload</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <p className="text-xs text-muted-foreground">
                  {imagePreview ? "Clique X para remover" : "PNG, JPG, GIF ou WebP"}
                </p>
              </div>
              <FormMessage />
            </FormItem>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ctaText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto CTA (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Explorar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link CTA (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: /collections" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading || isUploading}>
                {isSubmitting || isLoading ? "Salvando..." : isUploading ? "Enviando..." : "Salvar Banner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

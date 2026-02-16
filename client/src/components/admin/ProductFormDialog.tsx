import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { insertProductSchema } from "@shared/schema";
import type { Product, InsertProduct } from "@shared/schema";
import { z } from "zod";
import { useUploadFile } from "@/hooks/use-upload-file";
import { X, Plus } from "lucide-react";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSubmit: (data: InsertProduct) => Promise<void>;
  isLoading?: boolean;
}

// Form schema without imageUrls (handled by file uploads)
const formSchema = insertProductSchema.omit({
  imageUrls: true,
});
type FormSchema = z.infer<typeof formSchema>;

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading = false,
}: ProductFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product?.imageUrls || []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUploadFile();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description ?? undefined,
      price: product.price,
      type: product.type,
      metal: product.metal,
      stone: product.stone ?? undefined,
      isNew: product.isNew,
      discountPercent: product.discountPercent,
      discountLabel: product.discountLabel ?? undefined,
    } : {
      isNew: false,
      discountPercent: 0,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = imagePreviews.length + imageFiles.length + files.length;

    if (totalImages > 6) {
      alert("Maximum 6 images allowed. Please remove some images first.");
      return;
    }

    const newFiles = files.slice(0, 6 - imagePreviews.length - imageFiles.length);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    if (index >= imagePreviews.length) return;

    // If it's a new file, also remove from files array
    const newFilesStartIndex = imagePreviews.length - imageFiles.length;
    if (index >= newFilesStartIndex) {
      const fileIndex = index - newFilesStartIndex;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    // Remove from previews
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder images in previews
    const newPreviews = [...imagePreviews];
    const [draggedItem] = newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(targetIndex, 0, draggedItem);
    setImagePreviews(newPreviews);

    // If there are new files, also reorder them
    if (imageFiles.length > 0) {
      const newFiles = [...imageFiles];
      const draggedFileIndex = draggedIndex - (imagePreviews.length - imageFiles.length);
      const targetFileIndex = targetIndex - (imagePreviews.length - imageFiles.length);

      if (draggedFileIndex >= 0 && targetFileIndex >= 0) {
        const [draggedFile] = newFiles.splice(draggedFileIndex, 1);
        newFiles.splice(targetFileIndex, 0, draggedFile);
        setImageFiles(newFiles);
      }
    }

    setDraggedIndex(null);
  };

  const handleSubmit = async (formData: FormSchema) => {
    if (!formData) return;

    // Keep existing images and upload new ones
    let allImageUrls = [...imagePreviews];

    setIsSubmitting(true);
    try {
      // Upload new files
      for (const file of imageFiles) {
        const uploadedUrl = await uploadFile(file);
        if (!uploadedUrl) {
          throw new Error(`Failed to upload image: ${file.name}`);
        }
        // Only add uploaded URLs, skip preview URLs that are already there
        if (!allImageUrls.includes(uploadedUrl)) {
          allImageUrls.push(uploadedUrl);
        }
      }

      // Filter out data URLs (previews of new files) and keep only actual URLs
      allImageUrls = allImageUrls.filter((url) => !url.startsWith("data:"));

      // Build submit data with only non-empty fields
      const submitData: InsertProduct = {
        name: formData.name || undefined,
        description: formData.description || undefined,
        price: formData.price || undefined,
        type: formData.type || undefined,
        metal: formData.metal || undefined,
        stone: formData.stone || undefined,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
        isNew: formData.isNew ?? false,
        discountPercent: formData.discountPercent ?? 0,
        discountLabel: formData.discountLabel || undefined,
      };

      await onSubmit(submitData);
      form.reset();
      setImagePreviews([]);
      setImageFiles([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Relógio Suíço de Ouro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do produto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Relógio de Pulso">Relógio de Pulso</SelectItem>
                        <SelectItem value="Relógio de Bolso">Relógio de Bolso</SelectItem>
                        <SelectItem value="Pulseira">Pulseira</SelectItem>
                        <SelectItem value="Acessório">Acessório</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ouro">Ouro</SelectItem>
                        <SelectItem value="Prata">Prata</SelectItem>
                        <SelectItem value="Ouro Rose">Ouro Rose</SelectItem>
                        <SelectItem value="Aço Inoxidável">Aço Inoxidável</SelectItem>
                        <SelectItem value="Titânio">Titânio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedra</FormLabel>
                    <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? null : value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a pedra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="Diamante">Diamante</SelectItem>
                        <SelectItem value="Safira">Safira</SelectItem>
                        <SelectItem value="Topázio">Topázio</SelectItem>
                        <SelectItem value="Pérola">Pérola</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Images Gallery (up to 6) */}
            <FormItem>
              <FormLabel>Imagens do Produto (até 6)</FormLabel>
              <div className="space-y-3">
                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-muted cursor-move transition-all ${
                        draggedIndex === index
                          ? "opacity-50 border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={preview}
                        alt={`Produto ${index + 1}`}
                        className="h-full w-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add More Images Button (if less than 6) */}
                  {imagePreviews.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus size={32} className="text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Hidden File Input - Multiple */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* Info Text */}
                <p className="text-xs text-muted-foreground">
                  {imagePreviews.length} de 6 imagens
                  {imagePreviews.length > 0 && (
                    <span> • Clique X para remover • Clique + para adicionar</span>
                  )}
                </p>
              </div>
              <FormMessage />
            </FormItem>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiqueta de Desconto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PROMOÇÃO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">Marcar como Novo</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {isSubmitting || isLoading ? "Salvando..." : isUploading ? "Enviando..." : "Salvar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

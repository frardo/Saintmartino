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
    // If it's an existing image (from product), remove from previews
    if (index < imagePreviews.length - imageFiles.length) {
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // If it's a new file, also remove from files array
      const fileIndex = index - (imagePreviews.length - imageFiles.length);
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
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

      if (allImageUrls.length === 0) {
        throw new Error("At least one image is required");
      }

      const submitData: InsertProduct = {
        name: formData.name!,
        description: formData.description,
        price: formData.price!,
        type: formData.type!,
        metal: formData.metal!,
        stone: formData.stone,
        imageUrls: allImageUrls,
        isNew: formData.isNew ?? false,
        discountPercent: formData.discountPercent ?? 0,
        discountLabel: formData.discountLabel,
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
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Curve Ring" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description..." {...field} />
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
                    <FormLabel>Price *</FormLabel>
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
                    <FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ring">Ring</SelectItem>
                        <SelectItem value="Necklace">Necklace</SelectItem>
                        <SelectItem value="Earring">Earring</SelectItem>
                        <SelectItem value="Bracelet">Bracelet</SelectItem>
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
                    <FormLabel>Metal *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="14k Gold">14k Gold</SelectItem>
                        <SelectItem value="Sterling Silver">Sterling Silver</SelectItem>
                        <SelectItem value="Rose Gold">Rose Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
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
                    <FormLabel>Stone</FormLabel>
                    <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? null : value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Diamond">Diamond</SelectItem>
                        <SelectItem value="Sapphire">Sapphire</SelectItem>
                        <SelectItem value="Topaz">Topaz</SelectItem>
                        <SelectItem value="Pearl">Pearl</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Images Gallery (up to 6) */}
            <FormItem>
              <FormLabel>Product Images (up to 6) *</FormLabel>
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
                        alt={`Product ${index + 1}`}
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
                  {imagePreviews.length} of 6 images
                  {imagePreviews.length > 0 && (
                    <span> • Click X to remove • Click + to add more</span>
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
                    <FormLabel>Discount %</FormLabel>
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
                    <FormLabel>Discount Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SALE" {...field} />
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
                  <FormLabel className="cursor-pointer">Mark as New</FormLabel>
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading || isUploading}>
                {isSubmitting || isLoading ? "Saving..." : isUploading ? "Uploading..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSubmit: (data: InsertProduct) => Promise<void>;
  isLoading?: boolean;
}

// Form schema without image URLs (handled by file uploads)
const formSchema = insertProductSchema.omit({
  imageUrl: true,
  secondaryImageUrl: true,
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
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(
    product?.imageUrl || null
  );
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<
    string | null
  >(product?.secondaryImageUrl || null);
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
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

  const handlePrimaryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrimaryImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPrimaryImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSecondaryImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSecondaryImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (formData: FormSchema) => {
    if (!formData) return;
    setIsSubmitting(true);
    try {
      let primaryImageUrl = product?.imageUrl;
      let secondaryImageUrl = product?.secondaryImageUrl || null;

      // Upload primary image if changed
      if (primaryImageFile) {
        const uploadedUrl = await uploadFile(primaryImageFile);
        if (!uploadedUrl) {
          throw new Error("Failed to upload primary image");
        }
        primaryImageUrl = uploadedUrl;
      }

      // Upload secondary image if changed
      if (secondaryImageFile) {
        const uploadedUrl = await uploadFile(secondaryImageFile);
        if (!uploadedUrl) {
          throw new Error("Failed to upload secondary image");
        }
        secondaryImageUrl = uploadedUrl;
      }

      // Check that we have a primary image URL
      if (!primaryImageUrl) {
        throw new Error("Primary image is required");
      }

      const submitData: InsertProduct = {
        name: formData.name!,
        description: formData.description,
        price: formData.price!,
        type: formData.type!,
        metal: formData.metal!,
        stone: formData.stone,
        imageUrl: primaryImageUrl,
        secondaryImageUrl: secondaryImageUrl || undefined,
        isNew: formData.isNew ?? false,
        discountPercent: formData.discountPercent ?? 0,
        discountLabel: formData.discountLabel,
      };

      await onSubmit(submitData);
      form.reset();
      setPrimaryImagePreview(null);
      setSecondaryImagePreview(null);
      setPrimaryImageFile(null);
      setSecondaryImageFile(null);
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

            {/* Primary Image Upload */}
            <FormItem>
              <FormLabel>Primary Image *</FormLabel>
              <div className="space-y-3">
                {primaryImagePreview && (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={primaryImagePreview}
                      alt="Primary preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={primaryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => primaryInputRef.current?.click()}
                >
                  {primaryImageFile ? "Change Primary Image" : "Upload Primary Image"}
                </Button>
                {primaryImageFile && (
                  <p className="text-sm text-muted-foreground">
                    {primaryImageFile.name}
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>

            {/* Secondary Image Upload */}
            <FormItem>
              <FormLabel>Secondary Image (hover)</FormLabel>
              <div className="space-y-3">
                {secondaryImagePreview && (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={secondaryImagePreview}
                      alt="Secondary preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={secondaryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSecondaryImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => secondaryInputRef.current?.click()}
                >
                  {secondaryImageFile ? "Change Secondary Image" : "Upload Secondary Image"}
                </Button>
                {secondaryImageFile && (
                  <p className="text-sm text-muted-foreground">
                    {secondaryImageFile.name}
                  </p>
                )}
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

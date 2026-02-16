import { useState } from "react";

export function useUploadFile() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) {
      setError("No file provided");
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log("Uploading file:", file.name, "Type:", file.type, "Size:", file.size);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", res.status);

      if (!res.ok) {
        let errorMessage = "Failed to upload file";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Upload failed with status ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("Upload successful, URL:", data.url);
      return data.url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Upload error:", errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}

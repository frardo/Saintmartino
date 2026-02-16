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
      console.log("Upload response content-type:", res.headers.get("content-type"));

      // Read response as text first to see what we're getting
      const responseText = await res.text();
      console.log("Upload response text (first 200 chars):", responseText.substring(0, 200));

      if (!res.ok) {
        let errorMessage = "Failed to upload file";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Upload failed with status ${res.status}: ${responseText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        console.log("Upload successful, URL:", data.url);
        return data.url;
      } catch (e) {
        console.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
      }
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

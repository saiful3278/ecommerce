"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import useToast from "@/app/hooks/ui/useToast";
import { getSupabaseClient } from "@/app/lib/supabaseClient";
import { generateUniqueSlug } from "@/app/utils/slug";

interface ProductFileUploadProps {
  onUploadSuccess: () => void;
  acceptedFormats?: string[];
}

const ProductFileUpload = ({
  onUploadSuccess,
  acceptedFormats = [".csv"],
}: ProductFileUploadProps) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormatString = acceptedFormats.join(",");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const resetState = () => {
    setFileName("");
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const currentLine = lines[i].split(","); // Simple split, doesn't handle quoted commas
      const obj: any = {};

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j]?.trim();
      }
      result.push(obj);
    }
    return result;
  };

  const processFile = async (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv") {
        showToast("Only CSV files are supported at the moment.", "error");
        return;
    }

    setFileName(file.name);
    setIsLoading(true);

    try {
      const text = await file.text();
      const data = parseCSV(text);
      const supabase = getSupabaseClient();

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
            // Basic validation
            if (!row.name || !row.price || !row.categoryId) {
                console.warn("Skipping invalid row:", row);
                errorCount++;
                continue;
            }

            const slug = await generateUniqueSlug(supabase, "products", row.name);

            // Create Product
            const { data: product, error: productError } = await supabase
                .from("products")
                .insert({
                    name: row.name,
                    slug: slug,
                    description: row.description || "",
                    category_id: row.categoryId,
                    is_new: row.isNew === "true",
                    is_featured: row.isFeatured === "true",
                    is_trending: row.isTrending === "true",
                    is_best_seller: row.isBestSeller === "true",
                })
                .select()
                .single();

            if (productError || !product) throw productError;

            // Create Default Variant
            const { error: variantError } = await supabase
                .from("product_variants")
                .insert({
                    product_id: product.id,
                    sku: row.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    price: parseFloat(row.price) || 0,
                    stock: parseInt(row.stock) || 0,
                    low_stock_threshold: 10,
                    images: row.images ? row.images.split("|").map((url: string) => url.trim()) : [], // Expect pipe separated URLs
                });

            if (variantError) throw variantError;
            successCount++;

        } catch (err) {
            console.error("Error processing row:", row, err);
            errorCount++;
        }
      }

      setUploadStatus("success");
      showToast(`Imported ${successCount} products successfully. ${errorCount} failed.`, "success");
      onUploadSuccess();
      setTimeout(resetState, 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("error");
      showToast(
        "Failed to import products. Please check your file and try again.",
        "error"
      );
    } finally {
        setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-1/2 mx-auto">
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : uploadStatus === "success"
            ? "border-green-500 bg-green-50"
            : uploadStatus === "error"
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormatString}
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        {uploadStatus === "idle" ? (
          <>
            <div className="flex flex-col items-center space-y-2 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {fileName
                  ? fileName
                  : "Drop CSV file here or click to upload"}
              </p>
              <p className="text-xs text-gray-500">
                Supports CSV files
              </p>
            </div>
            <button
              onClick={handleButtonClick}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Select File</span>
                </>
              )}
            </button>
          </>
        ) : uploadStatus === "success" ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-green-700">
              Import successful!
            </p>
            <p className="text-xs text-gray-500">{fileName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <XCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-red-700">Import failed</p>
            <p className="text-xs text-gray-500">{fileName}</p>
            <button
              onClick={resetState}
              className="px-3 py-1 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center text-xs text-gray-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        <span>
          CSV columns: name, price, stock, categoryId, description, sku, images (pipe | separated)
        </span>
      </div>
    </div>
  );
};

export default ProductFileUpload;

"use client";
import Table from "@/app/components/layout/Table";
import { useEffect, useState, useCallback, useMemo } from "react";
import ProductModal from "./ProductModal";
import { Trash2, Edit, Upload, X } from "lucide-react";
import ConfirmModal from "@/app/components/organisms/ConfirmModal";
import useToast from "@/app/hooks/ui/useToast";
import ProductFileUpload from "./ProductFileUpload";
import { usePathname } from "next/navigation";
import { ProductFormData } from "./product.types";
import { withAuth } from "@/app/components/HOC/WithAuth";
import { getSupabaseClient } from "@/app/lib/supabaseClient";
import useQueryParams from "@/app/hooks/network/useQueryParams";
import { generateUniqueSlug } from "@/app/utils/slug";
import Image from "next/image";
import { generateProductPlaceholder } from "@/app/utils/placeholderImage";

const ProductsDashboard = () => {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const pathname = usePathname();
  const shouldFetchProducts = pathname === "/dashboard/products";
  const { query } = useQueryParams();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchQuery =
    typeof query.searchQuery === "string" ? query.searchQuery : "";
  const sortParam = typeof query.sort === "string" ? query.sort : "";
  const [sortKey, sortDirection] = useMemo(() => {
    if (!sortParam) return [null, "asc"];
    const [key, direction] = sortParam.split(":");
    return [key || null, direction === "desc" ? "desc" : "asc"];
  }, [sortParam]);

  const storageBucket =
    process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_BUCKET || "products-images";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);


  const splitImages = (images?: Array<File | string>) => {
    const files: File[] = [];
    const urls: string[] = [];
    (images || []).forEach((image) => {
      if (image instanceof File) {
        files.push(image);
      } else if (typeof image === "string") {
        urls.push(image);
      }
    });
    return { files, urls };
  };

  const uploadVariantImages = async (
    files: File[],
    productId: string,
    sku: string
  ) => {
    if (!files.length) return [];
    const supabase = getSupabaseClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const path = `products/${productId}/${sku}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(path, file, { upsert: false });
      if (uploadError) {
        throw uploadError;
      }
      const { data: publicUrlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(path);
      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const mapProduct = (product: any) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    isNew: product.is_new,
    isFeatured: product.is_featured,
    isTrending: product.is_trending,
    isBestSeller: product.is_best_seller,
    categoryId: product.category_id,
    salesCount: product.salesCount || 0,
    variants:
      product.product_variants?.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        price: Number(variant.price || 0),
        stock: variant.stock ?? 0,
        lowStockThreshold: variant.low_stock_threshold ?? 10,
        barcode: variant.barcode || "",
        warehouseLocation: variant.warehouse_location || "",
        images: variant.images || [],
        attributes:
          variant.product_variant_attributes?.map((attr: any) => ({
            attributeId: attr.attribute_id,
            valueId: attr.value_id,
          })) || [],
      })) || [],
  });

  const fetchProducts = useCallback(async () => {
    if (!shouldFetchProducts) return;
    setIsLoading(true);
    setFetchError(null);
    const supabase = getSupabaseClient();
    let queryBuilder = supabase
      .from("products")
      .select(
        "id,name,slug,description,is_new,is_featured,is_trending,is_best_seller,category_id,created_at,product_variants(id,sku,price,stock,low_stock_threshold,barcode,warehouse_location,images,product_variant_attributes(attribute_id,value_id))"
      );

    if (searchQuery) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    if (sortKey === "name") {
      queryBuilder = queryBuilder.order("name", {
        ascending: sortDirection === "asc",
      });
    }

    const { data, error } = await queryBuilder;
    if (error) {
      setFetchError(error.message);
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setProducts((data || []).map(mapProduct));
    setIsLoading(false);
  }, [searchQuery, sortKey, sortDirection, shouldFetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (data: ProductFormData) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const supabase = getSupabaseClient();
      const slug = await generateUniqueSlug(supabase, "products", data.name);
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: data.name,
          slug,
          description: data.description || null,
          is_new: data.isNew,
          is_trending: data.isTrending,
          is_best_seller: data.isBestSeller,
          is_featured: data.isFeatured,
          category_id: data.categoryId || null,
        })
        .select()
        .single();

      if (productError || !product) {
        throw productError || new Error("Failed to create product");
      }

      for (const variant of data.variants) {
        const { files, urls } = splitImages(variant.images);
        const uploadedUrls = await uploadVariantImages(
          files,
          product.id,
          variant.sku
        );
        const { data: createdVariant, error: variantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: product.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            low_stock_threshold: variant.lowStockThreshold ?? 10,
            barcode: variant.barcode || null,
            warehouse_location: variant.warehouseLocation || null,
            images: [...urls, ...uploadedUrls],
          })
          .select()
          .single();

        if (variantError || !createdVariant) {
          throw variantError || new Error("Failed to create variant");
        }

        if (variant.attributes?.length) {
          const attributeRows = variant.attributes
            .filter((attr) => attr.attributeId && attr.valueId)
            .map((attr) => ({
              variant_id: createdVariant.id,
              attribute_id: attr.attributeId,
              value_id: attr.valueId,
            }));
          if (attributeRows.length) {
            const { error: attrError } = await supabase
              .from("product_variant_attributes")
              .insert(attributeRows);
            if (attrError) {
              throw attrError;
            }
          }
        }
      }

      setIsModalOpen(false);
      showToast("Product created successfully", "success");
      fetchProducts();
    } catch (err: any) {
      console.error("Failed to create product:", err);
      if (err && typeof err === 'object') {
         console.error("Error details:", JSON.stringify(err, null, 2));
      }
      const message =
        err?.message || "Failed to create product";
      setCreateError(message);
      showToast(message, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          is_new: data.isNew,
          is_trending: data.isTrending,
          is_best_seller: data.isBestSeller,
          is_featured: data.isFeatured,
          category_id: data.categoryId || null,
        })
        .eq("id", editingProduct.id);

      if (productError) {
        throw productError;
      }

      for (const variant of data.variants) {
        const { files, urls } = splitImages(variant.images);
        let existingUrls = urls;
        if (variant.id && !existingUrls.length && !files.length) {
          const { data: existingVariant } = await supabase
            .from("product_variants")
            .select("images")
            .eq("id", variant.id)
            .maybeSingle();
          existingUrls = existingVariant?.images || [];
        }
        const uploadedUrls = await uploadVariantImages(
          files,
          editingProduct.id!,
          variant.sku
        );
        const finalImages = [...existingUrls, ...uploadedUrls];

        if (variant.id) {
          const { error: variantError } = await supabase
            .from("product_variants")
            .update({
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              low_stock_threshold: variant.lowStockThreshold ?? 10,
              barcode: variant.barcode || null,
              warehouse_location: variant.warehouseLocation || null,
              images: finalImages,
            })
            .eq("id", variant.id);

          if (variantError) {
            throw variantError;
          }

          await supabase
            .from("product_variant_attributes")
            .delete()
            .eq("variant_id", variant.id);

          if (variant.attributes?.length) {
            const attributeRows = variant.attributes
              .filter((attr) => attr.attributeId && attr.valueId)
              .map((attr) => ({
                variant_id: variant.id,
                attribute_id: attr.attributeId,
                value_id: attr.valueId,
              }));
            if (attributeRows.length) {
              const { error: attrError } = await supabase
                .from("product_variant_attributes")
                .insert(attributeRows);
              if (attrError) {
                throw attrError;
              }
            }
          }
        } else {
          const { data: createdVariant, error: variantError } = await supabase
            .from("product_variants")
            .insert({
              product_id: editingProduct.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              low_stock_threshold: variant.lowStockThreshold ?? 10,
              barcode: variant.barcode || null,
              warehouse_location: variant.warehouseLocation || null,
              images: finalImages,
            })
            .select()
            .single();

          if (variantError || !createdVariant) {
            throw variantError || new Error("Failed to create variant");
          }

          if (variant.attributes?.length) {
            const attributeRows = variant.attributes
              .filter((attr) => attr.attributeId && attr.valueId)
              .map((attr) => ({
                variant_id: createdVariant.id,
                attribute_id: attr.attributeId,
                value_id: attr.valueId,
              }));
            if (attributeRows.length) {
              const { error: attrError } = await supabase
                .from("product_variant_attributes")
                .insert(attributeRows);
              if (attrError) {
                throw attrError;
              }
            }
          }
        }
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      showToast("Product updated successfully", "success");
      fetchProducts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update product";
      setUpdateError(message);
      showToast(message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete);
      if (error) {
        throw error;
      }
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
      showToast("Product deleted successfully", "success");
      fetchProducts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
    setProductToDelete(null);
  };

  const handleFileUploadSuccess = () => {};

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
            <Image
              src={
                row.variants?.[0]?.images?.[0] ||
                generateProductPlaceholder(row.name)
              }
              alt={row.name}
              fill
              className="object-cover"
              sizes="40px"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.srcset = "";
                target.src = generateProductPlaceholder(row.name);
              }}
            />
          </div>
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: "variants",
      label: "Variants",
      sortable: false,
      render: (row: any) => (
        <div>
          {row.variants?.length > 0 ? (
            row.variants.map((v: any) => (
              <span
                key={v.id}
                className="inline-block mr-2 bg-gray-100 px-2 py-1 rounded"
              >
                {v.sku}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No variants</span>
          )}
        </div>
      ),
    },
    {
      key: "salesCount",
      label: "Sales Count",
      sortable: true,
      render: (row: any) => row.salesCount,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingProduct({
                id: row.id,
                name: row.name,
                isNew: row.isNew,
                isTrending: row.isTrending,
                isBestSeller: row.isBestSeller,
                isFeatured: row.isFeatured,
                categoryId: row.categoryId,
                description: row.description || "",
                variants: row.variants || [],
              });
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => handleDeleteProduct(row.id)}
            className="text-red-600 hover:text-red-800 flex items-center gap-1"
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting && productToDelete === row.id
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">Product List</h1>
          <p className="text-sm text-gray-500">Manage and view your products</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsFileUploadOpen(!isFileUploadOpen)}
            className="px-4 py-2 bg-[#5d8a02] text-white rounded-md flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Excel Sheet
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Product
          </button>
        </div>
      </div>

      {isFileUploadOpen && (
        <div className="mb-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium">Import Products</h2>
            <button
              onClick={() => setIsFileUploadOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <ProductFileUpload onUploadSuccess={handleFileUploadSuccess} />
        </div>
      )}

      <Table
        data={products}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={fetchError || "No products available"}
        onRefresh={fetchProducts}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        initialData={editingProduct || undefined}
        isLoading={editingProduct ? isUpdating : isCreating}
        error={
          editingProduct
            ? updateError
              ? { data: { message: updateError } }
              : null
            : createError
            ? { data: { message: createError } }
            : null
        }
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default withAuth(ProductsDashboard);

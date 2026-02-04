"use client";
import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/app/components/templates/MainLayout";
import BreadCrumb from "@/app/components/feedback/BreadCrumb";
import { useParams } from "next/navigation";
import ProductImageGallery from "../ProductImageGallery";
import ProductInfo from "../ProductInfo";
import ProductReviews from "../ProductReviews";
import { generateProductPlaceholder } from "@/app/utils/placeholderImage";
import ProductDetailSkeletonLoader from "@/app/components/feedback/ProductDetailSkeletonLoader";
import { Product } from "@/app/types/productTypes";
import { getSupabaseClient } from "@/app/lib/supabaseClient";

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<
    Product["variants"][0] | null
  >(null);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  const mapProduct = useCallback((data: any): Product => {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      isNew: data.is_new,
      isFeatured: data.is_featured,
      isTrending: data.is_trending,
      isBestSeller: data.is_best_seller,
      averageRating: Number(data.average_rating || 0),
      reviewCount: Number(data.review_count || 0),
      description: data.description ?? null,
      variants:
        data.product_variants?.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          price: Number(variant.price || 0),
          images: variant.images || [],
          stock: variant.stock ?? 0,
          lowStockThreshold: variant.low_stock_threshold ?? 10,
          barcode: variant.barcode ?? null,
          warehouseLocation: variant.warehouse_location ?? null,
          attributes:
            variant.product_variant_attributes?.map((attr: any) => ({
              id: attr.id,
              attribute: {
                id: attr.attribute?.id,
                name: attr.attribute?.name,
                slug: attr.attribute?.slug,
              },
              value: {
                id: attr.value?.id,
                value: attr.value?.value,
                slug: attr.value?.slug,
              },
            })) || [],
        })) || [],
      category: data.category
        ? {
            id: data.category.id,
            name: data.category.name,
            slug: data.category.slug,
          }
        : null,
      reviews:
        data.reviews?.map((review: any) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
          userId: review.user_id,
          user: review.user ? { name: review.user.name } : undefined,
        })) || [],
    };
  }, []);

  const fetchProduct = useCallback(async () => {
    const slugValue = typeof slug === "string" ? slug : slug?.[0] || "";
    if (!slugValue) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    
    // 1. Fetch product details (without reviews to avoid relationship error)
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id,slug,name,description,is_new,is_featured,is_trending,is_best_seller,average_rating,review_count,category:categories!products_category_id_fkey(id,name,slug),product_variants(id,sku,price,images,stock,low_stock_threshold,barcode,warehouse_location,product_variant_attributes(id,attribute:attributes(id,name,slug),value:attribute_values(id,value,slug)))"
      )
      .eq("slug", slugValue)
      .maybeSingle();

    if (productError) {
      setError(productError.message);
      setLoading(false);
      return;
    }

    if (!productData) {
      setProduct(null);
      setLoading(false);
      return;
    }

    // 2. Fetch reviews separately
    let reviewsData: any[] = [];
    try {
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,user_id")
        .eq("product_id", productData.id);
      
      if (!reviewsError && reviews) {
        reviewsData = reviews;
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }

    // Combine data
    const fullProductData = {
      ...productData,
      reviews: reviewsData
    };

    setProduct(mapProduct(fullProductData));
    setLoading(false);
  }, [mapProduct, slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) return <ProductDetailSkeletonLoader />;

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-lg text-red-500">Error loading product: {error}</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Product not found</p>
        </div>
      </MainLayout>
    );
  }

  const attributeGroups = product.variants.reduce((acc, variant) => {
    const hasSelections = Object.values(selectedAttributes).some(
      (value) => value !== ""
    );
    const matchesSelections = hasSelections
      ? Object.entries(selectedAttributes).every(
          ([attrName, attrValue]) =>
            attrName === "" ||
            variant.attributes.some(
              (attr) =>
                attr.attribute.name === attrName &&
                attr.value.value === attrValue
            )
        )
      : true;
    if (matchesSelections) {
      variant.attributes.forEach(({ attribute, value }) => {
        if (!acc[attribute.name]) {
          acc[attribute.name] = { values: new Set<string>() };
        }
        acc[attribute.name].values.add(value.value);
      });
    }
    return acc;
  }, {} as Record<string, { values: Set<string> }>);

  const resetSelections = () => {
    setSelectedAttributes({});
    setSelectedVariant(null);
  };

  const handleVariantChange = (attributeName: string, value: string) => {
    const newSelections = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(newSelections);
    const variant = product.variants.find((v) =>
      Object.entries(newSelections).every(
        ([attrName, attrValue]) =>
          attrName === "" ||
          v.attributes.some(
            (attr) =>
              attr.attribute.name === attrName && attr.value.value === attrValue
          )
      )
    );
    setSelectedVariant(variant || null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <BreadCrumb />
          </div>
        </div>

        {/* Product Details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <ProductImageGallery
                images={product.variants.flatMap((v) => v.images)}
                defaultImage={
                  selectedVariant?.images[0] ||
                  product.variants[0]?.images[0] ||
                  generateProductPlaceholder(product.name)
                }
                name={product.name}
              />
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <ProductInfo
                id={product.id}
                name={product.name}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
                description={product.description || "No description available"}
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
                attributeGroups={attributeGroups}
                selectedAttributes={selectedAttributes}
                resetSelections={resetSelections}
              />
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <ProductReviews reviews={product.reviews} productId={product.id} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetailsPage;

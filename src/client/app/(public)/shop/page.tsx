"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Filter } from "lucide-react";
import { Product } from "@/app/types/productTypes";
import ProductCard from "../product/ProductCard";
import MainLayout from "@/app/components/templates/MainLayout";
import ProductFilters, { FilterValues } from "./ProductFilters";
import { getSupabaseClient } from "@/app/lib/supabaseClient";

const ShopPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize initialFilters to prevent recreation on every render
  const initialFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      isNew: searchParams.get("isNew") === "true" || undefined,
      isFeatured: searchParams.get("isFeatured") === "true" || undefined,
      isTrending: searchParams.get("isTrending") === "true" || undefined,
      isBestSeller: searchParams.get("isBestSeller") === "true" || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      categoryId: searchParams.get("categoryId") || undefined,
    }),
    [searchParams]
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true); // Desktop filters toggle state
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const pageSize = 12;

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== "" && value !== false
  ).length;

  const mapProduct = useCallback((product: any): Product => {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      isNew: product.is_new,
      isFeatured: product.is_featured,
      isTrending: product.is_trending,
      isBestSeller: product.is_best_seller,
      averageRating: Number(product.average_rating || 0),
      reviewCount: Number(product.review_count || 0),
      description: product.description ?? null,
      variants:
        product.product_variants?.map((variant: any) => ({
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
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      reviews: [],
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug")
      .order("name", { ascending: true });
    if (!error) {
      setCategories(data || []);
    }
  }, []);

  const fetchProducts = useCallback(
    async (nextSkip: number, append: boolean) => {
      setLoading(true);
      if (!append) {
        setError(null);
      }
      const supabase = getSupabaseClient();
      let query = supabase
        .from("products")
        .select(
          "id,slug,name,is_new,is_featured,is_trending,is_best_seller,average_rating,review_count,description,category:categories!products_category_id_fkey(id,name,slug),product_variants(id,sku,price,images,stock,low_stock_threshold,barcode,warehouse_location,product_variant_attributes(id,attribute:attributes(id,name,slug),value:attribute_values(id,value,slug)))"
        )
        .order("created_at", { ascending: false })
        .range(nextSkip, nextSkip + pageSize - 1);

      if (filters.search) {
        const searchValue = `%${filters.search}%`;
        query = query.or(
          `name.ilike.${searchValue},description.ilike.${searchValue}`
        );
      }
      if (filters.isNew !== undefined) {
        query = query.eq("is_new", filters.isNew);
      }
      if (filters.isFeatured !== undefined) {
        query = query.eq("is_featured", filters.isFeatured);
      }
      if (filters.isTrending !== undefined) {
        query = query.eq("is_trending", filters.isTrending);
      }
      if (filters.isBestSeller !== undefined) {
        query = query.eq("is_best_seller", filters.isBestSeller);
      }
      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte("product_variants.price", filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte("product_variants.price", filters.maxPrice);
      }

      const { data, error } = await query;
      if (error) {
        setError(error.message);
        setLoading(false);
        setIsFetchingMore(false);
        return;
      }

      const mappedProducts = (data || []).map(mapProduct);
      setDisplayedProducts((prev) =>
        append ? [...prev, ...mappedProducts] : mappedProducts
      );
      setHasMore(mappedProducts.length === pageSize);
      setSkip(nextSkip);
      setLoading(false);
      setIsFetchingMore(false);
    },
    [filters, mapProduct, pageSize]
  );

  // Update filters only when searchParams change meaningfully
  useEffect(() => {
    setFilters(initialFilters);
    setDisplayedProducts([]);
    setSkip(0);
    setHasMore(true);
  }, [initialFilters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts(0, false);
  }, [fetchProducts]);

  const handleShowMore = () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    const newSkip = skip + pageSize;
    fetchProducts(newSkip, true);
  };

  const updateFilters = (newFilters: FilterValues) => {
    const query = new URLSearchParams();
    if (newFilters.search) query.set("search", newFilters.search);
    if (newFilters.isNew) query.set("isNew", "true");
    if (newFilters.isFeatured) query.set("isFeatured", "true");
    if (newFilters.isTrending) query.set("isTrending", "true");
    if (newFilters.isBestSeller) query.set("isBestSeller", "true");
    if (newFilters.minPrice)
      query.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      query.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.categoryId) query.set("categoryId", newFilters.categoryId);

    router.push(`/shop?${query.toString()}`);
  };

  const handleReset = () => {
    router.push("/shop");
  };

  const noProductsFound = displayedProducts.length === 0 && !loading && !error;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Shop
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {displayedProducts.length} products found
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop Filter Toggle Button */}
                <button
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Filter size={18} />
                  <span className="font-medium">
                    {filtersVisible ? "Hide" : "Show"} Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters with Toggle */}
            <AnimatePresence>
              {filtersVisible && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    duration: 0.3,
                  }}
                  className="hidden lg:block"
                >
                  <div className="w-[320px] xl:w-[380px]">
                    <ProductFilters
                      initialFilters={initialFilters}
                      onFilterChange={updateFilters}
                      categories={categories}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 bg-black/50 z-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[90vw] max-w-sm h-full bg-white shadow-2xl"
                  >
                    <ProductFilters
                      initialFilters={initialFilters}
                      onFilterChange={updateFilters}
                      categories={categories}
                      isMobile={true}
                      onCloseMobile={() => setSidebarOpen(false)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <motion.div
              className="flex-1"
              layout
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
            >
              {/* Loading State */}
              {loading && !displayedProducts.length && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[...Array(8)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
                    >
                      <div className="h-48 lg:h-56 bg-gray-200"></div>
                      <div className="p-4 lg:p-5 space-y-3">
                        <div className="h-4 lg:h-5 bg-gray-200 rounded"></div>
                        <div className="h-4 lg:h-5 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-6 lg:h-7 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Error loading products
                  </h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* No Products Found */}
              {noProductsFound && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={handleReset}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {!noProductsFound && !loading && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {displayedProducts.map(
                      (product: Product, index: number) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      )
                    )}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-12 text-center">
                      {isFetchingMore ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-600">
                            Loading more products...
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={handleShowMore}
                          disabled={isFetchingMore}
                          className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Load More Products
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const ShopPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  );
};

export default ShopPage;

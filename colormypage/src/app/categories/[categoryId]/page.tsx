import { notFound } from "next/navigation"
import { CategoryHeader } from "@/components/categories/category-header"
import { ColoringPageGrid } from "@/components/categories/coloring-page-grid"
import { createClient } from "@/lib/supabase/server"

export default async function CategoryPage({
  params,
}: {
  params: { categoryId: string }
}) {
  const { categoryId } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch category data
  const { data: category } = await supabase.from("categories").select("*").eq("id", categoryId).single()

  if (!category) {
    notFound()
  }

  // Check if category is favorited by the current user
  let isFavorited = false
  if (user) {
    const { data: favorited } = await supabase
      .from("favorited_categories")
      .select("*")
      .eq("category_id", categoryId)
      .eq("user_id", user.id)
      .single()
    isFavorited = !!favorited
  }

  // Fetch coloring pages for the category with related coloring_pages data
  const { data: pages, count } = await supabase
    .from("coloring_page_categories")
    .select(
      `
    *,
    coloring_pages:coloring_page_id(
      id,
      title,
      description,
      image_url,
      file_name,
      is_published
    )
  `,
      { count: "exact" },
    )
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
    .range(0, 11) // Get first 12 items (0-11)

  // Calculate if there are more pages
  const hasMore = count ? pages.length < count : false

  return (
    <div>
      <CategoryHeader
        id={category.id}
        title={category.title}
        description={category.description}
        imageCount={category.image_count}
        featuredImage={category.featured_image || undefined}
        categoryFavorited={isFavorited}
        userId={user?.id || null}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - coloring pages grid */}
          <div className="w-full lg:w-4/5">
            <ColoringPageGrid
              userId={user?.id || null}
              categoryId={categoryId}
              initialPages={pages || []}
              initialHasMore={hasMore}
              totalPages={count || 0}
            />
          </div>

          {/* Sidebar - Our Favorites (hidden on mobile) */}
          {/* Add the ad placeholder above the favorites */}
          {/* <div className="hidden lg:block lg:w-1/5">
            <AdPlaceholder />
            <div className="mt-6">
              <OurFavorites categoryId={categoryId} favorites={favorites} />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}

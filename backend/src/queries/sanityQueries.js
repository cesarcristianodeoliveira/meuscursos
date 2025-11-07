// src/queries/sanityQueries.js
module.exports = {
  qCategories: `*[_type == "category"]{ _id, "name": title } | order(name asc)`,
  qSubcategories: `*[_type == "subcategory"]{ _id, "name": title, category->{_id, title} } | order(name asc)`,
  qTags: `*[_type == "tag"]{ _id, "name": title, subcategory->{_id, title} } | order(name asc)`,
  qThumbnails: `*[_type == "thumbnail"]{ _id, title, slug, image } | order(title asc)`,
  qVideos: `*[_type == "video"]{ _id, title, slug } | order(title asc)`,
  qCourses: `*[_type == "course"]{
    _id,
    title,
    "slug": slug.current,
    description,
    level,
    duration,
    category->{_id, title},
    subcategory->{_id, title},
    tags[]->{_id, title}
  } | order(_createdAt desc)`,
}

export type OrbitPageDef = {
  path: string;
  slug: string;
  label: string;
  group: "Marketing" | "Legal" | "Home";
};

export const ORBIT_PAGES: OrbitPageDef[] = [
  { path: "/", slug: "home", label: "Homepage", group: "Home" },
  { path: "/services", slug: "services", label: "Services", group: "Marketing" },
  { path: "/pricing", slug: "pricing", label: "Pricing", group: "Marketing" },
  { path: "/api", slug: "api", label: "API", group: "Marketing" },
  { path: "/blogs", slug: "blogs", label: "Blogs", group: "Marketing" },
  { path: "/support", slug: "support", label: "Support", group: "Marketing" },
  { path: "/terms", slug: "terms", label: "Terms", group: "Legal" },
  { path: "/privacy", slug: "privacy", label: "Privacy", group: "Legal" },
  { path: "/signin", slug: "signin", label: "Sign in", group: "Marketing" },
  { path: "/signup", slug: "signup", label: "Sign up", group: "Marketing" },
];

export function pageBySlug(slug: string) {
  return ORBIT_PAGES.find((row) => row.slug === slug);
}

export function pageByPath(path: string) {
  return ORBIT_PAGES.find((row) => row.path === path);
}
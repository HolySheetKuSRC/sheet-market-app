import { apiRequest } from "./api";

export const getProducts = async ({
  page = 0,
  size = 10,
  sort = "latest",
  tags = [],
}: {
  page?: number;
  size?: number;
  sort?: string;
  tags?: string[];
}) => {

  const params = new URLSearchParams();

  params.append("page", String(page));
  params.append("size", String(size));
  params.append("sort", sort);

  tags.forEach(tag => params.append("tags", tag));

  const res = await apiRequest(`/products?${params.toString()}`);

  if (!res.ok) throw new Error("โหลดสินค้าไม่สำเร็จ");

  return res.json();
};

export const getProductById = async (id: string) => {

  const res = await apiRequest(`/products/${id}`);

  if (!res.ok) throw new Error("โหลดสินค้าไม่สำเร็จ");

  return res.json();
};

export const getTags = async () => {

  const res = await apiRequest("/products/tags");

  if (!res.ok) throw new Error("โหลด tag ไม่สำเร็จ");

  return res.json();
};

export const toggleLike = async (productId: string) => {

  const res = await apiRequest(`/products/${productId}/like`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("like ไม่สำเร็จ");

  return res.json();
};
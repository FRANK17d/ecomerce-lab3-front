export type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand?: string | null;
  thumbnail: string;
  images: string[];
  isActive: boolean;
};

export type CartItem = {
  id: string;
  quantity: number;
  subtotal: number;
  product: Pick<Product, "id" | "name" | "price" | "stock" | "thumbnail" | "category">;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

export type OrderItem = {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  total: number;
  createdAt: string;
  User?: User;
  OrderItems?: OrderItem[];
};

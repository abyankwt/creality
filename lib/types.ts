export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UserSession = {
  userId: number;
  email: string;
  name: string;
};

export type WooOrder = {
  id: number;
  status: string;
  date: string;
  total: string;
  currency: string;
};

export type WooAddress = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
};

export type WooCustomer = {
  billing: WooAddress;
  shipping: WooAddress;
};

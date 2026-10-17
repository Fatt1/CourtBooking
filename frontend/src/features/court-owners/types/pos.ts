export interface PosProduct {
  id: string;
  name: string;
  unit: string;
  categoryId: string;
  imageUrl: string;
  price: number;
  available: boolean;
}

export interface PosCartLine {
  serviceId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

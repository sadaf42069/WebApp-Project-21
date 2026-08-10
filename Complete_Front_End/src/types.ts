export type Page =
  | 'login'
  | 'dashboard'
  | 'shops'
  | 'tenants'
  | 'directory'
  | 'floor-nav'
  | 'reports'
  | 'settings'

export type ShopStatus = 'Occupied' | 'Vacant'
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue'

export interface Shop {
  no: string
  name: string
  category: string
  size: number
  floor: string
  status: ShopStatus
  contact: string
  openingHours: string
  description: string
}

export interface Tenant {
  id: string
  name: string
  shopNo: string
  rent: number
  dueDate: string
  paymentStatus: PaymentStatus
  phone: string
  businessCategory: string
  startDate: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin'
}

export interface Activity {
  id: string
  type:
    | 'shop_created'
    | 'shop_updated'
    | 'shop_deleted'
    | 'tenant_created'
    | 'tenant_updated'
    | 'tenant_deleted'
    | 'rent_paid'
    | 'rent_updated'
    | 'system_reset'
  message: string
  createdAt: string
}

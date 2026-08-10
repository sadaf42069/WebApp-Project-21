export const seedShops = [
  { no: 'A-01', name: 'Trendy Fashion', category: 'Apparel', size: 450, floor: '1st Floor', status: 'Occupied', contact: '+880 1711-123456', openingHours: '10:00 AM - 9:00 PM', description: 'Premium fashion for men and women.' },
  { no: 'A-02', name: 'Mobile Hub', category: 'Electronics', size: 300, floor: '1st Floor', status: 'Occupied', contact: '+880 1811-234567', openingHours: '10:00 AM - 9:00 PM', description: 'Smartphones, accessories and device support.' },
  { no: 'A-03', name: 'Food Corner', category: 'Food & Beverage', size: 500, floor: '1st Floor', status: 'Occupied', contact: '+880 1911-345678', openingHours: '11:00 AM - 10:00 PM', description: 'Meals, snacks, refreshments and quick bites.' },
  { no: 'A-04', name: 'Kids World', category: 'Kids', size: 350, floor: '1st Floor', status: 'Occupied', contact: '+880 1711-456789', openingHours: '10:00 AM - 8:00 PM', description: 'Toys, kids clothing and children-focused products.' },
  { no: 'A-05', name: 'Sports Zone', category: 'Sports', size: 420, floor: '1st Floor', status: 'Occupied', contact: '+880 1811-890123', openingHours: '10:00 AM - 9:00 PM', description: 'Sports gear and fitness accessories.' },
  { no: 'A-06', name: 'The Pharmacy', category: 'Health', size: 200, floor: '1st Floor', status: 'Occupied', contact: '+880 1711-444555', openingHours: '9:00 AM - 10:00 PM', description: 'Medicine and daily health essentials.' },
  { no: 'A-07', name: 'Shoe Gallery', category: 'Footwear', size: 280, floor: '1st Floor', status: 'Occupied', contact: '+880 1811-333444', openingHours: '10:00 AM - 9:00 PM', description: 'Footwear for adults and children.' },
  { no: 'A-08', name: 'Denim House', category: 'Apparel', size: 380, floor: '1st Floor', status: 'Occupied', contact: '+880 1911-222333', openingHours: '10:00 AM - 9:00 PM', description: 'Jeans, casual wear and lifestyle clothing.' },
  { no: 'A-09', name: 'Watch Store', category: 'Accessories', size: 180, floor: '1st Floor', status: 'Occupied', contact: '+880 1711-111222', openingHours: '10:00 AM - 9:00 PM', description: 'Watches and small accessories.' },
  { no: 'A-10', name: 'Bag Boutique', category: 'Accessories', size: 220, floor: '1st Floor', status: 'Vacant', contact: '+880 1811-111222', openingHours: '10:00 AM - 9:00 PM', description: 'Handbags, travel bags and accessories.' },
  { no: 'B-01', name: 'Beauty Care', category: 'Cosmetics', size: 250, floor: '2nd Floor', status: 'Occupied', contact: '+880 1811-567890', openingHours: '10:00 AM - 9:00 PM', description: 'Skincare, cosmetics and wellness products.' },
  { no: 'B-02', name: 'Book Point', category: 'Books', size: 300, floor: '2nd Floor', status: 'Occupied', contact: '+880 1911-678901', openingHours: '10:00 AM - 8:00 PM', description: 'Books, stationery and gift items.' },
  { no: 'B-03', name: 'Café Delight', category: 'Food & Beverage', size: 380, floor: '2nd Floor', status: 'Vacant', contact: '+880 1711-777888', openingHours: '11:00 AM - 10:00 PM', description: 'Coffee, desserts and casual seating.' },
  { no: 'B-04', name: 'Tech Gadgets', category: 'Electronics', size: 280, floor: '2nd Floor', status: 'Occupied', contact: '+880 1811-777888', openingHours: '10:00 AM - 9:00 PM', description: 'Gadgets, cables and computer accessories.' },
  { no: 'C-01', name: 'Gold Palace', category: 'Jewellery', size: 200, floor: '3rd Floor', status: 'Occupied', contact: '+880 1711-999888', openingHours: '10:00 AM - 8:00 PM', description: 'Fine gold and diamond jewellery.' },
  { no: 'C-02', name: 'Available Unit', category: 'General', size: 300, floor: '3rd Floor', status: 'Vacant', contact: 'Management Office', openingHours: 'By appointment', description: 'Vacant shop available for future tenant.' },
]

export const seedTenants = [
  { id: 'T-001', name: 'Rahman Store', shopNo: 'A-01', rent: 25000, dueDate: '05 Jun 2024', paymentStatus: 'Paid', phone: '+880 1711-123456', businessCategory: 'Apparel', startDate: 'Jan 2022' },
  { id: 'T-002', name: 'Mobile Hub', shopNo: 'A-02', rent: 18000, dueDate: '05 Jun 2024', paymentStatus: 'Paid', phone: '+880 1811-234567', businessCategory: 'Electronics', startDate: 'Mar 2022' },
  { id: 'T-003', name: 'Food Corner Ltd.', shopNo: 'A-03', rent: 30000, dueDate: '05 Jun 2024', paymentStatus: 'Due', phone: '+880 1911-345678', businessCategory: 'Food & Beverage', startDate: 'Jul 2021' },
  { id: 'T-004', name: 'Kids World', shopNo: 'A-04', rent: 15000, dueDate: '05 Jun 2024', paymentStatus: 'Paid', phone: '+880 1711-456789', businessCategory: 'Kids', startDate: 'Nov 2023' },
  { id: 'T-005', name: 'Beauty Care', shopNo: 'B-01', rent: 12000, dueDate: '05 Jun 2024', paymentStatus: 'Due', phone: '+880 1811-567890', businessCategory: 'Cosmetics', startDate: 'Feb 2023' },
  { id: 'T-006', name: 'Book Point', shopNo: 'B-02', rent: 10000, dueDate: '05 Jun 2024', paymentStatus: 'Paid', phone: '+880 1911-678901', businessCategory: 'Books', startDate: 'Sep 2022' },
  { id: 'T-007', name: 'TechZone BD', shopNo: 'B-04', rent: 22000, dueDate: '01 Jun 2024', paymentStatus: 'Overdue', phone: '+880 1711-789012', businessCategory: 'Electronics', startDate: 'Apr 2023' },
  { id: 'T-008', name: 'Sports Zone', shopNo: 'A-05', rent: 20000, dueDate: '05 Jun 2024', paymentStatus: 'Paid', phone: '+880 1811-890123', businessCategory: 'Sports', startDate: 'Jun 2022' },
]


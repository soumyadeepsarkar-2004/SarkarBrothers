

import { Product, Order, Address, UserProfile } from './types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Speed Racer RC',
    category: 'Outdoor Fun',
    price: 3499,
    originalPrice: 4499,
    rating: 4.8,
    reviews: 120,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWfvm64oyeVgSTvGIPgJgpRfR5nmDFB7JTy80nX5SqFv6UqF4ZyVTmgrFPtL8oTAG_j1gqIRXS2Q0qAedeBlOXPKEjoReq4wPKYhRBX7GRMrYE-fYRK44lT5xtgUwhctAJiazhNd6TIBtASMPCzu41gsgWsrdnY52SGAIPKIZR7p-O8-mbV7457-3BKOxn_ZgyJFw-Ro7ooal5v3uCezba3pVWNL-uTcfuqbLs0jb_l12QfWjqtilhmMF2dweYTPXO5t4HpEhKxz81',
    badge: '-20%',
    stock: 25,
  },
  {
    id: '2',
    name: 'Castle Builder Set',
    category: 'Educational',
    price: 7999,
    rating: 4.9,
    reviews: 85,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVr3UcNybOmcJCUOmWW9ZAvNGeC6DCuxSRJMnmWcjX2kQ8aT40bjlb-HEs5tcFUbzTffJiYUjPw7_Cea00o5ht7IEvbVDjd2oC8hnaDrbNQf-g059sbrwYAeUuNZR7kL13BuFsy6sPe5JJMbI68Md5A76EMrwGUlQ6bWZ8i9J0CM95wKUbcaBWv0sBqeZDwPKpFlIAkGLJMgPTbdhARAz-uE2k9WRCoSTl6PGNRthLuWdICKEvvg-ZhH5V0lj3Wuhzt7S77QGZ_405',
    stock: 15,
  },
  {
    id: '3',
    name: 'Cuddly Elephant',
    category: 'Plushies',
    price: 1699,
    rating: 5.0,
    reviews: 210,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqQ4OMxu9tNrbvviYbIyaZTMuheopTNsaIwNgTtC-cbKPVoEU9-7ywe3w31CMsPLwe1OJCKq1pOQ5jwtli9v6l3OGL9UhOmHb4PjmXDQQ0Nev4GNFiy10C89EU8jKWK_2jKT7fzwWeqjglpLTmgPE_XjJY1gyJ1lpg2sn0nuWSd6NBc_nmMCTTHju0ejEfwF3sPs17ue1nR7n3fcAfRxJSygf5AehU8Q8zMOZNIqx52m9Myd5elLR_TfH4Dc428JoDfVSfbzJf2Ij',
    stock: 50,
  },
  {
    id: '4',
    name: 'Mega Art Kit',
    category: 'Arts & Crafts',
    price: 2999,
    rating: 4.7,
    reviews: 42,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFvzJSahO8Uu4G_D6cu88g_plzhfzfd273TlaytgcvC3bBNOjvTgf71-GBloQLMV_KcKCsirUf6BpiejGkOCb_1NhPfdvBMYznQ0bocw_oksiu7ink1_Pj3xRRnd2tEUwXuRKSS_fVYwZK8UYfAIxGPm-WcvxQJI2uhCZPPXK93eRh89V3vNLsFhQEt1QeX1Hsx-WopRTPjfggzIBa2fOosRNmTgszVJxRdiRoQtjRw_KsoDuLX1sb01yJAgqSykleal0w4fW1x27O',
    stock: 30,
  },
  {
    id: '5',
    name: 'Super Galactic Robot',
    category: 'Robots',
    price: 3999,
    originalPrice: 4999,
    rating: 4.8,
    reviews: 120,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPT8wHbm0-aMkluiQOenYAyR12AC0cz2mdtjn2kL7lLXPW5dafB9fkiAVR6Q3HDiM8E-Dwx6rYJNOC5_gFxnv8siP8Vb6yApoKd7uYGBJJygi5F8Vk_kMe7iShqWyhxJLj_OKH3g5QAV66nx6NGQb-OT5U5q5pAwuZxYGelPiV7xaSFaC1jx_zLC0G-A6Tzlo1P9qeeXA74I8AFCdtJ7fXFRUiWquTr4qqXbKqCF1kCoxVwUPF19f2p9ZiQvTj3ntzDJFx0tfNYnMk',
    badge: 'Bestseller',
    description: "The ultimate companion for your little astronaut. Features voice command recognition, LED light shows, and 360-degree mobility.",
    specs: {
      "Dimensions": "12\" x 8\" x 5\"",
      "Material": "ABS Plastic (BPA Free)",
      "Battery": "Li-ion 2000mAh",
      "Age Rating": "3+ Years",
      "Weight": "1.5 lbs"
    },
    stock: 8,
  },
  {
    id: '6',
    name: 'Wooden Express Train',
    category: 'Outdoor Fun',
    price: 2499,
    originalPrice: 3499,
    rating: 4.9,
    reviews: 128,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlcbnpR_R1DZKoyHAArijpaKffOVZ_dxY8-6pUOm8PaxggHff32BW477ntYOEP_cjSfzZNbnpNFmk-riXCvKpYWHpOzx1XSFEwg7vB815N6KDpr4CIqZEjZQ2gmC91ZoO0ZtM7TXxb_gOD_Xppr8weTiTGw2gpwlBT39SNOaSgF9b7l9xxN0FUBzRh8EmnTQ7RaIhDBpzLvyBB9QnYv8aSTyXkL1-bem0Yxx-8ii99j-yYBU6vzpYHFtZFrO2gMG0jmNrfYds7sSSI',
    badge: 'Bestseller',
    stock: 12,
  },
  {
    id: '7',
    name: 'Cuddly Brown Bear',
    category: 'Plushies',
    price: 2199,
    rating: 5.0,
    reviews: 42,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_aCGbVsvGwmXOk6mvMROQjlZJJ86YG9pPMIXcJPohED3Kre34P5NFr4C4olsaeoXDEBaZAtl2R67QMCTUi41jB3YfdT_k37npXyHL6EJrZi2f_yQeoLAf5zSYRk5lVocFMBLOsU0s4nMeVuHG5aMj1Z5uPRkkPoTXOnY7J6Xd0M3lev_Q6LUlokMgY0vtcFBEoT78oHyHro6l9qtz-a0tcYLwb-GXsVdwdP4gK_MouOstnOFT4S3Sa25oFyqqy4TsKyuQ_SsnPhvh',
    stock: 40,
  },
  {
    id: '8',
    name: 'Medieval Castle',
    category: 'Educational',
    price: 3899,
    originalPrice: 4899,
    rating: 4.7,
    reviews: 89,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsTRdvR3ezqZun6QJEp5XEc7eLIrAkx8pE7IyMzIa9qUQl1VvKdEmWOK58OJM8jkCDLxZjCQ4SvHEwJKnOZlzCQJEtOibcagGQ1xFOyzP255IPk85osWTcJrLPRpzQwmSS_4mYYi6EWQ4MbswdsGmZUINkmoTgZIfZ2qaA_R2wXTAtkiwf3rtQLZwZDoZvrnIkKt7PiwnNS1iP9Cjx8yvVSaDixCifdwaGfT-2b1hIKuXIlcjHFjMkdMqoQwSs5I8ljxssqxCv5Ddv',
    badge: '-20%',
    stock: 22,
  },
  {
    id: '9',
    name: 'Rainbow Stacker',
    category: 'Educational',
    price: 1199,
    rating: 4.8,
    reviews: 210,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_B8ujRRA-07c-D6ONRleZsv9KPAgEAvTLqifavZ64SwuTjGv0zj_rf8rc9FjKtNAaHg-jWa8MkdcsaqaPe7iEPAABN3Lr2tZPuRnqXo2nf7uXNoyYEXWndoCRPpAGVR-0rNASmUAxIAjJeLCb9yoHtM1HTQt1TFRlxVPFNHi2MQg1CXzfqAIYs6Tf2LQUruUgePSTNfHXpiY1g-qH4l6YKgmwfxlWsV1hy6i2PgL7G9SShzJdUn7IgwVT7-tDVJjPnrYvCyzMFOqs',
    stock: 60,
  },
  {
    id: '10',
    name: 'Speedster RC Racer',
    category: 'Outdoor Fun',
    price: 2999,
    rating: 0,
    reviews: 0,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNFNgfRBLIeLTp3HxDZ_8apCgXVaN9tiugEOgpT9MUK62l9Mk-rSW6BeFpyIETRPiU_y-tBKlqelSy0gyGKlSks7EoNmIdmFnkvnA1QANtURnzO8vAwnGqd_Wdv1bCxeKtmvHN45joQ4kYrzYdQpDrX1HWzTZ1s4ksHEOLjSJLYPgeoUzjDdz4Qcl5a-fLd_EevQczu_d5zLV45LxMaql2tjwtvYmYzm0t6lK4xPmY7V-9z1DXEEGDtJ0DV4EsE10PkpMjNrQhH9g-',
    badge: 'New',
    stock: 5,
  },
  {
    id: '11',
    name: 'Surprise Gift Box',
    category: 'Gifts',
    price: 1699,
    rating: 4.5,
    reviews: 56,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKL-v4dPyIe3ybVZLrObzso1UcKLoYsIC0utb9v74Ua21UA_G-UcXRf0pJ-nZJA4D-59XaqQhRARVfGJwwpNnuEcoaVU6wNYMvynqjacYFbfOpmI7MmAeiuPJ06mUeJLAK1_bxsquQGva77moNa8KhFgWnaxixDKvA1BIcwMQ49_npDPk3WMN9Vq4_qB1m-xCIgxCe0DICx1vAXC8vRmQYFVT9rMkzMp-YxZbTozk1YsS56cCZhFQvoJ8gPXOtCpHBJsTUD0LET9z4',
    stock: 100,
  }
];

const mockAddress: Address = {
  id: '1',
  name: 'Home',
  street: '123 Maple Avenue',
  city: 'Springfield',
  state: 'IL',
  zip: '62704',
  country: 'United States',
  isDefault: true,
  coordinates: { lat: 39.7817, lng: -89.6501 } // Added for consistency
};

export const mockUsers: Record<string, UserProfile> = {
  'sarah.jenkins@example.com': {
    id: 'user-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU0jVydwO_BzTasvf11ZjkOxK8TbjCy26l_NVLd7PCYz5fcpsIcCX0IWjQPee7kNU9ypCADDv93ImEfaUWsAO3Ha6tcoyTx2cNGdiHRVR5nFj_qD4xiAh6brmbK9hnGVewKil-RoO4ecMGWEz37ZPkRZeINF_Gkn9U3tR8wF_ZWe5nadbzxcCHZ_7ahlTrqxZuf6bygLSwVWRdoNNFc9de4UGhOOx7qQ-uTTKwIMZoZVLiZwaQ-omKY8I7rDpduCsl3lTAPJM3AC2v',
    bio: 'Mom of two lovely energetic kids. Love finding educational toys!',
    preferences: { newsletter: true, smsNotifications: false }
  },
  'admin@example.com': {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+91 99999 00000',
    avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Admin&backgroundColor=f4c025,8a8060&backgroundType=solid,gradientLinear&radius=50',
    bio: "Administrator for SarkarBrothers. Managing products and orders.",
    preferences: { newsletter: false, smsNotifications: true }
  }
};


export const orders: Order[] = [
  {
    id: 'ORD-7829',
    date: 'Oct 24, 2023',
    customerName: 'Sarah Jenkins', // Linked to mock user
    customerEmail: 'sarah.jenkins@example.com',
    items: [
      { productId: '7', name: 'Cuddly Brown Bear', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_aCGbVsvGwmXOk6mvMROQjlZJJ86YG9pPMIXcJPohED3Kre34P5NFr4C4olsaeoXDEBaZAtl2R67QMCTUi41jB3YfdT_k37npXyHL6EJrZi2f_yQeoLAf5zSYRk5lVocFMBLOsU0s4nMeVuHG5aMj1Z5uPRkkPoTXOnY7J6Xd0M3lev_Q6LUlokMgY0vtcFBEoT78oHyHro6l9qtz-a0tcYLwb-GXsVdwdP4gK_MouOstnOFT4S3Sa25oFyqqy4TsKyuQ_SsnPhvh', quantity: 1, price: 2199 },
      { productId: '6', name: 'Wooden Express Train', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlcbnpR_R1DZKoyHAArijpaKffOVZ_dxY8-6pUOm8PaxggHff32BW477ntYOEP_cjSfzZNbnpNFmk-riXCvKpYWHpOzx1XSFEwg7vB815N6KDpr4CIqZEjZQ2gmC91ZoO0ZtM7TXxb_gOD_Xppr8weTiTGw2gpwlBT39SNOaSgF9b7l9xxN0FUBzRh8EmnTQ7RaIhDBpzLvyBB9QnYv8aSTyXkL1-bem0Yxx-8ii99j-yYBU6vzpYHFtZFrO2gMG0jmNrfYds7sSSI', quantity: 1, price: 2499 },
    ],
    total: 4698,
    status: 'Processing',
    shippingAddress: mockAddress,
    paymentMethod: 'Credit Card',
  },
  {
    id: 'ORD-7810',
    date: 'Oct 15, 2023',
    customerName: 'Sarah Jenkins', // Linked to mock user
    customerEmail: 'sarah.jenkins@example.com',
    items: [
      { productId: '1', name: 'Speed Racer RC', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWfvm64oyeVgSTvGIPgJgpRfR5nmDFB7JTy80nX5SqFv6UqF4ZyVTmgrFPtL8oTAG_j1gqIRXS2Q0qAedeBlOXPKEjoReq4wPKYhRBX7GRMrYE-fYRK44lT5xtgUwhctAJiazhNd6TIBtASMPCzu41gsgWsrdnY52SGAIPKIZR7p-O8-mbV7457-3BKOxn_ZgyJFw-Ro7ooal5v3uCezba3pVWNL-uTcfuqbLs0jb_l12QfWjqtilhmMF2dweYTPXO5t4HpEhKxz81', quantity: 1, price: 3499 },
    ],
    total: 3499,
    status: 'Shipped',
    shippingAddress: mockAddress,
    paymentMethod: 'PayPal',
  },
  {
    id: 'ORD-7755',
    date: 'Sep 30, 2023',
    customerName: 'Sarah Jenkins', // Linked to mock user
    customerEmail: 'sarah.jenkins@example.com',
    items: [
      { productId: '8', name: 'Medieval Castle', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsTRdvR3ezqZun6QJEp5XEc7eLIrAkx8pE7IyMzIa9qUQl1VvKdEmWOK58OJM8jkCDLxZjCQ4SvHEwJKnOZlzCQJEtOibcagGQ1xFOyzP255IPk85osWTcJrLPRpzQwmSS_4mYYi6EWQ4MbswdsGmZUINkmoTgZIfZ2qaA_R2wXTAtkiwf3rtQLZwZDoZvrnIkKt7PiwnNS1iP9Cjx8yvVSaDixCifdwaGfT-2b1hIKuXIlcjHFjMkdMqoQwSs5I8ljxssqxCv5Ddv', quantity: 1, price: 3899 },
      { productId: '9', name: 'Rainbow Stacker', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_B8ujRRA-07c-D6ONRleZsv9KPAgEAvTLqifavZ64SwuTjGv0zj_rf8rc9FjKtNAaHg-jWa8MkdcsaqaPe7iEPAABN3Lr2tZPuRnqXo2nf7uXNoyYEXWndoCRPpAGVR-0rNASmUAxIAjJeLCb9yoHtM1HTQt1TFRlxVPFNHi2MQg1CXzfqAIYs6Tf2LQUruUgePSTNfHXpiY1g-qH4l6YKgmwfxlWsV1hy6i2PgL7G9SShzJdUn7IgwVT7-tDVJjPnrYvCyzMFOqs', quantity: 1, price: 1199 },
      { productId: '11', name: 'Surprise Gift Box', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKL-v4dPyIe3ybVZLrObzso1UcKLoYsIC0utb9v74Ua21UA_G-UcXRf0pJ-nZJA4D-59XaqQhRARVfGJwwpNnuEcoaVU6wNYMvynqjacYFbfOpmI7MmAeiuPJ06mUeJLAK1_bxsquQGva77moNa8KhFgWnaxixDKvA1BIcwMQ49_npDPk3WMN9Vq4_qB1m-xCIgxCe0DICx1vAXC8vRmQYFVT9rMkzMp-YxZbTozk1YsS56cCZhFQvoJ8gPXOtCpHBJsTUD0LET9z4', quantity: 1, price: 1699 },
    ],
    total: 6797,
    status: 'Delivered',
    shippingAddress: mockAddress,
    paymentMethod: 'Credit Card',
  }
];

export const salesData = [
  { day: 'Mon', revenue: 12500 },
  { day: 'Tue', revenue: 18000 },
  { day: 'Wed', revenue: 15500 },
  { day: 'Thu', revenue: 21000 },
  { day: 'Fri', revenue: 25000 },
  { day: 'Sat', revenue: 32000 },
  { day: 'Sun', revenue: 28000 },
];
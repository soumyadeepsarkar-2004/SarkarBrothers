

import { Product, Order } from './types';

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

export const orders: Order[] = [
  {
    id: 'ORD-7829',
    date: 'Oct 24, 2023',
    items: ['Cuddly Brown Bear', 'Wooden Express Train'],
    total: 4698,
    status: 'Processing',
    paymentMethod: 'Credit Card',
    thumbnails: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCS7s---p-P7Z9J5K7cYb7zRUVARUAVMsEwI8JS9L_tbW2ZqgKn29M42n98R3RUp1tPuxfLnOtTSgkjC-nOCO1O664_P1U_L5wr06J1y7c3F0-rGls8t2pD97Mox2ww6kOILKPUrkXnhTaabV4YaohaF0Q8iB86--DVRaTe5m7UrQpkrujFFVYcpAVvD0jL-ncQMC5b3t__Osn6tfmDMyAsQeEinkwTeO-FVXsWJOZ8hnnPWhWMpI1CmU9Wv4BLOpxvO2Ks1eyLxCnf',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCqh0Ev6lIMyA5JS3DwKC-zgcK-jZO4k81sSEMI8sYrNxZlNCkp_fN0zcJaOtUaXOqQUX4tUSwa3b_WXzKTlEhiUzXiSGh_NCSiV7yR-_U38OrVHva4mJlXnwQMdJbQEby5csHAi2J89NKynQs5tsCqAfvcrVhJjVMXLY4JZTHE1SOxHgylZZqCIcLVm7suPaFoLvs_e0ldDXC-JpAnbtpMRWz385Rl1P6WgaiSzgAL1OaFFeVtKAfD8nJPxGt7Hk5fH1nNn-kckn3X'
    ]
  },
  {
    id: 'ORD-7810',
    date: 'Oct 15, 2023',
    items: ['Speed Racer RC'],
    total: 3499,
    status: 'Shipped',
    paymentMethod: 'PayPal',
    thumbnails: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgHisIqwAk_qwrPy_y5iwamS-nmL33x75PpBl39SG5P1TMSbTm9uI3LL9_6JWKvx1TkkUR6reeOdoMLnnJDeraYDsy40F7a8EomS9uiauQv5gVOJrec4M78WN6okd9uTBVz0_PihxqpkugvwhaWLKiYG8Kw1GUzt_jIWrGuFw9woCl5aYHrYBTWT_mvYGkBWkNdmJUOQJaRA6hhAYSCkYBi2Jqgt_H9849rHFWHZyn7flryv-T-XLDnMfV9LtPNza5UzPkvGUe1MXU'
    ]
  },
  {
    id: 'ORD-7755',
    date: 'Sep 30, 2023',
    items: ['Medieval Castle', 'Rainbow Stacker', 'Surprise Gift Box'],
    total: 6797,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    thumbnails: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA30hJvSNuZJYK4h_6HgDf4-IHIj5Njo4pKJAevA0jC5hljDtKj7WaoKx6MeSSJ1o4Utig5bcROPI9uOdDmuBoio3uuI0FSxxaGLfbjBketXxyWomSe48Zo3zmXapTNIyCKsNLPTMIrHhV2rKqnn2ocx-KNcdx2nRWscvKDmR5Kk1LSdvi-pKGd5ZqRfmOOtiuEyrLI2Y1jZpgDJ3LBIVBxHYHS1JpszA-CdpyZqurpVdYfYBNIzArBoXjOB1yNLYW0hUsJAZaioIlY',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsNpYeOqhKgc-xQMLp-accRHRKvc8CDmZsWT8zRh5cUPFNIGb_JbKIKU0mwySzvnGztMlZ856GCJ_3nZCTe3CyDH-rcyRK_j8jKrGjFkrBV2J3Ti42oQ3v0Zg6KtlS-w7XK_ZL0rEg2_BiNmUmRXu6wu5qWSr9HcvYLYk_axAEGiK5Z3EWoILOWLHcGCb1ye4lyfB5qOe4_UEkRh8ukUTjMv7YQaKB9zShgwCCOqX5sgFRNUnRUhH-DttyAM5ecBWDofuXPUjp60f7',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_yv7nePnMQOItkbVomt-jua6LchbiDyj8HSiF2-L8l_tavXWFokkCQr8YYcMVEEH0FgPAFfDCLjPW7G3xD2Bl1Ofo9GO_E-x-ylt707kPFLou8vlWu8gqImfCFLkpteas86AzaL-HM9ixQ3VJHy4tgKy51nfoUDrUU3CmQ2pg8y8PGk2yiYiaXvs_TvWHqHO_tGukUPHiraSYu5PiP2tHrXIQNTBUlbrIC12sYMvyafOtnDukfUKSiBx3uMhjVnhJMuSIX7umfnF7'
    ]
  }
];
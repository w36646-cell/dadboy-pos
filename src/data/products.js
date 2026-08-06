const products = [
  {
    id: 1,
    name: "Pepsi",
    price: 17,
    stock: 10,
    hasOption: true,
    options: [
      { id: "normal", name: "ปกติ", price: 17 },
      { id: "cup", name: "ใส่แก้ว", price: 25 },
      { id: "ownCup", name: "เอาแก้วมาเอง", price: 20 }
    ],
    image: "/images/cola/pepsi.png"
  },
  {
    id: 2,
    name: "Coke",
    price: 17,
    stock: 10,
    hasOption: true,
    options: [
      { id: "normal", name: "ปกติ", price: 17 },
      { id: "cup", name: "ใส่แก้ว", price: 25 },
      { id: "ownCup", name: "เอาแก้วมาเอง", price: 20 }
    ],
    image: "/images/cola/coke.png"
  },
  {
    id: 3,
    name: "น้ำดื่ม",
    price: 10,
    stock: 10,
    hasOption: false,
    options: [],
    image: "/images/cola/water.png"
  },
     {
    id: 41,
    name: "น้ำแดง แฟนต้า ขวดใหญ่",
    price: 35,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/41.png"
  },
  {
    id: 42,
    name: "มินิทเมด",
    price: 20,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/42.png"
  },
  {
    id: 43,
    name: "น้ำส้ม ใหญ่ 1.25",
    price: 35,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/43.png"
  },
  {
    id: 44,
    name: "น้ำเขียว ใหญ่",
    price: 35,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/44.png"
  },
  {
    id: 45,
    name: "C-vitt ทับทิม",
    price: 17,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/45.png"
  },
  {
    id: 46,
    name: "C-vitt เลม่อน",
    price: 17,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/46.png"
  },
  {
    id: 47,
    name: "ไฟแช็ก",
    price: 10,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/47.png"
  },
  {
    id: 48,
    name: "ยากันยุง ขด Ranger",
    price: 25,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/48.png"
  },
  {
    id: 49,
    name: "ยากันยุง สเปรย์",
    price: 40,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/49.png"
  },
  {
    id: 50,
    name: "โค้ก ไม่มีน้ำตาล ใหญ่",
    price: 35,
    stock: 10,
    hasOptions: false,
    options: [],
    image: "/products/50.png"
  }
];

export default products;

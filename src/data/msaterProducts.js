const rawProducts = [

  {

    id: 1001,

    legacyCode: "1",

    name: "โค้ก ขวดแก้ว",

    price: 17,

    image: "",

  },

  {

    id: 1002,

    legacyCode: "10",

    name: "น้ำดื่ม คริสตัล เล็ก",

    price: 10,

    image: "",

  },

  {

    id: 1003,

    legacyCode: "10",

    name: "น้ำดื่ม คริสตัล ขวดใหญ่",

    price: 15,

    image: "",

  },

  {

    id: 1004,

    legacyCode: "11",

    name: "เป๊ปซี่ เล็ก 340",

    price: 15,

    image: "/images/cola/pepsi.png",

  },

  {

    id: 1005,

    legacyCode: "11",

    name: "เป๊ปซี่ ใหญ่ 1.74",

    price: 35,

    image: "",

  },

  {

    id: 1006,

    legacyCode: "11",

    name: "โค้ก ออริจินอล ใหญ่",

    price: 35,

    image: "",

  },

  {

    id: 1007,

    legacyCode: "12",

    name: "ทิชชู ใหญ่",

    price: 20,

    image: "",

  },

  {

    id: 1008,

    legacyCode: "12",

    name: "ทิชชู เล็ก",

    price: 10,

    image: "",

  },

  {

    id: 1009,

    legacyCode: "12",

    name: "ทิชชู เปียก",

    price: 20,

    image: "/images/Tissue/baby-wipes-big.png",

  },

  {

    id: 1010,

    legacyCode: "13",

    name: "โค้ก ออริจินอล 500",

    price: 17,

    image: "",

  },

  {

    id: 1011,

    legacyCode: "13",

    name: "โค้ก ไม่มีน้ำตาล พลาสติก 450",

    price: 13,

    image: "/images/cola/coke-zero-small.png",

  },

  {

    id: 1012,

    legacyCode: "13",

    name: "เอ็มร้อย ฝาเหลือง",

    price: 10,

    image: "",

  },

  {

    id: 1013,

    legacyCode: "14",

    name: "คาราบาว",

    price: 10,

    image: "",

  },

  {

    id: 1014,

    legacyCode: "14",

    name: "โอวัลติน",

    price: 10,

    image: "",

  },

  {

    id: 1015,

    legacyCode: "14",

    name: "น้ำแดง แฟนต้า เล็ก",

    price: 10,

    image: "",

  },

  {

    id: 1016,

    legacyCode: "15",

    name: "น้ำเขียว แฟนต้า ขวดแก้ว",

    price: 17,

    image: "",

  },

  {

    id: 1017,

    legacyCode: "15",

    name: "น้ำแดง แฟนต้า ขวดแก้ว",

    price: 17,

    image: "",

  },

  {

    id: 1018,

    legacyCode: "15",

    name: "น้ำส้ม แฟนต้า ขวดแก้ว",

    price: 17,

    image: "",

  },

  {

    id: 1019,

    legacyCode: "15",

    name: "สไปรท์ ขวดแก้ว",

    price: 17,

    image: "",

  },

  {

    id: 1020,

    legacyCode: "16",

    name: "อิชิตันน้ำผึ้งมะนาว เล็ก",

    price: 10,

    image: "/images/tea/ichitan-honey-lemon-small.png",

  },

  {

    id: 1021,

    legacyCode: "16",

    name: "โออิชิ ขวดใหญ่ 370",

    price: 20,

    image: "/images/tea/oishi-honey-lemon-big.png",

  },

  {

    id: 1022,

    legacyCode: "16",

    name: "สปอนเซอร์",

    price: 12,

    image: "/images/Wake-Up/sponsor.png",

  },

  {

    id: 1023,

    legacyCode: "17",

    name: "สิงห์ เลมอน โซดา",

    price: 17,

    image: "",

  },

  {

    id: 1024,

    legacyCode: "17",

    name: "สิงห์ พิงก์เลมอน",

    price: 17,

    image: "",

  },

  {

    id: 1025,

    legacyCode: "17",

    name: "สิงห์ แดง เลมอน",

    price: 17,

    image: "",

  },

  {

    id: 1026,

    legacyCode: "18",

    name: "สิงห์ เลมอนครีม",

    price: 17,

    image: "",

  },

  {

    id: 1027,

    legacyCode: "18",

    name: "สิงห์ บ๊วยเลมอน",

    price: 17,

    image: "",

  },

  {

    id: 1028,

    legacyCode: "19",

    name: "ชเวฟ",

    price: 17,

    image: "",

  },

  {

    id: 1029,

    legacyCode: "19",

    name: "สไปรท์ เล็ก 245",

    price: 10,

    image: "/images/cola/sprite-small.png",

  },

  {

    id: 1030,

    legacyCode: "19",

    name: "น้ำองุ่น",

    price: 13,

    image: "",

  },

  {

    id: 1031,

    legacyCode: "21",

    name: "น้ำแข็ง + แก้ว",

    price: 5,

    image: "",

  },

  {

    id: 1032,

    legacyCode: "21",

    name: "น้ำแข็ง",

    price: 3,

    image: "",

  },

  {

    id: 1033,

    legacyCode: "21",

    name: "น้ำแข็ง 10 บาท",

    price: 10,

    image: "",

  },

  {

    id: 1034,

    legacyCode: "23",

    name: "เนสกาแฟ",

    price: 17,

    image: "",

  },

  {

    id: 1035,

    legacyCode: "24",

    name: "เบอร์ดี้แดง",

    price: 17,

    image: "",

  },

  {

    id: 1036,

    legacyCode: "25",

    name: "คูลลิซ่า เลม่อน",

    price: 15,

    image: "",

  },

  {

    id: 1037,

    legacyCode: "26",

    name: "คูลลิซ่า องุ่น",

    price: 15,

    image: "",

  },

  {

    id: 1038,

    legacyCode: "26",

    name: "ชาลิปตัน 445",

    price: 20,

    image: "/images/tea/lipton-lemon-big.png",

  },

  {

    id: 1039,

    legacyCode: "27",

    name: "เป๊ปซี่ กระป๋อง 325ml.",

    price: 17,

    image: "/images/cola/pepsi-can-small.png",

  },

  {

    id: 1040,

    legacyCode: "28",

    name: "โค้ก กระป๋อง",

    price: 17,

    image: "/images/cola/coke-can.png",

  },

  {

    id: 1041,

    legacyCode: "35",

    name: "ชาอัมพวา",

    price: 15,

    image: "/images/tea/amphawa-tea.png",

  },

  {

    id: 1042,

    legacyCode: "39",

    name: "ยากันยุง ซอง",

    price: 5,

    image: "",

  },

  {

    id: 1043,

    legacyCode: "39",

    name: "ยากันยุง สเปรย์",

    price: 40,

    image: "/images/Other/soffell-spray.png",

  },

  {

    id: 1044,

    legacyCode: "39",

    name: "ยากันยุง ขด Ranger Extreme",

    price: 25,

    image: "",

  },

  {

    id: 1045,

    legacyCode: "40",

    name: "ไฟแช็ก",

    price: 10,

    image: "/images/Other/gas-lighter.png",

  },

  {

    id: 1046,

    legacyCode: "8",

    name: "โค้ก ไม่มีน้ำตาล ใหญ่",

    price: 35,

    image: "/images/cola/coke-zero-big.png",

  },

  {

    id: 1047,

    legacyCode: "",

    name: "C-vitt ทับทิม",

    price: 17,

    image: "/images/Wake-Up/cvitt-pomegranate.png",

  },

  {

    id: 1048,

    legacyCode: "",

    name: "C-vitt เลม่อน",

    price: 17,

    image: "/images/Wake-Up/cvitt-lemon.png",

  },

  {

    id: 1049,

    legacyCode: "",

    name: "น้ำส้ม ใหญ่ 1.25",

    price: 35,

    image: "",

  },

  {

    id: 1050,

    legacyCode: "",

    name: "น้ำเขียว ใหญ่",

    price: 35,

    image: "",

  },

  {

    id: 1051,

    legacyCode: "",

    name: "น้ำแดง แฟนต้า ขวดใหญ่",

    price: 35,

    image: "/images/cola/fanta-strawberry-big.png",

  },

  {

    id: 1052,

    legacyCode: "",

    name: "มินิทเมด",

    price: 20,

    image: "/images/cola/minute-maid-splash.png",

  },

  {

    id: 1053,

    legacyCode: "",

    name: "ยาดม โป๊ยเซียน",

    price: 24,

    image: "",

  },

  {

    id: 1054,

    legacyCode: "",

    name: "ลิปตันซ่า เบอร์รี่ เบิร์ส 325 มล.",

    price: 17,

    image: "",

  },

  {

    id: 1055,

    legacyCode: "",

    name: "สแปลช",

    price: 15,

    image: "",

  },

  {

    id: 1056,

    legacyCode: "",

    name: "สไปรท์ ใหญ่",

    price: 35,

    image: "",

  },

  {

    id: 1057,

    legacyCode: "",

    name: "หลอด",

    price: 50,

    image: "",

  },

  {

    id: 1058,

    legacyCode: "",

    name: "อิชิตันองุ่น เล็ก",

    price: 10,

    image: "",

  },

  {

    id: 1059,

    legacyCode: "",

    name: "เพียวริคุ องุ่นเคียวโฮ",

    price: 15,

    image: "",

  },

  {

    id: 1060,

    legacyCode: "",

    name: "แก้วปลาคราฟ",

    price: 100,

    image: "",

  },

  {

    id: 1061,

    legacyCode: "",

    name: "ไวตามิล",

    price: 17,

    image: "",

  },

];

const products =

  rawProducts.map(

    (

      product,

      index

    ) => ({

      ...product,

      category: "",

      cost: 0,

      minStock: 5,

      trackStock: true,

      hasOption: false,

      options: [],

      packQty: 1,

      packEnabled: false,

      packPrice: 0,

      /*

        ใช้สำหรับปักสินค้าขายดี

        ไว้ด้านบนหน้า POS

      */

      pinned: false,

      /*

        รักษาลำดับเดิมจากรายการ

        ที่ส่งมา

      */

      sortOrder:

        index + 1,

    })

  );

export default products;
 
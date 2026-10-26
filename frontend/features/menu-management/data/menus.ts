import type { MenuItem } from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าจัดการเมนูอาหาร (ชื่อร้านและเมนูเป็นข้อมูลสมมติ)
 * เมื่อมี API ให้แทนที่ด้วยข้อมูลจาก services/ โดยคง type MenuItem ไว้
 */
export const UPDATED_AT = "14:28 น.";

export const MENUS: MenuItem[] = [
  {
    id: "krapao",
    name: "ข้าวกะเพราหมูสับไข่ดาว",
    description: "หมูสับผัดกะเพราหอม ๆ เสิร์ฟพร้อมข้าวสวยและไข่ดาว",
    category: "อาหารจานเดียว",
    price: 75,
    available: true,
    image: "/images/menu/krapao.jpg",
  },
  {
    id: "green-curry",
    name: "แกงเขียวหวานไก่",
    description: "ไก่นุ่มในน้ำแกงกะทิเข้มข้น หอมใบโหระพาและพริกแกง",
    category: "กับข้าว",
    price: 85,
    available: true,
    image: "/images/menu/green-curry.jpg",
  },
  {
    id: "som-tam",
    name: "ส้มตำไทย",
    description: "มะละกอกรอบ ตำสดใหม่ รสเปรี้ยวหวาน เผ็ดกำลังดี",
    category: "ยำและส้มตำ",
    price: 65,
    available: true,
    image: "/images/menu/som-tam.jpg",
  },
  {
    id: "tom-yum",
    name: "ต้มยำกุ้งน้ำข้น",
    description: "กุ้งสดตัวโต น้ำต้มยำเข้มข้น หอมสมุนไพรไทย",
    category: "กับข้าว",
    price: 120,
    available: true,
    image: "/images/menu/tom-yum.jpg",
  },
  {
    id: "pad-thai",
    name: "ผัดไทยกุ้งสด",
    description: "เส้นจันท์เหนียวนุ่ม กุ้งสด พร้อมถั่วคั่วและมะนาว",
    category: "อาหารจานเดียว",
    price: 95,
    available: true,
    image: "/images/menu/pad-thai.jpg",
  },
  {
    id: "fried-rice",
    name: "ข้าวผัดไข่",
    description: "ข้าวผัดไข่หอมกระทะ เสิร์ฟกับแตงกวาสดและมะนาว",
    category: "อาหารจานเดียว",
    price: 55,
    available: true,
    image: "/images/menu/fried-rice.jpg",
  },
  {
    id: "thai-tea",
    name: "ชาไทยเย็น",
    description: "ชาไทยหอมเข้มข้น ชงสด หวานมันกำลังพอดี",
    category: "เครื่องดื่ม",
    price: 35,
    available: true,
    image: "/images/menu/thai-tea.jpg",
  },
  {
    id: "mango-sticky-rice",
    name: "ข้าวเหนียวมะม่วง",
    description: "มะม่วงสุกหวานฉ่ำ ข้าวเหนียวนุ่ม ราดน้ำกะทิสด",
    category: "ของหวาน",
    price: 89,
    available: true,
    image: "/images/menu/mango-sticky-rice.jpg",
  },
  {
    id: "steamed-prawn",
    name: "กุ้งอบวุ้นเส้น",
    description: "กุ้งสดอบวุ้นเส้น หอมเครื่องเทศและขิง",
    category: "กับข้าว",
    price: 130,
    available: false,
    image: "/images/menu/steamed-prawn.jpg",
  },
];

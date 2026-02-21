export const medicines = [
  { id: "1", nameAr: "باراسيتامول", nameEn: "Paracetamol" },
  { id: "2", nameAr: "أموكسيسيلين", nameEn: "Amoxicillin" },
  { id: "3", nameAr: "أوميبرازول", nameEn: "Omeprazole" },
  { id: "4", nameAr: "ميتفورمين", nameEn: "Metformin" },
  { id: "5", nameAr: "أتورفاستاتين", nameEn: "Atorvastatin" },
];

export const pharmacies = [
  {
    id: "1",
    nameAr: "صيدلية الشفاء",
    nameEn: "Al-Shifa Pharmacy",
    governorate: "Baghdad",
    governorateAr: "بغداد",
    phone: "+9647701112222",
  },
  {
    id: "2",
    nameAr: "صيدلية الحياة",
    nameEn: "Al-Hayat Pharmacy",
    governorate: "Baghdad",
    governorateAr: "بغداد",
    phone: "+9647702223333",
  },
  {
    id: "3",
    nameAr: "صيدلية النور",
    nameEn: "Al-Nour Pharmacy",
    governorate: "Basra",
    governorateAr: "البصرة",
    phone: "+9647703334444",
  },
];

export const availabilityByMedicineId: Record<string, string[]> = {
  "1": ["1", "2", "3"],
  "2": ["1", "3"],
  "3": ["2"],
  "4": ["1", "2"],
  "5": ["3"],
};

export type ChatMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: "patient" | "pharmacy";
  createdAt: string;
};

export const chatsByPharmacyId: Record<string, ChatMessage[]> = {
  "1": [
    { id: "m1", text: "أهلاً وسهلاً، كيف نكدر نساعدك؟", sender: "pharmacy", createdAt: new Date().toISOString() },
  ],
};

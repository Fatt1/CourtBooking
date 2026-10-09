import provinceData from '@/province.json';
import wardData from '@/ward.json';

export interface ProvinceItem {
  code: string;
  name: string;
  nameWithType: string;
  slug: string;
  type: string;
}

export interface WardItem {
  code: string;
  name: string;
  nameWithType: string;
  path: string;
  pathWithType: string;
  parentCode: string;
  type: string;
}

// Chuyển đổi provinceData sang mảng đối tượng đã sắp xếp
export const PROVINCES: ProvinceItem[] = Object.values(provinceData).map((p: any) => ({
  code: p.code,
  name: p.name,
  nameWithType: p.name_with_type,
  slug: p.slug,
  type: p.type,
})).sort((a, b) => {
  // Đưa Hà Nội và TP.HCM lên đầu cho thuận tiện người dùng
  if (a.code === '12') return -1;
  if (b.code === '12') return 1;
  if (a.code === '11') return -1;
  if (b.code === '11') return 1;
  return a.name.localeCompare(b.name, 'vi');
});

// Map lưu danh sách phường/xã/quận theo parent_code (Mã tỉnh/thành phố)
const WARDS_BY_PROVINCE_CACHE = new Map<string, WardItem[]>();

// Hàm lấy danh sách phường/xã/quận theo mã tỉnh thành (Đồng bộ, không dùng async)
export function getWardsByProvince(provinceCode: string): WardItem[] {
  if (!provinceCode) return [];

  if (WARDS_BY_PROVINCE_CACHE.has(provinceCode)) {
    return WARDS_BY_PROVINCE_CACHE.get(provinceCode)!;
  }

  const result: WardItem[] = Object.values(wardData)
    .filter((w: any) => w.parent_code === provinceCode)
    .map((w: any) => ({
      code: w.code,
      name: w.name,
      nameWithType: w.name_with_type,
      path: w.path,
      pathWithType: w.path_with_type,
      parentCode: w.parent_code,
      type: w.type,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  WARDS_BY_PROVINCE_CACHE.set(provinceCode, result);
  return result;
}

// Hàm tìm kiếm nhanh tỉnh/thành theo tên
export function findProvinceByName(name: string): ProvinceItem | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return PROVINCES.find(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.nameWithType.toLowerCase().includes(lower) ||
      p.slug.includes(lower)
  );
}

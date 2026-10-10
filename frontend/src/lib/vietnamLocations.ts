import provinceRaw from '@/province.json';
import wardRaw from '@/ward.json';

export interface ProvinceItem {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
}

export interface WardItem {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  parent_code: string;
}

const provinceRecord = provinceRaw as unknown as Record<string, ProvinceItem>;
const wardRecord = wardRaw as unknown as Record<string, WardItem>;

/**
 * Lấy danh sách Tỉnh/Thành phố từ province.json (sắp xếp bảng chữ cái)
 */
export function getProvinces(): ProvinceItem[] {
  return Object.values(provinceRecord).sort((a, b) =>
    a.name.localeCompare(b.name, 'vi')
  );
}

/**
 * Lấy danh sách Quận/Huyện/Xã từ ward.json theo mã Tỉnh/Thành phố
 */
export function getWardsByProvince(provinceCode?: string): WardItem[] {
  if (!provinceCode) return [];
  return Object.values(wardRecord)
    .filter((w) => w.parent_code === provinceCode)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/**
 * Tìm tỉnh theo tên (hỗ trợ chế độ edit chi nhánh cũ)
 */
export function findProvinceByName(name?: string): ProvinceItem | undefined {
  if (!name) return undefined;
  const cleanName = name.trim().toLowerCase();
  return Object.values(provinceRecord).find(
    (p) =>
      p.name.toLowerCase() === cleanName ||
      p.name_with_type.toLowerCase() === cleanName ||
      p.slug.toLowerCase() === cleanName
  );
}

/**
 * Tìm quận/huyện theo mã tỉnh và tên
 */
export function findWardByName(provinceCode?: string, wardName?: string): WardItem | undefined {
  if (!wardName) return undefined;
  const cleanWard = wardName.trim().toLowerCase();
  const wards = provinceCode ? getWardsByProvince(provinceCode) : Object.values(wardRecord);
  return wards.find(
    (w) =>
      w.name.toLowerCase() === cleanWard ||
      w.name_with_type.toLowerCase() === cleanWard ||
      w.slug.toLowerCase() === cleanWard
  );
}

/**
 * Trích xuất vĩ độ (latitude) và kinh độ (longitude) từ đường dẫn Google Maps
 * Hỗ trợ các định dạng:
 * 1. https://www.google.com/maps/place/.../@10.7599171,106.6796834,858m/data=...
 * 2. https://www.google.com/maps?q=10.7599171,106.6796834
 * 3. !3d10.7599171!4d106.6796834
 * 4. ll=10.7599171,106.6796834
 * 5. Tọa độ trực tiếp: "10.7599171, 106.6796834"
 */
export function extractLatLngFromGoogleMapsUrl(
  url: string
): { latitude: number; longitude: number } | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern 1: @10.7599171,106.6796834
  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 2: ?q=10.7599171,106.6796834 or &q=...
  const qMatch = trimmed.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 3: !3d10.7599171!4d106.6796834 (embed or share links)
  const dataMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 4: ll=10.7599171,106.6796834
  const llMatch = trimmed.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  // Pattern 5: direct coordinates "10.7599171, 106.6796834"
  const directMatch = trimmed.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
  }

  return null;
}

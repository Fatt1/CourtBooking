import { removeVietnameseTones } from '@/components/common/SearchableSelect';

export type PaymentReceiverType = 'bank' | 'wallet';

export interface VietnamBank {
  id: string | number;
  name: string; // Tên đầy đủ, vd: Ngân hàng TMCP Ngoại Thương Việt Nam hoặc Ví điện tử MoMo
  code: string; // Mã viết tắt / chuẩn, vd: VCB, MOMO, ZALOPAY
  bin: string;  // Mã BIN Napas, vd: 970436, 971025
  shortName: string; // Tên hiển thị ngắn, vd: Vietcombank, MoMo, ZaloPay
  logo: string; // Link ảnh logo chính thức
  type?: PaymentReceiverType; // 'bank' hoặc 'wallet'
}

/**
 * Danh sách ví điện tử phổ biến tại Việt Nam
 */
export const POPULAR_WALLETS: VietnamBank[] = [
  {
    id: 'MOMO',
    code: 'MOMO',
    bin: '971025',
    shortName: 'MoMo',
    name: 'Ví điện tử MoMo (CTCP Dịch vụ Di động Trực tuyến)',
    logo: 'https://cdn.vietqr.io/img/momo.png',
    type: 'wallet',
  },
  {
    id: 'ZALOPAY',
    code: 'ZALOPAY',
    bin: '971101',
    shortName: 'ZaloPay',
    name: 'Ví điện tử ZaloPay (Công ty Cổ phần ZION)',
    logo: 'https://cdn.vietqr.io/img/ZALOPAY.png',
    type: 'wallet',
  },
  {
    id: 'VTLMONEY',
    code: 'VTLMONEY',
    bin: '971005',
    shortName: 'Viettel Money',
    name: 'Ví điện tử Viettel Money (Dịch vụ số Viettel)',
    logo: 'https://cdn.vietqr.io/img/VTLMONEY.png',
    type: 'wallet',
  },
  {
    id: 'VNPTMONEY',
    code: 'VNPTMONEY',
    bin: '971011',
    shortName: 'VNPT Money',
    name: 'Ví điện tử VNPT Money (VNPT Fintech)',
    logo: 'https://cdn.vietqr.io/img/VNPTMONEY.png',
    type: 'wallet',
  },
  {
    id: 'PVDB',
    code: 'PVDB',
    bin: '971133',
    shortName: 'PVcomBank Pay',
    name: 'Ví điện tử PVcomBank Pay',
    logo: 'https://cdn.vietqr.io/img/PVCB%20Pay.png',
    type: 'wallet',
  },
  {
    id: 'SHOPEEPAY',
    code: 'SHOPEEPAY',
    bin: '971028',
    shortName: 'ShopeePay',
    name: 'Ví điện tử ShopeePay (AirPay)',
    logo: 'https://cdn.vietqr.io/img/SHOPEEPAY.png',
    type: 'wallet',
  },
  {
    id: 'VNPAY',
    code: 'VNPAY',
    bin: '971020',
    shortName: 'Ví VNPAY',
    name: 'Ví điện tử VNPAY (VNPAY Wallet)',
    logo: 'https://cdn.vietqr.io/img/VNPAY.png',
    type: 'wallet',
  },
  {
    id: '9PAY',
    code: '9PAY',
    bin: '971000',
    shortName: '9PAY',
    name: 'Ví điện tử 9PAY (Công ty Cổ phần 9PAY)',
    logo: 'https://cdn.vietqr.io/img/9PAY.png',
    type: 'wallet',
  },
];

/**
 * Danh sách ngân hàng phổ biến tại Việt Nam (dùng làm fallback offline hoặc khởi tạo tức thì)
 * Logo lấy từ CDN chính thức của VietQR Napas
 */
export const DEFAULT_VIETNAM_BANKS: VietnamBank[] = [
  // --- VÍ ĐIỆN TỬ HÀNG ĐẦU ---
  ...POPULAR_WALLETS,

  // --- NGÂN HÀNG THƯƠNG MẠI ---
  {
    id: 'VCB',
    code: 'VCB',
    bin: '970436',
    shortName: 'Vietcombank',
    name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    logo: 'https://cdn.vietqr.io/img/VCB.png',
    type: 'bank',
  },
  {
    id: 'BIDV',
    code: 'BIDV',
    bin: '970418',
    shortName: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    logo: 'https://cdn.vietqr.io/img/BIDV.png',
    type: 'bank',
  },
  {
    id: 'ICB',
    code: 'ICB',
    bin: '970415',
    shortName: 'VIETINBANK',
    name: 'Ngân hàng TMCP Công Thương Việt Nam',
    logo: 'https://cdn.vietqr.io/img/ICB.png',
    type: 'bank',
  },
  {
    id: 'VBA',
    code: 'VBA',
    bin: '970405',
    shortName: 'AGRIBANK',
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    logo: 'https://cdn.vietqr.io/img/VBA.png',
    type: 'bank',
  },
  {
    id: 'MB',
    code: 'MB',
    bin: '970422',
    shortName: 'MBBank',
    name: 'Ngân hàng TMCP Quân đội',
    logo: 'https://cdn.vietqr.io/img/MB.png',
    type: 'bank',
  },
  {
    id: 'TCB',
    code: 'TCB',
    bin: '970407',
    shortName: 'Techcombank',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    logo: 'https://cdn.vietqr.io/img/TCB.png',
    type: 'bank',
  },
  {
    id: 'ACB',
    code: 'ACB',
    bin: '970416',
    shortName: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    logo: 'https://cdn.vietqr.io/img/ACB.png',
    type: 'bank',
  },
  {
    id: 'VPB',
    code: 'VPB',
    bin: '970432',
    shortName: 'VPBank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    logo: 'https://cdn.vietqr.io/img/VPB.png',
    type: 'bank',
  },
  {
    id: 'TPB',
    code: 'TPB',
    bin: '970423',
    shortName: 'TPBank',
    name: 'Ngân hàng TMCP Tiên Phong',
    logo: 'https://cdn.vietqr.io/img/TPB.png',
    type: 'bank',
  },
  {
    id: 'STB',
    code: 'STB',
    bin: '970403',
    shortName: 'Sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    logo: 'https://cdn.vietqr.io/img/SACOMBANK.png',
    type: 'bank',
  },
  {
    id: 'HDB',
    code: 'HDB',
    bin: '970437',
    shortName: 'HDBank',
    name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
    logo: 'https://cdn.vietqr.io/img/HDB.png',
    type: 'bank',
  },
  {
    id: 'VIB',
    code: 'VIB',
    bin: '970441',
    shortName: 'VIB',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    logo: 'https://cdn.vietqr.io/img/VIB.png',
    type: 'bank',
  },
  {
    id: 'SHB',
    code: 'SHB',
    bin: '970443',
    shortName: 'SHB',
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    logo: 'https://cdn.vietqr.io/img/SHB.png',
    type: 'bank',
  },
  {
    id: 'MSB',
    code: 'MSB',
    bin: '970426',
    shortName: 'MSB',
    name: 'Ngân hàng TMCP Hàng Hải Việt Nam',
    logo: 'https://cdn.vietqr.io/img/MSB.png',
    type: 'bank',
  },
  {
    id: 'OCB',
    code: 'OCB',
    bin: '970448',
    shortName: 'OCB',
    name: 'Ngân hàng TMCP Phương Đông',
    logo: 'https://cdn.vietqr.io/img/OCB.png',
    type: 'bank',
  },
  {
    id: 'SEAB',
    code: 'SEAB',
    bin: '970440',
    shortName: 'SeABank',
    name: 'Ngân hàng TMCP Đông Nam Á',
    logo: 'https://cdn.vietqr.io/img/SEAB.png',
    type: 'bank',
  },
  {
    id: 'EIB',
    code: 'EIB',
    bin: '970431',
    shortName: 'Eximbank',
    name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
    logo: 'https://cdn.vietqr.io/img/EIB.png',
    type: 'bank',
  },
  {
    id: 'LPB',
    code: 'LPB',
    bin: '970449',
    shortName: 'LPBank',
    name: 'Ngân hàng TMCP Lộc Phát Việt Nam',
    logo: 'https://cdn.vietqr.io/img/LPBANK.png',
    type: 'bank',
  },
  {
    id: 'ABB',
    code: 'ABB',
    bin: '970425',
    shortName: 'ABBank',
    name: 'Ngân hàng Thương mại Cổ phần An Bình',
    logo: 'https://cdn.vietqr.io/img/ABB.png',
    type: 'bank',
  },
  {
    id: 'BAB',
    code: 'BAB',
    bin: '970409',
    shortName: 'BAC A BANK',
    name: 'Ngân hàng TMCP Bắc Á',
    logo: 'https://cdn.vietqr.io/img/BAB.png',
    type: 'bank',
  },
  {
    id: 'NAB',
    code: 'NAB',
    bin: '970428',
    shortName: 'NamABank',
    name: 'Ngân hàng TMCP Nam Á',
    logo: 'https://cdn.vietqr.io/img/NAB.png',
    type: 'bank',
  },
  {
    id: 'NCB',
    code: 'NCB',
    bin: '970419',
    shortName: 'NCB',
    name: 'Ngân hàng TMCP Quốc Dân',
    logo: 'https://cdn.vietqr.io/img/NCB.png',
    type: 'bank',
  },
  {
    id: 'BVB',
    code: 'BVB',
    bin: '970438',
    shortName: 'BaoVietBank',
    name: 'Ngân hàng TMCP Bảo Việt',
    logo: 'https://cdn.vietqr.io/img/BVB.png',
    type: 'bank',
  },
  {
    id: 'VAB',
    code: 'VAB',
    bin: '970427',
    shortName: 'VietABank',
    name: 'Ngân hàng TMCP Việt Á',
    logo: 'https://cdn.vietqr.io/img/VAB.png',
    type: 'bank',
  },
  {
    id: 'KLB',
    code: 'KLB',
    bin: '970452',
    shortName: 'Kienlongbank',
    name: 'Ngân hàng TMCP Kiên Long',
    logo: 'https://cdn.vietqr.io/img/KLB.png',
    type: 'bank',
  },
  {
    id: 'VIETBANK',
    code: 'VIETBANK',
    bin: '970433',
    shortName: 'VietBank',
    name: 'Ngân hàng TMCP Việt Nam Thương Tín',
    logo: 'https://cdn.vietqr.io/img/VIETBANK.png',
    type: 'bank',
  },
  {
    id: 'VCCB',
    code: 'VCCB',
    bin: '970454',
    shortName: 'BVBank',
    name: 'Ngân hàng TMCP Bản Việt',
    logo: 'https://cdn.vietqr.io/img/VCCB.png',
    type: 'bank',
  },
  {
    id: 'PGB',
    code: 'PGB',
    bin: '970430',
    shortName: 'PGBank',
    name: 'Ngân hàng TMCP Thịnh vượng và Phát triển',
    logo: 'https://cdn.vietqr.io/img/PGB.png',
    type: 'bank',
  },
  {
    id: 'PVCB',
    code: 'PVCB',
    bin: '970412',
    shortName: 'PVcomBank',
    name: 'Ngân hàng TMCP Đại Chúng Việt Nam',
    logo: 'https://cdn.vietqr.io/img/PVCB.png',
    type: 'bank',
  },
  {
    id: 'SGICB',
    code: 'SGICB',
    bin: '970400',
    shortName: 'Saigonbank',
    name: 'Ngân hàng TMCP Sài Gòn Công Thương',
    logo: 'https://cdn.vietqr.io/img/SGICB.png',
    type: 'bank',
  },
  {
    id: 'SHBVN',
    code: 'SHBVN',
    bin: '970424',
    shortName: 'ShinhanBank',
    name: 'Ngân hàng TNHH MTV Shinhan Việt Nam',
    logo: 'https://cdn.vietqr.io/img/SHBVN.png',
    type: 'bank',
  },
  {
    id: 'WVN',
    code: 'WVN',
    bin: '970457',
    shortName: 'Woori',
    name: 'Ngân hàng TNHH MTV Woori Việt Nam',
    logo: 'https://cdn.vietqr.io/img/WVN.png',
    type: 'bank',
  },
  {
    id: 'PBVN',
    code: 'PBVN',
    bin: '970439',
    shortName: 'PublicBank',
    name: 'Ngân hàng TNHH MTV Public Việt Nam',
    logo: 'https://cdn.vietqr.io/img/PBVN.png',
    type: 'bank',
  },
  {
    id: 'CAKE',
    code: 'CAKE',
    bin: '546034',
    shortName: 'CAKE',
    name: 'Ngân hàng số CAKE by VPBank',
    logo: 'https://cdn.vietqr.io/img/CAKE.png',
    type: 'bank',
  },
  {
    id: 'TIMO',
    code: 'TIMO',
    bin: '963388',
    shortName: 'Timo',
    name: 'Ngân hàng số Timo by BVBank',
    logo: 'https://cdn.vietqr.io/img/TIMO.png',
    type: 'bank',
  },
];

let cachedBanks: VietnamBank[] | null = null;
let fetchPromise: Promise<VietnamBank[]> | null = null;

const WALLET_CODES = new Set([
  'momo',
  'zalopay',
  'vtlmoney',
  'vnptmoney',
  'pvdb',
  'shopeepay',
  'vnpay',
  '9pay',
  'appotapay',
]);

/**
 * Tải danh sách ngân hàng & ví điện tử từ VietQR Open API, có cache và fallback
 */
export async function fetchVietnamBanks(): Promise<VietnamBank[]> {
  if (cachedBanks && cachedBanks.length > 0) {
    return cachedBanks;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch('https://api.vietqr.io/v2/banks', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch banks from VietQR API');

      const json = await response.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const banksFromApi: VietnamBank[] = json.data.map((item: any) => {
          const rawCode = (item.code || '').toLowerCase();
          const upperCode = (item.code || '').toUpperCase();
          const isWallet =
            WALLET_CODES.has(rawCode) ||
            rawCode.includes('momo') ||
            rawCode.includes('zalo') ||
            rawCode.includes('money');

          return {
            id: upperCode || item.id,
            name: item.name || '',
            code: upperCode,
            bin: item.bin || '',
            shortName: item.shortName || item.short_name || upperCode || '',
            logo: item.logo || `https://cdn.vietqr.io/img/${item.code}.png`,
            type: (isWallet ? 'wallet' : 'bank') as PaymentReceiverType,
          };
        });

        // Bắt đầu bằng danh sách ví điện tử phổ biến để hiển thị nổi bật ở đầu
        const combined: VietnamBank[] = [...POPULAR_WALLETS];

        // Đổ các ngân hàng & ví còn lại vào danh sách
        for (const apiBank of banksFromApi) {
          const existingIndex = combined.findIndex(
            (b) => b.code.toUpperCase() === apiBank.code.toUpperCase()
          );
          if (existingIndex >= 0) {
            // Giữ lại type và logo tốt hơn nếu có
            combined[existingIndex] = {
              ...combined[existingIndex],
              ...apiBank,
              code: combined[existingIndex].code,
              type: combined[existingIndex].type || apiBank.type,
            };
          } else {
            combined.push(apiBank);
          }
        }

        // Đảm bảo các ngân hàng thương mại mặc định luôn có đầy đủ
        for (const defaultBank of DEFAULT_VIETNAM_BANKS) {
          const exists = combined.some(
            (b) => b.code.toUpperCase() === defaultBank.code.toUpperCase()
          );
          if (!exists) {
            combined.push(defaultBank);
          }
        }

        cachedBanks = combined;
        return combined;
      }
    } catch (err) {
      console.warn('Cannot fetch banks from api.vietqr.io, using default list:', err);
    }

    cachedBanks = DEFAULT_VIETNAM_BANKS;
    return DEFAULT_VIETNAM_BANKS;
  })();

  return fetchPromise;
}

/**
 * Tìm kiếm thông tin ngân hàng hoặc ví điện tử theo mã Code hoặc Tên
 */
export function findBankByCodeOrName(
  identifier?: string | null,
  bankList: VietnamBank[] = DEFAULT_VIETNAM_BANKS
): VietnamBank | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const cleanNoTone = removeVietnameseTones(clean);

  return bankList.find((b) => {
    const codeMatch = b.code.toLowerCase() === clean;
    const shortNameMatch = b.shortName.toLowerCase() === clean;
    const nameMatch = removeVietnameseTones(b.name.toLowerCase()) === cleanNoTone;
    return codeMatch || shortNameMatch || nameMatch;
  });
}

/**
 * Lọc danh sách ngân hàng / ví theo từ khóa tìm kiếm và danh mục
 */
export function filterBanks(
  banks: VietnamBank[],
  query: string,
  category: 'all' | 'bank' | 'wallet' = 'all'
): VietnamBank[] {
  let list = banks;
  if (category !== 'all') {
    list = list.filter((b) => (b.type || 'bank') === category);
  }

  if (!query.trim()) return list;
  const normalizedQuery = removeVietnameseTones(query.trim().toLowerCase());

  return list.filter((b) => {
    const code = b.code.toLowerCase();
    const shortName = removeVietnameseTones(b.shortName.toLowerCase());
    const name = removeVietnameseTones(b.name.toLowerCase());
    const bin = b.bin.toLowerCase();

    return (
      code.includes(normalizedQuery) ||
      shortName.includes(normalizedQuery) ||
      name.includes(normalizedQuery) ||
      bin.includes(normalizedQuery)
    );
  });
}

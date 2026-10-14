import { CourtTypeOption, CourtTypePricingData } from './types';

export const mockCourtTypes: CourtTypeOption[] = [
  {
    id: 'ct-pvc',
    name: 'Sân Cầu lông (Thảm PVC)',
    sport: 'Cầu lông',
    totalCourts: 4,
  },
  {
    id: 'ct-standard',
    name: 'Sân Cầu lông (Thảm thường)',
    sport: 'Cầu lông',
    totalCourts: 2,
  },
  {
    id: 'ct-pickleball',
    name: 'Sân Pickleball (Ngoài trời)',
    sport: 'Pickleball',
    totalCourts: 3,
  },
];

export const mockPricingDataMap: Record<string, CourtTypePricingData> = {
  'ct-pvc': {
    courtTypeId: 'ct-pvc',
    tabName: 'Bảng giá tiêu chuẩn',
    fixedBlocks: [
      {
        id: 'fb-1',
        timeRange: '17h30 - 19h30',
        daysText: 'T7, CN',
        appliedCourtsText: 'Tất cả các sân',
      },
      {
        id: 'fb-2',
        timeRange: '19h30 - 21h30',
        daysText: 'T7, CN',
        appliedCourtsText: 'Tất cả các sân',
      },
    ],
    priceTables: [
      {
        id: 'pt-standard',
        name: 'Bảng giá',
        isHSSV: false,
        groups: [
          {
            id: 'grp-std-1',
            dateRange: 'Mặc định',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-std-1',
                timeRange: '06:00 - 17:30',
                fixedPrice: 80000,
                walkInPrice: 100000,
              },
              {
                id: 'rule-std-2',
                timeRange: '17:30 - 22:30',
                fixedPrice: 120000,
                walkInPrice: 140000,
              },
            ],
          },
        ],
      },
      {
        id: 'pt-hssv',
        name: 'Đặc quyền HSSV',
        isHSSV: true,
        groups: [
          {
            id: 'grp-hssv-default',
            dateRange: 'Mặc định',
            dayOfWeekText: '',
            items: [
              {
                id: 'rule-hssv-def',
                timeRange: '',
                singlePrice: 0,
              },
            ],
          },
          {
            id: 'grp-hssv-weekday',
            dateRange: '01/01 - 31/12',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-hssv-1',
                timeRange: '7h - 18h',
                singlePrice: 50000,
              },
              {
                id: 'rule-hssv-2',
                timeRange: '11h - 13h',
                singlePrice: 39000,
              },
              {
                id: 'rule-hssv-3',
                timeRange: '18h - 22h',
                singlePrice: 120000,
              },
              {
                id: 'rule-hssv-4',
                timeRange: '22h - 24h',
                singlePrice: 50000,
              },
            ],
          },
          {
            id: 'grp-hssv-weekend',
            dateRange: '01/01 - 31/12',
            dayOfWeekText: 'T7 - CN',
            items: [
              {
                id: 'rule-hssv-5',
                timeRange: '6h - 24h',
                singlePrice: 120000,
              },
              {
                id: 'rule-hssv-6',
                timeRange: '11h - 13h',
                singlePrice: 100000,
              },
            ],
          },
        ],
      },
    ],
  },
  'ct-standard': {
    courtTypeId: 'ct-standard',
    tabName: 'Bảng giá tiêu chuẩn',
    fixedBlocks: [
      {
        id: 'fb-std-1',
        timeRange: '18h00 - 20h00',
        daysText: 'T2, T4, T6',
        appliedCourtsText: 'Sân 1, Sân 2',
      },
    ],
    priceTables: [
      {
        id: 'pt-standard-std',
        name: 'Bảng giá',
        isHSSV: false,
        groups: [
          {
            id: 'grp-std-2',
            dateRange: 'Mặc định',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-std-3',
                timeRange: '06:00 - 17:00',
                fixedPrice: 60000,
                walkInPrice: 80000,
              },
              {
                id: 'rule-std-4',
                timeRange: '17:00 - 22:00',
                fixedPrice: 90000,
                walkInPrice: 110000,
              },
            ],
          },
          {
            id: 'grp-std-weekend',
            dateRange: 'Mặc định',
            dayOfWeekText: 'T7 - CN',
            items: [
              {
                id: 'rule-std-5',
                timeRange: '06:00 - 22:00',
                fixedPrice: 100000,
                walkInPrice: 120000,
              },
            ],
          },
        ],
      },
      {
        id: 'pt-hssv-std',
        name: 'Đặc quyền HSSV',
        isHSSV: true,
        groups: [
          {
            id: 'grp-hssv-std-1',
            dateRange: '01/01 - 31/12',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-hssv-std-1',
                timeRange: '7h - 17h',
                singlePrice: 40000,
              },
              {
                id: 'rule-hssv-std-2',
                timeRange: '17h - 22h',
                singlePrice: 75000,
              },
            ],
          },
        ],
      },
    ],
  },
  'ct-pickleball': {
    courtTypeId: 'ct-pickleball',
    tabName: 'Bảng giá tiêu chuẩn',
    fixedBlocks: [
      {
        id: 'fb-pb-1',
        timeRange: '17h00 - 19h00',
        daysText: 'T7, CN',
        appliedCourtsText: 'Tất cả các sân',
      },
      {
        id: 'fb-pb-2',
        timeRange: '19h00 - 21h00',
        daysText: 'T7, CN',
        appliedCourtsText: 'Tất cả các sân',
      },
    ],
    priceTables: [
      {
        id: 'pt-pb-std',
        name: 'Bảng giá',
        isHSSV: false,
        groups: [
          {
            id: 'grp-pb-1',
            dateRange: 'Mặc định',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-pb-1',
                timeRange: '06:00 - 17:00',
                fixedPrice: 100000,
                walkInPrice: 130000,
              },
              {
                id: 'rule-pb-2',
                timeRange: '17:00 - 22:30',
                fixedPrice: 160000,
                walkInPrice: 200000,
              },
            ],
          },
          {
            id: 'grp-pb-2',
            dateRange: 'Mặc định',
            dayOfWeekText: 'T7 - CN',
            items: [
              {
                id: 'rule-pb-3',
                timeRange: '06:00 - 22:30',
                fixedPrice: 180000,
                walkInPrice: 220000,
              },
            ],
          },
        ],
      },
      {
        id: 'pt-pb-hssv',
        name: 'Đặc quyền HSSV',
        isHSSV: true,
        groups: [
          {
            id: 'grp-pb-hssv-1',
            dateRange: '01/01 - 31/12',
            dayOfWeekText: 'T2 - T6',
            items: [
              {
                id: 'rule-pb-hssv-1',
                timeRange: '7h - 16h',
                singlePrice: 70000,
              },
            ],
          },
        ],
      },
    ],
  },
};

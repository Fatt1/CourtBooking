import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { PriceTableGroup, PriceRuleItem, PriceRuleGroup } from './types';

interface PriceTableBlockProps {
  table: PriceTableGroup;
  onEditTable: (table: PriceTableGroup) => void;
  onDeleteTable: (table: PriceTableGroup) => void;
  onEditRule: (table: PriceTableGroup, group: PriceRuleGroup, rule: PriceRuleItem) => void;
}

export function PriceTableBlock({
  table,
  onEditTable,
  onDeleteTable,
  onEditRule,
}: PriceTableBlockProps) {
  const isHSSV = table.isHSSV ?? false;

  return (
    <div className="space-y-3">
      {/* Table Header: Tên bảng giá + Cụm icon Sửa / Xóa */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-foreground tracking-tight">
          {table.name}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEditTable(table)}
            title={`Chỉnh sửa thông tin ${table.name}`}
            className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteTable(table)}
            title={`Xóa ${table.name}`}
            className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <th className="py-3 px-4 w-[160px]">Khoảng ngày</th>
                <th className="py-3 px-4 w-[130px]">Thứ</th>
                <th className="py-3 px-4 min-w-[150px]">Khung giờ</th>
                {isHSSV ? (
                  <th className="py-3 px-4 w-[150px]">Giá</th>
                ) : (
                  <>
                    <th className="py-3 px-4 w-[140px]">Giá cố định</th>
                    <th className="py-3 px-4 w-[140px]">Giá vãng lai</th>
                  </>
                )}
                <th className="py-3 px-4 text-right w-[100px] pr-5">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {table.groups.map((group) => {
                const totalRows = Math.max(group.items.length, 1);

                return (
                  <React.Fragment key={group.id}>
                    {group.items.map((item, index) => {
                      const isFirstRowOfGroup = index === 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          {/* Cột Khoảng ngày (chỉ render ở dòng đầu của nhóm) */}
                          {isFirstRowOfGroup && (
                            <td
                              rowSpan={totalRows}
                              className="py-3.5 px-4 font-medium text-foreground align-middle border-r border-border/40"
                            >
                              {group.dateRange || 'Mặc định'}
                            </td>
                          )}

                          {/* Cột Thứ (chỉ render ở dòng đầu của nhóm) */}
                          {isFirstRowOfGroup && (
                            <td
                              rowSpan={totalRows}
                              className="py-3.5 px-4 font-medium text-muted-foreground align-middle border-r border-border/40"
                            >
                              {group.dayOfWeekText || '—'}
                            </td>
                          )}

                          {/* Cột Khung giờ */}
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {item.timeRange || '—'}
                          </td>

                          {/* Cột Giá */}
                          {isHSSV ? (
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {item.singlePrice !== undefined
                                ? formatVND(item.singlePrice)
                                : '0₫'}
                            </td>
                          ) : (
                            <>
                              <td className="py-3.5 px-4 font-semibold text-muted-foreground">
                                {item.fixedPrice !== undefined
                                  ? formatVND(item.fixedPrice)
                                  : '—'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-foreground">
                                {item.walkInPrice !== undefined
                                  ? formatVND(item.walkInPrice)
                                  : '—'}
                              </td>
                            </>
                          )}

                          {/* Cột Thao tác */}
                          <td className="py-3.5 px-4 text-right pr-5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onEditRule(table, group, item)}
                              className="h-8 px-3 rounded-lg border-border/80 bg-background hover:bg-accent font-semibold text-xs cursor-pointer"
                            >
                              Sửa
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

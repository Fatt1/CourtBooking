using System.Globalization;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public static class QuestPdfReportGenerator
{
    private static readonly CultureInfo VnCulture = new("vi-VN");

    static QuestPdfReportGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generate(CourtOwnerRevenueReportData data)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(25);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial").FontColor(Colors.Grey.Darken3));

                // ── HEADER ──────────────────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Spacing(4);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text(data.BrandTitle.ToUpper())
                                .FontSize(11)
                                .SemiBold()
                                .FontColor(Colors.Green.Darken2);

                            titleCol.Item().Text("BÁO CÁO TỔNG KẾT DOANH THU & VẬN HÀNH")
                                .FontSize(15)
                                .Bold()
                                .FontColor(Colors.Blue.Darken4);
                        });

                        row.ConstantItem(180).AlignRight().Column(metaCol =>
                        {
                            metaCol.Item().Text($"Ngày tạo: {data.GeneratedAt.ToLocalTime():dd/MM/yyyy HH:mm}").FontSize(8).FontColor(Colors.Grey.Medium);
                            metaCol.Item().Text($"Người xuất: {data.GeneratedBy}").FontSize(8).FontColor(Colors.Grey.Medium);
                            metaCol.Item().Text($"Kỳ: {data.FromDate:dd/MM/yyyy} - {data.ToDate:dd/MM/yyyy}").FontSize(8).Bold().FontColor(Colors.Grey.Darken2);
                        });
                    });

                    col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                // ── CONTENT ─────────────────────────────────────────────────
                page.Content().PaddingVertical(10).Column(content =>
                {
                    content.Spacing(12);

                    // 1. Dòng thông tin bộ lọc
                    content.Item().Row(row =>
                    {
                        row.RelativeItem().Text(text =>
                        {
                            text.Span("Phạm vi báo cáo: ").SemiBold();
                            text.Span(data.BranchFilterName).FontColor(Colors.Blue.Darken2);
                            text.Span(" | ");
                            text.Span("Chủ sân: ").SemiBold();
                            text.Span(data.CourtOwnerName);
                        });
                    });

                    // 2. KHU VỰC 3 THẺ KPI NỔI BẬT
                    content.Item().Row(kpiRow =>
                    {
                        kpiRow.Spacing(8);

                        // Thẻ 1: Tổng doanh thu
                        kpiRow.RelativeItem().Border(1).BorderColor(Colors.Green.Lighten2).Background(Colors.Green.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("TỔNG DOANH THU THỰC NHẬN").FontSize(8).Bold().FontColor(Colors.Green.Darken3);
                            c.Item().Text(data.TotalNetRevenue.ToString("N0", VnCulture) + " đ").FontSize(14).Bold().FontColor(Colors.Green.Darken4);
                            c.Item().Text($"Đã trừ {data.TotalDiscount.ToString("N0", VnCulture)} đ voucher").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });

                        // Thẻ 2: Lượt đặt sân & Tỷ lệ hủy
                        kpiRow.RelativeItem().Border(1).BorderColor(Colors.Blue.Lighten2).Background(Colors.Blue.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("LƯỢT ĐẶT & TỶ LỆ HỦY").FontSize(8).Bold().FontColor(Colors.Blue.Darken3);
                            c.Item().Text($"{data.TotalBookings:N0} lượt").FontSize(14).Bold().FontColor(Colors.Blue.Darken4);
                            c.Item().Text($"Hủy: {data.CancelledBookings} đơn ({data.CancellationRate:N1}%)").FontSize(7.5f).FontColor(Colors.Red.Darken2);
                        });

                        // Thẻ 3: Tỷ lệ lấp đầy sân
                        kpiRow.RelativeItem().Border(1).BorderColor(Colors.Orange.Lighten2).Background(Colors.Orange.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("TỶ LỆ LẤP ĐẦY TRUNG BÌNH").FontSize(8).Bold().FontColor(Colors.Orange.Darken3);
                            c.Item().Text($"{data.OccupancyRate:N1}%").FontSize(14).Bold().FontColor(Colors.Orange.Darken4);
                            c.Item().Text($"{data.TotalBookedCourtHours:N1}h chơi / {data.TotalAvailableCourtHours:N0}h mở").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });
                    });

                    // 3. BẢNG PHÂN BỔ THEO CHI NHÁNH
                    content.Item().Column(section =>
                    {
                        section.Spacing(4);
                        section.Item().Text("1. PHÂN BỔ DOANH THU THEO CHI NHÁNH").FontSize(10).Bold().FontColor(Colors.Blue.Darken3);

                        section.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(25);  // STT
                                columns.RelativeColumn(3);   // Tên chi nhánh
                                columns.ConstantColumn(45);  // Số sân
                                columns.ConstantColumn(55);  // Lượt đặt
                                columns.RelativeColumn(2);   // Tiền sân
                                columns.RelativeColumn(2);   // Tiền DV
                                columns.RelativeColumn(2);   // Tổng tiền
                                columns.ConstantColumn(50);  // Tỷ lệ %
                            });

                            // Table Header
                            table.Header(header =>
                            {
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).Text("Tên chi nhánh").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignCenter().Text("Số sân").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignCenter().Text("Lượt đặt").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignRight().Text("Tiền sân").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignRight().Text("Dịch vụ").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignRight().Text("Tổng cộng").FontColor(Colors.White).Bold();
                                header.Cell().Background(Colors.Blue.Darken4).Padding(4).AlignCenter().Text("Đóng góp").FontColor(Colors.White).Bold();
                            });

                            // Table Rows
                            for (var i = 0; i < data.Branches.Count; i++)
                            {
                                var b = data.Branches[i];
                                var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                                table.Cell().Background(bg).Padding(4).AlignCenter().Text((i + 1).ToString());
                                table.Cell().Background(bg).Padding(4).Text(b.BranchName).SemiBold();
                                table.Cell().Background(bg).Padding(4).AlignCenter().Text(b.CourtsCount.ToString());
                                table.Cell().Background(bg).Padding(4).AlignCenter().Text(b.TotalBookings.ToString());
                                table.Cell().Background(bg).Padding(4).AlignRight().Text(b.CourtRevenue.ToString("N0", VnCulture) + " đ");
                                table.Cell().Background(bg).Padding(4).AlignRight().Text(b.ServiceRevenue.ToString("N0", VnCulture) + " đ");
                                table.Cell().Background(bg).Padding(4).AlignRight().Text(b.TotalRevenue.ToString("N0", VnCulture) + " đ").Bold();
                                table.Cell().Background(bg).Padding(4).AlignCenter().Text($"{b.ContributionRate:N1}%");
                            }

                            // Total Row
                            table.Cell().ColumnSpan(4).Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text("TỔNG CỘNG:").Bold();
                            table.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text(data.CourtRevenue.ToString("N0", VnCulture) + " đ").Bold();
                            table.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text(data.ServiceRevenue.ToString("N0", VnCulture) + " đ").Bold();
                            table.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignRight().Text(data.TotalNetRevenue.ToString("N0", VnCulture) + " đ").Bold().FontColor(Colors.Green.Darken3);
                            table.Cell().Background(Colors.Grey.Lighten2).Padding(4).AlignCenter().Text("100%").Bold();
                        });
                    });

                    // 4. CƠ CẤU DOANH THU & HÌNH THỨC THANH TOÁN (2 CỘT)
                    content.Item().Row(twoCol =>
                    {
                        twoCol.Spacing(12);

                        // Cột trái: Phân chia theo nguồn thu
                        twoCol.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8).Column(c =>
                        {
                            c.Spacing(4);
                            c.Item().Text("2. CƠ CẤU NGUỒN THU").FontSize(9).Bold().FontColor(Colors.Blue.Darken3);

                            c.Item().Row(r => { r.RelativeItem().Text("• Tiền sân vãng lai:"); r.ConstantItem(85).AlignRight().Text(data.WalkInCourtRevenue.ToString("N0", VnCulture) + " đ"); });
                            c.Item().Row(r => { r.RelativeItem().Text("• Tiền sân cố định (tháng):"); r.ConstantItem(85).AlignRight().Text(data.FixedCourtRevenue.ToString("N0", VnCulture) + " đ"); });
                            c.Item().Row(r => { r.RelativeItem().Text("• Dịch vụ kèm (nước, đồ thuê):"); r.ConstantItem(85).AlignRight().Text(data.RetailServiceRevenue.ToString("N0", VnCulture) + " đ"); });
                            c.Item().Row(r => { r.RelativeItem().Text("• Tiền đơn hủy/hoàn:"); r.ConstantItem(85).AlignRight().Text("-" + data.CancellationRefundAmount.ToString("N0", VnCulture) + " đ").FontColor(Colors.Red.Medium); });
                        });

                        // Cột phải: Phân chia theo hình thức thanh toán
                        twoCol.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8).Column(c =>
                        {
                            c.Spacing(4);
                            c.Item().Text("3. HÌNH THỨC THANH TOÁN").FontSize(9).Bold().FontColor(Colors.Blue.Darken3);

                            c.Item().Row(r => { r.RelativeItem().Text("• Chuyển khoản QR / Ngân hàng:"); r.ConstantItem(85).AlignRight().Text(data.QrTransferAmount.ToString("N0", VnCulture) + " đ").Bold(); });
                            c.Item().Row(r => { r.RelativeItem().Text("• Tiền mặt tại quầy:"); r.ConstantItem(85).AlignRight().Text(data.CashAmount.ToString("N0", VnCulture) + " đ"); });
                            c.Item().Row(r => { r.RelativeItem().Text("• Giảm giá / Voucher áp dụng:"); r.ConstantItem(85).AlignRight().Text(data.TotalDiscount.ToString("N0", VnCulture) + " đ").FontColor(Colors.Orange.Darken2); });
                        });
                    });

                    // 5. CHỮ KÝ XÁC NHẬN
                    content.Item().PaddingTop(15).Row(signRow =>
                    {
                        signRow.RelativeItem().Column(col =>
                        {
                            col.Item().AlignCenter().Text("NGƯỜI LẬP BIỂU").Bold().FontSize(9);
                            col.Item().AlignCenter().Text("(Ký, ghi rõ họ tên)").FontSize(7.5f).Italic().FontColor(Colors.Grey.Medium);
                            col.Item().PaddingTop(40).AlignCenter().Text(data.GeneratedBy).SemiBold().FontSize(9);
                        });

                        signRow.RelativeItem().Column(col =>
                        {
                            col.Item().AlignCenter().Text("CHỦ CƠ SỞ / KẾ TOÁN TRƯỞNG").Bold().FontSize(9);
                            col.Item().AlignCenter().Text("(Ký, đóng dấu xác nhận)").FontSize(7.5f).Italic().FontColor(Colors.Grey.Medium);
                            col.Item().PaddingTop(40).AlignCenter().Text(data.CourtOwnerName).SemiBold().FontSize(9);
                        });
                    });
                });

                // ── FOOTER ──────────────────────────────────────────────────
                page.Footer().Row(footer =>
                {
                    footer.RelativeItem().Text("Hệ thống quản lý đặt sân CourtBooking — Tài liệu nội bộ").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                    footer.ConstantItem(100).AlignRight().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}

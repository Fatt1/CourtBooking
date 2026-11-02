using ClosedXML.Excel;
using CourtBooking.Application.Features.V1.Analytics.Reports.Models;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public static class ClosedXmlReportGenerator
{
    private const string CurrencyFormat = "#,##0 \"₫\"";
    private const string NumberFormat = "#,##0";
    private const string PercentFormat = "0.0%";
    private const string DateFormat = "dd/MM/yyyy";

    public static byte[] Generate(CourtOwnerRevenueReportData data)
    {
        using var workbook = new XLWorkbook();

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 1: Tong_Quan (Dashboard & Summary)
        // ════════════════════════════════════════════════════════════════════════
        var wsSummary = workbook.Worksheets.Add("Tong_Quan");
        wsSummary.ShowGridLines = true;

        // Title
        wsSummary.Cell("A1").Value = data.BrandTitle.ToUpper();
        wsSummary.Cell("A1").Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(XLColor.FromHtml("#166534"));

        wsSummary.Cell("A2").Value = "BÁO CÁO TỔNG KẾT DOANH THU & VẬN HÀNH CHUỖI SÂN";
        wsSummary.Cell("A2").Style.Font.SetBold().Font.SetFontSize(16).Font.SetFontColor(XLColor.FromHtml("#1e3a8a"));

        // Meta info
        wsSummary.Cell("A4").Value = "Kỳ báo cáo:";
        wsSummary.Cell("B4").Value = $"{data.FromDate:dd/MM/yyyy} - {data.ToDate:dd/MM/yyyy}";
        wsSummary.Cell("D4").Value = "Ngày xuất:";
        wsSummary.Cell("E4").Value = data.GeneratedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

        wsSummary.Cell("A5").Value = "Phạm vi:";
        wsSummary.Cell("B5").Value = data.BranchFilterName;
        wsSummary.Cell("D5").Value = "Người xuất:";
        wsSummary.Cell("E5").Value = data.GeneratedBy;

        wsSummary.Range("A4:A5").Style.Font.SetBold();
        wsSummary.Range("D4:D5").Style.Font.SetBold();

        // ── KPI Summary Box ─────────────────────────────────────────────────
        wsSummary.Cell("A7").Value = "CHỈ SỐ TỔNG QUAN (KPIs)";
        wsSummary.Cell("A7").Style.Font.SetBold().Font.SetFontSize(12).Font.SetFontColor(XLColor.FromHtml("#1e3a8a"));

        var kpiRow = 8;
        wsSummary.Cell(kpiRow, 1).Value = "Tổng doanh thu thực nhận:";
        wsSummary.Cell(kpiRow, 2).Value = data.TotalNetRevenue;
        wsSummary.Cell(kpiRow, 2).Style.NumberFormat.Format = CurrencyFormat;
        wsSummary.Cell(kpiRow, 2).Style.Font.SetBold().Font.SetFontColor(XLColor.FromHtml("#15803d"));

        wsSummary.Cell(kpiRow, 4).Value = "Lượt đặt sân hoàn tất:";
        wsSummary.Cell(kpiRow, 5).Value = data.TotalBookings;
        wsSummary.Cell(kpiRow, 5).Style.NumberFormat.Format = NumberFormat;
        wsSummary.Cell(kpiRow, 5).Style.Font.SetBold();

        kpiRow++;
        wsSummary.Cell(kpiRow, 1).Value = "Doanh thu tiền sân:";
        wsSummary.Cell(kpiRow, 2).Value = data.CourtRevenue;
        wsSummary.Cell(kpiRow, 2).Style.NumberFormat.Format = CurrencyFormat;

        wsSummary.Cell(kpiRow, 4).Value = "Tỷ lệ hủy / hoàn tiền:";
        wsSummary.Cell(kpiRow, 5).Value = (double)(data.CancellationRate / 100m);
        wsSummary.Cell(kpiRow, 5).Style.NumberFormat.Format = PercentFormat;
        wsSummary.Cell(kpiRow, 5).Style.Font.SetFontColor(XLColor.FromHtml("#b91c1c"));

        kpiRow++;
        wsSummary.Cell(kpiRow, 1).Value = "Doanh thu dịch vụ (POS):";
        wsSummary.Cell(kpiRow, 2).Value = data.ServiceRevenue;
        wsSummary.Cell(kpiRow, 2).Style.NumberFormat.Format = CurrencyFormat;

        wsSummary.Cell(kpiRow, 4).Value = "Tỷ lệ lấp đầy sân (Occupancy):";
        wsSummary.Cell(kpiRow, 5).Value = (double)(data.OccupancyRate / 100m);
        wsSummary.Cell(kpiRow, 5).Style.NumberFormat.Format = PercentFormat;
        wsSummary.Cell(kpiRow, 5).Style.Font.SetBold().Font.SetFontColor(XLColor.FromHtml("#c2410c"));

        wsSummary.Range(8, 1, 10, 1).Style.Font.SetBold();
        wsSummary.Range(8, 4, 10, 4).Style.Font.SetBold();

        // ── Bảng 1: Phân bổ theo chi nhánh ─────────────────────────────────
        var table1Start = 12;
        wsSummary.Cell(table1Start, 1).Value = "1. BẢNG TỔNG HỢP THEO TỪNG CHI NHÁNH";
        wsSummary.Cell(table1Start, 1).Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(XLColor.FromHtml("#1e3a8a"));

        var headerRow1 = table1Start + 1;
        string[] headers1 = ["STT", "Tên chi nhánh", "Số sân", "Lượt đặt", "Tiền sân", "Tiền dịch vụ", "Tổng doanh thu", "Đóng góp (%)"];
        for (var i = 0; i < headers1.Length; i++)
        {
            var cell = wsSummary.Cell(headerRow1, i + 1);
            cell.Value = headers1[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#1e3a8a"));
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        var r1 = headerRow1 + 1;
        for (var i = 0; i < data.Branches.Count; i++)
        {
            var b = data.Branches[i];
            wsSummary.Cell(r1, 1).Value = i + 1;
            wsSummary.Cell(r1, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r1, 2).Value = b.BranchName;
            wsSummary.Cell(r1, 3).Value = b.CourtsCount;
            wsSummary.Cell(r1, 3).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r1, 4).Value = b.TotalBookings;
            wsSummary.Cell(r1, 4).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            wsSummary.Cell(r1, 4).Style.NumberFormat.Format = NumberFormat;

            wsSummary.Cell(r1, 5).Value = b.CourtRevenue;
            wsSummary.Cell(r1, 5).Style.NumberFormat.Format = CurrencyFormat;

            wsSummary.Cell(r1, 6).Value = b.ServiceRevenue;
            wsSummary.Cell(r1, 6).Style.NumberFormat.Format = CurrencyFormat;

            wsSummary.Cell(r1, 7).Value = b.TotalRevenue;
            wsSummary.Cell(r1, 7).Style.NumberFormat.Format = CurrencyFormat;
            wsSummary.Cell(r1, 7).Style.Font.SetBold();

            wsSummary.Cell(r1, 8).Value = (double)(b.ContributionRate / 100m);
            wsSummary.Cell(r1, 8).Style.NumberFormat.Format = PercentFormat;
            wsSummary.Cell(r1, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            r1++;
        }

        // Dòng tổng cộng bảng 1
        wsSummary.Cell(r1, 1).Value = "TỔNG CỘNG";
        wsSummary.Range(r1, 1, r1, 3).Merge().Style.Font.SetBold().Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);
        wsSummary.Cell(r1, 4).FormulaA1 = $"SUM(D{headerRow1 + 1}:D{r1 - 1})";
        wsSummary.Cell(r1, 4).Style.NumberFormat.Format = NumberFormat;
        wsSummary.Cell(r1, 5).FormulaA1 = $"SUM(E{headerRow1 + 1}:E{r1 - 1})";
        wsSummary.Cell(r1, 5).Style.NumberFormat.Format = CurrencyFormat;
        wsSummary.Cell(r1, 6).FormulaA1 = $"SUM(F{headerRow1 + 1}:F{r1 - 1})";
        wsSummary.Cell(r1, 6).Style.NumberFormat.Format = CurrencyFormat;
        wsSummary.Cell(r1, 7).FormulaA1 = $"SUM(G{headerRow1 + 1}:G{r1 - 1})";
        wsSummary.Cell(r1, 7).Style.NumberFormat.Format = CurrencyFormat;
        wsSummary.Cell(r1, 8).Value = 1.0;
        wsSummary.Cell(r1, 8).Style.NumberFormat.Format = PercentFormat;
        wsSummary.Range(r1, 1, r1, 8).Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.FromHtml("#f1f5f9"));

        // Viền bảng 1
        wsSummary.Range(headerRow1, 1, r1, 8).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);

        // ── Bảng 2: Doanh thu theo từng ngày trong kỳ ──────────────────────
        var table2Start = r1 + 3;
        wsSummary.Cell(table2Start, 1).Value = "2. DOANH THU THEO TỪNG NGÀY TRONG KỲ (XU HƯỚNG NGÀY THƯỜNG VS CUỐI TUẦN)";
        wsSummary.Cell(table2Start, 1).Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(XLColor.FromHtml("#1e3a8a"));

        var headerRow2 = table2Start + 1;
        string[] headers2 = ["Ngày", "Thứ", "Cuối tuần", "Lượt đặt", "Tiền sân", "Tiền dịch vụ", "Tổng doanh thu"];
        for (var i = 0; i < headers2.Length; i++)
        {
            var cell = wsSummary.Cell(headerRow2, i + 1);
            cell.Value = headers2[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#0f766e"));
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        var r2 = headerRow2 + 1;
        foreach (var day in data.DailyTimeline)
        {
            wsSummary.Cell(r2, 1).Value = day.Date.ToString(DateFormat);
            wsSummary.Cell(r2, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r2, 2).Value = day.DayOfWeekName;
            wsSummary.Cell(r2, 2).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r2, 3).Value = day.IsWeekend ? "Cuối tuần" : "Ngày thường";
            wsSummary.Cell(r2, 3).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            if (day.IsWeekend)
            {
                wsSummary.Cell(r2, 3).Style.Font.SetBold().Font.SetFontColor(XLColor.FromHtml("#b45309"));
            }

            wsSummary.Cell(r2, 4).Value = day.BookingsCount;
            wsSummary.Cell(r2, 4).Style.NumberFormat.Format = NumberFormat;
            wsSummary.Cell(r2, 4).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r2, 5).Value = day.CourtRevenue;
            wsSummary.Cell(r2, 5).Style.NumberFormat.Format = CurrencyFormat;

            wsSummary.Cell(r2, 6).Value = day.ServiceRevenue;
            wsSummary.Cell(r2, 6).Style.NumberFormat.Format = CurrencyFormat;

            wsSummary.Cell(r2, 7).Value = day.TotalRevenue;
            wsSummary.Cell(r2, 7).Style.NumberFormat.Format = CurrencyFormat;
            wsSummary.Cell(r2, 7).Style.Font.SetBold();

            r2++;
        }

        wsSummary.Range(headerRow2, 1, r2 - 1, 7).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);

        // ── Bảng 3: Phân tích khung giờ vàng (Peak hours vs Off-peak) ────────
        var table3Start = r2 + 2;
        wsSummary.Cell(table3Start, 1).Value = "3. DOANH THU THEO KHUNG GIỜ (KHUNG GIỜ VÀNG VS GIỜ THẤP ĐIỂM)";
        wsSummary.Cell(table3Start, 1).Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(XLColor.FromHtml("#1e3a8a"));

        var headerRow3 = table3Start + 1;
        string[] headers3 = ["Khung giờ", "Phân loại", "Lượt đặt", "Doanh thu ước tính"];
        for (var i = 0; i < headers3.Length; i++)
        {
            var cell = wsSummary.Cell(headerRow3, i + 1);
            cell.Value = headers3[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#854d0e"));
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        var r3 = headerRow3 + 1;
        foreach (var slot in data.HourlySlots)
        {
            wsSummary.Cell(r3, 1).Value = slot.HourSlot;
            wsSummary.Cell(r3, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r3, 2).Value = slot.IsPeakHour ? "Khung Giờ Vàng (Peak)" : "Giờ thấp điểm (Off-peak)";
            wsSummary.Cell(r3, 2).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            if (slot.IsPeakHour)
            {
                wsSummary.Cell(r3, 2).Style.Font.SetBold().Font.SetFontColor(XLColor.FromHtml("#b45309"));
            }

            wsSummary.Cell(r3, 3).Value = slot.BookingsCount;
            wsSummary.Cell(r3, 3).Style.NumberFormat.Format = NumberFormat;
            wsSummary.Cell(r3, 3).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsSummary.Cell(r3, 4).Value = slot.Revenue;
            wsSummary.Cell(r3, 4).Style.NumberFormat.Format = CurrencyFormat;
            wsSummary.Cell(r3, 4).Style.Font.SetBold();

            r3++;
        }

        wsSummary.Range(headerRow3, 1, r3 - 1, 4).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
        wsSummary.Columns().AdjustToContents();

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 2: Chi_Tiet_Don_Dat (Detailed Bookings List)
        // ════════════════════════════════════════════════════════════════════════
        var wsDetails = workbook.Worksheets.Add("Chi_Tiet_Don_Dat");
        wsDetails.ShowGridLines = true;

        string[] detailHeaders =
        [
            "Mã đơn hàng", "Chi nhánh", "Khách hàng", "Số điện thoại",
            "Kênh đặt", "Loại đặt", "Ngày chơi", "Khung giờ",
            "Tiền sân", "Tiền dịch vụ", "Giảm giá", "Tổng cộng", "Trạng thái"
        ];

        for (var i = 0; i < detailHeaders.Length; i++)
        {
            var cell = wsDetails.Cell(1, i + 1);
            cell.Value = detailHeaders[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#1e3a8a"));
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        var dr = 2;
        foreach (var item in data.BookingDetails)
        {
            wsDetails.Cell(dr, 1).Value = item.OrderCode;
            wsDetails.Cell(dr, 2).Value = item.BranchName;
            wsDetails.Cell(dr, 3).Value = item.CustomerName;
            wsDetails.Cell(dr, 4).Value = item.CustomerPhone;
            wsDetails.Cell(dr, 5).Value = item.Channel;
            wsDetails.Cell(dr, 6).Value = item.OrderType;
            wsDetails.Cell(dr, 7).Value = item.PlayDate.ToString(DateFormat);
            wsDetails.Cell(dr, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsDetails.Cell(dr, 8).Value = item.TimeSlot;
            wsDetails.Cell(dr, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            wsDetails.Cell(dr, 9).Value = item.CourtPrice;
            wsDetails.Cell(dr, 9).Style.NumberFormat.Format = CurrencyFormat;

            wsDetails.Cell(dr, 10).Value = item.ServicePrice;
            wsDetails.Cell(dr, 10).Style.NumberFormat.Format = CurrencyFormat;

            wsDetails.Cell(dr, 11).Value = item.DiscountAmount;
            wsDetails.Cell(dr, 11).Style.NumberFormat.Format = CurrencyFormat;

            wsDetails.Cell(dr, 12).Value = item.TotalAmount;
            wsDetails.Cell(dr, 12).Style.NumberFormat.Format = CurrencyFormat;
            wsDetails.Cell(dr, 12).Style.Font.SetBold();

            wsDetails.Cell(dr, 13).Value = item.Status;
            wsDetails.Cell(dr, 13).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            dr++;
        }

        if (dr > 2)
        {
            wsDetails.Range(1, 1, dr - 1, detailHeaders.Length).SetAutoFilter();
            wsDetails.Range(1, 1, dr - 1, detailHeaders.Length).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
        }

        wsDetails.Columns().AdjustToContents();

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return memoryStream.ToArray();
    }
}


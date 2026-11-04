using CourtBooking.Application.Features.V1.Analytics.Reports.Models;
using CourtBooking.Application.Features.V1.Analytics.Reports.Services;

namespace CourtBooking.Infrastructure.Analytics.Reports;

public sealed class ReportGeneratorService : IReportGeneratorService
{
    public byte[] GenerateRevenuePdf(CourtOwnerRevenueReportData data)
    {
        return QuestPdfReportGenerator.Generate(data);
    }

    public byte[] GenerateRevenueExcel(CourtOwnerRevenueReportData data)
    {
        return ClosedXmlReportGenerator.Generate(data);
    }
}


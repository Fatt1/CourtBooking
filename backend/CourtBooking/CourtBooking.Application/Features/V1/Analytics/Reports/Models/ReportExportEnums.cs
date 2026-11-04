namespace CourtBooking.Application.Features.V1.Analytics.Reports.Models;

public enum ReportExportFormat
{
    Pdf = 0,
    Excel = 1
}

public enum ReportExportStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3
}


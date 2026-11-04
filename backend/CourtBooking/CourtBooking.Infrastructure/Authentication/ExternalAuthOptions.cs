namespace CourtBooking.Infrastructure.Authentication;

public sealed class ExternalAuthOptions
{
    public const string SectionName = "Authentication";

    public GoogleOptions Google { get; set; } = new();
    public FacebookOptions Facebook { get; set; } = new();
}

public sealed class GoogleOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public sealed class FacebookOptions
{
    public string AppId { get; set; } = string.Empty;
    public string AppSecret { get; set; } = string.Empty;
}

using MediatR;

namespace CourtBooking.Application.Features.V1.Storages.Events.AttachImages;

public sealed record AttachImagesEvent : INotification
{
    public IReadOnlyList<Guid> ImageIds { get; }

    public AttachImagesEvent(IReadOnlyList<Guid> imageIds)
    {
        ImageIds = imageIds ?? [];
    }

    public AttachImagesEvent(IEnumerable<Guid> imageIds)
    {
        ImageIds = imageIds?.Distinct().ToList() ?? [];
    }
}

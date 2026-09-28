using MediatR;

namespace CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;

public sealed record DeleteImagesEvent : INotification
{
    public IReadOnlyList<Guid> ImageIds { get; }
    public DeleteImagesEvent(IReadOnlyList<Guid> imageIds)
    {
        ImageIds = imageIds ?? [];
    }
    public DeleteImagesEvent(IEnumerable<Guid> imageIds)
    {
        ImageIds = imageIds?.Distinct().ToList() ?? [];
    }
}

using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Abstractions.Authorization;

public interface IBranchAuthorizationService
{
    Task<bool> IsOwnerAsync(Guid branchId, CancellationToken cancellationToken = default);
    Task<bool> IsOwnerOfAllAsync(IEnumerable<Guid> branchIds, CancellationToken cancellationToken = default);
    Task<Result> EnsureOwnerAsync(Guid branchId, CancellationToken cancellationToken = default);
    Task<Result> EnsureOwnerOfAllAsync(IEnumerable<Guid> branchIds, CancellationToken cancellationToken = default);
}

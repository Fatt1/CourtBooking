using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.SubmitPaymentProof;

public class SubmitPaymentProofCommandHandler(IApplicationDbContext applicationDbContext, IPublisher publisher) : ICommandHandler<SubmitPaymentProofCommand>
{
    public async Task<Result> Handle(SubmitPaymentProofCommand request, CancellationToken cancellationToken)
    {
        var order = await applicationDbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));

        }


        order.PendingConfirmOrder();
        order.AddPaymentTransaction(order.TotalAmount, Domain.Enums.PaymentMethod.QrTransfer, request.ImageId, Domain.Enums.PaymentTransactionType.Payment);
        await applicationDbContext.SaveChangesAsync(cancellationToken);

        await publisher.Publish(new AttachImagesEvent(new List<Guid> { request.ImageId }), cancellationToken);
        return Result.Success();


    }
}

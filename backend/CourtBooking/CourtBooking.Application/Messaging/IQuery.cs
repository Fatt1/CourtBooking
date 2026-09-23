using CourtBooking.SharedKernel;
using MediatR;

namespace CourtBooking.Application.Messaging;


/// <summary>Read-only query that returns a typed value.</summary>
public interface IQuery<TResponse> : IRequest<Result<TResponse>>;

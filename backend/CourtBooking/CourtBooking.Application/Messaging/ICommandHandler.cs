
using CourtBooking.SharedKernel;
using MediatR;

namespace CourtBooking.Application.Messaging;

/// <summary>Handler for a command that returns no value.</summary>
public interface ICommandHandler<TCommand>
    : IRequestHandler<TCommand, Result>
    where TCommand : ICommand;

/// <summary>Handler for a command that returns a typed value.</summary>
public interface ICommandHandler<TCommand, TResponse>
    : IRequestHandler<TCommand, Result<TResponse>>
    where TCommand : ICommand<TResponse>;


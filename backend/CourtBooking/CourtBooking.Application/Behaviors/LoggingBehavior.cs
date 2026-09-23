using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.Extensions.Logging;
using Serilog.Context;

namespace CourtBooking.Application.Behaviors;

/// <summary>
/// Logging behaviors for Commands and Queries — grouped in one file following the decorator pattern.
/// MediatR routes each behavior only to the matching request type via the generic constraints.
/// </summary>
internal static class LoggingBehaviors
{
    internal sealed class CommandHandler<TCommand, TResponse>(
        ILogger<CommandHandler<TCommand, TResponse>> logger)
        : IPipelineBehavior<TCommand, Result<TResponse>>
        where TCommand : ICommand<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TCommand command,
            RequestHandlerDelegate<Result<TResponse>> next,
            CancellationToken cancellationToken)
        {
            string commandName = typeof(TCommand).Name;

            logger.LogInformation("Processing command {Command}", commandName);

            Result<TResponse> result = await next(cancellationToken);

            if (result.IsSuccess)
            {
                logger.LogInformation("Completed command {Command}", commandName);
            }
            else
            {
                using (LogContext.PushProperty("Error", result.Error, destructureObjects: true))
                {
                    logger.LogError("Completed command {Command} with error", commandName);
                }
            }

            return result;
        }
    }

    internal sealed class QueryHandler<TQuery, TResponse>(
        ILogger<QueryHandler<TQuery, TResponse>> logger)
        : IPipelineBehavior<TQuery, Result<TResponse>>
        where TQuery : IQuery<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TQuery query,
            RequestHandlerDelegate<Result<TResponse>> next,
            CancellationToken cancellationToken)
        {
            string queryName = typeof(TQuery).Name;

            logger.LogInformation("Processing query {Query}", queryName);

            Result<TResponse> result = await next(cancellationToken);

            if (result.IsSuccess)
            {
                logger.LogInformation("Completed query {Query}", queryName);
            }
            else
            {
                using (LogContext.PushProperty("Error", result.Error, destructureObjects: true))
                {
                    logger.LogError("Completed query {Query} with error", queryName);
                }
            }

            return result;
        }
    }
}

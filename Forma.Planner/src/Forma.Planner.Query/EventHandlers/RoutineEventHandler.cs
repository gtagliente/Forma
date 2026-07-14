using System.Threading;
using System.Threading.Tasks;
using System;
using AutoMapper;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreInfrastructure.Caching;
using Forma.Domain.Entities.RoutineAggregate.Events;
using Forma.Query.Abstractions;
using Forma.Query.QueriesModel;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Forma.Query.EventHandlers;

public class RoutineEventHandler(
    IMapper mapper,
    ISynchronizeDb synchronizeDb,
    ICacheService cacheService,
    ILogger<RoutineEventHandler> logger) :
    INotificationHandler<RoutineCreatedEvent>
{
    public async Task Handle(RoutineCreatedEvent notification, CancellationToken cancellationToken)
    {
        LogEvent(notification);

        var routineQueryModel = mapper.Map<RoutineQueryModel>(notification);
        await synchronizeDb.UpsertAsync(routineQueryModel, filter => filter.Id == notification.AggregateId);
        await ClearCacheAsync(notification.OwnerId);
    }

    private async Task ClearCacheAsync(Guid ownerId)
    {
        var cacheKeys = new[] { RoutineCacheKeys.ForUser(ownerId) };
        await cacheService.RemoveAsync(cacheKeys);
    }

    private void LogEvent<TEvent>(TEvent @event) where TEvent : class =>
        logger.LogInformation("----- Triggering the event {EventName}, model: {EventModel}", typeof(TEvent).Name, @event.ToString());
}

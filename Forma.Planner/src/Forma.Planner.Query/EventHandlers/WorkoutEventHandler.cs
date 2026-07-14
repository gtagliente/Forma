using System.Threading;
using System.Threading.Tasks;
using System;
using AutoMapper;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreInfrastructure.Caching;
using Forma.Domain.Entities.WorkoutAggregate.Events;
using Forma.Query.Abstractions;
using Forma.Query.QueriesModel;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Forma.Query.EventHandlers;

public class WorkoutEventHandler(
    IMapper mapper,
    ISynchronizeDb synchronizeDb,
    ICacheService cacheService,
    ILogger<WorkoutEventHandler> logger) :
    INotificationHandler<WorkoutCreatedEvent>,
    INotificationHandler<WorkoutVersionCreatedEvent>
{
    public async Task Handle(WorkoutCreatedEvent notification, CancellationToken cancellationToken)
    {
        LogEvent(notification);

        var workoutQueryModel = mapper.Map<WorkoutQueryModel>(notification);
        await synchronizeDb.UpsertAsync(workoutQueryModel, filter => filter.Id == notification.AggregateId);
        await ClearCacheAsync(notification.OwnerId);
    }

    public async Task Handle(WorkoutVersionCreatedEvent notification, CancellationToken cancellationToken)
    {
        LogEvent(notification);

        var workoutQueryModel = mapper.Map<WorkoutQueryModel>(notification);
        await synchronizeDb.UpsertAsync(workoutQueryModel, filter => filter.Id == notification.AggregateId);
        await ClearCacheAsync(notification.OwnerId);
    }

    private async Task ClearCacheAsync(Guid ownerId)
    {
        var cacheKeys = new[] { WorkoutCacheKeys.ForUser(ownerId) };
        await cacheService.RemoveAsync(cacheKeys);
    }

    private void LogEvent<TEvent>(TEvent @event) where TEvent : class =>
        logger.LogInformation("----- Triggering the event {EventName}, model: {EventModel}", typeof(TEvent).Name, @event.ToString());
}

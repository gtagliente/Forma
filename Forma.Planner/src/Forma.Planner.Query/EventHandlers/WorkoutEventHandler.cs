using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Forma.CoreInfrastructure.Abstractions;
using Forma.Domain.Entities.WorkoutAggregate.Events;
using Forma.Query.Abstractions;
using Forma.Query.Application.Workout.Queries;
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
        await ClearCacheAsync();
    }

    public async Task Handle(WorkoutVersionCreatedEvent notification, CancellationToken cancellationToken)
    {
        LogEvent(notification);

        var workoutQueryModel = mapper.Map<WorkoutQueryModel>(notification);
        await synchronizeDb.UpsertAsync(workoutQueryModel, filter => filter.Id == notification.AggregateId);
        await ClearCacheAsync();
    }

    private async Task ClearCacheAsync()
    {
        var cacheKeys = new[] { nameof(GetAllWorkoutQuery) };
        await cacheService.RemoveAsync(cacheKeys);
    }

    private void LogEvent<TEvent>(TEvent @event) where TEvent : class =>
        logger.LogInformation("----- Triggering the event {EventName}, model: {EventModel}", typeof(TEvent).Name, @event.ToString());
}

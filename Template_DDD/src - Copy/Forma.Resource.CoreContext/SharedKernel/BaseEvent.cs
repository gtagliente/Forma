using System;
using MediatR;

namespace Forma.CoreContext.SharedKernel;

/// <summary>
/// Represents a base event.
/// </summary>
public abstract class BaseEvent :INotification
{
    /// <summary>
    /// Gets the type of the message.
    /// </summary>
    public string MessageType { get; protected init; }

    /// <summary>
    /// Gets the event ID.
    /// </summary>
    public Guid Id { get; protected init; }

    /// <summary>
    /// Gets the aggregate ID.
    /// </summary>
    public Guid AggregateId { get; protected init; }

    /// <summary>
    /// Gets the date and time when the event occurred.
    /// </summary>
    public DateTime OccurredOn { get; private init; } = DateTime.Now;
}
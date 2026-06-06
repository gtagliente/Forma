using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Forma.CoreContext.SharedKernel;

/// <summary>
/// Represents an abstract base entity class.
/// </summary>
public abstract class BaseEntity<TKey> : IBaseEntity,IEntity<TKey>
     where TKey : IEquatable<TKey>
{
    private readonly List<BaseEvent> _domainEvents = [];

    /// <summary>
    /// Initializes a new instance of the <see cref="BaseEntity"/> class.
    /// </summary>
    protected BaseEntity() => Id = default;

    /// <summary>
    /// Initializes a new instance of the <see cref="BaseEntity"/> class with the specified identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity.</param>
    protected BaseEntity(TKey id) => Id = id;

    [Timestamp]
    public byte[] RowVersion { get; set; } = new byte[0];

    /// <summary>
    /// Gets the domain events associated with this entity.
    /// </summary>
    public IReadOnlyCollection<BaseEvent> DomainEvents =>
        _domainEvents.AsReadOnly();

    /// <summary>
    /// Gets the unique identifier of this entity.
    /// </summary>
    public TKey Id { get; private init; }

    /// <summary>
    /// Adds a domain event to the entity.
    /// </summary>
    /// <param name="domainEvent">The domain event to add.</param>
    protected void AddDomainEvent(BaseEvent domainEvent) =>
        _domainEvents.Add(domainEvent);

    /// <summary>
    /// Clears all the domain events associated with this entity.
    /// </summary>
    public void ClearDomainEvents() =>
        _domainEvents.Clear();
}
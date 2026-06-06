using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Forma.CoreInfrastructure.Abstractions;

/// <summary>
/// Represents a repository for storing events in an event store.
/// </summary>
public interface IEventStoreRepository<TEvent> : IDisposable
{
    /// <summary>
    /// Stores a collection of event stores asynchronously.
    /// </summary>
    /// <param name="eventStores">The event stores to store.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task StoreAsync(IEnumerable<TEvent> eventStores);
}
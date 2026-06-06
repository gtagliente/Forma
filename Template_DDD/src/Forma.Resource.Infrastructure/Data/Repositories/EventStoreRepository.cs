using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreContext.SharedKernel;
using Forma.Infrastructure.Data.Context;

namespace Forma.Infrastructure.Data.Repositories;

internal sealed class EventStoreRepository(EventStoreDbContext dbContext) : IEventStoreRepository<EventStore>
{
    public async Task StoreAsync(IEnumerable<EventStore> eventStores)
    {
        await dbContext.EventStores.AddRangeAsync(eventStores);
        await dbContext.SaveChangesAsync();
    }

    #region IDisposable

    // To detect redundant calls.
    private bool _disposed;

    // Public implementation of Dispose pattern callable by consumers.
    ~EventStoreRepository() => Dispose(false);

    // Public implementation of Dispose pattern callable by consumers.
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    // Protected implementation of Dispose pattern.
    private void Dispose(bool disposing)
    {
        if (_disposed)
            return;

        // Dispose managed state (managed objects).
        if (disposing)
            dbContext.Dispose();

        _disposed = true;
    }

    #endregion
}
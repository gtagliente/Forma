using System;
using System.Threading;
using System.Threading.Tasks;

namespace Forma.CoreContext.SharedKernel;

public interface IDomainEventDispatcher{
    Task DispatchAsync(BaseEvent domainEvent, CancellationToken ct = default);
}
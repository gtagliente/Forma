using System.Collections.Generic;

namespace Forma.CoreContext.SharedKernel;

public interface IBaseEntity
{
    IReadOnlyCollection<BaseEvent> DomainEvents { get; }

    void ClearDomainEvents();
}
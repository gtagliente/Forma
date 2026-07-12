namespace Forma.CoreContext.SharedKernel;

public interface IDomainEventNotification<TDomainEvent> {
    public TDomainEvent DomainEvent { get; }
}
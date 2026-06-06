using MediatR;

namespace Forma.CoreInfrastructure.Abstractions;
public interface IMediatorEventDispatcher
{
    IMediator Mediator { get; }
}

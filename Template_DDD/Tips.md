--1) Eliminata dipendence da EF Core in Forma.Core

--2) Strongly Typed Id

--3) Spostati i factory methods nell'entit�
(incapsulamento, open/closed Principle)

--4) Creare DTO per mappare le entit� di dominio verso le entit� di persistenza

--5) per chiarezza semantica, � preferibile nominare e separare i contratti in base all'intento, non in base al meccanismo (No contratti repositories nel domain)

--6) Split di Forma.Core in Forma.CoreContext e Forma.CoreInfrastructre (Core di dominio e core tecnico)

--7) Eliminazione di dipendenza da Mediator sul BaseEvent di Forma.CoreContext
(Adapter patter, bridge pattern, interface segregation principle)

--8) Notification e Dispatcher: inseriti contratti su Forma.CoreContext e Forma.CoreInfrastructre per principio Interface segregation. Implementazione Notification e Dispatcher su Forma.Infrastructure (MediatorDomainEventNotification (Adapter (Wrapper)) , MediatorDomainEventDispatcher(Bridge, mediator, Strategy))

If later you use change events or outbox pattern,
repositories can publish BaseEvents captured in your aggregates after SaveChangesAsync().
That�s when your Unit of Work becomes the event dispatcher boundary.




-- Next question:
So, is it correct to have in the Forma.Core the interfaces for IWriteOnlyRepository and IEventStoreRepository?
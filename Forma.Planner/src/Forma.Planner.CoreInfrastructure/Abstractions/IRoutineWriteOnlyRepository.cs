using System;

namespace Forma.CoreInfrastructure.Abstractions;

public interface IRoutineWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>
    where TKey : IEquatable<TKey>;

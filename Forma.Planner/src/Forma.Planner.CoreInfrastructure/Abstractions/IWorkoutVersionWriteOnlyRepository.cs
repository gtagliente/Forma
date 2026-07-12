using System;

namespace Forma.CoreInfrastructure.Abstractions;

public interface IWorkoutVersionWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>
    where TKey : IEquatable<TKey>;

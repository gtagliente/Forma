using System;

namespace Forma.CoreInfrastructure.Abstractions;

public interface IWorkoutWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>
    where TKey : IEquatable<TKey>;

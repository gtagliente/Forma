using System;
using System.Threading.Tasks;


namespace Forma.CoreInfrastructure.Abstractions;

public interface IExerciseWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>
    where TKey : IEquatable<TKey>
{
    Task<bool> IsUniqueAsync(string name);

    Task<bool> IsUniqueExerciseResourceLinkAsync(string link);
}

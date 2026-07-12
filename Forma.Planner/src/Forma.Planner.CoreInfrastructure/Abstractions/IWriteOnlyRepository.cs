using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Forma.CoreInfrastructure.Abstractions;

/// <summary>
/// Represents a repository that allows write-only operations on entities.
/// </summary>
/// <typeparam name="TEntity">The type of entity.</typeparam>
/// <typeparam name="TKey">The type of the entity's key.</typeparam>
public interface IWriteOnlyRepository<TEntity, in TKey> : IDisposable
    //where TEntity : IEntity<TKey>
    where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Adds a new entity to the repository.
    /// </summary>
    /// <param name="entity">The entity to add.</param>
    void Add(TEntity entity);

    /// <summary>
    /// Updates an existing entity in the repository.
    /// </summary>
    /// <param name="entity">The entity to update.</param>
    void Update(TEntity entity);

    /// <summary>
    /// Tracks a single scalar property on an existing, currently-untracked entity as Modified,
    /// without touching any of its navigation collections. Use this instead of <see cref="Update"/>
    /// when a root aggregate's own scalar changed *and* a new child was separately added via its
    /// own repository — <see cref="Update"/>'s whole-graph walk would otherwise misclassify the
    /// new child (if its key is already non-default, e.g. client-generated) as Modified rather
    /// than Added.
    /// </summary>
    /// <param name="entity">The entity carrying the already-changed value.</param>
    /// <param name="property">The single scalar property to persist.</param>
    void MarkModified<TProperty>(TEntity entity, Expression<Func<TEntity, TProperty>> property);

    /// <summary>
    /// Removes an entity from the repository.
    /// </summary>
    /// <param name="entity">The entity to remove.</param>
    void Remove(TEntity entity);

    /// <summary>
    /// Retrieves an entity by its ID asynchronously.
    /// </summary>
    /// <param name="id">The ID of the entity to retrieve.</param>
    /// <returns>The retrieved entity.</returns>
    Task<TEntity> GetByIdAsync(TKey id);
}
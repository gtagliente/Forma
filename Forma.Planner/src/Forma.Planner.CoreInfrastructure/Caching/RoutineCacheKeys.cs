using System;

namespace Forma.CoreInfrastructure.Caching;

/// <summary>
/// Builds the per-user cache key used for the Routine <c>GetAll</c> query result. Kept here
/// (rather than in <c>Forma.Query</c>, where <c>GetAllRoutineQuery</c> actually lives) so both
/// <c>Forma.Application</c> and <c>Forma.Query</c> can reference it without a new project
/// dependency in either direction.
/// </summary>
public static class RoutineCacheKeys
{
    // Kept as a literal rather than nameof(GetAllRoutineQuery) because that type lives in
    // Forma.Query, which this project must not depend on (wrong dependency direction for a
    // shared-kernel-tier project). Guaranteed identical to the previous nameof-produced string.
    private const string QueryName = "GetAllRoutineQuery";

    public static string ForUser(Guid? userId) => $"{QueryName}:{userId}";
}

using System;

namespace Forma.CoreInfrastructure.Abstractions;

/// <summary>
/// Exposes the identity of the authenticated caller, derived from the validated JWT bearer
/// token (see ADR-007 in the orchestrator repo). Controllers and MediatR command/query handlers
/// use this instead of reading <c>ClaimsPrincipal</c> directly.
/// </summary>
public interface ICurrentUserAccessor
{
    /// <summary>
    /// The authenticated user's id, parsed from the token's <c>sub</c> claim. <c>null</c> when
    /// there is no authenticated user — never coalesced to <see cref="Guid.Empty"/>.
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// Whether the current request carries a validated identity.
    /// </summary>
    bool IsAuthenticated { get; }
}

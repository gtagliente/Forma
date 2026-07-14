using System;
using System.Diagnostics.CodeAnalysis;
using Forma.CoreInfrastructure.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Forma.PublicApi.Services;

[ExcludeFromCodeCoverage]
public sealed class CurrentUserAccessor(IHttpContextAccessor httpContextAccessor) : ICurrentUserAccessor
{
    public Guid? UserId
    {
        get
        {
            // MapInboundClaims = false keeps the raw "sub" claim as issued rather than ASP.NET
            // Core's legacy remap to a ClaimTypes.NameIdentifier URI (ADR-007).
            var subClaim = httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

            return Guid.TryParse(subClaim, out var userId) ? userId : null;
        }
    }

    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}

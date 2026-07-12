using System;
using System.ComponentModel.DataAnnotations;
using System.Net.Mime;
using System.Threading.Tasks;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Forma.Application.ExerciseUsage.Queries;
using Forma.PublicApi.Extensions;
using Forma.PublicApi.Models;
using Forma.PublicApi.Filters.Exceptions;

namespace Forma.PublicApi.Controllers.V1;

/// <summary>
/// Internal, service-to-service only — not part of the public/user-facing surface.
/// Backs ADR-006 Rule 2 (Forma.Claude/docs/architecture/adr/ADR-006-cross-service-reference-integrity.md):
/// exercise-service calls this, fail-closed, before allowing an Exercise delete.
/// Unauthenticated for now — a deliberate, tracked deferral until identity-service exists
/// (see Forma.Claude/docs/architecture/integration-patterns.md, "Security note").
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/internal/[controller]")]
[TypeFilter<DomainExceptionToActionResultFilter>]
public class ExerciseReferencesController(IMediator mediator) : ControllerBase
{
    ////////////////////////////////////////////////
    // GET: /api/internal/exercisereferences/IsReferenced
    ////////////////////////////////////////////////

    /// <summary>
    /// Whether any Workout's current version references the given Exercise Id.
    /// </summary>
    /// <response code="200">Returns whether the Exercise is currently referenced.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpGet(nameof(IsReferenced))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> IsReferenced([FromQuery][Required] Guid exerciseId) =>
        (await mediator.Send(new IsExerciseReferencedQuery(exerciseId))).ToActionResult();
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Net.Mime;
using System.Threading.Tasks;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Forma.Application.Workout.Commands;
using Forma.Application.Workout.Responses;
using Forma.PublicApi.Extensions;
using Forma.PublicApi.Models;
using Forma.Query.Application.Workout.Queries;
using Forma.Query.QueriesModel;
using Forma.PublicApi.Filters.Exceptions;

namespace Forma.PublicApi.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/[controller]")]
[TypeFilter<DomainExceptionToActionResultFilter>]
public class WorkoutsController(IMediator mediator) : ControllerBase
{
    ////////////////////////
    // POST: /api/workouts/Create
    ////////////////////////

    /// <summary>
    /// Creates a new Workout with its first version.
    /// </summary>
    /// <response code="201">Returns the Id of the new workout.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpPost(nameof(Create))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse<CreatedWorkoutResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create([FromBody][Required] CreateWorkoutCommand command) =>
        (await mediator.Send(command)).ToActionResult();

    //////////////////////
    // GET: /api/workouts/GetAll
    //////////////////////

    /// <summary>
    /// Gets all Workouts owned by the requesting user.
    /// </summary>
    /// <response code="200">Returns the list of workouts.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpGet(nameof(GetAll))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<WorkoutQueryModel>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll([FromQuery][Required] Guid requestingUserId) =>
        (await mediator.Send(new GetAllWorkoutQuery(requestingUserId))).ToActionResult();

    ////////////////////////////////////
    // POST: /api/workouts/AddNewVersion
    ////////////////////////////////////

    /// <summary>
    /// Creates a new version of an existing Workout (ADR-002: editing creates a new immutable
    /// version rather than mutating the existing one in place).
    /// </summary>
    /// <response code="200">Returns the response with the success message.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="403">When the caller is not the Workout's owner.</response>
    /// <response code="404">When no workout is found by the given Id.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpPost(nameof(AddNewVersion))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> AddNewVersion([FromBody][Required] AddWorkoutVersionCommand command) =>
        (await mediator.Send(command)).ToActionResult();
}

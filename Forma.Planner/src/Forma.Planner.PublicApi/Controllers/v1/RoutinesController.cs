using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Net.Mime;
using System.Threading.Tasks;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Forma.Application.Routine.Commands;
using Forma.Application.Routine.Responses;
using Forma.PublicApi.Extensions;
using Forma.PublicApi.Models;
using Forma.Query.Application.Routine.Queries;
using Forma.Query.QueriesModel;
using Forma.PublicApi.Filters.Exceptions;

namespace Forma.PublicApi.Controllers.V1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/[controller]")]
[TypeFilter<DomainExceptionToActionResultFilter>]
public class RoutinesController(IMediator mediator) : ControllerBase
{
    ////////////////////////
    // POST: /api/routines/Create
    ////////////////////////

    /// <summary>
    /// Creates a new Routine referencing one or more Workouts.
    /// </summary>
    /// <response code="201">Returns the Id of the new routine.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpPost(nameof(Create))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse<CreatedRoutineResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create([FromBody][Required] CreateRoutineCommand command) =>
        (await mediator.Send(command)).ToActionResult();

    //////////////////////
    // GET: /api/routines/GetAll
    //////////////////////

    /// <summary>
    /// Gets all Routines owned by the requesting user.
    /// </summary>
    /// <response code="200">Returns the list of routines.</response>
    /// <response code="400">Returns list of errors if the request is invalid.</response>
    /// <response code="500">When an unexpected internal error occurs on the server.</response>
    [HttpGet(nameof(GetAll))]
    [Consumes(MediaTypeNames.Application.Json)]
    [Produces(MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoutineQueryModel>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll([FromQuery][Required] Guid requestingUserId) =>
        (await mediator.Send(new GetAllRoutineQuery(requestingUserId))).ToActionResult();
}

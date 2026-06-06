using System;
using System.Collections.Generic;
using Forma.CoreContext.SharedKernel.Exceptions;
using Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;
using Forma.PublicApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace Forma.PublicApi.Services.Factories;


public static class DomainExceptionToActionResultFactory
{
    private static readonly Dictionary<Type, Func<IEnumerable<ApiErrorResponse>, IActionResult>> _mapping =    [];


    public static Func<IEnumerable<ApiErrorResponse>, IActionResult> TryGetValue(Exception exception)
    {
        if (!(exception is IDomainExceptionMarker))
            return null;
        return TryGetValue((IDomainExceptionMarker)exception);
    }

    private static void Register<TException>(
    Func<IEnumerable<ApiErrorResponse>, IActionResult> factory)
    where TException : IDomainExceptionMarker
    {
        _mapping.Add(typeof(TException), factory);
    }

    private static Func<IEnumerable<ApiErrorResponse>, IActionResult> TryGetValue(IDomainExceptionMarker exception)
    {
        var exceptionType = exception.GetType();
        if (_mapping.TryGetValue(exceptionType, out var factory))
        {
            return factory;
        }
        return null;
    }


    static DomainExceptionToActionResultFactory()
    {
        Register<DomainArgumentException>(message =>
            new BadRequestObjectResult(ApiResponse.BadRequest(message)));

        Register<DomainBadCodeException>(message =>
            new NotFoundObjectResult(ApiResponse.InternalServerError(message)));

        //Register<InvalidOperationException>(message =>
        //    new ConflictObjectResult(ApiResponse.BadRequest(message)));
    }
}

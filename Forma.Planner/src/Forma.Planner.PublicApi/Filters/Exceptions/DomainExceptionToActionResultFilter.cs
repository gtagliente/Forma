using System;
using System.Collections.Generic;
using System.Net.Mime;
using Ardalis.Result;
using Forma.PublicApi.Models;
using Forma.PublicApi.Services.Factories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Hosting;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Forma.PublicApi.Filters.Exceptions;

public class DomainExceptionToActionResultFilter : IExceptionFilter
{
    private readonly IHostEnvironment _hostEnvironment;

    public DomainExceptionToActionResultFilter(IHostEnvironment hostEnvironment) =>
        _hostEnvironment = hostEnvironment;

    public void OnException(ExceptionContext context)
    {
        var actionDelegate = DomainExceptionToActionResultFactory.TryGetValue(context.Exception);

        if (actionDelegate == null)
            return;
        
        context.Result = actionDelegate([new (context.Exception.Message)]);

    }

}

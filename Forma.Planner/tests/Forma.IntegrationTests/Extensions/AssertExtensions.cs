using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Forma.Application.Exercise.Responses;
using Forma.CoreInfrastructure.Extensions;
using Forma.PublicApi.Models;
using Microsoft.AspNetCore.Http;

namespace Forma.IntegrationTests.Extensions;

public static class AssertExtensions
{
    public static async Task<ApiResponse<T>> Check201HttpResponseAsync<T>(this HttpResponseMessage response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.IsSuccessStatusCode.Should().BeTrue();
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var responseContent = (await response.Content.ReadAsStringAsync()).FromJson<ApiResponse<T>>();
        responseContent.Check201HttpResponseContent();
        return responseContent;

    }

    private static void Check201HttpResponseContent<T>(this ApiResponse<T> response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.Success.Should().BeTrue();
        response.StatusCode.Should().Be(StatusCodes.Status201Created);
        response.Errors.Should().BeEmpty();
        response.Result.Should().NotBeNull();
    }


    public static async Task<ApiResponse<T>> Check400HttpResponseAsync<T>(this HttpResponseMessage response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.IsSuccessStatusCode.Should().BeFalse();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = (await response.Content.ReadAsStringAsync()).FromJson<ApiResponse<T>>();
        responseContent.Check400HttpResponseContent();
        return responseContent;

    }

    private static void Check400HttpResponseContent<T>(this ApiResponse<T> response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.Success.Should().BeFalse();
        response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        response.Result.Should().BeNull();
        response.Errors.Should().NotBeNullOrEmpty();
    }



    public static async Task<ApiResponse<T>> Check404HttpResponseAsync<T>(this HttpResponseMessage response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.IsSuccessStatusCode.Should().BeFalse();
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var responseContent = (await response.Content.ReadAsStringAsync()).FromJson<ApiResponse<T>>();
        responseContent.Check404HttpResponseContent();
        return responseContent;

    }

    private static void Check404HttpResponseContent<T>(this ApiResponse<T> response)
    {
        // Assert (HTTP)
        response.Should().NotBeNull();
        response.Success.Should().BeFalse();
        response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        response.Result.Should().BeNull();
        response.Errors.Should().NotBeNullOrEmpty();
    }
}

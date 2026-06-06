using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mime;
using System.Text;
using System.Threading.Tasks;
using Azure;
using Bogus;
using Bogus.DataSets;
using FluentAssertions;
using Forma.Application.Exercise.Commands;
using Forma.Application.Exercise.Responses;
using Forma.CoreInfrastructure.Extensions;
using Forma.Domain.Entities.ExerciseAggregate;
using Forma.Domain.Entities.ExerciseAggregate.ValueObjects;
using Forma.Infrastructure.Data.Context;
using Forma.IntegrationTests.Extensions;
using Forma.IntegrationTests.Infrastructure;
using Forma.PublicApi.Models;
using Forma.Query.Abstractions;
using Forma.Query.Data.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using Xunit.Categories;
using static Forma.IntegrationTests.Extensions.AssertExtensions;

namespace Shop.IntegrationTests.Controllers.V1;

[IntegrationTest]
public class ExercisesControllerTests : BaseIntegrationTest
{
    private const string Endpoint = "/api/exercises";

    //TODO:
    // 1) Validation Uts (with theory for each api endpoint to test all validations in one parametrized method
    // 2) Try Create Exercise Resource with already existing link return 400
    public ExercisesControllerTests(IntegrationTestWebAppFactory factory) : base(factory)
    {
    }

    #region POST: /api/exercises/Create

    [Fact]
    public async Task Should_ReturnsHttpStatus201Created_When_Post_ValidRequest()
    {
        using var httpClient = factory.CreateClient(CreateClientOptions());

        var command = new Faker<CreateExerciseCommand>()
            .RuleFor(command => command.Name, "Pull Up")
            .RuleFor(command => command.Description, faker => faker.Lorem.Sentence(10))
            .RuleFor(command => command.MuscleGroups, faker => new List<MuscleGroup>(){ MuscleGroup.Shoulders, MuscleGroup.Back}.ToArray() )
            .Generate();

        // Act
        using var jsonContent = command.ToJsonHttpContent();
        using var act = await httpClient.PostAsync(string.Concat(Endpoint,"/Create"), jsonContent);

        var response = await act.Check201HttpResponseAsync<CreatedExerciseResponse>();
        response.Result.Id.Should().NotBeEmpty();

        // Assert Location Header
        act.Headers.GetValues("Location").Should().NotBeNullOrEmpty()
            .And.Contain($"/api/exercises/{response.Result.Id}");
    }

    [Fact]
    public async Task Should_ReturnsHttpStatus400_When_Post_ExerciseNameIsNotUnique()
    {
        await WriteDbContextExecuteRawSql(@"
            DELETE FROM Exercise;
            INSERT INTO Exercise (Id,Name,Description,MuscleGroups) VALUES (N'222637A6-CF25-41FB-9432-993622722DD2',N'Pull Up',N'Descr',N'3|1');
        ");
        // Arrange
        //await using var webApplicationFactory = InitializeWebAppFactory();
        using var httpClient = factory.CreateClient(CreateClientOptions());

        var command = new Faker<CreateExerciseCommand>()
            .RuleFor(command => command.Name, "Pull Up")
            .RuleFor(command => command.Description, faker => faker.Lorem.Sentence(10))
            .RuleFor(command => command.MuscleGroups, faker => new List<MuscleGroup>() { MuscleGroup.Shoulders, MuscleGroup.Back }.ToArray())
            .Generate();

        // Act
        using var jsonContent = command.ToJsonHttpContent();
        using var act = await httpClient.PostAsync(string.Concat(Endpoint,"/Create"), jsonContent);

        var response = await act.Check400HttpResponseAsync<CreatedExerciseResponse>();
        response.Errors.SelectMany(e => e.Message).Should().Contain("An exercise with the same name already exists.");

    }

    #endregion

    #region POST: /api/exercises/CreateExerciseResource
    [Fact]
    public async Task CreateExerciseResource_Should_ReturnsHttpStatus201Created_When_Post_ValidRequest()
    {
        await WriteDbContextExecuteRawSql(@"
            DELETE FROM Exercise;
            INSERT INTO Exercise (Id,Name,Description,MuscleGroups) VALUES (N'222637A6-CF25-41FB-9432-993622722DD2',N'Pull Up',N'Descr',N'3|1');
        ");

        using var httpClient = factory.CreateClient(CreateClientOptions());

        var command = new Faker<CreateExerciseResourceCommand>()
            .RuleFor(command => command.ExerciseId, faker=>  new ExerciseId(new Guid("222637A6-CF25-41FB-9432-993622722DD2")))
            .RuleFor(command => command.Title, "Title")
            .RuleFor(command => command.Content, "Content")
            .RuleFor(command => command.Type, ResourceType.Image)
            .RuleFor(command => command.Link, "Link")
            .Generate();

        // Act
        //using var jsonContent = command.ToJsonHttpContent();
        using var jsonContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(command), Encoding.UTF8, MediaTypeNames.Application.Json); 
        using var act = await httpClient.PostAsync(string.Concat(Endpoint, "/CreateExerciseResource"), jsonContent);

        // Assert (HTTP)
        var responseContent = await act.Check201HttpResponseAsync<CreatedExerciseResourceResponse>();

        responseContent.Result.Id.Should().NotBeEmpty();
    }


    [Fact]
    public async Task CreateExerciseResource_Should_ReturnsHttpStatus404NotFound_When_ExerciseNotExits()
    {
        await WriteDbContextExecuteRawSql(@"
            DELETE FROM Exercise;
        ");

        using var httpClient = factory.CreateClient(CreateClientOptions());

        var command = new Faker<CreateExerciseResourceCommand>()
            .RuleFor(command => command.ExerciseId, faker => new ExerciseId(new Guid("222637A6-CF25-41FB-9432-993622722DD2")))
            .RuleFor(command => command.Title, "Title")
            .RuleFor(command => command.Content, "Content")
            .RuleFor(command => command.Type, ResourceType.Image)
            .RuleFor(command => command.Link, "Link")
            .Generate();

        // Act
        //using var jsonContent = command.ToJsonHttpContent();
        using var jsonContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(command), Encoding.UTF8, MediaTypeNames.Application.Json);
        using var act = await httpClient.PostAsync(string.Concat(Endpoint, "/CreateExerciseResource"), jsonContent);

        // Assert (HTTP)
        var responseContent = await act.Check404HttpResponseAsync<CreatedExerciseResourceResponse>();
        responseContent.Errors.SelectMany(e => e.Message).Should().Contain($"Exercise with Id {command.ExerciseId.Value} not found");

    }

    #endregion




    #region Helpers
    private static WebApplicationFactoryClientOptions CreateClientOptions() => new() { AllowAutoRedirect = false };



    #endregion
}
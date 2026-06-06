using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Forma.Infrastructure.Data.Context;
using Forma.Query.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Forma.IntegrationTests.Infrastructure;

public abstract class BaseIntegrationTest: IClassFixture<IntegrationTestWebAppFactory>
{
    protected readonly IntegrationTestWebAppFactory factory;
    protected readonly IServiceScope _scope;
    protected readonly WriteDbContext WriteDbContext;
    protected readonly EventStoreDbContext EventStoreDbContext;
    protected readonly IReadDbContext MongoDbContext;
    protected BaseIntegrationTest(IntegrationTestWebAppFactory factory)
    {
        this.factory = factory;
        _scope = factory.Services.CreateScope();

        WriteDbContext = _scope.ServiceProvider.GetRequiredService<WriteDbContext>();
        EventStoreDbContext = _scope.ServiceProvider.GetRequiredService<EventStoreDbContext>();
    }

    protected async Task WriteDbContextExecuteRawSql(string script)
            => await  WriteDbContext.Database.ExecuteSqlRawAsync(script);
}
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Forma.CoreInfrastructure;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreInfrastructure.AppSettings;
using Forma.Infrastructure.Data.Context;
using Forma.PublicApi.Extensions;
using Forma.Query.Abstractions;
using Forma.Query.Data.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using NSubstitute;
using Testcontainers.MsSql;
using Xunit;

namespace Forma.IntegrationTests.Infrastructure;

public class IntegrationTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public IntegrationTestWebAppFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "IntegrationTesting");
    }
    private readonly MsSqlContainer msSqlContainer = new MsSqlBuilder()
            //La stessa del docker-compose. Da mettere in un file di configurazione condiviso (.env?)   
            .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
            .Build();

    public async Task MsSqlContainerExecuteScript(string script)
    {
        if (msSqlContainer.State == DotNet.Testcontainers.Containers.TestcontainersStates.Running)
            await msSqlContainer.ExecScriptAsync(script);
        else
            throw new Exception($"MsSqlContainer is not in state Running. Acutal State: {msSqlContainer.State}");
    }
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {

        builder.ConfigureServices((context,services) =>
        {
            var config = context.Configuration;
            builder.UseSetting("CacheOptions:AbsoluteExpirationInHours", "1");
            builder.UseSetting("CacheOptions:SlidingExpirationInSeconds", "30");

            //builder.UseEnvironment("Testing");

            // Configure test services here
            services.RemoveAll<DbConnection>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<WriteDbContext>();
            services.RemoveAll<DbContextOptions<WriteDbContext>>();
            services.RemoveAll<EventStoreDbContext>();
            services.RemoveAll<DbContextOptions<EventStoreDbContext>>();
            services.RemoveAll<NoSqlDbContext>();
            services.RemoveAll<ISynchronizeDb>();

            services.AddDbContextPool<WriteDbContext>(options =>
            {
                options.UseSqlServer(msSqlContainer.GetConnectionString());
            });

            services.AddDbContextPool<EventStoreDbContext>(options =>
            {
                options.UseSqlServer(msSqlContainer.GetConnectionString());
            });

            services
               .AddSingleton(_ => Substitute.For<IReadDbContext>())
               .AddSingleton(_ => Substitute.For<ISynchronizeDb>());

        });

    }
    public Task InitializeAsync()
    {
        return msSqlContainer.StartAsync();
    }

    public new Task DisposeAsync()
    {
        return msSqlContainer.StopAsync();
    }
}

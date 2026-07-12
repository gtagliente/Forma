using System.Net.Http;
using System.Net.Mime;
using System.Text;
using Forma.CoreInfrastructure.Extensions;

namespace Forma.IntegrationTests.Extensions;

public static class TRequestExtensions
{
    public static HttpContent ToJsonHttpContent<TRequest>(this TRequest request) =>
        new StringContent(request.ToJson(), Encoding.UTF8, MediaTypeNames.Application.Json);
}
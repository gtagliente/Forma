using System.ComponentModel.DataAnnotations;
using Forma.CoreInfrastructure.Abstractions;

namespace Forma.CoreInfrastructure.AppSettings;

public sealed class JwtOptions : IAppOptions
{
    static string IAppOptions.ConfigSectionPath => "Auth";

    [Required]
    public string JwtSigningKey { get; private init; }
}

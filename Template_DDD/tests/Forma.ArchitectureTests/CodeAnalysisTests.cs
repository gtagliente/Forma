using System.IO;
using System.Linq;
using System.Text;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Xunit;


namespace Forma.ArchitectureTests
{
    public class CodeAnalysisTests
    {
        [Fact]
        public void ExerciseDetail_Create_is_called_only_from_Exercise()
        {
            var repoRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", "src"));
            var csFiles = Directory.GetFiles(repoRoot, "*.cs", SearchOption.AllDirectories)
                                  .Where(p => !p.Contains(Path.DirectorySeparatorChar + "bin" + Path.DirectorySeparatorChar) && !p.Contains(Path.DirectorySeparatorChar + "obj" + Path.DirectorySeparatorChar));

            var violations = new StringBuilder();

            foreach (var file in csFiles)
            {
                var text = File.ReadAllText(file);
                var tree = CSharpSyntaxTree.ParseText(text);
                var root = tree.GetRoot();

                var memberAccesses = root.DescendantNodes()
                    .OfType<MemberAccessExpressionSyntax>()
                    .Where(ma => ma.Name is IdentifierNameSyntax idName && idName.Identifier.Text == "Create" &&
                                 ma.Expression is IdentifierNameSyntax id && id.Identifier.Text == "ExerciseResource");

                foreach (var ma in memberAccesses)
                {
                    var containingType = ma.Ancestors().OfType<TypeDeclarationSyntax>().FirstOrDefault();
                    var typeName = containingType?.Identifier.Text ?? "<no-type>";
                    if (typeName != "Exercise")
                    {
                        var line = ma.GetLocation().GetLineSpan().StartLinePosition.Line + 1;
                        violations.AppendLine($"{file}: {typeName} calls ExerciseResource.Create at line {line}");
                    }
                }
            }

            var result = violations.ToString();
            Assert.True(string.IsNullOrEmpty(result), "ExerciseResource.Create is called from non-Exercise types:\n" + result);
        }
    }
}

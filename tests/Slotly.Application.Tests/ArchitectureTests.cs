using FluentAssertions;

namespace Slotly.Application.Tests;

public sealed class ArchitectureTests
{
    [Fact]
    public void ApplicationAssemblyDoesNotReferenceOuterLayers()
    {
        string[] forbiddenReferences = ["Slotly.Infrastructure", "Slotly.Api"];

        var references = ApplicationAssembly.Reference
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name);

        references.Should().NotContain(forbiddenReferences);
    }
}

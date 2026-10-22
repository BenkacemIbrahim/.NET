using FluentAssertions;

namespace Slotly.Domain.Tests;

public sealed class ArchitectureTests
{
    [Fact]
    public void DomainAssemblyDoesNotReferenceOuterLayers()
    {
        string[] forbiddenReferences =
        [
            "Slotly.Application",
            "Slotly.Infrastructure",
            "Slotly.Api",
        ];

        var references = DomainAssembly.Reference
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name);

        references.Should().NotContain(forbiddenReferences);
    }
}

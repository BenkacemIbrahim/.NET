using FluentAssertions;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Slotly.Api.IntegrationTests;

public sealed class PostgreSqlContainerTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("slotly_tests")
        .WithUsername("slotly")
        .WithPassword("slotly_tests_password")
        .Build();

    public Task InitializeAsync() => _database.StartAsync();

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task DatabaseContainerExecutesQuery()
    {
        await using var connection = new NpgsqlConnection(_database.GetConnectionString());
        await connection.OpenAsync(CancellationToken.None);

        await using var command = new NpgsqlCommand("SELECT 1", connection);
        var result = await command.ExecuteScalarAsync(CancellationToken.None);

        result.Should().Be(1);
    }
}

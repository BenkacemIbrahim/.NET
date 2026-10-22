using Microsoft.EntityFrameworkCore;

namespace Slotly.Infrastructure.Persistence;

public sealed class SlotlyDbContext(DbContextOptions<SlotlyDbContext> options)
    : DbContext(options);

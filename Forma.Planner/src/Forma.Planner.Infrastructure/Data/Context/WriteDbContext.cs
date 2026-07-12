using Forma.Domain.Entities.RoutineAggregate;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Infrastructure.Data.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Forma.Infrastructure.Data.Context;

public class WriteDbContext(DbContextOptions<WriteDbContext> dbOptions)
    : BaseDbContext<WriteDbContext>(dbOptions)
{
    public DbSet<Workout> Workout => Set<Workout>();
    public DbSet<Routine> Routine => Set<Routine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new WorkoutConfiguration());
        modelBuilder.ApplyConfiguration(new WorkoutVersionConfiguration());
        modelBuilder.ApplyConfiguration(new RoutineConfiguration());
    }
}
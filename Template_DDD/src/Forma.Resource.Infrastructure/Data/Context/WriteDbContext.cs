using Forma.Infrastructure.Data.Mappings;
using Microsoft.EntityFrameworkCore;

namespace Forma.Infrastructure.Data.Context;

public class WriteDbContext(DbContextOptions<WriteDbContext> dbOptions)
    : BaseDbContext<WriteDbContext>(dbOptions)
{
    //public DbSet<Exercise> Exercise => Set<Exercise>();
    //public DbSet<StaticValueObjects> StaticValueObjects => Set<StaticValueObjects>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        //modelBuilder.ApplyConfiguration(new ExerciseConfiguration());
        //modelBuilder.ApplyConfiguration(new StaticValueObjectsConfiguration());
        //modelBuilder.ApplyConfiguration(new ExerciseResourceConfiguration());
    }
}
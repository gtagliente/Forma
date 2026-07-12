using Forma.Domain.Entities.RoutineAggregate;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Infrastructure.Data.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Forma.Infrastructure.Data.Mappings;

internal class RoutineConfiguration : IEntityTypeConfiguration<Routine>
{
    public void Configure(EntityTypeBuilder<Routine> builder)
    {
        builder.ConfigureBaseEntity<Routine, RoutineId>();

        builder
            .Property(routine => routine.Id)
            .HasConversion(id => id.Value, value => new RoutineId(value))
            .IsRequired()
            .ValueGeneratedNever();

        builder
            .Property(routine => routine.OwnerId)
            .IsRequired();

        builder
            .Property(routine => routine.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder
            .HasIndex(routine => new { routine.OwnerId, routine.Name })
            .IsUnique()
            .HasDatabaseName("UQ_Routine_OwnerId_Name");

        // Entries have no identity of their own (mirrors WorkoutExerciseEntry) — mapped as an
        // owned collection with a shadow key, own table. References Workout by ID only (a
        // scalar column, not a navigation/FK relationship — Routine never loads a Workout).
        builder.OwnsMany(routine => routine.Entries, entry =>
        {
            entry.ToTable("RoutineEntry");
            entry.WithOwner().HasForeignKey("RoutineId");
            entry.Property<int>("Id");
            entry.HasKey("RoutineId", "Id");

            entry.Property(e => e.WorkoutId)
                .HasConversion(id => id.Value, value => new WorkoutId(value))
                .IsRequired();
            entry.Property(e => e.DayOfWeek);
            entry.Property(e => e.Sequence).IsRequired();
        });
    }
}

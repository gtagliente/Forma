using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Infrastructure.Data.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Forma.Infrastructure.Data.Mappings;

internal class WorkoutConfiguration : IEntityTypeConfiguration<Workout>
{
    public void Configure(EntityTypeBuilder<Workout> builder)
    {
        builder.ConfigureBaseEntity<Workout, WorkoutId>();

        builder
            .Property(workout => workout.Id)
            .HasConversion(id => id.Value, value => new WorkoutId(value))
            .IsRequired()
            .ValueGeneratedNever();

        builder
            .Property(workout => workout.OwnerId)
            .IsRequired();

        builder
            .Property(workout => workout.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder
            .Property(workout => workout.CurrentVersionNumber)
            .IsRequired();

        builder
            .HasIndex(workout => new { workout.OwnerId, workout.Name })
            .IsUnique()
            .HasDatabaseName("UQ_Workout_OwnerId_Name");

        builder
            .HasMany(workout => workout.Versions)
            .WithOne()
            .HasForeignKey(version => version.WorkoutId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_Workout_WorkoutVersion");
    }
}

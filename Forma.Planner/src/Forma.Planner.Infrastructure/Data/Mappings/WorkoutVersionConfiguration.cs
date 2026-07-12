using Forma.Domain.Entities.WorkoutAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Forma.Infrastructure.Data.Mappings;

internal class WorkoutVersionConfiguration : IEntityTypeConfiguration<WorkoutVersion>
{
    public void Configure(EntityTypeBuilder<WorkoutVersion> builder)
    {
        builder.HasKey(version => version.Id);

        builder
            .Property(version => version.Id)
            .HasConversion(id => id.Value, value => new WorkoutVersionId(value))
            .IsRequired()
            .ValueGeneratedNever();

        builder
            .Property(version => version.WorkoutId)
            .HasConversion(id => id.Value, value => new WorkoutId(value))
            .IsRequired();

        builder
            .Property(version => version.VersionNumber)
            .IsRequired();

        builder
            .Property(version => version.CreatedAt)
            .IsRequired();

        builder
            .HasIndex(version => new { version.WorkoutId, version.VersionNumber })
            .IsUnique()
            .HasDatabaseName("UQ_WorkoutVersion_WorkoutId_VersionNumber");

        // Entries have no identity of their own (matches the central "Set has no identity outside
        // its parent" decision) — mapped as an owned collection with a shadow key, own table.
        builder.OwnsMany(version => version.Entries, entry =>
        {
            entry.ToTable("WorkoutExerciseEntry");
            entry.WithOwner().HasForeignKey("WorkoutVersionId");
            entry.Property<int>("Id");
            entry.HasKey("WorkoutVersionId", "Id");

            entry.Property(e => e.ExerciseId).IsRequired();
            entry.Property(e => e.Sets).IsRequired();
            entry.Property(e => e.Reps);
            entry.Property(e => e.DurationSeconds);
            entry.Property(e => e.Weight).HasPrecision(6, 2);
            entry.Property(e => e.RestSeconds);
            entry.Property(e => e.Sequence).IsRequired();
            entry.Property(e => e.GroupId);
        });
    }
}

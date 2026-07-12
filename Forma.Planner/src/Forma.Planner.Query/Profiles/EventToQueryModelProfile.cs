using AutoMapper;
using Forma.Domain.Entities.RoutineAggregate;
using Forma.Domain.Entities.RoutineAggregate.Events;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Domain.Entities.WorkoutAggregate.Events;
using Forma.Query.QueriesModel;

namespace Forma.Query.Profiles;

public class EventToQueryModelProfile : Profile
{
    public EventToQueryModelProfile()
    {
        CreateMap<WorkoutCreatedEvent, WorkoutQueryModel>(MemberList.Destination)
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.AggregateId))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.CurrentVersionNumber, opt => opt.MapFrom(src => src.VersionNumber))
            .ForMember(dest => dest.Exercises, opt => opt.MapFrom(src => src.Entries));

        CreateMap<WorkoutVersionCreatedEvent, WorkoutQueryModel>(MemberList.Destination)
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.AggregateId))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.CurrentVersionNumber, opt => opt.MapFrom(src => src.VersionNumber))
            .ForMember(dest => dest.Exercises, opt => opt.MapFrom(src => src.Entries));

        CreateMap<WorkoutExerciseEntry, WorkoutExerciseEntryQueryModel>(MemberList.Destination);

        CreateMap<RoutineCreatedEvent, RoutineQueryModel>(MemberList.Destination)
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.AggregateId))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Entries, opt => opt.MapFrom(src => src.Entries));

        CreateMap<RoutineEntry, RoutineEntryQueryModel>(MemberList.Destination)
            .ForMember(dest => dest.WorkoutId, opt => opt.MapFrom(src => src.WorkoutId.Value));
    }

    public override string ProfileName => nameof(EventToQueryModelProfile);

 }
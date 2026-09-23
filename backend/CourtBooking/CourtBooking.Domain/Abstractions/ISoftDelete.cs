namespace CourtBooking.Domain.Abstractions;

public interface ISoftDelete
{
    bool IsDeleted { get; set; }
    void Delete()
    {
        IsDeleted = true;
    }
    void Undo()
    {
        IsDeleted = false;
    }
}

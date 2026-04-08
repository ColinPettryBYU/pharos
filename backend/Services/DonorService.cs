using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services;

public class DonorService : IDonorService
{
    private readonly PharosDbContext _db;

    public DonorService(PharosDbContext db)
    {
        _db = db;
    }

    // ── Supporters ──

    public async Task<PagedResult<SupporterDto>> GetSupportersAsync(int page, int pageSize, string? supporterType, string? status, string? search)
    {
        var query = _db.Supporters.Include(s => s.Donations).AsQueryable();

        if (!string.IsNullOrWhiteSpace(supporterType))
            query = query.Where(s => s.SupporterType == supporterType);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.DisplayName.Contains(search) || (s.Email != null && s.Email.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupporterDto(
                s.SupporterId, s.SupporterType, s.DisplayName, s.OrganizationName,
                s.FirstName, s.LastName, s.Email, s.Phone, s.Status, s.AcquisitionChannel,
                s.Region, s.Country, s.CreatedAt, s.FirstDonationDate,
                s.Donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
                s.Donations.OrderByDescending(d => d.DonationDate).Select(d => (DateTime?)d.DonationDate).FirstOrDefault(),
                s.Donations.Count))
            .ToListAsync();

        return new PagedResult<SupporterDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<SupporterDetailDto?> GetSupporterByIdAsync(int id)
    {
        var s = await _db.Supporters
            .Include(x => x.Donations)
            .FirstOrDefaultAsync(x => x.SupporterId == id);

        if (s == null) return null;

        var recentDonations = s.Donations
            .OrderByDescending(d => d.DonationDate)
            .Take(10)
            .Select(d => new DonationDto(
                d.DonationId, d.SupporterId, s.DisplayName, d.DonationType,
                d.DonationDate, d.IsRecurring, d.CampaignName, d.ChannelSource,
                d.CurrencyCode, d.Amount, d.EstimatedValue, d.ImpactUnit, d.Notes, d.ReferralPostId));

        return new SupporterDetailDto(
            s.SupporterId, s.SupporterType, s.DisplayName, s.OrganizationName,
            s.FirstName, s.LastName, s.RelationshipType, s.Region, s.Country,
            s.Email, s.Phone, s.Status, s.CreatedAt, s.FirstDonationDate, s.AcquisitionChannel,
            s.Donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
            s.Donations.OrderByDescending(d => d.DonationDate).Select(d => (DateTime?)d.DonationDate).FirstOrDefault(),
            s.Donations.Count,
            recentDonations);
    }

    public async Task<SupporterDto> CreateSupporterAsync(CreateSupporterRequest request)
    {
        var entity = new Supporter
        {
            SupporterType = request.SupporterType,
            DisplayName = request.DisplayName,
            OrganizationName = request.OrganizationName,
            FirstName = request.FirstName,
            LastName = request.LastName,
            RelationshipType = request.RelationshipType,
            Region = request.Region,
            Country = request.Country,
            Email = request.Email,
            Phone = request.Phone,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            AcquisitionChannel = request.AcquisitionChannel
        };

        _db.Supporters.Add(entity);
        await _db.SaveChangesAsync();

        return new SupporterDto(
            entity.SupporterId, entity.SupporterType, entity.DisplayName, entity.OrganizationName,
            entity.FirstName, entity.LastName, entity.Email, entity.Phone, entity.Status,
            entity.AcquisitionChannel, entity.Region, entity.Country, entity.CreatedAt,
            entity.FirstDonationDate, 0, null, 0);
    }

    public async Task<SupporterDto?> UpdateSupporterAsync(int id, UpdateSupporterRequest request)
    {
        var entity = await _db.Supporters.Include(s => s.Donations).FirstOrDefaultAsync(s => s.SupporterId == id);
        if (entity == null) return null;

        if (request.SupporterType != null) entity.SupporterType = request.SupporterType;
        if (request.DisplayName != null) entity.DisplayName = request.DisplayName;
        if (request.OrganizationName != null) entity.OrganizationName = request.OrganizationName;
        if (request.FirstName != null) entity.FirstName = request.FirstName;
        if (request.LastName != null) entity.LastName = request.LastName;
        if (request.RelationshipType != null) entity.RelationshipType = request.RelationshipType;
        if (request.Region != null) entity.Region = request.Region;
        if (request.Country != null) entity.Country = request.Country;
        if (request.Email != null) entity.Email = request.Email;
        if (request.Phone != null) entity.Phone = request.Phone;
        if (request.Status != null) entity.Status = request.Status;
        if (request.AcquisitionChannel != null) entity.AcquisitionChannel = request.AcquisitionChannel;

        await _db.SaveChangesAsync();

        return new SupporterDto(
            entity.SupporterId, entity.SupporterType, entity.DisplayName, entity.OrganizationName,
            entity.FirstName, entity.LastName, entity.Email, entity.Phone, entity.Status,
            entity.AcquisitionChannel, entity.Region, entity.Country, entity.CreatedAt,
            entity.FirstDonationDate,
            entity.Donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
            entity.Donations.OrderByDescending(d => d.DonationDate).Select(d => (DateTime?)d.DonationDate).FirstOrDefault(),
            entity.Donations.Count);
    }

    public async Task<bool> DeleteSupporterAsync(int id)
    {
        var entity = await _db.Supporters.FindAsync(id);
        if (entity == null) return false;
        _db.Supporters.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Donations ──

    public async Task<PagedResult<DonationDto>> GetDonationsAsync(int page, int pageSize, string? donationType, string? campaignName, string? search, int? supporterId = null)
    {
        var query = _db.Donations.Include(d => d.Supporter).AsQueryable();

        if (supporterId.HasValue)
            query = query.Where(d => d.SupporterId == supporterId.Value);
        if (!string.IsNullOrWhiteSpace(donationType))
            query = query.Where(d => d.DonationType == donationType);
        if (!string.IsNullOrWhiteSpace(campaignName))
            query = query.Where(d => d.CampaignName == campaignName);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d => d.Supporter.DisplayName.Contains(search) || (d.Notes != null && d.Notes.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(d => d.DonationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DonationDto(
                d.DonationId, d.SupporterId, d.Supporter.DisplayName, d.DonationType,
                d.DonationDate, d.IsRecurring, d.CampaignName, d.ChannelSource,
                d.CurrencyCode, d.Amount, d.EstimatedValue, d.ImpactUnit, d.Notes, d.ReferralPostId))
            .ToListAsync();

        return new PagedResult<DonationDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<DonationDetailDto?> GetDonationByIdAsync(int id)
    {
        var d = await _db.Donations
            .Include(x => x.Supporter)
            .Include(x => x.InKindItems)
            .Include(x => x.Allocations).ThenInclude(a => a.Safehouse)
            .FirstOrDefaultAsync(x => x.DonationId == id);

        if (d == null) return null;

        return new DonationDetailDto(
            d.DonationId, d.SupporterId, d.Supporter.DisplayName, d.DonationType,
            d.DonationDate, d.IsRecurring, d.CampaignName, d.ChannelSource,
            d.CurrencyCode, d.Amount, d.EstimatedValue, d.ImpactUnit, d.Notes, d.ReferralPostId,
            d.InKindItems.Select(i => new InKindDonationItemDto(
                i.ItemId, i.DonationId, i.ItemName, i.ItemCategory, i.Quantity,
                i.UnitOfMeasure, i.EstimatedUnitValue, i.IntendedUse, i.ReceivedCondition)),
            d.Allocations.Select(a => new DonationAllocationDto(
                a.AllocationId, a.DonationId, a.SafehouseId, a.Safehouse.Name,
                a.ProgramArea, a.AmountAllocated, a.AllocationDate, a.AllocationNotes)));
    }

    public async Task<DonationDto> CreateDonationAsync(CreateDonationRequest request)
    {
        var supporter = await _db.Supporters.FindAsync(request.SupporterId);
        var entity = new Donation
        {
            SupporterId = request.SupporterId,
            DonationType = request.DonationType,
            DonationDate = request.DonationDate,
            IsRecurring = request.IsRecurring,
            CampaignName = request.CampaignName,
            ChannelSource = request.ChannelSource,
            CurrencyCode = request.CurrencyCode,
            Amount = request.Amount,
            EstimatedValue = request.EstimatedValue,
            ImpactUnit = request.ImpactUnit,
            Notes = request.Notes,
            ReferralPostId = request.ReferralPostId
        };

        _db.Donations.Add(entity);
        await _db.SaveChangesAsync();

        return new DonationDto(
            entity.DonationId, entity.SupporterId, supporter?.DisplayName, entity.DonationType,
            entity.DonationDate, entity.IsRecurring, entity.CampaignName, entity.ChannelSource,
            entity.CurrencyCode, entity.Amount, entity.EstimatedValue, entity.ImpactUnit,
            entity.Notes, entity.ReferralPostId);
    }

    public async Task<DonationDto?> UpdateDonationAsync(int id, UpdateDonationRequest request)
    {
        var entity = await _db.Donations.Include(d => d.Supporter).FirstOrDefaultAsync(d => d.DonationId == id);
        if (entity == null) return null;

        if (request.DonationType != null) entity.DonationType = request.DonationType;
        if (request.DonationDate.HasValue) entity.DonationDate = request.DonationDate.Value;
        if (request.IsRecurring.HasValue) entity.IsRecurring = request.IsRecurring.Value;
        if (request.CampaignName != null) entity.CampaignName = request.CampaignName;
        if (request.ChannelSource != null) entity.ChannelSource = request.ChannelSource;
        if (request.CurrencyCode != null) entity.CurrencyCode = request.CurrencyCode;
        if (request.Amount.HasValue) entity.Amount = request.Amount.Value;
        if (request.EstimatedValue.HasValue) entity.EstimatedValue = request.EstimatedValue.Value;
        if (request.ImpactUnit != null) entity.ImpactUnit = request.ImpactUnit;
        if (request.Notes != null) entity.Notes = request.Notes;

        await _db.SaveChangesAsync();

        return new DonationDto(
            entity.DonationId, entity.SupporterId, entity.Supporter.DisplayName, entity.DonationType,
            entity.DonationDate, entity.IsRecurring, entity.CampaignName, entity.ChannelSource,
            entity.CurrencyCode, entity.Amount, entity.EstimatedValue, entity.ImpactUnit,
            entity.Notes, entity.ReferralPostId);
    }

    public async Task<bool> DeleteDonationAsync(int id)
    {
        var entity = await _db.Donations.FindAsync(id);
        if (entity == null) return false;
        _db.Donations.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Allocations ──

    public async Task<PagedResult<DonationAllocationDto>> GetAllocationsAsync(int page, int pageSize, int? safehouseId)
    {
        var query = _db.DonationAllocations.Include(a => a.Safehouse).AsQueryable();

        if (safehouseId.HasValue)
            query = query.Where(a => a.SafehouseId == safehouseId.Value);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(a => a.AllocationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new DonationAllocationDto(
                a.AllocationId, a.DonationId, a.SafehouseId, a.Safehouse.Name,
                a.ProgramArea, a.AmountAllocated, a.AllocationDate, a.AllocationNotes))
            .ToListAsync();

        return new PagedResult<DonationAllocationDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<DonationAllocationDto> CreateAllocationAsync(CreateDonationAllocationRequest request)
    {
        var entity = new DonationAllocation
        {
            DonationId = request.DonationId,
            SafehouseId = request.SafehouseId,
            ProgramArea = request.ProgramArea,
            AmountAllocated = request.AmountAllocated,
            AllocationDate = request.AllocationDate,
            AllocationNotes = request.AllocationNotes
        };

        _db.DonationAllocations.Add(entity);
        await _db.SaveChangesAsync();

        var safehouse = await _db.Safehouses.FindAsync(entity.SafehouseId);

        return new DonationAllocationDto(
            entity.AllocationId, entity.DonationId, entity.SafehouseId,
            safehouse?.Name, entity.ProgramArea, entity.AmountAllocated,
            entity.AllocationDate, entity.AllocationNotes);
    }

    // ── Donor Portal ──

    public async Task<DonorProfileDto?> GetDonorProfileAsync(int supporterId)
    {
        var s = await _db.Supporters
            .Include(x => x.Donations)
            .FirstOrDefaultAsync(x => x.SupporterId == supporterId);

        if (s == null) return null;

        return new DonorProfileDto(
            s.SupporterId, s.DisplayName, s.OrganizationName, s.SupporterType,
            s.Email, s.FirstDonationDate, s.AcquisitionChannel,
            s.Donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
            s.Donations.Count);
    }

    public async Task<PagedResult<DonationDto>> GetDonorDonationsAsync(int supporterId, int page, int pageSize)
    {
        var query = _db.Donations
            .Include(d => d.Supporter)
            .Where(d => d.SupporterId == supporterId);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(d => d.DonationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DonationDto(
                d.DonationId, d.SupporterId, d.Supporter.DisplayName, d.DonationType,
                d.DonationDate, d.IsRecurring, d.CampaignName, d.ChannelSource,
                d.CurrencyCode, d.Amount, d.EstimatedValue, d.ImpactUnit, d.Notes, d.ReferralPostId))
            .ToListAsync();

        return new PagedResult<DonationDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<DonorImpactDto?> GetDonorImpactAsync(int supporterId)
    {
        var supporter = await _db.Supporters
            .Include(s => s.Donations).ThenInclude(d => d.Allocations).ThenInclude(a => a.Safehouse)
            .FirstOrDefaultAsync(s => s.SupporterId == supporterId);

        if (supporter == null) return null;

        var allAllocations = supporter.Donations.SelectMany(d => d.Allocations).ToList();

        return new DonorImpactDto(
            supporter.Donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
            supporter.Donations.Count,
            allAllocations.Select(a => a.SafehouseId).Distinct().Count(),
            allAllocations.Select(a => a.ProgramArea).Distinct(),
            supporter.Donations.OrderByDescending(d => d.DonationDate).Select(d => new DonationTimelineDto(
                d.DonationId, d.DonationDate, d.DonationType, d.Amount, d.CampaignName)),
            allAllocations.GroupBy(a => new { a.Safehouse.Name, a.ProgramArea })
                .Select(g => new ImpactAllocationDto(g.Key.Name, g.Key.ProgramArea, g.Sum(a => a.AmountAllocated)))
        );
    }
}

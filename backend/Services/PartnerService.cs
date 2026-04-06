using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services;

public class PartnerService : IPartnerService
{
    private readonly PharosDbContext _db;

    public PartnerService(PharosDbContext db) => _db = db;

    public async Task<PagedResult<PartnerDto>> GetAllAsync(int page, int pageSize, string? partnerType, string? status, string? search)
    {
        var query = _db.Partners.Include(p => p.PartnerAssignments).AsQueryable();
        if (!string.IsNullOrWhiteSpace(partnerType)) query = query.Where(p => p.PartnerType == partnerType);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(p => p.Status == status);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(p => p.PartnerName.Contains(search) || (p.ContactName != null && p.ContactName.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderBy(p => p.PartnerName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PartnerDto(p.PartnerId, p.PartnerName, p.PartnerType, p.RoleType, p.ContactName, p.Email, p.Phone, p.Region, p.Status, p.StartDate, p.EndDate, p.Notes, p.PartnerAssignments.Count))
            .ToListAsync();

        return new PagedResult<PartnerDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<PartnerDto> CreateAsync(CreatePartnerRequest req)
    {
        var entity = new Partner
        {
            PartnerName = req.PartnerName, PartnerType = req.PartnerType, RoleType = req.RoleType,
            ContactName = req.ContactName, Email = req.Email, Phone = req.Phone, Region = req.Region,
            Status = req.Status, StartDate = req.StartDate, EndDate = req.EndDate, Notes = req.Notes
        };
        _db.Partners.Add(entity);
        await _db.SaveChangesAsync();
        return new PartnerDto(entity.PartnerId, entity.PartnerName, entity.PartnerType, entity.RoleType, entity.ContactName, entity.Email, entity.Phone, entity.Region, entity.Status, entity.StartDate, entity.EndDate, entity.Notes, 0);
    }

    public async Task<PartnerDto?> UpdateAsync(int id, UpdatePartnerRequest req)
    {
        var entity = await _db.Partners.Include(p => p.PartnerAssignments).FirstOrDefaultAsync(p => p.PartnerId == id);
        if (entity == null) return null;

        if (req.PartnerName != null) entity.PartnerName = req.PartnerName;
        if (req.PartnerType != null) entity.PartnerType = req.PartnerType;
        if (req.RoleType != null) entity.RoleType = req.RoleType;
        if (req.ContactName != null) entity.ContactName = req.ContactName;
        if (req.Email != null) entity.Email = req.Email;
        if (req.Phone != null) entity.Phone = req.Phone;
        if (req.Region != null) entity.Region = req.Region;
        if (req.Status != null) entity.Status = req.Status;
        if (req.EndDate.HasValue) entity.EndDate = req.EndDate.Value;
        if (req.Notes != null) entity.Notes = req.Notes;

        await _db.SaveChangesAsync();
        return new PartnerDto(entity.PartnerId, entity.PartnerName, entity.PartnerType, entity.RoleType, entity.ContactName, entity.Email, entity.Phone, entity.Region, entity.Status, entity.StartDate, entity.EndDate, entity.Notes, entity.PartnerAssignments.Count);
    }
}

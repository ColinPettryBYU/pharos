using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services;

public class SafehouseService : ISafehouseService
{
    private readonly PharosDbContext _db;

    public SafehouseService(PharosDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<SafehouseDto>> GetAllAsync(int page, int pageSize, string? status, string? search)
    {
        var query = _db.Safehouses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Name.Contains(search) || s.City.Contains(search) || s.Region.Contains(search));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderBy(s => s.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SafehouseDto(
                s.SafehouseId, s.SafehouseCode, s.Name, s.Region, s.City, s.Province,
                s.Country, s.OpenDate, s.Status, s.CapacityGirls, s.CapacityStaff,
                s.CurrentOccupancy, s.Notes))
            .ToListAsync();

        return new PagedResult<SafehouseDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<SafehouseDetailDto?> GetByIdAsync(int id)
    {
        var s = await _db.Safehouses
            .Include(x => x.Residents)
            .Include(x => x.IncidentReports)
            .Include(x => x.MonthlyMetrics.OrderByDescending(m => m.MonthStart).Take(12))
            .FirstOrDefaultAsync(x => x.SafehouseId == id);

        if (s == null) return null;

        return new SafehouseDetailDto(
            s.SafehouseId, s.SafehouseCode, s.Name, s.Region, s.City, s.Province,
            s.Country, s.OpenDate, s.Status, s.CapacityGirls, s.CapacityStaff,
            s.CurrentOccupancy, s.Notes,
            s.Residents.Count(r => r.CaseStatus == "Active"),
            s.IncidentReports.Count,
            s.MonthlyMetrics.Select(m => new SafehouseMonthlyMetricDto(
                m.MetricId, m.SafehouseId, m.MonthStart, m.MonthEnd,
                m.ActiveResidents, m.AvgEducationProgress, m.AvgHealthScore,
                m.ProcessRecordingCount, m.HomeVisitationCount, m.IncidentCount, m.Notes))
        );
    }

    public async Task<SafehouseDto> CreateAsync(CreateSafehouseRequest request)
    {
        var entity = new Safehouse
        {
            SafehouseCode = request.SafehouseCode,
            Name = request.Name,
            Region = request.Region,
            City = request.City,
            Province = request.Province,
            Country = request.Country,
            OpenDate = request.OpenDate,
            Status = request.Status,
            CapacityGirls = request.CapacityGirls,
            CapacityStaff = request.CapacityStaff,
            CurrentOccupancy = request.CurrentOccupancy,
            Notes = request.Notes
        };

        _db.Safehouses.Add(entity);
        await _db.SaveChangesAsync();

        return new SafehouseDto(
            entity.SafehouseId, entity.SafehouseCode, entity.Name, entity.Region,
            entity.City, entity.Province, entity.Country, entity.OpenDate,
            entity.Status, entity.CapacityGirls, entity.CapacityStaff,
            entity.CurrentOccupancy, entity.Notes);
    }

    public async Task<SafehouseDto?> UpdateAsync(int id, UpdateSafehouseRequest request)
    {
        var entity = await _db.Safehouses.FindAsync(id);
        if (entity == null) return null;

        if (request.Name != null) entity.Name = request.Name;
        if (request.Region != null) entity.Region = request.Region;
        if (request.City != null) entity.City = request.City;
        if (request.Province != null) entity.Province = request.Province;
        if (request.Country != null) entity.Country = request.Country;
        if (request.Status != null) entity.Status = request.Status;
        if (request.CapacityGirls.HasValue) entity.CapacityGirls = request.CapacityGirls.Value;
        if (request.CapacityStaff.HasValue) entity.CapacityStaff = request.CapacityStaff.Value;
        if (request.CurrentOccupancy.HasValue) entity.CurrentOccupancy = request.CurrentOccupancy.Value;
        if (request.Notes != null) entity.Notes = request.Notes;

        await _db.SaveChangesAsync();

        return new SafehouseDto(
            entity.SafehouseId, entity.SafehouseCode, entity.Name, entity.Region,
            entity.City, entity.Province, entity.Country, entity.OpenDate,
            entity.Status, entity.CapacityGirls, entity.CapacityStaff,
            entity.CurrentOccupancy, entity.Notes);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _db.Safehouses.FindAsync(id);
        if (entity == null) return false;
        _db.Safehouses.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<PublicAggregateSummaryDto> GetPublicSummaryAsync()
    {
        var safehouses = await _db.Safehouses.Where(s => s.Status == "Active").ToListAsync();
        var totalResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalDonations = await _db.Donations
            .Where(d => d.DonationType == "Monetary")
            .SumAsync(d => d.Amount ?? 0m);

        var latestMetrics = await _db.SafehouseMonthlyMetrics
            .GroupBy(m => m.SafehouseId)
            .Select(g => g.OrderByDescending(m => m.MonthStart).First())
            .ToListAsync();

        var avgEducation = latestMetrics.Any()
            ? latestMetrics.Average(m => m.AvgEducationProgress ?? 0m) : 0m;
        var avgHealth = latestMetrics.Any()
            ? latestMetrics.Average(m => m.AvgHealthScore ?? 0m) : 0m;

        var regionBreakdown = safehouses
            .GroupBy(s => s.Region)
            .ToDictionary(g => g.Key, g => g.Count());

        return new PublicAggregateSummaryDto(
            safehouses.Count,
            totalResidents,
            totalDonations,
            regionBreakdown.Count,
            avgEducation,
            avgHealth,
            regionBreakdown
        );
    }
}

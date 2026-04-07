namespace Pharos.Api.Models;

public class InterventionEffectivenessRow
{
    public int Id { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public string Intervention { get; set; } = string.Empty;
    public double Coefficient { get; set; }
    public double PValue { get; set; }
    public bool Significant { get; set; }
}

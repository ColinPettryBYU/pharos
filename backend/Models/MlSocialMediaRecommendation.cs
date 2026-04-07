namespace Pharos.Api.Models;

public class MlSocialMediaRecommendation
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty;
    public int RecommendedHour { get; set; }
    public string RecommendedDay { get; set; } = string.Empty;
    public bool IncludeResidentStory { get; set; }
    public bool IncludeCallToAction { get; set; }
    public double PredictedDonations { get; set; }
    public DateTime ComputedAt { get; set; }
}

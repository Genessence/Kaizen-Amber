import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StarRatingInfoProps {
  compact?: boolean;
}

const StarRatingInfo = ({ compact = false }: StarRatingInfoProps) => {
  const criteria = [
    {
      stars: 5,
      monthly: "> 16L",
      ytd: "> 200L",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      stars: 4,
      monthly: "12-16L",
      ytd: "150-200L",
      color: "text-yellow-400",
      bgColor: "bg-yellow-50/70",
      borderColor: "border-yellow-100",
    },
    {
      stars: 3,
      monthly: "8-12L",
      ytd: "100-150L",
      color: "text-yellow-300",
      bgColor: "bg-yellow-50/50",
      borderColor: "border-yellow-50",
    },
    {
      stars: 2,
      monthly: "4-8L",
      ytd: "50-100L",
      color: "text-gray-400",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
    {
      stars: 1,
      monthly: "≤ 4L",
      ytd: "≤ 50L",
      color: "text-gray-300",
      bgColor: "bg-gray-50/70",
      borderColor: "border-gray-100",
    },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Star Rating Criteria:</p>
        <div className="space-y-1">
          {criteria.map((criterion) => (
            <div key={criterion.stars} className="flex items-center gap-2 text-xs">
              <div className="flex">
                {[...Array(criterion.stars)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${criterion.color} fill-current`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                Monthly: <span className="font-medium text-foreground">{criterion.monthly}</span> & 
                YTD: <span className="font-medium text-foreground">{criterion.ytd}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic mt-2">
          * Both monthly AND YTD thresholds must be met
        </p>
      </div>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Star Rating Criteria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Star ratings are calculated based on <strong>both</strong> monthly and YTD (Year-to-Date) savings. 
          Both thresholds must be met to achieve a particular star level.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Stars</th>
                <th className="text-left py-2 px-2">Monthly Savings</th>
                <th className="text-left py-2 px-2">YTD Savings</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion) => (
                <tr
                  key={criterion.stars}
                  className={`border-b ${criterion.bgColor} ${criterion.borderColor}`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {[...Array(criterion.stars)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${criterion.color} fill-current`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 font-medium">{criterion.monthly}</td>
                  <td className="py-3 px-2 font-medium">{criterion.ytd}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-gray-200 fill-current" />
                  </div>
                </td>
                <td className="py-3 px-2 text-muted-foreground">0 or not recorded</td>
                <td className="py-3 px-2 text-muted-foreground">0 or not recorded</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900 text-sm">Examples:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>16L monthly + 200L YTD = 4 stars</strong> (at upper boundary of 4-star range)</li>
            <li>• <strong>17L monthly + 201L YTD = 5 stars</strong> (exceeds 4-star threshold)</li>
            <li>• <strong>20L monthly + 60L YTD = 2 stars</strong> (limited by YTD, both must meet threshold)</li>
            <li>• <strong>5L monthly + 30L YTD = 1 star</strong> (both within 1-star range)</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900">
            <strong>Important:</strong> Both monthly and YTD savings must meet or exceed their respective thresholds 
            for a star level. If one metric is lower, it determines the overall rating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarRatingInfo;


import { useMemo, useState, Fragment, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, TrendingUp, Factory, IndianRupee } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, BarChart, XAxis, YAxis, CartesianGrid, Bar, Label, LabelList } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useBestPractices } from "@/hooks/useBestPractices";
import { usePlantPerformance, useCostSavings, useCostAnalysis, usePlantMonthlyBreakdown } from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsProps {
  userRole: "plant" | "hq";
}

// Helper function to get short name from full plant name
const getPlantShortName = (fullName: string): string => {
  const shortNameMap: Record<string, string> = {
    "Greater Noida (Ecotech 1)": "Greater Noida",
    "Kanchipuram": "Kanchipuram",
    "Rajpura": "Rajpura",
    "Shahjahanpur": "Shahjahanpur",
    "Supa": "Supa",
    "Ranjangaon": "Ranjangaon",
    "Ponneri": "Ponneri",
  };
  return shortNameMap[fullName] || fullName;
};

const Analytics = ({ userRole }: AnalyticsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Toggle state for Yearly Analytics - only for HQ admin
  const [yearlyViewMode, setYearlyViewMode] = useState<"yearly" | "currentMonth">("yearly");
  // Toggle state for Yearly Cost Savings
  const [yearlyCostSavingsViewMode, setYearlyCostSavingsViewMode] = useState<"yearly" | "currentMonth">("yearly");
  const [yearlyCostSavingsFormat, setYearlyCostSavingsFormat] = useState<'lakhs' | 'crores'>('lakhs');

  // Fetch plant performance data
  const { data: yearlyPlantPerformance, isLoading: isLoadingYearly } = usePlantPerformance('yearly', currentYear);
  const { data: monthlyPlantPerformance, isLoading: isLoadingMonthly } = usePlantPerformance('monthly', currentYear, currentMonth);

  // Fetch cost savings data
  const { data: yearlyCostSavingsData, isLoading: isLoadingYearlySavings } = useCostSavings('yearly', yearlyCostSavingsFormat, currentYear);
  const { data: monthlyCostSavingsData, isLoading: isLoadingMonthlySavings } = useCostSavings('monthly', yearlyCostSavingsFormat, currentYear, currentMonth);

  // Transform plant performance data for charts
  const yearlyPlantData = useMemo(() => {
    if (!yearlyPlantPerformance) return [];
    return yearlyPlantPerformance.map(plant => ({
      plant: getPlantShortName(plant.plant_name),
      fullName: plant.plant_name,
      submitted: plant.submitted
    }));
  }, [yearlyPlantPerformance]);

  const currentMonthPlantData = useMemo(() => {
    if (!monthlyPlantPerformance) return [];
    return monthlyPlantPerformance.map(plant => ({
      plant: getPlantShortName(plant.plant_name),
      fullName: plant.plant_name,
      submitted: plant.submitted
    }));
  }, [monthlyPlantPerformance]);

  // Transform cost savings data for charts
  const yearlyPlantSavings = useMemo(() => {
    if (!yearlyCostSavingsData?.data) return [];
    return yearlyCostSavingsData.data.map(plant => ({
      plant: plant.plant_name,
      savings: parseFloat(plant.ytd_total || '0')
    }));
  }, [yearlyCostSavingsData]);

  const currentMonthPlantSavings = useMemo(() => {
    if (!monthlyCostSavingsData?.data) return [];
    return monthlyCostSavingsData.data.map(plant => ({
      plant: plant.plant_name,
      savings: parseFloat(plant.current_month || '0')
    }));
  }, [monthlyCostSavingsData]);

  // Filter plants based on user role
  const plantsToShow = useMemo(() => {
    const allPlants = yearlyPlantData;
    if (userRole === "plant" && user?.plant_name) {
      return allPlants.filter(p => p.fullName === user.plant_name);
    }
    return allPlants;
  }, [yearlyPlantData, userRole, user?.plant_name]);

  // Show loading state
  if ((yearlyViewMode === "yearly" && isLoadingYearly) || (yearlyViewMode === "currentMonth" && isLoadingMonthly)) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center"><BarChart3 className="h-6 w-6 mr-2 text-primary" /> Component Division Overview</h1>
            <p className="text-muted-foreground mt-1">
              {userRole === "plant" ? "Greater Noida (Ecotech 1) performance" : "Company-wide metrics and per-plant breakdown"}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back</Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading analytics data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><BarChart3 className="h-6 w-6 mr-2 text-primary" /> Component Division Overview</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "plant" ? "Greater Noida (Ecotech 1) performance" : "Company-wide metrics and per-plant breakdown"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back</Button>
      </div>

      {/* Company-wide yearly bar chart */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary mr-2" />
              {yearlyViewMode === "yearly" ? "Yearly Analytics" : "Monthly Analytics"}
            </CardTitle>
            {userRole === "hq" && (
              <ToggleGroup 
                type="single" 
                value={yearlyViewMode} 
                onValueChange={(value) => {
                  if (value === "yearly" || value === "currentMonth") {
                    setYearlyViewMode(value);
                  }
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem value="yearly" aria-label="Yearly view" className="px-4">
                  Yearly
                </ToggleGroupItem>
                <ToggleGroupItem value="currentMonth" aria-label="Current month view" className="px-4">
                  Current Month
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(yearlyViewMode === "yearly" && yearlyPlantData.length === 0) || 
           (yearlyViewMode === "currentMonth" && currentMonthPlantData.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">No data available.</div>
          ) : (
            <ChartContainer
              config={{
                submitted: { label: "Submitted", color: "hsl(var(--primary))" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart 
                data={yearlyViewMode === "yearly" ? yearlyPlantData : currentMonthPlantData}
                margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
              >
              <defs>
                <linearGradient id="gradientSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="plant" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="font-semibold">{data.fullName || data.plant}</div>
                        <div className="text-sm text-muted-foreground">
                          BPs Submitted: <span className="font-medium text-foreground">{data.submitted}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="submitted" fill="url(#gradientSubmitted)" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="submitted" position="top" className="text-xs fill-current" />
              </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Yearly Cost Savings (Company-wide) */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <IndianRupee className="h-5 w-5 text-primary mr-2" />
              {yearlyCostSavingsViewMode === "yearly" ? "Yearly Cost Savings" : "Monthly Cost Savings"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup 
                type="single" 
                value={yearlyCostSavingsViewMode} 
                onValueChange={(value) => {
                  if (value === "yearly" || value === "currentMonth") {
                    setYearlyCostSavingsViewMode(value);
                  }
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem value="yearly" aria-label="Yearly view" className="px-4">
                  Yearly
                </ToggleGroupItem>
                <ToggleGroupItem value="currentMonth" aria-label="Current month view" className="px-4">
                  Current Month
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={yearlyCostSavingsFormat}
                onValueChange={(value) => {
                  if (value === 'lakhs' || value === 'crores') {
                    setYearlyCostSavingsFormat(value);
                  }
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem value="lakhs" className="px-3 text-xs" aria-label="Lakhs">
                  L
                </ToggleGroupItem>
                <ToggleGroupItem value="crores" className="px-3 text-xs" aria-label="Crores">
                  Cr
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const plantSavings = yearlyCostSavingsViewMode === "yearly" ? yearlyPlantSavings : currentMonthPlantSavings;
            const total = plantSavings.reduce((a, b) => a + b.savings, 0);
            
            // Show loading state
            if ((yearlyCostSavingsViewMode === "yearly" && isLoadingYearlySavings) || 
                (yearlyCostSavingsViewMode === "currentMonth" && isLoadingMonthlySavings)) {
              return <div className="text-center py-8 text-muted-foreground">Loading savings data...</div>;
            }
            
            // Show empty state
            if (plantSavings.length === 0) {
              return <div className="text-center py-8 text-muted-foreground">No savings data available.</div>;
            }
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Plant-wise {yearlyCostSavingsViewMode === "yearly" ? "YTD" : "Monthly"} savings • ₹ {yearlyCostSavingsFormat === 'crores' ? 'Cr' : 'L'}</span>
                  <span className="font-medium text-foreground">Company {yearlyCostSavingsViewMode === "yearly" ? "YTD" : "Monthly"}: {formatCurrency(total, 1, yearlyCostSavingsFormat)}</span>
                </div>
                <ChartContainer 
                  config={{ savings: { label: yearlyCostSavingsViewMode === "yearly" ? "YTD Savings" : "Monthly Savings", color: "hsl(var(--success))" } }}
                  className="h-[300px] w-full"
                >
                  <BarChart data={plantSavings.map(p => ({ 
                    plant: getPlantShortName(p.plant),
                    fullName: p.plant,
                    savings: p.savings 
                  }))}>
                    <defs>
                      <linearGradient id="gradientSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="plant" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <div className="font-semibold">{data.fullName || data.plant}</div>
                              <div className="text-sm text-muted-foreground">
                                {yearlyCostSavingsViewMode === "yearly" ? "YTD" : "Monthly"} Savings: <span className="font-medium text-foreground">{formatCurrency(data.savings, 1, yearlyCostSavingsFormat)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="savings" fill="url(#gradientSavings)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Cost Analysis - Savings (not profit) */}
      <CostAnalysis userRole={userRole} />
    </div>
  );
};

const MetricCard = ({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) => (
  <Card className="shadow-card">
    <CardContent className="p-4 text-center">
      <div className="text-2xl font-bold text-primary flex items-center justify-center space-x-2">
        {icon}
        <span>{value}</span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const MetricBadge = ({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "destructive" }) => {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success border-success"
      : tone === "warning"
      ? "bg-warning/10 text-warning border-warning"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive"
      : "bg-primary/10 text-primary border-primary";

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <span className="text-sm">{label}</span>
      <Badge variant="outline" className={toneClass}>{value}</Badge>
    </div>
  );
};

export default Analytics;

// ---------------- Cost Analysis (Savings) ----------------
type Division = "Component";

type PlantCost = {
  id: string;
  name: string;
  division: Division;
  lastMonth: number; // savings last month (in lakhs ₹)
  currentMonth: number; // savings current month (in lakhs ₹)
  ytdTillLastMonth: number; // savings YTD till last month (in lakhs ₹)
};
type PlantMonthlyBreakdown = {
  month: string;
  totalSavings: number;
  practices: { title: string; savings: number; benchmarked?: boolean }[];
};

const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth();
const monthsOfYear = Array.from(
  { length: currentMonthIndex + 1 },
  (_, index) => `${currentYear}-${String(index + 1).padStart(2, "0")}`
);

// Helper function to extract savings amount from string like "₹3.2L annually" -> 3.2
const extractSavingsAmount = (savingsStr: string | undefined): number => {
  if (!savingsStr) return 0;
  // Match numbers with optional decimals before "L" or "Cr"
  const match = savingsStr.match(/₹?([\d.]+)\s*(L|Cr)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    // Convert crores to lakhs (1 crore = 100 lakhs)
    return match[2].toLowerCase() === 'cr' ? amount * 100 : amount;
  }
  return 0;
};

// Generate plantMonthlySavings from practices data
const generatePlantMonthlySavings = (practices: any[]): Record<string, PlantMonthlyBreakdown[]> => {
  const result: Record<string, PlantMonthlyBreakdown[]> = {};
  
  // Group practices by plant
  const practicesByPlant = new Map<string, any[]>();
  practices.forEach(practice => {
    const plantName = practice.plant_name || practice.plant || "Unknown";
    if (!practicesByPlant.has(plantName)) {
      practicesByPlant.set(plantName, []);
    }
    practicesByPlant.get(plantName)!.push(practice);
  });
  
  // Process each plant
  practicesByPlant.forEach((plantPractices, plantName) => {
    // Group practices by month
    const practicesByMonth = new Map<string, any[]>();
    
    plantPractices.forEach(practice => {
      const submittedDate = practice.submitted_date || practice.submittedDate;
      if (submittedDate) {
        const date = new Date(submittedDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!practicesByMonth.has(monthKey)) {
          practicesByMonth.set(monthKey, []);
        }
        practicesByMonth.get(monthKey)!.push(practice);
      }
    });
    
    // Convert to PlantMonthlyBreakdown format
    const monthlyBreakdowns: PlantMonthlyBreakdown[] = [];
    
    practicesByMonth.forEach((monthPractices, monthKey) => {
      // Limit to max 2 practices per month, take first 2
      const limitedPractices = monthPractices.slice(0, 2).map(p => ({
        title: p.title,
        savings: extractSavingsAmount(p.savings_amount ? `₹${p.savings_amount}${p.savings_currency === 'crores' ? 'Cr' : p.savings_currency === 'lakhs' ? 'L' : ''}` : p.savings),
        benchmarked: p.is_benchmarked || false
      }));
      
      const totalSavings = limitedPractices.reduce((sum, p) => sum + p.savings, 0);
      
      monthlyBreakdowns.push({
        month: monthKey,
        totalSavings,
        practices: limitedPractices
      });
    });
    
    // Sort by month
    monthlyBreakdowns.sort((a, b) => a.month.localeCompare(b.month));
    
    if (monthlyBreakdowns.length > 0) {
      result[plantName] = monthlyBreakdowns;
    }
  });
  
  return result;
};

// Default breakdown for plants without practices
const getDefaultMonthlyBreakdown = (practices: any[]): PlantMonthlyBreakdown[] => {
  if (practices.length === 0) return [];
  
  // Use the first practice as default
  const firstPractice = practices[0];
  const submittedDate = firstPractice.submitted_date || firstPractice.submittedDate;
  const date = new Date(submittedDate || `${currentYear}-01-01`);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  return [{
    month: monthKey,
    totalSavings: extractSavingsAmount(firstPractice.savings_amount ? `₹${firstPractice.savings_amount}${firstPractice.savings_currency === 'crores' ? 'Cr' : firstPractice.savings_currency === 'lakhs' ? 'L' : ''}` : firstPractice.savings),
    practices: [{
      title: firstPractice.title,
      savings: extractSavingsAmount(firstPractice.savings_amount ? `₹${firstPractice.savings_amount}${firstPractice.savings_currency === 'crores' ? 'Cr' : firstPractice.savings_currency === 'lakhs' ? 'L' : ''}` : firstPractice.savings),
      benchmarked: firstPractice.is_benchmarked || false
    }]
  }];
};

const formatLakh = (n: number) => formatCurrency(n, 1);
const pctChange = (current: number, last: number) => (last === 0 ? 0 : ((current - last) / last) * 100);

const CostAnalysis = ({ userRole }: { userRole: "plant" | "hq" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [costAnalysisFormat, setCostAnalysisFormat] = useState<'lakhs' | 'crores'>('lakhs');
  
  // Fetch cost analysis data from API
  const { data: costAnalysisData, isLoading: isLoadingCostAnalysis } = useCostAnalysis(costAnalysisFormat);
  
  // Fetch practices from API
  const { data: practicesData } = useBestPractices({ limit: 1000 });
  const practices: any[] = (practicesData as any)?.data || [];
  
  // Transform cost analysis data to PlantCost format
  const plantCostData = useMemo<PlantCost[]>(() => {
    const data = (costAnalysisData as any)?.data;
    if (!data || !Array.isArray(data)) return [];
    
    // The API returns PlantSavings with last_month, current_month, ytd_till_last_month
    return data.map((plant: any) => ({
      id: plant.plant_id,
      name: plant.plant_name,
      division: "Component" as Division,
      lastMonth: parseFloat(plant.last_month || '0'),
      currentMonth: parseFloat(plant.current_month || '0'),
      ytdTillLastMonth: parseFloat(plant.ytd_till_last_month || '0')
    }));
  }, [costAnalysisData]);
  
  // Generate plant monthly savings from API data
  const plantMonthlySavings = useMemo(() => generatePlantMonthlySavings(practices), [practices]);
  const defaultMonthlyBreakdown = useMemo(() => getDefaultMonthlyBreakdown(practices), [practices]);
  
  // Filter by role (plant users see only their plant's savings)
  const visible = useMemo(() => {
    if (userRole === "plant" && user?.plant_name) {
      return plantCostData.filter(p => p.name === user.plant_name);
    }
    return plantCostData;
  }, [plantCostData, userRole, user?.plant_name]);

  // Aggregate component division totals
  const componentTotals = visible.reduce(
    (acc, p) => {
      acc.lastMonth += p.lastMonth;
      acc.currentMonth += p.currentMonth;
      acc.ytdTillLastMonth += p.ytdTillLastMonth;
      return acc;
    },
    { lastMonth: 0, currentMonth: 0, ytdTillLastMonth: 0 }
  );

  const companyTotals = visible.reduce(
    (acc, p) => {
      acc.lastMonth += p.lastMonth;
      acc.currentMonth += p.currentMonth;
      acc.ytdTillLastMonth += p.ytdTillLastMonth;
      return acc;
    },
    { lastMonth: 0, currentMonth: 0, ytdTillLastMonth: 0 }
  );

  const [plantDetailOpen, setPlantDetailOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PlantCost | null>(null);
  const [practicesDialogOpen, setPracticesDialogOpen] = useState(false);
  const [selectedMonthPractices, setSelectedMonthPractices] = useState<{ month: string; practices: { title: string; savings: number; benchmarked?: boolean }[] } | null>(null);
  
  // State for donut chart active indices (must be at top level for Rules of Hooks)
  const [currentChartActiveIndex, setCurrentChartActiveIndex] = useState<number | null>(null);
  const [lastChartActiveIndex, setLastChartActiveIndex] = useState<number | null>(null);
  const [yearlyChartActiveIndex, setYearlyChartActiveIndex] = useState<number | null>(null);

  // Get plant ID from cost analysis data for selected plant
  const selectedPlantId = useMemo(() => {
    if (!selectedPlant || !costAnalysisData?.data) return undefined;
    const plantData = costAnalysisData.data.find(p => p.plant_name === selectedPlant.name);
    return plantData?.plant_id;
  }, [selectedPlant, costAnalysisData]);

  // Fetch monthly breakdown for selected plant
  const { data: monthlyBreakdownData, isLoading: isLoadingMonthlyBreakdown } = usePlantMonthlyBreakdown(
    selectedPlantId,
    currentYear,
    costAnalysisFormat
  );

  const selectedPlantBreakdown = useMemo<PlantMonthlyBreakdown[]>(() => {
    const fillMissingMonths = (entries: PlantMonthlyBreakdown[]): PlantMonthlyBreakdown[] => {
      const monthMap = new Map(entries.map((entry) => [entry.month, entry]));
      return monthsOfYear.map((month) => {
        const match = monthMap.get(month);
        return match
          ? match
          : {
              month,
              totalSavings: 0,
              practices: [],
            };
      });
    };

    if (!selectedPlant) {
      return fillMissingMonths(defaultMonthlyBreakdown);
    }

    // Use API data if available
    if (monthlyBreakdownData && monthlyBreakdownData.length > 0) {
      const transformed = monthlyBreakdownData.map(item => ({
        month: item.month,
        totalSavings: parseFloat(item.total_savings || '0'),
        practices: (item.practices || []).map(p => ({
          title: p.title,
          savings: parseFloat(p.savings || '0'),
          benchmarked: p.benchmarked || false
        }))
      }));
      return fillMissingMonths(transformed);
    }

    // Fallback to generated data from practices
    let plantEntries = plantMonthlySavings[selectedPlant.name];
    
    // If plant has no practices, find first practice from that plant in practices
    if (!plantEntries || plantEntries.length === 0) {
      const plantPractice = practices.find(p => (p.plant_name || p.plant) === selectedPlant.name);
      if (plantPractice) {
        const submittedDate = plantPractice.submitted_date || plantPractice.submittedDate;
        const date = new Date(submittedDate || `${currentYear}-01-01`);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        plantEntries = [{
          month: monthKey,
          totalSavings: extractSavingsAmount(plantPractice.savings_amount ? `₹${plantPractice.savings_amount}${plantPractice.savings_currency === 'crores' ? 'Cr' : plantPractice.savings_currency === 'lakhs' ? 'L' : ''}` : plantPractice.savings),
          practices: [{
            title: plantPractice.title,
            savings: extractSavingsAmount(plantPractice.savings_amount ? `₹${plantPractice.savings_amount}${plantPractice.savings_currency === 'crores' ? 'Cr' : plantPractice.savings_currency === 'lakhs' ? 'L' : ''}` : plantPractice.savings),
            benchmarked: plantPractice.is_benchmarked || false
          }]
        }];
      } else {
        // Fallback to default
        plantEntries = defaultMonthlyBreakdown;
      }
    }
    
    return fillMissingMonths(plantEntries);
  }, [selectedPlant, plantMonthlySavings, defaultMonthlyBreakdown, practices, monthlyBreakdownData]);

  const handlePlantRowClick = (plant: PlantCost) => {
    setSelectedPlant(plant);
    setPlantDetailOpen(true);
  };

  const handlePlantRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, plant: PlantCost) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePlantRowClick(plant);
    }
  };

  // Show loading state
  if (isLoadingCostAnalysis) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cost Analysis (Savings)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading cost analysis data...</div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (visible.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cost Analysis (Savings)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No cost analysis data available.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cost Analysis (Savings)</CardTitle>
          <ToggleGroup
            type="single"
            value={costAnalysisFormat}
            onValueChange={(value) => {
              if (value === 'lakhs' || value === 'crores') {
                setCostAnalysisFormat(value);
              }
            }}
            className="border rounded-md"
          >
            <ToggleGroupItem value="lakhs" className="px-3 text-xs" aria-label="Lakhs">
              L
            </ToggleGroupItem>
            <ToggleGroupItem value="crores" className="px-3 text-xs" aria-label="Crores">
              Cr
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plant-wise Donut Charts - Premium Modern Design */}
        {(() => {
          // Premium soft muted color palette - gentle pastels that harmonize
          const COLOR_PALETTE = [
            { 
              name: "Soft Teal",
              base: "hsl(180, 40%, 55%)",      // Muted teal
              light: "hsl(180, 35%, 70%)",     // Light teal
              fade: "hsla(180, 40%, 55%, 0.3)" // Faded for gradient end
            },
            { 
              name: "Warm Coral",
              base: "hsl(15, 45%, 58%)",       // Soft coral
              light: "hsl(15, 40%, 72%)",      // Light coral
              fade: "hsla(15, 45%, 58%, 0.3)"
            },
            { 
              name: "Golden Amber",
              base: "hsl(38, 50%, 60%)",       // Gentle gold
              light: "hsl(38, 45%, 75%)",     // Light gold
              fade: "hsla(38, 50%, 60%, 0.3)"
            },
            { 
              name: "Lavender Mist",
              base: "hsl(270, 35%, 62%)",      // Soft lavender
              light: "hsl(270, 30%, 75%)",    // Light lavender
              fade: "hsla(270, 35%, 62%, 0.3)"
            },
            { 
              name: "Sage Green",
              base: "hsl(150, 35%, 55%)",      // Muted sage
              light: "hsl(150, 30%, 70%)",     // Light sage
              fade: "hsla(150, 35%, 55%, 0.3)"
            },
            { 
              name: "Dusty Rose",
              base: "hsl(340, 40%, 60%)",      // Soft rose
              light: "hsl(340, 35%, 73%)",     // Light rose
              fade: "hsla(340, 40%, 60%, 0.3)"
            },
            { 
              name: "Sky Blue",
              base: "hsl(200, 45%, 58%)",      // Gentle sky blue
              light: "hsl(200, 40%, 72%)",     // Light sky blue
              fade: "hsla(200, 45%, 58%, 0.3)"
            }
          ];

          // For plant users, show only their plant's data
          // For HQ admins, show all plants
          const plantsForCharts = userRole === "plant" && user?.plant_name 
            ? visible.filter(p => p.name === user.plant_name)
            : visible;

          const currentMonthData = plantsForCharts.map((p, idx) => ({
            name: getPlantShortName(p.name),
            fullName: p.name,
            value: p.currentMonth,
            colorIndex: idx % COLOR_PALETTE.length,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
          }));

          const lastMonthData = plantsForCharts.map((p, idx) => ({
            name: getPlantShortName(p.name),
            fullName: p.name,
            value: p.lastMonth,
            colorIndex: idx % COLOR_PALETTE.length,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
          }));

          const yearlyData = plantsForCharts.map((p, idx) => ({
            name: getPlantShortName(p.name),
            fullName: p.name,
            value: p.ytdTillLastMonth,
            colorIndex: idx % COLOR_PALETTE.length,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
          }));

          const currentMonthTotal = currentMonthData.reduce((sum, item) => sum + item.value, 0);
          const lastMonthTotal = lastMonthData.reduce((sum, item) => sum + item.value, 0);
          const yearlyTotal = yearlyData.reduce((sum, item) => sum + item.value, 0);

          // Modular Premium Donut Chart Component
          const renderDonutChart = (
            data: typeof currentMonthData, 
            total: number, 
            title: string, 
            chartId: string,
            activeIndex: number | null,
            setActiveIndex: (index: number | null) => void
          ) => {

            return (
              <div className="relative w-full">
                <ChartContainer
                  config={{
                    value: { label: "Savings", color: "hsl(var(--primary))" },
                  }}
                  className="h-[450px] w-full"
                >
                  <PieChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                    <defs>
                      {/* Drop shadow filter for depth effect */}
                      <filter id={`dropshadow-${chartId}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="2" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      
                      {/* Gradient definitions for each slice - faded from solid to transparent */}
                      {data.map((entry, index) => {
                        return (
                          <linearGradient 
                            key={`gradient-${chartId}-${index}`} 
                            id={`gradient-${chartId}-${index}`} 
                            x1="0%" 
                            y1="0%" 
                            x2="100%" 
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={entry.color.base} stopOpacity={1} />
                            <stop offset="70%" stopColor={entry.color.light} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={entry.color.fade} stopOpacity={0.4} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    
                    {/* Premium styled tooltip */}
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = ((data.value / total) * 100).toFixed(1);
                          return (
                            <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <div 
                                    className="w-3.5 h-3.5 rounded-full shadow-sm" 
                                    style={{ backgroundColor: data.color.base }}
                                  />
                                  <span className="font-semibold text-sm text-foreground">
                                    {data.fullName || data.name}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-2xl font-bold text-primary">
                                    {formatCurrency(data.value, 1, costAnalysisFormat)}
                                  </span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {percent}% of total savings
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Donut Pie with premium styling, labels, and center total */}
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      label={({ percent, midAngle, innerRadius, outerRadius, cx, cy }) => {
                        // Show percentage labels outside the donut chart
                        if (percent < 0.03) return null; // Hide for very small slices
                        
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 22; // Position labels further from the donut
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--foreground))"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fontWeight="600"
                            className="pointer-events-none"
                            style={{
                              textShadow: '0 1px 3px rgba(255,255,255,0.95), 0 0 1px rgba(0,0,0,0.1)'
                            }}
                          >
                            {`${(percent * 100).toFixed(1)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                      outerRadius={110}
                      innerRadius={70}
                      paddingAngle={2}
                      cornerRadius={4}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                      isAnimationActive={true}
                      activeIndex={activeIndex ?? undefined}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#gradient-${chartId}-${index})`}
                          stroke="#ffffff"
                          strokeWidth={2}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: `url(#dropshadow-${chartId})`,
                            transform: activeIndex === index ? 'scale(1.1)' : 'scale(1)',
                            transformOrigin: 'center',
                            opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1
                          }}
                        />
                      ))}
                      {/* Centered label - Total INSIDE the donut hole - as child of Pie */}
                      <Label
                        position="center"
                        content={(props: any) => {
                          const { viewBox } = props;
                          if (!viewBox || viewBox.cx === undefined || viewBox.cy === undefined) {
                            return null;
                          }
                          const { cx, cy } = viewBox;
                          
                          return (
                            <g>
                              {/* Background circle - fits inside the donut hole (innerRadius is 70) */}
                              <circle
                                cx={cx}
                                cy={cy}
                                r="62"
                                fill="hsl(var(--background))"
                                opacity="0.98"
                                stroke="hsl(var(--border))"
                                strokeWidth="1.5"
                              />
                              {/* Total value - large and bold, perfectly centered */}
                              <text
                                x={cx}
                                y={cy - 6}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="hsl(var(--foreground))"
                                fontSize="28"
                                fontWeight="700"
                                className="font-bold pointer-events-none"
                              >
                                {formatCurrency(total, 1, costAnalysisFormat)}
                              </text>
                              {/* Title below total */}
                              <text
                                x={cx}
                                y={cy + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="hsl(var(--muted-foreground))"
                                fontSize="13"
                                fontWeight="500"
                                className="font-medium pointer-events-none"
                              >
                                {title}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Pie>
                    
                  </PieChart>
                </ChartContainer>
              </div>
            );
          };

          // Get unique plants with their colors for the shared legend (HQ only)
          const uniquePlants = userRole === "hq" 
            ? currentMonthData.map((entry, index) => ({
                name: entry.fullName || entry.name,
                shortName: entry.name,
                color: entry.color
              }))
            : [];

          // For plant users, show only Current Month and YTD charts (as per documentation)
          // For HQ admins, show all three charts (Current Month, Last Month, YTD)
          const showLastMonthChart = userRole === "hq";

          return (
            <div>
              <div className={`grid grid-cols-1 ${showLastMonthChart ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-center">Current Month Savings</h3>
                  {renderDonutChart(currentMonthData, currentMonthTotal, "Current Month", "current", currentChartActiveIndex, setCurrentChartActiveIndex)}
                </div>
                {showLastMonthChart && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Last Month Savings</h3>
                    {renderDonutChart(lastMonthData, lastMonthTotal, "Last Month", "last", lastChartActiveIndex, setLastChartActiveIndex)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-center">Yearly Savings (YTD)</h3>
                  {renderDonutChart(yearlyData, yearlyTotal, "Yearly (YTD)", "yearly", yearlyChartActiveIndex, setYearlyChartActiveIndex)}
                </div>
              </div>
              
              {/* Single shared legend - horizontal straight line, shown once with percentages */}
              {/* Only show legend for HQ admins (multiple plants), plant users see single plant */}
              {userRole === "hq" && (
                <div className="mt-8 flex justify-center">
                  <div className="bg-muted/30 rounded-lg p-5 border border-border/50">
                    <div className="flex flex-wrap justify-center items-center gap-4">
                      {uniquePlants.map((plant, index) => {
                        // Calculate percentage from current month data
                        const plantData = currentMonthData.find(p => (p.fullName || p.name) === plant.name);
                        const percent = plantData ? ((plantData.value / currentMonthTotal) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-background transition-colors"
                          >
                            <div
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm border border-border/30"
                              style={{ backgroundColor: plant.color.base }}
                            />
                            <span className="text-sm font-medium text-foreground whitespace-nowrap">
                              {plant.shortName}
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                              ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Division-wise savings table */}
        {userRole === "hq" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Division</th>
                  <th className="py-2">Last Month Savings</th>
                  <th className="py-2">Current Month Savings</th>
                  <th className="py-2">YTD till last month</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-accent/50">
                  <td className="py-2 font-medium">Component</td>
                  <td className="py-2">{formatCurrency(componentTotals.lastMonth, 1, costAnalysisFormat)}</td>
                  <td className="py-2">{formatCurrency(componentTotals.currentMonth, 1, costAnalysisFormat)}</td>
                  <td className="py-2">{formatCurrency(componentTotals.ytdTillLastMonth, 1, costAnalysisFormat)}</td>
                </tr>
                <tr className="hover:bg-accent/50">
                  <td className="py-2 font-medium">Total</td>
                  <td className="py-2">{formatCurrency(companyTotals.lastMonth, 1, costAnalysisFormat)}</td>
                  <td className="py-2">{formatCurrency(companyTotals.currentMonth, 1, costAnalysisFormat)}</td>
                  <td className="py-2">{formatCurrency(companyTotals.ytdTillLastMonth, 1, costAnalysisFormat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Plant-wise table (exact savings figures) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2">Plant</th>
                {userRole === "hq" && <th className="py-2">Division</th>}
                <th className="py-2">Last Month Savings</th>
                <th className="py-2">Current Month Savings</th>
                <th className="py-2">YTD till last month</th>
                <th className="py-2">% vs last month</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((p) => (
              <tr
                key={p.name}
                className="hover:bg-accent/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                role="button"
                tabIndex={0}
                onClick={() => handlePlantRowClick(p)}
                onKeyDown={(event) => handlePlantRowKeyDown(event, p)}
              >
                <td className="py-2 font-medium">{p.name}</td>
                {userRole === "hq" && <td className="py-2">{p.division}</td>}
                <td className="py-2">{formatCurrency(p.lastMonth, 1, costAnalysisFormat)}</td>
                <td className="py-2">{formatCurrency(p.currentMonth, 1, costAnalysisFormat)}</td>
                <td className="py-2">{formatCurrency(p.ytdTillLastMonth, 1, costAnalysisFormat)}</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className={
                      pctChange(p.currentMonth, p.lastMonth) >= 0
                        ? "bg-success/10 text-success border-success"
                        : "bg-destructive/10 text-destructive border-destructive"
                    }
                  >
                    {pctChange(p.currentMonth, p.lastMonth).toFixed(1)}%
                  </Badge>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AlertDialog open={plantDetailOpen} onOpenChange={setPlantDetailOpen}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedPlant ? `${selectedPlant.name} – Monthly Savings & BPs` : "Plant Savings Details"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Breakdown of best practices uploaded each month and their contribution to savings (₹{costAnalysisFormat === 'crores' ? 'Cr' : 'L'}).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Total Savings (₹{costAnalysisFormat === 'crores' ? 'Cr' : 'L'})</th>
                    <th className="py-2 pr-4">Best Practices</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPlantBreakdown.map((entry) => {
                    const hasPractices = entry.practices.length > 0;
                    const monthLabel = new Date(entry.month + "-01").toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    });
                    
                    return (
                      <tr key={entry.month}>
                        <td className="py-2 pr-4 font-medium">
                          {monthLabel}
                        </td>
                        <td className="py-2 pr-4">{formatCurrency(entry.totalSavings, 1, costAnalysisFormat)}</td>
                        <td className="py-2 pr-4">
                          {hasPractices ? (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">
                                {entry.practices.length} {entry.practices.length === 1 ? 'Best Practice' : 'Best Practices'}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMonthPractices({
                                    month: entry.month,
                                    practices: entry.practices
                                  });
                                  setPracticesDialogOpen(true);
                                }}
                                className="h-7 px-3 text-xs"
                              >
                                View More
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No best practices recorded.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {selectedPlantBreakdown.length === 0 && (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={3}>
                        No savings data available for this plant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setPlantDetailOpen(false)}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Best Practices Detail Dialog */}
        <AlertDialog open={practicesDialogOpen} onOpenChange={setPracticesDialogOpen}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedMonthPractices && selectedPlant
                  ? `${selectedPlant.name} – Best Practices for ${new Date(selectedMonthPractices.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                  : "Best Practices Details"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                All best practices and their savings for this month (₹{costAnalysisFormat === 'crores' ? 'Cr' : 'L'}).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedMonthPractices && selectedMonthPractices.practices.length > 0 ? (
                selectedMonthPractices.practices.map((practice, idx) => {
                  // Find the full practice data from practices API data
                  const fullPractice = practices.find(
                    (p) => p.title === practice.title && selectedPlant && (p.plant_name || p.plant) === selectedPlant.name
                  ) || practices.find((p) => p.title === practice.title);
                  
                  // Format date - use practice submittedDate if available, otherwise use month
                  const submittedDate = fullPractice?.submitted_date || fullPractice?.submittedDate;
                  const practiceDate = submittedDate
                    ? new Date(submittedDate).toLocaleDateString("en-IN", { 
                        day: "numeric", 
                        month: "short", 
                        year: "numeric" 
                      })
                    : new Date(selectedMonthPractices.month + "-01").toLocaleDateString("en-IN", { 
                        month: "short", 
                        year: "numeric" 
                      });

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => {
                        if (fullPractice) {
                          setPracticesDialogOpen(false);
                          navigate(`/practices/${fullPractice.id}`);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{practice.title}</h4>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Added: {practiceDate}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              practice.benchmarked
                                ? "bg-primary/10 text-primary border-primary"
                                : "bg-muted/50 text-muted-foreground"
                            }
                          >
                            {formatCurrency(practice.savings, 1, costAnalysisFormat)}
                          </Badge>
                          {practice.benchmarked && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                              Benchmarked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No best practices found for this month.
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setPracticesDialogOpen(false)}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};



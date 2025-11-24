import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn, formatCurrency } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Building2, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Shield,
  Zap,
  Target,
  IndianRupee,
  Settings,
  Users,
  BarChart3,
  AlertTriangle,
  Star,
  Cpu,
  LineChart,
  Bot,
  Loader2
} from "lucide-react";
import { CardSkeleton, TableSkeleton, ListSkeleton, StatsCardSkeleton, ChartSkeleton } from "@/components/ui/skeletons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
// Most analytics data now comes from useUnifiedDashboard hook
// Only usePlantMonthlyTrend is kept for lazy loading when plant is selected
import { usePlantMonthlyTrend } from "@/hooks/useAnalytics";
import { usePlants } from "@/hooks/usePlants";
import { useUnifiedDashboard } from "@/hooks/useUnifiedDashboard";

interface HQAdminDashboardProps {
  thisMonthTotal?: number;
  ytdTotal?: number;
  copySpread?: { bp: string; origin: string; copies: { plant: string; date: string }[] }[];
  leaderboard?: { plant: string; totalPoints: number; breakdown: { type: "Origin" | "Copier"; points: number; date: string; bpTitle: string }[] }[];
}

const HQAdminDashboard = ({ thisMonthTotal, ytdTotal, copySpread, leaderboard }: HQAdminDashboardProps) => {
  const navigate = useNavigate();
  
  // State declarations (must be before hooks that use them)
  const [starRatingsFormat, setStarRatingsFormat] = useState<'lakhs' | 'crores'>('lakhs');
  const [showDivisionSelector, setShowDivisionSelector] = useState(false);
  const [division, setDivision] = useState<"all" | "component">("all");
  const [plantPerformanceView, setPlantPerformanceView] = useState<"yearly" | "currentMonth">("yearly");
  const [leaderboardFormat, setLeaderboardFormat] = useState<'lakhs' | 'crores'>('lakhs');
  const [activePlantsDialogOpen, setActivePlantsDialogOpen] = useState(false);
  const [lbDrillOpen, setLbDrillOpen] = useState(false);
  
  // PERFORMANCE OPTIMIZATION: Use unified dashboard endpoint (1 API call for ALL data)
  const { data: unifiedData, isLoading: unifiedLoading } = useUnifiedDashboard(starRatingsFormat);
  
  // Extract data from unified response
  const overview = unifiedData?.data?.overview;
  const leaderboardData = unifiedData?.data?.leaderboard;
  const copySpreadData = unifiedData?.data?.copy_spread;
  const categoryBreakdown = unifiedData?.data?.category_breakdown || [];
  const benchmarkedPractices = unifiedData?.data?.recent_benchmarked;
  const plantPerformanceData = unifiedData?.data?.plant_performance;
  const benchmarkStatsData = unifiedData?.data?.benchmark_stats;
  const starRatingsData = unifiedData?.data?.star_ratings;
  const recentPractices = unifiedData?.data?.recent_practices;
  
  // Still fetch plants separately as it's used in many places (minimal data)
  const { data: plantsData } = usePlants(true);
  
  // Use unified loading state for all data
  const overviewLoading = unifiedLoading;
  const leaderboardLoading = unifiedLoading;
  const copySpreadLoading = unifiedLoading;
  const categoryLoading = unifiedLoading;
  const benchmarkedPracticesLoading = unifiedLoading;
  const performanceLoading = unifiedLoading;
  const benchmarkStatsLoading = unifiedLoading;
  const starRatingsLoading = unifiedLoading;
  const recentPracticesLoading = unifiedLoading;
  const [lbDrillPlant, setLbDrillPlant] = useState<string | null>(null);
  const [lbDrillData, setLbDrillData] = useState<{
    copied?: { title: string; points: number; date: string }[];
    copiedCount?: number;
    copiedPoints?: number;
    originated?: { title: string; copies: number; points: number }[];
    originatedCount?: number;
    originatedPoints?: number;
    // legacy fields
    copiedByCount?: number;
    copiedByPoints?: number;
    benchmarkedBPsCount?: number;
    benchmarkedBPsPoints?: number;
    perBP?: { title: string; copies: number; points: number }[];
  } | null>(null);
  const [bpSpreadOpen, setBpSpreadOpen] = useState(false);
  const [bpSpreadBP, setBpSpreadBP] = useState<string | null>(null);
  const [bpSpreadRows, setBpSpreadRows] = useState<{ plant: string; date: string }[]>([]);
  const [benchmarkedOpen, setBenchmarkedOpen] = useState(false);
  // star drilldown
  const [starDrillOpen, setStarDrillOpen] = useState(false);
  const [starDrillPlant, setStarDrillPlant] = useState<string | null>(null);
  const [starDrillPlantId, setStarDrillPlantId] = useState<string | null>(null);
  const [starDrillData, setStarDrillData] = useState<{ month: string; savings: number; stars: number }[]>([]);
  
  // Use API data with fallback to props
  const actualThisMonthTotal = overview?.monthly_count ?? thisMonthTotal ?? 187;
  const actualYtdTotal = overview?.ytd_count ?? ytdTotal ?? 295;
  
  // Fetch monthly trend for selected plant (lazy loading - only when plant selected)
  const { data: monthlyTrendData, isLoading: monthlyTrendLoading } = usePlantMonthlyTrend(
    starDrillPlantId || undefined,
    undefined,
    starRatingsFormat
  );

  const mergedLeaderboard = useMemo(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      // Transform API data to match component expectations
      return leaderboardData.map((entry: any) => ({
        plant_id: entry.plant_id,
        plant_name: entry.plant_name,
        plant: entry.plant_name, // For compatibility
        totalPoints: entry.total_points,
        total_points: entry.total_points,
        rank: entry.rank,
        breakdown: (entry.breakdown || []).map((b: any) => ({
          type: b.type === "Origin" ? "Origin" : "Copier",
          points: b.points,
          date: b.date,
          bpTitle: b.bp_title,
          bp_title: b.bp_title,
        })),
      }));
    }
    if (leaderboard && leaderboard.length > 0) {
      // Transform props data if provided
      return leaderboard.map((entry: any) => ({
        plant_id: entry.plant_id || entry.plant,
        plant_name: entry.plant_name || entry.plant,
        plant: entry.plant_name || entry.plant,
        totalPoints: entry.totalPoints || entry.total_points,
        total_points: entry.totalPoints || entry.total_points,
        rank: entry.rank,
        breakdown: (entry.breakdown || []).map((b: any) => ({
          type: b.type,
          points: b.points,
          date: b.date,
          bpTitle: b.bpTitle || b.bp_title,
          bp_title: b.bpTitle || b.bp_title,
        })),
      }));
    }
    return [];
  }, [leaderboardData, leaderboard]);

  // Use API data for plant performance
  const plantData = useMemo(() => {
    if (plantPerformanceData && plantPerformanceData.length > 0) {
      return plantPerformanceData.map((p: any) => ({
        name: p.plant_name,
        submitted: p.submitted_count || p.monthly_count || 0,
      }));
    }
    // Fallback to empty array if no data
    return [];
  }, [plantPerformanceData]);

  // Use API data for monthly performance (current month)
  const plantMonthlyPerformance = useMemo(() => {
    if (plantPerformanceData && plantPerformanceData.length > 0) {
      return plantPerformanceData.map((p: any) => ({
        name: p.plant_name,
        submitted: p.monthly_count || 0,
      }));
    }
    return [];
  }, [plantPerformanceData]);

  // Use API data for benchmarked BPs (copy spread)
  const benchmarkedBPs = useMemo(() => {
    if (copySpreadData && copySpreadData.length > 0) {
      return copySpreadData.map((item: any) => ({
        bp: item.bp_title || item.bp,
        origin: item.origin_plant_name || item.origin,
        copies: (item.copies || []).map((copy: any) => ({
          plant: copy.plant_name || copy.plant,
          date: copy.copied_date || copy.date,
        })),
      }));
    }
    return [];
  }, [copySpreadData]);

  // Submission-derived active plants
  const totalPlantCount = plantsData?.length || plantData.length || 7;
  const activeBySubmission = useMemo(() => plantData.filter((p) => p.submitted > 0), [plantData]);
  const activeBySubmissionCount = activeBySubmission.length;
  const ytdSubmissions = useMemo(() => plantData.reduce((sum, p) => sum + (p.submitted || 0), 0), [plantData]);

  // Derive component plants from API data
  const componentPlants = useMemo(() => {
    if (!plantsData || plantsData.length === 0) return [];
    return plantsData.map((plant: any) => ({
      name: plant.name || plant.plant_name,
      active: activeBySubmission.some((p) => p.name === (plant.name || plant.plant_name))
    }));
  }, [plantsData, activeBySubmission]);

  const plantShortLabel: Record<string, string> = {
    "Greater Noida (Ecotech 1)": "Greater Noida",
    "Kanchipuram": "Kanchipuram",
    "Rajpura": "Rajpura",
    "Shahjahanpur": "Shahjahanpur",
    "Supa": "Supa",
    "Ranjangaon": "Ranjangaon",
    "Ponneri": "Ponneri",
  };

  const { activeCount, inactiveCount } = useMemo(() => {
    const activeCount = activeBySubmissionCount;
    const inactiveCount = Math.max(totalPlantCount - activeBySubmissionCount, 0);
    return { activeCount, inactiveCount };
  }, [activeBySubmissionCount, totalPlantCount]);

  // Division-wise derivation based on submissions
  const componentNames = useMemo(() => plantData.map((p) => p.name), [plantData]);
  const activeNameSet = useMemo(() => new Set(activeBySubmission.map((p) => p.name)), [activeBySubmission]);

  const divisionActiveNames = useMemo(() => {
    if (division === "component") return componentNames.filter((n) => activeNameSet.has(n));
    return componentNames.filter((n) => activeNameSet.has(n));
  }, [division, componentNames, activeNameSet]);

  const divisionInactiveNames = useMemo(() => {
    // Derive inactive plants from plantData (plants with submitted === 0)
    return plantData.filter((p) => p.submitted === 0).map((p) => p.name);
  }, [plantData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* HQ Overview Header */}
      <div className="lg:col-span-4">
        <Card className="bg-gradient-hero text-primary-foreground shadow-strong border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Component Division Overview</h2>
                <p className="text-primary-foreground/80">Amber Best Practice & Benchmarking Portal</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  onClick={() => setShowDivisionSelector((v) => !v)}
                >
                  Active
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Division Selector */}
      {showDivisionSelector && (
        <div className="lg:col-span-4">
          <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={division === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDivision("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={division === "component" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDivision("component")}
                  >
                    Component
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success">Active: {divisionActiveNames.length}</Badge>
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Inactive: {divisionInactiveNames.length}</Badge>
                </div>
              </div>

              {/* Active / Inactive lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Active Plants</p>
                  <div className="space-y-2">
                    {divisionActiveNames.map((name) => (
                      <div key={name} className="flex items-center justify-between">
                        <span>{name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-success/10 text-success">Active</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Inactive Plants</p>
                  <div className="space-y-2">
                    {divisionInactiveNames.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No inactive plants</div>
                    ) : (
                      divisionInactiveNames.map((name) => (
                        <div key={name} className="flex items-center justify-between">
                          <span>{name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Inactive</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics */}
      <div className="lg:col-span-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Total Submissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="h-12 w-16 bg-muted animate-pulse rounded mb-2 mx-auto" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto" />
                  </div>
                  <div>
                    <div className="h-12 w-16 bg-muted animate-pulse rounded mb-2 mx-auto" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto" />
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{actualThisMonthTotal}</div>
                  <p className="text-sm text-muted-foreground">in {new Date().toLocaleString('default', { month: 'long' })}</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{actualYtdTotal}</div>
                  <p className="text-sm text-muted-foreground">This Year</p>
                </div>
              </div>
              )}
              {overview?.percent_change !== undefined && overview.percent_change !== null && (
                <div className="mt-2 text-center">
                  <Badge variant="outline" className={overview.percent_change >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {overview.percent_change >= 0 ? '+' : ''}{overview.percent_change.toFixed(1)}% vs last month
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Benchmarked BPs */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Total Benchmarked BPs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {overviewLoading ? (
                <div className="space-y-2">
                  <div className="h-12 w-20 bg-muted animate-pulse rounded mx-auto" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary cursor-pointer" onClick={() => setBenchmarkedOpen(true)}>
                    {overview?.benchmarked_count ?? 150}
                  </div>
                  <p className="text-sm text-muted-foreground">Tap to view details</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card 
            className="shadow-card cursor-pointer hover:shadow-medium transition-smooth"
            onClick={() => setActivePlantsDialogOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Active Plants</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{activeBySubmissionCount}/{totalPlantCount} plants</div>
              <p className="text-sm text-muted-foreground">Contributing this month (submission-based)</p>
              <div className="mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {totalPlantCount > 0 ? Math.round((activeBySubmissionCount / totalPlantCount) * 100) : 0}% Participation
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drilldown: Benchmarked BPs */}
      <AlertDialog open={benchmarkedOpen} onOpenChange={setBenchmarkedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benchmarked BPs - Copy Spread</AlertDialogTitle>
            <AlertDialogDescription>
              Shows origin plant, which plants copied each BP, and dates. If none copied, you'll see a notice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {benchmarkedBPs.map((row) => (
              <div key={row.bp} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{row.bp}</div>
                  <Badge variant="outline" className="text-xs">Origin: {row.origin}</Badge>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-1">Copied By Plant</th>
                        <th className="py-1">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {row.copies.map((c, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{c.plant}</td>
                          <td className="py-1">{c.date}</td>
                        </tr>
                      ))}
                      {row.copies.length === 0 && (
                        <tr>
                          <td className="py-1 text-muted-foreground" colSpan={2}>This benchmarked BP has not been copied to any plant</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setBenchmarkedOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Breakdown - Group Wide */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category Wise BP's</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br p-4 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {categoryBreakdown?.map((cat) => {
                const getIcon = (name: string | undefined) => {
                  if (!name) return <Settings className="h-8 w-8 text-purple-600" />;
                  switch (name.toLowerCase()) {
                    case 'safety': return <Shield className="h-8 w-8 text-red-600" />;
                    case 'quality': return <Target className="h-8 w-8 text-green-600" />;
                    case 'productivity': return <Zap className="h-8 w-8 text-blue-600" />;
                    case 'cost': return <IndianRupee className="h-8 w-8 text-yellow-600" />;
                    case 'digitalisation': return <Cpu className="h-8 w-8 text-purple-600" />;
                    case 'esg': return <LineChart className="h-8 w-8 text-green-600" />;
                    case 'automation': return <Bot className="h-8 w-8 text-orange-600" />;
                    default: return <Settings className="h-8 w-8 text-purple-600" />;
                  }
                };

                const getCategoryColor = (name: string | undefined) => {
                  if (!name) return "from-purple-50 to-purple-100 border-purple-200";
                  switch (name.toLowerCase()) {
                    case "safety":
                      return "from-pink-50 to-pink-100 border-pink-200";
                    case "quality":
                      return "from-green-50 to-green-100 border-green-200";
                    case "productivity":
                      return "from-blue-50 to-blue-100 border-blue-200";
                    case "cost":
                      return "from-yellow-50 to-yellow-100 border-yellow-200";
                    case "digitalisation":
                      return "from-purple-50 to-purple-100 border-purple-200";
                    case "esg":
                      return "from-green-50 to-green-100 border-green-200";
                    case "automation":
                      return "from-orange-50 to-orange-100 border-orange-200";
                    default:
                      return "from-purple-50 to-purple-100 border-purple-200";
                  }
                };
                
                if (!cat.category_name) return null;

                return (
                  <div key={cat.category_id || cat.category_name} className={`bg-gradient-to-br p-4 rounded-lg border ${getCategoryColor(cat.category_name)}`}>
                    <div className="flex items-center space-x-3">
                      {getIcon(cat.category_name)}
                      <div>
                        <p className="font-semibold">{cat.category_name}</p>
                        <p className="text-2xl font-bold">{cat.practice_count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plant-wise Performance */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Plant-wise Performance(Uploaded BP's)</span>
              </CardTitle>
              <ToggleGroup
                type="single"
                value={plantPerformanceView}
                onValueChange={(value) => {
                  if (value === "yearly" || value === "currentMonth") {
                    setPlantPerformanceView(value);
                  }
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem value="yearly" aria-label="Yearly performance" className="px-4 text-sm">
                  Yearly
                </ToggleGroupItem>
                <ToggleGroupItem value="currentMonth" aria-label="Current month performance" className="px-4 text-sm">
                  Current Month
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <ChartSkeleton />
            ) : (
            <ChartContainer
              config={{
                submitted: { label: "Uploaded", color: "hsl(var(--success))" },
              }}
              className="h-[400px] w-full"
            >
              <BarChart
                data={(plantPerformanceData || []).map((p) => ({
                  plant: p.short_name,
                  fullName: p.plant_name,
                  submitted: p.submitted,
                }))}
                margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradientSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plant" />
                <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.fullName || label}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {label}
                              </span>
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="h-2 w-2 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-[0.70rem] text-muted-foreground">
                                  {entry.dataKey}: {entry.value}
                                </span>
                              </div>
                            ))}
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
      </div>


      {/* Benchmark BPs - This Month */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Benchmark BPs - {new Date().toLocaleString('default', { month: 'long' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {benchmarkStatsLoading ? (
              <ChartSkeleton />
            ) : (() => {
              const benchmarkBPs = benchmarkStatsData || [];
              const totalThisMonth = benchmarkBPs.reduce((sum, p) => sum + p.benchmarked_count, 0);
              return (
            <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Number of benchmarked BPs per plant this month
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Total: {totalThisMonth}
                    </Badge>
                  </div>
                  <ChartContainer
                    config={{
                      benchmarkedBPs: { label: "Benchmarked BPs", color: "hsl(var(--primary))" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <BarChart data={benchmarkBPs.map(p => ({ 
                      plant: p.plant_name.split('(')[0].trim(),
                      fullName: p.plant_name,
                      benchmarkedBPs: p.benchmarked_count 
                    }))} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradientBenchmarkedBPs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plant" />
                      <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      {data.fullName || label}
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {label}
                                    </span>
                                  </div>
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-[0.70rem] text-muted-foreground">
                                        {entry.dataKey}: {entry.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                    </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="benchmarkedBPs" fill="url(#gradientBenchmarkedBPs)" radius={[8, 8, 0, 0]}>
                      <LabelList dataKey="benchmarkedBPs" position="top" className="text-xs fill-current" />
                    </Bar>
                    </BarChart>
                  </ChartContainer>
                    </div>
              );
            })()}
          </CardContent>
        </Card>
                    </div>

      {/* Recent Benchmark BPs */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Latest Benchmark BPs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {benchmarkedPracticesLoading ? (
              <ListSkeleton items={4} />
            ) : benchmarkedPractices && benchmarkedPractices.length > 0 ? (
              <div className="space-y-4">
                {benchmarkedPractices.slice(0, 4).map((bp: any) => {
                  // Format benchmarked date
                  const benchmarkedDate = bp.benchmarked_date 
                    ? new Date(bp.benchmarked_date)
                    : null;
                  const timeAgo = benchmarkedDate
                    ? (() => {
                        const diffMs = Date.now() - benchmarkedDate.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffHours / 24);
                        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                        return 'Just now';
                      })()
                    : 'Recently';
                  
                  return (
                    <div 
                      key={bp.practice_id || bp.id} 
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth hover-lift"
                      onClick={() => {
                        navigate(`/practices/${bp.practice_id || bp.id}`);
                      }}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{bp.practice_title || bp.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {bp.practice_category || bp.category_name || bp.category || "Other"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {bp.plant_name || bp.plant || "Unknown Plant"}
                          </span>
                          <span className="text-xs text-muted-foreground">• {timeAgo}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/practices/${bp.practice_id || bp.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No benchmarked practices yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Star Ratings - Savings based (Monthly) with drilldown */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Star Ratings (Savings)</span>
              </CardTitle>
              <ToggleGroup
                type="single"
                value={starRatingsFormat}
                onValueChange={(value) => {
                  if (value === 'lakhs' || value === 'crores') {
                    setStarRatingsFormat(value);
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
          <CardContent>
            {starRatingsLoading ? (
              <TableSkeleton rows={5} />
            ) : starRatingsData && starRatingsData.length > 0 ? (() => {
              // Parse savings strings (e.g., "14.2L" or "196.5L") to numbers
              const parseSavings = (savingsStr: string): number => {
                if (!savingsStr) return 0;
                const isCrores = savingsStr.includes("Cr");
                const isLakhs = savingsStr.includes("L");
                const numStr = savingsStr.replace(/[CrL₹]/g, "").trim();
                const value = parseFloat(numStr) || 0;
                // Convert crores to lakhs for consistent comparison
                return isCrores ? value * 100 : value;
              };

              // Transform API data to match component structure
              const ratings = starRatingsData.map((rating) => {
                const monthly = parseSavings(rating.monthly_savings);
                const ytd = parseSavings(rating.ytd_savings);
                return {
                  plant_id: rating.plant_id,
                  name: rating.plant_name,
                  monthly,
                  ytd,
                  monthStars: rating.stars,
                };
              });

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">Plant</th>
                        <th className="py-2">Monthly Savings</th>
                        <th className="py-2">YTD Savings</th>
                        <th className="py-2">Stars (Month)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ratings.map((r) => (
                        <tr
                          key={r.plant_id || r.name}
                          className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                          onClick={() => {
                            setStarDrillPlant(r.name);
                            setStarDrillPlantId(r.plant_id);
                            setStarDrillOpen(true);
                          }}
                        >
                          <td className="py-2 font-medium">{r.name}</td>
                          <td className="py-2">{formatCurrency(r.monthly, 1, starRatingsFormat)}</td>
                          <td className="py-2">{formatCurrency(r.ytd, 1, starRatingsFormat)}</td>
                          <td className="py-2">{r.monthStars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })() : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No star ratings data available</p>
              </div>
            )}

            {/* Drilldown: Monthly Savings & Stars */}
            <AlertDialog open={starDrillOpen} onOpenChange={setStarDrillOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {starDrillPlant ? `${starDrillPlant} - Monthly Savings & Stars` : "Monthly Savings & Stars"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Savings are in ₹ {starRatingsFormat === 'crores' ? 'crores' : 'lakhs'}; stars are computed per monthly savings criteria.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {monthlyTrendLoading ? (
                  <TableSkeleton rows={5} />
                ) : monthlyTrendData && monthlyTrendData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-1">Month</th>
                          <th className="py-1">Savings (₹{starRatingsFormat === 'crores' ? 'Cr' : 'L'})</th>
                          <th className="py-1">Stars</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyTrendData.map((row) => {
                          // Parse savings string to number
                          const parseSavings = (savingsStr: string): number => {
                            if (!savingsStr) return 0;
                            const isCrores = savingsStr.includes("Cr");
                            const numStr = savingsStr.replace(/[CrL₹]/g, "").trim();
                            const value = parseFloat(numStr) || 0;
                            return isCrores ? value * 100 : value;
                          };
                          const savingsValue = parseSavings(row.savings);
                          return (
                            <tr key={row.month}>
                              <td className="py-1">{row.month}</td>
                              <td className="py-1">{formatCurrency(savingsValue, 1, starRatingsFormat)}</td>
                              <td className="py-1">{row.stars}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No monthly trend data available</p>
                  </div>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    setStarDrillOpen(false);
                    setStarDrillPlant(null);
                    setStarDrillPlantId(null);
                  }}>OK</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* BP Copy Spread */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Horizontal Deployment Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {copySpreadLoading ? (
              <TableSkeleton rows={5} />
            ) : benchmarkedBPs && benchmarkedBPs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">BP Name</th>
                      <th className="py-2">Origin Plant</th>
                      <th className="py-2">Horizontally Deployed (Nos)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {benchmarkedBPs.slice(0, 2).map((row) => (
                      <tr
                        key={row.bp}
                        className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                        onClick={() => {
                          setBpSpreadBP(row.bp);
                          setBpSpreadRows(row.copies);
                          setBpSpreadOpen(true);
                        }}
                      >
                        <td className="py-2 font-medium">{row.bp}</td>
                        <td className="py-2">{row.origin}</td>
                        <td className="py-2">{row.copies.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No copy spread data available</p>
              </div>
            )}

            <AlertDialog open={bpSpreadOpen} onOpenChange={setBpSpreadOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {bpSpreadBP ? `${bpSpreadBP} - Copied by Plants` : "Copied by Plants"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Only benchmarked BPs can be copied. List shows plants and dates of copy.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-1">Plant</th>
                        <th className="py-1">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bpSpreadRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{r.plant}</td>
                          <td className="py-1">{r.date}</td>
                        </tr>
                      ))}
                      {bpSpreadRows.length === 0 && (
                        <tr>
                          <td className="py-1 text-muted-foreground" colSpan={2}>No copies yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setBpSpreadOpen(false)}>OK</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark BP Leaderboard */}
      <div className="lg:col-span-4">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Benchmark BP Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <TableSkeleton rows={5} />
            ) : mergedLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No leaderboard data available</p>
              </div>
            ) : (
              (() => {
              const leaderboardData = mergedLeaderboard;
              
              return (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Total points earned through benchmark BPs (Origin: 10 points, Copier: 5 points)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-1">Serial Number</th>
                          <th className="py-1">Plant</th>
                          <th className="py-1 text-center pl-2">Total Points</th>
                          <th className="py-1 text-center pl-1">Rank</th>
                          <th className="py-1 text-center pl-1">Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {leaderboardData.map((entry, index) => {
                          // Calculate rank based on total points (same points = same rank)
                          // Since data is sorted by totalPoints descending, rank is based on position
                          let rank = index + 1;
                          // If same points as previous entry, use the same rank
                          if (index > 0 && leaderboardData[index - 1].totalPoints === entry.totalPoints) {
                            // Find the first entry with these points to get the correct rank
                            for (let i = index - 1; i >= 0; i--) {
                              if (leaderboardData[i].totalPoints !== entry.totalPoints) {
                                rank = i + 2;
                                break;
                              }
                              rank = i + 1;
                            }
                          }
                          
                          return (
                          <tr
                            key={entry.plant_id || entry.plant}
                            className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                            onClick={() => {
                              const asCopier = entry.breakdown.filter((b) => b.type === "Copier");
                              const copiedCount = asCopier.length;
                              const copiedPoints = asCopier.reduce((s, b) => s + (b.points || 0), 0);

                              const asOrigin = entry.breakdown.filter((b) => b.type === "Origin");
                              const perBPMap = new Map<string, { title: string; copies: number; points: number }>();
                              asOrigin.forEach((b) => {
                                const bpTitle = b.bpTitle || b.bp_title;
                                const prev = perBPMap.get(bpTitle) || { title: bpTitle, copies: 0, points: 0 };
                                prev.copies += 1;
                                prev.points += b.points || 0;
                                perBPMap.set(bpTitle, prev);
                              });
                              const originated = Array.from(perBPMap.values());
                              const originatedCount = originated.length;
                              const originatedPoints = originated.reduce((s, r) => s + r.points, 0);

                              setLbDrillPlant(entry.plant_name || entry.plant);
                              setLbDrillData({
                                copied: asCopier.map((c) => ({ 
                                  title: c.bpTitle || c.bp_title, 
                                  points: c.points, 
                                  date: c.date 
                                })),
                                copiedCount,
                                copiedPoints,
                                originated,
                                originatedCount,
                                originatedPoints,
                              });
                              setLbDrillOpen(true);
                            }}
                          >
                            <td className="py-1 font-medium text-xs">
                              {index + 1}
                            </td>
                            <td className="py-1 font-medium text-xs">{entry.plant_name || entry.plant}</td>
                            <td className="py-1 text-center pl-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary text-xs px-1 py-0">
                                {entry.totalPoints || entry.total_points}
                              </Badge>
                            </td>
                            <td className="py-1 text-center pl-1">
                              {rank === 1 && <Badge variant="outline" className="bg-primary/10 text-primary text-xs px-1 py-0">#1</Badge>}
                              {rank === 2 && <Badge variant="outline" className="bg-secondary/10 text-secondary text-xs px-1 py-0">#2</Badge>}
                              {rank === 3 && <Badge variant="outline" className="bg-accent/10 text-accent-foreground text-xs px-1 py-0">#3</Badge>}
                              {rank > 3 && <span className="text-muted-foreground text-xs">#{rank}</span>}
                            </td>
                            <td className="py-1 text-center pl-1">
                              <div className="text-xs text-muted-foreground">
                                <div className="text-xs">{entry.breakdown.length} entries</div>
                                <div className="mt-0.5 space-y-0.5">
                                  {entry.breakdown.slice(0, 2).map((item, idx) => {
                                    const bpTitle = item.bpTitle || item.bp_title;
                                    return (
                                      <div key={idx} className="flex items-center justify-center gap-1">
                                        <Badge variant="outline" className={
                                          item.type === "Origin" 
                                            ? "bg-success/10 text-success border-success text-xs px-1 py-0" 
                                            : "bg-primary/10 text-primary border-primary text-xs px-1 py-0"
                                        }>
                                          {item.type}: {item.points}
                                        </Badge>
                                        <span className="text-xs">{bpTitle}</span>
                                      </div>
                                    );
                                  })}
                                  {entry.breakdown.length > 2 && (
                                    <div className="text-xs text-muted-foreground text-center">
                                      +{entry.breakdown.length - 2} more...
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })())}
            {/* Leaderboard Drilldown: Origin impact */}
            <AlertDialog open={lbDrillOpen} onOpenChange={setLbDrillOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {lbDrillPlant ? `${lbDrillPlant} - Benchmark Points Breakdown` : "Benchmark Points Breakdown"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Only benchmarked BPs can be copied. Summary below reflects Origin points earned when other plants copied.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">BPs Copied by This Plant</div>
                      <div>Count: <span className="font-semibold">{lbDrillData?.copiedCount ?? lbDrillData?.copiedByCount ?? 0}</span></div>
                      <div>Points: <span className="font-semibold">{lbDrillData?.copiedPoints ?? lbDrillData?.copiedByPoints ?? 0}</span></div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Originated BPs (Benchmarked)</div>
                      <div>Count: <span className="font-semibold">{lbDrillData?.originatedCount ?? lbDrillData?.benchmarkedBPsCount ?? 0}</span></div>
                      <div>Points: <span className="font-semibold">{lbDrillData?.originatedPoints ?? lbDrillData?.benchmarkedBPsPoints ?? 0}</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-2">Copied by This Plant (Details)</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="py-1">BP Title</th>
                              <th className="py-1">Points</th>
                              <th className="py-1">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {(lbDrillData?.copied ?? []).map((row, idx) => (
                              <tr key={idx}>
                                <td className="py-1">{row.title}</td>
                                <td className="py-1">{row.points}</td>
                                <td className="py-1">{row.date}</td>
                              </tr>
                            ))}
                            {(!lbDrillData || (lbDrillData.copied && lbDrillData.copied.length === 0)) && (
                              <tr>
                                <td className="py-1 text-muted-foreground" colSpan={3}>No copied entries</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Benchmarked BPs (Details)</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="py-1">BP Title</th>
                              <th className="py-1">Copies</th>
                              <th className="py-1">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {(lbDrillData?.originated ?? lbDrillData?.perBP ?? []).map((row: any) => (
                              <tr key={row.title}>
                                <td className="py-1">{row.title}</td>
                                <td className="py-1">{row.copies}</td>
                                <td className="py-1">{row.points}</td>
                              </tr>
                            ))}
                            {(!lbDrillData || ((lbDrillData.originated && lbDrillData.originated.length === 0) || (!lbDrillData.originated && (!lbDrillData.perBP || lbDrillData.perBP.length === 0)))) && (
                              <tr>
                                <td className="py-1 text-muted-foreground" colSpan={3}>No originated benchmarked BPs</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setLbDrillOpen(false)}>OK</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="lg:col-span-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Latest Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPracticesLoading ? (
              <ListSkeleton items={4} />
            ) : recentPractices && recentPractices.length > 0 ? (
              <div className="space-y-4">
                {recentPractices.map((practice) => {
                  // Calculate time ago from created_at
                  const createdDate = practice.created_at ? new Date(practice.created_at) : null;
                  const timeAgo = createdDate
                    ? (() => {
                        const diffMs = Date.now() - createdDate.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffHours / 24);
                        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                        return 'Just now';
                      })()
                    : 'Recently';
                  
                  return (
                    <div 
                      key={practice.id} 
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth hover-lift"
                      onClick={() => {
                        navigate(`/practices/${practice.id}`);
                      }}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{practice.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {practice.category_name || practice.category || "Other"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{practice.plant_name || practice.plant || "Unknown Plant"}</span>
                          <span className="text-xs text-muted-foreground">• {timeAgo}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/practices/${practice.id}`);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No recent practices available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Plants Dialog */}
      <AlertDialog open={activePlantsDialogOpen} onOpenChange={setActivePlantsDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Active Plants Status</AlertDialogTitle>
            <AlertDialogDescription>
              View which plants are active (have submitted best practices) and which are inactive this month.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {/* Active Plants */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Active Plants ({activeBySubmission.length})
              </h4>
              <div className="space-y-2">
                {activeBySubmission.map((plant) => (
                  <div
                    key={plant.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-success/20 bg-success/5 hover:bg-success/10 transition-colors"
                  >
                    <span className="font-medium text-sm">{plant.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{plant.submitted} submissions</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive Plants */}
            {plantData.filter((p) => p.submitted === 0).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Inactive Plants ({plantData.filter((p) => p.submitted === 0).length})
                </h4>
                <div className="space-y-2">
                  {plantData
                    .filter((p) => p.submitted === 0)
                    .map((plant) => (
                      <div
                        key={plant.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                      >
                        <span className="font-medium text-sm">{plant.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">0 submissions</span>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                            Inactive
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setActivePlantsDialogOpen(false)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HQAdminDashboard;
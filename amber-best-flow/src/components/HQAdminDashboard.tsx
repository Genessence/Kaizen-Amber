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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { useDashboardOverview, usePlantPerformance, useBenchmarkStats, useCategoryBreakdown } from "@/hooks/useAnalytics";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useCopySpread, useRecentBenchmarkedPractices } from "@/hooks/useBenchmarking";
import { usePlants } from "@/hooks/usePlants";

interface HQAdminDashboardProps {
  thisMonthTotal?: number;
  ytdTotal?: number;
  copySpread?: { bp: string; origin: string; copies: { plant: string; date: string }[] }[];
  leaderboard?: { plant: string; totalPoints: number; breakdown: { type: "Origin" | "Copier"; points: number; date: string; bpTitle: string }[] }[];
}

const HQAdminDashboard = ({ onViewPractice, thisMonthTotal, ytdTotal, copySpread, leaderboard }: HQAdminDashboardProps) => {
  const navigate = useNavigate();
  // Fetch data from API
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: copySpreadData, isLoading: copySpreadLoading } = useCopySpread(2);
  const { data: categoryBreakdown, isLoading: categoryLoading } = useCategoryBreakdown();
  const { data: benchmarkedPractices, isLoading: benchmarkedPracticesLoading } = useRecentBenchmarkedPractices(4);
  const { data: plantsData } = usePlants(true);
  
  const [showDivisionSelector, setShowDivisionSelector] = useState(false);
  const [division, setDivision] = useState<"all" | "component">("all");
  const [plantPerformanceView, setPlantPerformanceView] = useState<"yearly" | "currentMonth">("yearly");
  
  // Fetch plant performance data based on view
  const { data: plantPerformanceData, isLoading: performanceLoading } = usePlantPerformance(
    plantPerformanceView === "yearly" ? "yearly" : "monthly"
  );
  
  // Fetch benchmark stats for current month
  const { data: benchmarkStatsData, isLoading: benchmarkStatsLoading } = useBenchmarkStats();
  
  // Use API data with fallback to props
  const actualThisMonthTotal = overview?.monthly_count ?? thisMonthTotal ?? 187;
  const actualYtdTotal = overview?.ytd_count ?? ytdTotal ?? 295;
  // Leaderboard drilldown (legacy shape kept for compatibility)
  const [lbDrillOpen, setLbDrillOpen] = useState(false);
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
  const [starDrillData, setStarDrillData] = useState<{ month: string; savings: number; stars: number }[]>([]);
  const [starRatingsFormat, setStarRatingsFormat] = useState<'lakhs' | 'crores'>('lakhs');
  const [leaderboardFormat, setLeaderboardFormat] = useState<'lakhs' | 'crores'>('lakhs');
  const [activePlantsDialogOpen, setActivePlantsDialogOpen] = useState(false);

  // Base leaderboard to keep table sizable; merge dynamic updates
  const baseLeaderboard = useMemo(() => ([
    { 
      plant: "Greater Noida (Ecotech 1)", 
      totalPoints: 36, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-02-12", bpTitle: "Digital Production Control Tower" },
        { type: "Copier", points: 5, date: "2025-02-20", bpTitle: "Assembly Line Cobots" },
        { type: "Origin", points: 10, date: "2025-01-15", bpTitle: "Automated Quality Inspection" },
        { type: "Copier", points: 5, date: "2025-03-10", bpTitle: "Safety Protocol for Chemical Handling" },
        { type: "Origin", points: 6, date: "2025-03-18", bpTitle: "Waste Reduction Initiative" }
      ]
    },
    { 
      plant: "Kanchipuram", 
      totalPoints: 28, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-05-20", bpTitle: "IoT Sensor Implementation" },
        { type: "Copier", points: 5, date: "2025-04-12", bpTitle: "Digital Production Control Tower" },
        { type: "Copier", points: 5, date: "2025-05-05", bpTitle: "Assembly Line Cobots" },
        { type: "Origin", points: 8, date: "2025-03-25", bpTitle: "Lean Packaging Redesign" }
      ]
    },
    { 
      plant: "Rajpura", 
      totalPoints: 26, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-02-28", bpTitle: "Green Energy Dashboard" },
        { type: "Copier", points: 5, date: "2025-03-22", bpTitle: "ESG Compliance Monitoring Program" },
        { type: "Origin", points: 6, date: "2025-01-30", bpTitle: "Smart Inventory Tagging" },
        { type: "Copier", points: 5, date: "2025-04-18", bpTitle: "Assembly Line Cobots" }
      ]
    },
    { 
      plant: "Shahjahanpur", 
      totalPoints: 22, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-06-14", bpTitle: "Digital Production Control Tower" },
        { type: "Copier", points: 5, date: "2025-05-04", bpTitle: "IoT Sensor Implementation" },
        { type: "Copier", points: 5, date: "2025-02-15", bpTitle: "Waste Reduction Initiative" },
        { type: "Origin", points: 2, date: "2025-03-02", bpTitle: "Visual Management Boards" }
      ]
    },
    { 
      plant: "Supa", 
      totalPoints: 20, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-03-10", bpTitle: "Safety Protocol for Chemical Handling" },
        { type: "Copier", points: 5, date: "2025-02-25", bpTitle: "Digital Production Control Tower" },
        { type: "Copier", points: 5, date: "2025-04-05", bpTitle: "IoT Sensor Implementation" }
      ]
    },
    { 
      plant: "Ranjangaon", 
      totalPoints: 19, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-04-08", bpTitle: "Production Line Optimization" },
        { type: "Copier", points: 5, date: "2025-04-22", bpTitle: "Assembly Line Cobots" },
        { type: "Copier", points: 4, date: "2025-05-26", bpTitle: "ESG Compliance Monitoring Program" }
      ]
    },
    { 
      plant: "Ponneri", 
      totalPoints: 18, 
      breakdown: [
        { type: "Origin", points: 10, date: "2025-02-09", bpTitle: "ESG Compliance Monitoring Program" },
        { type: "Copier", points: 5, date: "2025-03-18", bpTitle: "Waste Reduction Initiative" },
        { type: "Copier", points: 3, date: "2025-05-12", bpTitle: "Safety Protocol for Chemical Handling" }
      ]
    }
  ]), []);

  const mergedLeaderboard = useMemo(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      return leaderboardData;
    }
    if (leaderboard && leaderboard.length > 0) {
      return leaderboard;
    }
    return baseLeaderboard;
  }, [leaderboardData, leaderboard, baseLeaderboard]);

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

  // Division datasets (mocked per requirements)
  const [componentPlants, setComponentPlants] = useState<{ name: string; active: boolean }[]>([
    { name: "Component - Greater Noida (Ecotech 1)", active: true },
    { name: "Component - Kanchipuram", active: true },
    { name: "Component - Rajpura", active: true },
    { name: "Component - Shahjahanpur", active: true },
    { name: "Component - Supa", active: true },
    { name: "Component - Ranjangaon", active: false },
    { name: "Component - Ponneri", active: false },
    { name: "Component - Additional Plant A", active: false },
    { name: "Component - Additional Plant B", active: true },
    { name: "Component - Additional Plant C", active: true },
    { name: "Component - Additional Plant D", active: true },
    { name: "Component - Additional Plant E", active: true },
    { name: "Component - Additional Plant F", active: false },
    { name: "Component - Additional Plant G", active: false },
    { name: "Component - Additional Plant H", active: false },
  ]);

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
    // Only show Ponneri in inactive list
    return ["Ponneri"];
  }, []);

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
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <div className="mt-2 text-center">
                <Badge variant="outline" className="bg-success/10 text-success">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23% vs last month
                </Badge>
              </div>
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
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {categoryBreakdown?.map((cat) => {
                const getIcon = (name: string) => {
                  switch (name.toLowerCase()) {
                    case 'safety': return <Shield className="h-8 w-8" />;
                    case 'quality': return <Target className="h-8 w-8" />;
                    case 'productivity': return <Zap className="h-8 w-8" />;
                    case 'cost': return <IndianRupee className="h-8 w-8" />;
                    case 'digitalisation': return <Cpu className="h-8 w-8" />;
                    case 'esg': return <LineChart className="h-8 w-8" />;
                    case 'automation': return <Bot className="h-8 w-8" />;
                    default: return <Settings className="h-8 w-8" />;
                  }
                };
                
                return (
                  <div key={cat.category_id} className={`bg-gradient-to-br p-4 rounded-lg border ${cat.color_class}`}>
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
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
            {(() => {
              // Demo savings data (in lakhs ₹)
              const savings = [
                { name: "Greater Noida (Ecotech 1)", monthly: 14.2, ytd: 196.5 },
                { name: "Kanchipuram", monthly: 11.8, ytd: 148.0 },
                { name: "Rajpura", monthly: 9.5, ytd: 128.3 },
                { name: "Shahjahanpur", monthly: 7.2, ytd: 102.4 },
              ];

              const getStars = (monthly: number, ytd: number) => {
                // Both monthly and yearly thresholds must be met for a band
                if (ytd > 200 && monthly > 16) return 5;
                if (ytd > 150 && ytd < 200 && monthly > 12 && monthly < 16) return 4;
                if (ytd > 100 && ytd < 150 && monthly > 8 && monthly < 12) return 3;
                if (ytd > 50 && ytd < 100 && monthly > 4 && monthly < 8) return 2;
                if (ytd > 50 && monthly > 4) return 1;
                return 0;
              };

              // Precompute stars
              const ratings = savings.map((p) => {
                const monthStars = getStars(p.monthly, p.ytd);
                return { ...p, monthStars };
              });

              const generateMonthlyData = (baseMonthly: number, ytd: number) => {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return months.map((m, idx) => {
                  const savings = Math.max(0, baseMonthly + Math.sin(idx) * 2 + (idx % 3 === 0 ? 1 : 0));
                  const stars = getStars(savings, ytd);
                  return { month: m, savings: Number(savings.toFixed(1)), stars };
                });
              };

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
                          key={r.name}
                          className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                          onClick={() => {
                            setStarDrillPlant(r.name);
                            setStarDrillData(generateMonthlyData(r.monthly, r.ytd));
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
            })()}

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
                      {starDrillData.map((row) => (
                        <tr key={row.month}>
                          <td className="py-1">{row.month}</td>
                          <td className="py-1">{formatCurrency(row.savings, 1, starRatingsFormat)}</td>
                          <td className="py-1">{row.stars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setStarDrillOpen(false)}>OK</AlertDialogAction>
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
            {(() => {
              // Default dataset of benchmarked BPs with images - show 2 entries
              const defaultRows = [
                {
                  bp: "Smart Cart Movement & Management through AMR",
                  origin: "Greater Noida (Ecotech 1)",
                  copies: [
                    { plant: "Kanchipuram", date: "2025-02-18" },
                    { plant: "Shahjahanpur", date: "2025-02-24" },
                  ],
                  hasImage: true
                },
                {
                  bp: "Empty Cart Feeding System (Manual → Auto)",
                  origin: "Greater Noida (Ecotech 1)",
                  copies: [
                    { plant: "Greater Noida (Ecotech 1)", date: "2025-04-20" },
                    { plant: "Rajpura", date: "2025-04-28" },
                  ],
                  hasImage: true
                },
              ];
              
              // Use copySpread if it exists and has items with hasImage, otherwise use default
              const allRows = (copySpread && copySpread.length > 0 && copySpread.some(row => row.hasImage))
                ? copySpread
                : defaultRows;
              
              // Filter to show only BPs with images and limit to 2 entries
              const rows = allRows.filter(row => row.hasImage).slice(0, 2);

              return (
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
                      {rows.map((row) => (
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
              );
            })()}

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
            {(() => {
              // Leaderboard data (Origin: 10, Copier: 5)
              const leaderboardData = mergedLeaderboard ?? [
                { 
                  plant: "Greater Noida (Ecotech 1)", 
                  totalPoints: 36, 
                  breakdown: [
                    { type: "Origin", points: 10, date: "2025-02-12", bpTitle: "Digital Production Control Tower" },
                    { type: "Copier", points: 5, date: "2025-02-20", bpTitle: "Assembly Line Cobots" },
                    { type: "Origin", points: 10, date: "2025-01-15", bpTitle: "Automated Quality Inspection" },
                    { type: "Copier", points: 5, date: "2025-03-10", bpTitle: "Safety Protocol for Chemical Handling" },
                    { type: "Origin", points: 6, date: "2025-03-18", bpTitle: "Waste Reduction Initiative" }
                  ]
                },
                { 
                  plant: "Kanchipuram", 
                  totalPoints: 28, 
                  breakdown: [
                    { type: "Origin", points: 10, date: "2025-05-20", bpTitle: "IoT Sensor Implementation" },
                    { type: "Copier", points: 5, date: "2025-04-12", bpTitle: "Digital Production Control Tower" },
                    { type: "Copier", points: 5, date: "2025-05-05", bpTitle: "Assembly Line Cobots" },
                    { type: "Origin", points: 8, date: "2025-03-25", bpTitle: "Lean Packaging Redesign" }
                  ]
                },
                { 
                  plant: "Rajpura", 
                  totalPoints: 26, 
                  breakdown: [
                    { type: "Origin", points: 10, date: "2025-02-28", bpTitle: "Green Energy Dashboard" },
                    { type: "Copier", points: 5, date: "2025-03-22", bpTitle: "ESG Compliance Monitoring Program" },
                    { type: "Origin", points: 6, date: "2025-01-30", bpTitle: "Smart Inventory Tagging" },
                    { type: "Copier", points: 5, date: "2025-04-18", bpTitle: "Assembly Line Cobots" }
                  ]
                },
                { 
                  plant: "Shahjahanpur", 
                  totalPoints: 22, 
                  breakdown: [
                    { type: "Origin", points: 10, date: "2025-06-14", bpTitle: "Digital Production Control Tower" },
                    { type: "Copier", points: 5, date: "2025-05-04", bpTitle: "IoT Sensor Implementation" },
                    { type: "Copier", points: 5, date: "2025-02-15", bpTitle: "Waste Reduction Initiative" },
                    { type: "Origin", points: 2, date: "2025-03-02", bpTitle: "Visual Management Boards" }
                  ]
                },
                { 
                  plant: "Supa", 
                  totalPoints: 20, 
                  breakdown: [
                    { type: "Origin", points: 10, date: "2025-03-10", bpTitle: "Safety Protocol for Chemical Handling" },
                    { type: "Copier", points: 5, date: "2025-02-25", bpTitle: "Digital Production Control Tower" },
                    { type: "Copier", points: 5, date: "2025-04-05", bpTitle: "IoT Sensor Implementation" }
                  ]
                }
              ];
              
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
                            key={entry.plant}
                            className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                            onClick={() => {
                              const asCopier = entry.breakdown.filter((b) => b.type === "Copier");
                              const copiedCount = asCopier.length;
                              const copiedPoints = asCopier.reduce((s, b) => s + (b.points || 0), 0);

                              const asOrigin = entry.breakdown.filter((b) => b.type === "Origin");
                              const perBPMap = new Map<string, { title: string; copies: number; points: number }>();
                              asOrigin.forEach((b) => {
                                const prev = perBPMap.get(b.bpTitle) || { title: b.bpTitle, copies: 0, points: 0 };
                                prev.copies += 1;
                                prev.points += b.points || 0;
                                perBPMap.set(b.bpTitle, prev);
                              });
                              const originated = Array.from(perBPMap.values());
                              const originatedCount = originated.length;
                              const originatedPoints = originated.reduce((s, r) => s + r.points, 0);

                              setLbDrillPlant(entry.plant);
                              setLbDrillData({
                                copied: asCopier.map((c) => ({ title: c.bpTitle, points: c.points, date: c.date })),
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
                            <td className="py-1 font-medium text-xs">{entry.plant}</td>
                            <td className="py-1 text-center pl-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary text-xs px-1 py-0">
                                {entry.totalPoints}
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
                                  {entry.breakdown.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-center gap-1">
                                      <Badge variant="outline" className={
                                        item.type === "Origin" 
                                          ? "bg-success/10 text-success border-success text-xs px-1 py-0" 
                                          : "bg-primary/10 text-primary border-primary text-xs px-1 py-0"
                                      }>
                                        {item.type}: {item.points}
                                      </Badge>
                                      <span className="text-xs">{item.bpTitle}</span>
                                    </div>
                                  ))}
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
            })()}
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
            <div className="space-y-4">
              {[
                { 
                  title: "Smart Cart Movement & Management through AMR", 
                  plant: "Greater Noida (Ecotech 1)", 
                  category: "Automation", 
                  submitted: "2 hours ago"
                },
                { 
                  title: "Empty Cart Feeding System (Manual → Auto)", 
                  plant: "Greater Noida (Ecotech 1)", 
                  category: "Productivity", 
                  submitted: "4 hours ago"
                },
                { 
                  title: "Smart Inbound Logistics through AGV", 
                  plant: "Greater Noida (Ecotech 1)", 
                  category: "Automation", 
                  submitted: "1 day ago"
                },
                { 
                  title: "Injection Machines Robotic Operation", 
                  plant: "Greater Noida (Ecotech 1)", 
                  category: "Automation", 
                  submitted: "2 days ago"
                }
              ].map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth hover-lift"
                  onClick={() => {
                    navigate(`/practices/${practice.id}`);
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{activity.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{activity.plant}</span>
                      <span className="text-xs text-muted-foreground">• {activity.submitted}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewPractice) {
                          onViewPractice({
                            title: activity.title,
                            category: activity.category,
                            plant: activity.plant
                          });
                        } else {
                          navigate("/practices");
                        }
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
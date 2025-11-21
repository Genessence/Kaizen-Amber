import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
  Target,
  IndianRupee,
  Settings,
  Copy,
  Star,
  BarChart3,
  Cpu,
  LineChart,
  Bot,
  Loader2,
} from "lucide-react";
import { KeyboardEvent, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  useDashboardOverview,
  useCategoryBreakdown,
  usePlantMonthlyTrend,
  useStarRatings,
} from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import {
  useCopySpread,
  useRecentBenchmarkedPractices,
} from "@/hooks/useBenchmarking";
import { useMyPractices } from "@/hooks/useBestPractices";

interface PlantUserDashboardProps {
  monthlyCount?: number;
  ytdCount?: number;
  recentSubmissions?: {
    title: string;
    category: string;
    date: string;
    questions?: number;
    benchmarked?: boolean;
  }[];
  leaderboard?: {
    plant: string;
    totalPoints: number;
    breakdown: {
      type: "Origin" | "Copier";
      points: number;
      date: string;
      bpTitle: string;
    }[];
  }[];
  copySpread?: {
    bp: string;
    origin: string;
    copies: { plant: string; date: string }[];
  }[];
}

const PlantUserDashboard = ({
  monthlyCount,
  ytdCount,
  recentSubmissions,
  leaderboard,
  copySpread,
}: PlantUserDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data from API
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: myPractices, isLoading: practicesLoading } = useMyPractices();
  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useLeaderboard();
  const { data: copySpreadData, isLoading: copySpreadLoading } =
    useCopySpread(2);
  const { data: categoryBreakdown, isLoading: categoryLoading } =
    useCategoryBreakdown();
  const { data: benchmarkedPractices } = useRecentBenchmarkedPractices(4);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedBP, setSelectedBP] = useState<any>(null);
  const [bpSpreadOpen, setBpSpreadOpen] = useState(false);
  const [bpSpreadBP, setBpSpreadBP] = useState<string | null>(null);
  const [bpSpreadRows, setBpSpreadRows] = useState<
    { plant: string; date: string }[]
  >([]);
  const [lbDrillOpen, setLbDrillOpen] = useState(false);
  const [lbDrillPlant, setLbDrillPlant] = useState<string | null>(null);
  const [lbDrillData, setLbDrillData] = useState<{
    copied: { title: string; points: number; date: string }[];
    copiedCount: number;
    copiedPoints: number;
    originated: { title: string; copies: number; points: number }[];
    originatedCount: number;
    originatedPoints: number;
  } | null>(null);
  const [ytdDialogOpen, setYtdDialogOpen] = useState(false);
  const [monthlyProgressDialogOpen, setMonthlyProgressDialogOpen] =
    useState(false);
  const [monthlySavingsFormat, setMonthlySavingsFormat] = useState<
    "lakhs" | "crores"
  >("lakhs");

  // Fetch monthly trend data for plant user
  const { data: monthlyTrendData, isLoading: monthlyTrendLoading } =
    usePlantMonthlyTrend(user?.plant_id, undefined, monthlySavingsFormat);

  // Fetch star ratings for plant user
  const { data: starRatingsData, isLoading: starRatingsLoading } =
    useStarRatings(monthlySavingsFormat);

  // Use API data with fallback to props for backwards compatibility
  const actualMonthlyCount = overview?.monthly_count ?? monthlyCount ?? 1;
  const actualYtdCount = overview?.ytd_count ?? ytdCount ?? 53;

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // Update selected month when practices load
  useEffect(() => {
    if (myPractices && myPractices.length > 0) {
      const monthKeys = myPractices.map((practice: any) => {
        const practiceDate = new Date(
          practice.submitted_date || practice.submittedDate
        );
        return `${practiceDate.getFullYear()}-${String(
          practiceDate.getMonth() + 1
        ).padStart(2, "0")}`;
      });
      const uniqueMonths = [...new Set(monthKeys)].sort((a, b) =>
        b.localeCompare(a)
      );
      if (uniqueMonths.length > 0) {
        setSelectedMonth(uniqueMonths[0]);
      }
    }
  }, [myPractices]);

  const ytdPractices = useMemo(() => {
    const fallbackPractices = [
      {
        title: "Automated Quality Inspection System",
        category: "Quality",
        date: "2024-01-15",
        questions: 2,
        benchmarked: true,
      },
      {
        title: "Energy Efficient Cooling Process",
        category: "Cost",
        date: "2024-01-12",
        questions: 0,
        benchmarked: true,
      },
      {
        title: "Safety Protocol for Chemical Handling",
        category: "Safety",
        date: "2024-01-10",
        questions: 1,
        benchmarked: false,
      },
      {
        title: "Production Line Optimization",
        category: "Productivity",
        date: "2024-01-08",
        questions: 3,
        benchmarked: false,
      },
    ];
    const source =
      recentSubmissions && recentSubmissions.length > 0
        ? recentSubmissions
        : fallbackPractices;
    return source.map((practice) => ({
      ...practice,
      benchmarked: practice.benchmarked ?? false,
    }));
  }, [recentSubmissions]);

  const handleYtdCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setYtdDialogOpen(true);
    }
  };

  // Generate monthly data from actual practices
  const getMonthlyData = useMemo(() => {
    const monthlyData: Record<string, { count: number; practices: any[] }> = {};

    // Use API data if available
    const plantPractices = myPractices || [];

    // Create a map of benchmarked practice IDs from recentSubmissions
    const benchmarkedMap = new Map<string, boolean>();
    if (recentSubmissions) {
      recentSubmissions.forEach((sub) => {
        const practice = plantPractices.find((p: any) => p.title === sub.title);
        if (practice) {
          benchmarkedMap.set(practice.id, sub.benchmarked ?? false);
        }
      });
    }

    // Group practices by month
    plantPractices.forEach((practice: any) => {
      const practiceDate = new Date(
        practice.submitted_date || practice.submittedDate
      );
      const monthKey = `${practiceDate.getFullYear()}-${String(
        practiceDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          practices: [],
        };
      }

      // Check if practice is benchmarked (from recentSubmissions or default to false)
      const isBenchmarked = benchmarkedMap.get(practice.id) ?? false;

      monthlyData[monthKey].practices.push({
        ...practice,
        benchmarked: isBenchmarked,
      });
      monthlyData[monthKey].count = monthlyData[monthKey].practices.length;
    });

    // Sort practices within each month by date (newest first)
    Object.keys(monthlyData).forEach((monthKey) => {
      monthlyData[monthKey].practices.sort((a, b) => {
        const dateA = new Date(a.submitted_date || a.submittedDate).getTime();
        const dateB = new Date(b.submitted_date || b.submittedDate).getTime();
        return dateB - dateA;
      });
    });

    return monthlyData;
  }, [myPractices, recentSubmissions]);

  const selectedMonthData = getMonthlyData[selectedMonth] || {
    count: 0,
    practices: [],
  };

  // Generate list of available months (only months with practices)
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string }[] = [];
    const monthKeys = Object.keys(getMonthlyData).sort((a, b) => {
      // Sort by date descending (newest first)
      return b.localeCompare(a);
    });

    monthKeys.forEach((monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      months.push({ value: monthKey, label });
    });

    // If no practices exist, at least show current month
    if (months.length === 0) {
      const now = new Date();
      const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      months.push({ value, label });
    }

    return months;
  }, [getMonthlyData]);

  const handleOpenMonthlyProgressDialog = () => {
    // Reset to most recent month with practices when opening
    const monthKeys = Object.keys(getMonthlyData).sort((a, b) =>
      b.localeCompare(a)
    );
    if (monthKeys.length > 0) {
      setSelectedMonth(monthKeys[0]);
    }
    setMonthlyProgressDialogOpen(true);
  };

  const handleMonthlyProgressCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenMonthlyProgressDialog();
    }
  };

  const handleCopyImplement = (bp: any) => {
    setSelectedBP(bp);
    setShowConfirmDialog(true);
  };

  // Use leaderboard from API with fallback to base data
  const mergedLeaderboard = useMemo(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      return leaderboardData;
    }
    // Fallback to prop data or base data
    if (leaderboard && leaderboard.length > 0) {
      return leaderboard;
    }
    // Base leaderboard for fallback
    return [
      {
        plant: "Greater Noida (Ecotech 1)",
        totalPoints: 36,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-02-12",
            bpTitle: "Digital Production Control Tower",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-02-20",
            bpTitle: "Assembly Line Cobots",
          },
          {
            type: "Origin",
            points: 10,
            date: "2025-01-15",
            bpTitle: "Automated Quality Inspection",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-03-10",
            bpTitle: "Safety Protocol for Chemical Handling",
          },
          {
            type: "Origin",
            points: 6,
            date: "2025-03-18",
            bpTitle: "Waste Reduction Initiative",
          },
        ],
      },
      {
        plant: "Kanchipuram",
        totalPoints: 28,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-05-20",
            bpTitle: "IoT Sensor Implementation",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-04-12",
            bpTitle: "Digital Production Control Tower",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-05-05",
            bpTitle: "Assembly Line Cobots",
          },
          {
            type: "Origin",
            points: 8,
            date: "2025-03-25",
            bpTitle: "Lean Packaging Redesign",
          },
        ],
      },
      {
        plant: "Rajpura",
        totalPoints: 26,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-02-28",
            bpTitle: "Green Energy Dashboard",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-03-22",
            bpTitle: "ESG Compliance Monitoring Program",
          },
          {
            type: "Origin",
            points: 6,
            date: "2025-01-30",
            bpTitle: "Smart Inventory Tagging",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-04-18",
            bpTitle: "Assembly Line Cobots",
          },
        ],
      },
      {
        plant: "Shahjahanpur",
        totalPoints: 22,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-06-14",
            bpTitle: "Digital Production Control Tower",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-05-04",
            bpTitle: "IoT Sensor Implementation",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-02-15",
            bpTitle: "Waste Reduction Initiative",
          },
          {
            type: "Origin",
            points: 2,
            date: "2025-03-02",
            bpTitle: "Visual Management Boards",
          },
        ],
      },
      {
        plant: "Supa",
        totalPoints: 20,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-03-10",
            bpTitle: "Safety Protocol for Chemical Handling",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-02-25",
            bpTitle: "Digital Production Control Tower",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-04-05",
            bpTitle: "IoT Sensor Implementation",
          },
        ],
      },
      {
        plant: "Ranjangaon",
        totalPoints: 19,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-04-08",
            bpTitle: "Production Line Optimization",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-04-22",
            bpTitle: "Assembly Line Cobots",
          },
          {
            type: "Copier",
            points: 4,
            date: "2025-05-26",
            bpTitle: "ESG Compliance Monitoring Program",
          },
        ],
      },
      {
        plant: "Ponneri",
        totalPoints: 18,
        breakdown: [
          {
            type: "Origin",
            points: 10,
            date: "2025-02-09",
            bpTitle: "ESG Compliance Monitoring Program",
          },
          {
            type: "Copier",
            points: 5,
            date: "2025-03-18",
            bpTitle: "Waste Reduction Initiative",
          },
          {
            type: "Copier",
            points: 3,
            date: "2025-05-12",
            bpTitle: "Safety Protocol for Chemical Handling",
          },
        ],
      },
    ];
  }, [leaderboardData, leaderboard]);

  const confirmCopyImplement = () => {
    // Prepare the data for pre-filling the form
    if (selectedBP) {
      navigate("/practices/add", {
        state: {
          preFillData: {
            title: selectedBP.title,
            category: selectedBP.category,
            problemStatement: selectedBP.problemStatement || "",
            solution: selectedBP.solution || "",
          },
          pendingCopyMeta: {
            originPlant: selectedBP.plant || selectedBP.plant_name,
            bpTitle: selectedBP.title,
            originalPracticeId: selectedBP.id || selectedBP.practice_id,
          },
        },
      });
    }
    setShowConfirmDialog(false);
    setSelectedBP(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <div className="lg:col-span-3">
        <Card className="bg-gradient-hero text-primary-foreground shadow-strong border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Greater Noida (Ecotech 1)
                </h2>
                <p className="text-primary-foreground/80">
                  Amber Best Practice & Benchmarking Portal
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => {
                  navigate("/practices/add");
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Best Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Overview */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="shadow-soft hover:shadow-medium transition-smooth border border-border/50 cursor-pointer hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          role="button"
          tabIndex={0}
          onClick={handleOpenMonthlyProgressDialog}
          onKeyDown={handleMonthlyProgressCardKeyDown}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Monthly Progress (Uploaded BP's)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              {overviewLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <div className="text-4xl font-bold text-primary">
                  {actualMonthlyCount}
                </div>
              )}
              <p className="text-sm text-muted-foreground text-right flex-shrink-0">
                Best Practices in{" "}
                {new Date().toLocaleString("default", { month: "long" })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Click to view the monthly breakdown of BP's
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-soft hover:shadow-medium transition-smooth border border-border/50 cursor-pointer hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          role="button"
          tabIndex={0}
          onClick={() => setYtdDialogOpen(true)}
          onKeyDown={handleYtdCardKeyDown}
          aria-label="View year-to-date best practices"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>YTD Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              {overviewLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="text-3xl font-bold text-primary">
                  {actualYtdCount}
                </div>
              )}
              <p className="text-sm text-muted-foreground text-right flex-shrink-0">
                Total Submitted (YTD)
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Click to view the yearly breakdown of BP's
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Wise Breakdown */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
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
                      case "safety":
                        return <Shield className="h-8 w-8" />;
                      case "quality":
                        return <CheckCircle className="h-8 w-8" />;
                      case "productivity":
                        return <Zap className="h-8 w-8" />;
                      case "cost":
                        return <IndianRupee className="h-8 w-8" />;
                      case "digitalisation":
                        return <Cpu className="h-8 w-8" />;
                      case "esg":
                        return <LineChart className="h-8 w-8" />;
                      case "automation":
                        return <Bot className="h-8 w-8" />;
                      default:
                        return <Settings className="h-8 w-8" />;
                    }
                  };

                  return (
                    <div
                      key={cat.category_id}
                      className={`bg-gradient-to-br p-4 rounded-lg border ${cat.color_class}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getIcon(cat.category_name)}
                        <div>
                          <p className="font-semibold">{cat.category_name}</p>
                          <p className="text-2xl font-bold">
                            {cat.practice_count}
                          </p>
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

      <AlertDialog open={ytdDialogOpen} onOpenChange={setYtdDialogOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-4">
          <AlertDialogHeader className="pb-3">
            <AlertDialogTitle className="text-lg">
              Year-to-Date Best Practices
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Overview of all practices submitted this year and their benchmark
              status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="overflow-x-auto flex-1 min-h-0 -mx-2 px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-1.5 px-3 font-medium text-xs">Practice</th>
                  <th className="py-1.5 px-3 font-medium text-xs">Category</th>
                  <th className="py-1.5 px-3 font-medium text-xs">Date</th>
                  <th className="py-1.5 px-3 font-medium text-xs text-center">
                    Benchmark
                  </th>
                  <th className="py-1.5 px-3 font-medium text-xs text-center">
                    Q&A
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ytdPractices.map((practice, index) => (
                  <tr
                    key={`${practice.title}-${index}`}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-xs">
                      {practice.title}
                    </td>
                    <td className="py-2 px-3 text-xs">{practice.category}</td>
                    <td className="py-2 px-3 text-xs">{practice.date}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          practice.benchmarked
                            ? "bg-success/10 text-success border-success text-xs px-2 py-0.5"
                            : "bg-muted/50 text-muted-foreground text-xs px-2 py-0.5"
                        }
                      >
                        {practice.benchmarked
                          ? "Benchmarked"
                          : "Not Benchmarked"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-center text-xs">
                      {practice.questions ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AlertDialogFooter className="pt-3 mt-2 border-t">
            <AlertDialogCancel className="text-sm">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Monthly Progress Dialog */}
      <Dialog
        open={monthlyProgressDialogOpen}
        onOpenChange={setMonthlyProgressDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">
              Monthly Progress Summary
            </DialogTitle>
            <DialogDescription className="text-xs">
              View best practices submitted for any month
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 pb-4 border-b">
            <label className="text-sm font-medium whitespace-nowrap">
              Select Month:
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Practices
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {selectedMonthData.count}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Benchmarked
                  </p>
                  <p className="text-3xl font-bold text-success">
                    {
                      selectedMonthData.practices.filter((p) => p.benchmarked)
                        .length
                    }
                  </p>
                </div>
              </div>
              {selectedMonthData.practices.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Best Practices List
                  </h4>
                  <div className="space-y-2">
                    {selectedMonthData.practices.map((practice, index) => (
                      <div
                        key={`${practice.id || practice.title}-${index}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setMonthlyProgressDialogOpen(false);
                          navigate(`/practices/${practice.id}`);
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {practice.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {practice.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {practice.submittedDate || practice.date}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            practice.benchmarked
                              ? "bg-success/10 text-success border-success text-xs px-2 py-0.5"
                              : "bg-muted/50 text-muted-foreground text-xs px-2 py-0.5"
                          }
                        >
                          {practice.benchmarked
                            ? "Benchmarked"
                            : "Not Benchmarked"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    No practices submitted for this month
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* BP Copy Spread */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Horizontal Deployment Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {copySpreadLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
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
                    {(copySpreadData || []).slice(0, 2).map((row) => (
                      <tr
                        key={row.bp_id}
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() => {
                          setBpSpreadBP(row.bp_title);
                          setBpSpreadRows(
                            row.copies.map((c) => ({
                              plant: c.plant_name,
                              date: c.copied_date,
                            }))
                          );
                          setBpSpreadOpen(true);
                        }}
                      >
                        <td className="py-2 font-medium">{row.bp_title}</td>
                        <td className="py-2">{row.origin_plant_name}</td>
                        <td className="py-2">{row.copy_count}</td>
                      </tr>
                    ))}
                    {(!copySpreadData || copySpreadData.length === 0) && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No horizontally deployed practices yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <AlertDialog open={bpSpreadOpen} onOpenChange={setBpSpreadOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {bpSpreadBP
                      ? `${bpSpreadBP} - Copied by Plants`
                      : "Copied by Plants"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Only benchmarked BPs can be copied. List shows plants and
                    dates of copy.
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
                          <td
                            className="py-1 text-muted-foreground"
                            colSpan={2}
                          >
                            No copies yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setBpSpreadOpen(false)}>
                    OK
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview removed */}

      {/* Monthly Cost Savings & Stars */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Monthly Cost Savings & Stars</span>
              </CardTitle>
              <ToggleGroup
                type="single"
                value={monthlySavingsFormat}
                onValueChange={(value) => {
                  if (value === "lakhs" || value === "crores") {
                    setMonthlySavingsFormat(value);
                  }
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem
                  value="lakhs"
                  className="px-3 text-xs"
                  aria-label="Lakhs"
                >
                  L
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="crores"
                  className="px-3 text-xs"
                  aria-label="Crores"
                >
                  Cr
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyTrendLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              (() => {
                // Use API data for monthly trend, fallback to empty array if no data
                const monthlyData =
                  monthlyTrendData && monthlyTrendData.length > 0
                    ? monthlyTrendData.map((trend) => {
                        // Parse savings string (e.g., "12.5L" or "1.2Cr") to number
                        const savingsStr = trend.savings
                          .replace(/[₹,]/g, "")
                          .trim();
                        const isCrores = savingsStr.includes("Cr");
                        const isLakhs = savingsStr.includes("L");
                        const numStr = savingsStr.replace(/[CrL]/g, "").trim();
                        const savingsValue = parseFloat(numStr) || 0;

                        // Convert month format from "YYYY-MM" to "MMM"
                        const [year, month] = trend.month.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1
                        );
                        const monthLabel = date.toLocaleString("default", {
                          month: "short",
                        });

                        return {
                          month: monthLabel,
                          costSavings: savingsValue,
                          stars: trend.stars || 0,
                        };
                      })
                    : [];

                // Get current month data or use last month from data
                const currentMonthData =
                  monthlyData.length > 0
                    ? monthlyData[monthlyData.length - 1]
                    : {
                        month: new Date().toLocaleString("default", {
                          month: "short",
                        }),
                        costSavings: 0,
                        stars: 0,
                      };

                // Calculate YTD savings and stars from API data
                const ytdSavings = monthlyData.reduce(
                  (sum, month) => sum + month.costSavings,
                  0
                );
                const ytdStars = monthlyData.reduce(
                  (sum, month) => sum + month.stars,
                  0
                );

                // Use star ratings data for current month if available
                const currentStarRating = starRatingsData?.find(
                  (sr) => sr.plant_id === user?.plant_id
                );
                const currentMonthSavings = currentStarRating?.monthly_savings
                  ? parseFloat(
                      currentStarRating.monthly_savings
                        .replace(/[₹,CrL]/g, "")
                        .trim()
                    ) || currentMonthData.costSavings
                  : currentMonthData.costSavings;

                const currentMonth = {
                  ...currentMonthData,
                  costSavings: currentMonthSavings,
                  stars: currentStarRating?.stars || currentMonthData.stars,
                };

                return (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(
                              currentMonth.costSavings,
                              1,
                              monthlySavingsFormat
                            )}
                          </div>
                          <p className="text-sm text-green-600">
                            This Month Savings
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700">
                            {formatCurrency(
                              ytdSavings,
                              1,
                              monthlySavingsFormat
                            )}
                          </div>
                          <p className="text-sm text-blue-600">YTD Savings</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-700">
                            {ytdStars}
                          </div>
                          <p className="text-sm text-yellow-600">
                            Total Stars ⭐
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Chart */}
                    <ChartContainer
                      config={{
                        costSavings: {
                          label: `Cost Savings (₹${
                            monthlySavingsFormat === "crores" ? "Cr" : "L"
                          })`,
                          color: "hsl(var(--success))",
                        },
                        stars: {
                          label: "Stars ⭐",
                          color: "hsl(var(--warning))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <BarChart data={monthlyData}>
                        <defs>
                          <linearGradient
                            id="gradientCostSavings"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--success))"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--success))"
                              stopOpacity={0.4}
                            />
                          </linearGradient>
                          <linearGradient
                            id="gradientStars"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--warning))"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--warning))"
                              stopOpacity={0.4}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {label}
                                      </span>
                                    </div>
                                    {payload.map((entry, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2"
                                      >
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: entry.color,
                                          }}
                                        />
                                        <span className="text-[0.70rem] text-muted-foreground">
                                          {entry.dataKey === "costSavings"
                                            ? `Cost Savings: ${formatCurrency(
                                                entry.value as number,
                                                1,
                                                monthlySavingsFormat
                                              )}`
                                            : `Stars: ${entry.value}`}
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
                        <Bar
                          yAxisId="left"
                          dataKey="costSavings"
                          fill="url(#gradientCostSavings)"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="stars"
                          fill="url(#gradientStars)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Benchmark BPs */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Latest Benchmark BPs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(benchmarkedPractices || []).map((bp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth hover-lift"
                  onClick={() => {
                    navigate(`/practices/${bp.practice_id}`);
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{bp.practice_title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {bp.practice_category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {bp.plant_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {bp.benchmarked_date}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/practices/${bp.practice_id}`);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyImplement(bp);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy & Implement
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <CardTitle>Latest Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {practicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (myPractices || []).length > 0 ? (
                (myPractices || []).slice(0, 4).map((practice, index) => (
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
                          {practice.category_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {practice.submitted_date || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {practice.question_count > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary"
                        >
                          {practice.question_count} Q&A
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No recent practices available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark BP Leaderboard */}
      <div className="lg:col-span-3">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Benchmark BP Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              (() => {
                const leaderboardDataToShow = mergedLeaderboard;
                return (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Total points earned through benchmark BPs (Origin: 10
                      points, Copier: 5 points)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1">Serial Number</th>
                            <th className="py-1">Plant</th>
                            <th className="py-1 text-center pl-2">
                              Total Points
                            </th>
                            <th className="py-1 text-center pl-1">Rank</th>
                            <th className="py-1 text-center pl-1">Breakdown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {leaderboardDataToShow.map((entry, index) => {
                            // Calculate rank based on total points (same points = same rank)
                            // Since data is sorted by totalPoints descending, rank is based on position
                            const rank = entry.rank || index + 1;

                            return (
                              <tr
                                key={entry.plant_id}
                                className="hover:bg-accent/50 hover:border-l-4 hover:border-l-primary cursor-pointer transition-smooth"
                                onClick={() => {
                                  const asCopier = entry.breakdown.filter(
                                    (b) => b.type === "Copier"
                                  );
                                  const copiedCount = asCopier.length;
                                  const copiedPoints = asCopier.reduce(
                                    (s, b) => s + (b.points || 0),
                                    0
                                  );

                                  const asOrigin = entry.breakdown.filter(
                                    (b) => b.type === "Origin"
                                  );
                                  const perBPMap = new Map<
                                    string,
                                    {
                                      title: string;
                                      copies: number;
                                      points: number;
                                    }
                                  >();
                                  asOrigin.forEach((b) => {
                                    const prev = perBPMap.get(b.bp_title) || {
                                      title: b.bp_title,
                                      copies: 0,
                                      points: 0,
                                    };
                                    prev.copies += 1;
                                    prev.points += b.points || 0;
                                    perBPMap.set(b.bp_title, prev);
                                  });
                                  const originated = Array.from(
                                    perBPMap.values()
                                  );
                                  const originatedCount = originated.length;
                                  const originatedPoints = originated.reduce(
                                    (s, r) => s + r.points,
                                    0
                                  );

                                  setLbDrillPlant(entry.plant_name);
                                  setLbDrillData({
                                    copied: asCopier.map((c) => ({
                                      title: c.bp_title,
                                      points: c.points,
                                      date: c.date,
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
                                <td className="py-1 font-medium text-xs">
                                  {entry.plant_name}
                                </td>
                                <td className="py-1 text-center pl-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/10 text-primary border-primary text-xs px-1 py-0"
                                  >
                                    {entry.total_points}
                                  </Badge>
                                </td>
                                <td className="py-1 text-center pl-1">
                                  {rank === 1 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10 text-primary text-xs px-1 py-0"
                                    >
                                      #1
                                    </Badge>
                                  )}
                                  {rank === 2 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-secondary/10 text-secondary text-xs px-1 py-0"
                                    >
                                      #2
                                    </Badge>
                                  )}
                                  {rank === 3 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-accent/10 text-accent-foreground text-xs px-1 py-0"
                                    >
                                      #3
                                    </Badge>
                                  )}
                                  {rank > 3 && (
                                    <span className="text-muted-foreground text-xs">
                                      #{rank}
                                    </span>
                                  )}
                                </td>
                                <td className="py-1 text-center pl-1">
                                  <div className="text-xs text-muted-foreground">
                                    <div className="text-xs">
                                      {entry.breakdown.length} entries
                                    </div>
                                    <div className="mt-0.5 space-y-0.5">
                                      {entry.breakdown
                                        .slice(0, 2)
                                        .map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-center gap-1"
                                          >
                                            <Badge
                                              variant="outline"
                                              className={
                                                item.type === "Origin"
                                                  ? "bg-success/10 text-success border-success text-xs px-1 py-0"
                                                  : "bg-primary/10 text-primary border-primary text-xs px-1 py-0"
                                              }
                                            >
                                              {item.type}: {item.points}
                                            </Badge>
                                            <span className="text-xs">
                                              {item.bp_title}
                                            </span>
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
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Drilldown */}
      <AlertDialog open={lbDrillOpen} onOpenChange={setLbDrillOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lbDrillPlant
                ? `${lbDrillPlant} - Benchmark Points Breakdown`
                : "Benchmark Points Breakdown"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Only benchmarked BPs can be copied. Summary below reflects copies
              and originated benchmarked BPs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">BPs Copied by This Plant</div>
                <div>
                  Count:{" "}
                  <span className="font-semibold">
                    {lbDrillData?.copiedCount ?? 0}
                  </span>
                </div>
                <div>
                  Points:{" "}
                  <span className="font-semibold">
                    {lbDrillData?.copiedPoints ?? 0}
                  </span>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">
                  Benchmarked BPs (Originated)
                </div>
                <div>
                  Count:{" "}
                  <span className="font-semibold">
                    {lbDrillData?.originatedCount ?? 0}
                  </span>
                </div>
                <div>
                  Points:{" "}
                  <span className="font-semibold">
                    {lbDrillData?.originatedPoints ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-2">
                  Copied by This Plant (Details)
                </div>
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
                      {(!lbDrillData || lbDrillData.copied.length === 0) && (
                        <tr>
                          <td
                            className="py-1 text-muted-foreground"
                            colSpan={3}
                          >
                            No copied entries
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">
                  Benchmarked BPs (Details)
                </div>
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
                      {(lbDrillData?.originated ?? []).map((row) => (
                        <tr key={row.title}>
                          <td className="py-1">{row.title}</td>
                          <td className="py-1">{row.copies}</td>
                          <td className="py-1">{row.points}</td>
                        </tr>
                      ))}
                      {(!lbDrillData ||
                        lbDrillData.originated.length === 0) && (
                        <tr>
                          <td
                            className="py-1 text-muted-foreground"
                            colSpan={3}
                          >
                            No originated benchmarked BPs
                          </td>
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
            <AlertDialogAction onClick={() => setLbDrillOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy & Implement Best Practice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to copy and implement "{selectedBP?.title}"
              from {selectedBP?.plant}?
              <br />
              <br />
              <strong>Points System:</strong>
              <br />• {selectedBP?.plant} will receive 10 points (Origin)
              <br />• Your plant will receive 5 points (copier)
              <br />
              <br />
              This action will add this practice to your plant's implementation
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCopyImplement}>
              Copy & Implement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlantUserDashboard;

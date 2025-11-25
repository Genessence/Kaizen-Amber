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
  AlertCircle,
} from "lucide-react";
import {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
} from "@/components/ui/skeletons";
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
// All analytics data now comes from useUnifiedDashboard hook
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import {
  useCopySpread,
  useRecentBenchmarkedPractices,
} from "@/hooks/useBenchmarking";
import { useMyPractices } from "@/hooks/useBestPractices";
import { useUnifiedDashboard } from "@/hooks/useUnifiedDashboard";
import { useCategories } from "@/hooks/useCategories";
import { apiService } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const [monthlySavingsFormat, setMonthlySavingsFormat] = useState<
    "lakhs" | "crores"
  >("lakhs");

  // PERFORMANCE OPTIMIZATION: Use unified dashboard endpoint (1 API call for ALL data)
  const { data: unifiedData, isLoading: unifiedLoading, error: unifiedError } =
    useUnifiedDashboard(monthlySavingsFormat);

  // Extract data from unified response
  const overview = unifiedData?.data?.overview;
  const myPractices = unifiedData?.data?.my_practices;
  const recentPractices = unifiedData?.data?.recent_practices; // For "Latest Best Practices"
  const leaderboardData = unifiedData?.data?.leaderboard;
  const copySpreadData = unifiedData?.data?.copy_spread;
  const categoryBreakdown = unifiedData?.data?.category_breakdown || [];
  const benchmarkedPractices = unifiedData?.data?.recent_benchmarked;
  const monthlyTrendData = (unifiedData?.data as any)?.monthly_trend;
  const starRatingsData = (unifiedData?.data as any)?.star_ratings;

  // Debug: Log category breakdown to console
  useEffect(() => {
    if (unifiedData?.data) {
      console.log("Unified Dashboard Data:", unifiedData.data);
      console.log("Category Breakdown:", unifiedData.data.category_breakdown);
      console.log(
        "Category Breakdown Length:",
        unifiedData.data.category_breakdown?.length
      );
      console.log(
        "Category Breakdown Type:",
        typeof unifiedData.data.category_breakdown
      );
      console.log(
        "Is Array?",
        Array.isArray(unifiedData.data.category_breakdown)
      );
      if (
        unifiedData.data.category_breakdown &&
        unifiedData.data.category_breakdown.length > 0
      ) {
        console.log("First Category:", unifiedData.data.category_breakdown[0]);
      }
    }
  }, [unifiedData]);

  // Use unified loading state for all data
  const overviewLoading = unifiedLoading;
  const practicesLoading = unifiedLoading;
  const leaderboardLoading = unifiedLoading;
  const copySpreadLoading = unifiedLoading;
  const categoryLoading = unifiedLoading;
  const monthlyTrendLoading = unifiedLoading;
  const starRatingsLoading = unifiedLoading;

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
  
  // YTD Dialog filters
  const [ytdCategoryFilter, setYtdCategoryFilter] = useState<string>("all");
  const [ytdBenchmarkFilter, setYtdBenchmarkFilter] = useState<string>("all"); // "all", "benchmarked", "not-benchmarked"
  const [ytdSearchTerm, setYtdSearchTerm] = useState<string>("");
  const [ytdSortBy, setYtdSortBy] = useState<string>("date"); // "date", "category", "questions"

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

  // Get categories for filter
  const { data: categoriesData } = useCategories();
  
  const ytdPractices = useMemo(() => {
    // Get current year start date
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    
    // Filter myPractices to only include practices from current year
    const practicesFromAPI = myPractices || [];
    let ytdPracticesList = practicesFromAPI
      .filter((practice: any) => {
        const submittedDate = practice.submitted_date || practice.submittedDate;
        if (!submittedDate) return false;
        const practiceDate = new Date(submittedDate);
        return practiceDate >= yearStart;
      })
      .map((practice: any) => {
        const submittedDate = practice.submitted_date || practice.submittedDate;
        const practiceDate = new Date(submittedDate);
        
        // Format date as YYYY-MM-DD
        const formattedDate = practiceDate.toISOString().split('T')[0];
        
        // Get category name (handle both object and string formats)
        const categoryName = typeof practice.category === 'string' 
          ? practice.category 
          : practice.category?.name || practice.category_name || 'Unknown';
        
        return {
          id: practice.id,
          title: practice.title,
          category: categoryName,
          date: formattedDate,
          questions: practice.question_count || 0,
          benchmarked: practice.is_benchmarked || false,
        };
      });
    
    // Apply filters
    if (ytdCategoryFilter !== "all") {
      ytdPracticesList = ytdPracticesList.filter(
        (practice) => practice.category.toLowerCase() === ytdCategoryFilter.toLowerCase()
      );
    }
    
    if (ytdBenchmarkFilter === "benchmarked") {
      ytdPracticesList = ytdPracticesList.filter((practice) => practice.benchmarked);
    } else if (ytdBenchmarkFilter === "not-benchmarked") {
      ytdPracticesList = ytdPracticesList.filter((practice) => !practice.benchmarked);
    }
    
    if (ytdSearchTerm) {
      const searchLower = ytdSearchTerm.toLowerCase();
      ytdPracticesList = ytdPracticesList.filter(
        (practice) =>
          practice.title.toLowerCase().includes(searchLower) ||
          practice.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    ytdPracticesList.sort((a, b) => {
      switch (ytdSortBy) {
        case "category":
          return a.category.localeCompare(b.category);
        case "questions":
          return b.questions - a.questions; // Descending
        case "date":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime(); // Descending (newest first)
      }
    });
    
    return ytdPracticesList;
  }, [myPractices, ytdCategoryFilter, ytdBenchmarkFilter, ytdSearchTerm, ytdSortBy]);

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
    // Fallback to prop data if provided
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

  const confirmCopyImplement = async () => {
    // Fetch full practice details before navigating
    if (selectedBP) {
      const practiceId = selectedBP.id || selectedBP.practice_id;
      if (practiceId) {
        try {
          // Fetch full practice details
          const fullPractice = await apiService.getBestPractice(practiceId);

          // Prepare pre-fill data - Only 4 fields: title, category, problemStatement, solution
          const problemStatementValue =
            fullPractice.problem_statement ||
            (fullPractice as any).problemStatement ||
            "";

          navigate("/practices/add", {
            state: {
              preFillData: {
                title:
                  fullPractice.title ||
                  selectedBP.title ||
                  selectedBP.practice_title,
                category:
                  fullPractice.category_name ||
                  selectedBP.category ||
                  selectedBP.practice_category,
                problemStatement: problemStatementValue,
                solution:
                  fullPractice.solution || fullPractice.description || "",
              },
              pendingCopyMeta: {
                originPlant:
                  fullPractice.plant_name ||
                  selectedBP.plant ||
                  selectedBP.plant_name,
                bpTitle:
                  fullPractice.title ||
                  selectedBP.title ||
                  selectedBP.practice_title,
                originalPracticeId: practiceId,
              },
            },
          });
        } catch (error) {
          console.error("Failed to fetch practice details:", error);
          // Fallback to limited data if fetch fails - Only 4 fields
          navigate("/practices/add", {
            state: {
              preFillData: {
                title: selectedBP.title || selectedBP.practice_title,
                category: selectedBP.category || selectedBP.practice_category,
                problemStatement: "",
                solution: "",
              },
              pendingCopyMeta: {
                originPlant: selectedBP.plant || selectedBP.plant_name,
                bpTitle: selectedBP.title || selectedBP.practice_title,
                originalPracticeId: practiceId,
              },
            },
          });
        }
      } else {
        // Fallback if no practice ID
        navigate("/practices/add", {
          state: {
            preFillData: {
              title: selectedBP.title || selectedBP.practice_title,
              category: selectedBP.category || selectedBP.practice_category,
              problemStatement: "",
              solution: "",
            },
            pendingCopyMeta: {
              originPlant: selectedBP.plant || selectedBP.plant_name,
              bpTitle: selectedBP.title || selectedBP.practice_title,
              originalPracticeId: practiceId,
            },
          },
        });
      }
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
                <div className="h-12 w-16 bg-muted animate-pulse rounded" />
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
                <div className="h-10 w-16 bg-muted animate-pulse rounded" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br p-4 rounded-lg border"
                  >
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
            ) : categoryBreakdown &&
              Array.isArray(categoryBreakdown) &&
              categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {categoryBreakdown
                  .filter((cat) => {
                    // Only filter out null/undefined, keep 'Unknown' categories
                    const isValid = cat && cat.category_name;
                    if (!isValid) {
                      console.warn("Filtered out invalid category:", cat);
                    }
                    return isValid;
                  })
                  .map((cat) => {
                    const getIcon = (name: string | undefined) => {
                      if (!name)
                        return <Settings className="h-8 w-8 text-purple-600" />;
                      switch (name.toLowerCase()) {
                        case "safety":
                          return <Shield className="h-8 w-8 text-red-600" />;
                        case "quality":
                          return (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          );
                        case "productivity":
                          return <Zap className="h-8 w-8 text-blue-600" />;
                        case "cost":
                          return (
                            <IndianRupee className="h-8 w-8 text-yellow-600" />
                          );
                        case "digitalisation":
                          return <Cpu className="h-8 w-8 text-purple-600" />;
                        case "esg":
                          return (
                            <LineChart className="h-8 w-8 text-green-600" />
                          );
                        case "automation":
                          return <Bot className="h-8 w-8 text-orange-600" />;
                        default:
                          return (
                            <Settings className="h-8 w-8 text-purple-600" />
                          );
                      }
                    };

                    const getCategoryColor = (name: string | undefined) => {
                      if (!name)
                        return "from-purple-50 to-purple-100 border-purple-200";
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
                      <div
                        key={cat.category_id || cat.category_name}
                        className={`bg-gradient-to-br p-4 rounded-lg border ${getCategoryColor(
                          cat.category_name
                        )}`}
                      >
                        <div className="flex items-center space-x-3">
                          {getIcon(cat.category_name)}
                          <div>
                            <p className="font-semibold">
                              {cat.category_name || "Unknown"}
                            </p>
                            <p className="text-2xl font-bold">
                              {cat.practice_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog 
        open={ytdDialogOpen} 
        onOpenChange={(open) => {
          setYtdDialogOpen(open);
          // Reset filters when dialog closes
          if (!open) {
            setYtdCategoryFilter("all");
            setYtdBenchmarkFilter("all");
            setYtdSearchTerm("");
            setYtdSortBy("date");
          }
        }}
      >
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
          
          {/* Filters Section */}
          <div className="space-y-3 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="ytd-search" className="text-xs">Search</Label>
                <Input
                  id="ytd-search"
                  placeholder="Search practices..."
                  value={ytdSearchTerm}
                  onChange={(e) => setYtdSearchTerm(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              {/* Category Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="ytd-category" className="text-xs">Category</Label>
                <Select value={ytdCategoryFilter} onValueChange={setYtdCategoryFilter}>
                  <SelectTrigger id="ytd-category" className="h-8 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesData?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Benchmark Status Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="ytd-benchmark" className="text-xs">Benchmark Status</Label>
                <Select value={ytdBenchmarkFilter} onValueChange={setYtdBenchmarkFilter}>
                  <SelectTrigger id="ytd-benchmark" className="h-8 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="benchmarked">Benchmarked</SelectItem>
                    <SelectItem value="not-benchmarked">Not Benchmarked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="ytd-sort" className="text-xs">Sort By</Label>
                <Select value={ytdSortBy} onValueChange={setYtdSortBy}>
                  <SelectTrigger id="ytd-sort" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="questions">Q&A Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Reset Filters Button */}
            {(ytdCategoryFilter !== "all" || ytdBenchmarkFilter !== "all" || ytdSearchTerm || ytdSortBy !== "date") && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setYtdCategoryFilter("all");
                    setYtdBenchmarkFilter("all");
                    setYtdSearchTerm("");
                    setYtdSortBy("date");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
          
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
                {ytdPractices.length > 0 ? (
                  ytdPractices.map((practice, index) => (
                    <tr
                      key={`${practice.id || practice.title}-${index}`}
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (practice.id) {
                          setYtdDialogOpen(false);
                          navigate(`/practices/${practice.id}`);
                        }
                      }}
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
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      {ytdCategoryFilter !== "all" || ytdBenchmarkFilter !== "all" || ytdSearchTerm
                        ? "No practices match your filters"
                        : "No practices submitted this year yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AlertDialogFooter className="pt-3 mt-2 border-t">
            <div className="text-xs text-muted-foreground mr-auto">
              Showing {ytdPractices.length} practice{ytdPractices.length !== 1 ? 's' : ''}
            </div>
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
              <TableSkeleton rows={5} />
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
              <ChartSkeleton />
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
            {unifiedLoading ? (
              <ListSkeleton items={4} />
            ) : benchmarkedPractices && benchmarkedPractices.length > 0 ? (
              <div className="space-y-4">
                {benchmarkedPractices
                  .slice(0, 4)
                  .map((bp: any, index: number) => (
                    <div
                      key={bp.practice_id || index}
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
                        {bp.savings_amount && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">
                              Expected Savings:{" "}
                              {formatCurrency(
                                bp.savings_amount,
                                1,
                                bp.savings_currency || "lakhs"
                              )}{" "}
                              {bp.savings_period === "monthly"
                                ? "monthly"
                                : "annually"}
                            </span>
                          </div>
                        )}
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
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No benchmarked practices available.
              </div>
            )}
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
            {unifiedLoading ? (
              <ListSkeleton items={4} />
            ) : unifiedError ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm">Failed to load recent practices</p>
                <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
              </div>
            ) : recentPractices && recentPractices.length > 0 ? (
              <div className="space-y-4">
                {recentPractices
                  .slice(0, 4)
                  .map((practice: any, index: number) => {
                    // Calculate time ago from submitted_date_iso (preferred) or submitted_date
                    const submittedDate = practice.submitted_date_iso 
                      ? new Date(practice.submitted_date_iso) 
                      : (practice.submitted_date ? new Date(practice.submitted_date) : null);
                    
                    const timeAgo = submittedDate
                      ? (() => {
                          const diffMs = Date.now() - submittedDate.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffHours / 24);
                          const diffWeeks = Math.floor(diffDays / 7);
                          const diffMonths = Math.floor(diffDays / 30);
                          
                          if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
                          if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
                          if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                          if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                          return 'Just now';
                        })()
                      : practice.submitted_date || 'Recently';
                    
                    return (
                      <div
                        key={practice.id || index}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth hover-lift"
                        onClick={() => {
                          navigate(`/practices/${practice.id}`);
                        }}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{practice.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {practice.category_name || "Other"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {practice.plant_name || "Unknown Plant"}
                            </span>
                            <span className="text-xs text-muted-foreground">• {timeAgo}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {practice.question_count > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary text-xs"
                            >
                              {practice.question_count} Q&A
                            </Badge>
                          )}
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
              <TableSkeleton rows={5} />
            ) : mergedLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No leaderboard data available</p>
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  User,
  IndianRupee,
  MapPin,
  Loader2
} from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useBestPractices } from "@/hooks/useBestPractices";
import { useCategories } from "@/hooks/useCategories";
import { usePlants } from "@/hooks/usePlants";
import { useBenchmarkPractice, useUnbenchmarkPractice } from "@/hooks/useBenchmarking";
import { formatDate } from "@/lib/utils";

interface PracticeListProps {
  userRole: "plant" | "hq";
  isBenchmarked?: (id?: string) => boolean;
}


const PracticeList = ({ userRole, isBenchmarked }: PracticeListProps) => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [plantFilter, setPlantFilter] = useState<string>("all");
  const [savingsFilter, setSavingsFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [processingPracticeId, setProcessingPracticeId] = useState<string | null>(null);

  // Fetch data from API - sorted by creation date (newest first)
  // Reduced limit for better performance - use pagination if needed
  const { data: practicesData, isLoading: practicesLoading } = useBestPractices({
    category_id: categoryFilter !== "all" ? categoryFilter : undefined,
    plant_id: plantFilter !== "all" ? plantFilter : undefined,
    search: searchTerm || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    limit: 50, // Reduced from 100 for faster initial load
    sort_by: 'created_at', // Sort by creation date
    sort_order: 'desc', // Newest first
  });

  const { data: categoriesData } = useCategories();
  const { data: plantsData } = usePlants(true);
  const benchmarkMutation = useBenchmarkPractice();
  const unbenchmarkMutation = useUnbenchmarkPractice();

  // Get practices from API
  const allPractices = practicesData?.data || [];
  const totalPractices = practicesData?.pagination?.total || 0;
  
  // Filter practices based on user role (plant users see only their plant)
  const practices = useMemo(() => {
    // Note: Plant filtering is handled by backend API based on user role
    // Frontend doesn't need to filter by plant as backend already does this
    return allPractices;
  }, [allPractices]);

  const uniqueCategories = useMemo(
    () => categoriesData?.map(cat => cat.name).sort() || [],
    [categoriesData]
  );

  const uniquePlants = useMemo(
    () => plantsData?.map(plant => plant.name).sort() || [],
    [plantsData]
  );

  const uniqueSavings = useMemo(
    () => Array.from(new Set(allPractices.map((practice) => {
      if (!practice.savings_amount) return null;
      const currency = practice.savings_currency === 'crores' ? 'Cr' : practice.savings_currency === 'lakhs' ? 'L' : '';
      return `₹${practice.savings_amount}${currency}`;
    }).filter(Boolean))).sort(),
    [allPractices]
  );

  const uniqueAreas = useMemo(
    () => Array.from(new Set(allPractices.map((practice) => practice.area_implemented).filter(Boolean))).sort(),
    [allPractices]
  );

  // Apply client-side filters (savings and area filters)
  const filteredPractices = useMemo(() => {
    let filtered = practices;

    // Apply savings filter
    if (savingsFilter !== "all") {
      filtered = filtered.filter((practice) => {
        if (!practice.savings_amount) return false;
        const currency = practice.savings_currency === 'crores' ? 'Cr' : practice.savings_currency === 'lakhs' ? 'L' : '';
        const savingsStr = `₹${practice.savings_amount}${currency}`;
        return savingsStr === savingsFilter;
      });
    }

    // Apply area filter
    if (areaFilter !== "all") {
      filtered = filtered.filter((practice) => practice.area_implemented === areaFilter);
    }

    // Sort by creation date (newest first) as fallback to ensure correct order
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      // If created_at is not available, use submitted_date as fallback
      const fallbackDateA = a.submitted_date ? new Date(a.submitted_date).getTime() : 0;
      const fallbackDateB = b.submitted_date ? new Date(b.submitted_date).getTime() : 0;
      const finalDateA = dateA || fallbackDateA;
      const finalDateB = dateB || fallbackDateB;
      return finalDateB - finalDateA; // Descending order (newest first)
    });

    return filtered;
  }, [practices, savingsFilter, areaFilter]);

  const resetFilters = () => {
    setCategoryFilter("all");
    setPlantFilter("all");
    setSavingsFilter("all");
    setAreaFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  // Removed status concept (approved/revision/pending)

  const getCategoryColor = (category: string | undefined | { name?: string } | any) => {
    // Handle category as object or string
    const categoryName = typeof category === 'string' 
      ? category 
      : (category?.name || category?.category_name || '');
    
    if (!categoryName || typeof categoryName !== 'string') {
      return "bg-gray-50 text-gray-700 border-gray-200";
    }
    switch (categoryName.toLowerCase()) {
      case "quality":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cost":
        return "bg-green-50 text-green-700 border-green-200";
      case "safety":
        return "bg-red-50 text-red-700 border-red-200";
      case "productivity":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "automation":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "digitalisation":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "esg":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Best Practices Library</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "plant" 
              ? "Browse best practices from your plant" 
              : "Browse and explore best practices from across all plants"
            }
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <FileText className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search practices by title, category, or plant..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Filters"}
            </Button>
          </div>
          {showFilters && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoriesData?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plant</p>
                <Select value={plantFilter} onValueChange={setPlantFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All plants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plants</SelectItem>
                    {plantsData?.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Savings</p>
                <Select value={savingsFilter} onValueChange={setSavingsFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All savings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All savings</SelectItem>
                    {uniqueSavings.map((savings) => (
                      <SelectItem key={savings} value={savings}>
                        {savings}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Area Implemented</p>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All areas</SelectItem>
                    {uniqueAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">From date</p>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">To date</p>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">Total Best Practices</p>
              <div className="text-2xl font-bold text-primary">{totalPractices}</div>
            </div>
          </CardContent>
        </Card>
        {/* Removed Approved/Pending cards */}
        <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">Total Q&A</p>
              <div className="text-2xl font-bold text-primary">
                {practices.reduce((sum, p) => sum + (p.question_count || 0), 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practices List */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>All Best Practices</span>
            {!practicesLoading && <Badge variant="outline">{filteredPractices.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {practicesLoading ? (
            <ListSkeleton items={5} />
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No best practices found.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {filteredPractices.map((practice) => (
              <div
                key={practice.id}
                className="flex items-center justify-between p-6 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth group hover-lift"
                onClick={() => navigate(`/practices/${practice.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {practice.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2">
                        {practice.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-3 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getCategoryColor(practice.category_name || practice.category)}>
                            {practice.category_name || practice.category || "Other"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{practice.submitted_by_name || practice.submittedBy || "Unknown"}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{practice.plant_name || practice.plant || "Unknown"}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(practice.submitted_date || practice.submittedDate)}</span>
                        </div>
                        
                        {practice.savings_amount && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <IndianRupee className="h-3 w-3" />
                            <span>
                              ₹{practice.savings_amount}
                              {practice.savings_currency === 'crores' ? 'Cr' : practice.savings_currency === 'lakhs' ? 'L' : ''}
                            </span>
                          </div>
                        )}
                        
                        {practice.area_implemented && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{practice.area_implemented}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {(practice.question_count || 0) > 0 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {practice.question_count || 0} Q&A
                    </Badge>
                  )}
                  {(practice.is_benchmarked || isBenchmarked?.(practice.id)) && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Benchmarked</Badge>
                  )}
                  
                  {/* Status badge removed */}
                  
                  {userRole === "hq" && (
                    <Button 
                      size="sm" 
                      variant={(practice.is_benchmarked || isBenchmarked?.(practice.id)) ? "outline" : "default"}
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        try {
                          setProcessingPracticeId(practice.id);
                          const isCurrentlyBenchmarked = practice.is_benchmarked || isBenchmarked?.(practice.id);
                          if (isCurrentlyBenchmarked) {
                            await unbenchmarkMutation.mutateAsync(practice.id);
                          } else {
                            await benchmarkMutation.mutateAsync(practice.id);
                          }
                          // Query invalidation is handled by the mutation hooks
                        } catch (error: any) {
                          console.error('Failed to toggle benchmark:', error);
                          // Error toast is handled by mutation hooks
                        } finally {
                          setProcessingPracticeId(null);
                        }
                      }}
                      disabled={processingPracticeId === practice.id}
                    >
                      {processingPracticeId === practice.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          {(practice.is_benchmarked || isBenchmarked?.(practice.id)) ? "Unbenchmarking..." : "Benchmarking..."}
                        </>
                      ) : (
                        (practice.is_benchmarked || isBenchmarked?.(practice.id)) ? "Unbenchmark" : "Benchmark"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeList;

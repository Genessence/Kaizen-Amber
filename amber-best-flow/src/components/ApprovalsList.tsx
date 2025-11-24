import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileCheck2,
  Filter,
  Search,
  Calendar,
  Building2,
  User,
  FileText,
  Loader2
} from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeletons";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useBestPractices } from "@/hooks/useBestPractices";
import { useBenchmarkPractice, useUnbenchmarkPractice } from "@/hooks/useBenchmarking";
import { formatDate } from "@/lib/utils";

interface ApprovalsListProps {
  userRole: "plant" | "hq";
  isBenchmarked?: (id?: string) => boolean;
  onToggleBenchmark?: (practice: any) => void;
}

const ApprovalsList = ({ userRole, isBenchmarked, onToggleBenchmark }: ApprovalsListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [processingPracticeId, setProcessingPracticeId] = useState<string | null>(null);

  // Fetch submitted practices (awaiting approval) OR approved practices (not benchmarked)
  // For now, fetch submitted practices - these need to be approved first
  const { data: practicesData, isLoading: practicesLoading } = useBestPractices({
    status: 'submitted',
    limit: 100,
  });

  const benchmarkMutation = useBenchmarkPractice();
  const unbenchmarkMutation = useUnbenchmarkPractice();

  // Helper function to check if a practice is benchmarked
  const checkIsBenchmarked = (practiceId: string, practiceIsBenchmarked?: boolean): boolean => {
    // Check both the practice's is_benchmarked flag and the callback function
    return practiceIsBenchmarked || isBenchmarked?.(practiceId) || false;
  };

  // Transform practices to include full details
  const practices = useMemo(() => {
    if (!practicesData?.data) return [];
    
    return practicesData.data.map((practice: any) => {
      const practiceId = practice.id;
      const isBenchmarkedValue = checkIsBenchmarked(practiceId, practice.is_benchmarked);
      
      return {
        id: practiceId,
        practice_id: practiceId,
        title: practice.title,
        category: practice.category_name || practice.category,
        category_name: practice.category_name || practice.category,
        plant: practice.plant_name || practice.plant,
        plant_name: practice.plant_name || practice.plant,
        description: practice.description || `${practice.title} - Best practice from ${practice.plant_name || practice.plant}`,
        submitted_date: practice.submitted_date,
        benchmarked_date: practice.benchmarked_date,
        copy_count: 0, // Would need separate query
        is_benchmarked: isBenchmarkedValue,
        question_count: 0, // Would need separate query
        submitted_by_name: practice.submitted_by_name || practice.submitted_by || "Unknown",
      };
    });
  }, [practicesData, isBenchmarked]);

  // Filter by search term
  const filteredPractices = useMemo(() => {
    if (!searchTerm) return practices;
    const term = searchTerm.toLowerCase();
    return practices.filter((practice) => {
      return (
        practice.title?.toLowerCase().includes(term) ||
        practice.description?.toLowerCase().includes(term) ||
        practice.category_name?.toLowerCase().includes(term) ||
        practice.plant_name?.toLowerCase().includes(term)
      );
    });
  }, [practices, searchTerm]);

  // Status badges removed

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Practice Approvals</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "hq" 
              ? "Review submitted practices and approve them for benchmarking"
              : "View submitted practices from your plant"
            }
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <FileText className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Search/Filters */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search practices by title, category, or plant..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        </CardContent>
      </Card>

      {/* Counters */}
      {/* Counters removed: no approval statuses */}

      {/* List */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <span>Submitted Practices</span>
            {!practicesLoading && <Badge variant="outline">{filteredPractices.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {practicesLoading ? (
            <ListSkeleton items={5} />
          ) : filteredPractices.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No practices found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? "Try adjusting your search terms." : "No practices are submitted and awaiting approval yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPractices.map((practice) => (
                <div
                  key={practice.id}
                  className="flex items-center justify-between p-6 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
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
                          <Badge variant="outline">
                            {practice.category_name || practice.category || "Other"}
                          </Badge>

                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{practice.submitted_by_name || "Unknown"}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{practice.plant_name || practice.plant || "Unknown"}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(practice.submitted_date || practice.submittedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {practice.copy_count > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {practice.copy_count} {practice.copy_count === 1 ? 'Copy' : 'Copies'}
                      </Badge>
                    )}
                    {practice.is_benchmarked && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        Benchmarked
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/practices/${practice.id}`);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant={practice.is_benchmarked ? "outline" : "default"}
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        try {
                          setProcessingPracticeId(practice.id);
                          if (practice.is_benchmarked) {
                            await unbenchmarkMutation.mutateAsync(practice.id);
                          } else {
                            await benchmarkMutation.mutateAsync(practice.id);
                          }
                          onToggleBenchmark?.(practice);
                        } catch (error: any) {
                          console.error('Failed to toggle benchmark:', error);
                        } finally {
                          setProcessingPracticeId(null);
                        }
                      }}
                      disabled={processingPracticeId === practice.id}
                    >
                      {processingPracticeId === practice.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          {practice.is_benchmarked ? "Unbenchmarking..." : "Benchmarking..."}
                        </>
                      ) : (
                        practice.is_benchmarked ? "Unbenchmark" : "Benchmark"
                      )}
                    </Button>
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

export default ApprovalsList;



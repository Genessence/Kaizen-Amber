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
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Practice {
  id: string;
  title: string;
  category: string;
  submittedBy: string;
  plant: string;
  submittedDate: string;
  description: string;
  problemStatement?: string;
  solution?: string;
  benefits?: string[];
  metrics?: string;
  implementation?: string;
  questions: number;
}

interface ApprovalsListProps {
  userRole: "plant" | "hq";
  isBenchmarked?: (id?: string) => boolean;
  onToggleBenchmark?: (practice: Practice) => void;
}

const ApprovalsList = ({ userRole, isBenchmarked, onToggleBenchmark }: ApprovalsListProps) => {
  const navigate = useNavigate();
  const hydrateForDetail = (p: Practice): Practice => ({
    ...p,
    problemStatement:
      p.problemStatement ||
      "Problem statement not provided in summary. Please refer to the full submission for context.",
    solution:
      p.solution ||
      "Solution details not provided in summary. Please refer to the full submission for implementation steps.",
    benefits: p.benefits && p.benefits.length > 0 ? p.benefits : [
      "Benefit details will appear here when available"
    ],
    metrics:
      p.metrics ||
      "Metrics will appear here when available",
    implementation:
      p.implementation ||
      "Implementation details will appear here when available",
  });
  // Base dataset (can be fetched later)
  const allPractices: Practice[] = [
    {
      id: "BP-001",
      title: "Automated Quality Inspection System Implementation",
      category: "Quality",
      submittedBy: "Rajesh Kumar",
      plant: "Greater Noida (Ecotech 1)",
      submittedDate: "2025-01-15",
      description:
        "Implementation of an automated quality inspection system using computer vision...",
      questions: 2,
    },
    {
      id: "BP-002",
      title: "Energy Efficient Cooling Process",
      category: "Cost",
      submittedBy: "Amit Singh",
      plant: "Kanchipuram",
      submittedDate: "2025-02-12",
      description:
        "Optimized cooling system that reduces energy consumption by 30%...",
      questions: 0,
    },
    {
      id: "BP-003",
      title: "Safety Protocol for Chemical Handling",
      category: "Safety",
      submittedBy: "Sneha Patel",
      plant: "Supa",
      submittedDate: "2025-03-10",
      description:
        "Comprehensive safety protocols for handling hazardous chemicals...",
      questions: 1,
    },
    {
      id: "BP-004",
      title: "Production Line Optimization",
      category: "Productivity",
      submittedBy: "Vikram Sharma",
      plant: "Ranjangaon",
      submittedDate: "2025-04-08",
      description: "Streamlined production line layout and workflow optimization...",
      questions: 3,
    },
    {
      id: "BP-005",
      title: "IoT Sensor Implementation for Predictive Maintenance",
      category: "Productivity",
      submittedBy: "Deepak Kumar",
      plant: "Kanchipuram",
      submittedDate: "2025-05-20",
      description:
        "Deployment of IoT sensors for real-time equipment monitoring...",
      questions: 0,
    },
    {
      id: "BP-006",
      title: "Waste Heat Recovery System",
      category: "Cost",
      submittedBy: "Priya Gupta",
      plant: "Greater Noida (Ecotech 1)",
      submittedDate: "2025-03-18",
      description:
        "Implementation of waste heat recovery system that captures and reuses thermal energy...",
      questions: 1,
    },
  ];

  // No approval statuses: show all submissions
  const requiresAction = allPractices;

  // Role-based filtering
  const visiblePractices =
    userRole === "plant"
      ? requiresAction.filter((p) => p.plant === "Greater Noida (Ecotech 1)")
      : requiresAction;

  // Status badges removed

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Benchmark Best Practice</h1>
          {userRole === "plant" && (
            <p className="text-muted-foreground mt-1">
              Requests from Greater Noida (Ecotech 1) awaiting decision
            </p>
          )}
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
              <Input placeholder="Search practices..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
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
            <span>Items Requiring Decision</span>
            <Badge variant="outline">{visiblePractices.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visiblePractices.map((practice) => (
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

                      <div className="flex items-center space-x-4 mt-3">
                        <Badge variant="outline">{practice.category}</Badge>

                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{practice.submittedBy}</span>
                        </div>

                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{practice.plant}</span>
                        </div>

                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{practice.submittedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {practice.questions > 0 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {practice.questions} Q&A
                    </Badge>
                  )}
                  {isBenchmarked?.(practice.id) && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Benchmarked</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPractice(hydrateForDetail(practice));
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBenchmark?.(practice);
                    }}
                  >
                    {isBenchmarked?.(practice.id) ? "Unbenchmark" : "Benchmark"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsList;



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  CheckCircle, 
  Download, 
  MessageCircle,
  Send,
  Calendar,
  Building2,
  User,
  FileText,
  Image as ImageIcon,
  ThumbsUp,
  AlertCircle,
  Clock,
  Shield,
  Loader2
} from "lucide-react";
import { useBenchmarkPractice, useUnbenchmarkPractice } from "@/hooks/useBenchmarking";
import { useBestPractice } from "@/hooks/useBestPractices";
import { usePracticeQuestions, useAskQuestion, useAnswerQuestion } from "@/hooks/useQuestions";
import { usePracticeImages } from "@/hooks/usePracticeImages";
import { usePracticeDocuments } from "@/hooks/usePracticeDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

interface BestPracticeDetailProps {
  userRole: "plant" | "hq";
  practice?: any;
  isBenchmarked?: boolean;
  onToggleBenchmark?: () => void;
}

const BestPracticeDetail = ({ userRole, practice: propPractice, isBenchmarked, onToggleBenchmark }: BestPracticeDetailProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Get current user
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Fetch full practice details if we have an ID
  const { data: apiPractice, isLoading: practiceLoading } = useBestPractice(propPractice?.id);
  
  // Get practice ID for questions hook
  const practiceId = apiPractice?.id || propPractice?.id;
  
  // Fetch questions for this practice
  const { data: questionsData = [], isLoading: questionsLoading } = usePracticeQuestions(practiceId);

  // Join practice room for real-time Q&A updates
  useEffect(() => {
    if (!socket || !practiceId || !isConnected) return;

    // Join the practice room
    socket.emit('join-practice', practiceId);

    // Listen for new questions
    const handleQuestionAdded = (question: any) => {
      // Invalidate questions query to refetch
      queryClient.invalidateQueries({ queryKey: ['questions', practiceId] });
    };

    // Listen for question answers
    const handleQuestionAnswered = (question: any) => {
      // Invalidate questions query to refetch
      queryClient.invalidateQueries({ queryKey: ['questions', practiceId] });
    };

    socket.on('question-added', handleQuestionAdded);
    socket.on('question-answered', handleQuestionAnswered);

    // Cleanup: leave room and remove listeners
    return () => {
      socket.emit('leave-practice', practiceId);
      socket.off('question-added', handleQuestionAdded);
      socket.off('question-answered', handleQuestionAnswered);
    };
  }, [socket, practiceId, isConnected, queryClient]);
  
  // Fetch images for this practice
  const { data: imagesData = [], isLoading: imagesLoading } = usePracticeImages(practiceId);
  
  // Fetch documents for this practice
  const { data: documentsData = [], isLoading: documentsLoading } = usePracticeDocuments(practiceId);
  
  // Q&A mutations
  const askQuestionMutation = useAskQuestion();
  const answerQuestionMutation = useAnswerQuestion();
  
  // State for question/answer inputs
  const [newQuestionText, setNewQuestionText] = useState("");
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [isBenchmarkProcessing, setIsBenchmarkProcessing] = useState(false);
  
  // Use benchmark mutations
  const benchmarkMutation = useBenchmarkPractice();
  const unbenchmarkMutation = useUnbenchmarkPractice();

  // Handle benchmark toggle
  const handleBenchmarkToggle = async () => {
    if (!practice?.id) return;

    try {
      setIsBenchmarkProcessing(true);
      if (practice.is_benchmarked) {
        await unbenchmarkMutation.mutateAsync(practice.id);
      } else {
        await benchmarkMutation.mutateAsync(practice.id);
      }
      // Optionally call legacy callback
      onToggleBenchmark?.();
    } catch (error) {
      // Error handled by mutation hook
      console.error('Benchmark toggle failed:', error);
    } finally {
      setIsBenchmarkProcessing(false);
    }
  };

  // Use API data if available, otherwise use prop data
  const practice = (apiPractice || propPractice) ? {
    id: (apiPractice || propPractice).id || "BP-001",
    title: (apiPractice || propPractice).title || "Best Practice",
    category: (apiPractice || propPractice).category_name || (apiPractice || propPractice).category || "Other",
    submittedBy: (apiPractice || propPractice).submitted_by_name || (apiPractice || propPractice).submittedBy || "Unknown",
    submitted_by_user_id: (apiPractice || propPractice).submitted_by_user_id,
    plant: (apiPractice || propPractice).plant_name || (apiPractice || propPractice).plant || "Unknown Plant",
    submittedDate: (apiPractice || propPractice).submitted_date || (apiPractice || propPractice).submittedDate || (apiPractice || propPractice).date || new Date().toISOString().split('T')[0],
    approvedDate: (apiPractice || propPractice).approvedDate,
    approvedBy: (apiPractice || propPractice).approvedBy,
    copiedToPlants: (apiPractice || propPractice).copiedToPlants || [],
    description: (apiPractice || propPractice).description || "",
    problemStatement: (apiPractice || propPractice).problem_statement || (apiPractice || propPractice).problemStatement || "",
    solution: (apiPractice || propPractice).solution || "",
    benefits: Array.isArray((apiPractice || propPractice).benefits) ? (apiPractice || propPractice).benefits : [],
    metrics: (apiPractice || propPractice).metrics || "",
    implementation: (apiPractice || propPractice).implementation || "",
    investment: (apiPractice || propPractice).investment || "",
    questions: (apiPractice || propPractice).question_count || (apiPractice || propPractice).questions || 0,
    savings: (apiPractice || propPractice).savings,
    areaImplemented: (apiPractice || propPractice).area_implemented || (apiPractice || propPractice).areaImplemented || "",
    beforeImage: (apiPractice || propPractice).beforeImage,
    afterImage: (apiPractice || propPractice).afterImage,
    is_benchmarked: (apiPractice || propPractice).is_benchmarked ?? isBenchmarked,
    images: imagesData.length > 0 ? imagesData : ((apiPractice || propPractice).images || []),
    documents: (apiPractice || propPractice).documents || []
  } : {
    id: "BP-001",
    title: "Automated Quality Inspection System Implementation",
    category: "Quality",
    // removed approval status concept
    submittedBy: "Rajesh Kumar",
    plant: "Greater Noida (Ecotech 1)",
    submittedDate: "2025-01-15",
    approvedDate: "2025-01-18",
    approvedBy: "Priya Sharma (HQ Admin)",
    copiedToPlants: [
      "Kanchipuram",
      "Rajpura"
    ],
    description: "Implementation of an automated quality inspection system using computer vision to detect defects in manufactured components, reducing manual inspection time and improving accuracy.",
    problemStatement: "Manual quality inspection was time-consuming, prone to human error, and created bottlenecks in the production line. Inspectors were spending 3-4 hours daily on repetitive visual checks.",
    solution: "Deployed AI-powered computer vision system with high-resolution cameras at key inspection points. The system uses machine learning algorithms trained on defect patterns to automatically identify and classify defects.",
    benefits: [
      "95% reduction in inspection time",
      "99.2% accuracy in defect detection",
      "Eliminated production bottlenecks",
      "Freed up 3 inspectors for other quality activities"
    ],
    metrics: "Cost savings: ₹2.5L annually, Time saved: 20 hours/week, Defect detection improved by 15%",
    implementation: "Project completed in 6 weeks with IT team collaboration. Total investment: ₹8L with 4-month ROI.",
    questions: 0
  };

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!newQuestionText.trim() || !practice?.id) return;
    
    try {
      await askQuestionMutation.mutateAsync({
        practiceId: practice.id,
        questionText: newQuestionText.trim()
      });
      setNewQuestionText("");
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  // Handle answering a question
  const handleAnswerQuestion = async (questionId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const answerText = answerTexts[questionId];
    if (!answerText?.trim() || !practice?.id) return;
    
    try {
      await answerQuestionMutation.mutateAsync({
        questionId,
        answerText: answerText.trim(),
        practiceId: practice.id
      });
      setAnswerTexts(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Best Practices
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{practice.title}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="bg-category-quality/10 text-category-quality border-category-quality">
              {practice.category}
            </Badge>
            {/* Approval badge removed */}
            <span className="text-sm text-muted-foreground">ID: {practice.id}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {/* Helpful button - removed mock data, can be implemented later if backend supports it */}
          {/* <Button variant="outline" size="sm">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Helpful ({practice.helpful_count || 0})
          </Button> */}
          {/* Benchmark button - Only visible to HQ users */}
          {userRole === "hq" && (
            <Button 
              size="sm" 
              variant={practice.is_benchmarked ? "outline" : "default"}
              onClick={handleBenchmarkToggle}
              disabled={isBenchmarkProcessing}
            >
              {isBenchmarkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {practice.is_benchmarked ? "Unbenchmarking..." : "Benchmarking..."}
                </>
              ) : (
                practice.is_benchmarked ? "Unbenchmark" : "Benchmark"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Practice Details */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Practice Details</span>
            </CardTitle>
            
            {/* Approval actions removed */}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Submitted by</p>
                <p className="text-sm text-muted-foreground">{practice.submittedBy}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Plant</p>
                <p className="text-sm text-muted-foreground">{practice.plant}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(practice.submittedDate || practice.submitted_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Deployment Status */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Horizontal Deployment</h4>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Copied to {practice.copiedToPlants?.length ?? 0} plant{(practice.copiedToPlants?.length === 1 ? "" : "s")}
              </Badge>
            </div>
            {practice.copiedToPlants && Array.isArray(practice.copiedToPlants) && practice.copiedToPlants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {practice.copiedToPlants.map((pl: string) => (
                  <Badge key={pl} variant="outline" className="bg-muted/50">{pl}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Overview</h4>
            <p className="text-muted-foreground">{practice.description}</p>
          </div>

          {/* Area Implemented In */}
          {practice.areaImplemented && (
            <div>
              <h4 className="font-medium mb-2">Area Implemented In</h4>
              <p className="text-muted-foreground">{practice.areaImplemented}</p>
            </div>
          )}

          {/* Problem Statement */}
          <div>
            <h4 className="font-medium mb-2">Problem Statement</h4>
            <p className="text-muted-foreground">{practice.problemStatement}</p>
          </div>

          {/* Solution */}
          <div>
            <h4 className="font-medium mb-2">Solution</h4>
            <p className="text-muted-foreground">{practice.solution}</p>
          </div>

          {/* Before/After Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="font-medium mb-3 text-center">Before Implementation</p>
                {imagesLoading ? (
                  <div className="bg-muted/50 rounded-lg p-8 mb-3 text-center">
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2">Loading image...</p>
                  </div>
                ) : (() => {
                  // Use imagesData directly from the hook instead of practice.images
                  const beforeImage = imagesData.find(img => img.image_type === 'before');
                  console.log('Before image check:', { 
                    imagesDataLength: imagesData.length, 
                    beforeImage, 
                    practiceId 
                  });
                  return beforeImage?.blob_url ? (
                    <div className="rounded-lg overflow-hidden border bg-muted/20">
                      <img 
                        src={beforeImage.blob_url} 
                        alt="Before Implementation" 
                        className="w-full h-auto object-contain max-h-96"
                        onError={(e) => {
                          console.error('Failed to load before image:', {
                            url: beforeImage.blob_url,
                            imageId: beforeImage.id,
                            practiceId
                          });
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Before image loaded successfully:', beforeImage.blob_url);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-8 mb-3 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No image available</p>
                      {imagesData.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Found {imagesData.length} image(s), but no "before" image
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="font-medium mb-3 text-center">After Implementation</p>
                {imagesLoading ? (
                  <div className="bg-success/10 rounded-lg p-8 mb-3 text-center">
                    <Loader2 className="h-12 w-12 mx-auto text-success animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2">Loading image...</p>
                  </div>
                ) : (() => {
                  // Use imagesData directly from the hook instead of practice.images
                  const afterImage = imagesData.find(img => img.image_type === 'after');
                  console.log('After image check:', { 
                    imagesDataLength: imagesData.length, 
                    afterImage, 
                    practiceId 
                  });
                  return afterImage?.blob_url ? (
                    <div className="rounded-lg overflow-hidden border bg-success/5">
                      <img 
                        src={afterImage.blob_url} 
                        alt="After Implementation" 
                        className="w-full h-auto object-contain max-h-96"
                        onError={(e) => {
                          console.error('Failed to load after image:', {
                            url: afterImage.blob_url,
                            imageId: afterImage.id,
                            practiceId
                          });
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('After image loaded successfully:', afterImage.blob_url);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-success/10 rounded-lg p-8 mb-3 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-success" />
                      <p className="text-sm text-muted-foreground mt-2">No image available</p>
                      {imagesData.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Found {imagesData.length} image(s), but no "after" image
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Supporting Documents */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supporting Documents
            </h4>
            {documentsLoading ? (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2">Loading documents...</p>
                  </div>
                </CardContent>
              </Card>
            ) : documentsData && documentsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentsData.map((doc) => {
                  const getFileIcon = (contentType: string) => {
                    if (contentType.includes('pdf')) {
                      return <FileText className="h-8 w-8 text-red-500" />;
                    } else if (contentType.includes('word') || contentType.includes('document')) {
                      return <FileText className="h-8 w-8 text-blue-500" />;
                    } else if (contentType.includes('powerpoint') || contentType.includes('presentation')) {
                      return <FileText className="h-8 w-8 text-orange-500" />;
                    }
                    return <FileText className="h-8 w-8 text-muted-foreground" />;
                  };

                  const formatFileSize = (bytes: number) => {
                    if (bytes < 1024) return bytes + ' B';
                    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                  };

                  return (
                    <Card
                      key={doc.id}
                      className="hover:shadow-md transition-shadow cursor-pointer border"
                      onClick={() => {
                        window.open(doc.blob_url, '_blank');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getFileIcon(doc.content_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={doc.document_name}>
                              {doc.document_name}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Download className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to download</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">No supporting documents available</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Benefits & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Key Benefits Achieved</h4>
              <ul className="space-y-2">
                {(() => {
                  // Handle both array and string formats
                  let benefitsList: string[] = [];
                  if (Array.isArray(practice.benefits) && practice.benefits.length > 0) {
                    benefitsList = practice.benefits;
                  } else if (typeof practice.benefits === 'string' && practice.benefits.trim()) {
                    // Split by newlines if it's a string
                    benefitsList = practice.benefits.split('\n').filter(b => b.trim());
                  }
                  
                  return benefitsList.length > 0 ? (
                    benefitsList.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No benefits listed</li>
                  );
                })()}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Measurable Impact</h4>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm">{practice.metrics}</p>
              </div>
            </div>
          </div>

          {/* Investment in the Best Practice */}
          {practice.investment && (
            <div>
              <h4 className="font-medium mb-2">Investment in the Best Practice</h4>
              <p className="text-muted-foreground">{practice.investment}</p>
            </div>
          )}

          {/* Implementation Details */}
          <div>
            <h4 className="font-medium mb-2">Implementation Timeline & Resources</h4>
            <p className="text-muted-foreground">{practice.implementation || "Not specified"}</p>
          </div>


          {/* Approved info removed */}
        </CardContent>
      </Card>

      {/* Q&A Section */}
      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>Questions & Answers</span>
            <Badge variant="outline">{questionsData.length}</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Ask Question Section - Always visible for authenticated users */}
          {practice?.id && user ? (
            (() => {
              // Check if user is the author - compare IDs as strings to handle UUID format differences
              const isAuthor = practice.submitted_by_user_id && user.id && 
                String(practice.submitted_by_user_id).toLowerCase() === String(user.id).toLowerCase();
              
              if (isAuthor) {
                return (
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <MessageCircle className="h-5 w-5" />
                      <p className="text-sm">You are the author of this practice. Other users can ask questions here.</p>
                    </div>
                  </div>
              );
              }
              
              // Show Q&A form for non-authors
              return (
                <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span>Ask a Question</span>
                    </h4>
                  </div>
                  <Textarea
                    placeholder="Ask the author about implementation details, challenges, or applicability to your plant..."
                    className="min-h-24 bg-background"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    disabled={askQuestionMutation.isPending}
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm"
                      onClick={handleAskQuestion}
                      disabled={!newQuestionText.trim() || askQuestionMutation.isPending}
                      className="min-w-[140px]"
                    >
                      {askQuestionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Question
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">Please log in to ask questions about this practice.</p>
              </div>
            </div>
          )}

          {practice?.id && user && practice.submitted_by_user_id && user.id && 
           String(practice.submitted_by_user_id).toLowerCase() !== String(user.id).toLowerCase() && (
            <Separator />
          )}

          {/* Questions List */}
          {questionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questionsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No questions yet. Be the first to ask!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questionsData.map((q) => (
                <div key={q.id} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {q.asked_by_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm">{q.asked_by_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(q.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{q.question_text}</p>
                    </div>
                  </div>

                  {q.answer_text ? (
                    <div className="ml-11 p-4 bg-accent/30 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <p className="font-medium text-sm text-primary">
                          {q.answered_by_name || "Author"} Response
                        </p>
                        {q.answered_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(q.answered_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{q.answer_text}</p>
                    </div>
                  ) : user && practice?.submitted_by_user_id === user.id ? (
                    // Author can answer
                    <div className="ml-11 space-y-2">
                      <Textarea
                        placeholder="Provide your response to help other plants..."
                        className="min-h-16"
                        value={answerTexts[q.id] || ""}
                        onChange={(e) => setAnswerTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                        disabled={answerQuestionMutation.isPending}
                      />
                      <Button 
                        type="button"
                        size="sm"
                        onClick={(e) => handleAnswerQuestion(q.id, e)}
                        disabled={!answerTexts[q.id]?.trim() || answerQuestionMutation.isPending}
                      >
                        {answerQuestionMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Reply
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="ml-11 p-3 bg-warning/5 rounded-lg border border-warning/20">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <p className="text-sm text-warning">Awaiting author response</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BestPracticeDetail;
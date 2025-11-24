import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  FileText, 
  Camera,
  Shield,
  Target,
  Zap,
  IndianRupee,
  Settings,
  Save,
  Send,
  Copy,
  Cpu,
  LineChart,
  Loader2
} from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useCreateBestPractice } from "@/hooks/useBestPractices";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface BestPracticeFormProps {
  onSubmit?: (payload: {
    title: string;
    category: string;
    problemStatement: string;
    solution: string;
    benefits: string;
    metrics: string;
    implementation: string;
    investment: string;
    beforeImageName: string | null;
    afterImageName: string | null;
    mode: "copy-implement" | "new-submission";
  }) => void;
  preFillData?: {
    title?: string;
    category?: string;
    problemStatement?: string;
    solution?: string;
  } | null;
  pendingCopyMeta?: {
    originPlant?: string;
    bpTitle?: string;
    originalPracticeId?: string;
  } | null;
}

const BestPracticeForm = ({ preFillData, pendingCopyMeta, onSubmit }: BestPracticeFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); // Now stores category ID
  const [problemStatement, setProblemStatement] = useState("");
  const [solution, setSolution] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [metricsText, setMetricsText] = useState("");
  const [implementationText, setImplementationText] = useState("");
  const [investmentText, setInvestmentText] = useState("");
  const [implementationArea, setImplementationArea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement | null>(null);
  const afterInputRef = useRef<HTMLInputElement | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const createMutation = useCreateBestPractice();

  const { toast: oldToast } = useToast();

  // Map category icons based on category name/slug
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('safety')) return Shield;
    if (name.includes('quality')) return Target;
    if (name.includes('productivity')) return Zap;
    if (name.includes('cost')) return IndianRupee;
    if (name.includes('digital') || name.includes('digitalisation')) return Cpu;
    if (name.includes('esg')) return LineChart;
    if (name.includes('automation')) return Settings;
    return Settings; // Default icon
  };

  useEffect(() => {
    if (preFillData) {
      setTitle(preFillData.title || "");
      // Find category ID from category name if provided
      if (preFillData.category && categoriesData) {
        const matchedCategory = categoriesData.find(
          cat => cat.name.toLowerCase() === preFillData.category?.toLowerCase()
        );
        setCategory(matchedCategory?.id || "");
      } else {
        setCategory("");
      }
      setProblemStatement(preFillData.problemStatement || "");
      setSolution(preFillData.solution || "");
      setInvestmentText("");
      setImplementationArea("");
    } else {
      // Clear all fields when preFillData is null (normal add-practice flow)
      setTitle("");
      setCategory("");
      setProblemStatement("");
      setSolution("");
      setInvestmentText("");
      setImplementationArea("");
    }
  }, [preFillData, categoriesData]);
  
  const validate = () => {
    if (!title.trim()) return "Please enter Practice Title.";
    if (!category.trim()) return "Please select a Category.";
    if (!problemStatement.trim()) return "Please enter Problem Statement.";
    if (!solution.trim()) return "Please enter Solution Description.";
    return "";
  };

  const handleSaveDraft = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse benefits into array
      const benefitsArray = benefitsText
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      // Category is now stored as ID, but validate it exists
      const selectedCategory = categoriesData?.find(cat => cat.id === category);

      if (!selectedCategory || !category) {
        toast.error("Please select a valid category");
        setIsSubmitting(false);
        return;
      }

      // Create practice data with draft status
      // Note: Backend automatically sets submitted_date to null when status is 'draft'
      const practiceData = {
        title,
        description: solution.substring(0, 200) || title, // Use title if solution is empty
        category_id: category,
        plant_id: user?.plant_id,
        problem_statement: problemStatement,
        solution: solution || title, // Use title as fallback
        benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
        metrics: metricsText || undefined,
        implementation: implementationText || undefined,
        investment: investmentText || undefined,
        area_implemented: implementationArea || undefined,
        status: 'draft' as const, // Save as draft
        // Don't send submitted_date - backend sets it to null for drafts
      };

      // Create the practice as draft
      const result = await createMutation.mutateAsync(practiceData);

      if (!result.id) {
        throw new Error('Draft creation failed - no ID returned');
      }

      // Upload images if they exist (for drafts too)
      if (beforeImage) {
        try {
          await apiService.uploadPracticeImage(result.id, beforeImage, 'before');
        } catch (error) {
          console.error('Failed to upload before image:', error);
          toast.error('Draft saved but failed to upload before image');
        }
      }

      if (afterImage) {
        try {
          await apiService.uploadPracticeImage(result.id, afterImage, 'after');
        } catch (error) {
          console.error('Failed to upload after image:', error);
          toast.error('Draft saved but failed to upload after image');
        }
      }

      // Upload documents if they exist (for drafts too)
      if (supportingDocs.length > 0) {
        const documentUploadPromises = supportingDocs.map(async (doc) => {
          try {
            await apiService.uploadPracticeDocument(result.id, doc);
            return { success: true, name: doc.name };
          } catch (error) {
            console.error(`Failed to upload document ${doc.name}:`, error);
            return { success: false, name: doc.name };
          }
        });

        const documentResults = await Promise.all(documentUploadPromises);
        const successful = documentResults.filter(r => r.success).length;
        const failed = documentResults.filter(r => !r.success);

        if (successful > 0) {
          toast.success(`Draft saved with ${successful} document(s)`);
        }
        if (failed.length > 0) {
          toast.warning(`Draft saved but ${failed.length} document(s) failed to upload`);
        }
      }

      toast.success("Draft saved successfully!");
      // Navigate back to dashboard after saving draft
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save draft:", error);
      // Error toast already shown by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse benefits into array
      const benefitsArray = benefitsText
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      // Category is now stored as ID, but validate it exists
      const selectedCategory = categoriesData?.find(cat => cat.id === category);

      if (!selectedCategory || !category) {
        toast.error("Please select a valid category");
        setIsSubmitting(false);
        return;
      }

      // Check if this is a copy operation
      const isCopyOperation = !!pendingCopyMeta?.originalPracticeId;

      let result: any;

      if (isCopyOperation) {
        // Use copy & implement API
        if (!pendingCopyMeta.originalPracticeId) {
          toast.error("Original practice ID is missing");
          setIsSubmitting(false);
          return;
        }

        const copyData = {
          original_practice_id: pendingCopyMeta.originalPracticeId,
          customized_title: title,
          customized_description: solution.substring(0, 200),
          customized_problem_statement: problemStatement,
          customized_solution: solution,
          implementation_status: 'planning' as const,
        };

        const copyResponse = await copyMutation.mutateAsync(copyData);
        result = {
          id: copyResponse.data.copied_practice.id,
          title: copyResponse.data.copied_practice.title,
        };
      } else {
        // Create new practice
        const practiceData = {
          title,
          description: solution.substring(0, 200), // First 200 chars as description
          category_id: category, // Now using category ID directly
          plant_id: user?.plant_id, // Include plant_id from user context
          problem_statement: problemStatement,
          solution,
          benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
          metrics: metricsText || undefined,
          implementation: implementationText || undefined,
          investment: investmentText || undefined,
          area_implemented: implementationArea || undefined,
          status: 'submitted' as const,
          // Don't send submitted_date - backend sets it automatically when status is 'submitted'
        };

        result = await createMutation.mutateAsync(practiceData);
      }

      if (!result.id) {
        throw new Error('Practice creation failed - no ID returned');
      }

      const uploadErrors: string[] = [];
      let submissionSuccessful = true;

      // Upload images if they exist (images are optional, so failures don't block submission)
      if (beforeImage) {
        try {
          await apiService.uploadPracticeImage(result.id, beforeImage, 'before');
          toast.success('Before image uploaded successfully');
        } catch (error) {
          console.error('Failed to upload before image:', error);
          uploadErrors.push('Before image');
          toast.error('Failed to upload before image');
          // Images are optional, so don't block submission
        }
      }

      if (afterImage) {
        try {
          await apiService.uploadPracticeImage(result.id, afterImage, 'after');
          toast.success('After image uploaded successfully');
        } catch (error) {
          console.error('Failed to upload after image:', error);
          uploadErrors.push('After image');
          toast.error('Failed to upload after image');
          // Images are optional, so don't block submission
        }
      }

      // Upload documents if they exist - ALL must succeed for successful submission
      if (supportingDocs.length > 0) {
        toast.info(`Uploading ${supportingDocs.length} document(s)...`);
        
        // Upload documents sequentially to ensure proper error handling
        for (const doc of supportingDocs) {
          try {
            await apiService.uploadPracticeDocument(result.id, doc);
            toast.success(`Document "${doc.name}" uploaded successfully`);
          } catch (error: any) {
            console.error(`Failed to upload document ${doc.name}:`, error);
            const errorMessage = error?.message || 'Unknown error';
            uploadErrors.push(`Document: ${doc.name}`);
            toast.error(`Failed to upload document "${doc.name}": ${errorMessage}`);
            submissionSuccessful = false;
            // Stop uploading remaining documents if one fails
            break;
          }
        }

        // If any document failed, prevent submission
        if (!submissionSuccessful) {
          const failedNames = uploadErrors
            .filter(e => e.startsWith('Document:'))
            .map(e => e.replace('Document: ', ''))
            .join(', ');
          
          const errorMessage = `Failed to upload document(s): ${failedNames}. Submission cannot be completed.`;
          
          toast.error(errorMessage);
          toast.warning('Please fix the document upload issue and try again. The practice has not been submitted.');
          
          // Store practice ID for potential retry
          console.log('Practice ID for document retry:', result.id);
          
          // Reset submitting state and return early - DO NOT navigate
          setIsSubmitting(false);
          return;
        }

        if (supportingDocs.length > 0) {
          toast.success(`All ${supportingDocs.length} document(s) uploaded successfully`);
        }
      }

      // Only proceed if submission is successful (all documents uploaded)
      if (!submissionSuccessful) {
        setIsSubmitting(false);
        return;
      }

      // Show success message if all uploads completed
      if (supportingDocs.length > 0 || beforeImage || afterImage) {
        if (uploadErrors.length === 0) {
          toast.success('Practice and all files uploaded successfully!');
        }
      } else {
        toast.success('Practice submitted successfully!');
      }

      // Only navigate if all uploads succeeded
      // Call legacy callback for backwards compatibility
      const mode: "copy-implement" | "new-submission" = preFillData ? "copy-implement" : "new-submission";
      const payload = {
        title,
        category,
        problemStatement,
        solution,
        benefits: benefitsText,
        metrics: metricsText,
        implementation: implementationText,
        investment: investmentText,
        beforeImageName: beforeImage?.name ?? null,
        afterImageName: afterImage?.name ?? null,
        mode,
      };
      onSubmit?.(payload);

      // Close form only if everything succeeded
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to submit practice:", error);
      
      // If it's an upload error, don't show the mutation error toast again
      if (error.message && error.message.includes('Failed to upload')) {
        // Error toast already shown above
      } else {
        // For other errors, show generic error
        toast.error(error.message || "Failed to submit practice. Please try again.");
      }
      
      // Don't navigate away if submission failed
      // User can retry or cancel manually
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBeforeImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setBeforePreview(url);
    } else {
      setBeforePreview(null);
    }
  };

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAfterImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAfterPreview(url);
    } else {
      setAfterPreview(null);
    }
  };

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSupportingDocs(files);
  };
  // Use categories from API instead of hardcoded list
  const categories = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map(cat => ({
      id: cat.id,
      value: cat.id, // Use ID as value
      label: cat.name,
      icon: getCategoryIcon(cat.name),
      slug: cat.slug,
    }));
  }, [categoriesData]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-medium hover:shadow-strong transition-smooth border border-border/50">
        <CardHeader className="bg-gradient-hero text-primary-foreground">
          <CardTitle className="flex items-center space-x-2">
            {preFillData ? <Copy className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
            <span>{preFillData ? "Copy & Implement Best Practice" : "Submit New Best Practice"}</span>
          </CardTitle>
          <p className="text-primary-foreground/80">
            {preFillData 
              ? "Complete the remaining fields to implement this best practice at your plant"
              : `Share your innovation with the Amber Group${user?.plant_name ? ` - ${user.plant_name}` : ""}`
            }
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Copy & Implement Notice */}
          {preFillData && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Copy className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Copying Benchmark Best Practice</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• The following fields have been pre-filled from the original best practice</p>
                      <p>• Review and modify them as needed for your plant's specific context</p>
                      <p>• Complete the remaining fields (images, benefits, metrics, etc.)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                Best Practice Theme *
                {preFillData && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Pre-filled</Badge>}
              </Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your best practice"
              className="w-full h-11 transition-smooth focus:ring-2 focus:ring-primary/20"
              value={title}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length === 0) {
                    setTitle(value);
                  } else if (value.length === 1) {
                    setTitle(value.charAt(0).toUpperCase());
                  } else {
                    setTitle(value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                    setTitle(value.charAt(0).toUpperCase() + value.slice(1));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                Category *
                {preFillData && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Pre-filled</Badge>}
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={categoriesLoading}>
                <SelectTrigger className="h-11 transition-smooth focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select practice category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && !categoriesLoading && (
                    <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                  )}
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.value}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Area Implemented In */}
          <div className="space-y-2">
            <Label htmlFor="implementationArea">Area Implemented In</Label>
            <Input
              id="implementationArea"
              placeholder="Enter the area where this practice was implemented"
              className="w-full h-11 transition-smooth focus:ring-2 focus:ring-primary/20"
              value={implementationArea}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length === 0) {
                  setImplementationArea(value);
                } else if (value.length === 1) {
                  setImplementationArea(value.charAt(0).toUpperCase());
                } else {
                  setImplementationArea(value);
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                  setImplementationArea(value.charAt(0).toUpperCase() + value.slice(1));
                }
              }}
            />
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <Label htmlFor="problem" className="flex items-center gap-2">
              Problem Statement / Challenge *
              {preFillData && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Pre-filled</Badge>}
            </Label>
            <Textarea
              id="problem"
              placeholder="Describe the problem or challenge this practice addresses..."
              className="min-h-24 transition-smooth focus:ring-2 focus:ring-primary/20"
              value={problemStatement}
              onChange={(e) => {
                const value = e.target.value;
                setProblemStatement(value);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                  setProblemStatement(value.charAt(0).toUpperCase() + value.slice(1));
                }
              }}
            />
          </div>

          {/* Solution Description */}
          <div className="space-y-2">
            <Label htmlFor="solution" className="flex items-center gap-2">
              Solution Description *
              {preFillData && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Pre-filled</Badge>}
            </Label>
            <Textarea
              id="solution"
              placeholder="Provide detailed description of your solution, including implementation steps..."
              className="min-h-32 transition-smooth focus:ring-2 focus:ring-primary/20"
              value={solution}
              onChange={(e) => {
                const value = e.target.value;
                setSolution(value);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                  setSolution(value.charAt(0).toUpperCase() + value.slice(1));
                }
              }}
            />
          </div>

          {/* Before/After Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-dashed border-2 border-muted-foreground/30">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {beforePreview ? (
                      <img src={beforePreview} alt="Before preview" className="h-24 w-24 object-cover rounded" />
                    ) : (
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">Before Image</h4>
                    <p className="text-sm text-muted-foreground">Upload image showing the situation before implementation</p>
                  </div>
                  <input ref={beforeInputRef} type="file" accept="image/*" className="hidden" onChange={handleBeforeChange} />
                  <Button variant="outline" size="sm" onClick={() => beforeInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-muted-foreground/30">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {afterPreview ? (
                      <img src={afterPreview} alt="After preview" className="h-24 w-24 object-cover rounded" />
                    ) : (
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">After Image</h4>
                    <p className="text-sm text-muted-foreground">Upload image showing the improved situation</p>
                  </div>
                  <input ref={afterInputRef} type="file" accept="image/*" className="hidden" onChange={handleAfterChange} />
                  <Button variant="outline" size="sm" onClick={() => afterInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Impact & Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="benefits">Key Benefits Achieved</Label>
              <Textarea
                id="benefits"
                placeholder="List the key benefits and improvements realized..."
                className="min-h-20 transition-smooth focus:ring-2 focus:ring-primary/20"
                value={benefitsText}
                onChange={(e) => {
                  const value = e.target.value;
                  setBenefitsText(value);
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                    setBenefitsText(value.charAt(0).toUpperCase() + value.slice(1));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metrics">Quantifiable Metrics (if applicable)</Label>
              <Textarea
                id="metrics"
                placeholder="Include measurable improvements (e.g., 15% reduction in waste, 2 hours saved per day)..."
                className="min-h-20 transition-smooth focus:ring-2 focus:ring-primary/20"
                value={metricsText}
                onChange={(e) => {
                  const value = e.target.value;
                  setMetricsText(value);
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                    setMetricsText(value.charAt(0).toUpperCase() + value.slice(1));
                  }
                }}
              />
            </div>
          </div>

        {/* Investment */}
        <div className="space-y-2">
          <Label htmlFor="investment">Investment in the Best Practice</Label>
          <Textarea
            id="investment"
            placeholder="Document the investment made to implement this practice (time, budget, resources, etc.)"
            className="min-h-20"
            value={investmentText}
            onChange={(e) => {
              const value = e.target.value;
              setInvestmentText(value);
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                setInvestmentText(value.charAt(0).toUpperCase() + value.slice(1));
              }
            }}
          />
        </div>

        {/* Implementation Details */}
          <div className="space-y-2">
            <Label htmlFor="implementation">Implementation Timeline & Resources</Label>
            <Textarea
              id="implementation"
              placeholder="Describe the implementation timeline, resources required, team involved..."
              className="min-h-24 transition-smooth focus:ring-2 focus:ring-primary/20"
              value={implementationText}
              onChange={(e) => {
                const value = e.target.value;
                setImplementationText(value);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                  setImplementationText(value.charAt(0).toUpperCase() + value.slice(1));
                }
              }}
            />
          </div>

          {/* Additional Documentation */}
          <div className="space-y-2">
            <Label>Supporting Documents (Optional)</Label>
            <Card className="border-dashed border-2 border-muted-foreground/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Upload supporting documents</p>
                    <p className="text-xs text-muted-foreground">Process charts, procedures, training materials (PDF, DOC, PPT)</p>
                  </div>
                <input
                  ref={docsInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleDocsChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                />
                <Button variant="outline" size="sm" onClick={() => docsInputRef.current?.click()}>
                    Browse Files
                  </Button>
                </div>
              {supportingDocs.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Selected: {supportingDocs.map((f) => f.name).join(", ")}
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Submission Notice */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-primary">Submission</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Your submission will be visible on your dashboard</p>
                    <p>• Other team members can ask questions about your practice</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
      <Badge variant="outline" className="bg-primary/10 text-primary">
        <Shield className="h-3 w-3 mr-1" />
        {user?.plant_name ? `${user.plant_name} Submission` : "Submission"}
      </Badge>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="transition-smooth hover:bg-accent">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft} 
                className="transition-smooth hover:bg-accent"
                disabled={isSubmitting || createMutation.isPending}
              >
                {isSubmitting || createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button 
                className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-medium hover:shadow-strong transition-smooth" 
                onClick={handleSubmit}
                disabled={isSubmitting || createMutation.isPending}
              >
                {isSubmitting || createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BestPracticeForm;
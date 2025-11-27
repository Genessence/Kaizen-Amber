import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Star, Copy } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface BenchmarkedListProps {
  items: any[];
  onUnbenchmark: (practice: any) => void;
  onCopyAndImplement?: (bpData: any) => void;
  currentUserPlantId?: string;
}

const BenchmarkedList = ({ items, onUnbenchmark, onCopyAndImplement, currentUserPlantId }: BenchmarkedListProps) => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedBP, setSelectedBP] = useState<any>(null);

  const handleCopyImplement = (bp: any) => {
    setSelectedBP(bp);
    setShowConfirmDialog(true);
  };

  const confirmCopyImplement = () => {
    if (selectedBP && onCopyAndImplement) {
      onCopyAndImplement({
        title: selectedBP.title,
        category: selectedBP.category || selectedBP.category_name,
        problemStatement: selectedBP.problemStatement || selectedBP.benchmarked_item?.problem_statement || "",
        solution: selectedBP.solution || selectedBP.description || selectedBP.benchmarked_item?.solution || "",
        practice_id: selectedBP.practice_id || selectedBP.id,
        plant: selectedBP.plant || selectedBP.plant_name,
      });
    }
    setShowConfirmDialog(false);
    setSelectedBP(null);
  };
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Benchmarked Practices</h1>
          <p className="text-muted-foreground mt-1">Best Practices you've benchmarked for later reference</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}><FileText className="h-4 w-4 mr-2" />Back</Button>
      </div>

      <Card className="shadow-soft hover:shadow-medium transition-smooth border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-primary" />
            <span>All Benchmarked</span>
            <Badge variant="outline">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 && (
              <div className="text-center text-muted-foreground">No benchmarked practices yet.</div>
            )}
            {items.map((practice) => (
              <div 
                key={practice.id} 
                className="flex items-center justify-between p-6 border rounded-xl hover:bg-accent/50 hover:border-primary/20 cursor-pointer transition-smooth group hover-lift"
                onClick={() => navigate(`/practices/${practice.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">{practice.title}</h3>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-md">{practice.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{practice.description}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge variant="outline">{practice.category || practice.category_name}</Badge>
                    <span className="text-sm text-muted-foreground">{practice.plant || practice.plant_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/practices/${practice.id}`); }}>View</Button>
                  {/* Only show Copy & Implement if this BP is NOT from the current user's plant */}
                  {(!currentUserPlantId || !practice.plant_id || practice.plant_id !== currentUserPlantId) && (
                    <Button 
                      size="sm" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleCopyImplement(practice); 
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy & Implement
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy & Implement Best Practice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to copy and implement "{selectedBP?.title}" from {selectedBP?.plant}?
              <br /><br />
              <strong>Points System:</strong>
              <br />• {selectedBP?.plant} will receive 10 points (Origin)
              <br />• Your plant will receive 5 points (copier)
              <br /><br />
              This will open the form with pre-filled information. You'll need to complete the remaining fields.
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

export default BenchmarkedList;



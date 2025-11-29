/**
 * DraftsDialog Component
 * Displays draft icon with dropdown showing saved draft practices
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDraftPractices } from '@/hooks/useBestPractices';
import { formatDistanceToNow } from 'date-fns';

const DraftsDialog = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const { data: drafts, isLoading, error, refetch } = useDraftPractices();
  
  const draftCount = drafts?.length || 0;

  const handleContinueEditing = (draftId: string) => {
    setOpen(false);
    navigate(`/practices/add?draftId=${draftId}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label={`Drafts (${draftCount})`}
        >
          <FileText className="h-5 w-5" />
          {draftCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {draftCount > 9 ? '9+' : draftCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Saved Drafts</DialogTitle>
          <DialogDescription>
            Continue editing your saved draft practices
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Failed to load drafts
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : draftCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No saved drafts yet
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Save a draft from the Add Practice form to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {draft.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center">
                          <Badge variant="outline" className="text-xs">
                            {draft.category_name || draft.category}
                          </Badge>
                        </span>
                        <span>•</span>
                        <span>
                          Saved {formatDate(draft.created_at)}
                        </span>
                      </div>
                      {draft.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {draft.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleContinueEditing(draft.id)}
                      className="shrink-0"
                    >
                      Continue Editing
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftsDialog;





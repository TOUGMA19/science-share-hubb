import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Reference, DocumentType, DomaineTechnique } from '@/lib/supabase-types';
import { ReferenceEditDialog } from './ReferenceEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileText, ExternalLink, Calendar, Users, Edit, Trash2, BookOpen, Beaker, GraduationCap } from 'lucide-react';

const documentTypeLabels: Record<DocumentType, string> = {
  article_scientifique: 'Article',
  chapitre_livre: 'Chapitre',
  ouvrage_scientifique: 'Ouvrage',
  technologie: 'Technologie',
  innovation: 'Innovation',
};

const documentTypeIcons: Record<DocumentType, React.ReactNode> = {
  article_scientifique: <FileText className="h-3 w-3" />,
  chapitre_livre: <BookOpen className="h-3 w-3" />,
  ouvrage_scientifique: <GraduationCap className="h-3 w-3" />,
  technologie: <Beaker className="h-3 w-3" />,
  innovation: <Beaker className="h-3 w-3" />,
};

const domaineColors: Record<DomaineTechnique, string> = {
  ST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SDS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  LSH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SEG: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  SJP: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

interface ReferenceCardProps {
  reference: Reference;
  showAuthor?: boolean;
  authorName?: string;
  authorAvatarUrl?: string | null;
  onUpdate?: () => void;
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export function ReferenceCard({ reference, showAuthor = false, authorName, authorAvatarUrl, onUpdate }: ReferenceCardProps) {
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.id === reference.user_id || isAdmin;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('references')
        .delete()
        .eq('id', reference.id);

      if (error) throw error;
      
      toast.success('Référence supprimée');
      setDeleteOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="card-elevated group overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link 
                to={`/reference/${reference.id}`}
                className="line-clamp-2 font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
              >
                {reference.title}
              </Link>
              
              {reference.authors && reference.authors.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">
                    {reference.authors.slice(0, 3).join(', ')}
                    {reference.authors.length > 3 && ` et ${reference.authors.length - 3} autres`}
                  </span>
                </div>
              )}
            </div>
            
            {reference.pdf_url && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {reference.abstract && (
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
              {reference.abstract}
            </p>
          )}
          
          {/* Document type and domain badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {reference.document_type && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                {documentTypeIcons[reference.document_type]}
                {documentTypeLabels[reference.document_type]}
              </Badge>
            )}
            
            {reference.domaine_technique && (
              <Badge className={`text-xs ${domaineColors[reference.domaine_technique]}`}>
                {reference.domaine_technique}
              </Badge>
            )}
            
            {reference.is_principal_author && (
              <Badge variant="secondary" className="text-xs">
                Auteur principal
              </Badge>
            )}
          </div>
          
          {/* Journal and year info */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {reference.journal && (
              <span className="font-medium text-muted-foreground">
                {reference.journal}
              </span>
            )}
            
            {reference.annee_parution && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {reference.annee_parution}
              </span>
            )}
            
            {reference.doi && (
              <a
                href={`https://doi.org/${reference.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                DOI
              </a>
            )}
            
            {reference.statut_revue && (
              <Badge variant="outline" className="text-xs">
                {reference.statut_revue}
              </Badge>
            )}
          </div>
          
          {showAuthor && authorName && (
            <div className="mt-3 border-t border-border pt-3">
              <Link 
                to={`/profile/${reference.user_id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={authorAvatarUrl || undefined} alt={authorName} />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <span>Ajouté par <span className="font-medium">{authorName}</span></span>
              </Link>
            </div>
          )}

          {/* Edit/Delete buttons */}
          {canEdit && (
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="flex-1"
              >
                <Edit className="mr-1 h-3 w-3" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ReferenceEditDialog
        reference={reference}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => onUpdate?.()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la référence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La référence "{reference.title}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

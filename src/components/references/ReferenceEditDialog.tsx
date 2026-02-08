import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Plus, User } from 'lucide-react';
import { Reference, DocumentType, DomaineTechnique, AuthorWithAffiliation } from '@/lib/supabase-types';

interface ReferenceEditDialogProps {
  reference: Reference;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'article_scientifique', label: 'Article Scientifique' },
  { value: 'chapitre_livre', label: 'Chapitre de livre' },
  { value: 'ouvrage_scientifique', label: 'Ouvrage Scientifique' },
  { value: 'technologie', label: 'Technologie' },
  { value: 'innovation', label: 'Innovation' },
];

const domaineOptions: { value: DomaineTechnique; label: string }[] = [
  { value: 'ST', label: 'ST - Sciences et Technologies' },
  { value: 'SDS', label: 'SDS - Sciences de la Santé' },
  { value: 'LSH', label: 'LSH - Lettres et Sciences Humaines' },
  { value: 'SEG', label: 'SEG - Sciences Économiques et de Gestion' },
  { value: 'SJP', label: 'SJP - Sciences Juridiques et Politiques' },
];

export function ReferenceEditDialog({ reference, open, onOpenChange, onSuccess }: ReferenceEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [authorsWithAffiliations, setAuthorsWithAffiliations] = useState<AuthorWithAffiliation[]>([]);
  const [isPrincipalAuthor, setIsPrincipalAuthor] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('article_scientifique');
  const [anneeParution, setAnneeParution] = useState<string>('');
  const [domaineTechnique, setDomaineTechnique] = useState<DomaineTechnique | ''>('');
  const [statutRevue, setStatutRevue] = useState('');
  const [sourceVerification, setSourceVerification] = useState('');

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && reference) {
      setTitle(reference.title || '');
      setAbstract(reference.abstract || '');
      setJournal(reference.journal || '');
      setDoi(reference.doi || '');
      setIsPrincipalAuthor(reference.is_principal_author || false);
      setDocumentType(reference.document_type || 'article_scientifique');
      setAnneeParution(reference.annee_parution?.toString() || '');
      setDomaineTechnique(reference.domaine_technique || '');
      setStatutRevue(reference.statut_revue || '');
      setSourceVerification(reference.source_verification || '');
      
      // Map authors and affiliations
      const authors = reference.authors || [];
      const affiliations = reference.affiliations || [];
      if (authors.length > 0) {
        const paired = authors.map((name, index) => ({
          name,
          affiliation: affiliations[index] || ''
        }));
        setAuthorsWithAffiliations(paired);
      } else {
        setAuthorsWithAffiliations([{ name: '', affiliation: '' }]);
      }
    }
  }, [open, reference]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      const authors = authorsWithAffiliations.filter(a => a.name.trim()).map(a => a.name.trim());
      const affiliations = authorsWithAffiliations.filter(a => a.name.trim()).map(a => a.affiliation.trim());

      const { error } = await supabase
        .from('references')
        .update({
          title: title.trim(),
          abstract: abstract.trim() || null,
          journal: journal.trim() || null,
          doi: doi.trim() || null,
          authors,
          affiliations,
          document_type: documentType,
          annee_parution: anneeParution ? parseInt(anneeParution) : null,
          domaine_technique: domaineTechnique || null,
          statut_revue: statutRevue.trim() || null,
          source_verification: sourceVerification.trim() || null,
          is_principal_author: isPrincipalAuthor,
        })
        .eq('id', reference.id);

      if (error) throw error;

      toast.success('Référence mise à jour avec succès');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAuthor = () => setAuthorsWithAffiliations([...authorsWithAffiliations, { name: '', affiliation: '' }]);
  const removeAuthor = (index: number) => setAuthorsWithAffiliations(authorsWithAffiliations.filter((_, i) => i !== index));
  const updateAuthor = (index: number, field: 'name' | 'affiliation', value: string) => {
    const newAuthors = [...authorsWithAffiliations];
    newAuthors[index][field] = value;
    setAuthorsWithAffiliations(newAuthors);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Modifier la référence</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre publication
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Principal Author Checkbox */}
          <div className="flex items-center space-x-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Checkbox
              id="editIsPrincipalAuthor"
              checked={isPrincipalAuthor}
              onCheckedChange={(checked) => setIsPrincipalAuthor(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <Label htmlFor="editIsPrincipalAuthor" className="cursor-pointer font-medium">
                Je suis l'auteur principal de cette publication
              </Label>
            </div>
          </div>

          {/* Document Type & Domain */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type de document *</Label>
              <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Domaine technique</Label>
              <Select value={domaineTechnique} onValueChange={(v) => setDomaineTechnique(v as DomaineTechnique)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un domaine" />
                </SelectTrigger>
                <SelectContent>
                  {domaineOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Titre *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              required
            />
          </div>

          <div>
            <Label>Résumé</Label>
            <Textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Résumé de l'article"
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Revue / Journal / Éditeur</Label>
              <Input
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Nature, Science, etc."
              />
            </div>
            <div>
              <Label>Année de parution</Label>
              <Input
                type="number"
                value={anneeParution}
                onChange={(e) => setAnneeParution(e.target.value)}
                placeholder="2024"
                min="1900"
                max="2100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>DOI</Label>
              <Input
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.1000/xyz123"
              />
            </div>
            <div>
              <Label>Statut de la revue</Label>
              <Input
                value={statutRevue}
                onChange={(e) => setStatutRevue(e.target.value)}
                placeholder="Indexée, Peer-reviewed..."
              />
            </div>
          </div>

          <div>
            <Label>Source de vérification</Label>
            <Input
              value={sourceVerification}
              onChange={(e) => setSourceVerification(e.target.value)}
              placeholder="Lien internet ou endroit physique"
            />
          </div>

          {/* Authors with Affiliations */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Auteurs et Affiliations</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addAuthor}>
                <Plus className="mr-1 h-3 w-3" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-3">
              {authorsWithAffiliations.map((author, index) => (
                <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Auteur {index + 1}
                    </span>
                    {authorsWithAffiliations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAuthor(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={author.name}
                      onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                      placeholder="Nom de l'auteur"
                    />
                    <Input
                      value={author.affiliation}
                      onChange={(e) => updateAuthor(index, 'affiliation', e.target.value)}
                      placeholder="Affiliation"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

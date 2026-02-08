import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Loader2, X, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DocumentType, DomaineTechnique, AuthorWithAffiliation } from '@/lib/supabase-types';

interface PDFUploaderProps {
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

export function PDFUploader({ onSuccess }: PDFUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [authorsWithAffiliations, setAuthorsWithAffiliations] = useState<AuthorWithAffiliation[]>([
    { name: '', affiliation: '' }
  ]);
  const [isPrincipalAuthor, setIsPrincipalAuthor] = useState(false);
  
  // New fields
  const [documentType, setDocumentType] = useState<DocumentType>('article_scientifique');
  const [anneeParution, setAnneeParution] = useState<string>('');
  const [domaineTechnique, setDomaineTechnique] = useState<DomaineTechnique | ''>('');
  const [statutRevue, setStatutRevue] = useState('');
  const [sourceVerification, setSourceVerification] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0];
    if (pdfFile && pdfFile.type === 'application/pdf') {
      setFile(pdfFile);
      // Set default title from filename
      setTitle(pdfFile.name.replace('.pdf', ''));
    } else {
      toast.error('Veuillez sélectionner un fichier PDF valide');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !file) {
      toast.error('Veuillez vous connecter et sélectionner un fichier');
      return;
    }

    if (!title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    setIsUploading(true);

    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      // Extract authors and affiliations from paired structure
      const authors = authorsWithAffiliations.filter(a => a.name.trim()).map(a => a.name.trim());
      const affiliations = authorsWithAffiliations.filter(a => a.name.trim()).map(a => a.affiliation.trim());

      const { error: insertError } = await supabase
        .from('references')
        .insert({
          user_id: user.id,
          title: title.trim(),
          abstract: abstract.trim() || null,
          journal: journal.trim() || null,
          doi: doi.trim() || null,
          authors,
          affiliations,
          pdf_url: urlData.publicUrl,
          pdf_filename: file.name,
          document_type: documentType,
          annee_parution: anneeParution ? parseInt(anneeParution) : null,
          domaine_technique: domaineTechnique || null,
          statut_revue: statutRevue.trim() || null,
          source_verification: sourceVerification.trim() || null,
          is_principal_author: isPrincipalAuthor,
        });

      if (insertError) throw insertError;

      toast.success('Référence ajoutée avec succès !');
      
      // Reset form
      setFile(null);
      setTitle('');
      setAbstract('');
      setJournal('');
      setDoi('');
      setAuthorsWithAffiliations([{ name: '', affiliation: '' }]);
      setIsPrincipalAuthor(false);
      setDocumentType('article_scientifique');
      setAnneeParution('');
      setDomaineTechnique('');
      setStatutRevue('');
      setSourceVerification('');
      
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'ajout de la référence');
    } finally {
      setIsUploading(false);
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
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <Upload className="h-5 w-5" />
          Ajouter une référence
        </CardTitle>
        <CardDescription>
          Importez un PDF et remplissez les métadonnées manuellement
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">
                {isDragActive 
                  ? 'Déposez le fichier ici...' 
                  : 'Glissez un PDF ici ou cliquez pour sélectionner'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF uniquement, max 10 MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Form fields - shown after file selection */}
          {file && (
            <div className="space-y-4">
              {/* Principal Author Checkbox */}
              <div className="flex items-center space-x-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Checkbox
                  id="isPrincipalAuthor"
                  checked={isPrincipalAuthor}
                  onCheckedChange={(checked) => setIsPrincipalAuthor(checked as boolean)}
                />
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <Label htmlFor="isPrincipalAuthor" className="cursor-pointer font-medium">
                    Je suis l'auteur principal de cette publication
                  </Label>
                </div>
              </div>

              {/* Document Type & Domain */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="documentType">Type de document *</Label>
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
                  <Label htmlFor="domaine">Domaine technique</Label>
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
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de l'article"
                  required
                />
              </div>

              <div>
                <Label htmlFor="abstract">Résumé</Label>
                <Textarea
                  id="abstract"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Résumé de l'article"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="journal">Revue / Journal / Éditeur</Label>
                  <Input
                    id="journal"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="Nature, Science, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="annee">Année de parution</Label>
                  <Input
                    id="annee"
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
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="10.1000/xyz123"
                  />
                </div>
                <div>
                  <Label htmlFor="statut">Statut de la revue</Label>
                  <Input
                    id="statut"
                    value={statutRevue}
                    onChange={(e) => setStatutRevue(e.target.value)}
                    placeholder="Indexée, Peer-reviewed..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="source">Source de vérification</Label>
                <Input
                  id="source"
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
                    Ajouter un auteur
                  </Button>
                </div>
                <div className="space-y-3">
                  {authorsWithAffiliations.map((author, index) => (
                    <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Auteur {index + 1} {index === 0 && isPrincipalAuthor && '(Vous - Principal)'}
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
                          placeholder="Affiliation (université, laboratoire...)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enregistrer la référence
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

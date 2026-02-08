export type AppRole = 'admin' | 'user';

export type DocumentType = 
  | 'article_scientifique'
  | 'chapitre_livre'
  | 'ouvrage_scientifique'
  | 'technologie'
  | 'innovation';

export type DomaineTechnique = 'ST' | 'SDS' | 'LSH' | 'SEG' | 'SJP';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  institution: string | null;
  ufr_institut: string | null;
  departement: string | null;
  equipe_recherche: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorWithAffiliation {
  name: string;
  affiliation: string;
}

export interface Reference {
  id: string;
  user_id: string;
  title: string;
  abstract: string | null;
  journal: string | null;
  doi: string | null;
  authors: string[] | null;
  affiliations: string[] | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  document_type: DocumentType | null;
  annee_parution: number | null;
  domaine_technique: DomaineTechnique | null;
  statut_revue: string | null;
  source_verification: string | null;
  is_principal_author: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

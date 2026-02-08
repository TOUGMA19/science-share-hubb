import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';
import { Reference, Profile } from '@/lib/supabase-types';

const documentTypeLabels: Record<string, string> = {
  article_scientifique: 'Article Scientifique',
  chapitre_livre: 'Chapitre de livre',
  ouvrage_scientifique: 'Ouvrage Scientifique',
  technologie: 'Technologie',
  innovation: 'Innovation',
};

const domaineLabels: Record<string, string> = {
  ST: 'Sciences et Technologies',
  SDS: 'Sciences de la Santé',
  LSH: 'Lettres et Sciences Humaines',
  SEG: 'Sciences Économiques et de Gestion',
  SJP: 'Sciences Juridiques et Politiques',
};

interface ExportData {
  references: Reference[];
  profiles?: Map<string, Profile>;
  userProfile?: Profile | null;
  isAdmin?: boolean;
}

function createHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: { size: width, type: WidthType.DXA },
    shading: { fill: 'E8E8E8' },
  });
}

function createDataCell(text: string, width: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 18,
          }),
        ],
      }),
    ],
    width: { size: width, type: WidthType.DXA },
  });
}

function formatAuthorsWithAffiliations(authors: string[] | null, affiliations: string[] | null): string[] {
  if (!authors || authors.length === 0) return ['Non spécifié'];
  
  return authors.map((author, index) => {
    const affiliation = affiliations?.[index];
    if (affiliation) {
      return `${author} (${affiliation})`;
    }
    return author;
  });
}

function createAuthorsCell(authors: string[] | null, affiliations: string[] | null, width: number): TableCell {
  const authorLines = formatAuthorsWithAffiliations(authors, affiliations);
  return new TableCell({
    children: authorLines.map(line => 
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 18,
          }),
        ],
      })
    ),
    width: { size: width, type: WidthType.DXA },
  });
}

function createAuthorsParagraphs(authors: string[] | null, affiliations: string[] | null, fontSize: number = 22): Paragraph[] {
  const authorLines = formatAuthorsWithAffiliations(authors, affiliations);
  
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'Auteurs et affiliations:', bold: true, size: fontSize }),
      ],
      spacing: { after: 50 },
    }),
  ];
  
  authorLines.forEach(line => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `  • ${line}`, size: fontSize }),
        ],
        spacing: { after: 30 },
      })
    );
  });
  
  return paragraphs;
}

// Group references by user
function groupReferencesByUser(
  references: Reference[],
  profiles: Map<string, Profile>
): Map<string, { profile: Profile | undefined; refs: Reference[] }> {
  const grouped = new Map<string, { profile: Profile | undefined; refs: Reference[] }>();
  
  references.forEach(ref => {
    const existing = grouped.get(ref.user_id);
    if (existing) {
      existing.refs.push(ref);
    } else {
      grouped.set(ref.user_id, {
        profile: profiles.get(ref.user_id),
        refs: [ref]
      });
    }
  });
  
  return grouped;
}

export async function exportToDocx({ references, profiles, userProfile, isAdmin }: ExportData) {
  const children: (Paragraph | Table)[] = [];
  
  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Université Lédéa Bernard OUEDRAOGO',
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Rapport des Publications Scientifiques`,
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Date d'export: ${new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`,
          italics: true,
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // User info section if not admin
  if (!isAdmin && userProfile) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Chercheur: ${userProfile.full_name || 'Non spécifié'}`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `UFR/Institut: ${userProfile.ufr_institut || 'Non spécifié'}`,
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Département: ${userProfile.departement || 'Non spécifié'}`,
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Équipe de recherche: ${userProfile.equipe_recherche || 'Non spécifié'}`,
            size: 22,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Summary section
  children.push(
    new Paragraph({
      text: 'Résumé',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Nombre total de publications: ${references.length}`,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  if (isAdmin && profiles) {
    // Admin export: grouped by user
    const groupedByUser = groupReferencesByUser(references, profiles);
    
    // Sort users alphabetically by name
    const sortedUsers = Array.from(groupedByUser.entries()).sort((a, b) => {
      const nameA = a[1].profile?.full_name || 'ZZZ';
      const nameB = b[1].profile?.full_name || 'ZZZ';
      return nameA.localeCompare(nameB);
    });

    let globalIndex = 0;
    
    for (const [userId, { profile, refs }] of sortedUsers) {
      // User section header
      children.push(
        new Paragraph({
          text: profile?.full_name || 'Contributeur inconnu',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      
      if (profile) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'UFR/Institut: ', bold: true, size: 20 }),
              new TextRun({ text: profile.ufr_institut || 'Non spécifié', size: 20 }),
              new TextRun({ text: '  |  Département: ', bold: true, size: 20 }),
              new TextRun({ text: profile.departement || 'Non spécifié', size: 20 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Équipe de recherche: ', bold: true, size: 20 }),
              new TextRun({ text: profile.equipe_recherche || 'Non spécifié', size: 20 }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      // Table for this user's references
      const tableHeader = new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('N°', 500),
          createHeaderCell('Titre', 3000),
          createHeaderCell('Type', 1200),
          createHeaderCell('Domaine', 900),
          createHeaderCell('Année', 700),
          createHeaderCell('Auteur Principal', 1000),
          createHeaderCell('Revue/Éditeur', 1500),
        ],
      });

      const tableRows = refs.map((ref) => {
        globalIndex++;
        return new TableRow({
          children: [
            createDataCell(globalIndex.toString(), 500),
            createDataCell(ref.title, 3000),
            createDataCell(
              ref.document_type ? documentTypeLabels[ref.document_type] : 'Article',
              1200
            ),
            createDataCell(ref.domaine_technique || '-', 900),
            createDataCell(ref.annee_parution?.toString() || '-', 700),
            createDataCell(ref.is_principal_author ? 'Oui' : 'Non', 1000),
            createDataCell(ref.journal || '-', 1500),
          ],
        });
      });

      children.push(
        new Table({
          rows: [tableHeader, ...tableRows],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        })
      );

      // Detailed references for this user
      children.push(
        new Paragraph({
          text: `Détail des publications de ${profile?.full_name || 'ce contributeur'}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      refs.forEach((ref, idx) => {
        children.push(
          new Paragraph({
            text: `${idx + 1}. ${ref.title}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Type: ', bold: true, size: 20 }),
              new TextRun({
                text: ref.document_type ? documentTypeLabels[ref.document_type] : 'Article Scientifique',
                size: 20,
              }),
              new TextRun({ text: '  |  Auteur principal: ', bold: true, size: 20 }),
              new TextRun({
                text: ref.is_principal_author ? 'Oui' : 'Non',
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Domaine: ', bold: true, size: 20 }),
              new TextRun({
                text: ref.domaine_technique ? domaineLabels[ref.domaine_technique] : 'Non spécifié',
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          }),
          ...createAuthorsParagraphs(ref.authors, ref.affiliations, 20),
          new Paragraph({
            children: [
              new TextRun({ text: 'Revue/Éditeur: ', bold: true, size: 20 }),
              new TextRun({ text: ref.journal || 'Non spécifié', size: 20 }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Année: ', bold: true, size: 20 }),
              new TextRun({ text: ref.annee_parution?.toString() || 'Non spécifié', size: 20 }),
            ],
            spacing: { after: 50 },
          })
        );

        if (ref.abstract) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Résumé: ', bold: true, size: 20 }),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: ref.abstract,
                  size: 18,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }

        if (ref.doi) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'DOI: ', bold: true, size: 20 }),
                new TextRun({ text: `https://doi.org/${ref.doi}`, size: 20 }),
              ],
              spacing: { after: 150 },
            })
          );
        }
      });
    }
  } else {
    // User export: simple table
    const tableHeader = new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('N°', 600),
        createHeaderCell('Titre', 3000),
        createHeaderCell('Type', 1500),
        createHeaderCell('Domaine', 1200),
        createHeaderCell('Année', 800),
        createHeaderCell('Auteur Principal', 1000),
        createHeaderCell('Revue/Éditeur', 1800),
      ],
    });

    const tableRows = references.map((ref, index) => {
      return new TableRow({
        children: [
          createDataCell((index + 1).toString(), 600),
          createDataCell(ref.title, 3000),
          createDataCell(
            ref.document_type ? documentTypeLabels[ref.document_type] : 'Article',
            1500
          ),
          createDataCell(ref.domaine_technique || '-', 1200),
          createDataCell(ref.annee_parution?.toString() || '-', 800),
          createDataCell(ref.is_principal_author ? 'Oui' : 'Non', 1000),
          createDataCell(ref.journal || '-', 1800),
        ],
      });
    });

    children.push(
      new Table({
        rows: [tableHeader, ...tableRows],
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
      })
    );

    // Detailed references section
    children.push(
      new Paragraph({
        text: 'Détail des Publications',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    references.forEach((ref, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${ref.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Type: ', bold: true, size: 22 }),
            new TextRun({
              text: ref.document_type ? documentTypeLabels[ref.document_type] : 'Article Scientifique',
              size: 22,
            }),
            new TextRun({ text: '  |  Auteur principal: ', bold: true, size: 22 }),
            new TextRun({
              text: ref.is_principal_author ? 'Oui' : 'Non',
              size: 22,
            }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Domaine: ', bold: true, size: 22 }),
            new TextRun({
              text: ref.domaine_technique ? domaineLabels[ref.domaine_technique] : 'Non spécifié',
              size: 22,
            }),
          ],
          spacing: { after: 50 },
        }),
        ...createAuthorsParagraphs(ref.authors, ref.affiliations, 22),
        new Paragraph({
          children: [
            new TextRun({ text: 'Revue/Éditeur: ', bold: true, size: 22 }),
            new TextRun({ text: ref.journal || 'Non spécifié', size: 22 }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Année: ', bold: true, size: 22 }),
            new TextRun({ text: ref.annee_parution?.toString() || 'Non spécifié', size: 22 }),
          ],
          spacing: { after: 50 },
        })
      );

      if (ref.abstract) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Résumé: ', bold: true, size: 22 }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: ref.abstract,
                size: 20,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      if (ref.doi) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'DOI: ', bold: true, size: 22 }),
              new TextRun({ text: `https://doi.org/${ref.doi}`, size: 22 }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = isAdmin 
    ? `rapport-publications-${new Date().toISOString().split('T')[0]}.docx`
    : `mes-publications-${new Date().toISOString().split('T')[0]}.docx`;
  
  saveAs(blob, filename);
}

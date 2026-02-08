import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase-types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Loader2,
  Mail,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRole extends Profile {
  email?: string;
  isAdmin?: boolean;
  referenceCount?: number;
}

interface UserManagementProps {
  profiles: Map<string, Profile>;
  onUserDeleted: (userId: string) => void;
  onUserAdded: () => void;
  referenceCounts: Map<string, number>;
}

export function UserManagement({ 
  profiles, 
  onUserDeleted, 
  onUserAdded,
  referenceCounts 
}: UserManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [adminRoles, setAdminRoles] = useState<Set<string>>(new Set());

  // Fetch admin roles on component mount
  useState(() => {
    const fetchAdminRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (data) {
        setAdminRoles(new Set(data.map(r => r.user_id)));
      }
    };
    fetchAdminRoles();
  });

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      // Create user via edge function that uses admin API
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserFullName,
        },
      });

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setIsAddDialogOpen(false);
      onUserAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string | null) => {
    setIsLoading(true);
    try {
      // Delete user via edge function that uses admin API
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });

      if (error) throw error;

      toast.success(`Utilisateur ${fullName || 'inconnu'} supprimé`);
      onUserDeleted(userId);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const profilesArray = Array.from(profiles.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
            <p className="text-sm text-muted-foreground">
              {profilesArray.length} utilisateur(s) enregistré(s)
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
              <DialogDescription>
                Créez un nouveau compte utilisateur. L'utilisateur recevra ses identifiants par email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@ulbo.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddUser} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className="card-elevated overflow-hidden rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Affiliation</TableHead>
              <TableHead>Publications</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profilesArray.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              profilesArray.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {profile.full_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{profile.full_name || 'Inconnu'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {profile.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.departement || profile.ufr_institut || 'Non renseigné'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {referenceCounts.get(profile.user_id) || 0} publication(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {adminRoles.has(profile.user_id) ? (
                      <Badge className="bg-primary">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Utilisateur</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!adminRoles.has(profile.user_id) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'utilisateur "{profile.full_name || 'Inconnu'}" 
                              et toutes ses {referenceCounts.get(profile.user_id) || 0} publication(s) seront 
                              définitivement supprimés.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteUser(profile.user_id, profile.full_name)}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

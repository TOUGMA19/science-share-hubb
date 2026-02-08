import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  institution: z.string().optional(),
  ufr_institut: z.string().optional(),
  departement: z.string().optional(),
  equipe_recherche: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
  onUpdate?: () => void;
}

export function ProfileEditDialog({ onUpdate }: ProfileEditDialogProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      institution: profile?.institution || '',
      ufr_institut: profile?.ufr_institut || '',
      departement: profile?.departement || '',
      equipe_recherche: profile?.equipe_recherche || '',
      bio: profile?.bio || '',
    },
  });

  // Reset form values when profile changes or dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && profile) {
      form.reset({
        full_name: profile.full_name || '',
        institution: profile.institution || '',
        ufr_institut: profile.ufr_institut || '',
        departement: profile.departement || '',
        equipe_recherche: profile.equipe_recherche || '',
        bio: profile.bio || '',
      });
      setAvatarUrl(profile.avatar_url || null);
    }
    setOpen(isOpen);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          institution: data.institution || null,
          ufr_institut: data.ufr_institut || null,
          departement: data.departement || null,
          equipe_recherche: data.equipe_recherche || null,
          bio: data.bio || null,
          avatar_url: avatarUrl,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour avec succès');
      setOpen(false);
      onUpdate?.();
      
      // Refresh the page to update the profile in the auth context
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Modifier le profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Modifier le profil</DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations professionnelles
          </DialogDescription>
        </DialogHeader>

        {/* Avatar Upload */}
        {user && (
          <div className="flex justify-center py-4">
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              fullName={profile?.full_name || null}
              onAvatarChange={setAvatarUrl}
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom et Nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Université Lédéa Bernard OUEDRAOGO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ufr_institut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UFR / Institut</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: UFR Sciences et Technologies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Département Informatique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipe_recherche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipe de recherche</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Laboratoire d'Intelligence Artificielle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biographie</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez brièvement vos domaines de recherche..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}

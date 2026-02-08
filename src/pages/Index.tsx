import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, Globe, Users, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import ulboLogo from '@/assets/ulbo-logo.png';
import ulboBuilding from '@/assets/ulbo-building.png';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Import intelligent',
      description: 'Déposez vos PDF et laissez notre IA extraire automatiquement les métadonnées.',
    },
    {
      icon: Globe,
      title: 'Partage public',
      description: 'Rendez vos références accessibles à la communauté scientifique mondiale.',
    },
    {
      icon: Users,
      title: 'Profils chercheurs',
      description: 'Créez votre profil académique et présentez vos contributions.',
    },
    {
      icon: Shield,
      title: 'Gestion sécurisée',
      description: 'Vos données sont protégées et vous gardez le contrôle total.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ulboBuilding})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            
            <h1 className="animate-slide-up font-serif text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Gérez vos références scientifiques
            </h1>
            
            <p className="animate-slide-up delay-100 mt-6 text-lg text-white/80 md:text-xl">
              Importez vos articles PDF, extrayez automatiquement les métadonnées et partagez vos travaux avec la communauté académique.
            </p>
            
            <div className="animate-slide-up delay-200 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-w-[200px]"
                  onClick={() => navigate('/dashboard')}
                >
                  Accéder au dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="min-w-[200px]"
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    Créer un compte
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="min-w-[200px] border border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigate('/references')}
                  >
                    Explorer les références
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">
              Une plateforme complète pour vos recherches
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simplifiez la gestion de vos références bibliographiques avec des outils modernes et intelligents.
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-slide-up card-elevated rounded-xl p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <img src={ulboLogo} alt="ULBO Logo" className="mx-auto h-12 w-12 object-contain" />
            <h2 className="mt-6 font-serif text-3xl font-bold">
              Prêt à organiser vos références ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Rejoignez notre communauté de chercheurs et commencez à partager vos travaux dès aujourd'hui.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to={user ? '/dashboard' : '/auth?mode=signup'}>
                  {user ? 'Aller au dashboard' : 'Commencer gratuitement'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ChefHat, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-primary-foreground">
          <div className="flex justify-center mb-6">
            <ChefHat className="h-16 w-16 text-accent" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            ChefComanda
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-primary-foreground/90">
            Sistema Profissional de Gerenciamento
          </p>
          
          <p className="text-lg md:text-xl mb-8 text-primary-foreground/80 max-w-3xl mx-auto">
            Para restaurantes, bares e lanchonetes. Controle completo de comandas, 
            estoque, vendas e relatórios em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="hero" asChild className="text-lg px-8 py-6">
              <Link to="/registro">
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link to="/login">
                Já Tenho Conta
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-6">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">500+</h3>
              <p className="text-white/80">Restaurantes ativos</p>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 p-6">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">98%</h3>
              <p className="text-white/80">Satisfação dos clientes</p>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 p-6">
              <div className="flex items-center justify-center mb-4">
                <ChefHat className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">24/7</h3>
              <p className="text-white/80">Suporte especializado</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
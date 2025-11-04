import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPresupuestos: 0,
    valorTotal: 0,
    tasaAprobacion: 0,
    pendientes: 0,
    aprobadosSemana: 0,
    porVencer: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all quotes
      const { data: presupuestos } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("usuario_id", user.id);

      if (presupuestos) {
        const total = presupuestos.length;
        const aprobados = presupuestos.filter(p => p.estado === "aprobado").length;
        const pendientes = presupuestos.filter(p => p.estado === "pendiente").length;
        const valorTotal = presupuestos.reduce((sum, p) => sum + Number(p.total), 0);
        
        // Approved this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const aprobadosSemana = presupuestos.filter(
          p => p.estado === "aprobado" && new Date(p.updated_at) >= weekAgo
        ).length;

        // About to expire (within 3 days)
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const porVencer = presupuestos.filter(
          p => p.estado === "pendiente" && 
          new Date(p.fecha_vencimiento) <= threeDaysFromNow &&
          new Date(p.fecha_vencimiento) >= new Date()
        ).length;

        setStats({
          totalPresupuestos: total,
          valorTotal,
          tasaAprobacion: total > 0 ? Math.round((aprobados / total) * 100) : 0,
          pendientes,
          aprobadosSemana,
          porVencer,
        });

        // Generate chart data for last 6 months
        const monthlyData = generateMonthlyData(presupuestos);
        setChartData(monthlyData);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (presupuestos: any[]) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const monthYear = `${monthName} ${date.getFullYear()}`;
      
      const monthPresupuestos = presupuestos.filter(p => {
        const pDate = new Date(p.fecha);
        return pDate.getMonth() === date.getMonth() && 
               pDate.getFullYear() === date.getFullYear();
      });

      const total = monthPresupuestos.reduce((sum, p) => sum + Number(p.total), 0);
      
      data.push({
        mes: monthName,
        total: Math.round(total),
      });
    }

    return data;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de tus presupuestos</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/50 border-border hover-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Enviados</p>
                <p className="text-3xl font-heading font-bold">{stats.totalPresupuestos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-border hover-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-3xl font-heading font-bold">
                  ${stats.valorTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-border hover-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Aprobación</p>
                <p className="text-3xl font-heading font-bold">{stats.tasaAprobacion}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/50 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                <p className="text-2xl font-heading font-bold">{stats.pendientes}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aprobados esta semana</p>
                <p className="text-2xl font-heading font-bold">{stats.aprobadosSemana}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-accent"></div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Por vencer (3 días)</p>
                <p className="text-2xl font-heading font-bold">{stats.porVencer}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-6 bg-card/50 border-border">
          <h2 className="text-2xl font-heading font-bold mb-6">Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="mes" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar dataKey="total" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5C5C" />
                  <stop offset="50%" stopColor="#FF8042" />
                  <stop offset="100%" stopColor="#FFC24D" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

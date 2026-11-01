import Tareas from "./Tareas";

/**
 * Tablero Principal Unificado (Nexabis OS):
 * Reemplaza el tablero antiguo con el ecosistema completo de Operaciones,
 * Estrategia de Clientes, Mi Día (🏢 Nexabis, 💼 Trabajo Normal, ☀️ Diarias)
 * y KPIs Comerciales/Financieros en tiempo real.
 */
const Dashboard = () => {
  return <Tareas initialView="kanban" showExecutiveHeader={true} />;
};

export default Dashboard;

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Eye, Trash2, ArchiveRestore, GripVertical } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

interface KanbanBoardProps {
    presupuestos: any[];
    onStatusChange: (id: string, newStatus: string) => void;
    onCopyLink: (token: string) => void;
    onDuplicate: (p: any) => void;
    onConvertToProject: (p: any) => void;
    onDelete: (id: string) => void;
}

const COLUMNS = [
    { id: "pendiente", title: "Pendiente", color: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
    { id: "aprobado", title: "Aprobado", color: "bg-green-500/10 border-green-500/20 text-green-500" },
    { id: "rechazado", title: "Rechazado", color: "bg-red-500/10 border-red-500/20 text-red-500" },
    { id: "vencido", title: "Vencido", color: "bg-orange-500/10 border-orange-500/20 text-orange-500" }
];

export function KanbanBoard({
    presupuestos,
    onStatusChange,
    onCopyLink,
    onDuplicate,
    onConvertToProject,
    onDelete
}: KanbanBoardProps) {

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        onStatusChange(draggableId, destination.droppableId);
    };

    const getDayDifference = (date1: Date, date2: Date) => {
        const diffTime = date2.getTime() - date1.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px]">
                {COLUMNS.map((column) => {
                    const columnItems = presupuestos.filter(p => p.estado === column.id);
                    const columnTotal = columnItems.reduce((sum, p) => sum + Number(p.total), 0);

                    return (
                        <div key={column.id} className="min-w-[320px] max-w-[320px] bg-secondary/20 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center mb-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${column.color}`}>
                                    {column.title} ({columnItems.length})
                                </div>
                                <span className="text-sm font-semibold gradient-text">
                                    ${columnTotal.toLocaleString()}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 flex flex-col gap-3 min-h-[100px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-secondary/40' : ''}`}
                                    >
                                        {columnItems.map((p, index) => {
                                            const daysOld = getDayDifference(new Date(p.created_at), new Date());

                                            return (
                                                <Draggable key={p.id} draggableId={p.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`p-4 bg-card cursor-default border-primary/20 ${snapshot.isDragging ? 'shadow-lg shadow-primary/20 ring-2 ring-primary/50 opacity-90' : 'hover-glow'}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div {...provided.dragHandleProps} className="cursor-grab hover:text-primary text-muted-foreground mr-1">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 bg-background/50">
                                                                        {p.numero}
                                                                    </Badge>
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    Hace {daysOld}d
                                                                </span>
                                                            </div>

                                                            <p className="font-semibold text-sm line-clamp-2 leading-tight mb-2">
                                                                {p.titulo}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                                                                {p.clientes?.empresa || p.clientes?.nombre || "Sin cliente"}
                                                            </p>

                                                            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                                                                <span className="font-bold text-sm">
                                                                    {p.moneda === "USD" ? "$" : "$"} {Number(p.total).toLocaleString()}
                                                                </span>

                                                                <div className="flex gap-1">
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")} title="Ver web">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCopyLink(p.token)} title="Copiar link">
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(p)} title="Duplicar">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    {!p.proyecto_id && (
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500 hover:text-blue-600" onClick={() => onConvertToProject(p)} title="Convertir a Proyecto">
                                                                            <ArchiveRestore className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    )}
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)} title="Eliminar">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}

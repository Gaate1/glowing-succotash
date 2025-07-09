import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { projectApi, annotationApi, fileApi, fileToBase64 } from "../services/api";
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Undo2, 
  Redo2, 
  Square, 
  Circle, 
  Type, 
  Ruler, 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Pen,
  Loader2,
  Trash2
} from "lucide-react";

const PlanEditor = () => {
  const { projectId } = useParams();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTool, setCurrentTool] = useState("move");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#3b82f6");
  const [currentStroke, setCurrentStroke] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadAnnotations();
      if (project.plan_image) {
        loadBackgroundImage(project.plan_image);
      }
    }
  }, [project]);

  useEffect(() => {
    redrawCanvas();
  }, [annotations, backgroundImage, zoom, panOffset, currentAnnotation]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectApi.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotations = async () => {
    try {
      const annotationsData = await annotationApi.getAnnotations(projectId);
      setAnnotations(annotationsData);
      setHistory([annotationsData]);
      setHistoryIndex(0);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les annotations",
        variant: "destructive",
      });
    }
  };

  const loadBackgroundImage = (base64Data) => {
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
    };
    img.src = base64Data;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);
    
    // Draw background image if exists
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width / zoom, canvas.height / zoom);
    }
    
    // Draw saved annotations
    annotations.forEach(annotation => {
      drawAnnotation(ctx, annotation);
    });
    
    // Draw current annotation being drawn
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }
    
    ctx.restore();
  };

  const drawAnnotation = (ctx, annotation) => {
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.stroke;
    ctx.fillStyle = annotation.color;
    
    switch (annotation.type) {
      case "line":
        ctx.beginPath();
        ctx.moveTo(annotation.data.startX, annotation.data.startY);
        ctx.lineTo(annotation.data.endX, annotation.data.endY);
        ctx.stroke();
        break;
      case "rectangle":
        ctx.beginPath();
        ctx.rect(annotation.data.x, annotation.data.y, annotation.data.width, annotation.data.height);
        ctx.stroke();
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(annotation.data.x, annotation.data.y, annotation.data.radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case "text":
        ctx.font = `${annotation.data.fontSize || 16}px Arial`;
        ctx.fillText(annotation.data.text, annotation.data.x, annotation.data.y);
        break;
      case "freehand":
        if (annotation.data.points && annotation.data.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(annotation.data.points[0].x, annotation.data.points[0].y);
          annotation.data.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
        break;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const base64Data = await fileToBase64(file);
      
      // Upload to backend
      await fileApi.uploadFile({
        project_id: projectId,
        file_data: base64Data,
        file_name: file.name,
        file_type: file.type
      });

      // Load the image
      loadBackgroundImage(base64Data);
      
      // Update project state
      setProject(prev => ({ ...prev, plan_image: base64Data }));
      
      toast({
        title: "Succès",
        description: "Plan importé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'importer le plan",
        variant: "destructive",
      });
    }
  };

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - panOffset.x * zoom) / zoom,
      y: (event.clientY - rect.top - panOffset.y * zoom) / zoom
    };
  };

  const handleMouseDown = (event) => {
    const coords = getCanvasCoordinates(event);
    setIsDrawing(true);
    
    switch (currentTool) {
      case "line":
        setCurrentAnnotation({
          type: "line",
          data: {
            startX: coords.x,
            startY: coords.y,
            endX: coords.x,
            endY: coords.y
          },
          color: currentColor,
          stroke: currentStroke
        });
        break;
      case "rectangle":
        setCurrentAnnotation({
          type: "rectangle",
          data: {
            x: coords.x,
            y: coords.y,
            width: 0,
            height: 0
          },
          color: currentColor,
          stroke: currentStroke
        });
        break;
      case "circle":
        setCurrentAnnotation({
          type: "circle",
          data: {
            x: coords.x,
            y: coords.y,
            radius: 0
          },
          color: currentColor,
          stroke: currentStroke
        });
        break;
      case "freehand":
        setCurrentAnnotation({
          type: "freehand",
          data: {
            points: [coords]
          },
          color: currentColor,
          stroke: currentStroke
        });
        break;
    }
  };

  const handleMouseMove = (event) => {
    if (!isDrawing || !currentAnnotation) return;
    
    const coords = getCanvasCoordinates(event);
    
    switch (currentTool) {
      case "line":
        setCurrentAnnotation(prev => ({
          ...prev,
          data: {
            ...prev.data,
            endX: coords.x,
            endY: coords.y
          }
        }));
        break;
      case "rectangle":
        setCurrentAnnotation(prev => ({
          ...prev,
          data: {
            ...prev.data,
            width: coords.x - prev.data.x,
            height: coords.y - prev.data.y
          }
        }));
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(coords.x - currentAnnotation.data.x, 2) + 
          Math.pow(coords.y - currentAnnotation.data.y, 2)
        );
        setCurrentAnnotation(prev => ({
          ...prev,
          data: {
            ...prev.data,
            radius: radius
          }
        }));
        break;
      case "freehand":
        setCurrentAnnotation(prev => ({
          ...prev,
          data: {
            ...prev.data,
            points: [...prev.data.points, coords]
          }
        }));
        break;
    }
  };

  const handleMouseUp = () => {
    if (currentAnnotation) {
      const newAnnotations = [...annotations, currentAnnotation];
      setAnnotations(newAnnotations);
      saveToHistory(newAnnotations);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  const saveToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  };

  const saveAnnotations = async () => {
    try {
      setSaving(true);
      
      // Convert annotations to API format
      const annotationsData = annotations.map(annotation => ({
        project_id: projectId,
        type: annotation.type,
        data: annotation.data,
        color: annotation.color,
        stroke: annotation.stroke,
        notes: annotation.notes || ""
      }));
      
      await annotationApi.saveAnnotationsBatch(projectId, annotationsData);
      
      toast({
        title: "Succès",
        description: "Annotations sauvegardées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les annotations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const clearAnnotations = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir effacer toutes les annotations ?")) {
      return;
    }

    try {
      await annotationApi.deleteAllAnnotations(projectId);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
      toast({
        title: "Succès",
        description: "Toutes les annotations ont été effacées",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les annotations",
        variant: "destructive",
      });
    }
  };

  const tools = [
    { id: "move", icon: Move, label: "Déplacer" },
    { id: "freehand", icon: Pen, label: "Dessiner" },
    { id: "line", icon: Ruler, label: "Ligne" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Cercle" },
    { id: "text", icon: Type, label: "Texte" }
  ];

  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
    "#8b5cf6", "#ec4899", "#6b7280", "#000000"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Projet non trouvé
          </h2>
          <Link to="/projects">
            <Button variant="outline">Retour aux projets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <Badge className="bg-blue-100 text-blue-800">
                {project.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={undo} disabled={historyIndex <= 0} variant="outline" size="sm">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button onClick={redo} disabled={historyIndex >= history.length - 1} variant="outline" size="sm">
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button onClick={clearAnnotations} variant="outline" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={saveAnnotations} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r p-4 space-y-4">
          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Importer un plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.dwg,.dxf,.pdf"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Outils</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCurrentTool(tool.id)}
                >
                  <tool.icon className="h-4 w-4 mr-2" />
                  {tool.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Couleurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      currentColor === color ? "border-gray-400" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stroke Width */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Épaisseur</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="range"
                min="1"
                max="10"
                value={currentStroke}
                onChange={(e) => setCurrentStroke(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentStroke}px
              </div>
            </CardContent>
          </Card>

          {/* Zoom Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Zoom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom +
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))}
              >
                <ZoomOut className="h-4 w-4 mr-2" />
                Zoom -
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setZoom(1)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {/* Canvas Overlay Info */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
            <div className="text-xs text-gray-500">
              Zoom: {Math.round(zoom * 100)}% | Outil: {tools.find(t => t.id === currentTool)?.label}
            </div>
            <div className="text-xs text-gray-500">
              Annotations: {annotations.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanEditor;
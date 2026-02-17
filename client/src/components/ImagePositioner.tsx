import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePositionerProps {
  imageUrl: string;
  onPositionChange?: (position: { x: number; y: number; scale: number }) => void;
  title?: string;
}

export function ImagePositioner({
  imageUrl,
  onPositionChange,
  title = "Ajustar Posição da Imagem",
}: ImagePositionerProps) {
  const [position, setPosition] = useState({ x: 50, y: 50, scale: 100 });

  const handleMove = (axis: 'x' | 'y', direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    let newPos = { ...position };

    if (axis === 'x') {
      newPos.x += direction === 'left' ? -step : step;
      newPos.x = Math.max(0, Math.min(100, newPos.x));
    } else {
      newPos.y += direction === 'up' ? -step : step;
      newPos.y = Math.max(0, Math.min(100, newPos.y));
    }

    setPosition(newPos);
    onPositionChange?.(newPos);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const step = 10;
    let newScale = direction === 'in' ? position.scale + step : position.scale - step;
    newScale = Math.max(80, Math.min(200, newScale));

    const newPos = { ...position, scale: newScale };
    setPosition(newPos);
    onPositionChange?.(newPos);
  };

  const objectPosition = `${position.x}% ${position.y}%`;

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">{title}</div>

      {/* Preview */}
      <div className="relative w-full h-64 border-2 border-border rounded-lg overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt="Position preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition,
            transform: `scale(${position.scale / 100})`,
          }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Position Controls */}
      <div className="space-y-3">
        {/* Vertical Controls */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMove('y', 'up')}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Horizontal Controls */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMove('x', 'left')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-muted rounded text-sm font-mono text-center min-w-32">
            {position.x}%, {position.y}%
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMove('x', 'right')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Vertical Down */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMove('y', 'down')}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleZoom('out')}
          className="gap-2"
        >
          <ZoomOut className="h-4 w-4" />
          Afastar
        </Button>
        <div className="px-4 py-2 bg-muted rounded text-sm font-mono">
          {position.scale}%
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleZoom('in')}
          className="gap-2"
        >
          <ZoomIn className="h-4 w-4" />
          Aproximar
        </Button>
      </div>

      {/* Preset Positions */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[
          { label: '⬉ Canto', x: 25, y: 25 },
          { label: '⬆ Topo', x: 50, y: 25 },
          { label: '⬈ Canto', x: 75, y: 25 },
          { label: '⬅ Esq', x: 25, y: 50 },
          { label: '⭕ Centro', x: 50, y: 50 },
          { label: '➡ Dir', x: 75, y: 50 },
          { label: '⬋ Canto', x: 25, y: 75 },
          { label: '⬇ Base', x: 50, y: 75 },
          { label: '⬊ Canto', x: 75, y: 75 },
        ].map((preset) => (
          <Button
            key={preset.label}
            size="sm"
            variant="outline"
            onClick={() => {
              const newPos = { ...position, x: preset.x, y: preset.y };
              setPosition(newPos);
              onPositionChange?.(newPos);
            }}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Use os botões ou presets para ajustar a posição da imagem no hero
      </p>
    </div>
  );
}

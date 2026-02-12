import { ChevronDown } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  activeType: string;
  onTypeChange: (val: string) => void;
  activeSort: string;
  onSortChange: (val: string) => void;
}

export function FilterBar({ activeType, onTypeChange, activeSort, onSortChange }: FilterBarProps) {
  const types: FilterOption[] = [
    { label: "All Jewelry", value: "" },
    { label: "Rings", value: "Ring" },
    { label: "Necklaces", value: "Necklace" },
    { label: "Earrings", value: "Earring" },
  ];

  return (
    <div className="sticky top-16 z-40 w-full bg-background/95 backdrop-blur border-b border-border/40 py-4 mb-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Categories / Types */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {types.map((type) => (
            <button
              key={type.value || 'all'}
              onClick={() => onTypeChange(type.value)}
              className={`
                text-sm uppercase tracking-wider whitespace-nowrap transition-colors
                ${activeType === type.value 
                  ? "font-semibold text-foreground border-b border-foreground" 
                  : "text-muted-foreground hover:text-foreground"}
              `}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center gap-4 text-sm">
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Filter <ChevronDown className="h-3 w-3" />
            </button>
            {/* Simple dropdown mockup */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border p-2 hidden group-hover:block shadow-lg z-50">
              <div className="text-xs uppercase text-muted-foreground p-2 font-semibold">By Metal</div>
              <div className="px-2 py-1 hover:bg-secondary cursor-pointer">14k Gold</div>
              <div className="px-2 py-1 hover:bg-secondary cursor-pointer">Sterling Silver</div>
            </div>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden sm:inline">Sort by:</span>
            <select 
              value={activeSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium cursor-pointer pr-8"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

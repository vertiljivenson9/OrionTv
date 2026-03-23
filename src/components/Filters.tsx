"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";

interface FiltersProps {
  search: string;
  setSearch: (search: string) => void;
  country: string | null;
  setCountry: (country: string | null) => void;
  category: string | null;
  setCategory: (category: string | null) => void;
  countries: string[];
  categories: string[];
}

export default function Filters({
  search,
  setSearch,
  country,
  setCountry,
  category,
  setCategory,
  countries,
  categories,
}: FiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  const clearFilters = () => {
    setLocalSearch("");
    setSearch("");
    setCountry(null);
    setCategory(null);
  };

  const hasActiveFilters = search || country || category;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar canales por nombre..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-surface border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => {
                setLocalSearch("");
                setSearch("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Country Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={country || "__all__"}
            onValueChange={(value) => setCountry(value === "__all__" ? null : value)}
          >
            <SelectTrigger className="bg-surface border-border text-foreground">
              <SelectValue placeholder="Todos los países" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border max-h-60">
              <SelectItem value="__all__" className="text-foreground">
                Todos los países
              </SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c} className="text-foreground">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={category || "__all__"}
            onValueChange={(value) => setCategory(value === "__all__" ? null : value)}
          >
            <SelectTrigger className="bg-surface border-border text-foreground">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border max-h-60">
              <SelectItem value="__all__" className="text-foreground">
                Todas las categorías
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="text-foreground">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filtros activos:
          </span>
          {search && (
            <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
              Búsqueda: {search}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  setLocalSearch("");
                  setSearch("");
                }}
              />
            </Badge>
          )}
          {country && (
            <Badge variant="secondary" className="bg-secondary/20 text-secondary hover:bg-secondary/30">
              País: {country}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => setCountry(null)}
              />
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="bg-secondary/20 text-secondary hover:bg-secondary/30">
              Categoría: {category}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => setCategory(null)}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-6 px-2"
            onClick={clearFilters}
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}

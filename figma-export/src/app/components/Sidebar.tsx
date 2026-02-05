import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  postsByYear: Record<string, Record<string, number>>;
  selectedFilter: { year: string; month: string } | null;
  onFilterChange: (year: string, month: string) => void;
  onClearFilter: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function Sidebar({ postsByYear, selectedFilter, onFilterChange, onClearFilter }: SidebarProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    new Set(Object.keys(postsByYear))
  );

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <aside className="w-64 border-r pr-8 sticky top-0 h-screen overflow-y-auto">
      <div className="pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Arquivo</h2>
          {selectedFilter && (
            <button
              onClick={onClearFilter}
              className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              Limpar
            </button>
          )}
        </div>

        <nav>
          {years.map((year) => {
            const isExpanded = expandedYears.has(year);
            const months = Object.keys(postsByYear[year]).sort((a, b) => Number(b) - Number(a));

            return (
              <div key={year} className="mb-2">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex items-center gap-2 w-full py-1 hover:opacity-70 transition-opacity"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-medium">{year}</span>
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-1">
                    {months.map((monthNum) => {
                      const count = postsByYear[year][monthNum];
                      const isSelected = 
                        selectedFilter?.year === year && 
                        selectedFilter?.month === monthNum;

                      return (
                        <button
                          key={monthNum}
                          onClick={() => onFilterChange(year, monthNum)}
                          className={`block w-full text-left py-1 text-sm transition-opacity ${
                            isSelected 
                              ? 'opacity-100 font-medium' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {MONTHS[Number(monthNum) - 1]} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Play, AlertCircle, Database, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
}

interface QueryError {
  error: string;
  detail?: string;
}

type DbTable = { schema: string; name: string };
type DbColumn = { name: string; type: string };

/**
 * Admin SQL Analytics Page
 * Allows admin users to run SQL queries against the backend database
 */
export default function AdminAnalytics() {
  const [sql, setSql] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<QueryError | null>(null);
  
  // Table browser state
  const [tables, setTables] = useState<DbTable[]>([]);
  const [selected, setSelected] = useState<DbTable | null>(null);
  const [columns, setColumns] = useState<DbColumn[]>([]);
  const [previewLimit, setPreviewLimit] = useState(50);
  const [previewOffset, setPreviewOffset] = useState(0);
  
  // Sort and filter state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const getBaseURL = useCallback(() => {
    const isCapacitor = typeof window !== 'undefined' && (
      window.location.protocol === 'capacitor:' ||
      window.location.origin === 'capacitor://localhost' ||
      window.location.href.startsWith('capacitor://')
    );
    
    if (isCapacitor) {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        console.warn("[AdminAnalytics] VITE_API_URL not set in Capacitor");
        return "http://localhost:8000";
      }
      return apiUrl;
    }
    
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_API_URL || window.location.origin;
    }
    return "http://localhost:8000";
  }, []);

  const apiFetch = useCallback(async (path: string, init?: RequestInit) => {
    const baseURL = getBaseURL();
    const res = await fetch(`${baseURL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      const msg = typeof data.detail === 'string' ? data.detail : `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return res.json();
  }, [getBaseURL]);

  const loadTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/sql/tables') as DbTable[];
      setTables(data);
    } catch (e) {
      setError({ 
        error: 'Failed to load tables', 
        detail: e instanceof Error ? e.message : String(e) 
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  const selectTable = useCallback(async (t: DbTable) => {
    setSelected(t);
    setPreviewOffset(0);
    setIsLoading(true);
    setError(null);
    setSortColumn(null);
    setSortDirection('asc');
    setColumnFilters({});
    try {
      const cols = await apiFetch(
        `/admin/sql/tables/${encodeURIComponent(t.schema)}/${encodeURIComponent(t.name)}/columns`
      ) as DbColumn[];
      setColumns(cols);

      const preview = await apiFetch('/admin/sql/table-preview', {
        method: 'POST',
        body: JSON.stringify({ 
          schema: t.schema, 
          table: t.name, 
          limit: previewLimit, 
          offset: 0 
        }),
      }) as QueryResult;
      setResult(preview);
    } catch (e) {
      setError({ 
        error: 'Failed to load table', 
        detail: e instanceof Error ? e.message : String(e) 
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, previewLimit]);

  const nextPage = useCallback(async () => {
    if (!selected) return;
    const next = previewOffset + previewLimit;
    setPreviewOffset(next);
    setIsLoading(true);
    try {
      const preview = await apiFetch('/admin/sql/table-preview', {
        method: 'POST',
        body: JSON.stringify({ 
          schema: selected.schema, 
          table: selected.name, 
          limit: previewLimit, 
          offset: next 
        }),
      }) as QueryResult;
      setResult(preview);
    } catch (e) {
      setError({ 
        error: 'Failed to load next page', 
        detail: e instanceof Error ? e.message : String(e) 
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, selected, previewLimit, previewOffset]);

  const prevPage = useCallback(async () => {
    if (!selected) return;
    const prev = Math.max(0, previewOffset - previewLimit);
    setPreviewOffset(prev);
    setIsLoading(true);
    try {
      const preview = await apiFetch('/admin/sql/table-preview', {
        method: 'POST',
        body: JSON.stringify({ 
          schema: selected.schema, 
          table: selected.name, 
          limit: previewLimit, 
          offset: prev 
        }),
      }) as QueryResult;
      setResult(preview);
    } catch (e) {
      setError({ 
        error: 'Failed to load previous page', 
        detail: e instanceof Error ? e.message : String(e) 
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, selected, previewLimit, previewOffset]);

  const runQuery = useCallback(async () => {
    if (!sql.trim()) {
      setError({ error: 'Please enter a SQL query' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSortColumn(null);
    setSortDirection('asc');
    setColumnFilters({});

    try {
      const baseURL = getBaseURL();
      const endpoint = `${baseURL}/admin/sql/query`;
      
      console.log('[AdminAnalytics] Executing SQL query:', {
        endpoint,
        baseURL,
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sql: sql.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetail: string | undefined = typeof errorData.detail === 'string' ? errorData.detail : undefined;
        
        console.error('[AdminAnalytics] Query failed:', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorData,
        });
        
        if (response.status === 404) {
          errorMessage = 'Endpoint not found';
          errorDetail = `The endpoint /api/admin/sql/query is not available on the backend server (${baseURL}). Please ensure the backend API has this endpoint implemented.`;
        } else if (response.status === 403) {
          errorMessage = 'Access denied';
          errorDetail = 'You do not have permission to execute SQL queries. Admin access is required.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication required';
          errorDetail = 'Please log in to access this feature.';
        }
        
        setError({
          error: errorMessage,
          detail: errorDetail,
        });
        return;
      }

      const data = await response.json() as QueryResult;
      setResult(data);
    } catch (err) {
      setError({
        error: 'Failed to execute query',
        detail: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sql, getBaseURL]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to run query
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  }, [runQuery]);

  const formatCellValue = (value: string | number | boolean | null): string => {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Filter and sort the result rows
  const filteredAndSortedRows = useMemo(() => {
    if (!result || !result.rows || result.rows.length === 0) {
      return [];
    }

    let filtered = result.rows;

    // Apply column filters
    const activeFilters = Object.entries(columnFilters).filter(([_, value]) => value.trim() !== '');
    if (activeFilters.length > 0) {
      filtered = filtered.filter((row) => {
        return activeFilters.every(([columnName, filterValue]) => {
          const columnIndex = result.columns.indexOf(columnName);
          if (columnIndex === -1) return true;
          
          const cellValue = formatCellValue(row[columnIndex]);
          return cellValue.toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortColumn) {
      const columnIndex = result.columns.indexOf(sortColumn);
      if (columnIndex !== -1) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = a[columnIndex];
          const bValue = b[columnIndex];
          
          // Handle null values
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;
          
          // Compare values
          let comparison = 0;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            const aStr = formatCellValue(aValue);
            const bStr = formatCellValue(bValue);
            comparison = aStr.localeCompare(bStr);
          }
          
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return filtered;
  }, [result, columnFilters, sortColumn, sortDirection]);

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      if (value.trim() === '') {
        delete updated[column];
      } else {
        updated[column] = value;
      }
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setColumnFilters({});
    setSortColumn(null);
    setSortDirection('asc');
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Admin Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Run SQL queries against the database
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-muted-foreground border-muted-foreground/30">
            Admin · SQL Query
          </Badge>
        </div>

        {/* Two-column layout: Tables sidebar + SQL editor */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Tables Sidebar */}
          <GlassCard>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Tables</CardTitle>
              <CardDescription>Browse schema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={loadTables} 
                disabled={isLoading} 
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load tables'
                )}
              </Button>
              
              {tables.length > 0 && (
                <div className="max-h-[520px] overflow-auto border rounded-md">
                  {tables.map(t => {
                    const active = selected?.schema === t.schema && selected?.name === t.name;
                    return (
                      <button
                        key={`${t.schema}.${t.name}`}
                        onClick={() => selectTable(t)}
                        className={`w-full text-left px-3 py-2 text-sm font-mono border-b last:border-b-0 hover:bg-muted/40 transition-colors ${
                          active ? 'bg-muted' : ''
                        }`}
                      >
                        {t.schema}.{t.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {selected && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={prevPage} 
                      disabled={isLoading || previewOffset === 0}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono px-2">
                      {previewOffset}+
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={nextPage} 
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  {columns.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </GlassCard>

          {/* SQL Editor + Results */}
          <div className="space-y-6">
            {/* SQL Input */}
            <GlassCard>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              SQL Query
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SELECT * FROM users LIMIT 10;"
              className="font-mono text-sm min-h-[150px] resize-y"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press ⌘+Enter to run
              </span>
              <Button
                onClick={runQuery}
                disabled={isLoading || !sql.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.error}</AlertTitle>
            {error.detail && (
              <AlertDescription className="mt-2 font-mono text-xs">
                {error.detail}
              </AlertDescription>
            )}
          </Alert>
        )}

        {/* Results Table */}
        {result && (
          <GlassCard>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Results</CardTitle>
                <div className="flex items-center gap-2">
                  {(Object.keys(columnFilters).length > 0 || sortColumn) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Badge variant="secondary">
                    {filteredAndSortedRows.length} / {result.row_count} {result.row_count === 1 ? 'row' : 'rows'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.rows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Query executed successfully. No rows returned.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      {/* Column Headers with Sort */}
                      <TableRow>
                        {result.columns.map((column, idx) => {
                          const isSorted = sortColumn === column;
                          return (
                            <TableHead 
                              key={idx} 
                              className="font-mono text-xs whitespace-nowrap bg-muted/50"
                            >
                              <button
                                onClick={() => handleSort(column)}
                                className="flex items-center gap-1 hover:text-primary transition-colors w-full text-left"
                              >
                                {column}
                                {isSorted ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 opacity-30" />
                                )}
                              </button>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                      {/* Filter Inputs Row */}
                      <TableRow>
                        {result.columns.map((column, idx) => (
                          <TableHead key={idx} className="p-1 bg-muted/30">
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder={`Filter ${column}`}
                                value={columnFilters[column] || ''}
                                onChange={(e) => handleFilterChange(column, e.target.value)}
                                className="h-7 text-xs font-mono"
                              />
                              {columnFilters[column] && (
                                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary" />
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedRows.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={result.columns.length}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No rows match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedRows.map((row, rowIdx) => (
                          <TableRow key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                              <TableCell 
                                key={cellIdx} 
                                className={`font-mono text-xs whitespace-nowrap ${cell === null ? 'text-muted-foreground italic' : ''}`}
                              >
                                {formatCellValue(cell)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </GlassCard>
          )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

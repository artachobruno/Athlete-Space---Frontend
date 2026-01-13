import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, AlertCircle, Database } from 'lucide-react';
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

/**
 * Admin SQL Analytics Page
 * Allows admin users to run SQL queries against the backend database
 */
export default function AdminAnalytics() {
  const [sql, setSql] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<QueryError | null>(null);

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

  const runQuery = useCallback(async () => {
    if (!sql.trim()) {
      setError({ error: 'Please enter a SQL query' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

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

        {/* SQL Input */}
        <Card>
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
        </Card>

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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Results</CardTitle>
                <Badge variant="secondary">
                  {result.row_count} {result.row_count === 1 ? 'row' : 'rows'}
                </Badge>
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
                      <TableRow>
                        {result.columns.map((column, idx) => (
                          <TableHead key={idx} className="font-mono text-xs whitespace-nowrap">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, rowIdx) => (
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

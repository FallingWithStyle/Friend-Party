import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Enhanced wrapper function for requests with comprehensive logging
  const requestWrapper = async <T>(
    method: 'from' | 'rpc' | 'channel' | 'getSession' | 'getUser',
    ...args: any[]
  ): Promise<T> => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 8);

    try {
      // For query methods, we'll add our headers and enhanced logging
      if (method === 'from') {
        const [tableName, options] = args;
        const headers = {
          ...options?.headers,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        };

        console.log(`[SUPABASE REQUEST START ${requestId}]`, {
          timestamp: new Date().toISOString(),
          method: 'query',
          table: tableName,
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${tableName}`,
          headers: JSON.stringify(headers, null, 2),
          body: options?.body ? JSON.stringify(options.body, null, 2) : undefined,
          metadata: {
            clientVersion: '2.0.0',
            environment: process.env.NODE_ENV || 'development'
          }
        });

        const result = await (client as any)[method](tableName, { ...options, headers });

        const duration = Date.now() - startTime;
        console.log(`[SUPABASE REQUEST END ${requestId}]`, {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          status: result.error ? 'error' : 'success',
          data: result.error ? undefined : JSON.stringify(result.data, null, 2),
          error: result.error ? {
            message: result.error.message,
            details: result.error.details,
            hint: result.error.hint
          } : undefined,
          responseHeaders: result.error ? undefined : 'Headers not available in response'
        });

        return result as T;
      }

      // For RPC methods
      if (method === 'rpc') {
        const [funcName, params, options] = args;
        const headers = {
          ...options?.headers,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        };

        console.log(`[SUPABASE RPC START ${requestId}]`, {
          timestamp: new Date().toISOString(),
          method: 'rpc',
          function: funcName,
          params: JSON.stringify(params, null, 2),
          headers: JSON.stringify(headers, null, 2)
        });

        const result = await (client as any)[method](funcName, params, { ...options, headers });

        const duration = Date.now() - startTime;
        console.log(`[SUPABASE RPC END ${requestId}]`, {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          status: result.error ? 'error' : 'success',
          data: result.error ? undefined : JSON.stringify(result.data, null, 2),
          error: result.error ? {
            message: result.error.message,
            details: result.error.details,
            hint: result.error.hint
          } : undefined
        });

        return result as T;
      }

      // For other methods, add basic logging
      console.log(`[SUPABASE METHOD CALL ${requestId}]`, {
        timestamp: new Date().toISOString(),
        method,
        args: JSON.stringify(args, null, 2)
      });

      const result = await (client as any)[method](...args);

      const duration = Date.now() - startTime;
      console.log(`[SUPABASE METHOD COMPLETE ${requestId}]`, {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        method,
        status: 'completed'
      });

      return result as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[SUPABASE REQUEST ERROR ${requestId}]`, {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof Error && 'code' in error && { code: (error as any).code })
        } : error
      });
      throw error;
    }
  };
  };

  // Add the wrapper methods to the client
  (client as any).query = (tableName: string, options?: any) =>
    requestWrapper<any>('from', tableName, options);

  return client as unknown as SupabaseClient & {
    query: <T>(tableName: string, options?: any) => Promise<T>;
  };
}

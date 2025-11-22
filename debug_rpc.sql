-- Check if the function exists and list its arguments
SELECT 
    p.proname as function_name, 
    pg_get_function_arguments(p.oid) as arguments
FROM 
    pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE 
    n.nspname = 'public' 
    AND p.proname IN ('admin_create_simulation', 'admin_update_simulation');

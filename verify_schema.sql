-- Check if the columns exist in the information_schema
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'simulations' 
    AND column_name IN ('hint_1', 'hint_2', 'hint_3');

-- If this returns 0 rows, the columns do not exist.
-- If it returns 3 rows, the columns exist, and it is purely a cache issue.

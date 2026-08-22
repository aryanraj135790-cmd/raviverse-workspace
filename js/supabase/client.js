import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://rpssgoboxvdjtyjoyhiy.supabase.co";
const supabasePublishableKey = "sb_publishable_fycGqhUd2xWhg2WZzxpFSw_vjaBTN0G";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

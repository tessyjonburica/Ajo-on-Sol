import { createClient } from '@supabase/supabase-js'
import { calculateNextPayoutDate } from '../lib/utils/dates'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

async function updatePoolDates() {
  // Create a Supabase client with the service role key for admin privileges
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('Fetching all pools...')
  
  // Get all pools
  const { data: pools, error } = await supabase
    .from('pools')
    .select('*')
  
  if (error) {
    console.error('Error fetching pools:', error)
    process.exit(1)
  }
  
  if (!pools || pools.length === 0) {
    console.log('No pools found')
    return
  }
  
  console.log(`Found ${pools.length} pools. Updating next payout dates...`)
  
  // Process each pool
  for (const pool of pools) {
    try {
      // Get the start date and frequency
      const startDate = new Date(pool.start_date)
      const frequency = pool.frequency
      
      // Log the current date
      console.log(`Pool ${pool.id} (${pool.name}):`)
      console.log(`  - Current next_payout_date: ${new Date(pool.next_payout_date).toISOString()}`)
      console.log(`  - Start date: ${startDate.toISOString()}`)
      console.log(`  - Frequency: ${frequency}`)
      
      // Calculate the correct next payout date
      const correctNextPayoutDate = calculateNextPayoutDate(startDate, frequency, 1)
      console.log(`  - Corrected next_payout_date: ${correctNextPayoutDate.toISOString()}`)
      
      // Only update if the dates differ
      if (new Date(pool.next_payout_date).toISOString() !== correctNextPayoutDate.toISOString()) {
        // Update the pool
        const { error: updateError } = await supabase
          .from('pools')
          .update({
            next_payout_date: correctNextPayoutDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', pool.id)
        
        if (updateError) {
          console.error(`  - Error updating pool ${pool.id}:`, updateError)
        } else {
          console.log(`  - Updated successfully`)
        }
      } else {
        console.log(`  - No update needed (dates already match)`)
      }
      
      console.log('------')
    } catch (err) {
      console.error(`Error processing pool ${pool.id}:`, err)
    }
  }
  
  console.log('Update completed')
}

// Run the update function
updatePoolDates()
  .then(() => console.log('Done'))
  .catch(err => console.error('Script failed:', err)) 
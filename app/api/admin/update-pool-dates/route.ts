import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { calculateNextPayoutDate } from "@/lib/utils/dates"

export async function POST(request: NextRequest) {
  try {
    // Get the request body - we can add authentication here later
    const body = await request.json()
    const { adminKey } = body

    // In a real app, you would validate an admin key here
    // This is just a simple check, not secure for production
    if (adminKey !== "update-pools-now") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    console.log('Fetching all pools...')
    
    // Get all pools
    const { data: pools, error } = await supabase
      .from('pools')
      .select('*')
    
    if (error) {
      console.error('Error fetching pools:', error)
      return NextResponse.json({ error: "Failed to fetch pools" }, { status: 500 })
    }
    
    if (!pools || pools.length === 0) {
      return NextResponse.json({ message: "No pools found" })
    }
    
    console.log(`Found ${pools.length} pools. Updating next payout dates...`)
    
    const results = []
    
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
            results.push({
              id: pool.id,
              name: pool.name,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`  - Updated successfully`)
            results.push({
              id: pool.id,
              name: pool.name,
              success: true,
              oldDate: new Date(pool.next_payout_date).toISOString(),
              newDate: correctNextPayoutDate.toISOString()
            })
          }
        } else {
          console.log(`  - No update needed (dates already match)`)
          results.push({
            id: pool.id,
            name: pool.name,
            success: true,
            noUpdateNeeded: true
          })
        }
      } catch (err: any) {
        console.error(`Error processing pool ${pool.id}:`, err)
        results.push({
          id: pool.id,
          name: pool.name,
          success: false,
          error: err.message || String(err)
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Pool dates updated",
      pools: results
    })
  } catch (error: any) {
    console.error("Error updating pool dates:", error)
    return NextResponse.json({ 
      error: "Failed to update pool dates",
      details: error?.message || String(error) 
    }, { status: 500 })
  }
} 
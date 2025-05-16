import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { calculateNextPayoutDate } from "@/lib/utils/dates"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { adminKey, poolId } = body

    // Basic authorization
    if (adminKey !== "fix-payout-dates-now") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    console.log('Fixing member payout dates...')
    
    // Get the specific pool if poolId is provided, otherwise get all pools
    let poolsQuery = supabase.from('pools').select('*')
    if (poolId) {
      poolsQuery = poolsQuery.eq('id', poolId)
    }
    
    const { data: pools, error } = await poolsQuery
    
    if (error) {
      console.error('Error fetching pools:', error)
      return NextResponse.json({ error: "Failed to fetch pools" }, { status: 500 })
    }
    
    if (!pools || pools.length === 0) {
      return NextResponse.json({ message: "No pools found" })
    }
    
    console.log(`Found ${pools.length} pools. Processing...`)
    
    const results = []
    
    // Process each pool
    for (const pool of pools) {
      try {
        console.log(`Processing pool ${pool.id} (${pool.name})...`)
        
        // Get all members for this pool, ordered by position
        const { data: members, error: membersError } = await supabase
          .from('pool_members')
          .select('*')
          .eq('pool_id', pool.id)
          .order('position', { ascending: true })
        
        if (membersError || !members || members.length === 0) {
          console.log(`No members found for pool ${pool.id}`)
          continue
        }
        
        console.log(`Found ${members.length} members for pool ${pool.id}`)
        
        // Get the start date and frequency
        const startDate = new Date(pool.start_date)
        const frequency = pool.frequency
        
        // Update each member's payout date based on their position
        for (const member of members) {
          const position = member.position
          const correctPayoutDate = calculateNextPayoutDate(startDate, frequency, position)
          
          console.log(`Member ${member.user_id} (position ${position}):`)
          console.log(`  - Calculated payout date: ${correctPayoutDate.toISOString()}`)
          
          // Only update the next_payout_date in the pool table for the first position (or whoever is next in line)
          if (member.user_id === pool.next_payout_member_id) {
            // Update the pool's next payout date
            const { error: updatePoolError } = await supabase
              .from('pools')
              .update({
                next_payout_date: correctPayoutDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', pool.id)
            
            if (updatePoolError) {
              console.error(`Error updating pool ${pool.id}:`, updatePoolError)
              results.push({
                poolId: pool.id,
                poolName: pool.name,
                memberId: member.user_id,
                position,
                success: false,
                error: updatePoolError.message
              })
            } else {
              console.log(`  - Updated pool next payout date for member in position ${position}`)
              results.push({
                poolId: pool.id,
                poolName: pool.name,
                memberId: member.user_id,
                position,
                success: true,
                newPayoutDate: correctPayoutDate.toISOString()
              })
            }
          }
        }
        
        console.log(`Completed processing for pool ${pool.id}`)
      } catch (err: any) {
        console.error(`Error processing pool ${pool.id}:`, err)
        results.push({
          poolId: pool.id,
          success: false,
          error: err.message || String(err)
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Member payout dates fixed",
      results
    })
  } catch (error: any) {
    console.error("Error fixing member payout dates:", error)
    return NextResponse.json({ 
      error: "Failed to fix member payout dates",
      details: error?.message || String(error) 
    }, { status: 500 })
  }
} 
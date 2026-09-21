supabase
  .from("candidate_offices")
  .select(`
    id,
    office_type,
    name,
    address,
    address_number,
    complement,
    neighborhood,
    city,
    state_uf,
    postal_code,
    phone,
    whatsapp,
    public_email,
    opening_hours,
    maps_url,
    is_public
  `)
  .eq("candidate_id", candidate.id)
  .eq("is_public", true)
  .order("created_at", {
    ascending: true,
  })

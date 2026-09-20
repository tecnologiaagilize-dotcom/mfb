import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  candidateInviteExpiration,
  generateCandidateInviteToken,
  hashCandidateInviteToken,
} from "@/lib/candidate-invites";

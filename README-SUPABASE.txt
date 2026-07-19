BOBU GENESIS PORTAL v1.5 — SUPABASE SETUP

1. Go to Supabase and create a project.
2. Open SQL Editor and run the complete supabase-schema.sql file.
3. Open Project Settings > API.
4. Copy the Project URL and anon/public key into config.js.
5. Do NOT use the service_role key in GitHub Pages or any browser file.
6. Upload all files to the GitHub repository root. Keep bobu-space.mp4 in the same folder.
7. Test one registration. Then check Supabase > Table Editor > genesis_members.

WHAT WORKS AFTER CONFIGURATION
- Real shared member registration
- Exact live 0/1000 counter
- Unique wallet, X, Telegram and Instagram enforcement
- Automatic waitlist after 1,000 approved Genesis members
- Local device copy of the user's own registration card

SECURITY NOTES
- GitHub Pages is public frontend hosting. Any key in config.js can be seen by visitors.
- The anon key is designed to be public and is limited by Row Level Security.
- Never put a private key, seed phrase or Supabase service_role key in the project.
- Social follow verification is not automatic in v1.5. It requires OAuth/API access or manual review.
- Admin editing/export should be done in Supabase Dashboard until a protected admin backend is added.
